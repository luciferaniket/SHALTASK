
import { Link } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { cn } from "@/lib/utils";

export default function Navbar() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  return (
    <nav className="bg-dark-green text-white shadow-md">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center py-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="h-10 w-10 rounded-full bg-caribbean-green flex items-center justify-center">
              <span className="text-dark-green font-semibold text-lg">SHL</span>
            </div>
            <span className="text-xl font-semibold hidden md:inline-block">AssessAid</span>
          </Link>

          <Button variant="ghost" className="text-white md:hidden" onClick={toggleMenu}>
            {isMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </Button>
        </div>
      </div>

      {/* Mobile Menu */}
      <div className={cn(
        "md:hidden bg-bangladesh-green absolute z-20 w-full transition-all duration-300 ease-in-out",
        isMenuOpen ? "max-h-[500px] py-4" : "max-h-0 overflow-hidden py-0"
      )}>
        <div className="container mx-auto px-4 flex flex-col space-y-4">
          <Link to="/" className="py-2 px-4 hover:bg-forest/30 rounded-md">
            Home
          </Link>
        </div>
      </div>
    </nav>
  );
}
