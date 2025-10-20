import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, PlusCircle, Menu, X, Pencil, Trash2, Clock, Camera, Edit, BookOpen, FileText, TrendingUp, Users, Activity, BarChart3, Bell } from "lucide-react";
import ResourceCard from "@/components/ResourceCard";
import { useNotifications } from "@/hooks/useNotifications";
import ProfileModal from "@/components/ProfileModal";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  file_path: string | null;
  program?: string;
  created_at: string;
  expiry_date?: string | null;
};

type Task = {
  id: string;
  program: string;
  title: string;
  description: string | null;
  schedule: "daily" | "weekly" | "monthly" | "ad-hoc";
  due_at: string | null;
  created_by: string;
};

const InstructorDashboard = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [selectedProgram, setSelectedProgram] = useState("Software Development");
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingResource, setEditingResource] = useState<Resource | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [newResource, setNewResource] = useState({ title: "", description: "", type: "", url: "", file: null as File | null, expiry_date: "" });
  const [newTask, setNewTask] = useState({ title: "", description: "", schedule: "daily" as Task["schedule"], due_at: "" });
  const [profileName, setProfileName] = useState(() => {
    try {
      const saved = localStorage.getItem("userProfile");
      return saved ? JSON.parse(saved).name : "Instructor";
    } catch {
      return "Instructor";
    }
  });
  const [profileImage, setProfileImage] = useState(() => {
    try {
      const saved = localStorage.getItem("userProfile");
      return saved ? JSON.parse(saved).image : "";
    } catch {
      return "";
    }
  });
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [studentCount, setStudentCount] = useState(0);
  const [engagementRate, setEngagementRate] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();
  const { counts } = useNotifications(selectedProgram);

  const handleSaveProfile = (name: string, image: string) => {
    setProfileName(name);
    setProfileImage(image);
    // Persist profile changes to localStorage
    localStorage.setItem("userProfile", JSON.stringify({ name, image }));
    toast({ title: "Profile updated", description: "Your profile has been updated successfully." });
  };

  const handleAddTask = async () => {
    if (!newTask.title.trim()) {
      toast({ title: "Missing Title", description: "Please enter a task title.", variant: "destructive" });
      return;
    }

    const userData: any = await supabase.auth.getUser();
    if (!userData?.data?.user) {
      toast({ title: "Authentication required", description: "Please log in again.", variant: "destructive" });
      return;
    }

    const taskData = {
      title: newTask.title,
      description: newTask.description || null,
      schedule: newTask.schedule,
      program: selectedProgram,
      due_at: newTask.due_at ? new Date(newTask.due_at).toISOString() : null,
      created_by: userData.data.user.id,
    };

    const { error } = await supabase.from("tasks").insert([taskData]) as any;

    if (error) {
      toast({ title: "Task creation failed", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Task added successfully!" });
      setShowTaskModal(false);
      setNewTask({ title: "", description: "", schedule: "daily", due_at: "" });
    }
  };

  const programs = ["Software Development", "Digital Marketing", "Product Design"];

  const fetchResources = useCallback(async () => {
    const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false }) as any;
    if (error) toast({ title: "Error loading resources", description: error.message, variant: "destructive" });
    else setResources(data || []);
  }, [toast]);

  const fetchStudentCount = useCallback(async () => {
    // Count students from auth metadata or profiles table
    try {
      // Try using RPC function if available
      const { data, error } = await (supabase as any).rpc('count_students');
      
      if (!error && data !== null) {
        setStudentCount(data);
        return;
      }
    } catch (err) {
      // RPC not available, continue to fallback
    }
    
    // Fallback: Count from resources table (students who have accessed resources)
    // This is an approximation based on activity
    const { data: resourceData } = await supabase
      .from('resources')
      .select('program') as any;
    
    // For now, show a default count or calculate based on available data
    // In production, you'd have a proper profiles table or user tracking
    setStudentCount(0); // Will be updated when proper tracking is set up
  }, []);

  const fetchEngagementRate = useCallback(async () => {
    try {
      // Calculate engagement based on course_progress
      const { data: progressData, error } = await (supabase as any)
        .from('course_progress')
        .select('progress_percentage');
      
      if (error || !progressData || progressData.length === 0) {
        // Default to 0% if no data available
        setEngagementRate(0);
        return;
      }
      
      // Calculate average progress percentage across all students
      const totalProgress = progressData.reduce((sum: number, item: any) => 
        sum + (item.progress_percentage || 0), 0
      );
      const avgProgress = Math.round(totalProgress / progressData.length);
      setEngagementRate(avgProgress);
    } catch (err) {
      // If table doesn't exist or error occurs, default to 0
      setEngagementRate(0);
    }
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }: any) => {
      const session = data.session;
      if (!session) navigate("/auth");
      else {
        const role = session.user.user_metadata?.role || "instructor";
        if (role !== "instructor") navigate(role === "student" ? "/student" : "/auth");
      }
    });

    const authListener: any = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) navigate("/auth");
      else {
        const role = session.user.user_metadata?.role || "instructor";
        if (role !== "instructor") navigate(role === "student" ? "/student" : "/auth");
      }
    });

    return () => {
      authListener.data.subscription.unsubscribe();
    };
  }, [navigate]);

  useEffect(() => {
    fetchResources();
    fetchStudentCount();
    fetchEngagementRate();

    const channel = (supabase as any)
      .channel("resources-updates")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "resources" },
        () => fetchResources()
      )
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [fetchResources, fetchStudentCount, fetchEngagementRate]);

  const handleAddResource = async () => {
    if (!newResource.title.trim()) {
      toast({ title: "Missing Title", description: "Please enter a resource title.", variant: "destructive" });
      return;
    }
    
    // Prevent duplicate submissions
    if (isUploading) {
      toast({ title: "Please wait", description: "Upload in progress...", variant: "destructive" });
      return;
    }
    
    // Check for duplicates (same title in same program)
    if (!editingResource) {
      const duplicate = resources.find(
        r => r.title.toLowerCase().trim() === newResource.title.toLowerCase().trim() && 
             r.program === selectedProgram
      );
      if (duplicate) {
        toast({ 
          title: "❌ Duplicate Resource", 
          description: `A resource named "${newResource.title}" already exists in ${selectedProgram}.`, 
          variant: "destructive" 
        });
        return;
      }
    }

    setIsUploading(true);
    const userData: any = await supabase.auth.getUser();
    if (!userData?.data?.user) {
      toast({ title: "Authentication required", description: "Please log in again.", variant: "destructive" });
      setIsUploading(false);
      return;
    }

    let filePath: string | null = null;
    let resourceUrl: string | null = newResource.url || null;

    // Handle file upload to Supabase Storage
    if (newResource.file) {
      try {
        const fileExt = newResource.file.name.split('.').pop();
        const fileName = `${Math.random()}.${fileExt}`;
        const uploadPath = `${userData.data.user.id}/${fileName}`;
        const { error: uploadError } = await supabase.storage
          .from('resources')
          .upload(uploadPath, newResource.file);

        if (uploadError) {
          toast({ title: "File upload failed", description: uploadError.message, variant: "destructive" });
          setIsUploading(false);
          return;
        }

        filePath = uploadPath;
        resourceUrl = null; // Clear URL if file is uploaded
      } catch (error) {
        toast({ title: "File upload failed", description: "Failed to upload file", variant: "destructive" });
        setIsUploading(false);
        return;
      }
    }

    const resourceData = {
      title: newResource.title,
      description: newResource.description || null,
      type: newResource.type || "file",
      url: resourceUrl,
      file_path: filePath,
      program: selectedProgram,
      created_by: userData.data.user.id,
      expiry_date: newResource.expiry_date ? new Date(newResource.expiry_date).toISOString() : null,
    };

    const wasEditing = editingResource;
    toast({ title: `${wasEditing ? "Updating" : "Uploading"}...`, description: "Please wait" });

    let error;
    if (wasEditing) {
      ({ error } = await supabase.from("resources").update(resourceData).eq("id", wasEditing.id) as any);
    } else {
      ({ error } = await supabase.from("resources").insert([resourceData]) as any);
    }

    setIsUploading(false);

    if (error) {
      toast({ title: wasEditing ? "Update failed" : "Upload failed", description: error.message, variant: "destructive" });
    } else {
      // Close modal and reset form
      setShowAddModal(false);
      setEditingResource(null);
      setNewResource({ title: "", description: "", type: "", url: "", file: null, expiry_date: "" });
      
      toast({ 
        title: `✅ ${wasEditing ? "Updated" : "Uploaded"} Successfully!`, 
        description: `Resource "${newResource.title}" has been ${wasEditing ? "updated" : "added"}.`,
      });
      
      // Refresh to sync with server
      fetchResources();
    }
  };

  const handleEdit = (resource: Resource) => {
    setEditingResource(resource);
    setNewResource({
      title: resource.title,
      description: resource.description || "",
      type: resource.type,
      url: resource.url || "",
      file: null,
      expiry_date: resource.expiry_date ? new Date(resource.expiry_date).toISOString().slice(0, 16) : "",
    });
    setShowAddModal(true);
  };

  const handleDelete = async (resource: Resource) => {
    if (!confirm(`Are you sure you want to delete "${resource.title}"?`)) return;

    const { error } = await supabase
      .from("resources")
      .delete()
      .eq("id", resource.id) as any;

    if (error) {
      console.error("Error deleting resource:", (error as any).message || error);
      alert("Failed to delete resource. Please try again.");
      return;
    }

    setResources((prev) => prev.filter((r) => r.id !== resource.id));

    if (resource.file_path) {
      try { await supabase.storage.from("resources").remove([resource.file_path]); } catch {}
    }

    fetchResources();
  };

  const handleSetExpiry = async (resource: Resource) => {
    const expiryInput = prompt("Set expiry date (YYYY-MM-DD HH:MM):", resource.expiry_date ? new Date(resource.expiry_date).toISOString().slice(0, 16) : "");
    if (expiryInput === null) return;

    const expiryDate = expiryInput ? new Date(expiryInput).toISOString() : null;

    // Optimistic update
    setResources(prev => prev.map(r => 
      r.id === resource.id ? { ...r, expiry_date: expiryDate } : r
    ));

    const { error } = await supabase.from("resources").update({ expiry_date: expiryDate }).eq("id", resource.id) as any;
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      // Only revert on error
      fetchResources();
    } else {
      toast({ title: "Expiry date updated successfully!" });
      // Don't refetch - keep optimistic update
    }
  };

  const handleSignOut = async () => {
    await (supabase.auth as any).signOut();
    navigate("/auth");
  };

  // Handle preview function for resources
  const handlePreview = async (resource: Resource) => {
    if (resource.url) {
      // If it's a URL, open in new tab
      window.open(resource.url, '_blank');
    } else if (resource.file_path) {
      try {
        // Get the public URL for the file from Supabase storage
        const { data } = supabase.storage
          .from('resources')
          .getPublicUrl(resource.file_path);
        
        if (data?.publicUrl) {
          // Open the file in a new tab for preview
          window.open(data.publicUrl, '_blank');
        } else {
          toast({
            title: "Preview not available",
            description: "Unable to preview this resource.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Preview error:', error);
        toast({
          title: "Preview failed",
          description: "Unable to preview this resource.",
          variant: "destructive"
        });
      }
    }
  };

  // Handle download function for resources
  const handleDownload = async (resource: Resource) => {
    if (resource.url) {
      // If it's a URL, open in new tab
      window.open(resource.url, '_blank');
    } else if (resource.file_path) {
      try {
        const { data } = supabase.storage.from('resources').getPublicUrl(resource.file_path);
        if (data?.publicUrl) {
          window.open(data.publicUrl, '_blank');
          toast({
            title: "✅ Opened",
            description: `${resource.title} opened in a new tab.`
          });
        } else {
          toast({
            title: "Preview not available",
            description: "Unable to preview this resource.",
            variant: "destructive"
          });
        }
      } catch (error) {
        console.error('Download error:', error);
        toast({
          title: "Download failed",
          description: error instanceof Error ? error.message : "Unable to download this resource.",
          variant: "destructive"
        });
      }
    }
  };

  const filteredResources = resources.filter((r) => r.program === selectedProgram);

  return (
    <div className="min-h-screen bg-background relative">
      {/* Logo */}
      {/* Top Section */}
      <header className="border-b border-border sticky top-0 z-10 bg-card">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div></div>

            <div className="flex items-center gap-4">
              {/* Notification Badges */}
              <div className="flex items-center gap-2">
                {counts.newResources > 0 && (
                  <Badge className="bg-[#0091FF] text-white rounded-full px-2 py-0.5 text-xs font-bold">
                    {counts.newResources}
                  </Badge>
                )}
                {counts.newCourses > 0 && (
                  <Badge className="bg-[#FF8181] text-white rounded-full px-2 py-0.5 text-xs font-bold">
                    {counts.newCourses}
                  </Badge>
                )}
              </div>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <div className="relative flex items-center gap-3 cursor-pointer">
                    <Avatar className="ring-2 ring-[#0747A1]/30 hover:ring-[#0747A1]/50 transition-all">
                      <AvatarImage src={profileImage} alt={profileName} className="object-cover" />
                      <AvatarFallback className="bg-gradient-to-br from-[#0747A1] to-[#0A58CA] text-white">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-[#0747A1]">{profileName}</span>
                  </div>
                </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-2 border-[#0747A1]/20 shadow-xl rounded-xl animate-in fade-in-0 zoom-in-95 duration-200">
                <DropdownMenuLabel className="text-[#0747A1] font-bold text-base py-3">{profileName}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#0747A1]/10" />
                <DropdownMenuItem onClick={() => setShowProfileModal(true)} className="hover:bg-[#0747A1]/10 focus:bg-[#0747A1]/10 cursor-pointer py-3 rounded-lg mx-1">
                  <Camera className="mr-2 h-4 w-4 text-[#0747A1]" /> 
                  <span className="text-gray-700 font-medium">Change Picture</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/instructor/programs')} className="hover:bg-[#0747A1]/10 focus:bg-[#0747A1]/10 cursor-pointer py-3 rounded-lg mx-1">
                  <User className="mr-2 h-4 w-4 text-[#0747A1]" /> 
                  <span className="text-gray-700 font-medium">My Programs</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#0747A1]/10" />
                <DropdownMenuItem onClick={handleSignOut} className="hover:bg-red-50 focus:bg-red-50 cursor-pointer py-3 rounded-lg mx-1">
                  <LogOut className="mr-2 h-4 w-4 text-red-600" /> 
                  <span className="text-red-600 font-medium">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            </div>
          </div>

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <div className="relative flex items-center gap-3 cursor-pointer">
                  <Avatar className="ring-2 ring-[#0747A1]/30 hover:ring-[#0747A1]/50 transition-all">
                    <AvatarImage src={profileImage} alt={profileName} className="object-cover" />
                    <AvatarFallback className="bg-gradient-to-br from-[#0747A1] to-[#0A58CA] text-white">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-[#0747A1]">{profileName}</span>
                </div>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-white border-2 border-[#0747A1]/20 shadow-xl rounded-xl animate-in fade-in-0 zoom-in-95 duration-200">
                <DropdownMenuLabel className="text-[#0747A1] font-bold text-base py-3">{profileName}</DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[#0747A1]/10" />
                <DropdownMenuItem onClick={() => setShowProfileModal(true)} className="hover:bg-[#0747A1]/10 focus:bg-[#0747A1]/10 cursor-pointer py-3 rounded-lg mx-1">
                  <Camera className="mr-2 h-4 w-4 text-[#0747A1]" /> 
                  <span className="text-gray-700 font-medium">Change Picture</span>
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate('/instructor/programs')} className="hover:bg-[#0747A1]/10 focus:bg-[#0747A1]/10 cursor-pointer py-3 rounded-lg mx-1">
                  <User className="mr-2 h-4 w-4 text-[#0747A1]" /> 
                  <span className="text-gray-700 font-medium">My Programs</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="bg-[#0747A1]/10" />
                <DropdownMenuItem onClick={handleSignOut} className="hover:bg-red-50 focus:bg-red-50 cursor-pointer py-3 rounded-lg mx-1">
                  <LogOut className="mr-2 h-4 w-4 text-red-600" /> 
                  <span className="text-red-600 font-medium">Sign Out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            {/* Notification Badges */}
            <div className="flex items-center gap-2">
              {counts.newResources > 0 && (
                <Badge className="bg-[#0091FF] text-white rounded-full px-2 py-0.5 text-xs font-bold">
                  {counts.newResources}
                </Badge>
              )}
              {counts.newCourses > 0 && (
                <Badge className="bg-[#FF8181] text-white rounded-full px-2 py-0.5 text-xs font-bold">
                  {counts.newCourses}
                </Badge>
              )}
            </div>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-[#0747A1] hover:bg-[#E6F2FF] rounded-lg transition-colors"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="md:hidden mt-4 pb-4 border-t border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profileImage} alt={profileName} />
                    <AvatarFallback>
                      <User className="h-4 w-4" />
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium">{profileName}</span>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    handleSignOut();
                    setMobileMenuOpen(false);
                  }}
                >
                  <LogOut className="h-4 w-4 mr-2" />
                  Sign Out
                </Button>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Instructor Dashboard Header */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-6 md:mt-8">

        {/* Dashboard Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total Resources Card */}
          <Card className="border-l-4 border-l-[#0747A1] hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Resources</p>
                  <p className="text-2xl md:text-3xl font-bold text-[#0747A1]">{resources.length}</p>
                </div>
                <div className="bg-[#E6F2FF] p-3 rounded-full">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 text-[#0747A1]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Programs Card */}
          <Card className="border-l-4 border-l-[#0747A1] hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Active Programs</p>
                  <p className="text-2xl md:text-3xl font-bold text-[#0747A1]">3</p>
                </div>
                <div className="bg-[#E6F2FF] p-3 rounded-full">
                  <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-[#0747A1]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Total Students Card */}
          <Card className="border-l-4 border-l-[#0091FF] hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Total Students</p>
                  <p className="text-2xl md:text-3xl font-bold text-[#0091FF]">{studentCount}</p>
                </div>
                <div className="bg-[#E6F5FF] p-3 rounded-full">
                  <Users className="h-5 w-5 md:h-6 md:w-6 text-[#0091FF]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Rate Card */}
          <Card className="border-l-4 border-l-[#FDB353] hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Engagement</p>
                  <p className="text-2xl md:text-3xl font-bold text-[#FDB353]">{engagementRate}%</p>
                </div>
                <div className="bg-[#FFF4E6] p-3 rounded-full">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-[#FDB353]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions & Analytics Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          {/* Quick Actions Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <PlusCircle className="h-5 w-5 text-[#0747A1]" />
                <h3 className="text-lg font-semibold text-[#0747A1]">Quick Actions</h3>
              </div>
              <div className="space-y-3">
                <Button
                  onClick={() => setShowAddModal(true)}
                  className="w-full bg-[#0747A1] text-white hover:bg-[#063d8c] justify-start"
                >
                  <PlusCircle className="mr-2 h-4 w-4" /> Add New Resource
                </Button>
                <Button
                  onClick={() => setShowTaskModal(true)}
                  className="w-full bg-[#0747A1] text-white hover:bg-[#063d8c] justify-start"
                >
                  <Clock className="mr-2 h-4 w-4" /> Create Task
                </Button>
                <Button
                  onClick={() => navigate('/instructor/programs')}
                  variant="outline"
                  className="w-full justify-start hover:bg-[#E6F2FF]"
                >
                  <BookOpen className="mr-2 h-4 w-4" /> Manage Programs
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Resource Summary Card */}
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-[#0747A1]" />
                  <h3 className="text-lg font-semibold text-[#0747A1]">Resource Summary</h3>
                </div>
                <Activity className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {programs.map((program, index) => {
                  const programResources = resources.filter(r => r.program === program);
                  const colors = ['#0747A1', '#0747A1', '#0747A1'];
                  const bgColors = ['bg-[#E6F2FF]', 'bg-[#E6F2FF]', 'bg-[#E6F2FF]'];
                  return (
                    <div key={program} className={`flex items-center gap-3 p-3 ${bgColors[index]} rounded-lg`}>
                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: colors[index] }}></div>
                      <p className="text-sm flex-1">
                        <span className="font-semibold">{program}</span>
                      </p>
                      <span className="text-sm font-bold text-[#0747A1]">{programResources.length} resources</span>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Program Tabs */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-6">
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 max-w-full">
            {programs.map((program) => (
              <Button
                key={program}
                onClick={() => setSelectedProgram(program)}
                variant="outline"
                size="sm"
                className={`rounded-xl transition-all text-xs md:text-sm px-3 py-2 md:px-4 md:py-2 whitespace-nowrap ${
                  selectedProgram === program
                    ? "bg-[#E6F2FF] text-[#0747A1] border border-[#0747A1]/30"
                    : "hover:bg-[#F2F7FF] text-[#0747A1]"
                }`}
              >
                {program}
              </Button>
            ))}
            <Button
              onClick={() => navigate('/instructor/programs')}
              variant="outline"
              size="sm"
              className="rounded-xl transition-all text-xs md:text-sm px-3 py-2 md:px-4 md:py-2 whitespace-nowrap hover:bg-[#E6F0FF] border-2 border-[#0747A1] text-[#0747A1] font-semibold"
            >
              <BookOpen className="mr-1 h-4 w-4" /> Manage Courses
            </Button>
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-[#0747A1] mb-2">Program Resources</h3>
          <p className="text-sm text-muted-foreground">Manage resources for {selectedProgram}</p>
        </div>
        {filteredResources.length === 0 ? (
          <div className="text-center py-12 md:py-16 text-muted-foreground text-base md:text-lg px-4">
            No resources available for {selectedProgram}.
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {filteredResources.map((resource) => (
              <div key={resource.id} className="relative">
                <ResourceCard
                  resource={resource}
                  onPreview={() => handlePreview(resource)}
                  onDownload={() => handleDownload(resource)}
                  onEdit={() => handleEdit(resource)}
                  onDelete={() => handleDelete(resource)}
                  onSetExpiry={() => handleSetExpiry(resource)}
                  showCrudIcons={true}
                />
                {resource.expiry_date && (
                  <div className="absolute bottom-2 left-2 bg-[#FF8181] text-white text-xs px-2 py-1 rounded-md">
                    Expires: {new Date(resource.expiry_date).toLocaleDateString()}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Add Resource Modal */}
      <Dialog 
        open={showAddModal} 
        onOpenChange={(open) => {
          setShowAddModal(open);
          if (!open) {
            setEditingResource(null);
            setNewResource({ title: "", description: "", type: "", url: "", file: null, expiry_date: "" });
            setIsUploading(false);
          }
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingResource ? "Edit Resource" : "Add New Resource"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={newResource.title} onChange={(e) => setNewResource({ ...newResource, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={newResource.description} onChange={(e) => setNewResource({ ...newResource, description: e.target.value })} />
            </div>
            <div>
              <Label>Type</Label>
              <Input value={newResource.type} onChange={(e) => setNewResource({ ...newResource, type: e.target.value })} placeholder="PDF, Video, Link..." />
            </div>
            <div>
              <Label>URL (optional)</Label>
              <Input value={newResource.url} onChange={(e) => setNewResource({ ...newResource, url: e.target.value })} />
            </div>
            <div>
              <Label>File Upload (optional)</Label>
              <Input type="file" onChange={(e) => setNewResource({ ...newResource, file: e.target.files?.[0] || null })} />
            </div>
            <div>
              <Label>Expiry Date (optional)</Label>
              <Input type="datetime-local" value={newResource.expiry_date} onChange={(e) => setNewResource({ ...newResource, expiry_date: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button 
              onClick={handleAddResource} 
              disabled={isUploading}
              className="bg-[#0747A1] text-white hover:bg-[#063d8c] disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isUploading ? "Uploading..." : editingResource ? "Update Resource" : "Save Resource"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentName={profileName}
        currentImage={profileImage}
        onSave={handleSaveProfile}
      />

      {/* Add Task Modal */}
      <Dialog open={showTaskModal} onOpenChange={setShowTaskModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Task</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Title</Label>
              <Input value={newTask.title} onChange={(e) => setNewTask({ ...newTask, title: e.target.value })} />
            </div>
            <div>
              <Label>Description</Label>
              <Textarea value={newTask.description} onChange={(e) => setNewTask({ ...newTask, description: e.target.value })} />
            </div>
            <div>
              <Label>Schedule</Label>
              <Select value={newTask.schedule} onValueChange={(value: any) => setNewTask({ ...newTask, schedule: value })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="daily">Daily</SelectItem>
                  <SelectItem value="weekly">Weekly</SelectItem>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="ad-hoc">Ad-hoc</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Due Date (optional)</Label>
              <Input type="datetime-local" value={newTask.due_at} onChange={(e) => setNewTask({ ...newTask, due_at: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleAddTask} className="bg-[#0747A1] text-white hover:bg-[#063d8c]">
              Add Task
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default InstructorDashboard;
