import mongoose from 'mongoose';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import fs from 'fs';
import https from 'https';
import path from 'path';

export default function setup(app: any, io: any, models: any, helpers: any) {
  const { User, Gift, History, Message, Report, ContactMessage, Notification, Settings, Purchase, Pack, VipPlan, Admin, Page } = models;
  const { generateToken, authMiddleware, upload, sendSystemEmail, sendPushNotification, JWT_SECRET, DEMO_MODE } = helpers;
  
  // REST API ROUTES

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    mongoConnected: mongoose.connection.readyState === 1,
    demoMode: DEMO_MODE,
    timestamp: new Date().toISOString()
  });
});


// ==========================================
// INSTALLER API ROUTES
// ==========================================

app.get('/api/install/status', async (req, res) => {
  try {
    let dbName = null;
    if (mongoose.connection.readyState === 1) {
      dbName = mongoose.connection.name;
    } else if (process.env.MONGODB_URI) {
      const match = process.env.MONGODB_URI.match(/\/([^/?]+)(\?|$)/);
      if (match) dbName = match[1];
    }

    console.log('ReadyState:', mongoose.connection.readyState); if (mongoose.connection.readyState !== 1) {
      return res.json({ installed: false, error: 'Database not connected', dbName });
    }
    const adminCount = await User.countDocuments({ role: 'admin' });
      // Setup English language by default if no languages exist
      const langCount = await Settings.countDocuments({ type: 'language' });
      if (langCount === 0) {
        await Settings.create({
          type: 'language',
          code: 'en',
          name: 'English',
          flag: 'us.svg',
          rtl: false,
          translations: {}
        });
      }

    const settings = await Settings.findOne({ type: 'admin_settings' });
    
    if (!settings) { await Settings.create({ type: 'admin_settings', siteName: 'VibeMatch', defaultLanguage: 'en', demoMode: false, guestLogin: true, googleLogin: true, facebookLogin: true, appleLogin: true, twitterLogin: true, phoneLogin: true , templateWelcome: `<div style="background-color: #0F172A; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; text-align: center;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #00E676; margin-bottom: 20px; font-size: 28px;">Welcome to VibeMatch!</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px;">
      Hi <strong>%nameuser%</strong>,
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 30px;">
      We're thrilled to have you join our community! Get ready to meet new people, make connections, and experience the best video chat platform.
    </p>
    <a href="https://vibematch.com" style="display: inline-block; background-color: #00E676; color: #000000; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px;">
      Start Chatting Now
    </a>
  </div>
</div>`, templatePurchase: `<div style="background-color: #0F172A; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; text-align: center;">
  <div style="max-width: 600px; margin: 0 auto; background-color: #1E293B; border-radius: 16px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);">
    <h1 style="color: #00E676; margin-bottom: 20px; font-size: 28px;">Payment Successful!</h1>
    <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 20px;">
      Hi <strong>%nameuser%</strong>,
    </p>
    <p style="font-size: 16px; line-height: 1.6; color: #cbd5e1; margin-bottom: 10px;">
      Thank you for your purchase. We've successfully processed your payment for <strong style="color: #00E676;">%packname%</strong>.
    </p>
    <a href="https://vibematch.com" style="display: inline-block; background-color: #00E676; color: #000000; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none; font-size: 16px;">
      Return to App
    </a>
  </div>
</div>`}); } if (adminCount === 0) {
      return res.json({ installed: false, error: 'No admin or settings found', dbName });
    }
    
    
    // Setup default pages
    const ppCount = await Page.countDocuments({ slug: 'privacy-policy' });
    if (ppCount === 0) {
      await Page.create({
        slug: 'privacy-policy',
        title: 'Privacy Policy',
        content: '<h2>Privacy Policy</h2><p>This is the generated privacy policy.</p>',
        showInFooter: true
      });
    }

    const tosCount = await Page.countDocuments({ slug: 'terms-of-service' });
    if (tosCount === 0) {
      await Page.create({
        slug: 'terms-of-service',
        title: 'Terms of Service',
        content: '<h2>Terms of Service</h2><p>This is the generated terms of service.</p>',
        showInFooter: true
      });
    }

      res.json({ installed: true, dbName });
  } catch (err) {
    console.error('Install check error:', err); res.json({ installed: false, error: err.message });
  }
});

app.post('/api/install/verify-license', async (req, res) => {
  try {
    const { purchaseCode, domain } = req.body;
    
    // Proxy request to DevSnaplix API to avoid CORS issues
    const response = await fetch('https://devsnaplix-api.gadohost.com/api/verify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseCode, domain })
    });
    
    const data = await response.json();
    res.status(response.status).json(data);
  } catch (err) {
    console.error('License verification proxy error:', err);
    res.status(500).json({ success: false, error: 'Failed to contact license server.' });
  }
});

