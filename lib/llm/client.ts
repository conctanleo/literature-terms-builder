export async function callLLM(systemPrompt: string, userMessage: string): Promise<string> {
  const apiKey = process.env.GLM5_API_KEY;
  const baseUrl = process.env.GLM5_BASE_URL || "https://open.bigmodel.cn/api/paas/v4";

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "glm-5.1",
      max_tokens: 4096,
      thinking: { type: "disabled" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage },
      ],
    }),
  });

  if (!response.ok) {
    throw new Error(`LLM API error: ${response.status} ${await response.text()}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || "";
}
