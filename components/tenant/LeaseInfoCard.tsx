
"use client";

import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

type Props = {
  property: {
    name: string;
    address: string;
  };
  lease: {
    start: string;
    end: string;
    status: string;
    monthlyRent: number;
  };
};

export function LeaseInfoCard({ property, lease }: Props) {
  const [now, setNow] = useState<number | null>(null);

  useEffect(() => {
    const updateTime = () => {
      setNow(Date.now());
    };

    const timeout = window.setTimeout(updateTime, 0);
    const interval = window.setInterval(updateTime, 60_000);

    return () => {
      window.clearTimeout(timeout);
      window.clearInterval(interval);
    };
  }, []);

  const days =
    now === null
      ? null
      : Math.max(
          0,
          Math.ceil(
            (new Date(lease.end).getTime() - now) /
              86_400_000
          )
        );

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div>
            <CardTitle>{property.name}</CardTitle>
            <p className="text-sm text-muted-foreground">
              {property.address}
            </p>
          </div>
          <Badge>{lease.status}</Badge>
        </div>
      </CardHeader>

      <CardContent className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div>
          <p className="text-xs text-muted-foreground">
            Lease start
          </p>
          <p className="font-medium">
            {new Date(lease.start).toLocaleDateString()}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Lease end
          </p>
          <p className="font-medium">
            {new Date(lease.end).toLocaleDateString()}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Monthly rent
          </p>
          <p className="font-medium">
            ${lease.monthlyRent.toLocaleString()}
          </p>
        </div>

        <div>
          <p className="text-xs text-muted-foreground">
            Days remaining
          </p>
          <p className="font-medium">
            {days ?? "—"}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
