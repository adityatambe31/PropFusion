"use client";

import { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Building2, CheckCircle2, Mail, Phone, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const faqs = [
  ["Where can I find my receipt?", "Open Payment history and select the receipt number for the payment. You can print it or save it as a PDF."],
  ["Why is the Pay Rent button disabled?", "It is disabled after a successful payment has already been recorded for the current month."],
  ["What happens after I submit a support request?", "You receive an acknowledgement email, and property management receives your request. They should respond within 2–3 business days."],
  ["Is this a real payment processor?", "No. The Sprint 4 payment screen is a simulation for the PropFusion project and does not charge a real card or bank account."],
];

export default function TenantSupportPage() {
  const [category, setCategory] = useState("payment");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [ticket, setTicket] = useState<string | null>(null);
  const [contacts, setContacts] = useState<{ managerEmail?: string; managerPhone?: string; frontDesk?: string } | null>(null);

  async function submitRequest() {
    if (subject.trim().length < 4 || message.trim().length < 10) {
      setError("Please provide a clear subject and at least 10 characters of detail.");
      return;
    }

    setSubmitting(true);
    setError("");
    try {
      const response = await fetch("/api/tenant/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, subject: subject.trim(), message: message.trim() }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Support request could not be submitted.");
      setTicket(data.request.ticketNumber);
      setContacts(data.contacts || null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Support request could not be submitted.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="mx-auto max-w-5xl space-y-8 p-4 md:p-8">
      <Button asChild variant="outline"><Link href="/tenant/dashboard"><ArrowLeft className="mr-2 h-4 w-4" /> Back to dashboard</Link></Button>

      <div>
        <p className="text-sm font-medium text-muted-foreground">Tenant portal</p>
        <h1 className="text-3xl font-bold">Customer support</h1>
        <p className="mt-1 text-muted-foreground">Find a quick answer or contact property management.</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-semibold">Frequently asked questions</h2>
        <div className="grid gap-3 md:grid-cols-2">
          {faqs.map(([question, answer]) => (
            <article key={question} className="rounded-xl border p-5">
              <h3 className="font-semibold">{question}</h3>
              <p className="mt-2 text-sm leading-6 text-muted-foreground">{answer}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <div className="rounded-2xl border p-6">
          {ticket ? (
            <div className="space-y-4 py-4 text-center">
              <CheckCircle2 className="mx-auto h-14 w-14 text-emerald-600" />
              <h2 className="text-2xl font-semibold">Request submitted</h2>
              <p className="text-muted-foreground">Your ticket number is <strong>{ticket}</strong>. We emailed you a confirmation. Management should respond within 2–3 business days.</p>
              <Button onClick={() => { setTicket(null); setSubject(""); setMessage(""); }}>Submit another request</Button>
            </div>
          ) : (
            <div className="space-y-5">
              <div><h2 className="text-xl font-semibold">Contact management</h2><p className="text-sm text-muted-foreground">Describe the payment, lease, maintenance, or account issue.</p></div>
              <div className="space-y-2"><Label>Category</Label><Select value={category} onValueChange={setCategory}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="payment">Payment or receipt</SelectItem><SelectItem value="lease">Lease question</SelectItem><SelectItem value="maintenance">Maintenance</SelectItem><SelectItem value="account">Account access</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></div>
              <div className="space-y-2"><Label htmlFor="supportSubject">Subject</Label><Input id="supportSubject" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Example: July payment receipt question" /></div>
              <div className="space-y-2"><Label htmlFor="supportMessage">Details</Label><Textarea id="supportMessage" rows={7} value={message} onChange={(event) => setMessage(event.target.value)} placeholder="Explain what happened, when it happened, and any receipt number involved." /></div>
              {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">{error}</p>}
              <Button className="w-full" disabled={submitting} onClick={submitRequest}><Send className="mr-2 h-4 w-4" />{submitting ? "Submitting…" : "Submit support request"}</Button>
            </div>
          )}
        </div>

        <aside className="space-y-4 rounded-2xl border bg-muted/20 p-6">
          <h2 className="font-semibold">Other ways to reach us</h2>
          <div className="flex gap-3"><Mail className="mt-0.5 h-4 w-4" /><div><p className="text-sm font-medium">Management email</p><p className="break-all text-sm text-muted-foreground">{contacts?.managerEmail || "Shown after request submission"}</p></div></div>
          <div className="flex gap-3"><Phone className="mt-0.5 h-4 w-4" /><div><p className="text-sm font-medium">Phone</p><p className="text-sm text-muted-foreground">{contacts?.managerPhone || "Contact your building front desk"}</p></div></div>
          <div className="flex gap-3"><Building2 className="mt-0.5 h-4 w-4" /><div><p className="text-sm font-medium">In person</p><p className="text-sm text-muted-foreground">{contacts?.frontDesk || "Visit the property front desk during operating hours."}</p></div></div>
          <p className="text-xs leading-5 text-muted-foreground">For emergencies or immediate safety concerns, contact local emergency services rather than using this form.</p>
        </aside>
      </section>
    </main>
  );
}
