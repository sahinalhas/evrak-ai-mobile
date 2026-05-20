import { getTemplateTypes } from "./templateRegistry";

export type ChatMsg = { role: "user" | "assistant"; content: string };

export type AiResponse = {
  docType: string | null;
  status: "need_type" | "need_info" | "ready";
  assistantMessage: string;
  document: string | null;
};

// ─── System Prompt (Real AI providers) ────────────────────────────────────────
const SYSTEM_PROMPT = `Sen "EvrakAI" adında, Türkiye'de vatandaşların resmi kurumlara vereceği özel evrak ve belgeleri hazırlayan deneyimli bir belge asistanısın.

YAPABİLECEKLERİN (Desteklenen Belge Türleri — Özel Evrak):
Kişisel Talepler:
- Genel Dilekçe (talep, bilgi isteme, başvuru)
- İzin Talebi (okul, iş, mazeret izni)
- İstifa Dilekçesi
- İş Başvuru Yazısı (ön yazı / cover letter)
- Şikayet Dilekçesi
- Taahhütname (YALNIZCA davranışsal/eylemsel taahhütler — para/borç taahhütleri kapsam dışı)
- Referans Mektubu
Eğitim Belgeleri:
- Kayıt Dondurma Dilekçesi
- Nakil Talebi (okul / üniversite bölüm nakli)
- Not / Sınav İtirazı
- Öğrenci Belgesi / Transkript Talebi
- Devamsızlık Affı / Mazeret Bildirimi
Vatandaşlık & Çalışma Hayatı:
- Bilgi Edinme Başvurusu (4982 sayılı Kanun kapsamında)
- Ücret / Yan Hak Talebi
- SGK Belge / Hizmet Döküm Talebi

YAPAMAYACAKLARIN (Kullanıcıyı doğru yönlendir):
- Kira sözleşmesi, iş sözleşmesi, borç senedi gibi taraflar arası sözleşmeler → "Bu belgeler iki taraf arasında düzenlenir, ilerleyen sürümde eklenecek."
- Vekaletname, ihtarname gibi hukuki bildirim belgeleri → "Bu belgeler ilerleyen sürümde eklenecek."
- Para ödeme veya borç taahhütnamesi ("X TL ödeyeceğim" gibi) → "Bu tür maddi yükümlülükler borç senedi niteliği taşır. Bir avukata danışmanızı öneririm."
- Boşanma, miras, icra, nafaka gibi mahkeme işleri → "Bu konuda bir avukattan destek almanızı öneririm."
- Pasaport, ehliyet, diploma gibi devletin verdiği belgeler → "Bu belge resmi devlet kurumları tarafından düzenlenir."
- Çek, bono, poliçe → "Bu tür belgeler özel hukuki risk taşır, avukata danışın."

GÖREVİN:
1. Kullanıcının mesajını analiz et, hangi belgeyi istediğini tespit et.
2. O belge için gerekli tüm bilgileri belirle.
3. Verilen bilgilerden eksik olanları tek seferde sor — verilmiş bilgileri tekrar sorma.
4. Tüm bilgiler tamamlandığında belgeyi profesyonel, resmi Türkçe ile tam formatta hazırla.

KRİTİK KURALLAR:
- Kullanıcı tek mesajda tüm bilgileri vermişse hemen belgeyi hazırla, soru sorma.
- Eksik bilgi varsa hepsini TEK mesajda numaralı liste ile sor.
- Borç Senedi oluştururken mutlaka şu uyarıyı ekle: "⚠️ Bu belge icra takibine dayanak olabilir, imzalamadan önce dikkatli olun."
- Vekaletname oluştururken: "Noter onayı gerektiren işlemler için resmi vekaletname alın" uyarısını ekle.
- Her belgenin sonuna: "⚠️ Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz." uyarısını ekle.
- Belge hazırlarken Markdown kullan: # başlık, ## alt başlık, **kalın**. Sonunda tarih ve imza alanı bırak.
- Uydurma bilgi ekleme; eksik alanlar için [..........] bırak.

FORMAT KURALLARI:
- Tarih: Sağ üst köşe veya belge başında (GG.AA.YYYY)
- Hitap: Kuruma hitap sağda, büyük harfle
- Kapanış: "Gereğini arz ederim." veya "Saygılarımla,"
- İmza alanı: Alt kısımda 3 boş satır

ÇIKTI FORMATI:
SADECE geçerli bir JSON nesnesi döndür. Başka hiçbir metin, açıklama, kod bloğu işareti kullanma.
Şema:
{
  "docType": string | null,
  "status": "need_type" | "need_info" | "ready",
  "assistantMessage": string,
  "document": string | null
}`;

const AVAILABLE_TEMPLATES = getTemplateTypes().join(", ");

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

function extractName(text: string): string | null {
  const m = text.match(/\b([A-ZÇĞİÖŞÜa-zçğışöşü][a-zçğışöşü]{1,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{1,})\b/);
  return m ? `${m[1]} ${m[2]}` : null;
}

function extractAmount(text: string): string | null {
  const m = text.match(/(\d[\d.,]*)\s*(?:tl|lira|₺|bin)/i);
  if (m) return m[1].replace(",", ".") + " TL";
  const n = text.match(/\b(\d{3,})\b/);
  if (n) return n[1] + " TL";
  return null;
}

function extractDate(text: string): string | null {
  const m = text.match(/(\d{1,2})[./\-](\d{1,2})[./\-](\d{2,4})/);
  if (m) return `${m[1].padStart(2, "0")}.${m[2].padStart(2, "0")}.${m[3].length === 2 ? "20" + m[3] : m[3]}`;
  if (/gelecek\s+ay|önümüzdeki\s+ay/i.test(text)) {
    const d = new Date(); d.setMonth(d.getMonth() + 1); d.setDate(1);
    return d.toLocaleDateString("tr-TR");
  }
  if (/bu\s+ay/i.test(text)) return new Date().toLocaleDateString("tr-TR");
  return null;
}

function extractAddress(text: string): string | null {
  const m = text.match(/(?:adres|sokak|cad|mah|mhllesi|sk|cadde|bulvar|apt|no)[^\n,.]{5,60}/i);
  return m ? m[0].trim() : null;
}

const TODAY = new Date().toLocaleDateString("tr-TR", { day: "2-digit", month: "2-digit", year: "numeric" });

// ─── Document Type Detection ──────────────────────────────────────────────────

type DocKind =
  | "İstifa Dilekçesi"
  | "İzin Talebi"
  | "Kayıt Dondurma Dilekçesi"
  | "Taahhütname"
  | "Şikayet Dilekçesi"
  | "İş Başvuru Yazısı"
  | "Referans Mektubu"
  | "Nakil Talebi"
  | "Not İtirazı"
  | "Öğrenci Belgesi Talebi"
  | "Devamsızlık Affı"
  | "Bilgi Edinme Başvurusu"
  | "Ücret/Yan Hak Talebi"
  | "SGK Belge Talebi"
  | "Dilekçe"
  | null;

function detectDocType(text: string): DocKind {
  if (/istifa|ayrılma|bırakmak\s*istiy|görevimden\s*(ayrıl|çekil)|iş\s*bırak/i.test(text)) return "İstifa Dilekçesi";
  if (/yıllık\s*izin|izin\s*tale|tatil\s*tale|izin\s*form|mazeret\s*izin/i.test(text)) return "İzin Talebi";
  if (/kayıt\s*dondur|öğrenim\s*dondur|üniversite.*dondur|dondurma.*dilekçe|okul.*dondur/i.test(text)) return "Kayıt Dondurma Dilekçesi";
  if (/taahhüt|taahhütname|taahh/i.test(text)) return "Taahhütname";
  if (/şikayet\s*dilekçe|şikayetçi|şikayetim\s*var|şikayet\s*etmek|ihbar\s*dilekçe/i.test(text)) return "Şikayet Dilekçesi";
  if (/iş\s*başvur|başvuru\s*mektup|cover\s*letter|ön\s*yaz|kariyer.*başvur|pozisyon.*başvur|staj\s*başvur/i.test(text)) return "İş Başvuru Yazısı";
  if (/referans\s*mektup|tavsiye\s*mektup|referans\s*yaz|recommendation/i.test(text)) return "Referans Mektubu";
  if (/nakil\s*tal|okul\s*nakil|okul\s*değiştir|bölüm\s*nakil|transfer.*okul/i.test(text)) return "Nakil Talebi";
  if (/not\s*itiraz|sınav\s*itiraz|harf\s*not.*itiraz|sonuç\s*itiraz|not.*şikay|sınav.*sonuç.*itiraz/i.test(text)) return "Not İtirazı";
  if (/öğrenci\s*belgesi|transkript|not\s*döküm|mezuniyet\s*belgesi.*tal|belge\s*tal.*öğrenci/i.test(text)) return "Öğrenci Belgesi Talebi";
  if (/devamsızlık\s*af|mazeret\s*bildirim|devamsızlık\s*mazeret|devam\s*af/i.test(text)) return "Devamsızlık Affı";
  if (/bilgi\s*edinme|4982|kamu\s*bilgi.*tal|enformasyon\s*tal/i.test(text)) return "Bilgi Edinme Başvurusu";
  if (/ücret\s*tal|maaş\s*tal|yan\s*hak\s*tal|prim\s*tal|maaş\s*zam.*tal|ücret.*artış.*tal/i.test(text)) return "Ücret/Yan Hak Talebi";
  if (/\bsgk\b|hizmet\s*birleştir|sgk\s*döküm|sigortalılık\s*belgesi|emeklilik.*belge.*tal/i.test(text)) return "SGK Belge Talebi";
  if (/dilekçe|başvuru\s*dilekçe|resmi\s*başvur|kuruma\s*yaz/i.test(text)) return "Dilekçe";
  if (/izin/i.test(text)) return "İzin Talebi";
  return null;
}

// ─── Per-document info extraction ────────────────────────────────────────────

interface Fields { [key: string]: string | null }

function extractKira(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { kiraciAdi: null, kirVerenAdi: null, adres: null, kiraBedeli: null, baslangicTarihi: null, sure: "1 Yıl" };
  const kiraciM = text.match(/kirac[ıi]\s*(?:adı|isim|ad)?[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)/i);
  if (kiraciM) fields.kiraciAdi = kiraciM[1].trim();
  const verenM = text.match(/(?:kiraya\s*veren|ev\s*sahibi|mülk\s*sahibi)\s*(?:adı|isim|ad)?[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)/i);
  if (verenM) fields.kirVerenAdi = verenM[1].trim();
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
  if (!fields.adres) missing.push("3. Kiralanacak mülkün açık adresi");
  if (!fields.kiraBedeli) missing.push("4. Aylık kira bedeli (TL)");
  return { fields, missing };
}

function extractIstifa(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { calisanAdi: null, sirketAdi: null, pozisyon: null, sonGun: null };
  const sirketM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü\s]+(?:Ltd\.|A\.Ş\.|Şirketi|Teknoloji|Ticaret|Holding|Group|San\.|Tic\.)[\s.]*)/i);
  if (sirketM) fields.sirketAdi = sirketM[1].trim();
  const pozM = text.match(/(?:pozisyon(?:um)?|görev(?:im)?|unvan(?:ım)?)[:\s]+([^\n,.!?]{3,40})/i);
  if (pozM) fields.pozisyon = pozM[1].trim();
  const jobTitles = ["mühendis", "geliştirici", "yazılım", "müdür", "yönetici", "uzman", "asistan", "satış", "muhasebe", "analist", "danışman", "doktor", "hemşire", "öğretmen", "mimar", "tasarımcı"];
  for (const t of jobTitles) {
    if (text.includes(t) && !fields.pozisyon) {
      const re = new RegExp(`(?:kıdemli\\s+|baş\\s+|senior\\s+)?${t}\\s*(?:\\w+)?`, "i");
      const m = text.match(re);
      if (m) fields.pozisyon = m[0].trim();
    }
  }
  const nameM = text.match(/(?:adım|ismim|benim\s+adım|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.calisanAdi = nameM[1].trim();
  else { const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []); if (names[0]) fields.calisanAdi = names[0]; }
  fields.sonGun = extractDate(text);
  const missing: string[] = [];
  if (!fields.calisanAdi) missing.push("1. Adınız ve soyadınız");
  if (!fields.sirketAdi) missing.push("2. Şirketin resmi adı");
  if (!fields.pozisyon) missing.push("3. Pozisyonunuz / görev unvanınız");
  return { fields, missing };
}

