// Login/connection state for the SPHERE widget: logging in, caching the token,
// telling Epic when a fresh connection happens, and reacting to Epic's logout
// message. Nothing in here knows about patient records — see widgetRecord.js.

import { getEmbedderOrigin } from "./widgetOrigin.js";

const EMBEDDER_ORIGIN = getEmbedderOrigin();


export function initAuth() {
  const cached = localStorage.getItem("sphereToken");
  if (cached) {
    showConnected();
  }

  document.getElementById("loginBtn").addEventListener("click", handleLogin);
  document.getElementById("password").addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleLogin();
  });

  window.addEventListener("message", (event) => {
    // Only trust messages that actually came from Epic's own origin.
    if (event.origin !== EMBEDDER_ORIGIN) return;

    if (event.data?.type === "sphere-logout") {
      localStorage.removeItem("sphereToken");
      document.getElementById("connectedSection").style.display = "none";
      document.getElementById("loginSection").style.display = "block";
      document.getElementById("email").value = "";
      document.getElementById("password").value = "";
    }
  });
}

async function handleLogin() {
  const email = document.getElementById("email").value;
  const password = document.getElementById("password").value;

  const res = await fetch("/sphere/api/v1/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();

  if (!res.ok) {
    document.getElementById("loginError").textContent = data.message;
    return;
  }

  localStorage.setItem("sphereToken", data.payLoad.token);
  // Only a genuine new login notifies Epic — a page reload that finds an
  // already-cached token must NOT send this, or it closes the modal out
  // from under whatever the reload was actually for (e.g. loading a record).
  window.parent.postMessage({ type: "sphere-connected" }, EMBEDDER_ORIGIN);
  showConnected();
}

function showConnected() {
  document.getElementById("loginSection").style.display = "none";
  document.getElementById("connectedSection").style.display = "block";
}
