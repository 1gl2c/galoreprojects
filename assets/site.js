const cover = document.querySelector('[data-cover]');
const main = document.querySelector('main');
// Content remains visible if scripting or storage is unavailable.
if (cover) {
  let entered = false;
  try { entered = sessionStorage.getItem('galore-entered') === 'yes'; } catch {}
  if (entered || location.hash) cover.hidden = true;
  document.querySelector('[data-enter]')?.addEventListener('click', (event) => {
    event.preventDefault();
    cover.hidden = true;
    try { sessionStorage.setItem('galore-entered', 'yes'); } catch {}
    history.replaceState(null, '', '#main');
    main.focus({ preventScroll: true });
    main.scrollIntoView({ behavior: 'instant', block: 'start' });
  });
}
