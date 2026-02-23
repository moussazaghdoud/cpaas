"use client";

import { useState, useEffect, useCallback, Suspense, Component, type ReactNode } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/*  Error boundary — catches client crashes and shows the error       */
/* ------------------------------------------------------------------ */
interface EBProps { children: ReactNode }
interface EBState { error: string | null }

class PlaygroundErrorBoundary extends Component<EBProps, EBState> {
  constructor(props: EBProps) {
    super(props);
    this.state = { error: null };
  }
  static getDerivedStateFromError(err: Error) {
    return { error: err.message || "Unknown error" };
  }
  render() {
    if (this.state.error) {
      return (
        <div className="p-6 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
          <p className="font-bold mb-2">Playground crashed</p>
          <pre className="whitespace-pre-wrap text-xs">{this.state.error}</pre>
        </div>
      );
    }
    return this.props.children;
  }
}

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */
interface HeaderRow { key: string; value: string }

interface PlaygroundResponse {
  status: number;
  statusText: string;
  headers: Record<string, string>;
  body: unknown;
  duration: number;
}

interface EndpointOption {
  method: string;
  path: string;
  summary: string;
  basePath: string;
  portalLabel: string;
}

export interface ApiPlaygroundProps {
  endpoints: EndpointOption[];
}

/* ------------------------------------------------------------------ */
/*  Constants                                                          */
/* ------------------------------------------------------------------ */
const METHODS = ["GET", "POST", "PUT", "DELETE", "PATCH"] as const;

const METHOD_COLORS: Record<string, string> = {
  GET: "bg-green-500/10 text-green-400 border-green-500/20",
  POST: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  PUT: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  DELETE: "bg-red-500/10 text-red-400 border-red-500/20",
  PATCH: "bg-purple-500/10 text-purple-400 border-purple-500/20",
};

const BASE_URLS = [
  { label: "Production", value: "https://openrainbow.com" },
  { label: "Sandbox", value: "https://sandbox.openrainbow.com" },
];

function statusColor(status: number): string {
  if (status >= 200 && status < 300) return "bg-green-500/10 text-green-400 border-green-500/30";
  if (status >= 400 && status < 500) return "bg-amber-500/10 text-amber-400 border-amber-500/30";
  if (status >= 500) return "bg-red-500/10 text-red-400 border-red-500/30";
  return "bg-blue-500/10 text-blue-400 border-blue-500/30";
}

function formatBody(body: unknown): string {
  if (body === null || body === undefined) return "";
  if (typeof body === "string") {
    try { return JSON.stringify(JSON.parse(body), null, 2); } catch { return body; }
  }
  return JSON.stringify(body, null, 2);
}

/* ------------------------------------------------------------------ */
/*  Search-param reader (isolated in its own Suspense)                 */
/* ------------------------------------------------------------------ */
function SearchParamReader({ onParams }: { onParams: (m: string | null, p: string | null) => void }) {
  const sp = useSearchParams();
  useEffect(() => {
    onParams(sp.get("method"), sp.get("path"));
  }, [sp, onParams]);
  return null;
}

