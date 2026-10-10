// Resolves Course.image (a file name without extension) to the photo in src/assets/media.
import type { ImageMetadata } from 'astro';

const files = import.meta.glob<{ default: ImageMetadata }>('../../assets/media/*.{jpg,jpeg,png,webp}', {
  eager: true,
});

export function courseImage(name: string): ImageMetadata {
  const hit = Object.entries(files).find(([path]) => path.split('/').pop()!.replace(/\.\w+$/, '') === name);
  if (!hit) throw new Error(`Course image "${name}" not found in src/assets/media`);
  return hit[1].default;
}
