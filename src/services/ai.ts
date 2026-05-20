import { StorageService } from "./storage";

export type ChatMsg = { role: "user" | "assistant"; content: string };

export type AiResponse = {
  docType: string | null;
  status: "need_type" | "need_info" | "ready";
  assistantMessage: string;
  document: string | null;
};

// ─── System Prompt (Real AI providers) ────────────────────────────────────────
const SYSTEM_PROMPT = `Sen "EvrakAI" adında, Türkiye hukuk ve resmi yazışma kurallarına hâkim, deneyimli bir belge asistanısın.

GÖREVİN:
1. Kullanıcının mesajlarını analiz et ve hangi resmi belgeyi (Dilekçe, Kira Sözleşmesi, İhtarname, İstifa Dilekçesi, İzin Talebi, Kayıt Dondurma vb.) istediğini tespit et.
2. O belge türü için Türkiye'de geçerli formatta GEREKLİ TÜM BİLGİLERİ kafanda listele.
3. Kullanıcının verdiği mesajlardan hangi bilgilerin VERİLDİĞİNİ ve hangilerinin EKSİK olduğunu çıkar.
4. SADECE eksik olan bilgileri kullanıcıdan iste — verilmiş bilgileri TEKRAR SORMA.
5. Tüm gerekli bilgiler tamamlandığında belgeyi profesyonel, resmi Türkçe ile tam formatta hazırla.

KRİTİK KURALLAR:
- Kullanıcı tek mesajda tüm bilgileri vermişse hemen belgeyi hazırla, soru sorma.
- Eksik bilgi varsa hepsini TEK mesajda numaralı/madde madde sor; tek tek değil.
- Verilmiş bilgileri asla tekrar sorma.
- Belge türü belirsizse kullanıcıdan ne yapmak istediğini netleştir.
- Belge hazırlanırken Markdown kullan: # başlık, ## alt başlık, **kalın**. Sonunda tarih ve imza alanı bırak.
- Uydurma bilgi ekleme; eksik kritik olmayan alanlar için [..........] bırakabilirsin.

ÇIKTI FORMATI:
SADECE geçerli bir JSON nesnesi döndür. Başka hiçbir metin, açıklama, kod bloğu işareti kullanma.
Şema:
{
  "docType": string | null,
  "status": "need_type" | "need_info" | "ready",
  "assistantMessage": string,
  "document": string | null
}`;

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fullHistory(msgs: ChatMsg[]) {
  return msgs.map((m) => m.content).join(" ").toLowerCase();
}

function userMsgs(msgs: ChatMsg[]) {
  return msgs.filter((m) => m.role === "user").map((m) => m.content).join(" ").toLowerCase();
}

function lastUser(msgs: ChatMsg[]) {
  return [...msgs].reverse().find((m) => m.role === "user")?.content ?? "";
}

// Extract a name pattern (e.g. "Ahmet Yılmaz")
function extractName(text: string): string | null {
  // Look for pairs of capitalized words
  const m = text.match(/\b([A-ZÇĞİÖŞÜa-zçğışöşü][a-zçğışöşü]{1,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{1,})\b/);
  return m ? `${m[1]} ${m[2]}` : null;
}

// Extract money amount
function extractAmount(text: string): string | null {
  const m = text.match(/(\d[\d.,]*)\s*(?:tl|lira|₺|bin)/i);
  if (m) return m[1].replace(",", ".") + " TL";
  // plain number over 500 likely a rent
  const n = text.match(/\b(\d{3,})\b/);
  if (n) return n[1] + " TL";
  return null;
}

// Extract a date
function extractDate(text: string): string | null {
  const m = text.match(/(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})/);
  if (m) return `${m[1].padStart(2, "0")}.${m[2].padStart(2, "0")}.${m[3].length === 2 ? "20" + m[3] : m[3]}`;
  // relative expressions
  if (/gelecek\s+ay|önümüzdeki\s+ay/i.test(text)) {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    d.setDate(1);
    return d.toLocaleDateString("tr-TR");
  }
  if (/bu\s+ay|bu\s+ay(?:ın)?/i.test(text)) {
    const d = new Date();
    return d.toLocaleDateString("tr-TR");
  }
  return null;
}

// Extract address-like string
function extractAddress(text: string): string | null {
  const m = text.match(/(?:adres|sokak|cad|mah|mhllesi|sk|cadde|bulvar|apt|no)[^\n,.]{5,60}/i);
  if (m) return m[0].trim();
  return null;
}

// Today formatted
const TODAY = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

