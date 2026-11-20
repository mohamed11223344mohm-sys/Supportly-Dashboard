export type TicketStatus = "open" | "in_progress" | "pending" | "resolved" | "closed";

export type TicketPriority = "low" | "medium" | "high" | "urgent";

export type TicketCategory =
  | "Billing"
  | "Technical"
  | "Account"
  | "Feature Request"
  | "Bug Report"
  | "Integrations";

export type TicketChannel = "email" | "chat" | "web" | "slack" | "phone";

export type AgentStatus = "online" | "busy" | "away" | "offline";

export type AgentRole = "Support Lead" | "Senior Agent" | "Technical Specialist" | "Support Agent";

export type CustomerPlan = "Starter" | "Growth" | "Business" | "Enterprise";

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  role: string;
  plan: CustomerPlan;
  location: string;
  timezone: string;
  avatarColor: string;
  satisfactionScore: number; // 1.0 - 5.0
  totalSpent: number;
  createdAt: string;
  lastActiveAt: string;
  notes?: string;
  tags: string[];
}

export interface Agent {
  id: string;
  name: string;
  email: string;
  role: AgentRole;
  department: string;
  status: AgentStatus;
  avatarColor: string;
  avgResponseMinutes: number;
  resolutionRate: number; // percentage
  csatScore: number; // 1.0 - 5.0
  maxCapacity: number;
  joinedAt: string;
  skills: string[];
}

export interface TicketMessage {
  id: string;
  ticketId: string;
  senderType: "customer" | "agent" | "system";
  senderId: string;
  senderName: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  attachments?: {
    id: string;
    name: string;
    size: string;
    type: string;
  }[];
}

export interface ActivityLogEntry {
  id: string;
  ticketId: string;
  actorName: string;
  actorType: "agent" | "customer" | "system";
  action: string;
  details?: string;
  createdAt: string;
}

export interface Ticket {
  id: string; // e.g., "SUP-1042"
  subject: string;
  description: string;
  status: TicketStatus;
  priority: TicketPriority;
  category: TicketCategory;
  channel: TicketChannel;
  customerId: string;
  assigneeId: string | null;
  tags: string[];
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  firstResponseMinutes?: number;
  resolutionMinutes?: number;
  slaDueAt: string;
  csatRating?: number; // 1 - 5 stars
  csatFeedback?: string;
  messages: TicketMessage[];
  activityLog: ActivityLogEntry[];
}

export interface InboxMessage {
  id: string;
  conversationId: string;
  senderType: "customer" | "agent";
  senderId: string;
  senderName: string;
  content: string;
  isInternal?: boolean;
  createdAt: string;
  read: boolean;
}

export interface Conversation {
  id: string;
  customerId: string;
  assigneeId: string | null;
  ticketId?: string;
  channel: TicketChannel;
  status: "open" | "snoozed" | "closed";
  unreadCount: number;
  subject: string;
  lastMessageAt: string;
  messages: InboxMessage[];
}

export interface NotificationItem {
  id: string;
  title: string;
  description: string;
  type: "ticket" | "message" | "assignment" | "sla" | "system";
  read: boolean;
  href?: string;
  createdAt: string;
}

export interface UserProfileSettings {
  name: string;
  email: string;
  role: string;
  department: string;
  bio: string;
  timezone: string;
  language: string;
  signature: string;
}

export interface WorkspaceSettings {
  companyName: string;
  supportEmail: string;
  subdomain: string;
  autoAssign: boolean;
  slaTargetHours: number;
  businessHoursOnly: boolean;
  csatSurveys: boolean;
}

export interface NotificationSettings {
  emailNewTicket: boolean;
  emailAssigned: boolean;
  emailMentioned: boolean;
  pushDesktop: boolean;
  slaBreachAlerts: boolean;
  dailyDigest: boolean;
  soundEffects: boolean;
}

export interface AppSettings {
  profile: UserProfileSettings;
  workspace: WorkspaceSettings;
  notifications: NotificationSettings;
  compactDensity: boolean;
}

export type ReportRange = "7d" | "30d" | "90d" | "12m";

export interface TicketFilters {
  search: string;
  status: TicketStatus | "all";
  priority: TicketPriority | "all";
  assigneeId: string | "all" | "unassigned";
  category: TicketCategory | "all";
}

export interface CreateTicketPayload {
  subject: string;
  description: string;
  customerId: string;
  assigneeId: string | null;
  priority: TicketPriority;
  status: TicketStatus;
  category: TicketCategory;
  channel: TicketChannel;
  tags: string[];
  slaHours?: number;
  slaDueAt?: string;
}

export interface UpdateTicketPayload {
  subject?: string;
  description?: string;
  status?: TicketStatus;
  priority?: TicketPriority;
  category?: TicketCategory;
  channel?: TicketChannel;
  customerId?: string;
  assigneeId?: string | null;
  tags?: string[];
  slaHours?: number;
  slaDueAt?: string;
}
