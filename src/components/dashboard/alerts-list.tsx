
"use client";

import { Alert } from "@/lib/types";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

type AlertsListProps = {
  alerts: Alert[];
};

const getSeverityBadge = (severity: 'Critical' | 'High' | 'Medium' | 'Low') => {
  switch (severity) {
    case 'Critical':
      return 'destructive';
    case 'High':
      return 'secondary';
    case 'Medium':
      return 'outline';
    default:
      return 'default';
  }
};

export default function AlertsList({ alerts }: AlertsListProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-headline">Active Alerts</CardTitle>
        <CardDescription>Critical and high-priority network issues.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Device</TableHead>
              <TableHead>Issue</TableHead>
              <TableHead>Severity</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {alerts.slice(0, 5).map((alert) => (
              <TableRow key={alert.id}>
                <TableCell className="font-medium">{alert.device_id}</TableCell>
                <TableCell>{alert.issue}</TableCell>
                <TableCell>
                  <Badge variant={getSeverityBadge(alert.severity)} className={cn(alert.severity === 'High' && 'bg-orange-500 text-white')}>
                    {alert.severity}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