// ─── Document Type Detection ──────────────────────────────────────────────────

type DocKind =
  | "Kira Sözleşmesi"
  | "İstifa Dilekçesi"
  | "İhtarname"
  | "İzin Talebi"
  | "Kayıt Dondurma Dilekçesi"
  | "Vekaletname"
  | "Taahhütname"
  | "Dilekçe"
  | null;

function detectDocType(text: string): DocKind {
  if (/kira\s*sözleşme|kiralama\s*sözleş|ev\s*kirala|dükkan\s*kirala|işyeri\s*kirala/i.test(text)) return "Kira Sözleşmesi";
  if (/istifa|ayrılma|bırakmak\s*istiy|görevimden\s*(ayrıl|çekil)|iş\s*bırak/i.test(text)) return "İstifa Dilekçesi";
  if (/ihtar|ihtarname|uyar[ıi]|hukuki\s*ihbar|tebliğ|ihbar/i.test(text)) return "İhtarname";
  if (/yıllık\s*izin|izin\s*tale|tatil\s*tale|izin\s*form|mazeret\s*izin/i.test(text)) return "İzin Talebi";
  if (/kayıt\s*dondur|öğrenim\s*dondur|üniversite.*dondur|dondurma.*dilekçe|okul.*dondur/i.test(text)) return "Kayıt Dondurma Dilekçesi";
  if (/vekaletname|vekalet\s*ver|avukat.*yetki|noter.*vekalet/i.test(text)) return "Vekaletname";
  if (/taahhüt|taahhütname|taahh/i.test(text)) return "Taahhütname";
  if (/dilekçe|şikayet\s*dilekçe|başvuru\s*dilekçe|resmi\s*başvur|kuruma\s*yaz/i.test(text)) return "Dilekçe";
  // Loose fallback
  if (/kira/i.test(text)) return "Kira Sözleşmesi";
  if (/izin/i.test(text)) return "İzin Talebi";
  return null;
}

// ─── Per-document info extraction + missing field logic ──────────────────────

interface Fields { [key: string]: string | null }

function extractKira(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = {
    kiraciAdi: null,
    kirVerenAdi: null,
    adres: null,
    kiraBedeli: null,
    baslangicTarihi: null,
    sure: "1 Yıl",
  };

  // Try to extract names: "kiracı X", "kiraya veren Y"
  const kiraciM = text.match(/kirac[ıi]\s*(?:adı|isim|ad)?[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)/i);
  if (kiraciM) fields.kiraciAdi = kiraciM[1].trim();

  const verenM = text.match(/(?:kiraya\s*veren|ev\s*sahibi|mülk\s*sahibi)\s*(?:adı|isim|ad)?[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)/i);
  if (verenM) fields.kirVerenAdi = verenM[1].trim();

  // If two names mentioned and not assigned yet
  const names = text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || [];
  if (!fields.kiraciAdi && names[0]) fields.kiraciAdi = names[0];
  if (!fields.kirVerenAdi && names[1]) fields.kirVerenAdi = names[1];

  fields.adres = extractAddress(text);
  fields.kiraBedeli = extractAmount(text);
  fields.baslangicTarihi = extractDate(text) ?? TODAY;

  const sureM = text.match(/(\d+)\s*(ay|yıl)/i);
  if (sureM) fields.sure = `${sureM[1]} ${sureM[2].charAt(0).toUpperCase() + sureM[2].slice(1)}`;

  const missing: string[] = [];
  if (!fields.kiraciAdi) missing.push("1. Kiracının tam adı soyadı");
  if (!fields.kirVerenAdi) missing.push("2. Kiraya verenin (ev sahibinin) tam adı soyadı");
  if (!fields.adres) missing.push("3. Kiralanacak mülkün açık adresi (mahalle, cadde, kapı no, ilçe/şehir)");
  if (!fields.kiraBedeli) missing.push("4. Aylık kira bedeli (TL)");

  return { fields, missing };
}

