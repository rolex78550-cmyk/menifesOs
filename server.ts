import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import cors from "cors";
import { createServer as createViteServer } from "vite";
import schedule from "node-schedule";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Resend } from "resend";
import admin from "firebase-admin";
import { getFirestore } from "firebase-admin/firestore";
import sgMail from "@sendgrid/mail";
import { Novu } from "@novu/node";

const app = express();
const PORT = 3000;

app.use(express.json());
app.use(cors());

// Firebase Admin Initialization
let db: any;
let isDbHealthy = false;

async function initializeFirestore() {
  try {
    let adminApp: admin.app.App;
    if (admin.apps.length > 0) {
      adminApp = admin.apps[0]!;
    } else if (process.env.FIREBASE_SERVICE_ACCOUNT) {
      const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
      adminApp = admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log("[Firebase] Admin initialized via Service Account.");
    } else {
      adminApp = admin.initializeApp({
        credential: admin.credential.applicationDefault(),
        projectId: "p-key-kyznn8lq7ajo",
      });
      console.log("[Firebase] Admin initialized via Application Default Credentials.");
    }

    // List of databases to try: Specific first, then default
    const databasesToTry: (string | undefined)[] = [
      "ai-studio-b78c8b0d-664a-411b-8b2f-9f43380506b7",
      "(default)"
    ];

    for (const dbId of databasesToTry) {
      try {
        console.log(`[Firebase] Attempting to connect to database: ${dbId || '(default)'}`);
        const tempDb = dbId && dbId !== "(default)" ? getFirestore(adminApp, dbId) : getFirestore(adminApp);
        
        // Connectivity Probe
        await tempDb.collection("habits").limit(1).get();
        
        db = tempDb;
        isDbHealthy = true;
        console.log(`[Firebase] SUCCESS: Connected to database: ${dbId || '(default)'}`);
        break; 
      } catch (e: any) {
        console.warn(`[Firebase] FAILED to connect to database ${dbId || '(default)'}: ${e.message}`);
      }
    }

    if (!db) {
      console.error("[Firebase] CRITICAL: Could not connect to any Firestore database.");
    }
  } catch (e) {
    console.error("[Firebase] CRITICAL: Admin initialization failed:", e);
  }
}

/**
 * Background Scheduler: Scans rituals every minute
 */
const startScheduler = () => {
  schedule.scheduleJob("* * * * *", async () => {
    if (!db || !isDbHealthy) {
      console.warn("[Scheduler] Database not healthy, skipping scan.");
      return;
    }

    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const currentTime = `${hh}:${mm}`;

    console.log(`[Scheduler] Scanning for rituals due at: ${currentTime}`);

    try {
      const habitsSnapshot = await db.collection("habits")
        .where("reminderTime", "==", currentTime)
        .where("completed", "==", false)
        .get();

      if (habitsSnapshot.empty) return;

      for (const habitDoc of habitsSnapshot.docs) {
        const habit = habitDoc.data();
        const ownerId = habit.ownerId;

        // Get owner profile
        try {
          const userDoc = await db.collection("users").doc(ownerId).get();
          if (!userDoc.exists) continue;

          const userData = userDoc.data();
          if (!userData) continue;

          console.log(`[Scheduler] Triggering broadcast for ritual: ${habit.name} (Owner: ${ownerId})`);
          await broadcastToUser(userData, habit.name);
        } catch (innerError) {
          console.error(`[Scheduler] Failed to process habit ${habitDoc.id}:`, innerError);
        }
      }
    } catch (e) {
      console.error("[Scheduler] Error querying rituals:", e);
    }
  });
  console.log("[Scheduler] Background job initialized.");
};

async function broadcastToUser(user: any, ritualName: string) {
  const { email, fcmToken } = user;
  
  // Send Email using unified helper
  if (email && !email.includes('guest')) {
    await sendEmail({
      to: email,
      subject: `⚡ Ritual Activation: ${ritualName}`,
      ritualName: ritualName,
      userName: user.displayName || "Manifestor",
      html: `
        <div style="font-family: sans-serif; background-color: #050505; color: #ffffff; padding: 40px; border-radius: 24px;">
          <p style="color: #10b981; font-weight: 900;">TIME TO ALIGN</p>
          <h1>${ritualName}</h1>
          <p>Ritual karne ka time aa gya he, ready ho jao!</p>
        </div>
      `,
    });
  }

  if (fcmToken) {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title: `Ritual: ${ritualName}`,
          body: `Ritual karne ka time aa gya he, ready ho jao!`,
        },
        android: { priority: "high" },
        webpush: { notification: { icon: "/vite.svg" } }
      };
      await admin.messaging().send(message as any);
    } catch (e) { console.error("[Scheduler] FCM failed:", e); }
  }
}

