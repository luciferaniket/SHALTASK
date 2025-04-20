
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { SearchBar } from "@/components/ui/search-bar";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { 
  Search, 
  Clock, 
  TrendingUp, 
  Bookmark,
  Download,
  Filter
} from "lucide-react";
import { useState } from "react";
import { 
  Tabs, 
  TabsContent, 
  TabsList, 
  TabsTrigger 
} from "@/components/ui/tabs";
import { Link } from "react-router-dom";

// Demo data
const recentSearchesData = [
  "leadership assessment",
  "technical skills test for developers",
  "cognitive ability test",
  "personality assessment for sales roles",
];

const recentProducts = [
  {
    id: "1",
    title: "Leadership Impact Assessment",
    description: "Evaluate leadership potential and effectiveness across key competencies. Ideal for management roles and leadership development programs.",
    category: "Leadership",
    tags: ["Executive", "Management", "Development"],
  },
  {
    id: "2",
    title: "Technical Skills Assessment",
    description: "Comprehensive evaluation of technical abilities for software developers, engineers, and IT professionals.",
    category: "Technical",
    tags: ["Programming", "IT", "Development"],
  },
  {
    id: "3",
    title: "Workplace Personality Inventory",
    description: "Measure work styles and behavioral tendencies to predict job fit and performance potential.",
    category: "Personality",
    tags: ["Behavioral", "Workplace", "Hiring"],
  }
];

const trendingProducts = [
  {
    id: "4",
    title: "Remote Work Readiness Assessment",
    description: "Evaluate candidates' ability to work effectively in remote or hybrid environments. Measures self-discipline, communication, and tech adaptability.",
    category: "Remote Work",
    tags: ["Remote", "Hybrid", "Workplace"],
  },
  {
    id: "5",
    title: "Digital Skills Proficiency Test",
    description: "Assess competency with essential workplace digital tools and technologies. Perfect for roles requiring digital literacy.",
    category: "Digital Skills",
    tags: ["Technology", "Digital", "Competency"],
  },
  {
    id: "6",
    title: "Cultural Fit & Values Alignment",
    description: "Measure alignment between candidate values and organizational culture to improve retention and team cohesion.",
    category: "Cultural Fit",
    tags: ["Values", "Culture", "Team"],
  }
];

const savedProducts = [
  {
    id: "2",
    title: "Technical Skills Assessment",
    description: "Comprehensive evaluation of technical abilities for software developers, engineers, and IT professionals.",
    category: "Technical",
    tags: ["Programming", "IT", "Development"],
  },
  {
    id: "5",
    title: "Digital Skills Proficiency Test",
    description: "Assess competency with essential workplace digital tools and technologies. Perfect for roles requiring digital literacy.",
    category: "Digital Skills",
    tags: ["Technology", "Digital", "Competency"],
  }
];

