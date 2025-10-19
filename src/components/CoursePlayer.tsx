import { useCallback, useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { motion } from "framer-motion";
import { Textarea } from "@/components/ui/textarea";

type Module = { id: string; course_id: string; title: string };
type Lesson = { id: string; module_id: string; title: string; video_url?: string | null; notes?: string | null };

const CoursePlayer = ({ courseId }: { courseId: string }) => {
  const { toast } = useToast();
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [progressPercent, setProgressPercent] = useState(0);
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [reflectionNotes, setReflectionNotes] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem(`course_${courseId}_notes`);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });

  const load = useCallback(async () => {
    const { data: mods, error } = await supabase.from("modules").select("id, course_id, title").eq("course_id", courseId).order("position");
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });
    setModules((mods || []) as Module[]);
  }, [courseId, toast]);

  useEffect(() => { load(); }, [load]);

  const handleLoadLessons = async (moduleId: string) => {
    const { data, error } = await supabase.from("lessons").select("id, module_id, title, video_url, notes").eq("module_id", moduleId).order("position");
    if (error) return toast({ title: "Error loading lessons", description: error.message, variant: "destructive" });
    setLessonsByModule((prev) => ({ ...prev, [moduleId]: (data || []) as Lesson[] }));
  };

  const recompute = useCallback(async () => {
    const { data: userData } = await supabase.auth.getUser();
    const studentId = userData?.user?.id;
    if (!studentId) return;
    const { data: lessonIds } = await supabase.from("lessons").select("id").in("module_id", (modules || []).map(m => m.id));
    const ids = (lessonIds || []).map(l => l.id);
    if (ids.length === 0) { setProgressPercent(0); return; }
    const { data: progresses } = await supabase.from("lesson_progress").select("lesson_id, progress_percent").in("lesson_id", ids).eq("student_id", studentId);
    const total = ids.length;
    const completed = (progresses || []).filter((p: any) => (p.progress_percent || 0) >= 100).length;
    setProgressPercent(Math.round((completed / Math.max(total, 1)) * 100));
  }, [modules]);

  useEffect(() => { recompute(); }, [recompute, modules]);

  const handleCompleteLesson = async (lessonId: string, lessonTitle: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const studentId = userData?.user?.id;
    if (!studentId) return toast({ title: "Not signed in", description: "Please log in again.", variant: "destructive" });

    const { error } = await supabase.from("lesson_progress").upsert({
      lesson_id: lessonId,
      student_id: studentId,
      completed_video: true,
      completed_notes: true,
      completed_quiz: true,
      progress_percent: 100,
    }, { onConflict: "lesson_id,student_id" });

    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });

    // Award XP
    await supabase.from("xp_events").insert({
      student_id: studentId,
      xp: 10,
      reason: `Completed lesson: ${lessonTitle}`,
      program: "Software Development" // TODO: get from course
    });

    await recompute();
    toast({ title: "+10 XP", description: "Lesson completed!" });
  };

  const saveNotes = (moduleId: string, notes: string) => {
    const updated = { ...reflectionNotes, [moduleId]: notes };
    setReflectionNotes(updated);
    try {
      localStorage.setItem(`course_${courseId}_notes`, JSON.stringify(updated));
    } catch {}
  };

  const nextModule = () => {
    if (currentModuleIndex < modules.length - 1) {
      setCurrentModuleIndex(currentModuleIndex + 1);
    }
  };

  const prevModule = () => {
    if (currentModuleIndex > 0) {
      setCurrentModuleIndex(currentModuleIndex - 1);
    }
  };

  const currentModule = modules[currentModuleIndex];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Course Player</CardTitle>
        <div className="mb-4">
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs text-muted-foreground">Overall Progress</span>
            <span className="text-xs font-medium">{progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="mb-2" />
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Module {currentModuleIndex + 1} of {modules.length}</span>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={prevModule} disabled={currentModuleIndex === 0}>
                Previous
              </Button>
              <Button size="sm" variant="outline" onClick={nextModule} disabled={currentModuleIndex === modules.length - 1}>
                Next
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {currentModule && (
          <motion.div key={currentModule.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="bg-muted/30">
              <CardHeader>
                <CardTitle className="text-lg">{currentModule.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <Button size="sm" variant="secondary" className="rounded-xl mb-4" onClick={() => handleLoadLessons(currentModule.id)}>
                  Load Lessons
                </Button>

                <div className="relative pl-4">
                  <div className="absolute left-1 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#74a2ff] via-[#0747A1] to-transparent rounded-full opacity-70" />
                  <div className="grid gap-3">
                    {(lessonsByModule[currentModule.id] || []).map((l) => (
                      <motion.div key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="relative p-4 pl-6 rounded-lg border bg-background">
                        <span className="absolute left-0 top-5 -ml-[5px] h-3 w-3 rounded-full bg-[#74a2ff] shadow-[0_0_10px_2px_rgba(7,71,161,0.35)]" />
                        <div className="flex items-center justify-between gap-3 mb-2">
                          <span className="font-medium text-base">{l.title}</span>
                          <Button size="sm" className="rounded-xl bg-[#0747A1] text-white" onClick={() => handleCompleteLesson(l.id, l.title)}>
                            Complete Lesson
                          </Button>
                        </div>

                        {(l.video_url || l.notes) && (
                          <div className="mt-3 text-sm text-muted-foreground space-y-2">
                            {l.video_url && (
                              <div>
                                <a href={l.video_url} target="_blank" rel="noreferrer" className="underline text-[#0747A1] hover:text-[#063d8c]">
                                  Watch Video
                                </a>
                              </div>
                            )}
                            {l.notes && (
                              <div>
                                <span className="inline-block max-w-full truncate" title={l.notes}>
                                  {l.notes.startsWith('File:') ? 'Download Resource' : l.notes}
                                </span>
                              </div>
                            )}
                          </div>
                        )}
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* Reflection Notes */}
                <div className="mt-6">
                  <label className="block text-sm font-medium mb-2">Reflection Notes</label>
                  <Textarea
                    placeholder="Jot down your thoughts, key takeaways, or questions..."
                    value={reflectionNotes[currentModule.id] || ""}
                    onChange={(e) => saveNotes(currentModule.id, e.target.value)}
                    rows={4}
                    className="resize-none"
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </CardContent>
    </Card>
  );
};

export default CoursePlayer;


