
import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
import { Send, Bot, User, Paperclip, Trash, ExternalLink } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import type { Assessment } from "@/types/api";

interface Message {
  id: string;
  role: "user" | "system";
  content: string;
  timestamp: string;
  recommendations?: Assessment[];
}

const DEMO_MESSAGES: Message[] = [
  {
    id: "1",
    role: "system",
    content: "Hello! I'm your SHL assessment recommendation assistant. How can I help you find the right assessment solutions today?",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  }
];

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>(DEMO_MESSAGES);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch('https://ankys34-shl-back.hf.space/recommend', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: input }),
      });

      if (!response.ok) {
        throw new Error('Failed to fetch recommendations');
      }

      const data = await response.json();
      
      const botMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: "Based on your request, here are some recommended assessments:",
        timestamp: new Date().toISOString(),
        recommendations: data.recommended_assessments,
      };

      setMessages(prev => [...prev, botMessage]);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to fetch recommendations. Please try again.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "system",
        content: "I apologize, but I encountered an error while fetching recommendations. Please try again.",
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearChat = () => {
    toast({
      title: "Chat cleared",
      description: "All messages have been removed from the current session.",
    });
    setMessages(DEMO_MESSAGES);
  };

  const renderRecommendations = (recommendations: Assessment[]) => (
    <div className="mt-4 space-y-4">
      {recommendations.map((assessment) => (
        <div key={assessment.product_id} className="bg-white rounded-lg p-4 shadow-sm border border-pistachio">
          <div className="flex justify-between items-start">
            <h3 className="font-medium text-forest">{assessment.product_name}</h3>
            <a 
              href={assessment.url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-caribbean-green hover:text-mountain-meadow"
            >
              <ExternalLink size={16} />
            </a>
          </div>
          <p className="text-sm text-muted-foreground mt-2">{assessment.description}</p>
          <div className="mt-3 grid grid-cols-2 gap-2 text-xs">
            <div className="flex items-center gap-1">
              <span className="font-medium">Duration:</span> {assessment.duration} minutes
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Remote:</span> {assessment.remote_support}
            </div>
            <div className="flex items-center gap-1">
              <span className="font-medium">Adaptive:</span> {assessment.adaptive_support}
            </div>
          </div>
          {assessment.test_type.length > 0 && (
            <div className="mt-3">
              <div className="flex flex-wrap gap-2">
                {assessment.test_type.map((type) => (
                  <span 
                    key={type} 
                    className="px-2 py-1 bg-pistachio/20 text-forest rounded-full text-xs"
                  >
                    {type}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col h-[calc(100vh-12rem)] md:h-[600px] bg-white rounded-lg shadow-md border border-pistachio">
      <div className="flex justify-between items-center p-4 border-b border-pistachio">
        <div className="flex items-center space-x-2">
          <Avatar className="bg-bangladesh-green">
            <Bot className="text-white" />
          </Avatar>
          <div>
            <h2 className="font-medium text-forest">SHL Assessment Assistant</h2>
            <p className="text-xs text-muted-foreground">Ask me about assessment solutions</p>
          </div>
        </div>
        <Button 
          variant="ghost" 
          size="icon"
          onClick={clearChat}
          className="text-forest hover:text-destructive hover:bg-destructive/10"
        >
          <Trash size={18} />
        </Button>
      </div>

      <div className="flex-grow overflow-y-auto p-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex max-w-[80%] ${message.role === "user" ? "flex-row-reverse" : ""}`}>
              <Avatar className={`${message.role === "user" ? "bg-caribbean-green ml-2" : "bg-bangladesh-green mr-2"}`}>
                {message.role === "user" ? <User className="text-dark-green" /> : <Bot className="text-white" />}
              </Avatar>
              <Card className={`p-3 ${
                message.role === "user" 
                  ? "bg-caribbean-green text-dark-green" 
                  : "bg-muted text-forest"
              }`}>
                <p>{message.content}</p>
                {message.recommendations && renderRecommendations(message.recommendations)}
                <div className={`text-xs mt-1 ${
                  message.role === "user" ? "text-dark-green/70" : "text-muted-foreground"
                }`}>
                  {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </Card>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex justify-start">
            <div className="flex">
              <Avatar className="bg-bangladesh-green mr-2">
                <Bot className="text-white" />
              </Avatar>
              <Card className="p-3 bg-muted text-forest">
                <div className="flex space-x-2">
                  <div className="w-2 h-2 bg-forest rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                  <div className="w-2 h-2 bg-forest rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
                  <div className="w-2 h-2 bg-forest rounded-full animate-bounce" style={{ animationDelay: '600ms' }}></div>
                </div>
              </Card>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSendMessage} className="p-4 border-t border-pistachio">
        <div className="flex space-x-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="text-forest hover:text-caribbean-green hover:bg-muted"
          >
            <Paperclip size={20} />
          </Button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about assessment solutions..."
            className="w-full py-2 px-3 bg-muted border border-pistachio rounded-md focus:outline-none focus:ring-2 focus:ring-caribbean-green focus:border-transparent"
            disabled={isLoading}
          />
          <Button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="bg-caribbean-green hover:bg-mountain-meadow text-dark-green"
          >
            <Send size={20} />
          </Button>
        </div>
      </form>
    </div>
  );
}
