import mongoose from 'mongoose';
import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import Stripe from 'stripe';
import Razorpay from 'razorpay';
import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

export default function setup(app: any, io: any, models: any, helpers: any) {
  const { User, Gift, History, Message, Report, ContactMessage, Notification, Settings, Purchase, Pack, VipPlan, Admin, Page } = models;
  const { authMiddleware, upload, sendSystemEmail, sendPushNotification, JWT_SECRET, DEMO_MODE } = helpers;
  
  // Discover endpoint for frontend grid
app.get('/api/discover', async (req: any, res: any) => {
  try {
    const settings: any = await Settings.findOne({ type: 'admin_settings' }).lean();
    const mode = settings?.discoverGridUsers || 'demo_only';
    
    let query: any = {};
    if (mode === 'demo_only') {
      query = { isDemo: true };
    } else if (mode === 'real_only') {
      query = { $or: [{ isDemo: false }, { isDemo: { $exists: false } }] };
    } else if (mode === 'real_no_guest') {
      query = { 
        $or: [{ isDemo: false }, { isDemo: { $exists: false } }],
        name: { $not: /^Guest /i }
      };
    } else if (mode === 'all') {
      query = {}; // all users
    }
    
    const users = await User.find(query).limit(50).lean();
    for (let i = users.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [users[i], users[j]] = [users[j], users[i]];
    }
    res.json({ users: users.slice(0, 24) });
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch discover users' });
  }
});

// GET OVERVIEW METRICS
  app.get('/api/admin/metrics', authMiddleware, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin' && req.user.username !== 'demo') return res.status(403).json({ error: 'Forbidden' });
      
      const { period = 'today' } = req.query;
      let dateFilter: any = {};
      const now = new Date();
      let start = new Date(now);
      let end = new Date(now);
      
      let isHourly = false;
      let timeFormat = '%H'; // for aggregation

      switch(period) {
        case 'today':
          start.setHours(0,0,0,0);
          dateFilter = { $gte: start };
          isHourly = true;
          break;
        case 'yesterday':
          start.setDate(start.getDate() - 1);
          start.setHours(0,0,0,0);
          end = new Date(start);
          end.setHours(23,59,59,999);
          dateFilter = { $gte: start, $lte: end };
          isHourly = true;
          break;
        case '7days':
          start.setDate(start.getDate() - 7);
          dateFilter = { $gte: start };
          timeFormat = '%Y-%m-%d';
          break;
        case '1month':
          start.setMonth(start.getMonth() - 1);
          dateFilter = { $gte: start };
          timeFormat = '%Y-%m-%d';
          break;
        case '3months':
          start.setMonth(start.getMonth() - 3);
          dateFilter = { $gte: start };
          timeFormat = '%Y-%m';
          break;
        case '1year':
          start.setFullYear(start.getFullYear() - 1);
          dateFilter = { $gte: start };
          timeFormat = '%Y-%m';
          break;
        case 'alltime':
        default:
          dateFilter = null;
          timeFormat = '%Y-%m';
          break;
      }

      const usersQuery = dateFilter ? { createdAt: dateFilter } : {};
      const historyQuery = dateFilter ? { timestamp: dateFilter } : {};
      const messageQuery = dateFilter ? { timestamp: dateFilter } : {};
      const purchaseQuery = dateFilter ? { createdAt: dateFilter } : {};

      const activeUsers = await User.countDocuments(usersQuery);
      const matchSessions = await History.countDocuments({ ...historyQuery, type: 'video_chat' });
      const messagesSent = await Message.countDocuments(messageQuery);
      const giftMessages = await Message.find({ ...messageQuery, isGift: true }).lean();
      const giftsSent = giftMessages.length;
      const gemsSpent = giftMessages.reduce((acc, m: any) => acc + (m.giftAmount || 0), 0);
      const activeVips = await User.countDocuments({ vipExpiry: { $gt: new Date() } });

      // Financials
      const purchases = await Purchase.find({ ...purchaseQuery, status: 'completed' }).lean();
      const totalRevenue = purchases.reduce((acc, p: any) => acc + (p.amount || 0), 0);
      const totalPurchases = purchases.length;

      // Gender distribution
      const genderAgg = await User.aggregate([
        { $match: usersQuery },
        { $group: { _id: '$gender', count: { $sum: 1 } } }
      ]);
      const genderDistribution = {
        male: genderAgg.find(g => g._id === 'male')?.count || 0,
        female: genderAgg.find(g => g._id === 'female')?.count || 0
      };

      // Top Countries
      const countryAgg = await User.aggregate([
        { $match: usersQuery },
        { $group: { _id: '$country', count: { $sum: 1 } } },
        { $sort: { count: -1 } },
        { $limit: 5 }
      ]);

      // Timeline / Chart Data
      const chartAgg = await User.aggregate([
        { $match: usersQuery },
        { $group: { 
            _id: { $dateToString: { format: timeFormat, date: '$createdAt' } },
            users: { $sum: 1 }
        }}
      ]);
      const matchAgg = await History.aggregate([
        { $match: { ...historyQuery, type: 'video_chat' } },
        { $group: { 
            _id: { $dateToString: { format: timeFormat, date: '$timestamp' } },
            matches: { $sum: 1 }
        }}
      ]);
      const messageAgg = await Message.aggregate([
        { $match: messageQuery },
        { $group: { 
            _id: { $dateToString: { format: timeFormat, date: '$timestamp' } },
            messages: { $sum: 1 }
        }}
      ]);

      // Merge timelines
      let chartData: any[] = [];
      if (isHourly) {
        for (let i = 0; i < 24; i++) {
          const hr = i.toString().padStart(2, '0');
          chartData.push({ label: hr + 'h', users: 0, matches: 0, messages: 0 });
        }
      } else {
        const keys = new Set([...chartAgg.map(i=>i._id), ...matchAgg.map(i=>i._id), ...messageAgg.map(i=>i._id)]);
        const sortedKeys = Array.from(keys).sort();
        chartData = sortedKeys.map(k => ({ label: k, users: 0, matches: 0, messages: 0 }));
      }

      const applyToChart = (agg: any[], field: string) => {
        agg.forEach(item => {
          if (!item._id) return;
          if (isHourly) {
            const hrIndex = parseInt(item._id, 10);
            if (chartData[hrIndex]) chartData[hrIndex][field] = item[field];
          } else {
            const entry = chartData.find(c => c.label === item._id);
            if (entry) entry[field] = item[field];
          }
        });
      };
      applyToChart(chartAgg, 'users');
      applyToChart(matchAgg, 'matches');
      applyToChart(messageAgg, 'messages');

      res.json({
        activeUsers, matchSessions, messagesSent, giftsSent, gemsSpent, activeVips,
        totalRevenue, totalPurchases, genderDistribution,
        topCountries: countryAgg.map(c => ({ country: c._id || 'Unknown', count: c.count })),
        chartData
      });
    } catch (error) {
      console.error('Metrics Error:', error);
      res.status(500).json({ error: 'Failed to fetch metrics' });
    }
  });

  // GET BACKUP
