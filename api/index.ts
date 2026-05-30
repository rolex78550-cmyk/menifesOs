import dotenv from "dotenv";
import fs from "fs";

// Load from .env first, then fallback to .env.example if keys are not present
// Priority 1: System Environment
dotenv.config();

// Priority 2: .env.example fallback (ONLY if keys are missing from system env)
if (fs.existsSync(".env.example")) {
  try {
    const exampleContent = fs.readFileSync(".env.example", "utf-8");
    const parsed = dotenv.parse(exampleContent);
    for (const key in parsed) {
      const val = parsed[key]?.trim();
      // Only use fallback if not already defined in system environment
      if (!process.env[key] && val && !val.includes("PLACEHOLDER") && !val.includes("YOUR_") && val.length > 5) {
        process.env[key] = val;
      }
    }
  } catch (err) {
    console.error("[Startup] Failed to parse .env.example fallback:", err);
  }
}

console.log("========== RAZORPAY STARTUP AUDIT ==========");
console.log("NODE_ENV:", process.env.NODE_ENV);

// Enhanced Sanitizer: Strips quotes, spaces, and invisible garbage characters
const sanitizeConfigStr = (val: any) => {
  if (val === undefined || val === null) return "";
  let clean = String(val).trim();
  // Strip common delimiters if they accidentally got into the string
  clean = clean.replace(/^["':,;\s]+|["':,;\s]+$/g, "");
  // Remove zero-width spaces, thin space, non-breaking spaces, and specific Unicode control characters
  clean = clean.replace(/[\u200B-\u200D\uFEFF\u00A0\u180E\u202F\u205F\u3000\r\n\t]/g, "");
  // Re-trim quotes one last time safely
  clean = clean.replace(/^["']|["']$/g, "").trim();
  return clean;
};

// Strictly enforce Key Consistency: Syncs VITE_ prefix with raw ID
const normalizeRzpKeys = () => {
  console.log("[Razorpay Audit] Explicit Audit of ALL environment candidates...");
  const idCandidates = [
    { name: "RAZORPAY_KEY_ID", val: process.env.RAZORPAY_KEY_ID },
    { name: "VITE_RAZORPAY_KEY_ID", val: process.env.VITE_RAZORPAY_KEY_ID },
    { name: "RAZORPAY_ID", val: process.env.RAZORPAY_ID },
    { name: "RAZORPAY_KEY", val: process.env.RAZORPAY_KEY }
  ];
  
  const secretCandidates = [
    { name: "RAZORPAY_KEY_SECRET", val: process.env.RAZORPAY_KEY_SECRET },
    { name: "RAZORPAY_SECRET_KEY", val: process.env.RAZORPAY_SECRET_KEY },
    { name: "RAZORPAY_SECRET", val: process.env.RAZORPAY_SECRET },
    { name: "VITE_RAZORPAY_KEY_SECRET", val: process.env.VITE_RAZORPAY_KEY_SECRET }
  ];

  idCandidates.forEach(c => {
    if (c.val) console.log(`  - Candidate ${c.name}: ${sanitizeConfigStr(c.val).substring(0, 10)}... (Raw Len: ${c.val.length})`);
  });

  const findFirstValid = (list: any[], isId: boolean) => {
    for (const cand of list) {
      const clean = sanitizeConfigStr(cand.val);
      if (!clean) continue;
      if (clean.includes("PLACEHOLDER") || clean.includes("YOUR_")) continue;
      // Relaxed prefix check: prefers rzp_ but allows non-prefixed if it looks like a valid key (length check)
      if (isId && !clean.startsWith("rzp_") && clean.length < 10) {
        console.log(`[Razorpay Audit] Skipping candidate ${cand.name} - failed ID validation (Prefix missing or too short)`);
        continue;
      }
      if (!isId && clean.length < 5) continue;
      return clean;
    }
    return "";
  };

  const bestId = findFirstValid(idCandidates, true);
  const bestSecret = findFirstValid(secretCandidates, false);

  if (bestId) {
    if (process.env.RAZORPAY_KEY_ID !== bestId) console.log(`[Razorpay Audit] Correcting RAZORPAY_KEY_ID...`);
    process.env.RAZORPAY_KEY_ID = bestId;
    process.env.VITE_RAZORPAY_KEY_ID = bestId; 
    console.log(`[Razorpay Audit] ID Unified: ${bestId.substring(0, 12)}... Mode: ${bestId.startsWith('rzp_live') ? 'LIVE' : 'TEST'}`);
  }

  if (bestSecret) {
    process.env.RAZORPAY_KEY_SECRET = bestSecret;
  }
};
normalizeRzpKeys();

console.log("RAZORPAY_KEY_ID (Active):", process.env.RAZORPAY_KEY_ID);
console.log("VITE_RAZORPAY_KEY_ID (Active):", process.env.VITE_RAZORPAY_KEY_ID);
console.log("RAZORPAY_SECRET_EXISTS:", !!process.env.RAZORPAY_KEY_SECRET);
if (process.env.RAZORPAY_KEY_SECRET) {
  console.log("RAZORPAY_SECRET_LENGTH:", process.env.RAZORPAY_KEY_SECRET.length);
}
console.log("============================================");

import express from "express";
import path from "path";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
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
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT) || 3000;

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

app.use(helmet({
  contentSecurityPolicy: false, // Disabled for dev flexibility, can be tightened for prod
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration - Restrict to your domain in production
const allowedOrigins = [
  "https://menifestos.com",
  "https://vibeos.in",
  process.env.CORS_ORIGIN,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin) || origin.includes('.run.app')) {
      callback(null, true);
    } else {
      callback(new Error("CORS policy violation"));
    }
  },
  credentials: true
}));

// Rate Limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { error: "Too many requests from this IP, please try again after 15 minutes." }
});

const paymentLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 payment-related requests per hour
  message: { error: "Payment attempt limit reached. Please contact support." }
});

app.use("/api/razorpay/", paymentLimiter);
app.use("/api/gemini/", apiLimiter);

