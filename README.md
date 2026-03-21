# ⛽ GasStation Automation System (Frontend)

Modern akaryakıt istasyonları için geliştirilmiş, yüksek performanslı ve kullanıcı dostu bir yönetim arayüzü. Bu proje, karmaşık istasyon verilerini (pompa takibi, stok yönetimi, vardiya raporları) tek bir panelden yönetmek için tasarlanmıştır.

### 🛠️ Teknolojik Altyapı
- **Core:** React.js (Vite)
- **Language:** TypeScript (Strict Type Checking)
- **Styling:** Tailwind CSS & Custom CSS Modules
- **State Management:** React Hooks (useState, useEffect)
- **Icons:** FontAwesome / Lucide React

### 🎯 Proje Kapsamı
Bu uygulama, bir akaryakıt istasyonunun günlük operasyonel ihtiyaçlarını dijitalleştirmeyi amaçlar:
- **Anlık Pompa İzleme:** Yakıt satışlarının gerçek zamanlı görselleştirilmesi.
- **Stok Takibi:** Tanklardaki yakıt seviyelerinin kritik eşik kontrolleri.
- **Vardiya Yönetimi:** Personel bazlı satış ve ciro raporlaması.
- **Müşteri Paneli:** Sadakat programı ve plaka bazlı işlem geçmişi.

### 🚀 Öne Çıkan Özellikler
- **Vite ile Ultra Hızlı Geliştirme:** Hot Module Replacement (HMR) ile optimize edilmiş çalışma ortamı.
- **Responsive Mimari:** Tablet ve mobil cihazlarda tam uyumlu yönetim ekranları.
- **Clean Code:** Modüler bileşen yapısı ve okunabilir dosya hiyerarşisi.

### 📂 Klasör Yapısı
```text
src/
 ├── assets/      # Görsel ve font kaynakları
 ├── components/  # Yeniden kullanılabilir UI bileşenleri
 ├── pages/       # Dashboard, Stok, Raporlar gibi ana sayfalar
 ├── styles/      # Global ve Tailwind konfigürasyonları
 └── App.tsx      # Ana uygulama rotası ve logic
