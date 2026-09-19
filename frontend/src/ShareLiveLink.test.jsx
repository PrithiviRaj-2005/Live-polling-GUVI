import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import { PollView } from './App'

describe('Share Live Link Functionality', () => {
  const mockPoll = {
    id: 'test123',
    question: 'What is your favorite framework?',
    options: [
      { id: 'opt1', label: 'React' },
      { id: 'opt2', label: 'Vue' },
    ],
  }

  const mockResult = {
    pollId: 'test123',
    counts: { opt1: 10, opt2: 5 },
    total: 15,
  }

  beforeEach(() => {
    // Mock window.location.href with poll URL
    delete window.location
    window.location = new URL('http://localhost:5174/poll/test123')

    // Clean up navigator properties
    delete navigator.share
    delete navigator.clipboard
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  test('Test Case 1: copies exact current poll URL when navigator.clipboard is available', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    })

    render(<PollView poll={mockPoll} initialResult={mockResult} onBack={vi.fn()} />)

    const shareButton = screen.getByRole('button', { name: /share live link/i })
    fireEvent.click(shareButton)

    await waitFor(() => {
      expect(writeTextMock).toHaveBeenCalledWith('http://localhost:5174/poll/test123')
    })
  })

  test('Test Case 2: calls navigator.share with expected metadata when available', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
      writable: true,
    })

    render(<PollView poll={mockPoll} initialResult={mockResult} onBack={vi.fn()} />)

    const shareButton = screen.getByRole('button', { name: /share live link/i })
    fireEvent.click(shareButton)

    await waitFor(() => {
      expect(shareMock).toHaveBeenCalledWith({
        title: 'Live Poll',
        text: 'Vote in this live poll',
        url: 'http://localhost:5174/poll/test123',
      })
    })
  })

  test('Test Case 3: falls back to temporary textarea + document.execCommand("copy") when clipboard fails', async () => {
    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard blocked'))
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    })

    document.execCommand = vi.fn().mockReturnValue(true)

    render(<PollView poll={mockPoll} initialResult={mockResult} onBack={vi.fn()} />)

    const shareButton = screen.getByRole('button', { name: /share live link/i })
    fireEvent.click(shareButton)

    await waitFor(() => {
      expect(document.execCommand).toHaveBeenCalledWith('copy')
    })
  })

  test('Test Case 4: verifies the poll page URL remains unchanged without navigation away from /poll/:id', async () => {
    const shareMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
      writable: true,
    })

    render(<PollView poll={mockPoll} initialResult={mockResult} onBack={vi.fn()} />)

    const shareButton = screen.getByRole('button', { name: /share live link/i })
    fireEvent.click(shareButton)

    await waitFor(() => {
      expect(window.location.href).toBe('http://localhost:5174/poll/test123')
      expect(window.location.pathname).toBe('/poll/test123')
    })
  })

  test('Test Case 5: displays success notification when sharing or copying succeeds', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined)
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    })

    render(<PollView poll={mockPoll} initialResult={mockResult} onBack={vi.fn()} />)

    const shareButton = screen.getByRole('button', { name: /share live link/i })
    fireEvent.click(shareButton)

    await waitFor(() => {
      const notice = screen.getByText((content) =>
        content.includes('Link copied to clipboard') || content.includes('Link shared successfully')
      )
      expect(notice).toBeInTheDocument()
    })
  })

  test('Test Case 6: displays error message when both share and clipboard fail', async () => {
    const shareMock = vi.fn().mockRejectedValue(new Error('Share error'))
    Object.defineProperty(navigator, 'share', {
      value: shareMock,
      configurable: true,
      writable: true,
    })

    const writeTextMock = vi.fn().mockRejectedValue(new Error('Clipboard error'))
    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: writeTextMock },
      configurable: true,
      writable: true,
    })

    document.execCommand = vi.fn().mockReturnValue(false)

    render(<PollView poll={mockPoll} initialResult={mockResult} onBack={vi.fn()} />)

    const shareButton = screen.getByRole('button', { name: /share live link/i })
    fireEvent.click(shareButton)

    await waitFor(() => {
      expect(
        screen.getByText('Unable to share link. Please copy the URL manually.')
      ).toBeInTheDocument()
    })
  })

  test('Test Case 7: verifies only one visible sharing action exists ("Share Live Link") and NO "Copy Link" button', () => {
    render(<PollView poll={mockPoll} initialResult={mockResult} onBack={vi.fn()} />)

    // Verify "Share Live Link" exists and is the only share button
    const shareButtons = screen.getAllByRole('button', { name: /share live link/i })
    expect(shareButtons).toHaveLength(1)

    // Verify NO "Copy Link" button exists
    const copyLinkButton = screen.queryByRole('button', { name: /copy link/i })
    expect(copyLinkButton).toBeNull()

    // Verify no text matching "Copy Link" exists anywhere
    expect(screen.queryByText(/^Copy Link$/i)).toBeNull()
  })
})