app.get('/api/admin/backup', authMiddleware, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'admin' && req.user.username !== 'demo') return res.status(403).json({ error: 'Forbidden' });
    const backupData = {
      users: await User.find().lean(),
      gifts: await Gift.find().lean(),
      histories: await History.find().lean(),
      messages: await Message.find().lean(),
      reports: await Report.find().lean(),
      contactMessages: await ContactMessage.find().lean(),
      notifications: await Notification.find().lean(),
      settings: await Settings.find().lean(),
      purchases: await Purchase.find().lean(),
      packs: await Pack.find().lean(),
      vipPlans: await VipPlan.find().lean(),
      admins: await Admin.find().lean()
    };
    res.json(backupData);
  } catch (error) {
    res.status(500).json({ error: 'Failed to generate backup' });
  }
});

// POST BACKUP (RESTORE)
app.post('/api/admin/backup', authMiddleware, upload.single('backup'), async (req: any, res: any) => {
  try {
    if (req.user.role !== 'admin' && req.user.username !== 'demo') return res.status(403).json({ error: 'Forbidden' });
    if (!req.file) return res.status(400).json({ error: 'No backup file provided' });
    
    const fileContent = fs.readFileSync(req.file.path, 'utf8');
    const backupData = JSON.parse(fileContent);

    if (backupData.users) { await User.deleteMany({}); await User.insertMany(backupData.users); }
    if (backupData.gifts) { await Gift.deleteMany({}); await Gift.insertMany(backupData.gifts); }
    if (backupData.histories) { await History.deleteMany({}); await History.insertMany(backupData.histories); }
    if (backupData.messages) { await Message.deleteMany({}); await Message.insertMany(backupData.messages); }
    if (backupData.reports) { await Report.deleteMany({}); await Report.insertMany(backupData.reports); }
    if (backupData.contactMessages) { await ContactMessage.deleteMany({}); await ContactMessage.insertMany(backupData.contactMessages); }
    if (backupData.notifications) { await Notification.deleteMany({}); await Notification.insertMany(backupData.notifications); }
    if (backupData.settings) { await Settings.deleteMany({}); await Settings.insertMany(backupData.settings); }
    if (backupData.purchases) { await Purchase.deleteMany({}); await Purchase.insertMany(backupData.purchases); }
    if (backupData.packs) { await Pack.deleteMany({}); await Pack.insertMany(backupData.packs); }
    if (backupData.vipPlans) { await VipPlan.deleteMany({}); await VipPlan.insertMany(backupData.vipPlans); }
    
    fs.unlinkSync(req.file.path);
    res.json({ success: true, message: 'Restore completed' });
    } catch (error) {
    console.error('Backup import error:', error);
    res.status(500).json({ error: 'Failed to restore backup' });
  }
});