function extractIstifa(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = {
    calisanAdi: null,
    sirketAdi: null,
    pozisyon: null,
    sonGun: null,
  };

  // Company name (Ltd, A.Ş., Teknoloji vb.)
  const sirketM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü\s]+(?:Ltd\.|A\.Ş\.|Şirketi|Teknoloji|Ticaret|Holding|Group|San\.|Tic\.)[\s.]*)/i);
  if (sirketM) fields.sirketAdi = sirketM[1].trim();

  // Position keywords
  const pozM = text.match(/(?:pozisyon(?:um)?|görev(?:im)?|unvan(?:ım)?|ünvan(?:ım)?|çalıştığım\s+görev)[:\s]+([^\n,.!?]{3,40})/i);
  if (pozM) fields.pozisyon = pozM[1].trim();

  // Common job titles
  const jobTitles = ["mühendis", "geliştirici", "yazılım", "müdür", "yönetici", "uzman", "asistan", "satış", "muhasebe", "analist", "danışman", "doktor", "hemşire", "öğretmen", "mimar", "tasarımcı"];
  for (const t of jobTitles) {
    if (text.includes(t) && !fields.pozisyon) {
      // extract a bit more context
      const re = new RegExp(`(?:kıdemli\\s+|baş\\s+|senior\\s+)?${t}\\s*(?:\\w+)?`, "i");
      const m = text.match(re);
      if (m) fields.pozisyon = m[0].trim();
    }
  }

  // Person name
  const nameM = text.match(/(?:adım|ismim|benim\s+adım|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.calisanAdi = nameM[1].trim();
  else {
    const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []);
    if (names[0]) fields.calisanAdi = names[0];
  }

  fields.sonGun = extractDate(text);

  const missing: string[] = [];
  if (!fields.calisanAdi) missing.push("1. Adınız ve soyadınız");
  if (!fields.sirketAdi) missing.push("2. Şirketin resmi adı");
  if (!fields.pozisyon) missing.push("3. Şirketteki pozisyonunuz / görev unvanınız");

  return { fields, missing };
}

function extractIhtar(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = {
    ihtarEden: null,
    muhatap: null,
    konu: null,
    talep: null,
  };

  const ihtarEdenM = text.match(/(?:adım|benim\s+adım|ben|ihtar\s*eden)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (ihtarEdenM) fields.ihtarEden = ihtarEdenM[1].trim();

  const muhatapM = text.match(/(?:muhatap|karşı\s*taraf|(?:komşum|kiracım|işverenin|alacaklı))[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (muhatapM) fields.muhatap = muhatapM[1].trim();

  // infer konu from text
  if (/gürültü|ses|müzik/i.test(text)) fields.konu = "Gürültü ve rahatsız edici davranışlar";
  else if (/borç|alacak|ödeme|para/i.test(text)) fields.konu = "Alacak ve ödeme yükümlülüğü";
  else if (/kira|aidat/i.test(text)) fields.konu = "Kira/aidat borcunun ödenmesi";
  else if (/hasar|zarar|tazminat/i.test(text)) fields.konu = "Hasar/zarar tazminat talebi";
  else {
    const konuM = text.match(/(?:konu(?:su)?|hakkında|nedeniyle)[:\s]+([^\n.,!?]{5,80})/i);
    if (konuM) fields.konu = konuM[1].trim();
  }

  const missing: string[] = [];
  if (!fields.ihtarEden) missing.push("1. Adınız ve soyadınız (ihtar eden taraf)");
  if (!fields.muhatap) missing.push("2. İhtar ettiğiniz kişinin adı soyadı (veya şirket adı)");
  if (!fields.konu) missing.push("3. İhtarın konusu (ne hakkında, ne talep ediyorsunuz?)");

  return { fields, missing };
}

function extractIzin(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = {
    calisanAdi: null,
    sirket: null,
    baslangic: null,
    bitis: null,
    sure: null,
    tur: "Yıllık İzin",
  };

  if (/hastalık|doktor|sağlık/i.test(text)) fields.tur = "Mazeret İzni (Hastalık)";
  else if (/ölüm|vefat|cenaze/i.test(text)) fields.tur = "Mazeret İzni (Ölüm)";
  else if (/evlilik|düğün/i.test(text)) fields.tur = "Mazeret İzni (Evlilik)";
  else if (/doğum/i.test(text)) fields.tur = "Mazeret İzni (Doğum)";

  const nameM = text.match(/(?:adım|ismim|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.calisanAdi = nameM[1].trim();
  else {
    const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []);
    if (names[0]) fields.calisanAdi = names[0];
  }

  // extract date range
  const dates = text.match(/\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?/g) || [];
  if (dates[0]) fields.baslangic = dates[0];
  if (dates[1]) fields.bitis = dates[1];

  // extract day count
  const sureM = text.match(/(\d+)\s*(gün|iş\s*günü)/i);
  if (sureM) fields.sure = `${sureM[1]} ${sureM[2]}`;

  const missing: string[] = [];
  if (!fields.calisanAdi) missing.push("1. Adınız ve soyadınız");
  if (!fields.baslangic) missing.push("2. İzin başlangıç tarihi");
  if (!fields.bitis && !fields.sure) missing.push("3. İzin bitiş tarihi veya kaç gün süreceği");

  return { fields, missing };
}

function extractKayitDondurma(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = {
    ogrenciAdi: null,
    okul: null,
    bolum: null,
    donem: null,
    gerekcе: null,
    ogrenciNo: null,
  };

  const nameM = text.match(/(?:adım|ismim|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.ogrenciAdi = nameM[1].trim();
  else {
    const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []);
    if (names[0]) fields.ogrenciAdi = names[0];
  }

  const okulM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+)?(?:üniversitesi|üniversite|fakültesi|enstitüsü)/i);
  if (okulM) fields.okul = okulM[0].trim();

  const bolumM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü\s]+(?:mühendisliği|bölümü|bölüm|fakültesi|anabilim\s*dalı))/i);
  if (bolumM) fields.bolum = bolumM[1].trim();

  if (/sağlık|hastalık|ameliyat|doktor|tedavi/i.test(text)) fields.gerekce = "Sağlık sebebiyle";
  else if (/maddi|ekonomik|para/i.test(text)) fields.gerekce = "Ekonomik sebepler nedeniyle";
  else if (/askerlik|asker/i.test(text)) fields.gerekce = "Askerlik yükümlülüğü nedeniyle";
  else if (/yurt\s*dışı|staj|iş/i.test(text)) fields.gerekce = "Yurt dışı staj/iş sebebiyle";

  const donemM = text.match(/(?:güz|bahar|yaz)\s*dönemi|20\d{2}-20\d{2}/i);
  if (donemM) fields.donem = donemM[0].trim();

  const noM = text.match(/(?:öğrenci\s*no|numara(?:m)?)[:\s]*(\d{6,12})/i);
  if (noM) fields.ogrenciNo = noM[1];

  const missing: string[] = [];
  if (!fields.ogrenciAdi) missing.push("1. Adınız ve soyadınız");
  if (!fields.okul) missing.push("2. Üniversite / fakülte adı");
  if (!fields.bolum) missing.push("3. Bölümünüz");
  if (!fields.donem) missing.push("4. Hangi dönem için dondurma istiyorsunuz? (Örn: 2026-2027 Güz Dönemi)");
  if (!fields.gerekce) missing.push("5. Kayıt dondurma gerekçeniz (sağlık, ekonomik, askerlik vb.)");

  return { fields, missing };
}

