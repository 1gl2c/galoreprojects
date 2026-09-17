// Local review only. Never copied into the production build.
window.addEventListener('load', async () => {
  await document.fonts.ready;
  if (new URLSearchParams(location.search).has('spacing')) {
    const style=document.createElement('style');
    style.textContent='* { letter-spacing:.12em !important; word-spacing:.16em !important; line-height:1.5 !important; } p { margin-bottom:2em !important; }';
    document.head.append(style);
  }
  const report = document.createElement('pre');
  report.id = 'qa-report';
  report.setAttribute('role','region');
  report.setAttribute('aria-label','Local accessibility report');
  report.style.cssText = 'white-space:pre-wrap;padding:24px;border:2px solid #d5b875;background:#121612;color:#f4f1e9;font:16px monospace;position:relative;z-index:60';
  const results = await axe.run(document, { runOnly: {type:'tag',values:['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']}});
  report.textContent = JSON.stringify({ violations: results.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))})), incomplete:results.incomplete.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})), passes:results.passes.length, resources:performance.getEntriesByType('resource').map(r=>({name:new URL(r.name).pathname,bytes:r.decodedBodySize})), navigation:performance.getEntriesByType('navigation').map(n=>({domContentLoaded:Math.round(n.domContentLoadedEventEnd),load:Math.round(n.loadEventEnd)})) },null,2);
  document.body.append(report);
});
