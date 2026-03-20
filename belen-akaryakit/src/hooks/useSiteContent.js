import { useEffect, useState } from "react";
import { doc, onSnapshot } from "firebase/firestore";
import { db } from "../lib/firebase";
import { siteConfig } from "../config/siteConfig";

export function useSiteContent() {
  const [content, setContent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, "settings", "siteContent"), (snap) => {
      if (snap.exists()) setContent(snap.data());
      else setContent(null);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  // Firebase'den veri gelene kadar veya yoksa siteConfig'den besle
  const c = siteConfig;

  return {
    loading,
    hero: content?.hero || {
      kicker:      c.hero.kicker,
      titleLine1:  c.hero.title.line1,
      titleAccent: c.hero.title.accent,
      titleLine3:  c.hero.title.line3,
      description: c.hero.description,
      primaryBtn:  c.hero.buttons.primary.label,
      secondaryBtn:c.hero.buttons.secondary.label,
      pills:       c.hero.pills,
    },
    slides:   content?.slides   || c.hero.slides.map(s => ({
      tag: s.tag, n: s.n, title: s.title, body: s.body,
    })),
    about: content?.about || {
      eyebrow:     c.about.eyebrow,
      titleLine1:  c.about.title.line1,
      titleLine2:  c.about.title.line2,
      description: c.about.description,
      ticks:       c.about.ticks,
      missionTitle:c.about.mission.title,
      missionBody: c.about.mission.body,
      stats:       c.about.stats,
    },
    services: content?.services || {
      eyebrow: c.services.eyebrow,
      title:   c.services.title,
      items:   c.services.items,
    },
    strip: content?.strip || {
      text:   c.strip.text,
      accent: c.strip.accent,
      badge:  c.strip.badge,
      sub:    c.strip.sub,
    },
  };
}