# Resend DNS handoff for GoDaddy

The bids@galoreprojects.com inbox is confirmed working. No sending domain is verified in Resend yet. The brother holds the Resend account; the owner has GoDaddy access. Neither needs to share a password or API key in chat.

## What the brother should provide

1. In Resend, open Domains and add `notify.galoreprojects.com` for sending. If that exact domain already exists, open it instead.
2. Leave Receiving disabled. Select manual DNS setup.
3. Copy the complete DNS table, including each record's Type, Name/Host, Content/Value, and MX Priority. Include the selected region and current verification status. A clear screenshot of that table also works.
4. Send those records to the owner to pass into this task. No API key is needed for this step.

The intended website sender is `Galore Projects <website@notify.galoreprojects.com>`, with bid submissions delivered to the existing `bids@galoreprojects.com` inbox.

## Exact GoDaddy entries are pending

TODO: Fill in the final Type / Host / Value / Priority table from the account's actual records. The DKIM value is unique to the domain setup and cannot be invented. The sending MX value must match the account's region.

GoDaddy's Host field is relative to `galoreprojects.com`. For example, if Resend shows `send.notify.galoreprojects.com`, the GoDaddy host is `send.notify`; if it shows `resend._domainkey.notify.galoreprojects.com`, the host is `resend._domainkey.notify`. These illustrate name conversion only, not a final record table. Copy the actual values unchanged.

Preserve existing inbox MX records and unrelated DNS entries. After the provided sending records are added, the brother should run Resend's verification and report its result.

Reference: [Resend's official GoDaddy instructions](https://resend.com/docs/knowledge-base/godaddy).

## After verification

Configure the sending credential directly in the hosting environment during Gate 3. The form stays unavailable until its delivery and abuse controls are implemented and a controlled message is confirmed in the bids inbox. Domain verification alone is not proof of inbox delivery.
