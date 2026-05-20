import { Platform } from "react-native";

function markdownToHtml(md: string): string {
  return md
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .split("\n\n")
    .map((block) => {
      if (/^#{1}\s/.test(block)) {
        return `<h1>${block.replace(/^#\s+/, "")}</h1>`;
      }
      if (/^#{2}\s/.test(block)) {
        return `<h2>${block.replace(/^##\s+/, "")}</h2>`;
      }
      if (/^#{3}\s/.test(block)) {
        return `<h3>${block.replace(/^###\s+/, "")}</h3>`;
      }
      if (/^---$/.test(block.trim())) {
        return "<hr/>";
      }
      if (/^\|/.test(block)) {
        const rows = block
          .split("\n")
          .filter((r) => r.trim() && !r.match(/^\|[-:| ]+\|$/));
        const tableRows = rows
          .map((r) => {
            const cells = r
              .split("|")
              .filter((_, i, arr) => i > 0 && i < arr.length - 1)
              .map((c) => `<td>${applyInline(c.trim())}</td>`)
              .join("");
            return `<tr>${cells}</tr>`;
          })
          .join("");
        return `<table>${tableRows}</table>`;
      }
      if (/^[-*]\s/.test(block)) {
        const items = block
          .split("\n")
          .filter(Boolean)
          .map((l) => `<li>${applyInline(l.replace(/^[-*]\s+/, ""))}</li>`)
          .join("");
        return `<ul>${items}</ul>`;
      }
      if (/^\d+\.\s/.test(block)) {
        const items = block
          .split("\n")
          .filter(Boolean)
          .map((l) => `<li>${applyInline(l.replace(/^\d+\.\s+/, ""))}</li>`)
          .join("");
        return `<ol>${items}</ol>`;
      }
      return `<p>${applyInline(block)}</p>`;
    })
    .join("\n");
}

function applyInline(text: string): string {
  return text
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    .replace(/_(.+?)_/g, "<em>$1</em>");
}

export function exportToPDF(content: string, title: string): void {
  if (Platform.OS !== "web") return;

  const htmlBody = markdownToHtml(content);

  const fullHtml = `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
  <title>${title}</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Times New Roman', Times, serif;
      font-size: 13pt;
      line-height: 1.7;
      color: #1a1a1a;
      background: #fff;
      max-width: 800px;
      margin: 0 auto;
      padding: 48px 64px;
    }
    .print-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      background: #5856D6;
      color: #fff;
      padding: 12px 24px;
      display: flex;
      align-items: center;
      gap: 12px;
      z-index: 100;
      font-family: -apple-system, sans-serif;
    }
    .print-bar button {
      background: rgba(255,255,255,0.25);
      border: 1px solid rgba(255,255,255,0.4);
      color: #fff;
      padding: 6px 18px;
      border-radius: 8px;
      cursor: pointer;
      font-size: 13px;
      font-weight: 600;
    }
    .print-bar button:hover { background: rgba(255,255,255,0.4); }
    .print-bar span { font-size: 14px; font-weight: 600; flex: 1; }
    .content { margin-top: 60px; }
    h1 {
      font-size: 15pt;
      font-weight: 700;
      text-align: center;
      text-transform: uppercase;
      letter-spacing: 1px;
      margin: 24px 0 16px;
    }
    h2 {
      font-size: 13pt;
      font-weight: 700;
      margin: 20px 0 8px;
      border-bottom: 1px solid #ddd;
      padding-bottom: 4px;
    }
    h3 {
      font-size: 12pt;
      font-weight: 600;
      margin: 14px 0 4px;
      color: #444;
    }
    p { margin: 8px 0; }
    ul, ol { margin: 8px 0 8px 24px; }
    li { margin: 4px 0; }
    hr {
      border: none;
      border-top: 1px solid #ddd;
      margin: 18px 0;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin: 12px 0;
      font-size: 12pt;
    }
    td, th {
      border: 1px solid #ccc;
      padding: 7px 10px;
      text-align: left;
    }
    tr:nth-child(even) td { background: #f9f9f9; }
    strong { font-weight: 700; }
    em { font-style: italic; }
    .footer {
      margin-top: 40px;
      font-size: 9pt;
      color: #999;
      text-align: center;
      border-top: 1px solid #eee;
      padding-top: 12px;
    }
    @media print {
      .print-bar { display: none !important; }
      .content { margin-top: 0; }
      body { padding: 20mm; }
    }
  </style>
</head>
<body>
  <div class="print-bar">
    <span>📄 ${title}</span>
    <button onclick="window.print()">🖨️ PDF İndir / Yazdır</button>
    <button onclick="window.close()">✕ Kapat</button>
  </div>
  <div class="content">
    ${htmlBody}
    <div class="footer">Bu belge EvrakAI tarafından oluşturulmuştur. Hukuki tavsiye niteliği taşımaz.</div>
  </div>
</body>
</html>`;

  const win = window.open("", "_blank");
  if (!win) {
    alert("Lütfen tarayıcınızda açılır pencere iznine izin verin.");
    return;
  }
  win.document.write(fullHtml);
  win.document.close();
}

export function copyToClipboard(text: string): Promise<boolean> {
  if (Platform.OS === "web" && navigator.clipboard) {
    return navigator.clipboard.writeText(text).then(() => true).catch(() => false);
  }
  return Promise.resolve(false);
}

export function shareViaWhatsApp(text: string): void {
  if (Platform.OS !== "web") return;
  const encoded = encodeURIComponent(text.slice(0, 2000));
  window.open(`https://wa.me/?text=${encoded}`, "_blank");
}

export function shareViaEmail(text: string, subject: string): void {
  if (Platform.OS !== "web") return;
  const body = encodeURIComponent(text);
  const sub = encodeURIComponent(subject);
  window.open(`mailto:?subject=${sub}&body=${body}`, "_blank");
}
