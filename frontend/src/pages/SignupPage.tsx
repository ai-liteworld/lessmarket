import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "@/lib/api";

function errorMessage(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail || "Something went wrong - please try again.";
}

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
    <div className="mx-auto flex max-w-sm flex-col gap-3">
      <h1 className="text-lg font-semibold">Create your account</h1>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          signupMutation.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Full name *</span>
          <input className="rounded border p-2" value={fullName} onChange={(e) => setFullName(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Phone number *</span>
          <input
            className="rounded border p-2"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="+962791234567"
            required
          />
          <span className="text-xs text-neutral-400">
            Include the country code (e.g. +962 for Jordan) - we'll text you a verification code.
          </span>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Password *</span>
          <input
            type="password"
            className="rounded border p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Email (optional)</span>
          <input
            type="email"
            className="rounded border p-2"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>

        {signupMutation.isError && <p className="text-sm text-red-600">{errorMessage(signupMutation.error)}</p>}

        <button
          type="submit"
          className="rounded bg-neutral-900 p-2 text-white disabled:opacity-50"
          disabled={signupMutation.isPending}
        >
          {signupMutation.isPending ? "Sending code…" : "Sign up"}
        </button>
      </form>
      <p className="text-sm text-neutral-500">
        Already have an account? <Link to="/login" className="text-blue-600">Log in</Link>
      </p>
    </div>
  );
}
