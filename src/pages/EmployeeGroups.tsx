import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { UserMenu } from "@/components/UserMenu";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Users, Plus, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";

interface Group {
  id: string;
  name: string;
  description: string;
  created_at: string;
}

interface Employee {
  id: string;
  name: string;
  expertise: string;
}

const EmployeeGroups = () => {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [groups, setGroups] = useState<Group[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null);
  const [groupMembers, setGroupMembers] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupDesc, setGroupDesc] = useState("");
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      } else {
        setLoading(false);
        fetchData(session.user.id);
      }
    });
  }, [navigate]);

  const fetchData = async (userId: string) => {
    // Fetch groups
    const { data: groupsData } = await supabase
      .from("groups")
      .select("*")
      .eq("created_by", userId)
      .order("created_at", { ascending: false });
    
    if (groupsData) setGroups(groupsData);

    // Fetch employees
    const { data: empData } = await supabase
      .from("employees")
      .select("id, name, expertise")
      .eq("user_id", userId)
      .is("deleted_at", null);
    
    if (empData) setEmployees(empData);
  };

  const createGroup = async () => {
    if (!groupName.trim() || !user) return;

    const { error } = await supabase
      .from("groups")
      .insert({
        name: groupName,
        description: groupDesc,
        created_by: user.id,
      });

    if (error) {
      toast({
        title: "Error",
        description: "Failed to create group",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Group created successfully",
      });
      fetchData(user.id);
      setDialogOpen(false);
      setGroupName("");
      setGroupDesc("");
    }
  };

  const deleteGroup = async (groupId: string) => {
    const { error } = await supabase
      .from("groups")
      .delete()
      .eq("id", groupId);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete group",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Group deleted",
      });
      fetchData(user.id);
      setSelectedGroup(null);
    }
  };

  const loadGroupMembers = async (groupId: string) => {
    const { data } = await supabase
      .from("group_members")
      .select("employee_id")
      .eq("group_id", groupId);
    
    if (data) {
      setGroupMembers(data.map((m) => m.employee_id));
    }
  };

  const toggleMember = async (employeeId: string) => {
    if (!selectedGroup) return;

    const isMember = groupMembers.includes(employeeId);

    if (isMember) {
      const { error } = await supabase
        .from("group_members")
        .delete()
        .eq("group_id", selectedGroup)
        .eq("employee_id", employeeId);

      if (!error) {
        setGroupMembers((prev) => prev.filter((id) => id !== employeeId));
        toast({ title: "Member removed" });
      }
    } else {
      const { error } = await supabase
        .from("group_members")
        .insert({
          group_id: selectedGroup,
          employee_id: employeeId,
        });

      if (!error) {
        setGroupMembers((prev) => [...prev, employeeId]);
        toast({ title: "Member added" });
      }
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
            <Users className="w-6 h-6 text-primary" />
            <h1 className="text-2xl font-bold">Employee Groups</h1>
          </div>
          <UserMenu />
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="grid md:grid-cols-3 gap-6">
          <Card className="md:col-span-1">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Groups</CardTitle>
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    New Group
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Create Employee Group</DialogTitle>
                    <DialogDescription>
                      Create a group to organize employees by team, department, or project.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="groupName">Group Name</Label>
                      <Input
                        id="groupName"
                        placeholder="e.g., Marketing Team"
                        value={groupName}
                        onChange={(e) => setGroupName(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="groupDesc">Description</Label>
                      <Input
                        id="groupDesc"
                        placeholder="Brief description"
                        value={groupDesc}
                        onChange={(e) => setGroupDesc(e.target.value)}
                      />
                    </div>
                    <Button onClick={createGroup} className="w-full">
                      Create Group
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
            </CardHeader>
            <CardContent>
              {groups.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No groups yet. Create your first group to organize employees.
                </div>
              ) : (
                <div className="space-y-2">
                  {groups.map((group) => (
                    <div
                      key={group.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedGroup === group.id ? "bg-accent" : "hover:bg-accent/50"
                      }`}
                      onClick={() => {
                        setSelectedGroup(group.id);
                        loadGroupMembers(group.id);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium">{group.name}</div>
                          {group.description && (
                            <div className="text-sm text-muted-foreground">{group.description}</div>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteGroup(group.id);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>
                {selectedGroup ? "Manage Group Members" : "Available Employees"}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!selectedGroup ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  Select a group to manage members
                </div>
              ) : employees.length === 0 ? (
                <div className="text-sm text-muted-foreground text-center py-8">
                  No employees available. Create employees first.
                </div>
              ) : (
                <div className="space-y-2">
                  {employees.map((emp) => (
                    <div key={emp.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={groupMembers.includes(emp.id)}
                          onCheckedChange={() => toggleMember(emp.id)}
                        />
                        <div>
                          <div className="font-medium">{emp.name}</div>
                          <div className="text-sm text-muted-foreground">{emp.expertise}</div>
                        </div>
                      </div>
                      <Badge variant={groupMembers.includes(emp.id) ? "default" : "outline"}>
                        {groupMembers.includes(emp.id) ? "Member" : "Available"}
                      </Badge>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default EmployeeGroups;