function extractIhtar(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { ihtarEden: null, muhatap: null, konu: null, talep: null };
  const ihtarEdenM = text.match(/(?:adım|benim\s+adım|ben|ihtar\s*eden)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (ihtarEdenM) fields.ihtarEden = ihtarEdenM[1].trim();
  const muhatapM = text.match(/(?:muhatap|karşı\s*taraf|komşum|kiracım|işveren)[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (muhatapM) fields.muhatap = muhatapM[1].trim();
  if (/gürültü|ses|müzik/i.test(text)) fields.konu = "Gürültü ve rahatsız edici davranışlar";
  else if (/borç|alacak|ödeme|para/i.test(text)) fields.konu = "Alacak ve ödeme yükümlülüğü";
  else if (/kira|aidat/i.test(text)) fields.konu = "Kira/aidat borcunun ödenmesi";
  else if (/hasar|zarar|tazminat/i.test(text)) fields.konu = "Hasar/zarar tazminat talebi";
  else { const konuM = text.match(/(?:konu(?:su)?|hakkında|nedeniyle)[:\s]+([^\n.,!?]{5,80})/i); if (konuM) fields.konu = konuM[1].trim(); }
  const missing: string[] = [];
  if (!fields.ihtarEden) missing.push("1. Adınız ve soyadınız (ihtar eden taraf)");
  if (!fields.muhatap) missing.push("2. İhtar ettiğiniz kişinin adı soyadı");
  if (!fields.konu) missing.push("3. İhtarın konusu ve talebiniz");
  return { fields, missing };
}

function extractIzin(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { calisanAdi: null, sirket: null, baslangic: null, bitis: null, sure: null, tur: "Yıllık İzin" };
  if (/hastalık|doktor|sağlık/i.test(text)) fields.tur = "Mazeret İzni (Hastalık)";
  else if (/ölüm|vefat|cenaze/i.test(text)) fields.tur = "Mazeret İzni (Ölüm)";
  else if (/evlilik|düğün/i.test(text)) fields.tur = "Mazeret İzni (Evlilik)";
  else if (/doğum/i.test(text)) fields.tur = "Mazeret İzni (Doğum)";
  const nameM = text.match(/(?:adım|ismim|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.calisanAdi = nameM[1].trim();
  else { const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []); if (names[0]) fields.calisanAdi = names[0]; }
  const dates = text.match(/\d{1,2}[./]\d{1,2}(?:[./]\d{2,4})?/g) || [];
  if (dates[0]) fields.baslangic = dates[0];
  if (dates[1]) fields.bitis = dates[1];
  const sureM = text.match(/(\d+)\s*(gün|iş\s*günü)/i);
  if (sureM) fields.sure = `${sureM[1]} ${sureM[2]}`;
  const missing: string[] = [];
  if (!fields.calisanAdi) missing.push("1. Adınız ve soyadınız");
  if (!fields.baslangic) missing.push("2. İzin başlangıç tarihi");
  if (!fields.bitis && !fields.sure) missing.push("3. İzin bitiş tarihi veya kaç gün");
  return { fields, missing };
}

function extractKayitDondurma(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { ogrenciAdi: null, okul: null, bolum: null, donem: null, gerekce: null, ogrenciNo: null };
  const nameM = text.match(/(?:adım|ismim|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.ogrenciAdi = nameM[1].trim();
  else { const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []); if (names[0]) fields.ogrenciAdi = names[0]; }
  const okulM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+)?(?:üniversitesi|üniversite|fakültesi|enstitüsü)/i);
  if (okulM) fields.okul = okulM[0].trim();
  const bolumM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü\s]+(?:mühendisliği|bölümü|bölüm|fakültesi|anabilim\s*dalı))/i);
  if (bolumM) fields.bolum = bolumM[1].trim();
  if (/sağlık|hastalık|ameliyat|doktor/i.test(text)) fields.gerekce = "Sağlık sebebiyle";
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
  if (!fields.donem) missing.push("4. Hangi dönem? (Örn: 2026-2027 Güz Dönemi)");
  if (!fields.gerekce) missing.push("5. Gerekçeniz (sağlık, ekonomik, askerlik vb.)");
  return { fields, missing };
}

function extractVekaletname(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { vekaletenVerenAdi: null, vekilAdi: null, vekilTcNo: null, yetki: null };
  const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []);
  if (names[0]) fields.vekaletenVerenAdi = names[0];
  if (names[1]) fields.vekilAdi = names[1];
  const verenM = text.match(/(?:vekalet\s*veren|vekaletçi|委任者)[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)/i);
  if (verenM) fields.vekaletenVerenAdi = verenM[1].trim();
  const vekilM = text.match(/(?:vekil|avukat|temsilci)[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)/i);
  if (vekilM) fields.vekilAdi = vekilM[1].trim();
  if (/arazi|tapu|gayrimenkul|mülk/i.test(text)) fields.yetki = "Tapu ve gayrimenkul işlemleri";
  else if (/banka|hesap|para/i.test(text)) fields.yetki = "Bankacılık ve finansal işlemler";
  else if (/dava|mahkeme|hukuki/i.test(text)) fields.yetki = "Hukuki dava ve mahkeme işlemleri";
  else if (/araç|araç\s*satış|trafik/i.test(text)) fields.yetki = "Araç satış ve trafik işlemleri";
  else { const yetkiM = text.match(/(?:yetki|konu|için|adına)[:\s]+([^\n,.!?]{5,80})/i); if (yetkiM) fields.yetki = yetkiM[1].trim(); }
  const missing: string[] = [];
  if (!fields.vekaletenVerenAdi) missing.push("1. Vekâlet verenin adı soyadı");
  if (!fields.vekilAdi) missing.push("2. Vekil kılınan kişinin adı soyadı");
  if (!fields.yetki) missing.push("3. Vekâletin kapsamı (ne için yetki veriliyor?)");
  return { fields, missing };
}

function extractIsSozlesmesi(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { calisanAdi: null, sirketAdi: null, pozisyon: null, maas: null, baslangic: null, calismaSekli: "Tam Zamanlı" };
  if (/yarı\s*zamanlı|part.?time/i.test(text)) fields.calismaSekli = "Yarı Zamanlı";
  else if (/uzaktan|remote|evden/i.test(text)) fields.calismaSekli = "Uzaktan Çalışma";
  const nameM = text.match(/(?:adım|ismim|ben|çalışan|işçi)[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)/i);
  if (nameM) fields.calisanAdi = nameM[1].trim();
  else { const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []); if (names[0]) fields.calisanAdi = names[0]; }
  const sirketM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü\s]+(?:Ltd\.|A\.Ş\.|Şirketi|Teknoloji|Ticaret|Holding)[\s.]*)/i);
  if (sirketM) fields.sirketAdi = sirketM[1].trim();
  const pozM = text.match(/(?:pozisyon|görev|unvan|rol)[:\s]+([^\n,.!?]{3,40})/i);
  if (pozM) fields.pozisyon = pozM[1].trim();
  const jobTitles = ["mühendis", "geliştirici", "yazılım", "müdür", "yönetici", "uzman", "asistan", "satış", "muhasebe", "analist", "danışman", "tasarımcı"];
  for (const t of jobTitles) { if (text.includes(t) && !fields.pozisyon) { const re = new RegExp(`(?:kıdemli\\s+|baş\\s+)?${t}\\s*(?:\\w+)?`, "i"); const m = text.match(re); if (m) fields.pozisyon = m[0].trim(); } }
  fields.maas = extractAmount(text);
  fields.baslangic = extractDate(text) ?? TODAY;
  const missing: string[] = [];
  if (!fields.calisanAdi) missing.push("1. Çalışanın adı soyadı");
  if (!fields.sirketAdi) missing.push("2. Şirketin resmi adı");
  if (!fields.pozisyon) missing.push("3. Pozisyon / görev unvanı");
  if (!fields.maas) missing.push("4. Aylık brüt maaş (TL)");
  return { fields, missing };
}

