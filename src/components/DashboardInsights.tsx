import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, MessageSquare, CheckCircle2, TrendingUp } from "lucide-react";

interface InsightsProps {
  userId: string;
}

export const DashboardInsights = ({ userId }: InsightsProps) => {
  const [stats, setStats] = useState({
    totalEmployees: 0,
    activeConversations: 0,
    completedTasks: 0,
    pendingTasks: 0,
  });

  useEffect(() => {
    const fetchStats = async () => {
      const [employeesRes, conversationsRes, completedTasksRes, pendingTasksRes] = await Promise.all([
        supabase.from("employees").select("id", { count: "exact" }).eq("user_id", userId).is("deleted_at", null),
        supabase.from("conversations").select("id", { count: "exact" }).eq("employee_id", userId),
        supabase.from("tasks").select("id", { count: "exact" }).eq("created_by", userId).eq("status", "completed"),
        supabase.from("tasks").select("id", { count: "exact" }).eq("created_by", userId).eq("status", "pending"),
      ]);

      setStats({
        totalEmployees: employeesRes.count || 0,
        activeConversations: conversationsRes.count || 0,
        completedTasks: completedTasksRes.count || 0,
        pendingTasks: pendingTasksRes.count || 0,
      });
    };

    fetchStats();
  }, [userId]);

  const cards = [
    {
      title: "Total Employees",
      value: stats.totalEmployees,
      icon: Users,
      color: "text-blue-500",
      bg: "bg-blue-500/10",
    },
    {
      title: "Active Conversations",
      value: stats.activeConversations,
      icon: MessageSquare,
      color: "text-green-500",
      bg: "bg-green-500/10",
    },
    {
      title: "Completed Tasks",
      value: stats.completedTasks,
      icon: CheckCircle2,
      color: "text-purple-500",
      bg: "bg-purple-500/10",
    },
    {
      title: "Pending Tasks",
      value: stats.pendingTasks,
      icon: TrendingUp,
      color: "text-orange-500",
      bg: "bg-orange-500/10",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <Card key={index} className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {card.title}
            </CardTitle>
            <div className={`w-8 h-8 rounded-lg ${card.bg} flex items-center justify-center`}>
              <card.icon className={`h-4 w-4 ${card.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{card.value}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
