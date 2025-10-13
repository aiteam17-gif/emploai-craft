import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { UserMenu } from "@/components/UserMenu";

const Supervisor = () => {
  const [loading, setLoading] = useState(true);
  const [authorized, setAuthorized] = useState<boolean | null>(null);

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
      setLoading(false);
    })();
  }, []);

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
      <div className="text-sm text-muted-foreground">
        This area is reserved for supervisor-level features.
      </div>
    </div>
  );
};

export default Supervisor;


