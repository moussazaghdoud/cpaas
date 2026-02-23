"use client";

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils";

interface HeaderRow {
  key: string;
  value: string;
}

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

interface ApiPlaygroundProps {
  endpoints: EndpointOption[];
}

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
    try {
      return JSON.stringify(JSON.parse(body), null, 2);
    } catch {
      return body;
    }
  }
  return JSON.stringify(body, null, 2);
}

export function ApiPlayground({ endpoints }: ApiPlaygroundProps) {
  const searchParams = useSearchParams();

  const [method, setMethod] = useState<string>("GET");
  const [baseUrl, setBaseUrl] = useState(BASE_URLS[0].value);
  const [path, setPath] = useState("");
  const [headers, setHeaders] = useState<HeaderRow[]>([
    { key: "accept", value: "application/json" },
  ]);
  const [body, setBody] = useState("");
  const [response, setResponse] = useState<PlaygroundResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showResponseHeaders, setShowResponseHeaders] = useState(false);
  const [endpointSearch, setEndpointSearch] = useState("");
  const [showPicker, setShowPicker] = useState(false);

  // Pre-fill from URL params
  useEffect(() => {
    const paramMethod = searchParams.get("method");
    const paramPath = searchParams.get("path");
    if (paramMethod && METHODS.includes(paramMethod.toUpperCase() as typeof METHODS[number])) {
      setMethod(paramMethod.toUpperCase());
    }
    if (paramPath) {
      setPath(paramPath);
    }
  }, [searchParams]);

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

  const addHeader = () => setHeaders([...headers, { key: "", value: "" }]);

  const updateHeader = (index: number, field: "key" | "value", value: string) => {
    const updated = [...headers];
    updated[index][field] = value;
    setHeaders(updated);
  };

  const removeHeader = (index: number) => {
    setHeaders(headers.filter((_, i) => i !== index));
  };

  const formatBodyInput = () => {
    try {
      setBody(JSON.stringify(JSON.parse(body), null, 2));
    } catch {
      // not valid JSON, leave as-is
    }
  };

  const sendRequest = async () => {
    setLoading(true);
    setError(null);
    setResponse(null);

    const url = path.startsWith("http") ? path : `${baseUrl}${path}`;

    const headersObj: Record<string, string> = {};
    for (const h of headers) {
      if (h.key.trim()) {
        headersObj[h.key.trim()] = h.value;
      }
    }

    try {
      const res = await fetch("/api/playground", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          method,
          url,
          headers: headersObj,
          body: ["POST", "PUT", "PATCH"].includes(method) ? body : undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Request failed");
        return;
      }

      setResponse(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setLoading(false);
    }
  };

  const showBody = ["POST", "PUT", "PATCH"].includes(method);

  return (
    <div className="space-y-6">
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
                <div className="px-4 py-6 text-center text-sm text-[var(--muted-foreground)]">
                  No endpoints found
                </div>
              ) : (
                filteredEndpoints.map((ep, i) => (
                  <button
                    key={`${ep.method}-${ep.basePath}${ep.path}-${i}`}
                    onClick={() => selectEndpoint(ep)}
                    className="w-full text-left px-3 py-2 hover:bg-[var(--muted)] transition-colors flex items-start gap-2"
                  >
                    <span
                      className={cn(
                        "inline-flex items-center px-1.5 py-0.5 text-[10px] font-bold rounded border shrink-0 mt-0.5",
                        METHOD_COLORS[ep.method]
                      )}
                    >
                      {ep.method}
                    </span>
                    <div className="min-w-0">
                      <code className="text-xs font-mono text-[var(--foreground)] break-all">
                        {ep.basePath}{ep.path}
                      </code>
                      <p className="text-[10px] text-[var(--muted-foreground)] truncate">
                        {ep.portalLabel} &middot; {ep.summary}
                      </p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}
      </div>

      {/* Main layout: Request + Response */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Request builder */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider">Request</h3>

          {/* Method + URL */}
          <div className="flex gap-2">
            <select
              value={method}
              onChange={(e) => setMethod(e.target.value)}
              className={cn(
                "px-3 py-2 rounded-lg border text-sm font-bold w-28 shrink-0 appearance-none cursor-pointer outline-none",
                METHOD_COLORS[method]
              )}
            >
              {METHODS.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
            <select
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="px-2 py-2 rounded-lg border border-[var(--border)] bg-[var(--card)] text-sm text-[var(--foreground)] shrink-0 outline-none"
            >
              {BASE_URLS.map((b) => (
                <option key={b.value} value={b.value}>
                  {b.label}
                </option>
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
              <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Headers</label>
              <button
                onClick={addHeader}
                className="text-xs text-[var(--accent)] hover:underline"
              >
                + Add header
              </button>
            </div>
            <div className="space-y-1.5">
              {headers.map((h, i) => (
                <div key={i} className="flex gap-1.5">
                  <input
                    type="text"
                    value={h.key}
                    onChange={(e) => updateHeader(i, "key", e.target.value)}
                    placeholder="Header name"
                    className="flex-1 px-2.5 py-1.5 rounded border border-[var(--border)] bg-[var(--muted)] text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <input
                    type="text"
                    value={h.value}
                    onChange={(e) => updateHeader(i, "value", e.target.value)}
                    placeholder="Value"
                    className="flex-1 px-2.5 py-1.5 rounded border border-[var(--border)] bg-[var(--muted)] text-xs font-mono text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] outline-none focus:ring-1 focus:ring-[var(--accent)]"
                  />
                  <button
                    onClick={() => removeHeader(i)}
                    className="px-2 text-[var(--muted-foreground)] hover:text-red-400 transition-colors text-sm"
                    title="Remove header"
                  >
                    &times;
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Body */}
          {showBody && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-medium text-[var(--muted-foreground)] uppercase tracking-wider">Body</label>
                <button
                  onClick={formatBodyInput}
                  className="text-xs text-[var(--accent)] hover:underline"
                >
                  Format JSON
                </button>
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

          {/* Send button */}
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
            ) : (
              "Send Request"
            )}
          </button>
        </div>

        {/* Right: Response viewer */}
        <div className="space-y-4">
          <h3 className="text-sm font-semibold text-[var(--foreground)] uppercase tracking-wider">Response</h3>

          {error && (
            <div className="p-4 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
              {error}
            </div>
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
              {/* Status bar */}
              <div className="flex items-center gap-3 text-sm">
                <span
                  className={cn(
                    "inline-flex items-center px-2.5 py-1 rounded border font-bold",
                    statusColor(response.status)
                  )}
                >
                  {response.status} {response.statusText}
                </span>
                <span className="text-[var(--muted-foreground)]">{response.duration}ms</span>
              </div>

              {/* Response headers (collapsible) */}
              <div>
                <button
                  onClick={() => setShowResponseHeaders(!showResponseHeaders)}
                  className="text-xs text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors flex items-center gap-1"
                >
                  <svg
                    className={cn("h-3 w-3 transition-transform", showResponseHeaders && "rotate-90")}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  Response Headers ({Object.keys(response.headers).length})
                </button>
                {showResponseHeaders && (
                  <div className="mt-1.5 p-3 rounded border border-[var(--border)] bg-[var(--muted)] overflow-x-auto">
                    <table className="text-xs font-mono">
                      <tbody>
                        {Object.entries(response.headers).map(([key, value]) => (
                          <tr key={key}>
                            <td className="pr-3 py-0.5 text-[var(--muted-foreground)] whitespace-nowrap">{key}</td>
                            <td className="py-0.5 text-[var(--foreground)] break-all">{value}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Response body */}
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
