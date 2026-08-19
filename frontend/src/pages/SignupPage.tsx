import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "@/lib/api";
import AuthCard from "@/components/AuthCard";

function errorMessage(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail || "Something went wrong - please try again.";
}

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";
const labelClass = "mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]";

export default function SignupPage() {
  const navigate = useNavigate();
  const [phone, setPhone] = useState("+962");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");

  const signupMutation = useMutation({
    mutationFn: () => signup({ phone, password, full_name: fullName, email: email || undefined }),
    onSuccess: () => navigate(`/verify?phone=${encodeURIComponent(phone)}`),
  });

  return (
    <AuthCard title="Create your account" subtitle="Join to start buying and selling in your area.">
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          signupMutation.mutate();
        }}
      >
        <div>
          <label className={labelClass}>Full name *</label>
          <input className={inputClass} value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </div>
        <div>
          <label className={labelClass}>Phone number *</label>
          <input
            className={inputClass}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+962791234567"
            required
          />
          <span className="mt-1 block text-xs text-[var(--muted-foreground)]">
            Include the country code (e.g. +962 for Jordan) - we'll text you a verification code.
          </span>
        </div>
        <div>
          <label className={labelClass}>Password *</label>
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </div>
        <div>
          <label className={labelClass}>Email (optional)</label>
          <input type="email" className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
        </div>

        {signupMutation.isError && <p className="text-sm text-red-600">{errorMessage(signupMutation.error)}</p>}

        <button
          type="submit"
          className="mt-1 w-full rounded-[var(--radius-md)] bg-[var(--primary)] py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
          disabled={signupMutation.isPending}
        >
          {signupMutation.isPending ? "Sending code…" : "Sign up"}
        </button>
      </form>
      <p className="mt-5 text-center text-sm text-[var(--muted-foreground)]">
        Already have an account?{" "}
        <Link to="/login" className="font-medium text-[var(--accent)]">
          Log in
        </Link>
      </p>
    </AuthCard>
  );
}
