import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import CourseForm from "@/components/CourseForm";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, ArrowLeft } from "lucide-react";

type Course = {
  id: string;
  program: string;
  title: string;
  description: string | null;
};

type Module = {
  id: string;
  course_id: string;
  title: string;
  position: number;
};

type Lesson = {
  id: string;
  module_id: string;
  title: string;
  video_url: string | null;
  notes: string | null;
  quiz: any;
  weight_video: number;
  weight_notes: number;
  weight_quiz: number;
  position: number;
};

type Task = {
  id: string;
  program: string;
  title: string;
  description: string | null;
  schedule: "daily" | "weekly" | "monthly" | "ad-hoc";
  due_at: string | null;
};

const programs = ["Software Development", "Digital Marketing", "Product Design"] as const;

const InstructorPrograms = () => {
  const [selectedProgram, setSelectedProgram] = useState<(typeof programs)[number]>("Software Development");
  const [courses, setCourses] = useState<Course[]>([]);
  const [modulesByCourse, setModulesByCourse] = useState<Record<string, Module[]>>({});
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  // Tasks have been removed as per request

  const [newCourse, setNewCourse] = useState({ title: "", description: "" });
  const [showCourseForm, setShowCourseForm] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [newModule, setNewModule] = useState({ courseId: "", title: "" });
  const [newLesson, setNewLesson] = useState({ moduleId: "", title: "", video_url: "", notes: "", xp_reward: 10 });
  const [newTask, setNewTask] = useState({ courseId: "", title: "", description: "", due_date: "" });

  const { toast } = useToast();
  const navigate = useNavigate();
  const handleSignOut = async () => {
    await (supabase.auth as any).signOut();
    navigate('/auth');
  };

  // Auth guard: only instructors
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const role = data.session?.user.user_metadata?.role || "student";
      if (role !== "instructor") navigate("/auth");
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
      // Handle missing table (404) or RLS/other errors gracefully
      if ((error as any).code === "404" || (error as any).message?.toLowerCase().includes("not found")) {
        toast({ title: "Courses not ready", description: "Create tables/migrations for courses to enable this.", variant: "default" });
        setCourses([]);
        return;
      }
      toast({ title: "Error loading courses", description: error.message, variant: "destructive" });
    }
    else setCourses((data || []) as Course[]);
  }, [selectedProgram, toast]);

  // loadTasks removed

  useEffect(() => {
    loadCourses();
    const channel: any = (supabase as any).channel("instructor-programs-realtime");
    channel.on("postgres_changes", { event: "INSERT", schema: "public", table: "courses" }, loadCourses);
    channel.on("postgres_changes", { event: "UPDATE", schema: "public", table: "courses" }, loadCourses);
    channel.on("postgres_changes", { event: "DELETE", schema: "public", table: "courses" }, loadCourses);
    channel.subscribe();
    return () => { (supabase as any).removeChannel(channel); };
  }, [loadCourses]);

  const loadModulesForCourse = useCallback(async (courseId: string) => {
    const resp = await supabase
      .from("modules")
      .select("id, course_id, title, position")
      .eq("course_id", courseId)
      .order("position");
    const data = 'data' in (resp as any) ? (resp as any).data : null;
    const error = 'error' in (resp as any) ? (resp as any).error : null;
    if (error) return toast({ title: "Error loading modules", description: error.message, variant: "destructive" });
    setModulesByCourse((prev) => ({ ...prev, [courseId]: (data || []) as Module[] }));
  }, [toast]);

  const loadLessonsForModule = useCallback(async (moduleId: string) => {
    const resp = await supabase
      .from("lessons")
      .select("id, module_id, title, video_url, notes, quiz, weight_video, weight_notes, weight_quiz, position")
      .eq("module_id", moduleId)
      .order("position");
    const data = 'data' in (resp as any) ? (resp as any).data : null;
    const error = 'error' in (resp as any) ? (resp as any).error : null;
    if (error) return toast({ title: "Error loading lessons", description: error.message, variant: "destructive" });
    setLessonsByModule((prev) => ({ ...prev, [moduleId]: (data || []) as Lesson[] }));
  }, [toast]);

  // CRUD: create/update course
  const handleCreateCourse = async () => {
    if (!newCourse.title.trim()) return;
    const resp = await supabase.from("courses").insert({
      program: selectedProgram,
      title: newCourse.title.trim(),
      description: newCourse.description || null,
    });
    const error = 'error' in (resp as any) ? (resp as any).error : null;
    if (error) return toast({ title: "Create course failed", description: (error as any).message, variant: "destructive" });
    setNewCourse({ title: "", description: "" });
    toast({ title: "Course created" });
    loadCourses();
  };

  // CRUD: edit course
  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setNewCourse({ title: course.title, description: course.description || "" });
  };

  // CRUD: update course
  const handleUpdateCourse = async () => {
    if (!editingCourse || !newCourse.title.trim()) return;
    const resp = await supabase.from("courses").update({
      title: newCourse.title.trim(),
      description: newCourse.description || null,
    }).eq("id", editingCourse.id);
    const error = 'error' in (resp as any) ? (resp as any).error : null;
    if (error) return toast({ title: "Update course failed", description: (error as any).message, variant: "destructive" });
    setEditingCourse(null);
    setNewCourse({ title: "", description: "" });
    toast({ title: "Course updated" });
    loadCourses();
  };

  // CRUD: delete course
  const handleDeleteCourse = async (course: Course) => {
    if (!confirm(`Are you sure you want to delete "${course.title}"? This will also delete all modules and lessons.`)) return;
    const resp = await supabase.from("courses").delete().eq("id", course.id);
    const error = 'error' in (resp as any) ? (resp as any).error : null;
    if (error) return toast({ title: "Delete course failed", description: (error as any).message, variant: "destructive" });
    toast({ title: "Course deleted" });
    loadCourses();
  };

  // CRUD minimal: add module
  const handleAddModule = async () => {
    if (!newModule.courseId || !newModule.title.trim()) return;
    const resp = await supabase.from("modules").insert({
      course_id: newModule.courseId,
      title: newModule.title.trim(),
    });
    const error = 'error' in (resp as any) ? (resp as any).error : null;
    if (error) return toast({ title: "Add module failed", description: (error as any).message, variant: "destructive" });
    setNewModule({ courseId: "", title: "" });
    toast({ title: "Module added" });
    loadModulesForCourse(newModule.courseId);
  };

  // CRUD: add lesson
  const handleAddLesson = async () => {
    if (!newLesson.moduleId || !newLesson.title.trim()) return;
    const resp = await supabase.from("lessons").insert({
      module_id: newLesson.moduleId,
      title: newLesson.title.trim(),
      video_url: newLesson.video_url || null,
      notes: newLesson.notes || null,
      quiz: null,
      xp_reward: newLesson.xp_reward || 10,
    });
    const error = 'error' in (resp as any) ? (resp as any).error : null;
    if (error) return toast({ title: "Add lesson failed", description: (error as any).message, variant: "destructive" });
    setNewLesson({ moduleId: "", title: "", video_url: "", notes: "", xp_reward: 10 });
    toast({ title: "Lesson added" });
    loadLessonsForModule(newLesson.moduleId);
  };

  // CRUD: add task
  const handleAddTask = async () => {
    if (!newTask.courseId || !newTask.title.trim()) return;
    const resp = await supabase.from("tasks").insert({
      course_id: newTask.courseId,
      title: newTask.title.trim(),
      description: newTask.description || null,
      due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
      program: selectedProgram,
      schedule: "ad-hoc",
    });
    const error = 'error' in (resp as any) ? (resp as any).error : null;
    if (error) return toast({ title: "Add task failed", description: (error as any).message, variant: "destructive" });
    setNewTask({ courseId: "", title: "", description: "", due_date: "" });
    toast({ title: "Task added" });
  };


  const programCourses = useMemo(() => courses, [courses]);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Logo */}
      <button
        onClick={handleSignOut}
        className="absolute top-4 left-4 bg-[#FF8181] text-white font-bold text-lg px-4 py-2 rounded-full hover:bg-[#FF8181]/80 transition-colors z-10"
      >
        UR HUB
      </button>
      {/* Back Button */}
      <button
        onClick={() => navigate("/instructor")}
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

        <div className="grid gap-6">
          {/* Section 1 – Create Course */}
          <Card>
            <CardHeader>
              <CardTitle>Section 1 – {editingCourse ? "Edit Course" : "Create Course"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingCourse ? (
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="course-title">Course Title</Label>
                    <Input
                      id="course-title"
                      value={newCourse.title}
                      onChange={(e) => setNewCourse({ ...newCourse, title: e.target.value })}
                      placeholder="Enter course title"
                    />
                  </div>
                  <div>
                    <Label htmlFor="course-description">Course Description</Label>
                    <Textarea
                      id="course-description"
                      value={newCourse.description}
                      onChange={(e) => setNewCourse({ ...newCourse, description: e.target.value })}
                      placeholder="Enter course description"
                      rows={3}
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button onClick={handleUpdateCourse} className="bg-[#0747A1] text-white hover:bg-[#063d8c]">
                      Update Course
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setEditingCourse(null);
                        setNewCourse({ title: "", description: "" });
                      }}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Button 
                    onClick={() => setShowCourseForm(true)} 
                    className="bg-[#0747A1] text-white hover:bg-[#063d8c]"
                  >
                    Create New Course
                  </Button>
                  <CourseForm 
                    isOpen={showCourseForm} 
                    onClose={() => setShowCourseForm(false)} 
                    onSuccess={() => {
                      loadCourses();
                      setShowCourseForm(false);
                    }} 
                  />
                </div>
              )}

              {/* Existing courses list */}
              <div className="grid md:grid-cols-2 gap-4">
                {programCourses.map((course) => (
                  <Card key={course.id} className="border-dashed relative">
                    <CardHeader className="flex flex-row items-center justify-between">
                      <CardTitle className="text-base">{course.title}</CardTitle>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEditCourse(course)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteCourse(course)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">{course.description}</p>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate(`/instructor/programs/manage/${course.id}`)}
                        className="rounded-xl"
                      >
                        Manage Course
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default InstructorPrograms;


