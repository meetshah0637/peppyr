/**
 * Analytics Dashboard component
 * Displays outreach metrics and template performance
 */

import React, { useState, useEffect } from 'react';
import { apiClient } from '../services/api';
import { OutreachMetrics, TemplatePerformance } from '../types';
import { useProjects } from '../hooks/useProjects';
import { ProjectSelector } from './ProjectSelector';
import { ProjectManager } from './ProjectManager';

export const AnalyticsDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<OutreachMetrics | null>(null);
  const [templatePerformance, setTemplatePerformance] = useState<TemplatePerformance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);
  const [isProjectManagerOpen, setIsProjectManagerOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);

  const {
    projects,
    isLoading: projectsLoading,
    createProject,
    updateProject,
    reloadProjects
  } = useProjects();

  useEffect(() => {
    loadAnalytics();
  }, [selectedProjectId]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [metricsData, templateData] = await Promise.all([
        apiClient.getMetrics(selectedProjectId || undefined),
        apiClient.getTemplatePerformance(selectedProjectId || undefined)
      ]);
      setMetrics(metricsData);
      setTemplatePerformance(templateData);
    } catch (error) {
      console.error('Failed to load analytics:', error);
    } finally {
      setIsLoading(false);
    }
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Analytics Dashboard</h1>
        <p className="text-gray-600">
          Track your outreach performance and template effectiveness.
          {selectedProjectId && (
            <span className="ml-2 text-blue-600 font-medium">
              (Filtered by project)
            </span>
          )}
        </p>
      </div>

      {/* Project Selector */}
      <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-200">
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
        {selectedProjectId && (
          <p className="mt-2 text-sm text-gray-600">
            Showing analytics for the selected project. Select "All Projects" to view all analytics.
          </p>
        )}
      </div>

      {metrics && (
        <>
          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-gray-900 mb-2">{metrics.totalContacts}</div>
              <div className="text-sm text-gray-600">Total Contacts</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-blue-600 mb-2">{metrics.contacted}</div>
              <div className="text-sm text-gray-600">Contacted</div>
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-green-600 mb-2">{metrics.replied}</div>
              <div className="text-sm text-gray-600">Replied</div>
              {metrics.contacted > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.responseRate.toFixed(1)}% response rate
                </div>
              )}
            </div>
            <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
              <div className="text-3xl font-bold text-purple-600 mb-2">{metrics.meetingsScheduled}</div>
              <div className="text-sm text-gray-600">Meetings Scheduled</div>
              {metrics.contacted > 0 && (
                <div className="text-xs text-gray-500 mt-1">
                  {metrics.meetingConversionRate.toFixed(1)}% conversion rate
                </div>
              )}
            </div>
          </div>

          {/* Conversion Funnel */}
          <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Conversion Funnel</h2>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Total Contacts</span>
                  <span className="text-sm font-medium">{metrics.totalContacts}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gray-400 h-2 rounded-full" style={{ width: '100%' }}></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Contacted</span>
                  <span className="text-sm font-medium">{metrics.contacted}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${metrics.totalContacts > 0 ? (metrics.contacted / metrics.totalContacts) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Replied</span>
                  <span className="text-sm font-medium">{metrics.replied}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${metrics.contacted > 0 ? (metrics.replied / metrics.contacted) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Meetings Scheduled</span>
                  <span className="text-sm font-medium">{metrics.meetingsScheduled}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-purple-600 h-2 rounded-full" 
                    style={{ width: `${metrics.contacted > 0 ? (metrics.meetingsScheduled / metrics.contacted) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-sm text-gray-600">Meetings Completed</span>
                  <span className="text-sm font-medium">{metrics.meetingsCompleted}</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-indigo-600 h-2 rounded-full" 
                    style={{ width: `${metrics.meetingsScheduled > 0 ? (metrics.meetingsCompleted / metrics.meetingsScheduled) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Template Performance */}
      <div className="bg-white p-6 rounded-lg border border-gray-200 shadow-sm">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Template Performance</h2>
        {templatePerformance.length === 0 ? (
          <p className="text-gray-500">No template performance data available yet. Start using templates to track performance.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 text-sm font-medium text-gray-700">Template</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Times Used</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Responses</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Meetings</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Response Rate</th>
                  <th className="text-right py-3 px-4 text-sm font-medium text-gray-700">Conversion Rate</th>
                </tr>
              </thead>
              <tbody>
                {templatePerformance.map((template) => (
                  <tr key={template.templateId} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-gray-900">{template.templateTitle}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{template.timesUsed}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{template.responsesReceived}</td>
                    <td className="py-3 px-4 text-sm text-gray-600 text-right">{template.meetingsScheduled}</td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={`font-medium ${
                        template.responseRate >= 20 ? 'text-green-600' :
                        template.responseRate >= 10 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {template.responseRate.toFixed(1)}%
                      </span>
                    </td>
                    <td className="py-3 px-4 text-sm text-right">
                      <span className={`font-medium ${
                        template.meetingConversionRate >= 10 ? 'text-green-600' :
                        template.meetingConversionRate >= 5 ? 'text-yellow-600' : 'text-red-600'
                      }`}>
                        {template.meetingConversionRate.toFixed(1)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

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

