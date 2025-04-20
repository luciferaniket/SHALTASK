
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookmarkPlus, BookmarkCheck, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";

interface ProductCardProps {
  id: string;
  title: string;
  description: string;
  category: string;
  tags?: string[];
  imageUrl?: string;
}

export default function ProductCard({ id, title, description, category, tags = [], imageUrl }: ProductCardProps) {
  const [isSaved, setIsSaved] = useState(false);
  const { toast } = useToast();

  const toggleSaved = () => {
    setIsSaved(!isSaved);
    toast({
      title: isSaved ? "Removed from saved items" : "Added to saved items",
      description: isSaved ? `${title} has been removed from your saved list.` : `${title} has been added to your saved list.`,
      variant: isSaved ? "destructive" : "default",
    });
  };

  return (
    <Card className="card-base h-full flex flex-col">
      <CardHeader className="pb-2">
        {imageUrl && (
          <div className="w-full h-40 rounded-t-lg mb-2 overflow-hidden">
            <img src={imageUrl} alt={title} className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex justify-between items-start">
          <div>
            <Badge className="bg-mountain-meadow text-dark-green mb-2">{category}</Badge>
            <CardTitle className="text-xl text-forest">{title}</CardTitle>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleSaved}
            className="text-forest hover:text-caribbean-green hover:bg-muted"
          >
            {isSaved ? <BookmarkCheck size={20} /> : <BookmarkPlus size={20} />}
          </Button>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        <CardDescription className="text-forest/80">{description}</CardDescription>
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-3">
            {tags.map((tag) => (
              <span 
                key={tag} 
                className="text-xs px-2 py-1 bg-pistachio/30 text-forest rounded-full"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="border-t border-pistachio/50 pt-2">
        <Link to={`/products/${id}`} className="w-full">
          <Button 
            variant="ghost" 
            className="w-full justify-between text-bangladesh-green hover:text-caribbean-green hover:bg-muted"
          >
            View Details
            <ArrowRight size={16} />
          </Button>
        </Link>
      </CardFooter>
    </Card>
  );
}
