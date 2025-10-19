import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 relative">
      <button
        onClick={() => window.location.href = "/"}
        className="absolute top-4 left-4 bg-[#FF8181] text-white font-bold text-lg px-4 py-2 rounded-full hover:bg-[#FF8181]/80 transition-colors z-10"
      >
        UR HUB
      </button>
      {/* Back Arrow */}
      <button
        onClick={() => window.location.href = "/"}
        className="absolute top-4 right-4 bg-[#0747A1] text-white font-bold text-lg px-4 py-2 rounded-full hover:bg-[#0747A1]/80 transition-colors z-10 flex items-center gap-2"
      >
        ← Back
      </button>
      <div className="text-center">
        <h1 className="mb-4 text-4xl font-bold">404</h1>
        <p className="mb-4 text-xl text-gray-600">Oops! Page not found</p>
        <a href="/" className="text-[#0747A1] underline hover:text-[#0747A1]/80">
          Return to Home
        </a>
      </div>
    </div>
  );
};

export default NotFound;
