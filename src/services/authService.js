import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from 'firebase/auth';
import { auth, googleProvider, isFirebaseConfigured } from '../config/firebase';

const ERROR_MESSAGES = {
  'auth/not-configured':
    'Konfigurasi Firebase belum lengkap. Isi variabel VITE_FIREBASE_* di file .env terlebih dahulu.',
  'auth/invalid-email': 'Format alamat email tidak valid.',
  'auth/user-disabled': 'Akun ini sedang dinonaktifkan.',
  'auth/user-not-found': 'Email atau kata sandi salah.',
  'auth/wrong-password': 'Email atau kata sandi salah.',
  'auth/invalid-credential': 'Email atau kata sandi salah.',
  'auth/email-already-in-use':
    'Email ini sudah terdaftar. Silakan masuk menggunakan akun tersebut.',
  'auth/weak-password': 'Kata sandi terlalu lemah. Gunakan minimal 6 karakter.',
  'auth/too-many-requests': 'Terlalu banyak percobaan. Coba lagi beberapa saat nanti.',
  'auth/network-request-failed': 'Gagal terhubung ke jaringan. Periksa koneksi internet kamu.',
  'auth/popup-closed-by-user': 'Jendela login Google ditutup sebelum selesai.',
  'auth/cancelled-popup-request': 'Permintaan login Google dibatalkan.',
  'auth/popup-blocked':
    'Popup login Google diblokir oleh browser. Izinkan popup lalu coba lagi.',
  'auth/account-exists-with-different-credential':
    'Email ini sudah terdaftar dengan metode masuk lain.',
  'auth/operation-not-allowed':
    'Metode autentikasi ini belum diaktifkan di Firebase Console.',
};

function createNotConfiguredError() {
  const err = new Error(ERROR_MESSAGES['auth/not-configured']);
  err.code = 'auth/not-configured';
  return err;
}

function ensureAuthReady() {
  if (!isFirebaseConfigured || !auth) {
    throw createNotConfiguredError();
  }
}

export function mapAuthError(error) {
  const code = error?.code;
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }
  return 'Terjadi kesalahan saat memproses autentikasi. Silakan coba lagi.';
}

export async function loginWithEmail(email, password) {
  ensureAuthReady();
  const credential = await signInWithEmailAndPassword(auth, email.trim(), password);
  return credential.user;
}

export async function registerWithEmail(name, email, password) {
  ensureAuthReady();
  const credential = await createUserWithEmailAndPassword(auth, email.trim(), password);
  const trimmedName = name.trim();
  if (trimmedName) {
    await updateProfile(credential.user, { displayName: trimmedName });
    await credential.user.reload();
  }
  return auth.currentUser || credential.user;
}

export async function loginWithGoogle() {
  ensureAuthReady();
  const credential = await signInWithPopup(auth, googleProvider);
  return credential.user;
}

export async function logout() {
  if (!isFirebaseConfigured || !auth) return;
  await signOut(auth);
}
