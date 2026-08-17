"use client";

import * as React from "react";
import { Send, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Field";
import { InlineSpinner } from "@/components/ui/States";

type Message = { role: "user" | "assistant"; content: string };

const SUGGESTIONS = [
  "Who owes me money?",
  "Which quotes should I chase?",
  "Who are my best customers?",
  "Where am I losing money?",
  "What should I do today?",
  "Why is my profit down?",
];

export function AskKiwiChat() {
  const [messages, setMessages] = React.useState<Message[]>([]);
  const [input, setInput] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [conversationId, setConversationId] = React.useState<string | undefined>();
  const bottomRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  async function send(question: string) {
    if (!question.trim() || loading) return;
    setMessages((m) => [...m, { role: "user", content: question }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/ai/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question, conversationId }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessages((m) => [...m, { role: "assistant", content: data.error ?? "Something went wrong." }]);
        return;
      }
      setConversationId(data.conversationId);
      setMessages((m) => [...m, { role: "assistant", content: data.answer }]);
    } catch {
      setMessages((m) => [...m, { role: "assistant", content: "Couldn't reach the server. Try again." }]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-160px)] flex-col rounded-2xl border border-border bg-surface sm:h-[70vh]">
      <div className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.length === 0 && (
          <div>
            <div className="mb-4 flex items-center gap-2 text-muted">
              <Sparkles className="size-4 text-brand" />
              <p className="text-sm">Ask Kiwi answers from your own business data. Try:</p>
            </div>
            <div className="flex flex-wrap gap-2">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="rounded-full border border-border bg-surface-2 px-3 py-1.5 text-sm text-foreground hover:bg-brand-light hover:text-brand-dark"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={m.role === "user" ? "flex justify-end" : "flex justify-start"}>
            <div
              className={`max-w-[85%] whitespace-pre-line rounded-2xl px-4 py-2.5 text-sm ${
                m.role === "user"
                  ? "bg-brand text-white"
                  : "border border-border bg-surface-2 text-foreground"
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {loading && <InlineSpinner label="Thinking…" />}
        <div ref={bottomRef} />
      </div>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          send(input);
        }}
        className="flex items-center gap-2 border-t border-border p-3"
      >
        <Input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask about your leads, quotes, invoices, profit…"
          className="flex-1"
        />
        <Button type="submit" size="md" loading={loading} icon={<Send className="size-4" />}>
          Ask
        </Button>
      </form>
    </div>
  );
}
