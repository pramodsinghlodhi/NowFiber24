import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Wifi, Siren, Users, CheckCircle, Icon as LucideIcon } from "lucide-react";
import type { LucideProps } from "lucide-react";

const iconMap: { [key: string]: React.ElementType<LucideProps> | undefined } = {
  wifi: Wifi,
  siren: Siren,
  users: Users,
  "check-circle": CheckCircle,
};

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: string;
  variant?: "default" | "destructive";
};

export default function StatsCard({ title, value, icon, variant = "default" }: StatsCardProps) {
  const Icon = iconMap[icon] || LucideIcon;

  return (
    <Card className={cn(
      "transition-all hover:shadow-md",
      variant === "destructive" && "bg-destructive/10 border-destructive"
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={cn(
          "h-4 w-4 text-muted-foreground",
          variant === "destructive" && "text-destructive"
        )} />
      </CardHeader>
      <CardContent>
        <div className={cn(
          "text-2xl font-bold",
          variant === "destructive" && "text-destructive"
        )}>{value}</div>
      </CardContent>
    </Card>
  );
}
