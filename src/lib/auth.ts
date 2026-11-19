import { User, AdminSettings, HistoryItem, Conversation, Message, ModerationReport, Notification, Pack, VipPlan } from '../types';

const USER_TOKEN_KEY = 'vibematch_jwt_token';
const ADMIN_TOKEN_KEY = 'vibematch_admin_jwt_token';

const getStorageKey = () => {
  if (typeof window !== 'undefined' && window.location.pathname.startsWith('/admin')) {
    return ADMIN_TOKEN_KEY;
  }
  return USER_TOKEN_KEY;
};

export const authStorage = {
  getToken: (): string | null => {
    return localStorage.getItem(getStorageKey());
  },
  setToken: (token: string) => {
    localStorage.setItem(getStorageKey(), token);
  },
  removeToken: () => {
    localStorage.removeItem(getStorageKey());
  }
};

export async function apiFetch(url: string, options?: RequestInit) {
  const token = authStorage.getToken();
  const headers = new Headers(options?.headers);
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  const res = await fetch(url, { ...options, headers });
  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
  }
  const text = await res.text();
  if (!res.ok) throw new Error(`Server Error: ${res.status}`);
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error('Failed to parse response as JSON:', text.substring(0, 100));
    throw new Error('Invalid JSON response from server');
  }
}

export async function loginUser(username: string, password: string, extraData?: any): Promise<{ token: string; user: User; isNewUser?: boolean }> {
  const data = await apiFetch('/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password, extraData })
  });
  authStorage.setToken(data.token);
  return data;
}

export async function getCurrentUser(): Promise<User | null> {
  const token = authStorage.getToken();
  if (!token) return null;

  try {
    const data = await apiFetch('/api/auth/me', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return data.user;
  } catch (err) {
    authStorage.removeToken();
    return null;
  }
}

export async function updateProfile(updates: Partial<User>): Promise<{ user: User }> {
  const token = authStorage.getToken();
  if (!token) throw new Error('Not authenticated');

  return apiFetch('/api/users/me', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(updates)
  });
}

