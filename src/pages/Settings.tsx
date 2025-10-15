import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Building2, ChevronRight } from "lucide-react";

const Settings = () => {
  const navigate = useNavigate();
  const [role, setRole] = useState("user");
  const [aiProvider, setAiProvider] = useState("gemini");
  const [email, setEmail] = useState("");

  useEffect(() => {
    (async () => {
      const user = (await supabase.auth.getUser()).data.user;
      if (user) {
        setEmail(user.email || "");
        setRole(((user.user_metadata as any)?.role as string) || "user");
        setAiProvider(((user.user_metadata as any)?.aiProvider as string) || "gemini");
      }
    })();
  }, []);

  const save = async () => {
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    // Update user metadata role
    await supabase.auth.updateUser({ data: { role, aiProvider } });
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-3xl space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Company Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            className="w-full justify-between"
            onClick={() => navigate("/company-settings")}
          >
            <div className="flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              <span>Company Information</span>
            </div>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>User Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-sm text-muted-foreground">{email}</div>
          <div className="space-y-2">
            <div className="text-sm font-medium">Role</div>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <div className="text-sm font-medium">AI Provider</div>
            <Select value={aiProvider} onValueChange={setAiProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini (current)</SelectItem>
                <SelectItem value="openai">OpenAI</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={save}>Save</Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default Settings;


