import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { CheckCircle2, XCircle, Loader2, ShieldCheck } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

type Status = "checking" | "ok" | "fail";

const maskKey = (key?: string) => {
  if (!key) return "Not configured";
  if (key.length < 12) return "••••••";
  return `${key.slice(0, 6)}…${key.slice(-4)} (${key.length} chars)`;
};

const StatusRow = ({ label, status, detail }: { label: string; status: Status; detail?: string }) => (
  <div className="flex items-start justify-between gap-4 py-3 border-b border-border last:border-0">
    <div>
      <p className="font-display text-sm tracking-wider uppercase">{label}</p>
      {detail && <p className="text-xs text-muted-foreground mt-1 font-mono break-all">{detail}</p>}
    </div>
    <div className="shrink-0 mt-1">
      {status === "checking" && <Loader2 size={18} className="animate-spin text-muted-foreground" />}
      {status === "ok" && <CheckCircle2 size={18} className="text-green-600" />}
      {status === "fail" && <XCircle size={18} className="text-destructive" />}
    </div>
  </div>
);

const SettingsPage = () => {
  const { user } = useAuth();
  const url = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;
  const projectId = import.meta.env.VITE_SUPABASE_PROJECT_ID as string | undefined;

  const [urlStatus] = useState<Status>(url ? "ok" : "fail");
  const [keyStatus] = useState<Status>(publishableKey ? "ok" : "fail");
  const [dbStatus, setDbStatus] = useState<Status>("checking");
  const [authStatus, setAuthStatus] = useState<Status>("checking");
  const [dbDetail, setDbDetail] = useState<string>("Pinging database…");
  const [authDetail, setAuthDetail] = useState<string>("Reading session…");

  const runChecks = async () => {
    setDbStatus("checking");
    setAuthStatus("checking");
    setDbDetail("Pinging database…");
    setAuthDetail("Reading session…");

    // DB connectivity: lightweight read against a public table
    const t0 = performance.now();
    const { error } = await supabase.from("profiles").select("id", { count: "exact", head: true });
    const ms = Math.round(performance.now() - t0);
    if (error) {
      setDbStatus("fail");
      setDbDetail(`Error: ${error.message}`);
    } else {
      setDbStatus("ok");
      setDbDetail(`Reachable in ${ms} ms`);
    }

    // Auth status
    const { data, error: authErr } = await supabase.auth.getSession();
    if (authErr) {
      setAuthStatus("fail");
      setAuthDetail(`Error: ${authErr.message}`);
    } else if (data.session) {
      setAuthStatus("ok");
      setAuthDetail(`Signed in as ${data.session.user.email ?? data.session.user.id}`);
    } else {
      setAuthStatus("ok");
      setAuthDetail("Auth service reachable. No active session.");
    }
  };

  useEffect(() => {
    runChecks();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Helmet>
        <title>Settings · Connection Status | APPAREL Co.</title>
        <meta name="description" content="Verify backend connection and authentication status." />
        <meta name="robots" content="noindex,nofollow" />
      </Helmet>

      <main className="container-brand pt-28 md:pt-32 pb-20 min-w-0">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-3 mb-2">
            <ShieldCheck size={22} />
            <h1 className="font-display text-3xl md:text-4xl tracking-wider uppercase">Settings</h1>
          </div>
          <p className="text-sm text-muted-foreground mb-8">
            Verify that public environment variables are configured and the backend is reachable.
            Secrets are never displayed.
          </p>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Environment</CardTitle>
              <CardDescription>Public values shipped with the client build.</CardDescription>
            </CardHeader>
            <CardContent>
              <StatusRow
                label="VITE_SUPABASE_PUBLISHABLE_KEY"
                status={keyStatus}
                detail={maskKey(publishableKey)}
              />
              <StatusRow
                label="VITE_SUPABASE_URL"
                status={urlStatus}
                detail={url ?? "Not configured"}
              />
              <StatusRow
                label="VITE_SUPABASE_PROJECT_ID"
                status={projectId ? "ok" : "fail"}
                detail={projectId ?? "Not configured"}
              />
            </CardContent>
          </Card>

          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="text-lg">Live checks</CardTitle>
              <CardDescription>Runtime connectivity to backend services.</CardDescription>
            </CardHeader>
            <CardContent>
              <StatusRow label="Database" status={dbStatus} detail={dbDetail} />
              <StatusRow label="Auth" status={authStatus} detail={authDetail} />
              <StatusRow
                label="Current user"
                status={user ? "ok" : "checking"}
                detail={user ? user.email ?? user.id : "Not signed in"}
              />
            </CardContent>
          </Card>

          <Button onClick={runChecks} variant="outline">
            Re-run checks
          </Button>

          <p className="text-xs text-muted-foreground mt-8 leading-relaxed">
            Note: only publishable (anon) keys are safe to expose in the client. The service role
            key and database password are managed by Lovable Cloud and are never accessible from
            the browser or this page.
          </p>
        </div>
      </main>
    </>
  );
};

export default SettingsPage;
