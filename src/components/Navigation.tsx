import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Home, Compass, Users, PenSquare, User, Bell, LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { toast } from "sonner";

export const Navigation = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SupabaseUser | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
    navigate("/");
  };

  return (
    <nav className="sticky top-0 z-50 border-b bg-card shadow-card">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-primary">
              <span className="text-xl font-bold text-primary-foreground">🐝</span>
            </div>
            <span className="text-xl font-bold">Hiver</span>
          </Link>

          <div className="flex items-center gap-6">
            {user ? (
              <>
                <Link to="/" className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <Home className="h-4 w-4" />
                  Home
                </Link>
                <Link to="/discover" className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <Compass className="h-4 w-4" />
                  Discover
                </Link>
                <Link to="/connections" className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <Users className="h-4 w-4" />
                  Connections
                </Link>
                <Link to="/feed" className="hidden md:flex items-center gap-2 text-sm font-medium hover:text-primary transition-colors">
                  <PenSquare className="h-4 w-4" />
                  Feed
                </Link>
                <Link to="/create-hive">
                  <Button size="sm" className="bg-primary text-primary-foreground hover:bg-primary/90">
                    Create
                  </Button>
                </Link>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="rounded-full">
                      <User className="h-5 w-5" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onClick={() => navigate("/profile")}>
                      <User className="mr-2 h-4 w-4" />
                      Profile
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/notifications")}>
                      <Bell className="mr-2 h-4 w-4" />
                      Notifications
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleSignOut}>
                      <LogOut className="mr-2 h-4 w-4" />
                      Sign Out
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <Link to="/auth">
                <Button className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Sign In
                </Button>
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};
