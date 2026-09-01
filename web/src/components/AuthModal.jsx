import React, { useState } from 'react';
import { X, LogIn, UserPlus, AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';
import { authAPI } from '../api/client';
import { useAuth } from '../context/AuthContext';

export const AuthModal = ({ onClose }) => {
  const { login } = useAuth();
  const [tab, setTab] = useState('login'); // 'login' | 'register' | 'forgot'
  const [identifier, setIdentifier] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await authAPI.login({ identifier, password });
      if (res.data?.token) {
        login(res.data.token, res.data.user);
        onClose();
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal masuk. Periksa kembali email/username dan kata sandi Anda.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setError('Konfirmasi password tidak cocok');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await authAPI.register({
        username,
        email,
        password,
        confirm_password: confirmPassword,
      });
      setSuccessMsg(res.data?.message || 'Registrasi berhasil! Silakan periksa email Anda untuk verifikasi.');
      setTab('login');
      setUsername('');
      setPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal mendaftar akun baru.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccessMsg('');

    try {
      const res = await authAPI.forgotPassword(email);
      setSuccessMsg(res.data?.message || 'Instruksi reset password telah dikirim ke email Anda.');
    } catch (err) {
      setError(err.response?.data?.error || 'Gagal memproses permintaan.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white w-full max-w-md rounded-2xl shadow-xl overflow-hidden border border-slate-200 flex flex-col my-auto">
        
        {/* Header */}
        <div className="p-4 border-b border-slate-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-sky-600 flex items-center justify-center text-white font-bold text-sm">
              L
            </div>
            <h2 className="text-base font-bold text-slate-900">
              {tab === 'login' ? 'Masuk ke Lumiina' : tab === 'register' ? 'Buat Akun Baru' : 'Lupa Kata Sandi'}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Switcher */}
        {tab !== 'forgot' && (
          <div className="flex border-b border-slate-100 bg-slate-50/50 p-1">
            <button
              onClick={() => { setTab('login'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'login'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Masuk (Login)
            </button>
            <button
              onClick={() => { setTab('register'); setError(''); }}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                tab === 'register'
                  ? 'bg-white text-sky-700 shadow-xs'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Daftar (Register)
            </button>
          </div>
        )}

        {/* Body Form */}
        <div className="p-6 flex flex-col gap-4">
          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-700 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
          )}

          {tab === 'login' && (
            <form onSubmit={handleLogin} className="flex flex-col gap-3.5">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Email atau Username</label>
                <input
                  type="text"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="masukkan email atau username"
                  required
                  className="px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-slate-700">Kata Sandi</label>
                  <button
                    type="button"
                    onClick={() => { setTab('forgot'); setError(''); }}
                    className="text-[11px] font-semibold text-sky-600 hover:underline cursor-pointer"
                  >
                    Lupa sandi?
                  </button>
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  required
                  className="px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {loading ? 'Memproses...' : 'Masuk Sekarang'}
              </button>
            </form>
          )}

          {tab === 'register' && (
            <form onSubmit={handleRegister} className="flex flex-col gap-3">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Username Artist *</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="contoh: kuro_illust"
                  required
                  className="px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Alamat Email *</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@domain.com"
                  required
                  className="px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Kata Sandi *</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Min 6 karakter"
                    minLength={6}
                    required
                    className="px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-slate-700">Konfirmasi *</label>
                  <input
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="Ketik ulang"
                    minLength={6}
                    required
                    className="px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {loading ? 'Mendaftarkan Akun...' : 'Daftar Sebagai Artist'}
              </button>
            </form>
          )}

          {tab === 'forgot' && (
            <form onSubmit={handleForgotPassword} className="flex flex-col gap-3">
              <p className="text-xs text-slate-500">
                Masukkan alamat email yang terdaftar. Kami akan mengirimkan tautan reset kata sandi sementara (berlaku 15 menit).
              </p>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-slate-700">Email Akun</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="nama@domain.com"
                  required
                  className="px-3.5 py-2 text-sm bg-white rounded-xl border border-slate-200 focus:border-sky-500 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-2.5 bg-sky-600 hover:bg-sky-500 active:bg-sky-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors cursor-pointer"
              >
                {loading ? 'Mengirim...' : 'Kirim Tautan Reset'}
              </button>

              <button
                type="button"
                onClick={() => { setTab('login'); setError(''); }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 text-center mt-1 cursor-pointer"
              >
                ← Kembali ke Halaman Masuk
              </button>
            </form>
          )}
        </div>

      </div>
    </div>
  );
};