function extractIsBasvuru(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { adSoyad: null, pozisyon: null, sirket: null, deneyim: null, egitim: null };
  const nameM = text.match(/(?:adım|ismim|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.adSoyad = nameM[1].trim();
  else { const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []); if (names[0]) fields.adSoyad = names[0]; }
  const pozM = text.match(/(?:pozisyon|görev|iş|rol|unvan|kadro)[:\s]+([^\n,.!?]{3,50})/i);
  if (pozM) fields.pozisyon = pozM[1].trim();
  const jobTitles = ["mühendis", "geliştirici", "yazılım", "müdür", "uzman", "asistan", "satış", "muhasebe", "analist", "danışman", "tasarımcı", "öğretmen", "hemşire", "doktor"];
  for (const t of jobTitles) { if (text.includes(t) && !fields.pozisyon) { const re = new RegExp(`(?:kıdemli\\s+|baş\\s+)?${t}\\s*(?:\\w+)?`, "i"); const m = text.match(re); if (m) fields.pozisyon = m[0].trim(); } }
  const sirketM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü\s]+(?:Ltd\.|A\.Ş\.|Şirketi|Teknoloji|Holding|Group)[\s.]*)/i);
  if (sirketM) fields.sirket = sirketM[1].trim();
  const deneyimM = text.match(/(\d+)\s*(?:yıl|yıllık|yil)\s*(?:deneyim|tecrübe)/i);
  if (deneyimM) fields.deneyim = `${deneyimM[1]} yıl`;
  const egitimM = text.match(/(?:üniversite|lisans|yüksek\s*lisans|mezun)[^\n,.!?]{0,60}/i);
  if (egitimM) fields.egitim = egitimM[0].trim();
  const missing: string[] = [];
  if (!fields.adSoyad) missing.push("1. Adınız ve soyadınız");
  if (!fields.pozisyon) missing.push("2. Başvurduğunuz pozisyon");
  if (!fields.sirket) missing.push("3. Şirketin adı");
  return { fields, missing };
}

function extractBorcSenedi(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { alacakli: null, borçlu: null, miktar: null, vadeTarihi: null, aciklama: null };
  const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []);
  if (names[0]) fields.alacakli = names[0];
  if (names[1]) fields.borçlu = names[1];
  const alacakliM = text.match(/(?:alacaklı|veren|ben)\s*(?:adı|isim)?[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)/i);
  if (alacakliM) fields.alacakli = alacakliM[1].trim();
  const borcluM = text.match(/(?:borçlu|alan|karşı\s*taraf)\s*(?:adı|isim)?[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)/i);
  if (borcluM) fields.borçlu = borcluM[1].trim();
  fields.miktar = extractAmount(text);
  fields.vadeTarihi = extractDate(text);
  const missing: string[] = [];
  if (!fields.alacakli) missing.push("1. Alacaklının (parayı veren) adı soyadı");
  if (!fields.borçlu) missing.push("2. Borçlunun (parayı alan) adı soyadı");
  if (!fields.miktar) missing.push("3. Borç miktarı (TL)");
  if (!fields.vadeTarihi) missing.push("4. Geri ödeme tarihi");
  return { fields, missing };
}

function extractReferans(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { yazanAdi: null, yazanUnvan: null, kisiAdi: null, iliskiSuresi: null, kurum: null };
  const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []);
  if (names[0]) fields.yazanAdi = names[0];
  if (names[1]) fields.kisiAdi = names[1];
  const pozM = text.match(/(?:pozisyon(?:um)?|görev(?:im)?|unvan(?:ım)?|müdür|direktör|profesor|doçent)[:\s]*([^\n,.!?]{0,40})/i);
  if (pozM) fields.yazanUnvan = pozM[0].trim();
  const sureM = text.match(/(\d+)\s*(?:yıl|ay)/i);
  if (sureM) fields.iliskiSuresi = sureM[0];
  const kurumM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü\s]+(?:Ltd\.|A\.Ş\.|Şirketi|Üniversitesi|Okulu|Hastanesi)[\s.]*)/i);
  if (kurumM) fields.kurum = kurumM[1].trim();
  const missing: string[] = [];
  if (!fields.yazanAdi) missing.push("1. Referansı yazan kişinin adı soyadı ve unvanı");
  if (!fields.kisiAdi) missing.push("2. Referans verilen kişinin adı soyadı");
  if (!fields.kurum) missing.push("3. Kurum / şirket adı");
  return { fields, missing };
}

function extractTutanak(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { tur: "Toplantı Tutanağı", katilimcilar: null, konu: null, karar: null, yer: null };
  if (/hasar|kaza|zarar|tespit/i.test(text)) fields.tur = "Hasar Tespit Tutanağı";
  else if (/toplantı|meeting/i.test(text)) fields.tur = "Toplantı Tutanağı";
  else if (/anlaşmazlık|uyuşmazlık|ihtilaf/i.test(text)) fields.tur = "Anlaşmazlık Tutanağı";
  else if (/teslim/i.test(text)) fields.tur = "Teslim-Tesellüm Tutanağı";
  const konuM = text.match(/(?:konu|hakkında|için|nedeniyle)[:\s]+([^\n,.!?]{5,100})/i);
  if (konuM) fields.konu = konuM[1].trim();
  else if (text.length > 30) fields.konu = text.slice(0, 120).trim();
  const kararM = text.match(/(?:karar|sonuç|alınan|belirlenen)[:\s]+([^\n]{10,150})/i);
  if (kararM) fields.karar = kararM[1].trim();
  const yerM = text.match(/(?:yer|adres|mekân|lokasyon)[:\s]+([^\n,.!?]{5,80})/i);
  if (yerM) fields.yer = yerM[1].trim();
  const missing: string[] = [];
  if (!fields.konu) missing.push("1. Tutanağın konusu (ne için tutanak tutulacak?)");
  if (!fields.katilimcilar) missing.push("2. Katılımcıların / tarafların adı soyadı");
  return { fields, missing };
}

function extractSikayet(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { sikayetciAdi: null, sikayetEdilenAdi: null, konu: null, kurum: null };
  const nameM = text.match(/(?:adım|ismim|ben|şikayetçi)[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)/i);
  if (nameM) fields.sikayetciAdi = nameM[1].trim();
  else { const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []); if (names[0]) fields.sikayetciAdi = names[0]; }
  const sikayetM = text.match(/(?:şikayet\s*ettiğim|hakkında\s*şikayet|şikayetim)[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)/i);
  if (sikayetM) fields.sikayetEdilenAdi = sikayetM[1].trim();
  const kurumM = text.match(/(?:belediye|bakanlık|müdürlük|üniversite|fakülte|okul|hastane|şirket|kurum|savcılık|mahkeme)[^\n,.!?]*/i);
  if (kurumM) fields.kurum = kurumM[0].trim();
  const konuM = text.match(/(?:şikayet\s*konusu|konu|hakkında|nedeniyle)[:\s]+([^\n]{10,120})/i);
  if (konuM) fields.konu = konuM[1].trim();
  if (!fields.konu && text.length > 30) fields.konu = text.slice(0, 150).replace(/şikayet/gi, "").trim();
  const missing: string[] = [];
  if (!fields.sikayetciAdi) missing.push("1. Adınız ve soyadınız");
  if (!fields.kurum) missing.push("2. Şikayetin yapılacağı kurum (Savcılık, Belediye, Bakanlık vb.)");
  if (!fields.konu) missing.push("3. Şikayetin konusu ve yaşanan olay (kısaca açıklayın)");
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
**Ödeme Günü:** Her ayın 5. günü akşamına kadar
**Ödeme Şekli:** Banka havalesi / EFT
**Depozito:** ${f.kiraBedeli ? `${f.kiraBedeli} (1 aylık)` : "[……… TL]"} — Sözleşme bitiminde iade edilir.

---

## 4. TARAFLARIN YÜKÜMLÜLÜKLERİ

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

- Kira artış oranı, TÜFE 12 aylık ortalaması ile sınırlıdır (TBK md. 344).
- Fesih için bitiş tarihinden en az 3 ay önce yazılı bildirim zorunludur.

---

## 6. UYUŞMAZLIK

İşbu sözleşmeden doğacak uyuşmazlıklarda taşınmazın bulunduğu yer Mahkemeleri yetkilidir.

---

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

---

Şirketiniz bünyesinde **${f.pozisyon ?? "[GÖREV UNVANI]"}** pozisyonunda görev yapmaktayım.

Şahsi ve mesleki kariyer planlarım doğrultusunda iş sözleşmemi, **${f.sonGun ?? "[…………]"}** tarihi itibarıyla kendi isteğimle feshetmek ve görevimden ayrılmak istiyorum.

Çalıştığım süre boyunca gösterilen ilgi ve destek için teşekkürlerimi sunar; yasal ihbar süresine riayet edileceğimi ve ayrılış işlemlerimin başlatılmasını saygıyla talep ederim.

Bakiye yıllık izin ücretim ve diğer yasal haklarımın eksiksiz ödenmesini ayrıca rica ederim.

---

**Ad Soyad:** ${f.calisanAdi ?? "[AD SOYAD]"}
**Pozisyon:** ${f.pozisyon ?? "[GÖREV UNVANI]"}
**GSM:** […………………………]
**E-posta:** […………………………]

**İmza:** ………………………………
**Tarih:** ${TODAY}`;
}

function genIhtarname(f: Fields): string {
  return `# İHTARNAME

**İHTAR EDEN**
Ad Soyad: **${f.ihtarEden ?? "[İHTAR EDEN ADI SOYADI]"}**
Adres: [………………………………………………………………]
T.C. Kimlik No: […………………………]

