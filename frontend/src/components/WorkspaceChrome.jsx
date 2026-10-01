import {
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  CircleHelp,
  FileText,
  LayoutDashboard,
  MessageCircle,
  Send,
  Settings2,
  Users,
  X,
} from 'lucide-react'

const currentDate = new Date().toLocaleDateString('en-US', {
  month: 'long',
  day: 'numeric',
  year: 'numeric',
})

export function Sidebar({ activeView, requestCount, onChangeView, onOpenChat }) {
  const navigationItems = [
    { label: 'Overview', icon: LayoutDashboard },
    { label: 'Requests', icon: FileText },
    { label: 'Clients', icon: Building2 },
    { label: 'Assignees', icon: Users },
  ]

  return (
    <aside className="sidebar">
      <a className="brand" href="#overview" onClick={() => onChangeView('Overview')}>
        <span className="brand-mark"><BriefcaseBusiness size={19} strokeWidth={2.2} /></span>
        <span className="brand-title">
          Accountant<br />Request Tracker
          <small>ACCOUNTING WORKSPACE</small>
        </span>
      </a>
      <div className="workspace-label">WORKSPACE</div>
      <nav className="main-nav" aria-label="Main navigation">
        {navigationItems.map(({ label, icon: Icon }) => (
          <button
            key={label}
            className={`nav-item ${activeView === label ? 'active' : ''}`}
            onClick={() => onChangeView(label)}
          >
            <Icon size={18} strokeWidth={1.8} />
            <span>{label}</span>
            {label === 'Requests' && <span className="nav-count">{requestCount}</span>}
          </button>
        ))}
      </nav>
      <div className="sidebar-bottom">
        <div className="sidebar-help">
          <span className="help-icon"><CircleHelp size={17} /></span>
          <span><strong>Need a hand?</strong><small>Ask the assistant</small></span>
          <button aria-label="Open assistant" onClick={onOpenChat}><ArrowUpRight size={16} /></button>
        </div>
        <div className="profile-row">
          <div className="avatar avatar-owner">BM</div>
          <div><strong>Baranidharan M</strong><small>Accountant</small></div>
          <Settings2 size={17} className="profile-settings" />
        </div>
      </div>
    </aside>
  )
}

export function TopBar({ activeView }) {
  return (
    <header className="topbar">
      <div className="breadcrumb">Workspace <span>/</span> <strong>{activeView}</strong></div>
      <div className="top-actions">
        <span className="today-label"><CalendarDays size={15} /> {currentDate}</span>
        <button className="icon-button notification-button" aria-label="Notifications"><Bell size={18} /><i /></button>
        <div className="avatar avatar-owner top-avatar">BM</div>
      </div>
    </header>
  )
}

export function AssistantButton({ isOpen, onClick }) {
  return (
    <button className="assistant-fab" onClick={onClick} aria-label={isOpen ? 'Close assistant' : 'Open assistant'}>
      {isOpen ? <X size={20} /> : <MessageCircle size={20} />}
      <span>{isOpen ? 'Close' : 'Ask assistant'}</span>
    </button>
  )
}

export function ChatPanel({ messages, input, setInput, loading, onSubmit, onClose }) {
  return (
    <section className="chat-panel" aria-label="Accountant assistant">
      <header className="chat-header">
        <div className="assistant-avatar"><MessageCircle size={17} /></div>
        <div><strong>Accountant Assistant</strong><small><span className="online-dot" /> Ready when you are</small></div>
        <button onClick={onClose} aria-label="Close chat"><X size={18} /></button>
      </header>
      <div className="chat-messages" aria-live="polite">
        {messages.map((message, index) => (
          <div className={`chat-message ${message.from}`} key={`${message.from}-${index}`}>
            <span>{message.text}</span>
            {message.source && (
              <small>
                {message.source === 'application'
                  ? 'Workspace data'
                  : message.source === 'llm'
                    ? 'General answer'
                    : 'Setup note'}
              </small>
            )}
          </div>
        ))}
        {loading && <div className="chat-message assistant"><span className="typing-dots">Thinking…</span></div>}
      </div>
      <form className="chat-form" onSubmit={onSubmit}>
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          placeholder="Ask about your workload…"
          aria-label="Ask a question"
        />
        <button type="submit" aria-label="Send question" disabled={loading || !input.trim()}>
          <Send size={17} />
        </button>
      </form>
      <div className="chat-footnote">Workspace answers use your tracker data.</div>
    </section>
  )
}
