import { initializeApp, getApps, getApp, deleteApp, FirebaseApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, signInWithPopup, signInAnonymously, Auth } from 'firebase/auth';

let app: FirebaseApp | null = null;
let auth: Auth | null = null;
let provider: GoogleAuthProvider | null = null;
let activeConfigKey = '';

export function parseFirebaseConfig(raw: any): Record<string, string> | null {
  if (!raw) return null;
  if (typeof raw === 'object') {
    if (raw.apiKey && raw.projectId) return raw;
  }
  if (typeof raw !== 'string') return null;

  const trimmed = raw.trim();
  if (!trimmed) return null;

  // 1. Try standard JSON.parse
  try {
    const parsed = JSON.parse(trimmed);
    if (parsed && typeof parsed === 'object' && parsed.apiKey && parsed.projectId) {
      return parsed;
    }
  } catch (_) {}

  // 2. Direct regex extraction of standard Firebase keys
  const extract = (key: string): string | undefined => {
    const re = new RegExp('["\']?' + key + '["\']?\\s*:\\s*["\'`]([^"\'`]+)["\'`]', 'i');
    const m = trimmed.match(re);
    return m ? m[1].trim() : undefined;
  };

  const apiKey = extract('apiKey');
  const projectId = extract('projectId');
  const authDomain = extract('authDomain');
  const storageBucket = extract('storageBucket');
  const messagingSenderId = extract('messagingSenderId');
  const appId = extract('appId');
  const measurementId = extract('measurementId');

  if (apiKey && projectId) {
    const res: Record<string, string> = {
      apiKey,
      authDomain: authDomain || (projectId + '.firebaseapp.com'),
      projectId,
      storageBucket: storageBucket || (projectId + '.firebasestorage.app'),
      messagingSenderId: messagingSenderId || '',
      appId: appId || ''
    };
    if (measurementId) res.measurementId = measurementId;
    return res;
  }

  // 3. Fallback: match outermost { ... }
  const objMatch = trimmed.match(/\{[\s\S]*\}/);
  if (objMatch) {
    try {
      const fn = new Function('return (' + objMatch[0] + ')');
      const obj = fn();
      if (obj && obj.apiKey && obj.projectId) return obj;
    } catch (_) {}
  }

  return null;
}

export const initFirebase = (configInput: any): Auth | null => {
  if (!configInput) return auth;

  const config = parseFirebaseConfig(configInput);
  if (!config || !config.apiKey || !config.projectId) {
    console.warn('Firebase config could not be parsed:', configInput);
    return auth;
  }

  const configKey = `${config.apiKey}_${config.projectId}_${config.appId || ''}`;

  if (app && auth && activeConfigKey === configKey) {
    return auth;
  }

  try {
    const existingApps = getApps();
    if (existingApps.length > 0) {
      const oldApp = existingApps[0];
      if (activeConfigKey && activeConfigKey !== configKey) {
        try {
          deleteApp(oldApp);
        } catch (_) {}
        app = initializeApp(config);
      } else {
        app = oldApp;
      }
    } else {
      app = initializeApp(config);
    }

    auth = getAuth(app);
    provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    activeConfigKey = configKey;
    return auth;
  } catch (err) {
    console.error('Failed to initialize Firebase app:', err);
    try {
      const existing = getApps();
      if (existing.length > 0) {
        app = existing[0];
        auth = getAuth(app);
        provider = new GoogleAuthProvider();
        return auth;
      }
    } catch (_) {}
    return null;
  }
};

export const getFirebaseAuth = (): Auth | null => {
  return auth;
};

export const signInWithGoogle = async (configFallback?: any) => {
  if (!auth && configFallback) {
    initFirebase(configFallback);
  }
  if (!auth) {
    throw new Error('Firebase configuration is missing or invalid. Please check Firebase settings in Admin Panel.');
  }
  if (!provider) {
    provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
  }
  const result = await signInWithPopup(auth, provider);
  return result.user;
};

export const signInGuest = async (configFallback?: any) => {
  if (!auth && configFallback) {
    initFirebase(configFallback);
  }
  if (!auth) {
    throw new Error('Firebase not initialized');
  }
  const result = await signInAnonymously(auth);
  return result.user;
};
