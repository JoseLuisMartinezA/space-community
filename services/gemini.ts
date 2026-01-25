import { GoogleGenAI, GenerateContentResponse } from "@google/genai";

// Initialize the client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

const MODEL_NAME = 'gemini-3-pro-preview';

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