// ─── Document generators ──────────────────────────────────────────────────────

function genKiraSozlesmesi(f: Fields): string {
  return `# KONUT KİRA SÖZLEŞMESİ

## 1. TARAFLAR

**KİRAYA VEREN (EV SAHİBİ)**
Ad Soyad: **${f.kirVerenAdi ?? "[..........]"}**
T.C. Kimlik No: [……………………]
Adres: [……………………………………]
Telefon: [……………………]

**KİRACI**
Ad Soyad: **${f.kiraciAdi ?? "[..........]"}**
T.C. Kimlik No: [……………………]
Adres: [……………………………………]
Telefon: [……………………]

---

## 2. KİRALANAN TAŞINMAZ

**Adres:** ${f.adres ?? "[Açık Adres: Mahalle, Cadde, Sokak, No, Daire, İlçe/Şehir]"}
**Cinsi:** Mesken (Konut)
**Brüt Alan:** ………… m²

---

## 3. SÜRE VE BEDEL

**Sözleşme Başlangıç Tarihi:** ${f.baslangicTarihi ?? TODAY}
**Sözleşme Süresi:** ${f.sure ?? "1 (Bir) Yıl"}
**Aylık Kira Bedeli:** **${f.kiraBedeli ?? "[……… TL]"}**
**Ödeme Günü:** Her ayın 5. (beşinci) günü akşamına kadar.
**Ödeme Şekli:** Banka havalesi / EFT (Kiraya veren IBAN: TR ………………………………………)
**Depozito:** ${f.kiraBedeli ? `${f.kiraBedeli} (1 aylık)` : "[……… TL]"} — Sözleşme bitiminde iade edilir.

---

## 4. TARAFLARIN YÜKÜMLÜLÜKLERI

### 4.1. Kiracının Yükümlülükleri
1. Kiracı kiralananı özenle kullanmak, olağan kullanımı aşan hasarları tazmin etmekle yükümlüdür.
2. Kiralanan, mesken dışı amaçlarla kullanılamaz; alt kiraya verilemez.
3. Tadilat/değişiklik için kiraya verenin yazılı izni zorunludur.
4. Aidat, su ve elektrik faturaları kiracıya aittir.

### 4.2. Kiraya Verenin Yükümlülükleri
1. Kiralananı kararlaştırılan tarihte teslim etmek.
2. Olağan bakım ve büyük onarımları üstlenmek.

---

## 5. SÖZLEŞME SONA ERMESİ

- Sözleşme bitiminde kira artış oranı, TÜFE 12 aylık ortalaması ile sınırlıdır (6098 s. TBK md. 344).
- Taraflardan biri sözleşmeyi sona erdirmek isterse, bitiş tarihinden en az 3 ay önce yazılı bildirimde bulunmak zorundadır.

---

## 6. UYUŞMAZLIK

İşbu sözleşmeden doğacak uyuşmazlıklarda ………… (taşınmazın bulunduğu yer) Mahkemeleri ve İcra Daireleri yetkilidir.

---

## 7. EKLER VE İMZA

İşbu sözleşme 6 maddeden ibaret olup taraflarca **${TODAY}** tarihinde 2 (iki) nüsha olarak imzalanmıştır.

| | |
|---|---|
| **Kiraya Veren** | **Kiracı** |
| ${f.kirVerenAdi ?? "[Ad Soyad]"} | ${f.kiraciAdi ?? "[Ad Soyad]"} |
| İmza: ………………… | İmza: ………………… |
| Tarih: ${TODAY} | Tarih: ${TODAY} |`;
}

