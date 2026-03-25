const FRONTEND_HINTS = ["/src/", "/components/", "/pages/", "/public/", "/app/"];
const BACKEND_HINTS = ["/api/", "/server/", "/backend/", "/services/"];
const PUBLIC_ENV_HINTS = ["NEXT_PUBLIC_", "VITE_", "NUXT_PUBLIC_", "PUBLIC_"];

export function analyzeRisk(relativePath, match, snippet) {
  const normalized = `/${relativePath.toLowerCase()}`;
  const isBackendPath = BACKEND_HINTS.some((segment) => normalized.includes(segment));
  const isEnvFile = normalized.endsWith(".env");
  const inFrontendPath = FRONTEND_HINTS.some((segment) => normalized.includes(segment));
  const hasPublicEnvLeak = PUBLIC_ENV_HINTS.some((prefix) => snippet.includes(prefix));
  const inFrontend = !isBackendPath && (inFrontendPath || hasPublicEnvLeak) && !isEnvFile;

  if (inFrontend && (match.type === "openai" || match.type === "google" || /bearer\s+sk-/i.test(snippet) || hasPublicEnvLeak)) {
    return {
      severity: "HIGH",
      fix: "Move secret to backend proxy and call internal endpoint instead.",
      reason: "Sensitive key appears in likely frontend context",
    };
  }

  if (match.type === "generic") {
    return {
      severity: "MEDIUM",
      fix: "Verify if token is sensitive; if yes, move it to environment variables.",
      reason: "High entropy token pattern",
    };
  }

  return {
    severity: "HIGH",
    fix: "Rotate the key and store it only in backend environment variables.",
    reason: "Known provider key format",
  };
}
