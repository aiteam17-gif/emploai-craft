import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Auth from "./pages/Auth";
import Employee from "./pages/Employee";
import NotFound from "./pages/NotFound";
import Landing from "./pages/Landing";
import Supervisor from "./pages/Supervisor";
import Settings from "./pages/Settings";
import CompanySettings from "./pages/CompanySettings";
import EmployeeGroups from "./pages/EmployeeGroups";
import TaskVerifier from "./pages/TaskVerifier";
import AIMessaging from "./pages/AIMessaging";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/dashboard" element={<Home />} />
          <Route path="/supervisor" element={<Supervisor />} />
          <Route path="/groups" element={<EmployeeGroups />} />
          <Route path="/verifier" element={<TaskVerifier />} />
          <Route path="/ai-messaging" element={<AIMessaging />} />
          <Route path="/auth" element={<Auth />} />
          <Route path="/employee/:id" element={<Employee />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/company-settings" element={<CompanySettings />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
