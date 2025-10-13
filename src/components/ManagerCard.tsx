import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { Crown, MessageSquare, Loader2 } from "lucide-react";

interface Manager {
  id: string;
  name: string;
  gender: "male" | "female" | "neutral";
  expertise: string;
  avatar_url: string | null;
  level: "junior" | "senior";
  role: "employee" | "manager";
}

interface ManagerCardProps {
  userId: string;
}

export const ManagerCard = ({ userId }: ManagerCardProps) => {
  const [manager, setManager] = useState<Manager | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchManager = async () => {
      try {
        const { data, error } = await supabase
          .from("employees")
          .select("*")
          .eq("user_id", userId)
          .eq("role", "manager")
          .is("deleted_at", null)
          .order("created_at", { ascending: true })
          .limit(1)
          .maybeSingle();

        if (error) throw error;
        setManager(data);
      } catch (error) {
        console.error("Error fetching manager:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchManager();
  }, [userId]);

  if (loading) {
    return (
      <Card className="p-6">
        <div className="flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Card>
    );
  }

  if (!manager) {
    return null;
  }

  return (
    <Card className="p-6 bg-gradient-to-br from-primary/5 to-purple-500/5 border-primary/20">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4 flex-1">
          <div className="relative">
            <img
              src={manager.avatar_url || `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(manager.name)}&radius=50`}
              alt={`${manager.name} avatar`}
              className="h-16 w-16 rounded-full border-2 border-primary object-cover"
            />
            <div className="absolute -top-1 -right-1 bg-yellow-500 rounded-full p-1">
              <Crown className="h-4 w-4 text-white" />
            </div>
          </div>
          
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="text-xl font-bold">{manager.name}</h3>
              <Badge variant="default" className="bg-primary">
                Organization Manager
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mb-2">
              {manager.expertise} • {manager.level.charAt(0).toUpperCase() + manager.level.slice(1)} Level
            </p>
            <p className="text-sm text-muted-foreground">
              Your dedicated manager who assigns and oversees tasks for all employees
            </p>
          </div>
        </div>

        <Button
          onClick={() => navigate(`/employee/${manager.id}`)}
          className="flex-shrink-0"
        >
          <MessageSquare className="mr-2 h-4 w-4" />
          Chat
        </Button>
      </div>
    </Card>
  );
};