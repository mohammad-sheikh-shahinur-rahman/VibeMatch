export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
  avatar: string;
  gender: 'male' | 'female' | 'other';
  country: string;
  countryCode: string;
  age: number;
  bio?: string;
  phone?: string;
  address?: string;
  gems: number;
  isOnline: boolean;
  isBanned?: boolean;
  role: 'user' | 'admin';
  createdAt: string;
  isDemo?: boolean;
  videoUrl?: string;
  followers?: string[];
  following?: string[];
  vipExpiry?: string;
}

export interface VipPlan {
  id: string;
  name: string;
  description: string;
  priceGems: number;
  durationDays: number;
  popular: boolean;
  createdAt?: string;
}

export interface ContactMessage {
  id: string;
  name: string;
  email: string;
  message: string;
  userId?: string;
  timestamp: string;
  status: 'unread' | 'read' | 'resolved';
}

export interface MatchFilter {
  gender: 'both' | 'female' | 'male';
  country: string;
  superMatch: boolean;
}

export interface MatchPartner {
  id: string;
  name: string;
  username: string;
  age: number;
  gender: 'male' | 'female';
  country: string;
  countryCode: string;
  avatar: string;
  videoUrl?: string;
  bio: string;
  interests: string[];
  isOnline: boolean;
  likesCount: number;
}

export interface MatchSession {
  id: string;
  userId: string;
  partnerId: string;
  partnerName: string;
  partnerUsername: string;
  partnerAvatar: string;
  partnerCountry: string;
  startTime: string;
  durationSeconds: number;
  status: 'active' | 'ended' | 'reported';
}

export interface HistoryItem {
  id: string;
  partnerId: string;
  partnerName: string;
  partnerUsername: string;
  partnerAvatar: string;
  partnerCountry: string;
  partnerAge: number;
  timestamp: string;
  type: 'video_chat' | 'viewed_me';
  duration?: string;
  isFollowing?: boolean;
  isMutualFollow?: boolean;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  text: string;
  timestamp: string;
  isGift?: boolean;
  giftType?: string;
  giftAmount?: number;
}

export interface Conversation {
  partnerId: string;
  partnerName: string;
  partnerUsername: string;
  partnerAvatar: string;
  partnerCountry: string;
  isOnline: boolean;
  isFollowing: boolean;
  lastMessage?: string;
  lastMessageTime?: string;
  unreadCount: number;
}

export interface GemPackage {
  id: string;
  gems: number;
  price: number;
  bonus?: string;
  popular?: boolean;
}

export interface ModerationReport {
  id: string;
  reporterId: string;
  reportedUserId: string;
  reportedUserName: string;
  reportedUserAvatar: string;
  reason: string;
  details: string;
  timestamp: string;
  status: 'pending' | 'resolved' | 'dismissed';
}

export interface AdminAuthResponse {
  token: string;
  user: {
    id: string;
    username: string;
    role: string;
  };
}

export interface AdminSettings {
  _id?: string;
  guestLogin: boolean;
  phoneLogin: boolean;
  googleLogin: boolean;
  facebookLogin: boolean;
  appleLogin: boolean;
  twitterLogin: boolean;
  firebaseConfig?: string;
  firebaseServiceAccount?: string;
  siteName: string;
  siteUrl: string;
  logoUrl?: string;
  faviconUrl?: string;
  demoMode: boolean;
  discoverGridUsers?: 'demo_only' | 'real_only' | 'real_no_guest' | 'all';
  seoTitle?: string;
  seoDescription?: string;
  seoKeywords?: string;
  footerDescription?: string;
  footerCopyright?: string;
  smtpHost?: string;
  smtpPort?: string;
  smtpUser?: string;
  smtpPass?: string;
  bonusGems?: number;
  mailDriver?: 'smtp' | 'sendmail';
  mailEncryption?: 'tls' | 'ssl' | 'none';
  mailFromAddress?: string;
  mailFromName?: string;
  cacheDriver?: 'file' | 'redis' | 'memcached';
  sessionDriver?: 'file' | 'cookie' | 'database';
  sessionTimeoutMins?: number;
  cloudflareTurnstileKey?: string;
  cloudflareTurnstileSecret?: string;
  googleRecaptchaKey?: string;
  googleRecaptchaSecret?: string;
  requireCaptchaForLogin?: boolean;
  requireCaptchaForRegister?: boolean;
  templateWelcome?: string;
  templatePurchase?: string;
  templateWithdrawalApproved?: string;
  templateWithdrawalRejected?: string;
  stripePublicKey?: string;
  stripeSecretKey?: string;
  paypalClientId?: string;
  paypalSecret?: string;
  razorpayKeyId?: string;
  razorpayKeySecret?: string;
  stripeEnabled?: boolean;
  paypalEnabled?: boolean;
  razorpayEnabled?: boolean;
  googlePayEnabled?: boolean;
  applePayEnabled?: boolean;
  activeWebrtcProvider?: string;
  twilioAccountSid?: string;
  twilioAuthToken?: string;
  meteredApiKey?: string;
  xirsysDomain?: string;
  xirsysSecret?: string;
  playStoreUrl?: string;
  appStoreUrl?: string;
  facebookUrl?: string;
  instagramUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  termsUrl?: string;
  privacyUrl?: string;
  showOnlineUsers?: boolean;
  fakeOnlineUsersCount?: number;
  
  // Storage settings
  storageType?: 'local' | 'digitalocean' | 's3' | 'gcp' | 'backblaze' | 'bunny';
  doEndpoint?: string;
  doRegion?: string;
  doBucket?: string;
  doAccessKey?: string;
  doSecretKey?: string;
  s3Region?: string;
  s3Bucket?: string;
  s3AccessKey?: string;
  s3SecretKey?: string;
  gcpProjectId?: string;
  gcpBucket?: string;
  gcpClientEmail?: string;
  gcpPrivateKey?: string;
  b2Endpoint?: string;
  b2Region?: string;
  b2Bucket?: string;
  b2KeyId?: string;
  b2AppKey?: string;
  bunnyStorageZone?: string;
  bunnyAccessKey?: string;
  bunnyPullZoneUrl?: string;
  languages?: { code: string; name: string; flag: string }[];
}

export interface Purchase {
  id: string;
  userId: string;
  username: string;
  packId: string;
  packName: string;
  price: number;
  paymentMethod: string;
  status: string;
  createdAt: string;
}

export interface Pack {
  id: string;
  name: string;
  description: string;
  price: number;
  gems: number;
  popular: boolean;
  googlePayId?: string;
  applePayId?: string;
  createdAt?: string;
}

export interface Notification {
  id: string;
  userId: string;
  fromUserId: string;
  fromUserName: string;
  fromUserUsername?: string;
  fromUserAvatar: string;
  type: string;
  isRead: boolean;
  timestamp: string;
}

export interface Gift {
  id: string;
  name: string;
  price: number;
  imagePath: string;
  createdAt?: string;
}