function genIstifaDilekcesi(f: Fields): string {
  return `# İSTİFA DİLEKÇESİ

**Tarih:** ${TODAY}

---

**${f.sirketAdi ? f.sirketAdi.toUpperCase() : "[ŞİRKET ADI]"} YÖNETİM KURULU BAŞKANLIĞI'NA**
*(İnsan Kaynakları Departmanı'nın Dikkatine)*

---

Şirketiniz bünyesinde **${f.pozisyon ?? "[GÖREV UNVANI]"}** pozisyonunda görev yapmaktayım.

Şahsi ve mesleki kariyer planlarım doğrultusunda iş sözleşmemi, **${f.sonGun ?? "[…………]"}** tarihi itibarıyla kendi isteğimle feshetmek ve görevimden ayrılmak istiyorum.

Çalıştığım süre boyunca gösterilen ilgi, destek ve kazandırılan deneyimler için şükranlarımı sunar; yasal ihbar süresine riayet edileceğini ve ayrılış işlemlerimin başlatılmasını saygıyla talep ederim.

Bakiye yıllık izin ücretim, kıdem tazminatı (varsa) ve sair yasal haklarımın tarafıma eksiksiz ödenmesini ayrıca rica ederim.

---

**Ad Soyad:** ${f.calisanAdi ?? "[AD SOYAD]"}
**T.C. Kimlik No:** […………………………]
**Pozisyon:** ${f.pozisyon ?? "[GÖREV UNVANI]"}
**Dahili / GSM:** […………………………]
**E-posta:** […………………………]

**İmza:** ………………………………
**Tarih:** ${TODAY}`;
}

function genIhtarname(f: Fields): string {
  return `# İHTARNAME

**İHTAR EDEN**
Ad Soyad: **${f.ihtarEden ?? "[İHBAR EDEN ADI SOYADI]"}**
Adres: [………………………………………………………………]
T.C. Kimlik No: […………………………]
GSM: […………………………]

**MUHATAP**
Ad Soyad / Unvan: **${f.muhatap ?? "[MUHATAP ADI SOYADI]"}**
Adres: [………………………………………………………………]

**KONU:** ${f.konu ?? "Hukuki İhtar ve Talep"}

---

## İHTAR METNİ

Sayın ${f.muhatap ?? "[MUHATAP]"},

Aşağıda belirtilen hususlarda tarafınıza hukuki ihbarda bulunmak zorunluluğu doğmuştur.

${f.konu ? `**Konu:** ${f.konu}` : ""}

Yaşanan sorunun tarafınızca en geç **7 (yedi) iş günü** içinde giderilmesini ve gerekli adımların atılmasını talep ederim.

Belirtilen süre içinde tarafınızdan olumlu bir geri dönüş ya da eylem gerçekleşmemesi halinde, 6098 sayılı Türk Borçlar Kanunu ile ilgili mevzuat çerçevesinde **tüm hukuki yollara başvurma** hakkım saklıdır.

İşbu ihtarname tarafıma ait yasal haklarımın tamamını kapsamaktadır.

---

**İhtar Eden:** ${f.ihtarEden ?? "[AD SOYAD]"}
**İmza:** ………………………………
**Tarih:** ${TODAY}

---
*Not: Bu ihtarnamenin noter aracılığıyla gönderilmesi hukuki geçerliliğini pekiştirecektir.*`;
}

