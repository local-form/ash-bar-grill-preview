/* A.S.H. preview sections: reveal, this week, request form. */
(() => {
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];

  // reveal (house recipe)
  const els = $$('[data-reveal]');
  if (matchMedia('(prefers-reduced-motion: reduce)').matches || !('IntersectionObserver' in window)) els.forEach(e => e.classList.add('is-visible'));
  else {
    const n = new Map();
    els.forEach(e => { const p = e.parentElement, i = n.get(p) || 0; e.style.setProperty('--d', Math.min(i, 6) * .08 + 's'); n.set(p, i + 1); });
    const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('is-visible'); io.unobserve(e.target); } }), { threshold: .01, rootMargin: '0px 0px -8% 0px' });
    els.forEach(e => io.observe(e));
    setTimeout(() => els.forEach(e => { if (e.getBoundingClientRect().top < innerHeight) e.classList.add('is-visible'); }), 1500);
  }

  // today in New York
  const nyDay = () => ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(new Intl.DateTimeFormat('en-US', { timeZone: 'America/New_York', weekday: 'short' }).format(new Date()));
  const today = $(`#days li[data-day="${nyDay()}"]`);
  if (today) { today.classList.add('today'); today.setAttribute('aria-current', 'date'); }

  // what else is on, by weekday (from their Instagram)
  const ON = { 0: 'it is Football Sunday in the bar', 3: 'it is Game Night in the bar', 5: 'the DJ is on in the bar', 6: 'the DJ is on in the bar' };

  const form = $('#req-form'); if (!form) return;
  const date = $('#f-date'), guests = $('#f-guests'), done = $('#req-done');
  const iso = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  date.min = iso(new Date());

  // the hero count follows into the form, and back
  document.addEventListener('ash:count', e => { guests.value = e.detail; });
  guests.addEventListener('change', () => {
    const v = Math.max(10, Math.min(60, +guests.value || 10)); guests.value = v;
    const r = $('#n-range'); if (r) { r.value = v; r.dispatchEvent(new Event('input')); }
  });

  const clearErr = () => { $$('.err', form).forEach(x => x.parentNode.removeChild(x)); $$('[aria-invalid]', form).forEach(x => x.removeAttribute('aria-invalid')); };
  form.addEventListener('submit', e => {
    e.preventDefault();
    clearErr();
    const f = new FormData(form), name = String(f.get('name') || '').trim(), phone = String(f.get('phone') || '').trim();
    const miss = [];
    if (!name) miss.push(form.elements.name);
    if (phone.replace(/\D/g, '').length < 10) miss.push(form.elements.phone);
    if (miss.length) {
      miss.forEach(el => { const m = document.createElement('span'); m.className = 'err'; m.textContent = el.name === 'name' ? 'Add your name' : 'Add a phone number so ASH can call you back'; el.after(m); el.setAttribute('aria-invalid', 'true'); });
      miss[0].focus(); return;
    }
    const first = name.split(/\s+/)[0];
    let when = 'Date to be picked', extra = '';
    if (f.get('date')) {
      const d = new Date(f.get('date') + 'T12:00:00');
      when = d.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
      if (ON[d.getDay()]) extra = ` That night ${ON[d.getDay()]}.`;
    }
    const wants = f.getAll('want');
    done.textContent = '';
    const b = document.createElement('b'); b.textContent = `${f.get('occasion')}, ${f.get('guests')} guests`;
    const p1 = document.createElement('p'); p1.textContent = `${when}, ${String(f.get('time')).toLowerCase()}, for ${first}.${wants.length ? ' Asking about ' + wants.join(' and ') + '.' : ''}${extra}`;
    const p2 = document.createElement('p'); p2.textContent = 'Preview only: nothing was sent. On the real site, the restaurant confirms by call.';
    done.append(b, p1, p2); done.hidden = false; done.focus();
  });

  // hero button: jump to the form with the count already in
  const go = $('#to-request');
  if (go) go.addEventListener('click', () => { const r = $('#n-range'); if (r) guests.value = r.value; });
})();
