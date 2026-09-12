"use client";

// Client-side auth guard for the mobile bundle (Capacitor 3, #4).
// The static export cannot run the server proxy gate, so this component
// resolves the Supabase browser session at runtime: logged-out deep routes
// redirect to login with the destination preserved, signed-in users pass
// through. On web it renders children directly — proxy/middleware behavior
// is untouched.

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { isMobileBuild } from "@/utils/mobile-build";
import { isPublicPath, resolveAuthGuard } from "@/utils/mobile-auth";

export default function MobileAuthGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [sessionChecked, setSessionChecked] = useState(!isMobileBuild());

  useEffect(() => {
    if (!isMobileBuild()) {
      return;
    }
    let mounted = true;

    const checkSession = async (hasSession: boolean) => {
      if (!mounted) return;
      const decision = resolveAuthGuard({
        isMobile: true,
        pathname,
        hasSession,
      });
      if (decision.redirectTo) {
        router.replace(decision.redirectTo);
        return;
      }
      setSessionChecked(true);
    };

    supabase.auth.getSession().then(({ data }) => {
      void checkSession(Boolean(data.session));
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        void checkSession(Boolean(session));
      },
    );

    return () => {
      mounted = false;
      listener.subscription.unsubscribe();
    };
  }, [pathname, router, supabase]);

  if (!isMobileBuild()) {
    return <>{children}</>;
  }

  // Public routes prerender as-is (preserves the static landing shell) and
  // never wait on the session.
  if (isPublicPath(pathname)) {
    return <>{children}</>;
  }

  if (!sessionChecked) {
    return null;
  }

  return <>{children}</>;
}
