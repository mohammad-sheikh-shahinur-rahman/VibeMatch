import { GoogleGenAI } from '@google/genai';

let aiClient: GoogleGenAI | null = null;

function getAIClient() {
  if (!aiClient) {
    const apiKey = process.env.GEMINI_API_KEY || '';
    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      aiClient = new GoogleGenAI({ apiKey });
    }
  }
  return aiClient;
}

export async function generateMatchChatResponse(partnerName: string, partnerCountry: string, userMessage: string): Promise<string> {
  const client = getAIClient();
  if (!client) {
    const fallbackReplies = [
      `Hey! Great talking to you from ${partnerCountry}! What are you up to today? ✨`,
      `Haha that sounds awesome! I really enjoy meeting people on VibeMatch! 😊`,
      `I love ${partnerCountry}! Are you having a good time on video chat today? 🎬`,
      `That's so interesting! Tell me more about your hobbies! 🌟`
    ];
    return fallbackReplies[Math.floor(Math.random() * fallbackReplies.length)];
  }

  try {
    const response = await client.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: `You are ${partnerName}, a friendly video chat partner from ${partnerCountry} on VibeMatch live video chat platform. Reply in a casual, warm, conversational way (1-2 short sentences max with emojis) to this message from your match partner: "${userMessage}".`
    });
    return response.text || `Hey! So nice talking to you! ✨`;
  } catch (err) {
    return `Hey! So glad we matched! Hope you're having an awesome day! 🎉`;
  }
}
