import { useEffect, useMemo, useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { useNavigate, useParams } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Pencil, Trash2, Plus, ArrowLeft, Upload, CheckCircle, X } from "lucide-react";
import Fireflies from "@/components/Fireflies";

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
  duration_minutes: number;
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
  xp_reward: number;
};

type Task = {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  due_date: string | null;
};

const CourseManager = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessonsByModule, setLessonsByModule] = useState<Record<string, Lesson[]>>({});
  const [tasks, setTasks] = useState<Task[]>([]);

  const [newModule, setNewModule] = useState({ title: "", duration_minutes: 30 });
  const [newLesson, setNewLesson] = useState({ moduleId: "", title: "", video_url: "", notes: "", xp_reward: 10, file: null as File | null });
  const [newTask, setNewTask] = useState({ title: "", description: "", due_date: "", file: null as File | null });

  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  const { toast } = useToast();
  const navigate = useNavigate();

  const handleLessonFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      // Convert file to base64 for localStorage storage
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      // Update lesson with base64 data
      setNewLesson(prev => ({ ...prev, video_url: base64Data }));
      
      toast({
        title: "File uploaded successfully!",
        description: "File has been uploaded and added to lesson."
      });
    } catch (error) {
      console.error('Error uploading file:', error);
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive"
      });
    }
  };


  const handleTaskFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setNewTask({ ...newTask, file });
    }
  };

  // Auth guard: only instructors
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const role = data.session?.user.user_metadata?.role || "student";
      if (role !== "instructor") navigate("/auth");
    });
  }, [navigate]);

  // Load course data
  const loadCourse = useCallback(async () => {
    if (!courseId) return;
    const { data, error } = await supabase
      .from("courses")
      .select("*")
      .eq("id", courseId)
      .single();
    if (error) {
      toast({ title: "Error loading course", description: error.message, variant: "destructive" });
      navigate("/instructor/programs");
      return;
    }
    setCourse(data);
  }, [courseId, toast, navigate]);

  // Load modules
  const loadModules = useCallback(async () => {
    if (!courseId) return;
    const { data, error } = await supabase
      .from("modules")
      .select("*")
      .eq("course_id", courseId)
      .order("position");
    if (error) {
      console.error('Module loading error:', error);
      // If modules table doesn't exist, show a helpful message
      if (error.message.includes('does not exist') || error.message.includes('relation') || error.message.includes('column')) {
        toast({ 
          title: "Modules table not found", 
          description: "The modules table may not be created yet. Please run database migrations.", 
          variant: "destructive" 
        });
        setModules([]);
        return;
      }
      return toast({ title: "Error loading modules", description: error.message, variant: "destructive" });
    }
    setModules(data || []);
  }, [courseId, toast]);

  // Load lessons for all modules
  const loadLessons = useCallback(async () => {
    if (!courseId) return;
    const { data, error } = await supabase
      .from("lessons")
      .select("*")
      .in("module_id", modules.map(m => m.id))
      .order("position");
    if (error) return toast({ title: "Error loading lessons", description: error.message, variant: "destructive" });

    const lessonsMap: Record<string, Lesson[]> = {};
    (data || []).forEach(lesson => {
      if (!lessonsMap[lesson.module_id]) lessonsMap[lesson.module_id] = [];
      lessonsMap[lesson.module_id].push(lesson);
    });
    setLessonsByModule(lessonsMap);
  }, [modules, toast]);

  // Load tasks
  const loadTasks = useCallback(async () => {
    if (!courseId) return;
    const { data, error } = await supabase
      .from("tasks")
      .select("*")
      .eq("course_id", courseId)
      .order("due_date");
    if (error) return toast({ title: "Error loading tasks", description: error.message, variant: "destructive" });
    setTasks(data || []);
  }, [courseId, toast]);

  useEffect(() => {
    loadCourse();
    loadModules();
  }, [loadCourse, loadModules]);

  useEffect(() => {
    if (modules.length > 0) {
      loadLessons();
      loadTasks();
    }
  }, [modules, loadLessons, loadTasks]);

  // CRUD operations
  const handleAddModule = async () => {
    if (!courseId || !newModule.title.trim()) return;
    const { error } = await supabase.from("modules").insert({
      course_id: courseId,
      title: newModule.title.trim(),
      duration_minutes: newModule.duration_minutes || 30,
    });
    if (error) return toast({ title: "Add module failed", description: error.message, variant: "destructive" });
    setNewModule({ title: "", duration_minutes: 30 });
    toast({ title: "Module added" });
    loadModules();
  };

  const handleUpdateModule = async () => {
    if (!editingModule) return;
    const { error } = await supabase.from("modules").update({
      title: editingModule.title,
      duration_minutes: editingModule.duration_minutes,
    }).eq("id", editingModule.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setEditingModule(null);
    toast({ title: "Module updated" });
    loadModules();
  };

  const handleDeleteModule = async (moduleId: string) => {
    if (!confirm("Delete this module and all its lessons?")) return;
    const { error } = await supabase.from("modules").delete().eq("id", moduleId);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Module deleted" });
    loadModules();
  };

  const handleAddLesson = async (moduleId: string) => {
    if (!moduleId || !newLesson.title.trim()) return;
    
    let videoUrl = newLesson.video_url;
    
    // Upload file if provided
    if (newLesson.file) {
      try {
        const { uploadModuleContent } = await import('@/lib/upload');
        const uploadResult = await uploadModuleContent(newLesson.file, courseId!, moduleId);
        if (uploadResult.error) {
          toast({ title: "File upload failed", description: uploadResult.error, variant: "destructive" });
          return;
        }
        videoUrl = uploadResult.url;
      } catch (error) {
        toast({ title: "File upload failed", description: "Unknown error", variant: "destructive" });
        return;
      }
    }
    
    const { error } = await supabase.from("lessons").insert({
      module_id: moduleId,
      title: newLesson.title.trim(),
      video_url: videoUrl || null,
      notes: newLesson.notes || null,
      xp_reward: newLesson.xp_reward || 10,
    });
    if (error) return toast({ title: "Add lesson failed", description: error.message, variant: "destructive" });
    setNewLesson({ moduleId: "", title: "", video_url: "", notes: "", xp_reward: 10, file: null });
    toast({ title: "Lesson added" });
    loadLessons();
  };


  const handleUpdateLesson = async () => {
    if (!editingLesson) return;
    const { error } = await supabase.from("lessons").update({
      title: editingLesson.title,
      video_url: editingLesson.video_url,
      notes: editingLesson.notes,
      xp_reward: editingLesson.xp_reward,
    }).eq("id", editingLesson.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setEditingLesson(null);
    toast({ title: "Lesson updated" });
    loadLessons();
  };

  const handleDeleteLesson = async (lessonId: string) => {
    if (!confirm("Delete this lesson?")) return;
    const { error } = await supabase.from("lessons").delete().eq("id", lessonId);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Lesson deleted" });
    loadLessons();
  };

  const handleAddTask = async () => {
    if (!courseId || !newTask.title.trim()) return;
    const { error } = await supabase.from("tasks").insert({
      course_id: courseId,
      title: newTask.title.trim(),
      description: newTask.description || null,
      due_date: newTask.due_date ? new Date(newTask.due_date).toISOString() : null,
      program: course?.program || "Software Development",
      schedule: "ad-hoc",
    });
    if (error) return toast({ title: "Add task failed", description: error.message, variant: "destructive" });
    setNewTask({ title: "", description: "", due_date: "" });
    toast({ title: "Task added" });
    loadTasks();
  };

  const handleUpdateTask = async () => {
    if (!editingTask) return;
    const { error } = await supabase.from("tasks").update({
      title: editingTask.title,
      description: editingTask.description,
      due_date: editingTask.due_date ? new Date(editingTask.due_date).toISOString() : null,
    }).eq("id", editingTask.id);
    if (error) return toast({ title: "Update failed", description: error.message, variant: "destructive" });
    setEditingTask(null);
    toast({ title: "Task updated" });
    loadTasks();
  };

  const handleDeleteTask = async (taskId: string) => {
    if (!confirm("Delete this task?")) return;
    const { error } = await supabase.from("tasks").delete().eq("id", taskId);
    if (error) return toast({ title: "Delete failed", description: error.message, variant: "destructive" });
    toast({ title: "Task deleted" });
    loadTasks();
  };

  if (!course) {
    return (
      <div className="min-h-screen bg-background relative flex items-center justify-center">
        <Fireflies />
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0747A1] mx-auto mb-4"></div>
          <p>Loading course...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative">
      <Fireflies />
      {/* Logo */}
      <button
        onClick={() => navigate("/")}
        className="absolute top-4 left-4 bg-[#FF8181] text-white font-bold text-lg px-4 py-2 rounded-full hover:bg-[#FF8181]/80 transition-colors z-10"
      >
        UR HUB
      </button>
      {/* Back Arrow */}
      <button
        onClick={() => navigate("/instructor/programs")}
        className="absolute top-4 right-4 bg-[#0747A1] text-white font-bold text-lg px-4 py-2 rounded-full hover:bg-[#0747A1]/80 transition-colors z-10 flex items-center gap-2"
      >
        <ArrowLeft size={20} />
        Back
      </button>

      <div className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0747A1] mb-2">{course.title}</h1>
          <p className="text-muted-foreground">{course.description}</p>
        </div>

        <Tabs defaultValue="modules" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-[#0747A1] to-[#0A58CA] text-white">
            <TabsTrigger value="modules" className="data-[state=active]:bg-white data-[state=active]:text-[#0747A1] text-white hover:text-white font-medium">Modules & Lessons</TabsTrigger>
            <TabsTrigger value="tasks" className="data-[state=active]:bg-white data-[state=active]:text-[#0747A1] text-white hover:text-white font-medium">Tasks</TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-white data-[state=active]:text-[#0747A1] text-white hover:text-white font-medium">Analytics</TabsTrigger>
          </TabsList>

          <TabsContent value="modules" className="space-y-6">
            {/* Add Module */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Module</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Module Title</Label>
                    <Input
                      value={newModule.title}
                      onChange={(e) => setNewModule({ ...newModule, title: e.target.value })}
                      placeholder="Enter module title"
                    />
                  </div>
                  <div>
                    <Label>Duration (minutes)</Label>
                    <Input
                      type="number"
                      value={newModule.duration_minutes}
                      onChange={(e) => setNewModule({ ...newModule, duration_minutes: Number(e.target.value) || 30 })}
                      placeholder="30"
                    />
                  </div>
                </div>
                <Button onClick={handleAddModule} className="bg-[#0747A1] text-white hover:bg-[#063d8c]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Module
                </Button>
              </CardContent>
            </Card>

            {/* Modules List */}
            <div className="space-y-4">
              {modules.length === 0 ? (
                <Card className="border-dashed">
                  <CardContent className="text-center py-8">
                    <p className="text-muted-foreground mb-4">No modules found for this course.</p>
                    <p className="text-sm text-muted-foreground">
                      If you just created this course, the modules may not be loaded yet. 
                      Try refreshing the page or check if the database migrations have been run.
                    </p>
                  </CardContent>
                </Card>
              ) : (
                modules.map((module) => (
                <Card key={module.id} className="border-dashed">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-lg">{module.title}</CardTitle>
                      <p className="text-sm text-muted-foreground">Duration: {module.duration_minutes} minutes</p>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setEditingModule(module)}
                        className="h-8 w-8 p-0"
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteModule(module.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Add Lesson */}
                    <div className="border-t pt-4">
                      <h4 className="font-medium mb-3">Add Lesson to Module</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <Input
                          placeholder="Lesson title"
                          value={newLesson.title}
                          onChange={(e) => setNewLesson({ ...newLesson, title: e.target.value })}
                        />
                        <div className="space-y-2">
                          <Input
                            placeholder="Video URL (optional)"
                            value={newLesson.video_url}
                            onChange={(e) => setNewLesson({ ...newLesson, video_url: e.target.value })}
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center justify-center px-3 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50 text-sm">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload File
                              <input
                                type="file"
                                accept="video/*,.pdf,image/*,.txt"
                                onChange={handleLessonFileUpload}
                                className="hidden"
                              />
                            </label>
                            {newLesson.file && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                {newLesson.file.name}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setNewLesson({ ...newLesson, file: null })}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                        <Input
                          placeholder="Notes (optional)"
                          value={newLesson.notes}
                          onChange={(e) => setNewLesson({ ...newLesson, notes: e.target.value })}
                        />
                        <Input
                          type="number"
                          placeholder="XP Reward (10)"
                          value={newLesson.xp_reward}
                          onChange={(e) => setNewLesson({ ...newLesson, xp_reward: Number(e.target.value) || 10 })}
                        />
                      </div>
                      <Button
                        onClick={() => handleAddLesson(module.id)}
                        className="bg-[#0747A1] text-white hover:bg-[#063d8c]"
                      >
                        <Plus className="mr-2 h-4 w-4" />
                        Add Lesson
                      </Button>
                    </div>

                    {/* Lessons List */}
                    <div className="space-y-2">
                      <h4 className="font-medium">Lessons</h4>
                      {lessonsByModule[module.id]?.map((lesson) => (
                        <div key={lesson.id} className="p-3 border rounded-lg flex items-center justify-between">
                          <div>
                            <span className="font-medium">{lesson.title}</span>
                            <span className="text-sm text-muted-foreground ml-2">({lesson.xp_reward} XP)</span>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingLesson(lesson)}
                              className="h-8 w-8 p-0"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteLesson(lesson.id)}
                              className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      )) || <p className="text-sm text-muted-foreground">No lessons yet</p>}
                    </div>
                  </CardContent>
                </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="tasks" className="space-y-6">
            {/* Add Task */}
            <Card>
              <CardHeader>
                <CardTitle>Add New Task</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Task Title</Label>
                    <Input
                      value={newTask.title}
                      onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                      placeholder="Enter task title"
                    />
                  </div>
                  <div>
                    <Label>Due Date (optional)</Label>
                    <Input
                      type="datetime-local"
                      value={newTask.due_date}
                      onChange={(e) => setNewTask({ ...newTask, due_date: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <Label>Description (optional)</Label>
                  <Textarea
                    value={newTask.description}
                    onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                    placeholder="Enter task description"
                    rows={3}
                  />
                </div>
                
                <div>
                  <Label>Attachment (optional)</Label>
                  <div className="flex items-center gap-2">
                    <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                      <Upload className="h-4 w-4 mr-2" />
                      Upload File
                      <input
                        type="file"
                        accept=".pdf,.doc,.docx,.txt,.png,.jpg,.jpeg,.mp4,.webm,.mov"
                        onChange={handleTaskFileUpload}
                        className="hidden"
                      />
                    </label>
                    {newTask.file && (
                      <div className="flex items-center gap-2 text-sm text-green-600">
                        <CheckCircle className="h-4 w-4" />
                        {newTask.file.name}
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setNewTask({ ...newTask, file: null })}
                          className="h-6 w-6 p-0"
                        >
                          <X className="h-3 w-3" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
                <Button onClick={handleAddTask} className="bg-[#0747A1] text-white hover:bg-[#063d8c]">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Task
                </Button>
              </CardContent>
            </Card>

            {/* Tasks List */}
            <Card>
              <CardHeader>
                <CardTitle>Course Tasks</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {tasks.map((task) => (
                  <div key={task.id} className="p-4 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium">{task.title}</h4>
                      <div className="flex gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingTask(task)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteTask(task.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                    {task.description && (
                      <p className="text-sm text-muted-foreground mb-2">{task.description}</p>
                    )}
                    {task.due_date && (
                      <p className="text-xs text-muted-foreground">
                        Due: {new Date(task.due_date).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                ))}
                {tasks.length === 0 && (
                  <p className="text-muted-foreground">No tasks created yet</p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Course Analytics</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">Analytics dashboard coming soon...</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      {/* Edit Module Dialog */}
      <Dialog open={!!editingModule} onOpenChange={() => setEditingModule(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Module</DialogTitle>
          </DialogHeader>
          {editingModule && (
            <div className="space-y-4">
              <div>
                <Label>Module Title</Label>
                <Input
                  value={editingModule.title}
                  onChange={(e) => setEditingModule({ ...editingModule, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Duration (minutes)</Label>
                <Input
                  type="number"
                  value={editingModule.duration_minutes}
                  onChange={(e) => setEditingModule({ ...editingModule, duration_minutes: Number(e.target.value) || 30 })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateModule} className="bg-[#0747A1] text-white hover:bg-[#063d8c]">
              Update Module
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Lesson Dialog */}
      <Dialog open={!!editingLesson} onOpenChange={() => setEditingLesson(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
          </DialogHeader>
          {editingLesson && (
            <div className="space-y-4">
              <div>
                <Label>Lesson Title</Label>
                <Input
                  value={editingLesson.title}
                  onChange={(e) => setEditingLesson({ ...editingLesson, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Video URL</Label>
                <Input
                  value={editingLesson.video_url || ""}
                  onChange={(e) => setEditingLesson({ ...editingLesson, video_url: e.target.value })}
                />
              </div>
              <div>
                <Label>Notes</Label>
                <Textarea
                  value={editingLesson.notes || ""}
                  onChange={(e) => setEditingLesson({ ...editingLesson, notes: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>XP Reward</Label>
                <Input
                  type="number"
                  value={editingLesson.xp_reward}
                  onChange={(e) => setEditingLesson({ ...editingLesson, xp_reward: Number(e.target.value) || 10 })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateLesson} className="bg-[#0747A1] text-white hover:bg-[#063d8c]">
              Update Lesson
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Task Dialog */}
      <Dialog open={!!editingTask} onOpenChange={() => setEditingTask(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Task</DialogTitle>
          </DialogHeader>
          {editingTask && (
            <div className="space-y-4">
              <div>
                <Label>Task Title</Label>
                <Input
                  value={editingTask.title}
                  onChange={(e) => setEditingTask({ ...editingTask, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea
                  value={editingTask.description || ""}
                  onChange={(e) => setEditingTask({ ...editingTask, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <Label>Due Date</Label>
                <Input
                  type="datetime-local"
                  value={editingTask.due_date ? new Date(editingTask.due_date).toISOString().slice(0, 16) : ""}
                  onChange={(e) => setEditingTask({ ...editingTask, due_date: e.target.value })}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={handleUpdateTask} className="bg-[#0747A1] text-white hover:bg-[#063d8c]">
              Update Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseManager;
