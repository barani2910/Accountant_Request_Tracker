const API = import.meta.env.VITE_API_URL || 'http://localhost:3001/api'

export async function api(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options.headers },
  })
  const payload = response.status === 204 ? null : await response.json()

  if (!response.ok) {
    throw new Error(payload?.error || 'The request could not be completed.')
  }

  return payload
}

export function loadWorkspace() {
  return Promise.all([
    api('/requests'),
    api('/clients'),
    api('/assignees'),
    api('/dashboard'),
  ])
}