function genIzinTalebi(f: Fields): string {
  return `# YILLIK İZİN TALEP FORMU

**Tarih:** ${TODAY}

---

**İnsan Kaynakları Müdürlüğü'ne**
${f.sirket ? `**${f.sirket.toUpperCase()}**` : ""}

---

## PERSONELİN BİLGİLERİ

| Alan | Bilgi |
|---|---|
| Ad Soyad | ${f.calisanAdi ?? "[AD SOYAD]"} |
| T.C. Kimlik No | [……………………] |
| Departman / Birim | [……………………] |
| Unvan | [……………………] |
| İşe Başlama Tarihi | [……………………] |

---

## İZİN BİLGİLERİ

| Alan | Bilgi |
|---|---|
| İzin Türü | **${f.tur ?? "Yıllık İzin"}** |
| Başlangıç Tarihi | ${f.baslangic ?? "[……………………]"} |
| Bitiş Tarihi | ${f.bitis ?? "[……………………]"} |
| Toplam Süre | ${f.sure ?? "[…] iş günü"} |
| İzin Dönüşü | ${f.bitis ? "[Bir sonraki iş günü]" : "[……………………]"} |

---

## AÇIKLAMA

İznim süresince iş ve sorumluluklarımı **[VEKIL ADI]** devredeceğimi beyan ederim.

Gereğini saygılarımla talep ederim.

---

**Çalışanın İmzası:** ………………………………
**Adı Soyadı:** ${f.calisanAdi ?? "[AD SOYAD]"}
**Tarih:** ${TODAY}

---

**Onay**

| | |
|---|---|
| Bölüm Müdürü Onayı | İK Onayı |
| ………………………… | ………………………… |
| Tarih: ……………… | Tarih: ……………… |`;
}

function genKayitDondurma(f: Fields): string {
  return `# KAYIT DONDURMA TALEBİ

**Tarih:** ${TODAY}

---

**${f.okul ? f.okul.toUpperCase() : "[ÜNİVERSİTE ADI]"} REKTÖRLÜĞÜ'NE**
*(${f.bolum ? f.bolum + " Bölümü / " : ""}Öğrenci İşleri Direktörlüğü'nün Dikkatine)*

---

## ÖĞRENCİ BİLGİLERİ

| Alan | Bilgi |
|---|---|
| Ad Soyad | **${f.ogrenciAdi ?? "[AD SOYAD]"}** |
| Öğrenci Numarası | ${f.ogrenciNo ?? "[……………………]"} |
| Fakülte / Bölüm | ${f.bolum ?? "[……………………]"} |
| Sınıf | [………] |
| E-posta | [……………………@…………………] |
| GSM | [……………………] |

---

## TALEP

**İlgili Dönem:** ${f.donem ?? "[20…-20… Güz / Bahar Dönemi]"}
**Gerekçe:** ${f.gerekce ?? "[Kayıt dondurma gerekçesi belirtilmedi]"}

${f.gerekce ?? ""} gerekçesiyle **${f.donem ?? "[ilgili dönem]"}** için kaydımın dondurulmasını talep etmekteyim.

Gerekli belgeler dilekçeye ekte sunulmuştur. Talebimin değerlendirilerek sonucundan tarafıma bilgi verilmesini saygılarımla arz ederim.

---

## EKLER

1. ${f.gerekce?.includes("ağlık") || f.gerekce?.includes("tedavi") ? "Sağlık kurulu raporu / doktor belgesi" : "İlgili belge"}
2. Nüfus cüzdanı fotokopisi
3. Öğrenci belgesi

---

**Ad Soyad:** ${f.ogrenciAdi ?? "[AD SOYAD]"}
**İmza:** ………………………………
**Tarih:** ${TODAY}`;
}

