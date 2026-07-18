"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Send } from "lucide-react";

import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { initials, formatDate } from "@/lib/utils";

export interface CommentItem {
  id: string;
  body: string;
  createdAt: string | Date;
  author: { firstName: string | null; lastName: string | null; email: string };
}

export function CommentsPanel({ loanRequestId, comments }: { loanRequestId: string; comments: CommentItem[] }) {
  const router = useRouter();
  const [body, setBody] = React.useState("");
  const [submitting, setSubmitting] = React.useState(false);

  async function submit() {
    if (!body.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ loanRequestId, body }),
      });
      if (!res.ok) throw new Error();
      setBody("");
      router.refresh();
    } catch {
      toast.error("Failed to post comment");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {comments.map((comment) => {
          const name = `${comment.author.firstName ?? ""} ${comment.author.lastName ?? ""}`.trim() || comment.author.email;
          return (
            <div key={comment.id} className="flex gap-3">
              <Avatar className="size-8">
                <AvatarFallback>{initials(name)}</AvatarFallback>
              </Avatar>
              <div className="flex-1 rounded-lg border p-3">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-medium">{name}</span>
                  <span className="text-muted-foreground text-xs">{formatDate(comment.createdAt)}</span>
                </div>
                <p className="text-sm">{comment.body}</p>
              </div>
            </div>
          );
        })}
        {comments.length === 0 && <p className="text-muted-foreground text-sm">No comments yet.</p>}
      </div>
      <div className="flex gap-2">
        <Textarea value={body} onChange={(e) => setBody(e.target.value)} placeholder="Leave a comment…" rows={2} />
        <Button onClick={submit} disabled={submitting || !body.trim()} size="icon">
          <Send className="size-4" />
        </Button>
      </div>
    </div>
  );
}