// Razorpay Initialization DEBUG
console.log("[Razorpay] Environment Check:");
console.log(" - RAZORPAY_ID exists:", !!process.env.RAZORPAY_ID);
console.log(" - RAZORPAY_KEY_ID exists:", !!process.env.RAZORPAY_KEY_ID);
console.log(" - VITE_RAZORPAY_KEY_ID exists:", !!process.env.VITE_RAZORPAY_KEY_ID);

// Resend Initialization
const RESEND_KEY = process.env.RESEND_API_KEY || 're_h2t9ZGT8_7VAQeDnv1nQafRcb5vsbwkqr';
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;

// SendGrid Initialization
const SG_KEY = process.env.SENDGRID_API_KEY;
if (SG_KEY) {
  sgMail.setApiKey(SG_KEY);
  console.log("[SendGrid] API Key configured.");
}

// Novu Initialization
const NOVU_KEY = process.env.NOVU_API_KEY;
const novu = NOVU_KEY ? new Novu(NOVU_KEY) : null;
const NOVU_WORKFLOW = process.env.NOVU_WORKFLOW_ID || 'ritual-reminder';
if (novu) {
  console.log("[Novu] Initialized with API Key.");
}

/**
 * Unified Email Helper
 * Tries Novu first, then SendGrid, else falls back to Resend
 */
async function sendEmail({ to, subject, html, ritualName, userName }: { to: string, subject: string, html: string, ritualName?: string, userName?: string }) {
  // 1. Try Novu Unified (Primary)
  if (novu && process.env.NOVU_API_KEY) {
    try {
      console.log(`[Email] Attempting Novu trigger for: ${to}`);
      await novu.trigger(NOVU_WORKFLOW, {
        to: {
          subscriberId: to,
          email: to
        },
        payload: {
          ritualName: ritualName || "Ritual",
          userName: userName || "Manifestor",
          subject,
          htmlContent: html
        }
      });
      return { success: true, provider: 'novu' };
    } catch (e: any) {
      console.error("[Novu] Trigger failed:", e.message);
    }
  }

  const fromEmail = process.env.SENDGRID_FROM_EMAIL || 'vibe@resend.dev'; 
  
  // 2. Try SendGrid primary fallback
  if (process.env.SENDGRID_API_KEY) {
    try {
      console.log(`[Email] Attempting SendGrid dispatch to: ${to}`);
      await sgMail.send({
        to,
        from: fromEmail,
        subject,
        html,
      });
      return { success: true, provider: 'sendgrid' };
    } catch (e: any) {
      console.error("[SendGrid] Error:", e.response?.body || e.message);
    }
  }

  // 3. Fallback to Resend
  if (resend) {
    try {
      console.log(`[Email] Attempting Resend dispatch to: ${to}`);
      const data = await resend.emails.send({
        from: 'Vibe OS <onboarding@resend.dev>',
        to: [to],
        subject,
        html,
      });
      return { success: true, provider: 'resend', data };
    } catch (e) {
      console.error("[Resend] Error:", e);
    }
  }

  console.warn("[Email] No email provider successfully sent the message.");
  return { success: false, error: "No providers succeeded" };
}

// Helper to find the first valid non-placeholder key
const findValidKey = (keys: (string | undefined)[], fallback: string, keyName: string) => {
  for (const key of keys) {
    if (key && key.trim() !== "" && 
        key.trim() !== "your_razorpay_key_id_here" && 
        key.trim() !== "your_razorpay_secret_key_here" &&
        key.trim() !== "sb" &&
        !key.includes("PLACEHOLDER")) {
      console.log(`[Razorpay] Using environment variable for ${keyName}`);
      return key.trim().replace(/^[:\s]+|[:\s]+$/g, ""); // Clean potential junk
    }
  }
  console.log(`[Razorpay] Using hardcoded fallback for ${keyName}`);
  return fallback;
};

