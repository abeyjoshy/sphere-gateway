// Which hospital origins are allowed to embed this widget and exchange
// postMessages with it. The embedding page tells us which origin it is via
// ?origin=... (same idea as ?mrn=...), but we never trust that value blindly —
// it must also appear here, or we treat the embedder as untrusted.
// This allowlist is a security boundary (which origins may embed the
// widget and exchange postMessages with it at all) — separate from vendor
// *routing*, which the interconnect owns entirely on its own side. Adding a
// new hospital still means adding its origin here (that part can't move —
// SPHERE has to decide for itself who it trusts), but nothing else in this
// file changes; no vendor-slug map to keep in sync anymore.
const TRUSTED_ORIGINS = [
  "http://localhost:4000", // Epic
  "http://localhost:4002", // Evolve
];

export function getEmbedderOrigin() {
  const params = new URLSearchParams(window.location.search);
  const origin = params.get("origin");
  return TRUSTED_ORIGINS.includes(origin) ? origin : null;
}
