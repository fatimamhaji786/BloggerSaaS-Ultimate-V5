/*
===========================================
BloggerSaaS Ultimate V5 Enterprise
Firebase Authentication
===========================================
*/

import {
  getAuth,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  signOut,
  sendPasswordResetEmail
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-auth.js";

import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/10.12.5/firebase-app.js";

import {
  firebaseConfig
} from "./firebase-config.js";


/* ============================================================
 * Firebase initialization
 * ============================================================ */

const app = initializeApp(firebaseConfig);

const auth = getAuth(app);

const googleProvider =
  new GoogleAuthProvider();


/* ============================================================
 * EMAIL / PASSWORD LOGIN
 * ============================================================ */

export async function login(
  email,
  password
) {
  const normalizedEmail =
    String(email || "")
      .trim();

  if (!normalizedEmail) {
    throw new Error(
      "Please enter your email address."
    );
  }

  if (!password) {
    throw new Error(
      "Please enter your password."
    );
  }

  return await signInWithEmailAndPassword(
    auth,
    normalizedEmail,
    password
  );
}


/* ============================================================
 * GOOGLE LOGIN
 * ============================================================ */

export async function loginWithGoogle() {
  return await signInWithPopup(
    auth,
    googleProvider
  );
}


/* ============================================================
 * LOGOUT
 * ============================================================ */

export async function logout() {
  await signOut(auth);
}


/* ============================================================
 * PASSWORD RESET
 * ============================================================ */

export async function resetPassword(
  email
) {
  const normalizedEmail =
    String(email || "")
      .trim();

  if (!normalizedEmail) {
    throw new Error(
      "Please enter your email address."
    );
  }

  return await sendPasswordResetEmail(
    auth,
    normalizedEmail
  );
}


/* ============================================================
 * SESSION CHECK
 * ============================================================ */

export function checkAuth(
  callback
) {
  return onAuthStateChanged(
    auth,
    callback
  );
}


/* ============================================================
 * CURRENT USER
 * ============================================================ */

export function getCurrentUser() {
  return auth.currentUser;
}


/* ============================================================
 * EXPORT AUTH INSTANCE
 * ============================================================ */

export {
  auth
};
