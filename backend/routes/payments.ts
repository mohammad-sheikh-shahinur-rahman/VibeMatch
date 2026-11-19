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
  const { sendPurchaseEmail, authMiddleware, upload, sendSystemEmail, sendPushNotification, JWT_SECRET, DEMO_MODE } = helpers;
  
  // Helper: Verify Apple App Store Receipt
  async function verifyAppleReceipt(receiptData: string, sharedSecret?: string): Promise<{ valid: boolean; productId?: string; transactionId?: string; error?: string }> {
    try {
      const payload: any = { 'receipt-data': receiptData };
      if (sharedSecret) payload.password = sharedSecret;

      // 1. Try Production Apple verifyReceipt endpoint
      let res = await fetch('https://buy.itunes.apple.com/verifyReceipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      let data: any = await res.json();

      // 2. Status 21007 indicates sandbox receipt sent to production URL -> retry against sandbox endpoint
      if (data && data.status === 21007) {
        res = await fetch('https://sandbox.itunes.apple.com/verifyReceipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        data = await res.json();
      }

      if (data && data.status === 0) {
        const inApp = data.receipt?.in_app || data.latest_receipt_info || [];
        const latest = inApp.length > 0 ? inApp[inApp.length - 1] : null;
        return {
          valid: true,
          productId: latest?.product_id,
          transactionId: latest?.transaction_id || data.receipt?.original_transaction_id
        };
      }
      return { valid: false, error: `Apple verification returned status code: ${data?.status ?? 'unknown'}` };
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  }

  // Helper: Verify Google Play Developer Receipt
  async function verifyGoogleReceipt(receiptData: string, expectedProductId?: string, packageName = 'com.vibematch.app'): Promise<{ valid: boolean; productId?: string; orderId?: string; error?: string }> {
    try {
      let parsed: any = null;
      try {
        parsed = typeof receiptData === 'object' ? receiptData : JSON.parse(receiptData);
      } catch (_) {}

      const purchaseToken = parsed?.purchaseToken || (typeof receiptData === 'string' && receiptData.length > 20 ? receiptData : null);
      if (!purchaseToken) {
        return { valid: false, error: 'Invalid Google Play receipt payload: missing purchaseToken' };
      }

      // Google Play Server-Side Verification via Google Play Developer API
      const serviceAccountJson = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
      if (!serviceAccountJson) {
        // Fail closed: reject purchase when server is not configured with Google Service Account
        return { 
          valid: false, 
          error: 'Google Play receipt verification failed: Server is not configured with GOOGLE_SERVICE_ACCOUNT_JSON. Purchase verification cannot proceed.' 
        };
      }

      try {
        const creds = JSON.parse(serviceAccountJson);
        const now = Math.floor(Date.now() / 1000);
        const jwtHeader = Buffer.from(JSON.stringify({ alg: 'RS256', typ: 'JWT' })).toString('base64url');
        const jwtClaim = Buffer.from(JSON.stringify({
          iss: creds.client_email,
          scope: 'https://www.googleapis.com/auth/androidpublisher',
          aud: 'https://oauth2.googleapis.com/token',
          exp: now + 3600,
          iat: now
        })).toString('base64url');

        const signer = crypto.createSign('RSA-SHA256');
        signer.update(`${jwtHeader}.${jwtClaim}`);
        const assertion = `${jwtHeader}.${jwtClaim}.${signer.sign(creds.private_key, 'base64url')}`;

        const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
          method: 'POST',
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: `grant_type=urn:ietf:params:oauth:grant-type:jwt-bearer&assertion=${assertion}`
        });
        const tokenData: any = await tokenRes.json();

        if (!tokenData.access_token) {
          return { valid: false, error: 'Failed to obtain Google OAuth access token for receipt verification' };
        }

        if (!expectedProductId) {
          return { valid: false, error: 'Missing expectedProductId for Google Play purchase verification' };
        }

        const verifyUrl = `https://androidpublisher.googleapis.com/androidpublisher/v3/applications/${packageName}/purchases/products/${expectedProductId}/tokens/${encodeURIComponent(purchaseToken)}`;
        const verifyRes = await fetch(verifyUrl, {
          headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });
        const verifyData: any = await verifyRes.json();

        // purchaseState: 0 = Purchased, 1 = Canceled, 2 = Pending
        if (verifyData.purchaseState === 0) {
          return { 
            valid: true, 
            productId: expectedProductId, 
            orderId: verifyData.orderId || parsed?.orderId 
          };
        }

        return { 
          valid: false, 
          error: verifyData?.error?.message || `Google Play purchase is not valid (state: ${verifyData.purchaseState})` 
        };
      } catch (e: any) {
        // Fail closed on any exception
        return { valid: false, error: `Google Play receipt verification failed: ${e.message}` };
      }
    } catch (err: any) {
      return { valid: false, error: err.message };
    }
  }

  // Real Server-Side Native In-App Purchase Verification Endpoint
  app.post('/api/payments/native/verify', authMiddleware, async (req: any, res: any) => {
    try {
      const { receipt, packId, platform, paymentId } = req.body;

      // 1. Strict Receipt Validation
      if (!receipt || typeof receipt !== 'string' || !receipt.trim()) {
        return res.status(400).json({ error: 'Purchase receipt is required for server verification' });
      }

      // 2. Strict Pack Lookup - Only credit gems configured in database, NEVER trust client
      if (!packId) {
        return res.status(400).json({ error: 'packId is required' });
      }
      const pack = await Pack.findOne({
        $or: [
          { id: String(packId) },
          { googlePayId: String(packId) },
          { applePayId: String(packId) }
        ]
      });
      if (!pack || !pack.gems || pack.gems <= 0) {
        return res.status(400).json({ error: 'Invalid or unrecognized diamond pack' });
      }
      const validGems = pack.gems;

      // 3. Server-side Receipt Verification with Apple App Store / Google Play APIs
      const isIos = platform === 'applepay' || platform === 'ios';
      let verification: { valid: boolean; productId?: string; transactionId?: string; orderId?: string; error?: string };

      if (isIos) {
        const settings = (await Settings.findOne({ type: 'admin_settings' }).lean()) as any;
        const appleSecret = settings?.appleSharedSecret || process.env.APPLE_SHARED_SECRET;
        verification = await verifyAppleReceipt(receipt, appleSecret);
      } else {
        verification = await verifyGoogleReceipt(receipt, pack.googlePayId || pack.id, 'com.vibematch.app');
      }

      if (!verification.valid) {
        return res.status(400).json({ error: `Receipt verification failed: ${verification.error || 'Invalid or revoked receipt'}` });
      }

      // 4. Prevent Replay Attacks: Check unique paymentId and receipt hash
      const receiptHash = crypto.createHash('sha256').update(receipt).digest('hex');
      const finalPaymentId = paymentId ? String(paymentId) : (verification.transactionId || verification.orderId || `native_${receiptHash.substring(0, 24)}`);

      const existing = await Purchase.findOne({
        $or: [
          { id: finalPaymentId },
          { receiptHash: receiptHash }
        ]
      });
      if (existing) {
        return res.json({ success: true, message: 'Purchase already processed and credited' });
      }

      // 5. Authenticated User Lookup
      let user = await User.findOne({
        $or: [
          ...(req.user.id ? [{ id: req.user.id }] : []),
          ...(req.user.username ? [{ username: req.user.username }] : []),
          ...(req.user._id ? [{ _id: req.user._id }] : [])
        ]
      });
      if (!user && req.user.id) {
        try { user = await User.findById(req.user.id); } catch (_) {}
      }
      if (!user) return res.status(404).json({ error: 'User not found' });

      if (!user.id) {
        user.id = user._id ? user._id.toString() : `user_${Date.now()}`;
      }

      // 6. Record Completed Purchase
      const purchase = new Purchase({
        id: finalPaymentId,
        receiptHash: receiptHash,
        userId: user.id,
        username: user.username || req.user.username || 'Unknown',
        packId: pack.id,
        packName: pack.name || 'Diamond Pack',
        price: pack.price || 0,
        paymentMethod: isIos ? 'apple_in_app_purchase' : 'google_in_app_purchase',
        status: 'completed'
      });
      await purchase.save();

      // 7. Credit gems securely using only database pack amount
      user.gems = (user.gems || 0) + validGems;
      await user.save();

      try { sendPurchaseEmail(user, purchase.packName || 'Diamond Pack', purchase.price || 0); } catch (_) {}
      res.json({ success: true, newGems: user.gems });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.json({ success: true, message: 'Already processed' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/payments/stripe/create-checkout', authMiddleware, async (req: any, res: any) => {
    try {
      const { packId, packName, price, gemsToAdd } = req.body;
      const settings = await Settings.findOne({ type: 'admin_settings' });
      if (!settings || !settings.stripeSecretKey) return res.status(400).json({ error: 'Stripe is not configured' });
  
      const stripe = new Stripe(settings.stripeSecretKey);
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [{
          price_data: {
            currency: 'usd',
            product_data: { name: packName || 'Diamond Pack' },
            unit_amount: Math.round(price * 100),
          },
          quantity: 1,
        }],
        mode: 'payment',
        success_url: `${(settings.siteUrl || 'http://localhost:3000').replace(/\/$/, '')}/payment-callback?status=success&method=stripe&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${(settings.siteUrl || 'http://localhost:3000').replace(/\/$/, '')}/payment-callback?status=cancel`,
        metadata: { userId: req.user.id || req.user._id || req.user.username, packId, packName: packName || 'Diamond Pack', gemsToAdd: gemsToAdd.toString() }
      });
  
      res.json({ url: session.url });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/payments/stripe/verify', authMiddleware, async (req: any, res: any) => {
    try {
      const { session_id } = req.body;
      const settings = await Settings.findOne({ type: 'admin_settings' });
      if (!settings || !settings.stripeSecretKey) return res.status(400).json({ error: 'Stripe is not configured' });
  
      const stripe = new Stripe(settings.stripeSecretKey);
      const session = await stripe.checkout.sessions.retrieve(session_id);
  
      if (session.payment_status === 'paid') {
        let user = await User.findOne({
          $or: [
            ...(session.metadata?.userId ? [{ id: session.metadata.userId }] : []),
            ...(req.user.id ? [{ id: req.user.id }] : []),
            ...(req.user.username ? [{ username: req.user.username }] : [])
          ]
        });
        if (!user && (session.metadata?.userId || req.user.id)) {
          try { user = await User.findById(session.metadata?.userId || req.user.id); } catch (_) {}
        }
        if (!user) return res.status(404).json({ error: 'User not found' });

        const existing = await Purchase.findOne({ id: session_id });
        if (existing) return res.json({ success: true, message: 'Already processed', newGems: user.gems });

        if (!user.id) {
          user.id = user._id ? user._id.toString() : `user_${Date.now()}`;
        }

        const pack = await Pack.findOne({ id: session.metadata?.packId });
        const gemsToAdd = pack ? pack.gems : parseInt(session.metadata?.gemsToAdd || '0', 10);
        
        const purchase = new Purchase({
          id: session_id,
          userId: user.id,
          username: user.username || req.user.username || 'Unknown',
          packId: session.metadata?.packId,
          packName: session.metadata?.packName || (pack ? pack.name : 'Diamond Pack'),
          price: session.amount_total ? session.amount_total / 100 : 0,
          paymentMethod: 'stripe',
          status: 'completed'
        });
        await purchase.save();
  
        user.gems = (user.gems || 0) + gemsToAdd;
        await user.save();

        try { sendPurchaseEmail(user, purchase.packName || 'Diamond Pack', purchase.price || 0); } catch (_) {}
        res.json({ success: true, newGems: user.gems });
      } else {
        res.status(400).json({ error: 'Payment not verified' });
      }
    } catch (err: any) {
      if (err.code === 11000) {
        return res.json({ success: true, message: 'Already processed' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/payments/paypal/create-order', authMiddleware, async (req: any, res: any) => {
    try {
      const { packId, packName, price, gemsToAdd } = req.body;
      const settings = await Settings.findOne({ type: 'admin_settings' });
      if (!settings || !settings.paypalClientId || !settings.paypalClientSecret) {
        return res.status(400).json({ error: 'PayPal is not configured' });
      }

      const authStr = Buffer.from(`${settings.paypalClientId}:${settings.paypalClientSecret}`).toString('base64');
      const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authStr}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });
      const tokenData = await tokenRes.json();
      
      if (!tokenData.access_token) return res.status(400).json({ error: 'Failed to authenticate with PayPal' });

      const orderRes = await fetch('https://api-m.sandbox.paypal.com/v2/checkout/orders', {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          intent: 'CAPTURE',
          purchase_units: [{ 
            amount: { currency_code: 'USD', value: price.toString() },
            custom_id: JSON.stringify({ userId: req.user.id, gemsToAdd, packId: req.body.packId, packName: req.body.packName || 'Diamond Pack' })
          }],
          application_context: {
            return_url: `${(settings.siteUrl || 'http://localhost:3000').replace(/\/$/, '')}/payment-callback?status=success&method=paypal`,
            cancel_url: `${(settings.siteUrl || 'http://localhost:3000').replace(/\/$/, '')}/payment-callback?status=cancel`
          }
        })
      });
      const orderData = await orderRes.json();
      if (!orderRes.ok) return res.status(400).json({ error: 'Failed to create PayPal order' });
  
      const approveLink = orderData.links.find((l: any) => l.rel === 'approve')?.href;
      res.json({ url: approveLink, orderId: orderData.id });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/payments/paypal/verify', authMiddleware, async (req: any, res: any) => {
    try {
      const { token } = req.body;
      const settings = await Settings.findOne({ type: 'admin_settings' });
      if (!settings || !settings.paypalClientId || !settings.paypalClientSecret) {
        return res.status(400).json({ error: 'PayPal is not configured' });
      }

      const authStr = Buffer.from(`${settings.paypalClientId}:${settings.paypalClientSecret}`).toString('base64');
      const tokenRes = await fetch('https://api-m.sandbox.paypal.com/v1/oauth2/token', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${authStr}`,
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
      });
      const tokenData = await tokenRes.json();

      const captureRes = await fetch(`https://api-m.sandbox.paypal.com/v2/checkout/orders/${token}/capture`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${tokenData.access_token}`, 'Content-Type': 'application/json' }
      });

      const captureData = await captureRes.json();
      
      if (captureData.status === 'COMPLETED') {
        const customIdRaw = captureData.purchase_units[0]?.custom_id;
        let targetUserId = req.user.id;
        let gemsToAdd = 0;
        let packId = '';
        let packName = 'Diamond Pack';
        if (customIdRaw) {
          try {
            const parsed = JSON.parse(customIdRaw);
            targetUserId = parsed.userId || targetUserId;
            gemsToAdd = parsed.gemsToAdd || 0;
            packId = parsed.packId || '';
            packName = parsed.packName || packName;
          } catch (_) {}
        }

        let user = await User.findOne({
          $or: [
            ...(targetUserId ? [{ id: targetUserId }] : []),
            ...(req.user.id ? [{ id: req.user.id }] : []),
            ...(req.user.username ? [{ username: req.user.username }] : [])
          ]
        });
        if (!user && targetUserId) {
          try { user = await User.findById(targetUserId); } catch (_) {}
        }
        if (!user) return res.status(404).json({ error: 'User not found' });

        const existing = await Purchase.findOne({ id: token });
        if (existing) return res.json({ success: true, message: 'Already processed', newGems: user.gems });

        if (!user.id) user.id = user._id ? user._id.toString() : `user_${Date.now()}`;

        const pack = await Pack.findOne({ id: packId });
        const finalGems = pack ? pack.gems : (gemsToAdd || 0);

        const purchase = new Purchase({
          id: token,
          userId: user.id,
          username: user.username || req.user.username || 'Unknown',
          packId: packId,
          packName: pack ? pack.name : packName,
          price: parseFloat(captureData.purchase_units[0].payments?.captures?.[0]?.amount?.value || '0'),
          paymentMethod: 'paypal',
          status: 'completed'
        });
        await purchase.save();

        user.gems = (user.gems || 0) + finalGems;
        await user.save();

        try { sendPurchaseEmail(user, purchase.packName || 'Diamond Pack', purchase.price || 0); } catch (_) {}
        return res.json({ success: true, newGems: user.gems });
      }
      res.status(400).json({ error: 'Payment capture failed or user mismatch' });
    } catch (err: any) {
      if (err.code === 11000) {
        return res.json({ success: true, message: 'Already processed' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/payments/razorpay/create-order', authMiddleware, async (req: any, res: any) => {
    try {
      const { packId, packName, price, gemsToAdd } = req.body;
      const settings = await Settings.findOne({ type: 'admin_settings' });
      if (!settings || !settings.razorpayKeyId || !settings.razorpayKeySecret) {
        return res.status(400).json({ error: 'Razorpay is not configured' });
      }

      const instance = new Razorpay({ key_id: settings.razorpayKeyId, key_secret: settings.razorpayKeySecret });
      
      const options = {
        amount: Math.round(price * 100),
        currency: "INR",
        receipt: `rcpt_${Date.now()}`
      };

      const order = await instance.orders.create(options);
      res.json({ orderId: order.id, amount: options.amount, keyId: settings.razorpayKeyId });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/payments/razorpay/verify', authMiddleware, async (req: any, res: any) => {
    try {
      const { razorpay_order_id, razorpay_payment_id, razorpay_signature, packId, gemsToAdd, amount } = req.body;
      const settings = await Settings.findOne({ type: 'admin_settings' });
      
      if (!settings || !settings.razorpayKeySecret) return res.status(400).json({ error: 'Razorpay is not configured' });

      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto.createHmac('sha256', settings.razorpayKeySecret)
                                      .update(body.toString())
                                      .digest('hex');
  
      if (expectedSignature === razorpay_signature) {
        const existing = await Purchase.findOne({ id: razorpay_payment_id });
        if (existing) return res.json({ success: true, message: 'Already processed' });
  
        const pack = await Pack.findOne({ id: packId });
        const purchase = new Purchase({
          id: razorpay_payment_id,
          userId: req.user.id,
          username: req.user.username || 'Unknown',
          packId: packId,
          packName: pack ? pack.name : 'Diamond Pack',
          price: amount,
          paymentMethod: 'razorpay',
          status: 'completed'
        });
        await purchase.save();
  
        const user = await User.findOneAndUpdate({ id: req.user.id }, { $inc: { gems: gemsToAdd } }, { new: true });
        sendPurchaseEmail(user, 'Diamond Pack', purchase.price || 0);
        res.json({ success: true, newGems: user?.gems });
      } else {
        res.status(400).json({ error: 'Invalid signature' });
      }
    } catch (err: any) {
      if (err.code === 11000) {
        return res.json({ success: true, message: 'Already processed' });
      }
      res.status(500).json({ error: err.message });
    }
  });

  app.get('/api/admin/gifts', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const gifts = await Gift.find().sort({ createdAt: -1 });
      res.json({ gifts });
    } catch (err) {
      res.status(500).json({ error: 'Failed to fetch gifts' });
    }
  });
  
  app.post('/api/admin/gifts', authMiddleware, upload.single('giftImage'), async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const { name, price } = req.body;
      const imagePath = req.file ? `/images/gift/${req.file.filename}` : '';
      
      if (!name || !price || !imagePath) {
        return res.status(400).json({ error: 'Name, price, and image are required' });
      }
  
      const newGift = await Gift.create({
        id: `g_${Date.now()}`,
        name,
        price: Number(price),
        imagePath
      });
  
      res.json({ success: true, gift: newGift });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.put('/api/admin/gifts/:id', authMiddleware, upload.single('giftImage'), async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const { name, price } = req.body;
      const gift = await Gift.findOne({ id: req.params.id });
      
      if (!gift) return res.status(404).json({ error: 'Gift not found' });
  
      gift.name = name || gift.name;
      if (price !== undefined) gift.price = Number(price);
  
      if (req.file) {
        if (gift.imagePath && gift.imagePath.startsWith('/images/gift/')) {
          const oldPath = path.join(process.cwd(), 'public', gift.imagePath);
          if (fs.existsSync(oldPath)) {
            fs.unlinkSync(oldPath);
          }
        }
        gift.imagePath = `/images/gift/${req.file.filename}`;
      }
  
      await gift.save();
      res.json({ success: true, gift });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });
  
  app.delete('/api/admin/gifts/:id', authMiddleware, async (req: any, res: any) => {
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    try {
      const gift = await Gift.findOne({ id: req.params.id });
      if (!gift) return res.status(404).json({ error: 'Gift not found' });
  
      if (gift.imagePath && gift.imagePath.startsWith('/images/gift/')) {
        const oldPath = path.join(process.cwd(), 'public', gift.imagePath);
        if (fs.existsSync(oldPath)) {
          fs.unlinkSync(oldPath);
        }
      }
  
      await Gift.deleteOne({ id: req.params.id });
      res.json({ success: true });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  // ------------------------------------------------------------------
  // FLUTTERWAVE PAYMENT GATEWAY
  // ------------------------------------------------------------------
  app.post('/api/payments/flutterwave/init', authMiddleware, async (req: any, res: any) => {
    try {
      const { packId, price } = req.body;
      const settings = await Settings.findOne({ type: 'admin_settings' });
      if (!settings || !settings.flutterwaveSecretKey || !settings.flutterwaveEnabled) {
        return res.status(400).json({ error: 'Flutterwave is not configured or disabled' });
      }

      const pack = await Pack.findOne({ id: String(packId) });
      if (!pack) return res.status(400).json({ error: 'Invalid pack' });

      const txRef = `fw_${Date.now()}_${req.user.id}`;

      const payload = {
        tx_ref: txRef,
        amount: pack.price || price,
        currency: 'USD',
        redirect_url: `${req.protocol}://${req.get('host')}/payment-success`,
        customer: {
          email: req.user.email || 'customer@example.com',
          name: req.user.username || 'User'
        },
        meta: {
          userId: req.user.id,
          packId: pack.id,
          gems: pack.gems
        },
        customizations: {
          title: 'VibeMatch Diamonds',
          description: `Payment for ${pack.name || 'Diamond Pack'}`,
          logo: `${req.protocol}://${req.get('host')}/logo.png`
        }
      };

      const response = await fetch('https://api.flutterwave.com/v3/payments', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${settings.flutterwaveSecretKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data: any = await response.json();
      if (data.status === 'success' && data.data && data.data.link) {
        res.json({ success: true, link: data.data.link, txRef });
      } else {
        res.status(400).json({ error: data.message || 'Flutterwave initialization failed' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/payments/flutterwave/webhook', express.json(), async (req: any, res: any) => {
    try {
      const settings = await Settings.findOne({ type: 'admin_settings' });
      const { event, data } = req.body;

      if (event === 'charge.completed' && data && data.status === 'successful') {
        const txRef = data.tx_ref;
        if (!settings || !settings.flutterwaveSecretKey) return res.status(200).send('Settings missing');

        const verifyRes = await fetch(`https://api.flutterwave.com/v3/transactions/${data.id}/verify`, {
          headers: { Authorization: `Bearer ${settings.flutterwaveSecretKey}` }
        });
        const verifyData: any = await verifyRes.json();

        if (verifyData.status === 'success' && verifyData.data && verifyData.data.status === 'successful') {
          const meta = data.meta || verifyData.data.meta;
          if (meta && meta.userId && meta.packId) {
            const existing = await Purchase.findOne({ id: txRef });
            if (existing) return res.status(200).send('Already processed');

            const pack = await Pack.findOne({ id: meta.packId });
            if (!pack) return res.status(200).send('Pack not found');

            const purchase = new Purchase({
              id: txRef,
              userId: meta.userId,
              username: 'Flutterwave User',
              packId: pack.id,
              packName: pack.name,
              price: pack.price,
              paymentMethod: 'flutterwave',
              status: 'completed'
            });
            await purchase.save();

            const user = await User.findOne({ id: meta.userId });
            if (user) {
              user.gems = (user.gems || 0) + (pack.gems || 0);
              await user.save();
            }
          }
        }
      }
      res.status(200).send('OK');
    } catch (err) {
      res.status(500).send('Error');
    }
  });

  // ------------------------------------------------------------------
  // CASHFREE PAYMENT GATEWAY
  // ------------------------------------------------------------------
  app.post('/api/payments/cashfree/init', authMiddleware, async (req: any, res: any) => {
    try {
      const { packId } = req.body;
      const settings = await Settings.findOne({ type: 'admin_settings' });
      if (!settings || !settings.cashfreeAppId || !settings.cashfreeEnabled) {
        return res.status(400).json({ error: 'Cashfree is not configured or disabled' });
      }

      const pack = await Pack.findOne({ id: String(packId) });
      if (!pack) return res.status(400).json({ error: 'Invalid pack' });

      const orderId = `cf_${Date.now()}_${req.user.id}`.substring(0, 45);
      const url = settings.cashfreeEnvironment === 'production'
        ? 'https://api.cashfree.com/pg/orders'
        : 'https://sandbox.cashfree.com/pg/orders';

      const payload = {
        order_id: orderId,
        order_amount: pack.price,
        order_currency: 'INR',
        customer_details: {
          customer_id: String(req.user.id || 'cust_1'),
          customer_email: req.user.email || 'customer@example.com',
          customer_phone: '9999999999'
        },
        order_meta: {
          return_url: `${req.protocol}://${req.get('host')}/payment-success?order_id={order_id}`
        },
        order_tags: {
          packId: String(pack.id),
          gems: String(pack.gems)
        }
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'x-client-id': settings.cashfreeAppId,
          'x-client-secret': settings.cashfreeSecretKey || '',
          'x-api-version': '2023-08-01',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });
      const data: any = await response.json();
      if (data.payment_session_id) {
        res.json({ success: true, sessionId: data.payment_session_id, orderId });
      } else {
        res.status(400).json({ error: data.message || 'Cashfree initialization failed' });
      }
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/payments/cashfree/webhook', express.json(), async (req: any, res: any) => {
    try {
      const data = req.body;
      if (data && data.type === 'PAYMENT_SUCCESS_WEBHOOK' && data.data && data.data.order) {
        const orderId = data.data.order.order_id;
        const orderTags = data.data.order.order_tags;

        const existing = await Purchase.findOne({ id: orderId });
        if (existing) return res.status(200).send('Already processed');

        if (orderTags && orderTags.packId) {
          const pack = await Pack.findOne({ id: orderTags.packId });
          const customerId = data.data.customer_details?.customer_id;
          const user = await User.findOne({ id: customerId });
          if (pack && user) {
            const purchase = new Purchase({
              id: orderId,
              userId: user.id,
              username: user.username,
              packId: pack.id,
              packName: pack.name,
              price: pack.price,
              paymentMethod: 'cashfree',
              status: 'completed'
            });
            await purchase.save();
            user.gems = (user.gems || 0) + (pack.gems || 0);
            await user.save();
          }
        }
      }
      res.status(200).send('OK');
    } catch (err) {
      res.status(500).send('Error');
    }
  });

  // ------------------------------------------------------------------
  // PAYU PAYMENT GATEWAY
  // ------------------------------------------------------------------
  app.post('/api/payments/payu/init', authMiddleware, async (req: any, res: any) => {
    try {
      const { packId } = req.body;
      const settings = await Settings.findOne({ type: 'admin_settings' });
      if (!settings || !settings.payuMerchantKey || !settings.payuEnabled) {
        return res.status(400).json({ error: 'PayU is not configured or disabled' });
      }

      const pack = await Pack.findOne({ id: String(packId) });
      if (!pack) return res.status(400).json({ error: 'Invalid pack' });

      const txnid = `pu_${Date.now()}_${req.user.id}`.substring(0, 20);
      const amount = (pack.price || 0).toFixed(2);
      const productinfo = String(pack.id);
      const firstname = req.user.username || 'User';
      const email = req.user.email || 'customer@example.com';
      const key = settings.payuMerchantKey;
      const salt = settings.payuMerchantSalt || '';

      const hashString = `${key}|${txnid}|${amount}|${productinfo}|${firstname}|${email}|||||||||||${salt}`;
      const hash = crypto.createHash('sha512').update(hashString).digest('hex');

      res.json({
        success: true,
        key,
        txnid,
        amount,
        productinfo,
        firstname,
        email,
        hash,
        surl: `${req.protocol}://${req.get('host')}/api/payments/payu/webhook`,
        furl: `${req.protocol}://${req.get('host')}/payment-failed`
      });
    } catch (err: any) {
      res.status(500).json({ error: err.message });
    }
  });

  app.post('/api/payments/payu/webhook', express.urlencoded({ extended: true }), async (req: any, res: any) => {
    try {
      const { txnid, productinfo, firstname, email, status } = req.body;
      if (status === 'success') {
        const existing = await Purchase.findOne({ id: txnid });
        if (!existing) {
          const pack = await Pack.findOne({ id: productinfo });
          let user = await User.findOne({ email: email });
          if (!user) user = await User.findOne({ username: firstname });

          if (pack && user) {
            const purchase = new Purchase({
              id: txnid,
              userId: user.id,
              username: user.username,
              packId: pack.id,
              packName: pack.name,
              price: pack.price,
              paymentMethod: 'payu',
              status: 'completed'
            });
            await purchase.save();
            user.gems = (user.gems || 0) + (pack.gems || 0);
            await user.save();
          }
        }
      }
      res.redirect('/payment-success');
    } catch (err) {
      res.redirect('/payment-failed');
    }
  });

  // ------------------------------------------------------------------
  // PHONEPE PAYMENT GATEWAY
  // ------------------------------------------------------------------
  app.post('/api/payments/phonepe/init', authMiddleware, async (req: any, res: any) => {
    try {
      const { packId } = req.body;
      const settings = await Settings.findOne({ type: 'admin_settings' });
      if (!settings || !settings.phonepeMerchantId || !settings.phonepeEnabled) {
        return res.status(400).json({ error: 'PhonePe is not configured or disabled' });
      }

      const pack = await Pack.findOne({ id: String(packId) });
      if (!pack) return res.status(404).json({ error: 'Pack not found' });

      const txnid = `txn_${Date.now()}_${req.user.id}_${pack.id}`;
      const amount = pack.price * 100;
      
      const payload = {
        merchantId: settings.phonepeMerchantId,
        merchantTransactionId: txnid,
        merchantUserId: req.user.id,
        amount: amount,
        redirectUrl: `${req.protocol}://${req.get('host')}/api/payments/phonepe/webhook`,
        redirectMode: "POST",
        callbackUrl: `${req.protocol}://${req.get('host')}/api/payments/phonepe/webhook`,
        mobileNumber: "9999999999",
        paymentInstrument: {
          type: "PAY_PAGE"
        }
      };

      const payloadString = JSON.stringify(payload);
      const payloadBase64 = Buffer.from(payloadString).toString('base64');
      const saltKey = settings.phonepeSaltKey || '';
      const saltIndex = settings.phonepeSaltIndex || '1';
      const stringToHash = payloadBase64 + "/pg/v1/pay" + saltKey;
      const sha256 = crypto.createHash('sha256').update(stringToHash).digest('hex');
      const checksum = sha256 + "###" + saltIndex;

      const isProd = settings.phonepeEnvironment === 'PRODUCTION';
      const apiUrl = isProd ? "https://api.phonepe.com/apis/hermes/pg/v1/pay" : "https://api-preprod.phonepe.com/apis/pg-sandbox/pg/v1/pay";

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-VERIFY': checksum
        },
        body: JSON.stringify({ request: payloadBase64 })
      });

      const responseData = await response.json();
      if (responseData.success) {
        res.json({ paymentUrl: responseData.data.instrumentResponse.redirectInfo.url });
      } else {
        res.status(400).json({ error: responseData.message || 'PhonePe init failed' });
      }
    } catch (err: any) {
      console.error('PhonePe Init Error:', err);
      res.status(500).json({ error: 'Failed to initialize PhonePe payment.' });
    }
  });

  app.post('/api/payments/phonepe/webhook', express.urlencoded({ extended: true }), express.json(), async (req: any, res: any) => {
    try {
      const settings = await Settings.findOne({ type: 'admin_settings' });
      
      let txnid = '';
      let isSuccess = false;
      
      if (req.body.response) {
          // Server-to-server callback (Base64 encoded)
          const payloadString = Buffer.from(req.body.response, 'base64').toString('utf8');
          const data = JSON.parse(payloadString);
          txnid = data.data?.merchantTransactionId;
          
          // Verify signature (x-verify header)
          const signature = req.headers['x-verify'];
          if (signature) {
             const saltKey = settings?.phonepeSaltKey || '';
             const saltIndex = settings?.phonepeSaltIndex || '1';
             const expectedSig = crypto.createHash('sha256').update(req.body.response + saltKey).digest('hex') + "###" + saltIndex;
             if (expectedSig !== signature) return res.status(403).send('Invalid Signature');
          }
          isSuccess = data.code === 'PAYMENT_SUCCESS';
      } else {
          // Client redirect
          txnid = req.body.transactionId;
          const mId = settings?.phonepeMerchantId || req.body.merchantId;
          const saltKey = settings?.phonepeSaltKey || '';
          const saltIndex = settings?.phonepeSaltIndex || '1';
          
          const checksum = crypto.createHash('sha256').update(`/pg/v1/status/${mId}/${txnid}` + saltKey).digest('hex') + "###" + saltIndex;
          const env = settings?.phonepeEnvironment === 'production' ? 'api.phonepe.com/apis/hermes' : 'api-preprod.phonepe.com/apis/pg-sandbox';
          
          const s2sRes = await fetch(`https://${env}/pg/v1/status/${mId}/${txnid}`, {
              headers: { 'X-VERIFY': checksum, 'X-MERCHANT-ID': mId }
          });
          const data = await s2sRes.json();
          isSuccess = data.code === 'PAYMENT_SUCCESS';
      }

      if (isSuccess && txnid) {
        const parts = txnid.split('_');
        if (parts.length >= 4) {
            const userId = parts[2];
            const packId = parts.slice(3).join('_');
            
            const existing = await Purchase.findOne({ id: txnid });
            if (!existing) {
                const user = await User.findOne({ id: userId });
                const pack = await Pack.findOne({ id: packId });
                if (user && pack) {
                    const purchase = new Purchase({
                        id: txnid, userId: user.id, username: user.username,
                        packId: pack.id, packName: pack.name, price: pack.price,
                        paymentMethod: 'phonepe', status: 'completed'
                    });
                    await purchase.save();
                    user.gems = (user.gems || 0) + (pack.gems || 0);
                    await user.save();
                }
            }
        }
      }
      
      if (req.body.response) {
          return res.status(200).send('OK');
      } else {
          return res.redirect(isSuccess ? '/payment-success' : '/payment-failed');
      }
    } catch (err) {
      console.error(err);
      if (req.body && req.body.response) return res.status(500).send('Error');
      res.redirect('/payment-failed');
    }
  });
}

