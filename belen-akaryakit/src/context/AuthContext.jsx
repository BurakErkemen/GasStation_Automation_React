import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { auth } from "../lib/firebase";

const AuthContext = createContext(null);

const SESSION_TIMEOUT = 30 * 60 * 1000; // 30 dakika (ms)
const LAST_ACTIVITY_KEY = "admin_last_activity";

export function AuthProvider({ children }) {
  const [user,    setUser]    = useState(null);
  const [loading, setLoading] = useState(true);

  function updateActivity() {
    localStorage.setItem(LAST_ACTIVITY_KEY, Date.now().toString());
  }

  // Oturum süresi dolmuş mu kontrol et
  function isSessionExpired() {
    const last = localStorage.getItem(LAST_ACTIVITY_KEY);
    if (!last) return true;
    return Date.now() - parseInt(last) > SESSION_TIMEOUT;
  }

  async function handleLogout() {
    localStorage.removeItem(LAST_ACTIVITY_KEY);
    await signOut(auth);
  }

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      if (u && isSessionExpired()) {
        // Kullanıcı var ama oturum süresi dolmuş
        handleLogout();
      } else {
        setUser(u);
        if (u) updateActivity();
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!user) return;

    // Her 1 dakikada bir oturum süresi kontrolü
    const interval = setInterval(() => {
      if (isSessionExpired()) {
        handleLogout();
      }
    }, 60 * 1000);

    // Kullanıcı etkileşimlerinde aktiviteyi güncelle
    const events = ["click", "keydown", "mousemove", "scroll"];
    const handleActivity = () => updateActivity();
    events.forEach(e => window.addEventListener(e, handleActivity));

    return () => {
      clearInterval(interval);
      events.forEach(e => window.removeEventListener(e, handleActivity));
    };
  }, [user]);

  const login = async (email, password) => {
    const result = await signInWithEmailAndPassword(auth, email, password);
    updateActivity();
    return result;
  };

  const logout = () => handleLogout();

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {!loading && children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}