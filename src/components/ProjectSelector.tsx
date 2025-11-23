/**
 * Project Selector Component
 * Allows users to select a project/client to filter templates and contacts
 */

import React, { useState, useRef, useEffect } from 'react';
import { Project } from '../types';

interface ProjectSelectorProps {
  projects: Project[];
  selectedProjectId: string | null;
  onSelectProject: (projectId: string | null) => void;
  onCreateProject: () => void;
  isLoading?: boolean;
}

export const ProjectSelector: React.FC<ProjectSelectorProps> = ({
  projects,
  selectedProjectId,
  onSelectProject,
  onCreateProject,
  isLoading = false
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const selectedProject = selectedProjectId ? projects.find(p => p.id === selectedProjectId) : null;
  const selectedProjectColor = selectedProject?.color || null;

  const handleSelect = (projectId: string | null) => {
    onSelectProject(projectId);
    setIsOpen(false);
  };

  return (
    <div className="flex items-center gap-3">
      <label className="text-sm font-medium text-gray-700 whitespace-nowrap">
        Project:
      </label>
      <div className="relative" ref={dropdownRef}>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          disabled={isLoading}
          className="px-3 py-2 pl-10 pr-8 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm min-w-[200px] disabled:opacity-50 disabled:cursor-not-allowed bg-white text-left flex items-center justify-between"
        >
          <div className="flex items-center gap-2 flex-1 min-w-0">
            {selectedProjectColor && (
              <div
                className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                style={{ backgroundColor: selectedProjectColor }}
              />
            )}
            <span className="truncate">
              {selectedProject ? selectedProject.name : 'All Projects'}
              {selectedProject && selectedProject.templateCount !== undefined && (
                <span className="text-gray-500"> ({selectedProject.templateCount} templates, {selectedProject.contactCount} contacts)</span>
              )}
            </span>
          </div>
          <svg 
            className={`w-4 h-4 text-gray-500 transition-transform flex-shrink-0 ${isOpen ? 'transform rotate-180' : ''}`}
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Dropdown Menu */}
        {isOpen && (
          <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto">
            <button
              type="button"
              onClick={() => handleSelect(null)}
              className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                !selectedProjectId ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
              }`}
            >
              <span>All Projects</span>
            </button>
            {projects.map(project => (
              <button
                key={project.id}
                type="button"
                onClick={() => handleSelect(project.id)}
                className={`w-full px-3 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2 ${
                  selectedProjectId === project.id ? 'bg-blue-50 text-blue-700' : 'text-gray-900'
                }`}
              >
                {project.color && (
                  <div
                    className="w-3 h-3 rounded-full border border-white shadow-sm flex-shrink-0"
                    style={{ backgroundColor: project.color }}
                  />
                )}
                <span className="flex-1">
                  {project.name}
                  {project.templateCount !== undefined && (
                    <span className="text-gray-500"> ({project.templateCount} templates, {project.contactCount} contacts)</span>
                  )}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>
      <button
        onClick={onCreateProject}
        disabled={isLoading}
        data-tutorial="projects"
        className="px-3 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        title="Create new project"
      >
        + New Project
      </button>
    </div>
  );
};

