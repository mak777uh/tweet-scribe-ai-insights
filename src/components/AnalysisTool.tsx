
import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { analyzeTextWithOpenAI } from "@/services/openaiService";

const AnalysisTool: React.FC = () => {
  const [apiKey, setApiKey] = useState<string>("");
  const [textData, setTextData] = useState<string>("");
  const [profileName, setProfileName] = useState<string>("Default Profile");
  const [customPrompt, setCustomPrompt] = useState<string>("Проанализируй следующий текст и выдели основные темы и настроения.");
  const [analysisResult, setAnalysisResult] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    const storedApiKey = localStorage.getItem("openai_api_key");
    if (storedApiKey) {
      setApiKey(storedApiKey);
    }
  }, []);

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setApiKey(e.target.value);
    localStorage.setItem("openai_api_key", e.target.value);
  };

  const handleAnalyze = async () => {
    if (!apiKey) {
      toast({ title: "Ошибка", description: "Пожалуйста, введите ваш OpenAI API ключ.", variant: "destructive" });
      return;
    }
    if (!textData) {
      toast({ title: "Ошибка", description: "Пожалуйста, введите текст для анализа.", variant: "destructive" });
      return;
    }
    if (!customPrompt) {
      toast({ title: "Ошибка", description: "Пожалуйста, введите промпт для анализа.", variant: "destructive" });
      return;
    }

    setIsLoading(true);
    setAnalysisResult("");
    try {
      const result = await analyzeTextWithOpenAI({
        apiKey,
        prompt: customPrompt,
        textData,
      });
      setAnalysisResult(result);
      toast({ title: "Анализ завершен", description: "Результаты анализа отображены ниже." });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Произошла неизвестная ошибка.";
      toast({ title: "Ошибка анализа", description: errorMessage, variant: "destructive" });
      setAnalysisResult(`Ошибка: ${errorMessage}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-4 space-y-6">
      <h1 className="text-3xl font-bold text-center mb-8">Инструмент Анализа Текста</h1>

      <Card>
        <CardHeader>
          <CardTitle>Настройки API и Данных</CardTitle>
          <CardDescription>Введите ваш OpenAI API ключ и текст, который вы хотите проанализировать.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="api-key">OpenAI API Ключ</Label>
            <Input
              id="api-key"
              type="password"
              placeholder="Введите ваш OpenAI API ключ"
              value={apiKey}
              onChange={handleApiKeyChange}
              className="mt-1"
            />
            <p className="text-xs text-muted-foreground mt-1">Ваш ключ будет сохранен в локальном хранилище браузера.</p>
          </div>
          <div>
            <Label htmlFor="text-data">Текст для Анализа</Label>
            <Textarea
              id="text-data"
              placeholder="Вставьте сюда текст для анализа (например, твиты, статьи)..."
              value={textData}
              onChange={(e) => setTextData(e.target.value)}
              className="mt-1 min-h-[150px]"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Профиль Анализа</CardTitle>
          <CardDescription>Настройте промпт для анализа. В будущем здесь можно будет выбирать из нескольких профилей.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="profile-name">Название Профиля</Label>
            <Input
              id="profile-name"
              placeholder="Например, 'Анализ тональности'"
              value={profileName}
              onChange={(e) => setProfileName(e.target.value)}
              className="mt-1"
            />
          </div>
          <div>
            <Label htmlFor="custom-prompt">Пользовательский Промпт</Label>
            <Textarea
              id="custom-prompt"
              placeholder="Опишите, как AI должен проанализировать текст..."
              value={customPrompt}
              onChange={(e) => setCustomPrompt(e.target.value)}
              className="mt-1 min-h-[100px]"
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleAnalyze} disabled={isLoading} className="w-full">
            {isLoading ? "Анализируем..." : "Анализировать Текст"}
          </Button>
        </CardFooter>
      </Card>

      {analysisResult && (
        <Card>
          <CardHeader>
            <CardTitle>Результат Анализа</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              value={analysisResult}
              readOnly
              className="min-h-[200px] bg-muted"
              placeholder="Здесь будет отображен результат анализа..."
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalysisTool;
