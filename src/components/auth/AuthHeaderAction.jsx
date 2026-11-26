import { useState, useEffect } from 'react';
import { LogIn, LogOut } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

function getDisplayLabel(user) {
  const fullName = user?.displayName?.trim();
  if (fullName) {
    return fullName.split(/\s+/)[0];
  }
  if (user?.email) {
    return user.email.split('@')[0];
  }
  return 'Pengguna';
}

function getInitials(user) {
  const source = user?.displayName?.trim() || user?.email?.split('@')[0] || 'U';
  const parts = source.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return source.slice(0, 2).toUpperCase();
}

export default function AuthHeaderAction({ onOpenLogin, compact = false }) {
  const { user, loading, logout } = useAuth();
  const [imgError, setImgError] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setImgError(false);
  }, [user?.photoURL]);

  if (loading) {
    return <div className="auth-header-skeleton" aria-hidden="true" />;
  }

  const rootClass = `auth-header-action ${compact ? 'auth-header-action--compact' : ''}`.trim();

  if (!user) {
    return (
      <div className={rootClass}>
        <button
          type="button"
          className="btn-nav-back auth-header-login-btn"
          onClick={onOpenLogin}
          aria-label="Masuk ke akun"
        >
          <LogIn size={14} strokeWidth={2.5} />
          <span>Masuk</span>
        </button>
      </div>
    );
  }

  const shortName = getDisplayLabel(user);
  const fullTitle = user.displayName || user.email || shortName;
  const initials = getInitials(user);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      await logout();
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <div className={rootClass}>
      <div className="auth-user-chip" title={fullTitle}>
        <span className="auth-avatar" aria-hidden="true">
          {user.photoURL && !imgError ? (
            <img
              src={user.photoURL}
              alt=""
              className="auth-avatar-img"
              referrerPolicy="no-referrer"
              onError={() => setImgError(true)}
            />
          ) : (
            initials
          )}
        </span>
        <span className="auth-user-name">{shortName}</span>
      </div>
      <button
        type="button"
        className="auth-logout-btn"
        onClick={handleLogout}
        disabled={loggingOut}
        aria-label="Keluar dari akun"
      >
        <LogOut size={13} strokeWidth={2.5} />
        <span>{loggingOut ? '...' : 'Keluar'}</span>
      </button>
    </div>
  );
}
