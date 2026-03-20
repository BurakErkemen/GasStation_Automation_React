import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { siteConfig } from "../config/siteConfig";

const fallback = {
  firmName:  siteConfig.firmName,
  location:  siteConfig.location,
  address:   siteConfig.address,
  phone:     siteConfig.phone,
  email:     siteConfig.email,
  hours:     siteConfig.hours,
  mapIframe: siteConfig.mapIframe,
};

export function useContact() {
  const [contact, setContact] = useState(fallback);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "contact"), (snap) => {
      if (snap.exists()) {
        setContact({ ...fallback, ...snap.data() });
      } else {
        setContact(fallback);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  return { contact, loading };
}