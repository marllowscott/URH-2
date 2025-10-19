import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Play, 
  Pause, 
  CheckCircle, 
  Lock, 
  Clock, 
  Star, 
  ArrowLeft,
  ArrowRight,
  Trophy
} from 'lucide-react';

interface Course {
  id: string;
  title: string;
  description: string | null;
  program: string;
  thumbnail_url?: string;
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  duration_minutes: number;
  position: number;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  video_url: string | null;
  notes: string | null;
  xp_reward: number;
  position: number;
}

interface CourseProgress {
  course_id: string;
  student_id: string;
  progress_percent: number;
}

interface LessonProgress {
  lesson_id: string;
  student_id: string;
  completed_video: boolean;
  completed_notes: boolean;
  completed_quiz: boolean;
  progress_percent: number;
}

const TakeCourse = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [lessons, setLessons] = useState<Record<string, Lesson[]>>({});
  const [courseProgress, setCourseProgress] = useState<CourseProgress | null>(null);
  const [lessonProgress, setLessonProgress] = useState<Record<string, LessonProgress>>({});
  const [currentModuleIndex, setCurrentModuleIndex] = useState(0);
  const [isTimerActive, setIsTimerActive] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [completedModules, setCompletedModules] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  // Auth guard: only students
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const role = data.session?.user.user_metadata?.role || "student";
      if (role !== "student") navigate("/auth");
    });
  }, [navigate]);

  // Load course data
  useEffect(() => {
    if (!courseId) return;
    
    const loadCourseData = async () => {
      try {
        // Load course
        const courseResponse = await supabase
          .from('courses')
          .select('*')
          .eq('id', courseId)
          .single();
        
        const courseData = 'data' in courseResponse ? courseResponse.data : null;
        const courseError = 'error' in courseResponse ? courseResponse.error : null;

        if (courseError) throw courseError;
        setCourse(courseData);

        // Load modules
        const modulesResponse = await supabase
          .from('modules')
          .select('*')
          .eq('course_id', courseId)
          .order('position');
        
        const modulesData = 'data' in modulesResponse ? modulesResponse.data : null;
        const modulesError = 'error' in modulesResponse ? modulesResponse.error : null;

        if (modulesError) throw modulesError;
        setModules(modulesData || []);

        // Load lessons for each module (in parallel)
        const lessonsData: Record<string, Lesson[]> = {};
        const lessonResponses = await Promise.all(
          (modulesData || []).map((m: any) =>
            supabase
              .from('lessons')
              .select('*')
              .eq('module_id', m.id)
              .order('position')
          )
        );

        (modulesData || []).forEach((m: any, idx: number) => {
          const resp = lessonResponses[idx];
          const moduleLessons = 'data' in resp ? (resp as any).data : null;
          const lessonsError = 'error' in resp ? (resp as any).error : null;
          if (lessonsError) throw lessonsError;
          lessonsData[m.id] = moduleLessons || [];
        });
        setLessons(lessonsData);

        // Load course progress
        const userResponse = await supabase.auth.getUser();
        const user = 'data' in userResponse ? userResponse.data?.user : userResponse.user;
        if (user) {
          const progressResponse = await supabase
            .from('course_progress')
            .select('*')
            .eq('course_id', courseId)
            .eq('student_id', user.id)
            .single();
          
          const progressData = 'data' in progressResponse ? progressResponse.data : null;

          setCourseProgress(progressData);

          // Load lesson progress
          const lessonProgressResponse = await supabase
            .from('lesson_progress')
            .select('*')
            .eq('student_id', user.id);
          
          const lessonProgressData = 'data' in lessonProgressResponse ? lessonProgressResponse.data : null;

          const progressMap: Record<string, LessonProgress> = {};
          lessonProgressData?.forEach(progress => {
            progressMap[progress.lesson_id] = progress;
          });
          setLessonProgress(progressMap);

          // Determine completed modules
          const completed = new Set<string>();
          modulesData?.forEach(module => {
            const moduleLessons = lessonsData[module.id] || [];
            const allCompleted = moduleLessons.every(lesson => {
              const progress = progressMap[lesson.id];
              return progress && progress.progress_percent >= 100;
            });
            if (allCompleted && moduleLessons.length > 0) {
              completed.add(module.id);
            }
          });
          setCompletedModules(completed);

          // Set current module to first incomplete one
          const firstIncomplete = modulesData?.findIndex(module => !completed.has(module.id));
          if (firstIncomplete !== undefined && firstIncomplete >= 0) {
            setCurrentModuleIndex(firstIncomplete);
          }
        }
      } catch (error) {
        console.error('Error loading course data:', error);
        toast({
          title: "Error loading course",
          description: error instanceof Error ? error.message : "Unknown error",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    loadCourseData();
  }, [courseId, toast]);

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isTimerActive && timeRemaining > 0) {
      interval = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            setIsTimerActive(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isTimerActive, timeRemaining]);

  const startModule = (module: Module) => {
    setTimeRemaining(module.duration_minutes * 60);
    setIsTimerActive(true);
  };

  const markModuleComplete = async (module: Module) => {
    try {
      const userResponse = await supabase.auth.getUser();
      const user = 'data' in userResponse ? userResponse.data?.user : userResponse.user;
      if (!user) return;

      // Award XP for each lesson in the module
      const moduleLessons = lessons[module.id] || [];
      let totalXP = 0;

      for (const lesson of moduleLessons) {
        const progress = lessonProgress[lesson.id];
        if (!progress || progress.progress_percent < 100) {
          // Mark lesson as complete
          await supabase
            .from('lesson_progress')
            .upsert({
              lesson_id: lesson.id,
              student_id: user.id,
              completed_video: true,
              completed_notes: true,
              completed_quiz: false,
              progress_percent: 100
            });

          // Award XP
          await supabase
            .from('xp_events')
            .insert({
              student_id: user.id,
              program: course?.program || '',
              reason: `Completed lesson: ${lesson.title}`,
              xp: lesson.xp_reward
            });

          totalXP += lesson.xp_reward;
        }
      }

      // Update course progress
      const completedModulesCount = completedModules.size + 1;
      const totalModules = modules.length;
      const newProgressPercent = Math.round((completedModulesCount / totalModules) * 100);

      await supabase
        .from('course_progress')
        .upsert({
          course_id: courseId!,
          student_id: user.id,
          progress_percent: newProgressPercent
        });

      // Update local state
      setCompletedModules(prev => new Set([...prev, module.id]));
      setCourseProgress(prev => prev ? { ...prev, progress_percent: newProgressPercent } : null);

      // Move to next module
      const nextIndex = currentModuleIndex + 1;
      if (nextIndex < modules.length) {
        setCurrentModuleIndex(nextIndex);
      }

      toast({
        title: "Module completed!",
        description: `You earned ${totalXP} XP points!`,
      });

    } catch (error) {
      console.error('Error completing module:', error);
      toast({
        title: "Error completing module",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const isModuleUnlocked = (moduleIndex: number) => {
    if (moduleIndex === 0) return true;
    return completedModules.has(modules[moduleIndex - 1]?.id);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#0747A1] mx-auto"></div>
          <p className="mt-4 text-lg">Loading course...</p>
        </div>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Course not found</h1>
          <Button onClick={() => navigate('/student')} className="mt-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  const currentModule = modules[currentModuleIndex];
  const moduleLessons = currentModule ? lessons[currentModule.id] || [] : [];
  const totalXP = moduleLessons.reduce((sum, lesson) => sum + lesson.xp_reward, 0);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Button 
              variant="ghost" 
              onClick={() => navigate('/student')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Button>
            
            <div className="text-center">
              <h1 className="text-2xl font-bold">{course.title}</h1>
              <p className="text-muted-foreground">{course.program}</p>
            </div>

            <div className="flex items-center gap-4">
              <Badge 
                variant={courseProgress?.progress_percent && courseProgress.progress_percent > 0 ? "default" : "secondary"} 
                className={`flex items-center gap-1 ${
                  courseProgress?.progress_percent && courseProgress.progress_percent > 0 
                    ? 'bg-[#FF8181] text-white' 
                    : 'bg-gray-100 text-gray-600'
                }`}
              >
                <Trophy className="h-3 w-3" />
                {courseProgress?.progress_percent || 0}% Complete
              </Badge>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Course Progress */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Course Progress</span>
              <span className="text-sm text-muted-foreground">
                {completedModules.size} of {modules.length} modules completed
              </span>
            </div>
            <Progress 
              value={courseProgress?.progress_percent || 0} 
              className={`h-2 ${
                courseProgress?.progress_percent && courseProgress.progress_percent > 0 
                  ? '[&>div]:bg-[#FF8181]' 
                  : '[&>div]:bg-gray-300'
              }`}
            />
          </CardContent>
        </Card>

        {/* Current Module */}
        {currentModule && (
          <Card className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  Module {currentModuleIndex + 1}: {currentModule.title}
                  {completedModules.has(currentModule.id) && (
                    <CheckCircle className="h-5 w-5 text-[#FF8181]" />
                  )}
                </CardTitle>
                <Badge variant="outline" className="flex items-center gap-1">
                  <Star className="h-3 w-3" />
                  {totalXP} XP
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {currentModule.duration_minutes} minutes
                </div>
                <div className="flex items-center gap-1">
                  <Play className="h-4 w-4" />
                  {moduleLessons.length} lesson{moduleLessons.length !== 1 ? 's' : ''}
                </div>
              </div>

            {/* Timer */}
            {isTimerActive && (
              <div className="bg-[#E6F0FF] border border-[#0747A1] rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 bg-[#0747A1] rounded-full animate-pulse"></div>
                    <span className="font-medium">Module in progress</span>
                  </div>
                  <div className="text-2xl font-mono font-bold text-[#0747A1]">
                    {formatTime(timeRemaining)}
                  </div>
                </div>
              </div>
            )}

            {/* Module Actions */}
            <div className="flex gap-2">
              {!completedModules.has(currentModule.id) && !isTimerActive && (
                <Button 
                  onClick={() => startModule(currentModule)}
                  className="bg-[#0747A1] text-white hover:bg-[#063d8c]"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Module
                </Button>
              )}
              
              {isTimerActive && timeRemaining === 0 && (
                <Button 
                  onClick={() => markModuleComplete(currentModule)}
                  className="bg-[#0747A1] text-white hover:bg-[#0747A1]/80"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Mark as Complete
                </Button>
              )}
            </div>

            {/* Lessons */}
            {moduleLessons.length > 0 && (
              <div className="space-y-2">
                <h4 className="font-medium">Lessons:</h4>
                {moduleLessons.map((lesson, index) => (
                  <div key={lesson.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-[#0747A1] text-white rounded-full flex items-center justify-center text-xs font-bold">
                        {index + 1}
                      </div>
                      <span className="font-medium">{lesson.title}</span>
                    </div>
                    <Badge variant="outline" className="flex items-center gap-1">
                      <Star className="h-3 w-3" />
                      {lesson.xp_reward} XP
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
};

export default TakeCourse;