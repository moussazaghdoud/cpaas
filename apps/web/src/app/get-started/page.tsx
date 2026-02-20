"use client";

import { useState } from "react";
import Link from "next/link";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

type Goal = "messaging" | "video" | "bot" | "voice";
type Sdk = "node" | "web" | "android" | "ios" | "csharp" | "reactnative";

interface WizardState {
  step: number;
  goal: Goal | null;
  sdk: Sdk | null;
  appName: string;
  appCreated: boolean;
  appId: string;
  appSecret: string;
}

/* ------------------------------------------------------------------ */
/*  Data                                                               */
/* ------------------------------------------------------------------ */

const GOALS: { id: Goal; label: string; icon: string; desc: string }[] = [
  { id: "messaging", label: "Messaging & Chat", icon: "\u{1F4AC}", desc: "Instant messaging, group chats, file sharing" },
  { id: "video", label: "Video Conferencing", icon: "\u{1F4F9}", desc: "Video calls, screen sharing, recordings" },
  { id: "bot", label: "Bot & Automation", icon: "\u{1F916}", desc: "Chatbots, webhooks, workflow automation" },
  { id: "voice", label: "Voice & Telephony", icon: "\u{1F4DE}", desc: "Voice calls, PBX integration, call routing" },
];

const SDKS: { id: Sdk; name: string; lang: string; icon: string }[] = [
  { id: "node", name: "Node.js", lang: "JavaScript / TypeScript", icon: "\u{1F7E2}" },
  { id: "web", name: "Web SDK", lang: "JavaScript (Browser)", icon: "\u{1F310}" },
  { id: "android", name: "Android", lang: "Java / Kotlin", icon: "\u{1F4F1}" },
  { id: "ios", name: "iOS", lang: "Swift / Objective-C", icon: "\u{1F34F}" },
  { id: "csharp", name: "C# / .NET", lang: "C#", icon: "\u{1F7E3}" },
  { id: "reactnative", name: "React Native", lang: "JavaScript / TypeScript", icon: "\u{269B}\u{FE0F}" },
];

const SDK_INSTALL: Record<Sdk, string> = {
  node: "npm install rainbow-node-sdk",
  web: "npm install rainbow-web-sdk",
  android: 'implementation "com.ale.rainbow:rainbow-sdk-android:+"',
  ios: "pod 'RainbowSDK'",
  csharp: "dotnet add package Rainbow.CSharp.SDK",
  reactnative: "npm install rainbow-reactnative-sdk",
};

function getCodeSnippet(sdk: Sdk, appId: string, appSecret: string): string {
  const id = appId || "YOUR_APP_ID";
  const secret = appSecret || "YOUR_APP_SECRET";

  const snippets: Record<Sdk, string> = {
    node: `const RainbowSDK = require("rainbow-node-sdk");

const rainbowSDK = new RainbowSDK({
  rainbow: { host: "sandbox.openrainbow.com" },
  credentials: {
    login: "your-email@example.com",
    password: "your-password",
  },
  application: {
    appID: "${id}",
    appSecret: "${secret}",
  },
});

rainbowSDK.start().then(() => {
  console.log("Connected to Rainbow!");
});`,
    web: `import rainbowSDK from "rainbow-web-sdk";

rainbowSDK.start();
rainbowSDK.load();

document.addEventListener(rainbowSDK.RAINBOW_ONLOADED, () => {
  rainbowSDK.initialize("${id}", "${secret}")
    .then(() => console.log("Rainbow SDK initialized!"));
});`,
    android: `Rainbow rainbow = Rainbow.instance();
Application app = getApplication();

rainbow.initialize(app,
  "${id}",
  "${secret}",
  "sandbox.openrainbow.com");

rainbow.connection().signin("email@example.com", "password",
  new ISigninCallback() {
    public void onSigninSucceeded() {
      Log.d("Rainbow", "Connected!");
    }
  });`,
    ios: `import RainbowSDK

let rainbow = ServicesManager.sharedInstance()
rainbow.setAppID("${id}",
                  secretKey: "${secret}")

rainbow.loginManager().connect(
  "email@example.com",
  password: "password") { error in
    if error == nil {
      print("Connected to Rainbow!")
    }
}`,
    csharp: `using Rainbow;

var app = new Application();
app.SetApplicationInfo("${id}", "${secret}");
app.SetHostInfo("sandbox.openrainbow.com");

app.Login("email@example.com", "password", callback => {
  if (callback.Result.Success)
    Console.WriteLine("Connected to Rainbow!");
});`,
    reactnative: `import { RainbowSDK } from "rainbow-reactnative-sdk";

const rainbow = new RainbowSDK();

await rainbow.initialize({
  appId: "${id}",
  appSecret: "${secret}",
  host: "sandbox.openrainbow.com",
});

await rainbow.connection.signin("email@example.com", "password");
console.log("Connected to Rainbow!");`,
  };

  return snippets[sdk];
}

