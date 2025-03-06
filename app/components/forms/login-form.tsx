import React from "react";
import { Button } from "../ui/button";
import { SpotifyIcon, YoutubeIcon } from "../icons";
const LoginForm = () => {
  return (
    <div className="flex flex-col gap-4 p-4">
      <Button variant="outline" asChild className="w-full">
        <a href={"/api/auth/spotify"}>
          <SpotifyIcon className="text-green-500" width={20} height={20} />
          Login with Spotify
        </a>
      </Button>
      <Button variant="outline" className="w-full" asChild>
        <a href={"/api/auth/youtube"}>
          <YoutubeIcon className="text-red-500" width={20} height={20} />
          Login with Youtube
        </a>
      </Button>
    </div>
  );
};

export default LoginForm;
