/**
 * Contact list page component
 * Appointment setter contact management with CSV list management
 * - Upload multiple CSV files as separate lists
 * - View contacts in a clean, scrollable table
 * - Inline editing with save/close functionality
 */

import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Contact, ContactStatus, ContactList as ContactListType } from '../types';
import { useContacts } from '../hooks/useContacts';
import { useContactLists } from '../hooks/useContactLists';
import { useTemplates } from '../hooks/useTemplates';
import { CSVUploadModal } from './CSVUploadModal';
import { CreateListModal } from './CreateListModal';
import { DeleteConfirmModal } from './DeleteConfirmModal';
import { ToastContainer, ToastType } from './Toast';

type ViewMode = 'lists' | 'table';

export const ContactList: React.FC = () => {
  const [viewMode, setViewMode] = useState<ViewMode>('lists');
  const [selectedListId, setSelectedListId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<ContactStatus | 'all'>('all');
  const [csvUploadOpen, setCsvUploadOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<{ isOpen: boolean; listId: string | null; listName: string | null; isDeleting: boolean }>({
    isOpen: false,
    listId: null,
    listName: null,
    isDeleting: false
  });
  const [deleteContactConfirm, setDeleteContactConfirm] = useState<{ isOpen: boolean; contactId: string | null; contactName: string | null; isDeleting: boolean }>({
    isOpen: false,
    contactId: null,
    contactName: null,
    isDeleting: false
  });
  const [editingRows, setEditingRows] = useState<Set<string>>(new Set());
  const [editedContacts, setEditedContacts] = useState<Map<string, Partial<Contact>>>(new Map());
  const [newContacts, setNewContacts] = useState<Partial<Contact>[]>([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [createListModalOpen, setCreateListModalOpen] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: string; message: string; type?: ToastType; duration?: number }>>([]);

  const {
    lists,
    isLoading: listsLoading,
    createList,
    deleteList,
    reloadLists
  } = useContactLists();

  const {
    contacts,
    isLoading: contactsLoading,
    createContact,
    updateContact,
    deleteContact,
    reloadContacts
  } = useContacts();
  
  const { templates } = useTemplates();

  // Load contacts when a list is selected - memoize to prevent unnecessary reloads
  const loadContactsForList = useCallback(async (listId: string) => {
    if (listId) {
      // Validate list exists before loading contacts
      const listExists = lists.find(l => l.id === listId);
      if (!listExists) {
        setSelectedListId(null);
        setViewMode('lists');
        return;
      }
      // Reload contacts with the specific listId - this will replace all contacts in state
      await reloadContacts({ listId });
    }
  }, [reloadContacts, lists]);

  // Clear contacts when component mounts or when switching to lists view
  useEffect(() => {
    if (viewMode === 'lists' && contacts.length > 0) {
      // Clear contacts when in lists view to prevent showing old data
      // Only clear if there are contacts to avoid unnecessary API calls
      reloadContacts({ listId: undefined }).catch(() => {
        // Silently fail - we're just clearing the state
      });
    }
    if (viewMode === 'lists') {
      setSelectedListId(null);
    }
  }, [viewMode, reloadContacts, contacts.length]);

  // Load contacts only when a list is selected
  useEffect(() => {
    if (selectedListId && viewMode === 'table') {
      loadContactsForList(selectedListId);
    }
  }, [selectedListId, viewMode, loadContactsForList]);

  // Filter contacts - optimized with early returns
  const filteredContacts = useMemo(() => {
    if (contacts.length === 0) return [];

    let filtered = contacts;

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(c => c.status === statusFilter);
      if (filtered.length === 0) return [];
    }

    // Apply search filter
    const trimmedQuery = searchQuery.trim();
    if (trimmedQuery) {
      const query = trimmedQuery.toLowerCase();
      filtered = filtered.filter(c => {
        const fullName = `${c.firstName || ''} ${c.lastName || ''}`.trim().toLowerCase();
        return fullName.includes(query) ||
          (c.company && c.company.toLowerCase().includes(query)) ||
          (c.email && c.email.toLowerCase().includes(query));
      });
    }

    // Sort by updatedAt (descending)
    return filtered.sort((a, b) => {
      const aTime = new Date(a.updatedAt || 0).getTime();
      const bTime = new Date(b.updatedAt || 0).getTime();
      return bTime - aTime;
    });
  }, [contacts, statusFilter, searchQuery]);

  const selectedList = useMemo(() => {
    if (!selectedListId) return null;
    const list = lists.find(l => l.id === selectedListId);
    return list || null;
  }, [lists, selectedListId]);

  // Clear selectedListId if the list no longer exists
  useEffect(() => {
    if (selectedListId && !lists.find(l => l.id === selectedListId)) {
      setSelectedListId(null);
      if (viewMode === 'table') {
        setViewMode('lists');
      }
      // Clear all related state
      setEditedContacts(new Map());
      setNewContacts([]);
      setEditingRows(new Set());
      setHasUnsavedChanges(false);
    }
  }, [lists, selectedListId, viewMode]);

  // Handle CSV import
  const handleCSVImport = async (mappedContacts: any[], fileName?: string) => {
    try {
      // Format date as dd/mm/yyyy
      const now = new Date();
      const day = String(now.getDate()).padStart(2, '0');
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const year = now.getFullYear();
      const dateSuffix = `${day}/${month}/${year}`;
      
      // Check for duplicate CSV name or list name
      const baseListName = fileName 
        ? fileName.replace(/\.csv$/i, '').trim()
        : `CSV Import`;
      const listName = `${baseListName}_${dateSuffix}`;
      
      // Check for duplicate list name (case-insensitive)
      const existingList = lists.find(l => 
        l.name.toLowerCase().trim() === listName.toLowerCase()
      );
      
      if (existingList) {
        throw new Error(`A list with the name "${listName}" already exists. Please use a different file name or delete the existing list first.`);
      }

      // Also check for duplicate CSV filename if provided
      if (fileName) {
        const baseFileName = fileName.replace(/\.csv$/i, '').trim();
        const existingCSVList = lists.find(l => 
          l.csvFileName && l.csvFileName.replace(/\.csv$/i, '').trim().toLowerCase() === baseFileName.toLowerCase()
        );
        
        if (existingCSVList) {
          throw new Error(`A CSV file with the name "${fileName}" has already been imported. Please use a different file name or delete the existing list first.`);
        }
      }

      // Create a new list for this CSV import
      const newList = await createList({
        name: listName,
        description: `Imported ${mappedContacts.length} contacts`,
        source: 'csv_import',
        csvFileName: fileName || null,
        projectId: null
      });

      // Import contacts with the new list ID
      const contactPromises: Promise<any>[] = [];
      
      for (const csvContact of mappedContacts) {
        // Skip completely empty contacts (no data at all)
        if (!csvContact.email && !csvContact.firstName && !csvContact.lastName && !csvContact.company) {
          continue;
        }

        const contactData = {
          firstName: csvContact.firstName || '',
          lastName: csvContact.lastName || '',
          email: csvContact.email || null,
          phone: null,
          company: csvContact.company || null,
          title: null,
          linkedinUrl: null,
          status: csvContact.status || 'pending',
          listId: newList.id,
          projectId: null,
          templateId: null,
          templateTitle: null,
          tags: [],
          notes: ''
        };

        // Find template if templateTitle provided
        if (csvContact.templateTitle) {
          const template = templates.find(t => 
            t.title.toLowerCase() === csvContact.templateTitle.toLowerCase()
          );
          if (template) {
            contactData.templateId = template.id;
            contactData.templateTitle = template.title;
          }
        }

        contactPromises.push(createContact(contactData).catch(err => {
          console.error('Failed to create contact:', err);
          return null;
        }));
      }

      await Promise.all(contactPromises);
      
      // Wait for database to sync
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // Reload lists multiple times to ensure they appear
      let reloadedLists = await reloadLists();
      await new Promise(resolve => setTimeout(resolve, 1000));
      reloadedLists = await reloadLists();
      
      setCsvUploadOpen(false);
      showToast(`Successfully imported ${contactPromises.length} contact(s)!`, 'success');
    } catch (error) {
      console.error('CSV import failed:', error);
      throw error;
    }
  };

  const showToast = useCallback((message: string, type: ToastType = 'info', duration = 3000) => {
    const id = `toast-${Date.now()}-${Math.random()}`;
    setToasts(prev => [...prev, { id, message, type, duration }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, duration);
  }, []);

  const handleCreateNewList = async (listName: string) => {
    try {
      const newList = await createList({
        name: listName,
        description: null,
        source: 'manual',
        csvFileName: null,
        projectId: null
      });
      await reloadLists();
      // Open the new list in table view
      setSelectedListId(newList.id);
      setViewMode('table');
      showToast('List created successfully!', 'success');
    } catch (error: any) {
      console.error('Failed to create list:', error);
      throw error; // Let the modal handle the error
    }
  };

  const handleDeleteList = useCallback((listId: string, listName: string) => {
    setDeleteConfirm({
      isOpen: true,
      listId,
      listName,
      isDeleting: false
    });
  }, []);

  const confirmDeleteList = async () => {
    const listId = deleteConfirm.listId;
    const listName = deleteConfirm.listName;
    
    if (!listId || !listName) {
      showToast('Error: Missing list information. Please try again.', 'error');
      setDeleteConfirm({ isOpen: false, listId: null, listName: null, isDeleting: false });
      return;
    }

    setDeleteConfirm(prev => ({ ...prev, isDeleting: true }));

    try {
      // Optimistically clear UI state immediately to prevent flash of deleted data
      if (selectedListId === listId) {
        setViewMode('lists');
        setSelectedListId(null);
        setEditedContacts(new Map());
        setNewContacts([]);
        setEditingRows(new Set());
        setHasUnsavedChanges(false);
      }
      
      // Delete from backend
      await deleteList(listId);
      
      // Reload lists to get fresh data
      await reloadLists();
      
      showToast(`"${listName}" has been deleted successfully.`, 'success');
      setDeleteConfirm({ isOpen: false, listId: null, listName: null, isDeleting: false });
    } catch (error: any) {
      const errorMessage = error?.message || 'Failed to delete list. Please try again.';
      showToast(errorMessage, 'error');
      setDeleteConfirm(prev => ({ ...prev, isDeleting: false }));
      // Reload lists to restore state if deletion failed
      await reloadLists();
    }
  };

  const cancelDeleteList = () => {
    setDeleteConfirm({ isOpen: false, listId: null, listName: null, isDeleting: false });
  };

  const handleSelectList = useCallback((listId: string) => {
    // Validate that the list still exists
    const listExists = lists.find(l => l.id === listId);
    if (!listExists) {
      showToast('This list no longer exists. Please refresh the page.', 'error');
      setSelectedListId(null);
      setViewMode('lists');
      return;
    }

    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Do you want to discard them and open this list?')) {
        return;
      }
      setHasUnsavedChanges(false);
      setEditedContacts(new Map());
      setNewContacts([]);
      setEditingRows(new Set());
    }
    
    // Clear editing state immediately
    setEditedContacts(new Map());
    setNewContacts([]);
    setEditingRows(new Set());
    setHasUnsavedChanges(false);
    setSearchQuery('');
    setStatusFilter('all');
    
    // Set new list and view mode - this will trigger useEffect to load contacts
    setSelectedListId(listId);
    setViewMode('table');
  }, [hasUnsavedChanges, lists, showToast]);

  const handleCloseTable = useCallback(() => {
    if (hasUnsavedChanges) {
      if (!window.confirm('You have unsaved changes. Do you want to discard them and close this list?')) {
        return;
      }
    }
    // Clear all state when closing table view
    setSelectedListId(null);
    setViewMode('lists');
    setHasUnsavedChanges(false);
    setEditedContacts(new Map());
    setNewContacts([]);
    setEditingRows(new Set());
    setSearchQuery('');
    setStatusFilter('all');
    // Clear contacts to prevent showing old data
    reloadContacts({ listId: undefined }).catch(() => {
      // Silently fail - we're just clearing the state
    });
  }, [hasUnsavedChanges, reloadContacts]);

  const handleEditContact = useCallback((contactId: string, field: keyof Contact, value: any) => {
    setEditingRows(prev => {
      const newSet = new Set(prev);
      newSet.add(contactId);
      return newSet;
    });
    setEditedContacts(prev => {
      const newMap = new Map(prev);
      const existing = newMap.get(contactId) || {};
      newMap.set(contactId, { ...existing, [field]: value });
      return newMap;
    });
    setHasUnsavedChanges(true);
  }, []);

  const handleEditNewContact = useCallback((index: number, field: keyof Contact, value: any) => {
    setNewContacts(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
    setHasUnsavedChanges(true);
  }, []);

  const handleAddNewRow = () => {
    if (!selectedListId) {
      showToast('Please select a contact list first.', 'error');
      return;
    }

    const newContact: Partial<Contact> = {
      firstName: '',
      lastName: '',
      email: '',
      company: '',
      status: 'pending',
      listId: selectedListId || null,
      projectId: null,
      templateId: null,
      templateTitle: null
    };
    setNewContacts(prev => [...prev, newContact]);
    setHasUnsavedChanges(true);
  };

  const handleDeleteNewRow = (index: number) => {
    setNewContacts(prev => prev.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const handleSave = async () => {
    try {
      // Save edited contacts
      for (const [contactId, updates] of editedContacts.entries()) {
        const contact = contacts.find(c => c.id === contactId);
        if (contact) {
          await updateContact(contactId, updates, selectedListId || undefined);
        }
      }

      // Save new contacts
      for (const newContact of newContacts) {
        // Only save if at least one field is filled
        if (newContact.firstName || newContact.lastName || newContact.email || newContact.company) {
          try {
            await createContact({
              firstName: newContact.firstName || '',
              lastName: newContact.lastName || '',
              email: newContact.email || null,
              phone: null,
              company: newContact.company || null,
              title: null,
              projectId: null,
              linkedinUrl: null,
              status: (newContact.status as ContactStatus) || 'pending',
              listId: selectedListId || null,
              templateId: newContact.templateId || null,
              templateTitle: newContact.templateTitle || null,
              tags: [],
              notes: ''
            });
          } catch (error) {
            console.error('Failed to create new contact:', error);
            throw error;
          }
        }
      }

      // Reload contacts
      await reloadContacts({ listId: selectedListId || undefined });
      await reloadLists();

      // Clear editing state
      setEditedContacts(new Map());
      setNewContacts([]);
      setEditingRows(new Set());
      setHasUnsavedChanges(false);

      showToast('Changes saved successfully!', 'success');
    } catch (error) {
      console.error('Failed to save changes:', error);
      showToast('Failed to save changes. Please try again.', 'error');
    }
  };

  const handleDeleteContact = async (contactId: string) => {
    const contact = contacts.find(c => c.id === contactId);
    const contactName = contact 
      ? `${contact.firstName || ''} ${contact.lastName || ''}`.trim() || contact.email || 'this contact'
      : 'this contact';
    
    setDeleteContactConfirm({
      isOpen: true,
      contactId,
      contactName,
      isDeleting: false
    });
  };

  const confirmDeleteContact = async () => {
    if (!deleteContactConfirm.contactId) return;

    setDeleteContactConfirm(prev => ({ ...prev, isDeleting: true }));

    try {
      await deleteContact(deleteContactConfirm.contactId);
      await reloadContacts({ listId: selectedListId || undefined });
      await reloadLists();
      showToast('Contact deleted successfully.', 'success');
      setDeleteContactConfirm({ isOpen: false, contactId: null, contactName: null, isDeleting: false });
    } catch (error) {
      console.error('Failed to delete contact:', error);
      showToast('Failed to delete contact. Please try again.', 'error');
      setDeleteContactConfirm(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const cancelDeleteContact = () => {
    setDeleteContactConfirm({ isOpen: false, contactId: null, contactName: null, isDeleting: false });
  };

  // Lists View
  if (viewMode === 'lists') {
    // Separate CSV lists from manual lists
    const csvLists = lists.filter(l => l.source === 'csv_import').sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    const manualLists = lists.filter(l => l.source === 'manual').sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );

    return (
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Contact Lists</h1>
          <p className="text-gray-600">
            Manage your lead lists. Upload CSV files or create lists manually.
          </p>
        </div>

        {/* Action Buttons - Always visible at top */}
        <div className="mb-6 flex gap-4 items-center">
          <button
            onClick={() => setCsvUploadOpen(true)}
            className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
          >
            📄 Upload CSV
          </button>
          <button
            onClick={() => setCreateListModalOpen(true)}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            + Create New List
          </button>
        </div>

        {/* Uploaded CSV Files Section */}
        {(csvLists.length > 0 || manualLists.length > 0) && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Uploaded CSV Files {csvLists.length > 0 && `(${csvLists.length})`}
            </h2>
            {csvLists.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {csvLists.map(list => (
                  <div
                    key={list.id}
                    className="relative p-6 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                    onClick={() => handleSelectList(list.id)}
                  >
                    <div className="w-full text-left">
                      <div className="font-semibold text-gray-900 mb-2 truncate pr-8" title={list.name}>
                        {list.name}
                      </div>
                      <div className="text-sm text-gray-600 mb-1">
                        {list.contactCount || 0} contacts
                      </div>
                      {list.csvFileName && (
                        <div className="text-xs text-gray-500 truncate" title={list.csvFileName}>
                          📄 {list.csvFileName}
                        </div>
                      )}
                      {list.description && (
                        <div className="text-xs text-gray-500 mt-1 truncate">
                          {list.description}
                        </div>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        e.preventDefault();
                        handleDeleteList(list.id, list.name);
                      }}
                      onMouseDown={(e) => {
                        e.stopPropagation();
                      }}
                      className="absolute top-2 right-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors z-10"
                      title="Delete list"
                      type="button"
                    >
                      🗑️
                    </button>
                  </div>
                ))}
              </div>
            ) : null}
          </div>
        )}

        {/* Manual Lists Section */}
        {manualLists.length > 0 && (
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Manual Lists</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {manualLists.map(list => (
                <div
                  key={list.id}
                  className="relative p-6 rounded-lg border-2 border-gray-200 bg-white hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                  onClick={(e) => {
                    // Don't open list if clicking on delete button
                    const target = e.target as HTMLElement;
                    if (target.closest('button[title="Delete list"]')) {
                      return;
                    }
                    handleSelectList(list.id);
                  }}
                >
                  <div className="w-full text-left">
                    <div className="font-semibold text-gray-900 mb-2 truncate pr-8" title={list.name}>
                      {list.name}
                    </div>
                    <div className="text-sm text-gray-600 mb-1">
                      {list.contactCount || 0} contacts
                    </div>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      e.preventDefault();
                      handleDeleteList(list.id, list.name);
                    }}
                    className="absolute top-2 right-2 p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors z-10 pointer-events-auto"
                    title="Delete list"
                    type="button"
                  >
                    🗑️
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {listsLoading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : lists.length === 0 && (
          <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
            <p className="text-gray-500 text-lg mb-4">No lists yet. Upload a CSV file or create a list to get started.</p>
          </div>
        )}

        {/* CSV Upload Modal */}
        <CSVUploadModal
          isOpen={csvUploadOpen}
          onClose={() => setCsvUploadOpen(false)}
          onImport={handleCSVImport}
          existingContacts={[]}
          templates={templates}
        />

        {/* Create List Modal */}
        <CreateListModal
          isOpen={createListModalOpen}
          onClose={() => setCreateListModalOpen(false)}
          onCreate={handleCreateNewList}
          existingListNames={lists.map(l => l.name)}
        />

        {/* Toast Notifications */}
        <ToastContainer
          toasts={toasts}
          onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
        />

        {/* Delete Confirm Modal - Available in lists view */}
        <DeleteConfirmModal
          isOpen={deleteConfirm.isOpen}
          title="Delete Contact List"
          message="Are you sure you want to delete this contact list? This will also delete all contacts in this list."
          itemName={deleteConfirm.listName || undefined}
          onConfirm={confirmDeleteList}
          onCancel={cancelDeleteList}
          confirmText="Delete List"
          cancelText="Cancel"
          isDeleting={deleteConfirm.isDeleting}
        />
      </div>
    );
  }

  // Table View
  const isLoading = contactsLoading;
  // Create a map to track new contact indices properly
  const newContactStartIndex = filteredContacts.length;
  const allContacts = [
    ...filteredContacts, 
    ...newContacts.map((nc, idx) => ({ ...nc, id: `new_${idx}`, _newIndex: idx } as Contact & { _newIndex: number }))
  ];

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Header with Close Button */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <button
              onClick={handleCloseTable}
              className="text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Close and return to lists"
            >
              ✕
            </button>
            <h1 className="text-3xl font-bold text-gray-900">{selectedList?.name || 'Contacts'}</h1>
          </div>
          {selectedList && (
            <p className="text-gray-600 text-sm">
              {selectedList.contactCount || 0} contacts
              {selectedList.csvFileName && ` • from ${selectedList.csvFileName}`}
            </p>
          )}
        </div>
        <div className="flex gap-2">
          {hasUnsavedChanges && (
            <span className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-lg text-sm font-medium">
              Unsaved changes
            </span>
          )}
          <button
            onClick={handleSave}
            disabled={!hasUnsavedChanges}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Save
          </button>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="mb-4 flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <input
            type="text"
            placeholder="Search contacts by name, company, email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as ContactStatus | 'all')}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="not_contacted">Not Contacted</option>
          <option value="contacted">Contacted</option>
          <option value="replied">Replied</option>
          <option value="meeting_scheduled">Meeting Scheduled</option>
          <option value="no_response">No Response</option>
        </select>
        <button
          onClick={handleAddNewRow}
          className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
        >
          + Add Contact
        </button>
      </div>

      {/* Contacts Table */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : allContacts.length === 0 ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <p className="text-gray-500 text-lg mb-4">
            {searchQuery || statusFilter !== 'all'
              ? 'No contacts match your filters'
              : 'No contacts in this list yet'}
          </p>
          {!searchQuery && statusFilter === 'all' && (
            <button
              onClick={handleAddNewRow}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
            >
              Add Your First Contact
            </button>
          )}
        </div>
      ) : (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm">
          <div className="overflow-y-auto max-h-[calc(100vh-350px)]">
            <table className="w-full">
              <thead className="bg-gray-50 sticky top-0 z-10">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    First Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Last Name
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Email
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Company
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    LinkedIn
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Status
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Message Template
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider bg-gray-50">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allContacts.map((contact, index) => {
                  const isNew = contact.id?.startsWith('new_');
                  const newContactIndex = isNew ? (contact as any)._newIndex : -1;
                  const isEditing = editingRows.has(contact.id || '');
                  const edits = editedContacts.get(contact.id || '') || {};
                  const displayContact = { ...contact, ...edits };

                  return (
                    <tr key={contact.id || `new_${index}`} className="hover:bg-gray-50">
                      <td className="px-4 py-3">
                        {isEditing || isNew ? (
                          <input
                            type="text"
                            value={isNew ? (newContacts[newContactIndex]?.firstName || '') : (displayContact.firstName || '')}
                            onChange={(e) => isNew ? handleEditNewContact(newContactIndex, 'firstName', e.target.value) : handleEditContact(contact.id || '', 'firstName', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="First Name"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">{contact.firstName || '-'}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing || isNew ? (
                          <input
                            type="text"
                            value={isNew ? (newContacts[newContactIndex]?.lastName || '') : (displayContact.lastName || '')}
                            onChange={(e) => isNew ? handleEditNewContact(newContactIndex, 'lastName', e.target.value) : handleEditContact(contact.id || '', 'lastName', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Last Name"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">{contact.lastName || '-'}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing || isNew ? (
                          <input
                            type="email"
                            value={isNew ? (newContacts[newContactIndex]?.email || '') : (displayContact.email || '')}
                            onChange={(e) => isNew ? handleEditNewContact(newContactIndex, 'email', e.target.value) : handleEditContact(contact.id || '', 'email', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Email"
                          />
                        ) : (
                          <div className="text-sm text-gray-500">{contact.email || '-'}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing || isNew ? (
                          <input
                            type="text"
                            value={isNew ? (newContacts[newContactIndex]?.company || '') : (displayContact.company || '')}
                            onChange={(e) => isNew ? handleEditNewContact(newContactIndex, 'company', e.target.value) : handleEditContact(contact.id || '', 'company', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Company"
                          />
                        ) : (
                          <div className="text-sm text-gray-900">{contact.company || '-'}</div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing || isNew ? (
                          <input
                            type="url"
                            value={isNew ? (newContacts[newContactIndex]?.linkedinUrl || '') : (displayContact.linkedinUrl || '')}
                            onChange={(e) => isNew ? handleEditNewContact(newContactIndex, 'linkedinUrl', e.target.value) : handleEditContact(contact.id || '', 'linkedinUrl', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                            placeholder="https://linkedin.com/in/..."
                          />
                        ) : (
                          <div className="text-sm">
                            {contact.linkedinUrl ? (
                              <a
                                href={contact.linkedinUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-600 hover:text-blue-800 hover:underline flex items-center gap-1"
                              >
                                <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                                View Profile
                              </a>
                            ) : (
                              <span className="text-gray-500">-</span>
                            )}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing || isNew ? (
                          <select
                            value={isNew ? (newContacts[newContactIndex]?.status || 'pending') : (displayContact.status || 'pending')}
                            onChange={(e) => isNew ? handleEditNewContact(newContactIndex, 'status', e.target.value) : handleEditContact(contact.id || '', 'status', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          >
                            <option value="pending">Pending</option>
                            <option value="not_contacted">Not Contacted</option>
                            <option value="contacted">Contacted</option>
                            <option value="replied">Replied</option>
                            <option value="no_response">No Response</option>
                            <option value="meeting_scheduled">Meeting Scheduled</option>
                          </select>
                        ) : (
                          <button
                            onClick={() => setEditingRows(prev => new Set(prev).add(contact.id || ''))}
                            className={`px-3 py-1 rounded-lg text-sm font-medium ${
                              contact.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                              contact.status === 'not_contacted' ? 'bg-gray-100 text-gray-700' :
                              contact.status === 'contacted' ? 'bg-blue-100 text-blue-700' :
                              contact.status === 'replied' ? 'bg-green-100 text-green-700' :
                              contact.status === 'no_response' ? 'bg-red-100 text-red-700' :
                              'bg-purple-100 text-purple-700'
                            }`}
                          >
                            {contact.status?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Pending'}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {isEditing || isNew ? (
                          <select
                            value={isNew ? (newContacts[newContactIndex]?.templateId || '') : (displayContact.templateId || '')}
                            onChange={(e) => {
                              const template = templates.find(t => t.id === e.target.value);
                              if (isNew) {
                                handleEditNewContact(newContactIndex, 'templateId', e.target.value || null);
                                handleEditNewContact(newContactIndex, 'templateTitle', template?.title || null);
                              } else {
                                handleEditContact(contact.id || '', 'templateId', e.target.value || null);
                                handleEditContact(contact.id || '', 'templateTitle', template?.title || null);
                              }
                            }}
                            className="w-full px-2 py-1 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm"
                          >
                            <option value="">No Message</option>
                            {templates.map(template => (
                              <option key={template.id} value={template.id}>
                                {template.title}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <div className="text-sm text-gray-600">
                            {contact.templateTitle || '-'}
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex gap-2">
                          {!isEditing && !isNew && (
                            <button
                              onClick={() => setEditingRows(prev => new Set(prev).add(contact.id || ''))}
                              className="text-blue-600 hover:text-blue-800"
                              title="Edit"
                            >
                              ✏️
                            </button>
                          )}
                          {isNew && (
                            <button
                              onClick={() => handleDeleteNewRow(newContactIndex)}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          )}
                          {!isNew && (
                            <button
                              onClick={() => handleDeleteContact(contact.id || '')}
                              className="text-red-600 hover:text-red-800"
                              title="Delete"
                            >
                              🗑️
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* CSV Upload Modal */}
      <CSVUploadModal
        isOpen={csvUploadOpen}
        onClose={() => setCsvUploadOpen(false)}
        onImport={handleCSVImport}
        existingContacts={contacts}
        templates={templates}
      />

      {/* Toast Notifications */}
      <ToastContainer
        toasts={toasts}
        onRemove={(id) => setToasts(prev => prev.filter(t => t.id !== id))}
      />

      <DeleteConfirmModal
        isOpen={deleteConfirm.isOpen}
        title="Delete Contact List"
        message="Are you sure you want to delete this contact list? This will also delete all contacts in this list."
        itemName={deleteConfirm.listName || undefined}
        onConfirm={confirmDeleteList}
        onCancel={cancelDeleteList}
        confirmText="Delete List"
        cancelText="Cancel"
        isDeleting={deleteConfirm.isDeleting}
      />

      <DeleteConfirmModal
        isOpen={deleteContactConfirm.isOpen}
        title="Delete Contact"
        message="Are you sure you want to delete this contact? This action cannot be undone."
        itemName={deleteContactConfirm.contactName || undefined}
        onConfirm={confirmDeleteContact}
        onCancel={cancelDeleteContact}
        confirmText="Delete Contact"
        cancelText="Cancel"
        isDeleting={deleteContactConfirm.isDeleting}
      />
    </div>
  );
};
