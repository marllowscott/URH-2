import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Upload, X, Plus, Clock, Star, CheckCircle } from 'lucide-react';
import { uploadThumbnail, uploadModuleContent, validateFile } from '@/lib/upload';
import { supabase } from '@/integrations/supabase/client';

interface Module {
  id: string;
  title: string;
  duration_minutes: number;
  xp_mode: 'auto' | 'manual';
  xp_reward: number;
  content_type: 'video' | 'pdf' | 'image' | 'link' | 'text';
  content_url?: string;
  content_text?: string;
  content_file?: File;
}

interface CourseFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const programs = ['Software Development', 'Digital Marketing', 'Product Design'];

const XP_MULTIPLIERS = {
  video: 5,
  pdf: 3,
  image: 1,
  link: 2,
  text: 1
};

export default function CourseForm({ isOpen, onClose, onSuccess }: CourseFormProps) {
  const [loading, setLoading] = useState(false);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string>('');
  
  // Course data
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [program, setProgram] = useState('');
  const [numberOfModules, setNumberOfModules] = useState(1);
  
  // Modules data
  const [modules, setModules] = useState<Module[]>([
    {
      id: '1',
      title: '',
      duration_minutes: 30,
      xp_mode: 'auto',
      xp_reward: 0,
      content_type: 'video',
      content_url: '',
      content_text: ''
    }
  ]);

  const calculateAutoXP = (module: Module): number => {
    if (module.xp_mode === 'manual') return module.xp_reward;
    
    const multiplier = XP_MULTIPLIERS[module.content_type];
    return module.duration_minutes * multiplier;
  };

  const updateModule = (index: number, updates: Partial<Module>) => {
    const newModules = [...modules];
    newModules[index] = { ...newModules[index], ...updates };
    
    // Auto-calculate XP if in auto mode
    if (updates.xp_mode === 'auto' || updates.duration_minutes || updates.content_type) {
      newModules[index].xp_reward = calculateAutoXP(newModules[index]);
    }
    
    setModules(newModules);
  };

  const addModule = () => {
    const newModule: Module = {
      id: (modules.length + 1).toString(),
      title: '',
      duration_minutes: 30,
      xp_mode: 'auto',
      xp_reward: calculateAutoXP({
        id: '',
        title: '',
        duration_minutes: 30,
        xp_mode: 'auto',
        xp_reward: 0,
        content_type: 'video'
      }),
      content_type: 'video',
      content_url: '',
      content_text: ''
    };
    setModules([...modules, newModule]);
  };

  const removeModule = (index: number) => {
    if (modules.length > 1) {
      setModules(modules.filter((_, i) => i !== index));
    }
  };

  const handleThumbnailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const validation = validateFile(file);
      if (!validation.valid) {
        alert(validation.error);
        return;
      }
      
      setThumbnailFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setThumbnailPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, moduleIndex: number) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const validation = validateFile(file);
    if (!validation.valid) {
      alert(validation.error);
      return;
    }

    try {
      // Convert file to base64 for localStorage storage
      const reader = new FileReader();
      const base64Promise = new Promise<string>((resolve, reject) => {
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
      });
      reader.readAsDataURL(file);
      const base64Data = await base64Promise;

      // Update module with base64 data
      updateModule(moduleIndex, { content_url: base64Data });
      
      alert('File uploaded successfully!');
    } catch (error) {
      console.error('Error uploading file:', error);
      alert(`Error uploading file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !description || !program) {
      alert('Please fill in all required fields');
      return;
    }

    // Validate modules
    for (const module of modules) {
      if (!module.title) {
        alert('Please fill in all module titles');
        return;
      }
      if (module.content_type !== 'text' && !module.content_url) {
        alert('Please provide content URL for all modules');
        return;
      }
      if (module.content_type === 'text' && !module.content_text) {
        alert('Please provide content text for text modules');
        return;
      }
    }

    setLoading(true);

    try {
      // Get current user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Convert thumbnail to base64 if provided
      let thumbnail = '';
      if (thumbnailFile) {
        const reader = new FileReader();
        thumbnail = await new Promise<string>((resolve, reject) => {
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
        });
        reader.readAsDataURL(thumbnailFile);
      }

      // Create course with modules
      const courseData = {
        title,
        description,
        thumbnail,
        program,
        modules: modules.map((module, index) => ({
          id: `module-${index + 1}`,
          title: module.title,
          resources: [], // Will be populated when resources are added
          time: module.duration_minutes,
          XP: calculateAutoXP(module)
        }))
      };

      const { data: createdCourse, error: courseError } = await supabase
        .from('courses')
        .insert(courseData)
        .select()
        .single();

      if (courseError) throw courseError;

      // Create notification
      await supabase
        .from('notifications')
        .insert({
          program,
          type: 'course',
          title: `New Course: ${title}`
        });

      // Reset form
      setTitle('');
      setDescription('');
      setProgram('');
      setNumberOfModules(1);
      setModules([{
        id: '1',
        title: '',
        duration_minutes: 30,
        xp_mode: 'auto',
        xp_reward: calculateAutoXP({
          id: '',
          title: '',
          duration_minutes: 30,
          xp_mode: 'auto',
          xp_reward: 0,
          content_type: 'video'
        }),
        content_type: 'video',
        content_url: '',
        content_text: ''
      }]);
      setThumbnailFile(null);
      setThumbnailPreview('');

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Error creating course:', error);
      alert(`Error creating course: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Create New Course</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Course Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Course Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title">Course Title *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Enter course title"
                  required
                />
              </div>

              <div>
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe what students will learn"
                  rows={3}
                  required
                />
              </div>

              <div>
                <Label htmlFor="program">Program *</Label>
                <Select value={program} onValueChange={setProgram} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select program" />
                  </SelectTrigger>
                  <SelectContent>
                    {programs.map((p) => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="thumbnail">Course Thumbnail</Label>
                <div className="mt-2">
                  {thumbnailPreview ? (
                    <div className="relative">
                      <img
                        src={thumbnailPreview}
                        alt="Thumbnail preview"
                        className="w-32 h-20 object-cover rounded-lg"
                      />
                      <Button
                        type="button"
                        variant="destructive"
                        size="sm"
                        className="absolute -top-2 -right-2"
                        onClick={() => {
                          setThumbnailFile(null);
                          setThumbnailPreview('');
                        }}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <label className="flex items-center justify-center w-32 h-20 border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:border-gray-400">
                      <Upload className="h-6 w-6 text-gray-400" />
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleThumbnailChange}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Modules */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center justify-between">
                Course Modules
                <Button type="button" onClick={addModule} size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Module
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {modules.map((module, index) => (
                <Card key={module.id} className="border-l-4 border-l-blue-500">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-base">Module {index + 1}</CardTitle>
                      {modules.length > 1 && (
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => removeModule(index)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Module Title *</Label>
                      <Input
                        value={module.title}
                        onChange={(e) => updateModule(index, { title: e.target.value })}
                        placeholder="Enter module title"
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Duration (minutes) *</Label>
                        <Input
                          type="number"
                          min="1"
                          value={module.duration_minutes}
                          onChange={(e) => updateModule(index, { duration_minutes: parseInt(e.target.value) || 30 })}
                          required
                        />
                      </div>

                      <div>
                        <Label>XP Mode</Label>
                        <Select
                          value={module.xp_mode}
                          onValueChange={(value: 'auto' | 'manual') => updateModule(index, { xp_mode: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="auto">Auto Calculate</SelectItem>
                            <SelectItem value="manual">Manual</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    {module.xp_mode === 'manual' && (
                      <div>
                        <Label>XP Reward</Label>
                        <Input
                          type="number"
                          min="1"
                          value={module.xp_reward}
                          onChange={(e) => updateModule(index, { xp_reward: parseInt(e.target.value) || 0 })}
                        />
                      </div>
                    )}

                    {module.xp_mode === 'auto' && (
                      <div className="flex items-center text-sm text-gray-600">
                        <Star className="h-4 w-4 mr-1" />
                        Auto XP: {calculateAutoXP(module)} points
                      </div>
                    )}

                    <div>
                      <Label>Content Type</Label>
                      <Select
                        value={module.content_type}
                        onValueChange={(value: any) => updateModule(index, { content_type: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="video">Video</SelectItem>
                          <SelectItem value="pdf">PDF Document</SelectItem>
                          <SelectItem value="image">Image</SelectItem>
                          <SelectItem value="link">External Link</SelectItem>
                          <SelectItem value="text">Text Content</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {module.content_type === 'text' ? (
                      <div>
                        <Label>Content Text *</Label>
                        <Textarea
                          value={module.content_text || ''}
                          onChange={(e) => updateModule(index, { content_text: e.target.value })}
                          placeholder="Enter the text content for this module"
                          rows={4}
                          required
                        />
                      </div>
                    ) : (
                      <div>
                        <Label>Content *</Label>
                        <div className="space-y-2">
                          <Input
                            value={module.content_url || ''}
                            onChange={(e) => updateModule(index, { content_url: e.target.value })}
                            placeholder="Enter URL or upload file"
                            required
                          />
                          <div className="flex items-center gap-2">
                            <label className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md cursor-pointer hover:bg-gray-50">
                              <Upload className="h-4 w-4 mr-2" />
                              Upload File
                              <input
                                type="file"
                                accept={
                                  module.content_type === 'video' ? 'video/*' :
                                  module.content_type === 'pdf' ? '.pdf' :
                                  module.content_type === 'image' ? 'image/*' :
                                  '.txt,.pdf,.mp4,.webm,.mov,.png,.jpg,.jpeg'
                                }
                                onChange={(e) => handleFileUpload(e, index)}
                                className="hidden"
                              />
                            </label>
                            {module.content_file && (
                              <div className="flex items-center gap-2 text-sm text-green-600">
                                <CheckCircle className="h-4 w-4" />
                                {module.content_file.name}
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => updateModule(index, { content_file: null, content_url: '' })}
                                  className="h-6 w-6 p-0"
                                >
                                  <X className="h-3 w-3" />
                                </Button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end space-x-4">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating Course...' : 'Create Course'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}