import {
  Activity,
  AlertTriangle,
  ArrowDownWideNarrow,
  ArrowUpRight,
  Bell,
  BriefcaseBusiness,
  Building2,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
  Mail,
  Plus,
  Search,
  Users,
} from 'lucide-react'
import { dateLabel, isOverdue, statuses, todayLabel } from './helpers.js'
import { EmptyState, StatusBadge } from './shared.jsx'

export function Overview({ counts, requests, onViewAll, onAssignees, onSelect, onNew, onReminders }) {
  const metricCards = [
    { label: 'Total requests', value: counts.total, icon: FileText, tone: 'mint' },
    { label: 'Open', value: counts.open, icon: Clock3, tone: 'blue' },
    { label: 'In progress', value: counts.inProgress, icon: Activity, tone: 'amber' },
    { label: 'Completed', value: counts.completed, icon: Check, tone: 'green' },
    { label: 'Overdue', value: counts.overdue, icon: AlertTriangle, tone: 'rose' },
  ]
  const overdue = requests.filter(isOverdue).slice(0, 4)
  const upcoming = requests
    .filter((request) => !isOverdue(request) && request.status !== 'Completed')
    .slice(0, 4)
  const activeRequests = requests.filter((request) => request.status !== 'Completed').length
  const assigneeCount = new Set(requests.map((request) => request.assignee_id)).size

  return (
    <>
      <section className="welcome-row">
        <div>
          <div className="eyebrow">{todayLabel}</div>
          <h1>Your books, <em>in order.</em></h1>
          <p>A clear view of your team’s requests and what needs attention.</p>
        </div>
        <div className="heading-actions">
          <button className="secondary-button" onClick={onReminders}>
            <Bell size={15} /> Check reminders
          </button>
          <button className="primary-button" onClick={onNew}>
            <Plus size={17} /> New request
          </button>
        </div>
      </section>

      <section className="metric-grid" aria-label="Request summary">
        {metricCards.map(({ label, value, icon: Icon, tone }) => (
          <article className="metric-card" key={label}>
            <div className={`metric-icon ${tone}`}><Icon size={18} /></div>
            <div className="metric-label">{label}</div>
            <strong>{value ?? '—'}</strong>
            <small>
              {label === 'Overdue'
                ? 'Needs attention'
                : label === 'Total requests'
                  ? 'Across all clients'
                  : 'Current workload'}
            </small>
          </article>
        ))}
      </section>

      <section className="overview-grid">
        <div className="surface request-surface">
          <div className="section-heading">
            <div><div className="eyebrow">PRIORITY QUEUE</div><h2>Needs attention</h2></div>
            <button className="text-button" onClick={onViewAll}>
              View all <ArrowUpRight size={15} />
            </button>
          </div>
          {overdue.length ? (
            <div className="compact-list">
              {overdue.map((request) => (
                <button className="compact-row" key={request.request_id} onClick={() => onSelect(request)}>
                  <span className="request-mark overdue-mark"><AlertTriangle size={16} /></span>
                  <span className="compact-title">
                    <strong>{request.title}</strong>
                    <small>{request.client_name} · {request.assignee_name}</small>
                  </span>
                  <span className="compact-date overdue-date">{dateLabel(request.due_date)}</span>
                  <ArrowUpRight className="row-arrow" size={15} />
                </button>
              ))}
            </div>
          ) : <EmptyState title="Nothing overdue" text="Your team is up to date." />}
        </div>

        <div className="surface upcoming-surface">
          <div className="section-heading">
            <div><div className="eyebrow">COMING UP</div><h2>Next on the list</h2></div>
            <span className="soft-pill"><CalendarDays size={14} /> Next due</span>
          </div>
          {upcoming.length ? (
            <div className="compact-list">
              {upcoming.map((request) => (
                <button className="compact-row" key={request.request_id} onClick={() => onSelect(request)}>
                  <span className="request-mark upcoming-mark"><FileText size={16} /></span>
                  <span className="compact-title">
                    <strong>{request.title}</strong>
                    <small>{request.client_name} · {request.assignee_name}</small>
                  </span>
                  <span className="compact-date">{dateLabel(request.due_date)}</span>
                  <ArrowUpRight className="row-arrow" size={15} />
                </button>
              ))}
            </div>
          ) : <EmptyState title="No upcoming requests" text="New work will appear here." />}
        </div>
      </section>

      <section className="lower-strip">
        <div className="strip-icon"><Users size={18} /></div>
        <span>
          <strong>Team workload</strong>
          <small>{activeRequests} active requests across {assigneeCount} assignees</small>
        </span>
        <button className="text-button" onClick={onAssignees}>
          See assignees <ArrowUpRight size={15} />
        </button>
      </section>
    </>
  )
}

