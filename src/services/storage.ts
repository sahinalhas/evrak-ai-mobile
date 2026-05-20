import AsyncStorage from "@react-native-async-storage/async-storage";

export type Document = {
  id: string;
  title: string;
  type: string;
  date: string;
  status: "Tamamlandı" | "Taslak";
  category: "Hukuki" | "İş Hayatı" | "Eğitim" | "Kişisel" | "Vatandaşlık";
  favorite: boolean;
  content: string;
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
  { id: "1", title: "Şikayet Dilekçesi — Market", type: "Şikayet Dilekçesi", date: "12 May 2026", status: "Tamamlandı", category: "Hukuki", favorite: true, content: "# ŞİKAYET DİLEKÇESİ\n\n**Tarih:** 12.05.2026\n\n**TÜKETİCİ HAKEM HEYETİ BAŞKANLIĞI'NA**\n\n**KONU:** Ayıplı ürün iadesi talebi\n\n---\n\nSayın Yetkililer,\n\n10.05.2026 tarihinde satın aldığım ürünün ayıplı çıkması nedeniyle 6502 sayılı Tüketicinin Korunması Hakkında Kanun kapsamında iade hakkımı kullanmak istiyorum.\n\nGereğini saygılarımla arz ederim.\n\n**Ahmet Yılmaz**\n\nİmza: ………………………………\n**Tarih:** 12.05.2026\n\n---\n\n⚠️ *Bu belge AI tarafından oluşturulmuş taslaktır.*" },
  { id: "2", title: "İstifa Dilekçesi", type: "İstifa Dilekçesi", date: "08 May 2026", status: "Tamamlandı", category: "İş Hayatı", favorite: false, content: "# İSTİFA DİLEKÇESİ\n\n**Tarih:** 08.05.2026\n\n---\n\n**YÖNETİM KURULU BAŞKANLIĞI'NA**\n\n---\n\n**KONU:** İstifa Bildirimi\n\nŞirketiniz bünyesinde 12.04.2024 tarihinden bu yana yürütmekte olduğum Yazılım Geliştirici görevimden, kişisel kariyer planlarım doğrultusunda istifa etmek istediğimi bildiririm.\n\nBilgi ve gereğini saygılarımla arz ederim.\n\n**Ad Soyad:** Ahmet Yılmaz\n**İmza:** ………………………………\n**Tarih:** 08.05.2026\n\n---\n\n⚠️ *Bu belge AI tarafından oluşturulmuş taslaktır.*" },
  { id: "3", title: "Kayıt Dondurma — Güz 2026", type: "Kayıt Dondurma Dilekçesi", date: "02 May 2026", status: "Taslak", category: "Eğitim", favorite: false, content: "# KAYIT DONDURMA TALEBİ\n\n**Tarih:** 02.05.2026\n\n---\n\n**MÜHENDİSLİK FAKÜLTESİ DEKANLIĞI'NA**\n\n---\n\nFakülteniz Bilgisayar Mühendisliği Bölümü 2. Sınıf öğrencisiyim. Sağlık sebeplerim nedeniyle 2026-2027 Eğitim-Öğretim yılı Güz dönemi için kaydımın dondurulmasını talep etmekteyim.\n\nGerekli evraklar ekte sunulmuştur.\n\n**Ad Soyad:** Ahmet Yılmaz\n**İmza:** ………………………………\n**Tarih:** 02.05.2026\n\n---\n\n⚠️ *Bu belge AI tarafından oluşturulmuş taslaktır.*" },
  { id: "4", title: "Bilgi Edinme — Belediye", type: "Bilgi Edinme Başvurusu", date: "27 Nis 2026", status: "Tamamlandı", category: "Vatandaşlık", favorite: true, content: "# BİLGİ EDİNME BAŞVURUSU\n*(4982 Sayılı Bilgi Edinme Hakkı Kanunu Kapsamında)*\n\n**Tarih:** 27.04.2026\n\n---\n\n**ÇANKAYA BELEDİYESİ BAŞKANLIĞI'NA**\n\n---\n\n**KONU:** İmar planı değişikliğine ilişkin bilgi talebi\n\n4982 sayılı Kanun çerçevesinde, mahallemizde yapılan imar planı değişikliğine ait resmi karar ve gerekçelerini talep ediyorum.\n\nBilgi ve belgelerin tarafıma iletilmesini saygılarımla arz ederim.\n\n**Ad Soyad:** Ahmet Yılmaz\n**İmza:** ………………………………\n\n---\n\n⚠️ *Bu belge AI tarafından oluşturulmuş taslaktır.*" },
  { id: "5", title: "Yıllık İzin Talebi", type: "İzin Talebi", date: "19 Nis 2026", status: "Tamamlandı", category: "İş Hayatı", favorite: false, content: "# YILLIK İZİN TALEP FORMU\n\n**Tarih:** 19.04.2026\n\n---\n\n**İNSAN KAYNAKLARI MÜDÜRLÜĞÜ'NE**\n\n---\n\n| Alan | Bilgi |\n|---|---|\n| Ad Soyad | **Ahmet Yılmaz** |\n| Unvan | Yazılım Geliştirici |\n| İzin Türü | **Yıllık İzin** |\n| Başlangıç | 22.06.2026 |\n| Bitiş | 26.06.2026 |\n| Toplam Süre | 5 iş günü |\n\nOnayınıza sunarım.\n\n**İmza:** ………………………………\n**Tarih:** 19.04.2026\n\n---\n\n⚠️ *Bu belge AI tarafından oluşturulmuş taslaktır.*" },
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
