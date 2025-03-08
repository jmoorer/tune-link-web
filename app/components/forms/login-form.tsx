import React, { useEffect } from "react";
import { Button } from "../ui/button";
import { AppleIcon, SpotifyIcon, YoutubeIcon } from "../icons";
import { useQuery } from "@tanstack/react-query";
import { appleMusicTokenQuery } from "~/lib/queries";
import { loginWithApple } from "~/api/auth";
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
      <AppleLoginForm />
    </div>
  );
};

const AppleLoginForm = () => {
  const { data: developerToken } = useQuery(appleMusicTokenQuery);
  const handleAuthorize = async () => {
    console.log("developerToken", MusicKit);
    const music = MusicKit.getInstance();
    await music.authorize();
    const userToken = music.musicUserToken;
    // await music.unauthorize();
    // console.log("userToken", userToken, "music.api", music.api);

    if (!userToken) return;

    const formData = new FormData();
    formData.append("userToken", userToken);
    const form = document.createElement("form");
    form.method = "POST";
    form.action = "/api/auth/apple/callback";
    form.encoding = "application/json";

    const tokenInput = document.createElement("input");
    tokenInput.type = "hidden";
    tokenInput.name = "userToken";
    tokenInput.value = userToken;
    form.appendChild(tokenInput);

    document.body.appendChild(form);
    form.submit();
  };
  useEffect(() => {
    if (!developerToken) return;
    MusicKit.configure({
      developerToken: developerToken,
      app: {
        name: "Tidal Playlist Sync",
      },
    });
  }, [developerToken]);
  return (
    <Button
      variant="apple"
      disabled={!developerToken}
      className="w-full"
      onClick={handleAuthorize}
    >
      <AppleIcon width={20} height={20} />
      Login with Apple
    </Button>
  );
};

export default LoginForm;
