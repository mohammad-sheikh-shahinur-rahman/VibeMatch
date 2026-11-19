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
  const { User, Gift, History, Message, Report, ContactMessage, Notification, Settings, Purchase, Pack, VipPlan, Admin } = models;
  const { authMiddleware, upload, sendSystemEmail, sendPushNotification, JWT_SECRET, DEMO_MODE } = helpers;
  
  // Gifts (Public)
app.get('/api/gifts', async (req: any, res: any) => {
  try {
    const gifts = await Gift.find().sort({ createdAt: -1 });
    res.json({ gifts });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/gifts/send', authMiddleware, async (req: any, res: any) => {
  try {
    const { cost } = req.body;
    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    const parsedCost = Number(cost) || 0;
    if (user.gems < parsedCost) {
      return res.status(400).json({ error: 'Not enough gems' });
    }
    
    // user.gems -= parsedCost;
    // await user.save();
    // Deduction is now handled entirely by socket/message POST to prevent double charging.
    
    res.json({ success: true, gems: user.gems - parsedCost });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Admin Gifts Endpoints

app.delete('/api/admin/purchases/:id', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  if (DEMO_MODE) return res.status(403).json({ error: 'Action disabled in demo mode' });
  try {
    const purchase = await Purchase.findOne({ id: req.params.id });
    if (!purchase) return res.status(404).json({ error: 'Not found' });
    
    await Purchase.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/purchases', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const purchases = await Purchase.find().sort({ createdAt: -1 });
    res.json(purchases);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/purchases', authMiddleware, async (req: any, res: any) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    const { packId, packName, price, paymentMethod, gemsToAdd } = req.body;
    const userId = req.user.id;
    const username = req.user.username;

    // Record purchase
    const purchase = await Purchase.create({
      id: `txn_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      userId,
      username,
      packId,
      packName,
      price,
      paymentMethod,
    });

    // Add gems to user
    const user = await User.findOne({ id: userId });
    if (user) {
      user.gems = (user.gems || 0) + gemsToAdd;
      await user.save();
    }

    res.json({ success: true, purchase, newGems: user?.gems });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/packs', async (req: any, res: any) => {
  try {
    const packs = await Pack.find().sort({ price: 1 });
    res.json(packs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/mail/test', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  const { email } = req.body;
  if (!email) return res.status(400).json({ error: 'Email required' });
  
  const success = await sendSystemEmail(
    email, 
    'Test Email from VibeMatch', 
    '<h1>Hello!</h1><p>This is a test email sent from your VibeMatch Admin Panel to confirm your mail settings are correct.</p>'
  );
  
  if (success) {
    res.json({ success: true, message: 'Test email sent successfully!' });
  } else {
    res.status(500).json({ error: 'Failed to send test email. Check console logs and mail settings.' });
  }
});

app.get('/api/vip-plans', async (req: any, res: any) => {
  try {
    const plans = await VipPlan.find().sort({ priceGems: 1 });
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/vip/subscribe', authMiddleware, async (req: any, res: any) => {
  try {
    const { planId } = req.body;
    const plan = await VipPlan.findOne({ id: planId });
    if (!plan) return res.status(404).json({ error: 'Plan not found' });

    const user = await User.findOne({ id: req.user.id });
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.gems < plan.priceGems) {
      return res.status(400).json({ error: 'Not enough gems' });
    }

    // Calculate new expiry
    const now = new Date();
    let currentExpiry = user.vipExpiry ? new Date(user.vipExpiry) : now;
    if (currentExpiry < now) currentExpiry = now;
    
    currentExpiry.setDate(currentExpiry.getDate() + plan.durationDays);

    const updatedUser = await User.findOneAndUpdate(
      { id: req.user.id },
      { 
        $inc: { gems: -plan.priceGems },
        $set: { vipExpiry: currentExpiry }
      },
      { new: true }
    );

    res.json({ success: true, newGems: updatedUser?.gems, vipExpiry: updatedUser?.vipExpiry });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/packs', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const packs = await Pack.find().sort({ price: 1 });
    res.json(packs);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/packs', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { name, description, price, gems, popular, googlePayId, applePayId } = req.body;
    const newPack = await Pack.create({
      id: `pack_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      name,
      description,
      price: Number(price),
      gems: Number(gems),
      popular: Boolean(popular),
      googlePayId,
      applePayId
    });
    res.json({ success: true, pack: newPack });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/packs/:id', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { name, description, price, gems, popular, googlePayId, applePayId } = req.body;
    const pack = await Pack.findOneAndUpdate(
      { id: req.params.id },
      { name, description, price: Number(price), gems: Number(gems), popular: Boolean(popular), googlePayId, applePayId },
      { new: true }
    );
    if (!pack) return res.status(404).json({ error: 'Pack not found' });
    res.json({ success: true, pack });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/packs/:id', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const pack = await Pack.findOneAndDelete({ id: req.params.id });
    if (!pack) return res.status(404).json({ error: 'Pack not found' });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


}
