import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Mail, Save, User } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { displayName, STATUSES, STATUS_LABEL, type Feedback, type FeedbackStatus } from "@/lib/feedback";
import { StatusBadge, Stars } from "@/components/feedback-ui";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function FeedbackDetailDialog({
  feedback,
  onOpenChange,
}: {
  feedback: Feedback | null;
  onOpenChange: (open: boolean) => void;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState<FeedbackStatus>("pending");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (feedback) {
      setStatus(feedback.status);
      setReply(feedback.admin_response ?? "");
    }
  }, [feedback]);

  const save = async (nextStatus: FeedbackStatus) => {
    if (!feedback) return;
    if (reply.length > 2000) {
      toast.error("Response must be under 2000 characters");
      return;
    }
    setBusy(true);
    const trimmed = reply.trim();
    const replyChanged = trimmed !== (feedback.admin_response ?? "");
    const { error } = await supabase
      .from("feedback")
      .update({
        status: nextStatus,
        admin_response: trimmed || null,
        responded_at: replyChanged ? (trimmed ? new Date().toISOString() : null) : feedback.responded_at,
      })
      .eq("id", feedback.id);
    setBusy(false);
    if (error) {
      toast.error("Couldn't save changes", { description: error.message });
      return;
    }
    await queryClient.invalidateQueries({ queryKey: ["feedback"] });
    if (nextStatus !== feedback.status) {
      if (nextStatus === "resolved") toast.success("Feedback marked as resolved");
      else if (nextStatus === "reviewed") toast.info("Feedback marked as reviewed");
      else toast("Feedback moved back to pending");
    } else toast.success("Changes saved");
    onOpenChange(false);
  };

  const f = feedback;
  return (
    <Dialog open={!!f} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        {f && (
          <>
            <DialogHeader>
              <DialogTitle className="flex flex-wrap items-center gap-2 font-display text-xl">
                {f.topic} <StatusBadge status={f.status} />
              </DialogTitle>
              <DialogDescription>Submitted {format(new Date(f.created_at), "d MMM yyyy 'at' HH:mm")}</DialogDescription>
            </DialogHeader>

            <div className="grid gap-3 rounded-xl bg-muted p-4 text-sm sm:grid-cols-2">
              <p className="flex items-center gap-2"><User className="h-4 w-4 text-muted-foreground" /> {displayName(f)}</p>
              <p className="flex items-center gap-2 truncate"><Mail className="h-4 w-4 text-muted-foreground" /> {f.is_anonymous ? "Hidden" : f.email}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
              {[
                ["Rating", f.rating],
                ["Teaching", f.teaching_rating],
                ["Facilities", f.facilities_rating],
                ["Support", f.support_rating],
                ["Overall", f.overall_rating],
              ].map(([label, v]) => (
                <div key={label} className="rounded-lg border p-2.5 text-center">
                  <p className="text-xs text-muted-foreground">{label}</p>
                  <p className="text-lg font-semibold">{v}/5</p>
                  <Stars value={Number(v)} className="[&_svg]:h-3 [&_svg]:w-3" />
                </div>
              ))}
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wide text-muted-foreground">Message</Label>
              <p className="mt-1 whitespace-pre-wrap rounded-xl border p-4 text-sm">{f.message}</p>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="reply">Admin response</Label>
              <Textarea id="reply" rows={4} maxLength={2000} value={reply} onChange={(e) => setReply(e.target.value)} placeholder="Write a reply the student will see…" />
              <p className="text-right text-xs text-muted-foreground">{reply.length}/2000</p>
            </div>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="space-y-1.5 sm:w-44">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as FeedbackStatus)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => <SelectItem key={s} value={s}>{STATUS_LABEL[s]}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:justify-end">
                <Button variant="outline" disabled={busy} onClick={() => save(status)}>
                  {busy ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />} Save
                </Button>
                {f.status !== "resolved" && (
                  <Button disabled={busy} onClick={() => save("resolved")} className="bg-success text-success-foreground hover:bg-success/90">
                    <CheckCircle2 className="mr-2 h-4 w-4" /> Mark resolved
                  </Button>
                )}
              </div>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
