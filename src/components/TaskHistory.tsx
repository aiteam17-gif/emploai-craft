import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Clock, CheckCircle2, AlertCircle, Plus } from "lucide-react";
import { useNavigate } from "react-router-dom";
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
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle, DrawerTrigger } from "@/components/ui/drawer";
import { Separator } from "@/components/ui/separator";

interface TaskHistoryProps {
  userId: string;
}

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
  chain_instances?: { status: string; steps?: any[]; step_states?: any[] }[];
}

export const TaskHistory = ({ userId }: TaskHistoryProps) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerTask, setDrawerTask] = useState<Task | null>(null);
  const [role, setRole] = useState<string>("user");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    priority: "medium",
    assigned_employee_id: "",
    suggested_employee_id: "",
  });

  useEffect(() => {
    fetchTasks();
    fetchEmployees();
    supabase.auth.getSession().then(({ data: { session } }) => {
      setRole(((session?.user?.user_metadata as any)?.role as string) || "user");
    });
  }, [userId]);

  const fetchTasks = async () => {
    const { data, error } = await supabase
      .from("tasks")
      .select(`
        *,
        employees:assigned_employee_id (
          name,
          expertise
        ),
        chain_instances(status, steps, step_states)
      `)
      .eq("created_by", userId)
      .order("created_at", { ascending: false })
      .limit(10);

    if (!error && data) {
      setTasks(data as Task[]);
    }
    setLoading(false);
  };

  const fetchEmployees = async () => {
    const { data } = await supabase
      .from("employees")
      .select("id, name, expertise")
      .eq("user_id", userId)
      .is("deleted_at", null);

    if (data) {
      setEmployees(data);
    }
  };

  // Improve suggested agent scoring: match expertise tags to title + description keywords
  useEffect(() => {
    if (!employees || employees.length === 0) return;
    const titleLower = formData.title.toLowerCase();
    const descLower = (formData.description || "").toLowerCase();
    const scoreFor = (expertise: string) => {
      const ex = String(expertise).toLowerCase();
      let score = 0;
      if (titleLower.includes(ex)) score += 2;
      if (descLower.includes(ex)) score += 1;
      return score;
    };
    const ranked = [...employees].map((e: any) => ({ id: e.id, score: scoreFor(e.expertise) }));
    ranked.sort((a, b) => b.score - a.score);
    if (ranked[0] && ranked[0].score > 0) {
      setFormData((s) => ({ ...s, suggested_employee_id: ranked[0].id }));
    }
  }, [employees, formData.title, formData.description]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const { error } = await supabase.from("tasks").insert({
      title: formData.title,
      description: formData.description,
      priority: formData.priority,
      assigned_employee_id: formData.assigned_employee_id || null,
      created_by: userId,
      status: "pending",
    });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create task",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Task created successfully",
      });
      setDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        priority: "medium",
        assigned_employee_id: "",
      });
      fetchTasks();
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case "pending":
        return <Clock className="h-4 w-4 text-orange-500" />;
      default:
        return <AlertCircle className="h-4 w-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      completed: "default",
      pending: "secondary",
      in_progress: "outline",
    };
    return <Badge variant={variants[status] || "outline"}>{status}</Badge>;
  };

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      high: "text-red-500",
      medium: "text-yellow-500",
      low: "text-green-500",
    };
    return colors[priority] || "text-gray-500";
  };

  const applyTemplateToTask = async (taskId: string) => {
    // Pick the most recent template by this user
    const { data: tpl } = await supabase.from("chain_templates").select("id, steps").order("created_at", { ascending: false }).limit(1).single();
    if (!tpl) {
      toast({ title: "No template", description: "Create a template in Supervisor first." });
      return;
    }
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const payload: any = { created_by: user.id, task_id: taskId, template_id: tpl.id, steps: tpl.steps, status: "pending" };
    const { error } = await supabase.from("chain_instances").insert(payload);
    if (error) {
      toast({ title: "Failed", description: "Could not apply template", variant: "destructive" });
    } else {
      toast({ title: "Applied", description: "Template applied. Chain created." });
    }
  };

  const updateStepState = async (taskId: string, stepIndex: number, next: string) => {
    // fetch chain instance for this task
    const { data } = await supabase.from("chain_instances").select("id, step_states").eq("task_id", taskId).order("created_at", { ascending: false }).limit(1).single();
    if (!data) return;
    const states = Array.isArray(data.step_states) ? [...data.step_states] : [];
    states[stepIndex] = { ...(states[stepIndex] || {}), state: next };
    const { error } = await supabase.from("chain_instances").update({ step_states: states, status: next === "succeeded" ? "running" : "running" }).eq("id", data.id);
    if (!error) fetchTasks();
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Task Manager</CardTitle>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Task
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Task</DialogTitle>
              <DialogDescription>
                Assign a task to one of your AI employees
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTask} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Task Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="priority">Priority</Label>
                  <Select
                    value={formData.priority}
                    onValueChange={(value) => setFormData({ ...formData, priority: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="employee">Assign To</Label>
                  <Select
                    value={formData.assigned_employee_id}
                    onValueChange={(value) => setFormData({ ...formData, assigned_employee_id: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={formData.suggested_employee_id ? `Suggested: ${employees.find((e)=>e.id===formData.suggested_employee_id)?.name}` : "Select employee"} />
                    </SelectTrigger>
                    <SelectContent>
                      {employees.map((emp) => (
                        <SelectItem key={emp.id} value={emp.id}>
                          {emp.name} - {emp.expertise}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <Button type="submit" className="w-full">
                Create Task
              </Button>
            </form>
          </DialogContent>
        </Dialog>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px] pr-4">
          {loading ? (
            <div className="text-center text-muted-foreground py-8">Loading tasks...</div>
          ) : tasks.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              No tasks yet. Create your first task to get started!
            </div>
          ) : (
            <div className="space-y-3">
              {tasks.map((task) => (
                <div
                  key={task.id}
                  className="p-4 rounded-lg border bg-card hover:shadow-md transition-shadow cursor-pointer"
                  onClick={() => {
                    if (task.assigned_employee_id) {
                      navigate(`/employee/${task.assigned_employee_id}`);
                    }
                  }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getStatusIcon(task.status)}
                      <h4 className="font-medium">{task.title}</h4>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-medium ${getPriorityColor(task.priority)}`}>
                        {task.priority}
                      </span>
                      {getStatusBadge(task.status)}
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            Actions <ChevronDown className="h-3 w-3 ml-1" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => applyTemplateToTask(task.id)}>
                            Apply latest template
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
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
                    <span className="flex items-center gap-2">
                      {task.chain_instances && task.chain_instances.length > 0 && (
                        <Drawer open={drawerOpen && drawerTask?.id === task.id} onOpenChange={(o)=>{ setDrawerOpen(o); if(!o) setDrawerTask(null); }}>
                          <DrawerTrigger asChild>
                            <Button variant="outline" size="sm" onClick={(e)=>{ e.stopPropagation(); setDrawerTask(task); setDrawerOpen(true); }}>
                              <Badge variant="outline">Chain: {task.chain_instances[0].status}</Badge>
                            </Button>
                          </DrawerTrigger>
                          <DrawerContent>
                            <DrawerHeader>
                              <DrawerTitle>Chain Details</DrawerTitle>
                              <DrawerDescription>Overview of the latest chain instance</DrawerDescription>
                            </DrawerHeader>
                            <div className="p-4">
                              <div className="text-sm text-muted-foreground">Task: {task.title}</div>
                              <div className="mt-3 text-sm">Status: {task.chain_instances?.[0]?.status}</div>
                              <div className="mt-3 text-sm">
                                <div className="font-medium mb-2">Steps</div>
                                <div className="space-y-2">
                                  {(task.chain_instances?.[0]?.steps || []).map((s: any, idx: number) => {
                                    const st = task.chain_instances?.[0]?.step_states?.[idx]?.state || "pending";
                                    return (
                                      <div key={idx} className="flex items-center justify-between rounded border p-2">
                                        <div className="text-sm">{s.type || `step_${idx+1}`}</div>
                                        <div className="flex items-center gap-2">
                                          <Badge variant={st === "succeeded" ? "default" : st === "running" ? "secondary" : "outline"}>{st}</Badge>
                                          {(role === "supervisor" || role === "admin") && (
                                            <>
                                              <Button size="sm" variant="outline" onClick={()=>updateStepState(task.id, idx, "running")}>Start</Button>
                                              <Button size="sm" onClick={()=>updateStepState(task.id, idx, "succeeded")}>Complete</Button>
                                            </>
                                          )}
                                        </div>
                                      </div>
                                    );
                                  })}
                                  {(task.chain_instances?.[0]?.steps || []).length === 0 && (
                                    <div className="text-muted-foreground">No steps recorded.</div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </DrawerContent>
                        </Drawer>
                      )}
                      {new Date(task.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
