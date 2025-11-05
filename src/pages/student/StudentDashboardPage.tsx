import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Utensils, DollarSign, FileText, Lightbulb, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
const dashboardItems = [
  {
    title: "Weekly Menu",
    description: "Check out what's cooking this week.",
    icon: <Utensils className="h-6 w-6 text-orange-500" />,
    link: "/student/menu",
  },
  {
    title: "My Dues",
    description: "View your payment history and current dues.",
    icon: <DollarSign className="h-6 w-6 text-green-500" />,
    link: "/student/dues",
  },
  {
    title: "Raise a Complaint",
    description: "Facing an issue? Let us know.",
    icon: <FileText className="h-6 w-6 text-red-500" />,
    link: "/student/complaints",
  },
  {
    title: "Give a Suggestion",
    description: "Have an idea to improve our service?",
    icon: <Lightbulb className="h-6 w-6 text-yellow-500" />,
    link: "/student/suggestions",
  },
];
export function StudentDashboardPage() {
  const user = useAuth(s => s.user);
  return (
    <AppLayout container>
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold">Welcome, {user?.name}!</h1>
          <p className="text-muted-foreground">Here's a quick overview of your mess account.</p>
        </div>
        <div className="grid gap-6 md:grid-cols-2">
          {dashboardItems.map((item) => (
            <Card key={item.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <div className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-muted">{item.icon}</div>
                  <div>
                    <CardTitle className="text-lg">{item.title}</CardTitle>
                    <CardDescription>{item.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Button asChild variant="outline" className="w-full">
                  <Link to={item.link}>
                    Go to {item.title} <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}