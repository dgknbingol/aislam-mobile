import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useSubscription } from './SubscriptionContext';
import {
  ChatApiError,
  createServerConversation,
  deleteServerConversation,
  listServerConversations,
  listServerMessages,
  postServerMessage,
  streamServerMessage,
} from '../services/chatApi';
import type { Conversation, Message } from '../types/chat';

interface ChatContextValue {
  conversations: Conversation[];
  activeConversation: Conversation | null;
  isLoading: boolean;
  isSyncing: boolean;
  quotaExceeded: boolean;
  selectConversation: (id: string) => void;
  createNewChat: () => string;
  sendMessage: (text: string) => Promise<boolean>;
  deleteConversation: (id: string) => void;
  clearQuotaExceeded: () => void;
}

const ChatContext = createContext<ChatContextValue | null>(null);

function createId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

function toLocalConversation(item: {
  id: string;
  title: string;
  updatedAt: string;
  messages?: Message[];
}): Conversation {
  return {
    id: item.id,
    title: item.title,
    messages: item.messages ?? [],
    updatedAt: Date.parse(item.updatedAt) || Date.now(),
  };
}

function pickNextConversation(
  conversations: Conversation[],
  excludeId?: string,
): Conversation | undefined {
  return conversations.find((c) => c.id !== excludeId);
}