export default function Dashboard() {
  const [searchQuery, setSearchQuery] = useState("");

  const handleSearch = (query: string) => {
    setSearchQuery(query);
    console.log("Searching for:", query);
    // In a real app, you would perform the search and update state
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-anti-flash-white">
        {/* Dashboard Header */}
        <div className="bg-gradient-to-r from-bangladesh-green to-forest text-white py-8">
          <div className="container mx-auto px-4">
            <h1 className="text-2xl md:text-3xl font-semibold mb-4">Assessment Dashboard</h1>
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <p className="text-anti-flash-white max-w-2xl">
                Welcome back! Find assessment solutions, review your recent searches, and manage your saved products.
              </p>
              <SearchBar 
                onSearch={handleSearch} 
                placeholder="Search assessments..."
              />
            </div>
          </div>
        </div>
        
        {/* Dashboard Content */}
        <div className="container mx-auto px-4 py-8">
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="mb-6 bg-pistachio/30 p-1">
              <TabsTrigger 
                value="overview" 
                className="data-[state=active]:bg-white data-[state=active]:text-forest"
              >
                Overview
              </TabsTrigger>
              <TabsTrigger 
                value="recent" 
                className="data-[state=active]:bg-white data-[state=active]:text-forest"
              >
                Recent Activity
              </TabsTrigger>
              <TabsTrigger 
                value="saved" 
                className="data-[state=active]:bg-white data-[state=active]:text-forest"
              >
                Saved Products
              </TabsTrigger>
            </TabsList>
            
            {/* Overview Tab */}
            <TabsContent value="overview" className="space-y-8">
              {/* Recent Searches Section */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="subsection-title flex items-center">
                    <Clock size={20} className="mr-2" /> Recent Searches
                  </h2>
                  <Button variant="ghost" className="text-forest hover:text-caribbean-green">
                    View All
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                  {recentSearchesData.map((search, index) => (
                    <Button 
                      key={index} 
                      variant="outline" 
                      className="justify-start bg-white border-pistachio hover:border-caribbean-green"
                      onClick={() => handleSearch(search)}
                    >
                      <Search size={16} className="mr-2" />
                      <span className="truncate">{search}</span>
                    </Button>
                  ))}
                </div>
              </section>
              
              {/* Trending Products Section */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="subsection-title flex items-center">
                    <TrendingUp size={20} className="mr-2" /> Trending Products
                  </h2>
                  <Link to="/products">
                    <Button variant="ghost" className="text-forest hover:text-caribbean-green">
                      View All Products
                    </Button>
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {trendingProducts.map((product) => (
                    <ProductCard key={product.id} {...product} />
                  ))}
                </div>
              </section>
              
              {/* Saved Products Section */}
              <section>
                <div className="flex justify-between items-center mb-4">
                  <h2 className="subsection-title flex items-center">
                    <Bookmark size={20} className="mr-2" /> Your Saved Products
                  </h2>
                  <Button variant="ghost" className="text-forest hover:text-caribbean-green">
                    View All Saved
                  </Button>
                </div>
                
                {savedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedProducts.map((product) => (
                      <ProductCard key={product.id} {...product} />
                    ))}
                  </div>
                ) : (
                  <div className="card-base p-8 text-center">
                    <p className="text-forest mb-4">You haven't saved any products yet.</p>
                    <Link to="/products">
                      <Button className="bg-caribbean-green hover:bg-mountain-meadow text-dark-green">
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                )}
              </section>
            </TabsContent>
            
            {/* Recent Activity Tab */}
            <TabsContent value="recent">
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="subsection-title">Your Recent Activity</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-pistachio">
                      <Filter size={16} className="mr-2" /> Filter
                    </Button>
                    <Button variant="outline" className="border-pistachio">
                      <Download size={16} className="mr-2" /> Export
                    </Button>
                  </div>
                </div>
                
                <div className="card-base p-6">
                  <h3 className="font-medium text-forest mb-4">Recently Viewed Products</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {recentProducts.map((product) => (
                      <ProductCard key={product.id} {...product} />
                    ))}
                  </div>
                </div>
              </section>
            </TabsContent>
            
            {/* Saved Products Tab */}
            <TabsContent value="saved">
              <section>
                <div className="flex justify-between items-center mb-6">
                  <h2 className="subsection-title">Your Saved Products</h2>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" className="border-pistachio">
                      <Filter size={16} className="mr-2" /> Filter
                    </Button>
                    <Button variant="outline" className="border-pistachio">
                      <Download size={16} className="mr-2" /> Export
                    </Button>
                  </div>
                </div>
                
                {savedProducts.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {savedProducts.map((product) => (
                      <ProductCard key={product.id} {...product} />
                    ))}
                  </div>
                ) : (
                  <div className="card-base p-8 text-center">
                    <p className="text-forest mb-4">You haven't saved any products yet.</p>
                    <Link to="/products">
                      <Button className="bg-caribbean-green hover:bg-mountain-meadow text-dark-green">
                        Browse Products
                      </Button>
                    </Link>
                  </div>
                )}
              </section>
            </TabsContent>
          </Tabs>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
