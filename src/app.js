/* ── DATA ───────────────────────────────────────────────────────── */
const THERAPISTS = [
  { id:'t001', name:'Dr. Jean-Claude Rutayisire', avatar:'JR', yearsExp:12,
    specialization:'Anxiety and Trauma',
    languages:['English','French','Kinyarwanda'],
    availability:['Mon','Tue','Thu'],
    about:'Dr. Rutayisire draws on 12 years of experience to support people navigating anxiety and trauma. He works at a pace set by you, in a space that is genuinely safe.' },
  { id:'t002', name:'Keza Uwera', avatar:'KU', yearsExp:9,
    specialization:'Relationships and Grief',
    languages:['English','French','Kinyarwanda'],
    availability:['Tue','Wed','Fri','Sat'],
    about:'Keza works with individuals and couples navigating loss, conflict, and change. Her approach is warm, direct, and grounded in building emotional safety.' },
  { id:'t003', name:'Dr. Amina Ndiaye', avatar:'AN', yearsExp:7,
    specialization:'Anxiety, OCD and Burnout',
    languages:['English','French','Wolof'],
    availability:['Mon','Wed','Thu','Fri'],
    about:'Dr. Ndiaye brings a culturally sensitive lens to anxiety and burnout. She believes the therapeutic relationship itself is healing and prioritises genuine connection.' },
  { id:'t004', name:'Mutesi Kagabo', avatar:'MK', yearsExp:11,
    specialization:'Depression and Addiction',
    languages:['Kinyarwanda','English'],
    availability:['Mon','Tue','Wed'],
    about:'Mutesi specialises in depression and substance use, working especially with people who have been taught to suppress what they feel. No judgment, no rush.' },
  { id:'t005', name:'Dr. Kwame Osei', avatar:'KO', yearsExp:8,
    specialization:'Identity and Race-Based Stress',
    languages:['English','Twi'],
    availability:['Tue','Thu','Sat'],
    about:'Dr. Osei supports clients in building a compassionate relationship with their identity and navigating cultural stress. His work is gentle and affirming.' },
  { id:'t006', name:'Gisa Mugisha', avatar:'GM', yearsExp:14,
    specialization:'Trauma and Family Conflict',
    languages:['Kinyarwanda','French','English'],
    availability:['Mon','Wed','Fri'],
    about:'Gisa has worked extensively with families navigating intergenerational trauma and conflict. He offers a space where cultural identity is honoured, not erased.' },
  { id:'t007', name:'Dr. Thabo Ndlovu', avatar:'TN', yearsExp:6,
    specialization:'ADHD and Executive Function',
    languages:['English','Zulu'],
    availability:['Tue','Thu','Fri'],
    about:'Dr. Ndlovu helps adults build systems that work with how their brain functions, not against it. Practical, structured, and free of shame.' },
  { id:'t008', name:'Nneka Okafor', avatar:'NO', yearsExp:13,
    specialization:'Phobias and Social Anxiety',
    languages:['English','Igbo'],
    availability:['Mon','Thu','Sat'],
    about:'Nneka uses evidence-based exposure work to help people reclaim their lives from phobias, panic, and social anxiety. Thorough, patient, and effective.' },
  { id:'t009', name:'Dr. Zola Mkhize', avatar:'ZM', yearsExp:10,
    specialization:'Stress and Burnout',
    languages:['English','Xhosa'],
    availability:['Wed','Thu','Fri'],
    about:'Dr. Mkhize blends mindfulness with practical psychology to help people shift their relationship with stress. Clients often describe her sessions as clarifying.' },
  { id:'t010', name:'Dr. Chidi Achebe', avatar:'CA', yearsExp:15,
    specialization:'Complex Trauma and PTSD',
    languages:['English','Igbo'],
    availability:['Mon','Tue','Fri'],
    about:'Dr. Achebe specialises in developmental and complex trauma, working gently and at your pace so that processing the past does not feel overwhelming.' }
];

/* ── STATE ──────────────────────────────────────────────────────── */
const S = {
  session: null,
  bookingT: null,
  sel: { dur: null, lang: null, day: null, time: null },
  debTimer: null,
  chatClient: null,
  chatChannel: null,
};

