/* A.S.H. preview: header menu, room planner controls, open-now line. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // ---- mobile menu
  const btn = $('.menu-btn'), nav = $('#site-nav');
  if (btn) {
    const close = () => { document.documentElement.classList.remove('nav-open'); btn.setAttribute('aria-expanded', 'false'); btn.setAttribute('aria-label', 'Open menu'); };
    btn.addEventListener('click', () => {
      const open = document.documentElement.classList.toggle('nav-open');
      btn.setAttribute('aria-expanded', open); btn.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    });
    $$('a', nav).forEach(a => a.addEventListener('click', close));
    addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
  }

  // ---- hours (only what sources agree on: opens 11am daily, Fri-Sat until 2am, Sun-Thu until at least 1am)
  // Returns {state:'open'|'closed'|'check', text}
  function nowNY() {
    const p = new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false }).formatToParts(new Date());
    const g = t => p.find(x => x.type === t).value;
    return { day: ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(g('weekday')), h: +g('hour') % 24, m: +g('minute') };
  }
  function status(t = nowNY()) {
    const mins = t.h * 60 + t.m;
    const prev = (t.day + 6) % 7;                       // the night that started yesterday
    const lateNight = prev === 5 || prev === 6;          // Fri or Sat night runs to 2am
    if (mins < 60) return { state: 'open', text: lateNight ? 'Open now until 2am' : 'Open now until 1am (some sources say 2am)' };
    if (mins < 120) return lateNight ? { state: 'open', text: 'Open now until 2am' } : { state: 'check', text: 'Late night: call to check if they’re still open' };
    if (mins < 660) return { state: 'closed', text: 'Closed now · opens at 11am' };
    const tonight = t.day === 5 || t.day === 6;
    return { state: 'open', text: tonight ? 'Open now until 2am' : 'Open now until 1am or later' };
  }
  window.ashStatus = status;
  const ol = $('#open-line');
  if (ol) { const s = status(); ol.textContent = s.text; ol.dataset.state = s.state; }

  // ---- room planner
  const range = $('#n-range'), out = $('#n-out b'), fit = $('#fit');
  if (range) {
    const words = ['', 'One round table', 'Two round tables', 'Three round tables', 'Four round tables', 'Five round tables', 'Six round tables', 'Seven round tables', 'Eight round tables'];
    const set = n => {
      n = Math.max(10, Math.min(60, n));
      range.value = n; out.textContent = n; window.ashRoom && window.ashRoom.set(n);
      const tb = Math.min(8, Math.ceil(n / 8));
      fit.textContent = n >= 57 ? 'The whole room · it seats up to 60' : `${words[tb]} of 8 · the room seats up to 60`;
      $('#room').setAttribute('aria-label', `Illustration of a party room at night, set for ${n} guests at round tables under strings of lights`);
      document.dispatchEvent(new CustomEvent('ash:count', { detail: n }));
    };
    range.addEventListener('input', () => set(+range.value));
    $$('.step').forEach(b => b.addEventListener('click', () => set(+range.value + +b.dataset.d)));
    set(+range.value);
    document.addEventListener('ash:room', () => set(+range.value));
  }
})();
