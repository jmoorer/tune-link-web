import { createFileRoute } from "@tanstack/react-router";
import GenerationForm from "~/components/forms/generation-form";
import { Textarea } from "~/components/ui/textarea";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <div className="container mx-auto py-10 space-y-4 px-4 overflow-auto ">
      <div className="w-full max-w-2xl space-y-4 mx-auto">
        <h3 className="text-center text-4xl font-bold">
          Create your perfect playlist
        </h3>
        <p className="text-center text-2xl text-muted-foreground font-bold">
          Create your perfect playlist
        </p>
        <GenerationForm />
      </div>
    </div>
  );
}