/* ── HELPERS ────────────────────────────────────────────────────── */
function esc(s) {
  return String(s||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
function uuid() {
  return 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random()*16|0;
    return (c==='x'?r:(r&0x3|0x8)).toString(16);
  });
}
let toastTmr;
function toast(msg, type='') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'toast show ' + type;
  clearTimeout(toastTmr);
  toastTmr = setTimeout(() => el.className = 'toast', 3600);
}

/* ── INIT ───────────────────────────────────────────────────────── */
(function init() {
  try {
    const saved = localStorage.getItem('mb_session');
    if (saved) { S.session = JSON.parse(saved); updateNavUI(true); }
  } catch(e) { localStorage.removeItem('mb_session'); }

  const specs = [...new Set(THERAPISTS.map(t => t.specialization))].sort();
  const sel = document.getElementById('fi-spec');
  specs.forEach(v => {
    const o = document.createElement('option');
    o.value = v; o.textContent = v; sel.appendChild(o);
  });

  showView('home');
})();

/* ── VIEWS ──────────────────────────────────────────────────────── */
function showView(name) {
  document.querySelectorAll('.view').forEach(v => v.classList.remove('active'));
  document.getElementById('view-' + name).classList.add('active');
  window.scrollTo(0, 0);
  if (name === 'browse')    renderList(filterTherapists());
  if (name === 'bookings')  renderBookings();
  if (name === 'resources') fetchArticles();
}

/* ── AUTH ───────────────────────────────────────────────────────── */
function startSession() {
  if (S.session) return;
  S.session = { userId: 'anon_' + uuid(), bookings: [] };
  localStorage.setItem('mb_session', JSON.stringify(S.session));
  updateNavUI(true);
  toast('Session started. Your identity is never stored.', 'success');
}
function startAndBrowse() { startSession(); showView('browse'); }
function updateNavUI(on) {
  document.getElementById('nav-start').style.display    = on ? 'none' : '';
  document.getElementById('nav-logout').style.display   = on ? '' : 'none';
  document.getElementById('nav-bookings').style.display = on ? '' : 'none';
}
async function logout() {
  if (S.chatClient) { try { await S.chatClient.disconnectUser(); } catch(e){} S.chatClient = null; }
  S.session = null;
  localStorage.removeItem('mb_session');
  updateNavUI(false);
  toast('Session ended.');
  showView('home');
}

/* ── FILTER & SORT ──────────────────────────────────────────────── */
function filterTherapists() {
  const q    = document.getElementById('fi-search').value.toLowerCase().trim();
  const spec = document.getElementById('fi-spec').value;
  const lang = document.getElementById('fi-lang').value;
  const sort = document.getElementById('fi-sort').value;

  let r = THERAPISTS.filter(t => {
    if (q && !t.name.toLowerCase().includes(q)
          && !t.specialization.toLowerCase().includes(q)
          && !t.about.toLowerCase().includes(q)) return false;
    if (spec && t.specialization !== spec) return false;
    if (lang && !t.languages.includes(lang)) return false;
    return true;
  });

  if (sort === 'name')       r.sort((a,b) => a.name.localeCompare(b.name));
  if (sort === 'experience') r.sort((a,b) => b.yearsExp - a.yearsExp);
  return r;
}
function applyFilters() { renderList(filterTherapists()); }
function debounce() { clearTimeout(S.debTimer); S.debTimer = setTimeout(applyFilters, 260); }
function clearFilters() {
  document.getElementById('fi-search').value = '';
  document.getElementById('fi-spec').value   = '';
  document.getElementById('fi-lang').value   = '';
  document.getElementById('fi-sort').value   = 'name';
  applyFilters();
}

/* ── RENDER LIST ────────────────────────────────────────────────── */
function renderList(list) {
  const el   = document.getElementById('therapist-list');
  const none = document.getElementById('no-results');
  document.getElementById('results-count').textContent =
    list.length + ' therapist' + (list.length !== 1 ? 's' : '');

  if (!list.length) { el.innerHTML = ''; none.style.display = 'block'; return; }
  none.style.display = 'none';

  el.innerHTML = list.map(t => `
    <div class="tcard">
      <div class="tcard-top">
        <div class="avatar">${esc(t.avatar)}</div>
        <div>
          <div class="tcard-name">${esc(t.name)}</div>
          <div class="tcard-spec">${esc(t.specialization)}</div>
        </div>
      </div>
      <p class="tcard-about">${esc(t.about)}</p>
      <div class="tcard-actions">
        <button class="btn btn-outline btn-sm" onclick="openModal(event,'${t.id}')">Book a Session</button>
        <button class="btn btn-primary btn-sm" onclick="openChat(event,'${t.id}')">Send Message</button>
      </div>
    </div>`).join('');
}

