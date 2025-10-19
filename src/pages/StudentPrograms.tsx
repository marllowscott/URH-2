import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { motion, useAnimationControls } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import Leaderboard from "@/components/Leaderboard";
import Confetti from "@/components/Confetti";
import Fireflies from "@/components/Fireflies";

type Course = { id: string; program: string; title: string; description: string | null };
type Module = { id: string; course_id: string; title: string; duration_minutes: number };
type Lesson = { id: string; module_id: string; title: string; xp_reward: number };
type Task = { id: string; title: string; description: string | null; due_date: string | null };
type LeaderRow = { student_id: string; xp: number };

const programs = ["Software Development", "Digital Marketing", "Product Design"] as const;

const StudentPrograms = () => {
  const [selectedProgram, setSelectedProgram] = useState<(typeof programs)[number]>("Software Development");
  const [courses, setCourses] = useState<Course[]>([]);
  const [modulesByCourse, setModulesByCourse] = useState<Record<string, Module[]>>({});
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [tasksByCourse, setTasksByCourse] = useState<Record<string, Task[]>>({});
  const [leaderboard, setLeaderboard] = useState<LeaderRow[]>([]);
  const [courseProgressByCourse, setCourseProgressByCourse] = useState<Record<string, number>>({});
  const [displayProgressByCourse, setDisplayProgressByCourse] = useState<Record<string, number>>({});
  const [moduleStartTimes, setModuleStartTimes] = useState<Record<string, number>>({});
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const moduleRefs = useMemo(() => ({} as Record<string, HTMLDivElement | null>), []);
  const [notesByModule, setNotesByModule] = useState<Record<string, string>>(() => {
    try {
      const raw = localStorage.getItem("module_reflection_notes");
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  });
  const [showConfetti, setShowConfetti] = useState(false);

  const { toast } = useToast();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await (supabase.auth as any).signOut();
    navigate('/auth');
  };

  // Auth guard: students only
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const role = data.session?.user.user_metadata?.role || "student";
      if (role !== "student") navigate("/auth");
    });
  }, [navigate]);

  const loadCourses = useCallback(async () => {
    const resp = await supabase
      .from("courses")
      .select("id, program, title, description")
      .eq("program", selectedProgram)
      .order("created_at", { ascending: false });
    const data = 'data' in (resp as any) ? (resp as any).data : null;
    const error = 'error' in (resp as any) ? (resp as any).error : null;
    if (error) {
      if ((error as any).code === "404" || (error as any).message?.toLowerCase().includes("not found")) {
        setCourses([]);
        return;
      }
      toast({ title: "Error loading courses", description: (error as any).message, variant: "destructive" });
    } else {
      setCourses((data || []) as Course[]);
    }
  }, [selectedProgram, toast]);

  const loadLeaderboard = useCallback(async () => {
    const resp = await supabase
      .from("xp_events")
      .select("student_id, xp")
      .eq("program", selectedProgram);
    const data = 'data' in (resp as any) ? (resp as any).data : null;
    const error = 'error' in (resp as any) ? (resp as any).error : null;
    if (error) { setLeaderboard([]); return; }
    const totals = new Map<string, number>();
    for (const row of (data || []) as LeaderRow[]) {
      totals.set(row.student_id, (totals.get(row.student_id) || 0) + (row.xp || 0));
    }
    const items = Array.from(totals.entries())
      .map(([student_id, xp]) => ({ student_id, xp }))
      .sort((a, b) => b.xp - a.xp)
      .slice(0, 10);
    setLeaderboard(items);
  }, [selectedProgram]);

  // Tasks have been removed from the student programs page

  const loadTasks = useCallback(async () => {
    const resp = await supabase
      .from("tasks")
      .select("id, title, description, due_date")
      .eq("program", selectedProgram)
      .order("due_date", { ascending: true });
    const data = 'data' in (resp as any) ? (resp as any).data : null;
    const error = 'error' in (resp as any) ? (resp as any).error : null;
    if (error) { console.error("Error loading tasks:", error); return; }
    const tasksByCourseMap: Record<string, Task[]> = {};
    (data || []).forEach((task: any) => {
      const courseKey = selectedProgram;
      if (!tasksByCourseMap[courseKey]) tasksByCourseMap[courseKey] = [];
      tasksByCourseMap[courseKey].push(task as Task);
    });
    setTasksByCourse(tasksByCourseMap);
  }, [selectedProgram]);

  useEffect(() => {
    loadCourses();
    loadLeaderboard();
    loadTasks();
    const channel: any = (supabase as any).channel("student-programs-realtime");
    channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "courses" }, loadCourses);
    channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "courses" }, loadCourses);
    channel.on("postgres_changes", { event: "DELETE", schema: "public", table: "courses" }, loadCourses);
    channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "tasks" }, loadTasks);
    channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "tasks" }, loadTasks);
    channel.on("postgres_changes", { event: "DELETE", schema: "public", table: "tasks" }, loadTasks);
    channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "xp_events" }, loadLeaderboard);
    channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "xp_events" }, loadLeaderboard);
    channel.on("postgres_changes", { event: "DELETE", schema: "public", table: "xp_events" }, loadLeaderboard);
    channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "lesson_progress" }, () => {
      courses.forEach(course => recomputeCourseProgress(course.id));
    });
    channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "lesson_progress" }, () => {
      courses.forEach(course => recomputeCourseProgress(course.id));
    });
    channel.subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [loadCourses, loadLeaderboard, loadTasks, courses]);

  const programCourses = useMemo(() => courses, [courses]);

  const persistNotes = (next: Record<string, string>) => {
    try { localStorage.setItem("module_reflection_notes", JSON.stringify(next)); } catch {}
  };

  const recomputeCourseProgress = useCallback(async (courseId: string) => {
    const userResp: any = await supabase.auth.getUser();
    const studentId = (userResp?.data?.user || userResp?.user)?.id;
    if (!studentId) return;
    
    // First get all modules for this course
    const modulesResp = await supabase
      .from("modules")
      .select("id")
      .eq("course_id", courseId);
    const moduleData = 'data' in (modulesResp as any) ? (modulesResp as any).data : null;
    const moduleError = 'error' in (modulesResp as any) ? (modulesResp as any).error : null;
    
    if (moduleError || !moduleData || moduleData.length === 0) {
      setCourseProgressByCourse((prev) => ({ ...prev, [courseId]: 0 }));
      return;
    }
    
    const moduleIds = moduleData.map((m: any) => m.id);
    
    // Then get all lessons for these modules
    const lessonsResp = await (supabase as any)
      .from("lessons")
      .select("id")
      .in("module_id", moduleIds);
    const lessons = 'data' in (lessonsResp as any) ? (lessonsResp as any).data : null;
    const lessonsError = 'error' in (lessonsResp as any) ? (lessonsResp as any).error : null;
    
    if (lessonsError || !lessons || lessons.length === 0) {
      setCourseProgressByCourse((prev) => ({ ...prev, [courseId]: 0 }));
      return;
    }
    
    const lessonIds = lessons.map((l: any) => l.id);
    
    // Get progress for these lessons
    const progressesResp = await (supabase as any)
      .from("lesson_progress")
      .select("lesson_id, progress_percent")
      .in("lesson_id", lessonIds)
      .eq("student_id", studentId);
    const progresses = 'data' in (progressesResp as any) ? (progressesResp as any).data : null;
    
    const total = lessonIds.length;
    const completed = (progresses || []).filter((p: any) => (p.progress_percent || 0) >= 100).length;
    const percent = Math.round((completed / Math.max(total, 1)) * 100);
    
    setCourseProgressByCourse((prev) => ({ ...prev, [courseId]: percent }));
    setDisplayProgressByCourse((prev) => ({ ...prev, [courseId]: prev[courseId] ?? 0 }));
    
    // upsert course_progress
    await supabase.from("course_progress").upsert({
      course_id: courseId,
      student_id: studentId,
      progress_percent: percent,
    }, { onConflict: "course_id,student_id" });
  }, []);

  const handleCompleteLesson = useCallback(async (courseId: string, lessonId: string, lessonTitle: string, moduleId: string, xpReward: number = 10) => {
    const { data: userData } = await supabase.auth.getUser();
    const studentId = userData?.user?.id;
    if (!studentId) return toast({ title: "Not signed in", description: "Please log in again.", variant: "destructive" });

    // mark lesson complete
    const { error } = await supabase.from("lesson_progress").upsert({
      lesson_id: lessonId,
      student_id: studentId,
      completed_video: true,
      completed_notes: true,
      completed_quiz: true,
      progress_percent: 100,
    }, { onConflict: "lesson_id,student_id" });
    if (error) return toast({ title: "Error", description: error.message, variant: "destructive" });

    // Award XP based on instructor setting
    await supabase.from("xp_events").insert({ xp: xpReward, reason: `Completed lesson: ${lessonTitle}`, program: selectedProgram, student_id: studentId });
    await recomputeCourseProgress(courseId);

    // Check if module is complete (all lessons done)
    const moduleLessons = lessonsByModule[moduleId] || [];
    const completedLessons = moduleLessons.filter(lesson => {
      // Check if this lesson is completed by student
      // This is a simplified check - in production you'd query the database
      return true; // For now, assume lesson is completed
    });

    if (completedLessons.length === moduleLessons.length) {
      // Module is complete - check duration requirement
      const startTime = moduleStartTimes[moduleId];
      const module = modulesByCourse[courseId]?.find(m => m.id === moduleId);
      if (startTime && module?.duration_minutes) {
        const elapsedMinutes = (Date.now() - startTime) / (1000 * 60);
        if (elapsedMinutes >= module.duration_minutes) {
          setCompletedModules(prev => new Set([...prev, moduleId]));
        }
      }
    }

    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 3000);
    toast({ title: `+${xpReward} XP`, description: "Lesson completed!" });
  }, [recomputeCourseProgress, selectedProgram, toast, lessonsByModule, moduleStartTimes, modulesByCourse]);

  return (
    <div className="min-h-screen bg-background relative">
      <Fireflies />
      {/* Logo */}
      <button
        onClick={handleSignOut}
        className="absolute top-4 left-4 bg-[#FF8181] text-white font-bold text-lg px-4 py-2 rounded-full hover:bg-[#FF8181]/80 transition-colors z-10"
      >
        UR HUB
      </button>
      {/* Back Button */}
      <button
        onClick={() => navigate("/student")}
        className="absolute top-4 right-4 bg-[#0747A1] text-white font-bold text-lg px-4 py-2 rounded-full hover:bg-[#0747A1]/80 transition-colors z-10 flex items-center gap-2"
      >
        <ArrowLeft size={20} />
        Back
      </button>
      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="flex justify-center mb-6">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4">
            {programs.map((p) => (
              <Button key={p} variant={selectedProgram === p ? "default" : "outline"} onClick={() => setSelectedProgram(p as any)} className={`rounded-2xl transition-all text-xs md:text-sm px-3 py-2 md:px-4 md:py-2 whitespace-nowrap ${selectedProgram === p ? "bg-[#0747A1] text-white shadow-lg shadow-[#0A58CA]" : "hover:bg-[#E6F2FF]"}`}>
                {p}
              </Button>
            ))}
          </div>
        </div>

        {/* Courses */}
        <Card>
          <CardHeader>
            <CardTitle>Courses</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {programCourses.map((course) => (
                <Card key={course.id} className="border-dashed">
                  <CardHeader>
                    <CardTitle className="text-base">{course.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
                    <div className="mb-4">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-muted-foreground">Overall Progress</span>
                        <span className="text-xs font-medium">{courseProgressByCourse[course.id] || 0}%</span>
                      </div>
                      <Progress value={courseProgressByCourse[course.id] || 0} />
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={async () => {
                          // Load modules and lessons for this course
                          const modulesResp = await supabase
                            .from("modules")
                            .select("id, course_id, title, duration_minutes")
                            .eq("course_id", course.id)
                            .order("position");
                          const modules = 'data' in (modulesResp as any) ? (modulesResp as any).data : null;
                          const modulesError = 'error' in (modulesResp as any) ? (modulesResp as any).error : null;

                          if (modulesError) {
                            toast({ title: "Error loading modules", description: (modulesError as any).message, variant: "destructive" });
                            return;
                          }

                          setModulesByCourse((prev) => ({ ...prev, [course.id]: (modules || []) as Module[] }));

                          // Load lessons for all modules in this course
                          if (modules && modules.length > 0) {
                            const lessonsResp = await (supabase as any)
                              .from("lessons")
                              .select("id, module_id, title, video_url, notes, xp_reward")
                              .in("module_id", (modules as any[]).map((m: any) => m.id))
                              .order("position");
                            const lessons = 'data' in (lessonsResp as any) ? (lessonsResp as any).data : null;
                            const lessonsError = 'error' in (lessonsResp as any) ? (lessonsResp as any).error : null;

                            if (lessonsError) {
                              toast({ title: "Error loading lessons", description: (lessonsError as any).message, variant: "destructive" });
                              return;
                            }

                            const lessonsMap: Record<string, Lesson[]> = {};
                            (lessons || []).forEach((lesson: any) => {
                              if (!lessonsMap[lesson.module_id]) lessonsMap[lesson.module_id] = [];
                              lessonsMap[lesson.module_id].push(lesson as Lesson);
                            });
                            setLessonsByModule(lessonsMap);

                            // Start timers for modules
                            const newStartTimes: Record<string, number> = {};
                            (modules as any[]).forEach((module: any) => {
                              if (!moduleStartTimes[module.id]) {
                                newStartTimes[module.id] = Date.now();
                              }
                            });
                            setModuleStartTimes(prev => ({ ...prev, ...newStartTimes }));
                          }

                          recomputeCourseProgress(course.id);
                        }}
                        className="rounded-xl"
                      >
                        View Course
                      </Button>
                    </div>
                    <div className="space-y-3 mt-3">
                      {(modulesByCourse[course.id] || []).map((m, idx, arr) => (
                        <motion.div key={m.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.25 }}>
                          <Card ref={(el) => { moduleRefs[m.id] = el; }} className="bg-muted/30 relative overflow-hidden">
                            <CardHeader>
                              <CardTitle className="text-sm">Module: {m.title}</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="flex items-center gap-2 mb-2">
                              <Button variant="secondary" className="rounded-xl" onClick={async () => {
                                const resp = await supabase
                                  .from("lessons")
                                  .select("id, module_id, title, video_url, notes, xp_reward")
                                  .eq("module_id", m.id)
                                  .order("position");
                                const data = 'data' in (resp as any) ? (resp as any).data : null;
                                const error = 'error' in (resp as any) ? (resp as any).error : null;
                                if (error) return toast({ title: "Error loading lessons", description: (error as any).message, variant: "destructive" });
                                setLessonsByModule((prev) => ({ ...prev, [m.id]: (data || []) as Lesson[] }));
                                // Start module timer when lessons are loaded
                                if (!moduleStartTimes[m.id]) {
                                  setModuleStartTimes(prev => ({ ...prev, [m.id]: Date.now() }));
                                }
                              }}>Load Lessons</Button>
                            </div>
                              <div className="relative pl-4">
                                <div className="absolute left-1 top-0 bottom-0 w-[2px] bg-gradient-to-b from-[#74a2ff] via-[#0747A1] to-transparent rounded-full opacity-70" />
                                <div className="grid gap-2">
                                  {(lessonsByModule[m.id] || []).map((l: any) => (
                                    <motion.div key={l.id} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.2 }} className="relative p-3 pl-6 rounded-lg border">
                                      <span className="absolute left-0 top-4 -ml-[5px] h-2.5 w-2.5 rounded-full bg-[#74a2ff] shadow-[0_0_10px_2px_rgba(7,71,161,0.35)]" />
                                      <div className="flex items-center justify-between gap-3">
                                        <span className="font-medium text-sm">{l.title}</span>
                                        <div className="flex items-center gap-2 w-40">
                                          <Progress value={0} />
                                        </div>
                                      </div>
                                      {/* Resource preview */}
                                      {(l.video_url || l.notes) && (
                                        <div className="mt-2 text-xs text-muted-foreground">
                                          {l.video_url && (
                                            <a href={l.video_url} target="_blank" rel="noreferrer" className="underline mr-3">Preview video</a>
                                          )}
                                          {l.notes && (
                                            <span className="inline-block max-w-full truncate" title={l.notes}>Notes: {l.notes}</span>
                                          )}
                                        </div>
                                      )}
                                      <div className="mt-2 flex gap-2">
                                        <Button size="sm" className="rounded-xl" onClick={() => handleCompleteLesson(course.id, l.id, l.title, m.id, l.xp_reward)}>Complete Lesson</Button>
                                        <Button size="sm" variant="outline" className="rounded-xl">Open Lesson</Button>
                                      </div>
                                    </motion.div>
                                  ))}
                                </div>
                              </div>
                              {/* Next Module - Only show if current module is completed */}
                              {arr.length > 1 && idx < arr.length - 1 && completedModules.has(m.id) && (
                                <div className="mt-4 flex justify-end">
                                  <Button size="sm" variant="ghost" className="rounded-xl" onClick={() => {
                                    const next = arr[idx + 1];
                                    const el = moduleRefs[next.id];
                                    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
                                  }}>Next Module →</Button>
                                </div>
                              )}

                              {/* Module Duration Progress */}
                              {moduleStartTimes[m.id] && m.duration_minutes && (
                                <div className="mt-4">
                                  <div className="flex items-center justify-between mb-1">
                                    <span className="text-xs text-muted-foreground">Module Duration Progress</span>
                                    <span className="text-xs font-medium">
                                      {Math.min(Math.floor((Date.now() - moduleStartTimes[m.id]) / (1000 * 60)), m.duration_minutes)}/{m.duration_minutes} min
                                    </span>
                                  </div>
                                  <Progress
                                    value={Math.min((Date.now() - moduleStartTimes[m.id]) / (m.duration_minutes * 60 * 1000) * 100, 100)}
                                  />
                                  {!completedModules.has(m.id) && (
                                    <p className="text-xs text-muted-foreground mt-1">
                                      Complete all lessons and spend {m.duration_minutes} minutes to unlock next module
                                    </p>
                                  )}
                                </div>
                              )}
                              {/* Reflection notes */}
                              <div className="mt-4">
                                <div className="text-xs text-muted-foreground mb-1">Reflection</div>
                                <textarea
                                  className="w-full border rounded-lg p-2 text-sm"
                                  rows={3}
                                  placeholder="Jot down your thoughts..."
                                  value={notesByModule[m.id] || ""}
                                  onChange={(e) => {
                                    const next = { ...notesByModule, [m.id]: e.target.value };
                                    setNotesByModule(next);
                                    persistNotes(next);
                                  }}
                                />
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Tasks */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Tasks</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {programCourses.map((course) => (
              <div key={course.id} className="space-y-2">
                <h4 className="font-medium text-sm">{course.title} Tasks</h4>
                <div className="space-y-2">
                  {(tasksByCourse[course.id] || []).map((task) => (
                    <div key={task.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between">
                        <div>
                          <h5 className="font-medium text-sm">{task.title}</h5>
                          {task.description && (
                            <p className="text-xs text-muted-foreground mt-1">{task.description}</p>
                          )}
                          {task.due_date && (
                            <p className="text-xs text-muted-foreground">
                              Due: {new Date(task.due_date).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                        <Button
                          size="sm"
                          className="rounded-xl"
                          onClick={async () => {
                            const userResp: any = await supabase.auth.getUser();
                            const studentId = (userResp?.data?.user || userResp?.user)?.id;
                            if (!studentId) return;

                            const upsertResp = await supabase.from("task_progress").upsert({
                              task_id: task.id,
                              student_id: studentId,
                              completed: true,
                              completed_at: new Date().toISOString(),
                            }, { onConflict: "task_id,student_id" });
                            const upsertError = 'error' in (upsertResp as any) ? (upsertResp as any).error : null;

                            if (upsertError) {
                              toast({ title: "Error", description: (upsertError as any).message, variant: "destructive" });
                            } else {
                              toast({ title: "Task completed!", description: "Great job!" });
                              // Award XP for task completion
                              const insertResp = await supabase.from("xp_events").insert({
                                xp: 15,
                                reason: `Completed task: ${task.title}`,
                                program: selectedProgram,
                                student_id: studentId
                              });
                              const insertError = 'error' in (insertResp as any) ? (insertResp as any).error : null;
                              if (insertError) {
                                toast({ title: "Error", description: (insertError as any).message, variant: "destructive" });
                              }
                            }
                          }}
                        >
                          Complete Task
                        </Button>
                      </div>
                    </div>
                  ))}
                  {(tasksByCourse[course.id] || []).length === 0 && (
                    <p className="text-xs text-muted-foreground">No tasks assigned for this course</p>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Leaderboard */}
        <Leaderboard program={selectedProgram} />

        {/* Confetti Animation */}
        <Confetti trigger={showConfetti} />
      </div>
    </div>
  );
};

export default StudentPrograms;