// Razorpay Initialization Helper
const getRazorpay = () => {
  // FALLBACK CREDENTIALS
  const FALLBACK_KEY_ID = "rzp_live_StIb9CN5Uj0BlK";
  const FALLBACK_KEY_SECRET = "yQE23ZtZ9cY1XMuVPfrnG9EC";

  const key_id = findValidKey([
    process.env.RAZORPAY_KEY_ID,
    process.env.VITE_RAZORPAY_KEY_ID,
    process.env.VITE_RAZORPAY_KEY,
    process.env.RAZORPAY_ID
  ], FALLBACK_KEY_ID, "Key ID");

  const key_secret = findValidKey([
    process.env.RAZORPAY_KEY_SECRET,
    process.env.RAZORPAY_SECRET_KEY,
    process.env.VITE_RAZORPAY_SECRET_KEY,
    process.env.RAZORPAY_SECRET,
    process.env.RAZORPAY_SECRET_K
  ], FALLBACK_KEY_SECRET, "Secret Key");
  
  if (!key_id || !key_secret) {
    console.error("[Razorpay] CRITICAL: No keys found.");
    return null;
  }

  // Log key info for debugging (Safe: only logs prefix and length)
  console.log(`[Razorpay] KEY SELECTION SUCCESS:`);
  console.log(` - ID: ${key_id.substring(0, 10)}... (len: ${key_id.length})`);
  console.log(` - Secret: ${key_secret.substring(0, 4)}... (len: ${key_secret.length})`);
  
  // Anti-swap check
  if (key_secret.startsWith('rzp_')) {
    console.warn(" [Razorpay] WARNING: It looks like the SECRET_KEY starts with 'rzp_', which is usually for KEY_ID. Swapping likely needed.");
  }
  
  return new Razorpay({
    key_id,
    key_secret,
  });
};

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Vibe Backend is pulsing." });
});

// Sync User Profile with Admin and Trial Logic
app.post("/api/user/sync", async (req, res) => {
  const { uid, email, displayName, photoURL } = req.body;

  if (!uid || !db) return res.status(400).json({ error: "Invalid sync request" });

  try {
    const userRef = db.collection("users").doc(uid);
    const doc = await userRef.get();

    const isAdmin = email === "asartist20@gmail.com";
    const now = admin.firestore.Timestamp.now();

    if (!doc.exists) {
      // New User: Start 24h trial
      const trialDurationMs = 24 * 60 * 60 * 1000;
      const trialExpiresAt = admin.firestore.Timestamp.fromMillis(Date.now() + trialDurationMs);

      const newUser = {
        uid,
        email,
        displayName,
        photoURL,
        isAdmin,
        isSubscribed: false,
        createdAt: now,
        trialExpiresAt,
        subscriptionTier: 'free'
      };

      await userRef.set(newUser);
      return res.json(newUser);
    } else {
      // Existing User: Update basic info but preserve tiers
      const existingData = doc.data();
      const updatedUser = {
        ...existingData,
        email,
        displayName,
        photoURL,
        isAdmin: isAdmin || existingData.isAdmin, // Keep admin status if already set or if it's you
      };
      await userRef.update(updatedUser);
      return res.json(updatedUser);
    }
  } catch (error) {
    console.error("[User Sync] Error:", error);
    res.status(500).json({ error: "Failed to sync user" });
  }
});

// Safe Endpoint for the Frontend to fetch the public Razorpay Key ID
app.get("/api/config/razorpay-key", (req, res) => {
  const FALLBACK_KEY_ID = "rzp_live_StIb9CN5Uj0BlK";

  const key_id = findValidKey([
    process.env.RAZORPAY_KEY_ID,
    process.env.VITE_RAZORPAY_KEY_ID,
    process.env.VITE_RAZORPAY_KEY,
    process.env.RAZORPAY_ID
  ], FALLBACK_KEY_ID, "Key ID (Config)");
  
  if (!key_id || key_id === "your_razorpay_key_id_here") {
    return res.json({ keyId: null });
  }

  res.json({ keyId: key_id });
});

