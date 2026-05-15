# Deploying LOM (Manifest OS) to Vercel

This app is built with a Full-Stack React + Express + Vite architecture.

## Deployment Steps

1. **Push to GitHub**: Initialize a git repo and push this project to your GitHub.
2. **Connect to Vercel**: 
   - Create a new project on Vercel.
   - Import your GitHub repo.
   - Vercel will auto-detect Vite, but you need to override the **Build Command** and **Output Directory**.

## Vercel Project Configuration

- **Framework Preset**: Vite
- **Build Command**: `npm run build`
- **Output Directory**: `dist`
- **Install Command**: `npm install`

### Environment Variables
You MUST add the following variables in the Vercel Dashboard (**Settings > Environment Variables**):

| Key | Description |
|-----|-------------|
| `VITE_PAYPAL_CLIENT_ID` | Your Public PayPal Client ID |
| `VITE_RAZORPAY_KEY_ID` | Your Public Razorpay Key ID |
| `RAZORPAY_SECRET_KEY` | **(Secret)** Your Razorpay Secret Key |
| `GEMINI_API_KEY` | Your Google Gemini API Key |

### Firebase Integration
Since this app uses Firebase, ensure your `firebase-applet-config.json` is committed or the configuration is handled via environment variables in a custom `firebase.ts` file.

## Why Full-Stack?
By using the Express backend included in this repo (`server.ts`), your `RAZORPAY_SECRET_KEY` remains hidden from the browser, preventing unauthorized use of your merchant account.

## Support
The universe provides, but consistency is key. Keep your frequency high!
