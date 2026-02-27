"use client";

import Link from "next/link";
import {
  Brain,
  BookOpen,
  MessageSquare,
  FlaskConical,
  BarChart3,
  Target,
  Sparkles,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: Target,
    title: "Planner Agent",
    description:
      "Analyzes your goals and constraints to create a personalized learning roadmap with actionable milestones.",
    color: "text-indigo-400",
    href: "/dashboard",
  },
  {
    icon: BookOpen,
    title: "Content Generator",
    description:
      "AI-generated courses, quizzes, and interactive simulations tailored to your learning objectives.",
    color: "text-emerald-400",
    href: "/dashboard",
  },
  {
    icon: FlaskConical,
    title: "Simulation Engine",
    description:
      "Real-world scenario-based exercises with dynamic outcomes that track your decision patterns.",
    color: "text-amber-400",
    href: "/simulation",
  },
  {
    icon: BarChart3,
    title: "Evaluator Agent",
    description:
      "Comprehensive scoring with cognitive profiling — understanding how you think, not just what you know.",
    color: "text-rose-400",
    href: "/dashboard",
  },
  {
    icon: MessageSquare,
    title: "AI Mentor",
    description:
      "Natural language guidance with personalized suggestions, explanations, and motivational support.",
    color: "text-cyan-400",
    href: "/mentor",
  },
  {
    icon: Sparkles,
    title: "Monitoring Dashboard",
    description:
      "Real-time visualizations of agent performance, learning analytics, and system health.",
    color: "text-purple-400",
    href: "/monitoring",
  },
];

export default function HomePage() {
  return (
    <div className="min-h-screen" style={{ background: "var(--color-bg)" }}>
      {/* Navigation */}
      <nav className="border-b" style={{ borderColor: "var(--color-border)" }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Brain className="w-8 h-8 text-indigo-400" />
            <span
              className="text-xl font-bold tracking-tight"
              style={{ color: "var(--color-text)" }}
            >
              CRACLE
            </span>
          </div>
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className="px-4 py-2 rounded-lg text-sm font-medium transition-colors"
              style={{ color: "var(--color-text-muted)" }}
            >
              Dashboard
            </Link>
            <Link
              href="/login"
              className="px-5 py-2 rounded-lg text-sm font-medium text-white transition-colors"
              style={{ background: "var(--color-primary)" }}
            >
              Get Started
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 pt-24 pb-16 text-center">
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8"
          style={{
            background: "var(--color-bg-elevated)",
            color: "var(--color-primary)",
          }}
        >
          <Sparkles className="w-3.5 h-3.5" />
          Powered by Azure AI Foundry + Multi-Agent Architecture
        </div>
        <h1
          className="text-5xl md:text-6xl font-bold tracking-tight leading-tight mb-6"
          style={{ color: "var(--color-text)" }}
        >
          Cognitive Reasoning &<br />
          <span className="text-indigo-400">Adaptive Learning Engine</span>
        </h1>
        <p
          className="text-lg max-w-2xl mx-auto mb-12"
          style={{ color: "var(--color-text-muted)" }}
        >
          Five AI agents working together to plan your learning path, generate
          personalized content, run immersive simulations, evaluate your
          cognitive profile, and mentor you to mastery.
        </p>
        <div className="flex items-center justify-center gap-4">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg text-white font-medium transition-all hover:opacity-90"
            style={{ background: "var(--color-primary)" }}
          >
            Launch Dashboard
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/monitoring"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-lg font-medium transition-all"
            style={{
              background: "var(--color-bg-elevated)",
              color: "var(--color-text)",
            }}
          >
            Agent Monitoring
          </Link>
        </div>
      </section>

      {/* Feature Cards */}
      <section className="max-w-7xl mx-auto px-6 pb-24">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature) => (
            <Link
              key={feature.title}
              href={feature.href}
              className="group p-6 rounded-xl border transition-all hover:scale-[1.02]"
              style={{
                background: "var(--color-bg-card)",
                borderColor: "var(--color-border)",
              }}
            >
              <feature.icon className={`w-10 h-10 mb-4 ${feature.color}`} />
              <h3
                className="text-lg font-semibold mb-2"
                style={{ color: "var(--color-text)" }}
              >
                {feature.title}
              </h3>
              <p
                className="text-sm leading-relaxed"
                style={{ color: "var(--color-text-muted)" }}
              >
                {feature.description}
              </p>
            </Link>
          ))}
        </div>
      </section>

      {/* Architecture Visualization */}
      <section className="max-w-5xl mx-auto px-6 pb-24">
        <h2
          className="text-2xl font-bold text-center mb-12"
          style={{ color: "var(--color-text)" }}
        >
          Multi-Agent Architecture
        </h2>
        <div
          className="rounded-xl border p-8"
          style={{
            background: "var(--color-bg-card)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex flex-col items-center gap-4">
            {/* Orchestrator */}
            <div
              className="px-6 py-3 rounded-lg text-center font-medium"
              style={{
                background: "var(--color-bg-elevated)",
                color: "var(--color-primary)",
              }}
            >
              Agent Orchestrator
            </div>
            <div
              className="w-px h-8"
              style={{ background: "var(--color-border)" }}
            />
            {/* Agent Row */}
            <div className="grid grid-cols-5 gap-4 w-full">
              {[
                "Planner",
                "Content Gen",
                "Simulation",
                "Evaluator",
                "Mentor",
              ].map((name) => (
                <div
                  key={name}
                  className="px-3 py-3 rounded-lg text-center text-sm font-medium"
                  style={{
                    background: "var(--color-bg-elevated)",
                    color: "var(--color-text)",
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
            <div
              className="w-px h-8"
              style={{ background: "var(--color-border)" }}
            />
            {/* Infrastructure */}
            <div className="grid grid-cols-3 gap-4 w-full max-w-lg">
              {["Azure AI Foundry", "PostgreSQL", "MCP Tools"].map((name) => (
                <div
                  key={name}
                  className="px-3 py-2 rounded-lg text-center text-xs"
                  style={{
                    background: "var(--color-bg-elevated)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  {name}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
