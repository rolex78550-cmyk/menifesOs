import express from "express";
import path from "path";
import cors from "cors";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";
import Razorpay from "razorpay";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());
  app.use(cors());

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
    
    // In a real app, you'd use crypto to verify signature
    // For this prototype, we confirm receipt if signature is present
    if (razorpay_signature) {
       res.json({ status: "ok", message: "Payment verified successfully." });
    } else {
       res.status(400).json({ status: "error", message: "Invalid signature." });
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
}

startServer();
