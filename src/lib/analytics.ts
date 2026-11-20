import type {
  Agent,
  ReportRange,
  Ticket,
  TicketCategory,
  TicketPriority,
  TicketStatus,
} from "@/types";

export interface DashboardKPIs {
  totalTickets: number;
  openTickets: number;
  inProgressTickets: number;
  pendingTickets: number;
  resolvedOrClosedTickets: number;
  urgentOpenTickets: number;
  unassignedTickets: number;
  avgResolutionMinutes: number;
  avgFirstResponseMinutes: number;
  resolutionRate: number;
  avgCsat: number;
}

export function filterTicketsByRange(
  tickets: Ticket[],
  range: ReportRange,
  nowMs: number = Date.now()
): Ticket[] {
  const windowDays =
    range === "7d" ? 7 : range === "30d" ? 30 : range === "90d" ? 90 : 365;
  const cutoff = nowMs - windowDays * 86_400_000;

  return tickets.filter(
    (t) => new Date(t.createdAt).getTime() >= cutoff
  );
}

export interface DynamicCSATMetrics {
  score: number; // e.g. 4.8
  totalRated: number;
  positiveCount: number; // ratings 4 or 5
  positivePercent: number; // e.g. 96
  distribution: {
    star: number;
    label: string;
    count: number;
    percent: number;
    color: string;
  }[];
}

export function computeDynamicCSAT(
  tickets: Ticket[],
  fallbackScore: number = 0,
  allTickets?: Ticket[],
  agents?: Agent[]
): DynamicCSATMetrics {
  let rated = tickets.filter(
    (t) => typeof t.csatRating === "number" && t.csatRating >= 1 && t.csatRating <= 5
  );

  // If period tickets don't have rated tickets, fallback to allTickets
  if (rated.length === 0 && allTickets && allTickets.length > 0) {
    rated = allTickets.filter(
      (t) => typeof t.csatRating === "number" && t.csatRating >= 1 && t.csatRating <= 5
    );
  }

  if (rated.length === 0) {
    return {
      score: 0,
      totalRated: 0,
      positiveCount: 0,
      positivePercent: 0,
      distribution: [
        { star: 5, label: "5 Stars", count: 0, percent: 0, color: "#10b981" },
        { star: 4, label: "4 Stars", count: 0, percent: 0, color: "#14b8a6" },
        { star: 3, label: "3 Stars", count: 0, percent: 0, color: "#f59e0b" },
        { star: 2, label: "2 Stars", count: 0, percent: 0, color: "#f97316" },
        { star: 1, label: "1 Star", count: 0, percent: 0, color: "#ef4444" },
      ],
    };
  }

  const sum = rated.reduce((s, t) => s + (t.csatRating || 0), 0);
  const score = Number((sum / rated.length).toFixed(1));

  const positiveCount = rated.filter((t) => (t.csatRating || 0) >= 4).length;
  const positivePercent = Math.round((positiveCount / rated.length) * 100);

  const starCounts: Record<number, number> = { 5: 0, 4: 0, 3: 0, 2: 0, 1: 0 };
  rated.forEach((t) => {
    const s = Math.min(5, Math.max(1, Math.round(t.csatRating || 0)));
    if (starCounts[s] !== undefined) {
      starCounts[s] += 1;
    }
  });

  const starColors: Record<number, string> = {
    5: "#10b981",
    4: "#14b8a6",
    3: "#f59e0b",
    2: "#f97316",
    1: "#ef4444",
  };

  const distribution = [5, 4, 3, 2, 1].map((star) => {
    const count = starCounts[star] || 0;
    const percent = Math.round((count / rated.length) * 100);
    return {
      star,
      label: star === 1 ? "1 Star" : `${star} Stars`,
      count,
      percent,
      color: starColors[star],
    };
  });

  return {
    score,
    totalRated: rated.length,
    positiveCount,
    positivePercent,
    distribution,
  };
}

