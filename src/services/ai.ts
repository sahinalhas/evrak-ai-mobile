import { StorageService } from "./storage";

export type ChatMsg = { role: "user" | "assistant"; content: string };

export type AiResponse = {
  docType: string | null;
  status: "need_type" | "need_info" | "ready";
  assistantMessage: string;
  document: string | null;
};

export const AIService = {
  async sendMessage(messages: ChatMsg[]): Promise<AiResponse> {
    try {
      const userInfo = await StorageService.getUserInfo();
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages, userInfo }),
        signal: AbortSignal.timeout(25000),
      });
      if (!response.ok) throw new Error(`Sunucu hatası: ${response.status}`);
      return await response.json() as AiResponse;
    } catch (e: any) {
      const isTimeout = e?.name === "TimeoutError" || e?.name === "AbortError";
      return {
        docType: null,
        status: "need_type",
        assistantMessage: isTimeout
          ? "⏱️ Yanıt süresi aşıldı. Lütfen tekrar deneyin."
          : "⚠️ Sunucuya bağlanılamadı. İnternet bağlantınızı kontrol edip tekrar deneyin.",
        document: null,
      };
    }
  },
};
