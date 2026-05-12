import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import "dotenv/config";
import admin from "firebase-admin";
import { getApps, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";
import fs from "fs";
import Razorpay from "razorpay";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize Razorpay
let razorpay: Razorpay | null = null;
if (process.env.VITE_RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
  razorpay = new Razorpay({
    key_id: process.env.VITE_RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
}

const firebaseConfigPath = path.join(__dirname, "firebase-applet-config.json");
let firebaseConfig: any = {};
if (fs.existsSync(firebaseConfigPath)) {
  firebaseConfig = JSON.parse(fs.readFileSync(firebaseConfigPath, "utf8"));
}

// Initialize Firebase Admin
try {
  if (admin.apps.length === 0 && firebaseConfig.projectId) {
    // Explicitly set environment variables for the SDK
    process.env.GCLOUD_PROJECT = firebaseConfig.projectId;
    process.env.GOOGLE_CLOUD_PROJECT = firebaseConfig.projectId;
    
    console.log(`[Firebase] Initializing Admin SDK for project: ${firebaseConfig.projectId}`);
    
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      projectId: firebaseConfig.projectId,
    });
    console.log(`[Firebase] Admin initialized successfully.`);
  }
} catch (error) {
  console.error("[Firebase] Init error:", error);
}

// Global DB instance
let _db: any = null;

function getDb() {
  if (!_db) {
    try {
      const app = admin.app();
      const dbId = firebaseConfig.firestoreDatabaseId || "(default)";
      // @ts-ignore
      _db = getFirestore(app, dbId);
    } catch (e) {
      console.error("[Firebase] getDb error:", e);
    }
  }
  return _db;
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Razorpay Order Creation
  app.post("/api/razorpay/create-order", async (req, res) => {
    if (!razorpay) {
      return res.status(500).json({ error: "Razorpay keys not configured on server." });
    }

    try {
      const { amount, currency = "INR", receipt } = req.body;
      
      const options = {
        amount: Math.round(amount * 100), // amount in the smallest currency unit
        currency,
        receipt,
      };

      const order = await razorpay.orders.create(options);
      res.json(order);
    } catch (error: any) {
      console.error("[Razorpay] Create Order Error:", error);
      res.status(500).json({ error: error.message || "Failed to create order" });
    }
  });

  app.get("/api/health", async (req, res) => {
    let firebaseStatus = "unknown";
    try {
      const db = getDb();
      if (db) {
        await db.collection("habits").limit(1).get();
        firebaseStatus = "connected";
      } else {
        firebaseStatus = "db-client-null";
      }
    } catch (e: any) {
      firebaseStatus = `error: ${e.message}`;
    }
    res.json({ 
      status: "ok", 
      firebase: firebaseStatus,
      databaseId: firebaseConfig.firestoreDatabaseId || "(default)",
      projectId: firebaseConfig.projectId,
      env: process.env.NODE_ENV || "development"
    });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server started on port ${PORT}`);
  });
}

startServer().catch(console.error);
