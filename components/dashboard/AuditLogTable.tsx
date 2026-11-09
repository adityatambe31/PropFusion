
"use client";

import { useEffect, useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

type Entry = {
  id: string;
  timestamp: string;
  userEmail?: string;
  userId: string;
  userRole: string;
  action: string;
  entity: string;
  entityId: string;
  metadata: Record<string, unknown>;
};

type AuditResponse = {
  entries: Entry[];
  totalPages: number;
};

export function AuditLogTable() {
  const [entries, setEntries] = useState<Entry[]>([]);
  const [email, setEmail] = useState("");
  const [entity, setEntity] = useState("");
  const [action, setAction] = useState("");
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);

  async function load(next = page) {
    const query = new URLSearchParams({
      page: String(next),
    });

    if (email) query.set("email", email);
    if (entity) query.set("entity", entity);
    if (action) query.set("action", action);

    try {
      const response = await fetch(
        `/api/audit?${query.toString()}`,
        { cache: "no-store" }
      );

      if (!response.ok) return;

      const data: AuditResponse = await response.json();

      setEntries(data.entries);
      setPages(data.totalPages || 1);
      setPage(next);
    } catch (error) {
      console.error("Failed to load audit logs:", error);
    }
  }

  useEffect(() => {
    const controller = new AbortController();

    async function loadInitialData() {
      try {
        const response = await fetch("/api/audit?page=1", {
          cache: "no-store",
          signal: controller.signal,
        });

        if (!response.ok) return;

        const data: AuditResponse = await response.json();

        if (!controller.signal.aborted) {
          setEntries(data.entries);
          setPages(data.totalPages || 1);
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          console.error("Failed to load audit logs:", error);
        }
      }
    }

    void loadInitialData();

    return () => controller.abort();
  }, []);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-4">
        <Input
          placeholder="Search user email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />

        <select
          className="rounded-md border bg-background px-3"
          value={entity}
          onChange={(event) => setEntity(event.target.value)}
        >
          <option value="">All entities</option>
          {[
            "asset",
            "lease",
            "tenant",
            "transaction",
            "payment",
          ].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <select
          className="rounded-md border bg-background px-3"
          value={action}
          onChange={(event) => setAction(event.target.value)}
        >
          <option value="">All actions</option>
          {[
            "CREATE",
            "UPDATE",
            "DELETE",
            "UNAUTHORIZED_ACCESS",
          ].map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>

        <Button onClick={() => void load(1)}>
          Apply filters
        </Button>
      </div>

      <div className="overflow-x-auto rounded-lg border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              {[
                "Timestamp",
                "User",
                "Role",
                "Action",
                "Entity",
                "Entity ID",
                "Summary",
              ].map((heading) => (
                <th
                  key={heading}
                  className="p-3 text-left"
                >
                  {heading}
                </th>
              ))}
            </tr>
          </thead>

          <tbody>
            {entries.map((entry) => (
              <tr
                key={entry.id}
                className="border-t"
              >
                <td className="p-3 whitespace-nowrap">
                  {new Date(
                    entry.timestamp
                  ).toLocaleString()}
                </td>

                <td className="p-3">
                  {entry.userEmail ?? entry.userId}
                </td>

                <td className="p-3">
                  {entry.userRole}
                </td>

                <td className="p-3">
                  {entry.action}
                </td>

                <td className="p-3">
                  {entry.entity}
                </td>

                <td className="p-3 font-mono text-xs">
                  {entry.entityId}
                </td>

                <td className="p-3 max-w-xs truncate">
                  {JSON.stringify(entry.metadata)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-end gap-3">
        <Button
          variant="outline"
          disabled={page <= 1}
          onClick={() => void load(page - 1)}
        >
          Previous
        </Button>

        <span className="text-sm">
          Page {page} of {pages}
        </span>

        <Button
          variant="outline"
          disabled={page >= pages}
          onClick={() => void load(page + 1)}
        >
          Next
        </Button>
      </div>
    </div>
  );
}
