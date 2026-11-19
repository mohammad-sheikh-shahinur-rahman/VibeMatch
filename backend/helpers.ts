import dotenv from 'dotenv';
dotenv.config();
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import admin from 'firebase-admin';
import mongoose from 'mongoose';
import { User, Admin, Settings } from './models/index.js';

if (!process.env.JWT_SECRET) {
  console.error("FATAL ERROR: JWT_SECRET environment variable is not set. Refusing to start for security reasons.");
  process.exit(1);
}
const JWT_SECRET = process.env.JWT_SECRET;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vibematch';
const DEMO_MODE = process.env.DEMO_MODE === 'true';

let isMongoConnected = false;



// Mailer Utility
const sendSystemEmail = async (to: string, subject: string, html: string) => {
  const settings = await Settings.findOne({ type: 'admin_settings' });
  if (!settings) return false;

  const mailDriver = (settings as any).mailDriver || 'sendmail';
  const fromName = (settings as any).mailFromName || 'VibeMatch';
  const fromEmail = (settings as any).mailFromEmail || 'noreply@vibematch.com';
  const sender = `"${fromName}" <${fromEmail}>`;

  let transporter;
  if (mailDriver === 'smtp') {
    transporter = nodemailer.createTransport({
      host: (settings as any).smtpHost,
      port: parseInt((settings as any).smtpPort || '587'),
      secure: parseInt((settings as any).smtpPort || '587') === 465,
      auth: {
        user: (settings as any).smtpUser,
        pass: (settings as any).smtpPass,
      }
    });
  } else {
    // sendmail
    transporter = nodemailer.createTransport({
      sendmail: true,
      newline: 'unix',
      path: '/usr/sbin/sendmail'
    });
  }

  try {
    const info = await transporter.sendMail({
      from: sender,
      to,
      subject,
      html
    });
    console.log('Email sent: ' + info.messageId);
    return true;
  } catch (err) {
    console.error('Error sending email:', err);
    return false;
  }
};

const sendPurchaseEmail = async (user: any, packName: string, price: number) => {
  if (user && user.email) {
    const settings = await Settings.findOne({ type: 'admin_settings' });
    if (settings && (settings as any).templatePurchase) {
      const html = (settings as any).templatePurchase
        .replace(/%nameuser%/g, user.name || user.username)
        .replace(/%packname%/g, packName)
        .replace(/%price%/g, price.toString());
      sendSystemEmail(user.email, 'Purchase Confirmation', html);
    }
  }
};



