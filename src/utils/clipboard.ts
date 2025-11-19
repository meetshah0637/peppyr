/**
 * Clipboard utilities with fallbacks for different browsers and environments
 * Prioritizes modern navigator.clipboard API with execCommand fallback
 */

export class ClipboardError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ClipboardError';
  }
}

export const clipboard = {
  /**
   * Copy text to clipboard with modern API and fallback
   * @param text - Text to copy to clipboard
   * @returns Promise that resolves when copy is successful
   */
  async copyText(text: string): Promise<void> {
    // Modern clipboard API (preferred)
    if (navigator.clipboard && window.isSecureContext) {
      try {
        await navigator.clipboard.writeText(text);
        return;
      } catch (error) {
        console.warn('Modern clipboard API failed, trying fallback:', error);
      }
    }

    // Fallback for older browsers or non-secure contexts
    try {
      const textArea = document.createElement('textarea');
      textArea.value = text;
      textArea.style.position = 'fixed';
      textArea.style.left = '-999999px';
      textArea.style.top = '-999999px';
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      
      const successful = document.execCommand('copy');
      document.body.removeChild(textArea);
      
      if (!successful) {
        throw new Error('execCommand copy failed');
      }
    } catch (error) {
      throw new ClipboardError(`Failed to copy text to clipboard: ${error}`);
    }
  },

  /**
   * Check if clipboard API is available
   */
  isSupported(): boolean {
    return !!(navigator.clipboard || document.execCommand);
  }
};

