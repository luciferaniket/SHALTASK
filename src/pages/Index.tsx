
import { SearchBar } from "@/components/ui/search-bar";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { Bot, Grid2x2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Assessment } from "@/types/api";
import { useNavigate } from "react-router-dom";

interface ChatResponse {
  status: string;
  message: string;
  recommended_assessments: Assessment[];
}

const Index = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [response, setResponse] = useState<ChatResponse | null>(null);

  const handleSearch = async (searchQuery: string) => {
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch('https://ankys-shl-back.hf.space/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: searchQuery.trim() }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      setResponse(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch recommendations. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-b from-dark-green to-pine">
      <Navbar />
      
      <main className="flex-grow container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-semibold mb-6 text-anti-flash-white">
              Find Your Perfect Assessment Solution
            </h1>
            <p className="text-lg text-anti-flash-white/80 mb-8">
              Get personalized SHL assessment recommendations using our AI-powered platform.
            </p>
            
            <div className="mb-8">
              <SearchBar onSearch={handleSearch} expanded={true} isLoading={isLoading} />
            </div>
          </div>

          {response && (
            <div className="space-y-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-caribbean-green flex items-center justify-center">
                  <Bot className="text-dark-green" size={24} />
                </div>
                <h2 className="text-xl font-medium text-anti-flash-white">
                  {response.status === "success" ? "Recommended Assessments" : "No Matches Found"}
                </h2>
              </div>

              {response.status === "success" && response.recommended_assessments.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 rounded-xl bg-forest/30 backdrop-blur-sm">
                  {response.recommended_assessments.map((assessment) => (
                    <Card 
                      key={assessment.product_id} 
                      className="group transform transition-all duration-300 hover:scale-102 hover:shadow-lg bg-dark-green/40 border border-caribbean-green/20 hover:border-caribbean-green/40"
                    >
                      <div className="p-6 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <h3 className="text-xl font-semibold text-caribbean-green group-hover:text-mountain-meadow transition-colors">
                            {assessment.product_name}
                          </h3>
                          <Grid2x2 className="text-caribbean-green/60 group-hover:text-caribbean-green" size={20} />
                        </div>
                        <p className="text-anti-flash-white/90 mb-4 flex-grow">{assessment.description}</p>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            <div className="flex items-center gap-2 text-anti-flash-white/70">
                              <span className="text-caribbean-green">Duration:</span>
                              {assessment.duration} minutes
                            </div>
                            <div className="flex items-center gap-2 text-anti-flash-white/70">
                              <span className="text-caribbean-green">Remote:</span>
                              {assessment.remote_support}
                            </div>
                          </div>
                          {assessment.test_type.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {assessment.test_type.map((type) => (
                                <span
                                  key={type}
                                  className="px-3 py-1 text-xs rounded-full bg-caribbean-green/10 text-caribbean-green border border-caribbean-green/20"
                                >
                                  {type}
                                </span>
                              ))}
                            </div>
                          )}
                          <a
                            href={assessment.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block text-caribbean-green hover:text-mountain-meadow transition-colors"
                          >
                            Learn More →
                          </a>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              ) : (
                <p className="text-anti-flash-white/80 text-center">{response.message}</p>
              )}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Index;
