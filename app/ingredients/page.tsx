"use client";

import { useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import { ChefHat, ImagePlus } from "lucide-react";
import EmptyState from "@/app/components/EmptyState";
import IngredientList from "@/app/components/IngredientList";
import ResultList from "@/app/components/ResultList";
import { ErrorPanel, ProcessingPanel } from "@/app/components/StatusPanel";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { fa } from "@/messages/fa";
import { useSession } from "@/lib/session";

/** Client-side ceiling so the user is never left waiting past 30s (SC-008). */
const CLIENT_TIMEOUT_MS = 30_000;

export default function IngredientsPage() {
  const {
    photos,
    ingredients,
    setIngredients,
    recipes,
    setRecipes,
    status,
    setStatus,
    errorCode,
    setErrorCode,
    analysed,
    setAnalysed,
  } = useSession();

  const inFlight = useRef(false);

  const callSuggest = useCallback(
    async (mode: "analyse" | "cook") => {
      if (inFlight.current) return;
      inFlight.current = true;

      setStatus("processing");
      setErrorCode(null);

      const body = new FormData();
      if (mode === "analyse") {
        for (const photo of photos) body.append("photos", photo.file, photo.file.name);
      }
      body.append("manualIngredients", JSON.stringify(ingredients));

      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), CLIENT_TIMEOUT_MS);

      try {
        const response = await fetch("/api/suggest", {
          method: "POST",
          body,
          signal: controller.signal,
        });
        const result = await response.json();

        if (result?.ok === true) {
          if (mode === "analyse") {
            // Populate the editable list; the corrected list drives the next call.
            setIngredients(result.ingredients.map((item: { name: string }) => item.name));
          }
          setRecipes(result.recipes);
          setStatus("done");
        } else {
          setStatus(mode === "analyse" ? "idle" : "error");
          setErrorCode(result?.code ?? "SERVICE_ERROR");
        }
      } catch (error) {
        const timedOut = error instanceof DOMException && error.name === "AbortError";
        setStatus("error");
        setErrorCode(timedOut ? "TIMEOUT" : "SERVICE_ERROR");
      } finally {
        clearTimeout(timer);
        inFlight.current = false;
      }
    },
    [photos, ingredients, setIngredients, setRecipes, setStatus, setErrorCode],
  );

  // Recognize on arrival when photos are pending.
  useEffect(() => {
    if (analysed || photos.length === 0) return;
    setAnalysed(true);
    void callSuggest("analyse");
    // callSuggest changes with every ingredient edit; this must run once per arrival.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysed, photos.length]);

  const busy = status === "processing";
  const analysing = busy && photos.length > 0 && ingredients.length === 0;
  const empty = ingredients.length === 0 && !busy;

  return (
    <main className="mx-auto max-w-4xl px-5 pb-20 pt-12">
      <h1 className="font-display text-3xl sm:text-4xl">{fa.ingredients.heading}</h1>
      <p className="mt-3 max-w-[52ch] text-mist">{fa.ingredients.subheading}</p>

      <Card className="mt-8 gap-0 rounded-2xl border-hairline bg-taaqche p-6 shadow-none">
        <h2 className="mb-5 font-display text-lg">{fa.ingredients.cardTitle}</h2>

        {analysing ? (
          <div className="space-y-4">
            <p className="text-sm text-mist">{fa.ingredients.analysing}</p>
            <div className="flex flex-wrap gap-2">
              {[6, 4, 7, 5, 6].map((width, index) => (
                <Skeleton
                  key={index}
                  className="h-8 rounded-full bg-taaqche-2"
                  style={{ width: `${width}rem` }}
                />
              ))}
            </div>
          </div>
        ) : empty ? (
          <EmptyState
            emoji="🫙"
            title={fa.ingredients.emptyTitle}
            body={fa.ingredients.emptyBody}
            action={
              <Button asChild size="lg" className="rounded-xl">
                <Link href="/">{fa.ingredients.emptyAction}</Link>
              </Button>
            }
          />
        ) : (
          <IngredientList />
        )}
      </Card>

      <div className="mt-6 grid gap-3">
        <Button
          size="lg"
          className="w-full gap-2 rounded-xl text-base"
          disabled={busy || ingredients.length === 0}
          onClick={() => callSuggest("cook")}
        >
          <ChefHat className="size-4.5" />
          {fa.ingredients.submit}
        </Button>
        <Button
          asChild
          size="lg"
          variant="outline"
          className="w-full gap-2 rounded-xl border-hairline text-base hover:border-nana"
        >
          <Link href="/">
            <ImagePlus className="size-4.5" />
            {fa.ingredients.addMorePhotos}
          </Link>
        </Button>
      </div>

      {busy && !analysing && <ProcessingPanel />}
      {!busy && errorCode && <ErrorPanel code={errorCode} />}
      {status === "done" && recipes.length > 0 && <ResultList recipes={recipes} />}
    </main>
  );
}
