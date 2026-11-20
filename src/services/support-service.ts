import {
  INITIAL_AGENTS,
  INITIAL_CONVERSATIONS,
  INITIAL_CUSTOMERS,
  INITIAL_NOTIFICATIONS,
  INITIAL_SETTINGS,
  INITIAL_TICKETS,
} from "@/data/mock-data";
import type {
  Agent,
  AppSettings,
  Conversation,
  Customer,
  NotificationItem,
  Ticket,
} from "@/types";

export interface SupportSnapshot {
  tickets: Ticket[];
  customers: Customer[];
  agents: Agent[];
  conversations: Conversation[];
  notifications: NotificationItem[];
  settings: AppSettings;
}

/**
 * Service abstraction layer for Supportly data access.
 * Currently backed by curated mock data + client persistence via Zustand.
 * Replace these methods with fetch()/tRPC/REST calls when connecting a real backend.
 */
export const supportService = {
  getInitialSnapshot(): SupportSnapshot {
    return {
      tickets: structuredClone(INITIAL_TICKETS),
      customers: structuredClone(INITIAL_CUSTOMERS),
      agents: structuredClone(INITIAL_AGENTS),
      conversations: structuredClone(INITIAL_CONVERSATIONS),
      notifications: structuredClone(INITIAL_NOTIFICATIONS),
      settings: structuredClone(INITIAL_SETTINGS),
    };
  },

  generateNextTicketId(existingTickets: Ticket[]): string {
    const highest = existingTickets.reduce((max, t) => {
      const num = parseInt(t.id.replace(/\D/g, ""), 10);
      return Number.isFinite(num) && num > max ? num : max;
    }, 1048);
    return `SUP-${highest + 1}`;
  },
};
