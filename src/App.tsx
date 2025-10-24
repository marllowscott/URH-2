import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, lazy, Suspense } from "react";
import { supabase } from "@/integrations/supabase/client";

const Index = lazy(() => import("./pages/Index"));
const Student = lazy(() => import("./pages/Student"));
const Instructor = lazy(() => import("./pages/Instructor"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

function RouteGuard() {
  const location = useLocation();
  useEffect(() => {
    if (location.pathname === "/" || location.pathname === "/auth") {
      supabase.auth.getSession().then((res: any) => {
        const session = res?.data?.session ?? res?.session;
        if (session) {
          (supabase.auth as any).signOut();
        }
      });
    }
  }, [location.pathname]);
  return null;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <RouteGuard />
        <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="animate-spin rounded-full h-16 w-16 border-b-2 border-[#0747A1]"></div></div>}>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/student" element={<Student />} />
            <Route path="/instructor" element={<Instructor />} />
            <Route path="/auth" element={<Auth />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
