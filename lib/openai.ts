import OpenAI from 'openai';

// Initialize OpenAI client only if API key is available
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
}) : null;

export interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface Memory {
  id: string;
  text: string;
  score?: number;
}

export interface LLMResponse {
  content: string;
  citedMemories: string[];
}

export class OpenAIService {
  // List of models to try in order of preference
  private static readonly FALLBACK_MODELS = [
    'gpt-4o-mini',
  ];

  static async generateResponse(
    messages: ChatMessage[],
    memories: Memory[] = []
  ): Promise<LLMResponse> {
    if (!openai) {
      console.warn('OpenAI client not initialized - API key missing');
      return {
        content: 'I apologize, but I am currently unable to generate responses. Please check the API configuration.',
        citedMemories: [],
      };
    }
    
    try {
      const memoryContext = memories.length > 0 
        ? `\n\nRelevant memories:\n${memories.map((m, i) => `[${i + 1}] ${m.text} (ID: ${m.id})`).join('\n')}`
        : '';

      const systemMessage = `You are a helpful AI assistant with access to the user's memories. When answering questions, use the provided memories as context when relevant. When you reference information from memories, include the memory ID in square brackets like [memory:${memories[0]?.id || 'example'}].

Guidelines:
- Be conversational and helpful
- Use memories when they're relevant to the question
- Cite specific memories when you reference them
- If no relevant memories exist, answer based on your general knowledge
- Keep responses concise but informative${memoryContext}`;

      // Try models in order of preference
      const modelsToTry = [
        process.env.OPENAI_MODEL || 'gpt-4o-mini',
        ...this.FALLBACK_MODELS.filter(model => model !== (process.env.OPENAI_MODEL || 'gpt-4o-mini'))
      ];

      let response;
      let lastError;

      for (const model of modelsToTry) {
        try {
          response = await openai.chat.completions.create({
            model,
            messages: [
              { role: 'system', content: systemMessage },
              ...messages,
            ],
            temperature: 0.7,
            max_tokens: 1000,
          });
          console.log(`Successfully used model: ${model}`);
          break; // Success, exit the loop
        } catch (error: any) {
          console.warn(`Model ${model} failed:`, error.message);
          lastError = error;
          continue; // Try next model
        }
      }

      if (!response) {
        throw lastError || new Error('All models failed');
      }

      const content = response.choices[0]?.message?.content || '';
      
      // Extract cited memory IDs
      const citationRegex = /\[memory:([^\]]+)\]/g;
      const citedMemories: string[] = [];
      let match;
      
      while ((match = citationRegex.exec(content)) !== null) {
        citedMemories.push(match[1]);
      }

      return {
        content,
        citedMemories: Array.from(new Set(citedMemories)), // Remove duplicates
      };
    } catch (error) {
      console.error('Error generating response:', error);
      throw new Error('Failed to generate response');
    }
  }
}

export default OpenAIService;