export async function uploadUserAvatar(file: File): Promise<{ url: string }> {
  const token = authStorage.getToken();
  if (!token) throw new Error('Not authenticated');

  const formData = new FormData();
  formData.append('avatar', file);

  const res = await fetch('/api/users/upload', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${token}` },
    body: formData
  });

  const contentType = res.headers.get('content-type');
  if (contentType && contentType.includes('application/json')) {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'API Error');
    return data;
  }
  throw new Error('Upload failed');
}

export async function joinMatchQueue(userId = '', gender = 'both', country = '', superMatch = false) {
  return apiFetch('/api/matches/join', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, gender, country, superMatch })
  });
}

export async function checkMatchStatus(userId: string) {
  return apiFetch(`/api/matches/status?userId=${userId}`);
}

export async function leaveMatchQueue(userId: string) {
  return await apiFetch('/api/matches/leave', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId })
  });
}

export async function submitReport(reportedUserId: string, reportedUserName: string, reportedUserAvatar: string, reason: string, details: string = '') {
  return await apiFetch('/api/reports', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reportedUserId, reportedUserName, reportedUserAvatar, reason, details })
  });
}

export async function getHistory(): Promise<HistoryItem[]> {
  try {
    const data = await apiFetch('/api/matches/history');
    return data.history || [];
  } catch {
    return [];
  }
}

export async function toggleFollow(targetId: string): Promise<{ followingCount: number }> {
  const data = await apiFetch(`/api/users/${targetId}/follow`, {
    method: 'POST'
  });
  return data;
}

export async function toggleLike(targetId: string, action: 'like' | 'unlike'): Promise<{ success: boolean; likesCount: number }> {
  const data = await apiFetch(`/api/users/${targetId}/like`, {
    method: 'POST',
    body: JSON.stringify({ action })
  });
  return data;
}

export async function getConversations(): Promise<Conversation[]> {
  try {
    const data = await apiFetch('/api/messages/conversations');
    return data.conversations || [];
  } catch (err) {
    console.error('getConversations err:', err);
    return [];
  }
}

export async function deleteConversation(partnerId: string): Promise<void> {
  try {
    await apiFetch(`/api/messages/conversations/${partnerId}`, {
      method: 'DELETE'
    });
  } catch (err) {
    console.error('deleteConversation err:', err);
  }
}

export async function getNotifications(): Promise<Notification[]> {
  try {
    const data = await apiFetch('/api/notifications');
    return data.notifications || [];
  } catch {
    return [];
  }
}

export async function markNotificationAsRead(id: string) {
  return await apiFetch(`/api/notifications/${id}/read`, {
    method: 'POST'
  });
}

export async function getMessages(partnerId: string, skip: number = 0, limit: number = 20): Promise<{ messages: Message[], hasMore: boolean }> {
  try {
    const data = await apiFetch(`/api/messages/${partnerId}?skip=${skip}&limit=${limit}`);
    return { messages: data.messages || [], hasMore: !!data.hasMore };
  } catch {
    return { messages: [], hasMore: false };
  }
}

export async function markMessagesAsRead(partnerId: string): Promise<any> {
  return apiFetch('/api/messages/read', {
    method: 'POST',
    body: JSON.stringify({ partnerId })
  });
}

export async function sendMessage(senderId: string, receiverId: string, text: string, giftDetails?: { isGift: boolean; giftType: string; giftAmount: number }) {
  return apiFetch('/api/messages', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      senderId,
      receiverId,
      text,
      ...giftDetails
    })
  });
}

export async function buyGems(userId: string, gemAmount: number) {
  return apiFetch('/api/buy-gems', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ userId, gemAmount })
  });
}

export async function subscribeToVip(planId: string) {
  return apiFetch('/api/vip/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ planId })
  });
}

// ADMIN APIS
export async function getAdminUsers(): Promise<User[]> {
  const token = authStorage.getToken();
  const data = await apiFetch('/api/admin/users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return data.users || [];
}

export async function addAdminUserGems(userId: string, amount: number) {
  const token = authStorage.getToken();
  return apiFetch(`/api/admin/users/${userId}/gems`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ amount })
  });
}

export async function toggleBanUser(userId: string) {
  const token = authStorage.getToken();
  return apiFetch(`/api/admin/users/${userId}/toggle-ban`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

export async function updateAdminUser(userId: string, data: Partial<User>) {
  const token = authStorage.getToken();
  return apiFetch(`/api/admin/users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
}

export async function deleteAdminUser(userId: string) {
  const token = authStorage.getToken();
  return apiFetch(`/api/admin/users/${userId}`, {
    method: 'DELETE',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  });
}

export async function getAdminReports(): Promise<ModerationReport[]> {
  const token = authStorage.getToken();
  const data = await apiFetch('/api/admin/reports', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return data.reports || [];
}

export async function updateReportStatus(reportId: string, status: 'resolved' | 'dismissed') {
  const token = authStorage.getToken();
  return apiFetch(`/api/admin/reports/${reportId}/status`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status })
  });
}

export async function getAdminSettings(): Promise<AdminSettings> {
  try {
    const data = await apiFetch('/api/admin/settings');
    return data.settings || {};
  } catch {
    return {} as AdminSettings;
  }
}

export async function saveAdminSettings(settings: Partial<AdminSettings>) {
  const token = authStorage.getToken();
  return apiFetch('/api/admin/settings', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(settings)
  });
}

export async function uploadAdminFile(file: File, fieldName: 'logo' | 'favicon' | 'avatar' | 'video'): Promise<{ url: string }> {
  const token = authStorage.getToken();
  const formData = new FormData();
  formData.append('file', file);
  formData.append('fieldname', fieldName); // Multer doesn't use this directly from body in this simple setup, but we actually need to change how the client sends it or how multer reads it.
  
  // Wait, multer gets the fieldname from the form field name itself. 
  // Let's create a new FormData and append the file with the specific fieldname.
  const realFormData = new FormData();
  realFormData.append(fieldName, file);

  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    },
    body: realFormData
  });
  
  if (!res.ok) {
    throw new Error('File upload failed');
  }
  return res.json();
}

