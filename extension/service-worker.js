// Service worker: opens side panel on action click. Revert by deleting this file and removing related manifest fields.
// Ensure side panel opens with our page and is available on all tabs
chrome.runtime.onInstalled.addListener(async () => {
  try {
    if (chrome.sidePanel?.setPanelBehavior) {
      chrome.sidePanel.setPanelBehavior({ openPanelOnActionClick: true })
    }
    const tabs = await chrome.tabs.query({})
    for (const t of tabs) {
      if (t.id) {
        await chrome.sidePanel.setOptions({ tabId: t.id, path: 'sidepanel.html', enabled: true })
      }
    }
  } catch {}
})

chrome.tabs.onUpdated.addListener(async (tabId) => {
  try {
    await chrome.sidePanel.setOptions({ tabId, path: 'sidepanel.html', enabled: true })
  } catch {}
})

chrome.action.onClicked.addListener(async (tab) => {
  try {
    if (chrome.sidePanel?.open) {
      chrome.sidePanel.open({ tabId: tab.id })
    }
  } catch {}
})


