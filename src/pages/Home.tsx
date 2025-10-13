import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { UserMenu } from "@/components/UserMenu";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, LogOut, Briefcase, Users, CheckCircle2, MessageSquare } from "lucide-react";
import { EmployeeGrid } from "@/components/EmployeeGrid";
import { CreateEmployeeDialog } from "@/components/CreateEmployeeDialog";
import { DashboardInsights } from "@/components/DashboardInsights";
import { PriorityBoard } from "@/components/PriorityBoard";
import { useSSE } from "@/hooks/use-sse";
import { appendAudit } from "@/lib/audit";
import { TaskHistory } from "@/components/TaskHistory";

const Home = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [role, setRole] = useState<string>("user");
  const navigate = useNavigate();
  const { toast } = useToast();
  useSSE(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/events?userId=${user?.id ?? ""}`,(type)=>{
    if(type==="hello") return;
  });

  useEffect(() => {
    if (!user) return;
    appendAudit({ actorId: user.id, entityType: "page", entityId: "home", action: "view" });
  }, [user]);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        setRole((session?.user?.user_metadata as any)?.role || "user");
        if (!session) {
          navigate("/auth");
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setRole((session?.user?.user_metadata as any)?.role || "user");
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Signed out",
      description: "You have been successfully signed out.",
    });
    navigate("/auth");
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b sticky top-0 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-10">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              EmploAI
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={() => setCreateDialogOpen(true)} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              New Employee
            </Button>
            {(role === "supervisor" || role === "admin") && (
              <Button onClick={() => navigate("/supervisor")} variant="outline" size="sm">
                Supervisor
              </Button>
            )}
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-accent hover:border-primary transition-all"
            onClick={() => navigate("/groups")}
          >
            <Users className="w-8 h-8 text-primary" />
            <span className="font-semibold">Employee Groups</span>
            <span className="text-xs text-muted-foreground">Organize teams</span>
          </Button>
          
          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-accent hover:border-primary transition-all"
            onClick={() => navigate("/verifier")}
          >
            <CheckCircle2 className="w-8 h-8 text-primary" />
            <span className="font-semibold">Task Verifier</span>
            <span className="text-xs text-muted-foreground">Review & approve tasks</span>
          </Button>

          <Button
            variant="outline"
            className="h-24 flex flex-col items-center justify-center gap-2 hover:bg-accent hover:border-primary transition-all"
            onClick={() => navigate("/ai-messaging")}
          >
            <MessageSquare className="w-8 h-8 text-primary" />
            <span className="font-semibold">AI Messaging</span>
            <span className="text-xs text-muted-foreground">Chat with AI employees</span>
          </Button>
        </div>

        <DashboardInsights userId={user.id} />
        <div className="grid lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <PriorityBoard userId={user.id} />
            <EmployeeGrid userId={user.id} onCreateClick={() => setCreateDialogOpen(true)} />
          </div>
          <div className="lg:col-span-1">
            <TaskHistory userId={user.id} />
          </div>
        </div>
      </main>

      <CreateEmployeeDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        userId={user.id}
      />
    </div>
  );
};

export default Home;