**MUHATAP**
Ad Soyad / Unvan: **${f.muhatap ?? "[MUHATAP ADI SOYADI]"}**
Adres: [………………………………………………………………]

**KONU:** ${f.konu ?? "Hukuki İhtar ve Talep"}

---

## İHTAR METNİ

Sayın ${f.muhatap ?? "[MUHATAP]"},

Aşağıda belirtilen hususlarda tarafınıza hukuki ihbarda bulunmak zorunluluğu doğmuştur.

${f.konu ? `**Konu:** ${f.konu}` : ""}

Yaşanan sorunun tarafınızca en geç **7 (yedi) iş günü** içinde giderilmesini talep ederim.

Belirtilen süre içinde olumlu bir geri dönüş gerçekleşmemesi halinde, 6098 sayılı Türk Borçlar Kanunu çerçevesinde **tüm hukuki yollara başvurma** hakkım saklıdır.

---

**İhtar Eden:** ${f.ihtarEden ?? "[AD SOYAD]"}
**İmza:** ………………………………
**Tarih:** ${TODAY}

---
*Bu ihtarnamenin noter aracılığıyla gönderilmesi hukuki geçerliliğini pekiştirecektir.*`;
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

---

Gereğini saygılarımla talep ederim.

**İmza:** ………………………………
**Ad Soyad:** ${f.calisanAdi ?? "[AD SOYAD]"}
**Tarih:** ${TODAY}

---

| Bölüm Müdürü Onayı | İK Onayı |
|---|---|
| ………………………… | ………………………… |`;
}

function genKayitDondurma(f: Fields): string {
  return `# KAYIT DONDURMA TALEBİ

**Tarih:** ${TODAY}

---

**${f.okul ? f.okul.toUpperCase() : "[ÜNİVERSİTE ADI]"} REKTÖRLÜĞÜ'NE**
*(${f.bolum ? f.bolum + " Bölümü / " : ""}Öğrenci İşleri Direktörlüğü)*

---

## ÖĞRENCİ BİLGİLERİ

| Alan | Bilgi |
|---|---|
| Ad Soyad | **${f.ogrenciAdi ?? "[AD SOYAD]"}** |
| Öğrenci Numarası | ${f.ogrenciNo ?? "[……………………]"} |
| Fakülte / Bölüm | ${f.bolum ?? "[……………………]"} |
| Sınıf | [………] |

---

## TALEP

**İlgili Dönem:** ${f.donem ?? "[20…-20… Güz / Bahar Dönemi]"}
**Gerekçe:** ${f.gerekce ?? "[Kayıt dondurma gerekçesi]"}

${f.gerekce ?? ""} gerekçesiyle **${f.donem ?? "[ilgili dönem]"}** için kaydımın dondurulmasını talep etmekteyim.

Gerekli belgeler dilekçeye ekte sunulmuştur.

---

## EKLER
1. ${f.gerekce?.includes("ağlık") ? "Sağlık kurulu raporu / doktor belgesi" : "İlgili belge"}
2. Nüfus cüzdanı fotokopisi
3. Öğrenci belgesi

---

**Ad Soyad:** ${f.ogrenciAdi ?? "[AD SOYAD]"}
**İmza:** ………………………………
**Tarih:** ${TODAY}`;
}

function genVekaletname(f: Fields): string {
  return `# ÖZEL VEKALETNAME

**Tarih:** ${TODAY}

---

## VEKÂLETİ VEREN

**Ad Soyad:** ${f.vekaletenVerenAdi ?? "[VEKÂLET VEREN ADI SOYADI]"}
**T.C. Kimlik No:** [……………………………………]
**Adres:** [………………………………………………………………]
**GSM:** [……………………]

---

## VEKİL

**Ad Soyad:** ${f.vekilAdi ?? "[VEKİL ADI SOYADI]"}
**T.C. Kimlik No:** ${f.vekilTcNo ?? "[……………………………………]"}
**Adres:** [………………………………………………………………]
**GSM:** [……………………]

---

## VEKALETNAME KAPSAMI

Yukarıda bilgileri yazılı olan **${f.vekilAdi ?? "[VEKİL]"}**, aşağıda belirtilen konularda adım ve hesabıma hareket etmeye, sözleşme imzalamaya, ilgili kurum ve kuruluşlarla her türlü iş ve işlemi yürütmeye yetkilidir:

**Yetki Kapsamı:** ${f.yetki ?? "[Vekâletin konusu ve kapsamı]"}

Bu vekâletname; ilgili tüm belgeleri imzalamayı, başvuru yapmayı, itirazda bulunmayı ve tarafımı temsil etmeyi kapsamaktadır.

---

*Bu vekâletnamenin noter tasdiki ile resmiyet kazanacağı taraflarca bilinmektedir.*

---

**Vekâleti Veren:**
${f.vekaletenVerenAdi ?? "[AD SOYAD]"}
**İmza:** ………………………………
**Tarih:** ${TODAY}`;
}

function genIsSozlesmesi(f: Fields): string {
  return `# İŞ SÖZLEŞMESİ

**Tarih:** ${TODAY}

---

## 1. TARAFLAR

**İŞVEREN**
Şirket Adı: **${f.sirketAdi ?? "[ŞİRKET ADI]"}**
Vergi No / TC: [……………………]
Adres: [……………………………………………]
Telefon: [……………………]

**ÇALIŞAN (İŞÇİ)**
Ad Soyad: **${f.calisanAdi ?? "[ÇALIŞAN ADI SOYADI]"}**
T.C. Kimlik No: [……………………]
Adres: [……………………………………………]
Telefon: [……………………]

---

## 2. GÖREV VE ÇALIŞMA KOŞULLARI

| Alan | Bilgi |
|---|---|
| Görev / Pozisyon | **${f.pozisyon ?? "[POZİSYON]"}** |
| Çalışma Şekli | ${f.calismaSekli ?? "Tam Zamanlı"} |
| Çalışma Saatleri | Haftalık 45 saat (09:00-18:00) |
| Çalışma Yeri | [……………………] |
| Başlangıç Tarihi | ${f.baslangic ?? TODAY} |
| Sözleşme Türü | Belirsiz Süreli |

---

## 3. ÜCRET VE YAN HAKLAR

| Alan | Bilgi |
|---|---|
| Brüt Maaş | **${f.maas ?? "[……… TL]"} / Ay** |
| Ödeme Tarihi | Her ayın son iş günü |
| Yol / Yemek | [……………………] |
| Sigorta | SGK primleri mevzuata göre |

---

## 4. İZİN VE DİĞER HAKLAR

- Yıllık izin: 4857 sayılı İş Kanunu hükümlerine göre
- Kıdem ve ihbar tazminatı: İş Kanunu'na tabidir
- Resmi tatiller: Kanuni tatil günleri ücretli izin sayılır

---

## 5. GİZLİLİK VE REKABET YASAĞI

Çalışan, iş sözleşmesi süresince ve bitiminden itibaren 1 (bir) yıl süreyle işveren firmanın ticari sırlarını ve müşteri bilgilerini üçüncü kişilerle paylaşmamayı kabul eder.

---

## 6. SONA ERME

Sözleşme, İş Kanunu'nun ilgili hükümlerine uygun olarak feshedilebilir. İhbar süreleri kanuni sürelerdir.

---

| | |
|---|---|
| **İşveren** | **Çalışan** |
| ${f.sirketAdi ?? "[ŞİRKET]"} | ${f.calisanAdi ?? "[AD SOYAD]"} |
| İmza: ………………… | İmza: ………………… |
| Tarih: ${TODAY} | Tarih: ${TODAY} |`;
}

function genSikayetDilekcesi(f: Fields): string {
  return `# ŞİKAYET DİLEKÇESİ

**Tarih:** ${TODAY}

---

**${f.kurum ? f.kurum.toUpperCase() : "[KURUM / SAVCILIĞA / MAKAMA]"}**'NA
*[Şehir]*

---

**ŞİKAYETÇİ**
Ad Soyad: **${f.sikayetciAdi ?? "[ŞİKAYETÇİ ADI SOYADI]"}**
T.C. Kimlik No: [……………………]
Adres: [………………………………………………………]
GSM: [……………………]
E-posta: [……………………]

---

${f.sikayetEdilenAdi ? `**ŞİKAYET EDİLEN**\nAd Soyad: **${f.sikayetEdilenAdi}**\nAdres: [………………………………………………]\n\n---\n\n` : ""}**KONU:** Şikayet Dilekçesi

---

## ŞİKAYET KONUSU

${f.konu ?? "[Şikayetin detayları ve yaşanan olay buraya yazılır]"}

---

## TALEP

Yukarıda belirtilen husus nedeniyle;

1. Yasal işlem başlatılmasını,
2. Gerekli soruşturmanın yapılmasını,
3. Mağduriyetimin giderilmesini

saygılarımla talep ederim.

**Gerekli belgeler ve deliller ekte sunulmuştur.**

---

**Ad Soyad:** ${f.sikayetciAdi ?? "[AD SOYAD]"}
**İmza:** ………………………………
**Tarih:** ${TODAY}

---

## EKLER
1. İlgili belgeler / deliller
2. Nüfus cüzdanı fotokopisi`;
}

function genIsBasvuruYazisi(f: Fields): string {
  return `**${TODAY}**

---

**${f.sirket ? f.sirket.toUpperCase() : "[ŞİRKET ADI]"} İNSAN KAYNAKLARI MÜDÜRLÜĞÜ'NE**

---

**KONU:** ${f.pozisyon ?? "[POZİSYON]"} Pozisyonu Başvurusu

---

Sayın Yetkili,

${f.sirket ?? "[Şirket Adı]"} bünyesinde açık olan **${f.pozisyon ?? "[Pozisyon]"}** pozisyonu için başvuruda bulunmak istiyorum.

${f.deneyim ? `**${f.deneyim}** deneyimimle` : "Edindiğim deneyim ve birikimimle"} bu pozisyonda başarılı olacağıma inanmakta; teknik bilgimi ve çalışma disiplinimi ekibinize katma değer sağlamak için kullanmak istiyorum.

${f.egitim ? `**Eğitim Durumu:** ${f.egitim}` : ""}

Özgeçmişim ekte yer almakta olup mülakat talebiniz halinde her zaman hazır olduğumu belirtmek isterim.

İlginiz ve değerlendirmeniz için şimdiden teşekkür ederim.

---

Saygılarımla,

**Ad Soyad:** ${f.adSoyad ?? "[AD SOYAD]"}
**GSM:** [……………………]
**E-posta:** [……………………]
**İmza:** ………………………………
**Tarih:** ${TODAY}

---

**EKLER:**
1. Özgeçmiş (CV)
2. Diploma / Transkript fotokopisi`;
}

