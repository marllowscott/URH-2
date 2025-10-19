import { supabase } from '@/integrations/supabase/client';

export interface XPCalculation {
  baseXP: number;
  multiplier: number;
  finalXP: number;
  reason: string;
}

export const XP_MULTIPLIERS = {
  video: 5,
  pdf: 3,
  image: 1,
  link: 2,
  text: 1
} as const;

export type ContentType = keyof typeof XP_MULTIPLIERS;

/**
 * Calculate XP for a module based on duration and content type
 */
export function calculateModuleXP(
  durationMinutes: number,
  contentType: ContentType,
  manualXP?: number
): XPCalculation {
  if (manualXP !== undefined) {
    return {
      baseXP: manualXP,
      multiplier: 1,
      finalXP: manualXP,
      reason: `Manual XP reward: ${manualXP} points`
    };
  }

  const multiplier = XP_MULTIPLIERS[contentType];
  const finalXP = durationMinutes * multiplier;

  return {
    baseXP: durationMinutes,
    multiplier,
    finalXP,
    reason: `${durationMinutes} minutes × ${multiplier} (${contentType}) = ${finalXP} points`
  };
}

/**
 * Award XP to a student for completing a lesson
 */
export async function awardXP(
  studentId: string,
  lessonId: string,
  courseId: string,
  program: string,
  xpAmount: number,
  reason: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Import localStorage functions
    const { updateStudent, getStudent } = await import('./localStorage');
    
    // Update student XP total
    const student = getStudent(studentId);
    if (student) {
      updateStudent(studentId, { XP: student.XP + xpAmount });
    }

    return { success: true };
  } catch (error) {
    console.error('Error in awardXP:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Calculate total XP for a course based on all its modules
 */
export function calculateCourseTotalXP(modules: Array<{
  duration_minutes: number;
  content_type?: ContentType;
  xp_reward?: number;
}>): number {
  return modules.reduce((total, module) => {
    const calculation = calculateModuleXP(
      module.duration_minutes,
      module.content_type || 'text',
      module.xp_reward
    );
    return total + calculation.finalXP;
  }, 0);
}

/**
 * Get student's total XP for a program
 */
export async function getStudentTotalXP(
  studentId: string,
  program?: string
): Promise<{ totalXP: number; error?: string }> {
  try {
    const { getStudent } = await import('./localStorage');
    const student = getStudent(studentId);
    
    if (!student) {
      return { totalXP: 0, error: 'Student not found' };
    }

    return { totalXP: student.XP };
  } catch (error) {
    return { 
      totalXP: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

/**
 * Get student's XP history for a program
 */
export async function getStudentXPHistory(
  studentId: string,
  program?: string,
  limit: number = 50
): Promise<{ events: any[]; error?: string }> {
  try {
    const { getCourseProgress } = await import('./localStorage');
    const progress = getCourseProgress();
    
    // Filter progress for this student and convert to XP events
    const studentProgress = progress
      .filter(p => p.studentId === studentId && p.completed)
      .map(p => ({
        id: `${p.studentId}-${p.courseId}-${p.moduleId}`,
        student_id: p.studentId,
        program: program || 'Software Development',
        reason: `Completed module in course`,
        xp: p.earnedXP,
        created_at: p.completedAt || new Date().toISOString()
      }))
      .slice(0, limit);

    return { events: studentProgress };
  } catch (error) {
    return { 
      events: [], 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}
