"use client";

import * as React from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Field";
import { useToast } from "@/components/ui/Toast";

export function AIMessageModal({
  open,
  onClose,
  actionId,
  recipientName,
  initialMessage,
  onChanged,
}: {
  open: boolean;
  onClose: () => void;
  actionId: string;
  recipientName: string;
  initialMessage: string;
  onChanged?: () => void;
}) {
  const { push } = useToast();
  // Rendered with key={actionId} by the caller, so a fresh instance (and
  // fresh state) is mounted whenever the underlying action changes — no
  // effect needed to resync `message` with `initialMessage`.
  const [message, setMessage] = React.useState(initialMessage);
  const [sending, setSending] = React.useState(false);
  const [scheduling, setScheduling] = React.useState(false);

  async function send() {
    setSending(true);
    try {
      const res = await fetch(`/api/ai-actions/${actionId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });
      const data = await res.json();
      if (!res.ok) {
        push(data.error ?? "Couldn't send that message.", "error");
        return;
      }
      if (data.deliveryStatus === "NOT_CONFIGURED") {
        push("Message saved and marked as sent — email delivery isn't configured yet, so send it yourself via your usual channel.", "info");
      } else {
        push("Message sent.", "success");
      }
      onClose();
      onChanged?.();
    } finally {
      setSending(false);
    }
  }

  async function scheduleForTomorrow() {
    setScheduling(true);
    try {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      await fetch(`/api/ai-actions/${actionId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ suggestedMessage: message, scheduledFor: tomorrow.toISOString() }),
      });
      push("Scheduled — we'll bring this back up tomorrow.", "success");
      onClose();
      onChanged?.();
    } finally {
      setScheduling(false);
    }
  }

  async function dismiss() {
    await fetch(`/api/ai-actions/${actionId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "DISMISSED" }),
    });
    onClose();
    onChanged?.();
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={`Message to ${recipientName}`}
      description="Review and edit before sending. Nothing goes out until you approve it."
      size="md"
      footer={
        <>
          <Button variant="ghost" onClick={dismiss}>
            Dismiss
          </Button>
          <Button variant="outline" onClick={scheduleForTomorrow} loading={scheduling}>
            Schedule for tomorrow
          </Button>
          <Button onClick={send} loading={sending}>
            Send
          </Button>
        </>
      }
    >
      <Textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={6}
        className="mt-1"
      />
    </Modal>
  );
}
