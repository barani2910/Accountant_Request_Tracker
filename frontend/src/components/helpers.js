export const statuses = ['Open', 'In Progress', 'Completed']

const appDate = new Date()
export const todayISO = `${appDate.getFullYear()}-${String(appDate.getMonth() + 1).padStart(2, '0')}-${String(appDate.getDate()).padStart(2, '0')}`
export const todayLabel = appDate.toLocaleDateString('en-US', {
  weekday: 'long',
  month: 'long',
  day: 'numeric',
}).toUpperCase()

export function dateLabel(value) {
  if (!value) return '—'

  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`)
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

export function isOverdue(request) {
  return request.status !== 'Completed' && String(request.due_date).slice(0, 10) < todayISO
}

export function dialogTitle(modal, selected, detail) {
  if (modal === 'request-form') return selected ? 'Edit request' : 'New request'
  if (modal === 'client-form') return 'Add a client'
  if (modal === 'assignee-form') return 'Add an assignee'
  if (modal === 'requests-detail') return detail?.title || 'Request details'
  if (modal === 'clients-detail') return detail?.client_name || 'Client details'
  if (modal === 'assignees-detail') return detail?.name || 'Assignee details'
  return 'Details'
}
