import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MoreVertical, MessageSquare, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

const EXPERTISE_COLORS = {
  "HR": "hsl(var(--expertise-hr))",
  "Marketing & Design": "hsl(var(--expertise-marketing))",
  "Technology": "hsl(var(--expertise-technology))",
  "Finance": "hsl(var(--expertise-finance))",
  "GTM & Market Analysis": "hsl(var(--expertise-gtm))",
  "Report Polishing": "hsl(var(--expertise-polish))",
};

interface Employee {
  id: string;
  name: string;
  gender: "male" | "female" | "neutral";
  expertise: string;
  avatar_url: string | null;
  updated_at: string;
}

interface EmployeeCardProps {
  employee: Employee;
  onDelete: (id: string) => void;
}

export const EmployeeCard = ({ employee, onDelete }: EmployeeCardProps) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .slice(0, 2);
  };

  const expertiseColor = EXPERTISE_COLORS[employee.expertise as keyof typeof EXPERTISE_COLORS] || EXPERTISE_COLORS["Technology"];

  return (
    <>
      <Card className="group relative aspect-[3/4] overflow-hidden border-2 hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
        <div className="absolute inset-0 p-6 flex flex-col">
          {/* Avatar */}
          <div className="relative mb-4">
            <div
              className="w-full aspect-square rounded-2xl flex items-center justify-center text-white font-bold text-4xl shadow-lg"
              style={{ background: `linear-gradient(135deg, ${expertiseColor}, ${expertiseColor}dd)` }}
            >
              {getInitials(employee.name)}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="secondary"
                  size="icon"
                  className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => navigate(`/employee/${employee.id}`)}>
                  <MessageSquare className="mr-2 h-4 w-4" />
                  Open
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteDialogOpen(true)}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* Info */}
          <div className="flex-1 flex flex-col">
            <h3 className="font-bold text-xl mb-2 truncate">{employee.name}</h3>
            <div
              className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium mb-3 w-fit"
              style={{ backgroundColor: `${expertiseColor}20`, color: expertiseColor }}
            >
              {employee.expertise}
            </div>
            <p className="text-xs text-muted-foreground mt-auto">
              Last active {formatDistanceToNow(new Date(employee.updated_at), { addSuffix: true })}
            </p>
          </div>

          {/* Action */}
          <Button
            onClick={() => navigate(`/employee/${employee.id}`)}
            className="w-full mt-4"
          >
            <MessageSquare className="mr-2 h-4 w-4" />
            Open Chat
          </Button>
        </div>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {employee.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This employee will be soft-deleted and can be restored within 30 days. After that, they will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                onDelete(employee.id);
                setDeleteDialogOpen(false);
              }}
              className="bg-destructive hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};