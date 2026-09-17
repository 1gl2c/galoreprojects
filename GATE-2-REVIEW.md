# Gate 2: visual design and motion review

Status: ready for owner review. Local preview only, not deployed. Gate 1 was approved. Gate 3 begins after approval of this visual gate.

## Preview

- Replay cover: http://127.0.0.1:4173/?cover=1
- Home content: http://127.0.0.1:4173/#main
- Work: http://127.0.0.1:4173/work/
- Qualifications: http://127.0.0.1:4173/qualifications/

Start with `npm run dev` if the local preview is no longer running.

## Implemented

- Black, warm white, and gold with architectural rules and generous spacing.
- Syne for display text, Source Sans 3 for readable body text. Both fonts are locally hosted, with their open font licenses included. No external font request is needed.
- Supplied drone footage on the cover, cropped and encoded for desktop and phone. The nine-second muted loop crossfades back to its start. No generated scene, composited structure, or stock footage.
- Cover caption: “In progress. Site cleared and graded.” The completed-project section uses no active-site footage.
- One 520ms upward entrance wipe. Keyboard activation transfers focus to main. Reduced motion removes the transition and automatic video playback.
- Poster loads before optional video. Data saver, detected slow connections, blocked autoplay, and failed or stalled video retain the still. Playback has a visible pause control, pauses offscreen, and releases its source after entrance.
- Text-only completed project rows with clear status and location. The active project sits in its own review-only section with an accurate real still and a pending-publication note.
- Persistent Qualifications, Call, and Email bids actions on every page and cover.

## Validation

- 14 automated tests pass. Coverage includes endpoint containment, approved facts, project-status separation, reduced motion, data saver, source selection, blocked autoplay, stalled playback, focus transfer, and video cleanup.
- Browser inspection at 320px and 390px phone widths and 1280px desktop, plus the normal desktop viewport. No horizontal overflow observed in the inspected layouts.
- Keyboard entrance completes with focus on main and the video source removed. Pause control works. Mobile receives the smaller video asset.
- Primary solid-background text combinations range from 6.19:1 to 16.19:1 contrast. The cover uses a strong dark overlay so footage cannot wash out the text.
- No browser warnings or errors observed in the route checks.
- No-JavaScript access remains native HTML links and visible content. Reduced-motion and constrained-network conditions were exercised in controller tests, not a real throttled mobile network or OS-level accessibility session.
- Diff whitespace check passes. Full assistive-technology, real-device, and production performance checks remain in Gate 3.

## Media budget

| Asset | Approximate size |
| --- | --- |
| Desktop video, 1280 x 720 | 2.90 MB |
| Mobile video, 640 x 640 | 1.23 MB |
| Real still poster | 171 KB |
| Both local fonts combined | 63 KB |

Only the applicable video is requested. These are file sizes, not a measured production speed score. On browsers without connection information, stalled initial playback falls back after four seconds.

## Batched remaining items

1. Owner approval of this visual gate.
2. Both completed projects: one landscape photograph each, positively mapped to the project. See PHOTO-AND-MEDIA-BRIEF.md. The text-only layout can remain if photographs are unavailable.
3. Active project: location and exact publishable scope. Until confirmed, keep its Work entry out of production.
4. RMO-approved self-performed and subcontracted scope wording. No service catalogue or trade list has been restored.
5. Certification issuers and document details before adding verification documents or badges.
6. Brother's Resend DNS table. See GODADDY-DNS.md. No account login is needed from the owner to collect this information.

## Gate 3 and launch boundary

The short form remains unavailable. The local quote endpoint returns an error instead of falsely claiming delivery. Verified-domain sending, validation and escaping, durable rate limiting, the accessible form, and a confirmed inbox test are still Gate 3 work. The existing public site's endpoint has not been changed.

Remove review-only TODO panels before launch; unresolved claims stay omitted. This review does not authorize publication.

## Repository

Branch: `codex/gate-2-visuals`, following Gate 1 commit `7ea8424`. Original checkout and public website are untouched. No DNS records changed and no email sent.
