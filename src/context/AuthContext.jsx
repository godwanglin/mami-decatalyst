import { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { auth, isFirebaseConfigured } from '../config/firebase';
import {
  loginWithEmail as loginWithEmailService,
  registerWithEmail as registerWithEmailService,
  loginWithGoogle as loginWithGoogleService,
  logout as logoutService,
} from '../services/authService';

const AuthContext = createContext(null);

function serializeUser(firebaseUser) {
  if (!firebaseUser) return null;
  return {
    uid: firebaseUser.uid,
    email: firebaseUser.email || '',
    displayName: firebaseUser.displayName || '',
    photoURL: firebaseUser.photoURL || '',
    emailVerified: Boolean(firebaseUser.emailVerified),
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(isFirebaseConfigured);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth) {
      setLoading(false);
      return undefined;
    }

    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(serializeUser(firebaseUser));
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  const loginWithEmail = useCallback(async (email, password) => {
    const signedInUser = await loginWithEmailService(email, password);
    const snapshot = serializeUser(auth?.currentUser || signedInUser);
    setUser(snapshot);
    return snapshot;
  }, []);

  const registerWithEmail = useCallback(async (name, email, password) => {
    const createdUser = await registerWithEmailService(name, email, password);
    const activeUser = auth?.currentUser || createdUser;
    if (activeUser && typeof activeUser.reload === 'function') {
      await activeUser.reload();
    }
    const snapshot = serializeUser(auth?.currentUser || activeUser);
    if (snapshot && !snapshot.displayName && name.trim()) {
      snapshot.displayName = name.trim();
    }
    setUser(snapshot);
    return snapshot;
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const signedInUser = await loginWithGoogleService();
    const snapshot = serializeUser(auth?.currentUser || signedInUser);
    setUser(snapshot);
    return snapshot;
  }, []);

  const logout = useCallback(async () => {
    await logoutService();
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      loading,
      isConfigured: isFirebaseConfigured,
      loginWithEmail,
      registerWithEmail,
      loginWithGoogle,
      logout,
    }),
    [user, loading, loginWithEmail, registerWithEmail, loginWithGoogle, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth harus digunakan di dalam AuthProvider.');
  }
  return context;
}
