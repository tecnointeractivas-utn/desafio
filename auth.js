// auth.js (ES module)
import { initializeApp } from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-app.js';
import {
  getAuth, onAuthStateChanged,
  signInWithEmailAndPassword, createUserWithEmailAndPassword,
  sendPasswordResetEmail, signOut, setPersistence, browserLocalPersistence
} from 'https://www.gstatic.com/firebasejs/10.13.2/firebase-auth.js';
import { firebaseConfig } from './firebase-config.js';

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);

// Persiste la sesión (equivalente a “Recuérdame”)
await setPersistence(auth, browserLocalPersistence);

// ==== Helpers de UI ====
function val(id){ return /** @type {HTMLInputElement|null} */(document.getElementById(id))?.value?.trim() ?? '' }
function byId(id){ return document.getElementById(id) }
function toast(msg){ alert(msg) } // cámbialo por tu propio toast si quieres

// ==== Acciones si estamos en login.html ====
const form = document.querySelector('form');
if (form) {
  // submit = iniciar sesión
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = val('email');
    const pass  = val('pass');
    try {
      await signInWithEmailAndPassword(auth, email, pass);
      location.href = 'main.html';
    } catch (err) {
      console.error(err);
      toast('Error iniciando sesión. Revisa tu correo/contraseña.');
    }
  });

  // crear cuenta
  byId('signup')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = val('email');
    const pass  = val('pass');
    try {
      await createUserWithEmailAndPassword(auth, email, pass);
      location.href = 'main.html';
    } catch (err) {
      console.error(err);
      toast('No se pudo crear la cuenta. ¿La contraseña tiene 6+ caracteres?');
    }
  });

  // reset de contraseña
  byId('reset')?.addEventListener('click', async (e) => {
    e.preventDefault();
    const email = val('email');
    if (!email) return toast('Escribe tu correo arriba para enviarte el link.');
    try {
      await sendPasswordResetEmail(auth, email);
      toast('Te enviamos un email para restablecer la contraseña.');
    } catch (err) {
      console.error(err);
      toast('No se pudo enviar el email de recuperación.');
    }
  });

  // Si ya está logueado y abrió login.html, redirige a main.html
  onAuthStateChanged(auth, (user) => {
    if (user) location.href = 'main.html';
  });
}

// ==== Protección para páginas privadas (main.html) ====
export function requireAuth() {
  onAuthStateChanged(auth, (user) => {
    if (!user) location.href = 'login.html';
  });
}

// ==== Logout global para usar desde botones ====
export async function logout() {
  await signOut(auth);
  location.href = 'login.html';
}
