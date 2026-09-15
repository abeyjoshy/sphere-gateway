// Which hospital origins are allowed to embed this widget and exchange
// postMessages with it. The embedding page tells us which origin it is via
// ?origin=... (same idea as ?mrn=...), but we never trust that value blindly —
// it must also appear here, or we treat the embedder as untrusted.
const TRUSTED_ORIGINS = [
  "http://localhost:4000", // Epic
  // "http://localhost:5000", // Evolve, once it exists
];

export function getEmbedderOrigin() {
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("origin");
  return TRUSTED_ORIGINS.includes(origin) ? origin : null;
}
