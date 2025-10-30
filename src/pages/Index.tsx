import { useEffect, useState } from "react";
import { Navigation } from "@/components/Navigation";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { format } from "date-fns";

interface Hive {
  id: string;
  name: string;
  description: string;
  location: string;
  date: string;
  category: string;
  cover_image_url: string | null;
  profiles: {
    username: string;
  };
}

interface Buzz {
  id: string;
  description: string;
  location: string | null;
  created_at: string;
  profiles: {
    username: string;
  };
}

const Index = () => {
  const [hives, setHives] = useState<Hive[]>([]);
  const [buzz, setBuzz] = useState<Buzz[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPublicContent();
  }, []);

  const fetchPublicContent = async () => {
    const { data: hivesData } = await supabase
      .from("hives")
      .select("*, profiles(username)")
      .eq("visibility", "public")
      .order("date", { ascending: true })
      .limit(6);

    const { data: buzzData } = await supabase
      .from("buzz")
      .select("*, profiles(username)")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .limit(6);

    if (hivesData) setHives(hivesData);
    if (buzzData) setBuzz(buzzData);
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Hero Section */}
      <section className="bg-gradient-hero py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-primary shadow-hover">
            <span className="text-4xl">🐝</span>
          </div>
          <h1 className="mb-4 text-4xl font-bold md:text-5xl">Welcome to Hiver</h1>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-muted-foreground">
            Create hives, share buzz, and connect with amazing people in your community
          </p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link to="/auth">
              <Button size="lg" className="bg-primary text-primary-foreground hover:bg-primary/90">
                Get Started
              </Button>
            </Link>
            <Link to="/discover">
              <Button size="lg" variant="outline">
                Explore Events
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 py-12">
        {/* Hives Section */}
        <section className="mb-12">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Upcoming Hives</h2>
              <p className="text-muted-foreground">Join exciting events in your area</p>
            </div>
            <Link to="/discover">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <div className="h-48 bg-muted rounded-t-lg" />
                  <CardHeader>
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2 mt-2" />
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : hives.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No hives yet. Be the first to create one!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {hives.map((hive) => (
                <Link key={hive.id} to={`/hive/${hive.id}`}>
                  <Card className="overflow-hidden transition-all hover:shadow-hover cursor-pointer h-full">
                    {hive.cover_image_url ? (
                      <img
                        src={hive.cover_image_url}
                        alt={hive.name}
                        className="h-48 w-full object-cover"
                      />
                    ) : (
                      <div className="h-48 bg-gradient-primary flex items-center justify-center">
                        <span className="text-6xl">🐝</span>
                      </div>
                    )}
                    <CardHeader>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant="secondary">{hive.category}</Badge>
                      </div>
                      <CardTitle className="line-clamp-1">{hive.name}</CardTitle>
                      <CardDescription className="line-clamp-2">
                        {hive.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" />
                        {format(new Date(hive.date), "PPP")}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        {hive.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Users className="h-4 w-4" />
                        Hosted by {hive.profiles.username}
                      </div>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Buzz Feed Section */}
        <section>
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold">Latest Buzz</h2>
              <p className="text-muted-foreground">See what's happening in the community</p>
            </div>
            <Link to="/feed">
              <Button variant="outline">View All</Button>
            </Link>
          </div>

          {buzz.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <p className="text-muted-foreground">No buzz yet. Start sharing!</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {buzz.map((item) => (
                <Card key={item.id} className="shadow-card hover:shadow-hover transition-all">
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 rounded-full bg-gradient-primary flex items-center justify-center text-sm">
                        {item.profiles.username[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-medium">{item.profiles.username}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {format(new Date(item.created_at), "PPp")}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm">{item.description}</p>
                    {item.location && (
                      <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                        <MapPin className="h-3 w-3" />
                        {item.location}
                      </p>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
};

export default Index;
