export class EmailTemplates {
  static taskAssigned(
    assigneeName: string,
    taskTitle: string,
    projectName: string,
  ): string {
    return `
      <h2>New Task Assigned</h2>
      <p>Hi ${assigneeName},</p>
      <p>You have been assigned a new task: <strong>${taskTitle}</strong></p>
      <p>Project: ${projectName}</p>
      <p>Please log in to the task management system to view more details.</p>
    `;
  }

  static taskUpdated(
    userName: string,
    taskTitle: string,
    changes: string,
  ): string {
    return `
      <h2>Task Updated</h2>
      <p>Hi ${userName},</p>
      <p>The task <strong>${taskTitle}</strong> has been updated.</p>
      <p>Changes: ${changes}</p>
      <p>Please log in to the task management system to view more details.</p>
    `;
  }

  static commentAdded(
    userName: string,
    taskTitle: string,
    comment: string,
  ): string {
    return `
      <h2>New Comment on Task</h2>
      <p>Hi ${userName},</p>
      <p>A new comment has been added to task <strong>${taskTitle}</strong>:</p>
      <blockquote>${comment}</blockquote>
      <p>Please log in to the task management system to view all comments.</p>
    `;
  }

  static teamInvitation(
    userName: string,
    teamName: string,
    inviterName: string,
  ): string {
    return `
      <h2>Team Invitation</h2>
      <p>Hi ${userName},</p>
      <p>${inviterName} has invited you to join the team <strong>${teamName}</strong>.</p>
      <p>Please log in to the task management system to accept or decline the invitation.</p>
    `;
  }

  static welcomeEmail(userName: string): string {
    return `
      <h2>Welcome to Task Management System</h2>
      <p>Hi ${userName},</p>
      <p>Welcome to our task management system! Your account has been created successfully.</p>
      <p>You can now log in and start managing your tasks.</p>
      <p>Happy task managing!</p>
    `;
  }
}
