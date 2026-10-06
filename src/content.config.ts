import { glob } from "astro/loaders";
import { float32, int, string, z } from "astro/zod";
import { defineCollection } from "astro:content";

const PhotoSchema = z.object({
  description: string(),
  src: string(),
  tags: z.array(z.string()),
  camera_settings: z.object({
    aperture: float32(),
    iso: int(),
    focal_length: int(),
  }),
});
const gallery = defineCollection({
  schema: ({ image }) =>
    z.object({
      description: string(),
      src: image(),
      tags: z.array(z.string()),
      camera_settings: z.object({
        camera: string(),
        aperture: float32(),
        iso: int(),
        focal_length: int(),
      }),
    }),
  loader: glob({ base: "./src/photos", pattern: "**/*.{md,mdx}" }),
});
export type Photo = z.infer<typeof PhotoSchema>;
export const collections = { gallery };
