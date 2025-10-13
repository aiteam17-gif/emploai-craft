import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { useToast } from "@/hooks/use-toast";
import { Loader2, CheckCircle2, XCircle, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";

interface Task {
  id: string;
  title: string;
  description: string | null;
  status: string;
  priority: string;
  created_at: string;
  assigned_employee_id: string | null;
  employees: {
    name: string;
    expertise: string;
  } | null;
}

const TaskVerifier = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [selectedTask, setSelectedTask] = useState<string | null>(null);
  const [verificationNotes, setVerificationNotes] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
        fetchTasks(session.user.id);
      }
    });
  }, [navigate]);

  const fetchTasks = async (userId: string) => {
    const { data } = await supabase
      .from("tasks")
      .select(`
        *,
        employees:assigned_employee_id (
          name,
          expertise
        )
      `)
      .eq("created_by", userId)
      .order("created_at", { ascending: false });

    if (data) setTasks(data as Task[]);
  };

  const handleVerify = async (taskId: string, approved: boolean) => {
    const { error } = await supabase
      .from("tasks")
      .update({ 
        status: approved ? "completed" : "pending",
        completed_at: approved ? new Date().toISOString() : null
      })
      .eq("id", taskId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update task status",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: `Task ${approved ? "approved" : "rejected"} successfully`,
      });
      if (user) fetchTasks(user.id);
      setSelectedTask(null);
      setVerificationNotes("");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => navigate("/dashboard")}>
              ← Back
            </Button>
            <CheckCircle2 className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Task Verifier & Allotter</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Pending Tasks</CardTitle>
            </CardHeader>
            <CardContent>
              {tasks.filter(t => t.status === "pending").length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No pending tasks to verify
                </div>
              ) : (
                <div className="space-y-3">
                  {tasks.filter(t => t.status === "pending").map((task) => (
                    <div
                      key={task.id}
                      className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                        selectedTask === task.id ? "bg-accent border-primary" : "hover:bg-accent"
                      }`}
                      onClick={() => setSelectedTask(task.id)}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium">{task.title}</h4>
                        <Badge variant="secondary">{task.priority}</Badge>
                      </div>
                      {task.description && (
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {task.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-xs text-muted-foreground">
                        <span>
                          {task.employees ? `${task.employees.name} - ${task.employees.expertise}` : "Unassigned"}
                        </span>
                        <Clock className="h-3 w-3" />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Verification Panel</CardTitle>
            </CardHeader>
            <CardContent>
              {selectedTask ? (
                <div className="space-y-4">
                  {(() => {
                    const task = tasks.find(t => t.id === selectedTask);
                    return task ? (
                      <>
                        <div>
                          <h3 className="font-semibold text-lg mb-2">{task.title}</h3>
                          <p className="text-sm text-muted-foreground mb-4">
                            {task.description || "No description provided"}
                          </p>
                          <div className="flex items-center gap-2 text-sm mb-4">
                            <Badge>{task.priority} priority</Badge>
                            {task.employees && (
                              <Badge variant="outline">
                                Assigned to {task.employees.name}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="space-y-2">
                          <label className="text-sm font-medium">Verification Notes</label>
                          <Textarea
                            placeholder="Add notes about your verification decision..."
                            value={verificationNotes}
                            onChange={(e) => setVerificationNotes(e.target.value)}
                            rows={4}
                          />
                        </div>

                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleVerify(selectedTask, true)}
                            className="flex-1 bg-green-600 hover:bg-green-700"
                          >
                            <CheckCircle2 className="mr-2 h-4 w-4" />
                            Approve
                          </Button>
                          <Button
                            onClick={() => handleVerify(selectedTask, false)}
                            variant="destructive"
                            className="flex-1"
                          >
                            <XCircle className="mr-2 h-4 w-4" />
                            Reject
                          </Button>
                        </div>
                      </>
                    ) : null;
                  })()}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground text-center py-12">
                  Select a task from the left to verify
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Completed Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            {tasks.filter(t => t.status === "completed").length === 0 ? (
              <div className="text-sm text-muted-foreground text-center py-4">
                No completed tasks yet
              </div>
            ) : (
              <div className="space-y-2">
                {tasks.filter(t => t.status === "completed").map((task) => (
                  <div key={task.id} className="p-3 border rounded-lg bg-green-50 dark:bg-green-950/20">
                    <div className="flex items-center justify-between">
                      <div>
                        <h4 className="font-medium">{task.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {task.employees ? `${task.employees.name}` : "Unassigned"}
                        </p>
                      </div>
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default TaskVerifier;