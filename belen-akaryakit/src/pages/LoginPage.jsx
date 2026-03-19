import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { siteConfig } from "../config/siteConfig";

const MAX_ATTEMPTS  = 5;
const LOCK_DURATION = 5 * 60 * 1000; // 5 dakika

export default function LoginPage() {
  const { login }   = useAuth();
  const navigate    = useNavigate();

  const [email,     setEmail]     = useState("");
  const [password,  setPassword]  = useState("");
  const [error,     setError]     = useState("");
  const [loading,   setLoading]   = useState(false);
  const [attempts,  setAttempts]  = useState(0);
  const [lockUntil, setLockUntil] = useState(null);

  function getRemainingLock() {
    if (!lockUntil) return 0;
    const remaining = Math.ceil((lockUntil - Date.now()) / 1000);
    return remaining > 0 ? remaining : 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();

    // Kilit kontrolü
    const remaining = getRemainingLock();
    if (remaining > 0) {
      const min = Math.floor(remaining / 60);
      const sec = remaining % 60;
      setError(`Çok fazla deneme. ${min > 0 ? `${min} dakika ` : ""}${sec} saniye bekleyin.`);
      return;
    }

    setError("");
    setLoading(true);

    try {
      await login(email, password);
      setAttempts(0);
      setLockUntil(null);
      navigate("/admin");
    } catch (err) {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        const until = Date.now() + LOCK_DURATION;
        setLockUntil(until);
        setError(`${MAX_ATTEMPTS} başarısız deneme. 5 dakika beklemeniz gerekiyor.`);
      } else {
        setError(`E-posta veya şifre hatalı. (${newAttempts}/${MAX_ATTEMPTS} deneme)`);
      }
    } finally {
      setLoading(false);
    }
  }

  const isLocked  = getRemainingLock() > 0;
  const remaining = getRemainingLock();

  return (
    <div className="min-h-screen bg-navy flex items-center justify-center px-4"
      style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.025) 1px,transparent 1px),linear-gradient(90deg,rgba(255,255,255,0.025) 1px,transparent 1px)", backgroundSize: "48px 48px" }}>
      <div className="w-full max-w-sm">

        <div className="flex items-center justify-center gap-3 mb-10">
          <span className="bg-orange text-white font-condensed font-black text-xl tracking-widest px-5 py-2 rounded">
            OPET
          </span>
          <div className="w-px h-8 bg-white/15" />
          <div>
            <p className="text-sm font-semibold text-white leading-tight">{siteConfig.firmName}</p>
            <p className="text-xs text-white/40">{siteConfig.location}</p>
          </div>
        </div>

        <div className="bg-[#0D1B30] border border-white/8 rounded-2xl p-8">
          <div className="mb-7">
            <h1 className="font-condensed font-black text-2xl text-white uppercase tracking-wide mb-1">
              Admin Girişi
            </h1>
            <p className="text-xs text-white/35">Yönetim paneline erişmek için giriş yapın.</p>
          </div>

          {/* Kilit uyarısı */}
          {isLocked && (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 mb-4 text-center">
              <p className="text-red-400 text-xs font-bold mb-1">🔒 Hesap geçici olarak kilitlendi</p>
              <p className="text-red-300 text-xs">
                {Math.floor(remaining / 60) > 0 && `${Math.floor(remaining / 60)} dakika `}
                {remaining % 60} saniye sonra tekrar deneyin.
              </p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                E-posta
              </label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="admin@example.com"
                required
                disabled={isLocked}
                className="bg-navy border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-orange transition-colors disabled:opacity-40" />
            </div>

            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold uppercase tracking-widest text-white/40">
                Şifre
              </label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                disabled={isLocked}
                className="bg-navy border border-white/10 rounded-lg px-4 py-3 text-sm text-white placeholder-white/20 outline-none focus:border-orange transition-colors disabled:opacity-40" />
            </div>

            {error && !isLocked && (
              <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-4 py-3 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Deneme sayısı göstergesi */}
            {attempts > 0 && attempts < MAX_ATTEMPTS && !isLocked && (
              <div className="flex gap-1">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <div key={i}
                    className={`h-1 flex-1 rounded-full transition-colors
                      ${i < attempts ? "bg-red-500" : "bg-white/10"}`} />
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || isLocked}
              className="mt-2 bg-orange text-white font-semibold text-sm py-3 rounded-lg hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed">
              {loading ? "Giriş yapılıyor..." : isLocked ? "🔒 Kilitlendi" : "Giriş Yap"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs text-white/20 mt-6">
          <a href="/" className="hover:text-white/50 transition-colors">← Ana sayfaya dön</a>
        </p>
      </div>
    </div>
  );
}