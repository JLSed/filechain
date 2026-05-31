import { env } from '$env/dynamic/private';

interface SendAssignmentEmailParams {
	to: string[];
	applicationId: string;
	titleOfInvention: string;
	clientName: string;
	typeOfInventionName: string;
	teamRole: string;
	actorName: string;
	origin: string;
}

/**
 * Sends a notification email to assigned team members and system admins
 * when a new intellectual property application has been submitted and assigned.
 */
export async function sendAssignmentEmail(params: SendAssignmentEmailParams): Promise<void> {
	if (!env.RESEND_API_KEY) {
		console.warn('RESEND_API_KEY is not defined. Email notifications will be skipped.');
		return;
	}

	const {
		to,
		applicationId,
		titleOfInvention,
		clientName,
		typeOfInventionName,
		teamRole,
		actorName,
		origin
	} = params;

	if (to.length === 0) return;

	const logoUrl = 'https://dmvconsulting.app/dmv-logo.png';
	const applicationUrl = `${origin}/application/${applicationId}`;

	const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>New Application Assigned</title>
</head>
<body style="margin: 0; padding: 0; background-color: #F4F5F8; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; color: #414A57;">
  
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #F4F5F8; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 600px; width: 100%; background-color: #ffffff; border: 1px solid #EBEBEB; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 12px rgba(65, 74, 87, 0.05);">
          
          <!-- Logo Header -->
          <tr>
            <td align="center" style="padding: 32px 40px; background-color: #ffffff; border-bottom: 1px solid #F0F0F0;">
              <img src="${logoUrl}" alt="DMV IP CONSULTING" height="40" style="height: 40px; width: auto; display: block; border: 0;" />
            </td>
          </tr>

          <!-- Hero Banner Section -->
          <tr>
            <td style="background-color: #414A57; padding: 40px; text-align: center;">
              <span style="display: inline-block; padding: 4px 12px; border-radius: 9999px; background-color: rgba(214, 138, 46, 0.15); color: #D68A2E; font-size: 11px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; margin-bottom: 16px;">
                New Assignment
              </span>
              <h1 style="color: #ffffff; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.2;">
                Application Assigned to Your Team
              </h1>
            </td>
          </tr>

          <!-- Main Body Content -->
          <tr>
            <td style="padding: 40px; background-color: #ffffff;">
              <p style="margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; color: #626D7C;">
                Hi Team,
              </p>
              <p style="margin: 0 0 32px 0; font-size: 15px; line-height: 1.6; color: #626D7C;">
                A new Intellectual Property application has been submitted by <strong>${actorName}</strong> and assigned to your team (<strong>${teamRole}</strong>). Please review the details below:
              </p>

              <!-- Application Details Card -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="border-collapse: separate; border-spacing: 0; border: 1px solid #EBEBEB; border-radius: 8px; background-color: #F8F9FA; margin-bottom: 32px; overflow: hidden;">
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #EBEBEB; width: 140px; font-size: 13px; font-weight: 600; color: #8F9CAE; text-transform: uppercase; letter-spacing: 0.05em; vertical-align: top;">
                    Invention Title
                  </td>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #EBEBEB; font-size: 14px; font-weight: 600; color: #2C3540; line-height: 1.4; vertical-align: top;">
                    ${titleOfInvention}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #EBEBEB; font-size: 13px; font-weight: 600; color: #8F9CAE; text-transform: uppercase; letter-spacing: 0.05em; vertical-align: top;">
                    Client / Applicant
                  </td>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #EBEBEB; font-size: 14px; color: #414A57; vertical-align: top;">
                    ${clientName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #EBEBEB; font-size: 13px; font-weight: 600; color: #8F9CAE; text-transform: uppercase; letter-spacing: 0.05em; vertical-align: top;">
                    Invention Type
                  </td>
                  <td style="padding: 16px 20px; border-bottom: 1px solid #EBEBEB; font-size: 14px; color: #414A57; vertical-align: top;">
                    ${typeOfInventionName}
                  </td>
                </tr>
                <tr>
                  <td style="padding: 16px 20px; font-size: 13px; font-weight: 600; color: #8F9CAE; text-transform: uppercase; letter-spacing: 0.05em; vertical-align: top;">
                    Initial Status
                  </td>
                  <td style="padding: 16px 20px; vertical-align: top;">
                    <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; background-color: rgba(65, 74, 87, 0.08); color: #414A57; font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.04em;">
                      Client Intake
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Call to Action Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td align="center" style="padding-bottom: 12px;">
                    <a href="${applicationUrl}" target="_blank" style="display: inline-block; padding: 14px 32px; background-color: #414A57; color: #ffffff; text-decoration: none; border-radius: 8px; font-size: 15px; font-weight: 600; letter-spacing: 0.02em; transition: background-color 0.2s ease;">
                      Open Application
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Footer Information -->
          <tr>
            <td style="background-color: #F8F9FA; padding: 32px 40px; text-align: center; border-top: 1px solid #EBEBEB;">
              <p style="margin: 0 0 8px 0; font-size: 13px; font-weight: 600; color: #414A57;">DMV IP CONSULTING</p>
              <p style="margin: 0 0 16px 0; font-size: 12px; color: #8F9CAE; line-height: 1.5;">
                This is an automated notification from DMV Management System.<br>
                Please do not reply directly to this email.
              </p>
              <p style="margin: 0; font-size: 11px; color: #B0BAC9;">
                &copy; ${new Date().getFullYear()} DMV IP Consulting. All rights reserved.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>

</body>
</html>`;

	const response = await fetch('https://api.resend.com/emails', {
		method: 'POST',
		headers: {
			'Content-Type': 'application/json',
			Authorization: `Bearer ${env.RESEND_API_KEY}`
		},
		body: JSON.stringify({
			from: 'DMV IP Consulting <notifications@dmvconsulting.app>',
			to,
			subject: `\uD83D\uDCC1 New Application Assigned: ${titleOfInvention}`,
			html
		})
	});

	if (!response.ok) {
		const errorBody = await response.text();
		console.error(`Failed to send assignment email: ${response.status} ${errorBody}`);
	} else {
		console.log(`Assignment email sent successfully to ${to.join(', ')}`);
	}
}