export async function sendContactMessage(data: { name: string; email: string; message: string; userId?: string }) {
  return apiFetch('/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function getAdminMailbox() {
  const token = authStorage.getToken();
  return apiFetch('/api/admin/mailbox', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

export async function deleteMailboxMessage(messageId: string) {
  const token = authStorage.getToken();
  return apiFetch(`/api/admin/mailbox/${messageId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

export async function getAdminDemoUsers() {
  const token = authStorage.getToken();
  return apiFetch('/api/admin/demo-users', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

export async function addAdminDemoUser(data: any) {
  const token = authStorage.getToken();
  return apiFetch('/api/admin/demo-users', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
}

export async function updateAdminDemoUser(userId: string, data: any) {
  const token = authStorage.getToken();
  return apiFetch(`/api/admin/demo-users/${userId}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(data)
  });
}

export async function deleteAdminDemoUser(userId: string) {
  const token = authStorage.getToken();
  return apiFetch(`/api/admin/demo-users/${userId}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
}

export async function getAdminGifts() {
  return apiFetch('/api/admin/gifts');
}

export async function getGifts() {
  return apiFetch('/api/gifts');
}

export async function addAdminGift(formData: FormData) {
  return apiFetch('/api/admin/gifts', { method: 'POST', body: formData });
}

export async function updateAdminGift(id: string, formData: FormData) {
  return apiFetch(`/api/admin/gifts/${id}`, { method: 'PUT', body: formData });
}

export async function deleteAdminGift(id: string) {
  return apiFetch(`/api/admin/gifts/${id}`, { method: 'DELETE' });
}

export async function getAdminPurchases() {
  return apiFetch('/api/admin/purchases');
}

export async function createStripeCheckout(packId: string, packName: string, price: number, gemsToAdd: number) {
  return apiFetch('/api/payments/stripe/create-checkout', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packId, packName, price, gemsToAdd })
  });
}

export async function verifyStripeCheckout(session_id: string) {
  return apiFetch('/api/payments/stripe/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ session_id })
  });
}

export async function createPayPalOrder(packId: string, price: number, gemsToAdd: number) {
  return apiFetch('/api/payments/paypal/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packId, price, gemsToAdd })
  });
}

export async function capturePayPalOrder(token: string) {
  return apiFetch('/api/payments/paypal/capture', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token })
  });
}

export async function createRazorpayOrder(packId: string, price: number, gemsToAdd: number) {
  return apiFetch('/api/payments/razorpay/create-order', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packId, price, gemsToAdd })
  });
}

export async function verifyRazorpayOrder(data: any) {
  return apiFetch('/api/payments/razorpay/verify', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}

export async function getPacks() {
  return apiFetch('/api/packs');
}

export async function getAdminPacks() {
  return apiFetch('/api/admin/packs');
}
export async function addAdminPack(data: Partial<Pack>) {
  return apiFetch('/api/admin/packs', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
export async function updateAdminPack(id: string, data: Partial<Pack>) {
  return apiFetch(`/api/admin/packs/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
export async function deleteAdminPack(id: string) {
  return apiFetch(`/api/admin/packs/${id}`, { method: 'DELETE' });
}

export async function getAdminVipPlans() {
  return apiFetch('/api/admin/vip-plans');
}
export async function addAdminVipPlan(data: Partial<VipPlan>) {
  return apiFetch('/api/admin/vip-plans', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
export async function updateAdminVipPlan(id: string, data: Partial<VipPlan>) {
  return apiFetch(`/api/admin/vip-plans/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
}
export async function deleteAdminVipPlan(id: string) {
  return apiFetch(`/api/admin/vip-plans/${id}`, { method: 'DELETE' });
}

export const createFlutterwavePayment = async (packId: string, packName: string, price: number, gemsToAdd: number) => {
  return apiFetch('/api/payments/flutterwave/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packId, packName, price, gemsToAdd })
  });
};

export const createCashfreePayment = async (packId: string, packName: string, price: number, gemsToAdd: number) => {
  return apiFetch('/api/payments/cashfree/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packId, packName, price, gemsToAdd })
  });
};

export const createPhonePePayment = async (packId: string) => {
  return apiFetch('/api/payments/phonepe/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packId })
  });
};

export const createPayUPayment = async (packId: string, packName: string, price: number, gemsToAdd: number) => {
  return apiFetch('/api/payments/payu/init', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ packId, packName, price, gemsToAdd })
  });
};
