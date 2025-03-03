import React from "react";
import { Button } from "../ui/button";
import { MdiAccountBox, SpotifyIcon } from "../icons";
const LoginForm = () => {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="outline" asChild className="w-full">
        <a href={"/api/auth/spotify"}>
          <SpotifyIcon width={20} height={20} />
          Login with Spotify
        </a>
      </Button>
      <Button variant="outline" className="w-full">
        <MdiAccountBox className="w-20 h-20" />
        Login with Youtube
      </Button>
    </div>
  );
};

export default LoginForm;
