import { createFileRoute } from "@tanstack/react-router";
import GenerationForm from "~/components/forms/generation-form";
import { Main } from "~/components/main";

export const Route = createFileRoute("/")({
  component: Home,
});

function Home() {
  return (
    <Main className=" py-10 space-y-4">
      <div className="w-full max-w-2xl space-y-4 mx-auto">
        <h3 className="text-center text-4xl font-bold">
          Create your perfect playlist
        </h3>
        <p className="text-center text-2xl text-muted-foreground font-bold">
          Create your perfect playlist
        </p>
        <GenerationForm />
      </div>
    </Main>
  );
}
