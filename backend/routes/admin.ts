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

  // Demo Mode Protection Middleware
  app.use('/api/admin', (req, res, next) => {
    if (DEMO_MODE && ['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method)) {
      return res.status(403).json({ error: 'Demo Mode is enabled. Please disable it in .env to save changes.' });
    }
    next();
  });

  // LANGUAGES API
  const getLanguagesHandler = async (req: any, res: any) => {
    try {
      const languages = await Settings.find({ type: 'language' }).lean();
      res.json({ languages });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch languages' });
    }
  };
  app.get('/api/languages', getLanguagesHandler);
  app.get('/languages', getLanguagesHandler);

  app.post('/api/admin/languages', authMiddleware, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const { code, name, flag, rtl } = req.body;
      if (!code || !name) return res.status(400).json({ error: 'Code and name are required' });
      
      let lang = await Settings.findOne({ type: 'language', code });
      if (!lang) {
        await Settings.collection.insertOne({ type: 'language', code, name, flag, rtl: !!rtl, translations: {} });
      }
      
      const languages = await Settings.find({ type: 'language' }).lean();
      res.json({ success: true, languages });
    } catch (error) {
      res.status(500).json({ error: 'Failed to add language' });
    }
  });

  app.put('/api/admin/languages/:code', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const { translations } = req.body;
      const { code } = req.params;
      await Settings.updateOne({ type: 'language', code }, { $set: { translations } });
      const languages = await Settings.find({ type: 'language' }).lean();
      res.json({ success: true, languages });
    } catch (err) {
      res.status(500).json({ error: 'Failed to update language' });
    }
  });

  app.delete('/api/admin/languages/:code', authMiddleware, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      await Settings.deleteOne({ type: 'language', code: req.params.code });
      const languages = await Settings.find({ type: 'language' }).lean();
      res.json({ success: true, languages });
    } catch (error) {
      res.status(500).json({ error: 'Failed to delete language' });
    }
  });

  // ADMIN PROFILE APIS
  app.get('/api/admin/profile', authMiddleware, async (req: any, res: any) => {
    try {
      let user: any = await Admin.findOne({ id: req.user.id });
      if (!user) user = await User.findOne({ id: req.user.id });
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      res.json({
        name: user.name || '',
        username: user.username || '',
        email: user.email || '',
      });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.put('/api/admin/profile', authMiddleware, async (req: any, res: any) => {
    try {
      const { name, username, email, newPassword, oldPassword } = req.body;
      
      let user: any = await Admin.findOne({ id: req.user.id });
      if (!user) user = await User.findOne({ id: req.user.id });
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Unauthorized' });
      }
      
      if (!oldPassword) {
        return res.status(400).json({ error: 'Old password is required to save changes' });
      }
      
      const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: 'Incorrect old password' });
      }
      
      if (name) user.name = name;
      if (username) user.username = username;
      if (email) user.email = email;
      if (newPassword) {
        user.passwordHash = await bcrypt.hash(newPassword, 10);
      }
      
      await user.save();
      res.json({ success: true, message: 'Profile updated successfully' });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // ADMIN USERS APIS
  app.get('/api/admin/users', authMiddleware, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin' && req.user.username !== 'demo') return res.status(403).json({ error: 'Forbidden' });
      const users = await User.find({ isDemo: { $ne: true }, role: { $ne: 'admin' } });
      res.json({ users });
    } catch (e: any) {
      console.error('Error fetching admin users:', e.message);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/admin/users/:userId/gems', authMiddleware, async (req: any, res: any) => {
    try {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      const user = await User.findOne({ id: req.params.userId });
      if (user) {
        user.gems = (user.gems || 0) + Number(req.body.amount);
        await user.save();
        return res.json({ success: true, user });
      }
      res.status(404).json({ error: 'User not found' });
    } catch (e: any) {
      res.status(500).json({ error: 'Failed to add gems' });
    }
  });

  app.put('/api/admin/users/:userId', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const user = await User.findOne({ id: req.params.userId });
    if (user) {
      const { name, email, avatar, phone, address } = req.body;
      
      if (avatar && avatar !== user.avatar && user.avatar?.startsWith('/images/users/')) {
         const oldPath = path.join(process.cwd(), 'public', user.avatar);
         if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }

      if (name !== undefined) user.name = name;
      if (email !== undefined) user.email = email;
      if (avatar !== undefined) user.avatar = avatar;
      if (phone !== undefined) user.phone = phone;
      if (address !== undefined) user.address = address;
      
      await user.save();
      return res.json({ success: true, user });
    }
    res.status(404).json({ error: 'User not found' });
  });

  app.delete('/api/admin/users/:userId', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const user = await User.findOne({ id: req.params.userId });
    if (user) {
      if (user.avatar?.startsWith('/images/users/')) {
         const oldPath = path.join(process.cwd(), 'public', user.avatar);
         if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      await User.deleteOne({ id: req.params.userId });
      return res.json({ success: true });
    }
    res.status(404).json({ error: 'User not found' });
  });

  app.post('/api/admin/users/:userId/toggle-ban', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const user = await User.findOne({ id: req.params.userId });
    if (user) {
      user.isBanned = !user.isBanned;
      await user.save();
      return res.json({ success: true, user });
    }
    res.status(404).json({ error: 'User not found' });
  });

  // REPORTS APIS
  app.get('/api/admin/reports', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const reports = await Report.find().sort({ timestamp: -1 }).lean();
    for (let r of reports) {
      if (r.reporterId && r.reporterId !== 'guest') {
         const u = await User.findOne({ id: r.reporterId }).lean();
         r.reporterName = u ? (u.name || u.username) : 'Deleted User';
      } else {
         r.reporterName = 'Guest';
      }
    }
    res.json({ reports });
  });

  app.delete('/api/admin/reports/:reportId', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    await Report.deleteOne({ id: req.params.reportId });
    res.json({ success: true });
  });

  app.post('/api/admin/reports/:reportId/status', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const rep = await Report.findOne({ id: req.params.reportId });
    if (rep) {
      rep.status = req.body.status;
      await rep.save();
      return res.json({ success: true, report: rep });
    }
    res.status(404).json({ error: 'Report not found' });
  });

  // Mailbox / Contact endpoints
  app.get('/api/settings/public', async (req: any, res: any) => {
    try {
      const st = await Settings.findOne({ type: 'admin_settings' }).lean() || {};
      res.json({
        enableRecaptcha: st.enableRecaptcha,
        recaptchaVersion: st.recaptchaVersion || 'v3',
        recaptchaSiteKey: st.recaptchaSiteKey
      });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch settings' });
    }
  });

  app.post('/api/contact', async (req: any, res: any) => {
    try {
      const { name, email, message, userId, recaptchaToken } = req.body;
      if (!name || !email || !message) return res.status(400).json({ error: 'Missing required fields' });

      const settings = await Settings.findOne({ type: 'admin_settings' });
      if (settings && settings.enableRecaptcha && settings.recaptchaSecretKey) {
        if (!recaptchaToken) {
          return res.status(400).json({ error: 'Please complete the reCAPTCHA verification' });
        }
        try {
          const verifyRes = await fetch('https://www.google.com/recaptcha/api/siteverify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: `secret=${settings.recaptchaSecretKey}&response=${recaptchaToken}`
          });
          const verifyData = await verifyRes.json();
          if (!verifyData.success) {
            return res.status(400).json({ error: 'reCAPTCHA verification failed. Please try again.' });
          }
        } catch (e) {
          return res.status(500).json({ error: 'reCAPTCHA verification service error.' });
        }
      }
      const contactMsg = new ContactMessage({
        id: Math.random().toString(36).substring(2, 9),
        name, email, message, userId,
        status: 'unread'
      });
      await contactMsg.save();
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Failed to send message' });
    }
  });

  app.get('/api/admin/mailbox', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const messages = await ContactMessage.find().sort({ timestamp: -1 });
      res.json({ messages });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/admin/mailbox/:messageId/status', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const msg = await ContactMessage.findOne({ id: req.params.messageId });
      if (msg) {
        msg.status = req.body.status;
        await msg.save();
        return res.json({ success: true, message: msg });
      }
      res.status(404).json({ error: 'Message not found' });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  app.delete('/api/admin/mailbox/:messageId', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      await ContactMessage.deleteOne({ id: req.params.messageId });
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: 'Server error' });
    }
  });

  // --- CUSTOM PAGES ---
  app.get('/api/admin/pages', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const pages = await Page.find().sort({ createdAt: -1 });
      res.json({ pages });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch pages' });
    }
  });

  app.post('/api/admin/pages', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const { title, slug, content, showInFooter, isActive } = req.body;
      const page = new Page({ title, slug, content, showInFooter, isActive });
      await page.save();
      res.json({ success: true, page });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.put('/api/admin/pages/:id', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const { title, slug, content, showInFooter, isActive } = req.body;
      const page = await Page.findByIdAndUpdate(req.params.id, { title, slug, content, showInFooter, isActive, updatedAt: Date.now() }, { new: true });
      res.json({ success: true, page });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });

  app.delete('/api/admin/pages/:id', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      await Page.findByIdAndDelete(req.params.id);
      res.json({ success: true });
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
}
