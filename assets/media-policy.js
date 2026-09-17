export function mediaPolicy({ reduced = false, saveData = false, effectiveType = '', downlink, width = 1280 } = {}) {
  const slow = ['slow-2g', '2g', '3g'].includes(effectiveType)
    || (typeof downlink === 'number' && downlink < 1.5);
  return { autoplay: !reduced && !saveData && !slow, mobile: width <= 700 };
}

export function entranceDuration(reduced, canAnimate = true) {
  return reduced || !canAnimate ? 0 : 520;
}
