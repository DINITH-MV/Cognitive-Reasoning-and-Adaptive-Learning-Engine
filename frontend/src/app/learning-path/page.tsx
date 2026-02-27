"use client";

import { useEffect, useState } from "react";
import AppShell from "@/components/AppShell";
import { apiClient, type LearningPath, type Course } from "@/lib/api";
import { Route, Plus, BookOpen, CheckCircle2, Clock } from "lucide-react";

export default function LearningPathPage() {
  const [paths, setPaths] = useState<LearningPath[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [goal, setGoal] = useState("");
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const [p, c] = await Promise.all([
          apiClient.getLearningPaths().catch(() => []),
          apiClient.getCourses().catch(() => []),
        ]);
        setPaths(p);
        setCourses(c);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!goal.trim()) return;
    setCreating(true);
    try {
      const result = await apiClient.createLearningPlan(goal);
      setPaths((prev) => [result.learning_path, ...prev]);
      setGoal("");
      setShowForm(false);
    } catch {
      // handle error
    } finally {
      setCreating(false);
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
            Loading learning paths...
          </div>
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell>
      <div className="max-w-5xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-2xl font-bold flex items-center gap-2"
              style={{ color: "var(--color-text)" }}
            >
              <Route className="w-6 h-6 text-indigo-400" />
              Learning Paths
            </h1>
            <p
              className="text-sm mt-1"
              style={{ color: "var(--color-text-muted)" }}
            >
              AI-generated roadmaps tailored to your goals.
            </p>
          </div>
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90"
            style={{ background: "var(--color-primary)" }}
          >
            <Plus className="w-4 h-4" />
            New Path
          </button>
        </div>

        {/* Create Form */}
        {showForm && (
          <form
            onSubmit={handleCreate}
            className="rounded-xl border p-6 space-y-4"
            style={{
              background: "var(--color-bg-card)",
              borderColor: "var(--color-border)",
            }}
          >
            <h3
              className="text-lg font-semibold"
              style={{ color: "var(--color-text)" }}
            >
              Create a New Learning Path
            </h3>
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              Describe your learning goal and the Planner Agent will generate a
              personalized roadmap.
            </p>
            <textarea
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              rows={3}
              className="w-full px-4 py-3 rounded-lg border text-sm outline-none resize-none transition-colors focus:border-indigo-500"
              style={{
                background: "var(--color-bg-elevated)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
              placeholder="e.g., I want to learn machine learning from scratch, focusing on NLP..."
            />
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={creating || !goal.trim()}
                className="px-6 py-2 rounded-lg text-sm font-medium text-white transition-all hover:opacity-90 disabled:opacity-50"
                style={{ background: "var(--color-primary)" }}
              >
                {creating ? "Generating..." : "Generate Path"}
              </button>
              <button
                type="button"
                onClick={() => setShowForm(false)}
                className="px-6 py-2 rounded-lg text-sm font-medium transition-colors"
                style={{ color: "var(--color-text-muted)" }}
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {/* Paths List */}
        {paths.length > 0 ? (
          <div className="space-y-4">
            {paths.map((path) => (
              <div
                key={path.id}
                className="rounded-xl border p-6"
                style={{
                  background: "var(--color-bg-card)",
                  borderColor: "var(--color-border)",
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3
                      className="text-lg font-semibold"
                      style={{ color: "var(--color-text)" }}
                    >
                      {path.title}
                    </h3>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {path.description}
                    </p>
                  </div>
                  <span
                    className="text-xs px-3 py-1 rounded-full font-medium whitespace-nowrap"
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

                <div
                  className="flex items-center gap-6 text-xs"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  <span className="flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" />
                    {path.estimated_duration_hours}h estimated
                  </span>
                  <span className="capitalize">{path.difficulty_level}</span>
                </div>

                {path.milestones && path.milestones.length > 0 && (
                  <div className="mt-4 space-y-2">
                    {path.milestones.map((ms, idx) => (
                      <div
                        key={idx}
                        className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm"
                        style={{ background: "var(--color-bg-elevated)" }}
                      >
                        <CheckCircle2
                          className={`w-4 h-4 flex-shrink-0 ${
                            ms.status === "completed"
                              ? "text-emerald-400"
                              : "text-gray-500"
                          }`}
                        />
                        <span style={{ color: "var(--color-text)" }}>
                          {ms.title}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
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
            <BookOpen className="w-12 h-12 mx-auto mb-4 text-indigo-400 opacity-50" />
            <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
              No learning paths yet. Click &ldquo;New Path&rdquo; to get
              started.
            </p>
          </div>
        )}

        {/* Courses */}
        {courses.length > 0 && (
          <div>
            <h2
              className="text-lg font-semibold mb-4 flex items-center gap-2"
              style={{ color: "var(--color-text)" }}
            >
              <BookOpen className="w-5 h-5 text-emerald-400" />
              Generated Courses
            </h2>
            <div className="grid md:grid-cols-2 gap-4">
              {courses.map((course) => (
                <div
                  key={course.id}
                  className="rounded-xl border p-5"
                  style={{
                    background: "var(--color-bg-card)",
                    borderColor: "var(--color-border)",
                  }}
                >
                  <h4
                    className="font-medium mb-1"
                    style={{ color: "var(--color-text)" }}
                  >
                    {course.title}
                  </h4>
                  <p
                    className="text-xs mb-3"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {course.description}
                  </p>
                  <div
                    className="flex items-center gap-4 text-xs"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    <span className="capitalize">
                      {course.difficulty_level}
                    </span>
                    <span>{course.estimated_duration_hours}h</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
