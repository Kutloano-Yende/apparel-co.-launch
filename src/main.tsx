import { createRoot, type Root } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;
let reactRoot: Root | null = null;

function getMissingEnvVars(): string[] {
  const missing: string[] = [];
  if (!import.meta.env.VITE_SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
  if (!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");
  return missing;
}

function renderConfigBanner(missing: string[]) {
  // Tear down any prior React root so we don't double-mount later.
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
        <div style="display:flex;gap:10px;align-items:center;">
          <button id="startup-retry-btn" style="appearance:none;border:1px solid #3a3a3f;background:#f5f5f5;color:#0b0b0c;font-weight:600;font-size:13px;padding:9px 16px;border-radius:8px;cursor:pointer;transition:opacity 0.15s;">
            Retry
          </button>
          <span id="startup-retry-status" style="color:#9a9aa1;font-size:12px;"></span>
        </div>
      </div>
    </div>
  `;

  const btn = document.getElementById("startup-retry-btn") as HTMLButtonElement | null;
  const status = document.getElementById("startup-retry-status");

  btn?.addEventListener("click", () => {
    if (!btn) return;
    btn.disabled = true;
    btn.style.opacity = "0.6";
    btn.textContent = "Checking…";
    if (status) status.textContent = "";

    // Brief delay so the user sees feedback even if the check is instant.
    setTimeout(() => {
      const stillMissing = getMissingEnvVars();
      if (stillMissing.length === 0) {
        bootstrap();
      } else {
        btn.disabled = false;
        btn.style.opacity = "1";
        btn.textContent = "Retry";
        if (status) {
          status.textContent = `Still missing: ${stillMissing.join(", ")}`;
          status.style.color = "#fca5a5";
        }
      }
    }, 250);
  });
}

function bootstrap() {
  const missing = getMissingEnvVars();
  if (missing.length > 0) {
    console.error("[startup-guard] Missing required env vars:", missing);
    renderConfigBanner(missing);
    return;
  }

  // Clear any banner markup before mounting React.
  rootEl.innerHTML = "";
  reactRoot = createRoot(rootEl);
  reactRoot.render(<App />);
}

bootstrap();
