"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { supportService } from "@/services/support-service";
import type {
  Agent,
  AgentRole,
  AgentStatus,
  AppSettings,
  Conversation,
  CreateTicketPayload,
  Customer,
  CustomerPlan,
  NotificationItem,
  Ticket,
  TicketCategory,
  TicketChannel,
  TicketPriority,
  TicketStatus,
  UpdateTicketPayload,
} from "@/types";

interface SupportStoreState {
  tickets: Ticket[];
  customers: Customer[];
  agents: Agent[];
  conversations: Conversation[];
  notifications: NotificationItem[];
  settings: AppSettings;
  currentAgentId: string;
  sidebarCollapsed: boolean;

  // UI Actions
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;
  setCurrentAgentId: (agentId: string) => void;

  // Ticket Actions
  createTicket: (payload: CreateTicketPayload) => Ticket;
  updateTicket: (ticketId: string, payload: UpdateTicketPayload) => void;
  deleteTicket: (ticketId: string) => void;
  addTicketMessage: (ticketId: string, content: string, isInternal: boolean) => void;
  deleteTicketMessage: (ticketId: string, messageId: string) => void;

  // Inbox Actions
  sendInboxMessage: (conversationId: string, content: string, isInternal?: boolean) => void;
  deleteInboxMessage: (conversationId: string, messageId: string) => void;
  markConversationRead: (conversationId: string) => void;
  markConversationUnread: (conversationId: string) => void;
  createConversation: (payload: {
    customerId: string;
    subject: string;
    message: string;
    channel: TicketChannel;
  }) => Conversation;
  updateConversationStatus: (
    conversationId: string,
    status: Conversation["status"]
  ) => void;
  assignConversation: (conversationId: string, assigneeId: string | null) => void;

  // Customer Actions
  addCustomer: (payload: {
    name: string;
    email: string;
    phone: string;
    company: string;
    role: string;
    plan: CustomerPlan;
    location: string;
  }) => Customer;
  updateCustomer: (customerId: string, patch: Partial<Customer>) => void;
  deleteCustomer: (customerId: string) => void;
  updateCustomerNotes: (customerId: string, notes: string) => void;

  // Team Actions
  updateAgentStatus: (agentId: string, status: AgentStatus) => void;
  updateAgent: (agentId: string, patch: Partial<Agent>) => void;
  adjustAgentCapacity: (agentId: string, delta: number) => void;
  deleteAgent: (agentId: string) => void;
  addAgent: (payload: {
    name: string;
    email: string;
    role: AgentRole;
    department: string;
    skills: string[];
    maxCapacity?: number;
  }) => Agent;
  reassignTicket: (ticketId: string, assigneeId: string | null) => void;

  // CSAT Actions
  rateTicket: (ticketId: string, rating: number, feedback?: string) => void;

  // Notification Actions
  addNotification: (
    title: string,
    description: string,
    type?: NotificationItem["type"],
    href?: string
  ) => void;
  markNotificationRead: (id: string) => void;
  markAllNotificationsRead: () => void;
  clearNotifications: () => void;

  // Settings Actions
  updateProfileSettings: (patch: Partial<AppSettings["profile"]>) => void;
  updateWorkspaceSettings: (patch: Partial<AppSettings["workspace"]>) => void;
  updateNotificationSettings: (patch: Partial<AppSettings["notifications"]>) => void;
  setCompactDensity: (compact: boolean) => void;
  resetDemoData: () => void;
}

const initial = supportService.getInitialSnapshot();

const STATUS_LABELS: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "In Progress",
  pending: "Pending",
  resolved: "Resolved",
  closed: "Closed",
};

const PRIORITY_LABELS: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent",
};

const AVATAR_COLORS = [
  "bg-indigo-600",
  "bg-emerald-600",
  "bg-violet-600",
  "bg-sky-600",
  "bg-amber-600",
  "bg-rose-600",
  "bg-teal-600",
];

