# Email setup and launch requirements

## Current state

The local review intentionally has no active intake form. `/api/quote` returns 503 for POST and 405 for other methods. It sends nothing and never claims a request was received. This is a Gate 1 containment measure, not a completed delivery implementation. The public site's existing endpoint is unchanged until a deployment is approved.

Primary inquiry action: `mailto:bids@galoreprojects.com`.

## Confirmed setup and remaining handoff

- DNS provider: GoDaddy. Owner has DNS access.
- bids@galoreprojects.com: owner confirms the inbox receives mail.
- Resend: no verified sending domain yet. Brother holds account access.
- Pending: brother adds the proposed sending domain and provides the exact DNS table. Follow GODADDY-DNS.md; no shared login is needed.
- Pending for Gate 3: identify who will confirm receipt of the controlled delivery test.

Do not paste passwords, API keys, or DNS-account credentials into chat. Configure secrets in the hosting dashboard or use the authenticated account interface.

## Verified sender

Proposed sender: `Galore Projects <website@notify.galoreprojects.com>`. This is a proposed configuration, not an existing mailbox or a verified fact. Destination remains `bids@galoreprojects.com`; Reply-To is the validated submitter email.

Use the actual records supplied by Resend after adding the selected domain. Configure the required DKIM and SPF-related records, including the sending return-path records, without replacing existing inbox MX records. Wait for Resend to report the domain verified. Do not enable receiving or change mailbox routing for this task. Use a sending-only API key stored server-side.

Resend recommends subdomains for sending reputation separation: https://resend.com/docs/dashboard/domains/introduction

The testing sender `onboarding@resend.dev` must never be restored.

## Functional gate implementation

- Short form: name, email, optional organization, project/bid details. Direct email remains primary and handles attachments.
- Validate request content type, body size, field types, lengths, email format, and unexpected fields server-side.
- Escape all user-controlled content inserted into HTML email. Keep recipient and sender server-controlled. Use a fixed subject or sanitized bounded values. Include a plain-text email body.
- Rate-limit using a shared persistent store or hosting-edge control, not per-process memory in a serverless handler. The final store/provider is still to be selected from the existing hosting setup. Block sending when the limiter is unavailable.
- Check provider-returned errors as well as thrown errors. Do not return success without a valid provider message ID.
- Distinguish provider acceptance from inbox delivery. Avoid promising a response time or customer confirmation that has not been sent.
- Do not automatically email arbitrary submitter addresses as part of initial release. This removes an unnecessary outbound abuse path.
- Provide accessible inline errors, validation messages, and status announcements. Never remove entered data on failure.
- Handle timeouts and duplicate requests so retrying does not silently create repeated emails.
- Keep the form disabled unless all required sender and rate-limit settings are available.

## Prelaunch verification

- Provider rejection returns an error, with an email fallback and no success state.
- Invalid and oversized submissions are rejected before sending.
- Markup in a submitted name or message is rendered as literal text.
- Rapid requests are blocked; rate-limit state is shared across instances.
- Missing sender configuration, an unverified sender, provider timeout, and rate-limit failure do not produce false success.
- An explicitly authorized test is accepted by the provider and confirmed in the bids inbox. Acceptance alone is not proof of delivery.
- Keyboard and screen-reader operation verified for the short form.

No account has been created, paid service provisioned, DNS changed, secret accessed, or email sent during Gate 1.
