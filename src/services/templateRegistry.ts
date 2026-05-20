export type TemplateField = {
  key: string;
  label: string;
  required: boolean;
};

export type DocumentTemplate = {
  type: string;
  title: string;
  category: "Hukuki" | "İş Hayatı" | "Eğitim" | "Kişisel" | "Vatandaşlık";
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
    type: "Taahhütname",
    title: "Taahhütname",
    category: "Hukuki",
    description: "Bir şeyi yapacağına dair yazılı söz belgesi. Yalnızca davranışsal taahhütler için (para/borç taahhütleri kapsam dışıdır).",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "muhatap", label: "Taahhüt Verilen Kişi / Kurum", required: true },
      { key: "konu", label: "Taahhüdün Konusu", required: true },
      { key: "sure", label: "Taahhüt Süresi", required: false },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.",
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
  {
    type: "Nakil Talebi",
    title: "Nakil Talebi",
    category: "Eğitim",
    description: "Okul veya üniversite bölüm nakli için dilekçe.",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "mevcutOkul", label: "Mevcut Okul / Kurum", required: true },
      { key: "hedefOkul", label: "Nakil İstenen Okul / Kurum", required: true },
      { key: "sinif", label: "Sınıf / Düzey", required: true },
      { key: "gerekce", label: "Nakil Gerekçesi", required: true },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.",
  },
  {
    type: "Not İtirazı",
    title: "Not / Sınav İtirazı",
    category: "Eğitim",
    description: "Sınav notu veya sonucuna itiraz dilekçesi.",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "okul", label: "Okul / Üniversite", required: true },
      { key: "ders", label: "İtiraz Edilen Ders / Sınav", required: true },
      { key: "alinanNot", label: "Alınan Not / Puan", required: true },
      { key: "gerekce", label: "İtiraz Gerekçesi", required: true },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.",
  },
  {
    type: "Öğrenci Belgesi Talebi",
    title: "Öğrenci Belgesi / Transkript Talebi",
    category: "Eğitim",
    description: "Öğrenci belgesi, transkript veya mezuniyet belgesi talebi.",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "okul", label: "Okul / Üniversite", required: true },
      { key: "belgeTuru", label: "Belge Türü (Öğrenci Belgesi / Transkript vb.)", required: true },
      { key: "amac", label: "Kullanım Amacı", required: true },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.",
  },
  {
    type: "Devamsızlık Affı",
    title: "Devamsızlık Affı / Mazeret Bildirimi",
    category: "Eğitim",
    description: "Okul veya üniversiteye devamsızlık affı ve mazeret bildirimi.",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "okul", label: "Okul / Üniversite", required: true },
      { key: "sure", label: "Devamsızlık Süresi (gün / saat)", required: true },
      { key: "gerekce", label: "Devamsızlık Gerekçesi", required: true },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Mazeret belgesiyle birlikte teslim ediniz.",
  },
  {
    type: "Bilgi Edinme Başvurusu",
    title: "Bilgi Edinme Başvurusu",
    category: "Vatandaşlık",
    description: "4982 sayılı Bilgi Edinme Hakkı Kanunu kapsamında kamu kurumundan bilgi talebi.",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "kurum", label: "Başvurulan Kurum", required: true },
      { key: "konu", label: "Talep Konusu", required: true },
      { key: "aciklama", label: "Ayrıntılı Açıklama", required: true },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Kurum 15 iş günü içinde yanıt vermekle yükümlüdür.",
  },
  {
    type: "Ücret/Yan Hak Talebi",
    title: "Ücret / Yan Hak Talebi",
    category: "İş Hayatı",
    description: "İşverene maaş zammı, prim veya yan hak talebi.",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "sirket", label: "Şirket / Kurum Adı", required: true },
      { key: "talep", label: "Talep Konusu (zam, prim, yemek vb.)", required: true },
      { key: "gerekce", label: "Talep Gerekçesi", required: true },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Kuruma vermeden önce kontrol ediniz.",
  },
  {
    type: "SGK Belge Talebi",
    title: "SGK Belge / Hizmet Döküm Talebi",
    category: "İş Hayatı",
    description: "SGK'dan hizmet dökümü, sigortalılık belgesi veya hizmet birleştirme talebi.",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "tcNo", label: "T.C. Kimlik No", required: true },
      { key: "belgeTuru", label: "Talep Edilen Belge Türü", required: true },
      { key: "amac", label: "Kullanım Amacı", required: true },
    ],
    warning: "Bu belge AI tarafından oluşturulmuş taslaktır. Pek çok SGK belgesi e-Devlet üzerinden de alınabilir.",
  },
];

export function getTemplateTypes(): string[] {
  return CORE_TEMPLATES.map((t) => t.type);
}

export function getTemplateByType(type: string): DocumentTemplate | undefined {
  return CORE_TEMPLATES.find((t) => t.type === type);
}