// Initial Mock Seed Data for Matching (Static profiles for the demo video feeds)
const mockPartners = [
  {
    id: 'p1', name: 'Abigail', username: 'abigail', age: 22, gender: 'female', country: 'United States', countryCode: 'US',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-lighting-1232-large.mp4',
    bio: 'Love travel, music and meeting new people worldwide! ✨', interests: ['Music', 'Travel', 'Photography'],
    isOnline: true, likesCount: 1420
  },
  {
    id: 'p2', name: 'Lily', username: 'lily', age: 28, gender: 'female', country: 'United Kingdom', countryCode: 'GB',
    avatar: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-running-on-the-beach-2947-large.mp4',
    bio: 'Fitness enthusiast & foodie. Let\'s chat!', interests: ['Fitness', 'Food', 'Movies'],
    isOnline: true, likesCount: 890
  },
  {
    id: 'p3', name: 'Emma', username: 'emma', age: 24, gender: 'female', country: 'Canada', countryCode: 'CA',
    avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-lighting-1232-large.mp4',
    bio: 'Art student looking for inspiration and good conversations 🎨', interests: ['Art', 'Design', 'Reading'],
    isOnline: true, likesCount: 2150
  },
  {
    id: 'p4', name: 'Sophie', username: 'sophie', age: 26, gender: 'female', country: 'France', countryCode: 'FR',
    avatar: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-running-on-the-beach-2947-large.mp4',
    bio: 'Bonjour! Love fashion and deep talks about life.', interests: ['Fashion', 'Philosophy', 'Wine'],
    isOnline: false, likesCount: 3400
  },
  {
    id: 'p5', name: 'Isabella', username: 'isabella', age: 23, gender: 'female', country: 'Italy', countryCode: 'IT',
    avatar: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-lighting-1232-large.mp4',
    bio: 'Always planning my next adventure. Come along! ✈️', interests: ['Travel', 'Languages', 'Culture'],
    isOnline: true, likesCount: 950
  },
  {
    id: 'p6', name: 'Chloe', username: 'chloe', age: 25, gender: 'female', country: 'Australia', countryCode: 'AU',
    avatar: 'https://images.unsplash.com/photo-1531123897727-8f129e1bf98c?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-running-on-the-beach-2947-large.mp4',
    bio: 'Beach lover and sunset chaser 🌅', interests: ['Surfing', 'Nature', 'Photography'],
    isOnline: true, likesCount: 1800
  },
  {
    id: 'p7', name: 'Mia', username: 'mia', age: 21, gender: 'female', country: 'Germany', countryCode: 'DE',
    avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-girl-in-neon-lighting-1232-large.mp4',
    bio: 'Tech geek by day, gamer by night 🎮', interests: ['Gaming', 'Tech', 'Anime'],
    isOnline: false, likesCount: 2200
  },
  {
    id: 'p8', name: 'Ava', username: 'ava', age: 27, gender: 'female', country: 'Spain', countryCode: 'ES',
    avatar: 'https://images.unsplash.com/photo-1517365830460-955ce3ccd263?auto=format&fit=crop&w=600&q=80',
    videoUrl: 'https://assets.mixkit.co/videos/preview/mixkit-woman-running-on-the-beach-2947-large.mp4',
    bio: 'Living life to the fullest! Dancer and dreamer ✨', interests: ['Dance', 'Music', 'Festivals'],
    isOnline: true, likesCount: 3100
  }
];



// Database Seeding Logic
async function seedDB() {
  try {
    const admin = await User.findOne({ username: 'demo' });
    if (!admin) {
      await User.create({
        id: 'u_admin', username: 'demo', name: 'Admin User', email: 'admin@vibematch.com',
        passwordHash: bcrypt.hashSync('demo123', 10), avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
        gender: 'male', country: 'United States', countryCode: 'US', age: 30, gems: 5000,
        isOnline: true, isBanned: false, role: 'admin'
      });
    }
    
    const realAdmin = await Admin.findOne({ username: 'demo' });
    if (!realAdmin) {
      await Admin.create({
        id: 'demo_admin',
        username: 'demo',
        passwordHash: bcrypt.hashSync('demo123', 10),
        role: 'admin'
      });
    } else if (realAdmin.id !== 'demo_admin') {
      realAdmin.id = 'demo_admin';
      await realAdmin.save();
    }

    const st = await Settings.findOne({ type: 'admin_settings' });
    if (!st) {
      await Settings.create({
        type: 'admin_settings', guestLogin: true, phoneLogin: true, googleLogin: true,
        facebookLogin: true, appleLogin: true, twitterLogin: true,
        firebaseConfig: JSON.stringify({
          apiKey: "YOUR_FIREBASE_API_KEY",
          authDomain: "your-project-id.firebaseapp.com",
          projectId: "your-project-id",
          storageBucket: "your-project-id.appspot.com",
          messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
          appId: "YOUR_APP_ID",
          measurementId: "YOUR_MEASUREMENT_ID"
        }, null, 2),
        siteName: "VibeMatch", siteUrl: "https://vibematch.com", termsUrl: "https://vibematch.com/terms", privacyUrl: "https://vibematch.com/privacy", logoUrl: "/images/logo.png", faviconUrl: "/favicon.ico", demoMode: DEMO_MODE,
        seoTitle: "VibeMatch - Video Chat", seoDescription: "Meet new people worldwide.", seoKeywords: "video chat, dating, meet",
        smtpHost: "smtp.example.com", smtpPort: "587", smtpUser: "admin", smtpPass: "password",
        stripePublicKey: "", stripeSecretKey: "", paypalClientId: "",
        maxLoginAttempts: 5, sessionTimeoutMins: 60
      });
    }
  } catch (e) {
    console.error("DB Seeding error:", e);
  }
}

