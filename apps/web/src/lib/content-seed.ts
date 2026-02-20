import * as fs from "fs";
import * as path from "path";
import { findBuildTimeContentDir } from "./content";

/**
 * Seed content from the build-time MDX directory into the persistent volume.
 * Only runs if CONTENT_VOLUME_PATH is set and the volume MDX dir is empty or missing.
 */
export function seedContentVolume(): void {
  const volumePath = process.env.CONTENT_VOLUME_PATH;
  if (!volumePath) return;

  const volumeMdxDir = path.join(volumePath, "content", "mdx");
  const volumeSearchDir = path.join(volumePath, "content", "search-index");

  // Skip if volume already has content
  if (fs.existsSync(volumeMdxDir)) {
    const existing = fs.readdirSync(volumeMdxDir).filter((f) => f.endsWith(".mdx"));
    if (existing.length > 0) {
      console.log(`[content-seed] Volume already has ${existing.length} MDX files, skipping seed.`);
      return;
    }
  }

  const buildDir = findBuildTimeContentDir();
  const buildMdxDir = path.join(buildDir, "mdx");

  if (!fs.existsSync(buildMdxDir)) {
    console.log("[content-seed] No build-time MDX directory found, skipping seed.");
    return;
  }

  // Create volume directories
  fs.mkdirSync(volumeMdxDir, { recursive: true });
  fs.mkdirSync(volumeSearchDir, { recursive: true });

  // Copy MDX files
  const files = fs.readdirSync(buildMdxDir).filter((f) => f.endsWith(".mdx"));
  for (const file of files) {
    fs.copyFileSync(path.join(buildMdxDir, file), path.join(volumeMdxDir, file));
  }

  // Copy search index if it exists
  const buildSearchDir = path.join(buildDir, "search-index");
  if (fs.existsSync(buildSearchDir)) {
    const searchFiles = fs.readdirSync(buildSearchDir);
    for (const file of searchFiles) {
      fs.copyFileSync(path.join(buildSearchDir, file), path.join(volumeSearchDir, file));
    }
  }

  console.log(`[content-seed] Seeded ${files.length} MDX files to volume.`);
}
