import AsyncStorage from "@react-native-async-storage/async-storage";

export type SavedDocument = {
  id: string;
  title: string;
  type: string;
  date: string;
  createdAt: string;
  status: "Tamamlandı" | "Taslak";
  category: "Hukuki" | "İş Hayatı" | "Eğitim" | "Kişisel";
  favorite: boolean;
  content: string;
  preview?: string;
};

export type Document = SavedDocument;

export type UserInfo = {
  ad: string;
  soyad: string;
  tckn: string;
  telefon: string;
  adres: string;
  eposta: string;
};

const EMPTY_USER_INFO: UserInfo = {
  ad: "", soyad: "", tckn: "", telefon: "", adres: "", eposta: "",
};

const KEYS = {
  DOCUMENTS: "evrak_ai_documents_v2",
  CREDITS: "evrak_ai_credits",
  USER_LOGGED_IN: "evrak_ai_user_logged_in",
  USER_INFO: "evrak_ai_user_info",
};

function daysAgo(n: number) {
  return new Date(Date.now() - n * 86400000).toISOString();
}
function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString("tr-TR", { day: "numeric", month: "short", year: "numeric" });
}

const MOCK_DOCUMENTS: Document[] = [
  {
    id: "m1",
    title: "İstifa Dilekçesi",
    type: "İstifa",
    preview: "İstifa dilekçesi",
    date: fmtDate(daysAgo(3)),
    createdAt: daysAgo(3),
    status: "Tamamlandı",
    category: "İş Hayatı",
    favorite: false,
    content: "# İSTİFA DİLEKÇESİ\n\n**Tarih:** " + fmtDate(daysAgo(3)) + "\n\n**Yönetim Kurulu Başkanlığı'na,**\n\nŞirketiniz bünyesinde 12.04.2024 tarihinden bu yana yürütmekte olduğum Yazılım Geliştirici görevimden, kişisel kariyer planlarım doğrultusunda istifa etmek istediğimi bildiririm.\n\nİstifamın kabulünü ve gerekli işlemlerin başlatılmasını saygılarımla talep ederim.\n\n**Gereğini arz ederim.**\n\nAhmet Yılmaz\n\nİmza: [............]",
  },
  {
    id: "m2",
    title: "Kayıt Dondurma",
    type: "Dilekçe",
    preview: "Kayıt dondurma dilekçesi",
    date: fmtDate(daysAgo(10)),
    createdAt: daysAgo(10),
    status: "Tamamlandı",
    category: "Eğitim",
    favorite: false,
    content: "# KAYIT DONDURMA TALEBİ\n\n**Tarih:** " + fmtDate(daysAgo(10)) + "\n\n**Mühendislik Fakültesi Dekanlığı'na,**\n\nFakülteniz Bilgisayar Mühendisliği Bölümü 2. Sınıf 202610204 numaralı öğrencisiyim. Sağlık sebeplerim nedeniyle 2026-2027 Eğitim-Öğretim yılı Güz dönemi için kaydımın dondurulmasını talep etmekteyim.\n\nGerekli evraklar ekte sunulmuştur. Bilgilerinize arz ederim.\n\nAhmet Yılmaz",
  },
  {
    id: "m3",
    title: "Yıllık İzin Talebi",
    type: "İzin",
    preview: "Yıllık izin talebi",
    date: fmtDate(daysAgo(18)),
    createdAt: daysAgo(18),
    status: "Tamamlandı",
    category: "İş Hayatı",
    favorite: false,
    content: "# YILLIK İZİN TALEP FORMU\n\n**İzin İsteyen:** Ahmet Yılmaz\n**Unvanı:** Yazılım Geliştirici\n**İzin Türü:** Yıllık İzin\n**Süre:** 5 İş Günü\n**Başlangıç:** 22.06.2026 — **Bitiş:** 26.06.2026\n\nOnayınıza sunarım.\n\nPersonel İmza: [............]",
  },
];

export const StorageService = {
  async getDocuments(): Promise<Document[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.DOCUMENTS);
      if (!data) {
        await AsyncStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(MOCK_DOCUMENTS));
        return MOCK_DOCUMENTS;
      }
      return JSON.parse(data);
    } catch {
      return MOCK_DOCUMENTS;
    }
  },

  async saveDocuments(documents: Document[]): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.DOCUMENTS, JSON.stringify(documents));
    } catch (e) {
      console.error("Error saving documents:", e);
    }
  },

  async saveDocument(params: { content: string; preview?: string }): Promise<string> {
    try {
      const documents = await this.getDocuments();
      const id = String(Date.now());
      const iso = new Date().toISOString();
      const newDoc: Document = {
        id,
        title: (params.preview ?? "Belge").slice(0, 60),
        type: "Belge",
        preview: params.preview,
        date: fmtDate(iso),
        createdAt: iso,
        status: "Tamamlandı",
        category: "Kişisel",
        favorite: false,
        content: params.content,
      };
      documents.unshift(newDoc);
      await this.saveDocuments(documents);
      return id;
    } catch (e) {
      console.error("Error saving document:", e);
      return "";
    }
  },

  async deleteDocument(id: string): Promise<void> {
    try {
      const documents = await this.getDocuments();
      await this.saveDocuments(documents.filter(d => d.id !== id));
    } catch (e) {
      console.error("Error deleting document:", e);
    }
  },

  async addDocument(doc: Omit<Document, "id" | "date" | "createdAt" | "favorite" | "status">): Promise<Document> {
    const documents = await this.getDocuments();
    const iso = new Date().toISOString();
    const newDoc: Document = {
      ...doc,
      id: String(Date.now()),
      date: fmtDate(iso),
      createdAt: iso,
      favorite: false,
      status: "Tamamlandı",
    };
    documents.unshift(newDoc);
    await this.saveDocuments(documents);
    return newDoc;
  },

  async getCredits(): Promise<number> {
    try {
      const val = await AsyncStorage.getItem(KEYS.CREDITS);
      if (val === null) {
        await AsyncStorage.setItem(KEYS.CREDITS, "1");
        return 1;
      }
      return parseInt(val, 10);
    } catch {
      return 0;
    }
  },

  async addCredits(amount: number): Promise<number> {
    try {
      const current = await this.getCredits();
      const next = current + amount;
      await AsyncStorage.setItem(KEYS.CREDITS, String(next));
      return next;
    } catch {
      return 0;
    }
  },

  async useCredit(): Promise<number> {
    try {
      const current = await this.getCredits();
      if (current <= 0) return 0;
      const next = current - 1;
      await AsyncStorage.setItem(KEYS.CREDITS, String(next));
      return next;
    } catch {
      return 0;
    }
  },

  async getUserInfo(): Promise<UserInfo> {
    try {
      const data = await AsyncStorage.getItem(KEYS.USER_INFO);
      if (!data) return { ...EMPTY_USER_INFO };
      return { ...EMPTY_USER_INFO, ...JSON.parse(data) };
    } catch {
      return { ...EMPTY_USER_INFO };
    }
  },

  async saveUserInfo(info: UserInfo): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_INFO, JSON.stringify(info));
    } catch (e) {
      console.error("Error saving user info:", e);
    }
  },

  async getUserLoggedIn(): Promise<boolean> {
    try {
      const val = await AsyncStorage.getItem(KEYS.USER_LOGGED_IN);
      return val === "true";
    } catch {
      return false;
    }
  },

  async setUserLoggedIn(status: boolean): Promise<void> {
    try {
      await AsyncStorage.setItem(KEYS.USER_LOGGED_IN, status ? "true" : "false");
    } catch (e) {
      console.error("Error saving login status:", e);
    }
  },
};
