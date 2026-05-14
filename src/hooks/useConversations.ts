import { useState, useEffect } from "react";
import { ChatMessage } from "@/lib/ollama";

export interface Conversation {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
}

const STORAGE_KEY = "obn_ai_conversations";
const MAX_CONVERSATIONS = 10;

export function useConversations() {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);

  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored) as Conversation[];
        setConversations(parsed);
        if (parsed.length > 0) {
          setActiveId(parsed[0].id);
        }
      } catch (e) {
        console.error("Failed to parse conversations", e);
      }
    }
  }, []);

  const saveConversations = (newConversations: Conversation[]) => {
    // Sort by updatedAt descending
    const sorted = [...newConversations].sort((a, b) => b.updatedAt - a.updatedAt);
    // Keep max 10
    const trimmed = sorted.slice(0, MAX_CONVERSATIONS);
    setConversations(trimmed);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trimmed));
  };

  const createNewConversation = () => {
    const newId = crypto.randomUUID();
    const newConv: Conversation = {
      id: newId,
      title: "New Chat",
      messages: [],
      updatedAt: Date.now(),
    };
    const updated = [newConv, ...conversations];
    saveConversations(updated);
    setActiveId(newId);
    return newId;
  };

  const addMessageToActive = (message: ChatMessage, idOverride?: string) => {
    const targetId = idOverride || activeId;
    if (!targetId) return;

    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === targetId) {
          const newMessages = [...conv.messages, message];
          // Generate title from first user message if title is "New Chat"
          let title = conv.title;
          if (title === "New Chat" && message.role === "user") {
            title = message.content.slice(0, 30) + (message.content.length > 30 ? "..." : "");
          }
          return {
            ...conv,
            title,
            messages: newMessages,
            updatedAt: Date.now(),
          };
        }
        return conv;
      });

      const sorted = [...updated].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      return sorted;
    });
  };

  const updateAssistantMessage = (contentChunk: string) => {
    if (!activeId) return;

    setConversations((prev) => {
      const updated = prev.map((conv) => {
        if (conv.id === activeId) {
          const newMessages = [...conv.messages];
          const lastMsg = newMessages[newMessages.length - 1];
          if (lastMsg && lastMsg.role === "assistant") {
            newMessages[newMessages.length - 1] = {
              ...lastMsg,
              content: lastMsg.content + contentChunk,
            };
          } else {
            newMessages.push({ role: "assistant", content: contentChunk });
          }
          return {
            ...conv,
            messages: newMessages,
            updatedAt: Date.now(),
          };
        }
        return conv;
      });
      // Defer localStorage sync until `commitActiveConversation` to avoid blocking render
      return updated;
    });
  };

  const commitActiveConversation = () => {
    setConversations((prev) => {
      const sorted = [...prev].sort((a, b) => b.updatedAt - a.updatedAt).slice(0, MAX_CONVERSATIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sorted));
      return sorted;
    });
  };

  const deleteConversation = (id: string) => {
    const updated = conversations.filter((c) => c.id !== id);
    saveConversations(updated);
    if (activeId === id) {
      setActiveId(updated.length > 0 ? updated[0].id : null);
    }
  };

  return {
    conversations,
    activeId,
    setActiveId,
    createNewConversation,
    addMessageToActive,
    updateAssistantMessage,
    commitActiveConversation,
    deleteConversation,
    activeConversation: conversations.find((c) => c.id === activeId) || null,
  };
}
