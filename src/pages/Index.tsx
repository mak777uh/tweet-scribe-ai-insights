
import React, { useState } from "react";
import TwitterScraper from "@/components/TwitterScraper";
import AIAnalysis from "@/components/AIAnalysis";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { convertTwitterDataToCsv } from "@/utils/csvExport";

const Index = () => {
  const [twitterData, setTwitterData] = useState<any[] | null>(null);
  const [csvData, setCsvData] = useState<string | null>(null);
  
  const handleDataScraped = (data: any[]) => {
    setTwitterData(data);
    const csv = convertTwitterDataToCsv(data);
    setCsvData(csv);
  };
  
  return (
    <div className="min-h-screen bg-background text-foreground p-4">
      <div className="container mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-center my-6">Twitter Data Analysis Tool</h1>
        
        <Tabs defaultValue="scraper" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="scraper">Twitter Data Scraper</TabsTrigger>
            <TabsTrigger value="analysis" disabled={!csvData}>AI Analysis</TabsTrigger>
          </TabsList>
          <div className="mt-6">
            <TabsContent value="scraper">
              <TwitterScraper onDataScraped={handleDataScraped} />
            </TabsContent>
            <TabsContent value="analysis">
              <AIAnalysis csvData={csvData} />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </div>
  );
};

export default Index;
