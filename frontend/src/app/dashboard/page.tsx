"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import CognitiveRadarChart from "@/components/charts/CognitiveRadarChart";
import AgentMetricsBar from "@/components/charts/AgentMetricsBar";
import {
  apiClient,
  type CognitiveProfile,
  type LearningPath,
  type Course,
  type MonitoringDashboard,
} from "@/lib/api";
import {
  Target,
  BookOpen,
  FlaskConical,
  TrendingUp,
  Zap,
  Clock,
} from "lucide-react";

export default function DashboardPage() {
  const [profile, setProfile] = useState<CognitiveProfile | null>(null);
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [dashboard, setDashboard] = useState<MonitoringDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [p, pa, c, d] = await Promise.all([
          apiClient.getCognitiveProfile().catch(() => null),
          apiClient.getLearningPaths().catch(() => []),
          apiClient.getCourses().catch(() => []),
          apiClient.getMonitoringDashboard().catch(() => null),
        ]);
        setProfile(p);
        setPaths(pa);
        setCourses(c);
        setDashboard(d);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const agentData = dashboard?.agent_metrics
    ? Object.entries(dashboard.agent_metrics).map(([name, metrics]) => ({
        name: name.replace("Agent", "").replace("_", " "),
        value: (metrics as { total_calls?: number }).total_calls ?? 0,
      }))
    : [];

  const stats = [
    {
      label: "Learning Paths",
      value: paths.length,
      icon: Target,
      color: "text-indigo-400",
    },
    {
      label: "Active Courses",
      value: courses.length,
      icon: BookOpen,
      color: "text-emerald-400",
    },
    {
      label: "Simulations",
      value: dashboard?.agent_metrics?.SimulationAgent
        ? ((dashboard.agent_metrics.SimulationAgent as { total_calls?: number })
            .total_calls ?? 0)
        : 0,
      icon: FlaskConical,
      color: "text-amber-400",
    },
    {
      label: "Evaluations",
      value: dashboard?.agent_metrics?.EvaluatorAgent
        ? ((dashboard.agent_metrics.EvaluatorAgent as { total_calls?: number })
            .total_calls ?? 0)
        : 0,
      icon: TrendingUp,
      color: "text-rose-400",
    },
  ];

  if (loading) {
    return (
      <AppShell>
        <div className="flex items-center justify-center h-[60vh]">
          <div
            className="animate-pulse text-lg"
            style={{ color: "var(--color-text-muted)" }}
          >
            Loading dashboard...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div>
          <h1
            className="text-2xl font-bold"
            style={{ color: "var(--color-text)" }}
          >
            Dashboard
          </h1>
          <p
            className="text-sm mt-1"
            style={{ color: "var(--color-text-muted)" }}
          >
            Overview of your learning journey and agent activity.
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
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

        {/* Main Grid */}
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Cognitive Profile */}
          <div
            className="rounded-xl border p-6"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{ color: "var(--color-text)" }}
            >
              <Zap className="w-5 h-5 text-indigo-400" />
              Cognitive Profile
            </h3>
            {profile ? (
              <CognitiveRadarChart profile={profile} />
            ) : (
              <div
                className="flex items-center justify-center h-[250px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                Complete evaluations to build your cognitive profile.
              </div>
            )}
          </div>

          {/* Agent Activity */}
          <div
            className="rounded-xl border p-6"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{ color: "var(--color-text)" }}
            >
              <Clock className="w-5 h-5 text-emerald-400" />
              Agent Activity
            </h3>
            {agentData.length > 0 ? (
              <AgentMetricsBar data={agentData} />
            ) : (
              <div
                className="flex items-center justify-center h-[250px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                No agent activity yet. Start learning to see metrics.
              </div>
            )}
          </div>
        </div>

        {/* Learning Paths */}
        <div
          className="rounded-xl border p-6"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3
              className="text-lg font-semibold flex items-center gap-2"
              style={{ color: "var(--color-text)" }}
            >
              <Target className="w-5 h-5 text-indigo-400" />
              Learning Paths
            </h3>
            <a
              href="/learning-path"
              className="text-sm text-indigo-400 hover:underline"
            >
              View all &rarr;
            </a>
          </div>

          {paths.length > 0 ? (
            <div className="space-y-3">
              {paths.slice(0, 5).map((path) => (
                <div
                  key={path.id}
                  className="flex items-center justify-between px-4 py-3 rounded-lg"
                  style={{ background: "var(--color-bg-elevated)" }}
                >
                  <div>
                    <span
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text)" }}
                    >
                      {path.title}
                    </span>
                    <span
                      className="block text-xs mt-0.5"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {path.difficulty_level} &middot;{" "}
                      {path.estimated_duration_hours}h estimated
                    </span>
                  </div>
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium"
                    style={{
                      background:
                        path.status === "completed"
                          ? "rgba(16,185,129,0.15)"
                          : "rgba(99,102,241,0.15)",
                      color:
                        path.status === "completed" ? "#10b981" : "#6366f1",
                    }}
                  >
                    {path.status}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p
              className="text-sm py-8 text-center"
              style={{ color: "var(--color-text-muted)" }}
            >
              No learning paths yet. Ask the Planner Agent to create one!
            </p>
          )}
        </div>
      </div>
    </AppShell>
  );
}
