/**
 * Onboarding Tutorial Component
 * Provides step-by-step guided tour for new users
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { storage } from '../utils/storage';

const TUTORIAL_COMPLETED_KEY = 'peppyr-tutorial-completed';

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  target?: string; // CSS selector for element to highlight
  position?: 'top' | 'bottom' | 'left' | 'right' | 'center';
  action?: () => void; // Action to perform (e.g., open a modal)
}

const tutorialSteps: TutorialStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to Peppyr! 🎉',
    description: 'Let\'s take a quick tour of the key features that will help you streamline your outreach.',
    position: 'center'
  },
  {
    id: 'projects',
    title: 'Create Your First Project',
    description: 'Projects help you organize templates and contacts by client or campaign. Click the "New Project" button to create one.',
    target: '[data-tutorial="projects"]',
    position: 'bottom'
  },
  {
    id: 'templates',
    title: 'Create Templates with Parameters',
    description: 'Templates are your outreach messages. Use placeholders like {name} and {company} that get replaced automatically.',
    target: '[data-tutorial="templates"]',
    position: 'bottom'
  },
  {
    id: 'parameters',
    title: 'Set Up Template Parameters',
    description: 'Parameters are values that replace placeholders in your templates. Set your name, company, and other common values here.',
    target: '[data-tutorial="parameters"]',
    position: 'bottom'
  },
  {
    id: 'csv-upload',
    title: 'Upload Contacts via CSV',
    description: 'Import your contacts from a CSV file. Click the "Upload CSV" button below to get started.',
    target: '[data-tutorial="csv-upload"]',
    position: 'bottom'
  },
  {
    id: 'analytics',
    title: 'Track Your Performance',
    description: 'The Analytics dashboard shows which templates perform best, response rates, and meeting conversions.',
    target: '[data-tutorial="analytics"]',
    position: 'bottom'
  },
  {
    id: 'quickbar',
    title: 'Quick Access with Quickbar',
    description: 'Press Ctrl+K (or Cmd+K on Mac) to instantly search and copy your templates. Perfect for quick outreach!',
    position: 'center'
  },
  {
    id: 'complete',
    title: 'You\'re All Set! 🚀',
    description: 'You now know the basics. Start creating templates, importing contacts, and tracking your outreach performance. Happy prospecting!',
    position: 'center'
  }
];

interface OnboardingTutorialProps {
  onComplete: () => void;
  onNavigate?: (page: 'templates' | 'contacts' | 'analytics') => void;
  currentPage?: 'templates' | 'contacts' | 'analytics';
}

export const OnboardingTutorial: React.FC<OnboardingTutorialProps> = ({ onComplete, onNavigate, currentPage }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [highlightedElement, setHighlightedElement] = useState<HTMLElement | null>(null);
  const { user } = useAuth();

  const step = tutorialSteps[currentStep];


  useEffect(() => {
    // Navigate to the correct page if needed
    if (step.id === 'csv-upload' && currentPage !== 'contacts' && onNavigate) {
      onNavigate('contacts');
      // Wait a bit for navigation to complete
      setTimeout(() => {
        const element = document.querySelector(step.target || '') as HTMLElement;
        if (element) {
          setHighlightedElement(element);
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('tutorial-highlight');
        }
      }, 300);
      return;
    }
    
    if (step.id === 'analytics' && currentPage !== 'analytics' && onNavigate) {
      onNavigate('analytics');
      setTimeout(() => {
        const element = document.querySelector(step.target || '') as HTMLElement;
        if (element) {
          setHighlightedElement(element);
          element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          element.classList.add('tutorial-highlight');
        }
      }, 300);
      return;
    }

    if (step.target) {
      const element = document.querySelector(step.target) as HTMLElement;
      if (element) {
        setHighlightedElement(element);
        // Scroll element into view
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Add highlight class
        element.classList.add('tutorial-highlight');
      } else {
        setHighlightedElement(null);
      }
    } else {
      setHighlightedElement(null);
    }

    return () => {
      if (highlightedElement) {
        highlightedElement.classList.remove('tutorial-highlight');
      }
    };
  }, [step.target, currentStep, step.id, currentPage, onNavigate]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    // Mark tutorial as completed
    const settings = storage.getSettings();
    settings[TUTORIAL_COMPLETED_KEY] = true;
    if (user?.uid) {
      settings[`${TUTORIAL_COMPLETED_KEY}-${user.uid}`] = true;
    }
    storage.saveSettings(settings);
    
    // Remove highlight
    if (highlightedElement) {
      highlightedElement.classList.remove('tutorial-highlight');
    }
    
    onComplete();
  };

  const getTooltipPosition = () => {
    if (!highlightedElement || step.position === 'center') {
      return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100]';
    }

    switch (step.position) {
      case 'top':
        return `fixed z-[100] left-1/2 transform -translate-x-1/2`;
      case 'bottom':
        return `fixed z-[100] left-1/2 transform -translate-x-1/2`;
      case 'left':
        return `fixed z-[100] top-1/2 transform -translate-y-1/2`;
      case 'right':
        return `fixed z-[100] top-1/2 transform -translate-y-1/2`;
      default:
        return 'fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-[100]';
    }
  };

  const getTooltipStyle = (): React.CSSProperties => {
    if (!highlightedElement || step.position === 'center') {
      return {};
    }

    const rect = highlightedElement.getBoundingClientRect();
    const scrollY = window.scrollY;
    const scrollX = window.scrollX;
    const tooltipWidth = 500; // Increased from 448px
    const tooltipHeight = 250; // Increased estimate
    const spacing = 20;
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    switch (step.position) {
      case 'top':
        const topY = rect.top + scrollY - spacing;
        const topX = Math.max(
          spacing,
          Math.min(
            rect.left + scrollX + rect.width / 2,
            viewportWidth - tooltipWidth / 2 - spacing
          )
        );
        return {
          top: `${topY}px`,
          left: `${topX}px`,
          transform: 'translate(-50%, -100%)',
          maxWidth: `${Math.min(tooltipWidth, viewportWidth - spacing * 2)}px`
        };
      case 'bottom':
        const bottomY = rect.bottom + scrollY + spacing;
        // Calculate if tooltip would go below viewport
        const estimatedTooltipBottom = bottomY + tooltipHeight;
        const viewportBottom = scrollY + viewportHeight;
        const minBottomSpacing = 80; // Minimum space from bottom of viewport
        
        // If tooltip would be cut off at bottom, position it above the element instead
        let finalY: number;
        let finalTransform: string;
        
        if (estimatedTooltipBottom > viewportBottom - minBottomSpacing) {
          // Position above element instead
          finalY = rect.top + scrollY - spacing;
          finalTransform = 'translate(-50%, -100%)';
        } else {
          // Position below element, but ensure minimum spacing from bottom
          finalY = Math.min(bottomY, viewportBottom - tooltipHeight - minBottomSpacing);
          finalTransform = 'translateX(-50%)';
        }
        
        // Ensure tooltip doesn't go above viewport either
        finalY = Math.max(spacing, Math.min(finalY, viewportHeight + scrollY - tooltipHeight - minBottomSpacing));
        
        // Center horizontally but ensure it stays within viewport
        const bottomX = Math.max(
          tooltipWidth / 2 + spacing,
          Math.min(
            rect.left + scrollX + rect.width / 2,
            viewportWidth - tooltipWidth / 2 - spacing
          )
        );
        return {
          top: `${finalY}px`,
          left: `${bottomX}px`,
          transform: finalTransform,
          maxWidth: `${Math.min(tooltipWidth, viewportWidth - spacing * 2)}px`
        };
      case 'left':
        const leftY = Math.max(
          spacing,
          Math.min(
            rect.top + scrollY + rect.height / 2,
            viewportHeight - tooltipHeight / 2 - spacing
          )
        );
        return {
          top: `${leftY}px`,
          left: `${rect.left + scrollX - spacing}px`,
          transform: 'translate(-100%, -50%)',
          maxWidth: `${Math.min(tooltipWidth, rect.left + scrollX - spacing * 2)}px`
        };
      case 'right':
        const rightY = Math.max(
          spacing,
          Math.min(
            rect.top + scrollY + rect.height / 2,
            viewportHeight - tooltipHeight / 2 - spacing
          )
        );
        return {
          top: `${rightY}px`,
          left: `${rect.right + scrollX + spacing}px`,
          transform: 'translateY(-50%)',
          maxWidth: `${Math.min(tooltipWidth, viewportWidth - rect.right - scrollX - spacing * 2)}px`
        };
      default:
        return {};
    }
  };


  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[99]"
        onClick={step.position === 'center' ? undefined : handleNext}
      />

      {/* Highlight overlay (darkens everything except highlighted element) */}
      {highlightedElement && (
        <div className="fixed inset-0 z-[98] pointer-events-none">
          <svg className="w-full h-full">
            <defs>
              <mask id="tutorial-mask">
                <rect width="100%" height="100%" fill="black" />
                <rect
                  x={highlightedElement.getBoundingClientRect().left}
                  y={highlightedElement.getBoundingClientRect().top}
                  width={highlightedElement.getBoundingClientRect().width}
                  height={highlightedElement.getBoundingClientRect().height}
                  fill="white"
                  rx="8"
                />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#tutorial-mask)" />
          </svg>
        </div>
      )}

      {/* Tooltip */}
      <div
        className={`${getTooltipPosition()} z-[100]`}
        style={{
          ...(step.position !== 'center' ? getTooltipStyle() : {
            position: 'fixed',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            maxWidth: '90vw',
            width: 'auto'
          }),
          ...(step.position !== 'center' ? {
            maxWidth: 'min(500px, calc(100vw - 2rem))',
            width: 'auto',
            minWidth: '300px',
            margin: '1rem'
          } : {})
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-white rounded-2xl shadow-2xl p-6 border border-gray-200 w-full">
          {/* Progress indicator */}
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm text-gray-500 mb-2">
              <span>Step {currentStep + 1} of {tutorialSteps.length}</span>
              <button
                onClick={handleSkip}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                Skip tutorial
              </button>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-blue-600 to-indigo-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${((currentStep + 1) / tutorialSteps.length) * 100}%` }}
              />
            </div>
          </div>

          {/* Content */}
          <h3 className="text-2xl font-bold text-gray-900 mb-3 break-words">{step.title}</h3>
          <p className="text-gray-600 mb-6 leading-relaxed break-words whitespace-normal text-base">{step.description}</p>

          {/* Action buttons */}
          <div className="flex items-center justify-between gap-2 sm:gap-4">
            <button
              onClick={handlePrevious}
              disabled={currentStep === 0}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors whitespace-nowrap"
            >
              Previous
            </button>
            
            <div className="flex gap-2 flex-1 justify-center min-w-0">
              {step.id === 'projects' && (
                <button
                  onClick={() => {
                    // Trigger project creation modal
                    const projectButton = document.querySelector('[data-tutorial="projects"]') as HTMLElement;
                    if (projectButton) {
                      projectButton.click();
                    }
                    setTimeout(handleNext, 500);
                  }}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Try it now
                </button>
              )}
              
              {step.id === 'parameters' && (
                <button
                  onClick={() => {
                    // Trigger parameters modal
                    const paramsButton = document.querySelector('[data-tutorial="parameters"]') as HTMLElement;
                    if (paramsButton) {
                      paramsButton.click();
                    }
                    setTimeout(handleNext, 500);
                  }}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  Open Parameters
                </button>
              )}
              
              {step.id === 'csv-upload' && (
                <button
                  onClick={() => {
                    // Trigger CSV upload modal
                    const csvButton = document.querySelector('[data-tutorial="csv-upload"]') as HTMLElement;
                    if (csvButton) {
                      csvButton.click();
                    }
                    setTimeout(handleNext, 500);
                  }}
                  className="px-3 sm:px-4 py-2 text-sm sm:text-base bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
                >
                  Open Upload
                </button>
              )}
            </div>

            <button
              onClick={handleNext}
              className="px-4 sm:px-6 py-2 text-sm sm:text-base bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-lg hover:shadow-lg transition-all font-medium whitespace-nowrap flex-shrink-0"
            >
              {currentStep === tutorialSteps.length - 1 ? 'Get Started' : 'Next'}
            </button>
          </div>
        </div>

        {/* Arrow pointing to element */}
        {highlightedElement && step.position !== 'center' && (
          <div
            className="absolute w-0 h-0 border-8 border-transparent"
            style={{
              ...(step.position === 'bottom' && {
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                borderBottomColor: 'white'
              }),
              ...(step.position === 'top' && {
                top: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                borderTopColor: 'white'
              }),
              ...(step.position === 'left' && {
                left: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                borderLeftColor: 'white'
              }),
              ...(step.position === 'right' && {
                right: '100%',
                top: '50%',
                transform: 'translateY(-50%)',
                borderRightColor: 'white'
              })
            }}
          />
        )}
      </div>

      {/* Add CSS for highlight */}
      <style>{`
        .tutorial-highlight {
          position: relative;
          z-index: 101 !important;
          outline: 3px solid #3b82f6 !important;
          outline-offset: 4px;
          border-radius: 8px;
          box-shadow: 0 0 0 4px rgba(59, 130, 246, 0.2) !important;
        }
      `}</style>
    </>
  );
};

// Hook to check if tutorial should be shown
export const useTutorial = () => {
  const { user, loading } = useAuth();
  const [showTutorial, setShowTutorial] = useState(false);
  const [lastCheckedUserId, setLastCheckedUserId] = useState<string | null>(null);
  const [hasShownForCurrentUser, setHasShownForCurrentUser] = useState(false);

  useEffect(() => {
    // Wait for auth to finish loading
    if (loading) {
      return;
    }
    
    if (!user || !user.uid) {
      setLastCheckedUserId(null);
      setHasShownForCurrentUser(false);
      setShowTutorial(false);
      return;
    }
    
    // If user changed, reset the hasShown flag
    if (lastCheckedUserId !== null && lastCheckedUserId !== user.uid) {
      setHasShownForCurrentUser(false);
    }
    
    // Only check once per user session to avoid multiple checks
    if (lastCheckedUserId === user.uid && hasShownForCurrentUser) {
      return;
    }
    
    // Mark that we're checking this user
    setLastCheckedUserId(user.uid);
    
    // Check immediately
    const settings = storage.getSettings();
    const userCompleted = settings[`${TUTORIAL_COMPLETED_KEY}-${user.uid}`];
    
    // Check if this is a new user - only check user-specific flag
    const isNewUser = !userCompleted;
    
    if (isNewUser) {
      // Show tutorial after a brief delay to ensure UI is ready
      const showTimer = setTimeout(() => {
        setShowTutorial(true);
        setHasShownForCurrentUser(true);
      }, 1000);
      
      return () => {
        clearTimeout(showTimer);
      };
    } else {
      // Make sure tutorial is hidden if already completed
      setShowTutorial(false);
    }
  }, [user, loading, lastCheckedUserId, hasShownForCurrentUser]);

  // Expose function to manually reset tutorial (for testing)
  // Also expose it globally for easy testing in console
  const resetTutorial = () => {
    const settings = storage.getSettings();
    delete settings[TUTORIAL_COMPLETED_KEY];
    if (user?.uid) {
      delete settings[`${TUTORIAL_COMPLETED_KEY}-${user.uid}`];
    }
    // Also clear for all users (for testing)
    Object.keys(settings).forEach(key => {
      if (key.startsWith(TUTORIAL_COMPLETED_KEY)) {
        delete settings[key];
      }
    });
    storage.saveSettings(settings);
    setShowTutorial(true);
  };

  // Expose reset and show functions globally for console testing
  if (typeof window !== 'undefined') {
    (window as any).resetTutorial = resetTutorial;
    (window as any).showTutorial = () => {
      setShowTutorial(true);
      setHasShownForCurrentUser(false);
    };
    (window as any).hideTutorial = () => {
      setShowTutorial(false);
    };
    (window as any).checkTutorialStatus = () => {
      const settings = storage.getSettings();
      const generalCompleted = settings[TUTORIAL_COMPLETED_KEY];
      const userCompleted = user?.uid ? settings[`${TUTORIAL_COMPLETED_KEY}-${user.uid}`] : false;
      const allTutorialKeys = Object.keys(settings).filter(k => k.includes('tutorial'));
      const status = {
        user: user?.uid,
        email: user?.email,
        generalCompleted,
        userCompleted,
        shouldShow: !userCompleted, // Only check user-specific flag
        showTutorialState: showTutorial,
        hasShownForCurrentUser,
        lastCheckedUserId,
        allTutorialKeys,
        allSettings: settings,
        localStorage: localStorage.getItem('appointment-library-settings')
      };
      return status;
    };
    (window as any).clearAllTutorialFlags = () => {
      const settings = storage.getSettings();
      Object.keys(settings).forEach(key => {
        if (key.includes('tutorial') && key.includes('completed')) {
          delete settings[key];
        }
      });
      storage.saveSettings(settings);
    };
  }

  return { showTutorial, setShowTutorial, resetTutorial };
};

