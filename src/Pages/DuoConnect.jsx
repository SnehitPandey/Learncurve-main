import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import { Bird } from "lucide-react";
import { connectDuo } from "../api/duo";

/**
 * Landing page for a Study Duo invite link (`/connect/:code`).
 *
 * The backend mints this URL, so it must handle the code rather than 404. It
 * exchanges the code for a duo connection and then hands the user to the app.
 *
 * WHY THERE IS NO "ALREADY ATTEMPTED" REF HERE
 *   This effect used to guard itself with `const attempted = useRef(false)` and
 *   bail when it was already true, added to survive StrictMode's double-invoke.
 *   It did the exact opposite. StrictMode mounts, runs the effect, tears it down
 *   (which set `active = false` inside the FIRST closure), then mounts again —
 *   and on that second mount the ref was already true, so the effect returned
 *   immediately without ever calling `connectDuo`. The first attempt's response
 *   was discarded because its own closure had been marked inactive. Nothing ever
 *   resolved: the page sat on "Joining your Study Duo…" for ever, with no
 *   request on the wire.
 *
 *   Refs survive the StrictMode remount, so a ref CANNOT be used to deduplicate
 *   across it. Running twice is harmless: `connectDuo` is idempotent server-side
 *   and returns the existing duo for an already-paired user.
 */
const DuoConnect = () => {
    const { code } = useParams();
    const navigate = useNavigate();
    const [status, setStatus] = useState("connecting");
    const [message, setMessage] = useState("Joining your Study Duo…");
    const navigateTimerRef = useRef(null);

    // Mount-only cleanup: the post-connect redirect is armed inside the async
    // run(), so it must survive every re-render but never fire after unmount.
    useEffect(() => () => clearTimeout(navigateTimerRef.current), []);

    useEffect(() => {
        let active = true;

        const run = async () => {
            if (!code) {
                setStatus("error");
                setMessage("This invite link is missing its code.");
                return;
            }

            try {
                await connectDuo(code);
                if (!active) return;
                setStatus("success");
                setMessage("You're connected! Taking you to your dashboard…");
                navigateTimerRef.current = setTimeout(() => navigate("/home", { replace: true }), 1200);
            } catch (err) {
                if (!active) return;
                setStatus("error");
                setMessage(err?.message || "That invite could not be used.");
            }
        };

        run();

        return () => {
            active = false;
        };
    }, [code, navigate]);

    return (
        <div className="min-h-screen flex items-center justify-center bg-background px-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center gap-4 text-center max-w-sm"
            >
                <div className="w-14 h-14 flex items-center justify-center rounded-full bg-primary/20 border-2 border-primary">
                    <Bird size={26} className="text-primary" />
                </div>

                <h1 className="text-xl font-bold text-text">Study Duo Invitation</h1>
                <p className="text-sm text-text/70">{message}</p>

                {status === "error" && (
                    <button
                        onClick={() => navigate("/home", { replace: true })}
                        className="mt-2 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium"
                    >
                        Go to dashboard
                    </button>
                )}
            </motion.div>
        </div>
    );
};

export default DuoConnect;
