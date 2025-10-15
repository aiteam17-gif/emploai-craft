import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Building2, Target, Eye, Heart, Briefcase } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface CompanyInfoData {
  company_name?: string;
  industry?: string;
  founded_year?: number;
  company_size?: string;
  headquarters?: string;
  mission?: string;
  vision?: string;
  values?: string;
  culture?: string;
  benefits?: string;
  products_services?: string;
  policies?: string;
}

const CompanyInfo = () => {
  const [companyInfo, setCompanyInfo] = useState<CompanyInfoData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from("company_info")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      
      if (data) {
        setCompanyInfo(data);
      }
    } catch (error: any) {
      console.error("Error fetching company info:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Company Information</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!companyInfo || !companyInfo.company_name) {
    return null;
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Building2 className="h-5 w-5 text-primary" />
          <CardTitle>{companyInfo.company_name}</CardTitle>
        </div>
        <CardDescription>
          {companyInfo.industry && <span>{companyInfo.industry}</span>}
          {companyInfo.founded_year && <span> • Founded {companyInfo.founded_year}</span>}
          {companyInfo.company_size && <span> • {companyInfo.company_size} employees</span>}
          {companyInfo.headquarters && <span> • {companyInfo.headquarters}</span>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {companyInfo.mission && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Mission</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-6">{companyInfo.mission}</p>
          </div>
        )}

        {companyInfo.vision && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Eye className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Vision</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-6">{companyInfo.vision}</p>
          </div>
        )}

        {companyInfo.values && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Heart className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">Core Values</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-6">{companyInfo.values}</p>
          </div>
        )}

        {companyInfo.products_services && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Briefcase className="h-4 w-4 text-primary" />
              <h3 className="font-semibold text-sm">What We Do</h3>
            </div>
            <p className="text-sm text-muted-foreground pl-6">{companyInfo.products_services}</p>
          </div>
        )}

        <div className="flex flex-wrap gap-2 pt-2">
          {companyInfo.culture && (
            <Badge variant="secondary">Culture: {companyInfo.culture.substring(0, 50)}...</Badge>
          )}
          {companyInfo.benefits && (
            <Badge variant="secondary">Benefits Available</Badge>
          )}
          {companyInfo.policies && (
            <Badge variant="secondary">Policies Defined</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default CompanyInfo;