function genBorcSenedi(f: Fields): string {
  return `# ADİ BORÇ SENEDİ

> ⚠️ **UYARI:** Bu belge adi senet niteliğinde olup icra takibine dayanak olabilir. İmzalamadan önce koşulları dikkatlice okuyunuz. Çek veya bono gibi kıymetli evrak niteliği taşımaz.

---

**Tarih:** ${TODAY}

---

## TARAFLAR

**ALACAKLI (Parayı Veren)**
Ad Soyad: **${f.alacakli ?? "[ALACAKLI ADI SOYADI]"}**
T.C. Kimlik No: [……………………………]
Adres: [………………………………………………………]
GSM: [……………………]

**BORÇLU (Parayı Alan)**
Ad Soyad: **${f.borçlu ?? "[BORÇLU ADI SOYADI]"}**
T.C. Kimlik No: [……………………………]
Adres: [………………………………………………………]
GSM: [……………………]

---

## BORÇ BİLGİLERİ

**Borç Miktarı:** **${f.miktar ?? "[……… TL]"}** (Yalnız: [Yazıyla tutar])
**Borç Tarihi:** ${TODAY}
**Geri Ödeme Tarihi:** **${f.vadeTarihi ?? "[GG.AA.YYYY]"}**
**Ödeme Şekli:** Nakit / Banka Havalesi

---

## TAAHHÜT

Ben, yukarıda bilgileri yazılı **borçlu** olarak, **${f.alacakli ?? "[ALACAKLI]"}**'dan ödünç olarak aldığım **${f.miktar ?? "[……… TL]"}**'yi en geç **${f.vadeTarihi ?? "[GG.AA.YYYY]"}** tarihine kadar eksiksiz ödemeyi taahhüt ederim.

Belirtilen tarihte ödeme yapılmaması halinde yasal faiz işletilmesine ve icra takibi başlatılmasına itiraz hakkım olmadığını beyan ederim.

---

| | |
|---|---|
| **Alacaklı** | **Borçlu** |
| ${f.alacakli ?? "[AD SOYAD]"} | ${f.borçlu ?? "[AD SOYAD]"} |
| İmza: ………………… | İmza: ………………… |
| Tarih: ${TODAY} | Tarih: ${TODAY} |

---

**Tanık (İsteğe Bağlı):**
Ad Soyad: [……………………] — İmza: ………………`;
}

function genReferansMektubu(f: Fields): string {
  return `**${TODAY}**

---

**İLGİLİ MAKAMLARA / İŞVERENE**

---

**KONU:** ${f.kisiAdi ?? "[KİŞİ ADI]"} Hakkında Referans Mektubu

---

Sayın Yetkili,

Bu mektubu, **${f.kisiAdi ?? "[Kişi Adı Soyadı]"}** hakkında referans vermek amacıyla kaleme alıyorum.

${f.kisiAdi ?? "[Kişi]"}, ${f.kurum ?? "[Kurum / Şirket]"} bünyesinde ${f.iliskiSuresi ? `**${f.iliskiSuresi}** boyunca` : "birlikte çalıştığımız süre zarfında"} görevini başarıyla yerine getirmiş; profesyonel tutumu, analitik düşünme yeteneği ve ekip çalışmasına yatkınlığıyla öne çıkmıştır.

Adı geçen kişinin;
- İşine karşı sorumluluk sahibi ve güvenilir olduğunu,
- Zorlu süreçlerde çözüm odaklı yaklaştığını,
- Mesleki gelişimine önem verdiğini

bizzat gözlemledim ve memnuniyetle teyit ederim.

${f.kisiAdi ?? "[Kişi]"}'yi herhangi bir pozisyon veya görev için içtenlikle tavsiye ederim.

---

**Referansı Veren:**

**Ad Soyad:** ${f.yazanAdi ?? "[AD SOYAD]"}
**Unvan:** ${f.yazanUnvan ?? "[UNVAN / POZİSYON]"}
**Kurum:** ${f.kurum ?? "[KURUM / ŞİRKET ADI]"}
**GSM:** [……………………]
**E-posta:** [……………………]
**İmza:** ………………………………
**Tarih:** ${TODAY}`;
}

function genTutanak(f: Fields): string {
  return `# ${(f.tur ?? "TUTANAK").toUpperCase()}

**Tarih:** ${TODAY}
**Yer:** ${f.yer ?? "[Tutanağın tutulduğu yer]"}
**Saat:** [……:……]

---

## KONU

${f.konu ?? "[Tutanağın konusu ve amacı]"}

---

## KATILIMCILAR / TARAFLAR

${f.katilimcilar ?? `| No | Ad Soyad | Görev / Sıfat | İmza |\n|---|---|---|---|\n| 1 | [……………………] | [……………………] | ………… |\n| 2 | [……………………] | [……………………] | ………… |\n| 3 | [……………………] | [……………………] | ………… |`}

---

## TESPİTLER VE AÇIKLAMALAR

${f.konu ?? "[Yapılan tespitler, gözlemler ve varsa anlaşmazlık konuları burada detaylı olarak açıklanır]"}

---

## ALINAN KARARLAR / SONUÇ

${f.karar ?? "[Alınan kararlar, varılan sonuçlar veya yapılması kararlaştırılan işlemler]"}

---

## EKLER

1. [İlgili belgeler / fotoğraflar / deliller]

---

**İş bu tutanak, yukarıda adı geçen taraflarca okunmuş ve imzalanmıştır.**

| Düzenleyen | Onaylayan |
|---|---|
| [Ad Soyad / İmza] | [Ad Soyad / İmza] |
| Tarih: ${TODAY} | Tarih: ${TODAY} |`;
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

// ─── New Document Types: Extract & Generate ──────────────────────────────────

function extractNakil(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { adSoyad: null, mevcutOkul: null, hedefOkul: null, sinif: null, gerekce: null, tur: "Okul Nakli" };
  if (/bölüm\s*nakil|üniversite.*nakil/i.test(text)) fields.tur = "Üniversite Bölüm Nakli";
  const nameM = text.match(/(?:adım|ismim|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.adSoyad = nameM[1].trim();
  else { const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []); if (names[0]) fields.adSoyad = names[0]; }
  const okulM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)*\s+(?:ilkokulu|ortaokulu|lisesi|üniversitesi|fakültesi))/i);
  if (okulM) fields.mevcutOkul = okulM[1].trim();
  const sinifM = text.match(/(\d+)[./]?\s*(?:sınıf|class|grade)/i);
  if (sinifM) fields.sinif = sinifM[1] + ". Sınıf";
  if (/taşındım|taşınma|adres\s*değişiklik/i.test(text)) fields.gerekce = "Aile taşınması nedeniyle";
  else if (/sağlık|hastane|doktor/i.test(text)) fields.gerekce = "Sağlık sebebiyle";
  else if (/ekonomik|maddi/i.test(text)) fields.gerekce = "Ekonomik nedenlerle";
  const missing: string[] = [];
  if (!fields.adSoyad) missing.push("1. Adınız ve soyadınız");
  if (!fields.mevcutOkul) missing.push("2. Mevcut okulunuzun / kurumunuzun adı");
  if (!fields.hedefOkul) missing.push("3. Nakil olmak istediğiniz okulun adı");
  if (!fields.sinif) missing.push("4. Sınıfınız / düzeyiniz");
  if (!fields.gerekce) missing.push("5. Nakil gerekçeniz");
  return { fields, missing };
}

function genNakilTalebi(f: Fields): string {
  return `# NAKİL TALEBİ DİLEKÇESİ

**Tarih:** ${TODAY}

---

**${f.hedefOkul ? f.hedefOkul.toUpperCase() : "[HEDEF OKUL / KURUM ADI]"} MÜDÜRLÜĞÜ'NE**

---

**KONU:** ${f.tur ?? "Okul Nakli"} Talebi

---

Sayın Yetkililer,

**${f.mevcutOkul ?? "[mevcut okul adı]"}** bünyesinde **${f.sinif ?? "[sınıf]"}** olarak öğrenimime devam etmekteyim. Aşağıda belirttiğim gerekçeyle okulunuza nakil olmak istiyorum.

**Nakil Gerekçesi:** ${f.gerekce ?? "[Nakil gerekçenizi açıklayınız]"}

Nakil talebimin olumlu karşılanmasını saygılarımla arz ederim.

---

## ÖĞRENCİ BİLGİLERİ

| Alan | Bilgi |
|---|---|
| Ad Soyad | **${f.adSoyad ?? "[AD SOYAD]"}** |
| T.C. Kimlik No | [……………………………] |
| Mevcut Okul | ${f.mevcutOkul ?? "[……………………………]"} |
| Sınıf / Düzey | ${f.sinif ?? "[……………………………]"} |
| Nakil İstenen Okul | ${f.hedefOkul ?? "[……………………………]"} |

---

## EKLER
1. Nüfus cüzdanı fotokopisi
2. Öğrenci belgesi / kayıt belgesi
3. ${f.gerekce?.includes("taşınma") || f.gerekce?.includes("adres") ? "İkametgah belgesi" : "İlgili gerekçe belgesi"}

---

**Ad Soyad:** ${f.adSoyad ?? "[AD SOYAD]"}
**İmza:** ………………………………
**Tarih:** ${TODAY}

---

⚠️ *Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.*`;
}

