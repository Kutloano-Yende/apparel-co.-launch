import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";

const rootEl = document.getElementById("root")!;

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_PUBLISHABLE_KEY = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

function renderConfigBanner(missing: string[]) {
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
        <p style="margin:0;color:#9a9aa1;font-size:13px;line-height:1.55;">
          If you're the site owner, open the project in Lovable and click <strong style="color:#f5f5f5;">Publish → Update</strong> to redeploy with the current configuration.
        </p>
      </div>
    </div>
  `;
}

const missing: string[] = [];
if (!SUPABASE_URL) missing.push("VITE_SUPABASE_URL");
if (!SUPABASE_PUBLISHABLE_KEY) missing.push("VITE_SUPABASE_PUBLISHABLE_KEY");

if (missing.length > 0) {
  console.error("[startup-guard] Missing required env vars:", missing);
  renderConfigBanner(missing);
} else {
  createRoot(rootEl).render(<App />);
}
