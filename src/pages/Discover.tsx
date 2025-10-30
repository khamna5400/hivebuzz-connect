import { Navigation } from "@/components/Navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Compass } from "lucide-react";

const Discover = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">Discover</h1>
          <p className="text-muted-foreground">Find people and events near you</p>
        </div>

        <Card className="text-center py-12 shadow-card">
          <CardContent>
            <Compass className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
            <CardTitle className="mb-2">Discovery Coming Soon</CardTitle>
            <p className="text-muted-foreground">
              We're working on location-based discovery to help you connect with people nearby.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Discover;
