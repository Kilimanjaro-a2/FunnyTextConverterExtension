
const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL_NAME = "claude-3-5-haiku-20241022"

export async function getApiKey(): Promise<string> {
  const { claudeApiKey } = await chrome.storage.sync.get<{claudeApiKey: string}>(['claudeApiKey']);
  return claudeApiKey;
}

export async function isApiKeyRequired() {
  const hasKey = await getApiKey();
  return !hasKey
}

export async function callLlm(prompt: string): Promise<string> {
  try {
    const apiKey = await getApiKey();
    const response = await fetch(API_URL, {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
        "anthropic-dangerous-direct-browser-access": "true",
      },
      body: JSON.stringify({
        model: MODEL_NAME,
        max_tokens: 4096,
        messages: [
          {
            role: "user",
            content: [
              { type: "text", text: prompt },
            ],
          },
        ],
      }),
    })
    .then((response) => response.json())
    .then((data) => {
      console.log("Calling Claude API is Succeeded!")
      const haiku = data.content[0].text;
      return haiku;
    })
    .catch((error) => {
      console.error("Error:", error);
    });
    console.log(response)
    return response
  } catch (error) {
    console.error('Error calling Claude API:', error);
    return "";
  }
}