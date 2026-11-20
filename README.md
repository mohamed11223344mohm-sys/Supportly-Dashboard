# Supportly — Customer Support Management Platform

A modern, portfolio-grade SaaS Customer Support Management platform inspired by **Linear**, **Intercom**, and **Zendesk**. Built with **Next.js (App Router)**, **TypeScript**, **Tailwind CSS**, **shadcn/ui**, **Zustand**, **Recharts**, and **Lucide React**.

## Core Modules & Pages

1. **Dashboard (`/`)** — Live KPI metrics (total, open, in-progress, avg. resolution time, CSAT), interactive ticket volume & team performance charts, recent tickets, unassigned queue triage banner, and live activity feed.
2. **Tickets Management (`/tickets`)** — Filterable & searchable ticket table with status tabs, priority/assignee filters, inline status/priority/assignee dropdowns, bulk actions (resolve, assign, delete), CSV export, and Create/Edit Ticket modal.
3. **Ticket Details (`/tickets/[id]`)** — Full conversation thread, public reply & private **Internal Notes** composer with canned macros, live property inspector (Status, Priority, Assignee, Category), customer profile card, SLA badge, and real-time **Activity Log**.
4. **Inbox (`/inbox`)** — 3-pane Intercom-style messaging workspace with conversation search/filtering (`All`, `Open`, `Unread`, `Snoozed`, `Closed`), real-time chat stream, internal whisper notes, quick replies, and customer context panel.
5. **Customers (`/customers` & `/customers/[id]`)** — Searchable customer directory with plan filters, Add Customer modal, and dedicated per-customer detail pages with editable account notes, KPIs, ticket history, and conversation history.
6. **Team Management (`/team`)** — Support agent roster cards with live availability switcher (`Online`, `Busy`, `Away`, `Offline`), workload capacity bars, one-click **Auto-Balance Queue**, interactive ticket reassignment board, and Invite Agent modal.
7. **Reports & Analytics (`/reports`)** — Timeframe switcher (`7D`, `30D`, `90D`, `12M`), interactive Recharts visualizations (Volume Area Chart, First Response Speed Line Chart, Status Donut Chart, Category & Priority Breakdowns), Agent Performance Leaderboard, and CSV export.
8. **Settings (`/settings`)** — Tabbed settings for Profile, Workspace & SLA rules, Notification preferences, Appearance (Light/Dark/System theme + Compact table density), and Demo Data reset.

## Architecture

```
src/
├── app/
│   ├── layout.tsx               # Root layout, fonts, ThemeProvider, Toaster
│   ├── globals.css              # Design tokens (Light/Dark) & utility styles
│   └── (dashboard)/             # Authenticated workspace shell + 8 pages
├── components/
│   ├── ui/                      # Accessible shadcn/ui primitives (Radix-backed)
│   ├── layout/                  # Sidebar, TopNavbar, CommandPalette (⌘K), Notifications
│   ├── shared/                  # StatusBadge, UserAvatar, StatCard, PageHeader, EmptyState
│   ├── dashboard/               # Dashboard KPI grid, charts, recent tickets, activity feed
│   ├── tickets/                 # Tickets table, Ticket modal, Ticket detail & activity log
│   ├── inbox/                   # 3-pane real-time inbox chat interface
│   ├── customers/               # Customers directory & customer detail view
│   ├── team/                    # Team roster & workload distribution view
│   ├── reports/                 # Analytics charts & agent leaderboard
│   └── settings/                # Profile, workspace, notifications & theme settings
├── data/mock-data.ts            # Curated realistic SaaS mock dataset
├── services/support-service.ts  # Backend-ready data access abstraction layer
├── store/use-support-store.ts   # Persistent Zustand state store
├── lib/analytics.ts             # Pure KPI & chart series selectors
└── types/index.ts               # Strict TypeScript domain models
```

## Getting Started

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser. Press `Ctrl+K` / `⌘K` anywhere to open the global command palette.
