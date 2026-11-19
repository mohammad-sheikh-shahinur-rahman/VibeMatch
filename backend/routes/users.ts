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
  const { User } = models;
  const { authMiddleware } = helpers;

  app.delete('/api/users/me', authMiddleware, async (req: any, res: any) => {
    try {
      const userId = req.user.id;
      
      // Delete user
      await User.deleteOne({ id: userId });
      
      // Delete related records
      if (models.Message) await models.Message.deleteMany({ $or: [{ senderId: userId }, { receiverId: userId }] });
      if (models.History) await models.History.deleteMany({ $or: [{ callerId: userId }, { receiverId: userId }] });
      if (models.Notification) await models.Notification.deleteMany({ userId: userId });
      if (models.Report) await models.Report.deleteMany({ $or: [{ reporterId: userId }, { reportedId: userId }] });
      
      res.json({ success: true, message: 'Account deleted permanently.' });
    } catch (err) {
      console.error(err);
      res.status(500).json({ error: 'Failed to delete account' });
    }
  });

  const { Gift, History, Message, Report, ContactMessage, Notification, Settings, Purchase, Pack, VipPlan, Admin, WithdrawalRequest } = models;
  const { upload, sendSystemEmail, sendPushNotification, getSettings, JWT_SECRET, DEMO_MODE } = helpers;

  app.get('/api/withdrawals', authMiddleware, async (req: any, res: any) => {
    try {
      const requests = await WithdrawalRequest.find({ userId: req.user.id }).sort({ timestamp: -1 });
      res.json(requests);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.post('/api/withdrawals', authMiddleware, async (req: any, res: any) => {
    try {
      const { paymentMethod, paymentDetails } = req.body;
      const amount = Number(req.body.amount);
      if (isNaN(amount) || amount <= 0) {
        return res.status(400).json({ error: 'Invalid amount' });
      }
      const user = await User.findOne({ id: req.user.id });
      if (!user) return res.status(404).json({ error: 'User not found' });
      
      const settings: any = await Settings.findOne({ type: 'admin_settings' });
      const minAmount = settings?.minWithdrawalAmount || 50;
      if (amount < minAmount) {
         return res.status(400).json({ error: `Minimum withdrawal amount is ${minAmount}` });
      }

      const allowedMethods = settings?.withdrawalMethods || ['paypal', 'bank_transfer', 'upi', 'crypto'];
      if (!allowedMethods.includes(paymentMethod)) {
         return res.status(400).json({ error: 'Selected payment method is not available.' });
      }

      const rate = settings?.withdrawalRate || 100; // default 100 gems = 1 USD
      const requiredGems = amount * rate;
      
      if (user.earnedGems < requiredGems) {
        return res.status(400).json({ error: 'Not enough earned gems.' });
      }
      
      user.earnedGems -= requiredGems;
      await user.save();
      
      const reqId = `wd_${Date.now()}_${Math.random().toString(36).substring(7)}`;
      const newReq = new WithdrawalRequest({
        id: reqId,
        userId: user.id,
        userName: user.name,
        userAvatar: user.avatar,
        amount: amount,
        gemsDeducted: requiredGems,
        paymentMethod,
        paymentDetails
      });
      await newReq.save();
      
      res.json({ success: true, request: newReq, newEarnedGems: user.earnedGems });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  app.get('/api/admin/withdrawals', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const requests = await WithdrawalRequest.find().sort({ timestamp: -1 });
      res.json(requests);
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });

  
    app.delete('/api/admin/withdrawals/:id', authMiddleware, async (req: any, res: any) => {
      if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
      if (DEMO_MODE) return res.status(403).json({ error: 'Action disabled in demo mode' });
      try {
        const request = await WithdrawalRequest.findOne({ id: req.params.id });
        if (!request) return res.status(404).json({ error: 'Not found' });
        
        await WithdrawalRequest.deleteOne({ id: req.params.id });
        res.json({ success: true });
      } catch (e: any) {
        res.status(500).json({ error: e.message });
      }
    });

    app.post('/api/admin/withdrawals/:id/status', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const { status } = req.body; // 'approved' or 'rejected'
      const request = await WithdrawalRequest.findOne({ id: req.params.id });
      if (!request) return res.status(404).json({ error: 'Not found' });
      
      if (request.status !== 'pending') {
        return res.status(400).json({ error: 'Request is already processed' });
      }
      
      request.status = status;
      request.processedAt = new Date();
      await request.save();
      
      // If rejected, refund gems
      if (status === 'rejected') {
          await User.updateOne({ id: request.userId }, { $inc: { earnedGems: request.gemsDeducted } });
        }
        
        try {
           const targetUser = await User.findOne({ id: request.userId });
           const settings: any = await Settings.findOne({ type: 'admin_settings' });
           if (targetUser && targetUser.email && settings) {
              if (status === 'approved' && settings.templateWithdrawalApproved) {
                 const html = settings.templateWithdrawalApproved
                   .replace(/%nameuser%/g, targetUser.name || targetUser.username || 'User')
                   .replace(/%amount%/g, (request.amount || 0).toString())
                   .replace(/%method%/g, request.paymentMethod || 'Unknown');
                 if (typeof sendSystemEmail === 'function') sendSystemEmail(targetUser.email, 'Withdrawal Approved', html);
              } else if (status === 'rejected' && settings.templateWithdrawalRejected) {
                 const html = settings.templateWithdrawalRejected
                   .replace(/%nameuser%/g, targetUser.name || targetUser.username || 'User')
                   .replace(/%amount%/g, (request.amount || 0).toString());
                 if (typeof sendSystemEmail === 'function') sendSystemEmail(targetUser.email, 'Withdrawal Rejected', html);
              }
           }
        } catch (mailErr) {
           console.error('Failed to send withdrawal email:', mailErr);
        }
      
      res.json({ success: true, request });
    } catch (e: any) {
      res.status(500).json({ error: e.message });
    }
  });
}