// Attempt MongoDB Connection
async function connectDB() {
  try {
    mongoose.set('strictQuery', false);
    await mongoose.connect(MONGODB_URI, {
      serverSelectionTimeoutMS: 15000,
    });
    isMongoConnected = true;
    console.log('Successfully connected to MongoDB server!');
    // await seedDB();
  } catch (err: any) {
    isMongoConnected = false;
    console.warn('MongoDB connection failed or timed out. Check IP whitelist.', err.message);
  }
}



// Helper: JWT Sign / Verify
function generateToken(payload: object): string {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });
}

async function authMiddleware(req: any, res: any, next: any) {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Missing or invalid token' });
  }
  const token = authHeader.split(' ')[1];
  try {
    const decoded: any = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    if (!req.user.id && req.user.username) {
      try {
        const u = await User.findOne({ username: req.user.username }).select('id _id');
        if (u) {
          req.user.id = u.id || u._id.toString();
        }
      } catch (_) {}
    }
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Token expired or invalid' });
  }
}



async function sendPushNotification(userId: string, title: string, body: string, data: any = {}) {
  try {
    const user = await User.findOne({ id: userId });
    if (!user || !user.fcmToken) return;

    const settings: any = await Settings.findOne({ type: 'admin_settings' });
    if (!settings || !settings.firebaseServiceAccount || settings.firebaseServiceAccount.length < 10) return;

    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(JSON.parse(settings.firebaseServiceAccount))
      });
    }

    const message = {
      notification: { title, body },
      data: data,
      token: user.fcmToken
    };

    await admin.messaging().send(message);
  } catch (err) {
    console.error('Push Notification Error:', err);
  }
}


// File Upload Configuration
const storage = multer.diskStorage({
  destination: (req: any, file: any, cb: any) => {
    let dir = 'public/images/';
    if (file.fieldname === 'avatar') dir = 'public/images/users/';
    else if (file.fieldname === 'logo' || file.fieldname === 'favicon') dir = 'public/images/';
    else if (file.fieldname === 'giftImage') dir = 'public/images/gift/';
    else if (file.fieldname === 'video') dir = 'public/uploads/videos/';
    
    if (!fs.existsSync(dir)){
      fs.mkdirSync(dir, { recursive: true });
    }
    cb(null, dir);
  },
  filename: (req: any, file: any, cb: any) => {
    if (file.fieldname === 'logo') {
      cb(null, 'logo.png');
    } else if (file.fieldname === 'favicon') {
      const ext = path.extname(file.originalname);
      cb(null, `favicon${ext}`);
    } else {
      cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
    }
  }
});
const upload = multer({ 
  storage: storage,
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (file.fieldname === 'video') {
      if (ext !== '.mp4' && ext !== '.webm' && ext !== '.mkv' && ext !== '.mov') {
        return cb(new Error('Only videos are allowed for video field'));
      }
    } else if (file.fieldname === 'backup') {
        if (ext !== '.zip') return cb(new Error('Only ZIP backups are allowed'));
    } else {
      if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg' && ext !== '.gif' && ext !== '.webp' && ext !== '.ico' && ext !== '.svg') {
        return cb(new Error('Only images are allowed'));
      }
    }
    cb(null, true);
  },
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB limit
});

export { generateToken, sendPurchaseEmail, 
  authMiddleware, upload, transporter, sendSystemEmail, sendPushNotification, JWT_SECRET, DEMO_MODE, isMongoConnected, connectDB, seedDB
};
