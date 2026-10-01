import { Activity, Building2, Mail, Pencil, Trash2 } from 'lucide-react'
import { dateLabel, statuses } from './helpers.js'
import { DetailItem, DetailRequestList, StatusBadge } from './shared.jsx'

export function RequestDetail({ request, onEdit, onDelete, onStatus }) {
  return (
    <div className="detail-content">
      <div className="detail-topline">
        <StatusBadge request={request} />
        <span>REQ-{String(request.request_id).padStart(3, '0')}</span>
      </div>
      <p className="detail-description">{request.description || 'No description provided.'}</p>
      <div className="detail-grid">
        <DetailItem label="Client" value={request.client_name} />
        <DetailItem label="Assignee" value={request.assignee_name} />
        <DetailItem label="Due date" value={dateLabel(request.due_date)} />
        <div className="detail-item">
          <small>Status</small>
          <select value={request.status} onChange={(event) => onStatus(event.target.value)}>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </div>
      </div>
      <div className="detail-actions">
        <button className="danger-button" onClick={onDelete}><Trash2 size={15} /> Delete</button>
        <button className="primary-button" onClick={onEdit}><Pencil size={15} /> Edit request</button>
      </div>
    </div>
  )
}

export function ClientDetail({ client, onRequest }) {
  return (
    <div className="detail-content">
      <div className="identity-heading">
        <span className="person-avatar client-avatar"><Building2 size={20} /></span>
        <div><h3>{client.company_name || client.client_name}</h3><p>{client.client_name}</p></div>
      </div>
      <div className="contact-lines">
        <span><Mail size={15} />{client.email || 'No email on file'}</span>
        <span><Activity size={15} />{client.phone || 'No phone on file'}</span>
      </div>
      <DetailRequestList title="Client requests" requests={client.requests} otherLabel="assignee_name" onSelect={onRequest} />
    </div>
  )
}

export function AssigneeDetail({ assignee, onRequest }) {
  return (
    <div className="detail-content">
      <div className="identity-heading">
        <span className="person-avatar">{assignee.name?.slice(0, 1)}</span>
        <div><h3>{assignee.name}</h3><p>Team assignee</p></div>
      </div>
      <div className="contact-lines">
        <span><Mail size={15} />{assignee.email}</span>
        <span><Activity size={15} />{assignee.phone || 'No phone on file'}</span>
      </div>
      <DetailRequestList title="Assigned requests" requests={assignee.requests} otherLabel="client_name" onSelect={onRequest} />
    </div>
  )
}
