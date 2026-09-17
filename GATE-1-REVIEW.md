# Galore Projects: structure and copy review

Status: local review only. Not deployed. Approval of this gate authorizes the visual design and entrance-motion gate, not production launch.

## Review these pages

- Home: http://127.0.0.1:4173/
- Work: http://127.0.0.1:4173/work/
- Qualifications: http://127.0.0.1:4173/qualifications/

Start the local preview with `npm run dev` if needed. The source is static HTML, CSS, and a small progressive-enhancement script. The preview server runs locally and only serves the intended pages and assets.

## Changes in this gate

- Three destinations: Home, Work, Qualifications. All remain accessible on mobile.
- Persistent Qualifications, Call, and Email bids actions, including on the cover.
- Both CSLB and DIR numbers visible on the cover and at the top of Qualifications.
- Native keyboard-operable entrance, visible focus, skip link, semantic headings and main landmarks.
- The site content remains accessible without JavaScript. Return visits in the same session bypass the cover. Direct page and section links bypass it.
- Contrast corrected for primary text, secondary text, gold accents, controls, and light sections. No automatic animation in this gate; reduced-motion rules are included.
- The entire service catalogue, unsupported portfolio entries, response-time promises, and broken Machine Room removed.
- Real company facts only. MBE appears as a business designation, without inventing a certification issuer.
- Both completed projects shown with text only. No speculative photography, generated project scenes, or stock imagery.
- Active project explicitly separated and labeled as site work, with location and scope withheld pending confirmation.
- Unsafe inquiry sending disabled. The endpoint returns an honest unavailable response and directs visitors to bids@galoreprojects.com. It cannot send or claim receipt in this gate.

## Copy for approval

Cover:

> galore projects.
>
> San Diego + Los Angeles
>
> Class B General Building Contractor.
>
> Enter site

Home:

> Built right. Priced fairly.
>
> A Class B general building contractor working in San Diego and Los Angeles.
>
> Send a bid invitation

Completed work:

- Four-unit townhome build. San Diego. Completed.
- Full tear-down and rebuild. Culver City. Completed.

Bid invitation:

> Let’s talk about the job.
>
> Send your bid invitation to Galore Projects.
>
> bids@galoreprojects.com

In-progress draft, held from publication:

> Ground-up build. Site work underway. Land cleared and graded.
>
> No structure has been built.

The active ground-up job is confirmed to be separate from the in-home care facility property. No additional project entry is created for the latter.

## Open content items

- TODO: RMO-approved scope wording. No capability, trade, or service list until supplied.
- TODO: Active-project location and publishable scope wording.
- TODO: Confirm which media files belong to the two completed projects. Both currently lack project-mapped photographs.
- TODO: Certification issuers, certificate details, and public verification links.
- Remove review-only TODO panels before production launch. Unresolved claims remain omitted.

## Media findings

Read `MEDIA-REVIEW.md` for the exact source inventory and intended uses. The four drone clips are suitable candidates for the visual design gate. No media has been generated, synthesized, or sourced externally. No project imagery is embedded in the Gate 1 preview.

## Deferred to the next review gates

Gate 2: distinctive final typography, real drone cover treatment, entrance transition, project imagery where confirmed, and restrained visual detail. Current typography and linework are a structural foundation.

Gate 3: verified-domain email delivery, validated and escaped submissions, durable rate limiting, short accessible intake form, delivery testing, broader accessibility/performance checks, and launch preparation.

The form stays unavailable until delivery has passed verification. `EMAIL-SETUP.md` lists the required setup and launch checks.

## Repository and recovery

This review lives in an independent local clone on branch `codex/gate-1-structure`, based on original commit `601d907`. The original local checkout and public site are unchanged. No deployment credentials were copied, and no remote was configured. All edits are committed locally for review and reversion.

## Gate 1 verification

- All three pages checked at 320px, 390px, and 1280px widths. No horizontal overflow.
- Every page has one visible primary heading and one main landmark.
- Keyboard Tab sequence reaches Enter site. Enter opens the homepage content and transfers focus to main.
- All three utility actions appear on every page. Both registration numbers are near the top of Qualifications.
- Rendered text contrast scan: lowest observed ratio 6.19:1. This is a focused text-contrast check, not a full accessibility certification.
- No browser errors or warnings observed during the route checks.
- All intended pages and assets return HTTP 200 locally. Local quote POST returns 503; GET returns 405. No email sent.
- Four automated checks pass: endpoint containment, method rejection, approved-claim/contact regression checks, and separation of active work from completed projects.
- No-JavaScript resilience and reduced-motion behavior checked in source. Full assistive-technology and real-device testing remains in Gate 3.
- Diff whitespace checks pass.

The original approximately 492KB homepage HTML is now approximately 4.5KB, with one separately cacheable logo and shared styles. This is a file-size comparison, not a measured mobile loading-speed claim.