const getRzpCredentials = () => {
  const idCandidates = [
    process.env.RAZORPAY_KEY_ID,
    process.env.VITE_RAZORPAY_KEY_ID,
    process.env.RAZORPAY_ID,
    process.env.RAZORPAY_KEY
  ];
  
  const secretCandidates = [
    process.env.RAZORPAY_KEY_SECRET,
    process.env.RAZORPAY_SECRET_KEY,
    process.env.RAZORPAY_SECRET,
    process.env.VITE_RAZORPAY_KEY_SECRET
  ];

  console.log("[Razorpay DEBUG] ID Candidates Raw (Count):", idCandidates.filter(Boolean).length);
  console.log("[Razorpay DEBUG] Secret Candidates Raw (Count):", secretCandidates.filter(Boolean).length);
  
  // Log specific env existence without values for security
  console.log("[Razorpay DEBUG] RAZORPAY_KEY_ID exists:", !!process.env.RAZORPAY_KEY_ID, process.env.RAZORPAY_KEY_ID?.substring(0, 4) + "...");
  console.log("[Razorpay DEBUG] RAZORPAY_KEY_SECRET exists:", !!process.env.RAZORPAY_KEY_SECRET, process.env.RAZORPAY_KEY_SECRET ? "YES" : "NO");

  const findFirstValid = (list: any[], isId: boolean) => {
    for (const raw of list) {
      const clean = sanitizeConfigStr(raw);
      if (!clean) continue;
      if (clean.includes("PLACEHOLDER") || clean.includes("YOUR_")) continue;
      // Relaxed prefix check: still prefers rzp_ but allows non-prefixed if it looks long enough to be a valid key
      if (isId && !clean.startsWith("rzp_") && clean.length < 10) continue;
      if (!isId && clean.length < 5) continue;
      return clean;
    }
    return "";
  };

  const id = findFirstValid(idCandidates, true);
  const secret = findFirstValid(secretCandidates, false);

  if (!id || !secret) {
    throw new Error(`Razorpay Credentials Missing or Invalid. Check Environment Variables. Found ID: ${!!id}, Secret: ${!!secret}`);
  }

  return { 
    key_id: id, 
    key_secret: secret, 
    source: "Environment" 
  };
};

/**
 * Startup Validation: Verifies credentials by calling Razorpay API
 */
async function verifyRazorpay() {
  try {
    const creds = getRzpCredentials();
    console.log(`[Razorpay Startup] Auditing credentials: Key ID starts with ${creds.key_id.substring(0, 8)}...`);
    
    // Test if VITE key matches server key (Client expects synchronization)
    const currentViteKey = sanitizeConfigStr(process.env.VITE_RAZORPAY_KEY_ID);
    if (currentViteKey !== creds.key_id) {
       console.warn(`[Razorpay Startup] Warning: VITE_RAZORPAY_KEY_ID mismatch! Frontend variable "${currentViteKey?.substring(0,8)}..." != Server variable "${creds.key_id.substring(0,8)}...". Unified value applied now.`);
       process.env.VITE_RAZORPAY_KEY_ID = creds.key_id;
    }

    const RazorpayConstructor = (Razorpay as any).default || Razorpay;
    const rzp = new RazorpayConstructor({
      key_id: creds.key_id,
      key_secret: creds.key_secret
    });
    
    // Call orders.all to verify authentication (minimal impact)
    const check = await rzp.orders.all({ count: 1 });
    console.log("[Razorpay Startup] AUTH SUCCESS: Credentials accepted by Razorpay API.");
    return true;
  } catch (err: any) {
    const detail = err.error?.description || err.description || err.message || "Unknown error";
    console.error(`[Razorpay Startup] AUTH FAILED: API rejected credentials. ID Used: ${process.env.RAZORPAY_KEY_ID?.substring(0, 8)}... Error Detail: ${detail}`);
    return false;
  }
}

const getRzpId = () => {
  try {
    return getRzpCredentials().key_id;
  } catch (err: any) {
    console.error(`[Razorpay] getRzpId error: ${err.message}`);
    return "";
  }
};

const getRzpSecret = () => {
  try {
    return getRzpCredentials().key_secret;
  } catch (err: any) {
    console.error(`[Razorpay] getRzpSecret error: ${err.message}`);
    return "";
  }
};

