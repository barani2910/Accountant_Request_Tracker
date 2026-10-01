import { useEffect, useState } from 'react'
import { Activity, AlertTriangle, Check, X } from 'lucide-react'
import { api, loadWorkspace } from '../services/api.js'
import { AssistantButton, ChatPanel, Sidebar, TopBar } from './WorkspaceChrome.jsx'
import { RequestForm, ClientForm, AssigneeForm } from './RequestForms.jsx'
import { RequestDetail, ClientDetail, AssigneeDetail } from './RecordDetails.jsx'
import { Overview, RequestsView, PeopleView } from './WorkspaceViews.jsx'
import { dialogTitle, isOverdue } from './helpers.js'
import { Dialog } from './shared.jsx'
import '../tracker.css'

const emptyForm = {
  clientId: '',
  assigneeId: '',
  title: '',
  description: '',
  dueDate: '',
  status: 'Open',
}

function TrackerWorkspace() {
  const [activeView, setActiveView] = useState('Overview')
  const [requests, setRequests] = useState([])
  const [clients, setClients] = useState([])
  const [assignees, setAssignees] = useState([])
  const [counts, setCounts] = useState({})
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('All requests')
  const [modal, setModal] = useState(null)
  const [selected, setSelected] = useState(null)
  const [detail, setDetail] = useState(null)
  const [form, setForm] = useState(emptyForm)
  const [saving, setSaving] = useState(false)
  const [pageError, setPageError] = useState('')
  const [notice, setNotice] = useState('')
  const [chatOpen, setChatOpen] = useState(false)
  const [chatInput, setChatInput] = useState('')
  const [chatLoading, setChatLoading] = useState(false)
  const [messages, setMessages] = useState([
    { from: 'assistant', text: 'Hello! Ask me about a client, an assignee, or your requests.' },
  ])

  async function refresh() {
    try {
      const [requestData, clientData, assigneeData, dashboard] = await loadWorkspace()
      setRequests(requestData)
      setClients(clientData)
      setAssignees(assigneeData)
      setCounts(dashboard)
      setPageError('')
    } catch (error) {
      setPageError(`${error.message} Start MySQL and the backend, then refresh.`)
    }
  }

  useEffect(() => {
    let ignore = false

    loadWorkspace().then(([requestData, clientData, assigneeData, dashboard]) => {
      if (ignore) return
      setRequests(requestData)
      setClients(clientData)
      setAssignees(assigneeData)
      setCounts(dashboard)
    }).catch((error) => {
      if (!ignore) setPageError(`${error.message} Start MySQL and the backend, then refresh.`)
    })

    return () => { ignore = true }
  }, [])

  const visibleRequests = requests.filter((request) => {
    const searchText = `${request.title} ${request.client_name} ${request.assignee_name}`.toLowerCase()
    const matchesSearch = searchText.includes(query.toLowerCase())
    const matchesFilter = filter === 'All requests'
      || (filter === 'Overdue' ? isOverdue(request) : request.status === filter)
    return matchesSearch && matchesFilter
  })

  function openCreate(kind) {
    setSelected(null)
    setDetail(null)
    setForm(emptyForm)
    setModal(kind)
  }

  async function openDetails(kind, id) {
    setPageError('')
    try {
      const record = await api(`/${kind}/${id}`)
      setDetail(record)
      setSelected(kind === 'requests' ? record : null)
      setModal(`${kind}-detail`)
    } catch (error) {
      setPageError(error.message)
    }
  }

  function editRequest(request) {
    setSelected(request)
    setForm({
      clientId: request.client_id,
      assigneeId: request.assignee_id,
      title: request.title,
      description: request.description || '',
      dueDate: String(request.due_date).slice(0, 10),
      status: request.status,
    })
    setModal('request-form')
  }

  async function submitForm(event) {
    event.preventDefault()
    setSaving(true)
    setPageError('')

    try {
      let response
      if (modal === 'client-form') {
        response = await api('/clients', {
          method: 'POST',
          body: JSON.stringify({
            clientName: form.clientName,
            companyName: form.companyName,
            email: form.email,
            phone: form.phone,
            address: form.address,
          }),
        })
      } else if (modal === 'assignee-form') {
        response = await api('/assignees', {
          method: 'POST',
          body: JSON.stringify({ name: form.name, email: form.email, phone: form.phone }),
        })
      } else {
        response = await api(selected ? `/requests/${selected.request_id}` : '/requests', {
          method: selected ? 'PUT' : 'POST',
          body: JSON.stringify(form),
        })
      }

      setNotice(response.message || 'Changes saved successfully.')
      setModal(null)
      await refresh()
    } catch (error) {
      setPageError(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function updateStatus(requestId, status) {
    try {
      await api(`/requests/${requestId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      setNotice('Request status updated.')
      setModal(null)
      await refresh()
    } catch (error) {
      setPageError(error.message)
    }
  }

  async function deleteRequest(requestId) {
    if (!window.confirm('Delete this request? This cannot be undone.')) return

    try {
      await api(`/requests/${requestId}`, { method: 'DELETE' })
      setModal(null)
      setNotice('Request deleted.')
      await refresh()
    } catch (error) {
      setPageError(error.message)
    }
  }

  async function sendReminders() {
    setNotice('Checking overdue requests…')

    try {
      const result = await api('/reminders/check', { method: 'POST' })
      const failedMessage = result.failed.length ? `${result.failed.length} failed; check SMTP settings.` : ''
      setNotice(`${result.sent} reminder${result.sent === 1 ? '' : 's'} sent. ${failedMessage}`)
    } catch (error) {
      setNotice(error.message)
    }
  }

  async function sendChat(event) {
    event.preventDefault()
    const question = chatInput.trim()
    if (!question || chatLoading) return

    setMessages((current) => [...current, { from: 'user', text: question }])
    setChatInput('')
    setChatLoading(true)

    try {
      const result = await api('/chat', {
        method: 'POST',
        body: JSON.stringify({ question }),
      })
      setMessages((current) => [...current, {
        from: 'assistant',
        text: result.answer,
        source: result.source,
      }])
    } catch (error) {
      setMessages((current) => [...current, { from: 'assistant', text: error.message }])
    } finally {
      setChatLoading(false)
    }
  }

  return (
    <div className="app-shell">
      <Sidebar
        activeView={activeView}
        requestCount={counts.total || 0}
        onChangeView={setActiveView}
        onOpenChat={() => setChatOpen(true)}
      />

      <main className="main-area">
        <TopBar activeView={activeView} />
        <div className="content-area">
          {pageError && (
            <div className="alert error-alert">
              <AlertTriangle size={17} />
              <span>{pageError}</span>
              <button onClick={refresh} aria-label="Retry"><Activity size={16} /></button>
            </div>
          )}
          {notice && (
            <div className="notice-bar">
              <Check size={16} />{notice}
              <button onClick={() => setNotice('')} aria-label="Dismiss"><X size={15} /></button>
            </div>
          )}

          {activeView === 'Overview' && (
            <Overview
              counts={counts}
              requests={requests}
              onViewAll={() => setActiveView('Requests')}
              onAssignees={() => setActiveView('Assignees')}
              onSelect={(request) => openDetails('requests', request.request_id)}
              onNew={() => openCreate('request-form')}
              onReminders={sendReminders}
            />
          )}
          {activeView === 'Requests' && (
            <RequestsView
              requests={visibleRequests}
              filter={filter}
              query={query}
              setFilter={setFilter}
              setQuery={setQuery}
              onNew={() => openCreate('request-form')}
              onSelect={(request) => openDetails('requests', request.request_id)}
              onStatus={updateStatus}
            />
          )}
          {activeView === 'Clients' && (
            <PeopleView
              kind="clients"
              rows={clients}
              onNew={() => openCreate('client-form')}
              onSelect={(client) => openDetails('clients', client.client_id)}
            />
          )}
          {activeView === 'Assignees' && (
            <PeopleView
              kind="assignees"
              rows={assignees}
              onNew={() => openCreate('assignee-form')}
              onSelect={(assignee) => openDetails('assignees', assignee.assignee_id)}
            />
          )}
        </div>
      </main>

      <AssistantButton isOpen={chatOpen} onClick={() => setChatOpen((open) => !open)} />
      {chatOpen && (
        <ChatPanel
          messages={messages}
          input={chatInput}
          setInput={setChatInput}
          loading={chatLoading}
          onSubmit={sendChat}
          onClose={() => setChatOpen(false)}
        />
      )}

      {modal && (
        <Dialog title={dialogTitle(modal, selected, detail)} onClose={() => setModal(null)}>
          {modal === 'request-form' && (
            <RequestForm
              form={form}
              setForm={setForm}
              clients={clients}
              assignees={assignees}
              saving={saving}
              editing={Boolean(selected)}
              onSubmit={submitForm}
              onCancel={() => setModal(null)}
            />
          )}
          {modal === 'client-form' && (
            <ClientForm form={form} setForm={setForm} saving={saving} onSubmit={submitForm} onCancel={() => setModal(null)} />
          )}
          {modal === 'assignee-form' && (
            <AssigneeForm form={form} setForm={setForm} saving={saving} onSubmit={submitForm} onCancel={() => setModal(null)} />
          )}
          {modal === 'requests-detail' && detail && (
            <RequestDetail
              request={detail}
              onEdit={() => editRequest(detail)}
              onDelete={() => deleteRequest(detail.request_id)}
              onStatus={(status) => updateStatus(detail.request_id, status)}
            />
          )}
          {modal === 'clients-detail' && detail && (
            <ClientDetail client={detail} onRequest={(request) => openDetails('requests', request.request_id)} />
          )}
          {modal === 'assignees-detail' && detail && (
            <AssigneeDetail assignee={detail} onRequest={(request) => openDetails('requests', request.request_id)} />
          )}
        </Dialog>
      )}
    </div>
  )
}

export default TrackerWorkspace
