import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, Link } from "react-router-dom";
import { fetchMe, login } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

function errorMessage(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail || "Invalid phone or password.";
}

export default function LoginPage() {
  const navigate = useNavigate();
  const setAuth = useAppStore((s) => s.setAuth);
  const [phone, setPhone] = useState("+962");
  const [password, setPassword] = useState("");

  const loginMutation = useMutation({
    mutationFn: () => login(phone, password),
    onSuccess: async (token) => {
      setAuth(token.access_token, { id: "", phone, full_name: "" });
      const me = await fetchMe();
      setAuth(token.access_token, me);
      navigate("/");
    },
  });

  return (
    <div className="mx-auto flex max-w-sm flex-col gap-3">
      <h1 className="text-lg font-semibold">Log in</h1>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          loginMutation.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Phone number</span>
          <input className="rounded border p-2" value={phone} onChange={(e) => setPhone(e.target.value)} required />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Password</span>
          <input
            type="password"
            className="rounded border p-2"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </label>

        {loginMutation.isError && <p className="text-sm text-red-600">{errorMessage(loginMutation.error)}</p>}

        <button
          type="submit"
          className="rounded bg-neutral-900 p-2 text-white disabled:opacity-50"
          disabled={loginMutation.isPending}
        >
          {loginMutation.isPending ? "Logging in…" : "Log in"}
        </button>
      </form>
      <p className="text-sm text-neutral-500">
        No account yet? <Link to="/signup" className="text-blue-600">Sign up</Link>
      </p>
    </div>
  );
}