app.post('/api/admin/settings/test-storage', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin' && req.user.username !== 'demo') return res.status(403).json({ error: 'Forbidden' });
  
  const { provider, config } = req.body;
  
  // Simulate a connection test delay
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  // Validate basic required fields
  let valid = false;
  if (provider === 'local') valid = true;
  else if (provider === 'digitalocean' && config.doEndpoint && config.doAccessKey) valid = true;
  else if (provider === 's3' && config.s3Region && config.s3Bucket) valid = true;
  else if (provider === 'gcp' && config.gcpProjectId && config.gcpBucket) valid = true;
  else if (provider === 'backblaze' && config.b2Endpoint && config.b2Bucket) valid = true;
  else if (provider === 'bunny' && config.bunnyStorageZone) valid = true;

  if (valid) {
    return res.json({ success: true, message: 'Connection tested successfully.' });
  } else {
    return res.status(400).json({ success: false, error: 'Missing required configuration fields or connection failed.' });
  }
});

app.post('/api/admin/demo-users', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { name, gender, age, country, countryCode, videoUrl, isOnline, avatar, likesCount } = req.body;
    const demoId = 'demo_' + Math.random().toString(36).substring(2, 9);
    const demoUser = new User({
      id: demoId,
      username: demoId,
      name,
      gender,
      age: parseInt(age) || 18,
      country,
      countryCode: countryCode || '',
      videoUrl,
      isOnline: isOnline !== undefined ? isOnline : true,
      avatar: avatar || (gender === 'female' ? '/images/avatars/female-1.svg' : '/images/avatars/male-1.svg'),
      isDemo: true,
      role: 'user',
      gems: 0,
      likesCount: likesCount !== undefined ? Number(likesCount) : Math.floor(Math.random() * 500)
    });
    await demoUser.save();
    res.json({ success: true, user: demoUser });
  } catch (err) {
    res.status(500).json({ error: 'Failed to create demo user' });
  }
});

