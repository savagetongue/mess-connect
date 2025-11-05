import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Utensils } from "lucide-react";
import { api } from "@/lib/api-client";
import type { WeeklyMenu } from "@shared/types";
import { motion } from "framer-motion";
export function AdminMenuPage() {
  const [menu, setMenu] = useState<WeeklyMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const menuData = await api<WeeklyMenu>('/api/menu');
        setMenu(menuData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch menu. The manager may not have set it yet.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);
  return (
    <AppLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <Card>
          <CardHeader>
            <CardTitle>View Weekly Menu</CardTitle>
            <CardDescription>This is the current menu visible to all students.</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : error ? (
              <Alert variant="destructive">
                <Utensils className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            ) : menu && menu.days.some(d => d.breakfast || d.lunch || d.dinner) ? (
              <Table role="table">
                <TableHeader aria-describedby="menu-description">
                  <TableRow>
                    <TableHead className="w-[100px]">Day</TableHead>
                    <TableHead>Breakfast</TableHead>
                    <TableHead>Lunch</TableHead>
                    <TableHead>Dinner</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {menu?.days.map((day) => (
                    <TableRow key={day.day} className="transition-colors hover:bg-muted/50">
                      <TableCell className="font-medium">{day.day}</TableCell>
                      <TableCell>{day.breakfast || "-"}</TableCell>
                      <TableCell>{day.lunch || "-"}</TableCell>
                      <TableCell>{day.dinner || "-"}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-10 text-muted-foreground">
                <motion.div
                  initial={{ scale: 0.95, opacity: 0.8 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 10 }}
                  whileHover={{ scale: 1.1 }}
                >
                  <Utensils className="mx-auto h-12 w-12" />
                </motion.div>
                <p className="mt-4">The menu for the week has not been set yet.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </AppLayout>
  );
}