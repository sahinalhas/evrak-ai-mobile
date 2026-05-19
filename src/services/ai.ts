import { StorageService } from "./storage";

export type ChatMsg = { role: "user" | "assistant"; content: string };

export type AiResponse = {
  docType: string | null;
  status: "need_type" | "need_info" | "ready";
  assistantMessage: string;
  document: string | null;
};

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
SADECE geçerli bir JSON nesnesi döndür. Başka hiçbir metin, açıklama, kod bloğu işareti (\`\`\`) kullanma.
Şema:
{
  "docType": string | null,
  "status": "need_type" | "need_info" | "ready",
  "assistantMessage": string,
  "document": string | null
}`;

// Beautiful mock document content generator based on chat messages
function generateMockResponse(messages: ChatMsg[]): AiResponse {
  const lastUserMessage = [...messages].reverse().find(m => m.role === "user")?.content.toLowerCase() || "";
  const conversationHistory = messages.map(m => m.content.toLowerCase()).join(" ");

  // 1. Identify docType
  let docType: string | null = null;
  let category: "Hukuki" | "İş Hayatı" | "Eğitim" | "Kişisel" = "Hukuki";

  if (conversationHistory.includes("kira")) {
    docType = "Kira Sözleşmesi";
    category = "Hukuki";
  } else if (conversationHistory.includes("istifa")) {
    docType = "İstifa Dilekçesi";
    category = "İş Hayatı";
  } else if (conversationHistory.includes("ihtar") || conversationHistory.includes("ihtarname")) {
    docType = "İhtarname";
    category = "Hukuki";
  } else if (conversationHistory.includes("izin")) {
    docType = "İzin Talebi";
    category = "İş Hayatı";
  } else if (conversationHistory.includes("kayıt dondurma") || conversationHistory.includes("dondurma") || conversationHistory.includes("üniversite")) {
    docType = "Kayıt Dondurma Dilekçesi";
    category = "Eğitim";
  } else if (conversationHistory.includes("dilekçe")) {
    docType = "Dilekçe";
    category = "Kişisel";
  }

  if (!docType) {
    return {
      docType: null,
      status: "need_type",
      assistantMessage: "Hangi türde bir resmi belge oluşturmak istersiniz? (Örn: Dilekçe, Kira Sözleşmesi, İhtarname, İstifa Dilekçesi vb.)",
      document: null
    };
  }

  // 2. Gather information requirements and check what is missing
  if (docType === "Kira Sözleşmesi") {
    const hasKiraci = conversationHistory.includes("kiracı") || conversationHistory.includes("mehmet") || conversationHistory.includes("ahmet");
    const hasBedel = conversationHistory.includes("tl") || conversationHistory.includes("fiyat") || conversationHistory.includes("bedel") || /\d+/.test(conversationHistory);
    const hasAdres = conversationHistory.includes("sokak") || conversationHistory.includes("mah") || conversationHistory.includes("cad") || conversationHistory.includes("adres");

    if (!hasKiraci || !hasBedel || !hasAdres) {
      const missing = [];
      if (!hasKiraci) missing.push("1. Kiracı ve Kiraya Veren tam isimleri");
      if (!hasAdres) missing.push("2. Kiralanacak mülkün açık adresi");
      if (!hasBedel) missing.push("3. Aylık kira bedeli ve ödeme tarihi");

      return {
        docType,
        status: "need_info",
        assistantMessage: `Kira Sözleşmesi hazırlamak için şu bilgilere ihtiyacım var:\n\n${missing.join("\n")}\n\nLütfen bu bilgileri iletiniz.`,
        document: null
      };
    }

    // Extract some names and rent
    const rentAmount = conversationHistory.match(/(\d[\d\s.,]*)\s*(?:tl|lira|bin)/i)?.[0]?.toUpperCase() || "15.000 TL";
    
    return {
      docType,
      status: "ready",
      assistantMessage: "Harika! Kira sözleşmenizi resmi mevzuata uygun olarak başarıyla hazırladım. Aşağıdan önizleyebilirsiniz.",
      document: `# KONUT KİRA SÖZLEŞMESİ

## 1. TARAFLAR
**KİRAYA VEREN:** [KİRAYA VEREN ADI SOYADI] (T.C. Kimlik No: [..........])
**KİRACI:** [KİRACI ADI SOYADI] (T.C. Kimlik No: [..........])

## 2. KİRALANAN TAŞINMAZ BİLGİLERİ
**Adres:** [BELİRTİLEN AÇIK ADRES]
**Cinsi:** Mesken (Konut)

## 3. SÜRE VE BEDEL
**Sözleşme Süresi:** 1 (Bir) Yıl
**Aylık Kira Bedeli:** ${rentAmount}
**Ödeme Günü:** Her ayın 5. günü akşamına kadar.
**Kira Başlangıcı:** ${new Date().toLocaleDateString("tr-TR")}

## 4. GENEL ŞARTLAR
1. Kiracı, kiralananı özenle kullanmak zorundadır. Taşınmaz mesken dışında bir amaçla kullanılamaz.
2. Kiralanan alt kiraya verilemez, başkasına devredilemez.
3. Sözleşme bitiminde kira artış oranı, yasal sınırlar (TÜFE 12 aylık ortalaması) dahilinde belirlenecektir.

## 5. İMZA VE ONAY
İşbu sözleşme 5 (beş) maddeden ibaret olup taraflarca iki nüsha olarak imza altına alınmıştır.

**Kiraya Veren**      **Kiracı**
[..........]          [..........]

**Tarih:** ${new Date().toLocaleDateString("tr-TR")}`
    };
  }

  if (docType === "İstifa Dilekçesi") {
    const hasSirket = conversationHistory.includes("şirket") || conversationHistory.includes("ltd") || conversationHistory.includes("a.ş") || conversationHistory.includes("teknoloji") || conversationHistory.includes("ticaret");
    const hasPozisyon = conversationHistory.includes("pozisyon") || conversationHistory.includes("görev") || conversationHistory.includes("mühendis") || conversationHistory.includes("geliştirici") || conversationHistory.includes("yönetici");

    if (!hasSirket || !hasPozisyon) {
      const missing = [];
      if (!hasSirket) missing.push("1. Çalıştığınız şirketin resmi adı");
      if (!hasPozisyon) missing.push("2. Şirketteki tam pozisyonunuz veya göreviniz");

      return {
        docType,
        status: "need_info",
        assistantMessage: `İstifa dilekçenizi hazırlamak için şu detaylara ihtiyacım var:\n\n${missing.join("\n")}\n\nBu bilgileri paylaştığınızda hemen taslağı hazırlayacağım.`,
        document: null
      };
    }

    const company = lastUserMessage.toUpperCase().replace("İSTİFA", "").trim() || "[ŞİRKET ADI]";
    
    return {
      docType,
      status: "ready",
      assistantMessage: "İstifa dilekçeniz resmi formatta hazırlanmıştır. Aşağıdaki alandan kontrol edip indirebilirsiniz.",
      document: `# İSTİFA DİLEKÇESİ

**Tarih:** ${new Date().toLocaleDateString("tr-TR")}

**${company} YÖNETİM KURULU BAŞKANLIĞI'NA,**
*(İnsan Kaynakları Departmanı Dikkatine)*

Şirketiniz bünyesinde [GÖREVİNİZ] pozisyonunda görev yapmaktayım. 

Gördüğüm lüzum üzerine, [..........] tarihi itibarıyla iş sözleşmemi kendi isteğim doğrultusunda tek taraflı olarak feshettiğimi ve görevimden istifa ettiğimi bildiririm.

Çalıştığım süre boyunca şahsıma gösterilen ilgi, destek ve kazandırılan tecrübeler için teşekkür eder, gerekli istifa işlemlerimin başlatılmasını ve yasal haklarımın (varsa bakiye izin ücreti vb.) ödenmesini saygılarımla talep ederim.

**Adı Soyadı:** Ahmet Yılmaz
**T.C. Kimlik No:** [..........]
**Adres:** [..........]

**İmza:**
[..........]`
    };
  }

  // Fallback for general Dilekçe or other types
  const hasKonu = conversationHistory.includes("konu") || conversationHistory.includes("hakkında") || conversationHistory.includes("talep") || lastUserMessage.length > 15;
  if (!hasKonu) {
    return {
      docType,
      status: "need_info",
      assistantMessage: `${docType} için evrakın konusunu, hangi kuruma/makama verileceğini ve talebinizi kısaca yazar mısınız?`,
      document: null
    };
  }

  return {
    docType,
    status: "ready",
    assistantMessage: `${docType} talebinize göre resmi formata uygun olarak başarıyla oluşturulmuştur.`,
    document: `# ${docType.toUpperCase()}

**Tarih:** ${new Date().toLocaleDateString("tr-TR")}

**[MUHATAP MAKAM / KURUM ADI]'NA**
*[Şehir]*

**KONU:** [DİLEKÇE VEYA EVRAK KONUSU]

**AÇIKLAMALAR:**

Kullanıcı tarafından iletilen talepler doğrultusunda hazırlanan bu belge resmi yazışma formatına uygundur. Lütfen boşlukları kendi kişisel bilgilerinizle doldurunuz:

1. ${lastUserMessage.charAt(0).toUpperCase() + lastUserMessage.slice(1)} konusuyla ilgili talebimin değerlendirilmesini,
2. Gerekli incelemelerin yapılarak tarafıma ivedilikle bilgi verilmesini saygılarımla arz ve talep ederim.

**Adres:**
[..........]

**GSM:** [..........]

**Adı Soyadı:** Ahmet Yılmaz
**T.C. Kimlik No:** [..........]

**İmza:**
[..........]`
  };
}

export const AIService = {
  async sendMessage(messages: ChatMsg[]): Promise<AiResponse> {
    const { lovableKey, geminiKey, provider } = await StorageService.getApiKeys();

    if (provider === "mock") {
      // Simulate network lag
      await new Promise(resolve => setTimeout(resolve, 1500));
      return generateMockResponse(messages);
    }

    try {
      if (provider === "gemini") {
        if (!geminiKey) throw new Error("Gemini API Key eksik. Lütfen Profil sayfasından ekleyin.");
        
        // Let's call Gemini directly via REST fetch to keep it lightweight & self-contained without bulky SDKs!
        // We use the modern gemini-1.5-flash or gemini-2.5-flash for super speed
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${geminiKey}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              contents: [
                {
                  role: "user",
                  parts: [
                    { text: SYSTEM_PROMPT },
                    ...messages.map(m => ({
                      text: `${m.role === "user" ? "Kullanıcı" : "Asistan"}: ${m.content}`
                    }))
                  ]
                }
              ],
              generationConfig: {
                responseMimeType: "application/json",
                temperature: 0.2,
              }
            })
          }
        );

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `API Hata kodu: ${response.status}`);
        }

        const data = await response.json();
        const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
        if (!rawText) throw new Error("Geçersiz API yanıtı.");

        return JSON.parse(rawText) as AiResponse;
      } else {
        // Lovable provider
        if (!lovableKey) throw new Error("Lovable API Key eksik. Lütfen Profil sayfasından ekleyin.");

        const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Lovable-API-Key": lovableKey,
            "X-Lovable-AIG-SDK": "vercel-ai-sdk",
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            messages: [
              { role: "system", content: SYSTEM_PROMPT },
              ...messages.map(m => ({ role: m.role, content: m.content }))
            ],
            response_format: { type: "json_object" }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(errText || `API Hata kodu: ${response.status}`);
        }

        const data = await response.json();
        const rawContent = data.choices?.[0]?.message?.content;
        if (!rawContent) throw new Error("Yapay zekadan geçersiz yanıt alındı.");

        return JSON.parse(rawContent) as AiResponse;
      }
    } catch (e) {
      console.error("AI API Error:", e);
      // Fallback with user warning toast
      const mockRes = generateMockResponse(messages);
      mockRes.assistantMessage = `⚠️ [Canlı API Bağlantı Hatası: ${e instanceof Error ? e.message : "Bilinmeyen hata"}]\n\nCihazınızda çevrimdışı yedek motor devreye girdi:\n\n${mockRes.assistantMessage}`;
      return mockRes;
    }
  }
};