app.put('/api/admin/demo-users/:userId', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const demoUser = await User.findOne({ id: req.params.userId, isDemo: true });
    if (demoUser) {
      const { name, gender, age, country, countryCode, videoUrl, isOnline, avatar, likesCount } = req.body;
      if (name !== undefined) demoUser.name = name;
      if (gender !== undefined) demoUser.gender = gender;
      if (age !== undefined) demoUser.age = parseInt(age);
      if (country !== undefined) demoUser.country = country;
      if (countryCode !== undefined) demoUser.countryCode = countryCode;
      if (videoUrl !== undefined) demoUser.videoUrl = videoUrl;
      if (isOnline !== undefined) demoUser.isOnline = isOnline;
      if (avatar !== undefined) demoUser.avatar = avatar;
      if (likesCount !== undefined) demoUser.likesCount = Number(likesCount);
      
      await demoUser.save();
      return res.json({ success: true, user: demoUser });
    }
    res.status(404).json({ error: 'Demo user not found' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.delete('/api/admin/demo-users/:userId', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const demoUser = await User.findOne({ id: req.params.userId, isDemo: true });
    if (demoUser) {
      if (demoUser.avatar && demoUser.avatar.startsWith('/images/users/')) {
        const oldPath = path.join(process.cwd(), 'public', demoUser.avatar);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      await User.deleteOne({ id: req.params.userId, isDemo: true });
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'Demo user not found' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

app.get('/api/admin/settings', async (req: any, res: any) => {
  try {
    const st: any = await Settings.findOne({ type: 'admin_settings' }).lean();
    if (!st) {
      return res.json({ settings: { siteName: "VibeMatch", logoUrl: "", termsUrl: "#", privacyUrl: "#", demoMode: process.env.DEMO_MODE === 'true' } });
    }

    let isAdmin = false;
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded: any = jwt.verify(token, JWT_SECRET);
        if (decoded && (decoded.role === 'admin' || decoded.username === 'demo')) {
          isAdmin = true;
        }
      } catch (_) {}
    }

          if (!isAdmin) {
        // Core Secrets
        delete st.smtpPass;
        delete st.smtpUser;
        delete st.firebaseServiceAccount;
        delete st.recaptchaSecretKey;
        delete st.licenseKey;
        delete st.envatoPurchaseCode;
        // Payment Secrets
        delete st.stripeSecretKey;
        delete st.paypalSecret;
        delete st.razorpayKeySecret;
        delete st.flutterwaveSecretKey;
        delete st.cashfreeSecretKey;
        delete st.payuMerchantSalt;
        delete st.phonepeSaltKey;
        // API & Storage Secrets
        delete st.twilioAuthToken;
        delete st.meteredApiKey;
        delete st.xirsysSecret;
        delete st.doSecretKey;
        delete st.s3SecretKey;
        delete st.gcpPrivateKey;
        delete st.b2AppKey;
        delete st.bunnyAccessKey;
      }

    res.json({ settings: st });
  } catch (err) {
    res.json({ settings: { siteName: "VibeMatch", logoUrl: "?", termsUrl: "#", privacyUrl: "#", demoMode: process.env.DEMO_MODE === 'true' } });
  }
});

app.post('/api/admin/settings', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  let st = await Settings.findOne({ type: 'admin_settings' });
  
  if (!st) {
    // Create new document if it doesn't exist
    st = new Settings({ type: 'admin_settings',  guestLogin: true, googleLogin: true, facebookLogin: true, appleLogin: true, twitterLogin: true, phoneLogin: true , templateWelcome: `<div style="background-color: #0F172A; color: #ffffff; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; padding: 40px 20px; text-align: center;">
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
</div>`});
  }

  console.log("RECEIVED SETTINGS:", req.body);

  const { logoUrl, faviconUrl } = req.body;
  
  if (logoUrl && logoUrl !== st.logoUrl && st.logoUrl?.startsWith('/images/')) {
    const oldPath = path.join(process.cwd(), 'public', st.logoUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }
  if (faviconUrl && faviconUrl !== st.faviconUrl && st.faviconUrl?.startsWith('/')) {
    const oldPath = path.join(process.cwd(), 'public', st.faviconUrl);
    if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
  }

  // Prevent Mongoose from ignoring the update if _id or __v are present
  delete req.body._id;
  delete req.body.__v;

  // Remove any garbage keys that might have been added previously
  delete req.body['[object Object]'];

  // Update settings with the provided payload reliably
  await Settings.updateOne({ type: 'admin_settings' }, { $set: req.body, $unset: { '[object Object]': 1 } });
  
  st = await Settings.findOne({ type: 'admin_settings' });

  res.json({ success: true, settings: st });
});

app.post('/api/users/upload', authMiddleware, upload.single('avatar'), async (req: any, res: any) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    const publicPath = `/images/users/${req.file.filename}`;
    const user = await User.findOne({ id: req.user.id });
    if (user && user.avatar && user.avatar.startsWith('/images/users/')) {
      const oldPath = path.join(process.cwd(), 'public', user.avatar);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }
    res.json({ success: true, url: `${publicPath}?v=${Date.now()}` });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: 'Upload failed' });
  }
});

