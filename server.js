const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

const PORT = 3001;

const SYSTEM_PROMPT = `Sen "EvrakAI" adında, Türkiye hukuk ve resmi yazışma kurallarına hâkim, deneyimli bir belge asistanısın.

GÖREVİN:
1. Kullanıcının mesajlarını analiz et ve hangi resmi belgeyi istediğini tespit et.
2. O belge türü için Türkiye'de geçerli formatta GEREKLİ TÜM BİLGİLERİ kafanda listele.
3. Kullanıcının verdiği mesajlardan hangi bilgilerin VERİLDİĞİNİ ve hangilerinin EKSİK olduğunu çıkar.
4. SADECE eksik olan bilgileri kullanıcıdan iste — verilmiş bilgileri TEKRAR SORMA.
5. Tüm gerekli bilgiler tamamlandığında belgeyi profesyonel, resmi Türkçe ile tam formatta hazırla.

KRİTİK KURALLAR:
- Kullanıcı tek mesajda tüm bilgileri vermişse hemen belgeyi hazırla, soru sorma.
- Eksik bilgi varsa hepsini TEK mesajda numaralı/madde madde sor.
- Belge hazırlanırken Markdown kullan: # başlık, ## alt başlık, **kalın**.
- Uydurma bilgi ekleme; eksik alanlar için [..........] bırakabilirsin.

ÇIKTI FORMATI:
SADECE geçerli bir JSON nesnesi döndür. Başka hiçbir metin kullanma.
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
  const { messages } = req.body;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    return res.status(503).json({
      docType: null,
      status: "need_type",
      assistantMessage: "⚠️ Sunucu AI motoru henüz yapılandırılmamış (GEMINI_API_KEY eksik). Profil ekranından 'Çevrimdışı Motor' seçeneğini kullanabilirsiniz.",
      document: null,
    });
  }

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ error: "Geçersiz istek formatı." });
  }

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
                { text: SYSTEM_PROMPT },
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
