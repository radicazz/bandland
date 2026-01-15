import { unstable_cache } from "next/cache";
import merchJson from "../../content/merch.json";
import { merchItemSchema, type MerchItem } from "@/content/schema";

export const getMerchItems = unstable_cache(
  async (): Promise<MerchItem[]> => {
    return merchItemSchema.array().parse(merchJson);
  },
  ["merch-data"],
  {
    revalidate: 3600, // Cache for 1 hour
    tags: ["merch"],
  },
);
