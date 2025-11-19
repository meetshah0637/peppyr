/**
 * Quickbar overlay component for fast template access
 * Features: hotkey activation, keyboard navigation, search, and instant copy
 */

import React, { useState, useEffect, useRef } from 'react';
import { Template } from '../types';
import { useTemplates } from '../hooks/useTemplates';
import { useQuickbarHotkey } from '../hooks/useHotkey';

interface QuickbarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const Quickbar: React.FC<QuickbarProps> = ({ isOpen, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([]);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  const { 
    getFavoriteTemplates, 
    getRecentlyUsedTemplates, 
    searchTemplates, 
    copyTemplate 
  } = useTemplates();

  // Handle quickbar hotkey
  useQuickbarHotkey(() => {
    if (!isOpen) {
      onClose(); // This will be handled by parent to open
    }
  });

  // Focus search input when quickbar opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, [isOpen]);

  // Update filtered templates when search query changes
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredTemplates(searchTemplates(searchQuery));
    } else {
      // Show top 8 favorites or recently used
      const favorites = getFavoriteTemplates();
      const recent = getRecentlyUsedTemplates();
      const combined = [...favorites, ...recent.filter(t => !favorites.some(f => f.id === t.id))];
      setFilteredTemplates(combined.slice(0, 8));
    }
    setSelectedIndex(0);
  }, [searchQuery, getFavoriteTemplates, getRecentlyUsedTemplates, searchTemplates]);

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex(prev => Math.min(prev + 1, filteredTemplates.length - 1));
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex(prev => Math.max(prev - 1, 0));
        break;
      case 'Enter':
        e.preventDefault();
        if (filteredTemplates[selectedIndex]) {
          handleCopy(filteredTemplates[selectedIndex].id);
        }
        break;
      case 'Escape':
        e.preventDefault();
        onClose();
        break;
    }
  };

  // Handle template copy
  const handleCopy = async (templateId: string) => {
    try {
      await copyTemplate(templateId);
      onClose();
    } catch (error) {
      console.error('Failed to copy template:', error);
      // Could add toast notification here
    }
  };

  // Handle backdrop click
  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center pt-20 z-50 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div 
        className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 animate-slide-up"
        onKeyDown={handleKeyDown}
        tabIndex={-1}
      >
        {/* Search Input */}
        <div className="p-4 border-b border-gray-200">
          <input
            ref={searchInputRef}
            type="text"
            placeholder="Search templates... (Press ↑↓ to navigate, Enter to copy, Esc to close)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-3 text-lg border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          />
        </div>

        {/* Template List */}
        <div ref={listRef} className="max-h-96 overflow-y-auto">
          {filteredTemplates.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              {searchQuery ? 'No templates found' : 'No templates available'}
            </div>
          ) : (
            filteredTemplates.map((template, index) => (
              <div
                key={template.id}
                className={`p-4 border-b border-gray-100 cursor-pointer transition-colors ${
                  index === selectedIndex 
                    ? 'bg-blue-50 border-blue-200' 
                    : 'hover:bg-gray-50'
                }`}
                onClick={() => handleCopy(template.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 truncate">
                      {template.title}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                      {template.body.split('\n').slice(0, 2).join(' ')}
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                      {template.tags.map(tag => (
                        <span 
                          key={tag}
                          className="inline-block px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                      {template.isFavorite && (
                        <span className="text-yellow-500 text-sm">★</span>
                      )}
                    </div>
                  </div>
                  <div className="ml-4 text-right text-sm text-gray-500">
                    <div>Copied {template.copyCount} times</div>
                    {template.lastUsed && (
                      <div>
                        Last used: {new Date(template.lastUsed).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 rounded-b-lg text-sm text-gray-600">
          <div className="flex items-center justify-between">
            <div>
              Use ↑↓ to navigate • Enter to copy • Esc to close
            </div>
            <div>
              {filteredTemplates.length} template{filteredTemplates.length !== 1 ? 's' : ''}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

