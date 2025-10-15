import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Loader2, Building2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface CompanyInfo {
  id?: string;
  company_name: string;
  mission: string;
  vision: string;
  values: string;
  industry: string;
  founded_year: number | null;
  company_size: string;
  headquarters: string;
  policies: string;
  benefits: string;
  culture: string;
  products_services: string;
}

const CompanySettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>({
    company_name: "",
    mission: "",
    vision: "",
    values: "",
    industry: "",
    founded_year: null,
    company_size: "",
    headquarters: "",
    policies: "",
    benefits: "",
    culture: "",
    products_services: "",
  });

  useEffect(() => {
    fetchCompanyInfo();
  }, []);

  const fetchCompanyInfo = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate("/auth");
        return;
      }

      const { data, error } = await supabase
        .from("company_info")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (error && error.code !== "PGRST116") throw error;
      
      if (data) {
        setCompanyInfo(data);
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load company information",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const payload = {
        ...companyInfo,
        user_id: user.id,
        founded_year: companyInfo.founded_year || null,
      };

      if (companyInfo.id) {
        const { error } = await supabase
          .from("company_info")
          .update(payload)
          .eq("id", companyInfo.id);
        if (error) throw error;
      } else {
        const { data, error } = await supabase
          .from("company_info")
          .insert(payload)
          .select()
          .single();
        if (error) throw error;
        setCompanyInfo(data);
      }

      toast({
        title: "Success",
        description: "Company information saved successfully",
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save company information",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (field: keyof CompanyInfo, value: string | number | null) => {
    setCompanyInfo(prev => ({ ...prev, [field]: value }));
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
      <header className="sticky top-0 z-10 border-b bg-background/95 backdrop-blur px-4 py-4 flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <Building2 className="h-6 w-6 text-primary" />
        <h1 className="font-bold text-xl">Company Information</h1>
      </header>

      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
            <CardDescription>
              This information will be shared with all employees to help them understand the company better
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="company_name">Company Name</Label>
                <Input
                  id="company_name"
                  value={companyInfo.company_name}
                  onChange={(e) => handleChange("company_name", e.target.value)}
                  placeholder="Acme Corporation"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="industry">Industry</Label>
                <Input
                  id="industry"
                  value={companyInfo.industry}
                  onChange={(e) => handleChange("industry", e.target.value)}
                  placeholder="Technology, Healthcare, etc."
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="founded_year">Founded Year</Label>
                <Input
                  id="founded_year"
                  type="number"
                  value={companyInfo.founded_year || ""}
                  onChange={(e) => handleChange("founded_year", e.target.value ? parseInt(e.target.value) : null)}
                  placeholder="2020"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="company_size">Company Size</Label>
                <Input
                  id="company_size"
                  value={companyInfo.company_size}
                  onChange={(e) => handleChange("company_size", e.target.value)}
                  placeholder="1-10, 11-50, 51-200, etc."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="headquarters">Headquarters</Label>
              <Input
                id="headquarters"
                value={companyInfo.headquarters}
                onChange={(e) => handleChange("headquarters", e.target.value)}
                placeholder="San Francisco, CA"
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Mission & Vision</CardTitle>
            <CardDescription>Define your company's purpose and direction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="mission">Mission Statement</Label>
              <Textarea
                id="mission"
                value={companyInfo.mission}
                onChange={(e) => handleChange("mission", e.target.value)}
                placeholder="Our mission is to..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="vision">Vision Statement</Label>
              <Textarea
                id="vision"
                value={companyInfo.vision}
                onChange={(e) => handleChange("vision", e.target.value)}
                placeholder="Our vision is to..."
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="values">Core Values</Label>
              <Textarea
                id="values"
                value={companyInfo.values}
                onChange={(e) => handleChange("values", e.target.value)}
                placeholder="Innovation, Integrity, Excellence..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Culture & Benefits</CardTitle>
            <CardDescription>Describe your workplace culture and employee benefits</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="culture">Company Culture</Label>
              <Textarea
                id="culture"
                value={companyInfo.culture}
                onChange={(e) => handleChange("culture", e.target.value)}
                placeholder="Describe your company culture, work environment, and team dynamics..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="benefits">Benefits & Perks</Label>
              <Textarea
                id="benefits"
                value={companyInfo.benefits}
                onChange={(e) => handleChange("benefits", e.target.value)}
                placeholder="Health insurance, retirement plans, PTO, remote work, etc..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Products & Policies</CardTitle>
            <CardDescription>Information about what you do and how you operate</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="products_services">Products & Services</Label>
              <Textarea
                id="products_services"
                value={companyInfo.products_services}
                onChange={(e) => handleChange("products_services", e.target.value)}
                placeholder="Describe your main products, services, and offerings..."
                rows={4}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="policies">Company Policies</Label>
              <Textarea
                id="policies"
                value={companyInfo.policies}
                onChange={(e) => handleChange("policies", e.target.value)}
                placeholder="Work hours, remote work policy, code of conduct, etc..."
                rows={4}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button onClick={handleSave} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save Company Information
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CompanySettings;
