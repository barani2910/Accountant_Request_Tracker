import cron from 'node-cron'
import db from '../db.js'
import { sendReminder } from '../services/emailService.js'

export async function checkReminders() {
  const [requests] = await db.execute(`
    SELECT r.request_id, r.title, r.description, r.due_date, r.status,
           r.last_reminder_sent, c.client_name, a.name AS assignee_name,
           a.email AS assignee_email
    FROM requests r
    JOIN clients c ON c.client_id = r.client_id
    JOIN assignees a ON a.assignee_id = r.assignee_id
    WHERE r.due_date < CURDATE()
      AND r.status <> 'Completed'
      AND (r.last_reminder_sent IS NULL OR r.last_reminder_sent <> CURDATE())
    ORDER BY r.due_date ASC
  `)

  const result = { checked: requests.length, sent: 0, failed: [] }
  for (const request of requests) {
    try {
      await sendReminder(request)
      await db.execute('UPDATE requests SET last_reminder_sent = CURDATE() WHERE request_id = ?', [request.request_id])
      result.sent += 1
    } catch (error) {
      result.failed.push({ requestId: request.request_id, message: error.message })
    }
  }
  return result
}

export function startReminderJob() {
  cron.schedule('0 9 * * *', async () => {
    try {
      const result = await checkReminders()
      console.log(`Daily reminders: ${result.sent} sent, ${result.failed.length} failed.`)
    } catch (error) {
      console.error('Daily reminder check failed:', error.message)
    }
  })
}