import { Plus } from 'lucide-react'
import { statuses } from './helpers.js'

function FormActions({ saving, label, onCancel }) {
  return (
    <div className="form-actions">
      <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>
      <button className="primary-button" disabled={saving}>
        {saving ? 'Saving…' : <><Plus size={16} /> {label}</>}
      </button>
    </div>
  )
}

export function RequestForm({ form, setForm, clients, assignees, saving, editing, onSubmit, onCancel }) {
  return (
    <form className="data-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <label className="span-two">
          Request title
          <input
            required
            maxLength="255"
            value={form.title || ''}
            onChange={(event) => setForm({ ...form, title: event.target.value })}
            placeholder="e.g. Prepare monthly GST report"
          />
        </label>
        <label>
          Client
          <select required value={form.clientId || ''} onChange={(event) => setForm({ ...form, clientId: event.target.value })}>
            <option value="">Select a client</option>
            {clients.map((client) => <option key={client.client_id} value={client.client_id}>{client.client_name}</option>)}
          </select>
        </label>
        <label>
          Assignee
          <select required value={form.assigneeId || ''} onChange={(event) => setForm({ ...form, assigneeId: event.target.value })}>
            <option value="">Select an assignee</option>
            {assignees.map((assignee) => <option key={assignee.assignee_id} value={assignee.assignee_id}>{assignee.name}</option>)}
          </select>
        </label>
        <label>
          Due date
          <input type="date" required value={form.dueDate || ''} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} />
        </label>
        <label>
          Status
          <select value={form.status || 'Open'} onChange={(event) => setForm({ ...form, status: event.target.value })}>
            {statuses.map((status) => <option key={status}>{status}</option>)}
          </select>
        </label>
        <label className="span-two">
          Description
          <textarea
            rows="3"
            value={form.description || ''}
            onChange={(event) => setForm({ ...form, description: event.target.value })}
            placeholder="Add a little context for your team"
          />
        </label>
      </div>
      {(!clients.length || !assignees.length) && (
        <p className="form-hint">Add at least one client and assignee before creating a request.</p>
      )}
      <div className="form-actions">
        <button type="button" className="secondary-button" onClick={onCancel}>Cancel</button>
        <button className="primary-button" disabled={saving || !clients.length || !assignees.length}>
          {saving ? 'Saving…' : editing ? 'Save changes' : <><Plus size={16} /> Create request</>}
        </button>
      </div>
    </form>
  )
}

export function ClientForm({ form, setForm, saving, onSubmit, onCancel }) {
  return (
    <form className="data-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <label className="span-two">
          Client name
          <input required maxLength="150" value={form.clientName || ''} onChange={(event) => setForm({ ...form, clientName: event.target.value })} />
        </label>
        <label>Company<input value={form.companyName || ''} onChange={(event) => setForm({ ...form, companyName: event.target.value })} /></label>
        <label>Email<input type="email" value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Phone<input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
        <label>Address<input value={form.address || ''} onChange={(event) => setForm({ ...form, address: event.target.value })} /></label>
      </div>
      <FormActions saving={saving} label="Add client" onCancel={onCancel} />
    </form>
  )
}

export function AssigneeForm({ form, setForm, saving, onSubmit, onCancel }) {
  return (
    <form className="data-form" onSubmit={onSubmit}>
      <div className="form-grid">
        <label className="span-two">
          Full name
          <input required maxLength="150" value={form.name || ''} onChange={(event) => setForm({ ...form, name: event.target.value })} />
        </label>
        <label>Email<input required type="email" value={form.email || ''} onChange={(event) => setForm({ ...form, email: event.target.value })} /></label>
        <label>Phone<input value={form.phone || ''} onChange={(event) => setForm({ ...form, phone: event.target.value })} /></label>
      </div>
      <FormActions saving={saving} label="Add assignee" onCancel={onCancel} />
    </form>
  )
}
