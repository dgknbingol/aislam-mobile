import { AI_CONFIG } from '../config/ai';
import { apiClientHeaders } from './apiClientHeaders';

export interface ChatQuota {
  limit: number;
  used: number;
  remaining: number;
  premium: boolean;
  resetsAt: string;
  /** Bugün rewarded ile kazanılan ekstra soru hakkı */
  rewardedBonus: number;
  /** Bugün daha kaç rewarded izlenebilir (premium'da 0) */
  rewardedRemaining: number;
}

export interface ServerConversation {
  id: string;
  title: string;
  createdAt: string;
  updatedAt: string;
}

export interface ServerMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
}

interface AskResponse {
  answer?: string;
}

interface ApiErrorResponse {
  message?: string;
  code?: string;
}

export class ChatApiError extends Error {
  code?: string;

  constructor(message: string, code?: string) {
    super(message);
    this.name = 'ChatApiError';
    this.code = code;
  }
}

function baseUrl(): string {
  return AI_CONFIG.ragBaseUrl.replace(/\/$/, '');
}

async function buildHeaders(json = true): Promise<Record<string, string>> {
  return apiClientHeaders(json);
}

async function parseError(response: Response): Promise<ChatApiError> {
  let data: ApiErrorResponse | null = null;
  try {
    data = (await response.json()) as ApiErrorResponse;
  } catch {
    // non-JSON body
  }
  return new ChatApiError(
    data?.message ?? `Sunucu hatası (${response.status})`,
    data?.code,
  );
}