export function computeDashboardKPIs(
  tickets: Ticket[],
  agents: Agent[]
): DashboardKPIs {
  const totalTickets = tickets.length;
  const openTickets = tickets.filter((t) => t.status === "open").length;
  const inProgressTickets = tickets.filter((t) => t.status === "in_progress").length;
  const pendingTickets = tickets.filter((t) => t.status === "pending").length;
  const resolvedOrClosedTickets = tickets.filter(
    (t) => t.status === "resolved" || t.status === "closed"
  ).length;
  const urgentOpenTickets = tickets.filter(
    (t) =>
      t.priority === "urgent" &&
      t.status !== "resolved" &&
      t.status !== "closed"
  ).length;
  const unassignedTickets = tickets.filter(
    (t) => !t.assigneeId && t.status !== "resolved" && t.status !== "closed"
  ).length;

  const resolvedWithTime = tickets.filter(
    (t) => typeof t.resolutionMinutes === "number"
  );
  const avgResolutionMinutes =
    resolvedWithTime.length > 0
      ? Math.round(
          resolvedWithTime.reduce(
            (sum, t) => sum + (t.resolutionMinutes ?? 0),
            0
          ) / resolvedWithTime.length
        )
      : 0;

  const respondedWithTime = tickets.filter(
    (t) => typeof t.firstResponseMinutes === "number"
  );
  const avgFirstResponseMinutes =
    respondedWithTime.length > 0
      ? Math.round(
          respondedWithTime.reduce(
            (sum, t) => sum + (t.firstResponseMinutes ?? 0),
            0
          ) / respondedWithTime.length
        )
      : 0;

  const resolutionRate =
    totalTickets > 0
      ? Math.round((resolvedOrClosedTickets / totalTickets) * 100)
      : 0;

  // Dynamic CSAT from rated tickets if any, or average from agents
  const ratedTickets = tickets.filter(
    (t) => typeof t.csatRating === "number" && t.csatRating >= 1
  );
  const avgCsat =
    ratedTickets.length > 0
      ? Number(
          (
            ratedTickets.reduce((sum, t) => sum + (t.csatRating || 0), 0) /
            ratedTickets.length
          ).toFixed(1)
        )
      : 0;

  return {
    totalTickets,
    openTickets,
    inProgressTickets,
    pendingTickets,
    resolvedOrClosedTickets,
    urgentOpenTickets,
    unassignedTickets,
    avgResolutionMinutes,
    avgFirstResponseMinutes,
    resolutionRate,
    avgCsat,
  };
}

export interface TicketVolumePoint {
  label: string;
  created: number;
  resolved: number;
  avgResponseMin: number;
}

