"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import AgentPerformanceChart from "@/components/charts/AgentPerformanceChart";
import AgentMetricsBar from "@/components/charts/AgentMetricsBar";
import {
  apiClient,
  type MonitoringDashboard,
  type AgentInteraction,
} from "@/lib/api";
import {
  BarChart3,
  Activity,
  Clock,
  Zap,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
} from "lucide-react";

const AGENT_COLORS: Record<string, string> = {
  PlannerAgent: "#6366f1",
  ContentGeneratorAgent: "#10b981",
  SimulationAgent: "#f59e0b",
  EvaluatorAgent: "#ef4444",
  MentorAgent: "#06b6d4",
};

export default function MonitoringPage() {
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);
  const [interactions, setInteractions] = useState<AgentInteraction[]>([]);
  const [timeline, setTimeline] = useState<{ hour: string; count: number }[]>(
    [],
  );
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [d, i, t] = await Promise.all([
        apiClient.getMonitoringDashboard().catch(() => null),
        apiClient.getAgentInteractions(50).catch(() => []),
        apiClient.getAgentTimeline(24).catch(() => []),
      ]);
      setDashboard(d);
      setInteractions(i);
      setTimeline(t);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const agentMetrics = dashboard?.agent_metrics
    ? Object.entries(dashboard.agent_metrics).map(([name, m]) => {
        const metrics = m as {
          total_calls?: number;
          success_rate?: number;
          avg_latency_ms?: number;
          total_tokens?: number;
        };
        return { name, ...metrics };
      })
    : [];

  const callsData = agentMetrics.map((a) => ({
    name: a.name.replace("Agent", ""),
    value: a.total_calls ?? 0,
    color: AGENT_COLORS[a.name] || "#6366f1",
  }));

  const latencyData = agentMetrics.map((a) => ({
    name: a.name.replace("Agent", ""),
    value: Math.round(a.avg_latency_ms ?? 0),
    color: AGENT_COLORS[a.name] || "#6366f1",
  }));

  const timelineData = timeline.map((t) => ({
    label: t.hour,
    value: t.count,
  }));

  const totalCalls = agentMetrics.reduce((s, a) => s + (a.total_calls ?? 0), 0);
  const avgSuccess =
    agentMetrics.length > 0
      ? Math.round(
          agentMetrics.reduce((s, a) => s + (a.success_rate ?? 0), 0) /
            agentMetrics.length,
        )
      : 0;
  const totalTokens = agentMetrics.reduce(
    (s, a) => s + (a.total_tokens ?? 0),
    0,
  );

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh]">
          <div
            className="animate-pulse text-lg"
            style={{ color: "var(--color-text-muted)" }}
          >
            Loading monitoring data...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-text)" }}
            >
              <BarChart3 className="w-6 h-6 text-purple-400" />
              Agent Monitoring
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              Real-time performance metrics and interaction logs.
            </p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all hover:opacity-80"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text)",
            }}
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: "Total Agent Calls",
              value: totalCalls,
              icon: Activity,
              color: "text-indigo-400",
            },
            {
              label: "Avg Success Rate",
              value: `${avgSuccess}%`,
              icon: CheckCircle2,
              color: "text-emerald-400",
            },
            {
              label: "Total Tokens",
              value: totalTokens.toLocaleString(),
              icon: Zap,
              color: "text-amber-400",
            },
            {
              label: "Active Agents",
              value: agentMetrics.length,
              icon: Clock,
              color: "text-purple-400",
            },
          ].map((s) => (
            <div
              key={s.label}
              className="rounded-xl border p-5"
              style={{
                background: "var(--color-bg-card)",
                borderColor: "var(--color-border)",
              }}
            >
              <div className="flex items-center gap-3 mb-3">
                <s.icon className={`w-5 h-5 ${s.color}`} />
                <span
                  className="text-xs font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {s.label}
                </span>
              </div>
              <span
                className="text-3xl font-bold"
                style={{ color: "var(--color-text)" }}
              >
                {s.value}
              </span>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div className="grid lg:grid-cols-2 gap-6">
          <div
            className="rounded-xl border p-6"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <AgentMetricsBar data={callsData} title="Agent Call Volume" />
          </div>
          <div
            className="rounded-xl border p-6"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <AgentMetricsBar data={latencyData} title="Average Latency (ms)" />
          </div>
        </div>

        {/* Timeline */}
        {timelineData.length > 0 && (
          <div
            className="rounded-xl border p-6"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <AgentPerformanceChart
              data={timelineData}
              title="Agent Activity Timeline (24h)"
              color="#a855f7"
              yLabel="Calls"
            />
          </div>
        )}

        {/* Agent Cards */}
        <div>
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Agent Status
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {agentMetrics.map((agent) => (
              <div
                key={agent.name}
                className="rounded-xl border p-5"
                style={{
                  background: "var(--color-bg-card)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{
                      background: AGENT_COLORS[agent.name] || "#6366f1",
                    }}
                  />
                  <span
                    className="font-medium"
                    style={{ color: "var(--color-text)" }}
                  >
                    {agent.name.replace("Agent", " Agent")}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <span
                      className="block text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Calls
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {agent.total_calls ?? 0}
                    </span>
                  </div>
                  <div>
                    <span
                      className="block text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Success
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {agent.success_rate ?? 0}%
                    </span>
                  </div>
                  <div>
                    <span
                      className="block text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Avg Latency
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {Math.round(agent.avg_latency_ms ?? 0)}ms
                    </span>
                  </div>
                  <div>
                    <span
                      className="block text-xs"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Tokens
                    </span>
                    <span
                      className="font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {(agent.total_tokens ?? 0).toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Interaction Log */}
        <div
          className="rounded-xl border p-6"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <h2
            className="text-lg font-semibold mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Recent Interactions
          </h2>
          {interactions.length > 0 ? (
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {interactions.map((interaction, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-4 px-4 py-3 rounded-lg text-sm"
                  style={{ background: "var(--color-bg-elevated)" }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{
                      background:
                        AGENT_COLORS[interaction.agent_name] || "#6366f1",
                    }}
                  />
                  <span
                    className="font-medium w-40 flex-shrink-0"
                    style={{ color: "var(--color-text)" }}
                  >
                    {interaction.agent_name}
                  </span>
                  <span
                    className="flex-1 truncate"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {interaction.action}
                  </span>
                  <span
                    className="text-xs flex-shrink-0"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {interaction.latency_ms}ms
                  </span>
                  {interaction.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-400 flex-shrink-0" />
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p
              className="text-sm text-center py-8"
              style={{ color: "var(--color-text-muted)" }}
            >
              No interactions recorded yet.
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
