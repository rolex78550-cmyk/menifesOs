# LOM (Manifest OS) Deployment Guide

Your LOM (Law of Manifestation) system is ready for the world. Here is how to host it for maximum scalability.

## Option A: Vercel (Recommended for SaaS)
Vercel is the easiest place to host Full-Stack React + Express apps.

1. **GitHub**: Push your code to a private or public GitHub repository.
2. **Import**: Go to [vercel.com](https://vercel.com), click "New Project", and import your repo.
3. **Build Settings**: 
   - Framework Preset: `Vite`
   - Build Command: `npm run build`
   - Output Directory: `dist`
4. **Environment Variables**: In Vercel Settings, add:
   - `VITE_PAYPAL_CLIENT_ID`
   - `VITE_RAZORPAY_KEY_ID`
   - `RAZORPAY_SECRET_KEY`
   - `GEMINI_API_KEY`
5. **Authorized Domains (CRITICAL for Auth)**:
   - Go to [Firebase Console](https://console.firebase.google.com/).
   - Select your project.
   - Go to **Authentication > Settings > Authorized Domains**.
   - Add your Vercel URL (e.g., `yourapp.vercel.app`).
6. **Domain**: Go to Settings > Domains. Type your domain name (e.g., `manifestlom.com`) and follow the DNS instructions.

## Option B: Firebase (If you prefer Google's Ecosystem)
To host the full-stack app on Firebase, you need the Firebase CLI.

1. `npm install -g firebase-tools`
2. `firebase login`
3. `firebase init` (Select Hosting and Functions)
4. **Hosting**: Point it to the `dist` directory.
5. **Functions**: You will need to rewrite your `server.ts` into the `functions/index.js` file to handle API requests.
6. **Domain**: Go to the Firebase Console > Hosting > Add Custom Domain.

## Option C: Hosting (For Domain only)
If you already bought a domain from Hostinger, you can:
- **Point to Vercel**: Change Nameservers to Vercel (Best approach).
- **Point to Firebase**: Add A-Records in Hostinger DNS panel as provided by Firebase.

---

### Scaling Limits
- **Data Store**: Firestore (used in this app) can handle **millions of users** effortlessly. It scales automatically.
- **Concurrent Users**: Vercel/Cloud Run can scale to handle **thousands of users at the same time** (Concurrent) by spinning up more server power on demand.

### Domain Integration
To add your domain:
1. Buy domain from Hostinger/GoDaddy.
2. Link it to your hosting provider (Vercel/Firebase).
3. Update DNS (A Record or CNAME) in your domain panel.