/* ------------------------------------------------------------------ */
/*  Inner playground (no useSearchParams — safe for SSR)               */
/* ------------------------------------------------------------------ */
function PlaygroundInner({ endpoints }: ApiPlaygroundProps) {
  const [mounted, setMounted] = useState(false);
  const [method, setMethod] = useState("GET");
  const [baseUrl, setBaseUrl] = useState(BASE_URLS[0].value);
  const [path, setPath] = useState("");
  const [headers, setHeaders] = useState<HeaderRow[]>([{ key: "accept", value: "application/json" }]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResponseHeaders, setShowResponseHeaders] = useState(false);
  const [endpointSearch, setEndpointSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  const handleParams = useCallback((paramMethod: string | null, paramPath: string | null) => {
    if (paramMethod && METHODS.includes(paramMethod.toUpperCase() as typeof METHODS[number])) {
      setMethod(paramMethod.toUpperCase());
    }
    if (paramPath) setPath(paramPath);
  }, []);

  const filteredEndpoints = endpointSearch
    ? endpoints.filter(
        (ep) =>
          ep.path.toLowerCase().includes(endpointSearch.toLowerCase()) ||
          ep.summary.toLowerCase().includes(endpointSearch.toLowerCase()) ||
          ep.portalLabel.toLowerCase().includes(endpointSearch.toLowerCase())
      )
    : endpoints.slice(0, 50);

  const selectEndpoint = useCallback((ep: EndpointOption) => {
    setMethod(ep.method);
    setPath(ep.basePath + ep.path);
    setShowPicker(false);
    setEndpointSearch("");
  }, []);

  const addHeader = () => setHeaders((h) => [...h, { key: "", value: "" }]);
  const updateHeader = (i: number, field: "key" | "value", v: string) => {
    setHeaders((prev) => { const u = [...prev]; u[i] = { ...u[i], [field]: v }; return u; });
  };
  const removeHeader = (i: number) => setHeaders((prev) => prev.filter((_, idx) => idx !== i));

  const formatBodyInput = () => {
    try { setBody(JSON.stringify(JSON.parse(body), null, 2)); } catch { /* noop */ }
  };

  const sendRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);
    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;
    const headersObj: Record<string, string> = {};
    for (const h of headers) { if (h.key.trim()) headersObj[h.key.trim()] = h.value; }
    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method, url, headers: headersObj,
          body: ["POST", "PUT", "PATCH"].includes(method) ? body : undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Request failed"); return; }
      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const showBody = ["POST", "PUT", "PATCH"].includes(method);

  // Prevent hydration mismatch — render a stable skeleton on the server,
  // then swap to the interactive UI after mount.
  if (!mounted) {
    return (
      <div className="space-y-6">
        <div className="h-11 rounded-lg border border-[var(--border)] bg-[var(--card)]" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div className="h-5 w-20 rounded bg-[var(--muted)]" />
            <div className="h-10 rounded-lg bg-[var(--muted)]" />
            <div className="h-8 rounded bg-[var(--muted)]" />
            <div className="h-10 rounded-lg bg-[var(--muted)]" />
          </div>
          <div className="space-y-4">
            <div className="h-5 w-24 rounded bg-[var(--muted)]" />
            <div className="h-32 rounded-lg border border-[var(--border)] bg-[var(--card)]" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Suspense fallback={null}>
        <SearchParamReader onParams={handleParams} />
      </Suspense>

      {/* Endpoint quick-picker */}
      <div className="relative">
        <button
          onClick={() => setShowPicker(!showPicker)}
          className="w-full text-left px-4 py-2.5 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--muted-foreground)] hover:border-[var(--accent)]/50 transition-colors"
        >
          Browse endpoints to auto-fill...
        </button>
        {showPicker && (
          <div className="absolute z-20 top-full mt-1 w-full rounded-lg border border-[var(--border)] bg-[var(--card)] shadow-lg max-h-80 overflow-hidden flex flex-col">
            <div className="p-2 border-b border-[var(--border)]">
              <input
                type="text"
                placeholder="Search endpoints..."
                value={endpointSearch}
                onChange={(e) => setEndpointSearch(e.target.value)}
                className="w-full px-3 py-1.5 rounded bg-[var(--muted)] text-sm text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                autoFocus
              />
            </div>
            <div className="overflow-y-auto flex-1">
              {filteredEndpoints.length === 0 ? (
                <div className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">No endpoints found</div>
              ) : (
                filteredEndpoints.map((ep, i) => (
                  <button
                    key={`${ep.method}-${ep.basePath}${ep.path}-${i}`}
                    onClick={() => selectEndpoint(ep)}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors flex items-start gap-2"
                  >
                    <span className={cn("inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded border shrink-0 mt-0.5", METHOD_COLORS[ep.method])}>
                      {ep.method}
                    </span>
                    <div className="min-w-0">
                      <code className="text-xs font-mono text-[var(--foreground)] break-all">{ep.basePath}{ep.path}</code>
                      <p className="text-[10px] text-[var(--muted-foreground)] truncate">{ep.portalLabel} &middot; {ep.summary}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Request builder */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider">Request</h3>

          <div className="flex gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className="px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm font-bold w-28 shrink-0 outline-none"
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
            <select
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="px-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] shrink-0 outline-none"
            >
              {BASE_URLS.map((b) => (
                <option key={b.value} value={b.value}>{b.label}</option>
              ))}
            </select>
            <input
              type="text"
              value={path}
              onChange={(e) => setPath(e.target.value)}
              placeholder="/api/rainbow/enduser/v1.0/users"
              className="flex-1 px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-sm font-mono text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
            />
          </div>

          {/* Headers */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Headers</span>
              <button onClick={addHeader} className="text-xs text-[var(--accent)] hover:underline">+ Add header</button>
            </div>
            <div className="space-y-1.5">
              {headers.map((h, i) => (
                <div key={i} className="flex gap-1.5">
                  <input type="text" value={h.key} onChange={(e) => updateHeader(i, "key", e.target.value)} placeholder="Header name"
                    className="flex-1 px-2.5 py-1.5 rounded border border-[var(--border)] bg-[var(--muted)] text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  <input type="text" value={h.value} onChange={(e) => updateHeader(i, "value", e.target.value)} placeholder="Value"
                    className="flex-1 px-2.5 py-1.5 rounded border border-[var(--border)] bg-[var(--muted)] text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-1 focus:ring-[var(--accent)]" />
                  <button onClick={() => removeHeader(i)} className="px-2 text-[var(--muted-foreground)] hover:text-red-400 transition-colors text-sm" title="Remove">&times;</button>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          {showBody && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Body</span>
                <button onClick={formatBodyInput} className="text-xs text-[var(--accent)] hover:underline">Format JSON</button>
              </div>
              <textarea
                value={body}
                onChange={(e) => setBody(e.target.value)}
                placeholder='{"key": "value"}'
                rows={8}
                className="w-full px-3 py-2 rounded-lg border border-[var(--border)] bg-[var(--muted)] text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-1 focus:ring-[var(--accent)] resize-y"
              />
            </div>
          )}

          {/* Send */}
          <button
            onClick={sendRequest}
            disabled={loading || !path.trim()}
            className={cn(
              "w-full py-2.5 rounded-lg font-semibold text-sm transition-all",
              loading || !path.trim()
                ? "bg-[var(--muted)] text-[var(--muted-foreground)] cursor-not-allowed"
                : "bg-[var(--accent)] text-white hover:opacity-90"
            )}
          >
            {loading ? (
              <span className="inline-flex items-center gap-2">
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Sending...
              </span>
            ) : "Send Request"}
          </button>
        </div>

        {/* Right: Response viewer */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider">Response</h3>

          {error && (
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">{error}</div>
          )}

          {!response && !error && !loading && (
            <div className="p-8 rounded-lg border border-[var(--border)] bg-[var(--card)] text-center text-sm text-[var(--muted-foreground)]">
              Send a request to see the response here
            </div>
          )}

          {loading && !response && (
            <div className="p-8 rounded-lg border border-[var(--border)] bg-[var(--card)] text-center text-sm text-[var(--muted-foreground)]">
              <svg className="animate-spin h-5 w-5 mx-auto mb-2 text-[var(--accent)]" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Sending request...
            </div>
          )}

          {response && (
            <div className="space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <span className={cn("inline-flex items-center px-2.5 py-1 rounded border font-bold", statusColor(response.status))}>
                  {response.status} {response.statusText}
                </span>
                <span className="text-[var(--muted-foreground)]">{response.duration}ms</span>
              </div>

              <div>
                <button
                  onClick={() => setShowResponseHeaders(!showResponseHeaders)}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
                >
                  <svg className={cn("h-3 w-3 transition-transform", showResponseHeaders && "rotate-90")} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  Response Headers ({Object.keys(response.headers).length})
                </button>
                {showResponseHeaders && (
                  <div className="mt-1.5 p-3 rounded border border-[var(--border)] bg-[var(--muted)] overflow-x-auto">
                    <table className="text-xs font-mono">
                      <tbody>
                        {Object.entries(response.headers).map(([k, v]) => (
                          <tr key={k}>
                            <td className="pr-3 py-0.5 text-[var(--muted-foreground)] whitespace-nowrap">{k}</td>
                            <td className="py-0.5 text-[var(--foreground)] break-all">{v}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)] overflow-hidden">
                <pre className="p-4 text-xs font-mono text-[var(--foreground)] overflow-x-auto max-h-[500px] overflow-y-auto whitespace-pre-wrap break-words">
                  {formatBody(response.body)}
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Exported wrapper: error boundary around the inner playground       */
/* ------------------------------------------------------------------ */
export function ApiPlayground({ endpoints }: ApiPlaygroundProps) {
  return (
    <PlaygroundErrorBoundary>
      <PlaygroundInner endpoints={endpoints} />
    </PlaygroundErrorBoundary>
  );
}
