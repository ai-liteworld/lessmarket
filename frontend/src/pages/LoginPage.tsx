import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { fetchMe, login } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import AuthCard from "@/components/AuthCard";

function errorMessage(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail || "Invalid phone or password.";
}

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";
const labelClass = "mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]";

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);
  const [phone, setPhone] = useState("+962");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: () => login(phone, password),
    onSuccess: async (token) => {
      // Stash the token first so the authenticated /users/me call below
      // picks it up via the axios request interceptor.
      setAuth(token.access_token, { id: "", phone, full_name: "" });
      const me = await fetchMe();
      setAuth(token.access_token, me);
      navigate("/");
    },
  });

  return (
    <AuthCard title="Log in" subtitle="Welcome back - enter your details to continue.">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          loginMutation.mutate();
        }}
      >
        <div>
          <label className={labelClass}>Phone number</label>
          <input className={inputClass} value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Password</label>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {loginMutation.isError && <p className="text-sm text-red-600">{errorMessage(loginMutation.error)}</p>}

        <button
          type="submit"
          className="mt-1 w-full rounded-[var(--radius-md)] bg-[var(--primary)] py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
        No account yet?{" "}
        <Link to="/signup" className="font-medium text-[var(--accent)]">
          Sign up
        </Link>
      </p>
    </AuthCard>
  );
}
