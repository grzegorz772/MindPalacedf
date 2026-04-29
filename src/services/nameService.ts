import { GoogleGenAI, Type } from "@google/genai";
import { FIRST_NAME_PART, SECOND_NAME_PART } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function remixName(
  first: string, 
  second: string
): Promise<{ keepFirst: string[]; keepSecond: string[] }> {
  try {
    const prompt = `
      You are a creative naming assistant for SSO Names.
      The user wants to remix the name "${first} ${second}".
      
      Generate exactly 6 unique permutations from the provided lists:
      - 3 names MUST have the exact first part "${first}".
      - 3 names MUST have the exact second part "${second}".
      
      CONSTRAINTS:
      1. You MUST select words ONLY from the provided lists.
      2. The format should be matching the arrays in your output precisely.
      
      LIST 1 (First Name Part):
      ${FIRST_NAME_PART.join(", ")}
      
      LIST 2 (Second Name Part):
      ${SECOND_NAME_PART.join(", ")}
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            keepFirst: {
              type: Type.ARRAY,
              description: `3 names starting exactly with "${first}" and ending with a word from List 2. Format: "First Second"`,
              items: { type: Type.STRING },
            },
            keepSecond: {
              type: Type.ARRAY,
              description: `3 names starting with a word from List 1 and ending exactly with "${second}". Format: "First Second"`,
              items: { type: Type.STRING },
            },
          },
          required: ["keepFirst", "keepSecond"],
        },
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");

    const json = JSON.parse(text) as { keepFirst: string[]; keepSecond: string[] };
    
    // Quick validation helper to extract correct casings and validate against the list
    const validatePair = (fullName: string): string => {
      const parts = fullName.trim().split(/\s+/);
      if (parts.length < 2) return fullName; // Fallback if AI messes up format
      const fString = parts[0];
      const sString = parts.slice(1).join(" ");
      
      const vFirst = FIRST_NAME_PART.find(w => w.toLowerCase() === fString.toLowerCase()) || fString;
      const vSecond = SECOND_NAME_PART.find(w => w.toLowerCase() === sString.toLowerCase()) || sString;
      return `${vFirst} ${vSecond}`;
    };

    return {
      keepFirst: (json.keepFirst || []).map(validatePair).slice(0, 3),
      keepSecond: (json.keepSecond || []).map(validatePair).slice(0, 3)
    };

  } catch (error) {
    console.error("Error remixing name:", error);
    throw error;
  }
}
export async function generateName(
  userRequest: string, 
  count: number = 3,
  fixedFirst?: string
): Promise<Array<{ first: string; second: string; reasoning?: string }>> {
  try {
    const prompt = `
      You are a creative naming assistant for horses.
      Your task is to select exactly one word from "List 1" and exactly one word from "List 2" to form a two-part name based on the user's request.
      
      USER REQUEST: "${userRequest}"
      
      CONSTRAINTS:
      1. You MUST select words ONLY from the provided lists.
      2. You MUST NOT modify, mutate, conjugate, or change the words in any way. Return them exactly as they appear in the list.
      3. The name should match the "vibe" or description provided by the user.
      4. If the user request is unclear, pick a combination that sounds beautiful and modern.
      5. You must generate exactly ${count} unique name suggestions.
      ${fixedFirst ? `6. The first part of the name MUST be "${fixedFirst}".` : ''}
      
      LIST 1 (First Name Part):
      ${fixedFirst ? fixedFirst : FIRST_NAME_PART.join(", ")}
      
      LIST 2 (Second Name Part):
      ${SECOND_NAME_PART.join(", ")}
      
      Return the result as a JSON array of objects, where each object has "first", "second", and "reasoning" properties.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              first: { type: Type.STRING },
              second: { type: Type.STRING },
              reasoning: { type: Type.STRING },
            },
            required: ["first", "second"],
          },
        },
      },
    });

    const text = response.text;
    
    if (!text) {
      throw new Error("No response from AI");
    }

    const json = JSON.parse(text) as Array<{ first: string; second: string; reasoning?: string }>;
    
    if (!Array.isArray(json)) {
      throw new Error("AI response is not an array");
    }

    // Validate strict adherence to lists (case-insensitive check)
    const validatedResults = json.map(item => {
      const first = item.first;
      const second = item.second;
      
      // If fixedFirst is set, we strictly validate against it (case-insensitive)
      let validFirst: string | undefined;
      
      if (fixedFirst) {
         if (first.toLowerCase() === fixedFirst.toLowerCase()) {
            validFirst = fixedFirst; // Use the canonical casing if needed, or just what AI returned if it matches
            // Actually, let's try to find it in the list to get canonical casing if possible, 
            // but if fixedFirst is provided, we assume it's valid or we just use it.
            // Since "Old" is in the list, we can find it.
            validFirst = FIRST_NAME_PART.find(w => w.toLowerCase() === fixedFirst.toLowerCase()) || fixedFirst;
         }
      } else {
         validFirst = FIRST_NAME_PART.find(w => w.toLowerCase() === first.toLowerCase());
      }

      const validSecond = SECOND_NAME_PART.find(w => w.toLowerCase() === second.toLowerCase());
      
      if (!validFirst || !validSecond) {
        console.warn("AI returned invalid words:", first, second);
        // Instead of throwing immediately, we might filter this one out later? 
        // But for now, let's throw to maintain strictness.
        throw new Error(`AI selected invalid words: ${!validFirst ? first : ''} ${!validSecond ? second : ''}`);
      }
      
      return {
        first: validFirst,
        second: validSecond,
        reasoning: item.reasoning
      };
    });

    return validatedResults;
    
  } catch (error) {
    console.error("Error generating name:", error);
    throw error;
  }
}
