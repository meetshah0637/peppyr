/**
 * CSV Upload Modal for importing/updating contacts from CSV
 * Allows mapping CSV columns to contact fields and updating contacts with message and status
 */

import React, { useState, useRef } from 'react';
import { Contact, ContactStatus } from '../types';
import { Template } from '../types';

interface CSVRow {
  [key: string]: string;
}

interface MappedContact {
  email?: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  status?: ContactStatus;
  message?: string;
  templateTitle?: string;
  [key: string]: any;
}

interface CSVUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (contacts: MappedContact[], fileName?: string) => Promise<void>;
  existingContacts: Contact[];
  templates: Template[];
}

const statusOptions: { value: ContactStatus; label: string }[] = [
  { value: 'not_contacted', label: 'Not Contacted' },
  { value: 'contacted', label: 'Contacted' },
  { value: 'replied', label: 'Replied' },
  { value: 'meeting_scheduled', label: 'Meeting Scheduled' },
  { value: 'meeting_completed', label: 'Meeting Completed' },
  { value: 'qualified', label: 'Qualified' },
  { value: 'not_qualified', label: 'Not Qualified' },
  { value: 'no_response', label: 'No Response' }
];

export const CSVUploadModal: React.FC<CSVUploadModalProps> = ({
  isOpen,
  onClose,
  onImport,
  existingContacts,
  templates
}) => {
  const [csvData, setCsvData] = useState<CSVRow[]>([]);
  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [editableContacts, setEditableContacts] = useState<MappedContact[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showMapping, setShowMapping] = useState(true);
  const [csvFileName, setCsvFileName] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Default field mappings
  const defaultFields = [
    { field: 'email', label: 'Email', required: false },
    { field: 'firstName', label: 'First Name', required: false },
    { field: 'lastName', label: 'Last Name', required: false },
    { field: 'company', label: 'Company', required: false },
    { field: 'status', label: 'Status', required: false },
    { field: 'message', label: 'Message Sent', required: false },
    { field: 'templateTitle', label: 'Template Used', required: false }
  ];

  const parseCSV = (text: string): CSVRow[] => {
    // Proper CSV parser that handles quoted fields with newlines
    const parseCSVLine = (line: string, delimiter: string): string[] => {
      const result: string[] = [];
      let current = '';
      let inQuotes = false;
      
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        const nextChar = line[i + 1];
        
        if (char === '"') {
          if (inQuotes && nextChar === '"') {
            // Escaped quote
            current += '"';
            i++; // Skip next quote
          } else {
            // Toggle quote state
            inQuotes = !inQuotes;
          }
        } else if (char === delimiter && !inQuotes) {
          // Field separator (only if not in quotes)
          result.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      
      // Add the last field
      result.push(current.trim());
      return result;
    };

    // Split into rows, handling quoted fields with newlines
    const rows: string[] = [];
    let currentRow = '';
    let inQuotes = false;
    
    for (let i = 0; i < text.length; i++) {
      const char = text[i];
      const nextChar = text[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          currentRow += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
          currentRow += char;
        }
      } else if (char === '\n' && !inQuotes) {
        // New row (only if not in quotes)
        if (currentRow.trim()) {
          rows.push(currentRow);
        }
        currentRow = '';
      } else {
        currentRow += char;
      }
    }
    
    // Add the last row if it exists
    if (currentRow.trim()) {
      rows.push(currentRow);
    }

    if (rows.length === 0) return [];

    // Detect delimiter from first line
    const firstLine = rows[0];
    const delimiter = firstLine.includes(',') ? ',' : (firstLine.includes('\t') ? '\t' : ',');
    
    // Parse header
    const headers = parseCSVLine(rows[0], delimiter).map(h => h.replace(/^"|"$/g, ''));
    setCsvHeaders(headers);

    // Parse data rows
    const dataRows: CSVRow[] = [];
    for (let i = 1; i < rows.length; i++) {
      const values = parseCSVLine(rows[i], delimiter).map(v => v.replace(/^"|"$/g, ''));
      const row: CSVRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      dataRows.push(row);
    }

    return dataRows;
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setCsvFileName(file.name);
    setError(null);
    setIsProcessing(true);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const parsed = parseCSV(text);
        
        if (parsed.length === 0) {
          setError('CSV file is empty or invalid');
          setIsProcessing(false);
          return;
        }

        setCsvData(parsed);
        
        // Auto-detect column mappings
        const autoMapping: Record<string, string> = {};
        const headers = Object.keys(parsed[0]);
        
        headers.forEach(header => {
          const lowerHeader = header.toLowerCase();
          // Try to match common column names
          if (lowerHeader.includes('email')) autoMapping.email = header;
          else if (lowerHeader.includes('first') && lowerHeader.includes('name')) autoMapping.firstName = header;
          else if (lowerHeader.includes('last') && lowerHeader.includes('name')) autoMapping.lastName = header;
          else if (lowerHeader.includes('company')) autoMapping.company = header;
          else if (lowerHeader.includes('status')) autoMapping.status = header;
          else if (lowerHeader.includes('message') || lowerHeader.includes('sent')) autoMapping.message = header;
          else if (lowerHeader.includes('template')) autoMapping.templateTitle = header;
        });

        setColumnMapping(autoMapping);
        generateEditableContacts(parsed, autoMapping);
        setShowMapping(false); // Hide mapping once done
      } catch (err) {
        setError(`Failed to parse CSV: ${err instanceof Error ? err.message : 'Unknown error'}`);
      } finally {
        setIsProcessing(false);
      }
    };

    reader.onerror = () => {
      setError('Failed to read file');
      setIsProcessing(false);
    };

    reader.readAsText(file);
  };

  const generateEditableContacts = (data: CSVRow[], mapping: Record<string, string>) => {
    const mapped: MappedContact[] = data.map(row => {
      const contact: MappedContact = {};
      
      if (mapping.email) contact.email = row[mapping.email] || '';
      if (mapping.firstName) contact.firstName = row[mapping.firstName] || '';
      if (mapping.lastName) contact.lastName = row[mapping.lastName] || '';
      if (mapping.company) contact.company = row[mapping.company] || '';
      if (mapping.status) {
        const statusValue = row[mapping.status]?.toLowerCase().replace(/\s+/g, '_');
        contact.status = statusOptions.find(s => 
          s.value === statusValue || s.label.toLowerCase() === row[mapping.status]?.toLowerCase()
        )?.value || 'not_contacted';
      } else {
        contact.status = 'not_contacted';
      }
      if (mapping.message) contact.message = row[mapping.message] || '';
      if (mapping.templateTitle) contact.templateTitle = row[mapping.templateTitle] || '';

      return contact;
    });

    setEditableContacts(mapped);
  };

  const handleMappingChange = (field: string, csvColumn: string) => {
    const newMapping = { ...columnMapping, [field]: csvColumn };
    setColumnMapping(newMapping);
    generateEditableContacts(csvData, newMapping);
  };

  const handleContactEdit = (index: number, field: keyof MappedContact, value: string) => {
    const updated = [...editableContacts];
    updated[index] = { ...updated[index], [field]: value };
    setEditableContacts(updated);
  };

  const handleAddRow = () => {
    setEditableContacts([
      ...editableContacts,
      {
        email: '',
        firstName: '',
        lastName: '',
        company: '',
        status: 'not_contacted',
        message: '',
        templateTitle: ''
      }
    ]);
  };

  const handleDeleteRow = (index: number) => {
    setEditableContacts(editableContacts.filter((_, i) => i !== index));
  };

  const handleImport = async () => {
    if (editableContacts.length === 0) {
      setError('No contacts to import');
      return;
    }

    // Filter out completely empty contacts (no data at all)
    const validContacts = editableContacts.filter(c => 
      c.email || c.firstName || c.lastName || c.company
    );
    
    if (validContacts.length === 0) {
      setError('Please add at least one contact with some information');
      return;
    }

    setIsProcessing(true);
    setError(null);
    setSuccess(null);

    try {
      await onImport(validContacts, csvFileName || undefined);
      setSuccess(`Successfully imported ${validContacts.length} contact(s)!`);
      setTimeout(() => {
        handleClose();
      }, 1500);
    } catch (err) {
      setError(`Import failed: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClose = () => {
    setCsvData([]);
    setCsvHeaders([]);
    setColumnMapping({});
    setEditableContacts([]);
    setCsvFileName(null);
    setError(null);
    setSuccess(null);
    setShowMapping(true);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in"
      onClick={(e) => e.target === e.currentTarget && handleClose()}
    >
      <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-slide-up">
        {/* Header */}
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Import Contacts from CSV</h2>
          <p className="text-sm text-gray-600 mt-1">
            Upload a CSV file to import or update contacts. Map columns to contact fields below.
          </p>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm">
              {success}
            </div>
          )}

          {/* File Upload */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload CSV File
            </label>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileUpload}
              disabled={isProcessing}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="mt-1 text-xs text-gray-500">
              CSV should include columns for: Email, First Name, Last Name, and optionally Company, Status, Message, Template
            </p>
          </div>

          {/* Column Mapping */}
          {showMapping && csvHeaders.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold text-gray-900 mb-3">Map CSV Columns to Fields</h3>
              <div className="space-y-3">
                {defaultFields.map(field => (
                  <div key={field.field} className="flex items-center gap-3">
                    <label className="w-32 text-sm text-gray-700">
                      {field.label}
                      {field.required && <span className="text-red-500">*</span>}
                    </label>
                    <select
                      value={columnMapping[field.field] || ''}
                      onChange={(e) => handleMappingChange(field.field, e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">-- Select Column --</option>
                      {csvHeaders.map(header => (
                        <option key={header} value={header}>{header}</option>
                      ))}
                    </select>
                  </div>
                ))}
              </div>
              <button
                onClick={() => setShowMapping(false)}
                className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Continue to Edit Contacts
              </button>
            </div>
          )}

          {/* Editable Table */}
          {editableContacts.length > 0 && !showMapping && (
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-sm font-semibold text-gray-900">
                  Edit Contacts ({editableContacts.length} rows)
                </h3>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowMapping(true)}
                    className="px-3 py-1 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Change Mapping
                  </button>
                  <button
                    onClick={handleAddRow}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors"
                  >
                    + Add Row
                  </button>
                </div>
              </div>
              <div className="overflow-x-auto border border-gray-200 rounded-lg max-h-96 overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Email</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">First Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Last Name</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Company</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Status</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Message</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Template</th>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 bg-white">
                    {editableContacts.map((contact, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <input
                            type="email"
                            value={contact.email || ''}
                            onChange={(e) => handleContactEdit(index, 'email', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="email@example.com"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={contact.firstName || ''}
                            onChange={(e) => handleContactEdit(index, 'firstName', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="First Name"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={contact.lastName || ''}
                            onChange={(e) => handleContactEdit(index, 'lastName', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Last Name"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <input
                            type="text"
                            value={contact.company || ''}
                            onChange={(e) => handleContactEdit(index, 'company', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Company"
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={contact.status || 'not_contacted'}
                            onChange={(e) => handleContactEdit(index, 'status', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            {statusOptions.map(opt => (
                              <option key={opt.value} value={opt.value}>{opt.label}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <textarea
                            value={contact.message || ''}
                            onChange={(e) => handleContactEdit(index, 'message', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                            placeholder="Message sent..."
                            rows={2}
                          />
                        </td>
                        <td className="px-3 py-2">
                          <select
                            value={contact.templateTitle || ''}
                            onChange={(e) => handleContactEdit(index, 'templateTitle', e.target.value)}
                            className="w-full px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                          >
                            <option value="">-- None --</option>
                            {templates.map(t => (
                              <option key={t.id} value={t.title}>{t.title}</option>
                            ))}
                          </select>
                        </td>
                        <td className="px-3 py-2">
                          <button
                            onClick={() => handleDeleteRow(index)}
                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                            title="Delete row"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 bg-gray-50 flex items-center justify-end gap-3">
          <button
            onClick={handleClose}
            disabled={isProcessing}
            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleImport}
            disabled={isProcessing || editableContacts.length === 0}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center gap-2"
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Processing...
              </>
            ) : (
              `Import ${editableContacts.length} Contact${editableContacts.length !== 1 ? 's' : ''}`
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

