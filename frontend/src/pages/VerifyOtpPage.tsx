import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useNavigate, useSearchParams } from "react-router-dom";
import { fetchMe, resendOtp, verifyOtp } from "@/lib/api";
import { useAppStore } from "@/store/useAppStore";

function errorMessage(err: unknown): string {
  const detail = (err as { response?: { data?: { detail?: string } } })?.response?.data?.detail;
  return detail || "Something went wrong - please try again.";
}

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
    <div className="mx-auto flex max-w-sm flex-col gap-3">
      <h1 className="text-lg font-semibold">Verify your phone</h1>
      <p className="text-sm text-neutral-500">
        We sent a code to <span className="font-medium">{phone}</span>.
      </p>
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault();
          verifyMutation.mutate();
        }}
      >
        <label className="flex flex-col gap-1 text-sm">
          <span className="font-medium">Verification code</span>
          <input
            className="rounded border p-2 text-center text-lg tracking-widest"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            inputMode="numeric"
            maxLength={8}
            required
          />
        </label>

        {verifyMutation.isError && <p className="text-sm text-red-600">{errorMessage(verifyMutation.error)}</p>}
        {resendMutation.isSuccess && <p className="text-sm text-green-600">Code resent.</p>}

        <button
          type="submit"
          className="rounded bg-neutral-900 p-2 text-white disabled:opacity-50"
          disabled={verifyMutation.isPending || !phone}
        >
          {verifyMutation.isPending ? "Verifying…" : "Activate account"}
        </button>
      </form>
      <button
        type="button"
        className="text-left text-sm text-blue-600 disabled:opacity-50"
        onClick={() => resendMutation.mutate()}
        disabled={resendMutation.isPending || !phone}
      >
        Didn't get a code? Resend
      </button>
    </div>
  );
}
