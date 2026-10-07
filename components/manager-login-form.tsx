"use client";

import { ArrowRight } from "lucide-react";
import { useRouter } from "next/navigation";
import type { FormEvent } from "react";
import { useEffect, useState } from "react";
import { apiClient, setToken } from "@/lib/api-client";

export function ManagerLoginForm() {
  const router = useRouter();
  useEffect(() => { void apiClient.warmUp(); }, []);
  const [username, setUsername] = useState("abm-001");
  const [password, setPassword] = useState("Zivirachennai");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const response = await apiClient.login(username, password);
      setToken(response.data.token);
      // Round 48 Part C -- warm the first screen's data while the router navigates.
      void apiClient.dashboard().catch(() => undefined);
      router.push("/manager/dashboard");
    } catch (loginError) {
      setError(loginError instanceof Error ? loginError.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label htmlFor="username">Username</label>
        <input id="username" value={username} onChange={(event) => setUsername(event.target.value)} />
      </div>
      <div className="field">
        <label htmlFor="password">Password</label>
        <input id="password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <button className="button" disabled={loading} type="submit">
        {loading ? "Signing in" : "Open manager portal"}
        <ArrowRight size={17} />
      </button>
    </form>
  );
}
