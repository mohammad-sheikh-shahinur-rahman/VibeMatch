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
  
  // Admin VIP Plans Endpoints
app.get('/api/admin/vip-plans', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const plans = await VipPlan.find().sort({ priceGems: 1 });
    res.json(plans);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/vip-plans', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { name, description, priceGems, durationDays, popular } = req.body;
    const newPlan = new VipPlan({
      id: `vip_${Date.now()}`,
      name,
      description,
      priceGems: Number(priceGems),
      durationDays: Number(durationDays),
      popular: Boolean(popular)
    });
    await newPlan.save();
    res.json({ success: true, plan: newPlan });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/admin/vip-plans/:id', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    const { name, description, priceGems, durationDays, popular } = req.body;
    const plan = await VipPlan.findOneAndUpdate(
      { id: req.params.id },
      { name, description, priceGems: Number(priceGems), durationDays: Number(durationDays), popular: Boolean(popular) },
      { new: true }
    );
    if (!plan) return res.status(404).json({ error: 'Plan not found' });
    res.json({ success: true, plan });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/admin/vip-plans/:id', authMiddleware, async (req: any, res: any) => {
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
  try {
    await VipPlan.deleteOne({ id: req.params.id });
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});


}
