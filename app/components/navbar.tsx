import { Link } from "@tanstack/react-router";
import React from "react";
import { Button } from "./ui/button";

export const NavBar = () => {
  return (
    <div className="h-16 p-4 border border-b">
      <div className="flex justify-between items-center">
        <Link to="/">
          <span className="text-2xl font-bold">Tune Link</span>
        </Link>
        <div>
          <Button>Sign in</Button>
        </div>
      </div>
    </div>
  );
};
