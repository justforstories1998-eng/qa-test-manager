import sgMail from '@sendgrid/mail';

const isConfigured = () => {
  const key = process.env.SENDGRID_API_KEY || process.env.SMTP_PASS;
  if (!key) {
    console.log('⚠️ SendGrid not configured (no API key found)');
    return false;
  }
  sgMail.setApiKey(key);
  return true;
};

const getFromEmail = () => process.env.SMTP_FROM || process.env.SMTP_USER || 'noreply@example.com';
const getAppUrl = () => process.env.APP_URL || 'http://localhost:3000';

export const sendWelcomeEmail = async (user, tempPassword) => {
  if (!isConfigured()) return { success: false, error: 'SendGrid not configured' };

  try {
    console.log(`📧 Sending welcome email to ${user.email} via SendGrid API...`);

    await sgMail.send({
      to: user.email,
      from: getFromEmail(),
      subject: 'Welcome to QALogs - Your Account Details',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4f46e5;">Welcome to QALogs</h2>
          <p>Hi ${user.firstName},</p>
          <p>An account has been created for you in the QALogs system.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Email:</strong> ${user.email}</p>
            <p><strong>Temporary Password:</strong> ${tempPassword}</p>
          </div>
          <p><strong>Important:</strong> Please log in and change your password immediately for security purposes.</p>
          <p style="margin-top: 20px;">
            <a href="${getAppUrl()}" 
               style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Login Now
            </a>
          </p>
          <p style="color: #64748b; margin-top: 30px; font-size: 12px;">
            If you didn't request this account, please ignore this email.
          </p>
        </div>
      `
    });

    console.log(`✅ Welcome email sent to: ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Welcome email error:', error.message);
    if (error.response?.body) {
      console.error('SendGrid response:', JSON.stringify(error.response.body));
    }
    return { success: false, error: error.message };
  }
};

export const sendBugAssignmentEmail = async (bug, assignedUser, createdByUser) => {
  if (!isConfigured()) return { success: false, error: 'SendGrid not configured' };

  try {
    console.log(`📧 Sending bug assignment email to ${assignedUser.email}...`);

    await sgMail.send({
      to: assignedUser.email,
      from: getFromEmail(),
      subject: `Bug Assigned: ${bug.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #dc2626;">Bug Assigned to You</h2>
          <p>Hi ${assignedUser.firstName},</p>
          <p>A bug has been assigned to you by <strong>${createdByUser.firstName} ${createdByUser.lastName}</strong>.</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #dc2626;">
            <h3 style="margin: 0 0 10px 0; color: #dc2626;">${bug.title}</h3>
            <p style="margin: 5px 0;"><strong>Severity:</strong> ${bug.severity}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${bug.status}</p>
            ${bug.description ? `<p style="margin: 10px 0 0 0;"><strong>Description:</strong> ${bug.description}</p>` : ''}
          </div>
          <p style="margin-top: 20px;">
            <a href="${getAppUrl()}/bugs" 
               style="background: #dc2626; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Bug
            </a>
          </p>
        </div>
      `
    });

    console.log(`✅ Bug assignment email sent to: ${assignedUser.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Bug assignment email error:', error.message);
    return { success: false, error: error.message };
  }
};

export const sendBugCreatedConfirmationEmail = async (bug, createdByUser) => {
  if (!isConfigured()) return { success: false, error: 'SendGrid not configured' };

  try {
    console.log(`📧 Sending bug creation confirmation to ${createdByUser.email}...`);

    await sgMail.send({
      to: createdByUser.email,
      from: getFromEmail(),
      subject: `Bug Created: ${bug.title}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #4f46e5;">Bug Created Successfully</h2>
          <p>Hi ${createdByUser.firstName},</p>
          <p>Your bug report has been created and ${bug.assignedTo ? `assigned to <strong>${bug.assignedTo}</strong>` : 'is awaiting assignment'}.</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4f46e5;">
            <h3 style="margin: 0 0 10px 0; color: #4f46e5;">${bug.title}</h3>
            <p style="margin: 5px 0;"><strong>Severity:</strong> ${bug.severity}</p>
            <p style="margin: 5px 0;"><strong>Status:</strong> ${bug.status}</p>
            ${bug.description ? `<p style="margin: 10px 0 0 0;"><strong>Description:</strong> ${bug.description}</p>` : ''}
          </div>
          <p style="margin-top: 20px;">
            <a href="${getAppUrl()}/bugs" 
               style="background: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              View Bug
            </a>
          </p>
        </div>
      `
    });

    console.log(`✅ Bug creation confirmation sent to: ${createdByUser.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Bug creation confirmation error:', error.message);
    return { success: false, error: error.message };
  }
};

export const sendProjectAssignmentEmail = async (user, project, assignedBy) => {
  if (!isConfigured()) return { success: false, error: 'SendGrid not configured' };

  try {
    console.log(`📧 Sending project assignment email to ${user.email}...`);

    await sgMail.send({
      to: user.email,
      from: getFromEmail(),
      subject: `Project Assigned: ${project.name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #059669;">Project Assigned to You</h2>
          <p>Hi ${user.firstName},</p>
          <p>You have been assigned to a new project by <strong>${assignedBy.firstName} ${assignedBy.lastName}</strong>.</p>
          <div style="background: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #059669;">
            <h3 style="margin: 0 0 10px 0; color: #059669;">${project.name}</h3>
            ${project.description ? `<p style="margin: 5px 0;">${project.description}</p>` : ''}
          </div>
          <p style="margin-top: 20px;">
            <a href="${getAppUrl()}" 
               style="background: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
              Open QALogs
            </a>
          </p>
        </div>
      `
    });

    console.log(`✅ Project assignment email sent to: ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Project assignment email error:', error.message);
    return { success: false, error: error.message };
  }
};
