
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center px-6 max-w-md animate-fade-in">
        <h1 className="text-6xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">404</h1>
        <p className="text-xl text-gray-600 mb-8">The page you're looking for doesn't exist or has been moved.</p>
        <Button asChild className="transition-all hover:pl-3">
          <a href="/">
            <ArrowLeft size={18} className="mr-2" />
            Return to Color Palette Generator
          </a>
        </Button>
      </div>
    </div>
  );
};

export default NotFound;
