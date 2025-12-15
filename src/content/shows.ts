import showsJson from "../../content/shows.json";
import { showSchema } from "@/content/schema";

export const shows = showSchema.array().parse(showsJson);
