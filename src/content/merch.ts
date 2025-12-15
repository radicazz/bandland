import merchJson from "../../content/merch.json";
import { merchItemSchema } from "@/content/schema";

export const merchItems = merchItemSchema.array().parse(merchJson);
