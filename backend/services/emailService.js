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
const getLogoUrl = () => process.env.LOGO_URL || 'https://qalogs.vercel.app/logo.jpg';

const emailWrapper = (title, titleColor, content) => `
  <!DOCTYPE html>
  <html>
  <head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"></head>
  <body style="margin:0;padding:0;background-color:#0f172a;font-family:'Segoe UI',Tahoma,Geneva,Verdana,sans-serif;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;padding:40px 20px;">
      <tr>
        <td align="center">
          <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
            <!-- Logo -->
            <tr>
              <td align="center" style="padding-bottom:30px;">
                <img src="${getLogoUrl()}" alt="QALogs" width="180" style="display:block;border:0;outline:none;" />
              </td>
            </tr>
            <!-- Card -->
            <tr>
              <td style="background-color:#1e293b;border-radius:16px;padding:40px 40px 30px 40px;border:1px solid #334155;">
                <h1 style="margin:0 0 20px 0;font-size:24px;font-weight:700;color:${titleColor};">${title}</h1>
                ${content}
              </td>
            </tr>
            <!-- Footer -->
            <tr>
              <td align="center" style="padding:30px 0 10px 0;">
                <p style="margin:0;font-size:12px;color:#64748b;">This is an automated email from QALogs. Please do not reply.</p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
  </html>
`;

const btnStyle = (bgColor) =>
  `background-color:${bgColor};color:#ffffff;padding:14px 28px;text-decoration:none;border-radius:8px;display:inline-block;font-weight:600;font-size:14px;`;

export const sendWelcomeEmail = async (user, tempPassword) => {
  if (!isConfigured()) return { success: false, error: 'SendGrid not configured' };

  try {
    console.log(`📧 Sending welcome email to ${user.email} via SendGrid API...`);

    await sgMail.send({
      to: user.email,
      from: getFromEmail(),
      subject: 'Welcome to QALogs - Your Account Details',
      html: emailWrapper(
        'Welcome to QALogs',
        '#a78bfa',
        `
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 20px 0;">Hi ${user.firstName},</p>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 25px 0;">An account has been created for you in the QALogs system. Use the credentials below to log in.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;border-radius:10px;padding:20px 24px;border:1px solid #334155;margin:0 0 25px 0;">
            <tr>
              <td>
                <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">EMAIL</p>
                <p style="margin:0 0 18px 0;font-size:15px;color:#e2e8f0;font-weight:600;">${user.email}</p>
                <p style="margin:0 0 8px 0;font-size:13px;color:#94a3b8;">TEMPORARY PASSWORD</p>
                <p style="margin:0;font-size:15px;color:#e2e8f0;font-weight:600;letter-spacing:1px;">${tempPassword}</p>
              </td>
            </tr>
          </table>
          <p style="color:#f59e0b;font-size:14px;line-height:1.6;margin:0 0 25px 0;">⚠️ Please log in and change your password immediately for security.</p>
          <p style="margin:0 0 10px 0;">
            <a href="${getAppUrl()}" style="${btnStyle('#7c3aed')}">Login to QALogs →</a>
          </p>
          <p style="color:#475569;font-size:12px;margin:25px 0 0 0;">If you didn't request this account, please ignore this email.</p>
        `
      ),
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
      html: emailWrapper(
        'Bug Assigned to You',
        '#f87171',
        `
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 20px 0;">Hi ${assignedUser.firstName},</p>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 25px 0;">A bug has been assigned to you by <strong style="color:#e2e8f0;">${createdByUser.firstName} ${createdByUser.lastName}</strong>.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#1c1017;border-radius:10px;padding:20px 24px;border:1px solid #441c1c;margin:0 0 25px 0;">
            <tr>
              <td>
                <p style="margin:0 0 10px 0;font-size:18px;color:#f87171;font-weight:700;">${bug.title}</p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:3px 12px 3px 0;"><span style="background-color:#7f1d1d;color:#fca5a5;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:600;">${bug.severity}</span></td>
                    <td style="padding:3px 0;"><span style="background-color:#1e293b;color:#cbd5e1;padding:3px 10px;border-radius:4px;font-size:12px;">${bug.status}</span></td>
                  </tr>
                </table>
                ${bug.description ? `<p style="color:#94a3b8;font-size:14px;margin:15px 0 0 0;line-height:1.6;">${bug.description}</p>` : ''}
              </td>
            </tr>
          </table>
          <p style="margin:0 0 10px 0;">
            <a href="${getAppUrl()}/bugs" style="${btnStyle('#dc2626')}">View Bug →</a>
          </p>
        `
      ),
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
      html: emailWrapper(
        'Bug Created Successfully',
        '#a78bfa',
        `
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 20px 0;">Hi ${createdByUser.firstName},</p>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 25px 0;">Your bug report has been created and ${bug.assignedTo ? `assigned to <strong style="color:#e2e8f0;">${bug.assignedTo}</strong>` : 'is awaiting assignment'}.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f172a;border-radius:10px;padding:20px 24px;border:1px solid #334155;margin:0 0 25px 0;">
            <tr>
              <td>
                <p style="margin:0 0 10px 0;font-size:18px;color:#a78bfa;font-weight:700;">${bug.title}</p>
                <table cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:3px 12px 3px 0;"><span style="background-color:#4c1d95;color:#c4b5fd;padding:3px 10px;border-radius:4px;font-size:12px;font-weight:600;">${bug.severity}</span></td>
                    <td style="padding:3px 0;"><span style="background-color:#1e293b;color:#cbd5e1;padding:3px 10px;border-radius:4px;font-size:12px;">${bug.status}</span></td>
                  </tr>
                </table>
                ${bug.description ? `<p style="color:#94a3b8;font-size:14px;margin:15px 0 0 0;line-height:1.6;">${bug.description}</p>` : ''}
              </td>
            </tr>
          </table>
          <p style="margin:0 0 10px 0;">
            <a href="${getAppUrl()}/bugs" style="${btnStyle('#7c3aed')}">View Bug →</a>
          </p>
        `
      ),
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
      html: emailWrapper(
        'Project Assigned to You',
        '#34d399',
        `
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 20px 0;">Hi ${user.firstName},</p>
          <p style="color:#cbd5e1;font-size:15px;line-height:1.7;margin:0 0 25px 0;">You have been assigned to a new project by <strong style="color:#e2e8f0;">${assignedBy.firstName} ${assignedBy.lastName}</strong>.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0f1d14;border-radius:10px;padding:20px 24px;border:1px solid #14432a;margin:0 0 25px 0;">
            <tr>
              <td>
                <p style="margin:0 0 8px 0;font-size:18px;color:#34d399;font-weight:700;">${project.name}</p>
                ${project.description ? `<p style="color:#94a3b8;font-size:14px;margin:0;line-height:1.6;">${project.description}</p>` : ''}
              </td>
            </tr>
          </table>
          <p style="margin:0 0 10px 0;">
            <a href="${getAppUrl()}" style="${btnStyle('#059669')}">Open QALogs →</a>
          </p>
        `
      ),
    });

    console.log(`✅ Project assignment email sent to: ${user.email}`);
    return { success: true };
  } catch (error) {
    console.error('❌ Project assignment email error:', error.message);
    return { success: false, error: error.message };
  }
};
