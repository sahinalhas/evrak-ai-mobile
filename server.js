const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

const SYSTEM_PROMPT = `Sen "EvrakAI" adında, Türkiye'de vatandaşların resmi kurumlara vereceği özel evrak ve belgeleri hazırlayan deneyimli bir belge asistanısın.

YAPABİLECEKLERİN (Desteklenen Belge Türleri — Özel Evrak):
- Genel Dilekçe (talep, bilgi isteme, başvuru)
- İzin Talebi (okul, iş, mazeret izni)
- İstifa Dilekçesi
- İş Başvuru Yazısı (ön yazı / cover letter)
- Kayıt Dondurma Dilekçesi
- Şikayet Dilekçesi
- Taahhütname
- Referans Mektubu

YAPAMAYACAKLARIN (Kullanıcıyı doğru yönlendir):
- Kira sözleşmesi, iş sözleşmesi, borç senedi gibi taraflar arası sözleşmeler → "Bu belgeler iki taraf arasında düzenlenir, ilerleyen sürümde eklenecek."
- Vekaletname, ihtarname gibi hukuki bildirim belgeleri → "Bu belgeler ilerleyen sürümde eklenecek."
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
{
  "docType": string | null,
  "status": "need_type" | "need_info" | "ready",
  "assistantMessage": string,
  "document": string | null
}`;

app.get("/api/health", (req, res) => {
  const hasKey = !!process.env.GEMINI_API_KEY;
  res.json({ ok: true, hasKey });
});

app.post("/api/chat", async (req, res) => {
  const { messages, userInfo } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      docType: null,
      status: "need_type",
      assistantMessage: "⚠️ Sunucu AI motoru henüz yapılandırılmamış (GEMINI_API_KEY eksik).",
      document: null,
    });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Geçersiz istek formatı." });
  }

  // Build a user-info block to inject into the prompt if any fields are filled
  let userInfoBlock = "";
  if (userInfo && typeof userInfo === "object") {
    const lines = [];
    if (userInfo.ad && userInfo.soyad) lines.push(`- Ad Soyad: ${userInfo.ad} ${userInfo.soyad}`);
    else if (userInfo.ad) lines.push(`- Ad: ${userInfo.ad}`);
    else if (userInfo.soyad) lines.push(`- Soyad: ${userInfo.soyad}`);
    if (userInfo.tckn) lines.push(`- T.C. Kimlik No: ${userInfo.tckn}`);
    if (userInfo.telefon) lines.push(`- Telefon: ${userInfo.telefon}`);
    if (userInfo.adres) lines.push(`- Adres: ${userInfo.adres}`);
    if (userInfo.eposta) lines.push(`- E-posta: ${userInfo.eposta}`);
    if (lines.length > 0) {
      userInfoBlock = `\n\nKULLANICININ KAYITLI BİLGİLERİ (bu bilgileri belgede kullan, tekrar sorma):\n${lines.join("\n")}`;
    }
  }

  const effectivePrompt = SYSTEM_PROMPT + userInfoBlock;

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [
                { text: effectivePrompt },
                ...messages.map((m) => ({
                  text: `${m.role === "user" ? "Kullanıcı" : "Asistan"}: ${m.content}`,
                })),
              ],
            },
          ],
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.2,
            maxOutputTokens: 4096,
          },
        }),
      }
    );

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Gemini API error:", response.status, errBody);
      return res.status(502).json({
        docType: null,
        status: "need_type",
        assistantMessage: `Gemini API hatası (${response.status}). Lütfen tekrar deneyin.`,
        document: null,
      });
    }

    const data = await response.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!rawText) {
      throw new Error("Gemini'den geçersiz yanıt alındı.");
    }

    let parsed;
    try {
      parsed = JSON.parse(rawText);
    } catch {
      parsed = {
        docType: null,
        status: "need_type",
        assistantMessage: rawText.slice(0, 500),
        document: null,
      };
    }

    res.json(parsed);
  } catch (err) {
    console.error("Server AI error:", err);
    res.status(500).json({
      docType: null,
      status: "need_type",
      assistantMessage: `Sunucu hatası: ${err.message || "Bilinmeyen hata"}. Lütfen tekrar deneyin.`,
      document: null,
    });
  }
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`EvrakAI API sunucusu port ${PORT}'de çalışıyor`);
  console.log(`Gemini API Key: ${process.env.GEMINI_API_KEY ? "✓ Yapılandırıldı" : "✗ Eksik"}`);
});
