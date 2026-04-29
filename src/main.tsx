import { createRoot, type Root } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;
let reactRoot: Root | null = null;

const AUTO_RETRY_INTERVAL_MS = 3000;
const AUTO_RETRY_MAX_ATTEMPTS = 10; // ~30s of polling
let autoRetryTimer: number | null = null;
let autoRetryAttempts = 0;

function stopAutoRetry() {
  if (autoRetryTimer !== null) {
    window.clearInterval(autoRetryTimer);
    autoRetryTimer = null;
  }
}

function getMissingEnvVars(): string[] {
  const missing: string[] = [];
  if (!import.meta.env.VITE_SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
  if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");
  return missing;
}

function renderConfigBanner(missing: string[]) {
  if (reactRoot) {
    reactRoot.unmount();
    reactRoot = null;
  }

  rootEl.innerHTML = `
    <div style="min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;background:#0b0b0c;color:#f5f5f5;">
      <div style="max-width:560px;width:100%;border:1px solid #2a2a2d;border-radius:12px;padding:28px;background:#141416;box-shadow:0 10px 30px rgba(0,0,0,0.4);">
        <div style="display:flex;align-items:center;gap:10px;margin-bottom:12px;">
          <div style="width:10px;height:10px;border-radius:9999px;background:#f59e0b;"></div>
          <h1 style="font-size:18px;margin:0;font-weight:600;letter-spacing:-0.01em;">App configuration incomplete</h1>
        </div>
        <p style="margin:0 0 14px;color:#c7c7cc;font-size:14px;line-height:1.55;">
          The app couldn't start because the backend connection isn't configured for this build.
          The following environment variable${missing.length > 1 ? "s are" : " is"} missing:
        </p>
        <ul style="margin:0 0 16px 18px;color:#fca5a5;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:13px;">
          ${missing.map((k) => `<li>${k}</li>`).join("")}
        </ul>
        <p style="margin:0 0 18px;color:#9a9aa1;font-size:13px;line-height:1.55;">
          If you're the site owner, open the project in Lovable and click <strong style="color:#f5f5f5;">Publish → Update</strong> to redeploy with the current configuration.
        </p>
        <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
          <button id="startup-retry-btn" style="appearance:none;border:1px solid #3a3a3f;background:#f5f5f5;color:#0b0b0c;font-weight:600;font-size:13px;padding:9px 16px;border-radius:8px;cursor:pointer;transition:opacity 0.15s;">
            Retry
          </button>
          <span id="startup-retry-status" style="color:#9a9aa1;font-size:12px;">Auto-checking every ${Math.round(AUTO_RETRY_INTERVAL_MS / 1000)}s…</span>
        </div>
      </div>
    </div>
  `;

  const btn = document.getElementById("startup-retry-btn") as HTMLButtonElement | null;
  const status = document.getElementById("startup-retry-status");

  const attempt = (manual: boolean) => {
    if (manual && btn) {
      btn.disabled = true;
      btn.style.opacity = "0.6";
      btn.textContent = "Checking…";
    }
    if (manual && status) {
      status.style.color = "#9a9aa1";
      status.textContent = "Checking…";
    }

    const stillMissing = getMissingEnvVars();
    if (stillMissing.length === 0) {
      stopAutoRetry();
      bootstrap();
      return;
    }

    if (!manual) autoRetryAttempts += 1;

    if (btn) {
      btn.disabled = false;
      btn.style.opacity = "1";
      btn.textContent = "Retry";
    }
    if (status) {
      if (autoRetryTimer !== null && autoRetryAttempts < AUTO_RETRY_MAX_ATTEMPTS) {
        status.style.color = "#9a9aa1";
        status.textContent = `Still missing — auto-retrying (${autoRetryAttempts}/${AUTO_RETRY_MAX_ATTEMPTS})…`;
      } else {
        stopAutoRetry();
        status.style.color = "#fca5a5";
        status.textContent = `Still missing: ${stillMissing.join(", ")}. Click Retry to try again.`;
      }
    }
  };

  btn?.addEventListener("click", () => attempt(true));

  // Auto-retry loop: poll a few times then give up and let the user retry manually.
  stopAutoRetry();
  autoRetryAttempts = 0;
  autoRetryTimer = window.setInterval(() => {
    if (autoRetryAttempts >= AUTO_RETRY_MAX_ATTEMPTS) {
      stopAutoRetry();
      return;
    }
    attempt(false);
  }, AUTO_RETRY_INTERVAL_MS);
}

function bootstrap() {
  const missing = getMissingEnvVars();
  if (missing.length > 0) {
    console.error("[startup-guard] Missing required env vars:", missing);
    renderConfigBanner(missing);
    return;
  }

  stopAutoRetry();
  rootEl.innerHTML = "";
  reactRoot = createRoot(rootEl);
  reactRoot.render(<App />);
}

bootstrap();
