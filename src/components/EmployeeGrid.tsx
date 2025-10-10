import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { EmployeeCard } from "./EmployeeCard";
import { Button } from "./ui/button";
import { Plus, Users } from "lucide-react";

interface Employee {
  id: string;
  name: string;
  gender: "male" | "female" | "neutral";
  expertise: string;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

interface EmployeeGridProps {
  userId: string;
  onCreateClick: () => void;
}

export const EmployeeGrid = ({ userId, onCreateClick }: EmployeeGridProps) => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchEmployees = async () => {
    try {
      const { data, error } = await supabase
        .from("employees")
        .select("*")
        .eq("user_id", userId)
        .is("deleted_at", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEmployees(data || []);
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to fetch employees",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, [userId]);

  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("employees")
        .update({ deleted_at: new Date().toISOString() })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Employee removed",
        description: "Employee has been soft-deleted. You can restore within 30 days.",
      });

      fetchEmployees();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete employee",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="aspect-[3/4] rounded-2xl bg-muted animate-pulse" />
        ))}
      </div>
    );
  }

  if (employees.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-2xl font-bold mb-2">No employees yet</h2>
        <p className="text-muted-foreground mb-6 max-w-md">
          Get started by creating your first AI employee. They'll help you with tasks specific to their expertise.
        </p>
        <Button onClick={onCreateClick} size="lg">
          <Plus className="mr-2 h-5 w-5" />
          Create Your First Employee
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {employees.map((employee) => (
        <EmployeeCard
          key={employee.id}
          employee={employee}
          onDelete={handleDelete}
        />
      ))}
    </div>
  );
};