function genGenelDilekcesi(info: { konu: string | null; kurum: string | null; calisanAdi: string | null }): string {
  return `# DİLEKÇE

**Tarih:** ${TODAY}

---

**${info.kurum ? info.kurum.toUpperCase() : "[KURUM / MAKAM ADI]"}**'NA
*[Şehir]*

---

**KONU:** ${info.konu ?? "[Dilekçe Konusu]"}

---

Sayın Yetkililer,

${info.konu ?? "[Talep konusunu buraya yazın]"} hususunda tarafınıza başvurma zorunluluğu doğmuştur.

Talebimin değerlendirilerek en kısa sürede tarafıma bilgi verilmesini saygılarımla arz ve talep ederim.

---

**Ad Soyad:** ${info.calisanAdi ?? "[AD SOYAD]"}
**T.C. Kimlik No:** [……………………………]
**Adres:** [………………………………………………………]
**GSM:** [……………………]
**E-posta:** [……………………]

**İmza:** ………………………………
**Tarih:** ${TODAY}`;
}

// ─── Smart Mock Engine ────────────────────────────────────────────────────────

function generateMockResponse(messages: ChatMsg[]): AiResponse {
  const history = fullHistory(messages);
  const uHistory = userMsgs(messages);
  const last = lastUser(messages);

  // Detect doc type from full conversation
  const docType = detectDocType(history);

  if (!docType) {
    // Try to be helpful with suggestions
    return {
      docType: null,
      status: "need_type",
      assistantMessage:
        "Merhaba! Hangi tür belge hazırlamamı istersiniz?\n\nÖrnek olarak şunları söyleyebilirsiniz:\n• \"Kira sözleşmesi hazırla\"\n• \"İstifa dilekçesi yazıyorum\"\n• \"Komşuma ihtarname göndereceğim\"\n• \"Yıllık izin talebi\"\n• \"Üniversite kayıt dondurma\"\n\nDilek veya talebinizi doğal bir şekilde anlatabilirsiniz — gerisini ben hallederim.",
      document: null,
    };
  }

  // Per-type field extraction
  if (docType === "Kira Sözleşmesi") {
    const { fields, missing } = extractKira(uHistory);
    if (missing.length > 0) {
      return {
        docType,
        status: "need_info",
        assistantMessage: `Kira sözleşmesini hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri yazmanız yeterli, gerisini ben hallederim.`,
        document: null,
      };
    }
    return {
      docType,
      status: "ready",
      assistantMessage: "Kira sözleşmenizi resmi mevzuata (TBK 6098) uygun olarak hazırladım. Aşağıdan önizleyebilir, boş alanları kendi bilgilerinizle doldurabilirsiniz.",
      document: genKiraSozlesmesi(fields),
    };
  }

  if (docType === "İstifa Dilekçesi") {
    const { fields, missing } = extractIstifa(uHistory);
    if (missing.length > 0) {
      return {
        docType,
        status: "need_info",
        assistantMessage: `İstifa dilekçenizi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBilgileri paylaştığınızda dilekçeyi hemen hazırlayacağım.`,
        document: null,
      };
    }
    return {
      docType,
      status: "ready",
      assistantMessage: "İstifa dilekçeniz resmi formatta hazırlandı. Tarihleri ve boş alanları gözden geçirip imzalayabilirsiniz.",
      document: genIstifaDilekcesi(fields),
    };
  }

  if (docType === "İhtarname") {
    const { fields, missing } = extractIhtar(uHistory);
    if (missing.length > 0) {
      return {
        docType,
        status: "need_info",
        assistantMessage: `İhtarname hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaştığınızda ihtarnameyi oluşturacağım.`,
        document: null,
      };
    }
    return {
      docType,
      status: "ready",
      assistantMessage: "İhtarnameniz hazır. Hukuki geçerlilik için noter kanalıyla göndermenizi tavsiye ederim.",
      document: genIhtarname(fields),
    };
  }

  if (docType === "İzin Talebi") {
    const { fields, missing } = extractIzin(uHistory);
    if (missing.length > 0) {
      return {
        docType,
        status: "need_info",
        assistantMessage: `İzin talep formu için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBunları paylaşır mısınız?`,
        document: null,
      };
    }
    return {
      docType,
      status: "ready",
      assistantMessage: "İzin talep formunuz hazır. İnsan Kaynakları Müdürlüğü'ne teslim edebilirsiniz.",
      document: genIzinTalebi(fields),
    };
  }

  if (docType === "Kayıt Dondurma Dilekçesi") {
    const { fields, missing } = extractKayitDondurma(uHistory);
    if (missing.length > 0) {
      return {
        docType,
        status: "need_info",
        assistantMessage: `Kayıt dondurma dilekçesi için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri yazın, dilekçeyi hemen hazırlayayım.`,
        document: null,
      };
    }
    return {
      docType,
      status: "ready",
      assistantMessage: "Kayıt dondurma dilekçeniz hazır. Gerekli eklerle birlikte Öğrenci İşleri'ne teslim edebilirsiniz.",
      document: genKayitDondurma(fields),
    };
  }

  if (docType === "Dilekçe") {
    // General petition — need konu and kurum
    const hasKonu = uHistory.includes("konu") || last.length > 20;
    const hasKurum = /belediye|bakanlık|müdürlük|müdürlüğe|üniversite|fakülte|okul|kurum|şirket|genel müdür/i.test(uHistory);

    if (!hasKonu || !hasKurum) {
      const missingItems = [];
      if (!hasKurum) missingItems.push("1. Dilekçenin hangi kuruma / makama verileceği");
      if (!hasKonu) missingItems.push("2. Dilekçenin konusu ve talebiniz (kısaca açıklayın)");
      return {
        docType,
        status: "need_info",
        assistantMessage: `Dilekçeyi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missingItems.join("\n")}\n\nAçıklamanız yeterli, dilekçeyi resmi formatta yazacağım.`,
        document: null,
      };
    }

    // Extract info from message
    const kurumM = uHistory.match(/(?:belediye|bakanlık|müdürlük|üniversite|fakülte|okul|kurum|şirket|genel müdür)[^\n,.!?]*/i);
    const adM = (uHistory.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || [])[0] ?? null;

    return {
      docType,
      status: "ready",
      assistantMessage: "Dilekçeniz resmi formatta hazırlandı. Boş alanları kendi bilgilerinizle doldurabilirsiniz.",
      document: genGenelDilekcesi({
        konu: last.slice(0, 120),
        kurum: kurumM?.[0] ?? null,
        calisanAdi: adM,
      }),
    };
  }

  // Fallback for Vekaletname, Taahhütname
  return {
    docType,
    status: "need_info",
    assistantMessage: `${docType} hazırlamak için biraz daha bilgiye ihtiyacım var. Lütfen şunları belirtin:\n\n1. Adınız ve soyadınız\n2. Belgenin kime / neye yönelik olduğu\n3. Varsa özel koşullar veya talepler`,
    document: null,
  };
}

