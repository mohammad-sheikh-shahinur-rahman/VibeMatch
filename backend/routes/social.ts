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
  
  // --- FOLLOW & NOTIFICATIONS ---

app.get('/api/users/:id/profile', async (req: any, res: any) => {
  try {
    const user = await User.findOne({ id: req.params.id });
    if (!user) {
      // Check if it looks like a guest ID (numeric timestamp or similar)
      const isGuest = req.params.id && req.params.id.length > 8 && !req.params.id.startsWith('admin');
      if (isGuest) {
        return res.json({
          profile: {
            id: req.params.id,
            name: 'Guest ' + req.params.id.slice(-5),
            username: 'guest_' + req.params.id.slice(-5),
            avatar: 'https://api.dicebear.com/9.x/avataaars/png?seed=' + req.params.id,
            bio: "I'm a guest user!",
            country: 'Unknown',
            countryCode: 'UN',
            isOnline: true,
            followersCount: 0,
            followingCount: 0,
            isFollowing: true,
          }
        });
      }
      return res.status(404).json({ error: 'User not found' });
    }
    
        let isMutualFollow = false;
    let isFollowing = false;
    const authHeader = req.headers.authorization;
    if (authHeader) {
      const token = authHeader.split(' ')[1];
      try {
        const decoded = jwt.verify(token, JWT_SECRET);
        const currentUser = await User.findOne({ id: (decoded as any).id });
        if (currentUser) {
          isFollowing = currentUser.following?.includes(user.id) || false;
          isMutualFollow = isFollowing && (user.following?.includes(currentUser.id) || false);
        }
      } catch (e) {}
    }

    res.json({
      profile: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        country: user.country,
        countryCode: user.countryCode,
        likesCount: user.likesCount || 0,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0,
        isMutualFollow,
        isFollowing
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.get('/api/users/by-username/:username', async (req: any, res: any) => {
  try {
    const username = req.params.username.toLowerCase();
    const user = await User.findOne({ $or: [{ username }, { id: req.params.username }, { name: { $regex: new RegExp("^" + username + "$", "i") } }] });
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    res.json({
      profile: {
        id: user.id,
        name: user.name,
        username: user.username,
        avatar: user.avatar,
        country: user.country,
        countryCode: user.countryCode,
        bio: user.bio,
        age: user.age,
        gender: user.gender,
        likesCount: user.likesCount,
        followersCount: user.followers?.length || 0,
        followingCount: user.following?.length || 0
      }
    });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch profile' });
  }
});

app.post('/api/users/:id/view', authMiddleware, async (req: any, res: any) => {
  try {
    const viewerId = req.user.id;
    const targetId = req.params.id;

    if (viewerId === targetId) {
      return res.json({ success: true });
    }

    const viewer = await User.findOne({ id: viewerId });
    if (!viewer || viewer.role === 'admin') {
      return res.json({ success: true });
    }

    const recentView = await History.findOne({
      userId: targetId,
      partnerId: viewer.id,
      type: 'viewed_me',
      timestamp: { $gt: Date.now() - 1000 * 60 * 60 * 24 }
    });

    if (!recentView) {
      await History.create({
        id: `view_${Date.now()}_${viewer.id.substring(0, 5)}`,
        userId: targetId,
        partnerId: viewer.id,
        partnerName: viewer.name,
        partnerUsername: viewer.username,
        partnerAvatar: viewer.avatar,
        partnerCountry: viewer.country,
        partnerAge: viewer.age,
        type: 'viewed_me',
        timestamp: Date.now()
      });
    }

    res.json({ success: true });
  } catch (e) {
    console.error('Failed to record view:', e);
    res.status(500).json({ error: 'Failed to record view' });
  }
});

app.get('/api/users/check-username', async (req: any, res: any) => {
  try {
    const { username } = req.query;
    if (!username || typeof username !== 'string') {
      return res.status(400).json({ error: 'Username is required' });
    }
    
    const formattedUsername = username.toLowerCase();
    if (!/^[a-z0-9_]{3,20}$/.test(formattedUsername)) {
       return res.json({ available: false, error: 'Invalid format' });
    }

    const existingUser = await User.findOne({ username: formattedUsername });
    const existingAdmin = await Admin.findOne({ username: formattedUsername });
    
    if (existingUser || existingAdmin) {
      return res.json({ available: false });
    }
    
    res.json({ available: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to check username' });
  }
});

app.post('/api/users/:id/follow', authMiddleware, async (req: any, res: any) => {
    try {
      const targetId = req.params.id;
      const currentUserId = req.user.id;
      if (targetId === currentUserId) return res.status(400).json({ error: 'Cannot follow yourself' });
  
      const targetUser = await User.findOne({ id: targetId });
      let currentUser = await User.findOne({ id: currentUserId });
      
      if (!currentUser) {
           // Guests and Admins might not exist in the regular User collection. Mock success.
           return res.json({ success: true, followingCount: 0, isFollowing: true });
        }

      if (!targetUser || !currentUser) return res.status(404).json({ error: 'User not found' });
  
      if (!currentUser.following) currentUser.following = [];
      if (!targetUser.followers) targetUser.followers = [];

      const isFollowing = currentUser.following.includes(targetId);

      if (isFollowing) {
        // UNFOLLOW
        currentUser.following = currentUser.following.filter((id: string) => id !== targetId);
        targetUser.followers = targetUser.followers.filter((id: string) => id !== currentUserId);
        await currentUser.save();
        await targetUser.save();
      } else {
        // FOLLOW
        currentUser.following.push(targetId);
        targetUser.followers.push(currentUserId);
        await currentUser.save();
        await targetUser.save();
        
        // Create notification for target user
        await Notification.create({
          id: `notif_${Date.now()}_${Math.random().toString(36).substring(7)}`,
          userId: targetId,
          fromUserId: currentUserId,
          fromUserName: currentUser.name || currentUser.username,
          fromUserUsername: currentUser.username,
          fromUserAvatar: currentUser.avatar,
          type: 'follow'
        });
      }
  
      res.json({ success: true, followingCount: currentUser.following.length, isFollowing: !isFollowing });
    } catch (e) {
      console.error('Follow Error:', e);
      res.status(500).json({ error: 'Failed to follow user' });
    }
  });

app.post('/api/users/:id/unfollow', authMiddleware, async (req: any, res: any) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user.id;

    const targetUser = await User.findOne({ id: targetId });
    const currentUser = await User.findOne({ id: currentUserId });
    
    if (targetUser && currentUser) {
      if (currentUser.following) {
        currentUser.following = currentUser.following.filter(id => id !== targetId);
        await currentUser.save();
      }
      if (targetUser.followers) {
        targetUser.followers = targetUser.followers.filter(id => id !== currentUserId);
        await targetUser.save();
      }
    }
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to unfollow user' });
  }
});

app.post('/api/users/:id/like', authMiddleware, async (req: any, res: any) => {
  try {
    const targetId = req.params.id;
    const currentUserId = req.user.id;
    const { action } = req.body;
    
    if (targetId === currentUserId) return res.status(400).json({ error: 'Cannot like yourself' });

    const targetUser = await User.findOne({ id: targetId });
    if (!targetUser) return res.status(404).json({ error: 'User not found' });

    targetUser.likesCount = targetUser.likesCount || 0;
    
    if (action === 'unlike') {
      targetUser.likesCount = Math.max(0, targetUser.likesCount - 1);
    } else {
      targetUser.likesCount += 1;
    }
    
    await targetUser.save();
    
    // Notify target user via socket if they are connected
    const targetSocketId = Object.keys(activeSocketMatches).find(k => k === targetUser.id || activeSocketMatches[k] === targetUser.id) || 
                           Object.keys(socketSessions).find(k => socketSessions[k].userId === targetUser.id);
                           
    if (targetSocketId) {
       io.to(targetSocketId).emit('partner_liked', { newLikesCount: targetUser.likesCount });
    }

    res.json({ success: true, likesCount: targetUser.likesCount });
  } catch (e) {
    res.status(500).json({ error: 'Failed to toggle like' });
  }
});

app.get('/api/notifications', authMiddleware, async (req: any, res: any) => {
  try {
    const notifications = await Notification.find({ userId: req.user.id }).sort({ timestamp: -1 }).limit(50);
    res.json({ notifications });
  } catch (e) {
    res.status(500).json({ error: 'Failed to fetch notifications' });
  }
});

app.post('/api/notifications/:id/read', authMiddleware, async (req: any, res: any) => {
  try {
    await Notification.updateOne({ id: req.params.id, userId: req.user.id }, { isRead: true });
    res.json({ success: true });
  } catch (e) {
    res.status(500).json({ error: 'Failed to mark read' });
  }
});


}
