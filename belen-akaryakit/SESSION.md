# Proje oturum notları

Son inceleme: 13 Ekim 2026.
Amaç: Proje yapısını sonraki eklemeler için kaydetmek. Bu oturumda uygulama kodu değiştirilmedi.

## 13 Ekim 2026 — Kart ve site ayarları eklemeleri

### Son revizyon — Banka İşlemleri

- 14 Ekim 2026: `/admin/market-shifts` Market Vardiyaları ekranı eklendi. Ayrı `marketShifts` koleksiyonunda tarih, vardiya, durum, çalışanlar, nakit satış ve banka bazında POS gün sonu tutulur. Toplam satış nakit + karttır; komisyon nakit satıştan düşülmez. Anlaşma koşulları vardiyada saklanır.
- Banka İşlemleri aylık raporu akaryakıt ve market POS kayıtlarını birleştirir; satış kaynağı filtresi eklenmiştir. `firestore.rules` içindeki marketShifts izni canlı Console'da yayınlanmalıdır; yerel dosyanın güncellenmesi canlı kuralları değiştirmez.

- 14 Ekim 2026: Kullanıcının paylaştığı Firestore kurallarında cardAgreements eşleşmesi bulunmadığı doğrulandı. Mevcut isAuth() kontrolüyle eşleşme eklenerek firestore.rules kaydedildi. CLI hesabının yetkisi olmadığı için canlı yayın yapılmadı; Firebase Console üzerinden yayınlanmalı. isAuth() yalnızca giriş durumunu kontrol eder, ayrı yönetici rolü kontrolü yapmaz.

- Banka anlaşması kaydetme hatası kullanıcı tarafından `permission-denied` olarak doğrulandı. Mevcut Firebase CLI hesabıyla canlı Firestore kurallarını okuma denemesi de Rules API üzerinde 403 döndürdü. Sunucu kuralları değiştirilmedi. Mevcut Rules içeriği kullanıcıdan istendi; cardAgreements izni mevcut yönetici yetkilendirmesiyle eşleştirilmeli.

- Önceki gerçek kesinti girişi kaldırıldı. Vardiyada sadece banka ve POS gün sonu tutarı girilir; komisyon her zaman vardiyada kayıtlı anlaşma oranından hesaplanır.
- Yeni adres `/admin/banks`, ekran adı Banka İşlemleri. `/admin/cards` bu adrese yönlenir.
- Banka İşlemleri içinde Aylık Gelir / Gider ve Bankalar ve Anlaşmalar sekmeleri bulunur. Ay seçimiyle kayıtlı her bankanın POS brüt geliri, komisyon gideri ve net geliri gösterilir; işlem olmayan bankalar sıfır tutarla görünür.
- Banka seçilmemiş eski POS kayıtları aylık banka toplamından ayrı gösterilir.
- Aşağıdaki ilk ekleme notlarının gerçek kesinti ve ekran adıyla ilgili kısımları bu revizyonla geçersizdir.

- `/admin/cards`: CardInfo ile banka, POS firması, yüzde komisyon, valör, anlaşma metni ve aktif/pasif durumu yönetilir. Firestore koleksiyonu `cardAgreements`.
- Vardiyalarda `cardPayments` dizisi banka anlaşması koşullarının kopyasını, brüt POS tutarını ve isteğe bağlı gerçek kesintiyi tutar. Oran değişikliği geçmiş vardiyaları değiştirmez.
- `src/utils/cardSummary.js` kuruşa yuvarlama, tahmini/gerçek kesinti ve net tutar hesabının ortak kaynağıdır. Gerçek kesinti boşsa oran kullanılır; sıfır gerçek kesinti geçerlidir.
- POS brütüne kartla borç tahsilatı dahildir. Komisyon nakit kasa hesabından düşülmez; `summary.cardCommission` ve `summary.netBank` ayrıca kaydedilir.
- Banka satırları varsa toplamları `sales.card` değerini belirler. Eski kayıtlarda banka satırı yoksa mevcut `sales.card` korunur; kesinti bilinmiyor kabul edilir.
- Dashboard aylık brüt, kesinti, net ve banka/firma kırılımını gösterir; eski kayıtlardaki bilinmeyen kesintiyi belirtir. Excel ve yazdırma raporlarına banka kırılımı eklendi.
- `/admin/settings` altında `fuel`, `content`, `contact` alt sekmeleri yer alır; eski adresler bu rotalara yönlenir.
- Hesaplama kontrolleri: `node --test tests/cardSummary.test.mjs`.
- Canlı Firestore erişimi ve yeni koleksiyonun sunucu izinleri yerel incelemede doğrulanmadı.

