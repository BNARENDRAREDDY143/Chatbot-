import { useLocation } from "react-router-dom";
import { useEffect } from "react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center animated-gradient-bg">
      <div className="text-center glass-card p-12 rounded-3xl shadow-2xl">
        <h1 className="mb-4 text-7xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-accent to-white glow-text">404</h1>
        <p className="mb-4 text-xl text-muted-foreground">Oops! Page not found</p>
        <a href="/" className="text-primary underline hover:text-primary/90">
          Return to Home
        </a>
      </div>
    </div>);

};

export default NotFound;