function extractNotItiraz(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { adSoyad: null, okul: null, ders: null, alinanNot: null, gerekce: null, ogrenciNo: null };
  const nameM = text.match(/(?:adım|ismim|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.adSoyad = nameM[1].trim();
  else { const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []); if (names[0]) fields.adSoyad = names[0]; }
  const okulM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+)?(?:üniversitesi|üniversite|fakültesi|lisesi|okulu)/i);
  if (okulM) fields.okul = okulM[0].trim();
  const dersM = text.match(/(?:ders(?:in)?|sınav(?:ın)?|not(?:um)?)\s+(?:adı[:\s]+)?([A-ZÇĞİÖŞÜa-zçğışöşü\s]{3,40}?)(?:\s*dersinden|\s*sınavında|\s*notuma|\s*notunu|\s*$)/i);
  if (dersM) fields.ders = dersM[1].trim();
  const notM = text.match(/(\d{1,3})\s*(?:puan|\/100|not)/i);
  if (notM) fields.alinanNot = notM[1] + " puan";
  const noM = text.match(/(?:öğrenci\s*no|numara(?:m)?)[:\s]*(\d{6,12})/i);
  if (noM) fields.ogrenciNo = noM[1];
  const missing: string[] = [];
  if (!fields.adSoyad) missing.push("1. Adınız ve soyadınız");
  if (!fields.okul) missing.push("2. Okul / üniversite adı");
  if (!fields.ders) missing.push("3. İtiraz ettiğiniz ders / sınavın adı");
  if (!fields.alinanNot) missing.push("4. Aldığınız not / puan");
  if (!fields.gerekce) missing.push("5. İtiraz gerekçeniz (örn: eksik puanlama, değerlendirme hatası)");
  return { fields, missing };
}

function genNotItiraz(f: Fields): string {
  return `# NOT / SINAV SONUCU İTİRAZ DİLEKÇESİ

**Tarih:** ${TODAY}

---

**${f.okul ? f.okul.toUpperCase() : "[OKUL / ÜNİVERSİTE ADI]"} SINAV KOMİSYONU / MÜDÜRLÜĞÜ'NE**

---

**KONU:** ${f.ders ?? "[Ders Adı]"} Sınav Sonucuna İtiraz

---

Sayın Yetkililer,

Kurumunuzda öğrenim gören öğrenciniz olarak, **${f.ders ?? "[ders adı]"}** dersine ait sınav sonucuma itiraz etmek istiyorum.

**Aldığım Sonuç:** ${f.alinanNot ?? "[alınan not / puan]"}
**İtiraz Gerekçesi:** ${f.gerekce ?? "[İtiraz gerekçenizi açıklayınız]"}

İlgili sınav kağıdımın yeniden incelenerek, hata tespit edilmesi halinde düzeltilmesini ve tarafıma yazılı bilgi verilmesini saygılarımla arz ederim.

---

## ÖĞRENCİ BİLGİLERİ

| Alan | Bilgi |
|---|---|
| Ad Soyad | **${f.adSoyad ?? "[AD SOYAD]"}** |
| Öğrenci No | ${f.ogrenciNo ?? "[……………………]"} |
| T.C. Kimlik No | [……………………………] |
| İtiraz Konusu Ders | **${f.ders ?? "[……………………]"}** |
| Alınan Not / Puan | ${f.alinanNot ?? "[……]"} |

---

**Ad Soyad:** ${f.adSoyad ?? "[AD SOYAD]"}
**İmza:** ………………………………
**Tarih:** ${TODAY}

---

⚠️ *Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.*`;
}

function extractOgrenciBelgesi(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { adSoyad: null, okul: null, belgeTuru: "Öğrenci Belgesi", amac: null, ogrenciNo: null };
  if (/transkript|not\s*döküm|not\s*çizelge/i.test(text)) fields.belgeTuru = "Transkript (Not Dökümü)";
  else if (/mezun/i.test(text)) fields.belgeTuru = "Mezuniyet Belgesi";
  const nameM = text.match(/(?:adım|ismim|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.adSoyad = nameM[1].trim();
  else { const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []); if (names[0]) fields.adSoyad = names[0]; }
  const okulM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+)?(?:üniversitesi|üniversite|fakültesi|lisesi)/i);
  if (okulM) fields.okul = okulM[0].trim();
  const noM = text.match(/(?:öğrenci\s*no|numara(?:m)?)[:\s]*(\d{6,12})/i);
  if (noM) fields.ogrenciNo = noM[1];
  if (/burs|kredi/i.test(text)) fields.amac = "Burs / kredi başvurusu için";
  else if (/iş\s*başvur|staj/i.test(text)) fields.amac = "İş başvurusu / staj için";
  else if (/askerlik|erteleme/i.test(text)) fields.amac = "Askerlik erteleme için";
  else if (/vize|pasaport/i.test(text)) fields.amac = "Vize / pasaport işlemleri için";
  const missing: string[] = [];
  if (!fields.adSoyad) missing.push("1. Adınız ve soyadınız");
  if (!fields.okul) missing.push("2. Okulunuz / üniversiteniz");
  if (!fields.amac) missing.push("3. Belgeyi neden istiyorsunuz? (burs, staj, iş başvurusu vb.)");
  return { fields, missing };
}

function genOgrenciBelgesi(f: Fields): string {
  return `# ${(f.belgeTuru ?? "ÖĞRENCİ BELGESİ").toUpperCase()} TALEBİ

**Tarih:** ${TODAY}

---

**${f.okul ? f.okul.toUpperCase() : "[ÜNİVERSİTE / OKUL ADI]"} ÖĞRENCİ İŞLERİ MÜDÜRLÜĞÜ'NE**

---

**KONU:** ${f.belgeTuru ?? "Öğrenci Belgesi"} Talebi

---

Sayın Yetkililer,

Kurumunuzda kayıtlı öğrenciniz olarak, **${f.belgeTuru ?? "Öğrenci Belgesi"}** talep ediyorum.

**Kullanım Amacı:** ${f.amac ?? "[Belgeyi kullanacağınız amacı yazınız]"}

Belgenin tarafıma verilmesini saygılarımla arz ederim.

---

## ÖĞRENCİ BİLGİLERİ

| Alan | Bilgi |
|---|---|
| Ad Soyad | **${f.adSoyad ?? "[AD SOYAD]"}** |
| Öğrenci Numarası | ${f.ogrenciNo ?? "[……………………]"} |
| T.C. Kimlik No | [……………………………] |
| Bölüm / Program | [……………………………] |
| Sınıf | [………] |
| Talep Edilen Belge | **${f.belgeTuru ?? "Öğrenci Belgesi"}** |
| Adet | 1 adet |

---

**Ad Soyad:** ${f.adSoyad ?? "[AD SOYAD]"}
**İmza:** ………………………………
**Tarih:** ${TODAY}

---

⚠️ *Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.*`;
}

function extractDevamsizlik(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { adSoyad: null, okul: null, ders: null, sure: null, gerekce: null, ogrenciNo: null };
  const nameM = text.match(/(?:adım|ismim|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.adSoyad = nameM[1].trim();
  else { const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []); if (names[0]) fields.adSoyad = names[0]; }
  const okulM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü]+\s+)?(?:üniversitesi|üniversite|fakültesi|lisesi|okulu)/i);
  if (okulM) fields.okul = okulM[0].trim();
  const sureM = text.match(/(\d+)\s*(gün|ders\s*saati|saat|hafta)/i);
  if (sureM) fields.sure = `${sureM[1]} ${sureM[2]}`;
  if (/sağlık|hastalık|ameliyat|doktor|rapor/i.test(text)) fields.gerekce = "Sağlık sebebiyle (rapor eklidir)";
  else if (/aile|acil|ölüm|vefat|cenaze/i.test(text)) fields.gerekce = "Ailevi zorunluluk nedeniyle";
  else if (/kaza|trafik/i.test(text)) fields.gerekce = "Kaza nedeniyle";
  const missing: string[] = [];
  if (!fields.adSoyad) missing.push("1. Adınız ve soyadınız");
  if (!fields.okul) missing.push("2. Okulunuz / üniversiteniz");
  if (!fields.sure) missing.push("3. Kaç gün / saat devamsızlık yapıldı?");
  if (!fields.gerekce) missing.push("4. Devamsızlık gerekçeniz (sağlık, ailevi durum vb.)");
  return { fields, missing };
}

function genDevamsizlik(f: Fields): string {
  return `# DEVAMSIZLIK AFFİ / MAZERET BİLDİRİM DİLEKÇESİ

**Tarih:** ${TODAY}

---

**${f.okul ? f.okul.toUpperCase() : "[OKUL / ÜNİVERSİTE ADI]"} MÜDÜRLÜĞÜ'NE**
${f.ders ? `*(${f.ders} Dersi Sorumlusuna)*` : ""}

---

**KONU:** Devamsızlık Mazeret Bildirimi ve Af Talebi

---

Sayın Yetkililer,

${f.sure ? `**${f.sure}** süren` : "Yaşadığım"} devamsızlığımın, aşağıda belirttiğim zorunlu gerekçeye dayandığını saygılarımla bildiririm.

**Devamsızlık Sebebi:** ${f.gerekce ?? "[Devamsızlık gerekçenizi yazınız]"}

Mazeretimi belgeleyen evrak (doktor raporu / resmi belge) ekte sunulmuştur. Devamsızlığımın affedilmesini ve durumun değerlendirilerek tarafıma bilgi verilmesini saygılarımla arz ederim.

---

## ÖĞRENCİ BİLGİLERİ

| Alan | Bilgi |
|---|---|
| Ad Soyad | **${f.adSoyad ?? "[AD SOYAD]"}** |
| Öğrenci Numarası | ${f.ogrenciNo ?? "[……………………]"} |
| T.C. Kimlik No | [……………………………] |
| Bölüm / Sınıf | [……………………………] |
| Devamsızlık Süresi | ${f.sure ?? "[…… gün / saat]"} |
| İlgili Ders | ${f.ders ?? "Tüm dersler"} |

---

## EKLER
1. ${f.gerekce?.includes("Sağlık") ? "Doktor raporu / sağlık belgesi" : "Mazerete ilişkin resmi belge"}
2. Nüfus cüzdanı fotokopisi

---

**Ad Soyad:** ${f.adSoyad ?? "[AD SOYAD]"}
**İmza:** ………………………………
**Tarih:** ${TODAY}

---

⚠️ *Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.*`;
}

