"use client";

import { useCallback, useRef, useState } from "react";
import type { ChatMessage, UIMessage } from "@/types/chat";

const MAX_CONVERSATION = 30;

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function useChatStream() {
  const [messages, setMessages] = useState<UIMessage[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const conversationRef = useRef<ChatMessage[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const trimConversation = useCallback(() => {
    while (conversationRef.current.length > MAX_CONVERSATION) {
      conversationRef.current.splice(0, 2);
    }
  }, []);

  const send = useCallback(
    async (text: string) => {
      if (!text.trim() || isProcessing) return;

      // 1. Push user message immediately
      const userMsg: UIMessage = {
        id: uid(),
        role: "user",
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      conversationRef.current.push({ role: "user", content: text });
      trimConversation();

      // 2. Placeholder bot message — streaming: true
      const botId = uid();
      const botMsg: UIMessage = {
        id: botId,
        role: "bot",
        content: "",
        streaming: true,
      };
      setMessages((prev) => [...prev, botMsg]);
      setIsProcessing(true);

      // 3. Abortable fetch
      const controller = new AbortController();
      abortRef.current = controller;

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ messages: conversationRef.current }),
          signal: controller.signal,
        });

        if (!res.ok) {
          let errMsg = "Network response was not ok";
          try {
            const errData = await res.json();
            errMsg = errData.error || errMsg;
          } catch {
            errMsg = res.statusText || errMsg;
          }
          throw new Error(errMsg);
        }

        const reader = res.body?.getReader();
        if (!reader) throw new Error("No response stream");

        const decoder = new TextDecoder();
        let buffer = "";
        let full = "";
        let finished = false;

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (!line.trim() || !line.startsWith("data: ")) continue;
            const data = line.slice(6).trim();
            if (data === "[DONE]" || !data) continue;

            let parsed: any;
            try {
              parsed = JSON.parse(data);
            } catch {
              continue; // partial JSON — normal during streaming
            }

            if (parsed.error) throw new Error(parsed.error);

            // Final payload with processed HTML
            if (parsed.done && parsed.html) {
              const html = parsed.html as string;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botId
                    ? { ...m, html, streaming: false, content: full }
                    : m
                )
              );
              conversationRef.current.push({
                role: "assistant",
                content: full,
              });
              trimConversation();
              finished = true;
              break;
            }

            // Streaming token
            if (typeof parsed.content === "string") {
              full += parsed.content;
              setMessages((prev) =>
                prev.map((m) =>
                  m.id === botId ? { ...m, content: full } : m
                )
              );
            }
          }

          if (finished) break;
        }

        // Fallback: no final HTML but we got text
        if (!finished && full) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? { ...m, streaming: false, content: full }
                : m
            )
          );
          conversationRef.current.push({
            role: "assistant",
            content: full,
          });
          trimConversation();
        }

        // Nothing came back at all
        if (!finished && !full) {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === botId
                ? {
                    ...m,
                    streaming: false,
                    error: true,
                    content: "No response received. Please try again.",
                  }
                : m
            )
          );
        }
      } catch (err: any) {
        if (err.name === "AbortError") return;

        const msg = String(err?.message || err);
        const isRateLimit = msg.toLowerCase().includes("rate limit");

        setMessages((prev) =>
          prev.map((m) =>
            m.id === botId
              ? {
                  ...m,
                  streaming: false,
                  error: true,
                  content: isRateLimit
                    ? "Rate limit exceeded. Please wait a moment and try again."
                    : `Error: ${msg}. Please try again.`,
                }
              : m
          )
        );
      } finally {
        setIsProcessing(false);
        abortRef.current = null;
      }
    },
    [isProcessing, trimConversation]
  );

  const cancel = useCallback(() => {
    abortRef.current?.abort();
    setIsProcessing(false);
  }, []);

  const clear = useCallback(() => {
    abortRef.current?.abort();
    conversationRef.current = [];
    setMessages([]);
    setIsProcessing(false);
  }, []);

  return { messages, isProcessing, send, cancel, clear };
}