/**
 * Template library page component
 * Displays templates in a grid with search, filtering, and management features
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Template } from '../types';
import { useTemplates } from '../hooks/useTemplates';
import { useProjects } from '../hooks/useProjects';
import { TemplateCard } from './TemplateCard';
import { TemplateEditor } from './TemplateEditor';
import { ParameterManager } from './ParameterManager';
import { ProjectSelector } from './ProjectSelector';
import { ProjectManager } from './ProjectManager';
import { ToastContainer, ToastType } from './Toast';
import { DeleteConfirmModal } from './DeleteConfirmModal';

export const TemplateLibrary: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'favorites' | 'recent'>('all');
  const [sortBy, setSortBy] = useState<'title' | 'created' | 'used' | 'copies'>('created');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [editorState, setEditorState] = useState({
    isOpen: false,
    editingTemplate: null as Template | null,
    isCreating: false
  });
  const [isParameterManagerOpen, setIsParameterManagerOpen] = useState(false);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: ToastType; duration?: number }>>([]);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; templateId: string | null; templateTitle: string | null; isDeleting: boolean }>({
    isOpen: false,
    templateId: null,
    templateTitle: null,
    isDeleting: false
  });

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const {
    projects,
    isLoading: projectsLoading,
    createProject,
    updateProject,
    deleteProject,
    reloadProjects
  } = useProjects();

  const {
    templates,
    isLoading,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    duplicateTemplate,
    copyTemplate,
    toggleFavorite,
    searchTemplates,
    reloadTemplates
  } = useTemplates();

  // Reload templates when project selection changes
  useEffect(() => {
    if (!isLoading) {
      reloadTemplates(selectedProjectId || undefined);
    }
  }, [selectedProjectId, isLoading, reloadTemplates]);

  // Filter and sort templates
  const filteredAndSortedTemplates = useMemo(() => {
    let filtered = templates;

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = searchTemplates(searchQuery);
    }

    // Apply category filter
    switch (filter) {
      case 'favorites':
        filtered = filtered.filter(t => t.isFavorite);
        break;
      case 'recent':
        filtered = filtered.filter(t => t.lastUsed).sort((a, b) => 
          new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime()
        );
        break;
    }

    // Apply sorting
    filtered.sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'title':
          comparison = a.title.localeCompare(b.title);
          break;
        case 'created':
          comparison = new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'used':
          const aLastUsed = a.lastUsed ? new Date(a.lastUsed).getTime() : 0;
          const bLastUsed = b.lastUsed ? new Date(b.lastUsed).getTime() : 0;
          comparison = aLastUsed - bLastUsed;
          break;
        case 'copies':
          comparison = a.copyCount - b.copyCount;
          break;
      }

      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return filtered;
  }, [templates, searchQuery, filter, sortBy, sortOrder, searchTemplates]);

  // Handle template actions
  const handleCreateTemplate = () => {
    setEditorState({
      isOpen: true,
      editingTemplate: null,
      isCreating: true
    });
  };

  const handleEditTemplate = (template: Template) => {
    setEditorState({
      isOpen: true,
      editingTemplate: template,
      isCreating: false
    });
  };

  const handleSaveTemplate = async (templateData: Omit<Template, 'id' | 'createdAt' | 'copyCount' | 'lastUsed'>) => {
    try {
      await createTemplate({
        ...templateData,
        projectId: selectedProjectId || null
      });
      showToast(editorState.isCreating ? 'Template created successfully!' : 'Template saved successfully!', 'success', 5000);
      handleCloseEditor();
    } catch (error) {
      console.error('Failed to save template:', error);
      showToast('Failed to save template. Please try again.', 'error');
    }
  };

  const handleUpdateTemplate = async (id: string, updates: Partial<Template>) => {
    try {
      await updateTemplate(id, updates);
      showToast('Template updated successfully!', 'success', 5000);
    } catch (error) {
      console.error('Failed to update template:', error);
      showToast('Failed to update template. Please try again.', 'error');
    }
  };

  const handleCloseEditor = () => {
    setEditorState({
      isOpen: false,
      editingTemplate: null,
      isCreating: false
    });
  };

  const handleDeleteTemplate = (templateId: string) => {
    const template = templates.find(t => t.id === templateId);
    if (template) {
      setDeleteConfirm({
        isOpen: true,
        templateId: template.id,
        templateTitle: template.title,
        isDeleting: false
      });
    }
  };

  const confirmDeleteTemplate = async () => {
    if (!deleteConfirm.templateId) return;

    setDeleteConfirm(prev => ({ ...prev, isDeleting: true }));

    try {
      await deleteTemplate(deleteConfirm.templateId);
      showToast('Template deleted successfully!', 'success', 5000);
      setDeleteConfirm({ isOpen: false, templateId: null, templateTitle: null, isDeleting: false });
    } catch (error) {
      console.error('Failed to delete template:', error);
      showToast('Failed to delete template. Please try again.', 'error');
      setDeleteConfirm(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const cancelDeleteTemplate = () => {
    setDeleteConfirm({ isOpen: false, templateId: null, templateTitle: null, isDeleting: false });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Template Library</h1>
        <p className="text-gray-600">
          Manage your outreach templates. Use <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Ctrl+K</kbd> or <kbd className="px-2 py-1 bg-gray-100 rounded text-sm">Cmd+K</kbd> to open the quickbar.
        </p>
      </div>

      {/* Controls */}
      <div className="mb-6 space-y-4">
        {/* Project Selector */}
        <div className="flex items-center justify-between">
          <ProjectSelector
            projects={projects}
            selectedProjectId={selectedProjectId}
            onSelectProject={setSelectedProjectId}
            onCreateProject={() => {
              setEditingProject(null);
              setIsProjectManagerOpen(true);
            }}
            isLoading={projectsLoading}
          />
        </div>

        {/* Search and Create */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="flex-1">
            <input
              type="text"
              placeholder="Search templates..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setIsParameterManagerOpen(true)}
              data-tutorial="parameters"
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors flex items-center gap-2"
              title="Manage template parameters (e.g., {name}, {company})"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Parameters
            </button>
            <button
              onClick={handleCreateTemplate}
              data-tutorial="templates"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Template
            </button>
          </div>
        </div>

        {/* Filters and Sort */}
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Filter */}
          <div className="flex gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'all' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({templates.length})
            </button>
            <button
              onClick={() => setFilter('favorites')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'favorites' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Favorites ({templates.filter(t => t.isFavorite).length})
            </button>
            <button
              onClick={() => setFilter('recent')}
              className={`px-3 py-1 rounded-lg text-sm transition-colors ${
                filter === 'recent' 
                  ? 'bg-blue-100 text-blue-700' 
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Recent ({templates.filter(t => t.lastUsed).length})
            </button>
          </div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Sort by:</label>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="created">Created Date</option>
              <option value="title">Title</option>
              <option value="used">Last Used</option>
              <option value="copies">Copy Count</option>
            </select>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="p-1 text-gray-500 hover:text-gray-700"
              title={`Sort ${sortOrder === 'asc' ? 'descending' : 'ascending'}`}
            >
              <svg className={`w-4 h-4 transition-transform ${sortOrder === 'desc' ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* Template Grid */}
      {filteredAndSortedTemplates.length === 0 ? (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            {searchQuery ? 'No templates found' : selectedProjectId ? 'No templates for this project' : 'No templates yet'}
          </h3>
          <p className="text-gray-600 mb-4">
            {searchQuery 
              ? 'Try adjusting your search terms' 
              : selectedProjectId
              ? 'Create a new template and it will be assigned to this project, or select "All Projects" to see all templates.'
              : 'Create your first template to get started'
            }
          </p>
          {!searchQuery && (
            <div className="flex flex-col items-center gap-3">
              <button
                onClick={handleCreateTemplate}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Create Template
              </button>
              {selectedProjectId && (
                <button
                  onClick={() => setSelectedProjectId(null)}
                  className="px-4 py-2 text-blue-600 hover:text-blue-700 text-sm"
                >
                  Show All Projects
                </button>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAndSortedTemplates.map(template => (
            <TemplateCard
              key={template.id}
              template={template}
              onCopy={copyTemplate}
              onToggleFavorite={toggleFavorite}
              onEdit={handleEditTemplate}
              onDuplicate={duplicateTemplate}
              onDelete={handleDeleteTemplate}
            />
          ))}
        </div>
      )}

      {/* Template Editor Modal */}
      <TemplateEditor
        isOpen={editorState.isOpen}
        onClose={handleCloseEditor}
        onSave={handleSaveTemplate}
        onUpdate={handleUpdateTemplate}
        editingTemplate={editorState.editingTemplate}
        isCreating={editorState.isCreating}
      />
      
      {/* Parameter Manager Modal */}
      <ParameterManager
        isOpen={isParameterManagerOpen}
        onClose={() => setIsParameterManagerOpen(false)}
      />

      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
      />

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Template"
        message="Are you sure you want to delete this template?"
        itemName={deleteConfirm.templateTitle || undefined}
        onConfirm={confirmDeleteTemplate}
        onCancel={cancelDeleteTemplate}
        confirmText="Delete Template"
        isDeleting={deleteConfirm.isDeleting}
      />

      {/* Project Manager Modal */}
      {isProjectManagerOpen && (
        <ProjectManager
          project={editingProject}
          onSave={async (projectData) => {
            try {
              if (editingProject) {
                await updateProject(editingProject.id, projectData);
              } else {
                await createProject(projectData);
              }
              setIsProjectManagerOpen(false);
              setEditingProject(null);
              // Reload projects to ensure the list is updated
              await reloadProjects();
            } catch (error) {
              console.error('Failed to save project:', error);
            }
          }}
          onCancel={() => {
            setIsProjectManagerOpen(false);
            setEditingProject(null);
          }}
        />
      )}
    </div>
  );
};

