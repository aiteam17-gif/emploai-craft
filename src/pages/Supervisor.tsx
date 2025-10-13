import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { UserMenu } from "@/components/UserMenu";

type ChainTemplate = {
  id: string;
  name: string;
  steps: { type: string; gate?: { minVerifierScore?: number } }[];
  created_at: string;
};

const Supervisor = () => {
  const [templates, setTemplates] = useState<ChainTemplate[]>([]);
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

  const fetchTemplates = async () => {
    const { data } = await supabase.from("chain_templates").select("id, name, steps, created_at").order("created_at", { ascending: false });
    setTemplates((data as any) || []);
    setLoading(false);
  };

  useEffect(() => {
    (async () => {
      const session = (await supabase.auth.getSession()).data.session;
      const role = (session?.user?.user_metadata as any)?.role || "user";
      if (role !== "supervisor" && role !== "admin") {
        setAuthorized(false);
        setLoading(false);
        return;
      }
      setAuthorized(true);
      fetchTemplates();
    })();
  }, []);

  const createTemplate = async () => {
    if (!name.trim()) return;
    const user = (await supabase.auth.getUser()).data.user;
    if (!user) return;
    const payload = { name, steps: [{ type: "retrieve" }, { type: "generate" }], created_by: user.id } as any;
    const { error } = await supabase.from("chain_templates").insert(payload);
    if (!error) {
      setName("");
      fetchTemplates();
    }
  };

  if (authorized === false) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-6xl">
        <h1 className="text-2xl font-bold mb-2">Supervisor</h1>
        <div className="text-sm text-muted-foreground">You do not have access to this area.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Supervisor</h1>
        <div className="flex items-center gap-2">
          <span className="text-xs px-2 py-1 rounded bg-muted">supervisor</span>
          <UserMenu />
        </div>
      </div>
      <div className="grid md:grid-cols-3 gap-6">
        <Card className="md:col-span-1">
          <CardHeader>
            <CardTitle>Create Decomposition Template</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Input placeholder="Template name" value={name} onChange={(e) => setName(e.target.value)} />
            <Button onClick={createTemplate}>Save</Button>
          </CardContent>
        </Card>
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Templates</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-[56px] w-full rounded bg-muted animate-pulse" />
                ))}
              </div>
            ) : templates.length === 0 ? (
              <div className="text-sm text-muted-foreground">No templates yet.</div>
            ) : (
              <div className="space-y-3">
                {templates.map((t) => (
                  <div key={t.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">{t.name}</div>
                      <Badge variant="secondary">{t.steps.length} steps</Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Supervisor;


