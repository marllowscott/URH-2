import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#0747A1] flex items-center justify-center relative font-[Poppins]">
      {/* Firefly Animation Background - More active on desktop */}
      <div className="firefly-container">
        {/* Original fireflies */}
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
        {/* Additional fireflies for desktop - varied speed/size/opacity */}
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

      {/* Logo - Desktop (absolute position) */}
      <button
        onClick={() => navigate("/")}
        className="hidden sm:block absolute top-4 left-4 bg-[#FF8181] text-white font-bold text-lg px-4 py-2 rounded-full hover:bg-[#FF8181]/80 transition-all duration-200 shadow-lg z-10"
      >
        UR HUB
      </button>

      {/* Hero Content */}
      <div className="text-center space-y-8 px-4">
        {/* Logo - Mobile (in flow, above text with better spacing) */}
        <button
          onClick={() => navigate("/")}
          className="sm:hidden bg-[#FF8181] text-white font-bold text-lg px-4 py-2 rounded-full hover:bg-[#FF8181]/80 transition-all duration-200 shadow-lg mx-auto mb-6"
        >
          UR HUB
        </button>
        <div className="space-y-4 sm:mt-0 -mt-2">
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-bold text-white">
            Unc
            <span className="text-[#49E0C6]">o</span>
            mmon Resource Hu
            <span className="text-[#FDB353]">b</span>
          </h1>
          <p className="text-lg text-white/90 max-w-2xl mx-auto leading-relaxed">
            Discover and share educational resources that inspire <br />
            learning and innovation
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4">
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="bg-[#FDB353] hover:bg-[#FDB353]/80 text-[#0747A1] px-6 py-3 text-base md:text-lg border-none font-semibold w-full sm:w-auto"
          >
            Sign Up
          </Button>
          <Button
            size="lg"
            onClick={() => navigate("/auth")}
            className="border border-white text-white hover:bg-white hover:text-[#0747A1] px-6 py-3 text-base md:text-lg font-semibold bg-transparent w-full sm:w-auto"
          >
            Log In
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
