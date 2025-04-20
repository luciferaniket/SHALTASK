
import { useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Home, Search, MessageSquare } from "lucide-react";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-anti-flash-white flex items-center justify-center">
        <div className="container px-4 text-center">
          <div className="max-w-2xl mx-auto py-12">
            <div className="w-20 h-20 mx-auto bg-caribbean-green rounded-full flex items-center justify-center mb-6">
              <span className="text-dark-green font-semibold text-4xl">404</span>
            </div>
            
            <h1 className="text-3xl md:text-4xl font-semibold text-bangladesh-green mb-4">
              Page Not Found
            </h1>
            
            <p className="text-lg text-forest mb-8">
              The page you're looking for doesn't seem to exist. It might have been moved or deleted.
            </p>
            
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Link to="/">
                <Button className="w-full sm:w-auto bg-caribbean-green hover:bg-mountain-meadow text-dark-green">
                  <Home size={18} className="mr-2" /> Return Home
                </Button>
              </Link>
              
              <Link to="/products">
                <Button variant="outline" className="w-full sm:w-auto border-forest text-forest hover:bg-pistachio/20">
                  <Search size={18} className="mr-2" /> Browse Products
                </Button>
              </Link>
              
              <Link to="/chat">
                <Button variant="outline" className="w-full sm:w-auto border-forest text-forest hover:bg-pistachio/20">
                  <MessageSquare size={18} className="mr-2" /> Chat with AI
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default NotFound;