export function RequestsView({ requests, filter, query, setFilter, setQuery, onNew, onSelect, onStatus }) {
  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">WORK MANAGEMENT</div>
          <h1>Requests</h1>
          <p>Keep every deliverable moving, from intake to done.</p>
        </div>
        <button className="primary-button" onClick={onNew}><Plus size={17} /> New request</button>
      </section>

      <section className="surface table-surface">
        <div className="table-toolbar">
          <div className="search-box">
            <Search size={17} />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search requests, clients, assignees"
              aria-label="Search requests"
            />
          </div>
          <label className="filter-select">
            <Filter size={15} />
            <select value={filter} onChange={(event) => setFilter(event.target.value)} aria-label="Filter by status">
              <option>All requests</option>
              <option>Open</option>
              <option>In Progress</option>
              <option>Completed</option>
              <option>Overdue</option>
            </select>
            <ChevronDown size={14} />
          </label>
          <span className="result-count">{requests.length} results</span>
        </div>

        <div className="table-scroll">
          <table>
            <thead>
              <tr>
                <th><span>Request <ArrowDownWideNarrow size={13} /></span></th>
                <th>Client</th>
                <th>Assignee</th>
                <th>Due date</th>
                <th>Status</th>
                <th><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody>
              {requests.map((request) => (
                <tr key={request.request_id}>
                  <td>
                    <button className="request-title-button" onClick={() => onSelect(request)}>
                      <span className="table-file"><FileText size={16} /></span>
                      <span>
                        <strong>{request.title}</strong>
                        <small>REQ-{String(request.request_id).padStart(3, '0')}</small>
                      </span>
                    </button>
                  </td>
                  <td><span className="client-cell">{request.client_name}</span></td>
                  <td>
                    <span className="assignee-cell">
                      <span className="avatar avatar-small">{request.assignee_name?.slice(0, 1)}</span>
                      {request.assignee_name}
                    </span>
                  </td>
                  <td className={isOverdue(request) ? 'due-overdue' : ''}>{dateLabel(request.due_date)}</td>
                  <td>
                    <div className="status-cell-stack">
                      {isOverdue(request) && <StatusBadge request={request} />}
                      <label className="status-select-wrap">
                        <select
                          value={request.status}
                          onChange={(event) => onStatus(request.request_id, event.target.value)}
                          aria-label={`Status for ${request.title}`}
                        >
                          {statuses.map((status) => <option key={status}>{status}</option>)}
                        </select>
                        <ChevronDown size={12} />
                      </label>
                    </div>
                  </td>
                  <td>
                    <button className="row-open" onClick={() => onSelect(request)} aria-label={`View ${request.title}`}>
                      <ArrowUpRight size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {requests.length === 0 && <EmptyState title="No requests found" text="Try another filter or create a request." />}
        </div>
      </section>
    </>
  )
}

export function PeopleView({ kind, rows, onNew, onSelect }) {
  const clients = kind === 'clients'
  const title = clients ? 'Clients' : 'Assignees'
  const addLabel = clients ? 'client' : 'assignee'

  return (
    <>
      <section className="page-heading">
        <div>
          <div className="eyebrow">YOUR DIRECTORY</div>
          <h1>{title}</h1>
          <p>
            {clients
              ? 'Client details and all their open work, together.'
              : 'A quick view of your team and current workload.'}
          </p>
        </div>
        <button className="primary-button" onClick={onNew}><Plus size={17} /> Add {addLabel}</button>
      </section>

      <section className="people-grid">
        {rows.map((row) => (
          <button
            className="person-card"
            key={clients ? row.client_id : row.assignee_id}
            onClick={() => onSelect(row)}
          >
            <span className={`person-avatar ${clients ? 'client-avatar' : ''}`}>
              {clients ? <Building2 size={20} /> : row.name?.slice(0, 1)}
            </span>
            <span className="person-copy">
              <strong>{clients ? row.client_name : row.name}</strong>
              <small>{clients ? row.company_name || 'Client' : row.email}</small>
            </span>
            <ArrowUpRight className="person-arrow" size={16} />
            <span className="person-meta">
              <span>
                {clients ? <Mail size={14} /> : <BriefcaseBusiness size={14} />}
                {clients ? row.email || 'No email on file' : `${row.active_count || 0} active requests`}
              </span>
              <b>{row.request_count || 0} requests</b>
            </span>
          </button>
        ))}
        {rows.length === 0 && (
          <div className="surface empty-directory">
            <EmptyState title={`No ${kind} yet`} text={`Add your first ${addLabel} to get started.`} />
            <button className="primary-button" onClick={onNew}><Plus size={16} /> Add {addLabel}</button>
          </div>
        )}
      </section>
    </>
  )
}
