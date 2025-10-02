/**
 * Extracts a JSON object or array from a string that may contain surrounding text, markdown, and common formatting errors.
 * This function is designed to be highly resilient to common LLM output inconsistencies.
 *
 * @param text The raw string from the AI response.
 * @returns A cleaned JSON string ready for parsing.
 * @throws An error if a valid JSON structure cannot be located or is incomplete.
 */
export const extractJson = (text: string): string => {
    // 1. Attempt to find JSON within markdown code blocks first for higher accuracy.
    const markdownMatch = text.match(/```(json)?([\s\S]*?)```/);
    let content = markdownMatch && markdownMatch[2] ? markdownMatch[2].trim() : text;

    // 2. Find the start of the JSON (either an object or an array).
    const firstBrace = content.indexOf('{');
    const firstBracket = content.indexOf('[');

    let startIndex = -1;
    
    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
        startIndex = firstBrace;
    } else if (firstBracket !== -1) {
        startIndex = firstBracket;
    }

    // FIX: Declare jsonString here and restructure logic to avoid using it before declaration and prevent runtime errors.
    let jsonString: string;

    if (startIndex === -1) {
        // If no JSON object or array is found, check if the content itself is a valid JSON array string
        if (content.trim().startsWith('[') && content.trim().endsWith(']')) {
             jsonString = content.trim();
        } else {
            throw new Error("Could not find a valid JSON object or array in the AI response.");
        }
    } else {
        const startChar = content[startIndex];
        const endChar = startChar === '{' ? '}' : ']';
    
        // 3. Use a counter to find the correct end of the JSON structure.
        // This is more robust than `lastIndexOf` as it handles nested structures.
        let count = 0;
        let endIndex = -1;
        for (let i = startIndex; i < content.length; i++) {
            if (content[i] === startChar) {
                count++;
            } else if (content[i] === endChar) {
                count--;
            }
            if (count === 0) {
                endIndex = i;
                break;
            }
        }
    
        if (endIndex === -1) {
            throw new Error("Could not find a complete JSON object or array in the AI response (unmatched brackets/braces).");
        }
    
        // 4. Extract the substring that is likely our JSON.
        jsonString = content.substring(startIndex, endIndex + 1);
    }


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