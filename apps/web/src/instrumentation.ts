export async function register() {
  // Seed content files to persistent volume on server startup
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const { seedContentVolume } = await import("./lib/content-seed");
    seedContentVolume();
  }
}
