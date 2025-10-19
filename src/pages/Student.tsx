import { useState, useEffect, useCallback, useDeferredValue } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

import { useToast } from "@/hooks/use-toast";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut, Settings, Menu, X, Camera, Edit, BookOpen, FileText, TrendingUp, Award, Clock, Activity, Bell } from "lucide-react";
import ResourceCard from "@/components/ResourceCard";
import PreviewModal from "@/components/PreviewModal";
import ProfileModal from "@/components/ProfileModal";
import Fireflies from "@/components/Fireflies";
import { useNavigate } from "react-router-dom";

type Resource = {
  id: string;
  title: string;
  description: string | null;
  type: string;
  url: string | null;
  file_path: string | null;
  program?: string;
  created_at: string;
};

const Student = () => {
  const [resources, setResources] = useState<Resource[]>([]);
  const [filteredResources, setFilteredResources] = useState<Resource[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedProgram, setSelectedProgram] = useState("Software Development");
  const deferredSearch = useDeferredValue(searchQuery);
  const [previewResource, setPreviewResource] = useState<Resource | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [profileName, setProfileName] = useState(() => {
    try {
      const saved = localStorage.getItem("userProfile");
      return saved ? JSON.parse(saved).name : "Student";
    } catch {
      return "Student";
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
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [lastViewedCount, setLastViewedCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [newResources, setNewResources] = useState<Resource[]>([]);
  const [studentProgress, setStudentProgress] = useState(0);
  const [studentAchievements, setStudentAchievements] = useState(0);
  const { toast } = useToast();
  const navigate = useNavigate();

  const programs = ["Software Development", "Digital Marketing", "Product Design"];

  const fetchResources = useCallback(async () => {
    const { data, error } = await supabase.from("resources").select("*").order("created_at", { ascending: false }) as any;
    if (error) toast({ title: "Error fetching resources", description: error.message, variant: "destructive" });
    else setResources(data || []);
  }, [toast]);

  const fetchStudentProgress = useCallback(async () => {
    try {
      const userData: any = await supabase.auth.getUser();
      if (!userData?.data?.user) {
        setStudentProgress(0);
        setStudentAchievements(0);
        return;
      }

      // Fetch student's course progress
      const { data: progressData } = await (supabase as any)
        .from('course_progress')
        .select('progress_percentage')
        .eq('student_id', userData.data.user.id);

      if (progressData && progressData.length > 0) {
        // Calculate average progress
        const avgProgress = Math.round(
          progressData.reduce((sum: number, item: any) => sum + (item.progress_percentage || 0), 0) / progressData.length
        );
        setStudentProgress(avgProgress);
      } else {
        setStudentProgress(0);
      }

      // Fetch student's achievements/XP events
      const { data: xpData } = await (supabase as any)
        .from('xp_events')
        .select('*')
        .eq('student_id', userData.data.user.id);

      setStudentAchievements(xpData?.length || 0);
    } catch (err) {
      setStudentProgress(0);
      setStudentAchievements(0);
    }
  }, []);

  // Auth check
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data.session;
      if (!session) navigate("/auth");
      else {
        const role = session.user.user_metadata?.role || "student";
        if (role !== "student") navigate(role === "instructor" ? "/instructor" : "/auth");
      }
    });

    const authListener = supabase.auth.onAuthStateChange((_, session) => {
      if (!session) navigate("/auth");
      else {
        const role = session.user.user_metadata?.role || "student";
        if (role !== "student") navigate(role === "instructor" ? "/instructor" : "/auth");
      }
    });

    return () => authListener.data.subscription.unsubscribe();
  }, [navigate]);

  // Fetch resources and student progress
  useEffect(() => {
    fetchResources();
    fetchStudentProgress();
    
    const channel = (supabase as any)
      .channel("resources-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "resources" }, fetchResources)
      .subscribe();

    return () => {
      (supabase as any).removeChannel(channel);
    };
  }, [fetchResources, fetchStudentProgress]);

  // Filter by search (across all programs if searching, otherwise by selected program)
  useEffect(() => {
    const filtered = resources.filter((r) => {
      const q = deferredSearch.toLowerCase();
      const matchesSearch = 
        r.title.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q);
      
      // If searching, show results from all programs
      if (deferredSearch.trim()) {
        return matchesSearch;
      }
      
      // If not searching, filter by selected program
      return r.program === selectedProgram && matchesSearch;
    });
    setFilteredResources(filtered);
    
    // Update notification count and track new resources
    const saved = localStorage.getItem(`lastViewedCount_${selectedProgram}`);
    const lastCount = saved ? parseInt(saved) : 0;
    const newCount = Math.max(0, filtered.length - lastCount);
    setUnreadNotifications(newCount);
    setLastViewedCount(lastCount);
    
    // Get new resources (most recent ones)
    if (newCount > 0) {
      const recentResources = filtered.slice(0, newCount);
      setNewResources(recentResources);
    } else {
      setNewResources([]);
    }
  }, [deferredSearch, selectedProgram, resources]);
  
  const markNotificationsAsRead = () => {
    localStorage.setItem(`lastViewedCount_${selectedProgram}`, filteredResources.length.toString());
    setUnreadNotifications(0);
    setNewResources([]);
    setShowNotifications(false);
  };
  
  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };
  
  // Close notifications dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (showNotifications && !target.closest('.notification-dropdown') && !target.closest('.notification-bell')) {
        setShowNotifications(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showNotifications]);

  const handleDownload = async (resource: Resource) => {
    if (!resource.file_path) {
      toast({ title: "No file available", description: "This resource doesn't have a downloadable file", variant: "destructive" });
      return;
    }
    const { data } = supabase.storage.from("resources").getPublicUrl(resource.file_path);
    if (data?.publicUrl) window.open(data.publicUrl, "_blank");
  };

  const handleSignOut = async () => {
    await (supabase.auth as any).signOut();
    navigate("/auth");
  };

  const handleSaveProfile = (name: string, image: string) => {
    setProfileName(name);
    setProfileImage(image);
    // Persist profile changes to localStorage
    localStorage.setItem("userProfile", JSON.stringify({ name, image }));
    toast({ title: "Profile updated", description: "Your profile has been updated successfully." });
  };

  return (
    <div className="min-h-screen bg-background relative">
      <Fireflies />
      {/* Logo - Desktop (matches hero) */}
      <button
        onClick={handleSignOut}
        className="hidden sm:block absolute top-4 left-4 bg-[#FF8181] text-white font-bold text-lg px-4 py-2 rounded-full hover:bg-[#FF8181]/80 transition-all duration-200 shadow-lg z-10"
      >
        UR HUB
      </button>
      
      {/* Logo - Mobile */}
      <button
        onClick={handleSignOut}
        className="sm:hidden absolute top-4 left-4 bg-[#FF8181] text-white font-bold text-sm px-3 py-1.5 rounded-full hover:bg-[#FF8181]/80 transition-all duration-200 shadow-lg z-10"
      >
        UR HUB
      </button>
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-4">
          {/* Desktop Header */}
          <div className="hidden md:flex items-center justify-between">
            <div></div>

            <div className="flex items-center gap-4">
              <input
                type="text"
                placeholder="Search resources..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-[300px] border border-[#E6E6E6] rounded-xl py-2 px-4 focus:outline-none focus:border-[#0747A1]"
              />
              
              {/* Notification Icon - Only show when there are notifications */}
              {unreadNotifications > 0 && (
                <div className="relative">
                  <button 
                    onClick={toggleNotifications}
                    className="notification-bell relative p-2 hover:bg-[#E6F2FF] rounded-full transition-colors"
                  >
                    <Bell className="h-5 w-5 text-[#0747A1]" />
                    <span className="absolute -top-1 -right-1 bg-[#FF8181] text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center animate-pulse">
                      {unreadNotifications}
                    </span>
                  </button>
                
                {/* Notification Dropdown */}
                {showNotifications && (
                  <div className="notification-dropdown absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-xl border border-gray-200 z-50 max-h-96 overflow-y-auto animate-in fade-in-0 slide-in-from-top-2 duration-200">
                    <div className="p-4 border-b border-gray-200 flex items-center justify-between">
                      <h3 className="font-semibold text-[#0747A1]">New Resources ({unreadNotifications})</h3>
                      <button
                        onClick={markNotificationsAsRead}
                        className="text-xs text-[#0747A1] hover:underline"
                      >
                        Mark all as read
                      </button>
                    </div>
                    {newResources.length > 0 ? (
                      <div className="divide-y divide-gray-100">
                        {newResources.map((resource) => (
                          <div
                            key={resource.id}
                            className="p-3 hover:bg-[#E6F2FF] cursor-pointer transition-colors"
                            onClick={() => {
                              setPreviewResource(resource);
                              setShowPreviewModal(true);
                              markNotificationsAsRead();
                            }}
                          >
                            <div className="flex items-start gap-3">
                              <div className="bg-[#0747A1] p-2 rounded-lg">
                                <FileText className="h-4 w-4 text-white" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-sm text-gray-900 truncate">{resource.title}</p>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-2">{resource.description || "No description"}</p>
                                <p className="text-xs text-[#0747A1] mt-1 font-medium">{resource.type}</p>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="p-6 text-center text-gray-500">
                        <Bell className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">No new resources</p>
                      </div>
                    )}
                  </div>
                )}
                </div>
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
                <DropdownMenuItem onClick={() => navigate('/student/programs')} className="hover:bg-[#0747A1]/10 focus:bg-[#0747A1]/10 cursor-pointer py-3 rounded-lg mx-1">
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

          {/* Mobile Header */}
          <div className="md:hidden flex items-center justify-between">

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
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Search resources..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full border border-[#E6E6E6] rounded-xl py-2 px-4 focus:outline-none focus:border-[#0747A1]"
                />

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
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setShowProfileModal(true);
                        setMobileMenuOpen(false);
                      }}
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        handleSignOut();
                        setMobileMenuOpen(false);
                      }}
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </header>

      {/* Student Dashboard Header */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-6 md:mt-8">

        {/* Dashboard Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          {/* Total Resources Card */}
          <Card className="border-l-4 border-l-[#0747A1] hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Available Resources</p>
                  <p className="text-2xl md:text-3xl font-bold text-[#0747A1]">{filteredResources.length}</p>
                </div>
                <div className="bg-[#E6F2FF] p-3 rounded-full">
                  <FileText className="h-5 w-5 md:h-6 md:w-6 text-[#0747A1]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Current Program Card */}
          <Card className="border-l-4 border-l-[#0747A1] hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Active Program</p>
                  <p className="text-xs md:text-sm font-semibold text-[#0747A1] truncate">{selectedProgram.split(' ')[0]}</p>
                </div>
                <div className="bg-[#E6F2FF] p-3 rounded-full">
                  <BookOpen className="h-5 w-5 md:h-6 md:w-6 text-[#0747A1]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Card */}
          <Card className="border-l-4 border-l-[#0091FF] hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Progress</p>
                  <p className="text-2xl md:text-3xl font-bold text-[#0091FF]">{studentProgress}%</p>
                </div>
                <div className="bg-[#E6F5FF] p-3 rounded-full">
                  <TrendingUp className="h-5 w-5 md:h-6 md:w-6 text-[#0091FF]" />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Achievements Card */}
          <Card className="border-l-4 border-l-[#FDB353] hover:shadow-lg transition-shadow">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm text-muted-foreground mb-1">Achievements</p>
                  <p className="text-2xl md:text-3xl font-bold text-[#FDB353]">{studentAchievements}</p>
                </div>
                <div className="bg-[#FFF4E6] p-3 rounded-full">
                  <Award className="h-5 w-5 md:h-6 md:w-6 text-[#FDB353]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity Section - Only show if student has activity */}
        {(studentProgress > 0 || studentAchievements > 0) && (
          <Card className="mb-6 hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5 text-[#0747A1]" />
                  <h3 className="text-lg font-semibold text-[#0747A1]">Your Progress</h3>
                </div>
                <Clock className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="space-y-3">
                {studentProgress > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-[#E6F2FF] rounded-lg">
                    <div className="w-2 h-2 bg-[#0091FF] rounded-full"></div>
                    <p className="text-sm">Course progress: <span className="font-semibold">{studentProgress}%</span></p>
                  </div>
                )}
                {studentAchievements > 0 && (
                  <div className="flex items-center gap-3 p-3 bg-[#FFF4E6] rounded-lg">
                    <div className="w-2 h-2 bg-[#FDB353] rounded-full"></div>
                    <p className="text-sm">Earned <span className="font-semibold">{studentAchievements}</span> achievement{studentAchievements !== 1 ? 's' : ''}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Program Tabs */}
      <div className="max-w-6xl mx-auto px-4 md:px-8 mt-6">
        <div className="flex justify-center">
          <div className="flex flex-wrap justify-center gap-2 md:gap-4 max-w-full">
            {programs.map((program) => (
              <Button
                key={program}
                onClick={() => setSelectedProgram(program)}
                variant={selectedProgram === program ? "default" : "outline"}
                size="sm"
                className={`rounded-xl transition-all text-xs md:text-sm px-3 py-2 md:px-4 md:py-2 whitespace-nowrap ${
                  selectedProgram === program ? "bg-[#0747A1] text-white shadow-lg shadow-[#0A58CA]" : "hover:bg-[#E6F0FF]"
                }`}
              >
                {program}
              </Button>
            ))}
            <Button
              onClick={() => navigate('/student/programs')}
              variant="outline"
              size="sm"
              className={`rounded-xl transition-all text-xs md:text-sm px-3 py-2 md:px-4 md:py-2 whitespace-nowrap hover:bg-[#E6F0FF]`}
            >
              Courses & Tasks
            </Button>
          </div>
        </div>
      </div>

      {/* Resources Section */}
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">
        <div className="mb-6">
          <h3 className="text-xl font-semibold text-[#0747A1] mb-2">Learning Resources</h3>
          <p className="text-sm text-muted-foreground">Explore and download resources for {selectedProgram}</p>
        </div>
        {filteredResources.length === 0 ? (
          <div className="text-center py-12 md:py-16 text-muted-foreground text-base md:text-lg px-4">
            {searchQuery ? "No resources found matching your search" : "No resources available yet"}
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4 md:gap-6">
            {filteredResources.map((resource) => (
              <ResourceCard
                key={resource.id}
                resource={resource}
                onPreview={() => {
                  setPreviewResource(resource);
                  setShowPreviewModal(true);
                }}
                onDownload={() => handleDownload(resource)}
              />
            ))}
          </div>
        )}
      </main>

      {/* Modals */}
      {showPreviewModal && previewResource && (
        <PreviewModal
          resource={previewResource}
          onClose={() => {
            setShowPreviewModal(false);
            setPreviewResource(null);
          }}
          onDownload={() => handleDownload(previewResource)}
        />
      )}

      <ProfileModal
        isOpen={showProfileModal}
        onClose={() => setShowProfileModal(false)}
        currentName={profileName}
        currentImage={profileImage}
        onSave={handleSaveProfile}
      />
    </div>
  );
};

export default Student;
