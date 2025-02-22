import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, Pen } from "lucide-react";
import { Main } from "~/components/main";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { GeneratedPlaylist } from "~/db/local";
import { usePlaylist } from "~/hooks/use-playlist";
import { unicodes } from "~/lib/unicodes";
import { cn, formatMediaDuration } from "~/lib/utils";

export const Route = createFileRoute("/p/$shortcode")({
  component: RouteComponent,
  // loader:({params})=>
});

const cardClass = cn(
  "border-0 shadow-none sm:border h-full overflow-hidden flex flex-col"
);
function RouteComponent() {
  const { shortcode } = Route.useParams();
  const playlist = usePlaylist(shortcode);
  if (!playlist) {
    return <>Not found</>;
  }
  const duration = playlist.tracks.reduce(
    (sum, track) => track.duration + sum,
    0
  );

  return (
    <Main className="px-0 sm:px-8 ">
      <Details playlist={playlist} />
    </Main>
  );
}

const Details = ({ playlist }: { playlist: GeneratedPlaylist }) => {
  const duration = playlist.tracks.reduce(
    (sum, track) => track.duration + sum,
    0
  );
  return (
    <Card className={cardClass}>
      <CardHeader className="sm:text-center relative">
        <CardTitle className="text-3xl">{playlist.title}</CardTitle>
        <CardDescription>
          <span>
            {`${formatMediaDuration(duration, "full")} ${unicodes.BULLET} ${playlist.tracks.length} tracks`}
          </span>
        </CardDescription>
        {/* <Button className="absolute top-6 right-6" variant="ghost">
          <Pen />
        </Button> */}
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden ">
        <div className="border  divide-y overflow-y-auto h-full rounded bg-red-600 ">
          {playlist.tracks.map((track) => (
            <div className="px-3 py-2 bg-background   flex items-center gap-2">
              <span className="w-6">{track.position}.</span>
              <div className="flex flex-col flex-1">
                <span>{track.title}</span>
                <span className="text-muted-foreground">{track.artist}</span>
              </div>
              <span className="text-muted-foreground">
                {formatMediaDuration(track.duration)}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
      <CardFooter>
        <Button>Export to Service</Button>
      </CardFooter>
    </Card>
  );
};
