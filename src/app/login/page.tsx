"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { createClient } from "@/utils/supabase/client";
import styles from "./page.module.css";

export default function LoginPage() {
  const router = useRouter();
  const supabase = useMemo(() => createClient(), []);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [hasSession, setHasSession] = useState(false);

  useEffect(() => {
    let mounted = true;

    supabase.auth.getSession().then(({ data }) => {
      if (mounted) {
        setHasSession(Boolean(data.session));
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setHasSession(Boolean(session));
    });

    return () => {
      mounted = false;
      authListener.subscription.unsubscribe();
    };
  }, [supabase]);

  const handleSignIn = async () => {
    setIsLoading(true);
    setError(null);
    setStatus(null);

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (signInError) {
      setError(signInError.message);
    } else {
      setStatus("Signed in successfully.");
      router.push("/recipes");
      router.refresh();
    }

    setIsLoading(false);
  };

  const handleSignUp = async () => {
    setIsLoading(true);
    setError(null);
    setStatus(null);

    const { error: signUpError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (signUpError) {
      setError(signUpError.message);
    } else {
      setStatus("Account created. Check your email if confirmation is required.");
    }

    setIsLoading(false);
  };

  const handleSignOut = async () => {
    setIsLoading(true);
    setError(null);
    setStatus(null);

    const { error: signOutError } = await supabase.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
    } else {
      setStatus("Signed out.");
    }

    setIsLoading(false);
  };

  return (
    <div className={styles.container}>
      <Card className={styles.card}>
        <h1 className={styles.title}>Sign In</h1>
        <p className={styles.subtitle}>Connect your account to sync recipes and templates.</p>

        <div className={styles.form}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            fullWidth
          />
          <Input
            label="Password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••••"
            fullWidth
          />
        </div>

        {error && <p className={styles.error}>{error}</p>}
        {status && <p className={styles.status}>{status}</p>}

        <div className={styles.actions}>
          <Button onClick={handleSignIn} disabled={isLoading || !email || !password}>
            {isLoading ? "Working..." : "Sign In"}
          </Button>
          <Button
            variant="secondary"
            onClick={handleSignUp}
            disabled={isLoading || !email || !password}
          >
            Create Account
          </Button>
          {hasSession && (
            <Button variant="ghost" onClick={handleSignOut} disabled={isLoading}>
              Sign Out
            </Button>
          )}
        </div>
      </Card>
    </div>
  );
}
