/**
 * Template parameter utilities
 * Handles placeholder replacement in templates (e.g., {name}, {company})
 */

/**
 * Extract all parameter placeholders from a template body
 * @param text - Template text to scan
 * @returns Array of parameter keys found (e.g., ["name", "company"])
 */
export function extractParameters(text: string): string[] {
  const regex = /\{([^}]+)\}/g;
  const matches: string[] = [];
  let match;
  
  while ((match = regex.exec(text)) !== null) {
    const paramKey = match[1].trim();
    if (paramKey && !matches.includes(paramKey)) {
      matches.push(paramKey);
    }
  }
  
  return matches;
}

/**
 * Replace placeholders in template text with parameter values
 * @param text - Template text with placeholders
 * @param parameters - Object mapping parameter keys to values
 * @returns Text with placeholders replaced
 */
export function replaceParameters(text: string, parameters: Record<string, string>): string {
  if (!text) return text;
  if (!parameters || Object.keys(parameters).length === 0) {
    console.warn('No parameters provided for replacement');
    return text;
  }
  
  let result = text;
  const placeholdersFound = extractParameters(text);
  
  console.log('Parameter replacement - Input:', { 
    text: text.substring(0, 100) + (text.length > 100 ? '...' : ''),
    parameters,
    placeholdersFound
  });
  
  // Replace all {key} placeholders with their values
  Object.entries(parameters).forEach(([key, value]) => {
    if (value && value.trim()) {
      // Escape special regex characters in the key
      const escapedKey = key.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const regex = new RegExp(`\\{${escapedKey}\\}`, 'gi'); // Case-insensitive match
      const beforeReplace = result;
      result = result.replace(regex, value.trim());
      
      if (beforeReplace !== result) {
        console.log(`✓ Replaced {${key}} with "${value.trim()}"`);
      } else if (placeholdersFound.includes(key.toLowerCase())) {
        console.warn(`⚠ Placeholder {${key}} found in text but not replaced. Check case sensitivity.`);
      }
    } else if (placeholdersFound.includes(key.toLowerCase())) {
      console.warn(`⚠ Parameter "${key}" has no value (empty or whitespace)`);
    }
  });
  
  // Check for unreplaced placeholders
  const remainingPlaceholders = extractParameters(result);
  if (remainingPlaceholders.length > 0) {
    console.warn('⚠ Unreplaced placeholders remaining:', remainingPlaceholders);
    console.warn('Available parameters:', Object.keys(parameters));
  }
  
  console.log('Parameter replacement - Output:', { 
    result: result.substring(0, 100) + (result.length > 100 ? '...' : ''),
    wasReplaced: result !== text
  });
  
  return result;
}

/**
 * Get default/common parameter keys
 */
export function getDefaultParameters(): Array<{ key: string; label: string; placeholder: string }> {
  return [
    { key: 'name', label: 'Your Name', placeholder: 'John Doe' },
    { key: 'company', label: 'Company Name', placeholder: 'Acme Corp' },
    { key: 'title', label: 'Your Title', placeholder: 'Sales Manager' },
    { key: 'email', label: 'Email', placeholder: 'john@example.com' },
    { key: 'phone', label: 'Phone', placeholder: '+1 (555) 123-4567' },
    { key: 'website', label: 'Website', placeholder: 'www.example.com' },
  ];
}

