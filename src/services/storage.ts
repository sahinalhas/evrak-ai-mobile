import AsyncStorage from "@react-native-async-storage/async-storage";

export type Document = {
  id: string;
  title: string;
  type: string;
  date: string;
  status: "Tamamlandı" | "Taslak";
  category: "Hukuki" | "İş Hayatı" | "Eğitim" | "Kişisel";
  favorite: boolean;
  content: string; // The generated document content
};

export type UserInfo = {
  ad: string;
  soyad: string;
  tckn: string;
  telefon: string;
  adres: string;
  eposta: string;
};

const EMPTY_USER_INFO: UserInfo = { ad: "", soyad: "", tckn: "", telefon: "", adres: "", eposta: "" };

const KEYS = {
  DOCUMENTS: "evrak_ai_documents",
  CREDITS: "evrak_ai_credits",
  USER_LOGGED_IN: "evrak_ai_user_logged_in",
  USER_INFO: "evrak_ai_user_info",
};

const MOCK_DOCUMENTS: Document[] = [
  { id: "1", title: "Ev Kira Sözleşmesi", type: "Kira Sözleşmesi", date: "12 May 2026", status: "Tamamlandı", category: "Hukuki", favorite: true, content: "# KİRA SÖZLEŞMESİ\n\n**1. TARAFLAR**\n\n**Kiraya Veren:** Ahmet Yılmaz\n**Kiracı:** Mehmet Demir\n\n**2. KİRALANAN TAŞINMAZ**\n\n**Adres:** Atatürk Mah. Cumhuriyet Cad. No: 45 Daire: 8 Çankaya/Ankara\n\n**3. SÜRE VE BEDEL**\n\n**Sözleşme Süresi:** 1 Yıl\n**Başlangıç Tarihi:** 15.05.2026\n**Aylık Kira Bedeli:** 18.000 TL" },
  { id: "2", title: "İstifa Dilekçesi", type: "İstifa", date: "08 May 2026", status: "Tamamlandı", category: "İş Hayatı", favorite: false, content: "# İSTİFA DİLEKÇESİ\n\n**Tarih:** 08.05.2026\n\n**Yönetim Kurulu Başkanlığı'na,**\n\nŞirketiniz bünyesinde 12.04.2024 tarihinden bu yana yürütmekte olduğum Yazılım Geliştirici görevimden, kişisel kariyer planlarım doğrultusunda istifa etmek istediğimi bildiririm.\n\nİstifamın kabulünü ve gerekli işlemlerin başlatılmasını saygılarımla talep ederim.\n\n**Ahmet Yılmaz**\n\nİmza: [..........]" },
  { id: "3", title: "Üniversite Kayıt Dondurma", type: "Dilekçe", date: "02 May 2026", status: "Taslak", category: "Eğitim", favorite: false, content: "# KAYIT DONDURMA TALEBİ\n\n**Tarih:** 02.05.2026\n\n**Mühendislik Fakültesi Dekanlığı'na,**\n\nFakülteniz Bilgisayar Mühendisliği Bölümü 2. Sınıf 202610204 numaralı öğrencisiyim. Sağlık sebeplerim nedeniyle 2026-2027 Eğitim-Öğretim yılı Güz dönemi için kaydımın dondurulmasını talep etmekteyim.\n\nGerekli evraklar ekte sunulmuştur. Bilgilerinize arz ederim.\n\n**Ahmet Yılmaz**" },
  { id: "4", title: "Komşuya İhtarname", type: "İhtarname", date: "27 Nis 2026", status: "Tamamlandı", category: "Hukuki", favorite: true, content: "# İHTARNAME\n\n**İHTAR EDEN:** Ahmet Yılmaz\n**MUHATAP:** Gürültü Yapan Komşu\n\n**KONU:** Apartman gürültü kurallarına riayet edilmesi ihtarıdır.\n\n**AÇIKLAMALAR:**\n\nGece geç saatlerde yüksek sesli müzik ve gürültü nedeniyle apartman huzuru bozulmaktadır. Bu durumun devam etmesi halinde yasal yollara başvurulacağı ihtar olunur.\n\n**İhtar Eden:** Ahmet Yılmaz" },
  { id: "5", title: "Yıllık İzin Talebi", type: "İzin", date: "19 Nis 2026", status: "Tamamlandı", category: "İş Hayatı", favorite: false, content: "# YILLIK İZİN TALEP FORMU\n\n**İzin İsteyen Personel:** Ahmet Yılmaz\n**Unvanı:** Yazılım Geliştirici\n**İzin Türü:** Yıllık İzin\n**İzin Süresi:** 5 İş Günü\n**Başlangıç:** 22.06.2026\n**Bitiş:** 26.06.2026\n\nOnayınıza sunarım.\n\n**Personel İmza:** [..........]" },
];

export const StorageService = {
  async getDocuments(): Promise<Document[]> {
    try {
      const data = await AsyncStorage.getItem(KEYS.DOCUMENTS);
      if (!data) {
        // Seed initial data
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

  async addDocument(doc: Omit<Document, "id" | "date" | "favorite" | "status">): Promise<Document> {
    const documents = await this.getDocuments();
    const newDoc: Document = {
      ...doc,
      id: String(Date.now()),
      date: new Date().toLocaleDateString("tr-TR", {
        day: "numeric",
        month: "short",
        year: "numeric",
      }),
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
        // New users get 1 free trial credit
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
    } catch (e) {
      console.error("Error adding credits:", e);
      return 0;
    }
  },

  async useCredit(): Promise<boolean> {
    try {
      const current = await this.getCredits();
      if (current <= 0) return false;
      await AsyncStorage.setItem(KEYS.CREDITS, String(current - 1));
      return true;
    } catch {
      return false;
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
  }
};
