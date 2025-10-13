import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Briefcase, Sparkles, MessageSquare, BarChart3, CheckCircle2, ArrowRight } from "lucide-react";

const Landing = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: MessageSquare,
      title: "AI-Powered Conversations",
      description: "Engage with intelligent AI employees tailored to specific expertise areas.",
    },
    {
      icon: Sparkles,
      title: "Smart Task Assignment",
      description: "Assign and track tasks with AI-assisted management for optimal productivity.",
    },
    {
      icon: BarChart3,
      title: "Real-Time Insights",
      description: "Monitor performance, completion rates, and employee engagement metrics.",
    },
    {
      icon: CheckCircle2,
      title: "Expertise Specialization",
      description: "Access specialists in HR, Marketing, Tech, Finance, and more.",
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
              <Briefcase className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-primary to-purple-500 bg-clip-text text-transparent">
              EmploAI
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="ghost" onClick={() => navigate("/auth")}>
              Sign In
            </Button>
            <Button onClick={() => navigate("/auth")}>
              Get Started <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border bg-card shadow-sm">
            <Sparkles className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">Your AI-Powered Workforce</span>
          </div>
          
          <h2 className="text-5xl md:text-7xl font-bold leading-tight">
            Transform Your Business with{" "}
            <span className="bg-gradient-to-r from-primary via-purple-500 to-pink-500 bg-clip-text text-transparent">
              AI Employees
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Build your dream team of AI specialists. From HR to Finance, Marketing to Tech—
            each employee is expertly trained and ready to help you scale.
          </p>

          <div className="flex justify-center pt-4">
            <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-6">
              Start Building Your Team
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="container mx-auto px-4 py-20 bg-background/50">
        <div className="max-w-6xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <h3 className="text-3xl md:text-4xl font-bold">
              Everything You Need to Succeed
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Powerful features designed to help you manage, track, and optimize your AI workforce.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            {features.map((feature, index) => (
              <div
                key={index}
                className="group p-8 rounded-2xl border bg-card shadow-sm hover:shadow-xl transition-all duration-300 hover:-translate-y-1"
              >
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-purple-500/20 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h4 className="text-xl font-semibold mb-3">{feature.title}</h4>
                <p className="text-muted-foreground leading-relaxed">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="container mx-auto px-4 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8 p-12 rounded-3xl border bg-gradient-to-br from-primary/5 to-purple-500/5">
          <h3 className="text-3xl md:text-5xl font-bold">
            Ready to Build Your AI Team?
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Join thousands of businesses already leveraging AI employees to scale faster and smarter.
          </p>
          <Button size="lg" onClick={() => navigate("/auth")} className="text-lg px-8 py-6">
            Get Started for Free
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background/50">
        <div className="container mx-auto px-4 py-8">
          <div className="flex items-center justify-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-gradient-to-br from-primary to-purple-500 flex items-center justify-center">
                <Briefcase className="w-3 h-3 text-white" />
              </div>
              <span className="font-medium">EmploAI</span>
            </div>
            <span>•</span>
            <span>© 2025 All rights reserved</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
