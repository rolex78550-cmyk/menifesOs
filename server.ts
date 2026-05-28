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
import { GoogleGenAI, Type } from "@google/genai";

const app = express();
const PORT = 3000;

// Gemini Initialization
const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    }
  }
});

// Robust fallback and retry wrapper for Gemini generateContent to handle 503/transient rate limits or high-demand errors
async function generateContentWithFallbackAndRetry(params: {
  contents: any;
  config?: any;
}) {
  const models = ["gemini-3.5-flash", "gemini-3.1-flash-lite", "gemini-flash-latest", "gemini-3.1-pro-preview"];
  let lastError: any = null;

  for (const model of models) {
    let attempts = 2; // Attempt up to 2 times for each model
    for (let attempt = 1; attempt <= attempts; attempt++) {
      try {
        console.log(`[Gemini API] Querying model: ${model} (Attempt ${attempt}/${attempts})`);
        const response = await ai.models.generateContent({
          model,
          contents: params.contents,
          config: params.config,
        });
        if (response && response.text) {
          console.log(`[Gemini API] Success using model: ${model}`);
          return response;
        }
        throw new Error("Empty response received from model");
      } catch (error: any) {
        lastError = error;
        console.warn(
          `[Gemini API] Error using model ${model} (Attempt ${attempt}/${attempts}):`,
          error.message || error
        );
        if (attempt < attempts) {
          // Wait briefly before retrying
          await new Promise((resolve) => setTimeout(resolve, 1000 * attempt));
        }
      }
    }
  }
  throw lastError || new Error("All Gemini models and retries failed.");
}

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
 * Send personalized WhatsApp reminder via WATI API
 */
async function sendWhatsAppReminder(
  phone: string,
  userName: string,
  ritualName: string,
  streakDays: number,
  templateName: string = "ritual_reminder"
): Promise<void> {
  const apiKey = process.env.WATI_API_KEY;
  const baseUrl = process.env.WATI_BASE_URL || "https://live-mt-server.wati.io";

  if (!apiKey) {
    console.warn("[WATI] API Key missing. Skipping WhatsApp notification.");
    return;
  }

  // Format phone: make sure only digits, prefix +91
  let formattedPhone = phone.trim().replace(/\D/g, "");
  if (!formattedPhone.startsWith("91")) {
    formattedPhone = "91" + formattedPhone;
  }

  let customParams;
  if (templateName === "streak_danger") {
    customParams = [
      { name: "1", value: userName },
      { name: "2", value: streakDays.toString() }
    ];
  } else if (templateName === "milestone" || templateName === "ritual_milestone") {
    customParams = [
      { name: "1", value: userName },
      { name: "2", value: streakDays.toString() }
    ];
  } else {
    customParams = [
      { name: "1", value: userName },
      { name: "2", value: ritualName },
      { name: "3", value: streakDays.toString() }
    ];
  }

  const url = `${baseUrl.replace(/\/$/, "")}/api/v1/sendTemplateMessage`;
  
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        template_name: templateName,
        broadcast_name: `ritual_reminder_${Date.now()}`,
        receivers: [{
          whatsapp_number: formattedPhone,
          customParams
        }]
      })
    });

    if (!response.ok) {
      const respText = await response.text();
      console.error(`[WATI] Failed sending Template Message. Status: ${response.status}. Response: ${respText}`);
    } else {
      console.log(`[WATI] WhatsApp reminder sent successfully to ${formattedPhone} via template ${templateName}`);
    }
  } catch (error) {
    console.error("[WATI] API call error:", error);
  }
}

/**
 * Send free WhatsApp message via CallMeBot API
 */
