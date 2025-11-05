import { useEffect, useState } from "react";
import { AppLayout } from "@/components/layout/AppLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { api } from "@/lib/api-client";
import type { WeeklyMenu } from "@shared/types";
import { toast } from "@/components/ui/sonner";
export function UpdateMenuPage() {
  const [menu, setMenu] = useState<WeeklyMenu | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        setLoading(true);
        const menuData = await api<WeeklyMenu>('/api/menu');
        setMenu(menuData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch menu.");
      } finally {
        setLoading(false);
      }
    };
    fetchMenu();
  }, []);
  const handleInputChange = (dayIndex: number, meal: 'breakfast' | 'lunch' | 'dinner', value: string) => {
    if (!menu) return;
    const newMenu = { ...menu };
    newMenu.days[dayIndex][meal] = value;
    setMenu(newMenu);
  };
  const handleSave = async () => {
    if (!menu) return;
    setSaving(true);
    try {
      await api('/api/menu', {
        method: 'PUT',
        body: JSON.stringify(menu),
      });
      toast.success("Menu updated successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save menu.");
    } finally {
      setSaving(false);
    }
  };
  return (
    <AppLayout container>
      <Card>
        <CardHeader>
          <CardTitle>Update Weekly Menu</CardTitle>
          <CardDescription>Set the meal plan for the week. Changes will be visible to all students immediately.</CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-96 w-full" />
          ) : error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : menu ? (
            <form className="space-y-6" onSubmit={(e) => { e.preventDefault(); handleSave(); }}>
              {menu.days.map((day, dayIndex) => (
                <div key={day.day} className="p-4 border rounded-md space-y-4">
                  <h3 className="font-semibold">{day.day}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor={`breakfast-${day.day}`}>Breakfast</Label>
                      <Input
                        id={`breakfast-${day.day}`}
                        value={day.breakfast}
                        onChange={(e) => handleInputChange(dayIndex, 'breakfast', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`lunch-${day.day}`}>Lunch</Label>
                      <Input
                        id={`lunch-${day.day}`}
                        value={day.lunch}
                        onChange={(e) => handleInputChange(dayIndex, 'lunch', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor={`dinner-${day.day}`}>Dinner</Label>
                      <Input
                        id={`dinner-${day.day}`}
                        value={day.dinner}
                        onChange={(e) => handleInputChange(dayIndex, 'dinner', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}
              <Button type="submit" disabled={saving} className="w-full">
                {saving ? "Saving..." : "Save Menu"}
              </Button>
            </form>
          ) : null}
        </CardContent>
      </Card>
    </AppLayout>
  );
}