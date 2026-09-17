# Hosting setup and final activation

No production settings or deployments were changed during Gate 3. Both the local Vercel CLI and the browser required sign-in. The owner confirmed hosting access, but current remote settings could not be inspected.

## Prepare before DNS, with the form off

Use the existing Galore Projects hosting project. This code includes Vercel configuration, based on the original Vercel-style endpoint. If the site actually uses another host, adapt its trusted client-IP handling before enabling the endpoint.

In Vercel, open the project, then Environment Variables, usually under Settings. Add the following server-only settings. Do not prefix them with NEXT_PUBLIC or expose them in browser code.

| Name | Value |
| --- | --- |
| `INQUIRY_FORM_ENABLED` | `false` |
| `RESEND_API_KEY` | A Resend sending-only key, preferably limited to `notify.galoreprojects.com`. Enter directly in the dashboard. |
| `UPSTASH_REDIS_REST_URL` | HTTPS REST endpoint of the project's persistent Upstash Redis database. |
| `UPSTASH_REDIS_REST_TOKEN` | Its read/write REST token, entered directly in the dashboard. |
| `INQUIRY_HASH_SECRET` | A new random secret of at least 32 characters, generated with your password manager. Keep it stable. |

Use an existing suitable Upstash database if available. Otherwise create one in the hosting Marketplace or Upstash console and review the plan before provisioning. No database or paid plan has been created by this task. Use persistent storage, disable eviction for this rate-limit database, and use the same database for all production function instances. Map the integration's credentials to the exact names above if it supplies different names. See [Upstash's Vercel integration](https://upstash.com/docs/redis/howto/vercelintegration) and [REST credentials](https://upstash.com/docs/redis/features/restapi).

The database stores expiring counters keyed by HMAC digests of network addresses and email addresses. It does not store the inquiry text. Counters expire after 10 minutes or one hour. Do not substitute an in-memory limiter.

Save settings for the intended deployment environment. Changes apply to a new deployment, so redeploy after editing settings. [Vercel environment-variable instructions](https://vercel.com/docs/environment-variables/managing-environment-variables).

The form has one launch switch. The other four entries are infrastructure credentials, not additional feature flags. Missing configuration or an unavailable limiter prevents sending even if the switch is turned on.

## Deploy the prepared code with sending off

Deploy this review repository, not the old source checkout. The `codex/gate-3-functional` branch contains the approved Gate 1 and Gate 2 work plus Gate 3. Framework preset: Other; build command: `npm run build`; output directory: `public`; Node.js 22 or newer. Keep the root `api` and `lib` directories with the project so Vercel builds the functions.

The build removes review-only pending sections. It omits the active Work entry until location and scope are confirmed. It preserves the explicitly labeled real drone cover. Completed projects remain text-only. It copies no secrets, tests, or audit scripts into public output.

Do not publish until the owner has reviewed the final Gate 3 build. The local preview at port 4173 is prepared for that review. For a Vercel preview deployment, the endpoint accepts the deployment's VERCEL_URL and non-production VERCEL_BRANCH_URL origins in addition to the two public Galore domains.

## Activate after DNS verification

1. Finish DNS-PHONE-CHECKLIST.md. Confirm Resend shows the sending domain verified.
2. Confirm all hosting settings are saved. Change only `INQUIRY_FORM_ENABLED` from `false` to `true` in the environment being tested, then redeploy.
3. Open the new deployment and reload the homepage. The short form should become available. `/api/inquiry-config` should return only `{"enabled":true}`, with no credentials.
4. Submit one clearly labeled test inquiry using your own email and harmless project details. Confirm the message appears in the bids inbox, including spam/junk if necessary. Check that Reply responds to the submitter's address and the sender is `website@notify.galoreprojects.com`.
5. Send back the tested URL, test time, and whether the message arrived. Do not send secret settings. A successful provider response only means accepted for delivery.
6. If any check fails, return the flag to `false` and redeploy. Direct email remains available. Use the provider's delivery logs to distinguish acceptance, bounce, and mailbox filtering.

Hosted Redis connectivity, trusted client-IP headers, Resend authentication, and real inbox delivery cannot be proven by local mock tests. These are final activation checks, not additional website code work.

## Rate limits and failure behavior

Each valid attempt consumes a shared allowance: five per network per ten minutes, three per submitter email per ten minutes, and fifty sitewide per hour. IPv6 addresses share a /64 bucket. Blocks return 429 with Retry-After. Failed provider requests count as attempts to prevent retry abuse. A store failure blocks sending.

An unchanged retry uses the same provider idempotency key. Resend deduplicates matching requests for 24 hours. This is not a permanent guarantee across new browser sessions, changed details, or that window. [Resend idempotency documentation](https://resend.com/docs/dashboard/emails/idempotency-keys).

The recipient is fixed to bids@galoreprojects.com. There is no automatic email to the submitter and no response-time promise. Return the flag to false to disable the form without editing HTML or JavaScript.
