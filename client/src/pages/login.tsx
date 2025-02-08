import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { login } from "@/lib/auth";
import { SiAnilist } from "react-icons/si";

export default function Login() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-background">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Welcome to Anime Tracker</CardTitle>
          <CardDescription>
            Connect with your Anilist account to manage your anime watchlist
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full py-6 text-lg"
            onClick={() => login()}
          >
            <SiAnilist className="mr-2 h-5 w-5" />
            Continue with Anilist
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
