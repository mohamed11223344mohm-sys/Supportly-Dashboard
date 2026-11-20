"use client";

import * as React from "react";
import { toast } from "sonner";
import { Check, Clock, Percent, Sparkles, Star, Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
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
import type { Agent, AgentRole, AgentStatus } from "@/types";

const AVATAR_COLORS = [
  { label: "Indigo", value: "bg-indigo-600" },
  { label: "Emerald", value: "bg-emerald-600" },
  { label: "Violet", value: "bg-violet-600" },
  { label: "Sky", value: "bg-sky-600" },
  { label: "Amber", value: "bg-amber-600" },
  { label: "Rose", value: "bg-rose-600" },
  { label: "Teal", value: "bg-teal-600" },
];

export function EditAgentDialog({
  agent,
  open,
  onOpenChange,
  activeTicketsCount = 0,
}: {
  agent: Agent | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  activeTicketsCount?: number;
}) {
  const updateAgent = useSupportStore((s) => s.updateAgent);
  const deleteAgent = useSupportStore((s) => s.deleteAgent);
  const totalAgents = useSupportStore((s) => s.agents.length);

  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [role, setRole] = React.useState<AgentRole>("Support Agent");
  const [department, setDepartment] = React.useState("Customer Support");
  const [status, setStatus] = React.useState<AgentStatus>("online");
  const [avatarColor, setAvatarColor] = React.useState("bg-indigo-600");
  const [maxCapacity, setMaxCapacity] = React.useState<number>(8);
  const [csatScore, setCsatScore] = React.useState<number>(4.8);
  const [avgResponseMinutes, setAvgResponseMinutes] = React.useState<number>(18);
  const [resolutionRate, setResolutionRate] = React.useState<number>(90);
  const [skillsInput, setSkillsInput] = React.useState("");
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (!agent) return;
    setName(agent.name);
    setEmail(agent.email);
    setRole(agent.role);
    setDepartment(agent.department);
    setStatus(agent.status);
    setAvatarColor(agent.avatarColor || "bg-indigo-600");
    setMaxCapacity(agent.maxCapacity || 8);
    setCsatScore(agent.csatScore || 4.8);
    setAvgResponseMinutes(agent.avgResponseMinutes || 18);
    setResolutionRate(agent.resolutionRate || 90);
    setSkillsInput(agent.skills ? agent.skills.join(", ") : "");
  }, [agent, open]);

  if (!agent) return null;

  const previewPct = Math.min(
    100,
    Math.round((activeTicketsCount / Math.max(1, maxCapacity)) * 100)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error("Please provide an agent name");
      return;
    }

    const skills = skillsInput
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    updateAgent(agent.id, {
      name: name.trim(),
      email: email.trim(),
      role,
      department: department.trim(),
      status,
      avatarColor,
      maxCapacity: Math.min(25, Math.max(1, Number(maxCapacity) || 8)),
      csatScore: Math.min(5.0, Math.max(1.0, Number(csatScore) || 4.8)),
      avgResponseMinutes: Math.max(1, Number(avgResponseMinutes) || 18),
      resolutionRate: Math.min(100, Math.max(1, Number(resolutionRate) || 90)),
      skills: skills.length > 0 ? skills : agent.skills,
    });

    toast.success(`Updated ${name.trim()} successfully!`);
    onOpenChange(false);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-xl max-h-[88vh] overflow-y-auto pr-2">
          <DialogHeader>
            <DialogTitle>Edit Team Member</DialogTitle>
            <DialogDescription>
              Modify profile details, queue capacity limits, and performance targets.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 pt-1">
            {/* Live Profile Header Preview & Avatar Accent Picker */}
            <div className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border/70 bg-muted/20 p-3.5">
              <div className="flex items-center gap-3.5">
                <UserAvatar
                  name={name || agent.name}
                  color={avatarColor}
                  size="lg"
                  status={status}
                />
                <div>
                  <p className="text-sm font-semibold">{name || agent.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {role} · {department}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {activeTicketsCount} active tickets currently assigned
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-[10px] uppercase font-semibold text-muted-foreground">
                  Avatar Color
                </Label>
                <div className="flex items-center gap-1.5">
                  {AVATAR_COLORS.map((c) => (
                    <button
                      key={c.value}
                      type="button"
                      onClick={() => setAvatarColor(c.value)}
                      className={cn(
                        "flex h-5 w-5 items-center justify-center rounded-full transition-all cursor-pointer",
                        c.value,
                        avatarColor === c.value
                          ? "ring-2 ring-primary ring-offset-2 scale-110"
                          : "opacity-80 hover:opacity-100 hover:scale-105"
                      )}
                      title={c.label}
                    >
                      {avatarColor === c.value && (
                        <Check className="h-2.5 w-2.5 text-white" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label htmlFor="agent-name">Full Name</Label>
                <Input
                  id="agent-name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Sarah Chen"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="agent-email">Work Email</Label>
                <Input
                  id="agent-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="sarah@supportly.io"
                />
              </div>

              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={role}
                  onValueChange={(v) => setRole(v as AgentRole)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Support Lead">Support Lead</SelectItem>
                    <SelectItem value="Senior Agent">Senior Agent</SelectItem>
                    <SelectItem value="Technical Specialist">
                      Technical Specialist
                    </SelectItem>
                    <SelectItem value="Support Agent">Support Agent</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="agent-dept">Department</Label>
                <Input
                  id="agent-dept"
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  placeholder="Enterprise Support"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label>Availability Status</Label>
              <Select
                value={status}
                onValueChange={(v) => setStatus(v as AgentStatus)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="online">Online (Available)</SelectItem>
                  <SelectItem value="busy">Busy (In Escalation)</SelectItem>
                  <SelectItem value="away">Away (Break)</SelectItem>
                  <SelectItem value="offline">Offline</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Dynamic Queue Capacity & Progress Bar Controller */}
            <div className="rounded-xl border border-primary/20 bg-primary/[0.03] p-3.5 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold text-foreground">
                    Queue Max Capacity (Progress Limit)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Sets the ticket threshold used to calculate the capacity progress bar.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 font-mono text-sm font-semibold">
                  <span>{maxCapacity}</span>
                  <span className="text-xs text-muted-foreground font-normal">
                    tickets
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1"
                  max="20"
                  step="1"
                  value={maxCapacity}
                  onChange={(e) => setMaxCapacity(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer accent-primary"
                />
                <Input
                  type="number"
                  min="1"
                  max="25"
                  value={maxCapacity}
                  onChange={(e) =>
                    setMaxCapacity(
                      Math.max(1, Math.min(25, Number(e.target.value) || 1))
                    )
                  }
                  className="h-8 w-18 font-mono text-xs text-center"
                />
              </div>

              {/* Live Progress Preview */}
              <div className="pt-1 space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted-foreground">Live Progress Preview:</span>
                  <span className="font-mono font-medium text-foreground">
                    {activeTicketsCount} / {maxCapacity} active ({previewPct}%)
                  </span>
                </div>
                <Progress
                  value={previewPct}
                  indicatorClassName={
                    previewPct >= 85
                      ? "bg-rose-500"
                      : previewPct >= 60
                      ? "bg-amber-500"
                      : "bg-indigo-500"
                  }
                />
              </div>
            </div>

            {/* Dynamic CSAT Score Controller */}
            <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3.5">
              <div className="flex items-center justify-between">
                <div>
                  <Label className="text-xs font-semibold text-foreground">
                    Customer Satisfaction (CSAT Target)
                  </Label>
                  <p className="text-[11px] text-muted-foreground">
                    Baseline rating used for performance reports and team metrics.
                  </p>
                </div>
                <div className="flex items-center gap-1 font-mono text-sm font-semibold">
                  <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" />
                  <span>{Number(csatScore).toFixed(1)} / 5.0</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <input
                  type="range"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={csatScore}
                  onChange={(e) => setCsatScore(Number(e.target.value))}
                  className="h-2 w-full cursor-pointer accent-amber-500"
                />
                <Input
                  type="number"
                  min="1.0"
                  max="5.0"
                  step="0.1"
                  value={csatScore}
                  onChange={(e) =>
                    setCsatScore(
                      Math.min(5.0, Math.max(1.0, Number(e.target.value) || 1.0))
                    )
                  }
                  className="h-8 w-18 font-mono text-xs text-center"
                />
              </div>
            </div>

            {/* Speed & Resolution Targets */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div className="space-y-1.5 rounded-xl border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Clock className="h-3.5 w-3.5 text-sky-500" />
                  <Label>Avg Response Time</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={240}
                    value={avgResponseMinutes}
                    onChange={(e) =>
                      setAvgResponseMinutes(Math.max(1, Number(e.target.value) || 1))
                    }
                    className="h-8 font-mono text-xs"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">mins</span>
                </div>
              </div>

              <div className="space-y-1.5 rounded-xl border border-border p-3">
                <div className="flex items-center gap-1.5 text-xs font-semibold">
                  <Percent className="h-3.5 w-3.5 text-emerald-500" />
                  <Label>Resolution Rate</Label>
                </div>
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={resolutionRate}
                    onChange={(e) =>
                      setResolutionRate(
                        Math.min(100, Math.max(1, Number(e.target.value) || 1))
                      )
                    }
                    className="h-8 font-mono text-xs"
                  />
                  <span className="text-xs text-muted-foreground shrink-0">%</span>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="agent-skills">Skills (comma separated)</Label>
              <Input
                id="agent-skills"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                placeholder="Enterprise SSO, Billing, Webhooks"
              />
            </div>

            <DialogFooter className="flex flex-row items-center justify-between sm:justify-between pt-2">
              {totalAgents > 1 ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-destructive hover:bg-destructive/10"
                  onClick={() => setDeleteConfirmOpen(true)}
                >
                  <Trash2 className="h-3.5 w-3.5 mr-1" />
                  Remove
                </Button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Cancel
                </Button>
                <Button type="submit">Save Changes</Button>
              </div>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={deleteConfirmOpen}
        onOpenChange={setDeleteConfirmOpen}
        title={`Remove ${agent.name} from team?`}
        description="Their assigned tickets will be moved back to the unassigned queue. This action cannot be undone."
        confirmLabel="Remove Agent"
        destructive
        onConfirm={() => {
          deleteAgent(agent.id);
          toast.success(`${agent.name} was removed from the team`);
          onOpenChange(false);
        }}
      />
    </>
  );
}
