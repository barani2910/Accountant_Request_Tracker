import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import db from './db.js'
import { answerQuestion } from './services/chatbotService.js'
import { sendAssignmentEmail } from './services/emailService.js'
import { checkReminders, startReminderJob } from './automation/reminderJob.js'

const app = express()
const port = Number(process.env.PORT || 3001)
const requestStatuses = ['Open', 'In Progress', 'Completed']
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

app.use(cors())
app.use(express.json())

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }))

app.get('/api/clients', async (_req, res, next) => {
  try {
    const [clients] = await db.execute(`
      SELECT c.*, COUNT(r.request_id) AS request_count
      FROM clients c LEFT JOIN requests r ON r.client_id = c.client_id
      GROUP BY c.client_id ORDER BY c.client_name
    `)
    res.json(clients)
  } catch (error) { next(error) }
})

app.post('/api/clients', async (req, res, next) => {
  try {
    const { clientName, companyName = '', email = '', phone = '', address = '' } = req.body
    if (!clientName?.trim()) return res.status(400).json({ error: 'Client name is required.' })
    if (email && !emailPattern.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' })
    const [result] = await db.execute(
      'INSERT INTO clients (client_name, company_name, email, phone, address) VALUES (?, ?, ?, ?, ?)',
      [clientName.trim(), companyName, email, phone, address],
    )
    res.status(201).json({ clientId: result.insertId, message: 'Client created.' })
  } catch (error) { next(error) }
})

app.get('/api/clients/:id', async (req, res, next) => {
  try {
    const [clients] = await db.execute('SELECT * FROM clients WHERE client_id = ?', [req.params.id])
    if (!clients[0]) return res.status(404).json({ error: 'Client not found.' })
    const [requests] = await db.execute(`
      SELECT r.request_id, r.title, r.description, r.due_date, r.status, a.name AS assignee_name
      FROM requests r JOIN assignees a ON a.assignee_id = r.assignee_id
      WHERE r.client_id = ? ORDER BY r.due_date ASC
    `, [req.params.id])
    res.json({ ...clients[0], requests })
  } catch (error) { next(error) }
})

app.get('/api/assignees', async (_req, res, next) => {
  try {
    const [assignees] = await db.execute(`
      SELECT a.*, COUNT(r.request_id) AS request_count,
        SUM(CASE WHEN r.status <> 'Completed' THEN 1 ELSE 0 END) AS active_count
      FROM assignees a LEFT JOIN requests r ON r.assignee_id = a.assignee_id
      GROUP BY a.assignee_id ORDER BY a.name
    `)
    res.json(assignees)
  } catch (error) { next(error) }
})

app.post('/api/assignees', async (req, res, next) => {
  try {
    const { name, email, phone = '' } = req.body
    if (!name?.trim()) return res.status(400).json({ error: 'Assignee name is required.' })
    if (!email || !emailPattern.test(email)) return res.status(400).json({ error: 'Enter a valid email address.' })
    const [result] = await db.execute(
      'INSERT INTO assignees (name, email, phone) VALUES (?, ?, ?)', [name.trim(), email.trim(), phone],
    )
    res.status(201).json({ assigneeId: result.insertId, message: 'Assignee created.' })
  } catch (error) { next(error) }
})

app.get('/api/assignees/:id', async (req, res, next) => {
  try {
    const [assignees] = await db.execute('SELECT * FROM assignees WHERE assignee_id = ?', [req.params.id])
    if (!assignees[0]) return res.status(404).json({ error: 'Assignee not found.' })
    const [requests] = await db.execute(`
      SELECT r.request_id, r.title, r.description, r.due_date, r.status, c.client_name
      FROM requests r JOIN clients c ON c.client_id = r.client_id
      WHERE r.assignee_id = ? ORDER BY r.due_date ASC
    `, [req.params.id])
    res.json({ ...assignees[0], requests })
  } catch (error) { next(error) }
})

const requestSelect = `
  SELECT r.request_id, r.client_id, r.assignee_id, r.title, r.description,
    r.due_date, r.status, r.last_reminder_sent, r.created_at, r.updated_at,
    c.client_name, c.company_name, a.name AS assignee_name, a.email AS assignee_email
  FROM requests r JOIN clients c ON c.client_id = r.client_id
  JOIN assignees a ON a.assignee_id = r.assignee_id
`

app.get('/api/requests/overdue', async (_req, res, next) => {
  try {
    const [requests] = await db.execute(`${requestSelect}
      WHERE r.due_date < CURDATE() AND r.status <> 'Completed'
      ORDER BY r.due_date ASC`)
    res.json(requests)
  } catch (error) { next(error) }
})

app.get('/api/requests', async (req, res, next) => {
  try {
    const conditions = []
    const values = []
    if (requestStatuses.includes(req.query.status)) {
      conditions.push('r.status = ?')
      values.push(req.query.status)
    } else if (req.query.status === 'Overdue') {
      conditions.push("r.due_date < CURDATE() AND r.status <> 'Completed'")
    }
    if (req.query.search?.trim()) {
      const search = `%${req.query.search.trim()}%`
      conditions.push('(r.title LIKE ? OR c.client_name LIKE ? OR a.name LIKE ?)')
      values.push(search, search, search)
    }
    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : ''
    const [requests] = await db.execute(`${requestSelect} ${where} ORDER BY r.due_date ASC`, values)
    res.json(requests)
  } catch (error) { next(error) }
})

app.post('/api/requests', async (req, res, next) => {
  try {
    const { clientId, assigneeId, title, description = '', dueDate, status = 'Open' } = req.body
    if (!clientId || !assigneeId || !title?.trim() || !dueDate) {
      return res.status(400).json({ error: 'Client, assignee, title, and due date are required.' })
    }
    if (!requestStatuses.includes(status)) return res.status(400).json({ error: 'Choose a valid request status.' })
    if (Number.isNaN(Date.parse(dueDate))) return res.status(400).json({ error: 'Enter a valid due date.' })
    const [result] = await db.execute(
      'INSERT INTO requests (client_id, assignee_id, title, description, due_date, status) VALUES (?, ?, ?, ?, ?, ?)',
      [clientId, assigneeId, title.trim(), description, dueDate, status],
    )

    let emailSent = false
    try {
      const [requests] = await db.execute(`${requestSelect} WHERE r.request_id = ?`, [result.insertId])
      await sendAssignmentEmail(requests[0])
      emailSent = true
    } catch (error) {
      console.error('Assignment email failed:', error.message)
    }

    const message = emailSent
      ? 'Request created and assignment email sent.'
      : 'Request created, but assignment email failed. Check SMTP settings.'
    res.status(201).json({ requestId: result.insertId, emailSent: emailSent, message: message })
  } catch (error) { next(error) }
})

app.get('/api/requests/:id', async (req, res, next) => {
  try {
    const [requests] = await db.execute(`${requestSelect} WHERE r.request_id = ?`, [req.params.id])
    if (!requests[0]) return res.status(404).json({ error: 'Request not found.' })
    res.json(requests[0])
  } catch (error) { next(error) }
})

app.put('/api/requests/:id', async (req, res, next) => {
  try {
    const { clientId, assigneeId, title, description = '', dueDate, status } = req.body
    if (!clientId || !assigneeId || !title?.trim() || !dueDate || !requestStatuses.includes(status)) {
      return res.status(400).json({ error: 'Client, assignee, title, due date, and a valid status are required.' })
    }

    const [existingRequests] = await db.execute(
      'SELECT assignee_id FROM requests WHERE request_id = ?', [req.params.id],
    )
    if (!existingRequests[0]) return res.status(404).json({ error: 'Request not found.' })

    const [result] = await db.execute(`
      UPDATE requests SET client_id = ?, assignee_id = ?, title = ?, description = ?, due_date = ?, status = ?
      WHERE request_id = ?
    `, [clientId, assigneeId, title.trim(), description, dueDate, status, req.params.id])

    let emailSent = null
    if (Number(existingRequests[0].assignee_id) !== Number(assigneeId)) {
      emailSent = false
      try {
        const [requests] = await db.execute(`${requestSelect} WHERE r.request_id = ?`, [req.params.id])
        await sendAssignmentEmail(requests[0])
        emailSent = true
      } catch (error) {
        console.error('Assignment email failed:', error.message)
      }
    }

    const message = emailSent === true
      ? 'Request updated and assignment email sent.'
      : emailSent === false
        ? 'Request updated, but assignment email failed. Check SMTP settings.'
        : 'Request updated.'
    res.json({ emailSent: emailSent, message: message })
  } catch (error) { next(error) }
})

app.patch('/api/requests/:id/status', async (req, res, next) => {
  try {
    if (!requestStatuses.includes(req.body.status)) return res.status(400).json({ error: 'Choose a valid request status.' })
    const [result] = await db.execute('UPDATE requests SET status = ? WHERE request_id = ?', [req.body.status, req.params.id])
    if (!result.affectedRows) return res.status(404).json({ error: 'Request not found.' })
    res.json({ message: 'Status updated.' })
  } catch (error) { next(error) }
})

app.delete('/api/requests/:id', async (req, res, next) => {
  try {
    const [result] = await db.execute('DELETE FROM requests WHERE request_id = ?', [req.params.id])
    if (!result.affectedRows) return res.status(404).json({ error: 'Request not found.' })
    res.status(204).end()
  } catch (error) { next(error) }
})

app.get('/api/dashboard', async (_req, res, next) => {
  try {
    const [[counts]] = await db.execute(`
      SELECT COUNT(*) AS total,
        COALESCE(SUM(status = 'Open'), 0) AS open,
        COALESCE(SUM(status = 'In Progress'), 0) AS inProgress,
        COALESCE(SUM(status = 'Completed'), 0) AS completed,
        COALESCE(SUM(due_date < CURDATE() AND status <> 'Completed'), 0) AS overdue
      FROM requests
    `)
    res.json(counts)
  } catch (error) { next(error) }
})

app.post('/api/reminders/check', async (_req, res, next) => {
  try {
    const result = await checkReminders()
    res.json(result)
  } catch (error) { next(error) }
})

app.post('/api/chat', async (req, res, next) => {
  try {
    const question = req.body.question?.trim()
    if (!question) return res.status(400).json({ error: 'Write a question first.' })
    const result = await answerQuestion(question)
    res.json(result)
  } catch (error) { next(error) }
})

app.use((error, _req, res, _next) => {
  console.error(error)
  if (error.code === 'ER_DUP_ENTRY') return res.status(409).json({ error: 'That email address is already in use.' })
  if (error.code === 'ER_NO_REFERENCED_ROW_2') return res.status(400).json({ error: 'Select an existing client and assignee.' })
  res.status(500).json({ error: 'The server could not complete this request. Check backend logs and configuration.' })
})

app.listen(port, () => {
  console.log(`Accountant Request Tracker API listening on http://localhost:${port}`)
  startReminderJob()
})