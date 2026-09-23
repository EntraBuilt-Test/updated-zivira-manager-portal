"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { setToken } from "@/lib/api-client";

// Receiving end of the Admin portal's "Vacant MR Login - Access" hand-off
// for a Manager-role employee: Admin issues a real JWT and opens
// /manager/auto-login?token=<jwt> in a new tab. Stores the token exactly
// like a normal sign-in (setToken -> localStorage) and lands on the real
// Manager dashboard, already authenticated as that manager.
function AutoLoginInner() {
  const router = useRouter();
  const params = useSearchParams();
  const [error, setError] = useState("");

  useEffect(() => {
    const token = params.get("token");
    if (!token) {
      setError("Missing login token.");
      return;
    }
    setToken(token);
    router.replace("/manager/dashboard");
  }, [params, router]);

  if (error) {
    return (
      <main className="login-page">
        <section className="login-panel">
          <div className="login-card">
            <h2>Sign-in link invalid</h2>
            <p className="muted">{error}</p>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="login-page">
      <section className="login-panel">
        <div className="login-card">
          <h2>Signing in…</h2>
        </div>
      </section>
    </main>
  );
}

export default function AutoLoginPage() {
  return (
    <Suspense fallback={null}>
      <AutoLoginInner />
    </Suspense>
  );
}
