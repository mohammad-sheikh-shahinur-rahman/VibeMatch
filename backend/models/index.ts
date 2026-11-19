import mongoose from 'mongoose';

// --- MONGOOSE SCHEMAS (Database Tables) ---

const userSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  username: { type: String, unique: true },
  name: String,
  email: String,
  passwordHash: String,
  avatar: String,
  gender: String,
  country: String,
  countryCode: String,
  age: Number,
  gems: { type: Number, default: 250 },
  earnedGems: { type: Number, default: 0 },
  likesCount: { type: Number, default: 0 },
  bio: String,
  phone: String,
  address: String,
  followers: { type: [String], default: [] },
  following: { type: [String], default: [] },
  isOnline: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  role: { type: String, default: 'user' },
  isDemo: { type: Boolean, default: false },
  videoUrl: String,
  vipExpiry: { type: Date },
  createdAt: { type: Date, default: Date.now }
});
const User = mongoose.model('User', userSchema);

const giftSchema = new mongoose.Schema({
  id: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  price: { type: Number, required: true },
  imagePath: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});
const Gift = mongoose.model('Gift', giftSchema);

const historySchema = new mongoose.Schema({
  id: String,
  userId: String,
  partnerId: String,
  partnerName: String,
  partnerUsername: String,
  partnerAvatar: String,
  partnerCountry: String,
  partnerAge: Number,
  timestamp: { type: Date, default: Date.now },
  type: String,
  duration: String,
  isFollowing: Boolean
});
const History = mongoose.model('History', historySchema);

const messageSchema = new mongoose.Schema({
  id: String,
  senderId: String,
  receiverId: String,
  text: String,
  timestamp: { type: Date, default: Date.now },
  isGift: Boolean,
  giftType: String,
  giftAmount: Number,
  isRead: { type: Boolean, default: false }
});
const Message = mongoose.model('Message', messageSchema);

const reportSchema = new mongoose.Schema({
  id: String,
  reporterId: String,
  reportedUserId: String,
  reportedUserName: String,
  reportedUserAvatar: String,
  reason: String,
  details: String,
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'pending' }
});
const Report = mongoose.model('Report', reportSchema);

const contactMessageSchema = new mongoose.Schema({
  id: String,
  name: String,
  email: String,
  message: String,
  userId: String,
  timestamp: { type: Date, default: Date.now },
  status: { type: String, default: 'unread' }
});
const ContactMessage = mongoose.model('ContactMessage', contactMessageSchema);

const notificationSchema = new mongoose.Schema({
  id: String,
  userId: String,
  fromUserId: String,
  fromUserName: String,
  fromUserUsername: String,
  fromUserAvatar: String,
  type: String, // e.g., 'follow'
  isRead: { type: Boolean, default: false },
  timestamp: { type: Date, default: Date.now }
});
const Notification = mongoose.model('Notification', notificationSchema);

