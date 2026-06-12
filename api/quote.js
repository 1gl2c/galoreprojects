import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { firstName, lastName, phone, email, projectType, location, details } = req.body;

  if (!firstName || !email || !projectType) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    await resend.emails.send({
      from: 'Galore Projects <onboarding@resend.dev>',
      to: 'info@galoreprojects.com',
      replyTo: email,
      subject: `New Quote Request — ${projectType} — ${location || 'Location not specified'}`,
      html: `
        <div style="font-family:Inter,sans-serif;max-width:600px;margin:0 auto;background:#FAFAF8;border:1px solid #E8E0D0;border-radius:8px;overflow:hidden;">
          <div style="background:#1C1C1C;padding:28px 32px;">
            <div style="color:#C9A84C;font-size:11px;letter-spacing:3px;text-transform:uppercase;font-weight:700;margin-bottom:6px;">New Quote Request</div>
            <div style="color:#FAFAF8;font-size:22px;font-weight:700;">${projectType}</div>
            <div style="color:#A0998A;font-size:13px;margin-top:4px;">${location || '—'}</div>
          </div>
          <div style="padding:32px;">
            <table style="width:100%;border-collapse:collapse;">
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #EEEBE4;color:#6B6560;font-size:12px;letter-spacing:1px;text-transform:uppercase;width:140px;">Name</td>
                <td style="padding:10px 0;border-bottom:1px solid #EEEBE4;color:#1C1C1C;font-weight:500;">${firstName} ${lastName}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #EEEBE4;color:#6B6560;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Email</td>
                <td style="padding:10px 0;border-bottom:1px solid #EEEBE4;"><a href="mailto:${email}" style="color:#C9A84C;text-decoration:none;">${email}</a></td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #EEEBE4;color:#6B6560;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Phone</td>
                <td style="padding:10px 0;border-bottom:1px solid #EEEBE4;color:#1C1C1C;">${phone || '—'}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #EEEBE4;color:#6B6560;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Project Type</td>
                <td style="padding:10px 0;border-bottom:1px solid #EEEBE4;color:#1C1C1C;font-weight:600;">${projectType}</td>
              </tr>
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #EEEBE4;color:#6B6560;font-size:12px;letter-spacing:1px;text-transform:uppercase;">Location</td>
                <td style="padding:10px 0;border-bottom:1px solid #EEEBE4;color:#1C1C1C;">${location || '—'}</td>
              </tr>
            </table>
            <div style="margin-top:24px;">
              <div style="color:#6B6560;font-size:12px;letter-spacing:1px;text-transform:uppercase;margin-bottom:10px;">Project Details</div>
              <div style="background:#F5F2EE;border-radius:6px;padding:16px;color:#1C1C1C;line-height:1.7;white-space:pre-wrap;">${details || 'No details provided.'}</div>
            </div>
            <div style="margin-top:28px;padding-top:20px;border-top:1px solid #EEEBE4;text-align:center;">
              <a href="mailto:${email}" style="display:inline-block;background:#C9A84C;color:#1C1C1C;font-weight:700;font-size:13px;letter-spacing:1px;text-transform:uppercase;padding:14px 28px;border-radius:4px;text-decoration:none;">Reply to ${firstName}</a>
            </div>
          </div>
          <div style="background:#F5F2EE;padding:16px 32px;text-align:center;color:#A0998A;font-size:11px;">
            Galore Projects &middot; CSLB #1156432 &middot; galoreprojects.com
          </div>
        </div>
      `,
    });

    return res.status(200).json({ success: true });
  } catch (err) {
    console.error('Resend error:', err);
    return res.status(500).json({ error: 'Failed to send email' });
  }
}
