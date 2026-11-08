"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AcceptTenantInviteClient() {
  const params = useSearchParams();
  const router = useRouter();
  const token = params.get("token") ?? "";
  const [invite, setInvite] = useState<{ email: string; name: string } | null>(null);
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("Missing invite token");
      return;
    }

    fetch(`/api/tenant/accept-invite?token=${encodeURIComponent(token)}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.error);
        }
        setInvite(data);
      })
      .catch((fetchError) => setError(fetchError.message));
  }, [token]);

  async function submit() {
    setLoading(true);
    setError("");

    try {
      const response = await fetch("/api/tenant/accept-invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error);
      }
      router.push("/tenant/sign-in?invited=1");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Unable to accept invite");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen grid place-items-center p-6 bg-muted/30">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Set up your tenant account</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {invite && (
            <p className="text-sm text-muted-foreground">
              Welcome {invite.name}. Create a password for {invite.email}.
            </p>
          )}
          <Input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Minimum 6 characters"
          />
          <Button className="w-full" disabled={!invite || password.length < 6 || loading} onClick={submit}>
            {loading ? "Creating account..." : "Create tenant account"}
          </Button>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>
    </main>
  );
}
