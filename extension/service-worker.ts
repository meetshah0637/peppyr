// Service worker: opens side panel on action click. Revert by deleting this file and removing related manifest fields.
chrome.action.onClicked.addListener(async (tab) => {
  try {
    // @ts-ignore
    if (chrome.sidePanel?.open) {
      // @ts-ignore
      chrome.sidePanel.open({ tabId: tab.id })
    }
  } catch (e) {
    // no-op
  }
})


