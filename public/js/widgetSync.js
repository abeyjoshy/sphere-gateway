// Handles the background "sync to SPHERE" action triggered by Epic via
// postMessage. Runs silently — Epic never sees the modal for this, only the
// eventual success/failure result.

import { getEmbedderOrigin } from "./widgetOrigin.js";

const EMBEDDER_ORIGIN = getEmbedderOrigin();

const INTERCONNECT_BASE_URL = "http://localhost:4001/sphere/interconnect";

export function initSync() {
  window.addEventListener("message", (event) => {
    if (event.origin !== EMBEDDER_ORIGIN) return;

    if (event.data?.type === "sphere-sync") {
      handleSync(event.data.mrn);
    }
  });
}

async function handleSync(mrn) {
  const token = localStorage.getItem("sphereToken");

  try {
    const res = await fetch(`${INTERCONNECT_BASE_URL}/sync/${encodeURIComponent(EMBEDDER_ORIGIN)}/${mrn}`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    window.parent.postMessage(
      {
        type: "sphere-sync-result",
        success: res.ok,
        message: res.ok ? "Synced to SPHERE successfully" : data.message,
      },
      EMBEDDER_ORIGIN
    );
  } catch (error) {
    window.parent.postMessage(
      { type: "sphere-sync-result", success: false, message: "Could not reach SPHERE" },
      EMBEDDER_ORIGIN
    );
  }
}