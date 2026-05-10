import { z } from "zod";

export const PositiveIntSchema = z.number().int().positive();

export const StringIntSchema = z.string().regex(/^\d+$/).transform(Number);

export type PositiveInt = z.infer<typeof PositiveIntSchema>;
