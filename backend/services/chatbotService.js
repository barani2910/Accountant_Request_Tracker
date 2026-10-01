import db from '../db.js'

const requestFields = `r.request_id, r.title, r.description, r.due_date, r.status,
  c.client_name, a.name AS assignee_name`

async function findRequests(where, values = [], suffix = '') {
  const [rows] = await db.execute(`
    SELECT ${requestFields}
    FROM requests r
    JOIN clients c ON c.client_id = r.client_id
    JOIN assignees a ON a.assignee_id = r.assignee_id
    WHERE ${where} ${suffix}
  `, values)
  return rows
}

export async function getClientRequests(clientName, status) {
  const conditions = ['c.client_name LIKE ?']
  const values = [`%${clientName}%`]
  if (status === 'Overdue') conditions.push("r.due_date < CURDATE() AND r.status <> 'Completed'")
  else if (status) { conditions.push('r.status = ?'); values.push(status) }
  return findRequests(conditions.join(' AND '), values, 'ORDER BY r.due_date ASC')
}

export async function getAssigneeRequests(assigneeName, status) {
  const conditions = ['a.name LIKE ?']
  const values = [`%${assigneeName}%`]
  if (status === 'Overdue') conditions.push("r.due_date < CURDATE() AND r.status <> 'Completed'")
  else if (status) { conditions.push('r.status = ?'); values.push(status) }
  return findRequests(conditions.join(' AND '), values, 'ORDER BY r.due_date ASC')
}

export async function getOverdueRequests() {
  return findRequests("r.due_date < CURDATE() AND r.status <> 'Completed'", [], 'ORDER BY r.due_date ASC')
}

export async function getOpenRequests() {
  return findRequests("r.status = 'Open'", [], 'ORDER BY r.due_date ASC')
}

export async function getCompletedRequests() {
  return findRequests("r.status = 'Completed'", [], 'ORDER BY r.due_date ASC')
}

export async function getRequestsDueSoon() {
  return findRequests("r.due_date BETWEEN CURDATE() AND DATE_ADD(CURDATE(), INTERVAL 7 DAY) AND r.status <> 'Completed'", [], 'ORDER BY r.due_date ASC')
}

export async function getClientDetails(clientName) {
  const [rows] = await db.execute('SELECT client_name, email, phone, address FROM clients WHERE client_name LIKE ? LIMIT 1', [`%${clientName}%`])
  return rows[0] || null
}

export async function getAssigneeDetails(assigneeName) {
  const [rows] = await db.execute('SELECT name, email, phone FROM assignees WHERE name LIKE ? LIMIT 1', [`%${assigneeName}%`])
  return rows[0] || null
}

function formatRequests(rows) {
  if (!rows.length) return 'No matching requests found.'
  return rows.map((row) => `${row.title} — ${row.client_name} — ${row.assignee_name} — due ${row.due_date} — ${row.status}`).join('\n')
}

async function answerFromDatabase(question) {
  const text = question.toLowerCase()
  const [clients] = await db.execute('SELECT client_name FROM clients')
  const [assignees] = await db.execute('SELECT name FROM assignees')
  const client = clients.find((item) => text.includes(item.client_name.toLowerCase()))
  const assignee = assignees.find((item) => text.includes(item.name.toLowerCase()))
  const status = text.includes('overdue') ? 'Overdue'
    : text.includes('open') ? 'Open'
      : text.includes('completed') ? 'Completed' : null

  if (text.includes('email') && client) {
    const details = await getClientDetails(client.client_name)
    return details?.email ? `${client.client_name}: ${details.email}` : `No email is saved for ${client.client_name}.`
  }
  if (text.includes('how many') && (client || assignee || status)) {
    const rows = client ? await getClientRequests(client.client_name, status)
      : assignee ? await getAssigneeRequests(assignee.name, status)
        : status === 'Overdue' ? await getOverdueRequests()
          : status ? await findRequests('r.status = ?', [status])
            : await findRequests('1 = 1')
    const noun = status ? status.toLowerCase() : 'total'
    const scope = client ? ` for ${client.client_name}` : assignee ? ` for ${assignee.name}` : ''
    return `There ${rows.length === 1 ? 'is' : 'are'} ${rows.length} ${noun} request${rows.length === 1 ? '' : 's'}${scope}.`
  }
  if (text.includes('due this week') || text.includes('due soon')) {
    return formatRequests(await getRequestsDueSoon())
  }
  if (text.includes('overdue')) return formatRequests(await getOverdueRequests())
  if (client && text.includes('request')) return formatRequests(await getClientRequests(client.client_name, status))
  if (assignee && text.includes('request')) return formatRequests(await getAssigneeRequests(assignee.name, status))
  if (client) {
    const details = await getClientDetails(client.client_name)
    return details ? `${details.client_name}\nEmail: ${details.email || 'Not provided'}\nPhone: ${details.phone || 'Not provided'}\nAddress: ${details.address || 'Not provided'}` : 'Client not found.'
  }
  if (assignee) {
    const details = await getAssigneeDetails(assignee.name)
    return details ? `${details.name}\nEmail: ${details.email}\nPhone: ${details.phone || 'Not provided'}` : 'Assignee not found.'
  }
  if (text.includes('open')) return formatRequests(await getOpenRequests())
  if (text.includes('completed')) return formatRequests(await getCompletedRequests())
  return null
}

export async function answerQuestion(question) {
  const appAnswer = await answerFromDatabase(question)
  if (appAnswer) return { answer: appAnswer, source: 'application' }

  const {
    LLM_API_KEY,
    LLM_BASE_URL = 'https://api.groq.com/openai/v1',
    LLM_MODEL = 'openai/gpt-oss-20b',
  } = process.env
  if (!LLM_API_KEY) {
    return { answer: 'I can answer questions about clients, assignees, and requests. General answers need an LLM_API_KEY in backend/.env.', source: 'configuration' }
  }
  const response = await fetch(`${LLM_BASE_URL.replace(/\/$/, '')}/chat/completions`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${LLM_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: LLM_MODEL, messages: [{ role: 'user', content: question }] }),
  })
  if (!response.ok) throw new Error(`LLM request failed (${response.status}).`)
  const data = await response.json()
  return { answer: data.choices?.[0]?.message?.content || 'The LLM returned an empty answer.', source: 'llm' }
}