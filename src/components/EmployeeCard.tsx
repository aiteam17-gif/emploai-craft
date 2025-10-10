import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "./ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { MoreVertical, MessageSquare, Trash2 } from "lucide-react";
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

const getGenderLabel = (gender: string) => {
  if (gender === "male") return "Male";
  if (gender === "female") return "Female";
  return "Other";
};

export const EmployeeCard = ({ employee, onDelete }: EmployeeCardProps) => {
  const navigate = useNavigate();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  return (
    <>
      <div 
        className="flex items-center justify-between gap-3 rounded-xl border bg-card px-3 py-2 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
        onClick={() => navigate(`/employee/${employee.id}`)}
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <img
            src={employee.avatar_url || `https://api.dicebear.com/9.x/thumbs/svg?seed=${encodeURIComponent(employee.name)}&radius=50`}
            alt={`${employee.name} avatar`}
            className="h-10 w-10 rounded-full border object-cover flex-shrink-0"
          />
          <div className="min-w-0 flex-1">
            <div className="font-medium truncate">{employee.name}</div>
            <div className="text-sm text-muted-foreground truncate">
              {employee.expertise} • {getGenderLabel(employee.gender)}
            </div>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="ghost" 
              size="icon" 
              className="flex-shrink-0"
              onClick={(e) => e.stopPropagation()}
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => navigate(`/employee/${employee.id}`)}>
              <MessageSquare className="mr-2 h-4 w-4" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={() => setDeleteDialogOpen(true)}
              className="text-destructive"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Remove
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove {employee.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              This employee will be removed and can be restored within 30 days. After that, they will be permanently deleted.
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
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};