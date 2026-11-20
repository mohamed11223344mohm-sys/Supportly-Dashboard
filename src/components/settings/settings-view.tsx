"use client";

import * as React from "react";
import { useTheme } from "next-themes";
import { toast } from "sonner";
import {
  Bell,
  Building2,
  Check,
  Monitor,
  Moon,
  Palette,
  RotateCcw,
  Save,
  Sun,
  User,
} from "lucide-react";
import { PageHeader } from "@/components/shared/page-header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmDialog } from "@/components/shared/confirm-dialog";
import { UserAvatar } from "@/components/shared/user-avatar";
import { useSupportStore } from "@/store/use-support-store";
import { cn } from "@/lib/utils";

const AVATAR_COLORS = [
  { label: "Indigo", value: "bg-indigo-600" },
  { label: "Emerald", value: "bg-emerald-600" },
  { label: "Violet", value: "bg-violet-600" },
  { label: "Sky", value: "bg-sky-600" },
  { label: "Amber", value: "bg-amber-600" },
  { label: "Rose", value: "bg-rose-600" },
  { label: "Teal", value: "bg-teal-600" },
];

export function SettingsView() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  const settings = useSupportStore((s) => s.settings);
  const agents = useSupportStore((s) => s.agents);
  const currentAgentId = useSupportStore((s) => s.currentAgentId);
  const setCurrentAgentId = useSupportStore((s) => s.setCurrentAgentId);
  const updateAgent = useSupportStore((s) => s.updateAgent);
  const updateProfileSettings = useSupportStore((s) => s.updateProfileSettings);
  const updateWorkspaceSettings = useSupportStore((s) => s.updateWorkspaceSettings);
  const updateNotificationSettings = useSupportStore(
    (s) => s.updateNotificationSettings
  );
  const addNotification = useSupportStore((s) => s.addNotification);
  const setCompactDensity = useSupportStore((s) => s.setCompactDensity);
  const resetDemoData = useSupportStore((s) => s.resetDemoData);

  const currentAgent =
    agents.find((a) => a.id === currentAgentId) ?? agents[0];

  const [profileForm, setProfileForm] = React.useState(settings.profile);
  const [workspaceForm, setWorkspaceForm] = React.useState(settings.workspace);
  const [avatarColor, setAvatarColor] = React.useState(
    currentAgent?.avatarColor ?? "bg-indigo-600"
  );
  const [resetOpen, setResetOpen] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  React.useEffect(() => {
    setProfileForm(settings.profile);
    setWorkspaceForm(settings.workspace);
    if (currentAgent) {
      setAvatarColor(currentAgent.avatarColor);
    }
  }, [settings, currentAgent]);

  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfileSettings(profileForm);
    if (currentAgent) {
      updateAgent(currentAgent.id, {
        name: profileForm.name,
        email: profileForm.email,
        role: profileForm.role as any,
        department: profileForm.department,
        avatarColor,
      });
    }
    toast.success("Profile settings saved and synced across dashboard");
  };

  const handleSaveWorkspace = (e: React.FormEvent) => {
    e.preventDefault();
    updateWorkspaceSettings(workspaceForm);
    toast.success("Workspace settings updated");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Settings"
        description="Configure your personal profile, workspace SLA rules, notifications, and visual theme."
      />

      <Tabs defaultValue="profile" className="space-y-5">
        <TabsList className="flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="profile">
            <User className="h-3.5 w-3.5" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="account">
            <Building2 className="h-3.5 w-3.5" />
            Workspace & Account
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-3.5 w-3.5" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Palette className="h-3.5 w-3.5" />
            Appearance
          </TabsTrigger>
        </TabsList>

        {/* Profile Tab */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Personal Profile</CardTitle>
              <CardDescription>
                Your name, role, and signature appear across tickets, team rosters, and customer messages.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveProfile} className="space-y-5">
                {/* Switch Active Account */}
                <div className="flex flex-col gap-2 rounded-xl border border-primary/20 bg-primary/[0.04] p-3.5 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <Label className="text-xs font-semibold text-foreground">
                      Active Workspace Identity
                    </Label>
                    <p className="text-[11px] text-muted-foreground">
                      Switch which agent account you are actively signed in as.
                    </p>
                  </div>
                  <Select
                    value={currentAgentId}
                    onValueChange={(id) => {
                      setCurrentAgentId(id);
                      const target = agents.find((a) => a.id === id);
                      if (target) {
                        setAvatarColor(target.avatarColor);
                        toast.success(`Switched active profile to ${target.name}`);
                      }
                    }}
                  >
                    <SelectTrigger className="h-8 w-[220px] text-xs">
                      <SelectValue placeholder="Select member" />
                    </SelectTrigger>
                    <SelectContent>
                      {agents.map((a) => (
                        <SelectItem key={a.id} value={a.id}>
                          {a.name} ({a.role})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Avatar Preview & Color Palette */}
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 p-4">
                  <div className="flex items-center gap-4">
                    <UserAvatar
                      name={profileForm.name}
                      color={avatarColor}
                      size="xl"
                      status={currentAgent?.status ?? "online"}
                    />
                    <div>
                      <p className="text-sm font-semibold">{profileForm.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {profileForm.role} · {profileForm.department}
                      </p>
                      <span className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400 capitalize">
                        ● {currentAgent?.status ?? "online"}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] text-muted-foreground">
                      Avatar Color Accent
                    </Label>
                    <div className="flex items-center gap-1.5">
                      {AVATAR_COLORS.map((c) => (
                        <button
                          key={c.value}
                          type="button"
                          onClick={() => setAvatarColor(c.value)}
                          className={cn(
                            "flex h-6 w-6 items-center justify-center rounded-full transition-all cursor-pointer",
                            c.value,
                            avatarColor === c.value
                              ? "ring-2 ring-primary ring-offset-2 scale-110"
                              : "opacity-80 hover:opacity-100 hover:scale-105"
                          )}
                          title={c.label}
                        >
                          {avatarColor === c.value && (
                            <Check className="h-3 w-3 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-name">Full Name</Label>
                    <Input
                      id="prof-name"
                      value={profileForm.name}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-email">Email Address</Label>
                    <Input
                      id="prof-email"
                      type="email"
                      value={profileForm.email}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, email: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-role">Job Title / Role</Label>
                    <Input
                      id="prof-role"
                      value={profileForm.role}
                      onChange={(e) =>
                        setProfileForm({ ...profileForm, role: e.target.value })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-dept">Department</Label>
                    <Input
                      id="prof-dept"
                      value={profileForm.department}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          department: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="prof-tz">Timezone</Label>
                    <Input
                      id="prof-tz"
                      value={profileForm.timezone}
                      onChange={(e) =>
                        setProfileForm({
                          ...profileForm,
                          timezone: e.target.value,
                        })
                      }
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-bio">Bio</Label>
                  <Textarea
                    id="prof-bio"
                    rows={2}
                    value={profileForm.bio}
                    onChange={(e) =>
                      setProfileForm({ ...profileForm, bio: e.target.value })
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="prof-sig">Agent Reply Signature</Label>
                  <Textarea
                    id="prof-sig"
                    rows={3}
                    value={profileForm.signature}
                    onChange={(e) =>
                      setProfileForm({
                        ...profileForm,
                        signature: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="sm" className="gap-1.5">
                    <Save className="h-3.5 w-3.5" />
                    Save Profile
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account & Workspace Tab */}
        <TabsContent value="account" className="space-y-5">
          <Card>
            <CardHeader>
              <CardTitle>Workspace Configuration</CardTitle>
              <CardDescription>
                Manage your organization branding, support inbox routing, and SLA rules.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSaveWorkspace} className="space-y-5">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Workspace Name</Label>
                    <Input
                      value={workspaceForm.companyName}
                      onChange={(e) =>
                        setWorkspaceForm({
                          ...workspaceForm,
                          companyName: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Support Email</Label>
                    <Input
                      type="email"
                      value={workspaceForm.supportEmail}
                      onChange={(e) =>
                        setWorkspaceForm({
                          ...workspaceForm,
                          supportEmail: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label>Help Center Subdomain</Label>
                    <div className="flex items-center">
                      <Input
                        value={workspaceForm.subdomain}
                        onChange={(e) =>
                          setWorkspaceForm({
                            ...workspaceForm,
                            subdomain: e.target.value,
                          })
                        }
                        className="rounded-r-none"
                      />
                      <span className="flex h-9 items-center rounded-r-lg border border-l-0 border-input bg-muted px-3 font-mono text-xs text-muted-foreground">
                        .supportly.io
                      </span>
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label>Default SLA Target (hours)</Label>
                    <Input
                      type="number"
                      min={1}
                      max={72}
                      value={workspaceForm.slaTargetHours}
                      onChange={(e) =>
                        setWorkspaceForm({
                          ...workspaceForm,
                          slaTargetHours: Number(e.target.value) || 4,
                        })
                      }
                    />
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Auto-Assign Incoming Tickets</p>
                      <p className="text-xs text-muted-foreground">
                        Automatically distribute new queue items to available online agents.
                      </p>
                    </div>
                    <Switch
                      checked={workspaceForm.autoAssign}
                      onCheckedChange={(checked) =>
                        setWorkspaceForm({ ...workspaceForm, autoAssign: checked })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Business Hours Only SLA</p>
                      <p className="text-xs text-muted-foreground">
                        Pause SLA timers outside Monday–Friday 09:00–18:00 UTC.
                      </p>
                    </div>
                    <Switch
                      checked={workspaceForm.businessHoursOnly}
                      onCheckedChange={(checked) =>
                        setWorkspaceForm({
                          ...workspaceForm,
                          businessHoursOnly: checked,
                        })
                      }
                    />
                  </div>

                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">Automated CSAT Surveys</p>
                      <p className="text-xs text-muted-foreground">
                        Send a 1-click satisfaction survey when tickets are marked Resolved.
                      </p>
                    </div>
                    <Switch
                      checked={workspaceForm.csatSurveys}
                      onCheckedChange={(checked) =>
                        setWorkspaceForm({ ...workspaceForm, csatSurveys: checked })
                      }
                    />
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button type="submit" size="sm">
                    <Save className="h-3.5 w-3.5" />
                    Save Workspace
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card className="border-destructive/30">
            <CardHeader>
              <CardTitle className="text-destructive">Demo Environment Data</CardTitle>
              <CardDescription>
                Restore all mock tickets, conversations, customers, and team assignments back to their original demo state.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="outline"
                size="sm"
                className="border-destructive/30 text-destructive hover:bg-destructive/10"
                onClick={() => setResetOpen(true)}
              >
                <RotateCcw className="h-3.5 w-3.5" />
                Reset Demo Data
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>
                  Choose how and when Supportly notifies you about ticket activity and SLA alerts.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="gap-1.5 h-8 text-xs"
                  onClick={() => {
                    addNotification(
                      "⚡ Urgent SLA Alert",
                      "Ticket #TCK-1001 requires immediate attention (SLA expires in 30 minutes)",
                      "sla",
                      "/tickets"
                    );
                    toast.success("Test notification sent! Check the bell icon in the top navbar.");
                  }}
                >
                  <Bell className="h-3.5 w-3.5 text-primary" />
                  Send Test Alert
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between gap-2 rounded-lg bg-muted/40 p-2 text-xs">
                <span className="text-muted-foreground font-medium">Quick Presets:</span>
                <div className="flex items-center gap-1.5">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px]"
                    onClick={() => {
                      updateNotificationSettings({
                        emailNewTicket: true,
                        emailAssigned: true,
                        emailMentioned: true,
                        slaBreachAlerts: true,
                        pushDesktop: true,
                        dailyDigest: true,
                        soundEffects: true,
                      });
                      toast.success("All notifications enabled");
                    }}
                  >
                    Enable All
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-[11px] text-muted-foreground"
                    onClick={() => {
                      updateNotificationSettings({
                        emailNewTicket: false,
                        emailAssigned: false,
                        emailMentioned: false,
                        slaBreachAlerts: false,
                        pushDesktop: false,
                        dailyDigest: false,
                        soundEffects: false,
                      });
                      toast.info("All notifications muted");
                    }}
                  >
                    Mute All
                  </Button>
                </div>
              </div>

              {(
                [
                  {
                    key: "emailNewTicket",
                    title: "New ticket created",
                    desc: "Receive an email when a new support ticket enters the intake queue.",
                  },
                  {
                    key: "emailAssigned",
                    title: "Ticket assigned to me",
                    desc: "Get notified immediately when a ticket is assigned or escalated to you.",
                  },
                  {
                    key: "emailMentioned",
                    title: "Mentions in internal notes",
                    desc: "Notify when a teammate @mentions you inside a private ticket note.",
                  },
                  {
                    key: "slaBreachAlerts",
                    title: "Urgent SLA breach warnings",
                    desc: "High-priority alerts 30 minutes before an SLA deadline expires.",
                  },
                  {
                    key: "pushDesktop",
                    title: "Browser push notifications",
                    desc: "Show real-time desktop banners for incoming Live Chat messages.",
                  },
                  {
                    key: "dailyDigest",
                    title: "Daily operations digest",
                    desc: "Morning summary of open queue, resolution rate, and CSAT scores.",
                  },
                  {
                    key: "soundEffects",
                    title: "Subtle notification sounds",
                    desc: "Play a soft chime when new messages arrive in Inbox.",
                  },
                ] as const
              ).map((item, idx) => (
                <React.Fragment key={item.key}>
                  {idx > 0 && <Separator />}
                  <div className="flex items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-medium">{item.title}</p>
                      <p className="text-xs text-muted-foreground">{item.desc}</p>
                    </div>
                    <Switch
                      checked={settings.notifications[item.key]}
                      onCheckedChange={(checked) => {
                        updateNotificationSettings({ [item.key]: checked });
                        toast.success("Notification preference saved");
                      }}
                    />
                  </div>
                </React.Fragment>
              ))}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Tab */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance & Theme</CardTitle>
              <CardDescription>
                Customize how Supportly looks on your screen. Changes apply immediately.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2.5">
                <Label>Interface Theme</Label>
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    {
                      value: "light",
                      label: "Light",
                      desc: "Crisp daylight surfaces",
                      icon: Sun,
                    },
                    {
                      value: "dark",
                      label: "Dark",
                      desc: "Low-glare obsidian mode",
                      icon: Moon,
                    },
                    {
                      value: "system",
                      label: "System",
                      desc: "Match OS preference",
                      icon: Monitor,
                    },
                  ].map((option) => {
                    const Icon = option.icon;
                    const active = mounted && theme === option.value;
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => {
                          setTheme(option.value);
                          toast.success(`Theme switched to ${option.label}`);
                        }}
                        className={cn(
                          "flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all cursor-pointer",
                          active
                            ? "border-primary bg-primary/[0.06] ring-1 ring-primary/30"
                            : "border-border bg-card hover:border-primary/40"
                        )}
                      >
                        <div
                          className={cn(
                            "flex h-9 w-9 items-center justify-center rounded-lg",
                            active
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary text-muted-foreground"
                          )}
                        >
                          <Icon className="h-4 w-4" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold">{option.label}</p>
                          <p className="text-xs text-muted-foreground">
                            {option.desc}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              <Separator />

              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-medium">Compact Layout Density</p>
                  <p className="text-xs text-muted-foreground">
                    Display more ticket rows and denser controls across tables.
                  </p>
                </div>
                <Switch
                  checked={settings.compactDensity}
                  onCheckedChange={(checked) => {
                    setCompactDensity(checked);
                    toast.success(
                      checked ? "Compact density enabled" : "Default density restored"
                    );
                  }}
                />
              </div>

              <div className="rounded-xl border border-border/80 bg-muted/20 p-3.5 space-y-2">
                <p className="text-xs font-semibold text-foreground">Live Density Preview</p>
                <div className="rounded-lg border border-border bg-card divide-y divide-border text-xs">
                  <div className={cn("flex items-center justify-between px-3 transition-all", settings.compactDensity ? "py-1.5" : "py-3")}>
                    <span className="font-mono font-medium text-primary">#TCK-1001</span>
                    <span className="text-foreground font-medium">SSO SAML configuration failure</span>
                    <span className="text-muted-foreground text-[11px]">2m ago</span>
                  </div>
                  <div className={cn("flex items-center justify-between px-3 transition-all", settings.compactDensity ? "py-1.5" : "py-3")}>
                    <span className="font-mono font-medium text-primary">#TCK-1002</span>
                    <span className="text-foreground font-medium">Webhook delivery timeout</span>
                    <span className="text-muted-foreground text-[11px]">14m ago</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <ConfirmDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        title="Reset all demo data?"
        description="This will restore all initial mock tickets, customers, inbox messages, and settings."
        confirmLabel="Reset Data"
        destructive
        onConfirm={() => {
          resetDemoData();
          toast.success("Workspace restored to fresh demo data");
        }}
      />
    </div>
  );
}