function getRecommendedGuides(goal: Goal | null, sdk: Sdk | null) {
  const guides: { label: string; href: string }[] = [];

  if (sdk) {
    guides.push({ label: `${SDKS.find((s) => s.id === sdk)?.name} SDK Docs`, href: `/docs/sdk/${sdk}` });
  }

  if (goal === "messaging") {
    guides.push({ label: "Messaging Guide", href: "/docs/guides" });
    guides.push({ label: "Chat API Reference", href: "/api-reference" });
  } else if (goal === "video") {
    guides.push({ label: "WebRTC & Video Guide", href: "/docs/guides" });
    guides.push({ label: "Conference API Reference", href: "/api-reference" });
  } else if (goal === "bot") {
    guides.push({ label: "Bot Framework Guide", href: "/docs/guides" });
    guides.push({ label: "Webhooks & Events", href: "/api-reference" });
  } else if (goal === "voice") {
    guides.push({ label: "Telephony Guide", href: "/docs/guides" });
    guides.push({ label: "Voice API Reference", href: "/api-reference" });
  }

  guides.push({ label: "Deploy to Production", href: "/docs/hub/get-ready-for-production" });
  guides.push({ label: "Platform Best Practices", href: "/docs/hub/best-practices" });

  return guides;
}

/* ------------------------------------------------------------------ */
/*  Wizard Component                                                   */
/* ------------------------------------------------------------------ */

const TOTAL_STEPS = 5;

