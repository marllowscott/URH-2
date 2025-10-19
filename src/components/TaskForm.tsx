import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";

type Props = { onCreated?: () => void };

const programs = ["Software Development", "Digital Marketing", "Product Design"] as const;

const TaskForm = ({ onCreated }: Props) => {
  const { toast } = useToast();
  const [program, setProgram] = useState<(typeof programs)[number]>("Software Development");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [schedule, setSchedule] = useState("daily");
  const [xpReward, setXpReward] = useState(10);
  const [dueAt, setDueAt] = useState("");
  const [attachmentUrl, setAttachmentUrl] = useState("");

  const handleSubmit = async () => {
    if (!title.trim()) return;
    const { error } = await supabase.from("tasks").insert({
      program,
      title: title.trim(),
      description: description || null,
      schedule,
      due_at: dueAt ? new Date(dueAt).toISOString() : null,
      xp_reward: Number(xpReward) || 0,
      attachment_url: attachmentUrl || null,
    });
    if (error) return toast({ title: "Create task failed", description: error.message, variant: "destructive" });
    toast({ title: "Task created" });
    setTitle(""); setDescription(""); setAttachmentUrl(""); setDueAt(""); setXpReward(10);
    onCreated?.();
  };

  return (
    <div className="space-y-4">
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <Label>Program</Label>
          <Select value={program} onValueChange={(v) => setProgram(v as any)}>
            <SelectTrigger><SelectValue placeholder="Select program" /></SelectTrigger>
            <SelectContent>
              {programs.map(p => (<SelectItem key={p} value={p}>{p}</SelectItem>))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Title</Label>
          <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Task title" />
        </div>
        <div className="md:col-span-2">
          <Label>Description</Label>
          <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Short description" />
        </div>
        <div>
          <Label>Schedule</Label>
          <Select value={schedule} onValueChange={setSchedule}>
            <SelectTrigger><SelectValue placeholder="Schedule" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="daily">Daily</SelectItem>
              <SelectItem value="weekly">Weekly</SelectItem>
              <SelectItem value="monthly">Monthly</SelectItem>
              <SelectItem value="ad-hoc">Ad-hoc</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>XP Reward</Label>
          <Input type="number" value={xpReward} onChange={(e) => setXpReward(Number(e.target.value || 0))} />
        </div>
        <div>
          <Label>Due At</Label>
          <Input type="datetime-local" value={dueAt} onChange={(e) => setDueAt(e.target.value)} />
        </div>
        <div className="md:col-span-2">
          <Label>Attachment URL (optional)</Label>
          <Input value={attachmentUrl} onChange={(e) => setAttachmentUrl(e.target.value)} placeholder="https://..." />
        </div>
      </div>
      <Button className="rounded-xl bg-[#0747A1] text-white" onClick={handleSubmit}>Create Task</Button>
    </div>
  );
};

export default TaskForm;


