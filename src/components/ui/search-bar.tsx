
import { Search } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  expanded?: boolean;
  isLoading?: boolean;
}

export function SearchBar({ 
  onSearch, 
  placeholder = "Search for assessment products...", 
  expanded = false,
  isLoading = false 
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isExpanded, setIsExpanded] = useState(expanded);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSearch && query.trim()) {
      onSearch(query);
    }
  };

  return (
    <div className={`search-container ${isExpanded ? "max-w-3xl" : "max-w-xl"}`}>
      <form onSubmit={handleSearch} className="relative flex items-center">
        <input
          type="text"
          className="search-input pr-12 w-full px-4 py-3 bg-dark-green/20 border border-caribbean-green/30 rounded-lg text-anti-flash-white placeholder:text-anti-flash-white/50 focus:outline-none focus:ring-2 focus:ring-caribbean-green"
          placeholder={placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsExpanded(true)}
          onBlur={() => !query && setIsExpanded(expanded)}
          disabled={isLoading}
        />
        <Button
          type="submit"
          className="absolute right-2 bg-bangladesh-green hover:bg-forest text-white rounded-full p-2"
          aria-label="Search"
          disabled={isLoading || !query.trim()}
        >
          <Search size={20} className={isLoading ? "animate-spin" : ""} />
        </Button>
      </form>
      {isExpanded && (
        <div className="text-xs text-muted-foreground mt-1 pl-2">
          Try: "leadership assessment for healthcare" or "technical skills test for developers"
        </div>
      )}
    </div>
  );
}
