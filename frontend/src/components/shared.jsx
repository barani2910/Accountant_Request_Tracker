import { FilePlus2, X } from 'lucide-react'
import { isOverdue } from './helpers.js'

export function StatusBadge({ request }) {
  const overdue = isOverdue(request)
  const className = overdue
    ? 'is-overdue'
    : request.status.toLowerCase().replace(' ', '-')

  return (
    <span className={`status-badge ${className}`}>
      {overdue && <span className="status-dot" />}
      {overdue ? 'Overdue' : request.status}
    </span>
  )
}

export function EmptyState({ title, text }) {
  return (
    <div className="empty-state">
      <span><FilePlus2 size={19} /></span>
      <strong>{title}</strong>
      <small>{text}</small>
    </div>
  )
}

export function Dialog({ title, onClose, children }) {
  function closeOnBackdrop(event) {
    if (event.target === event.currentTarget) onClose()
  }

  return (
    <div className="modal-backdrop" onMouseDown={closeOnBackdrop}>
      <section className="dialog" role="dialog" aria-modal="true" aria-label={title}>
        <header className="dialog-header">
          <div>
            <div className="eyebrow">ACCOUNTING WORKSPACE</div>
            <h2>{title}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close dialog">
            <X size={19} />
          </button>
        </header>
        {children}
      </section>
    </div>
  )
}

export function DetailItem({ label, value }) {
  return (
    <div className="detail-item">
      <small>{label}</small>
      <strong>{value || '—'}</strong>
    </div>
  )
}

export function DetailRequestList({ title, requests = [], otherLabel, onSelect }) {
  return (
    <div className="detail-request-list">
      <div className="mini-list-heading">
        <h4>{title}</h4>
        <span>{requests.length}</span>
      </div>
      {requests.length ? requests.map((request) => (
        <button
          className="detail-request-row"
          key={request.request_id}
          onClick={() => onSelect(request)}
        >
          <span>
            <strong>{request.title}</strong>
            <small>{request[otherLabel]}</small>
          </span>
          <span className="detail-row-end">
            <small>{dateLabel(request.due_date)}</small>
            <StatusBadge request={request} />
          </span>
        </button>
      )) : <p className="no-requests">No requests linked yet.</p>}
    </div>
  )
}

