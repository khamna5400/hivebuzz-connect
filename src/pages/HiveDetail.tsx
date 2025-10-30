import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Navigation } from "@/components/Navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Calendar, MapPin, Users, Clock, ExternalLink, Share2 } from "lucide-react";
import { format } from "date-fns";

interface Hive {
  id: string;
  name: string;
  description: string;
  location: string;
  date: string;
  category: string;
  visibility: string;
  cover_image_url: string | null;
  external_link: string | null;
  recurring: string;
  host_id: string;
  profiles: {
    username: string;
  };
}

const HiveDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [hive, setHive] = useState<Hive | null>(null);
  const [loading, setLoading] = useState(true);
  const [attendeeCount, setAttendeeCount] = useState(0);
  const [userStatus, setUserStatus] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
    fetchHive();
  }, [id]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      setUserId(session.user.id);
      checkUserRSVP(session.user.id);
    }
  };

  const fetchHive = async () => {
    const { data, error } = await supabase
      .from("hives")
      .select("*, profiles(username)")
      .eq("id", id)
      .single();

    if (error || !data) {
      toast.error("Hive not found");
      navigate("/");
      return;
    }

    setHive(data);
    fetchAttendeeCount();
    setLoading(false);
  };

  const fetchAttendeeCount = async () => {
    const { count } = await supabase
      .from("hive_attendees")
      .select("*", { count: "exact", head: true })
      .eq("hive_id", id)
      .eq("status", "going");

    setAttendeeCount(count || 0);
  };

  const checkUserRSVP = async (uid: string) => {
    const { data } = await supabase
      .from("hive_attendees")
      .select("status")
      .eq("hive_id", id)
      .eq("user_id", uid)
      .single();

    if (data) {
      setUserStatus(data.status);
    }
  };

  const handleRSVP = async (status: string) => {
    if (!userId) {
      toast.error("Please sign in to RSVP");
      navigate("/auth");
      return;
    }

    if (userStatus) {
      const { error } = await supabase
        .from("hive_attendees")
        .update({ status })
        .eq("hive_id", id)
        .eq("user_id", userId);

      if (error) {
        toast.error("Failed to update RSVP");
        return;
      }
    } else {
      const { error } = await supabase.from("hive_attendees").insert({
        hive_id: id,
        user_id: userId,
        status,
      });

      if (error) {
        toast.error("Failed to RSVP");
        return;
      }
    }

    setUserStatus(status);
    fetchAttendeeCount();
    toast.success("RSVP updated!");
  };

  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: hive?.name,
        text: hive?.description,
        url: window.location.href,
      });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navigation />
        <div className="container mx-auto px-4 py-8">
          <Card className="animate-pulse">
            <div className="h-64 bg-muted rounded-t-lg" />
            <CardHeader>
              <div className="h-8 bg-muted rounded w-1/2" />
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  if (!hive) return null;

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="overflow-hidden shadow-hover">
          {hive.cover_image_url ? (
            <img
              src={hive.cover_image_url}
              alt={hive.name}
              className="h-64 w-full object-cover"
            />
          ) : (
            <div className="h-64 bg-gradient-primary flex items-center justify-center">
              <span className="text-8xl">🐝</span>
            </div>
          )}

          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="secondary">{hive.category}</Badge>
                  <Badge variant="outline">{hive.visibility}</Badge>
                  {hive.recurring !== "one-time" && (
                    <Badge variant="outline">{hive.recurring}</Badge>
                  )}
                </div>
                <CardTitle className="text-3xl mb-2">{hive.name}</CardTitle>
                <p className="text-muted-foreground">
                  Hosted by <Link to={`/profile/${hive.host_id}`} className="font-medium hover:text-primary">{hive.profiles.username}</Link>
                </p>
              </div>
              <Button variant="outline" size="icon" onClick={handleShare}>
                <Share2 className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="flex items-center gap-3">
                <Calendar className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{format(new Date(hive.date), "PPPP")}</p>
                  <p className="text-sm text-muted-foreground">
                    <Clock className="inline h-3 w-3 mr-1" />
                    {format(new Date(hive.date), "p")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{hive.location}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">{attendeeCount} attending</p>
                </div>
              </div>

              {hive.external_link && (
                <a
                  href={hive.external_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 hover:text-primary transition-colors"
                >
                  <ExternalLink className="h-5 w-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium">External Link</p>
                  </div>
                </a>
              )}
            </div>

            <div>
              <h3 className="font-semibold mb-2 text-lg">About this Hive</h3>
              <p className="text-muted-foreground whitespace-pre-wrap">{hive.description}</p>
            </div>

            {userId && (
              <div className="flex flex-wrap gap-4 pt-4 border-t">
                <Button
                  onClick={() => handleRSVP("going")}
                  variant={userStatus === "going" ? "default" : "outline"}
                  className={userStatus === "going" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                >
                  Going
                </Button>
                <Button
                  onClick={() => handleRSVP("interested")}
                  variant={userStatus === "interested" ? "default" : "outline"}
                  className={userStatus === "interested" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                >
                  Interested
                </Button>
                <Button
                  onClick={() => handleRSVP("not_going")}
                  variant={userStatus === "not_going" ? "default" : "outline"}
                  className={userStatus === "not_going" ? "bg-primary text-primary-foreground hover:bg-primary/90" : ""}
                >
                  Can't Go
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default HiveDetail;