/* ── BOOKING MODAL ──────────────────────────────────────────────── */
function openModal(e, id) {
  e.stopPropagation();
  if (!S.session) startSession();
  const t = THERAPISTS.find(x => x.id === id);
  if (!t) return;
  S.bookingT = t;
  S.sel = { dur: null, lang: null, day: null, time: null };

  document.getElementById('modal-sub').textContent = 'With ' + t.name;
  document.getElementById('modal-err').style.display = 'none';
  document.querySelectorAll('.pill-btn, .time-slot').forEach(b => b.classList.remove('sel'));

  document.getElementById('day-picker').innerHTML =
    t.availability.map(d => `<button class="pill-btn" onclick="selDay(this,'${d}')">${d}</button>`).join('');

  document.getElementById('booking-modal').classList.add('open');
}
function closeModal() { document.getElementById('booking-modal').classList.remove('open'); }

function selPill(btn, group, val) {
  btn.closest('.pill-row').querySelectorAll('.pill-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  S.sel[group] = val;
}
function selDay(btn, day) {
  document.getElementById('day-picker').querySelectorAll('.pill-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  S.sel.day = day;
}
function selTime(btn) {
  document.querySelectorAll('.time-slot').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  S.sel.time = btn.textContent;
}
function confirmBooking() {
  const err = document.getElementById('modal-err');
  const checks = [
    [S.sel.dur,  'Please choose a session length.'],
    [S.sel.lang, 'Please choose a language.'],
    [S.sel.day,  'Please select a day.'],
    [S.sel.time, 'Please select a time.'],
  ];
  for (const [val, msg] of checks) {
    if (!val) { err.textContent = msg; err.style.display = 'block'; return; }
  }
  err.style.display = 'none';

  const booking = {
    id: 'bk_' + Date.now(),
    therapistId:   S.bookingT.id,
    therapistName: S.bookingT.name,
    day:      S.sel.day,
    time:     S.sel.time,
    duration: S.sel.dur,
    language: S.sel.lang,
    bookedAt: new Date().toISOString(),
  };
  S.session.bookings.push(booking);
  localStorage.setItem('mb_session', JSON.stringify(S.session));
  closeModal();
  toast('Booked with ' + S.bookingT.name + ' — ' + S.sel.day + ' at ' + S.sel.time + ' (' + S.sel.dur + ', ' + S.sel.lang + ')', 'success');
}

/* ── BOOKINGS VIEW ──────────────────────────────────────────────── */
function renderBookings() {
  const el = document.getElementById('bookings-list');
  if (!S.session || !S.session.bookings.length) {
    el.innerHTML = '<div class="empty-state"><p>You have no bookings yet.</p><button class="btn btn-primary" onclick="showView(\'browse\')">Find a Therapist</button></div>';
    return;
  }
  el.innerHTML = S.session.bookings.map(b => {
    const t = THERAPISTS.find(x => x.id === b.therapistId);
    return `<div class="booking-item">
      <div class="avatar" style="width:38px;height:38px;font-size:.7rem;flex-shrink:0">${t ? esc(t.avatar) : '?'}</div>
      <div class="booking-info">
        <div class="booking-name">${esc(b.therapistName)}</div>
        <div class="booking-when">${esc(b.day)} at ${esc(b.time)} &middot; ${esc(b.duration)} &middot; ${esc(b.language)}</div>
      </div>
      <span class="booking-status">Confirmed</span>
      <button class="btn btn-outline btn-sm" onclick="openChat(event,'${b.therapistId}')">Message</button>
    </div>`;
  }).join('');
}

/* ── CHAT ───────────────────────────────────────────────────────── */
async function openChat(e, therapistId) {
  e.stopPropagation();
  if (!S.session) startSession();
  const t = THERAPISTS.find(x => x.id === therapistId);
  showView('chat');

  document.getElementById('chat-head-info').innerHTML =
    t ? `${esc(t.name)}<small>${esc(t.specialization)}</small>` : 'Therapist';

  const body = document.getElementById('chat-body');
  const foot = document.getElementById('chat-foot');
  foot.style.display = 'none';

  const apiKey = (typeof CONFIG !== 'undefined') ? CONFIG.STREAM_API_KEY : 'YOUR_STREAM_API_KEY';

  if (!apiKey || apiKey === 'YOUR_STREAM_API_KEY') {
    body.innerHTML = `<div class="chat-center">
      <h3>Chat not yet configured</h3>
      <p>Open <code>config.js</code> and replace the placeholder with your Stream API key:</p>
      <code>STREAM_API_KEY: 'your_actual_key_here'</code>
      <p>Get a free key at <a href="https://getstream.io/chat/" target="_blank" style="color:var(--sage)">getstream.io</a></p>
    </div>`;
    return;
  }

  body.innerHTML = '<div class="chat-center"><div class="spinner"></div><p>Connecting...</p></div>';

  try {
    if (S.chatClient) { await S.chatClient.disconnectUser(); S.chatClient = null; }
    // stream-chat v8 browser bundle exposes as window.StreamChat.StreamChat
    const SC = window.StreamChat?.StreamChat || window.StreamChat;
    if (!SC || !SC.getInstance) throw new Error('Stream Chat SDK failed to load. Check your internet connection.');
    S.chatClient = SC.getInstance(apiKey);
    const userId = S.session.userId;
    await S.chatClient.connectUser({ id: userId, name: 'Anonymous User' }, S.chatClient.devToken(userId));

    const tId = 'therapist_' + therapistId;
    const cId = ['mb', userId, tId].sort().join('_').slice(0,64).replace(/[^a-zA-Z0-9_-]/g,'_');
    const channel = S.chatClient.channel('messaging', cId, { name: 'Private Session' });
    await channel.watch();
    S.chatChannel = channel;

    body.innerHTML = '';
    if (!channel.state.messages.length) {
      body.innerHTML = `<div class="chat-system">Your conversation with ${esc(t ? t.name : 'your therapist')} starts here. Messages are private and encrypted.</div>`;
    } else {
      channel.state.messages.forEach(m => appendBubble(m));
    }
    channel.on('message.new', ev => appendBubble(ev.message));
    foot.style.display = 'flex';
    document.getElementById('chat-input').focus();

  } catch (err) {
    body.innerHTML = `<div class="chat-center">
      <h3>Could not connect</h3>
      <p>${esc(err.message)}</p>
      <p style="font-size:.78rem;color:var(--ink-faint)">Check your Stream API key and make sure development tokens are enabled in your Stream dashboard.</p>
    </div>`;
  }
}

function appendBubble(msg) {
  const body = document.getElementById('chat-body');
  if (!body) return;
  const mine = msg.user?.id === S.session?.userId;
  const time = new Date(msg.created_at).toLocaleTimeString([], { hour:'2-digit', minute:'2-digit' });
  const el = document.createElement('div');
  el.className = 'chat-msg-wrap ' + (mine ? 'mine' : 'theirs');
  el.innerHTML = `<div class="chat-bubble">${esc(msg.text||'')}</div><span class="chat-time">${time}</span>`;
  body.appendChild(el);
  body.scrollTop = body.scrollHeight;
}

async function sendMsg() {
  const inp = document.getElementById('chat-input');
  const text = inp.value.trim();
  if (!text || !S.chatChannel) return;
  inp.value = '';
  try {
    await S.chatChannel.sendMessage({ text });
  } catch (err) {
    toast('Message failed. Please try again.', 'error');
    inp.value = text;
  }
}

/* ── RESOURCES — Guardian API ───────────────────────────────────── */
let resDebTimer;
let resTopic = 'mental health';
const resCache = {};

function debounceResources() {
  clearTimeout(resDebTimer);
  resDebTimer = setTimeout(fetchArticles, 400);
}

function setTopic(btn, topic) {
  document.querySelectorAll('.topic-btn').forEach(b => b.classList.remove('sel'));
  btn.classList.add('sel');
  resTopic = topic;
  fetchArticles();
}

async function fetchArticles() {
  const apiKey = (typeof CONFIG !== 'undefined') ? CONFIG.GUARDIAN_API_KEY : '';
  const grid = document.getElementById('articles-grid');
  const countEl = document.getElementById('articles-count');
  if (!grid) return;

  // No key configured yet
  if (!apiKey || apiKey === 'YOUR_GUARDIAN_API_KEY') {
    grid.innerHTML = `<div class="res-message">
      <h3>Resources not yet configured</h3>
      <p>Open <code>config.js</code> and add your Guardian API key:</p>
      <code>GUARDIAN_API_KEY: 'your_actual_key_here'</code>
      <p style="margin-top:10px">Get a free key at
        <a href="https://bonobo.capi.gutools.co.uk/register/developer"
           target="_blank" rel="noopener" style="color:var(--sage)">open-platform.theguardian.com</a>
      </p>
    </div>`;
    if (countEl) countEl.textContent = '';
    return;
  }

  const searchQ = (document.getElementById('res-search')?.value || '').trim();
  const sort    = document.getElementById('res-sort')?.value || 'newest';
  const query   = searchQ || resTopic;
  const cacheKey = `${query}|${sort}`;

  // Show skeleton cards while loading
  if (!resCache[cacheKey]) {
    grid.innerHTML = Array(6).fill(`
      <div class="article-card">
        <div class="skeleton" style="height:160px;border-radius:0"></div>
        <div class="article-body">
          <div class="skeleton" style="height:13px;width:55%;margin-bottom:4px"></div>
          <div class="skeleton" style="height:16px;margin-bottom:3px"></div>
          <div class="skeleton" style="height:16px;width:80%"></div>
          <div class="skeleton" style="height:12px;width:38%;margin-top:8px"></div>
        </div>
      </div>`).join('');
    if (countEl) countEl.textContent = '';
  }

  // Serve from cache if available
  if (resCache[cacheKey]) {
    renderArticles(resCache[cacheKey], countEl);
    return;
  }

  try {
    const params = new URLSearchParams({
      q:             query,
      'order-by':    sort,
      'show-fields': 'thumbnail,trailText',
      'page-size':   '18',
      'api-key':     apiKey,
    });
    const res = await fetch(`https://content.guardianapis.com/search?${params}`);

    if (res.status === 401) throw new Error('Invalid Guardian API key. Check config.js.');
    if (res.status === 429) throw new Error('Rate limit reached. Please wait a moment and try again.');
    if (!res.ok)            throw new Error(`Guardian API error (HTTP ${res.status}).`);

    const data = await res.json();
    if (data.response?.status !== 'ok') throw new Error('Guardian API returned an unexpected response.');

    const articles = data.response.results || [];
    resCache[cacheKey] = articles;   // cache for session
    renderArticles(articles, countEl);

  } catch (err) {
    grid.innerHTML = `<div class="res-message">
      <h3>Could not load articles</h3>
      <p>${esc(err.message)}</p>
      <p style="font-size:.78rem;margin-top:6px;color:var(--ink-faint)">Check your Guardian API key or your internet connection.</p>
      <button class="btn btn-outline" style="margin-top:16px" onclick="fetchArticles()">Try again</button>
    </div>`;
    if (countEl) countEl.textContent = '';
  }
}

function renderArticles(articles, countEl) {
  const grid = document.getElementById('articles-grid');
  if (!grid) return;

  if (countEl) {
    countEl.textContent = articles.length
      ? articles.length + ' article' + (articles.length !== 1 ? 's' : '') + ' found'
      : '';
  }

  if (!articles.length) {
    grid.innerHTML = `<div class="res-message">
      <h3>No articles found</h3>
      <p>Try a different search term or choose another topic.</p>
    </div>`;
    return;
  }

  grid.innerHTML = articles.map(a => {
    const date  = new Date(a.webPublicationDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' });
    const thumb = a.fields?.thumbnail || '';
    const trail = a.fields?.trailText ? a.fields.trailText.replace(/<[^>]*>/g, '') : '';
    return `<div class="article-card">
      ${ thumb
        ? `<img class="article-thumb" src="${esc(thumb)}" alt="" loading="lazy"
               onerror="this.style.display='none';this.nextElementSibling.style.display='flex'">`
        : '' }
      <div class="article-thumb-placeholder" style="${thumb ? 'display:none' : ''}">&#128240;</div>
      <div class="article-body">
        <span class="article-section-tag">${esc(a.sectionName)}</span>
        <div class="article-title">${esc(a.webTitle)}</div>
        ${ trail ? `<div class="article-trail">${esc(trail)}</div>` : '' }
        <div class="article-meta">${date}</div>
        <a class="article-read" href="${esc(a.webUrl)}" target="_blank" rel="noopener">Read article &#8594;</a>
      </div>
    </div>`;
  }).join('');
}
