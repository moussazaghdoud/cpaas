"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen flex flex-col items-center justify-center bg-[#09090b] text-white px-4">
        <h1 className="text-4xl font-bold mb-4">Something went wrong</h1>
        <p className="text-gray-400 mb-8 text-center max-w-md">
          An unexpected error occurred. Please try again.
        </p>
        <button
          onClick={() => reset()}
          className="px-6 py-3 text-sm font-medium bg-white text-black rounded-lg hover:bg-gray-200 transition-colors"
        >
          Try again
        </button>
      </body>
    </html>
  );
}
