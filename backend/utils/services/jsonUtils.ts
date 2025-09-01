/**
 * Extracts the first complete JSON object from a string that may contain surrounding text or markdown.
 * This function is designed to be resilient to common LLM-related formatting issues.
 *
 * @param text The raw string from the AI response.
 * @returns A cleaned JSON string ready for parsing.
 * @throws An error if a JSON object cannot be located.
 */
export const extractJson = (text: string): string => {
    // Attempt to find JSON within markdown code blocks first
    const markdownMatch = text.match(/```(json)?([\s\S]*?)```/);
    const content = markdownMatch && markdownMatch[2] ? markdownMatch[2].trim() : text;

    // Find the first '{' and the last '}' to bound the JSON object
    const firstBrace = content.indexOf('{');
    const lastBrace = content.lastIndexOf('}');

    if (firstBrace === -1 || lastBrace === -1 || lastBrace < firstBrace) {
        throw new Error("Could not find a valid JSON object in the AI response.");
    }

    // Extract the substring that is likely our JSON
    const jsonString = content.substring(firstBrace, lastBrace + 1);
    
    return jsonString;
};

/**
 * A recursive function to remove numeric citation patterns (e.g., `[23]`) from all string values within a JSON object.
 * @param obj The object to clean.
 * @returns The cleaned object.
 */
export const cleanCitations = (obj: any): any => {
    if (Array.isArray(obj)) {
        return obj.map(v => cleanCitations(v));
    } else if (obj !== null && typeof obj === 'object') {
        return Object.fromEntries(
            Object.entries(obj).map(([k, v]) => [k, cleanCitations(v)])
        );
    } else if (typeof obj === 'string') {
        // Removes citation patterns like [9, 15, 22, 23, 24, 54] or [36] from the end of a string.
        return obj.replace(/\s*\[\d+(,\s*\d+)*\]$/g, '').trim();
    }
    return obj;
};