function extractBilgiEdinme(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { adSoyad: null, kurum: null, konu: null, aciklama: null };
  const nameM = text.match(/(?:adım|ismim|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.adSoyad = nameM[1].trim();
  else { const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []); if (names[0]) fields.adSoyad = names[0]; }
  const kurumM = text.match(/([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)*\s+(?:bakanlığı|müdürlüğü|belediyesi|üniversitesi|kurumu|idaresi))/i);
  if (kurumM) fields.kurum = kurumM[1].trim();
  const missing: string[] = [];
  if (!fields.adSoyad) missing.push("1. Adınız ve soyadınız");
  if (!fields.kurum) missing.push("2. Başvurduğunuz kurumun adı");
  if (!fields.konu) missing.push("3. Talep ettiğiniz bilgi veya belgenin konusu");
  if (!fields.aciklama) missing.push("4. Talebinizin ayrıntılı açıklaması");
  return { fields, missing };
}

function genBilgiEdinme(f: Fields): string {
  return `# BİLGİ EDİNME BAŞVURUSU
*(4982 Sayılı Bilgi Edinme Hakkı Kanunu Kapsamında)*

**Tarih:** ${TODAY}

---

**${f.kurum ? f.kurum.toUpperCase() : "[KURUM ADI]"}**'NA

---

**KONU:** Bilgi Edinme Talebi — ${f.konu ?? "[Talep Konusu]"}

---

Sayın Yetkililer,

4982 sayılı Bilgi Edinme Hakkı Kanunu çerçevesinde, kurumunuzdan aşağıdaki bilgi ve belgeleri talep ediyorum:

**Talep Konusu:** ${f.konu ?? "[Talep ettiğiniz bilginin konusu]"}

**Ayrıntılı Açıklama:**
${f.aciklama ?? "[Talep ettiğiniz bilgiyi ayrıntılı olarak açıklayınız]"}

4982 sayılı Kanun'un 11. maddesi gereğince talebimin en geç **15 iş günü** içinde yanıtlanmasını; bilgiye erişimin mümkün olmaması halinde yasal gerekçesiyle bildirilmesini talep ederim.

---

## BAŞVURU SAHİBİ

| Alan | Bilgi |
|---|---|
| Ad Soyad | **${f.adSoyad ?? "[AD SOYAD]"}** |
| T.C. Kimlik No | [……………………………] |
| Adres | [………………………………………………] |
| E-posta | [……………………] |
| Telefon | [……………………] |

---

**Ad Soyad:** ${f.adSoyad ?? "[AD SOYAD]"}
**İmza:** ………………………………
**Tarih:** ${TODAY}

---

⚠️ *Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.*
*Not: Bilgi edinme başvuruları CİMER (cimer.iletisim.gov.tr) üzerinden de yapılabilir.*`;
}

function extractUcretTalebi(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { adSoyad: null, sirket: null, talep: null, gerekce: null };
  const nameM = text.match(/(?:adım|ismim|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.adSoyad = nameM[1].trim();
  else { const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []); if (names[0]) fields.adSoyad = names[0]; }
  const sirketM = text.match(/(?:şirket|firma|kurum|işveren)[:\s]+([A-ZÇĞİÖŞÜa-zçğışöşü\s]{3,40})/i);
  if (sirketM) fields.sirket = sirketM[1].trim();
  if (/maaş\s*zam|ücret\s*artış|zam\s*tal/i.test(text)) fields.talep = "Ücret zammı talebi";
  else if (/prim|ikramiye/i.test(text)) fields.talep = "Prim / ikramiye talebi";
  else if (/yemek|yol\s*parası|servis/i.test(text)) fields.talep = "Yol / yemek yardımı talebi";
  else if (/sağlık\s*sigorta/i.test(text)) fields.talep = "Sağlık sigortası talebi";
  const missing: string[] = [];
  if (!fields.adSoyad) missing.push("1. Adınız ve soyadınız");
  if (!fields.sirket) missing.push("2. Şirket / kurum adı");
  if (!fields.talep) missing.push("3. Talebinizin konusu (ücret zammı, prim, yemek yardımı vb.)");
  if (!fields.gerekce) missing.push("4. Talep gerekçeniz (çalışma süreniz, performans vb.)");
  return { fields, missing };
}

function genUcretTalebi(f: Fields): string {
  return `# ÜCRET / YAN HAK TALEBİ

**Tarih:** ${TODAY}

---

**${f.sirket ? f.sirket.toUpperCase() : "[ŞİRKET / KURUM ADI]"}**
**İnsan Kaynakları / İK Müdürlüğü'ne**

---

**KONU:** ${f.talep ?? "Ücret / Yan Hak Talebi"}

---

Sayın Yetkililer,

Kurumunuzda [pozisyon] olarak görev yapmaktayım. Aşağıda belirttiğim talebimin değerlendirilerek olumlu karşılanmasını saygılarımla arz ederim.

**Talep:** ${f.talep ?? "[Talebinizi açıklayınız]"}

**Gerekçe:** ${f.gerekce ?? "[Talep gerekçenizi açıklayınız — örn: piyasa koşulları, kıdem, performans]"}

Talebimin olumlu karşılanacağını umarak en kısa sürede bilgilendirilmeyi talep ederim.

---

## ÇALIŞAN BİLGİLERİ

| Alan | Bilgi |
|---|---|
| Ad Soyad | **${f.adSoyad ?? "[AD SOYAD]"}** |
| T.C. Kimlik No | [……………………………] |
| Departman / Birim | [……………………………] |
| Pozisyon / Unvan | [……………………………] |
| İşe Başlama Tarihi | [……………………………] |
| Mevcut Brüt Ücret | [……………………… TL] |

---

**Ad Soyad:** ${f.adSoyad ?? "[AD SOYAD]"}
**İmza:** ………………………………
**Tarih:** ${TODAY}

---

⚠️ *Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.*`;
}

function extractSgkTalebi(text: string): { fields: Fields; missing: string[] } {
  const fields: Fields = { adSoyad: null, tcNo: null, belgeTuru: "Hizmet Dökümü", amac: null };
  if (/hizmet\s*birleştir/i.test(text)) fields.belgeTuru = "Hizmet Birleştirme";
  else if (/emeklilik|emekli/i.test(text)) fields.belgeTuru = "Emeklilik Belgesi";
  else if (/sigortalılık\s*belgesi/i.test(text)) fields.belgeTuru = "Sigortalılık Durumu Belgesi";
  const nameM = text.match(/(?:adım|ismim|ben)\s+([A-ZÇĞİÖŞÜa-zçğışöşü]+(?:\s+[A-ZÇĞİÖŞÜa-zçğışöşü]+)?)/i);
  if (nameM) fields.adSoyad = nameM[1].trim();
  else { const names = (text.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || []); if (names[0]) fields.adSoyad = names[0]; }
  const tcM = text.match(/\b(\d{11})\b/);
  if (tcM) fields.tcNo = tcM[1];
  if (/emeklilik/i.test(text)) fields.amac = "Emeklilik başvurusu için";
  else if (/iş\s*başvur/i.test(text)) fields.amac = "İş başvurusu için";
  else if (/kredi|banka/i.test(text)) fields.amac = "Kredi / banka işlemleri için";
  else if (/vize|yurt\s*dışı/i.test(text)) fields.amac = "Vize / yurt dışı işlemleri için";
  const missing: string[] = [];
  if (!fields.adSoyad) missing.push("1. Adınız ve soyadınız");
  if (!fields.tcNo) missing.push("2. T.C. Kimlik Numaranız");
  if (!fields.belgeTuru) missing.push("3. Talep ettiğiniz belge türü (hizmet dökümü, sigortalılık belgesi vb.)");
  if (!fields.amac) missing.push("4. Belgeyi kullanma amacınız");
  return { fields, missing };
}

function genSgkTalebi(f: Fields): string {
  return `# SGK BELGE TALEBİ

**Tarih:** ${TODAY}

---

**SOSYAL GÜVENLİK KURUMU**
**[İlgili SGK İl / İlçe Müdürlüğü] MÜDÜRLÜĞÜ'NE**

---

**KONU:** ${f.belgeTuru ?? "Hizmet Dökümü"} Talebi

---

Sayın Yetkililer,

Sosyal Güvenlik Kurumu'ndan aşağıdaki belgeyi talep ediyorum.

**Talep Edilen Belge:** ${f.belgeTuru ?? "Hizmet Dökümü (SGK Sicil Kaydı)"}
**Kullanım Amacı:** ${f.amac ?? "[Belgeyi kullanma amacınızı yazınız]"}

Belgenin tarafıma verilmesini saygılarımla arz ederim.

---

## BAŞVURU SAHİBİ

| Alan | Bilgi |
|---|---|
| Ad Soyad | **${f.adSoyad ?? "[AD SOYAD]"}** |
| T.C. Kimlik No | **${f.tcNo ?? "[……………………………]"}** |
| Doğum Tarihi | [……………………] |
| Adres | [………………………………………………] |
| Telefon | [……………………] |

---

*Not: SGK hizmet dökümü ve pek çok belge e-Devlet (turkiye.gov.tr) üzerinden de alınabilmektedir.*

---

**Ad Soyad:** ${f.adSoyad ?? "[AD SOYAD]"}
**İmza:** ………………………………
**Tarih:** ${TODAY}

---

⚠️ *Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.*`;
}

// ─── Smart Mock Engine ────────────────────────────────────────────────────────

function generateMockResponse(messages: ChatMsg[]): AiResponse {
  const history = fullHistory(messages);
  const uHistory = userMsgs(messages);
  const last = lastUser(messages);

  const docType = detectDocType(history);

  if (!docType) {
    return {
      docType: null,
      status: "need_type",
      assistantMessage:
        "Merhaba! Hangi tür belge hazırlamamı istersiniz?\n\nÖrnek olarak şunları söyleyebilirsiniz:\n• \"Kira sözleşmesi hazırla\"\n• \"İstifa dilekçesi yazıyorum\"\n• \"Komşuma ihtarname göndereceğim\"\n• \"Yıllık izin talebi\"\n• \"Vekaletname lazım\"\n• \"İş sözleşmesi hazırla\"\n• \"Şikayet dilekçesi\"\n\nDilek veya talebinizi doğal bir şekilde anlatabilirsiniz — gerisini ben hallederim.",
      document: null,
    };
  }

  if (docType === "İstifa Dilekçesi") {
    const { fields, missing } = extractIstifa(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `İstifa dilekçenizi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBilgileri paylaştığınızda hemen hazırlayacağım.`, document: null };
    return { docType, status: "ready", assistantMessage: "İstifa dilekçeniz resmi formatta hazırlandı. Tarihleri ve boş alanları gözden geçirip imzalayabilirsiniz.", document: genIstifaDilekcesi(fields) };
  }

  if (docType === "İzin Talebi") {
    const { fields, missing } = extractIzin(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `İzin talep formu için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBunları paylaşır mısınız?`, document: null };
    return { docType, status: "ready", assistantMessage: "İzin talep formunuz hazır. İnsan Kaynakları Müdürlüğü'ne teslim edebilirsiniz.", document: genIzinTalebi(fields) };
  }

  if (docType === "Kayıt Dondurma Dilekçesi") {
    const { fields, missing } = extractKayitDondurma(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `Kayıt dondurma dilekçesi için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri yazın, dilekçeyi hemen hazırlayayım.`, document: null };
    return { docType, status: "ready", assistantMessage: "Kayıt dondurma dilekçeniz hazır. Gerekli eklerle birlikte Öğrenci İşleri'ne teslim edebilirsiniz.", document: genKayitDondurma(fields) };
  }

  if (docType === "Şikayet Dilekçesi") {
    const { fields, missing } = extractSikayet(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `Şikayet dilekçenizi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaşır mısınız?`, document: null };
    return { docType, status: "ready", assistantMessage: "Şikayet dilekçeniz resmi formatta hazırlandı. İlgili kuruma teslim edebilir veya noter kanalıyla gönderebilirsiniz.", document: genSikayetDilekcesi(fields) };
  }

  if (docType === "İş Başvuru Yazısı") {
    const { fields, missing } = extractIsBasvuru(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `İş başvuru yazınızı hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaşır mısınız?`, document: null };
    return { docType, status: "ready", assistantMessage: "İş başvuru yazınız (ön yazı) hazır. CV'nizle birlikte ilgili kişiye iletebilirsiniz.", document: genIsBasvuruYazisi(fields) };
  }

  if (docType === "Referans Mektubu") {
    const { fields, missing } = extractReferans(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `Referans mektubunu hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaşır mısınız?`, document: null };
    return { docType, status: "ready", assistantMessage: "Referans mektubunuz hazır. İmzaladıktan sonra ilgili kişiye veya kuruma iletebilirsiniz.", document: genReferansMektubu(fields) };
  }

  if (docType === "Taahhütname") {
    const maddiIcerik = /\d+\s*(tl|lira|₺)|ödeyeceğim|ödeme\s*taahhüt|borcum|borç\s*taahhüt|para\s*taahhüt|maddi\s*taahhüt/i.test(uHistory);
    if (maddiIcerik) {
      return {
        docType: null,
        status: "need_type",
        assistantMessage: `Para ödeme veya borç içeren taahhütnameler, hukuki açıdan borç senedi niteliği taşıyabilir ve icra takibine dayanak oluşturabilir.\n\nBu tür belgeler için bir avukata danışmanızı öneririm.\n\nEğer maddi yükümlülük içermeyen bir taahhütname istiyorsanız (örneğin: "şu tarihe kadar teslim edeceğim" veya "kurallara uyacağım"), size yardımcı olabilirim.`,
        document: null,
      };
    }
    return {
      docType,
      status: "need_info",
      assistantMessage: `Taahhütname hazırlamak için şu bilgilere ihtiyacım var:\n\n1. Adınız ve soyadınız\n2. Taahhüdün kime / hangi kuruma verildiği\n3. Taahhüdün konusu (örn: "proje teslimini tamamlayacağım", "kurallara uyacağım")\n4. Taahhüt süresi veya tarihi (varsa)\n\nNot: Para/borç ödeme taahhütleri bu belge kapsamında değildir.`,
      document: null,
    };
  }

  if (docType === "Nakil Talebi") {
    const { fields, missing } = extractNakil(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `Nakil talebi dilekçenizi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaşır mısınız?`, document: null };
    return { docType, status: "ready", assistantMessage: "Nakil talebi dilekçeniz hazırlandı. Gerekli eklerle birlikte ilgili okul müdürlüğüne teslim edebilirsiniz.", document: genNakilTalebi(fields) };
  }

  if (docType === "Not İtirazı") {
    const { fields, missing } = extractNotItiraz(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `Not / sınav itiraz dilekçenizi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaşır mısınız?`, document: null };
    return { docType, status: "ready", assistantMessage: "Not itiraz dilekçeniz hazırlandı. İlgili sınav komisyonuna veya öğrenci işlerine teslim edebilirsiniz.", document: genNotItiraz(fields) };
  }

  if (docType === "Öğrenci Belgesi Talebi") {
    const { fields, missing } = extractOgrenciBelgesi(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `Öğrenci belgesi talebinizi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaşır mısınız?`, document: null };
    return { docType, status: "ready", assistantMessage: "Öğrenci belgesi talebiniz hazırlandı. Öğrenci işleri birimine teslim edebilirsiniz.", document: genOgrenciBelgesi(fields) };
  }

  if (docType === "Devamsızlık Affı") {
    const { fields, missing } = extractDevamsizlik(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `Devamsızlık affı dilekçenizi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaşır mısınız?`, document: null };
    return { docType, status: "ready", assistantMessage: "Devamsızlık affı dilekçeniz hazırlandı. Mazeret belgenizle birlikte ilgili birime teslim edebilirsiniz.", document: genDevamsizlik(fields) };
  }

  if (docType === "Bilgi Edinme Başvurusu") {
    const { fields, missing } = extractBilgiEdinme(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `4982 sayılı Kanun kapsamında bilgi edinme başvurunuzu hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaşır mısınız?`, document: null };
    return { docType, status: "ready", assistantMessage: "Bilgi edinme başvurunuz hazırlandı. Kuruma elden teslim edebilir veya CİMER üzerinden de başvurabilirsiniz.", document: genBilgiEdinme(fields) };
  }

  if (docType === "Ücret/Yan Hak Talebi") {
    const { fields, missing } = extractUcretTalebi(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `Ücret / yan hak talebinizi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaşır mısınız?`, document: null };
    return { docType, status: "ready", assistantMessage: "Ücret / yan hak talebiniz hazırlandı. İnsan Kaynakları birimine iletebilirsiniz.", document: genUcretTalebi(fields) };
  }

  if (docType === "SGK Belge Talebi") {
    const { fields, missing } = extractSgkTalebi(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `SGK belge talebinizi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaşır mısınız?\n\nNot: Pek çok SGK belgesi e-Devlet (turkiye.gov.tr) üzerinden de alınabilmektedir.`, document: null };
    return { docType, status: "ready", assistantMessage: "SGK belge talebiniz hazırlandı. İlgili SGK müdürlüğüne teslim edebilirsiniz. Ayrıca e-Devlet üzerinden de aynı belgeye erişebilirsiniz.", document: genSgkTalebi(fields) };
  }

  if (docType === "Dilekçe") {
    const hasKonu = uHistory.includes("konu") || last.length > 20;
    const hasKurum = /belediye|bakanlık|müdürlük|müdürlüğe|üniversite|fakülte|okul|kurum|şirket|genel müdür|savcılık/i.test(uHistory);
    if (!hasKonu || !hasKurum) {
      const missingItems = [];
      if (!hasKurum) missingItems.push("1. Dilekçenin hangi kuruma / makama verileceği");
      if (!hasKonu) missingItems.push("2. Dilekçenin konusu ve talebiniz");
      return { docType, status: "need_info", assistantMessage: `Dilekçeyi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missingItems.join("\n")}\n\nAçıklamanız yeterli.`, document: null };
    }
    const kurumM = uHistory.match(/(?:belediye|bakanlık|müdürlük|üniversite|fakülte|okul|kurum|şirket|savcılık)[^\n,.!?]*/i);
    const adM = (uHistory.match(/\b([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\s+([A-ZÇĞİÖŞÜ][a-zçğışöşü]{2,})\b/g) || [])[0] ?? null;
    return { docType, status: "ready", assistantMessage: "Dilekçeniz resmi formatta hazırlandı. Boş alanları kendi bilgilerinizle doldurabilirsiniz.", document: genGenelDilekcesi({ konu: last.slice(0, 120), kurum: kurumM?.[0] ?? null, calisanAdi: adM }) };
  }

  return {
    docType,
    status: "need_info",
    assistantMessage: `${docType} hazırlamak için biraz daha bilgiye ihtiyacım var. Lütfen şunları belirtin:\n\n1. Adınız ve soyadınız\n2. Belgenin kime / neye yönelik olduğu\n3. Varsa özel koşullar veya talepler`,
    document: null,
  };
}

// ─── AI Service ───────────────────────────────────────────────────────────────

import { StorageService } from "./storage";

export const AIService = {
  async sendMessage(messages: ChatMsg[]): Promise<AiResponse> {
    const apiBase = "";
    try {
      const userInfo = await StorageService.getUserInfo();
      const response = await fetch(`${apiBase}/api/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, userInfo }),
        signal: AbortSignal.timeout(20000),
      });
      if (!response.ok) throw new Error(`Sunucu hatası: ${response.status}`);
      return await response.json() as AiResponse;
    } catch (e) {
      return {
        docType: null,
        status: "need_type",
        assistantMessage: "⚠️ Sunucuya bağlanılamadı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.",
        document: null,
      };
    }
  },
};
