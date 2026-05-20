
# 📱 EvrakAI — Mobil Uygulama Kullanıcı Rehberi

## Uygulama Nedir?

**EvrakAI**, yapay zeka destekli bir mobil uygulamadır. Kullanıcıların resmi evrakları (dilekçe, kira sözleşmesi, ihtarname vb.) hızlı, doğru ve profesyonel bir şekilde oluşturmasını sağlar. Kullanıcı sohbet arayüzünde belgeyle ilgili bilgileri anlatır, yapay zeka eksik bilgileri sorarak tamamlar ve belgeyi hazırlar. Belge önizleme, düzenleme ve PDF indirme özellikleri sunar.

---

## 🏠 Ana Sayfa (Sohbet Ekranı)

### Üst Kısım
- **Karşılama Mesajı:** "Bugün hangi belgeyi oluşturmak istersiniz?"
- **Hızlı Etiketler (Chip'ler):** Dilekçe, Kira Sözleşmesi, İhtarname, İstifa Dilekçesi, İzin Talebi, Kayıt Dondurma Talebi vb. etiketler. Kullanıcı bir etikete dokunarak hızlıca başlayabilir.

### Orta Kısım — Sohbet Alanı
- Kullanıcı metin olarak belge talebini yazar.
- Yapay zeka belge türünü analiz eder ve teyit sorar: *"Dilekçe mi oluşturmak istiyorsunuz?"* (Evet/Hayır)
- Yapay zeka eksik bilgileri tespit eder ve sırayla sorar:
  - Örnek: "Kiracının adı soyadı nedir?", "Kira bedeli ne kadar?", "Sözleşme süresi kaç ay?"
- Her soru-cevap sohbet balonları şeklinde görünür.

### Sohbet Kotası
- Ekranın üst köşesinde bir kota göstergesi bulunur.
- Belge oluşturma sürecinde sınırlı mesaj hakkı vardır.
- Kota dolarsa, küçük bir ücretle uzatma seçeneği sunulur.
- Amaç: Sistemin suistimal edilmesini önlemek.

### Alt Kısım — Metin Girişi
- Mesaj yazma alanı ve gönder butonu.
- Sesli giriş desteği (opsiyonel).

---

## 📄 Belge Önizleme ve Düzenleme (Çekmece / Modal)

### Önizleme Açma
- Sohbet sırasında ekranın sağ kenarından sola doğru çekerek veya "Önizle" butonuna basarak belge önizlemesi açılır.
- Belge önizlemesi tam ekran modal olarak da görüntülenebilir.

### Önizleme İçeriği
- Belgenin PDF formatına yakın görünümü.
- Resmi dil ve format kurallarına uygun hazırlanmış metin.

### Düzenleme
- Belgede değiştirilmesini istenen bölüme dokunulur.
- "Bunu Düzelt" butonuna basılır.
- Kullanıcı yapay zekaya talimat verir: *"Kira bedelini 15.000 TL olarak güncelle."*
- Yapay zeka belgeyi revize eder.

### İndirme Seçenekleri
- **PDF İndir:** Standart ve güvenli format.
- **Düz Metin (.txt):** Basit kopyalama için.

---

## 📁 Belgelerim Sekmesi

### Belge Listesi
- Kullanıcının oluşturduğu tüm belgeler kronolojik sırayla listelenir.
- Her belgede:
  - Belge türü (Dilekçe, Kira Sözleşmesi vb.)
  - Oluşturma tarihi
  - Önizleme küçük resmi
  - Durum: Tamamlandı / Taslak

### Versiyon Geçmişi
- Her belgenin önceki hallerine erişim.
- "Önceki Versiyona Dön" seçeneği.
- Yapılan değişiklikler vurgulanarak (diff) gösterilebilir.

### Favoriler ve Kategoriler
- Belgeler kategoriye göre filtrelenebilir: Hukuki, İş Hayatı, Eğitim, Kişisel.
- Sık kullanılan belgeler yıldızlanabilir.

### Arama
- Belge türüne veya içeriğe göre arama yapılabilir.

---

## 👤 Profilim Sekmesi

### Giriş Seçenekleri
- **Google ile Giriş**
- **Apple ile Giriş**
- **E-posta + Şifre**

### Kullanıcı Bilgileri
- Ad, soyad, telefon, adres, TCKN gibi sık kullanılan bilgiler.
- Bu bilgiler belge oluştururken otomatik doldurma için kullanılır.
- Veriler şifrelenerek saklanır, KVKK uyumludur.

### Kredi ve Ödeme Bilgileri
- Mevcut kredi bakiyesi görünür.
- Kredi satın alma seçenekleri:
  - 1 Belge Kredisi: 29 TL
  - 3 Belge Kredisi: 79 TL
  - 10 Belge Kredisi: 129 TL
- Ödeme Google Play / App Store üzerinden yapılır.

### Kullanım İstatistikleri
- Oluşturulan toplam belge sayısı.
- Harcanan kredi miktarı.
- Kalan ücretsiz hak (varsa).

---

## 🎁 Ücretsiz Deneme ve Kısıtlamalar

### Yeni Kullanıcı Hakları
- Kayıt sonrası **1 ücretsiz belge kredisi** verilir.
- Bu hak sadece tam belge oluşturma için kullanılır.

### Kısıtlamalar
- Ücretsiz belge sadece temel belge türleri için geçerlidir (Dilekçe, basit sözleşme).
- İndirme öncesi yasal uyarı ekranı zorunludur.

---

## ⚖️ Yasal Uyarı ve Güvenlik

### Belge Oluşturma Öncesi
- Ekranda zorunlu onay metni:
  > "Bu belge hukuki tavsiye yerine geçmez. Önemli hukuki işlemler için bir avukata danışmanız önerilir."
- Kullanıcı onay vermeden belge oluşturulamaz.

### Veri Güvenliği
- Tüm kişisel veriler şifrelenerek saklanır.
- KVKK kapsamında açık rıza alınır.
- Veriler üçüncü taraflarla paylaşılmaz.

---

## 🔄 Offline ve Senkronizasyon

### Offline Destek
- İnternet bağlantısı kesilirse, sohbet taslağı yerel olarak kaydedilir.
- Kullanıcı tekrar bağlandığında kaldığı yerden devam eder.

### Bulut Senkronizasyonu
- Belgeler kullanıcı hesabına bağlı olarak bulutta saklanır.
- Farklı cihazlardan giriş yapıldığında belgelere erişim sağlanır.

---

## 📋 Özellik Özeti Tablosu

| Özellik | Açıklama |
|---------|----------|
| Sohbet Tabanlı Belge Oluşturma | Kullanıcı bilgileri sohbetle verir, yapay zeka belgeyi hazırlar |
| Hızlı Etiketler | Dilekçe, Kira Sözleşmesi vb. hızlı başlangıç butonları |
| Eksik Bilgi Tespiti | Yapay zeka otomatik olarak eksik bilgileri sorar |
| Belge Önizleme | PDF formatına yakın önizleme ekranı |
| Metin Düzenleme | Belgede istenen kısma dokunarak yapay zekaya düzeltme talimatı |
| PDF / TXT İndirme | Belge indirme seçenekleri |
| Versiyon Geçmişi | Belgenin önceki hallerine erişim |
| Kredi Sistemi | Belge başına kredi harcama |
| Sık Kullanılan Bilgiler | Profilde saklanan otomatik doldurma bilgileri |
| Offline Taslak | İnternet kesintisinde yerel kayıt |
| KVKK Uyumlu | Şifreli veri saklama ve açık rıza |
| Yasal Uyarı | Belge öncesi zorunlu hukuki uyarı |

---

## 🚀 Kullanım Akışı (Örnek: Kira Sözleşmesi)

1. Kullanıcı uygulamayı açar.
2. Ana sayfada "Kira Sözleşmesi" etiketine dokunur.
3. Yapay zeka: *"Kira sözleşmesi mi oluşturmak istiyorsunuz?"* → Kullanıcı **Evet** der.
4. Yapay zeka sırayla sorar:
   - "Kiracının adı soyadı nedir?"
   - "Kiralayanın (mal sahibi) bilgileri nedir?"
   - "Kira bedeli aylık ne kadar?"
   - "Sözleşme süresi kaç ay?"
   - "Depozito tutarı nedir?"
5. Tüm bilgiler toplandıktan sonra yapay zeka: *"Belgenizi hazırlıyorum..."*
6. Kullanıcı önizlemeyi açar, kontrol eder.
7. Eksik varsa sohbete döner, düzeltme ister.
8. Beğenirse PDF olarak indirir.
9. Belge "Belgelerim" sekmesine kaydedilir.

---

## 🎯 Uygulamanın Amacı

EvrakAI, kullanıcıların resmi evrakları yazarken yaşadığı:
- ❌ Format karmaşası
- ❌ Eksik bilgi hataları
- ❌ Resmi dil bilgisi eksikliği
- ❌ Zaman kaybı

sorunlarını yapay zeka desteğiyle çözer. Hukuki süreçlerde kullanıcıyı bilgilendirir ancak profesyonel hukuki tavsiye yerine geçmez.

---

*EvrakAI — Resmi evraklar artık çok kolay.*
