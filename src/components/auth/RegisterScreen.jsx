import { useState } from 'react';
import { ArrowLeft, User, Mail, Lock, Eye, EyeOff, AlertCircle, Info } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { mapAuthError } from '../../services/authService';

function GoogleLogo() {
  return (
    <svg className="auth-google-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.2-2.27H12v4.3h6.44a5.5 5.5 0 0 1-2.39 3.61v3h3.87c2.26-2.08 3.57-5.15 3.57-8.64Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.07 7.93-2.91l-3.87-3a7.18 7.18 0 0 1-10.7-3.77H1.36v3.1A12 12 0 0 0 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.36 14.32A7.2 7.2 0 0 1 5 12c0-.8.14-1.58.36-2.32v-3.1H1.36A12 12 0 0 0 0 12c0 1.94.46 3.77 1.36 5.42l4-3.1Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.76 0 3.34.61 4.58 1.8l3.44-3.44C17.95 1.19 15.24 0 12 0A12 12 0 0 0 1.36 6.58l4 3.1A7.17 7.17 0 0 1 12 4.75Z"
      />
    </svg>
  );
}

export default function RegisterScreen({ onBack, onSuccess, onSwitchToLogin }) {
  const { registerWithEmail, loginWithGoogle, isConfigured } = useAuth();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const isBusy = submitting || googleLoading;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      setError('Semua kolom wajib diisi.');
      return;
    }

    if (password.length < 6) {
      setError('Kata sandi minimal 6 karakter.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Konfirmasi kata sandi tidak cocok.');
      return;
    }

    setSubmitting(true);
    try {
      await registerWithEmail(name, email, password);
      onSuccess?.();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError('');
    setGoogleLoading(true);
    try {
      await loginWithGoogle();
      onSuccess?.();
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setGoogleLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <header className="auth-topbar">
        <button
          type="button"
          className="btn-nav-back"
          onClick={onBack}
          aria-label="Kembali"
        >
          <ArrowLeft size={15} strokeWidth={2.5} />
          <span>Kembali</span>
        </button>
        <span className="auth-topbar-brand">MAMI</span>
      </header>

      <div className="auth-card-wrap">
        <section className="auth-card" aria-labelledby="auth-register-title">
          <div className="auth-hero">
            <div className="auth-mascot-wrap">
              <img
                src="/images/mascot/maskot_idle_1_breathing_blink.svg"
                alt="Maskot MAMI"
                className="auth-mascot-img"
                draggable={false}
              />
            </div>
            <span className="auth-badge">Buat Akun Baru</span>
            <h1 id="auth-register-title" className="auth-title">
              Kenalan dengan MAMI
            </h1>
            <p className="auth-subtitle">
              Daftar gratis untuk mulai atur menu harian yang sehat dan ramah di dompet.
            </p>
          </div>

          {!isConfigured && (
            <div className="auth-alert auth-alert--notice" role="status">
              <Info size={16} className="auth-alert-icon" />
              <span>
                Konfigurasi Firebase belum aktif. Lengkapi file <code>.env</code> untuk mengaktifkan pendaftaran.
              </span>
            </div>
          )}

          {error && (
            <div className="auth-alert auth-alert--error" role="alert">
              <AlertCircle size={16} className="auth-alert-icon" />
              <span>{error}</span>
            </div>
          )}

          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div className="auth-field">
              <label htmlFor="register-name" className="auth-label">
                Nama Lengkap
              </label>
              <div className="auth-input-wrap">
                <User size={16} className="auth-input-icon" />
                <input
                  id="register-name"
                  type="text"
                  className="auth-input"
                  placeholder="Masukkan nama lengkap"
                  autoComplete="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  disabled={isBusy}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-email" className="auth-label">
                Email
              </label>
              <div className="auth-input-wrap">
                <Mail size={16} className="auth-input-icon" />
                <input
                  id="register-email"
                  type="email"
                  className="auth-input"
                  placeholder="nama@email.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isBusy}
                />
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-password" className="auth-label">
                Kata Sandi
              </label>
              <div className="auth-input-wrap">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="register-password"
                  type={showPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Minimal 6 karakter"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isBusy}
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? 'Sembunyikan kata sandi' : 'Lihat kata sandi'}
                  disabled={isBusy}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div className="auth-field">
              <label htmlFor="register-confirm-password" className="auth-label">
                Konfirmasi Kata Sandi
              </label>
              <div className="auth-input-wrap">
                <Lock size={16} className="auth-input-icon" />
                <input
                  id="register-confirm-password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  className="auth-input"
                  placeholder="Ulangi kata sandi"
                  autoComplete="new-password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isBusy}
                />
                <button
                  type="button"
                  className="auth-toggle-pw"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  aria-label={
                    showConfirmPassword
                      ? 'Sembunyikan konfirmasi kata sandi'
                      : 'Lihat konfirmasi kata sandi'
                  }
                  disabled={isBusy}
                >
                  {showConfirmPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="auth-submit-btn"
              disabled={isBusy || !isConfigured}
            >
              {submitting ? (
                <>
                  <span className="auth-spinner" aria-hidden="true" />
                  <span>Mendaftarkan...</span>
                </>
              ) : (
                <span>Daftar</span>
              )}
            </button>
          </form>

          <div className="auth-divider">
            <span>atau</span>
          </div>

          <button
            type="button"
            className="auth-google-btn"
            onClick={handleGoogleRegister}
            disabled={isBusy || !isConfigured}
          >
            {googleLoading ? (
              <>
                <span className="auth-spinner auth-spinner--pink" aria-hidden="true" />
                <span>Menghubungkan Google...</span>
              </>
            ) : (
              <>
                <GoogleLogo />
                <span>Daftar dengan Google</span>
              </>
            )}
          </button>

          <footer className="auth-footer">
            <span>Sudah punya akun?</span>
            <button
              type="button"
              className="auth-link-btn"
              onClick={onSwitchToLogin}
              disabled={isBusy}
            >
              Masuk di sini
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}
