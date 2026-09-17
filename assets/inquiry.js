const form = document.querySelector('[data-inquiry-form]');
if (form) {
  const fields = form.querySelector('fieldset');
  const availability = document.querySelector('[data-form-availability]');
  const status = form.querySelector('[data-form-status]');
  const submit = form.querySelector('[type=submit]');
  const another = form.querySelector('[data-another-inquiry]');
  const names = ['name', 'email', 'organization', 'details'];
  let enabled = false;
  let busy = false;
  let requestId;
  let lastPayload;

  function clearErrors() {
    for (const name of names) {
      form.elements[name].removeAttribute('aria-invalid');
      document.getElementById(`${name}-error`).textContent = '';
    }
  }
  function announce(message) {
    status.textContent = message;
    status.focus({ preventScroll: true });
    status.scrollIntoView({ block: 'nearest', behavior: 'instant' });
  }
  async function configure() {
    try {
      const response = await fetch('/api/inquiry-config', { cache: 'no-store', signal: AbortSignal.timeout(5000) });
      const config = await response.json();
      enabled = response.ok && config.enabled === true && typeof crypto.randomUUID === 'function';
    } catch { enabled = false; }
    fields.disabled = !enabled;
    if (enabled) availability.textContent = 'Prefer a short form? Required fields are marked. Email is best for plans and attachments.';
  }
  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (!enabled || busy) return;
    clearErrors();
    if (!form.reportValidity()) return;
    const data = Object.fromEntries(new FormData(form));
    const serialized = JSON.stringify(data);
    // Keep the same key when retrying an uncertain request without edits.
    if (!requestId || serialized !== lastPayload) { requestId = crypto.randomUUID(); lastPayload = serialized; }
    busy = true; fields.disabled = true;
    form.setAttribute('aria-busy', 'true');
    submit.textContent = 'Sending…';
    status.textContent = 'Sending your inquiry…';
    try {
      const response = await fetch('/api/quote', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, requestId }), signal: AbortSignal.timeout(15000),
      });
      const result = await response.json();
      if (response.status === 202 && result.accepted === true) {
        enabled = false;
        another.hidden = false;
        announce('Your inquiry was accepted for email delivery. This does not confirm inbox receipt. For time-sensitive bids, email bids@galoreprojects.com directly.');
      } else {
        for (const name of names) {
          if (typeof result.fields?.[name] === 'string') {
            form.elements[name].setAttribute('aria-invalid', 'true');
            document.getElementById(`${name}-error`).textContent = result.fields[name];
          }
        }
        const fallback = 'We could not confirm acceptance. Retry without changing the details, or email bids@galoreprojects.com.';
        announce(typeof result.error === 'string' ? result.error : fallback);
      }
    } catch {
      announce('We could not confirm acceptance. Your entries are still here. Retry without changing the details, or email bids@galoreprojects.com.');
    } finally {
      busy = false; fields.disabled = !enabled;
      form.removeAttribute('aria-busy'); submit.textContent = 'Send inquiry';
    }
  });
  another.addEventListener('click', async () => {
    form.reset(); clearErrors(); status.textContent = ''; requestId = undefined; lastPayload = undefined;
    another.hidden = true; await configure();
    if (enabled) form.elements.name.focus();
  });
  configure();
}
