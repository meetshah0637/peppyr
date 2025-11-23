/**
 * Main App component for Appointment Library Quickbar
 * Manages global state and renders the template library with quickbar overlay
 */

import React, { useState } from 'react';
import { TemplateLibrary } from './components/TemplateLibrary';
import { ContactList } from './components/ContactList';
import { AnalyticsDashboard } from './components/AnalyticsDashboard';
import { Quickbar } from './components/Quickbar';
import { HeaderAuth } from './components/HeaderAuth';
import { useAuth } from './hooks/useAuth';
import { Home } from './components/Home';
import { OnboardingTutorial, useTutorial } from './components/OnboardingTutorial';

type Page = 'templates' | 'contacts' | 'analytics';

function App() {
  const [isQuickbarOpen, setIsQuickbarOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('templates');
  const { user, loading } = useAuth();
  const { showTutorial, setShowTutorial } = useTutorial();


  const handleOpenQuickbar = () => {
    setIsQuickbarOpen(true);
  };

  const handleCloseQuickbar = () => {
    setIsQuickbarOpen(false);
  };

  // Show home page if not authenticated
  // Only show loading if we're actually loading AND we don't have a user yet
  if (!user) {
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-blue-50/30">
          <div className="text-gray-600">Loading...</div>
        </div>
      )
    }
    // Show home page when not authenticated and not loading
    return <Home />
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'templates':
        return <TemplateLibrary />;
      case 'contacts':
        return <ContactList />;
      case 'analytics':
        return <AnalyticsDashboard />;
      default:
        return <TemplateLibrary />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <HeaderAuth currentPage={currentPage} onPageChange={setCurrentPage} />
      <GlobalHotkeyHandler onOpenQuickbar={handleOpenQuickbar} />
      {renderPage()}
      <Quickbar isOpen={isQuickbarOpen} onClose={handleCloseQuickbar} />
      {showTutorial && user && (
        <OnboardingTutorial 
          onComplete={() => {
            setShowTutorial(false);
          }} 
          onNavigate={setCurrentPage}
          currentPage={currentPage}
        />
      )}
    </div>
  );
}

/**
 * Global hotkey handler component
 * Listens for Ctrl+K / Cmd+K to open quickbar
 */
const GlobalHotkeyHandler: React.FC<{ onOpenQuickbar: () => void }> = ({ onOpenQuickbar }) => {
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Check for Ctrl+K (Windows/Linux) or Cmd+K (macOS)
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault();
        onOpenQuickbar();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onOpenQuickbar]);

  return null;
};

export default App;

