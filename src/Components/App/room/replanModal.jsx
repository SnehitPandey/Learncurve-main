import React, { useState } from "react";
import { motion } from "framer-motion";
import { X, Clock, Calendar, AlertCircle, Wand2, Check } from "lucide-react";
import { Button } from "../../elements/elements";

const DAILY_TIME_OPTIONS = [
    { value: "15m", label: "15 min / day" },
    { value: "30m", label: "30 min / day" },
    { value: "45m", label: "45 min / day" },
    { value: "1h", label: "1 hr / day" },
    { value: "1.5h", label: "1.5 hrs / day" },
    { value: "2h", label: "2 hrs / day" }
];

const AVAILABILITY_OPTIONS = [
    { value: "weekdays", label: "Weekdays (Mon-Fri)" },
    { value: "weekends", label: "Weekends (Sat-Sun)" },
    { value: "anytime", label: "Any day (Daily)" }
];

const EXTEND_OPTIONS = [
    { value: "", label: "Keep current end date" },
    { value: "+1week", label: "+1 Week buffer" },
    { value: "+2weeks", label: "+2 Weeks buffer" },
    { value: "+1month", label: "+1 Month extension" }
];

const ReplanModal = ({ currentDailyTime = "30m", currentAvailability = "anytime", onReplan, onClose }) => {
    const [dailyTime, setDailyTime] = useState(currentDailyTime || "30m");
    const [availability, setAvailability] = useState(currentAvailability || "anytime");
    const [extendTimeframe, setExtendTimeframe] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e) => {
        e?.preventDefault();
        setError("");
        setSubmitting(true);
        try {
            await onReplan({
                dailyTime,
                availability,
                extendTimeframe: extendTimeframe || undefined
            });
            onClose();
        } catch (err) {
            setError(err?.message || "Failed to re-plan roadmap. Please try again.");
            setSubmitting(false);
        }
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={onClose}
        >
            <motion.div
                initial={{ scale: 0.95, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.95, opacity: 0 }}
                className="bg-background rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-text/10"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center">
                            <Wand2 size={20} />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-text">Adaptive Re-Plan</h3>
                            <p className="text-xs text-text/60">Recalibrate remaining modules without losing past progress</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="p-1 hover:bg-text/10 rounded-lg transition-colors">
                        <X className="w-5 h-5 text-text/60" />
                    </button>
                </div>

                <div className="p-3 mb-5 rounded-xl bg-primary/5 border border-primary/20 text-xs text-text/80 leading-relaxed">
                    Life got busy or schedule changed? Completed and in-progress modules remain untouched. Remaining unstarted modules will be rescheduled from today according to your updated pace.
                </div>

                {error && (
                    <div className="mb-4 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs flex items-center gap-2">
                        <AlertCircle size={14} className="flex-shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {/* Daily Commitment */}
                    <div>
                        <label className="block text-xs font-semibold text-text mb-2 flex items-center gap-1.5">
                            <Clock size={13} className="text-primary" />
                            <span>Daily Study Commitment</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {DAILY_TIME_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setDailyTime(opt.value)}
                                    className={`py-2 px-2.5 rounded-lg text-xs font-medium border text-center transition-all ${
                                        dailyTime === opt.value
                                            ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                                            : "border-text/15 hover:border-text/30 text-text/70"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Weekly Availability */}
                    <div>
                        <label className="block text-xs font-semibold text-text mb-2 flex items-center gap-1.5">
                            <Calendar size={13} className="text-primary" />
                            <span>Weekly Availability</span>
                        </label>
                        <div className="grid grid-cols-3 gap-2">
                            {AVAILABILITY_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setAvailability(opt.value)}
                                    className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                                        availability === opt.value
                                            ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                                            : "border-text/15 hover:border-text/30 text-text/70"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Extension */}
                    <div>
                        <label className="block text-xs font-semibold text-text mb-2 flex items-center gap-1.5">
                            <Wand2 size={13} className="text-primary" />
                            <span>Timeline Adjustment</span>
                        </label>
                        <div className="grid grid-cols-2 gap-2">
                            {EXTEND_OPTIONS.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={() => setExtendTimeframe(opt.value)}
                                    className={`py-2 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                                        extendTimeframe === opt.value
                                            ? "border-primary bg-primary/10 text-primary font-semibold shadow-sm"
                                            : "border-text/15 hover:border-text/30 text-text/70"
                                    }`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>

                    <div className="flex gap-3 pt-3">
                        <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={submitting}>
                            Cancel
                        </Button>
                        <Button type="submit" variant="primary" className="flex-1 flex items-center justify-center gap-2" disabled={submitting}>
                            {submitting ? (
                                <span>Re-planning...</span>
                            ) : (
                                <>
                                    <Check size={15} />
                                    <span>Apply Re-Plan</span>
                                </>
                            )}
                        </Button>
                    </div>
                </form>
            </motion.div>
        </motion.div>
    );
};

export default ReplanModal;
