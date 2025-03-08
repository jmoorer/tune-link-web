import { createFileRoute, Link } from "@tanstack/react-router";
import { Music2 } from "lucide-react";
import GenerationForm from "~/components/forms/generation-form";
import { Main } from "~/components/main";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { getRecentPlaylists } from "~/api/playlist";
import { formatDateRelative } from "~/lib/utils";

export const Route = createFileRoute("/")({
  component: Home,
  loader: async ({}) => getRecentPlaylists(),
});

function Home() {
  const recent = Route.useLoaderData();
  return (
    <Main className=" py-10 space-y-4">
      <div className="w-full max-w-2xl space-y-4 mx-auto">
        <h3 className="text-center text-4xl font-bold">
          Craft Your Signature Sound
        </h3>
        <p className="text-center text-2xl text-muted-foreground font-bold">
          Turn your music taste into the perfect playlist
        </p>
        <GenerationForm />
        {recent && recent?.length > 0 && (
          <>
            <div className=" mt-6">
              <span>Recently generated </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {recent?.map((pl) => (
                <Link
                  to={"/playlist/$shortcode"}
                  params={{ shortcode: pl.shortcode }}
                >
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Music2 />
                        {pl.title}
                      </CardTitle>
                      <CardDescription>
                        {formatDateRelative(pl.updatedAt)}
                      </CardDescription>
                    </CardHeader>
                  </Card>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </Main>
  );
}