const settingSchema = new mongoose.Schema({
  type: { type: String, default: 'admin_settings' },
  guestLogin: Boolean,
  phoneLogin: Boolean,
  googleLogin: Boolean,
  facebookLogin: Boolean,
  appleLogin: Boolean,
  twitterLogin: Boolean,
  firebaseConfig: String,
  siteName: String,
  siteUrl: String,
  termsUrl: String,
  privacyUrl: String,
  logoUrl: { type: String, default: '/images/logo.png' },
  faviconUrl: { type: String, default: '/favicon.ico' },
  withdrawalRate: { type: Number, default: 100 }, // Gems per 1 USD
  minWithdrawalAmount: { type: Number, default: 50 }, // USD
  giftCommissionPercentage: { type: Number, default: 0 }, // Commission taken from gifts (0-100)
  withdrawalMethods: { type: [String], default: ['paypal', 'bank_transfer', 'upi', 'crypto'] },
  demoMode: Boolean,
  discoverGridUsers: { type: String, default: 'demo_only' },
  // SEO & Metadata
  seoTitle: String,
  seoDescription: String,
  seoKeywords: String,
  footerDescription: String,
  footerCopyright: { type: String, default: '© 2026 VibeMatch. All rights reserved.' },
  // Mail Config
  smtpHost: String,
  smtpPort: String,
  smtpUser: String,
  smtpPass: String,
  mailDriver: { type: String, default: 'sendmail' },
  mailFromName: { type: String, default: 'VibeMatch' },
  mailFromEmail: { type: String, default: 'noreply@vibematch.com' },
  templateWelcome: String,
  templatePurchase: String,
    templateWithdrawalApproved: String,
    templateWithdrawalRejected: String,
  // Payment Gateway
  stripePublicKey: String,
  stripeSecretKey: String,
  paypalClientId: String,
  paypalSecret: String,
  razorpayKeyId: String,
  razorpayKeySecret: String,
  flutterwavePublicKey: String,
  flutterwaveSecretKey: String,
  cashfreeAppId: String,
  cashfreeSecretKey: String,
  cashfreeEnvironment: { type: String, default: 'sandbox' },
  payuMerchantKey: String,
  payuMerchantSalt: String,
  phonepeMerchantId: String,
  phonepeSaltKey: String,
  phonepeSaltIndex: { type: String, default: '1' },
  phonepeEnvironment: { type: String, default: 'UAT' },
  stripeEnabled: { type: Boolean, default: true },
  paypalEnabled: { type: Boolean, default: true },
  razorpayEnabled: { type: Boolean, default: true },
  flutterwaveEnabled: { type: Boolean, default: false },
  cashfreeEnabled: { type: Boolean, default: false },
  payuEnabled: { type: Boolean, default: false },
  phonepeEnabled: { type: Boolean, default: false },
  googlePayEnabled: { type: Boolean, default: true },
  applePayEnabled: { type: Boolean, default: true },
  // Security
  maxLoginAttempts: { type: Number, default: 5 },
  sessionTimeoutMins: { type: Number, default: 60 },
  // WebRTC
  activeWebrtcProvider: { type: String, default: 'default' },
  twilioAccountSid: String,
  twilioAuthToken: String,
  meteredApiKey: String,
  xirsysDomain: String,
  xirsysSecret: String,
  // Social & App Links
  playStoreUrl: String,
  appStoreUrl: String,
  facebookUrl: String,
  instagramUrl: String,
  twitterUrl: String,
  tiktokUrl: String,
  showOnlineUsers: { type: Boolean, default: true },
  fakeOnlineUsersCount: { type: Number, default: 0 },
  bonusGems: { type: Number, default: 300 },
  
  // Storage Settings
  storageType: { type: String, default: 'local' },
  // DigitalOcean
  doEndpoint: String,
  doRegion: String,
  doBucket: String,
  doAccessKey: String,
  doSecretKey: String,
  // Amazon S3
  s3Region: String,
  s3Bucket: String,
  s3AccessKey: String,
  s3SecretKey: String,
  // Google Cloud
  gcpProjectId: String,
  gcpBucket: String,
  gcpClientEmail: String,
  gcpPrivateKey: String,
  // Backblaze
  b2Endpoint: String,
  b2Region: String,
  b2Bucket: String,
  b2KeyId: String,
  b2AppKey: String,
  // Bunny.net
  bunnyStorageZone: String,
  bunnyAccessKey: String,
    bunnyPullZoneUrl: String,
  // Plugins
  enableGoogleAnalytics: { type: Boolean, default: false },
  googleAnalyticsId: String,
  enableRecaptcha: { type: Boolean, default: false },
  recaptchaSiteKey: String,
  recaptchaSecretKey: String,
    recaptchaVersion: { type: String, default: 'v3' },
  enableTawkto: { type: Boolean, default: false },
  tawktoPropertyId: String,
  // Performance & PWA
  pwaEnabled: { type: Boolean, default: false },
  pwaPromptDelay: { type: Number, default: 5 },
  imageOptimization: { type: Boolean, default: true },
  minifyHtmlCss: { type: Boolean, default: true },
  lazyLoadImages: { type: Boolean, default: true },
  dbQueryCaching: { type: Boolean, default: false }
}, { strict: false });
const Settings = mongoose.model('Setting', settingSchema);

const purchaseSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  receiptHash: { type: String, index: true },
  userId: String,
  username: String,
  packId: String,
  packName: String,
  price: Number,
  paymentMethod: String,
  status: { type: String, default: 'completed' },
  createdAt: { type: Date, default: Date.now }
});
const Purchase = mongoose.model('Purchase', purchaseSchema);

const packSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  description: String,
  price: Number,
  gems: Number,
  popular: { type: Boolean, default: false },
  googlePayId: String,
  applePayId: String,
  createdAt: { type: Date, default: Date.now },
});
const Pack = mongoose.model('Pack', packSchema);

const vipPlanSchema = new mongoose.Schema({
  id: { type: String, unique: true },
  name: String,
  description: String,
  priceGems: Number,
  durationDays: Number,
  popular: { type: Boolean, default: false },
  createdAt: { type: Date, default: Date.now },
});
const VipPlan = mongoose.model('VipPlan', vipPlanSchema);



const adminSchema = new mongoose.Schema({ id: { type: String, unique: true }, username: { type: String, unique: true }, name: String, email: String, passwordHash: String, role: { type: String, default: 'admin' }, }); const Admin = mongoose.model('Admin', adminSchema);


const pageSchema = new mongoose.Schema({
  title: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  content: { type: String, default: '' },
  showInFooter: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});
const Page = mongoose.model('Page', pageSchema);

const withdrawalRequestSchema = new mongoose.Schema({
  id: String,
  userId: String,
  userName: String,
  userAvatar: String,
  amount: Number, // in USD
  gemsDeducted: Number,
  paymentMethod: String,
  paymentDetails: String,
  status: { type: String, default: 'pending' }, // pending, approved, rejected
  timestamp: { type: Date, default: Date.now },
  processedAt: Date
});
const WithdrawalRequest = mongoose.model('WithdrawalRequest', withdrawalRequestSchema);

export { Page, 
  User, Gift, History, Message, Report, ContactMessage, Notification,
  Settings, Purchase, Pack, VipPlan, Admin, WithdrawalRequest
};
