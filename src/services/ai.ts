import { getTemplateTypes } from "./templateRegistry";

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
1. Kullanıcının mesajlarını analiz et ve hangi resmi belgeyi (Dilekçe, Kira Sözleşmesi, İhtarname, İstifa Dilekçesi, İzin Talebi, Kayıt Dondurma, Vekaletname, Taahhütname, İş Sözleşmesi, Şikayet Dilekçesi vb.) istediğini tespit et.
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
  | "Kira Sözleşmesi"
  | "İstifa Dilekçesi"
  | "İhtarname"
  | "İzin Talebi"
  | "Kayıt Dondurma Dilekçesi"
  | "Vekaletname"
  | "Taahhütname"
  | "İş Sözleşmesi"
  | "Şikayet Dilekçesi"
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
  if (/iş\s*sözleşme|istihdam\s*sözleşme|hizmet\s*sözleşme|çalışma\s*sözleşme|işe\s*alım/i.test(text)) return "İş Sözleşmesi";
  if (/şikayet\s*dilekçe|şikayetçi|şikayetim\s*var|şikayet\s*etmek|ihbar\s*dilekçe/i.test(text)) return "Şikayet Dilekçesi";
  if (/dilekçe|başvuru\s*dilekçe|resmi\s*başvur|kuruma\s*yaz/i.test(text)) return "Dilekçe";
  if (/kira/i.test(text)) return "Kira Sözleşmesi";
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

  if (docType === "Kira Sözleşmesi") {
    const { fields, missing } = extractKira(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `Kira sözleşmesini hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri yazmanız yeterli.`, document: null };
    return { docType, status: "ready", assistantMessage: "Kira sözleşmenizi resmi mevzuata (TBK 6098) uygun olarak hazırladım. Boş alanları kendi bilgilerinizle doldurabilirsiniz.", document: genKiraSozlesmesi(fields) };
  }

  if (docType === "İstifa Dilekçesi") {
    const { fields, missing } = extractIstifa(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `İstifa dilekçenizi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBilgileri paylaştığınızda hemen hazırlayacağım.`, document: null };
    return { docType, status: "ready", assistantMessage: "İstifa dilekçeniz resmi formatta hazırlandı. Tarihleri ve boş alanları gözden geçirip imzalayabilirsiniz.", document: genIstifaDilekcesi(fields) };
  }

  if (docType === "İhtarname") {
    const { fields, missing } = extractIhtar(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `İhtarname hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaştığınızda oluşturacağım.`, document: null };
    return { docType, status: "ready", assistantMessage: "İhtarnameniz hazır. Hukuki geçerlilik için noter kanalıyla göndermenizi tavsiye ederim.", document: genIhtarname(fields) };
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

  if (docType === "Vekaletname") {
    const { fields, missing } = extractVekaletname(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `Vekaletname hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaşır mısınız?`, document: null };
    return { docType, status: "ready", assistantMessage: "Vekaletnameniz hazırlandı. Hukuki geçerlilik için noter onayı gerekmektedir.", document: genVekaletname(fields) };
  }

  if (docType === "İş Sözleşmesi") {
    const { fields, missing } = extractIsSozlesmesi(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `İş sözleşmesi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaşır mısınız?`, document: null };
    return { docType, status: "ready", assistantMessage: "İş sözleşmeniz 4857 sayılı İş Kanunu'na uygun olarak hazırlandı. İmzalamadan önce hukuki danışmanlık almanızı tavsiye ederim.", document: genIsSozlesmesi(fields) };
  }

  if (docType === "Şikayet Dilekçesi") {
    const { fields, missing } = extractSikayet(uHistory);
    if (missing.length > 0) return { docType, status: "need_info", assistantMessage: `Şikayet dilekçenizi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaşır mısınız?`, document: null };
    return { docType, status: "ready", assistantMessage: "Şikayet dilekçeniz resmi formatta hazırlandı. İlgili kuruma teslim edebilir veya noter kanalıyla gönderebilirsiniz.", document: genSikayetDilekcesi(fields) };
  }

  if (docType === "Taahhütname") {
    return {
      docType,
      status: "need_info",
      assistantMessage: `Taahhütname hazırlamak için şu bilgilere ihtiyacım var:\n\n1. Adınız ve soyadınız\n2. Taahhüdün kime / hangi kuruma verildiği\n3. Taahhüdün konusu (ne taahhüt ediyorsunuz?)\n4. Taahhüt süresi (varsa)\n\nBu bilgileri paylaşır mısınız?`,
      document: null,
    };
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
    const apiBase = typeof window !== "undefined"
      ? `${window.location.protocol}//${window.location.hostname}:3001`
      : "http://localhost:3001";
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
