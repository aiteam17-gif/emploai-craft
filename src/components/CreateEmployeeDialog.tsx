import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Label } from "./ui/label";
import { Input } from "./ui/input";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const EXPERTISE_OPTIONS = [
  "HR",
  "Marketing & Design",
  "Technology",
  "Finance",
  "GTM & Market Analysis",
  "Report Polishing",
];

const GENDER_OPTIONS = [
  { value: "male", label: "Male" },
  { value: "female", label: "Female" },
  { value: "neutral", label: "Neutral" },
];

interface CreateEmployeeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string;
}

export const CreateEmployeeDialog = ({ open, onOpenChange, userId }: CreateEmployeeDialogProps) => {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<string>("");
  const [expertise, setExpertise] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleCreate = async () => {
    if (!name.trim() || !gender || !expertise) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("employees").insert({
        user_id: userId,
        name: name.trim(),
        gender: gender as "male" | "female" | "neutral",
        expertise: expertise as "HR" | "Marketing & Design" | "Technology" | "Finance" | "GTM & Market Analysis" | "Report Polishing",
      });

      if (error) throw error;

      toast({
        title: "Employee created!",
        description: `${name} is ready to help you.`,
      });

      setName("");
      setGender("");
      setExpertise("");
      onOpenChange(false);
      window.location.reload();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to create employee",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Employee</DialogTitle>
          <DialogDescription>
            Set up a new AI employee with their name, gender, and area of expertise.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 pt-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              placeholder="e.g., Sarah, Alex, Jordan"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={gender} onValueChange={setGender} disabled={loading}>
              <SelectTrigger id="gender">
                <SelectValue placeholder="Select gender" />
              </SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="expertise">Expertise</Label>
            <Select value={expertise} onValueChange={setExpertise} disabled={loading}>
              <SelectTrigger id="expertise">
                <SelectValue placeholder="Select expertise" />
              </SelectTrigger>
              <SelectContent>
                {EXPERTISE_OPTIONS.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleCreate} className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              "Create Employee"
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};