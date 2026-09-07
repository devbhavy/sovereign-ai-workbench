import { Squiggle } from "@/components/workbench/squiggle";

/**
 * The three capabilities map exactly to the tools registered in
 * backend/app/agent/graph.py: file_reader_tool, vision, document_generator.
 */
const CAPABILITIES = ["read your documents", "look at images", "write a .docx"];

/**
 * The hero, after zerith.studio: an oversized lowercase serif wordmark with a
 * trailing period and a marker squiggle under it, a small sans tagline, and a
 * lot of air. Nothing else competes with the type.
 */
export function EmptyState() {
  return (
    <div className="rise-in flex w-full flex-col items-start">
      <h1 className="display relative inline-block pb-6 text-foreground">
        sovereign.
        <Squiggle className="absolute right-1 bottom-0 h-auto w-[54%]" />
      </h1>

      <p className="mt-6 max-w-lg text-[0.9375rem] leading-relaxed text-muted-foreground">
        a local ai agent that reads your files, looks at your images, and writes
        the document for you — all on your own machine
      </p>

      <ul className="mt-8 flex flex-wrap items-center gap-x-2.5 gap-y-2">
        {CAPABILITIES.map((capability) => (
          <li
            key={capability}
            className="rounded-full border bg-card px-3.5 py-1.5 text-xs text-muted-foreground shadow-card"
          >
            {capability}
          </li>
        ))}
      </ul>
    </div>
  );
}
