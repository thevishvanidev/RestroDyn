# 🍽️ RestroDyn — Smart QR Restaurant Ordering SaaS

A modern, multi-tenant SaaS platform for QR-based restaurant ordering. Built as a Progressive Web App (PWA) with real-time order management.

## ✨ Features

- **📱 QR Code Ordering** — Customers scan a table QR code and order directly from their phone
- **🍽️ Interactive Menu** — Beautiful digital menu with categories, dietary filters, and customization
- **👨‍🍳 Kitchen Dashboard** — Real-time Kanban-style order queue with audio notifications
- **📊 Admin Analytics** — Revenue tracking, popular items, and order analytics
- **🏢 Multi-Restaurant** — Each restaurant gets isolated data, custom branding, and unique QR codes
- **🔄 Real-Time Sync** — Orders and status updates sync instantly across tabs
- **📸 Image Upload** — Drag & drop image upload for menu items
- **👑 Super Admin** — Platform-wide restaurant management and subscription control

## 🚀 Tech Stack

- **Frontend**: Vanilla HTML, CSS, JavaScript (ES Modules)
- **Build Tool**: Vite
- **3D Hero**: Three.js
- **Charts**: Chart.js
- **QR Codes**: qrcode library
- **Storage**: localStorage (demo/prototype)
- **PWA**: Service Worker + Web App Manifest

## 📦 Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🔐 Demo Credentials

**Restaurant Login:**
- Email: `demo@restrodyn.app`
- Password: `demo123`

**Super Admin:**
- Email: `admin@restrodyn.app`
- Password: `admin123`

## 🌐 Deployment

This project is configured for **Vercel** deployment:

1. Push to GitHub
2. Import the repo on [vercel.com](https://vercel.com)
3. Vercel auto-detects Vite — just click **Deploy**

## 📁 Project Structure

```
├── index.html          # Landing page
├── menu.html           # Customer menu (QR scan target)
├── admin.html          # Restaurant admin dashboard
├── kitchen.html        # Kitchen display system
├── register.html       # Restaurant registration/login
├── super-admin.html    # Platform super admin
├── css/                # Stylesheets
├── js/                 # JavaScript modules
│   ├── components/     # Reusable UI components
│   ├── data/           # Store, auth, platform data
│   ├── three/          # Three.js hero scene
│   └── utils/          # Helper functions
├── assets/             # Images and icons
├── sw.js               # Service worker
├── manifest.json       # PWA manifest
├── vite.config.js      # Vite configuration
└── vercel.json         # Vercel deployment config
```

## 📄 License

MIT
