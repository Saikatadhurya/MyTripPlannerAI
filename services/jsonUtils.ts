/**
 * Extracts a JSON object from a string that may contain surrounding text, markdown, and common formatting errors.
 * This function is designed to be highly resilient to common LLM output inconsistencies.
 *
 * @param text The raw string from the AI response.
 * @returns A cleaned JSON string ready for parsing.
 * @throws An error if a valid JSON object cannot be located or is incomplete.
 */
export const extractJson = (text: string): string => {
    // 1. Attempt to find JSON within markdown code blocks first for higher accuracy.
    const markdownMatch = text.match(/```(json)?([\s\S]*?)```/);
    let content = markdownMatch && markdownMatch[2] ? markdownMatch[2].trim() : text;

    // 2. Find the start of the JSON object.
    const firstBrace = content.indexOf('{');
    if (firstBrace === -1) {
        throw new Error("Could not find a valid JSON object in the AI response (no opening brace).");
    }

    // 3. Use a brace-counting method to find the correct end of the JSON object.
    // This is more robust than `lastIndexOf('}')` as it handles nested objects and trailing text.
    let braceCount = 0;
    let lastBrace = -1;
    for (let i = firstBrace; i < content.length; i++) {
        if (content[i] === '{') {
            braceCount++;
        } else if (content[i] === '}') {
            braceCount--;
        }
        if (braceCount === 0) {
            lastBrace = i;
            break;
        }
    }

    if (lastBrace === -1) {
        throw new Error("Could not find a complete JSON object in the AI response (unmatched braces).");
    }

    // 4. Extract the substring that is likely our JSON.
    let jsonString = content.substring(firstBrace, lastBrace + 1);

    // 5. Pre-parse cleanup for common LLM errors.
    // Remove trailing commas, which are invalid in strict JSON.
    jsonString = jsonString.replace(/,\s*([}\]])/g, "$1");
    // Remove single-line and multi-line comments.
    jsonString = jsonString.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');

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