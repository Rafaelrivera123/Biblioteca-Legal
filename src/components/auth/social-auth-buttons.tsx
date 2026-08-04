"use client";

import { Button } from "@/components/ui/button";
import type { SocialProvider } from "@/lib/social-providers";
import { signIn } from "next-auth/react";
import { useState } from "react";

type Props = {
  /** Where Auth.js should send the user after OAuth (new users go to newUser page). */
  callbackUrl?: string;
  /** Which providers to show. Defaults to Google + Facebook. */
  providers?: SocialProvider[];
};

function GoogleIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function FacebookIcon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" aria-hidden="true">
      <path
        fill="#1877F2"
        d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 23.954V15.542H7.078V12.073h3.047V9.412c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.469h-2.796v8.412C19.612 23.094 24 18.1 24 12.073z"
      />
    </svg>
  );
}

const providerMeta: Record<
  SocialProvider,
  { label: string; icon: typeof GoogleIcon }
> = {
  google: { label: "Continuar con Google", icon: GoogleIcon },
  facebook: { label: "Continuar con Facebook", icon: FacebookIcon },
};

export default function SocialAuthButtons({
  callbackUrl = "/sign-up/complete",
  providers = ["google", "facebook"],
}: Props) {
  const [loading, setLoading] = useState<SocialProvider | null>(null);

  if (providers.length === 0) return null;

  async function handleSocial(provider: SocialProvider) {
    setLoading(provider);
    try {
      await signIn(provider, { callbackUrl });
    } catch (error) {
      console.error(error);
      setLoading(null);
    }
  }

  return (
    <div className="space-y-3 w-full">
      <div className="relative py-2">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-gray-200" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-white px-3 text-gray-500">O continúa con</span>
        </div>
      </div>

      {providers.map((id) => {
        const { label, icon: Icon } = providerMeta[id];
        return (
          <Button
            key={id}
            type="button"
            variant="ghost"
            className="w-full min-h-[45px] justify-center gap-3 border border-primary/40 bg-white text-gray-900 hover:bg-gray-50 hover:text-gray-900"
            disabled={loading !== null}
            onClick={() => handleSocial(id)}
          >
            <Icon className="h-5 w-5 shrink-0" />
            {loading === id ? "Redirigiendo..." : label}
          </Button>
        );
      })}
    </div>
  );
}
