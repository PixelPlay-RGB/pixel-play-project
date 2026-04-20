import { Database } from "@/types/database.types";

type Tables<T extends keyof Database["public"]["Tables"]> = Database["public"]["Tables"][T]["Row"];

export type User = Tables<"user">;
