import { Platform } from "react-native";
import * as Print from "expo-print";
import * as Sharing from "expo-sharing";

function mdToHtml(md: string): string {
  return md
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/^---$/gm, "<hr>")
    .replace(/\n{2,}/g, "</p><p>")
    .replace(/\n/g, "<br>")
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    .replace(/<p>(<h[123]>|<hr>)/g, "$1")
    .replace(/(<\/h[123]>|<hr>)<\/p>/g, "$1");
}

const buildHtml = (content: string, title: string) => `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 2.5cm 2.8cm; }
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: "Times New Roman", Times, serif;
      font-size: 12pt;
      line-height: 1.7;
      color: #1a1a1a;
      background: #fff;
    }
    p { margin-bottom: 0.6em; text-align: justify; }
    h1 {
      font-size: 13pt;
      font-weight: bold;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1.5px;
      margin: 0 0 20px;
      padding-bottom: 10px;
      border-bottom: 1px solid #333;
    }
    h2 {
      font-size: 11pt;
      font-weight: bold;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      margin: 18px 0 6px;
      color: #333;
    }
    h3 { font-size: 11pt; font-weight: bold; margin: 12px 0 4px; }
    hr { border: none; border-top: 1px solid #bbb; margin: 16px 0; }
    strong { font-weight: bold; }
    em { font-style: italic; }
    .footer {
      margin-top: 40px;
      font-size: 9pt;
      color: #666;
      border-top: 1px solid #ddd;
      padding-top: 8px;
      text-align: center;
    }
    @media print {
      body { -webkit-print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  ${mdToHtml(content)}
  <div class="footer">Bu belge EvrakAI tarafından oluşturulmuş taslaktır. Kuruma teslim etmeden önce kontrol ediniz.</div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;

export async function printDocument(content: string, title = "EvrakAI Belgesi"): Promise<void> {
  const html = buildHtml(content, title);

  if (Platform.OS === "web") {
    if (typeof window === "undefined") return;
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) {
      alert("Yazdırma penceresi açılamadı. Lütfen tarayıcınızın açılır pencere engelleyicisini devre dışı bırakın.");
      return;
    }
    win.document.write(html);
    win.document.close();
  } else {
    const { uri } = await Print.printToFileAsync({ html, base64: false });
    const canShare = await Sharing.isAvailableAsync();
    if (canShare) {
      await Sharing.shareAsync(uri, {
        mimeType: "application/pdf",
        dialogTitle: title,
        UTI: "com.adobe.pdf",
      });
    } else {
      await Print.printAsync({ html });
    }
  }
}
