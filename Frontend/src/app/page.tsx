"use client";

import { useCallback } from "react";
import { Header } from "@/components/Header";
import { ChatCanvas } from "@/components/ChatCanvas";
import { Composer } from "@/components/Composer";
import { useTheme } from "@/hooks/useTheme";
import { useChatStream } from "@/hooks/useChatStream";
import { useHealth } from "@/hooks/useHealth";

export default function Home() {
  const { theme, toggle } = useTheme();
  const status = useHealth();
  const { messages, isProcessing, send } = useChatStream();

  const handleSuggestion = useCallback(
    (prompt: string) => {
      send(prompt);
    },
    [send]
  );

  return (
    <main className="flex h-screen w-screen justify-center p-4 sm:p-6">
      <div
        className="relative flex h-full w-full max-w-[900px] flex-col overflow-hidden rounded-[28px]"
        style={{
          background:
            "radial-gradient(120% 100% at 50% 0%, var(--canvas-bg-alt) 0%, var(--canvas-bg) 60%)",
          border: "1px solid var(--border-glass)",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.02), 0 40px 120px -30px rgba(0,0,0,0.7), 0 0 80px -20px rgba(224,224,224,0.04)",
        }}
      >
        {/* Hairline top shine */}
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-8 top-0 h-px"
          style={{
            background:
              "linear-gradient(90deg, transparent, rgba(255,255,255,0.16), transparent)",
          }}
        />

        <Header theme={theme} onToggleTheme={toggle} status={status} />

        <ChatCanvas
          messages={messages}
          isProcessing={isProcessing}
          onPickSuggestion={handleSuggestion}
        />

        <Composer onSend={send} disabled={isProcessing} />
      </div>
    </main>
  );
}