// Razorpay Order Creation
app.post("/api/razorpay/create-order", async (req, res) => {
  const rzp = getRazorpay();
  if (!rzp) {
    return res.status(500).json({ error: "Razorpay API keys are missing or set to placeholder. Please update RAZORPAY_KEY_ID and RAZORPAY_SECRET_KEY in Environment Variables." });
  }
  
  const { amount, currency, receipt, planName, billingCycle, userId, userEmail, userName } = req.body;
  
  // Validation
  if (!amount || isNaN(parseFloat(amount))) {
    return res.status(400).json({ error: "Invalid amount provided." });
  }

  const finalAmount = Math.round(parseFloat(amount) * 100);
  if (finalAmount <= 0) {
    return res.status(400).json({ error: "Amount must be greater than zero." });
  }

  try {
    console.log(`[Razorpay] Creating ${req.body.useLink ? 'Payment Link' : 'Order'}:`, {
      finalAmount,
      currency: currency || "INR",
      receipt: receipt?.substring(0, 40), // Safe truncation
      planName
    });

    // If user explicitly wants a REDIRECT/LINK (Magic Checkout style)
    if (req.body.useLink) {
       const paymentLink = await rzp.paymentLink.create({
         amount: finalAmount,
         currency: currency || "INR",
         accept_partial: false,
         description: `${planName} [${billingCycle}] Activation`,
         customer: {
           name: (userName || "Manifestor").substring(0, 255),
           email: (userEmail || "").substring(0, 255),
         },
         notify: {
           sms: false,
           email: true
         },
         reminder_enable: true,
         notes: {
           userId: (userId || "").toString(),
           tier: (planName || "").toString(),
           billingCycle: (billingCycle || "").toString()
         },
         callback_url: `${req.headers.origin}/upgrade?success=true`,
         callback_method: "get"
       });
       return res.json({ paymentLinkUrl: paymentLink.short_url });
    }

    const order = await rzp.orders.create({
      amount: finalAmount, 
      currency: currency || "INR",
      receipt: (receipt || `rcpt_${Date.now()}`).substring(0, 40),
    });
    res.json(order);
  } catch (error: any) {
    console.error("Razorpay Order Error:", error);
    // Be more specific for authentication errors
    if (error.statusCode === 401) {
      const key_id = (
        process.env.RAZORPAY_KEY_ID || 
        process.env.VITE_RAZORPAY_KEY_ID || 
        process.env.VITE_RAZORPAY_KEY ||
        process.env.RAZORPAY_ID ||
        ""
      ).trim();
      return res.status(401).json({ 
        error: "Razorpay Authentication Failed", 
        details: "Your Key ID or Secret is invalid. Double-check them in AI Studio Settings -> Environment Variables.",
        debug_id_prefix: key_id.substring(0, 8) + "...",
        debug_id_len: key_id.length
      });
    }
    res.status(500).json({ error: "Failed to create order. Check server logs." });
  }
});

// Razorpay Payment Verification
app.post("/api/razorpay/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
  
  const FALLBACK_KEY_SECRET = "yQE23ZtZ9cY1XMuVPfrnG9EC";

  const secret = findValidKey([
    process.env.RAZORPAY_KEY_SECRET,
    process.env.RAZORPAY_SECRET_KEY,
    process.env.VITE_RAZORPAY_SECRET_KEY,
    process.env.RAZORPAY_SECRET,
    process.env.RAZORPAY_SECRET_K
  ], FALLBACK_KEY_SECRET, "Secret Key (Verify)");

  if (!secret || secret === "your_razorpay_secret_key_here") {
    return res.status(500).json({ error: "Razorpay secret key missing or invalid on server." });
  }

  const body = razorpay_order_id + "|" + razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature === razorpay_signature) {
     res.json({ status: "ok", message: "Payment verified successfully." });
  } else {
     res.status(400).json({ status: "error", message: "Invalid signature authenticity." });
  }
});

// Ritual Notification (Email)
app.post("/api/notify-ritual", async (req, res) => {
  const { email, ritualName, userName } = req.body;
  
  if (!email) {
    return res.status(400).json({ error: "Email is required." });
  }

  console.log(`[Vibe OS] Triggering ritual email for: ${email} (${ritualName})`);

  try {
    const emailRes = await sendEmail({
      to: email,
      ritualName: ritualName,
      userName: userName || "Manifestor",
      subject: `Ritual Activation: ${ritualName}`,
      html: `
        <div style="font-family: serif; background-color: #0b0118; color: #fbfbf2; padding: 40px; border-radius: 20px;">
          <p style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 10px; color: #10b981; font-weight: 900;">System Broadcast</p>
          <h1 style="font-style: italic; text-transform: uppercase; letter-spacing: -0.05em;">Ritual Activation Initiated</h1>
          <p style="font-size: 18px;">Hey <strong>${userName || 'Manifestor'}</strong>,</p>
          <p style="font-size: 16px; font-style: italic; color: #888;">Ritual karne ka time aa gya he, ready ho jao!</p>
          <div style="border-left: 2px solid #10b981; padding-left: 20px; margin: 30px 0;">
            <p style="font-size: 24px; font-weight: 900; margin: 0;">${ritualName}</p>
            <p style="font-size: 12px; opacity: 0.5; margin-top: 5px;">Time to align your frequency and manifest your reality.</p>
          </div>
          <p style="opacity: 0.7;">This is your high-frequency reminder from Vibe OS.</p>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 40px 0;">
          <p style="font-size: 10px; opacity: 0.3; text-align: center; text-transform: uppercase; letter-spacing: 0.1em;">Quantum Tracking Active • Stay Aligned</p>
        </div>
      `,
    });

    if (emailRes.success) {
      res.json({ status: "ok", provider: emailRes.provider });
    } else {
      res.status(500).json({ error: "Failed to send email notification using any provider." });
    }
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ error: "Internal server error during email dispatch." });
  }
});

