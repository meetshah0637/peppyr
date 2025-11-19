/**
 * Custom hook for handling global hotkeys
 * Supports Ctrl+K (Windows/Linux) and Cmd+K (macOS) for opening quickbar
 */

import { useEffect, useCallback } from 'react';

export const useHotkey = (callback: () => void, key: string, ctrlKey = false, metaKey = false) => {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Check if the correct key is pressed
    if (event.key.toLowerCase() !== key.toLowerCase()) return;
    
    // Check modifier keys
    const hasCtrl = ctrlKey ? event.ctrlKey : !event.ctrlKey;
    const hasMeta = metaKey ? event.metaKey : !event.metaKey;
    
    // Prevent default behavior for our hotkeys
    if (hasCtrl && hasMeta) {
      event.preventDefault();
      callback();
    }
  }, [callback, key, ctrlKey, metaKey]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
};

/**
 * Hook specifically for the quickbar hotkey (Ctrl+K / Cmd+K)
 */
export const useQuickbarHotkey = (callback: () => void) => {
  const handleCtrlK = useCallback(() => {
    callback();
  }, [callback]);

  const handleCmdK = useCallback(() => {
    callback();
  }, [callback]);

  // Listen for Ctrl+K (Windows/Linux)
  useHotkey(handleCtrlK, 'k', true, false);
  
  // Listen for Cmd+K (macOS)
  useHotkey(handleCmdK, 'k', false, true);
};