export async function fetchChatQuota(): Promise<ChatQuota> {
  const response = await fetch(`${baseUrl()}/api/chat/quota`, {
    headers: await buildHeaders(false),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  return normalizeQuota(await response.json());
}

/**
 * Rewarded sonrası kota yenile.
 * SSV açıksa sunucu AdMob callback ile bonus verir — istemci claim etmez, poll eder.
 * SSV kapalıysa eski claim endpoint’ine düşer.
 */
export async function claimRewardedChatBonus(
  previousBonus = 0,
): Promise<ChatQuota> {
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

  for (let i = 0; i < 12; i++) {
    await sleep(i === 0 ? 800 : 1000);
    const quota = await fetchChatQuota();
    if (quota.rewardedBonus > previousBonus) {
      return quota;
    }
  }

  // SSV gecikmesi / kapalı ortam — legacy claim dene
  const response = await fetch(`${baseUrl()}/api/chat/quota/rewarded-bonus`, {
    method: 'POST',
    headers: await buildHeaders(false),
  });

  if (response.ok) {
    return normalizeQuota(await response.json());
  }

  const err = await parseError(response);
  if (err.code === 'CHAT_REWARD_SSV_REQUIRED') {
    throw new ChatApiError(
      'Ödül henüz doğrulanmadı. Birkaç saniye sonra sohbet kotanızı kontrol edin.',
      err.code,
    );
  }
  throw err;
}

function normalizeQuota(raw: Partial<ChatQuota> & {
  limit: number;
  used: number;
  remaining: number;
  premium: boolean;
  resetsAt: string;
}): ChatQuota {
  return {
    limit: raw.limit,
    used: raw.used,
    remaining: raw.remaining,
    premium: raw.premium,
    resetsAt: raw.resetsAt,
    rewardedBonus: raw.rewardedBonus ?? 0,
    rewardedRemaining: raw.rewardedRemaining ?? 0,
  };
}

/** Geriye uyumluluk: tek seferlik soru (sunucu geçmişi yok). */
export async function fetchRagAnswer(question: string): Promise<string> {
  const response = await fetch(`${baseUrl()}/api/chat/ask`, {
    method: 'POST',
    headers: await buildHeaders(),
    body: JSON.stringify({ question }),
  });

  if (!response.ok) {
    throw await parseError(response);
  }

  const payload = (await response.json()) as AskResponse;
  const answer = payload.answer?.trim();
  if (!answer) {
    throw new Error('Sunucudan boş yanıt geldi.');
  }

  return answer;
}

export async function createServerConversation(title?: string): Promise<ServerConversation> {
  const response = await fetch(`${baseUrl()}/api/chat/conversations`, {
    method: 'POST',
    headers: await buildHeaders(),
    body: JSON.stringify({ title: title ?? null }),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json() as Promise<ServerConversation>;
}

export async function listServerConversations(): Promise<ServerConversation[]> {
  const response = await fetch(`${baseUrl()}/api/chat/conversations`, {
    headers: await buildHeaders(false),
  });
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json() as Promise<ServerConversation[]>;
}

export async function listServerMessages(conversationId: string): Promise<ServerMessage[]> {
  const response = await fetch(
    `${baseUrl()}/api/chat/conversations/${conversationId}/messages`,
    { headers: await buildHeaders(false) },
  );
  if (!response.ok) {
    throw await parseError(response);
  }
  return response.json() as Promise<ServerMessage[]>;
}

export async function deleteServerConversation(conversationId: string): Promise<void> {
  const response = await fetch(`${baseUrl()}/api/chat/conversations/${conversationId}`, {
    method: 'DELETE',
    headers: await buildHeaders(false),
  });
  if (!response.ok && response.status !== 204) {
    throw await parseError(response);
  }
}

export async function postServerMessage(
  conversationId: string,
  content: string,
): Promise<{ userMessage: ServerMessage; assistantMessage: ServerMessage }> {
  const response = await fetch(
    `${baseUrl()}/api/chat/conversations/${conversationId}/messages`,
    {
      method: 'POST',
      headers: await buildHeaders(),
      body: JSON.stringify({ content }),
    },
  );
  if (!response.ok) {
    throw await parseError(response);
  }
  const payload = (await response.json()) as {
    userMessage: ServerMessage;
    assistantMessage: ServerMessage;
  };
  return payload;
}

export interface StreamChatHandlers {
  onDelta: (text: string) => void;
  onDone: (message: { messageId: string; content: string; createdAt: string }) => void;
}

/**
 * SSE stream via XMLHttpRequest (React Native uyumlu).
 * Stream başarısız olursa caller JSON fallback kullanabilir.
 */
export function streamServerMessage(
  conversationId: string,
  content: string,
  handlers: StreamChatHandlers,
): Promise<void> {
  return new Promise((resolve, reject) => {
    void (async () => {
      try {
        const headers = await buildHeaders();
        const xhr = new XMLHttpRequest();
        let processedLength = 0;
        let buffer = '';
        let settled = false;

        const fail = (error: Error) => {
          if (settled) return;
          settled = true;
          reject(error);
        };

        const succeed = () => {
          if (settled) return;
          settled = true;
          resolve();
        };

        xhr.open(
          'POST',
          `${baseUrl()}/api/chat/conversations/${conversationId}/messages/stream`,
        );
        Object.entries(headers).forEach(([key, value]) => {
          xhr.setRequestHeader(key, value);
        });
        xhr.setRequestHeader('Accept', 'text/event-stream');

        const consumeBuffer = () => {
          const parts = buffer.split('\n\n');
          buffer = parts.pop() ?? '';
          for (const part of parts) {
            const lines = part.split('\n');
            let eventName = 'message';
            const dataLines: string[] = [];
            for (const line of lines) {
              if (line.startsWith('event:')) {
                eventName = line.slice(6).trim();
              } else if (line.startsWith('data:')) {
                dataLines.push(line.slice(5).trim());
              }
            }
            if (dataLines.length === 0) continue;
            const raw = dataLines.join('\n');
            let payload: Record<string, string> = {};
            try {
              payload = JSON.parse(raw) as Record<string, string>;
            } catch {
              continue;
            }

            if (eventName === 'delta' && payload.text) {
              handlers.onDelta(payload.text);
            } else if (eventName === 'done') {
              handlers.onDone({
                messageId: payload.messageId,
                content: payload.content,
                createdAt: payload.createdAt,
              });
            } else if (eventName === 'error') {
              fail(new ChatApiError(payload.message || 'Stream hatası', payload.code));
            }
          }
        };

        xhr.onprogress = () => {
          const text = xhr.responseText ?? '';
          const chunk = text.slice(processedLength);
          processedLength = text.length;
          buffer += chunk.replace(/\r\n/g, '\n');
          consumeBuffer();
        };

        xhr.onerror = () => {
          fail(new ChatApiError('Ağ hatası (stream)', 'NETWORK_ERROR'));
        };

        xhr.onload = () => {
          const text = xhr.responseText ?? '';
          const chunk = text.slice(processedLength);
          processedLength = text.length;
          buffer += chunk.replace(/\r\n/g, '\n');
          consumeBuffer();

          if (xhr.status >= 200 && xhr.status < 300) {
            succeed();
            return;
          }

          try {
            const err = JSON.parse(xhr.responseText) as ApiErrorResponse;
            fail(new ChatApiError(err.message ?? `Sunucu hatası (${xhr.status})`, err.code));
          } catch {
            fail(new ChatApiError(`Sunucu hatası (${xhr.status})`));
          }
        };

        xhr.send(JSON.stringify({ content }));
      } catch (error) {
        reject(error instanceof Error ? error : new Error('Stream başlatılamadı'));
      }
    })();
  });
}
