"use client";

import { useEffect, useState, useRef } from "react";
import AppShell from "@/components/AppShell";
import { apiClient, type SimulationSession } from "@/lib/api";
import { FlaskConical, Play, Send, AlertTriangle } from "lucide-react";

interface Message {
  role: "system" | "user" | "assistant";
  content: string;
}

export default function SimulationPage() {
  const [sessions, setSessions] = useState<SimulationSession[]>([]);
  const [activeSession, setActiveSession] = useState<SimulationSession | null>(
    null,
  );
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [deciding, setDeciding] = useState(false);
  const [starting, setStarting] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    apiClient
      .getSimulationSessions()
      .then(setSessions)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const startSimulation = async () => {
    setStarting(true);
    try {
      const result = await apiClient.startSimulation("general", "intermediate");
      setActiveSession(result.session);
      setMessages([
        {
          role: "assistant",
          content:
            result.scenario?.scenario_context ||
            result.scenario?.initial_scenario ||
            "Simulation started. Make your first decision.",
        },
      ]);
      setSessions((prev) => [result.session, ...prev]);
    } catch {
      // handle
    } finally {
      setStarting(false);
    }
  };

  const makeDecision = async () => {
    if (!input.trim() || !activeSession) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);
    setDeciding(true);
    try {
      const result = await apiClient.makeSimulationDecision(
        activeSession.id,
        userMsg,
      );
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content:
            result.outcome || result.next_scenario || "Decision recorded.",
        },
      ]);
      if (result.session_completed) {
        setMessages((prev) => [
          ...prev,
          {
            role: "system",
            content: `Simulation complete! Final score: ${result.final_score ?? "N/A"}`,
          },
        ]);
        setActiveSession(null);
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "system", content: "Error processing decision. Try again." },
      ]);
    } finally {
      setDeciding(false);
    }
  };

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh]">
          <div
            className="animate-pulse text-lg"
            style={{ color: "var(--color-text-muted)" }}
          >
            Loading simulations...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-text)" }}
            >
              <FlaskConical className="w-6 h-6 text-amber-400" />
              Simulations
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              Interactive scenario-based exercises that track your cognitive
              patterns.
            </p>
          </div>
          {!activeSession && (
            <button
              onClick={startSimulation}
              disabled={starting}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
              style={{ background: "var(--color-primary)" }}
            >
              <Play className="w-4 h-4" />
              {starting ? "Starting..." : "New Simulation"}
            </button>
          )}
        </div>

        {/* Active Simulation */}
        {activeSession ? (
          <div
            className="rounded-xl border flex flex-col"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
              height: "calc(100vh - 240px)",
            }}
          >
            {/* Session Info */}
            <div
              className="px-6 py-3 border-b flex items-center gap-3 text-sm"
              style={{
                borderColor: "var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>
                Active Simulation &middot; Turn {activeSession.turn_count ?? 0}
              </span>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`max-w-[80%] ${msg.role === "user" ? "ml-auto" : "mr-auto"}`}
                >
                  <div
                    className="px-4 py-3 rounded-xl text-sm leading-relaxed whitespace-pre-wrap"
                    style={
                      msg.role === "user"
                        ? { background: "var(--color-primary)", color: "white" }
                        : msg.role === "system"
                          ? {
                              background: "rgba(245,158,11,0.15)",
                              color: "#f59e0b",
                            }
                          : {
                              background: "var(--color-bg-elevated)",
                              color: "var(--color-text)",
                            }
                    }
                  >
                    {msg.content}
                  </div>
                </div>
              ))}
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
                  makeDecision();
                }}
                className="flex gap-3"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your decision..."
                  disabled={deciding}
                  className="flex-1 px-4 py-2.5 rounded-lg border text-sm outline-none transition-colors focus:border-indigo-500 disabled:opacity-50"
                  style={{
                    background: "var(--color-bg-elevated)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                  }}
                />
                <button
                  type="submit"
                  disabled={deciding || !input.trim()}
                  className="px-4 py-2.5 rounded-lg text-white transition-all hover:opacity-90 disabled:opacity-50"
                  style={{ background: "var(--color-primary)" }}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </div>
          </div>
        ) : (
          /* Session History */
          <div>
            {sessions.length > 0 ? (
              <div className="space-y-3">
                {sessions.map((session) => (
                  <div
                    key={session.id}
                    className="rounded-xl border p-5 flex items-center justify-between"
                    style={{
                      background: "var(--color-bg-card)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div>
                      <span
                        className="text-sm font-medium"
                        style={{ color: "var(--color-text)" }}
                      >
                        {session.category ?? "General"} Simulation
                      </span>
                      <span
                        className="block text-xs mt-0.5"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        {session.turn_count} turns &middot; Score:{" "}
                        {session.score ?? "N/A"}
                      </span>
                    </div>
                    <span
                      className="text-xs px-3 py-1 rounded-full font-medium"
                      style={{
                        background:
                          session.status === "completed"
                            ? "rgba(16,185,129,0.15)"
                            : "rgba(245,158,11,0.15)",
                        color:
                          session.status === "completed"
                            ? "#10b981"
                            : "#f59e0b",
                      }}
                    >
                      {session.status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div
                className="rounded-xl border p-12 text-center"
                style={{
                  background: "var(--color-bg-card)",
                  borderColor: "var(--color-border)",
                }}
              >
                <FlaskConical className="w-12 h-12 mx-auto mb-4 text-amber-400 opacity-50" />
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  No simulations yet. Start one to test your decision-making
                  skills.
                </p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  );
}
