
# VibeMatch | Random Live Video Chat & Matchmaking SAAS Platform

Welcome to **VibeMatch**, a modern, high-performance real-time 1-on-1 random live video chat and matchmaking web platform. Built with **React 18**, **Node.js**, **Express**, **Socket.IO**, **WebRTC**, and **MongoDB**, VibeMatch offers a fast, interactive, and fully monetized video chat experience for spontaneous social connections.

---

## ?? Key Features

- **WebRTC Peer-to-Peer Streaming:** Ultra-low latency, crystal-clear 1-on-1 video and audio connections.
- **Smart Matchmaking Queue:** Automated partner matching, quick skip, and reconnection handling.
- **In-Call Real-Time Interaction:** Text messaging overlay, reaction buttons, and animated virtual diamond gifting.
- **Monetization & Shop:**
  - Diamond Coin packages for sending virtual gifts and unlocking features.
  - VIP Subscriptions for advanced gender & region filters.
  - Integrated payment gateways: **Stripe** & **PayPal**.
- **Admin Management Panel:**
  - Real-time statistics (active users, live calls, total revenue).
  - User management (bans, balances, VIP status).
  - Content moderation and user reports management.
  - Complete platform settings and branding customization.
- **Automated 4-Step Web Installer:** Quick and easy setup for license verification, database connectivity, site branding, and admin account creation.
- **Responsive & Mobile-Ready:** Fully optimized for mobile browsers, tablets, and desktops with PWA capabilities.

---

## ?? Server Requirements

Before installing, ensure your server meets the following requirements:

- **Node.js:** v18.x or higher (v20.x recommended)
- **NPM:** v9.x or higher
- **MongoDB:** v5.x or higher (Local installation or MongoDB Atlas)
- **Web Server:** Nginx, Apache, or Node.js Cloud Hosting (GadoHost, cPanel with Node.js support)
- **SSL / HTTPS:** Mandatory for modern browsers to grant Camera & Microphone permissions.

---

## ?? Project Structure

```text
+-- assets/          # Static assets and icons
+-- public/          # Public static assets & default avatars
+-- scripts/         # Utility and database seed scripts
+-- src/             # Frontend React (TypeScript) source code
¦   +-- components/  # React components (Video chat, Admin, Shop, etc.)
¦   +-- lib/         # API clients, socket connections & helpers
¦   +-- pages/       # Application views & pages
¦   +-- types/       # TypeScript type definitions
+-- .env.example     # Environment variables template
+-- index.html       # Single Page Application entrypoint
+-- package.json     # Node.js dependencies and scripts
+-- server.ts        # Express & Socket.IO backend server
+-- tsconfig.json    # TypeScript compiler configuration
+-- vite.config.ts   # Vite bundler configuration
```

---

## ?? Quick Installation & Setup

### 1. Extract Files & Install Dependencies

```bash
# Unzip code into your web directory (e.g. /var/www/vibematch)
cd /var/www/vibematch

# Install dependencies
npm install
```

### 2. Configure Environment Variables

Copy `.env.example` to `.env` and configure your database connection:

```bash
cp .env.example .env
```

Edit `.env`:
```env
PORT=3000
NODE_ENV=production
DEMO_MODE=false
MONGODB_URI="mongodb://localhost:27017/vibematch"
JWT_SECRET="your_strong_secret_key_here"
```

### 3. Build & Start the Application

```bash
# Build the production frontend bundle
npm run build

# Start the server (Development)
npm run dev

# Or start in production with PM2
pm2 start npm --name "vibematch" -- run start
```

### 4. Run the Web Installer

Navigate to your domain in your browser:
```text
https://yourdomain.com
```
Follow the on-screen **4-Step Setup Wizard** to complete the license activation, test database connection, configure site information, and create your administrator account.

---

## ?? Documentation & Support

Comprehensive step-by-step guides for both **VPS (Ubuntu)** and **GadoHost/cPanel** hosting environments are included in the `Documentation/` folder:

- `index.html` - GadoHost & Shared Cloud Hosting Setup Guide
- `vps.html` - Ubuntu VPS (Nginx, PM2, Certbot SSL) Setup Guide
- `upgrade.html` - Safe Update & Migration Instructions
- `faq.html` - Troubleshooting & Frequently Asked Questions

For technical support or inquiries, please contact our team via CodeCanyon item support or through the contact channels provided in the documentation.

---

© IT Amadersomaj Inc Team. All rights reserved.
=======
# VibeMatch
VibeMatch is an elite, high-performance Random Live Video Chat and Social Matchmaking platform (Azar Alternative). Built with cutting-edge real-time technologies including Flutter (Android &amp; iOS), React, Node.js, Express, Socket.IO, WebRTC, and MongoDB, VibeMatch delivers ultra-low-latency 1-on-1 video streaming,

