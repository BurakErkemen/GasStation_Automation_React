export const siteConfig = {
  // ── Genel ──────────────────────────────────────
  firmName: "Kahramanlar Belen Akaryakıt",
  location: "Hatay / Belen",
  phone: "0 (000) 000 00 00",
  email: "info@belenakaryakit.com",
  hours: "7/24 Açık",
  address: "Hatay / Belen",
  mapIframe: "",

  // ── Navbar ─────────────────────────────────────
  navbar: {
    brand: "OPET",
    links: [
      { label: "Fiyatlar", href: "#fuel" },
      { label: "Hakkımızda", href: "#about" },
      { label: "Hizmetler", href: "#services" },
      { label: "İletişim", href: "#contact" },
    ],
    instagram: {
      label: "Instagram",
      href: "https://www.instagram.com/kahramanlaropetbelen/",
    },
  },

  // ── Hero ───────────────────────────────────────
  hero: {
    kicker: "Opet Çözüm Ortağı",
    title: {
      line1: "Belen'in",
      accent: "Güvenilir",
      line3: "Yakıt Noktası",
    },
    description:
      "Güvenli dolum, hızlı hizmet ve konforlu mola. Canlı akaryakıt fiyatları Firebase üzerinden anlık güncellenir.",
    buttons: {
      primary: { label: "Güncel Fiyatlar", href: "#fuel" },
      secondary: { label: "Konum & İletişim", href: "#contact" },
    },
    pills: [
      { icon: "⛽", label: "Güvenli Dolum" },
      { icon: "⚡", label: "Hızlı Hizmet" },
      { icon: "☕", label: "Mola Alanı" },
    ],
    slides: [
      {
        tag: "Hizmet",
        n: "01",
        title: "Opet Kalitesi",
        body: "Standartlara uygun, güvenilir akaryakıt ve profesyonel hizmet anlayışıyla yanınızdayız.",
      },
      {
        tag: "Market",
        n: "02",
        title: "Market İmkânı",
        body: "Yol üstü ihtiyaçlarınız için pratik alışveriş. Atıştırmalık, içecek ve daha fazlası.",
      },
      {
        tag: "Konfor",
        n: "03",
        title: "Konforlu Mola",
        body: "Temiz ve ferah dinlenme alanıyla yolculuğunuza taze bir başlangıç yapın.",
      },
    ],
  },

  // ── Yakıt Fiyatları ────────────────────────────
  fuelPrices: {
    title: "Anlık Akaryakıt Fiyatları",
    subtitle: "Hatay / Belen · Firebase üzerinden canlı güncelleme",
    disclaimer: "Fiyatlar bilgilendirme amaçlıdır; pompaya göre farklılık gösterebilir.",
    ctaLabel: "İletişime Geç →",
    cards: [
      { key: "benzin", label: "Benzin", bar: "bg-orange", dot: "bg-orange" },
      { key: "dizel", label: "Dizel", bar: "bg-sky", dot: "bg-sky" },
      { key: "eurodiesel", label: "Eurodiesel", bar: "bg-green-500", dot: "bg-green-500" },
      { key: "lpg", label: "LPG", bar: "bg-purple-500", dot: "bg-purple-500" },
    ],
  },

  // ── Opet Strip ─────────────────────────────────
  strip: {
    text: "Opet'se",
    accent: "Fark Eder!",
    badge: "OPET",
    sub: "Çözüm Ortağı",
  },

  // ── Hakkımızda ─────────────────────────────────
  about: {
    eyebrow: "Hakkımızda",
    title: { line1: "Güvenin", line2: "Durağı" },
    description:
      "Kahramanlar Belen Akaryakıt olarak Hatay/Belen bölgesinde, Opet çözüm ortağı güvencesiyle hizmet veriyoruz. Her dolumda kalite, her ziyarette memnuniyet.",
    ticks: [
      "Kurumsal yaklaşım & müşteri memnuniyeti",
      "Hızlı dolum & güvenli ödeme seçenekleri",
      "Market ve konforlu mola alanı",
      "7/24 kesintisiz hizmet",
    ],
    mission: {
      title: "Misyonumuz",
      body: "Yolculuğunuzu daha güvenli, hızlı ve konforlu kılacak hizmeti istikrarlı biçimde sunmak. Opet kalitesiyle her sürüşe değer katıyoruz.",
    },
    stats: [
      { n: "7/24", l: "Kesintisiz hizmet" },
      { n: "4", l: "Yakıt türü" },
      { n: "Opet", l: "Çözüm ortağı" },
      { n: "Belen", l: "Hatay merkezi" },
    ],
  },

  // ── Hizmetler ──────────────────────────────────
  services: {
    eyebrow: "Hizmetler",
    title: "Neler Sunuyoruz",
    items: [
      {
        icon: "⛽",
        title: "Yakıt & Ödeme",
        desc: "Opet kalitesiyle güvenli dolum, hızlı ödeme ve kurumsal yakıt çözümleri.",
        items: ["Benzin, Dizel, Eurodiesel, LPG", "POS / temassız ödeme", "Kurumsal müşteri desteği"],
        link: "Bilgi Al",
      },
      {
        icon: "🛒",
        title: "Market",
        desc: "Yol üstü ihtiyaçlarınız için pratik alışveriş: atıştırmalık, içecek ve temel ürünler.",
        items: ["Sıcak / soğuk içecek", "Atıştırmalık & temel ihtiyaç", "Hızlı kasa"],
        link: "Detay Sor",
      },
      {
        icon: "☕",
        title: "Mola & Konfor",
        desc: "Temiz ve ferah bir dinlenme alanı ile yolculuğunuza daha rahat devam edin.",
        items: ["Dinlenme alanı", "Temiz kullanım alanları", "Yol tarifi & destek"],
        link: "İletişim",
      },
    ],
  },

  // ── İletişim ───────────────────────────────────
  contact: {
    eyebrow: "İletişim",
    title: { line1: "Bize", line2: "Ulaşın" },
    items: [
      { icon: "📍", label: "Adres", key: "address" },
      { icon: "📞", label: "Telefon", key: "phone" },
      { icon: "✉️", label: "E-posta", key: "email" },
      { icon: "🕐", label: "Çalışma Saatleri", key: "hours" },
    ],
    mapPlaceholder: {
      title: "Google Maps",
      sub: "Admin panelinden harita iframe eklenecek",
    },
  },

  // ── Footer ─────────────────────────────────────
  footer: {
    copy: "© 2026 Kahramanlar Belen Akaryakıt · Tüm hakları saklıdır.",
    links: [
      { label: "Admin Paneli", href: "/admin/login" },
      { label: "Hakkımızda", href: "#about" },
      { label: "İletişim", href: "#contact" },
    ],
    credit: {
      label: "Created By Cyan Danışmanlık - Burak Furkan ERKEMEN",
      href: "https://www.cyandanismanlik.com",
      shortLabel: "Cyan Danışmanlık",
    },
  },
};