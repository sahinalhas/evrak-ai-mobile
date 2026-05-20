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
      { key: "konu", label: "Konu", required: true },
      { key: "aciklama", label: "Açıklama", required: true },
    ],
    warning: "Bu belge yapay zeka tarafından oluşturulmuş bir taslaktır.",
  },
  {
    type: "Kira Sözleşmesi",
    title: "Kira Sözleşmesi",
    category: "Hukuki",
    description: "Konut ve iş yeri kira sözleşmesi taslağı.",
    fields: [
      { key: "kiraciAdi", label: "Kiracı Adı", required: true },
      { key: "kirayaVerenAdi", label: "Kiraya Veren Adı", required: true },
      { key: "adres", label: "Adres", required: true },
    ],
    warning: "Bu belge yapay zeka tarafından oluşturulmuş bir taslaktır.",
  },
  {
    type: "İzin Talebi",
    title: "İzin Talebi",
    category: "İş Hayatı",
    description: "İş veya okul için izin isteme formu.",
    fields: [
      { key: "adSoyad", label: "Ad Soyad", required: true },
      { key: "baslangic", label: "Başlangıç Tarihi", required: true },
      { key: "bitis", label: "Bitiş Tarihi", required: true },
    ],
    warning: "Bu belge yapay zeka tarafından oluşturulmuş bir taslaktır.",
  },
];

export function getTemplateTypes() {
  return CORE_TEMPLATES.map((template) => template.type);
}