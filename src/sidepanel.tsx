/**
 * Side Panel entry for Chrome Extension. Renders a compact panel that
 * reuses the template library and adds a Paste button that inserts into
 * the currently focused field on the active tab via content script messaging.
 * Revert: delete this file and remove sidepanel.html + vite config input.
 */
import React from 'react'
import ReactDOM from 'react-dom/client'
import { TemplateLibrary } from './components/TemplateLibrary'
// Note: The side panel reuses the TemplateLibrary. Copy places text on
// clipboard; content script can handle paste via user action or message.

function SidePanelApp() {
  // Render the existing library; the Copy buttons still copy to clipboard.
  // Users can paste with Cmd/Ctrl+V, and content script supports on-demand paste via message (triggered from quickbar Enter).
  return (
    <div className="min-h-screen bg-gray-50">
      <TemplateLibrary />
    </div>
  )
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <SidePanelApp />
  </React.StrictMode>,
)