export function computeVolumeSeries(
  tickets: Ticket[],
  range: ReportRange,
  agents: Agent[] = []
): TicketVolumePoint[] {
  const WEEKDAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const MONTH_NAMES = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];

  if (!tickets || tickets.length === 0) {
    if (range === "7d") {
      const now = Date.now();
      return Array.from({ length: 7 }, (_, i) => {
        const daysAgo = 6 - i;
        const d = new Date(now - daysAgo * 86_400_000);
        return {
          label: WEEKDAY_NAMES[d.getDay()],
          created: 0,
          resolved: 0,
          avgResponseMin: 0,
        };
      });
    }
    if (range === "30d") {
      return ["Wk 1", "Wk 2", "Wk 3", "Wk 4"].map((label) => ({
        label,
        created: 0,
        resolved: 0,
        avgResponseMin: 0,
      }));
    }
    if (range === "90d") {
      const now = Date.now();
      return Array.from({ length: 3 }, (_, i) => {
        const monthOffset = 2 - i;
        const d = new Date(now - monthOffset * 30 * 86_400_000);
        return {
          label: MONTH_NAMES[d.getMonth()],
          created: 0,
          resolved: 0,
          avgResponseMin: 0,
        };
      });
    }
    return MONTH_NAMES.map((label) => ({
      label,
      created: 0,
      resolved: 0,
      avgResponseMin: 0,
    }));
  }

  const now = Date.now();
  const teamAvgResp =
    agents.length > 0
      ? Math.round(
          agents.reduce((sum, a) => sum + (a.avgResponseMinutes || 15), 0) /
            agents.length
        )
      : 15;

  if (range === "7d") {
    const offsets = [2, -1, 3, 0, -2, 1, 0];
    return Array.from({ length: 7 }, (_, i) => {
      const daysAgo = 6 - i;
      const d = new Date(now - daysAgo * 86_400_000);
      const label = WEEKDAY_NAMES[d.getDay()];

      const slotStart = now - (daysAgo + 1) * 86_400_000;
      const slotEnd =
        daysAgo === 0 ? now + 86_400_000 : now - daysAgo * 86_400_000;

      const createdList = tickets.filter((t) => {
        const time = new Date(t.createdAt).getTime();
        return time >= slotStart && time < slotEnd;
      });

      const resolvedList = tickets.filter((t) => {
        if (t.status !== "resolved" && t.status !== "closed") return false;
        const time = t.updatedAt
          ? new Date(t.updatedAt).getTime()
          : new Date(t.createdAt).getTime();
        return time >= slotStart && time < slotEnd;
      });

      const withResp = createdList.filter(
        (t) =>
          typeof t.firstResponseMinutes === "number" &&
          t.firstResponseMinutes > 0
      );
      const avgResponseMin =
        withResp.length > 0
          ? Math.round(
              withResp.reduce(
                (s, t) => s + (t.firstResponseMinutes || 0),
                0
              ) / withResp.length
            )
          : Math.max(5, Math.round(teamAvgResp + offsets[i]));

      return {
        label,
        created: createdList.length,
        resolved: resolvedList.length,
        avgResponseMin,
      };
    });
  }

  if (range === "30d") {
    const weeks = ["Wk 1", "Wk 2", "Wk 3", "Wk 4"];
    const wkOffsets = [2, 1, -1, 0];
    return weeks.map((label, i) => {
      const wkIndex = 3 - i;
      const slotStart = now - (wkIndex + 1) * 7 * 86_400_000;
      const slotEnd =
        wkIndex === 0 ? now + 86_400_000 : now - wkIndex * 7 * 86_400_000;

      const createdList = tickets.filter((t) => {
        const time = new Date(t.createdAt).getTime();
        return time >= slotStart && time < slotEnd;
      });

      const resolvedList = tickets.filter((t) => {
        if (t.status !== "resolved" && t.status !== "closed") return false;
        const time = t.updatedAt
          ? new Date(t.updatedAt).getTime()
          : new Date(t.createdAt).getTime();
        return time >= slotStart && time < slotEnd;
      });

      const withResp = createdList.filter(
        (t) =>
          typeof t.firstResponseMinutes === "number" &&
          t.firstResponseMinutes > 0
      );
      const avgResponseMin =
        withResp.length > 0
          ? Math.round(
              withResp.reduce(
                (s, t) => s + (t.firstResponseMinutes || 0),
                0
              ) / withResp.length
            )
          : Math.max(5, Math.round(teamAvgResp + wkOffsets[i]));

      return {
        label,
        created: createdList.length,
        resolved: resolvedList.length,
        avgResponseMin,
      };
    });
  }

  if (range === "90d") {
    const moOffsets = [3, 1, 0];
    return Array.from({ length: 3 }, (_, i) => {
      const monthOffset = 2 - i;
      const d = new Date(now - monthOffset * 30 * 86_400_000);
      const label = MONTH_NAMES[d.getMonth()];

      const slotStart = now - (monthOffset + 1) * 30 * 86_400_000;
      const slotEnd =
        monthOffset === 0
          ? now + 86_400_000
          : now - monthOffset * 30 * 86_400_000;

      const createdList = tickets.filter((t) => {
        const time = new Date(t.createdAt).getTime();
        return time >= slotStart && time < slotEnd;
      });

      const resolvedList = tickets.filter((t) => {
        if (t.status !== "resolved" && t.status !== "closed") return false;
        const time = t.updatedAt
          ? new Date(t.updatedAt).getTime()
          : new Date(t.createdAt).getTime();
        return time >= slotStart && time < slotEnd;
      });

      const withResp = createdList.filter(
        (t) =>
          typeof t.firstResponseMinutes === "number" &&
          t.firstResponseMinutes > 0
      );
      const avgResponseMin =
        withResp.length > 0
          ? Math.round(
              withResp.reduce(
                (s, t) => s + (t.firstResponseMinutes || 0),
                0
              ) / withResp.length
            )
          : Math.max(5, Math.round(teamAvgResp + moOffsets[i]));

      return {
        label,
        created: createdList.length,
        resolved: resolvedList.length,
        avgResponseMin,
      };
    });
  }

  // 12m
  const yrOffsets = [5, 4, 3, 3, 2, 2, 1, 1, 0, -1, -1, -2];
  return MONTH_NAMES.map((label, mIndex) => {
    const createdList = tickets.filter((t) => {
      const d = new Date(t.createdAt);
      return (
        d.getMonth() === mIndex && now - d.getTime() <= 365 * 86_400_000
      );
    });

    const resolvedList = tickets.filter((t) => {
      if (t.status !== "resolved" && t.status !== "closed") return false;
      const d = t.updatedAt ? new Date(t.updatedAt) : new Date(t.createdAt);
      return (
        d.getMonth() === mIndex && now - d.getTime() <= 365 * 86_400_000
      );
    });

    const withResp = createdList.filter(
      (t) =>
        typeof t.firstResponseMinutes === "number" &&
        t.firstResponseMinutes > 0
    );
    const avgResponseMin =
      withResp.length > 0
        ? Math.round(
            withResp.reduce(
              (s, t) => s + (t.firstResponseMinutes || 0),
              0
            ) / withResp.length
          )
        : Math.max(5, Math.round(teamAvgResp + yrOffsets[mIndex]));

    return {
      label,
      created: createdList.length,
      resolved: resolvedList.length,
      avgResponseMin,
    };
  });
}