// Admin diagnostic endpoint
app.get("/api/admin/system-check", async (req, res) => {
  try {
    const rawId = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
    const rawSecret = process.env.RAZORPAY_KEY_SECRET;
    
    let finalId = "";
    let finalSecret = "";
    let key_exists = false;
    let secret_exists = false;
    let mode = 'UNKNOWN';
    let errorMessage = "";
    
    try {
      const creds = getRzpCredentials();
      finalId = creds.key_id;
      finalSecret = creds.key_secret;
      key_exists = true;
      secret_exists = true;
      mode = finalId.startsWith('rzp_test_') ? 'TEST' : 'LIVE';
    } catch (err: any) {
      errorMessage = err.message;
      const sanitizedKey = sanitizeConfigStr(rawId);
      const sanitizedSecret = sanitizeConfigStr(rawSecret);
      key_exists = !!sanitizedKey;
      secret_exists = !!sanitizedSecret;
      if (sanitizedKey && sanitizedKey.startsWith("rzp_")) {
        mode = sanitizedKey.startsWith('rzp_test_') ? 'TEST' : 'LIVE';
        finalId = sanitizedKey;
      }
      if (sanitizedSecret) {
        finalSecret = sanitizedSecret;
      }
    }
    
    const config = {
      razorpay: {
        env_id: rawId ? `${sanitizeConfigStr(rawId).substring(0, 8)}...` : 'not_set',
        env_secret_len: rawSecret ? sanitizeConfigStr(rawSecret).length : 0,
        using_emergency_fallback: false,
        using_fallback: false,
        key_exists,
        secret_exists,
        final_id_prefix: finalId ? finalId.substring(0, 8) : 'MISSING',
        mode,
        id_found: !!finalId,
        secret_found: !!finalSecret,
        secret_len: finalSecret ? finalSecret.length : 0,
        error_message: errorMessage || undefined
      },
      firebase: {
        projectId: admin.apps.length > 0 ? (admin.app().options.projectId || 'Default') : 'Not Initialized',
        isInitialized: !!admin.apps.length,
        isHealthy: isDbHealthy
      },
      email: {
        resend: !!process.env.RESEND_API_KEY,
        sendgrid: !!process.env.SENDGRID_API_KEY
      },
      env: process.env.NODE_ENV || 'production'
    };
    res.json(config);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/admin/razorpay-debug endpoint
app.get("/api/admin/razorpay-debug", (req, res) => {
  try {
    let keyExists = false;
    let secretExists = false;
    let keyPrefix = "";
    let secretLength = 0;
    let mode = "UNKNOWN";
    let isConfigured = false;

    try {
      const creds = getRzpCredentials();
      keyExists = !!creds.key_id;
      secretExists = !!creds.key_secret;
      
      const lastUnderscore = creds.key_id.lastIndexOf('_');
      keyPrefix = creds.key_id ? (creds.key_id.substring(0, lastUnderscore >= 0 ? lastUnderscore + 1 : 9) + "xxx") : "";
      secretLength = creds.key_secret ? creds.key_secret.length : 0;
      mode = creds.key_id.startsWith("rzp_live_") ? "LIVE" : "TEST";
      isConfigured = true;
    } catch (err: any) {
      const envKey = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID || process.env.RAZORPAY_ID;
      const envSecret = process.env.RAZORPAY_SECRET_KEY || process.env.RAZORPAY_KEY_SECRET || process.env.RAZORPAY_SECRET;
      
      const sanitizedKey = sanitizeConfigStr(envKey);
      const sanitizedSecret = sanitizeConfigStr(envSecret);

      keyExists = !!sanitizedKey;
      secretExists = !!sanitizedSecret;
      const lastUnderscore = sanitizedKey.lastIndexOf('_');
      keyPrefix = sanitizedKey ? (sanitizedKey.substring(0, lastUnderscore >= 0 ? lastUnderscore + 1 : 9) + "xxx") : "missing_xxx";
      secretLength = sanitizedSecret ? sanitizedSecret.length : 0;
      mode = sanitizedKey.startsWith("rzp_live_") ? "LIVE" : (sanitizedKey.startsWith("rzp_test_") ? "TEST" : "UNKNOWN");
      isConfigured = false;
    }

    res.json({
      keyExists,
      secretExists,
      keyPrefix,
      secretLength,
      mode,
      isConfigured
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Initialization Middleware for Serverless / Lazy Startup
app.use(async (req, res, next) => {
  if (req.path.startsWith('/api/') && !admin.apps.length) {
    try {
      await initializeFirestore();
    } catch (err) {
      console.error("[Startup] Lazy Firestore Init Fail:", err);
    }
  }
  next();
});

app.use(express.json());
app.use((req, res, next) => {
  console.log(`[REQ] ${req.method} ${req.url}`);
  next();
});

// Razorpay Initialization Helper
const getRazorpay = (req?: any) => {
  let key_id = "";
  let key_secret = "";

  try {
    const creds = getRzpCredentials();
    key_id = creds.key_id;
    key_secret = creds.key_secret;
  } catch (err: any) {
    console.error(`[Razorpay] Env credentials fetch error: ${err.message}`);
  }

  if (req && req.headers) {
    const customId = req.headers["x-razorpay-key-id"];
    const customSecret = req.headers["x-razorpay-key-secret"];
    if (customId && typeof customId === "string" && customId.trim()) {
      key_id = customId.trim();
    }
    if (customSecret && typeof customSecret === "string" && customSecret.trim()) {
      key_secret = customSecret.trim();
    }
  }

  if (!key_id || !key_secret) {
    console.error("[Razorpay] CRITICAL: Configuration error. Razorpay Client cannot be initialized because keys are missing.");
    return null;
  }

  const isCustom = req && req.headers && (req.headers["x-razorpay-key-id"] || req.headers["x-razorpay-key-secret"]);
  console.log(`[Razorpay] Instance initialization. Source: ${isCustom ? 'Client headers' : 'Env Vars'}. ID: ${key_id.substring(0, 8)}... Secret Len: ${key_secret.length}. Mode: ${key_id.startsWith('rzp_test_') ? 'TEST' : 'LIVE'}`);

  try {
    return new Razorpay({
      key_id: key_id,
      key_secret: key_secret
    });
  } catch (err) {
    console.error("[Razorpay] Constructor error:", err);
    const RazorpayConstructor = (Razorpay as any).default || Razorpay;
    return new RazorpayConstructor({
      key_id: key_id,
      key_secret: key_secret
    });
  }
};

// Razorpay Key Endpoint
app.get("/api/config/razorpay-key", (req, res) => {
  const customId = req.headers["x-razorpay-key-id"];
  if (customId && typeof customId === "string" && customId.trim()) {
    return res.json({ keyId: customId.trim() });
  }
  const key_id = getRzpId();
  res.json({ keyId: key_id });
});

// Firebase Admin Initialization
let db: any;
let isDbHealthy = false;
let isDbAuthorized = false;

async function initializeFirestore() {
  try {
    const explicitProjectId = "p-key-kyznn8lq7ajo";
    const appletDbId = "ai-studio-b78c8b0d-664a-411b-8b2f-9f43380506b7";
    
    let adminApp: admin.app.App;
    
    // Safety check: Cleanup any app initialized with the 'ais-' placeholder project ID
    const placeholderApp = admin.apps.find(a => a?.options.projectId?.toString().startsWith("ais-"));
    if (placeholderApp) {
      console.log(`[Firebase] Found placeholder app with ID ${placeholderApp.options.projectId}. Deleting to allow correct initialization.`);
      await placeholderApp.delete();
    }
    
    if (admin.apps.length > 0) {
      adminApp = admin.apps[0]!;
    } else {
      if (process.env.FIREBASE_SERVICE_ACCOUNT) {
        try {
          const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
          adminApp = admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
            projectId: serviceAccount.project_id || explicitProjectId
          });
          console.log(`[Firebase] Admin initialized via Service Account (Project: ${adminApp.options.projectId}).`);
        } catch (err: any) {
          console.error("[Firebase] Service Account JSON parse failed, falling back to ADC.", err.message);
          adminApp = admin.initializeApp({ projectId: explicitProjectId });
        }
      } else {
        // Use ADC but force the project ID from metadata
        adminApp = admin.initializeApp({
          projectId: explicitProjectId
        });
        console.log(`[Firebase] Admin initialized via ADC (Forced Project: ${explicitProjectId}).`);
      }
    }

    // Optimized database probe and selection
    const databasesToTry: string[] = [appletDbId, "(default)"];
    const projectId = adminApp.options.projectId || explicitProjectId;
    
    for (const dbId of databasesToTry) {
      try {
        console.log(`[Firebase] Probing database: ${dbId} in project: ${projectId}`);
        const instance = dbId === "(default)" ? getFirestore(adminApp) : getFirestore(adminApp, dbId);
        
        try {
          // Probe access: check if project/database is ready.
          // Note: In Cloud Run, permissions might take a few seconds after provisioning.
          const probeRef = instance.collection("firebase_startup_probes").doc("ping");
          await probeRef.set({ timestamp: admin.firestore.FieldValue.serverTimestamp() }, { merge: true });
          
          db = instance;
          isDbHealthy = true;
          isDbAuthorized = true;
          console.log(`[Firebase] SUCCESS: Read/Write authorized to database: ${dbId}`);
          break; 
        } catch (probeErr: any) {
          const msg = probeErr.message || "";
          
          if (dbId === "(default)" && (msg.includes("NOT_FOUND") || msg.includes("5 NOT_FOUND"))) {
             continue;
          }

          console.warn(`[Firebase] Probe failed for ${dbId}: ${msg}`);
          
          // Even if probe fails, we might have read access. Try a read probe.
          try {
            await instance.collection("users").limit(1).get();
            db = instance;
            isDbHealthy = true;
            isDbAuthorized = true; // Read probe succeeded
            console.log(`[Firebase] SUCCESS: Read-only access confirmed for database: ${dbId}`);
            break;
          } catch (readErr: any) {
            if (msg.includes("PERMISSION_DENIED") || msg.includes("insufficient permissions")) {
               if (!db) {
                 db = instance;
                 isDbHealthy = true;
                 isDbAuthorized = false;
                 console.log(`[Firebase] FALLBACK: Database ${dbId} selected despite permission warnings.`);
               }
            }
          }
          continue; 
        }
      } catch (e: any) {
        console.warn(`[Firebase] Probe for ${dbId} failed with fatal error: ${e.message}`);
      }
    }

    if (!db) {
      console.error("[Firebase] CRITICAL: Could not connect to any Firestore database.");
      console.error("[Firebase] ------------------------------------------------------------------");
      console.error("[Firebase] ⚠️  ACTION REQUIRED: Admin Backend Features Disabled");
      console.error("[Firebase] To enable background scheduler, CRON jobs, and server-side profile sync, you MUST provide a Firebase Service Account.");
      console.error("[Firebase] 1. Go to Firebase Console -> Project Settings -> Service Accounts.");
      console.error("[Firebase] 2. Click 'Generate new private key' (saves a JSON file).");
      console.error("[Firebase] 3. Open the JSON file, copy its entire contents.");
      console.error("[Firebase] 4. In AI Studio, go to Settings -> Environment Variables.");
      console.error("[Firebase] 5. Add a new variable named 'FIREBASE_SERVICE_ACCOUNT' and paste the JSON.");
      console.error("[Firebase] 6. Restart the dev server.");
      console.error("[Firebase] ------------------------------------------------------------------");
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

    if (!isDbAuthorized) {
      // Gracefully bypass background scans when credentials lack database authority in preview environment
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

    if (!isDbAuthorized) {
      // Gracefully bypass background scans when credentials lack database authority in preview environment
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
console.log("[Razorpay] Environment Diagnostic Check:");
const startKey = process.env.RAZORPAY_KEY_ID || process.env.VITE_RAZORPAY_KEY_ID;
const startSecret = process.env.RAZORPAY_KEY_SECRET;
console.log(" - RAZORPAY Key ID Exists:", !!startKey);
console.log(" - RAZORPAY Secret Exists:", !!startSecret);
if (startKey) {
  const isTest = startKey.trim().startsWith("rzp_test");
  console.log(` - RAZORPAY Detected Mode: ${isTest ? "TEST" : "LIVE"}`);
  console.log(` - RAZORPAY Key Prefix: ${startKey.substring(0, 8)}...`);
} else {
  console.log(" - RAZORPAY Detected Mode: UNKNOWN (No Key Found)");
}

// Resend Initialization
const RESEND_KEY = process.env.RESEND_API_KEY;
const resend = RESEND_KEY ? new Resend(RESEND_KEY) : null;
if (!RESEND_KEY) {
  console.warn("[Resend] API Key missing. Email features will be disabled unless Novu or SendGrid are configured.");
}

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

// Email provider logic

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Server is healthy." });
});

// Utility: Promise Timeout Wrapper
const withTimeout = <T>(promise: Promise<T>, ms: number, timeoutLabel = "Operation"): Promise<T> => {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error(`${timeoutLabel} timed out after ${ms}ms`)), ms)
    ),
  ]);
};

// Country Detection priority helper
const detectCountry = async (email: string, locale?: string, timezone?: string, clientIp?: string) => {
  const startTime = Date.now();
  console.log(`[Country Detection] START for ${email || 'Anonymous'}`);

  // Priority 1: Auth Email
  if (email && (email.toLowerCase().endsWith(".in") || email.toLowerCase().includes("@india.") || email.toLowerCase().endsWith(".co.in"))) {
    console.log(`[Country Detection] Matched IN from Email in ${Date.now() - startTime}ms`);
    return "IN";
  }

  // Priority 2: Browser Locale
  if (locale) {
    const lUpper = locale.toUpperCase();
    if (lUpper.includes("IN") || lUpper.includes("HI")) {
      console.log(`[Country Detection] Matched IN from Locale: ${locale} in ${Date.now() - startTime}ms`);
      return "IN";
    }
  }

  // Priority 3: Timezone
  if (timezone) {
    const tzLower = timezone.toLowerCase();
    if (tzLower.includes("kolkata") || tzLower.includes("calcutta") || tzLower.includes("india")) {
      console.log(`[Country Detection] Matched IN from Timezone: ${timezone} in ${Date.now() - startTime}ms`);
      return "IN";
    }
  }

  // Priority 4: IP Geolocation Fallback
  if (clientIp) {
    try {
      // Filter out loopbacks / private IPs
      if (clientIp !== "127.0.0.1" && clientIp !== "::1" && !clientIp.startsWith("10.") && !clientIp.startsWith("192.168.")) {
        console.log(`[Country Detection] Attempting Geo-IP for ${clientIp}...`);
        
        const geoFetch = fetch(`https://ipapi.co/${clientIp}/json/`).then(async res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        });

        const geoData: any = await withTimeout(geoFetch, 1000, "Geo-IP Lookup");
        
        if (geoData && geoData.country_code) {
          console.log(`[Country Detection] Matched ${geoData.country_code} from Geolocation in ${Date.now() - startTime}ms`);
          return geoData.country_code;
        }
      }
    } catch (err: any) {
      console.warn(`[Country Detection] IP Geolocation look up failed or timed out: ${err.message}`);
    }
  }

  console.log(`[Country Detection] Default fallback to US in ${Date.now() - startTime}ms`);
  return "US";
};

// Check and Sync Membership State self-healing logic
const checkAndUpdateMembershipStatus = async (userDocRef: any, existingData: any) => {
  const now = admin.firestore.Timestamp.now();
  const isAdmin = existingData.email === "asartist20@gmail.com" || existingData.isAdmin === true;
  
  if (isAdmin) {
    return {
      tier: 'Sovereign',
      status: 'lifetime',
      isSubscribed: true,
      subscriptionExpiry: null
    };
  }

  let status = existingData.status || 'trial';
  let tier = existingData.tier || 'Novice';
  let isSubscribed = existingData.isSubscribed || false;
  
  // Check Trial Expiration
  const trialEnd = existingData.trialEnd || existingData.trialExpiresAt;
  const trialEndTime = trialEnd ? trialEnd.toDate().getTime() : 0;
  const hasTrialExpired = Date.now() > trialEndTime;

  // Check Subscription Expiry
  let subExpiry = existingData.subscriptionExpiry || existingData.subscriptionEnd;
  let subExpiryTime = 0;
  if (subExpiry) {
    subExpiryTime = subExpiry.toDate ? subExpiry.toDate().getTime() : new Date(subExpiry).getTime();
  }

  const hasSubExpired = subExpiryTime > 0 && Date.now() > subExpiryTime;

  if (status === 'lifetime') {
    tier = 'Sovereign';
    isSubscribed = true;
  } else if (status === 'active_monthly' || status === 'active_yearly') {
    if (hasSubExpired) {
      status = 'expired';
      tier = 'Novice';
      isSubscribed = false;
    } else {
      tier = 'Sovereign';
      isSubscribed = true;
    }
  } else if (status === 'trial') {
    if (hasTrialExpired) {
      status = 'expired';
      tier = 'Novice';
      isSubscribed = false;
    } else {
      tier = 'Novice';
      isSubscribed = false;
    }
  } else if (status === 'expired') {
    tier = 'Novice';
    isSubscribed = false;
  }
  
  const updates = { status, tier, isSubscribed };
  if (userDocRef) {
    try {
      await userDocRef.update({
        ...updates,
        updatedAt: now
      });
    } catch (writeErr: any) {
      console.warn("[checkAndUpdateMembershipStatus] Non-blocking write warning (using fallback status sync):", writeErr.message);
    }
  }

  return {
    ...updates,
    subscriptionExpiry: subExpiry || null
  };
};

// Helper to safely parse timestamp elements
const parseTimestamp = (val: any) => {
  if (!val) return null;
  if (val.seconds) return admin.firestore.Timestamp.fromMillis(val.seconds * 1000);
  if (val._seconds) return admin.firestore.Timestamp.fromMillis(val._seconds * 1000);
  if (typeof val === 'string' || typeof val === 'number') return admin.firestore.Timestamp.fromMillis(new Date(val).getTime());
  return admin.firestore.Timestamp.now();
};

// Sync User Profile with Admin and Trial Logic
app.post("/api/user/sync", async (req, res) => {
  const startTime = Date.now();
  const { uid, email, displayName, photoURL, browserLocale, timezone, existingProfile } = req.body;

  if (!uid) return res.status(400).json({ error: "Invalid sync request" });

  console.log(`[User Sync] [START] for UID: ${uid}`);

  try {
    const isAdmin = email === "asartist20@gmail.com";
    const now = admin.firestore.Timestamp.now();

    // Clean client IP estimation
    const rawIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress || '';
    const clientIp = typeof rawIp === 'string' ? rawIp.split(',')[0]?.trim() : '';

    console.log(`[User Sync] [STEP 1] Detect Country start...`);
    const detectedCountryCode = await detectCountry(email, browserLocale, timezone, clientIp);
    const currency = detectedCountryCode === 'IN' ? 'INR' : 'USD';
    console.log(`[User Sync] [STEP 1] Country: ${detectedCountryCode} (Duration: ${Date.now() - startTime}ms)`);

    let docRef: any = null;
    let useFallback = false;

    if (db) {
      try {
        console.log(`[User Sync] [STEP 2] Firestore Read start...`);
        const userRef = db.collection("users").doc(uid);
        docRef = await withTimeout(userRef.get(), 3000, "Firestore Read (Sync)");
        console.log(`[User Sync] [STEP 2] Firestore Read end (Duration: ${Date.now() - startTime}ms)`);
      } catch (dbError: any) {
        console.warn("[User Sync] FireStore connection missing or permissions denied. Resorting to client-cooperative fallback.", dbError.message);
        useFallback = true;
      }
    } else {
      console.warn("[User Sync] Firestore DB instance not available, using fallback.");
      useFallback = true;
    }

    if (!useFallback && docRef && docRef.exists) {
      // Existing User normal flow
      const existingData = docRef.data();
      const adminSync = isAdmin || existingData.isAdmin || false;
      const finalCountry = existingData.country || detectedCountryCode;
      const finalCurrency = existingData.currency || currency;

      const baseUpdate = {
        email,
        displayName,
        photoURL,
        isAdmin: adminSync,
        country: finalCountry,
        currency: finalCurrency,
        updatedAt: now
      };

      try {
        console.log(`[User Sync] [STEP 3] Firestore Update start...`);
        const updateTask = db.collection("users").doc(uid).update(baseUpdate);
        await withTimeout(updateTask, 3000, "Firestore Update (Sync)");
        
        const mergedData = { ...existingData, ...baseUpdate };
        console.log(`[User Sync] [STEP 4] Membership Status check start...`);
        const membership = await withTimeout(
          checkAndUpdateMembershipStatus(db.collection("users").doc(uid), mergedData),
          3000,
          "Membership Status Sync"
        );
        
        console.log(`[User Sync] [END] Success. Total duration: ${Date.now() - startTime}ms`);
        return res.json({ ...mergedData, ...membership });
      } catch (writeErr: any) {
        console.warn("[User Sync] Firestore write failed under valid read doc. Swapping to fallback mechanism.", writeErr.message);
        useFallback = true;
      }
    }

    // Fallback or New User flow
    console.log(`[User Sync] [FLOW] New User or Fallback Triggered.`);
    const profileData = existingProfile || {};
    const trialDurationMs = 72 * 60 * 60 * 1000;
    const trialStart = parseTimestamp(profileData.trialStart) || now;
    const trialEnd = parseTimestamp(profileData.trialEnd) || admin.firestore.Timestamp.fromMillis(Date.now() + trialDurationMs);

    const computedUser: any = {
      uid,
      email: email || profileData.email || "",
      displayName: displayName || profileData.displayName || "",
      photoURL: photoURL || profileData.photoURL || null,
      isAdmin: isAdmin || profileData.isAdmin || false,
      isSubscribed: typeof profileData.isSubscribed === 'boolean' ? profileData.isSubscribed : false,
      hasCompletedOnboarding: typeof profileData.hasCompletedOnboarding === 'boolean' ? profileData.hasCompletedOnboarding : false,
      createdAt: parseTimestamp(profileData.createdAt) || now,
      updatedAt: now,
      trialStart,
      trialEnd,
      trialExpiresAt: trialEnd,
      tier: profileData.tier || 'Novice',
      status: profileData.status || 'trial',
      billingCycle: profileData.billingCycle || null,
      country: profileData.country || detectedCountryCode,
      currency: profileData.currency || currency
    };

    // Self-healing check for computed user trial status
    if (computedUser.status === 'trial') {
      const diff = computedUser.trialExpiresAt.seconds * 1000 - Date.now();
      if (diff <= 0) {
        computedUser.tier = 'Novice';
        computedUser.status = 'expired';
        computedUser.isSubscribed = false;
      }
    }

    // Attempt to write the new user doc to database if we are not forcing fallback
    if (db && !useFallback) {
      try {
        console.log(`[User Sync] [STEP 5] New User Set start...`);
        const setTask = db.collection("users").doc(uid).set(computedUser);
        await withTimeout(setTask, 3000, "Firestore Set (Sync)");
        console.log(`[User Sync] [END] Success (New User). Total duration: ${Date.now() - startTime}ms`);
        return res.json(computedUser);
      } catch (setErr: any) {
        console.warn("[User Sync] Database entry storage permission denied. Responding with client-management flags.", setErr.message);
      }
    }

    // Respond with computed properties and signal the client to write it directly (it has verified Rules access!)
    console.log(`[User Sync] [END] Success (Resilient Fallback). Total duration: ${Date.now() - startTime}ms`);
    return res.json({
      ...computedUser,
      resilientFallback: true
    });

  } catch (error: any) {
    console.error("[User Sync] Fatal Error after", Date.now() - startTime, "ms:", error);
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
// (Implementation moved higher up)

// Razorpay Webhook Verification
app.post("/api/razorpay/webhook", async (req, res) => {
  const secret = (process.env.RAZORPAY_WEBHOOK_SECRET || "").trim();
  const signature = req.headers["x-razorpay-signature"] as string;

  console.log(`[Razorpay Webhook] Received webhook. Signature Present: ${!!signature}, Secret Configured: ${!!secret}`);

  // Maintain webhook auditing history
  if (db) {
    try {
      await db.collection("webhooks").add({
        receivedAt: admin.firestore.Timestamp.now(),
        event: req.body.event || 'generic',
        payload: req.body,
        signaturePresent: !!signature
      });
    } catch (whErr) {
      console.error("[Razorpay Webhook Audit] Webhook history logging failed:", whErr);
    }
  }

  if (!secret) {
    console.warn("[Razorpay Webhook] Received webhook but RAZORPAY_WEBHOOK_SECRET is not configured in environment variables. Verification bypassed.");
  } else {
    if (!signature) {
      console.error("[Razorpay Webhook] MISSING x-razorpay-signature header which is required when Webhook Secret is set.");
      return res.status(400).send("Missing signature header");
    }

    let verified = false;
    try {
      const rawText = JSON.stringify(req.body);
      verified = Razorpay.validateWebhookSignature(rawText, signature, secret);
    } catch (err: any) {
      console.warn(`[Razorpay Webhook] validateWebhookSignature helper failed: ${err.message}. Falling back to manual HMAC comparison.`);
      try {
        const expectedSignature = crypto
          .createHmac("sha256", secret)
          .update(JSON.stringify(req.body))
          .digest("hex");
        verified = (expectedSignature === signature);
      } catch (err2) {
        console.error(`[Razorpay Webhook] Manual validation also threw:`, err2);
      }
    }

    if (!verified) {
      console.error("[Razorpay Webhook] INVALID SIGNATURE received. Rejecting webhook request.");
      return res.status(400).send("Invalid signature");
    }
  }

  const event = req.body.event;
  console.log(`[Razorpay Webhook] Verified Event structure: "${event}"`);

  if (event === "payment.captured") {
    try {
      const payment = req.body.payload?.payment?.entity;
      const orderNotes = req.body.payload?.order?.entity?.notes;
      const paymentNotes = payment?.notes;

      const notes = { ...(orderNotes || {}), ...(paymentNotes || {}) };
      const userId = notes.userId || notes.user_id;
      const tier = notes.tier || notes.planName || notes.plan;
      const billingCycle = notes.billingCycle || "monthly";

      console.log(`[Razorpay Webhook] Extracting Metadata. User ID: ${userId || 'N/A'}, Tier: ${tier || 'N/A'}, Billing Cycle: ${billingCycle}`);

      if (!userId || !tier) {
        console.warn(`[Razorpay Webhook] Event "payment.captured" is missing essential metadata "userId" (${userId}) or "tier" (${tier}) in payload notes. Bypassing state update.`);
      } else {
        const expiry = new Date();
        if (billingCycle === 'monthly') {
          expiry.setMonth(expiry.getMonth() + 1);
        } else if (billingCycle === 'yearly') {
          expiry.setFullYear(expiry.getFullYear() + 1);
        } else {
          expiry.setFullYear(expiry.getFullYear() + 100);
        }

        if (db) {
          await db.collection("users").doc(userId).update({
            tier: tier,
            subscriptionExpiry: admin.firestore.Timestamp.fromDate(expiry),
            updatedAt: admin.firestore.Timestamp.now()
          });
          console.log(`[Razorpay Webhook] SUCCESS: Upgraded User profile for uid: ${userId} to "${tier}" tier.`);

          // Replicate Income Log locally for visual accounting
          try {
            const inrAmount = payment?.amount ? payment.amount / 100 : 0;
            await db.collection("transactions").add({
              type: 'income',
              amount: inrAmount,
              label: payment?.email || payment?.contact || 'Manifest Seeker (Webhook)',
              category: `${tier} Activation [${billingCycle}] (Webhook)`,
              ownerId: userId,
              timestamp: admin.firestore.Timestamp.now()
            });
            console.log(`[Razorpay Webhook] SUCCESS: Transaction registry logged for user: ${userId}`);
          } catch (txErr: any) {
            console.error(`[Razorpay Webhook] Failed to register local transaction database record: ${txErr.message}`);
          }
        } else {
          console.error(`[Razorpay Webhook] CRITICAL: Cannot persist upgrade. Database reference (db) is uninitialized or unhealthy.`);
        }
      }
    } catch (parseError: any) {
      console.error(`[Razorpay Webhook] Failed to parse payment capture details correctly:`, parseError);
    }
  }

  res.status(200).send("ok");
});

// --- NEW PRODUCTION SUBSCRIPTION ENGINE ---

// Secure Pricing Logic
const getPricing = (planId: string, billingCycle: string, country: string) => {
  const isIndia = country === 'IN';
  if (isIndia) {
    if (billingCycle === 'monthly') return { amount: 99, currency: 'INR' };
    if (billingCycle === 'yearly') return { amount: 999, currency: 'INR' };
    if (billingCycle === 'lifetime') return { amount: 2999, currency: 'INR' };
  } else {
    if (billingCycle === 'monthly') return { amount: 5, currency: 'USD' };
    if (billingCycle === 'yearly') return { amount: 49, currency: 'USD' };
    if (billingCycle === 'lifetime') return { amount: 149, currency: 'USD' };
  }
  return { amount: 99, currency: 'INR' }; // Default
};

// 1. Create Subscription Order
app.post("/api/subscription/create-order", async (req, res) => {
  const startTime = Date.now();
  const { planId, billingCycle, userId, userEmail, userName, timezone, locale } = req.body;
  const clientIp = req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress;

  if (!userId || !planId || !billingCycle) {
    return res.status(400).json({ error: "Missing required parameters." });
  }

  console.log(`[Subscription Order] [START] for User: ${userId} (Email: ${userEmail})`);

  try {
    console.log(`[Subscription Order] [STEP 1] Detect Country start...`);
    const country = await detectCountry(userEmail || '', locale, timezone, clientIp);
    console.log(`[Subscription Order] [STEP 1] Country: ${country} (Duration: ${Date.now() - startTime}ms)`);

    const { amount, currency } = getPricing(planId, billingCycle, country);
    const finalAmount = Math.round(amount * 100);

    console.log(`[Subscription Order] [STEP 2] Get Razorpay start...`);
    console.log("[DEBUG] RAZORPAY_KEY_ID from env:", process.env.RAZORPAY_KEY_ID ? process.env.RAZORPAY_KEY_ID.substring(0, 4) + "..." : "MISSING");
    console.log("[DEBUG] RAZORPAY_KEY_SECRET exists:", !!process.env.RAZORPAY_KEY_SECRET);
    
    const rzp = getRazorpay();
    if (!rzp) throw new Error("Razorpay not initialized.");

    console.log(`[Subscription Order] [STEP 3] Razorpay Order Creation start...`);
    const rzpCreateTask = rzp.orders.create({
      amount: finalAmount,
      currency,
      receipt: `sub_${Date.now()}_${userId.slice(-4)}`,
      payment_capture: 1,
      notes: { userId, planId, billingCycle, country, source: 'vibeos_sovereign_engine' }
    });

    const order = await withTimeout(rzpCreateTask, 3000, "Razorpay API") as any;
    console.log(`[Subscription Order] [STEP 3] Razorpay Order end. ID: ${order.id} (Duration: ${Date.now() - startTime}ms)`);

    console.log(`[Subscription Order] [END] Success. Total duration: ${Date.now() - startTime}ms`);
    res.json({
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      checkoutConfig: {
        key: process.env.VITE_RAZORPAY_KEY_ID,
        amount: order.amount,
        currency: order.currency,
        name: "vibeOS Sovereign",
        description: `Unlock Sovereign Alignment [${billingCycle}]`,
        order_id: order.id,
        prefill: { name: userName || "", email: userEmail || "" },
        theme: { color: "#000000" },
        config: {
          display: {
            blocks: {
              upi: {
                name: "UPI / QR",
                instruments: [{ method: "upi", protocols: ["vpa", "qr", "intent"] }]
              }
            },
            preferences: { show_default_blocks: true }
          }
        }
      }
    });
  } catch (error: any) {
    console.error(`[Subscription Order] Fatal Error after ${Date.now() - startTime}ms:`, error);
    res.status(500).json({ error: error.message });
  }
});

// 2. Verify Subscription Payment
app.post("/api/subscription/verify-payment", async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, userId, planId, billingCycle } = req.body;
  const secret = getRzpSecret();

  if (!secret) return res.status(500).json({ error: "Server config missing." });

  const generated_signature = crypto
    .createHmac("sha256", secret)
    .update(razorpay_order_id + "|" + razorpay_payment_id)
    .digest("hex");

  if (generated_signature !== razorpay_signature) {
    return res.status(400).json({ error: "Invalid payment signature." });
  }

  try {
    const now = admin.firestore.Timestamp.now();
    const expiry = new Date();
    if (billingCycle === 'monthly') expiry.setMonth(expiry.getMonth() + 1);
    else if (billingCycle === 'yearly') expiry.setFullYear(expiry.getFullYear() + 1);
    else expiry.setFullYear(expiry.getFullYear() + 100);

    const subscriptionData = {
      userId,
      planId,
      billingCycle,
      status: 'active',
      startDate: now,
      expiryDate: billingCycle === 'lifetime' ? null : admin.firestore.Timestamp.fromDate(expiry),
      paymentId: razorpay_payment_id,
      orderId: razorpay_order_id,
      createdAt: now
    };

    if (db) {
      await db.collection("subscriptions").add(subscriptionData);
      await db.collection("users").doc(userId).update({
        tier: 'Sovereign',
        isSubscribed: true,
        subscriptionStatus: 'active',
        subscriptionExpiry: subscriptionData.expiryDate,
        updatedAt: now
      });
    }

    console.log(`[Subscription] Verified & Activated: User ${userId} | Plan: ${planId}`);
    res.json({ success: true, expiryDate: subscriptionData.expiryDate });
  } catch (error: any) {
    console.error("[Subscription] Verification Error:", error.message);
    res.status(500).json({ error: "Failed to activate subscription." });
  }
});

// 3. Get Subscription Status (including 3-day Trial logic)
app.get("/api/subscription/status/:userId", async (req, res) => {
  const { userId } = req.params;
  if (!db) return res.json({ tier: 'Free', status: 'offline' });

  try {
    const userDoc = await db.collection("users").doc(userId).get();
    if (!userDoc.exists) {
      // New user auto-trial assignment
      const trialExpiry = new Date();
      trialExpiry.setDate(trialExpiry.getDate() + 3);
      const now = admin.firestore.Timestamp.now();
      
      const newProfile = {
        tier: 'Novice',
        isSubscribed: false,
        trialStartedAt: now,
        trialExpiresAt: admin.firestore.Timestamp.fromDate(trialExpiry),
        createdAt: now
      };
      
      await db.collection("users").doc(userId).set(newProfile);
      return res.json({ ...newProfile, status: 'trialing' });
    }

    const userData = userDoc.data();
    const now = Date.now();
    const subExpiry = userData.subscriptionExpiry?.toDate().getTime();
    const trialExpiry = userData.trialExpiresAt?.toDate().getTime();

    if (subExpiry && subExpiry > now) {
      return res.json({ tier: 'Sovereign', status: 'active', expiry: subExpiry });
    }

    if (trialExpiry && trialExpiry > now) {
      return res.json({ tier: 'Novice', status: 'trialing', trialExpiry });
    }

    // Default expired/free state
    res.json({ tier: 'Free', status: 'expired' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
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
  const isVercel = process.env.VERCEL === '1' || !!process.env.NOW_REGION;
  
  if (isVercel) {
    console.log("[Startup] Serverless environment detected. Skipping background schedulers and long probes.");
    return app;
  }

  // 1. Initialize Firestore
  try {
    await initializeFirestore();
  } catch (e) {
    console.error("[Startup] Firestore direct init failed (will retry via middleware):", e);
  }

  // 1b. Verify Razorpay Credentials (User Requirement #5)
  await verifyRazorpay();

  // 2. Start Background Scheduler (Only in persistent environments)
  startScheduler();
  startStreakDangerScheduler();

  // Vite middleware for development (conditionally imported to avoid production runtime deps)
  if (process.env.NODE_ENV !== "production" && !process.env.VERCEL) {
    try {
      const viteModule = "vite";
      const { createServer: createViteServer } = await import(viteModule);
      const vite = await createViteServer({
        server: { middlewareMode: true },
        appType: "spa",
      });
      app.use(vite.middlewares);
    } catch (err) {
      console.warn("[Development] Vite could not be loaded, skipping middleware.");
    }
  } else {
    // Production: Serve static files from dist
    const distPath = path.join(process.cwd(), "dist");
    if (fs.existsSync(distPath)) {
      app.use(express.static(distPath));
      app.get("*", (req, res) => {
        res.sendFile(path.join(distPath, "index.html"));
      });
    }
  }

  // Start server (only if not in Vercel/Serverless environment)
  if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
    app.listen(PORT, "0.0.0.0", () => {
      console.log(`[Vibe OS] Server running on http://localhost:${PORT}`);
    });
  }

  return app;
}

// In persistent environments, we call startServer. 
// In serverless, we export the app and let the middleware handle lazy init.
if (process.env.NODE_ENV !== 'production' || !process.env.VERCEL) {
  startServer().catch(err => {
    console.error("[Startup] Critical server startup failure:", err);
  });
}

export default app;