/**
 * Combined Notification Endpoint
 * Sends both Push (FCM) and Email (Resend)
 */
app.post("/api/broadcast-ritual", async (req, res) => {
  const { email, fcmToken, ritualName, userName } = req.body;
  const results = { email: "skipped", push: "skipped" };

  console.log(`[Broadcast] Triggering for: ${email} | Task: ${ritualName}`);

  // 1. Unified Email Channel
  if (email) {
    const emailRes = await sendEmail({
      to: email,
      ritualName: ritualName,
      userName: userName || "Sovereign",
      subject: `⚡ Ritual Activation: ${ritualName}`,
      html: `
        <div style="font-family: sans-serif; background-color: #050505; color: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);">
          <p style="text-transform: uppercase; letter-spacing: 0.3em; font-size: 9px; color: #10b981; font-weight: 900; margin-bottom: 20px;">System Synchronization Active</p>
          <h1 style="font-style: italic; text-transform: uppercase; letter-spacing: -0.05em; font-size: 32px; margin-bottom: 8px;">Time to Align.</h1>
          <p style="font-size: 16px; opacity: 0.6; margin-bottom: 30px;">Ritual karne ka time aa gya he, ready ho jao!</p>
          <div style="background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.2); padding: 24px; border-radius: 16px; margin: 30px 0;">
            <p style="font-size: 20px; font-weight: 900; margin: 0; color: #10b981; text-transform: uppercase; letter-spacing: 0.1em;">${ritualName}</p>
            <p style="font-size: 11px; opacity: 0.4; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.2em;">Frequency Locked • Manifestation Ready</p>
          </div>
          <p style="font-size: 13px; opacity: 0.5; line-height: 1.6;">Hey ${userName || 'Sovereign'}, your scheduled ritual window is now open. Enter the Flow State immediately for maximum results.</p>
          <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); pt: 20px;">
            <p style="font-size: 8px; opacity: 0.2; text-align: center; text-transform: uppercase; letter-spacing: 0.5em;">Quantum Protocol • Vibe OS Node 3000</p>
          </div>
        </div>
      `,
    });
    results.email = emailRes.success ? "sent" : "error";
  }

  // 2. Push Channel (FCM)
  if (fcmToken) {
    try {
      const message = {
        token: fcmToken,
        notification: {
          title: `Ritual: ${ritualName}`,
          body: `Ritual karne ka time aa gya he, ready ho jao! "${ritualName}" is starting now.`,
        },
        android: {
          priority: "high",
          notification: {
            channelId: "ritual_reminders",
            sound: "default",
          },
        },
        webpush: {
          headers: {
            Urgency: "high",
          },
          notification: {
            icon: "https://ais-dev-j7sihoqk5j4nphix4bieyo-51389356776.asia-southeast1.run.app/vite.svg",
            requireInteraction: true,
            vibrate: [200, 100, 200],
          },
        },
        data: {
          type: "ritual_reminder",
          ritualId: "current",
        }
      };

      await admin.messaging().send(message as any);
      results.push = "sent";
    } catch (e) {
      console.error("[Broadcast] FCM failed:", e);
      results.push = "error";
    }
  }

  res.json({ status: "processed", results });
});

/**
 * Health check with credentials debug
 */
app.get("/api/admin/infra-check", (req, res) => {
  res.json({
    firebase: {
      adminInitialized: !!admin.apps.length,
      hasServiceAccount: !!process.env.FIREBASE_SERVICE_ACCOUNT
    },
    resend: {
      initialized: !!resend,
      hasKey: !!process.env.RESEND_API_KEY
    },
    sendgrid: {
      initialized: !!process.env.SENDGRID_API_KEY,
      hasFromEmail: !!process.env.SENDGRID_FROM_EMAIL
    },
    novu: {
      initialized: !!novu,
      workflowId: NOVU_WORKFLOW
    }
  });
});

// Start server execution
async function startServer() {
  // 1. Initialize Firestore first
  await initializeFirestore();

  // 2. Start Background Scheduler
  startScheduler();

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    // Production: Serve static files from dist
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Start server
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[Vibe OS] Server running on http://localhost:${PORT}`);
  });

  return app;
}

startServer();

export default app;
