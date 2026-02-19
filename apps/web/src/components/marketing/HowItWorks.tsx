import Link from "next/link";

const STEPS = [
  {
    step: "01",
    title: "Create your application",
    description:
      "Register on the Rainbow developer hub to create your application and get your credentials.",
  },
  {
    step: "02",
    title: "Get your API keys",
    description:
      "Obtain your App ID and App Secret to authenticate API requests and SDK connections.",
  },
  {
    step: "03",
    title: "Start building",
    description:
      "Use the REST APIs or pick an SDK (Node.js, Web, Android, iOS, C#) to integrate Rainbow into your app.",
  },
];

export function HowItWorks() {
  return (
    <section className="py-20 sm:py-28 border-t border-border">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-14">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Get started in minutes
          </h2>
          <p className="text-muted-foreground text-lg max-w-xl mx-auto">
            Three simple steps to add communications to your application.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {STEPS.map((step, i) => (
            <div key={step.step} className="relative text-center md:text-left">
              {/* Connector line */}
              {i < STEPS.length - 1 && (
                <div className="hidden md:block absolute top-6 left-[calc(50%+40px)] right-[calc(-50%+40px)] h-px bg-border" />
              )}
              <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-accent/10 text-accent font-bold text-sm mb-4 mx-auto md:mx-0">
                {step.step}
              </div>
              <h3 className="text-lg font-semibold mb-2">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                {step.description}
              </p>
            </div>
          ))}
        </div>

        <div className="mt-12 text-center">
          <Link
            href="/docs/getting-started"
            className="inline-flex items-center px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Follow the quickstart guide
            <svg className="ml-2 h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}
