const OLLAMA_API_URL = "http://localhost:11434";

export interface OllamaModelDescription {
  name: string;
  model: string;
  modified_at: string;
  size: number;
  digest: string;
  details: {
    parent_model: string;
    format: string;
    family: string;
    families: string[];
    parameter_size: string;
    quantization_level: string;
  };
}

export interface OllamaTagsResponse {
  models: OllamaModelDescription[];
}

export async function checkOllamaRunning(): Promise<boolean> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/tags`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
      // Using a short timeout implicitly by the fact that if it's local it fails fast
      // or we could use AbortController if needed, but fetch usually errors fast on localhost refuse.
    });
    return response.ok;
  } catch (error) {
    return false;
  }
}

export async function listModels(): Promise<OllamaModelDescription[]> {
  try {
    const response = await fetch(`${OLLAMA_API_URL}/api/tags`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    if (!response.ok) {
      return [];
    }

    const data = (await response.json()) as OllamaTagsResponse;
    return data.models || [];
  } catch (error) {
    return [];
  }
}

export async function hasModel(modelName: string): Promise<boolean> {
  const models = await listModels();
  return models.some((m) => m.name === modelName || m.model === modelName);
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface ChatResponse {
  model: string;
  created_at: string;
  message: ChatMessage;
  done: boolean;
}

export async function chatOllama(
  modelName: string,
  messages: ChatMessage[],
  onChunk: (chunk: string) => void
): Promise<string> {
  const response = await fetch(`${OLLAMA_API_URL}/api/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: modelName,
      messages,
      stream: true,
    }),
  });

  if (!response.ok || !response.body) {
    throw new Error("Failed to communicate with Ollama");
  }

  const reader = response.body.getReader();
  const decoder = new TextDecoder("utf-8");
  let fullResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    const chunk = decoder.decode(value, { stream: true });
    // Parse individual JSON objects from the stream chunk
    const lines = chunk.split("\n").filter((line) => line.trim() !== "");

    for (const line of lines) {
      try {
        const parsed = JSON.parse(line) as ChatResponse;
        if (parsed.message?.content) {
          fullResponse += parsed.message.content;
          onChunk(parsed.message.content);
        }
      } catch (err) {
        // Ignored unparsable line silently
      }
    }
  }

  return fullResponse;
}
