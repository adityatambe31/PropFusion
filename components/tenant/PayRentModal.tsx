"use client";

import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, CreditCard, Landmark, Loader2, ReceiptText } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function PayRentModal({
  leaseId,
  propertyName,
  amount,
  alreadyPaid,
  tenantEmail,
  onPaid,
}: {
  leaseId: string;
  propertyName: string;
  amount: number;
  alreadyPaid: boolean;
  tenantEmail: string;
  onPaid: () => void | Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [method, setMethod] = useState<"card" | "bank">("card");
  const [payerName, setPayerName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");
  const [accountLast4, setAccountLast4] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<null | {
    paymentId: string;
    receiptNumber: string;
    emailSent: boolean;
  }>(null);

  const periodLabel = useMemo(
    () =>
      new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric" }).format(
        new Date(),
      ),
    [],
  );

  useEffect(() => {
    if (!open) {
      setError("");
      setResult(null);
      setSubmitting(false);
      setConfirmed(false);
    }
  }, [open]);

  const normalizedCard = cardNumber.replace(/\D/g, "");
  const validDetails =
    payerName.trim().length >= 2 &&
    (method === "card"
      ? normalizedCard.length >= 12 && expiry.trim().length >= 4 && cvc.trim().length >= 3
      : accountLast4.replace(/\D/g, "").length === 4) &&
    confirmed;

  async function pay() {
    if (!validDetails || submitting) return;
    setSubmitting(true);
    setError("");

    try {
      const response = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          leaseId,
          amount,
          paymentMethod: method,
          payerName: payerName.trim(),
          paymentLast4:
            method === "card" ? normalizedCard.slice(-4) : accountLast4.replace(/\D/g, ""),
        }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.error ?? "Payment could not be submitted.");
        return;
      }

      setResult({
        paymentId: data.payment.id,
        receiptNumber: data.payment.receiptNumber,
        emailSent: Boolean(data.receiptEmailSent),
      });
      await onPaid();
    } catch (paymentError) {
      console.error(paymentError);
      setError("Could not connect to the payment service. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button disabled={alreadyPaid}>
          {alreadyPaid ? "Paid for this period" : "Pay Rent"}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        {result ? (
          <div className="space-y-5 py-2">
            <div className="flex justify-center">
              <CheckCircle2 className="h-14 w-14 text-emerald-600" />
            </div>
            <div className="text-center">
              <DialogTitle className="text-2xl">Payment successful</DialogTitle>
              <DialogDescription className="mt-2">
                Your rent payment for {periodLabel} has been recorded.
              </DialogDescription>
            </div>
            <div className="space-y-2 rounded-xl border bg-muted/30 p-4 text-sm">
              <div className="flex justify-between gap-4"><span>Amount</span><strong>${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</strong></div>
              <div className="flex justify-between gap-4"><span>Property</span><strong className="text-right">{propertyName}</strong></div>
              <div className="flex justify-between gap-4"><span>Receipt</span><strong>{result.receiptNumber}</strong></div>
              <div className="flex justify-between gap-4"><span>Email copy</span><strong>{result.emailSent ? `Sent to ${tenantEmail}` : "Not sent — email is not configured"}</strong></div>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Button asChild variant="outline">
                <a href={`/api/payments/${result.paymentId}/receipt`} target="_blank" rel="noreferrer">
                  <ReceiptText className="mr-2 h-4 w-4" /> View receipt
                </a>
              </Button>
              <Button onClick={() => setOpen(false)}>Done</Button>
            </div>
          </div>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Pay monthly rent</DialogTitle>
              <DialogDescription>
                This is a simulated payment for the PropFusion demo. No real card or bank charge is made.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-5">
              <div className="rounded-xl border bg-muted/30 p-4">
                <p className="text-sm text-muted-foreground">Amount due for {periodLabel}</p>
                <p className="mt-1 text-3xl font-bold">${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</p>
                <p className="mt-1 text-sm">{propertyName}</p>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button type="button" variant={method === "card" ? "default" : "outline"} onClick={() => setMethod("card")}>
                  <CreditCard className="mr-2 h-4 w-4" /> Card
                </Button>
                <Button type="button" variant={method === "bank" ? "default" : "outline"} onClick={() => setMethod("bank")}>
                  <Landmark className="mr-2 h-4 w-4" /> Bank account
                </Button>
              </div>

              <div className="space-y-2">
                <Label htmlFor="payerName">Name on account</Label>
                <Input id="payerName" value={payerName} onChange={(event) => setPayerName(event.target.value)} placeholder="Aditya Tambe" autoComplete="name" />
              </div>

              {method === "card" ? (
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="cardNumber">Card number</Label>
                    <Input id="cardNumber" inputMode="numeric" value={cardNumber} onChange={(event) => setCardNumber(event.target.value)} placeholder="4242 4242 4242 4242" autoComplete="cc-number" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="expiry">Expiry</Label>
                      <Input id="expiry" value={expiry} onChange={(event) => setExpiry(event.target.value)} placeholder="MM/YY" autoComplete="cc-exp" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="cvc">CVC</Label>
                      <Input id="cvc" type="password" inputMode="numeric" maxLength={4} value={cvc} onChange={(event) => setCvc(event.target.value)} placeholder="123" autoComplete="cc-csc" />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="accountLast4">Last 4 digits of bank account</Label>
                  <Input id="accountLast4" inputMode="numeric" maxLength={4} value={accountLast4} onChange={(event) => setAccountLast4(event.target.value)} placeholder="1234" />
                </div>
              )}

              <label className="flex cursor-pointer items-start gap-3 rounded-lg border p-3 text-sm">
                <input type="checkbox" className="mt-1" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} />
                <span>I authorize this simulated ${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })} rent payment and understand that a receipt will be emailed to {tenantEmail}.</span>
              </label>

              {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}

              <Button className="w-full" disabled={!validDetails || submitting} onClick={pay}>
                {submitting ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing payment…</> : `Pay $${amount.toLocaleString("en-US", { minimumFractionDigits: 2 })}`}
              </Button>
              <p className="text-center text-xs text-muted-foreground">For demo purposes, do not enter a real card number. Use 4242 4242 4242 4242.</p>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
