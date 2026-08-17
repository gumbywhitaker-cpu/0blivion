"use client";

import * as React from "react";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Modal, ConfirmationModal } from "@/components/ui/Modal";
import { FormField, Input, Select } from "@/components/ui/Field";
import { Badge } from "@/components/ui/Badge";
import { useToast } from "@/components/ui/Toast";
import { ROLE_LABELS, type Role } from "@/lib/permissions";
import { UserPlus, Trash2 } from "lucide-react";

type Member = {
  id: string;
  userId: string;
  name: string;
  email: string;
  role: string;
  status: string;
};

const INVITABLE_ROLES: Exclude<Role, "OWNER">[] = ["ADMIN", "MANAGER", "STAFF", "READ_ONLY"];

export function TeamClient({
  members: initialMembers,
  currentUserId,
  userLimit,
  planName,
}: {
  members: Member[];
  currentUserId: string;
  userLimit: number;
  planName: string;
}) {
  const toast = useToast();
  const [members, setMembers] = React.useState(initialMembers);
  const [inviteOpen, setInviteOpen] = React.useState(false);
  const [removeTarget, setRemoveTarget] = React.useState<Member | null>(null);
  const [inviting, setInviting] = React.useState(false);
  const [removing, setRemoving] = React.useState(false);
  const [form, setForm] = React.useState({ name: "", email: "", role: "STAFF" as Role });

  const atLimit = members.length >= userLimit;

  async function invite(e: React.FormEvent) {
    e.preventDefault();
    setInviting(true);
    try {
      const res = await fetch("/api/team", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? "Couldn't invite that person.", "error");
        return;
      }
      setMembers((m) => [
        ...m,
        {
          id: data.member.id,
          userId: data.member.userId,
          name: form.name,
          email: form.email,
          role: data.member.role,
          status: data.member.status,
        },
      ]);
      setInviteOpen(false);
      setForm({ name: "", email: "", role: "STAFF" });
      if (data.devSetPasswordUrl) {
        toast.push(`Dev mode — set-password link: ${data.devSetPasswordUrl}`, "info");
      } else {
        toast.push("Invite sent.", "success");
      }
    } finally {
      setInviting(false);
    }
  }

  async function updateRole(member: Member, role: string) {
    const res = await fetch(`/api/team/${member.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.push(data.error ?? "Couldn't update role.", "error");
      return;
    }
    setMembers((m) => m.map((x) => (x.id === member.id ? { ...x, role } : x)));
    toast.push("Role updated.", "success");
  }

  async function confirmRemove() {
    if (!removeTarget) return;
    setRemoving(true);
    try {
      const res = await fetch(`/api/team/${removeTarget.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        toast.push(data.error ?? "Couldn't remove team member.", "error");
        return;
      }
      setMembers((m) => m.filter((x) => x.id !== removeTarget.id));
      toast.push("Team member removed.", "success");
      setRemoveTarget(null);
    } finally {
      setRemoving(false);
    }
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader
          title="Team members"
          subtitle={`${members.length} of ${userLimit} included on the ${planName} plan`}
          action={
            <Button
              size="sm"
              icon={<UserPlus className="size-4" />}
              onClick={() => setInviteOpen(true)}
              disabled={atLimit}
            >
              Invite
            </Button>
          }
        />
        <div className="divide-y divide-border">
          {members.map((member) => (
            <div key={member.id} className="flex items-center justify-between gap-3 py-3">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium text-foreground">{member.name}</p>
                <p className="truncate text-sm text-muted">{member.email}</p>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {member.status === "INVITED" && <Badge tone="warning">Invited</Badge>}
                {member.role === "OWNER" ? (
                  <Badge tone="brand">Owner</Badge>
                ) : (
                  <Select
                    value={member.role}
                    onChange={(e) => updateRole(member, e.target.value)}
                    className="h-9 w-36"
                  >
                    {INVITABLE_ROLES.map((r) => (
                      <option key={r} value={r}>
                        {ROLE_LABELS[r]}
                      </option>
                    ))}
                  </Select>
                )}
                {member.role !== "OWNER" && member.userId !== currentUserId && (
                  <button
                    onClick={() => setRemoveTarget(member)}
                    className="rounded-full p-1.5 text-muted hover:bg-danger-light hover:text-danger"
                    aria-label={`Remove ${member.name}`}
                  >
                    <Trash2 className="size-4" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
        {atLimit && (
          <p className="mt-3 text-sm text-muted">
            You&apos;ve reached the {userLimit}-user limit on the {planName} plan.{" "}
            <a href="/app/settings/billing" className="font-medium text-brand underline">
              Upgrade
            </a>{" "}
            to add more people.
          </p>
        )}
      </Card>

      <Modal
        open={inviteOpen}
        onClose={() => setInviteOpen(false)}
        title="Invite a team member"
        description="They'll get an email to set their password and join your business."
      >
        <form onSubmit={invite} className="space-y-4">
          <FormField label="Name" htmlFor="invite-name">
            <Input
              id="invite-name"
              required
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
            />
          </FormField>
          <FormField label="Email" htmlFor="invite-email">
            <Input
              id="invite-email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
            />
          </FormField>
          <FormField label="Role" htmlFor="invite-role">
            <Select
              id="invite-role"
              value={form.role}
              onChange={(e) => setForm((f) => ({ ...f, role: e.target.value as Role }))}
            >
              {INVITABLE_ROLES.map((r) => (
                <option key={r} value={r}>
                  {ROLE_LABELS[r]}
                </option>
              ))}
            </Select>
          </FormField>
          <div className="flex justify-end gap-3 pt-1">
            <Button type="button" variant="outline" onClick={() => setInviteOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" loading={inviting}>
              Send invite
            </Button>
          </div>
        </form>
      </Modal>

      <ConfirmationModal
        open={Boolean(removeTarget)}
        onClose={() => setRemoveTarget(null)}
        onConfirm={confirmRemove}
        title="Remove team member"
        description={`${removeTarget?.name} will lose access to this business immediately.`}
        confirmLabel="Remove"
        danger
        loading={removing}
      />
    </div>
  );
}
