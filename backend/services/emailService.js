const nodemailer = require("nodemailer")

class EmailService {
  constructor() {
    this.transporter = nodemailer.createTransporter({
      host: process.env.EMAIL_HOST || "smtp.gmail.com",
      port: process.env.EMAIL_PORT || 587,
      secure: false,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    })
  }

  async sendTaskAssignmentEmail(user, task) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@taskmanager.com",
      to: user.email,
      subject: "New Task Assigned",
      html: `
        <h2>New Task Assigned</h2>
        <p>Hello ${user.name},</p>
        <p>You have been assigned a new task:</p>
        <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
          <h3>${task.title}</h3>
          <p><strong>Description:</strong> ${task.description}</p>
          <p><strong>Priority:</strong> ${task.priority}</p>
          <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
        </div>
        <p>Please log in to your account to view more details.</p>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log("Task assignment email sent successfully")
    } catch (error) {
      console.error("Error sending email:", error)
    }
  }

  async sendTaskReminderEmail(user, task) {
    const mailOptions = {
      from: process.env.EMAIL_FROM || "noreply@taskmanager.com",
      to: user.email,
      subject: "Task Due Soon",
      html: `
        <h2>Task Reminder</h2>
        <p>Hello ${user.name},</p>
        <p>This is a reminder that your task is due soon:</p>
        <div style="border: 1px solid #ddd; padding: 15px; margin: 10px 0;">
          <h3>${task.title}</h3>
          <p><strong>Due Date:</strong> ${new Date(task.dueDate).toLocaleDateString()}</p>
          <p><strong>Status:</strong> ${task.status}</p>
        </div>
        <p>Please complete your task on time.</p>
      `,
    }

    try {
      await this.transporter.sendMail(mailOptions)
      console.log("Task reminder email sent successfully")
    } catch (error) {
      console.error("Error sending reminder email:", error)
    }
  }
}

module.exports = new EmailService()
