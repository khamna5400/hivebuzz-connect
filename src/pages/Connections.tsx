import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users } from "lucide-react";

const Connections = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Connections</h1>
          <p className="text-muted-foreground">Manage your network</p>
        </div>

        <Card className="text-center py-12 shadow-card">
          <CardContent>
            <Users className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <CardTitle className="mb-2">Connections Coming Soon</CardTitle>
            <p className="text-muted-foreground">
              Soon you'll be able to send connection requests and build your network.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Connections;
