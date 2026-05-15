import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";
import crypto from "crypto";
import { Resend } from "resend";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

  // Resend Initialization
  const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

  // Razorpay Initialization
  const razorpay = process.env.RAZORPAY_SECRET_KEY ? new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID || '',
    key_secret: process.env.RAZORPAY_SECRET_KEY,
  }) : null;

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", message: "LOM Backend is pulsing." });
  });

  // Razorpay Order Creation
  app.post("/api/razorpay/create-order", async (req, res) => {
    if (!razorpay) {
      return res.status(500).json({ error: "Razorpay not configured on server (RAZORPAY_SECRET_KEY missing)." });
    }
    
    const { amount, currency, receipt } = req.body;
    try {
      const order = await razorpay.orders.create({
        amount: Math.round(parseFloat(amount) * 100), 
        currency,
        receipt,
      });
      res.json(order);
    } catch (error) {
      console.error("Razorpay Order Error:", error);
      res.status(500).json({ error: "Failed to create order." });
    }
  });

  // Razorpay Payment Verification
  app.post("/api/razorpay/verify-payment", async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    
    if (!process.env.RAZORPAY_SECRET_KEY) {
      return res.status(500).json({ error: "Razorpay secret key missing on server." });
    }

    const body = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_SECRET_KEY)
      .update(body.toString())
      .digest("hex");

    if (expectedSignature === razorpay_signature) {
       res.json({ status: "ok", message: "Payment verified successfully." });
    } else {
       // For dev/prototype mode, we might want to bypass if the signature is missing but payment_id exists
       // but strictly speaking for "dynamic functionality" we follow the protocol.
       res.status(400).json({ status: "error", message: "Invalid signature authenticity." });
    }
  });

  // Ritual Notification (Email)
  app.post("/api/notify-ritual", async (req, res) => {
    const { email, ritualName, userName } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    console.log(`[LOM] Triggering ritual email for: ${email} (${ritualName})`);

    if (!resend) {
      console.warn("[LOM] RESEND_API_KEY missing. Manifesting email to console only.");
      return res.json({ 
        status: "mock", 
        message: "Email simulated. (RESEND_API_KEY missing in environment)" 
      });
    }

    try {
      const data = await resend.emails.send({
        from: 'LOM <onboarding@resend.dev>',
        to: [email],
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
            <p style="opacity: 0.7;">This is your high-frequency reminder from LOM - Manifest OS.</p>
            <hr style="border: 0; border-top: 1px solid rgba(255,255,255,0.1); margin: 40px 0;">
            <p style="font-size: 10px; opacity: 0.3; text-align: center; text-transform: uppercase; letter-spacing: 0.1em;">Quantum Tracking Active • Stay Aligned</p>
          </div>
        `,
      });
      res.json({ status: "ok", data });
    } catch (error) {
      console.error("Resend Email Error:", error);
      res.status(500).json({ error: "Failed to send email notification." });
    }
  });

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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[LOM] Server running on http://localhost:${PORT}`);
  });

  return app;
}

const appPromise = startServer();
export default appPromise;
