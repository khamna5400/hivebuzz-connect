import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell } from "lucide-react";

const Notifications = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Notifications</h1>
          <p className="text-muted-foreground">Stay updated with your activity</p>
        </div>

        <Card className="text-center py-12 shadow-card">
          <CardContent>
            <Bell className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <CardTitle className="mb-2">No Notifications</CardTitle>
            <p className="text-muted-foreground">
              You're all caught up! Check back later for updates.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Notifications;
