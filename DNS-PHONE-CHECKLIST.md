# Final DNS task: do this from your phone

The website code can be completed before this task. This checklist covers domain verification. Hosting settings and a real inbox test are separate activation steps in HOSTING-ACTIVATION.md.

You will need access to the existing Resend account and to GoDaddy. If your brother still holds the only Resend login, ask him to give you authorized account access first. Do not send passwords or API keys into this chat.

## 1. Open Resend

1. Open https://resend.com/domains in your phone browser and sign in.
2. Open the navigation menu if necessary, then Domains.
3. Tap Add Domain. Enter `notify.galoreprojects.com` exactly. If it already appears in the list, open that entry instead.
4. Keep the selected sending region and note its name. Leave Receiving off. Leave tracking off for these bid inquiries.
5. Choose manual DNS setup. Keep this tab open.

This subdomain will send website inquiries to your existing bids inbox. It does not replace that inbox. [Resend domain guidance](https://resend.com/docs/dashboard/domains/introduction).

## 2. Save the DNS table

Take clear screenshots of every required sending record. Each must show Type, Name or Host, Value or Content, and MX Priority. Copy long TXT values with the copy button so no characters are cut off.

The values are created for your domain. There is no accurate final DNS table to supply before this screen exists.

## 3. Add the records in GoDaddy

1. Open a second browser tab. Sign in to GoDaddy and open DNS management for `galoreprojects.com`.
2. For each required sending record in Resend, tap Add New Record.
3. Match the Type. Paste its Value exactly. For MX, copy Priority too. Use the default TTL.
4. In Host or Name, remove only the ending `.galoreprojects.com` from a full name. For example, `send.notify.galoreprojects.com` becomes `send.notify`. `resend._domainkey.notify.galoreprojects.com` becomes `resend._domainkey.notify`. If already shortened, use it as shown.
5. Save each record. Preserve existing inbox MX records. If the same Type and Host already exist with a different value, stop and send both versions before changing it.

These host examples are name conversions, not substitute DNS values. [Resend's GoDaddy guide](https://resend.com/docs/knowledge-base/godaddy).

## 4. Verify in Resend

Return to the domain tab and tap Verify DNS Records. If still pending, allow DNS to update and check again later. Do not keep adding duplicate records. Keep the form switch off while verification is pending.

## 5. Send back this information

- Domain: `notify.galoreprojects.com`.
- Selected sending region.
- Screenshot of the complete Type / Host / Value / Priority table.
- Screenshot of Resend's verification result, including any record still pending or failed.
- Whether the hosting settings in HOSTING-ACTIVATION.md have been saved. Send variable names/status only, never their secret values.

Once verified and hosting is configured, the final step is one controlled website submission and confirmation that it actually arrived at `bids@galoreprojects.com`. A green domain status or an accepted API response alone does not prove inbox delivery.
