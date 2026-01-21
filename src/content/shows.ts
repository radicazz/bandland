import { unstable_cache } from "next/cache";
import type { Show } from "@/content/schema";
import { readShows } from "@/lib/content-store";

export const getShows = unstable_cache(
  async (): Promise<Show[]> => {
    return readShows();
  },
  ["shows-data"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["shows"],
  },
);