app.post('/api/admin/upload', authMiddleware, upload.any(), (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No file uploaded' });

  const file = req.files[0];
  // Generate public URL
  let publicPath = `/images/${file.filename}`;
  if (file.fieldname === 'favicon') {
    publicPath = `/${file.filename}?v=${Date.now()}`;
  } else if (file.fieldname === 'avatar') {
    publicPath = `/images/users/${file.filename}`;
  } else if (file.fieldname === 'logo') {
    publicPath = `/images/${file.filename}?v=${Date.now()}`;
  } else if (file.fieldname === 'video') {
    publicPath = `/uploads/videos/${file.filename}`;
  }

  res.json({ success: true, url: publicPath });
});



  
  // MOBILE API INIT
  app.get('/api/init', async (req: any, res: any) => {
    try {
      const settings = await Settings.findOne({ type: 'admin_settings' });
      const apiKey = req.headers['x-api-key'];
      
      // Check API Access Key
      if (settings?.mobileApiAccessKey && apiKey !== settings.mobileApiAccessKey) {
        return res.status(403).json({ error: 'Invalid API Key' });
      }

      const safeSettings = settings ? (settings.toObject ? settings.toObject() : { ...settings }) : {};
      delete safeSettings.stripeSecretKey;
      delete safeSettings.smtpPass;
      delete safeSettings.smtpUser;
      delete safeSettings.firebaseServiceAccount;
      delete safeSettings.razorpayKeySecret;
      delete safeSettings.recaptchaSecretKey;
      delete safeSettings.licenseKey;
      delete safeSettings.envatoPurchaseCode;
      delete safeSettings.mobileApiAccessKey;

      res.json({ settings: safeSettings });
    } catch (err) {
      res.status(500).json({ error: 'Failed to initialize app' });
    }
  });


  // --- CUSTOM PAGES (PUBLIC) ---
  app.get('/api/pages', async (req: any, res: any) => {
    try {
      const pages = await Page.find({ isActive: true, showInFooter: true }).select('title slug').sort({ createdAt: 1 });
      res.json({ pages });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch pages' });
    }
  });

  app.get('/api/pages/:slug', async (req: any, res: any) => {
    try {
      const page = await Page.findOne({ slug: req.params.slug, isActive: true });
      if (!page) return res.status(404).json({ error: 'Page not found' });
      res.json({ page });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch page' });
    }
  });
}
