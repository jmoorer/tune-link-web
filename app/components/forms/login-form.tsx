import React from "react";
import { Button } from "../ui/button";
import { SpotifyIcon, YoutubeIcon } from "../icons";
const LoginForm = () => {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="spotify" className="w-full" asChild>
        <a href={"/api/auth/spotify"}>
          <SpotifyIcon width={50} height={50} />
          Login with Spotify
        </a>
      </Button>
      <Button variant="youtube" className="w-full" asChild>
        <a href={"/api/auth/youtube"}>
          <YoutubeIcon width={20} height={20} />
          Login with Youtube
        </a>
      </Button>
    </div>
  );
};

export default LoginForm;