// ─── AI Service ───────────────────────────────────────────────────────────────

export const AIService = {
  async sendMessage(messages: ChatMsg[]): Promise<AiResponse> {
    const { lovableKey, geminiKey, provider } = await StorageService.getApiKeys();

    if (provider === "mock") {
      await new Promise((r) => setTimeout(r, 900 + Math.random() * 600));
      return generateMockResponse(messages);
    }

    try {
      if (provider === "gemini") {
        if (!geminiKey) throw new Error("Gemini API anahtarı eksik. Profil → Yapay Zekâ Motoru bölümünden ekleyin.");

        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: SYSTEM_PROMPT },
                    ...messages.map((m) => ({ text: `${m.role === "user" ? "Kullanıcı" : "Asistan"}: ${m.content}` })),
                  ],
                },
              ],
              generationConfig: { responseMimeType: "application/json", temperature: 0.2 },
            }),
          }
        );

        if (!response.ok) throw new Error(`Gemini Hata: ${response.status}`);

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error("Geçersiz API yanıtı.");
        return JSON.parse(rawText) as AiResponse;
      }

      // Lovable
      if (!lovableKey) throw new Error("Lovable API anahtarı eksik. Profil → Yapay Zekâ Motoru bölümünden ekleyin.");

      const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Lovable-API-Key": lovableKey,
          "X-Lovable-AIG-SDK": "vercel-ai-sdk",
        },
        body: JSON.stringify({
          model: "google/gemini-2.0-flash-001",
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            ...messages.map((m) => ({ role: m.role, content: m.content })),
          ],
          response_format: { type: "json_object" },
        }),
      });

      if (!response.ok) throw new Error(`Lovable Hata: ${response.status}`);

      const data = await response.json();
      const rawContent = data.choices?.[0]?.message?.content;
      if (!rawContent) throw new Error("Yapay zekadan geçersiz yanıt.");
      return JSON.parse(rawContent) as AiResponse;
    } catch (e) {
      console.error("AI API Error:", e);
      const fallback = generateMockResponse(messages);
      fallback.assistantMessage = `⚠️ Bağlantı hatası: ${e instanceof Error ? e.message : "Bilinmeyen hata"}\n\nÇevrimdışı motor devreye girdi:\n\n${fallback.assistantMessage}`;
      return fallback;
    }
  },
};
