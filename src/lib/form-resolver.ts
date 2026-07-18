import { zodResolver } from "@hookform/resolvers/zod";
import type { Resolver } from "react-hook-form";

/**
 * Schemas in this app lean on `z.coerce.number()`/`z.coerce.date()` so the
 * same schema validates both real API payloads (numbers) and anything a
 * defensive caller sends as a string. That makes Zod's *input* type diverge
 * from its *output* type, which trips up `useForm<Output>`'s resolver
 * generic even though the runtime behavior is exactly what we want (a form
 * field bound to a number input round-trips as a number). This cast keeps
 * that ergonomic without fighting the resolver's generic variance.
 */
export function typedZodResolver<TOutput extends Record<string, unknown>>(
  schema: Parameters<typeof zodResolver>[0],
): Resolver<TOutput> {
  return zodResolver(schema) as unknown as Resolver<TOutput>;
}
