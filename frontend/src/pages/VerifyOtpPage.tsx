import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchMe, resendOtp, verifyOtp } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";
import AuthCard from "@/components/AuthCard";

function errorMessage(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail || "Something went wrong - please try again.";
}

const inputClass =
  "w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--background)] px-3 py-2.5 text-center text-lg tracking-widest focus:outline-none focus:ring-2 focus:ring-[var(--ring)]";
const labelClass = "mb-1.5 block text-xs font-medium text-[var(--muted-foreground)]";

export default function VerifyOtpPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const phone = searchParams.get("phone") ?? "";
  const [code, setCode] = useState("");
  const setAuth = useAppStore((s) => s.setAuth);

  const verifyMutation = useMutation({
    mutationFn: () => verifyOtp(phone, code),
    onSuccess: async (token) => {
      // Stash the token first so the authenticated /users/me call below
      // picks it up via the axios request interceptor.
      setAuth(token.access_token, { id: "", phone, full_name: "" });
      const me = await fetchMe();
      setAuth(token.access_token, me);
      navigate("/");
    },
  });

  const resendMutation = useMutation({ mutationFn: () => resendOtp(phone) });

  return (
    <AuthCard
      title="Verify your phone"
      subtitle={
        phone ? `We sent a code to ${phone}.` : "We sent a code to your phone."
      }
    >
      <form
        className="flex flex-col gap-4"
        onSubmit={(e) => {
          e.preventDefault();
          verifyMutation.mutate();
        }}
      >
        <div>
          <label className={labelClass}>Verification code</label>
          <input
            className={inputClass}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={8}
            required
          />
        </div>

        {verifyMutation.isError && <p className="text-sm text-red-600">{errorMessage(verifyMutation.error)}</p>}
        {resendMutation.isSuccess && <p className="text-sm text-green-600">Code resent.</p>}

        <button
          type="submit"
          className="mt-1 w-full rounded-[var(--radius-md)] bg-[var(--primary)] py-2.5 text-sm font-medium text-[var(--primary-foreground)] transition-opacity hover:opacity-90 disabled:opacity-50"
          disabled={verifyMutation.isPending || !phone}
        >
          {verifyMutation.isPending ? "Verifying…" : "Activate account"}
        </button>
      </form>
      <button
        type="button"
        className="mt-4 w-full text-center text-sm font-medium text-[var(--accent)] disabled:opacity-50"
        onClick={() => resendMutation.mutate()}
        disabled={resendMutation.isPending || !phone}
      >
        Didn't get a code? Resend
      </button>
    </AuthCard>
  );
}