## Teknoloji ve çalıştırma

- React 19, React Router DOM 7, Vite 6; JavaScript/JSX ve ES modules.
- Tailwind CSS 4, Vite eklentisiyle kullanılıyor. Tema `src/index.css` içinde; OPET renkleri ve Barlow fontları var.
- Firebase 12: Authentication ve Firestore. Ayrı bir backend kaynak kodu bu proje dizininde görülmedi.
- `xlsx`: Excel dışa aktarma.
- Komutlar: `npm run dev`, `npm run build`, `npm run lint`, `npm run preview`.
- README halen varsayılan React/Vite metni. package.json içinde test komutu yok.

## Dizin haritası

```text
src/
  main.jsx                       React StrictMode ve uygulama başlangıcı
  App.jsx                        Router, AuthProvider ve sayfa eşleştirmeleri
  index.css                      Tailwind ve tema
  lib/firebase.js                Firebase başlatma; db ve auth dışa aktarımı
  config/siteConfig.js           Tanıtım sitesi varsayılan içerikleri
  context/AuthContext.jsx        Giriş, çıkış ve oturum etkinliği
  hooks/                         useContact, useFuelPrices, useSiteContent
  components/
    auth/ProtectedRoute.jsx      Yönetici rota koruması
    layout/                      Navbar, Footer
    sections/                    Hero, FuelPrices, OpetStrip, About, Services, Contact
    admin/ExportButtons.jsx      Ortak dışa aktarma butonları
  pages/
    LoginPage.jsx
    admin/                       Yönetim ekranları
  utils/
    listExport.js                Liste/çok sayfalı Excel, HTML yazdırma
    shiftExport.js               Vardiya Excel raporu
    shiftPrint.js                Vardiya yazdırma raporu
public/                          logo.jpg, icons.svg, favicon.svg
```

## Rotalar

- `/`: Navbar, Hero, FuelPrices, OpetStrip, About, Services, Contact ve Footer.
- `/admin/login`: Yönetici girişi.
- `/admin`: ProtectedRoute altında AdminLayout ve Dashboard.
- Alt yönetim rotaları: `shifts`, `contact`, `content`, `customers`, `fuel`, `employees`, `invoices`, `payments`, `suppliers`.
- Yeni yönetim ekranı eklenirken `App.jsx` rotası ve `AdminLayout.jsx` menüsü birlikte değerlendirilmeli.

## Kimlik doğrulama ve yapılandırma

- AuthContext, Firebase `onAuthStateChanged` ile kullanıcıyı izliyor; e-posta/parola ile giriş yapılıyor.
- ProtectedRoute kullanıcı yoksa `/admin/login` adresine yönlendiriyor.
- Hareketsizlik sınırı 30 dakika; etkinlik `admin_last_activity` localStorage anahtarında tutuluyor. Dakikalık kontrol ve click/keydown/mousemove/scroll dinleyicileri var.
- Firebase yapılandırması `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_STORAGE_BUCKET`, `VITE_FIREBASE_MESSAGING_SENDER_ID`, `VITE_FIREBASE_APP_ID` ortam değişkenlerinden okunuyor.
- `.env.local` mevcut; değerleri bu nota alınmadı. `sifre.txt` içeriği okunmadı ve nota alınmadı.
- Bu dizinde Firestore güvenlik kuralları, indeks tanımı veya Firebase dağıtım yapılandırması görülmedi. Sunucudaki kurallar bu incelemede doğrulanmadı.

