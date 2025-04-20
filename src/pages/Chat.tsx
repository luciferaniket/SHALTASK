
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import ChatInterface from "@/components/ChatInterface";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Download, Save } from "lucide-react";

export default function Chat() {
  const handleExport = () => {
    console.log("Exporting chat history");
    // In a real app, you would implement the export functionality
  };

  const handleSave = () => {
    console.log("Saving recommendations");
    // In a real app, you would implement saving functionality
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      
      <main className="flex-grow bg-anti-flash-white py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Chat Section - 2/3 width on large screens */}
            <div className="lg:w-2/3">
              <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl md:text-3xl font-semibold text-bangladesh-green">
                  Chat with AssessAid
                </h1>
                <div className="flex gap-2">
                  <Button 
                    variant="outline" 
                    className="border-pistachio"
                    onClick={handleExport}
                  >
                    <Download size={16} className="mr-2" /> Export
                  </Button>
                  <Button 
                    className="bg-caribbean-green hover:bg-mountain-meadow text-dark-green"
                    onClick={handleSave}
                  >
                    <Save size={16} className="mr-2" /> Save
                  </Button>
                </div>
              </div>
              
              <ChatInterface />
            </div>
            
            {/* Info Panel - 1/3 width on large screens */}
            <div className="lg:w-1/3">
              <Tabs defaultValue="suggestions" className="w-full">
                <TabsList className="w-full mb-4 bg-pistachio/30 p-1">
                  <TabsTrigger 
                    value="suggestions" 
                    className="w-full data-[state=active]:bg-white data-[state=active]:text-forest"
                  >
                    Suggestions
                  </TabsTrigger>
                  <TabsTrigger 
                    value="help" 
                    className="w-full data-[state=active]:bg-white data-[state=active]:text-forest"
                  >
                    Help
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="suggestions" className="space-y-6">
                  <div className="card-base p-4">
                    <h3 className="font-medium text-forest mb-2">Try asking about:</h3>
                    <ul className="space-y-2">
                      <li>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-forest hover:text-caribbean-green hover:bg-pistachio/20"
                          onClick={() => {/* Would update chat with this suggestion */}}
                        >
                          Leadership assessments for senior managers
                        </Button>
                      </li>
                      <li>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-forest hover:text-caribbean-green hover:bg-pistachio/20"
                          onClick={() => {/* Would update chat with this suggestion */}}
                        >
                          Technical skill assessments for software developers
                        </Button>
                      </li>
                      <li>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-forest hover:text-caribbean-green hover:bg-pistachio/20"
                          onClick={() => {/* Would update chat with this suggestion */}}
                        >
                          Personality tests for customer support roles
                        </Button>
                      </li>
                      <li>
                        <Button 
                          variant="ghost" 
                          className="w-full justify-start text-forest hover:text-caribbean-green hover:bg-pistachio/20"
                          onClick={() => {/* Would update chat with this suggestion */}}
                        >
                          Cognitive ability assessments for research roles
                        </Button>
                      </li>
                    </ul>
                  </div>
                  
                  <div className="card-base p-4">
                    <h3 className="font-medium text-forest mb-2">Recently Viewed Products</h3>
                    <ul className="space-y-3">
                      <li className="border-b border-pistachio/50 pb-2">
                        <a href="#" className="block hover:text-caribbean-green">
                          <p className="font-medium">Leadership Impact Assessment</p>
                          <p className="text-sm text-muted-foreground">Leadership, Management</p>
                        </a>
                      </li>
                      <li className="border-b border-pistachio/50 pb-2">
                        <a href="#" className="block hover:text-caribbean-green">
                          <p className="font-medium">Technical Skills Assessment</p>
                          <p className="text-sm text-muted-foreground">Technical, IT, Development</p>
                        </a>
                      </li>
                      <li>
                        <a href="#" className="block hover:text-caribbean-green">
                          <p className="font-medium">Remote Work Readiness Assessment</p>
                          <p className="text-sm text-muted-foreground">Remote Work, Adaptation</p>
                        </a>
                      </li>
                    </ul>
                  </div>
                </TabsContent>
                
                <TabsContent value="help" className="space-y-6">
                  <div className="card-base p-4">
                    <h3 className="font-medium text-forest mb-2">How to Use the Chat</h3>
                    <ul className="space-y-2 list-disc pl-5">
                      <li>Describe the role or skills you're looking to assess</li>
                      <li>Specify industry or company size if relevant</li>
                      <li>Ask for specific types of assessments (e.g., personality, skills)</li>
                      <li>Request comparisons between assessment options</li>
                      <li>Ask for case studies related to your industry</li>
                    </ul>
                  </div>
                  
                  <div className="card-base p-4">
                    <h3 className="font-medium text-forest mb-2">Common Questions</h3>
                    <ul className="space-y-3">
                      <li className="border-b border-pistachio/50 pb-2">
                        <a href="#" className="block hover:text-caribbean-green">
                          <p className="font-medium">Which assessment is best for leadership roles?</p>
                        </a>
                      </li>
                      <li className="border-b border-pistachio/50 pb-2">
                        <a href="#" className="block hover:text-caribbean-green">
                          <p className="font-medium">How long do assessments typically take?</p>
                        </a>
                      </li>
                      <li className="border-b border-pistachio/50 pb-2">
                        <a href="#" className="block hover:text-caribbean-green">
                          <p className="font-medium">Can assessments be customized?</p>
                        </a>
                      </li>
                      <li>
                        <a href="#" className="block hover:text-caribbean-green">
                          <p className="font-medium">How do I interpret assessment results?</p>
                        </a>
                      </li>
                    </ul>
                  </div>
                </TabsContent>
              </Tabs>
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
}
