# Email setup: Gate 3 status

The endpoint and form code are implemented. Sending stays off behind the single `INQUIRY_FORM_ENABLED` flag. The existing public site's old endpoint is unchanged because this review has not been deployed.

Use these current documents:

- GATE-3-REVIEW.md: completed work, tests, and remaining activation boundary.
- HOSTING-ACTIVATION.md: exact environment-variable names, persistent limiter setup, deployment, activation, inbox verification, and rollback.
- DNS-PHONE-CHECKLIST.md: standalone Resend and GoDaddy steps to do later from a phone.

Confirmed: GoDaddy manages DNS, the owner has hosting access, bids@galoreprojects.com receives mail, and the brother holds Resend access. No verified sending domain has been reported.

Sender is fixed to `Galore Projects <website@notify.galoreprojects.com>`. Recipient is fixed to `bids@galoreprojects.com`. No testing sender, customer autoresponder, or response-time promise remains.

Local tests cover validation, escaping, rate limiting, provider failures, timeouts, idempotency, and form behavior. Live domain verification, hosting credentials, store connectivity, deployment, and inbox delivery remain external activation steps. Do not describe these as completed until checked in the actual accounts.
