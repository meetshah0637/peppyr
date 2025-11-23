/**
 * Parameter Manager Component
 * Allows users to set global parameter values for template placeholders
 */

import React, { useState, useEffect, useCallback } from 'react';
import { useParameters } from '../hooks/useParameters';
import { getDefaultParameters, extractParameters } from '../utils/templateParams';
import { useTemplates } from '../hooks/useTemplates';
import { ToastContainer, ToastType } from './Toast';

interface ParameterManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ParameterManager: React.FC<ParameterManagerProps> = ({ isOpen, onClose }) => {
  const { parameters, isLoading, updateParameters, reloadParameters } = useParameters();
  const { templates } = useTemplates();
  const [localParams, setLocalParams] = useState<Record<string, string>>({});
  const [newParamKey, setNewParamKey] = useState('');
  const [newParamValue, setNewParamValue] = useState('');
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: ToastType; duration?: number }>>([]);

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  // Get all parameters used in templates
  const usedParameters = React.useMemo(() => {
    const allParams = new Set<string>();
    templates.forEach(template => {
      const params = extractParameters(template.body);
      params.forEach(p => allParams.add(p));
    });
    return Array.from(allParams).sort();
  }, [templates]);

  // Get default parameters
  const defaultParams = getDefaultParameters();

  // Initialize local state when modal opens or parameters change
  useEffect(() => {
    if (isOpen) {
      setLocalParams({ ...parameters });
    }
  }, [isOpen, parameters]);

  const handleSave = async () => {
    try {
      // Filter out empty values and save all parameters
      const paramsToSave: Record<string, string> = {};
      for (const [key, value] of Object.entries(localParams)) {
        if (value && value.trim()) {
          paramsToSave[key] = value.trim();
        }
      }
      
      // Save parameters - this will update the state immediately
      await updateParameters(paramsToSave);
      
      // Force a reload to ensure all components have the latest parameters
      // This ensures the ref in useTemplates is updated
      await reloadParameters();
      
      // Show success toast with longer duration (same as template saves)
      showToast('Parameters saved successfully!', 'success', 5000);
      
      // Wait longer before closing to ensure user can see the toast
      // The toast will remain visible even after modal closes
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      onClose();
    } catch (error) {
      console.error('Failed to save parameters:', error);
      showToast('Failed to save parameters. Please try again.', 'error');
    }
  };

  const handleAddDefault = (key: string) => {
    const defaultParam = defaultParams.find(p => p.key === key);
    if (defaultParam && !localParams[key]) {
      setLocalParams({ ...localParams, [key]: '' });
    }
  };

  const handleAddCustom = () => {
    const trimmedKey = newParamKey.trim().toLowerCase();
    if (trimmedKey && !localParams[trimmedKey]) {
      setLocalParams({ ...localParams, [trimmedKey]: newParamValue.trim() });
      setNewParamKey('');
      setNewParamValue('');
    } else if (localParams[trimmedKey]) {
      alert(`Parameter "${trimmedKey}" already exists. Please use a different name.`);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-gray-900">Template Parameters</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-4 overflow-y-auto flex-1">
          <p className="text-sm text-gray-600 mb-4">
            Set values for template placeholders (e.g., {'{name}'}, {'{company}'}). 
            These values will automatically replace placeholders in all your templates when you copy them.
          </p>

          {isLoading ? (
            <div className="text-center py-8 text-gray-500">Loading parameters...</div>
          ) : (
            <>
              {/* Used Parameters */}
              {usedParameters.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">
                    Parameters Used in Templates
                  </h3>
                  <div className="space-y-3">
                    {usedParameters.map(key => {
                      const defaultParam = defaultParams.find(p => p.key === key);
                      return (
                        <div key={key} className="flex items-center gap-3">
                          <label className="flex-1">
                            <span className="block text-sm font-medium text-gray-700 mb-1">
                              {defaultParam?.label || key}
                              <span className="ml-2 text-xs text-gray-500 font-mono">{'{' + key + '}'}</span>
                            </span>
                            <input
                              type="text"
                              value={localParams[key] || ''}
                              onChange={(e) => setLocalParams({ ...localParams, [key]: e.target.value })}
                              placeholder={defaultParam?.placeholder || `Enter value for ${key}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </label>
                          {localParams[key] && (
                            <button
                              onClick={() => setLocalParams({ ...localParams, [key]: '' })}
                              className="text-red-500 hover:text-red-700"
                              title="Clear"
                            >
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Default Parameters */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Common Parameters</h3>
                <div className="grid grid-cols-2 gap-3">
                  {defaultParams.map(param => {
                    if (usedParameters.includes(param.key)) return null;
                    return (
                      <div key={param.key} className="flex items-center gap-2">
                        <label className="flex-1">
                          <span className="block text-sm font-medium text-gray-700 mb-1">
                            {param.label}
                            <span className="ml-2 text-xs text-gray-500 font-mono">{'{' + param.key + '}'}</span>
                          </span>
                          <input
                            type="text"
                            value={localParams[param.key] || ''}
                            onChange={(e) => setLocalParams({ ...localParams, [param.key]: e.target.value })}
                            placeholder={param.placeholder}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                          />
                        </label>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Custom Parameters List */}
              {Object.keys(localParams).filter(key => {
                const defaultKeys = defaultParams.map(p => p.key);
                const usedKeys = usedParameters;
                return !defaultKeys.includes(key) && !usedKeys.includes(key);
              }).length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3">Custom Parameters</h3>
                  <div className="space-y-3">
                    {Object.keys(localParams)
                      .filter(key => {
                        const defaultKeys = defaultParams.map(p => p.key);
                        const usedKeys = usedParameters;
                        return !defaultKeys.includes(key) && !usedKeys.includes(key);
                      })
                      .map(key => (
                        <div key={key} className="flex items-center gap-3">
                          <label className="flex-1">
                            <span className="block text-sm font-medium text-gray-700 mb-1">
                              {key}
                              <span className="ml-2 text-xs text-gray-500 font-mono">{'{' + key + '}'}</span>
                            </span>
                            <input
                              type="text"
                              value={localParams[key] || ''}
                              onChange={(e) => setLocalParams({ ...localParams, [key]: e.target.value })}
                              placeholder={`Enter value for ${key}`}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                          </label>
                          <button
                            onClick={() => {
                              const updated = { ...localParams };
                              delete updated[key];
                              setLocalParams(updated);
                            }}
                            className="text-red-500 hover:text-red-700"
                            title="Remove"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Add Custom Parameter */}
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Custom Parameter</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={newParamKey}
                    onChange={(e) => setNewParamKey(e.target.value.toLowerCase().replace(/[^a-z0-9_]/g, ''))}
                    placeholder="Parameter key (e.g., 'product')"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCustom();
                      }
                    }}
                  />
                  <input
                    type="text"
                    value={newParamValue}
                    onChange={(e) => setNewParamValue(e.target.value)}
                    placeholder="Default value (optional)"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        handleAddCustom();
                      }
                    }}
                  />
                  <button
                    onClick={handleAddCustom}
                    disabled={!newParamKey.trim()}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    title={newParamKey.trim() && localParams[newParamKey.trim().toLowerCase()] ? 'Parameter already exists' : 'Add parameter'}
                  >
                    Add
                  </button>
                </div>
                {newParamKey.trim() && localParams[newParamKey.trim().toLowerCase()] && (
                  <p className="text-xs text-red-600 mt-1">Parameter "{newParamKey.trim().toLowerCase()}" already exists</p>
                )}
              </div>
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Save Parameters
          </button>
        </div>
      </div>
      
      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
      />
    </div>
  );
};

