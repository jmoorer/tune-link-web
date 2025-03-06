import { Link } from "@tanstack/react-router";
import React from "react";
import { Button } from "./ui/button";
import { AppUser } from "~/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Logo, SpotifyIcon, YoutubeIcon } from "./icons";
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover";
import LoginForm from "./forms/login-form";
import { ProviderType } from "~/lib/types";
interface Props {
  user?: AppUser;
}

const UserTypeIcon = ({ provider }: { provider: ProviderType }) => {
  if (provider === "spotify") {
    return <SpotifyIcon className="text-green-500" width={20} height={20} />;
  }
  return <YoutubeIcon className="text-red-500" width={20} height={20} />;
};

const UserTypeLabel = ({ user }: { user: AppUser }) => {
  // const getProfileLink = () => {
  //   if (user.provider === "spotify") {
  //     return "https://open.spotify.com/user/" + user.providerId;
  //   }
  //   return "https://www.youtube.com/channel/" + user.providerId;
  // };
  return (
    <DropdownMenuLabel className="flex items-center gap-2">
      <UserTypeIcon provider={user.provider} />
      {user.name}
    </DropdownMenuLabel>
  );
};

export const NavBar = ({ user }: Props) => {
  return (
    <div className="h-16 p-4 border border-b">
      <div className="flex justify-between items-center">
        <Link to="/" className="flex items-center gap-2">
          <Logo className="w-8 h-8 text-primary" />
          <span className="text-2xl font-bold">Tune Link</span>
        </Link>
        <div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage
                    referrerPolicy="no-referrer"
                    src={user.avatar}
                    alt={user.name}
                  />
                  <AvatarFallback className="rounded-lg">
                    {user.name.slice(0, 2).toLocaleUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <UserTypeLabel user={user} />
                <DropdownMenuItem>
                  <a href="/api/logout">Sign out</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // <Button asChild>
            //   <a href="/api/auth/spotify">Sign in </a>
            // </Button>
            <Popover>
              <PopoverTrigger asChild>
                <Button>Sign in </Button>
              </PopoverTrigger>
              <PopoverContent>
                <LoginForm />
              </PopoverContent>
            </Popover>
          )}
        </div>
      </div>
    </div>
  );
};
