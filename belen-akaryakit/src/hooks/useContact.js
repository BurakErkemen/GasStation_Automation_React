import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";

export function useContact() {
  const [contact, setContact] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "contact"), (snap) => {
      if (snap.exists()) setContact(snap.data());
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { contact, loading };
}