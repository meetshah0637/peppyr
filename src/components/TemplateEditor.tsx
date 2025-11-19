/**
 * Template editor modal for creating and editing templates
 * Handles form validation, tag management, and CRUD operations
 */

import React, { useState, useEffect, useRef } from 'react';
import { Template } from '../types';
import { useParameters } from '../hooks/useParameters';
import { getDefaultParameters } from '../utils/templateParams';

interface TemplateEditorProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (template: Omit<Template, 'id' | 'createdAt' | 'copyCount' | 'lastUsed'>) => void;
  onUpdate: (id: string, updates: Partial<Template>) => void;
  editingTemplate: Template | null;
  isCreating: boolean;
}

export const TemplateEditor: React.FC<TemplateEditorProps> = ({
  isOpen,
  onClose,
  onSave,
  onUpdate,
  editingTemplate,
  isCreating
}) => {
  const [formData, setFormData] = useState({
    title: '',
    body: '',
    tags: [] as string[],
    isFavorite: false,
    isArchived: false
  });
  const [tagInput, setTagInput] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  
  // Autocomplete state
  const [autocompleteVisible, setAutocompleteVisible] = useState(false);
  const [autocompletePosition, setAutocompletePosition] = useState({ top: 0, left: 0 });
  const [selectedAutocompleteIndex, setSelectedAutocompleteIndex] = useState(0);
  const [autocompleteQuery, setAutocompleteQuery] = useState('');
  const bodyTextareaRef = useRef<HTMLTextAreaElement>(null);
  const autocompleteRef = useRef<HTMLDivElement>(null);
  const autocompleteItemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const { parameters } = useParameters();

  // Initialize form data when editing template changes
  useEffect(() => {
    if (editingTemplate && !isCreating) {
      setFormData({
        title: editingTemplate.title,
        body: editingTemplate.body,
        tags: [...editingTemplate.tags],
        isFavorite: editingTemplate.isFavorite,
        isArchived: editingTemplate.isArchived
      });
    } else {
      setFormData({
        title: '',
        body: '',
        tags: [],
        isFavorite: false,
        isArchived: false
      });
    }
    setTagInput('');
    setErrors({});
    setAutocompleteVisible(false); // Close autocomplete when editor opens/closes
    autocompleteItemRefs.current = []; // Reset refs
  }, [editingTemplate, isCreating, isOpen]);
  
  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (autocompleteVisible && 
          autocompleteRef.current && 
          !autocompleteRef.current.contains(e.target as Node) &&
          bodyTextareaRef.current &&
          !bodyTextareaRef.current.contains(e.target as Node)) {
        setAutocompleteVisible(false);
        autocompleteItemRefs.current = []; // Reset refs
      }
    };
    
    if (autocompleteVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [autocompleteVisible]);

  // Handle form field changes
  const handleFieldChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
    
    // Handle autocomplete for body field
    if (field === 'body') {
      handleBodyChange(value);
    }
  };
  
  // Handle body textarea changes and autocomplete
  const handleBodyChange = (value: string) => {
    // Use setTimeout to ensure cursor position is updated
    setTimeout(() => {
      const textarea = bodyTextareaRef.current;
      if (!textarea) return;
      
      const cursorPos = textarea.selectionStart;
      const textBeforeCursor = value.substring(0, cursorPos);
      
      // Check if user just typed '{' or is typing inside a parameter placeholder
      const lastOpenBrace = textBeforeCursor.lastIndexOf('{');
      const lastCloseBrace = textBeforeCursor.lastIndexOf('}');
      
      // If there's an open brace after the last close brace, show autocomplete
      if (lastOpenBrace > lastCloseBrace) {
        const query = textBeforeCursor.substring(lastOpenBrace + 1);
        
        // Don't show autocomplete if there's already a closing brace
        if (!query.includes('}')) {
          setAutocompleteQuery(query);
          updateAutocompletePosition(textarea, cursorPos);
          setAutocompleteVisible(true);
          setSelectedAutocompleteIndex(0);
          return;
        }
      }
      
      // Hide autocomplete if user typed '}' or moved cursor away
      setAutocompleteVisible(false);
      autocompleteItemRefs.current = []; // Reset refs
    }, 0);
  };
  
  // Update autocomplete dropdown position
  const updateAutocompletePosition = (textarea: HTMLTextAreaElement, cursorPos: number) => {
    // Get textarea position and dimensions
    const rect = textarea.getBoundingClientRect();
    const textareaStyle = window.getComputedStyle(textarea);
    const lineHeight = parseFloat(textareaStyle.lineHeight) || 20;
    const paddingTop = parseFloat(textareaStyle.paddingTop) || 12;
    const paddingLeft = parseFloat(textareaStyle.paddingLeft) || 12;
    
    // Calculate which line the cursor is on
    const textBeforeCursor = textarea.value.substring(0, cursorPos);
    const lines = textBeforeCursor.split('\n');
    const lineIndex = lines.length - 1;
    const charIndex = lines[lineIndex].length;
    
    // Approximate character width (most fonts are roughly 8-10px wide)
    const charWidth = 8.5;
    
    // Calculate position relative to textarea container
    const top = paddingTop + (lineIndex + 1) * lineHeight;
    const left = paddingLeft + charIndex * charWidth;
    
    setAutocompletePosition({ top, left });
  };
  
  // Get available parameters for autocomplete
  const getAutocompleteOptions = () => {
    const allParams: string[] = [];
    const query = autocompleteQuery.toLowerCase().trim();
    
    // Add user-defined parameters
    Object.keys(parameters).forEach(key => {
      const lowerKey = key.toLowerCase();
      // Show if query is empty or key starts with query
      if (!query || lowerKey.startsWith(query) || lowerKey.includes(query)) {
        if (!allParams.includes(key)) {
          allParams.push(key);
        }
      }
    });
    
    // Add default/common parameters
    const defaultParams = getDefaultParameters();
    defaultParams.forEach(param => {
      const key = param.key.toLowerCase();
      // Show if query is empty or key starts with query
      if (!query || key.startsWith(query) || key.includes(query)) {
        if (!allParams.includes(key)) {
          allParams.push(key);
        }
      }
    });
    
    // Sort alphabetically, prioritizing exact matches and starts-with matches
    return allParams.sort((a, b) => {
      const aLower = a.toLowerCase();
      const bLower = b.toLowerCase();
      
      // Exact match first
      if (aLower === query) return -1;
      if (bLower === query) return 1;
      
      // Starts with query next
      const aStarts = aLower.startsWith(query);
      const bStarts = bLower.startsWith(query);
      if (aStarts && !bStarts) return -1;
      if (!aStarts && bStarts) return 1;
      
      // Then alphabetical
      return aLower.localeCompare(bLower);
    });
  };
  
  // Insert parameter at cursor position
  const insertParameter = (paramKey: string) => {
    const textarea = bodyTextareaRef.current;
    if (!textarea) return;
    
    const cursorPos = textarea.selectionStart;
    const textBeforeCursor = formData.body.substring(0, cursorPos);
    const textAfterCursor = formData.body.substring(cursorPos);
    
    // Find the last open brace before cursor
    const lastOpenBrace = textBeforeCursor.lastIndexOf('{');
    const lastCloseBrace = textBeforeCursor.lastIndexOf('}');
    
    if (lastOpenBrace > lastCloseBrace) {
      // Replace from the brace to cursor with the parameter
      const newText = 
        textBeforeCursor.substring(0, lastOpenBrace) + 
        `{${paramKey}}` + 
        textAfterCursor;
      
      setFormData(prev => ({ ...prev, body: newText }));
      setAutocompleteVisible(false);
      autocompleteItemRefs.current = []; // Reset refs
      
      // Set cursor position after the inserted parameter
      setTimeout(() => {
        const newCursorPos = lastOpenBrace + paramKey.length + 2; // +2 for { and }
        textarea.setSelectionRange(newCursorPos, newCursorPos);
        textarea.focus();
      }, 0);
    }
  };
  
  // Handle keyboard events in body textarea
  const handleBodyKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (autocompleteVisible) {
      const options = getAutocompleteOptions();
      
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => {
          const newIndex = prev < options.length - 1 ? prev + 1 : 0;
          // Scroll to selected item
          setTimeout(() => {
            const item = autocompleteItemRefs.current[newIndex];
            if (item && autocompleteRef.current) {
              item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }, 0);
          return newIndex;
        });
        return;
      }
      
      if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedAutocompleteIndex(prev => {
          const newIndex = prev > 0 ? prev - 1 : options.length - 1;
          // Scroll to selected item
          setTimeout(() => {
            const item = autocompleteItemRefs.current[newIndex];
            if (item && autocompleteRef.current) {
              item.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
            }
          }, 0);
          return newIndex;
        });
        return;
      }
      
      if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        if (options[selectedAutocompleteIndex]) {
          insertParameter(options[selectedAutocompleteIndex]);
        }
        return;
      }
      
      if (e.key === 'Escape') {
        e.preventDefault();
        setAutocompleteVisible(false);
        autocompleteItemRefs.current = []; // Reset refs
        return;
      }
    }
  };

  // Handle tag input
  const handleTagInputKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addTag();
    }
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, tag]
      }));
      setTagInput('');
    }
  };


  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  // Validate form
  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    }

    if (!formData.body.trim()) {
      newErrors.body = 'Template body is required';
    }

    if (formData.title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    if (formData.body.length > 5000) {
      newErrors.body = 'Template body must be 5000 characters or less';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    if (isCreating) {
      onSave(formData);
    } else if (editingTemplate) {
      onUpdate(editingTemplate.id, formData);
    }

    onClose();
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
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={handleBackdropClick}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">
            {isCreating ? 'Create New Template' : 'Edit Template'}
          </h2>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
          <div className="space-y-6">
            {/* Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Title *
              </label>
              <input
                type="text"
                id="title"
                value={formData.title}
                onChange={(e) => handleFieldChange('title', e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.title ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter template title..."
                maxLength={100}
              />
              {errors.title && (
                <p className="mt-1 text-sm text-red-600">{errors.title}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.title.length}/100 characters
              </p>
            </div>


            {/* Body */}
            <div className="relative">
              <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-2">
                Template Body *
              </label>
              <textarea
                ref={bodyTextareaRef}
                id="body"
                value={formData.body}
                onChange={(e) => handleFieldChange('body', e.target.value)}
                onKeyDown={handleBodyKeyDown}
                onSelect={(e) => {
                  // Update autocomplete position when cursor moves
                  const textarea = e.currentTarget;
                  const cursorPos = textarea.selectionStart;
                  const textBeforeCursor = formData.body.substring(0, cursorPos);
                  const lastOpenBrace = textBeforeCursor.lastIndexOf('{');
                  const lastCloseBrace = textBeforeCursor.lastIndexOf('}');
                  
                  if (lastOpenBrace > lastCloseBrace) {
                    const query = textBeforeCursor.substring(lastOpenBrace + 1);
                    if (!query.includes('}')) {
                      updateAutocompletePosition(textarea, lastOpenBrace);
                      setAutocompleteQuery(query);
                      setAutocompleteVisible(true);
                    } else {
                      setAutocompleteVisible(false);
                    }
                  } else {
                    setAutocompleteVisible(false);
                  }
                }}
                rows={12}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                  errors.body ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter your template content... Type { to see available parameters."
                maxLength={5000}
              />
              {errors.body && (
                <p className="mt-1 text-sm text-red-600">{errors.body}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                {formData.body.length}/5000 characters
              </p>
              
              {/* Autocomplete Dropdown */}
              {autocompleteVisible && (
                <div
                  ref={autocompleteRef}
                  className="absolute z-50 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                  style={{
                    top: `${autocompletePosition.top}px`,
                    left: `${autocompletePosition.left}px`,
                    minWidth: '200px'
                  }}
                >
                  {getAutocompleteOptions().length > 0 ? (
                    getAutocompleteOptions().map((param, index) => {
                      // Initialize refs array if needed
                      if (!autocompleteItemRefs.current[index]) {
                        autocompleteItemRefs.current[index] = null;
                      }
                      
                      return (
                        <div
                          key={param}
                          ref={el => autocompleteItemRefs.current[index] = el}
                          onClick={() => insertParameter(param)}
                          className={`px-3 py-2 cursor-pointer hover:bg-blue-50 ${
                            index === selectedAutocompleteIndex ? 'bg-blue-100' : ''
                          }`}
                          onMouseEnter={() => setSelectedAutocompleteIndex(index)}
                        >
                          <div className="font-medium text-gray-900">{`{${param}}`}</div>
                          {parameters[param] && (
                            <div className="text-xs text-gray-500 truncate">
                              {parameters[param]}
                            </div>
                          )}
                        </div>
                      );
                    })
                  ) : (
                    <div className="px-3 py-2 text-sm text-gray-500">
                      No matching parameters
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tags */}
            <div>
              <label htmlFor="tags" className="block text-sm font-medium text-gray-700 mb-2">
                Tags
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {formData.tags.map(tag => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                onBlur={addTag}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Type a tag and press Enter or comma to add..."
              />
              <p className="mt-1 text-xs text-gray-500">
                Add tags to help organize and find your templates
              </p>
            </div>

            {/* Favorite Toggle */}
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isFavorite"
                checked={formData.isFavorite}
                onChange={(e) => handleFieldChange('isFavorite', e.target.checked)}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="isFavorite" className="ml-2 block text-sm text-gray-700">
                Add to favorites (appears in quickbar)
              </label>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="submit"
            onClick={handleSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            {isCreating ? 'Create Template' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  );
};
