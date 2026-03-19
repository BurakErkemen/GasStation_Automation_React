import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { siteConfig } from "../config/siteConfig";

export function useSiteContent() {
  const [content, setContent] = useState(null);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "siteContent"), (snap) => {
      if (snap.exists()) setContent(snap.data());
    });
    return () => unsub();
  }, []);

  // Firebase verisi gelene kadar siteConfig fallback
  return {
    hero:     content?.hero     || { ...siteConfig.hero.title, ...siteConfig.hero },
    slides:   content?.slides   || siteConfig.hero.slides,
    about:    content?.about    || siteConfig.about,
    services: content?.services || siteConfig.services,
    strip:    content?.strip    || siteConfig.strip,
  };
}