## Firestore ve veri akışı

| Kaynak | Kullanım |
| --- | --- |
| `settings/contact` | Firma, adres, telefon, e-posta, çalışma saatleri, harita |
| `settings/fuelPrices` | Benzin, dizel, eurodiesel, LPG; önceki fiyatlar ve güncelleme zamanı |
| `settings/siteContent` | Hero, slaytlar, hakkımızda, hizmetler ve OPET şeridi |
| `shifts` | Vardiyalar, çalışanlar, yakıt satışları, ödeme dağılımı, veresiye, tahsilat, kasa ve özet |
| `customers` | Müşteri bilgileri; bakiye vardiya kayıtlarından hesaplanıyor |
| `employees` | Çalışan bilgileri ve vardiya ilişkileri |
| `invoices` | Faturalar, müşteri bilgileri, kalemler ve durum |
| `payments` | Ödemeler, alıcı, tür, yöntem ve durum |
| `suppliers` | Tedarikçi bilgileri ve ilişkili fatura/ödeme özetleri |

- Tanıtım hook'ları `onSnapshot` ile canlı veri dinliyor. İçerik/iletişim verisi olmadığında siteConfig varsayılanları kullanılıyor.
- Yönetim sayfaları çoğunlukla doğrudan Firestore `getDocs/getDoc` çağrıları yapıyor; kaydetme sonrası listeler yeniden yükleniyor.
- CRUD ve form state mantığı büyük ölçüde ilgili sayfa bileşeninde. Ayrı ortak servis katmanı görülmedi.
- Kayıtlarda `createdAt` / `updatedAt` için `serverTimestamp` kullanılıyor.

## Kritik iş kuralları

- Vardiya aralıkları `00-08`, `08-16`, `16-24`; yakıt anahtarları `benzin`, `dizel`, `eurodiesel`, `lpg`.
- `Shifts.jsx` içindeki `calcSummary` yakıt tutarı/litre, kart, Otobil, veresiye, tahsilat, gider ve kasa farkını hesaplıyor; özet vardiyaya kaydediliyor.
- Yakıt kart satışı = POS raporu - kartla borç tahsilatı.
- Hesaplanan nakit satış = yakıt toplamı - (yakıt kart satışı + veresiye + Otobil).
- Beklenen kasa = açılış + hesaplanan nakit satış + nakit tahsilat - giderler.
- Kasa farkı = kapanış - beklenen kasa. Beklenen banka = yakıt kart satışı + kart tahsilatı.
- Vardiya kaydetmek için en az bir çalışan seçilmeli.
- Müşteri bakiyesi, vardiyaların `creditSales` ve `debtCollections` dizilerinde `customerId` üzerinden hesaplanıyor: toplam veresiye - toplam tahsilat. Dashboard da benzer hesabı yapıyor.
- Tedarikçi ilişkileri mevcut kodda ad üzerinden: `payments.type === "supplier"` ve `payments.recipient === supplierName`; faturalar `invoices.customerName === supplierName` ile eşleştiriliyor. Ad değişikliği bu eşleşmeleri etkileyebilir.
- Excel çıktıları xlsx ile üretiliyor; PDF işlevleri tarayıcı yazdırma penceresine dayanıyor. Rapor değişikliklerinde ekran ve dışa aktarma yardımcıları birlikte kontrol edilmeli.

## Sonraki oturum için durum

- Kullanıcı birkaç ekleme yapmayı planlıyor; eklemelerin kapsamı henüz belirtilmedi.
- İlk incelemede `git status --short` çıktısı boştu.
- Bu çalışma kaynak incelemesidir; build, lint, tarayıcı ve canlı Firebase kontrolleri çalıştırılmadı.
- Sonraki değişikliğe başlamadan önce güncel git durumu ve ilgili dosyalar yeniden okunmalı; bu not kodun yerine geçmez.
