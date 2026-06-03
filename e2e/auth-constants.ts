// Deterministic values the e2e dev server and the auth setup both use, so the
// session cookie minted in auth.setup.ts validates against the running server
// and sign-out redirects somewhere local instead of the real portal.
export const E2E_PORTAL_SECRET = "e2e-portal-secret-at-least-32-characters";
export const E2E_PORTAL_LOGIN_URL = "http://localhost:3000/unauthorized";