export const useSupportStore = create<SupportStoreState>()(
  persist(
    (set, get) => ({
      tickets: initial.tickets,
      customers: initial.customers,
      agents: initial.agents,
      conversations: initial.conversations,
      notifications: initial.notifications,
      settings: initial.settings,
      currentAgentId: "agent-1",
      sidebarCollapsed: false,

      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),
      setCurrentAgentId: (agentId) => {
        const state = get();
        const agent = state.agents.find((a) => a.id === agentId);
        if (agent) {
          set({
            currentAgentId: agentId,
            settings: {
              ...state.settings,
              profile: {
                ...state.settings.profile,
                name: agent.name,
                email: agent.email,
                role: agent.role,
                department: agent.department,
              },
            },
          });
        }
      },

      createTicket: (payload) => {
        const state = get();
        const now = new Date().toISOString();
        const id = supportService.generateNextTicketId(state.tickets);
        const actor = state.settings.profile.name || "Sarah Chen";
        const customer = state.customers.find((c) => c.id === payload.customerId);

        // Dynamic auto-assignment if enabled and no assignee specified
        let resolvedAssigneeId = payload.assigneeId;
        if (!resolvedAssigneeId && state.settings.workspace.autoAssign) {
          const available = state.agents.filter(
            (a) => a.status === "online" || a.status === "busy"
          );
          const pool = available.length > 0 ? available : state.agents;
          const sorted = [...pool].sort((a, b) => {
            const loadA = state.tickets.filter(
              (t) =>
                t.assigneeId === a.id &&
                t.status !== "resolved" &&
                t.status !== "closed"
            ).length;
            const loadB = state.tickets.filter(
              (t) =>
                t.assigneeId === b.id &&
                t.status !== "resolved" &&
                t.status !== "closed"
            ).length;
            return loadA - loadB;
          });
          if (sorted[0]) {
            resolvedAssigneeId = sorted[0].id;
          }
        }

        const assignee = state.agents.find((a) => a.id === resolvedAssigneeId);

        const baseSlaHours = state.settings.workspace.slaTargetHours || 4;
        const defaultSlaHours =
          payload.priority === "urgent"
            ? Math.max(1, Math.round(baseSlaHours * 0.5))
            : payload.priority === "high"
            ? baseSlaHours
            : payload.priority === "medium"
            ? baseSlaHours * 2
            : baseSlaHours * 6;

        const effectiveSlaHours =
          payload.slaHours && payload.slaHours > 0
            ? payload.slaHours
            : defaultSlaHours;

        const slaDueAt =
          payload.slaDueAt ||
          new Date(Date.now() + effectiveSlaHours * 3_600_000).toISOString();

        const newTicket: Ticket = {
          id,
          subject: payload.subject.trim(),
          description: payload.description.trim(),
          status: payload.status,
          priority: payload.priority,
          category: payload.category,
          channel: payload.channel,
          customerId: payload.customerId,
          assigneeId: resolvedAssigneeId,
          tags: payload.tags,
          createdAt: now,
          updatedAt: now,
          slaDueAt,
          messages: [
            {
              id: `msg-${id}-1`,
              ticketId: id,
              senderType: "customer",
              senderId: payload.customerId,
              senderName: customer?.name ?? "Customer",
              content: payload.description.trim(),
              isInternal: false,
              createdAt: now,
            },
          ],
          activityLog: [
            {
              id: `act-${id}-1`,
              ticketId: id,
              actorName: actor,
              actorType: "agent",
              action: `Created ticket (${PRIORITY_LABELS[payload.priority]} priority)`,
              details: assignee ? `Assigned to ${assignee.name}` : "Left unassigned in queue",
              createdAt: now,
            },
          ],
        };

        const notif: NotificationItem = {
          id: `notif-${Date.now()}`,
          title: `Ticket ${id} created`,
          description: `${newTicket.subject} (${customer?.company ?? "Customer"})`,
          type: "ticket",
          read: false,
          href: `/tickets/${id}`,
          createdAt: now,
        };

        set({
          tickets: [newTicket, ...state.tickets],
          notifications: [notif, ...state.notifications],
        });

        return newTicket;
      },

      updateTicket: (ticketId, payload) => {
        const state = get();
        const now = new Date().toISOString();
        const actor = state.settings.profile.name || "Sarah Chen";

        const updatedTickets = state.tickets.map((ticket) => {
          if (ticket.id !== ticketId) return ticket;

          const logs = [...ticket.activityLog];
          if (payload.status && payload.status !== ticket.status) {
            logs.push({
              id: `act-${Date.now()}-st`,
              ticketId,
              actorName: actor,
              actorType: "agent",
              action: `Changed status from ${STATUS_LABELS[ticket.status]} to ${STATUS_LABELS[payload.status]}`,
              createdAt: now,
            });
          }
          if (payload.priority && payload.priority !== ticket.priority) {
            logs.push({
              id: `act-${Date.now()}-pr`,
              ticketId,
              actorName: actor,
              actorType: "agent",
              action: `Changed priority from ${PRIORITY_LABELS[ticket.priority]} to ${PRIORITY_LABELS[payload.priority]}`,
              createdAt: now,
            });
          }
          if (payload.assigneeId !== undefined && payload.assigneeId !== ticket.assigneeId) {
            const nextAgent = state.agents.find((a) => a.id === payload.assigneeId);
            logs.push({
              id: `act-${Date.now()}-as`,
              ticketId,
              actorName: actor,
              actorType: "agent",
              action: nextAgent
                ? `Assigned ticket to ${nextAgent.name}`
                : "Unassigned ticket",
              createdAt: now,
            });
          }
          if (payload.subject && payload.subject !== ticket.subject) {
            logs.push({
              id: `act-${Date.now()}-sb`,
              ticketId,
              actorName: actor,
              actorType: "agent",
              action: "Updated ticket details",
              createdAt: now,
            });
          }
          if (payload.customerId && payload.customerId !== ticket.customerId) {
            const nextCustomer = state.customers.find((c) => c.id === payload.customerId);
            logs.push({
              id: `act-${Date.now()}-cu`,
              ticketId,
              actorName: actor,
              actorType: "agent",
              action: nextCustomer
                ? `Reassigned customer to ${nextCustomer.name} (${nextCustomer.company})`
                : "Changed ticket customer",
              createdAt: now,
            });
          }
          if (payload.channel && payload.channel !== ticket.channel) {
            logs.push({
              id: `act-${Date.now()}-ch`,
              ticketId,
              actorName: actor,
              actorType: "agent",
              action: `Changed ticket channel to ${payload.channel}`,
              createdAt: now,
            });
          }

          const isNowResolved =
            (payload.status === "resolved" || payload.status === "closed") &&
            ticket.status !== "resolved" &&
            ticket.status !== "closed";

          const resolutionMinutes = isNowResolved
            ? Math.max(
                15,
                Math.round((Date.now() - new Date(ticket.createdAt).getTime()) / 60_000)
              )
            : ticket.resolutionMinutes;

          const updatedSlaDueAt =
            payload.slaDueAt ||
            (payload.slaHours
              ? new Date(Date.now() + payload.slaHours * 3_600_000).toISOString()
              : ticket.slaDueAt);

          return {
            ...ticket,
            ...payload,
            slaDueAt: updatedSlaDueAt,
            updatedAt: now,
            resolvedAt: isNowResolved ? now : ticket.resolvedAt,
            resolutionMinutes,
            activityLog: logs,
          };
        });

        set({ tickets: updatedTickets });
      },

      deleteTicket: (ticketId) => {
        set((state) => ({
          tickets: state.tickets.filter((t) => t.id !== ticketId),
        }));
      },

      addTicketMessage: (ticketId, content, isInternal) => {
        const trimmed = content.trim();
        if (!trimmed) return;
        const state = get();
        const now = new Date().toISOString();
        const currentAgent = state.agents.find((a) => a.id === state.currentAgentId);
        const actorName = state.settings.profile.name || currentAgent?.name || "Sarah Chen";

        set({
          tickets: state.tickets.map((ticket) => {
            if (ticket.id !== ticketId) return ticket;
            const firstResponseMinutes =
              ticket.firstResponseMinutes ??
              Math.max(
                2,
                Math.round((Date.now() - new Date(ticket.createdAt).getTime()) / 60_000)
              );

            return {
              ...ticket,
              updatedAt: now,
              firstResponseMinutes: isInternal ? ticket.firstResponseMinutes : firstResponseMinutes,
              status:
                !isInternal && ticket.status === "open" ? "in_progress" : ticket.status,
              messages: [
                ...ticket.messages,
                {
                  id: `msg-${Date.now()}`,
                  ticketId,
                  senderType: "agent",
                  senderId: state.currentAgentId,
                  senderName: actorName,
                  content: trimmed,
                  isInternal,
                  createdAt: now,
                },
              ],
              activityLog: [
                ...ticket.activityLog,
                {
                  id: `act-${Date.now()}`,
                  ticketId,
                  actorName,
                  actorType: "agent",
                  action: isInternal ? "Added an internal note" : "Replied to customer",
                  createdAt: now,
                },
              ],
            };
          }),
        });
      },

      deleteTicketMessage: (ticketId, messageId) => {
        const state = get();
        const now = new Date().toISOString();
        const currentAgent = state.agents.find((a) => a.id === state.currentAgentId);
        const actor = state.settings.profile.name || currentAgent?.name || "Support Lead";

        set({
          tickets: state.tickets.map((t) => {
            if (t.id !== ticketId) return t;
            const targetMsg = t.messages.find((m) => m.id === messageId);
            const msgLabel = targetMsg?.isInternal ? "internal note" : "public reply";
            return {
              ...t,
              updatedAt: now,
              messages: t.messages.filter((m) => m.id !== messageId),
              activityLog: [
                ...t.activityLog,
                {
                  id: `act-${Date.now()}-del-msg`,
                  ticketId,
                  actorName: actor,
                  actorType: "agent" as const,
                  action: `Deleted ${msgLabel}`,
                  createdAt: now,
                },
              ],
            };
          }),
        });
      },

      sendInboxMessage: (conversationId, content, isInternal = false) => {
        const trimmed = content.trim();
        if (!trimmed) return;
        const state = get();
        const now = new Date().toISOString();
        const actorName = state.settings.profile.name || "Sarah Chen";

        set({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv;
            return {
              ...conv,
              lastMessageAt: now,
              unreadCount: 0,
              status: conv.status === "closed" ? "open" : conv.status,
              messages: [
                ...conv.messages,
                {
                  id: `im-${Date.now()}`,
                  conversationId,
                  senderType: "agent",
                  senderId: state.currentAgentId,
                  senderName: actorName,
                  content: trimmed,
                  isInternal,
                  createdAt: now,
                  read: true,
                },
              ],
            };
          }),
        });
      },

      deleteInboxMessage: (conversationId, messageId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) => {
            if (conv.id !== conversationId) return conv;
            const nextMessages = conv.messages.filter((m) => m.id !== messageId);
            return {
              ...conv,
              messages: nextMessages,
              lastMessageAt:
                nextMessages[nextMessages.length - 1]?.createdAt || conv.lastMessageAt,
            };
          }),
        }));
      },

      markConversationRead: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  unreadCount: 0,
                  messages: conv.messages.map((m) => ({ ...m, read: true })),
                }
              : conv
          ),
        }));
      },

      markConversationUnread: (conversationId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId
              ? {
                  ...conv,
                  unreadCount: Math.max(1, (conv.unreadCount || 0) + 1),
                }
              : conv
          ),
        }));
      },

      createConversation: (payload) => {
        const state = get();
        const now = new Date().toISOString();
        const currentAgent = state.agents.find((a) => a.id === state.currentAgentId);
        const actorName = state.settings.profile.name || currentAgent?.name || "Sarah Chen";
        const id = `conv-${Date.now()}`;

        const newConv: Conversation = {
          id,
          customerId: payload.customerId,
          subject: payload.subject.trim(),
          status: "open",
          channel: payload.channel,
          assigneeId: state.currentAgentId,
          unreadCount: 0,
          lastMessageAt: now,
          messages: [
            {
              id: `im-${Date.now()}`,
              conversationId: id,
              senderType: "agent",
              senderId: state.currentAgentId,
              senderName: actorName,
              content: payload.message.trim(),
              isInternal: false,
              createdAt: now,
              read: true,
            },
          ],
        };

        set({
          conversations: [newConv, ...state.conversations],
        });
        return newConv;
      },

      updateConversationStatus: (conversationId, status) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, status } : conv
          ),
        }));
      },

      assignConversation: (conversationId, assigneeId) => {
        set((state) => ({
          conversations: state.conversations.map((conv) =>
            conv.id === conversationId ? { ...conv, assigneeId } : conv
          ),
        }));
      },

      addCustomer: (payload) => {
        const state = get();
        const now = new Date().toISOString();
        const customer: Customer = {
          id: `cust-${Date.now()}`,
          name: payload.name.trim(),
          email: payload.email.trim(),
          phone: payload.phone.trim() || "+1 (555) 010-2000",
          company: payload.company.trim(),
          role: payload.role.trim() || "Customer",
          plan: payload.plan,
          location: payload.location.trim() || "Remote",
          timezone: "UTC",
          avatarColor: AVATAR_COLORS[state.customers.length % AVATAR_COLORS.length],
          satisfactionScore: 5.0,
          totalSpent:
            payload.plan === "Enterprise"
              ? 24000
              : payload.plan === "Business"
              ? 9600
              : payload.plan === "Growth"
              ? 3600
              : 1200,
          createdAt: now,
          lastActiveAt: now,
          tags: [payload.plan, "New"],
        };
        set({ customers: [customer, ...state.customers] });
        return customer;
      },

      updateCustomerNotes: (customerId, notes) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId ? { ...c, notes } : c
          ),
        }));
      },

      updateCustomer: (customerId, patch) => {
        set((state) => ({
          customers: state.customers.map((c) =>
            c.id === customerId
              ? {
                  ...c,
                  ...patch,
                  lastActiveAt: new Date().toISOString(),
                }
              : c
          ),
        }));
      },

      deleteCustomer: (customerId) => {
        set((state) => ({
          customers: state.customers.filter((c) => c.id !== customerId),
          conversations: state.conversations.filter((c) => c.customerId !== customerId),
          tickets: state.tickets.filter((t) => t.customerId !== customerId),
        }));
      },

      updateAgentStatus: (agentId, status) => {
        set((state) => ({
          agents: state.agents.map((a) =>
            a.id === agentId ? { ...a, status } : a
          ),
        }));
      },

      updateAgent: (agentId, patch) => {
        set((state) => {
          const updatedAgents = state.agents.map((a) =>
            a.id === agentId ? { ...a, ...patch } : a
          );
          let nextProfile = state.settings.profile;
          if (agentId === state.currentAgentId && patch.name) {
            nextProfile = { ...nextProfile, name: patch.name };
          }
          return {
            agents: updatedAgents,
            settings: { ...state.settings, profile: nextProfile },
          };
        });
      },

      adjustAgentCapacity: (agentId, delta) => {
        set((state) => ({
          agents: state.agents.map((a) => {
            if (a.id !== agentId) return a;
            const nextCap = Math.min(25, Math.max(1, (a.maxCapacity || 8) + delta));
            return { ...a, maxCapacity: nextCap };
          }),
        }));
      },

      deleteAgent: (agentId) => {
        set((state) => ({
          agents: state.agents.filter((a) => a.id !== agentId),
          tickets: state.tickets.map((t) =>
            t.assigneeId === agentId ? { ...t, assigneeId: null } : t
          ),
        }));
      },

      rateTicket: (ticketId, rating, feedback) => {
        const state = get();
        const clamped = Math.min(5, Math.max(1, Math.round(rating)));
        const now = new Date().toISOString();

        const targetTicket = state.tickets.find((t) => t.id === ticketId);
        if (!targetTicket) return;

        const updatedTickets = state.tickets.map((t) => {
          if (t.id !== ticketId) return t;
          return {
            ...t,
            csatRating: clamped,
            csatFeedback: feedback || t.csatFeedback,
            activityLog: [
              ...t.activityLog,
              {
                id: `act-${Date.now()}-csat`,
                ticketId,
                actorName: "Customer Survey",
                actorType: "customer" as const,
                action: `Submitted CSAT rating: ${clamped}/5 stars ⭐`,
                createdAt: now,
              },
            ],
          };
        });

        // Recalculate customer satisfaction score
        const customerId = targetTicket.customerId;
        const customerTickets = updatedTickets.filter(
          (t) => t.customerId === customerId && typeof t.csatRating === "number"
        );
        const newCustomerScore =
          customerTickets.length > 0
            ? Number(
                (
                  customerTickets.reduce(
                    (sum, t) => sum + (t.csatRating || 0),
                    0
                  ) / customerTickets.length
                ).toFixed(1)
              )
            : 5.0;

        const updatedCustomers = state.customers.map((c) =>
          c.id === customerId ? { ...c, satisfactionScore: newCustomerScore } : c
        );

        // Recalculate agent csat score
        const assigneeId = targetTicket.assigneeId;
        let updatedAgents = state.agents;
        if (assigneeId) {
          const agentTickets = updatedTickets.filter(
            (t) =>
              t.assigneeId === assigneeId && typeof t.csatRating === "number"
          );
          const newAgentScore =
            agentTickets.length > 0
              ? Number(
                  (
                    agentTickets.reduce(
                      (sum, t) => sum + (t.csatRating || 0),
                      0
                    ) / agentTickets.length
                  ).toFixed(1)
                )
              : 4.8;

          updatedAgents = state.agents.map((a) =>
            a.id === assigneeId ? { ...a, csatScore: newAgentScore } : a
          );
        }

        set({
          tickets: updatedTickets,
          customers: updatedCustomers,
          agents: updatedAgents,
        });
      },

      addAgent: (payload) => {
        const state = get();
        const agent: Agent = {
          id: `agent-${Date.now()}`,
          name: payload.name.trim(),
          email: payload.email.trim(),
          role: payload.role,
          department: payload.department.trim() || "Customer Support",
          status: "online",
          avatarColor: AVATAR_COLORS[state.agents.length % AVATAR_COLORS.length],
          avgResponseMinutes: 18,
          resolutionRate: 90,
          csatScore: 4.8,
          maxCapacity: 7,
          joinedAt: new Date().toISOString(),
          skills: payload.skills.length > 0 ? payload.skills : ["General Support"],
        };
        set({ agents: [...state.agents, agent] });
        return agent;
      },

      reassignTicket: (ticketId, assigneeId) => {
        get().updateTicket(ticketId, { assigneeId });
        const state = get();
        const agent = state.agents.find((a) => a.id === assigneeId);
        const now = new Date().toISOString();
        const notif: NotificationItem = {
          id: `notif-${Date.now()}`,
          title: `Ticket ${ticketId} reassigned`,
          description: agent
            ? `Assigned to ${agent.name} (${agent.department})`
            : "Moved back to unassigned queue",
          type: "assignment",
          read: false,
          href: `/tickets/${ticketId}`,
          createdAt: now,
        };
        set((s) => ({ notifications: [notif, ...s.notifications] }));
      },

      addNotification: (
        title,
        description,
        type = "ticket",
        href = "/tickets"
      ) => {
        const notif: NotificationItem = {
          id: `notif-${Date.now()}`,
          title,
          description,
          type,
          read: false,
          href,
          createdAt: new Date().toISOString(),
        };
        set((s) => ({ notifications: [notif, ...s.notifications] }));
      },

      markNotificationRead: (id) => {
        set((state) => ({
          notifications: state.notifications.map((n) =>
            n.id === id ? { ...n, read: true } : n
          ),
        }));
      },

      markAllNotificationsRead: () => {
        set((state) => ({
          notifications: state.notifications.map((n) => ({ ...n, read: true })),
        }));
      },

      clearNotifications: () => set({ notifications: [] }),

      updateProfileSettings: (patch) => {
        set((state) => {
          const nextProfile = { ...state.settings.profile, ...patch };
          return {
            settings: { ...state.settings, profile: nextProfile },
            agents: state.agents.map((a) =>
              a.id === state.currentAgentId
                ? {
                    ...a,
                    name: nextProfile.name ?? a.name,
                    email: nextProfile.email ?? a.email,
                    role: (nextProfile.role as AgentRole) ?? a.role,
                    department: nextProfile.department ?? a.department,
                  }
                : a
            ),
          };
        });
      },

      updateWorkspaceSettings: (patch) => {
        set((state) => ({
          settings: {
            ...state.settings,
            workspace: { ...state.settings.workspace, ...patch },
          },
        }));
      },

      updateNotificationSettings: (patch) => {
        set((state) => ({
          settings: {
            ...state.settings,
            notifications: { ...state.settings.notifications, ...patch },
          },
        }));
      },

      setCompactDensity: (compact) => {
        set((state) => ({
          settings: { ...state.settings, compactDensity: compact },
        }));
      },

      resetDemoData: () => {
        const fresh = supportService.getInitialSnapshot();
        set({
          tickets: fresh.tickets,
          customers: fresh.customers,
          agents: fresh.agents,
          conversations: fresh.conversations,
          notifications: fresh.notifications,
          settings: fresh.settings,
        });
      },
    }),
    {
      name: "supportly-saas-store-v1",
      skipHydration: true,
      partialize: (state) => ({
        tickets: state.tickets,
        customers: state.customers,
        agents: state.agents,
        conversations: state.conversations,
        notifications: state.notifications,
        settings: state.settings,
        currentAgentId: state.currentAgentId,
        sidebarCollapsed: state.sidebarCollapsed,
      }),
    }
  )
);
