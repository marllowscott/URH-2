import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2 } from "lucide-react";

const Auth = () => {
  const [loading, setLoading] = useState(false);

  // Separate state for Sign In
  const [signInEmail, setSignInEmail] = useState("");
  const [signInPassword, setSignInPassword] = useState("");

  // Separate state for Sign Up
  const [signUpEmail, setSignUpEmail] = useState("");
  const [signUpPassword, setSignUpPassword] = useState("");

  const [selectedRole, setSelectedRole] = useState("student");

  const navigate = useNavigate();
  const { toast } = useToast();

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const session = data?.session;
      if (session) {
        const userRole = session.user.user_metadata?.role || "instructor";
        navigate(userRole === "instructor" ? "/instructor" : "/student");
      }
    });
  }, [navigate]);

  // SIGN UP
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signUp({
      email: signUpEmail,
      password: signUpPassword,
      options: { data: { role: selectedRole } },
    });

    if (error) {
      toast({
        title: "Sign up failed",
        description: error.message,
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Account created",
      description:
        "Account created successfully! Check your email to confirm if email confirmation is enabled.",
    });

    // Optional: auto-login for testing without email confirmation
    if (!data.user?.email_confirmed_at) {
      const { error: loginError, data: loginData } = await supabase.auth.signInWithPassword({
        email: signUpEmail,
        password: signUpPassword,
      });

      if (loginError) {
        toast({
          title: "Auto-login failed",
          description: loginError.message,
          variant: "destructive",
        });
      } else if (loginData.session) {
        // Ensure role metadata exists after auto-login
        const effectiveRole = loginData.user?.user_metadata?.role;
        if (!effectiveRole) {
          try { await (supabase.auth as any).updateUser({ data: { role: selectedRole } }); } catch {}
        }
        const role = (effectiveRole || selectedRole || "instructor");
        navigate(role === "instructor" ? "/instructor" : "/student");
      }
    }

    setLoading(false);
  };

  // SIGN IN
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: signInEmail,
      password: signInPassword,
    });

    if (error) {
      toast({
        title: "Sign in failed",
        description: error.message,
        variant: "destructive",
      });
    } else if (data.session) {
      // Patch missing role metadata on existing accounts
      let role = data.user?.user_metadata?.role as string | undefined;
      if (!role) {
        try {
          await (supabase.auth as any).updateUser({ data: { role: selectedRole } });
          role = selectedRole;
        } catch {
          role = "instructor";
        }
      }
      navigate((role || "instructor") === "instructor" ? "/instructor" : "/student");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#0747A1] flex items-center justify-center p-4 relative">
      {/* Firefly Animation Background - Same as Hero */}
      <div className="firefly-container">
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly"></div>
        <div className="firefly firefly-fast"></div>
        <div className="firefly firefly-fast"></div>
        <div className="firefly firefly-fast"></div>
        <div className="firefly firefly-fast"></div>
        <div className="firefly firefly-slow"></div>
        <div className="firefly firefly-slow"></div>
        <div className="firefly firefly-slow"></div>
        <div className="firefly firefly-slow"></div>
        <div className="firefly firefly-tiny"></div>
        <div className="firefly firefly-tiny"></div>
        <div className="firefly firefly-tiny"></div>
        <div className="firefly firefly-tiny"></div>
      </div>
      
      {/* Logo - Desktop */}
      <button
        onClick={() => navigate("/")}
        className="hidden sm:block absolute top-4 left-4 bg-[#FF8181] text-white font-bold text-lg px-4 py-2 rounded-full hover:bg-[#FF8181]/80 transition-all duration-200 shadow-lg z-10"
      >
        UR HUB
      </button>
      
      {/* Form Card with smooth animations */}
      <div className="w-full flex flex-col items-center relative z-10">
        {/* Logo - Mobile */}
        <button
          onClick={() => navigate("/")}
          className="sm:hidden bg-[#FF8181] text-white font-bold text-lg px-4 py-2 rounded-full hover:bg-[#FF8181]/80 transition-all duration-200 shadow-lg mx-auto mb-6"
        >
          UR HUB
        </button>
        <Card className="w-full max-w-md shadow-2xl relative z-10 animate-in fade-in-0 slide-in-from-bottom-4 zoom-in-95 duration-[400ms] ease-out">
        <CardHeader className="text-center">
          <CardTitle className="text-xl md:text-2xl text-[#0747A1]">Welcome</CardTitle>
          <CardDescription className="text-sm md:text-base">
            Choose your role and sign in or create an account
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <Label className="text-base font-medium">Choose your role:</Label>
            <div className="flex justify-center gap-2 md:gap-4 mt-6 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out delay-100">
              {["Student", "Instructor"].map((roleOption) => (
                <label
                  key={roleOption}
                  className={`cursor-pointer px-4 md:px-6 py-3 rounded-lg border text-center font-medium transition-all duration-200 text-sm md:text-base ${
                    selectedRole === roleOption.toLowerCase()
                      ? "bg-[#0747A1] text-white border-[#0747A1]"
                      : "bg-white text-[#0747A1] border-[#0747A1] hover:bg-[#0747A1]/10"
                  }`}
                >
                  <input
                    type="radio"
                    name="role"
                    value={roleOption.toLowerCase()}
                    checked={selectedRole === roleOption.toLowerCase()}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="hidden"
                  />
                  {roleOption}
                </label>
              ))}
            </div>
          </div>

          <Tabs defaultValue="signin" className="w-full">
            <TabsList className="grid w-full grid-cols-2 bg-[#0747A1] text-white animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out delay-75">
              <TabsTrigger value="signin">Sign In</TabsTrigger>
              <TabsTrigger value="signup">Sign Up</TabsTrigger>
            </TabsList>

            <TabsContent value="signin">
              <form onSubmit={handleSignIn} className="space-y-4 mt-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out delay-150">
                <div>
                  <Label htmlFor="signin-email">Email</Label>
                  <Input
                    id="signin-email"
                    type="email"
                    value={signInEmail}
                    onChange={(e) => setSignInEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="signin-password">Password</Label>
                  <Input
                    id="signin-password"
                    type="password"
                    value={signInPassword}
                    onChange={(e) => setSignInPassword(e.target.value)}
                    required
                    placeholder=""
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out delay-300">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    "Sign In"
                  )}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup">
              <form onSubmit={handleSignUp} className="space-y-4 mt-4 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out delay-150">
                <div>
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={signUpEmail}
                    onChange={(e) => setSignUpEmail(e.target.value)}
                    required
                    placeholder="you@example.com"
                  />
                </div>
                <div>
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    type="password"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    minLength={6}
                  />
                </div>
                <Button type="submit" disabled={loading} className="w-full animate-in fade-in-0 slide-in-from-bottom-2 duration-500 ease-out delay-300">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Creating account...
                    </>
                  ) : (
                    "Create Account"
                  )}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-6 text-center">
            <Button variant="link" onClick={() => navigate("/")} className="text-sm">
              Back to Home
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
    </div>
  );
};

export default Auth;