export default function GetStartedPage() {
  const [state, setState] = useState<WizardState>({
    step: 1,
    goal: null,
    sdk: null,
    appName: "",
    appCreated: false,
    appId: "",
    appSecret: "",
  });
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState<string | null>(null);

  function next() {
    setState((s) => ({ ...s, step: Math.min(s.step + 1, TOTAL_STEPS) }));
  }
  function prev() {
    setState((s) => ({ ...s, step: Math.max(s.step - 1, 1) }));
  }

  async function createApp() {
    if (!state.appName.trim()) {
      setError("Please enter an application name");
      return;
    }
    setError("");
    setCreating(true);
    try {
      const res = await fetch("/api/rainbow/applications", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ name: state.appName, env: "sandbox" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Failed to create application");
      }
      const data = await res.json();
      setState((s) => ({
        ...s,
        appCreated: true,
        appId: data.id || data.appId || "",
        appSecret: data.appSecret || data.secretKey || "",
      }));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create application");
    } finally {
      setCreating(false);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    setCopied(label);
    setTimeout(() => setCopied(null), 2000);
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col">
      {/* Progress bar */}
      <div className="border-b border-border bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-4">
          <div className="flex items-center justify-between mb-3">
            <h1 className="text-lg font-bold">Get Started with Rainbow</h1>
            <Link href="/docs" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
              Skip setup
            </Link>
          </div>
          <div className="flex gap-2">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  i + 1 <= state.step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>Step {state.step} of {TOTAL_STEPS}</span>
            <span>{["Your Goal", "Choose SDK", "Create App", "First API Call", "What's Next"][state.step - 1]}</span>
          </div>
        </div>
      </div>

      {/* Step content */}
      <div className="flex-1 flex items-start justify-center pt-8 sm:pt-12 pb-24 px-4">
        <div className="w-full max-w-3xl">

          {/* ---- Step 1: Pick Your Goal ---- */}
          {state.step === 1 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">What do you want to build?</h2>
                <p className="text-muted-foreground">Pick your main use case. This helps us personalize your setup.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {GOALS.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setState((s) => ({ ...s, goal: g.id }))}
                    className={`flex items-start gap-4 rounded-xl border p-5 text-left transition-all ${
                      state.goal === g.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-2xl mt-0.5">{g.icon}</span>
                    <div>
                      <div className="font-semibold">{g.label}</div>
                      <div className="text-sm text-muted-foreground mt-0.5">{g.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ---- Step 2: Choose SDK ---- */}
          {state.step === 2 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Choose your SDK</h2>
                <p className="text-muted-foreground">Which platform are you developing for?</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {SDKS.map((s) => (
                  <button
                    key={s.id}
                    onClick={() => setState((prev) => ({ ...prev, sdk: s.id }))}
                    className={`flex items-center gap-3 rounded-xl border p-4 text-left transition-all ${
                      state.sdk === s.id
                        ? "border-primary bg-primary/5 ring-1 ring-primary"
                        : "border-border bg-card hover:border-muted-foreground/30 hover:bg-muted/30"
                    }`}
                  >
                    <span className="text-xl">{s.icon}</span>
                    <div>
                      <div className="font-semibold text-sm">{s.name}</div>
                      <div className="text-xs text-muted-foreground">{s.lang}</div>
                    </div>
                  </button>
                ))}
              </div>
              {state.sdk && (
                <div className="rounded-lg border border-border bg-muted/30 p-4">
                  <div className="text-xs text-muted-foreground mb-2">Install command</div>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-sm font-mono bg-background rounded px-3 py-2 border border-border">
                      {SDK_INSTALL[state.sdk]}
                    </code>
                    <button
                      onClick={() => copyToClipboard(SDK_INSTALL[state.sdk!], "install")}
                      className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted transition-colors"
                    >
                      {copied === "install" ? "Copied!" : "Copy"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- Step 3: Create App ---- */}
          {state.step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Create your first application</h2>
                <p className="text-muted-foreground">
                  This registers your app with Rainbow and gives you API credentials.
                </p>
              </div>

              {!state.appCreated ? (
                <div className="rounded-xl border border-border bg-card p-6 space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="appName" className="block text-sm font-medium">Application name</label>
                    <input
                      id="appName"
                      type="text"
                      value={state.appName}
                      onChange={(e) => setState((s) => ({ ...s, appName: e.target.value }))}
                      placeholder="My First Rainbow App"
                      className="w-full rounded-lg border border-border bg-muted px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="rounded-lg bg-muted/50 border border-border px-4 py-3 text-sm text-muted-foreground">
                    <span className="font-medium text-foreground">Environment:</span> Sandbox (free for development and testing)
                  </div>
                  {error && (
                    <div className="rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                      {error}
                    </div>
                  )}
                  <button
                    onClick={createApp}
                    disabled={creating}
                    className="w-full rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
                  >
                    {creating ? "Creating..." : "Create Application"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-green-500/30 bg-green-500/5 p-6 space-y-4">
                    <div className="flex items-center gap-2 text-green-400 font-semibold">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      Application created successfully!
                    </div>

                    <div className="space-y-3">
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">Application ID</div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm font-mono bg-background rounded px-3 py-2 border border-border break-all">
                            {state.appId}
                          </code>
                          <button
                            onClick={() => copyToClipboard(state.appId, "appId")}
                            className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted transition-colors"
                          >
                            {copied === "appId" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground mb-1">App Secret</div>
                        <div className="flex items-center gap-2">
                          <code className="flex-1 text-sm font-mono bg-background rounded px-3 py-2 border border-border break-all">
                            {state.appSecret}
                          </code>
                          <button
                            onClick={() => copyToClipboard(state.appSecret, "appSecret")}
                            className="shrink-0 rounded-lg border border-border bg-background px-3 py-2 text-xs hover:bg-muted transition-colors"
                          >
                            {copied === "appSecret" ? "Copied!" : "Copy"}
                          </button>
                        </div>
                      </div>
                    </div>

                    <div className="text-xs text-muted-foreground border-t border-green-500/20 pt-3">
                      Save these credentials securely. You&apos;ll need them to connect your app to Rainbow.
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ---- Step 4: First API Call ---- */}
          {state.step === 4 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">Make your first API call</h2>
                <p className="text-muted-foreground">
                  Copy this code into your project to connect to Rainbow.
                  {!state.sdk && " Go back to Step 2 to pick an SDK first."}
                </p>
              </div>

              {state.sdk ? (
                <div className="space-y-4">
                  <div className="rounded-xl border border-border bg-card overflow-hidden">
                    <div className="flex items-center justify-between px-4 py-2.5 border-b border-border bg-muted/50">
                      <span className="text-xs font-medium text-muted-foreground">
                        {SDKS.find((s) => s.id === state.sdk)?.name} — Quick Start
                      </span>
                      <button
                        onClick={() => copyToClipboard(getCodeSnippet(state.sdk!, state.appId, state.appSecret), "code")}
                        className="rounded border border-border bg-background px-2.5 py-1 text-xs hover:bg-muted transition-colors"
                      >
                        {copied === "code" ? "Copied!" : "Copy code"}
                      </button>
                    </div>
                    <pre className="p-4 overflow-x-auto text-sm leading-relaxed">
                      <code>{getCodeSnippet(state.sdk, state.appId, state.appSecret)}</code>
                    </pre>
                  </div>

                  <div className="rounded-lg border border-border bg-muted/30 p-4 space-y-2">
                    <div className="text-sm font-medium">Before running:</div>
                    <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                      <li>Replace <code className="text-foreground">email</code> and <code className="text-foreground">password</code> with your Rainbow credentials</li>
                      <li>Make sure you&apos;ve installed the SDK ({SDK_INSTALL[state.sdk]})</li>
                      <li>Run the code — you should see &quot;Connected to Rainbow!&quot;</li>
                    </ol>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl border border-border bg-card p-8 text-center text-muted-foreground">
                  <p className="mb-3">No SDK selected yet.</p>
                  <button onClick={() => setState((s) => ({ ...s, step: 2 }))} className="text-primary hover:underline text-sm">
                    Go back and choose an SDK
                  </button>
                </div>
              )}
            </div>
          )}

          {/* ---- Step 5: What's Next ---- */}
          {state.step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl sm:text-3xl font-bold tracking-tight mb-2">You&apos;re all set!</h2>
                <p className="text-muted-foreground">
                  Here&apos;s what we recommend based on your choices.
                </p>
              </div>

              {/* Recap */}
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <div className="text-sm font-medium mb-2">Your setup</div>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-sm">
                  <div className="rounded-lg bg-muted/50 px-4 py-3 border border-border">
                    <div className="text-xs text-muted-foreground">Goal</div>
                    <div className="font-medium mt-0.5">{GOALS.find((g) => g.id === state.goal)?.label || "Not selected"}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-4 py-3 border border-border">
                    <div className="text-xs text-muted-foreground">SDK</div>
                    <div className="font-medium mt-0.5">{SDKS.find((s) => s.id === state.sdk)?.name || "Not selected"}</div>
                  </div>
                  <div className="rounded-lg bg-muted/50 px-4 py-3 border border-border">
                    <div className="text-xs text-muted-foreground">Application</div>
                    <div className="font-medium mt-0.5">{state.appName || "Not created"}</div>
                  </div>
                </div>
              </div>

              {/* Recommended resources */}
              <div className="space-y-3">
                <div className="text-sm font-medium">Recommended next steps</div>
                <div className="grid gap-2">
                  {getRecommendedGuides(state.goal, state.sdk).map((guide) => (
                    <Link
                      key={guide.href}
                      href={guide.href}
                      className="flex items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm hover:bg-muted/50 transition-colors group"
                    >
                      <span className="group-hover:text-primary transition-colors">{guide.label}</span>
                      <span className="text-muted-foreground text-xs">&rarr;</span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* CTAs */}
              <div className="flex flex-col sm:flex-row gap-3 pt-2">
                <Link
                  href="/portal/dashboard"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 text-sm font-medium bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Go to Dashboard
                </Link>
                <Link
                  href="/docs"
                  className="flex-1 inline-flex items-center justify-center px-6 py-3 text-sm font-medium border border-border text-foreground rounded-lg hover:bg-muted transition-colors"
                >
                  Browse Documentation
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Bottom navigation */}
      <div className="fixed bottom-0 inset-x-0 border-t border-border bg-background/95 backdrop-blur-xl">
        <div className="mx-auto max-w-3xl px-4 py-4 flex items-center justify-between">
          <button
            onClick={prev}
            disabled={state.step === 1}
            className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          >
            Back
          </button>

          <div className="flex gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <button
                key={i}
                onClick={() => setState((s) => ({ ...s, step: i + 1 }))}
                className={`h-2 w-2 rounded-full transition-colors ${
                  i + 1 === state.step ? "bg-primary" : "bg-muted hover:bg-muted-foreground/40"
                }`}
              />
            ))}
          </div>

          {state.step < TOTAL_STEPS ? (
            <button
              onClick={next}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Continue
            </button>
          ) : (
            <Link
              href="/portal/dashboard"
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              Go to Dashboard
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
