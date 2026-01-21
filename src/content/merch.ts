import { unstable_cache } from "next/cache";
import type { MerchItem } from "@/content/schema";
import { readMerch } from "@/lib/content-store";

export const getMerchItems = unstable_cache(
  async (): Promise<MerchItem[]> => {
    return readMerch();
  },
  ["merch-data"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["merch"],
  },
);
