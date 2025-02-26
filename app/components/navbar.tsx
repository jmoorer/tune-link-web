import { Link } from "@tanstack/react-router";
import React from "react";
import { Button } from "./ui/button";
import { AppUser } from "~/lib/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";

interface Props {
  user?: AppUser;
}
export const NavBar = ({ user }: Props) => {
  return (
    <div className="h-16 p-4 border border-b">
      <div className="flex justify-between items-center">
        <Link to="/">
          <span className="text-2xl font-bold">Tune Link</span>
        </Link>
        <div>
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger>
                <Avatar className="h-8 w-8 rounded-lg">
                  <AvatarImage src={user.avatar} alt={user.name} />
                  <AvatarFallback className="rounded-lg">
                    {user.name.slice(0, 2).toLocaleUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem>
                  <a href="/api/logout">Sign out</a>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild>
              <a href="/api/auth/spotify">Sign in </a>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