export function ChatProvider({ children }: { children: ReactNode }) {
  const { refreshQuota } = useSubscription();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isSyncing, setIsSyncing] = useState(true);
  const [quotaExceeded, setQuotaExceeded] = useState(false);
  const conversationsRef = useRef(conversations);
  conversationsRef.current = conversations;

  const activeConversation = useMemo(
    () => conversations.find((c) => c.id === activeConversationId) ?? null,
    [conversations, activeConversationId],
  );

  useEffect(() => {
    let cancelled = false;

    async function hydrate() {
      setIsSyncing(true);
      try {
        let remote = await listServerConversations();
        if (remote.length === 0) {
          const created = await createServerConversation();
          remote = [created];
        }
        if (cancelled) return;

        const mapped = remote.map((item) => toLocalConversation(item));
        setConversations(mapped);
        setActiveConversationId(mapped[0]?.id ?? null);

        const firstId = mapped[0]?.id;
        if (firstId) {
          const messages = await listServerMessages(firstId);
          if (cancelled) return;
          setConversations((prev) =>
            prev.map((conversation) =>
              conversation.id === firstId
                ? {
                    ...conversation,
                    messages: messages.map((message) => ({
                      id: message.id,
                      role: message.role === 'assistant' ? 'assistant' : 'user',
                      text: message.content,
                      createdAt: Date.parse(message.createdAt) || Date.now(),
                    })),
                  }
                : conversation,
            ),
          );
        }
      } catch {
        if (cancelled) return;
        const fallbackId = createId();
        setConversations([
          {
            id: fallbackId,
            title: 'Yeni sohbet',
            messages: [],
            updatedAt: Date.now(),
          },
        ]);
        setActiveConversationId(fallbackId);
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    }

    void hydrate();
    return () => {
      cancelled = true;
    };
  }, []);

  const selectConversation = useCallback((id: string) => {
    setActiveConversationId(id);
    if (!isUuid(id)) return;

    void (async () => {
      try {
        const messages = await listServerMessages(id);
        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === id
              ? {
                  ...conversation,
                  messages: messages.map((message) => ({
                    id: message.id,
                    role: message.role === 'assistant' ? 'assistant' : 'user',
                    text: message.content,
                    createdAt: Date.parse(message.createdAt) || Date.now(),
                  })),
                }
              : conversation,
          ),
        );
      } catch {
        // keep cached messages
      }
    })();
  }, []);

  const createNewChat = useCallback(() => {
    const current = conversationsRef.current.find((c) => c.id === activeConversationId);
    if (current && current.messages.length === 0) {
      return current.id;
    }

    const localId = createId();
    const conversation: Conversation = {
      id: localId,
      title: 'Yeni sohbet',
      messages: [],
      updatedAt: Date.now(),
    };
    setConversations((prev) => [conversation, ...prev]);
    setActiveConversationId(localId);

    void createServerConversation()
      .then((created) => {
        setConversations((prev) =>
          prev.map((item) =>
            item.id === localId ? { ...item, id: created.id, title: created.title } : item,
          ),
        );
        setActiveConversationId((prev) => (prev === localId ? created.id : prev));
      })
      .catch(() => undefined);

    return localId;
  }, [activeConversationId]);

  const deleteConversation = useCallback(
    (id: string) => {
      if (isUuid(id)) {
        void deleteServerConversation(id).catch(() => undefined);
      }

      setConversations((prev) => {
        const next = prev.filter((conversation) => conversation.id !== id);

        if (activeConversationId !== id) {
          return next;
        }

        const fallback = pickNextConversation(next);
        if (fallback) {
          setActiveConversationId(fallback.id);
          return next;
        }

        const localId = createId();
        setActiveConversationId(localId);
        void createServerConversation()
          .then((created) => {
            setConversations([toLocalConversation(created)]);
            setActiveConversationId(created.id);
          })
          .catch(() => {
            setConversations([
              {
                id: localId,
                title: 'Yeni sohbet',
                messages: [],
                updatedAt: Date.now(),
              },
            ]);
          });

        return [
          {
            id: localId,
            title: 'Yeni sohbet',
            messages: [],
            updatedAt: Date.now(),
          },
        ];
      });
    },
    [activeConversationId],
  );

  const clearQuotaExceeded = useCallback(() => {
    setQuotaExceeded(false);
  }, []);

  const ensureServerConversationId = useCallback(
    async (localId: string, titleHint?: string): Promise<string> => {
      if (isUuid(localId)) {
        return localId;
      }

      const created = await createServerConversation(titleHint);
      setConversations((prev) =>
        prev.map((conversation) =>
          conversation.id === localId
            ? { ...conversation, id: created.id, title: created.title || conversation.title }
            : conversation,
        ),
      );
      setActiveConversationId((prev) => (prev === localId ? created.id : prev));
      return created.id;
    },
    [],
  );

  const sendMessage = useCallback(
    async (text: string): Promise<boolean> => {
      const trimmed = text.trim();
      if (!trimmed || isLoading) return true;

      setQuotaExceeded(false);

      const userMessage: Message = {
        id: createId(),
        role: 'user',
        text: trimmed,
        createdAt: Date.now(),
      };

      let targetId = activeConversationId;
      if (!targetId) {
        targetId = createNewChat();
      }

      setConversations((prev) =>
        prev.map((conversation) => {
          if (conversation.id !== targetId) return conversation;
          const isFirstMessage = conversation.messages.length === 0;
          return {
            ...conversation,
            title: isFirstMessage
              ? trimmed.slice(0, 40) + (trimmed.length > 40 ? '…' : '')
              : conversation.title,
            messages: [...conversation.messages, userMessage],
            updatedAt: userMessage.createdAt,
          };
        }),
      );

      setIsLoading(true);
      const assistantLocalId = createId();

      try {
        const serverId = await ensureServerConversationId(
          targetId,
          trimmed.slice(0, 40),
        );
        targetId = serverId;

        setConversations((prev) =>
          prev.map((conversation) =>
            conversation.id === targetId
              ? {
                  ...conversation,
                  messages: [
                    ...conversation.messages,
                    {
                      id: assistantLocalId,
                      role: 'assistant',
                      text: '',
                      createdAt: Date.now(),
                    },
                  ],
                }
              : conversation,
          ),
        );

        let streamCompleted = false;
        let receivedDelta = false;
        try {
          await streamServerMessage(serverId, trimmed, {
            onDelta: (delta) => {
              receivedDelta = true;
              setConversations((prev) =>
                prev.map((conversation) => {
                  if (conversation.id !== targetId) return conversation;
                  return {
                    ...conversation,
                    messages: conversation.messages.map((message) =>
                      message.id === assistantLocalId
                        ? { ...message, text: message.text + delta }
                        : message,
                    ),
                    updatedAt: Date.now(),
                  };
                }),
              );
            },
            onDone: (done) => {
              streamCompleted = true;
              setConversations((prev) =>
                prev.map((conversation) => {
                  if (conversation.id !== targetId) return conversation;
                  return {
                    ...conversation,
                    messages: conversation.messages.map((message) =>
                      message.id === assistantLocalId
                        ? {
                            id: done.messageId || message.id,
                            role: 'assistant',
                            text: done.content || message.text,
                            createdAt: Date.parse(done.createdAt) || Date.now(),
                          }
                        : message,
                    ),
                    updatedAt: Date.now(),
                  };
                }),
              );
            },
          });
        } catch (streamError) {
          if (streamError instanceof ChatApiError && streamError.code === 'CHAT_QUOTA_EXCEEDED') {
            throw streamError;
          }
          // Stream hiç başlamadıysa JSON endpoint ile dene (yinelenen user mesajı riski yok).
          if (!streamCompleted && !receivedDelta) {
            const result = await postServerMessage(serverId, trimmed);
            setConversations((prev) =>
              prev.map((conversation) => {
                if (conversation.id !== targetId) return conversation;
                return {
                  ...conversation,
                  messages: [
                    ...conversation.messages.filter(
                      (message) =>
                        message.id !== assistantLocalId && message.id !== userMessage.id,
                    ),
                    {
                      id: result.userMessage.id,
                      role: 'user',
                      text: result.userMessage.content,
                      createdAt: Date.parse(result.userMessage.createdAt) || Date.now(),
                    },
                    {
                      id: result.assistantMessage.id,
                      role: 'assistant',
                      text: result.assistantMessage.content,
                      createdAt:
                        Date.parse(result.assistantMessage.createdAt) || Date.now(),
                    },
                  ],
                  updatedAt: Date.now(),
                };
              }),
            );
          } else {
            throw streamError;
          }
        }

        await refreshQuota();
      } catch (error) {
        if (error instanceof ChatApiError && error.code === 'CHAT_QUOTA_EXCEEDED') {
          setQuotaExceeded(true);
          setConversations((prev) =>
            prev.map((conversation) => {
              if (conversation.id !== targetId) return conversation;
              return {
                ...conversation,
                messages: conversation.messages.filter(
                  (m) => m.id !== userMessage.id && m.id !== assistantLocalId,
                ),
              };
            }),
          );
          await refreshQuota();
          return false;
        }

        const errorMessage =
          error instanceof Error ? error.message : 'Yanıt alınırken bir hata oluştu.';

        setConversations((prev) =>
          prev.map((conversation) => {
            if (conversation.id !== targetId) return conversation;
            const withoutEmptyAssistant = conversation.messages.filter(
              (message) => !(message.id === assistantLocalId && message.text === ''),
            );
            const hasAssistant = withoutEmptyAssistant.some((m) => m.id === assistantLocalId);
            if (hasAssistant) {
              return {
                ...conversation,
                messages: withoutEmptyAssistant.map((message) =>
                  message.id === assistantLocalId
                    ? { ...message, text: `Bağlantı hatası: ${errorMessage}` }
                    : message,
                ),
              };
            }
            return {
              ...conversation,
              messages: [
                ...withoutEmptyAssistant,
                {
                  id: assistantLocalId,
                  role: 'assistant',
                  text: `Bağlantı hatası: ${errorMessage}`,
                  createdAt: Date.now(),
                },
              ],
            };
          }),
        );
      } finally {
        setIsLoading(false);
      }

      return true;
    },
    [
      activeConversationId,
      createNewChat,
      ensureServerConversationId,
      isLoading,
      refreshQuota,
    ],
  );

  const value = useMemo(
    () => ({
      conversations,
      activeConversation,
      isLoading,
      isSyncing,
      quotaExceeded,
      selectConversation,
      createNewChat,
      sendMessage,
      deleteConversation,
      clearQuotaExceeded,
    }),
    [
      conversations,
      activeConversation,
      isLoading,
      isSyncing,
      quotaExceeded,
      selectConversation,
      createNewChat,
      sendMessage,
      deleteConversation,
      clearQuotaExceeded,
    ],
  );

  return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within ChatProvider');
  }
  return context;
}
