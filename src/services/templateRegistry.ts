export type TemplateField = {
  key: string;
  label: string;
  required: boolean;
};

export type DocumentTemplate = {
  type: string;
  title: string;
  category: "Hukuki" | "İş Hayatı" | "Eğitim" | "Kişisel";
  description: string;
  fields: TemplateField[];
  warning: string;
};

export const CORE_TEMPLATES: DocumentTemplate[] = [
  {
    type: "Genel Dilekçe",
    title: "Genel Dilekçe",
    category: "Hukuki",
    description: "Talep, bilgi isteme veya başvuru için temel belge.",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "kurum", label: "Muhatabın Kurumu", required: true },
      { key: "konu", label: "Konu", required: true },
      { key: "aciklama", label: "Açıklama / Talep", required: true },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.",
  },
  {
    type: "İzin Talebi",
    title: "İzin Talebi",
    category: "İş Hayatı",
    description: "İş veya okul için izin isteme formu.",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "tur", label: "İzin Türü (Yıllık, Mazeret vb.)", required: true },
      { key: "baslangic", label: "Başlangıç Tarihi", required: true },
      { key: "bitis", label: "Bitiş Tarihi", required: true },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.",
  },
  {
    type: "İstifa Dilekçesi",
    title: "İstifa Dilekçesi",
    category: "İş Hayatı",
    description: "İşten ayrılma bildirimi.",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "sirket", label: "Şirket Adı", required: true },
      { key: "pozisyon", label: "Pozisyon / Görev", required: true },
      { key: "sonGun", label: "Son Çalışma Günü", required: false },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.",
  },
  {
    type: "İş Başvuru Yazısı",
    title: "İş Başvuru Yazısı",
    category: "İş Hayatı",
    description: "CV ile birlikte gönderilen ön yazı (cover letter).",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "pozisyon", label: "Başvurulan Pozisyon", required: true },
      { key: "sirket", label: "Şirket Adı", required: true },
      { key: "deneyim", label: "Deneyim Süresi", required: false },
      { key: "egitim", label: "Eğitim Bilgisi", required: false },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Göndermeden önce kişiselleştirin.",
  },
  {
    type: "Kira Sözleşmesi",
    title: "Kira Sözleşmesi",
    category: "Hukuki",
    description: "Konut ve iş yeri kira sözleşmesi taslağı.",
    fields: [
      { key: "kiraciAdi", label: "Kiracı Adı", required: true },
      { key: "kirayaVerenAdi", label: "Kiraya Veren Adı", required: true },
      { key: "adres", label: "Mülk Adresi", required: true },
      { key: "kiraBedeli", label: "Aylık Kira (TL)", required: true },
      { key: "baslangicTarihi", label: "Başlangıç Tarihi", required: true },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.",
  },
  {
    type: "Borç Senedi",
    title: "Borç Senedi (Adi Senet)",
    category: "Hukuki",
    description: "Kişiler arası borçlanma belgesi. Çek veya bono değildir.",
    fields: [
      { key: "alacakli", label: "Alacaklı Adı Soyadı", required: true },
      { key: "borçlu", label: "Borçlu Adı Soyadı", required: true },
      { key: "miktar", label: "Borç Miktarı (TL)", required: true },
      { key: "vadeTarihi", label: "Geri Ödeme Tarihi", required: true },
    ],
    warning: "⚠️ Bu belge icra takibine dayanak olabilir. İmzalamadan önce dikkatli olun.",
  },
  {
    type: "Referans Mektubu",
    title: "Referans Mektubu",
    category: "İş Hayatı",
    description: "Eski çalışan veya öğrenci için tavsiye yazısı.",
    fields: [
      { key: "yazanAdi", label: "Referansı Yazan (Ad Soyad)", required: true },
      { key: "yazanUnvan", label: "Unvan", required: true },
      { key: "kisiAdi", label: "Referans Verilen Kişi", required: true },
      { key: "kurum", label: "Kurum / Şirket", required: true },
      { key: "iliskiSuresi", label: "Birlikte Çalışma Süresi", required: false },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. İmzalamadan önce kontrol ediniz.",
  },
  {
    type: "Vekaletname",
    title: "Vekaletname (Adi)",
    category: "Hukuki",
    description: "Basit işler için verilen özel vekalet belgesi.",
    fields: [
      { key: "vekaletenVerenAdi", label: "Vekâlet Veren Adı", required: true },
      { key: "vekilAdi", label: "Vekil Adı", required: true },
      { key: "yetki", label: "Vekâletin Kapsamı", required: true },
    ],
    warning: "⚠️ Noter onayı gerektiren işlemler için resmi vekaletname gereklidir.",
  },
  {
    type: "Tutanak",
    title: "Tutanak",
    category: "Hukuki",
    description: "Toplantı, hasar tespit veya teslim-tesellüm tutanağı.",
    fields: [
      { key: "tur", label: "Tutanak Türü", required: true },
      { key: "konu", label: "Konu", required: true },
      { key: "katilimcilar", label: "Katılımcılar / Taraflar", required: true },
      { key: "yer", label: "Yer", required: false },
      { key: "karar", label: "Alınan Kararlar / Sonuç", required: false },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Tüm taraflarca imzalanması gerekir.",
  },
  {
    type: "Taahhütname",
    title: "Taahhütname",
    category: "Hukuki",
    description: "Bir şeyi yapacağına dair verilen yazılı söz belgesi.",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "muhatap", label: "Taahhüt Verilen Kişi / Kurum", required: true },
      { key: "konu", label: "Taahhüdün Konusu", required: true },
      { key: "sure", label: "Taahhüt Süresi", required: false },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.",
  },
  {
    type: "İş Sözleşmesi",
    title: "İş Sözleşmesi",
    category: "İş Hayatı",
    description: "İşçi ve işveren arasında iş akdi belgesi.",
    fields: [
      { key: "calisanAdi", label: "Çalışan Adı Soyadı", required: true },
      { key: "sirketAdi", label: "Şirket Adı", required: true },
      { key: "pozisyon", label: "Pozisyon", required: true },
      { key: "maas", label: "Aylık Brüt Maaş (TL)", required: true },
      { key: "baslangic", label: "İşe Başlama Tarihi", required: false },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. İmzalamadan önce hukuki danışmanlık alın.",
  },
  {
    type: "Kayıt Dondurma Dilekçesi",
    title: "Kayıt Dondurma Dilekçesi",
    category: "Eğitim",
    description: "Üniversite kayıt dondurma talebi.",
    fields: [
      { key: "ogrenciAdi", label: "Öğrenci Adı Soyadı", required: true },
      { key: "okul", label: "Üniversite / Fakülte", required: true },
      { key: "bolum", label: "Bölüm", required: true },
      { key: "donem", label: "Dönem", required: true },
      { key: "gerekce", label: "Gerekçe", required: true },
      { key: "ogrenciNo", label: "Öğrenci Numarası", required: false },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.",
  },
  {
    type: "İhtarname",
    title: "İhtarname",
    category: "Hukuki",
    description: "Karşı tarafa hukuki uyarı belgesi.",
    fields: [
      { key: "ihtarEden", label: "İhtar Eden Adı", required: true },
      { key: "muhatap", label: "Muhatap Adı", required: true },
      { key: "konu", label: "İhtarın Konusu", required: true },
    ],
    warning: "⚠️ Hukuki geçerlilik için noter kanalıyla gönderilmesi tavsiye edilir.",
  },
  {
    type: "Şikayet Dilekçesi",
    title: "Şikayet Dilekçesi",
    category: "Hukuki",
    description: "Resmi kuruma şikayet başvurusu.",
    fields: [
      { key: "sikayetciAdi", label: "Şikayetçi Adı Soyadı", required: true },
      { key: "kurum", label: "Şikayetin Yapılacağı Kurum", required: true },
      { key: "konu", label: "Şikayet Konusu", required: true },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.",
  },
];

export function getTemplateTypes(): string[] {
  return CORE_TEMPLATES.map((t) => t.type);
}

export function getTemplateByType(type: string): DocumentTemplate | undefined {
  return CORE_TEMPLATES.find((t) => t.type === type);
}
