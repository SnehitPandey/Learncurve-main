import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabaseSessionAuth, googleCodeAuth } from "../api/auth";
import { Bird, AlertCircle, CheckCircle } from "lucide-react";

export default function AuthCallback() {
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");
  const [errorMessage, setErrorMessage] = useState("");
  const processedRef = useRef(false);

  useEffect(() => {
    // React 19 StrictMode mounts, cleans up, then mounts again — and refs survive
    // that, which is what this guard relies on.
    //
    // This used to be a `let active = true` flag instead, and that is precisely
    // what broke sign-in. The handler scrubbed the single-use `code` out of the
    // URL with `history.replaceState` before awaiting the exchange, so the
    // StrictMode second pass found no `code` and no `access_token`, threw
    // "callback reached with nothing usable", and painted the error. Meanwhile
    // the FIRST pass was still in flight and its result was discarded by
    // `if (!active) return`, so it never navigated. The user was left staring at
    // a failure message while being fully signed in — and a refresh fixed it,
    // because `isLoggedIn` was already set by the completed request.
    //
    // So: read the URL synchronously, once, and never again.
    if (processedRef.current) return;
    processedRef.current = true;

    let redirectTimer = null;

    // Capture every parameter up front. Nothing below re-reads window.location,
    // so the flow cannot lose its input partway through.
    const hashParams = new URLSearchParams(window.location.hash.substring(1));
    const searchParams = new URLSearchParams(window.location.search);
    const pick = (key) => hashParams.get(key) || searchParams.get(key);

    const error = pick("error");
    const errorDescription = pick("error_description");
    // The direct Google flow (authorization-code) is the primary path. The
    // Supabase route still delivers its payload in the fragment, so both are read.
    const code = pick("code");
    const state = pick("state");
    const accessToken = pick("access_token");

    if (code) {
      // An authorization code is single-use, so scrub it before awaiting anything.
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    const handleAuthRedirect = async () => {
      try {
        if (error) {
          throw new Error(errorDescription || error || "OAuth authorization failed");
        }

        if (code) {
          const res = await googleCodeAuth(code, state);

          if (res?.success) {
            setStatus("success");
            // Only a server-relative path is honoured — never an absolute URL
            // from the query string, which would be an open redirect.
            const target =
              typeof res.redirectTo === "string" &&
              res.redirectTo.startsWith("/") &&
              !res.redirectTo.startsWith("//")
                ? res.redirectTo
                : "/home";
            redirectTimer = setTimeout(() => navigate(target, { replace: true }), 800);
            return;
          }
          throw new Error(res?.error || "Could not complete Google sign-in");
        }

        if (accessToken) {
          // Hand the RAW Supabase access token to the backend and let IT decide who
          // this is. The previous version decoded the JWT here and posted the
          // decoded {email, name, avatarUrl, id} instead — which the backend
          // correctly ignores, because trusting a client-supplied email would let
          // anyone mint a session for any account.
          const res = await supabaseSessionAuth(accessToken);

          if (res?.success) {
            setStatus("success");
            redirectTimer = setTimeout(() => navigate("/home", { replace: true }), 800);
            return;
          }
        }

        // Nothing recognisable in the URL. Report WHAT was actually here rather
        // Already signed in and nothing to redeem (a stray visit to this URL, or
        // a callback whose params were already consumed). Send them on rather
        // than showing a sign-in failure for a session that is perfectly valid.
        if (localStorage.getItem("isLoggedIn") === "true") {
          navigate("/home", { replace: true });
          return;
        }

        // Report WHAT was actually here rather than a bare "no credentials" — the
        // generic message sends people to check the wrong layer (session storage,
        // backend, Supabase) when the cause is almost always the callback arriving
        // at the wrong address or with its query stripped. The parameter NAMES are
        // safe to show; no value is, because `code` and `access_token` are
        // both credentials.
        const seen = [
          ...new Set([
            ...Array.from(searchParams.keys()),
            ...Array.from(hashParams.keys())
          ])
        ];
        throw new Error(
          `Sign-in callback reached with nothing usable in it. ` +
            `Path: ${window.location.pathname}. ` +
            (seen.length
              ? `Parameters present: ${seen.join(", ")} (values hidden).`
              : `No query parameters and no URL fragment were present at all.`)
        );
      } catch (err) {
        console.error("Auth callback error:", err);
        setStatus("error");
        setErrorMessage(err.message || "Failed to finalize authentication");
      }
    };

    handleAuthRedirect();

    return () => {
      if (redirectTimer) clearTimeout(redirectTimer);
    };
    // Runs exactly once — `processedRef` survives StrictMode's double mount, and
    // the payload was captured synchronously above, so neither a second pass nor a
    // re-render can re-parse or re-submit the authorization code.
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="w-full max-w-md p-8 rounded-2xl shadow-xl bg-background/80 backdrop-blur-lg border border-text/15 text-center space-y-6">
        {status === "processing" && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
              <Bird className="w-8 h-8 text-primary animate-bounce" />
            </div>
            <h2 className="text-2xl font-bold text-text">Signing you in...</h2>
            <p className="text-sm text-text/70">Connecting your secure session, just a moment.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-green-500/10 flex items-center justify-center">
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-bold text-text">Welcome back!</h2>
            <p className="text-sm text-text/70">Redirecting to your study sanctuary...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <div className="w-16 h-16 mx-auto rounded-full bg-red-500/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-2xl font-bold text-text">Authentication Error</h2>
            <p className="text-sm text-red-500/90 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              {errorMessage}
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={() => navigate("/login", { replace: true })}
                className="px-6 py-2.5 bg-primary text-background font-medium rounded-xl hover:opacity-90 transition-opacity"
              >
                Return to Login
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
