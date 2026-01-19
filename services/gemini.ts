import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-pro-preview';

/**
 * Sends a chat message to the Gemini model.
 */
export const sendChatMessage = async (
  message: string, 
  history: { role: 'user' | 'model'; parts: { text: string }[] }[]
): Promise<string> => {
  try {
    const chat = ai.chats.create({
      model: MODEL_NAME,
      history: history,
      config: {
        systemInstruction: "Eres 'Nexus', un asistente de IA especializado para la aplicación SpaceX Community Nexus. Tienes conocimientos sobre cohetería, mecánica orbital, historia de SpaceX y el estado actual de las misiones. Tu tono es profesional, ligeramente técnico, pero accesible, como un director de vuelo de control de misión amigable. Mantén las respuestas concisas y centradas en la exploración espacial. Responde siempre en Español.",
      },
    });

    const result: GenerateContentResponse = await chat.sendMessage({ message });
    return result.text || "Comunicación interrumpida. Por favor, inténtelo de nuevo.";
  } catch (error) {
    console.error("Gemini Chat Error:", error);
    throw new Error("Fallo al comunicarse con Nexus AI.");
  }
};

/**
 * Analyzes an image or video using the Gemini model.
 */
export const analyzeMedia = async (
  fileBase64: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const isVideo = mimeType.startsWith('video/');
    
    const mediaPart = {
      inlineData: {
        data: fileBase64,
        mimeType: mimeType
      }
    };

    const textPart = {
      text: prompt || (isVideo 
        ? "Analiza este videoclip. Describe el vehículo de lanzamiento, eventos clave, anomalías o detalles técnicos visibles. Responde en Español." 
        : "Analiza esta imagen. Identifica la nave espacial, componente o evento mostrado y proporciona contexto técnico. Responde en Español.")
    };

    const response = await ai.models.generateContent({
      model: MODEL_NAME,
      contents: {
        parts: [mediaPart, textPart]
      }
    });

    return response.text || "Análisis completo, pero no se devolvieron datos.";
  } catch (error) {
    console.error("Gemini Vision Error:", error);
    throw new Error("El análisis de telemetría falló. Verifique la integridad de la señal (formato de archivo) e intente nuevamente.");
  }
};