app.post('/api/install/test-db', async (req, res) => {
  try {
    const uri = process.env.MONGODB_URI;
    if (!uri) return res.status(400).json({ success: false, error: 'Missing MONGODB_URI in .env file' });
    
    if (mongoose.connection.readyState === 1) {
      return res.json({ success: true, message: 'Connection successful!' });
    }

    const testConn = await mongoose.createConnection(uri, {
      serverSelectionTimeoutMS: 5000,
    }).asPromise();
    
    await testConn.close();
    res.json({ success: true, message: 'Connection successful!' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

app.post('/api/install/finalize', async (req, res) => {
  try {
    const { adminUsername, adminEmail, adminPassword, siteName, siteUrl, licenseKey, purchaseCode } = req.body;
    
    if (!adminUsername || !adminEmail || !adminPassword || !siteName || !siteUrl) {
      return res.status(400).json({ success: false, error: 'Missing required fields' });
    }

    const mongodbUri = process.env.MONGODB_URI;
    if (!mongodbUri) {
      return res.status(400).json({ success: false, error: 'MONGODB_URI not found in .env' });
    }

    // Connect if not already connected
    console.log('ReadyState:', mongoose.connection.readyState); if (mongoose.connection.readyState !== 1) {
      await mongoose.connect(mongodbUri);
    }

    // Security check: Prevent re-installing over an existing production setup
    const existingAdmin = await User.countDocuments({ role: 'admin' });
    const existingRealAdmin = await Admin.countDocuments();
    if (existingAdmin > 0 || existingRealAdmin > 0) {
      return res.status(403).json({ success: false, error: 'Application is already installed and protected.' });
    }
    
    // 3. Delete existing users to ensure clean slate for admin
    await User.deleteMany({});
    
    // 4. Create Admin User
    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    const adminUser = new User({
      id: `admin_${Date.now()}`,
      username: adminUsername,
      email: adminEmail,
      passwordHash: hashedPassword,
      role: 'admin',
      gems: 999999,
      country: 'Global',
      gender: 'other',
      createdAt: new Date(),
    });
    await adminUser.save();
    
    // 5. Create / Update Settings
    await Settings.deleteMany({});
    const newSettings = new Settings({
      type: 'admin_settings',
      siteName: siteName,
      logoUrl: '',
      faviconUrl: 'V',
      seoTitle: siteName,
      seoDescription: '',
      seoKeywords: '',
      googleAnalyticsId: '',
      paypalClientId: '',
      paypalSecret: '',
      stripePublishableKey: '',
      stripeSecretKey: '',
      razorpayKeyId: '',
      razorpayKeySecret: '',
      defaultGemsForNewUser: 100,
      licenseKey: licenseKey,
      purchaseCode: purchaseCode,
      updatedAt: new Date()
    });
    await newSettings.save();
    
    res.json({ success: true, message: 'Installation successful!' });
  } catch (err) {
    console.error('Installation error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// Auth Login

app.post('/api/auth/fcm-token', authMiddleware, async (req: any, res: any) => {
  try {
    const { token } = req.body;
    if (token && req.user) {
      await User.findOneAndUpdate({ id: req.user.id }, { fcmToken: token });
      return res.json({ success: true });
    }
    res.status(400).json({ error: 'Token required' });
  } catch (err) {
    res.status(500).json({ error: 'Failed to save FCM token' });
  }
});


  app.post('/api/auth/guest', async (req, res) => {
    try {
      const uid = 'guest_' + Math.random().toString(36).substring(2, 9);
      const name = 'Guest ' + uid.substring(6, 11);
      
      let user = await User.findOne({ username: uid });
      if (!user) {
        user = new User({
          id: uid,
          username: uid,
          name: name,
          email: uid + '@guest.vibematch.com',
          avatar: `https://api.dicebear.com/9.x/avataaars/png?seed=${uid}`,
          gender: 'other',
          interests: ['Chat', 'Fun']
        });
        await user.save();
      }

      const token = generateToken({ id: user.id || uid, username: user.username, role: user.role });
      const userObj = user.toObject();
      userObj.id = user.id || uid;
      
      res.json({ token, user: userObj, isNewUser: true });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Guest login failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
  try {
    const { username, password, extraData } = req.body;
    if (!username || !password) return res.status(400).json({ error: 'Username and password required' });

    const normalizedUsername = username.toLowerCase().replace(/[^a-z0-9_]/g, '_').substring(0, 20);

    // Handle Social Avatar Download Helper
    const downloadAvatar = async (url: string, userId: string) => {
      return new Promise<string>((resolve) => {
        const dest = path.join(process.cwd(), 'public', 'images', 'users');
        if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
        const fileName = `avatar-${userId}-${Date.now()}.jpg`;
        const filePath = path.join(dest, fileName);
        const fileStream = fs.createWriteStream(filePath);
        https.get(url, (response) => {
          response.pipe(fileStream);
          fileStream.on('finish', () => resolve(`/images/users/${fileName}`));
        }).on('error', () => {
          fs.unlink(filePath, () => {}); // Delete the file async
          resolve(url); // fallback to external url
        });
      });
    };

    let adminUser = await Admin.findOne({ username: normalizedUsername });
    if (adminUser) {
      if (bcrypt.compareSync(password, adminUser.passwordHash as string)) {
        const token = generateToken({ id: adminUser.id, username: adminUser.username, role: adminUser.role });
        const adminObj = adminUser.toObject();
        delete adminObj.passwordHash;
        return res.json({ token, user: adminObj });
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    let user = await User.findOne({ $or: [{ username: normalizedUsername }, { email: username }] });
    
    if (user) {
      if (bcrypt.compareSync(password, user.passwordHash as string)) {
        // Update avatar if social login provided a new one and we didn't have a local one, or if it changed
        if (extraData?.avatar && extraData.avatar !== user.avatar && extraData.avatar.startsWith('http')) {
          const localAvatar = await downloadAvatar(extraData.avatar, user.id);
          // Delete old avatar if it was local
          if (user.avatar?.startsWith('/images/users/')) {
            const oldPath = path.join(process.cwd(), 'public', user.avatar);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
          }
          user.avatar = localAvatar;
          await user.save();
        }

        const token = generateToken({ id: user.id, username: user.username, role: user.role });
        const userObj = user.toObject();
        delete userObj.passwordHash;
        return res.json({ token, user: userObj });
      } else {
        return res.status(401).json({ error: 'Invalid credentials' });
      }
    }

    // Auto-create guest or new user
    let domain = 'vibematch.com';
    let st: any = null;
    try {
      st = await Settings.findOne({ type: 'admin_settings' });
      if (st && st.siteUrl) {
        try {
          domain = new URL(st.siteUrl).hostname;
        } catch (e) {
          domain = st.siteUrl.replace(/^https?:\/\//, '').split('/')[0];
        }
      }
    } catch (e) {}

    const newId = `${Date.now()}`;
    let gender = extraData?.gender || 'female';
    let country = 'United States';
    let countryCode = 'US';

    let avatarUrl = extraData?.avatar;
    if (!avatarUrl) {
       const randomAvatarNum = Math.floor(Math.random() * 10) + 1;
       avatarUrl = `/images/avatars/${gender}-${randomAvatarNum}.svg`;
    }
    
    if (extraData?.avatar && extraData.avatar.startsWith('http') && !extraData.avatar.includes('dicebear')) {
       avatarUrl = await downloadAvatar(extraData.avatar, newId);
    }

    try {
      let ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
      
      // For local testing, use a Moroccan IP instead of localhost
      if (!ip || ip === '::1' || ip === '127.0.0.1' || ip.includes('127.0.0.1') || ip === '::ffff:127.0.0.1') {
        ip = '105.154.0.1'; // Example Moroccan IP
      }

      if (ip) {
        if (Array.isArray(ip)) ip = ip[0];
        if (ip.includes(',')) ip = ip.split(',')[0].trim();
        if (ip.length > 5) {
          const fetchIP = () => new Promise<any>((resolve) => {
            const http = require('http');
            http.get(`http://ip-api.com/json/${ip}?fields=status,country,countryCode`, (res: any) => {
              let data = '';
              res.on('data', (chunk: any) => data += chunk);
              res.on('end', () => resolve(JSON.parse(data)));
            }).on('error', () => resolve(null));
          });
          const geoData = await fetchIP();
          if (geoData && geoData.status === 'success') {
            country = geoData.country || country;
            countryCode = geoData.countryCode || countryCode;
          }
        }
      }
    } catch (e) {
      console.log('IP Geolocation failed');
    }

    const newUser = await User.create({
      id: newId,
      username: normalizedUsername,
      name: extraData?.name || (username.charAt(0).toUpperCase() + username.slice(1)),
      email: extraData?.email || `${normalizedUsername}@${domain}`,
      passwordHash: bcrypt.hashSync(password, 10),
      avatar: avatarUrl,
      gender: gender,
      country: country,
      countryCode: countryCode,
      age: 22,
      gems: st?.bonusGems !== undefined ? st.bonusGems : 300,
      isOnline: true,
      role: 'user'
    });

    const token = generateToken({ id: newUser.id, username: newUser.username, role: newUser.role });
    const userObj = newUser.toObject();
    delete userObj.passwordHash;

    // Send Welcome Email if configured and not a guest
    if (!newUser.name.toLowerCase().startsWith('guest')) {
      const settings = await Settings.findOne({ type: 'admin_settings' });
      if (settings && (settings as any).templateWelcome) {
        const welcomeHtml = (settings as any).templateWelcome.replace(/%nameuser%/g, newUser.name);
        sendSystemEmail(newUser.email, 'Welcome to VibeMatch!', welcomeHtml); // Background send
      }
    }

    return res.json({ token, user: userObj, isNewUser: true });
  } catch (e: any) {
    res.status(500).json({ error: e.message });
  }
});

app.get('/api/webrtc/ice-servers', async (req: any, res: any) => {
  try {
    const settings = await Settings.findOne({ type: 'admin_settings' });
    const provider = settings?.activeWebrtcProvider || 'default';

    if (provider === 'twilio' && settings?.twilioAccountSid && settings?.twilioAuthToken) {
      // Basic auth for Twilio REST API to generate ephemeral Network Traversal Service tokens
      const sid = settings.twilioAccountSid;
      const token = settings.twilioAuthToken;
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      
      const response = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Tokens.json`, {
        method: 'POST',
        headers: { 'Authorization': `Basic ${auth}` }
      });
      if (response.ok) {
        const data = await response.json();
        return res.json({ iceServers: data.ice_servers });
      }
    } else if (provider === 'metered' && settings?.meteredApiKey) {
      // Metered Video TURN API
      const response = await fetch(`https://${settings.meteredApiKey}.metered.live/api/v1/turn/credentials?apiKey=${settings.meteredApiKey}`);
      if (response.ok) {
        const data = await response.json();
        return res.json({ iceServers: data });
      }
    } else if (provider === 'xirsys' && settings?.xirsysDomain && settings?.xirsysSecret) {
      const auth = Buffer.from(`${settings.xirsysDomain}:${settings.xirsysSecret}`).toString('base64');
      const response = await fetch(`https://global.xirsys.net/_turn/MyFirstApp`, {
        method: 'PUT',
        headers: { 'Authorization': `Basic ${auth}` }
      });
      if (response.ok) {
        const data = await response.json();
        if (data.v && data.v.iceServers) {
          return res.json({ iceServers: [data.v.iceServers] });
        }
      }
    }

    // Default fallback (Google STUN only)
    return res.json({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
  } catch (error) {
    console.error('ICE Server fetch error:', error);
    return res.json({
      iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
    });
  }
});

app.get('/api/auth/me', authMiddleware, async (req: any, res: any) => {
  try {
    if (req.user.id === 'demo_admin') {
      return res.json({ user: { id: 'demo_admin', username: 'demo', role: 'admin' } });
    }
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json({ user: userObj });
  } catch (e) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.put('/api/users/me', authMiddleware, async (req: any, res: any) => {
  try {
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const allowedUpdates = ['name', 'username', 'avatar', 'bio', 'age', 'phone', 'address', 'gender', 'country', 'countryCode'];
    
    // Check if username is being updated and is valid
    if (req.body.username && req.body.username !== user.username) {
      const username = req.body.username.toLowerCase();
      if (!/^[a-z0-9_]{3,20}$/.test(username)) {
        return res.status(400).json({ error: 'Username must be 3-20 characters long and can only contain lowercase letters, numbers, and underscores.' });
      }
      const existingUser = await User.findOne({ username });
      if (existingUser) {
        return res.status(400).json({ error: 'Username is already taken' });
      }
      user.username = username;
    }

    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        (user as any)[field] = req.body[field];
      }
    });

    // Auto-update default avatar if gender changed and they are using a default one
    if (req.body.gender && user.avatar && user.avatar.startsWith('/images/avatars/')) {
       const randomAvatarNum = Math.floor(Math.random() * 10) + 1;
       user.avatar = `/images/avatars/${req.body.gender}-${randomAvatarNum}.svg`;
    }
    
    await user.save();
    const userObj = user.toObject();
    delete userObj.passwordHash;
    res.json({ success: true, user: userObj });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});


}
