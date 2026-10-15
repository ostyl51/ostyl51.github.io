// Project request form → Firestore "requests" collection.
import { firebaseConfig } from './firebase-config.js';

const SDK = 'https://www.gstatic.com/firebasejs/10.12.2/';
const EMAIL = 'ostyl51@gmail.com';
const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

const form = document.getElementById('contactForm');
const status = document.getElementById('formStatus');
const button = document.getElementById('formSubmit');
const loadedAt = Date.now();

const configured = Boolean(firebaseConfig && firebaseConfig.projectId && !firebaseConfig.projectId.startsWith('YOUR_'));

// Load Firebase only when it is needed, so the page itself stays fast.
let firestorePromise = null;
function getFirestoreApi() {
  if (!firestorePromise) {
    firestorePromise = Promise.all([
      import(SDK + 'firebase-app.js'),
      import(SDK + 'firebase-firestore.js')
    ]).then(([appSdk, fs]) => {
      const app = appSdk.initializeApp(firebaseConfig);
      return { db: fs.getFirestore(app), fs };
    });
  }
  return firestorePromise;
}

function setStatus(text, kind) {
  status.textContent = text;
  status.classList.toggle('err', kind === 'err');
  status.classList.toggle('ok', kind === 'ok');
}

function readForm() {
  const d = new FormData(form);
  const get = (k) => String(d.get(k) || '').trim();
  return {
    name: get('name').slice(0, 100),
    email: get('email').slice(0, 200),
    projectType: get('projectType'),
    budget: get('budget') || 'not-sure',
    timeline: get('timeline') || 'flexible',
    message: get('message').slice(0, 3000),
    honeypot: get('website')
  };
}

function validate(v) {
  const bad = [];
  if (!v.name) bad.push('name');
  if (!EMAIL_RE.test(v.email)) bad.push('email');
  if (!v.projectType) bad.push('projectType');
  if (!v.message) bad.push('message');
  form.querySelectorAll('input, select, textarea').forEach((el) => el.classList.toggle('invalid', bad.includes(el.name)));
  return bad.length === 0;
}

function mailtoFallback(v) {
  const body = `${v.message}\n\nProject type: ${v.projectType}\nBudget: ${v.budget}\nTimeline: ${v.timeline}\n\n${v.name}\n${v.email}`;
  window.location.href = `mailto:${EMAIL}?subject=${encodeURIComponent('Project request from ' + v.name)}&body=${encodeURIComponent(body)}`;
  setStatus(`Opening your email app… if nothing opens, write to ${EMAIL}.`);
}

// Warm up the SDK when the visitor starts filling in the form.
form.addEventListener('focusin', () => { if (configured) getFirestoreApi().catch(() => {}); }, { once: true });

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const v = readForm();

  if (!validate(v)) {
    setStatus('Please fill in your name, a valid email, the project type and a short description.', 'err');
    return;
  }

  // Bots fill the hidden field or submit instantly: pretend it worked and store nothing.
  if (v.honeypot || Date.now() - loadedAt < 3000) {
    form.reset();
    setStatus('Thanks! Your request has been sent.', 'ok');
    return;
  }

  if (!configured) { mailtoFallback(v); return; }

  button.disabled = true;
  setStatus('Sending your request…');
  try {
    const { db, fs } = await getFirestoreApi();
    await fs.addDoc(fs.collection(db, 'requests'), {
      name: v.name,
      email: v.email,
      projectType: v.projectType,
      budget: v.budget,
      timeline: v.timeline,
      message: v.message,
      status: 'new',
      createdAt: fs.serverTimestamp()
    });
    form.reset();
    setStatus(`Thanks, ${v.name}! Your request is in. I'll reply to ${v.email} soon.`, 'ok');
  } catch (err) {
    console.error('Request form error:', err);
    setStatus(`Sorry, something went wrong. Please email me at ${EMAIL}.`, 'err');
  } finally {
    button.disabled = false;
  }
});
