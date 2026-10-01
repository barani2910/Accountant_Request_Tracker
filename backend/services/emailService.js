import nodemailer from 'nodemailer'

function createTransporter() {
  const host = process.env.EMAIL_HOST
  const port = Number(process.env.EMAIL_PORT || 587)
  const username = process.env.EMAIL_USER
  const password = process.env.EMAIL_PASSWORD

  if (!host || !username || !password) {
    throw new Error('Email is not configured. Add SMTP settings to backend/.env.')
  }

  return nodemailer.createTransport({
    host: host,
    port: port,
    secure: port === 465,
    auth: {
      user: username,
      pass: password,
    },
  })
}

function formatDueDate(date) {
  return new Date(`${date}T00:00:00`).toLocaleDateString('en-GB', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export async function sendReminder(request) {
  const transporter = createTransporter()
  const dueDate = formatDueDate(request.due_date)

  const email = {
    from: process.env.EMAIL_FROM || username,
    to: request.assignee_email,
    subject: `Reminder: Overdue Request - ${request.title}`,
    text: `Hi ${request.assignee_name},

This is a reminder that the following accounting request is overdue.

Request: ${request.title}
Client: ${request.client_name}
Due Date: ${dueDate}
Status: ${request.status}

Please review and complete the request.

Regards,
Accountant Request Tracker`,
  }

  await transporter.sendMail(email)
}

export async function sendAssignmentEmail(request) {
  const transporter = createTransporter()
  const dueDate = formatDueDate(request.due_date)

  const email = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to: request.assignee_email,
    subject: `New Request Assigned: ${request.title}`,
    text: `Hi ${request.assignee_name},

A new accounting request has been assigned to you.

Request: ${request.title}
Client: ${request.client_name}
Due Date: ${dueDate}
Status: ${request.status}

Please review the request.

Regards,
Accountant Request Tracker`,
  }

  await transporter.sendMail(email)
}