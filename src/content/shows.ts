import { unstable_cache } from "next/cache";
import showsJson from "../../content/shows.json";
import { showSchema, type Show } from "@/content/schema";

export const getShows = unstable_cache(
  async (): Promise<Show[]> => {
    return showSchema.array().parse(showsJson);
  },
  ["shows-data"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["shows"],
  },
);