async function sendCallMeBotWhatsApp(phone: string, apikey: string, message: string): Promise<void> {
  if (!phone || !apikey || !message) {
    console.warn("[CallMeBot] Missing required fields, skipping.");
    return;
  }
  const cleanPhone = phone.trim().replace(/\s+/g, "");
  const url = `https://api.callmebot.com/whatsapp.php?phone=${encodeURIComponent(cleanPhone)}&apikey=${encodeURIComponent(apikey.trim())}&text=${encodeURIComponent(message)}`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      const respText = await response.text();
      console.error(`[CallMeBot] Failed to send. Status: ${response.status}. Response: ${respText}`);
    } else {
      console.log(`[CallMeBot] WhatsApp sent to ${cleanPhone}`);
    }
  } catch (error) {
    console.error("[CallMeBot] API call exception:", error);
  }
}

/**
 * Send free Telegram message via Telegram Bot API
 */
async function sendTelegramMessage(token: string, chatId: string, message: string): Promise<void> {
  if (!token || !chatId || !message) {
    console.warn("[Telegram] Missing credentials, skipping.");
    return;
  }
  const url = `https://api.telegram.org/bot${token.trim()}/sendMessage`;
  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        chat_id: chatId.trim(),
        text: message,
        parse_mode: "HTML"
      })
    });
    if (!response.ok) {
      const respText = await response.text();
      console.error(`[Telegram] Failed to send. Status: ${response.status}. Response: ${respText}`);
    } else {
      console.log(`[Telegram] Message sent to Chat ID ${chatId}`);
    }
  } catch (error) {
    console.error("[Telegram] API call exception:", error);
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

          // 1. WhatsApp Trigger (WATI paid path)
          const hasWhatsapp = userData.whatsappNumber && userData.whatsappNumber.trim() !== "";
          const optIn = userData.whatsappReminders === true;
          const optedOut = userData.whatsappOptOut === true;

          if (hasWhatsapp && optIn && !optedOut) {
            console.log(`[Scheduler] Triggering WhatsApp Reminder for ${habit.name} to ${userData.whatsappNumber}`);
            await sendWhatsAppReminder(
              userData.whatsappNumber,
              userData.displayName || "Manifestor",
              habit.name || "ritual",
              habit.streak || 0,
              "ritual_reminder"
            );
          }

          // 2. CallMeBot Trigger (Free WhatsApp path)
          const callMeBotEnabled = userData.callMeBotEnabled !== false;
          if (callMeBotEnabled && userData.callMeBotPhone && userData.callMeBotKey) {
            const botMessage = `Hey ${userData.displayName || "Manifestor"}! Time for your ${habit.name || "ritual"} ritual. You're on a ${habit.streak || 0}-day streak 🔥 vibeOS.in`;
            console.log(`[Scheduler] Triggering Free CallMeBot WhatsApp to ${userData.callMeBotPhone}`);
            await sendCallMeBotWhatsApp(userData.callMeBotPhone, userData.callMeBotKey, botMessage);
          }

          // 3. Telegram Bot Trigger (Free Telegram path)
          const telegramEnabled = userData.telegramEnabled !== false;
          if (telegramEnabled && userData.telegramBotToken && userData.telegramChatId) {
            const htmlMessage = `Hey <b>${userData.displayName || "Manifestor"}</b>! Time for your <b>${habit.name || "ritual"}</b> ritual. You're on a <b>${habit.streak || 0}</b>-day streak 🔥 vibeOS.in`;
            console.log(`[Scheduler] Triggering Free Telegram message to chat ${userData.telegramChatId}`);
            await sendTelegramMessage(userData.telegramBotToken, userData.telegramChatId, htmlMessage);
          }

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

/**
 * Streak Danger Scheduler: runs at 9:00 PM IST daily ('30 15 * * *' UTC)
 */
const startStreakDangerScheduler = () => {
  schedule.scheduleJob("30 15 * * *", async () => {
    if (!db || !isDbHealthy) {
      console.warn("[Streak Danger] Database not healthy, skipping scan.");
      return;
    }

    console.log("[Streak Danger] Running 9 PM IST daily check for uncompleted rituals...");

    try {
      const usersSnapshot = await db.collection("users").get();
      if (usersSnapshot.empty) return;

      for (const userDoc of usersSnapshot.docs) {
        const userData = userDoc.data();
        if (!userData) continue;

        const hasWhatsapp = userData.whatsappNumber && userData.whatsappNumber.trim() !== "";
        const optIn = userData.whatsappReminders === true;
        const optedOut = userData.whatsappOptOut === true;

        const callMeBotEnabled = userData.callMeBotEnabled !== false;
        const hasCallMeBot = callMeBotEnabled && userData.callMeBotPhone && userData.callMeBotKey;

        const telegramEnabled = userData.telegramEnabled !== false;
        const hasTelegram = telegramEnabled && userData.telegramBotToken && userData.telegramChatId;

        // Skip if everything is disabled or unconfigured
        if ((!hasWhatsapp || !optIn || optedOut) && !hasCallMeBot && !hasTelegram) {
          continue;
        }

        const userId = userDoc.id;

        // Check user's habits that are NOT completed
        const habitsSnapshot = await db.collection("habits")
          .where("ownerId", "==", userId)
          .where("completed", "==", false)
          .get();

        if (habitsSnapshot.empty) {
          console.log(`[Streak Danger] User ${userData.displayName || userId} has completed all rituals today.`);
          continue;
        }

        // Send danger message: "{{1}}, your {{2}}-day streak ends at midnight. Complete now: vibeOS.in"
        // Find the uncompleted habit with the highest streak
        let maxStreak = -1;
        let mainHabitName = "ritual";
        for (const habitDoc of habitsSnapshot.docs) {
          const hData = habitDoc.data();
          if ((hData.streak || 0) > maxStreak) {
            maxStreak = hData.streak || 0;
            mainHabitName = hData.name || "ritual";
          }
        }

        if (maxStreak >= 0) {
          // Send WATI if configured
          if (hasWhatsapp && optIn && !optedOut) {
            console.log(`[Streak Danger] Sending danger WATI to ${userData.whatsappNumber} (User: ${userData.displayName || userId}). Highest streak: ${maxStreak}`);
            await sendWhatsAppReminder(
              userData.whatsappNumber,
              userData.displayName || "Manifestor",
              mainHabitName,
              maxStreak,
              "streak_danger"
            );
          }

          // Send CallMeBot if configured
          if (hasCallMeBot) {
            const botMessage = `${userData.displayName || "Manifestor"}, your ${maxStreak}-day streak for ${mainHabitName} ends at midnight. Complete now: vibeOS.in`;
            console.log(`[Streak Danger] Sending danger CallMeBot to ${userData.callMeBotPhone}. Highest streak: ${maxStreak}`);
            await sendCallMeBotWhatsApp(userData.callMeBotPhone, userData.callMeBotKey, botMessage);
          }

          // Send Telegram if configured
          if (hasTelegram) {
            const htmlMessage = `⚠️ <b>${userData.displayName || "Manifestor"}</b>, your <b>${maxStreak}</b>-day streak for <b>${mainHabitName}</b> ends at midnight. Complete now: vibeOS.in`;
            console.log(`[Streak Danger] Sending danger Telegram to ${userData.telegramChatId}. Highest streak: ${maxStreak}`);
            await sendTelegramMessage(userData.telegramBotToken, userData.telegramChatId, htmlMessage);
          }
        }
      }
    } catch (error) {
      console.error("[Streak Danger] Error in streak danger job:", error);
    }
  });
  console.log("[Streak Danger] Scheduler initialized for 9 PM IST ('30 15 * * *').");
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
          <p>It's time for your ritual. Prepare for alignment!</p>
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
          body: `It's time for your ritual. Prepare for alignment!`,
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
  res.json({ status: "ok", message: "Server is healthy." });
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
        hasCompletedOnboarding: false,
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

// Gemini Manifestation Onboarding Agent
app.post("/api/gemini/manifest", async (req, res) => {
  const { goal, currentChallenges } = req.body;

  if (!goal) return res.status(400).json({ error: "What do you want to manifest?" });

  try {
    const response = await generateContentWithFallbackAndRetry({
      contents: `User wants to manifest: "${goal}". Current challenges: "${currentChallenges || 'None'}". 
      Recommend 3 powerful high-frequency rituals (habits) to align with this manifestation. 
      For each ritual, provide: name, description, recommended reminder time (HH:mm format), and category.`,
      config: {
        systemInstruction: "You are a master manifestation coach for Vibe OS. You suggest high-vibe, actionable rituals that help people align with their wealth, health, or spiritual goals using the law of attraction and consistent habits.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            rituals: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  description: { type: Type.STRING },
                  reminderTime: { type: Type.STRING },
                  category: { type: Type.STRING },
                  frequency: { type: Type.STRING, description: "Suggest 'Daily' or 'Weekly'" }
                },
                required: ["name", "description", "reminderTime", "category", "frequency"]
              }
            },
            affirmation: { type: Type.STRING }
          },
          required: ["rituals", "affirmation"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error) {
    console.error("[Gemini Manifest] Error:", error);
    res.status(500).json({ error: "AI generation failed. Please try again." });
  }
});

// Gemini Daily Astral Oracle Card Route
app.post("/api/gemini/oracle", async (req, res) => {
  const { goal, themeInput, uncompletedHabits } = req.body;
  
  const fallbackCards = [
    {
      cardName: "The Gate of Release",
      theme: "Release",
      affirmation: "I gracefully let go of resistance, allowing the flow of abundance to take over.",
      cosmicAction: "Tick off 1 pending ritual to stabilize your frequency field today.",
      color: "#3B82F6",
      symbol: "✧"
    },
    {
      cardName: "The Sovereign of Abundance",
      theme: "Abundance",
      affirmation: "My consciousness is a magnet for unlimited prosperity. I think from abundance, always.",
      cosmicAction: "Track a transaction or visualize a client success to anchor this wealth focus.",
      color: "#F59E0B",
      symbol: "❈"
    },
    {
      cardName: "The Catalyst of Willpower",
      theme: "Willpower",
      affirmation: "My intentions are commands to the cosmos. I act with immediate, dynamic presence.",
      cosmicAction: "Initiate and complete your highest-priority ritual without delay.",
      color: "#EF4444",
      symbol: "❂"
    },
    {
      cardName: "The Mirror of Shadows",
      theme: "Reflection",
      affirmation: "I find clarity in quiet moments. Self-reflection is my fast track to manifestation.",
      cosmicAction: "Log a reflection note in your daily diary to capture internal wisdom.",
      color: "#8B5CF6",
      symbol: "◈"
    },
    {
      cardName: "The Guardian of Focus",
      theme: "Focus",
      affirmation: "I filter out external static. My mind is aligned on the highest frequency.",
      cosmicAction: "Enable the frequency synthesizer for 3 minutes to anchor your focus.",
      color: "#10B981",
      symbol: "❈"
    },
    {
      cardName: "The Vessel of Gratitude",
      theme: "Gratitude",
      affirmation: "I celebrate the manifestation of my desires in the unseen field before they arrive.",
      cosmicAction: "Tether a positive feeling of gratitude by listing 2 daily events of progress.",
      color: "#EC4899",
      symbol: "❀"
    }
  ];

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log("[Gemini Oracle] No API key, using predefined mystical card deck.");
      const randomCard = fallbackCards[Math.floor(Math.random() * fallbackCards.length)];
      return res.json(randomCard);
    }

    const uncompletedText = uncompletedHabits && uncompletedHabits.length > 0 
      ? `Uncompleted focus areas for today: ${uncompletedHabits.join(", ")}.`
      : "";

    const response = await generateContentWithFallbackAndRetry({
      contents: `Generate a mystical, daily 'Astral Oracle Card' drawing.
      The user's manifestation goal is: "${goal || "High frequency alignment"}".
      ${uncompletedText}
      Create a unique, beautifully named card that provides a personalized "Cosmic Frequency Focus" and actionable alignment steps for today in high-vibration cosmic prose.
      Provide:
      1. cardName (e.g. "The Catalyst of Will", "The Star of Release", "The Sovereign of Flow")
      2. theme (one or two words summarizing today's key theme like "Focus", "Release", "Abundance", "Integrity", "Surrender")
      3. affirmation (highly positive, poetic, mystical cosmic affirmation of empowerment)
      4. cosmicAction (a specific high-vibe physical action or challenge, e.g., completing a ritual, meditating, or logging a thought, tied to their habits if possible)
      5. color (a high-contrast glowing dark-theme friendly hex code representing this card's energy, e.g. #3B82F6, #F59E0B, #EF4444, #10B981, #EC4899, #8B5CF6)
      6. symbol (a single beautiful character symbol reflecting sacred geometry, e.g. '✧', '◈', '❈', '❂', '✿', '✺', '⚜')`,
      config: {
        systemInstruction: "You are the Vibe OS Astral Oracle, an ancient, sub-quantum energy scanning mechanism. You issue enigmatic, high-frequency daily guidance to help users stabilize their vibration score.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cardName: { type: Type.STRING },
            theme: { type: Type.STRING },
            affirmation: { type: Type.STRING },
            cosmicAction: { type: Type.STRING },
            color: { type: Type.STRING },
            symbol: { type: Type.STRING }
          },
          required: ["cardName", "theme", "affirmation", "cosmicAction", "color", "symbol"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error) {
    console.error("[Gemini Oracle] Error, falling back to local card deck:", error);
    const randomCard = fallbackCards[Math.floor(Math.random() * fallbackCards.length)];
    res.json(randomCard);
  }
});

// Gemini Daily Positive Card Reading for Desires Section
app.post("/api/gemini/desire-reading", async (req, res) => {
  const { desires, manifestationGoal } = req.body;

  const fallbackCards = [
    {
      cardName: "The Sovereign of Miracles",
      theme: "Potential",
      affirmation: "You hold the subtle keys to rewrite lines of destiny. Your presence carries an undeniable light of hope.",
      feelingBoost: "Your heart contains an ocean of resilience. Recognize that every obstacle you have faced has refined, not diminished, your radiant spirit.",
      sacredAction: "Close your eyes, breathe, and place a hand on your heart. Affirm: 'I am completely worthy of peace, success, and pure joy.'",
      color: "#A78BFA",
      symbol: "✿"
    },
    {
      cardName: "The Well of Infinite Grace",
      theme: "Self-Love",
      affirmation: "You are deserving of love, tenderness, and patience. Treat yourself with the sweet gentleness node of a beloved divine guest.",
      feelingBoost: "It is safe to forgive yourself. You have tried your hardest with the tools you had. The cosmos is incredibly proud of your quiet effort and persistence today.",
      sacredAction: "Look around and count three beautiful, simple things in your immediate space that bring you immediate comfort.",
      color: "#EC4899",
      symbol: "♥"
    },
    {
      cardName: "The Radiance of Inner Strength",
      theme: "Resolute Joy",
      affirmation: "No temporary heavy cloud can ever hide your true brightness. You are a solar beacon of warmth, power, and high-vibrational alignment.",
      feelingBoost: "The goals you have scripted are already aligning in the unseen quantum field. You are stronger, wiser, and more lovable than any passing doubt tells you.",
      sacredAction: "Smile softly and recall a memory where you laughed from the depths of your being. Tether that feeling of warmth.",
      color: "#F59E0B",
      symbol: "✨"
    },
    {
      cardName: "The Harbor of Gentle Serenity",
      theme: "Quiet Peace",
      affirmation: "I am a peaceful lake mirroring the stardust. External storms cannot disturb my crystalline depths.",
      feelingBoost: "You do not need to constantly hustle to be worthy of your space in the universe. Your existence is already a perfect miracle. Soften your shoulders and let yourself rest.",
      sacredAction: "Slowly inhale to the count of 4, hold for 4, and release to the count of 6. Feel tension melt away.",
      color: "#10B981",
      symbol: "☾"
    },
    {
      cardName: "The Catalyst of Dreams",
      theme: "Magic",
      affirmation: "My imagination is a divine laboratory. Everything I desire with love is searching for me with the same active intensity.",
      feelingBoost: "You are the primary author of your life's chapters. Let the next script you write recount the incredible capacity you have to experience complete joy.",
      sacredAction: "Write down your topmost desire on a small paper or look at it and say: 'I trust the flow of the universe. I am ready to receive.'",
      color: "#3B82F6",
      symbol: "✵"
    }
  ];

  try {
    if (!process.env.GEMINI_API_KEY) {
      console.log("[Gemini Desire Reading] No API key, using predefined celestial deck.");
      const randomCard = fallbackCards[Math.floor(Math.random() * fallbackCards.length)];
      return res.json(randomCard);
    }

    const desiresText = desires && desires.length > 0
      ? `Their current scripted desires/dreams are: ${desires.map((d: any) => `"${d.text}"`).join(", ")}.`
      : "";

    const userGoalText = manifestationGoal ? `Their focus/goal is: "${manifestationGoal}".` : "";

    const response = await generateContentWithFallbackAndRetry({
      contents: `Generate a beautiful, mystical 'Daily Positive Celestial Card Reading' to elevate the user's feelings.
      ${desiresText}
      ${userGoalText}
      Create a highly personalized, heart-warming, positive, and validating card that makes the user look at their life, efforts, dreams, and themselves with massive hope, self-love, and happiness.
      
      Provide the response in JSON format with these exact fields:
      1. cardName (e.g., "The Sanctuary of Divine Worth", "The Oasis of Gentle Victory", "The Infinite Horizon of Hope")
      2. theme (one keyword of positivity like "Self-Love", "Potential", "Inner Peace", "Magic", "Grace", "Strength")
      3. affirmation (a highly positive, beautifully poetic, celestial affirmation about their goodness or alignment)
      4. feelingBoost (a heart-felt paragraph or positive note directly validating their efforts, telling them they are doing great, that their dreams are valid and safe, and making them feel loved, proud, and extremely positive)
      5. sacredAction (a tiny physical act of joy or appreciation they can do right now to raise their mood, e.g., self-hug, deep breath of gratitude, smiling, or viewing a positive photo)
      6. color (a high-contrast glowing warm hex color representing this card's light, e.g. #EC4899, #F59E0B, #A78BFA, #10B981, #3B82F6)
      7. symbol (a beautiful character symbol like '♥', '✨', '✿', '☾', '✵', '❀', '⚜')`,
      config: {
        systemInstruction: "You are the Vibe OS Divine Light Oracle. Your mission is to shower the user with absolute validation, self-love, and positive frequencies that melt away stress and leave them feeling completely happy, valuable, and inspired.",
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            cardName: { type: Type.STRING },
            theme: { type: Type.STRING },
            affirmation: { type: Type.STRING },
            feelingBoost: { type: Type.STRING },
            sacredAction: { type: Type.STRING },
            color: { type: Type.STRING },
            symbol: { type: Type.STRING }
          },
          required: ["cardName", "theme", "affirmation", "feelingBoost", "sacredAction", "color", "symbol"]
        }
      }
    });

    const result = JSON.parse(response.text || "{}");
    res.json(result);
  } catch (error) {
    console.error("[Gemini Desire Reading] Error, falling back:", error);
    const randomCard = fallbackCards[Math.floor(Math.random() * fallbackCards.length)];
    res.json(randomCard);
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

// WhatsApp Milestone Trigger API
app.post("/api/whatsapp/milestone", async (req, res) => {
  const { userId, ritualName, streakDays } = req.body;

  if (!userId || !ritualName || streakDays === undefined) {
    return res.status(400).json({ error: "Missing required fields: userId, ritualName, streakDays" });
  }

  try {
    if (!db || !isDbHealthy) {
      return res.status(500).json({ error: "Firestore not healthy" });
    }

    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      return res.status(404).json({ error: "User profile not found" });
    }

    const userData = userDoc.data();
    if (!userData) {
      return res.status(500).json({ error: "Empty user profile data" });
    }

    const hasWhatsapp = userData.whatsappNumber && userData.whatsappNumber.trim() !== "";
    const optIn = userData.whatsappReminders === true;
    const optedOut = userData.whatsappOptOut === true;

    if (hasWhatsapp && optIn && !optedOut) {
      console.log(`[Milestone REST] Sending milestone WhatsApp to ${userData.whatsappNumber} for streak ${streakDays}`);
      await sendWhatsAppReminder(
        userData.whatsappNumber,
        userData.displayName || "Manifestor",
        ritualName,
        streakDays,
        "milestone"
      );
    }

    // CallMeBot Free WhatsApp milestone
    const callMeBotEnabled = userData.callMeBotEnabled !== false;
    if (callMeBotEnabled && userData.callMeBotPhone && userData.callMeBotKey) {
      const botMessage = `🌟 Incredible, ${userData.displayName || "Manifestor"}! You just hit a ${streakDays}-day milestone streak with ${ritualName}! Keep shining and stay aligned. vibeOS.in`;
      console.log(`[Milestone REST] Sending milestone CallMeBot to ${userData.callMeBotPhone}`);
      await sendCallMeBotWhatsApp(userData.callMeBotPhone, userData.callMeBotKey, botMessage);
    }

    // Telegram Bot Free milestone
    const telegramEnabled = userData.telegramEnabled !== false;
    if (telegramEnabled && userData.telegramBotToken && userData.telegramChatId) {
      const htmlMessage = `🌟 <b>Incredible, ${userData.displayName || "Manifestor"}!</b> You just hit a <b>${streakDays}</b>-day milestone streak with <b>${ritualName}</b>! Keep shining and stay aligned. vibeOS.in`;
      console.log(`[Milestone REST] Sending milestone Telegram to ${userData.telegramChatId}`);
      await sendTelegramMessage(userData.telegramBotToken, userData.telegramChatId, htmlMessage);
    }

    res.json({ status: "ok" });
  } catch (err) {
    console.error("[Milestone REST] Error:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// WhatsApp WATI Opt-Out Webhook
app.post("/api/whatsapp-webhook", async (req, res) => {
  console.log("[WATI Webhook] Received payload:", JSON.stringify(req.body));

  const body = req.body || {};
  const rawSender = body.sender || body.whatsappNumber || body.waId || (body.message && body.message.sender) || "";
  const messageText = String(body.text || body.messageText || (body.message && body.message.text) || "").trim().toUpperCase();

  if (!rawSender) {
    return res.status(200).json({ status: "ignored", reason: "no sender found" });
  }

  // Normalize sender phone to a comparison-safe format (only digits)
  const senderNorm = String(rawSender).replace(/\D/g, "");

  if (messageText === "STOP") {
    console.log(`[WATI Webhook] STOP reply received from ${rawSender}. Performing opt-out.`);

    try {
      if (!db || !isDbHealthy) {
        return res.status(500).json({ error: "Database/Firestore not healthy" });
      }

      const usersSnapshot = await db.collection("users").get();
      let updatedCount = 0;

      for (const userDoc of usersSnapshot.docs) {
        const uData = userDoc.data();
        if (uData && uData.whatsappNumber) {
          const storedNorm = String(uData.whatsappNumber).replace(/\D/g, "");

          if (storedNorm === senderNorm || storedNorm.endsWith(senderNorm) || senderNorm.endsWith(storedNorm)) {
            console.log(`[WATI Webhook] Opting out user: ${userDoc.id} (${uData.displayName || 'Manifestor'})`);
            await db.collection("users").doc(userDoc.id).update({
              whatsappOptOut: true,
              updatedAt: admin.firestore.Timestamp.now()
            });
            updatedCount++;
          }
        }
      }

      return res.json({ status: "success", optedOutCount: updatedCount });
    } catch (err) {
      console.error("[WATI Webhook] Error processing opt-out:", err);
      return res.status(500).json({ error: "Internal processing error" });
    }
  }

  res.json({ status: "success", message: "ignored non-STOP reply" });
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
          <p style="text-transform: uppercase; letter-spacing: 0.2em; font-size: 10px; color: #10b981; font-weight: 900;">Ritual Reminder</p>
          <h1 style="font-style: italic; text-transform: uppercase; letter-spacing: -0.05em;">Ritual Activation Initiated</h1>
          <p style="font-size: 18px;">Hey <strong>${userName || 'Manifestor'}</strong>,</p>
          <p style="font-size: 16px; font-style: italic; color: #888;">It's time for your ritual. Prepare for alignment!</p>
          <div style="border-left: 2px solid #10b981; padding-left: 20px; margin: 30px 0;">
            <p style="font-size: 24px; font-weight: 900; margin: 0;">${ritualName}</p>
            <p style="font-size: 12px; opacity: 0.5; margin-top: 5px;">Time to align your frequency and manifest your reality.</p>
          </div>
          <p style="opacity: 0.7;">This is your high-frequency reminder.</p>
          <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 40px 0;">
          <p style="font-size: 10px; opacity: 0.3; text-align: center; text-transform: uppercase; letter-spacing: 0.1em;">Frequency Tracking Active • Stay Aligned</p>
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
      userName: userName || "Manifestor",
      subject: `⚡ Ritual Activation: ${ritualName}`,
      html: `
        <div style="font-family: sans-serif; background-color: #050505; color: #ffffff; padding: 40px; border-radius: 24px; border: 1px solid rgba(255,255,255,0.1);">
          <p style="text-transform: uppercase; letter-spacing: 0.3em; font-size: 9px; color: #10b981; font-weight: 900; margin-bottom: 20px;">Ritual Reminder Active</p>
          <h1 style="font-style: italic; text-transform: uppercase; letter-spacing: -0.05em; font-size: 32px; margin-bottom: 8px;">Time to Align.</h1>
          <p style="font-size: 16px; opacity: 0.6; margin-bottom: 30px;">It's time for your ritual. Prepare for alignment!</p>
          <div style="background: rgba(16,185,129,0.05); border: 1px solid rgba(16,185,129,0.2); padding: 24px; border-radius: 16px; margin: 30px 0;">
            <p style="font-size: 20px; font-weight: 900; margin: 0; color: #10b981; text-transform: uppercase; letter-spacing: 0.1em;">${ritualName}</p>
            <p style="font-size: 11px; opacity: 0.4; margin-top: 8px; text-transform: uppercase; letter-spacing: 0.2em;">Stay Focused • Consistency counts</p>
          </div>
          <p style="font-size: 13px; opacity: 0.5; line-height: 1.6;">Hey ${userName || 'Manifestor'}, your scheduled ritual window is now open. Take a few moments now for your ritual.</p>
          <div style="margin-top: 40px; border-top: 1px solid rgba(255,255,255,0.05); pt: 20px;">
            <p style="font-size: 8px; opacity: 0.2; text-align: center; text-transform: uppercase; letter-spacing: 0.5em;">Aligned with Vibe OS</p>
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
          body: `It's time for your ritual! "${ritualName}" is starting now.`,
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
  startStreakDangerScheduler();

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
