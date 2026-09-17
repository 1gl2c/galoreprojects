import { mediaPolicy, entranceDuration } from './media-policy.js';

const cover = document.querySelector('[data-cover]');
const main = document.querySelector('main');
const reduced = matchMedia('(prefers-reduced-motion: reduce)');
const connection = navigator.connection;

if (cover) {
  const video = cover.querySelector('[data-cover-video]');
  const toggle = cover.querySelector('[data-motion-toggle]');
  let entered = false;
  try { entered = sessionStorage.getItem('galore-entered') === 'yes'; } catch {}
  const previewCover = new URLSearchParams(location.search).get('cover') === '1';
  cover.hidden = !previewCover && (entered || Boolean(location.hash));

  let entering = false;
  let transition;
  let loadingTimer;
  let playAttempt = 0;
  let requestedPlayback = false;
  let loading = false;
  let observer;
  const getPolicy = () => mediaPolicy({
    reduced: reduced.matches, saveData: connection?.saveData,
    effectiveType: connection?.effectiveType, downlink: connection?.downlink,
    width: innerWidth,
  });

  function controlState() {
    const running = !video.paused || loading;
    toggle.setAttribute('aria-label', running ? 'Pause background video' : 'Play background video');
    toggle.querySelector('[data-motion-label]').textContent = running ? 'Pause video' : 'Play video';
    toggle.querySelector('[data-motion-icon]').textContent = running ? 'Ⅱ' : '▷';
  }

  function pause({ unload = false, forget = false } = {}) {
    playAttempt++;
    clearTimeout(loadingTimer);
    loading = false;
    if (forget) requestedPlayback = false;
    video.pause();
    if (unload) {
      video.removeAttribute('src');
      video.load();
      cover.classList.remove('has-video');
    }
    controlState();
  }

  async function play() {
    if (cover.hidden || entering || document.hidden) return;
    const attempt = ++playAttempt;
    requestedPlayback = true;
    loading = true;
    controlState();
    if (!video.getAttribute('src')) {
      video.src = getPolicy().mobile ? video.dataset.mobile : video.dataset.desktop;
      video.muted = true;
      video.load();
    }
    clearTimeout(loadingTimer);
    // The poster and entrance are usable immediately. Slow or failed video is optional.
    loadingTimer = setTimeout(() => {
      if (attempt === playAttempt) pause({ unload: true, forget: true });
    }, 4000);
    try {
      await video.play();
      if (attempt !== playAttempt) return;
      clearTimeout(loadingTimer);
      loading = false;
      cover.classList.add('has-video');
      controlState();
    } catch {
      if (attempt === playAttempt) pause({ unload: true, forget: true });
    }
  }

  video.addEventListener('error', () => pause({ unload: true, forget: true }));
  toggle.addEventListener('click', () => {
    if (loading || !video.paused) pause({ forget: true });
    else play(); // Explicit playback is available when autoplay is declined.
  });
  if (!cover.hidden) toggle.hidden = false;

  function finishEntrance() {
    cover.hidden = true;
    cover.removeAttribute('style');
    cover.inert = false;
    cover.removeAttribute('aria-hidden');
    observer?.disconnect();
    pause({ unload: true, forget: true });
  }

  document.querySelector('[data-enter]').addEventListener('click', (event) => {
    event.preventDefault();
    if (entering) return;
    entering = true;
    const rect = cover.getBoundingClientRect();
    const duration = entranceDuration(reduced.matches, typeof cover.animate === 'function');
    try { sessionStorage.setItem('galore-entered', 'yes'); } catch {}
    const address = new URL(location.href);
    address.searchParams.delete('cover');
    address.hash = 'main';
    history.replaceState(null, '', address.pathname + address.search + address.hash);

    if (duration) {
      // Remove the cover from document flow while keeping the same visual surface.
      // A single upward wipe reveals the content beneath it, with no cloned UI.
      Object.assign(cover.style, {
        position: 'fixed', top: `${rect.top}px`, left: '0', width: '100%',
        height: `${rect.height}px`, minHeight: '0', zIndex: '35',
      });
      cover.inert = true;
      cover.setAttribute('aria-hidden', 'true');
    } else cover.hidden = true;

    main.focus({ preventScroll: true });
    main.scrollIntoView({ behavior: 'instant', block: 'start' });
    if (!duration) return finishEntrance();
    try {
      transition = cover.animate(
        [{ clipPath: 'inset(0 0 0 0)' }, { clipPath: 'inset(0 0 100% 0)' }],
        { duration, easing: 'cubic-bezier(.22,.7,.15,1)', fill: 'forwards' },
      );
      transition.finished.then(finishEntrance, finishEntrance);
      setTimeout(finishEntrance, duration + 150);
    } catch { finishEntrance(); }
  });

  function respectPreferences() {
    if (!getPolicy().autoplay) {
      if (entering) { transition?.cancel(); finishEntrance(); }
      pause({ unload: true, forget: true });
    }
  }
  reduced.addEventListener('change', respectPreferences);
  connection?.addEventListener?.('change', respectPreferences);
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else if (requestedPlayback && !cover.hidden && getPolicy().autoplay) play();
  });
  window.addEventListener('pagehide', () => pause({ unload: true, forget: true }));
  if ('IntersectionObserver' in window && !cover.hidden) {
    observer = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) pause();
      else if (requestedPlayback && video.paused && !loading && getPolicy().autoplay) play();
    }, { threshold: 0.1 });
    observer.observe(cover);
  }
  if (!cover.hidden && getPolicy().autoplay) {
    // No media request until the page and poster have loaded.
    const start = () => { if (!cover.hidden && !entering && getPolicy().autoplay) play(); };
    if (document.readyState === 'complete') start();
    else window.addEventListener('load', start, { once: true });
  }
}
