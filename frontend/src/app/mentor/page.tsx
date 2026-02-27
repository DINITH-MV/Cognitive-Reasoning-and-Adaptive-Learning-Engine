"use client";

import { useEffect, useState, useRef } from "react";
import AppShell from "@/components/AppShell";
import { apiClient } from "@/lib/api";
import { MessageSquare, Send, Lightbulb, Sparkles } from "lucide-react";

interface ChatMsg {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "Can you explain gradient descent in simple terms?",
  "What should I focus on next in my learning path?",
  "I'm feeling stuck with recursion. Can you help?",
  "Give me a quick micro-challenge on data structures.",
];

export default function MentorPage() {
  const [messages, setMessages] = useState<ChatMsg[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async (text?: string) => {
    const msg = (text || input).trim();
    if (!msg) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const result = await apiClient.chatWithMentor(msg);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: result.response },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Sorry, I encountered an error. Please try again.",
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AppShell>
      <div
        className="max-w-4xl mx-auto flex flex-col"
        style={{ height: "calc(100vh - 96px)" }}
      >
        {/* Header */}
        <div className="mb-4">
          <h1
            className="text-2xl font-bold flex items-center gap-2"
            style={{ color: "var(--color-text)" }}
          >
            <MessageSquare className="w-6 h-6 text-cyan-400" />
            AI Mentor
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            Your personal learning companion — ask questions, get guidance, and
            stay motivated.
          </p>
        </div>

        {/* Chat Area */}
        <div
          className="flex-1 rounded-xl border flex flex-col overflow-hidden"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex-1 overflow-y-auto p-6 space-y-4">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <Sparkles className="w-12 h-12 text-cyan-400 opacity-50 mb-4" />
                <p
                  className="text-lg font-medium mb-2"
                  style={{ color: "var(--color-text)" }}
                >
                  Hi! I&apos;m your AI Mentor.
                </p>
                <p
                  className="text-sm mb-8 max-w-md"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Ask me anything about your learning journey — I have context
                  about your cognitive profile, evaluations, and progress.
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-lg">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => sendMessage(s)}
                      className="flex items-start gap-2 px-4 py-3 rounded-lg border text-left text-sm transition-all hover:scale-[1.02]"
                      style={{
                        background: "var(--color-bg-elevated)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text)",
                      }}
                    >
                      <Lightbulb className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[80%] ${msg.role === "user" ? "ml-auto" : "mr-auto"}`}
                >
                  <div
                    className="px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                    style={
                      msg.role === "user"
                        ? { background: "var(--color-primary)", color: "white" }
                        : {
                            background: "var(--color-bg-elevated)",
                            color: "var(--color-text)",
                          }
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))
            )}
            {loading && (
              <div className="mr-auto max-w-[80%]">
                <div
                  className="px-4 py-3 rounded-xl text-sm"
                  style={{
                    background: "var(--color-bg-elevated)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <span className="animate-pulse">Thinking...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div
            className="px-6 py-4 border-t"
            style={{ borderColor: "var(--color-border)" }}
          >
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendMessage();
              }}
              className="flex gap-3"
            >
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask your mentor anything..."
                disabled={loading}
                className="flex-1 px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-cyan-500 disabled:opacity-50"
                style={{
                  background: "var(--color-bg-elevated)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-4 py-2.5 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "#06b6d4" }}
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </AppShell>
  );
}
