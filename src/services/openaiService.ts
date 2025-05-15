
interface AnalysisParams {
  apiKey: string;
  prompt: string;
  textData: string;
  model?: string;
}

export const analyzeTextWithOpenAI = async ({
  apiKey,
  prompt,
  textData,
  model = "gpt-4o-mini",
}: AnalysisParams): Promise<string> => {
  if (!apiKey) {
    throw new Error("OpenAI API key is required.");
  }
  if (!prompt) {
    throw new Error("Analysis prompt is required.");
  }
  if (!textData) {
    throw new Error("Text data for analysis is required.");
  }

  const fullPrompt = `${prompt}\n\nДанные для анализа (CSV формат):\n${textData}`;

  try {
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: "Ты - аналитический ассистент, который помогает анализировать данные из Twitter/X." },
          { role: "user", content: fullPrompt },
        ],
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("OpenAI API Error:", errorData);
      throw new Error(
        `OpenAI API request failed with status ${response.status}: ${errorData.error?.message || response.statusText}`
      );
    }

    const data = await response.json();
    return data.choices[0]?.message?.content || "No content returned from API.";
  } catch (error) {
    console.error("Error calling OpenAI API:", error);
    if (error instanceof Error) {
      throw new Error(`Failed to analyze text: ${error.message}`);
    }
    throw new Error("An unknown error occurred during analysis.");
  }
};
