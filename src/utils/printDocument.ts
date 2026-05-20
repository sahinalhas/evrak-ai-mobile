/**
 * Web print / PDF export utility.
 * Converts markdown content to a clean A4-ready HTML page and triggers the
 * browser's native print dialog (which includes "Save as PDF").
 */

function mdToHtml(md: string): string {
  return md
    // Headings
    .replace(/^### (.+)$/gm, "<h3>$1</h3>")
    .replace(/^## (.+)$/gm, "<h2>$1</h2>")
    .replace(/^# (.+)$/gm, "<h1>$1</h1>")
    // Bold / italic
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g, "<em>$1</em>")
    // Horizontal rule
    .replace(/^---$/gm, "<hr>")
    // Blank lines → paragraph breaks
    .replace(/\n{2,}/g, "</p><p>")
    // Single newlines inside paragraphs → <br>
    .replace(/\n/g, "<br>")
    // Wrap everything in a paragraph
    .replace(/^/, "<p>")
    .replace(/$/, "</p>")
    // Clean up empty paragraphs that sit right after block-level elements
    .replace(/<p>(<h[123]>|<hr>)/g, "$1")
    .replace(/(<\/h[123]>|<hr>)<\/p>/g, "$1");
}

export function printDocument(content: string, title = "EvrakAI Belgesi"): void {
  if (typeof window === "undefined") return;

  const html = mdToHtml(content);

  const printHtml = `<!DOCTYPE html>
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
  ${html}
  <div class="footer">Bu belge EvrakAI tarafından oluşturulmuş taslaktır. Kuruma teslim etmeden önce kontrol ediniz.</div>
  <script>
    window.onload = function() {
      setTimeout(function() { window.print(); }, 300);
    };
  </script>
</body>
</html>`;

  const win = window.open("", "_blank", "width=800,height=900");
  if (!win) {
    alert("Yazdırma penceresi açılamadı. Lütfen tarayıcınızın açılır pencere engelleyicisini devre dışı bırakın.");
    return;
  }
  win.document.write(printHtml);
  win.document.close();
}
