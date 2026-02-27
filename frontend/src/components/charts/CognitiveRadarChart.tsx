"use client";

import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";
import type { CognitiveProfile } from "@/lib/api";

interface Props {
  profile: CognitiveProfile;
}

export default function CognitiveRadarChart({ profile }: Props) {
  const data = [
    { trait: "Analytical", value: (profile.analytical_thinking ?? 0.5) * 100 },
    { trait: "Creative", value: (profile.creative_thinking ?? 0.5) * 100 },
    { trait: "Planning", value: (profile.planning_skill ?? 0.5) * 100 },
    { trait: "Risk", value: (profile.risk_tolerance ?? 0.5) * 100 },
    { trait: "Attention", value: (profile.attention_to_detail ?? 0.5) * 100 },
    { trait: "Collab", value: (profile.collaboration_skill ?? 0.5) * 100 },
    { trait: "Speed", value: (profile.learning_speed ?? 0.5) * 100 },
    { trait: "Retention", value: (profile.retention_rate ?? 0.5) * 100 },
  ];

  return (
    <ResponsiveContainer width="100%" height={300}>
      <RadarChart data={data} cx="50%" cy="50%" outerRadius="75%">
        <PolarGrid stroke="#2a2a3d" />
        <PolarAngleAxis
          dataKey="trait"
          tick={{ fill: "#8a8aa3", fontSize: 12 }}
        />
        <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
        <Tooltip
          contentStyle={{
            background: "#16162a",
            border: "1px solid #2a2a3d",
            borderRadius: 8,
            color: "#e0e0f0",
          }}
        />
        <Radar
          name="Profile"
          dataKey="value"
          stroke="#6366f1"
          fill="#6366f1"
          fillOpacity={0.25}
        />
      </RadarChart>
    </ResponsiveContainer>
  );
}
