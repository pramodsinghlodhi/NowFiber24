import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type { LucideProps } from "lucide-react";

type StatsCardProps = {
  title: string;
  value: string | number;
  icon: React.ElementType<LucideProps>;
  color: string;
  iconColor: string;
};

export default function StatsCard({ title, value, icon: Icon, color, iconColor }: StatsCardProps) {
  
  return (
    <Card className={cn("rounded-2xl border-none shadow-sm", color)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">{title}</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-between">
        <div className="text-3xl font-bold">{value}</div>
        <div className={cn("p-3 rounded-full bg-black/5", )}>
            <Icon className={cn("h-6 w-6", iconColor)} />
        </div>
      </CardContent>
    </Card>
  );
}