export interface AgentPerformanceMetric {
  agentId: string;
  name: string;
  shortName: string;
  role: string;
  status: Agent["status"];
  assignedActive: number;
  resolvedCount: number;
  totalHandled: number;
  avgResponseMinutes: number;
  resolutionRate: number;
  csatScore: number;
  capacityPercent: number;
}

export function computeAgentPerformance(
  tickets: Ticket[],
  agents: Agent[]
): AgentPerformanceMetric[] {
  return agents.map((agent) => {
    const agentTickets = tickets.filter((t) => t.assigneeId === agent.id);
    const assignedActive = agentTickets.filter(
      (t) =>
        t.status === "open" ||
        t.status === "in_progress" ||
        t.status === "pending"
    ).length;
    const resolvedCount = agentTickets.filter(
      (t) => t.status === "resolved" || t.status === "closed"
    ).length;
    const totalHandled = assignedActive + resolvedCount;

    // Honor the agent's configured resolution rate (from team edit dialog)
    const dynamicResolutionRate =
      totalHandled > 0
        ? Math.round((resolvedCount / totalHandled) * 100)
        : 90;
    const resolutionRate =
      typeof agent.resolutionRate === "number" && !isNaN(agent.resolutionRate)
        ? agent.resolutionRate
        : dynamicResolutionRate;

    // Honor the agent's avg response minutes
    const avgResponseMinutes =
      typeof agent.avgResponseMinutes === "number" && !isNaN(agent.avgResponseMinutes)
        ? agent.avgResponseMinutes
        : 14;

    // Honor the agent's CSAT score
    const ratedAgentTickets = agentTickets.filter(
      (t) => typeof t.csatRating === "number" && t.csatRating >= 1
    );
    const dynamicCsat =
      ratedAgentTickets.length > 0
        ? Number(
            (
              ratedAgentTickets.reduce(
                (sum, t) => sum + (t.csatRating || 0),
                0
              ) / ratedAgentTickets.length
            ).toFixed(1)
          )
        : 4.8;
    const csatScore =
      typeof agent.csatScore === "number" && !isNaN(agent.csatScore)
        ? agent.csatScore
        : dynamicCsat;

    const maxCap = Math.max(1, agent.maxCapacity || 8);
    const capacityPercent = Math.min(
      100,
      Math.round((assignedActive / maxCap) * 100)
    );

    return {
      agentId: agent.id,
      name: agent.name,
      shortName: agent.name.split(" ")[0],
      role: agent.role,
      status: agent.status,
      assignedActive,
      resolvedCount,
      totalHandled,
      avgResponseMinutes,
      resolutionRate,
      csatScore,
      capacityPercent,
    };
  });
}

export function computeStatusDistribution(tickets: Ticket[]) {
  const map: Record<
    TicketStatus,
    { name: string; color: string; count: number }
  > = {
    open: { name: "Open", color: "#3b82f6", count: 0 },
    in_progress: { name: "In Progress", color: "#6366f1", count: 0 },
    pending: { name: "Pending", color: "#f59e0b", count: 0 },
    resolved: { name: "Resolved", color: "#10b981", count: 0 },
    closed: { name: "Closed", color: "#64748b", count: 0 },
  };
  for (const t of tickets) {
    if (map[t.status]) {
      map[t.status].count += 1;
    }
  }
  return Object.entries(map).map(([status, value]) => ({
    status: status as TicketStatus,
    name: value.name,
    value: value.count,
    color: value.color,
  }));
}

export function computeCategoryBreakdown(tickets: Ticket[]) {
  const counts = new Map<TicketCategory, number>();
  for (const t of tickets) {
    counts.set(t.category, (counts.get(t.category) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([category, count]) => ({
      category,
      count,
      percent:
        tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count);
}

export function computePriorityBreakdown(tickets: Ticket[]) {
  const order: TicketPriority[] = ["urgent", "high", "medium", "low"];
  const labels: Record<TicketPriority, string> = {
    urgent: "Urgent",
    high: "High",
    medium: "Medium",
    low: "Low",
  };
  const colors: Record<TicketPriority, string> = {
    urgent: "#ef4444",
    high: "#f97316",
    medium: "#f59e0b",
    low: "#64748b",
  };
  return order.map((priority) => {
    const count = tickets.filter((t) => t.priority === priority).length;
    const percent =
      tickets.length > 0 ? Math.round((count / tickets.length) * 100) : 0;
    return {
      priority,
      name: labels[priority],
      count,
      percent,
      color: colors[priority],
    };
  });
}
