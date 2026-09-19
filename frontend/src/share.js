export async function sharePoll(url) {
  if (typeof navigator !== 'undefined' && typeof navigator.share === 'function') {
    try {
      await navigator.share({
        title: 'Live Poll',
        text: 'Vote in this live poll',
        url
      })
      return { success: true, method: 'share' }
    } catch (err) {
      if (err && err.name === 'AbortError') {
        return { success: false, aborted: true }
      }
    }
  }

  if (typeof navigator !== 'undefined' && navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
    try {
      await navigator.clipboard.writeText(url)
      return { success: true, method: 'clipboard' }
    } catch {
      // Fall through to execCommand
    }
  }

  try {
    const textArea = document.createElement('textarea')
    textArea.value = url
    textArea.style.position = 'fixed'
    textArea.style.top = '0'
    textArea.style.left = '0'
    textArea.style.width = '2em'
    textArea.style.height = '2em'
    textArea.style.padding = '0'
    textArea.style.border = 'none'
    textArea.style.outline = 'none'
    textArea.style.boxShadow = 'none'
    textArea.style.background = 'transparent'
    textArea.setAttribute('readonly', '')
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    textArea.setSelectionRange(0, url.length)
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    if (successful) {
      return { success: true, method: 'clipboard' }
    }
  } catch {
    // Both failed
  }

  return { success: false }
}

export async function copyToClipboard(text) {
  const res = await sharePoll(text)
  return res.success
}
