import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Priority = "P1" | "P2" | "P3" | null;

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string | null;
  status: string;
  created_at: string;
  updated_at: string;
  assigned_employee_id: string | null;
  created_by: string;
}

interface PriorityBoardProps {
  userId: string;
}

const priorityOrder: Record<string, number> = { P1: 0, P2: 1, P3: 2 };

export const PriorityBoard = ({ userId }: PriorityBoardProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select("id,title,description,priority,status,created_at,updated_at,assigned_employee_id,created_by")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });
    if (!error) setTasks(data || []);
    setLoading(false);
  };

  useEffect(() => {
    fetchTasks();
    // Realtime updates on tasks table
    const channel = supabase
      .channel("realtime-tasks")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "tasks", filter: `created_by=eq.${userId}` },
        () => fetchTasks()
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  const lanes = useMemo(() => {
    const grouped: Record<Priority, Task[]> = { P1: [], P2: [], P3: [], null: [] } as any;
    for (const t of tasks) {
      const p = (t.priority as Priority) ?? null;
      grouped[p]?.push(t);
    }
    for (const key of Object.keys(grouped)) {
      grouped[key as Priority]?.sort((a, b) => {
        const ao = priorityOrder[a.priority || "P3"] ?? 2;
        const bo = priorityOrder[b.priority || "P3"] ?? 2;
        if (ao !== bo) return ao - bo;
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    }
    return grouped;
  }, [tasks]);

  const Lane = ({ name, items }: { name: string; items: Task[] }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>{name}</span>
          <Badge variant="secondary">{items.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-[64px] w-full" />
            ))}
          </div>
        ) : (
          <ScrollArea className="h-[320px] pr-2">
            <div className="space-y-3">
              {items.length === 0 && (
                <div className="text-sm text-muted-foreground">No tasks</div>
              )}
              {items.map((t) => (
                <div key={t.id} className="rounded-lg border p-3 hover:bg-muted/50 transition-colors">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="font-medium truncate" title={t.title}>{t.title}</div>
                      {t.description && (
                        <div className="text-sm text-muted-foreground line-clamp-2">{t.description}</div>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <Badge variant={t.priority === "P1" ? "destructive" : "secondary"}>{t.priority || "—"}</Badge>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Badge variant="outline" className="text-xs">{t.status}</Badge>
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="text-xs">Updated {new Date(t.updated_at).toLocaleString()}</div>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>Created {new Date(t.created_at).toLocaleString()}</span>
                    <span>{t.assigned_employee_id ? "Assigned" : "Unassigned"}</span>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        )}
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold">Priority Board</h2>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Lane name="P1 — Urgent" items={lanes.P1} />
        <Lane name="P2 — Important" items={lanes.P2} />
        <Lane name="P3 — Normal" items={lanes.P3} />
      </div>
    </div>
  );
};


