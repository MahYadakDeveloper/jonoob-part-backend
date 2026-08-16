import { z } from 'zod';

export const CitySourceSchema = z.object({
  id: z.number(),
  name: z.string(),
});

export const LocationSourceSchema = z.array(
  z.object({
    id: z.number(),
    name: z.string(),
    cities: z.array(CitySourceSchema),
  }),
);

export type LocationSource = z.infer<typeof LocationSourceSchema>;
