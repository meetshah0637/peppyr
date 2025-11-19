// Content script: listens for paste requests and inserts clipboard text into the focused field.
function insertAtCursor(element, text) {
  const start = element.selectionStart ?? element.value.length
  const end = element.selectionEnd ?? element.value.length
  const before = element.value.substring(0, start)
  const after = element.value.substring(end)
  element.value = before + text + after
  const cursor = start + text.length
  element.setSelectionRange(cursor, cursor)
  element.dispatchEvent(new Event('input', { bubbles: true }))
}

async function readClipboard() {
  try {
    const text = await navigator.clipboard.readText()
    return text || ''
  } catch {
    return ''
  }
}

chrome.runtime.onMessage.addListener((message) => {
  if (message?.type === 'quickbar_paste_request') {
    setTimeout(async () => {
      const active = document.activeElement
      const text = await readClipboard()
      if (!text) return

      if (active && (active.tagName === 'TEXTAREA' || (active.tagName === 'INPUT' && active.type === 'text'))) {
        insertAtCursor(active, text)
      } else {
        const field = document.querySelector('textarea, input[type="text"], input[type="search"], [contenteditable="true"]')
        if (field) {
          if (field.isContentEditable) {
            field.focus()
            document.execCommand('insertText', false, text)
          } else {
            field.focus()
            insertAtCursor(field, text)
          }
        }
      }
    }, 50)
  }
})


