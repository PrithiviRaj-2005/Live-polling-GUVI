import { useEffect, useMemo, useState } from 'react'
import './App.css'

const API = import.meta.env.VITE_API_URL || 'http://localhost:8080/api'

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    }
  })
  const data = await response.json().catch(() => ({}))
  if (!response.ok) {
    throw new Error(data.error || 'Something went wrong')
  }
  return data
}

import { sharePoll } from './share'

function Logo({ variant = 'dark' }) {
  return (
    <div className="brand-logo">
      <div className="brand-icon">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M22 12h-4l-3 9L9 3l-3 9H2" />
        </svg>
      </div>
      <span className={`brand-name ${variant === 'light' ? 'light' : ''}`}>
        Points<span className="brand-dot">.</span>
      </span>
      <span className="brand-badge">LIVE</span>
    </div>
  )
}

function Navbar({ user, onSignOut, rightContent }) {
  return (
    <header className="navbar">
      <div className="navbar-inner">
        <Logo />
        <div className="navbar-actions">
          {rightContent}
          {user && (
            <div className="user-profile-badge">
              <div className="user-avatar">
                {user.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
              </div>
              <span className="user-name">{user.name}</span>
            </div>
          )}
          {onSignOut && (
            <button className="btn btn-ghost btn-sm" onClick={onSignOut} title="Sign Out">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
              </svg>
              <span>Sign out</span>
            </button>
          )}
        </div>
      </div>
    </header>
  )
}

function Auth({ onSignedIn }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const data = await request(`/auth/${mode === 'login' ? 'login' : 'signup'}`, {
        method: 'POST',
        body: JSON.stringify(form)
      })
      localStorage.setItem('pulse-token', data.token)
      onSignedIn(data.user)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="auth-split-wrapper">
      {/* Left Deep Navy Hero Section */}
      <section className="auth-hero-pane">
        <Logo variant="light" />

        <div className="hero-content">
          <div className="hero-eyebrow">
            <span className="pulse-dot" /> REALTIME AUDIENCE POLLING
          </div>
          <h1 className="hero-title">
            Turn every voice<br />
            into a <em>live count.</em>
          </h1>
          <p className="hero-desc">
            Beautifully simple, instant polls for all hands, product launches, classrooms, and engineering syncs. Streamed with sub-second latency.
          </p>

          {/* Abstract Polling / Data Visualization Mock Card */}
          <div className="hero-mock-card">
            <div className="mock-card-header">
              <span className="mock-status">
                <span className="pulse-dot" /> STREAMING LIVE
              </span>
              <span className="mock-count">142 votes recorded</span>
            </div>
            <div className="mock-question">
              Which strategic initiative matters most for next quarter?
            </div>
            <div className="mock-options-list">
              <div className="mock-option-row">
                <div className="mock-option-meta">
                  <span>AI Copilot Integration</span>
                  <strong>68%</strong>
                </div>
                <div className="mock-bar-track">
                  <div className="mock-bar-fill" style={{ width: '68%' }} />
                </div>
              </div>
              <div className="mock-option-row">
                <div className="mock-option-meta">
                  <span>Realtime Engine Performance</span>
                  <strong>24%</strong>
                </div>
                <div className="mock-bar-track">
                  <div className="mock-bar-fill" style={{ width: '24%', background: '#3B82F6' }} />
                </div>
              </div>
              <div className="mock-option-row">
                <div className="mock-option-meta">
                  <span>Mobile Companion App</span>
                  <strong>8%</strong>
                </div>
                <div className="mock-bar-track">
                  <div className="mock-bar-fill" style={{ width: '8%', background: '#64748B' }} />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="hero-footer-chips">
          <div className="hero-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" />
            </svg>
            Sub-second SSE Stream
          </div>
          <div className="hero-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            </svg>
            Duplicate Vote Prevention
          </div>
          <div className="hero-chip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <polyline points="12 6 12 12 16 14" />
            </svg>
            Zero Page Refreshes
          </div>
        </div>
      </section>

      {/* Right Modern Auth Card Pane */}
      <section className="auth-card-pane">
        <div className="auth-card">
          <div className="auth-mobile-logo">
            <Logo />
          </div>

          <div className="auth-segmented-control">
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'login' ? 'active' : ''}`}
              onClick={() => { setMode('login'); setError('') }}
            >
              Sign In
            </button>
            <button
              type="button"
              className={`auth-tab-btn ${mode === 'signup' ? 'active' : ''}`}
              onClick={() => { setMode('signup'); setError('') }}
            >
              Create Account
            </button>
          </div>

          <div className="auth-card-head">
            <h2 className="auth-card-title">
              {mode === 'login' ? 'Welcome back' : 'Start your count'}
            </h2>
            <p className="auth-card-sub">
              {mode === 'login'
                ? 'Sign in to access your polling dashboard and launch live sessions.'
                : 'Create an account to build questions and broadcast live results in seconds.'}
            </p>
          </div>

          <form onSubmit={submit}>
            {mode === 'signup' && (
              <div className="form-group">
                <label className="form-label">Full Name</label>
                <div className="input-wrapper">
                  <span className="input-icon">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                      <circle cx="12" cy="7" r="4" />
                    </svg>
                  </span>
                  <input
                    required
                    className="form-input has-icon"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    placeholder="Alex Morgan"
                  />
                </div>
              </div>
            )}

            <div className="form-group">
              <label className="form-label">Email Address</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="20" height="16" x="2" y="4" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </span>
                <input
                  required
                  type="email"
                  className="form-input has-icon"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  placeholder="alex@company.com"
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-wrapper">
                <span className="input-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                </span>
                <input
                  required
                  minLength={6}
                  type="password"
                  className="form-input has-icon"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  placeholder="Minimum 6 characters"
                />
              </div>
            </div>

            {error && (
              <div className="alert alert-error">
                <span className="alert-icon">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="8" x2="12" y2="12" />
                    <line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                </span>
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary auth-submit-btn" disabled={busy}>
              {busy ? (
                <>
                  <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderTopColor: '#fff' }} />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <span>{mode === 'login' ? 'Sign In to Dashboard' : 'Create Points Account'}</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </>
              )}
            </button>
          </form>

          <div className="auth-footer-toggle">
            <span>{mode === 'login' ? "Don't have an account yet?" : 'Already registered?'}</span>
            <button
              type="button"
              className="auth-toggle-link"
              onClick={() => { setMode(mode === 'login' ? 'signup' : 'login'); setError('') }}
            >
              {mode === 'login' ? 'Create one now' : 'Sign in here'}
            </button>
          </div>
        </div>
      </section>
    </main>
  )
}

function CreatePoll({ user, onCreated }) {
  const [question, setQuestion] = useState('')
  const [options, setOptions] = useState(['', ''])
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  function updateOption(index, value) {
    setOptions(options.map((item, i) => (i === index ? value : item)))
  }

  async function submit(event) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const poll = await request('/polls', {
        method: 'POST',
        headers: { Authorization: `Bearer ${localStorage.getItem('pulse-token')}` },
        body: JSON.stringify({ question, options })
      })
      onCreated(poll)
    } catch (err) {
      setError(err.message)
    } finally {
      setBusy(false)
    }
  }

  function handleSignOut() {
    localStorage.removeItem('pulse-token')
    window.location.reload()
  }

  return (
    <div className="workspace-shell">
      <Navbar user={user} onSignOut={handleSignOut} />

      <main className="main-content">
        <div className="creator-layout">
          {/* Left Form Column */}
          <div className="creator-main-column">
            <div className="creator-header">
              <div className="creator-badge">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.12 2.12 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                </svg>
                POLL BUILDER
              </div>
              <h1 className="creator-title">Create your poll.</h1>
              <p className="creator-sub">
                Build a crisp question for your team or audience. Results stream in realtime the instant votes land.
              </p>
            </div>

            <div className="builder-card">
              <form onSubmit={submit}>
                <div className="section-label-row">
                  <label className="builder-section-title">Your Question</label>
                  <span className="char-counter">{question.length} chars</span>
                </div>
                <textarea
                  className="question-textarea"
                  required
                  minLength={5}
                  value={question}
                  onChange={e => setQuestion(e.target.value)}
                  placeholder="e.g., What should we prioritize in our next sprint release?"
                />

                <div className="options-builder-header">
                  <label className="builder-section-title">Answer Options</label>
                  <span className="options-count-badge">{options.length} of 6 maximum</span>
                </div>

                <div className="option-edit-list">
                  {options.map((option, index) => (
                    <div className="option-edit-row" key={index}>
                      <span className="option-badge-num">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <input
                        className="option-input"
                        required
                        value={option}
                        onChange={e => updateOption(index, e.target.value)}
                        placeholder={`Option ${index + 1} (e.g. Strongly Agree)`}
                      />
                      {options.length > 2 && (
                        <button
                          type="button"
                          className="btn-remove-option"
                          aria-label="Remove option"
                          title="Remove option"
                          onClick={() => setOptions(options.filter((_, i) => i !== index))}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <line x1="18" y1="6" x2="6" y2="18" />
                            <line x1="6" y1="6" x2="18" y2="18" />
                          </svg>
                        </button>
                      )}
                    </div>
                  ))}
                </div>

                {options.length < 6 && (
                  <button
                    type="button"
                    className="btn-add-option"
                    onClick={() => setOptions([...options, ''])}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    <span>Add Another Option</span>
                  </button>
                )}

                {error && (
                  <div className="alert alert-error">
                    <span className="alert-icon">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <circle cx="12" cy="12" r="10" />
                        <line x1="12" y1="8" x2="12" y2="12" />
                        <line x1="12" y1="16" x2="12.01" y2="16" />
                      </svg>
                    </span>
                    <span>{error}</span>
                  </div>
                )}

                <div className="creator-actions">
                  <button type="submit" className="btn btn-primary btn-lg" disabled={busy}>
                    {busy ? (
                      <>
                        <div className="spinner" style={{ width: '18px', height: '18px', borderWidth: '2px', borderTopColor: '#fff' }} />
                        <span>Launching...</span>
                      </>
                    ) : (
                      <>
                        <span>Launch Live Poll</span>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="22" y1="2" x2="11" y2="13" />
                          <polygon points="22 2 15 22 11 13 2 9 22 2" />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>

          {/* Right Live Preview Column (Desktop) */}
          <aside className="preview-pane">
            <div className="preview-card">
              <div className="preview-header">
                <span className="preview-pill">
                  <span className="pulse-dot" /> Live Audience Preview
                </span>
                <span className="brand-badge">PREVIEW</span>
              </div>

              <div className="preview-mock-body">
                <div className={`preview-mock-q ${!question ? 'placeholder' : ''}`}>
                  {question || 'Your poll question will preview here as you type...'}
                </div>

                <div className="preview-options-list">
                  {options.map((opt, i) => (
                    <div className="preview-mock-option" key={i}>
                      <span className="preview-radio-fake" />
                      <span>{opt || `Option ${i + 1}`}</span>
                    </div>
                  ))}
                </div>

                <div className="preview-footer-note">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <line x1="12" y1="16" x2="12" y2="12" />
                    <line x1="12" y1="8" x2="12.01" y2="8" />
                  </svg>
                  <span>Results update automatically in realtime via SSE when votes are submitted.</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>
    </div>
  )
}

export function PollView({ poll, initialResult, onBack }) {
  const [result, setResult] = useState(initialResult)
  const [selected, setSelected] = useState('')
  const [voted, setVoted] = useState(false)
  const [error, setError] = useState('')
  const total = result?.total || 0

  useEffect(() => {
    if (typeof EventSource === 'undefined') return
    try {
      const stream = new EventSource(`${API}/polls/${poll.id}/stream`)
      stream.onmessage = event => {
        try {
          setResult(JSON.parse(event.data))
        } catch {
          // Safe parse
        }
      }
      return () => stream.close()
    } catch {
      // Safe fallback if stream cannot be opened
    }
  }, [poll.id])

  const ranked = useMemo(() => {
    return [...poll.options].sort(
      (a, b) => (result?.counts?.[b.id] || 0) - (result?.counts?.[a.id] || 0)
    )
  }, [poll.options, result])

  const maxVotes = useMemo(() => {
    if (!result?.counts) return 0
    return Math.max(0, ...Object.values(result.counts))
  }, [result])

  async function vote() {
    if (!selected) return
    setError('')
    try {
      const next = await request(`/polls/${poll.id}/vote`, {
        method: 'POST',
        body: JSON.stringify({ optionId: selected })
      })
      setResult(next)
      setVoted(true)
    } catch (err) {
      setError(err.message)
    }
  }

  async function handleShare() {
    const url = window.location.href
    const res = await sharePoll(url)
    if (res.success) {
      if (res.method === 'share') {
        setError('Link shared successfully')
      } else {
        setError('Link copied to clipboard')
      }
    } else if (!res.aborted) {
      setError('Unable to share link. Please copy the URL manually.')
    }
  }

  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'

  return (
    <div className="workspace-shell">
      <Navbar
        rightContent={
          <span className="live-pill">
            <span className="pulse-dot" /> STREAMING LIVE
          </span>
        }
      />

      <main className="main-content">
        <div className="poll-view-layout">
          {/* Left Voting Card */}
          <section className="poll-voting-card">
            <div className="poll-card-meta">
              <span className="live-pill">
                <span className="pulse-dot" /> {total} {total === 1 ? 'response' : 'responses'}
              </span>
            </div>

            <h1 className="poll-question-heading">{poll.question}</h1>

            {!voted ? (
              <div className="voting-action-block">
                <div className="voting-options-list">
                  {poll.options.map((option, idx) => {
                    const isSelected = selected === option.id
                    return (
                      <button
                        type="button"
                        className={`vote-option-card ${isSelected ? 'selected' : ''}`}
                        key={option.id}
                        onClick={() => setSelected(option.id)}
                      >
                        <div className="vote-option-left">
                          <span className="option-index-pill">
                            {alphabet[idx] || idx + 1}
                          </span>
                          <span className="vote-option-text">{option.label}</span>
                        </div>
                        <span className="vote-radio-indicator">
                          {isSelected && <span className="vote-radio-dot" />}
                        </span>
                      </button>
                    )
                  })}
                </div>

                <button
                  className="btn btn-primary btn-submit-vote"
                  disabled={!selected}
                  onClick={vote}
                >
                  <span>Submit Vote</span>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <line x1="5" y1="12" x2="19" y2="12" />
                    <polyline points="12 5 19 12 12 19" />
                  </svg>
                </button>
              </div>
            ) : (
              <div className="vote-success-card">
                <div className="success-icon-badge">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                </div>
                <h2 className="success-title">Response recorded.</h2>
                <p className="success-desc">
                  Your vote has been atomically counted. Watch the live results panel update in realtime.
                </p>
              </div>
            )}

            {error && (
              <div style={{ marginTop: '20px' }} className={`alert ${error.includes('copied') || error.includes('shared successfully') ? 'alert-notice' : 'alert-error'}`}>
                <span className="alert-icon">
                  {error.includes('copied') || error.includes('shared successfully') ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                  )}
                </span>
                <span>{error}</span>
              </div>
            )}
          </section>

          {/* Right Live Results Card */}
          <section className="poll-results-card">
            <div className="results-header">
              <div>
                <h2 className="results-title">Live Results</h2>
                <span className="results-stream-tag">
                  <span className="pulse-dot" /> Realtime SSE Stream
                </span>
              </div>
              <span className="results-total-badge">
                {total} {total === 1 ? 'total vote' : 'total votes'}
              </span>
            </div>

            <div className="results-list">
              {ranked.map((option, index) => {
                const count = result?.counts?.[option.id] || 0
                const percent = total ? Math.round((count / total) * 100) : 0
                const isLeading = maxVotes > 0 && count === maxVotes
                const fillClasses = [
                  'fill-primary',
                  'fill-accent-1',
                  'fill-accent-2',
                  'fill-accent-3',
                  'fill-accent-4'
                ]
                const fillClass = isLeading ? 'fill-primary' : fillClasses[(index % 4) + 1]

                return (
                  <div className="result-item" key={option.id}>
                    <div className="result-meta-row">
                      <div className="result-label-group">
                        <span className="result-label-text" title={option.label}>
                          {option.label}
                        </span>
                        {isLeading && (
                          <span className="leading-badge">
                            ★ Leading
                          </span>
                        )}
                      </div>
                      <div className="result-numbers">
                        <strong className="result-percent">{percent}%</strong>
                        <span className="result-votes">
                          {count} {count === 1 ? 'vote' : 'votes'}
                        </span>
                      </div>
                    </div>
                    <div className="progress-track">
                      <div
                        className={`progress-bar-fill ${fillClass}`}
                        style={{ width: `${percent}%` }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>

            <div className="results-footer-actions">
              <button className="btn btn-secondary btn-sm" onClick={onBack}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="19" y1="12" x2="5" y2="12" />
                  <polyline points="12 19 5 12 12 5" />
                </svg>
                <span>Create another poll</span>
              </button>
              <button className="btn btn-primary btn-sm" onClick={handleShare}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                  <polyline points="16 6 12 2 8 6" />
                  <line x1="12" y1="2" x2="12" y2="15" />
                </svg>
                <span>Share Live Link</span>
              </button>
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}

function App() {
  const [user, setUser] = useState(null)
  const [poll, setPoll] = useState(null)
  const [result, setResult] = useState(null)
  const sharedPollID = window.location.pathname.match(/^\/poll\/([^/]+)$/)?.[1]
  const [loading, setLoading] = useState(() => Boolean(sharedPollID || localStorage.getItem('pulse-token')))
  const [sharedError, setSharedError] = useState(false)

  useEffect(() => {
    if (sharedPollID) {
      request(`/polls/${sharedPollID}`)
        .then(data => {
          setPoll(data.poll)
          setResult(data.result)
        })
        .catch(() => setSharedError(true))
        .finally(() => setLoading(false))
      return
    }

    const token = localStorage.getItem('pulse-token')
    if (!token) return

    request('/auth/me', {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then(data => setUser(data.user))
      .catch(() => localStorage.removeItem('pulse-token'))
      .finally(() => setLoading(false))
  }, [sharedPollID])

  if (loading) {
    return (
      <div className="state-center-wrapper">
        <div className="state-icon-box">
          <div className="spinner" />
        </div>
        <h2 className="state-title">Loading Workspace...</h2>
        <p className="state-desc">Connecting to the live event stream and retrieving poll session.</p>
      </div>
    )
  }

  if (sharedError) {
    return (
      <div className="state-center-wrapper">
        <div className="state-icon-box" style={{ color: 'var(--danger)' }}>
          <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <line x1="15" y1="9" x2="9" y2="15" />
            <line x1="9" y1="9" x2="15" y2="15" />
          </svg>
        </div>
        <h2 className="state-title">Poll Not Found</h2>
        <p className="state-desc">This poll may have expired or the link provided is invalid.</p>
        <button
          className="btn btn-primary"
          onClick={() => {
            window.history.pushState({}, '', '/')
            window.location.reload()
          }}
        >
          Return to Dashboard
        </button>
      </div>
    )
  }

  if (!user && !sharedPollID) {
    return <Auth onSignedIn={setUser} />
  }

  if (!poll) {
    return (
      <CreatePoll
        user={user}
        onCreated={created => {
          window.history.pushState({}, '', `/poll/${created.id}`)
          setPoll(created)
          setResult({
            counts: Object.fromEntries(created.options.map(option => [option.id, 0])),
            total: 0
          })
        }}
      />
    )
  }

  return (
    <PollView
      poll={poll}
      initialResult={result}
      onBack={() => {
        window.history.pushState({}, '', '/')
        setPoll(null)
        setResult(null)
      }}
    />
  )
}

export default App
