// Components/room/roomContent.jsx
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
	TrendingUp, Clock, Target, Users, Crown, Circle, CheckCircle, PlayCircle, Brain, Trophy, BookOpen, Award, Calendar, ArrowRight, Zap, Loader2, ClipboardCheck, ChevronDown, RotateCcw, Wand2 } from "lucide-react";
import { Card, Button, Badge } from "../../elements/elements";
import KanbanView from "./kanbanView";
import ReplanModal from "./replanModal";
import { getRoomQuizzes, submitQuizAnswers, createTestForToday, getPastResults } from "../../../api/quizzes";
import AchievementIcon from "../../elements/AchievementIcon";

const RoomContent = ({
	activeView,
	roomData,
	members,
	todaysTasks,
	roadmapItems,
	showMembers = true,
	onToggleTask,
	onToggleRoadmapTask,
	onOpenQuiz,
	loading = false,
	roadmapGeneratedBy = "template",
	scheduleState = {},
	onReplanRoadmap,
}) => {
	const [showReplanModal, setShowReplanModal] = useState(false);
	// Quiz state — loaded from backend
	const [quizzes, setQuizzes] = useState([]);
	const [currentQuiz, setCurrentQuiz] = useState(null);
	const [selectedAnswers, setSelectedAnswers] = useState({});
	const [quizResult, setQuizResult] = useState(null);
	const [quizError, setQuizError] = useState("");
	const [quizSubmitting, setQuizSubmitting] = useState(false);
	const [creatingTest, setCreatingTest] = useState(false);
	const [pastResults, setPastResults] = useState([]);
	// Retention window for the results list, reported by the backend.
	const [resultsWindowDays, setResultsWindowDays] = useState(15);

	// Load the learner's own created tests AND their 15-day results when the quiz
	// tab is opened. Both are read-only reads — creating a test is an explicit
	// action, never a side effect of opening the tab.
	useEffect(() => {
		if (activeView !== "quiz" || !roomData?.id) return undefined;
		let cancelled = false;
		getRoomQuizzes(roomData.id)
			.then(res => {
				if (cancelled) return;
				setQuizzes(Array.isArray(res?.quizzes) ? res.quizzes : []);
			})
			.catch(() => {
				if (!cancelled) setQuizzes([]);
			});

		getPastResults(roomData.id)
			.then(res => {
				if (cancelled) return;
				setPastResults(res.results);
				// The retention window is a backend policy (`RESULTS_WINDOW_DAYS`).
				// Taking it from the response rather than repeating "15" here means
				// changing the policy updates every place that reports it.
				setResultsWindowDays(res.windowDays);
			})
			.catch(() => {
				if (!cancelled) setPastResults([]);
			});

		return () => { cancelled = true; };
	}, [activeView, roomData?.id]);

	/** Ask the backend for a test covering today's topic. */
	const handleCreateTest = async () => {
		if (!roomData?.id || creatingTest) return;
		setCreatingTest(true);
		setQuizError("");
		try {
			const made = await createTestForToday(roomData.id);
			if (made) {
				setQuizzes(prev => [made, ...prev]);
				setCurrentQuiz(made);
				setSelectedAnswers({});
			}
		} catch (err) {
			setQuizError(err?.message || "Could not create a test right now. Please try again.");
		} finally {
			setCreatingTest(false);
		}
	};

	/** Results are stamped with a UTC instant; show them in local time. */
	const formatResultDate = (value) => {
		if (!value) return "";
		const d = new Date(value);
		if (Number.isNaN(d.getTime())) return "";
		return d.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" });
	};

	// Helper functions
	const getStatusColor = (status) => {
		switch (status) {
			case "ahead":    return "text-green-500";
			case "on-track": return "text-blue-500";
			case "behind":   return "text-red-500";
			default:         return "text-text/60";
		}
	};

	const getStatusBarColor = (status) => {
		switch (status) {
			case "ahead":    return "bg-green-500";
			case "behind":   return "bg-red-500";
			default:         return "bg-primary";
		}
	};

	const handleQuizAnswer = (questionId, answerIndex) => {
		setSelectedAnswers(prev => ({ ...prev, [questionId]: answerIndex }));
	};

	const handleStartQuiz = (quiz) => {
		setCurrentQuiz(quiz);
		setSelectedAnswers({});
		setQuizResult(null);
		setQuizError("");
	};

	const submitQuiz = async () => {
		if (!currentQuiz) return;
		const questions = Array.isArray(currentQuiz.questions) ? currentQuiz.questions : [];
		if (questions.length === 0) {
			setQuizError("This quiz has no questions yet.");
			return;
		}
		setQuizSubmitting(true);
		setQuizError("");
		const answers = questions.map(q => ({
			questionId: q.id,
			selectedAnswerIndex: selectedAnswers[q.id] ?? 0,
		}));
		try {
			const res = await submitQuizAnswers(roomData.id, currentQuiz.id, answers);
			// The backend strips `correctAnswerIndex` from the quiz payload, so the
			// ONLY honest source of a score is the server's grading response.
			const total = Number(res?.totalQuestions ?? questions.length);
			const score = Number(res?.scorePercent);
			setQuizResult({
				scorePercent: Number.isFinite(score) ? score : 0,
				correctCount: Number(res?.correctCount ?? 0),
				totalQuestions: total,
				explanation: res?.explanation || "",
				earnedAchievement: res?.earnedAchievement || null,
			});
			if (score >= 80) {
				// Server marks slot 3 completed on passing quiz submit; update local state optimistically
				setTodaysTasks(prev => prev.map(t => t.id === "task-today-3" ? { ...t, completed: true } : t));
			}
		} catch (err) {
			// No local fallback scoring — without correctAnswerIndex it always
			// scored 0%. Report the failure instead of inventing a result.
			setQuizResult(null);
			setQuizError(err?.message || "Could not grade your answers. Please try again.");
		} finally {
			setQuizSubmitting(false);
		}
	};

	const completedTaskCount = todaysTasks.filter(t => t.completed).length;
	const currentMember = members.find(m => m.isCurrentUser);
	const allRoadmapTasks = roadmapItems.flatMap(item => item.tasks || []);
	const totalRoadmapTasks = allRoadmapTasks.length;
	const completedRoadmapTasks = allRoadmapTasks.filter(t => t.completed).length;
	const roadmapProgressPercent = totalRoadmapTasks > 0
		? Math.round((completedRoadmapTasks / totalRoadmapTasks) * 100)
		: (currentMember?.progress ?? 0);
	const userProgress = currentMember?.progress ?? roadmapProgressPercent;

	// Which milestone subtopic lists are open. A Set, not a single id, so opening
	// one topic does not collapse another.
	const [expandedTopics, setExpandedTopics] = useState(() => new Set());

	const toggleSubtopic = (id) => {
		setExpandedTopics(prev => {
			const next = new Set(prev);
			if (next.has(id)) next.delete(id);
			else next.add(id);
			return next;
		});
	};

	/**
	 * The subtopics belonging to one roadmap milestone.
	 *
	 * Roadmap entries reach the UI in more than one shape (the AI roadmap, the
	 * Mongo roadmap modules, the deterministic default board), so this reads
	 * whichever field is actually present instead of assuming one. Always an
	 * array, always strings, so callers never guard.
	 */
	const getSubtopics = (item) => {
		const raw = item?.subtopics || item?.topics || item?.subTopics || [];
		if (!Array.isArray(raw)) return [];
		return raw
			.map(s => {
				if (typeof s === "string") return s.trim();
				if (!s || typeof s !== "object") return "";
				return String(s.title || s.name || s.text || "").trim();
			})
			.filter(Boolean);
	};

	/**
	 * The lesson list that drops down from one topic.
	 *
	 * Each topic reads "Lesson 1 → Lesson 2 → Checkpoint", then the next topic
	 * repeats the same shape. `tasks` is where those actually live; `subtopics`
	 * (the wizard's concept list) is the fallback for payloads with no tasks, so
	 * the disclosure never renders as an empty box.
	 */
	const getTopicSteps = (item) => {
		if (Array.isArray(item?.tasks) && item.tasks.length > 0) {
			return item.tasks.map(t => ({
				id: t.id,
				title: t.title,
				duration: t.duration || "",
				completed: t.completed === true,
			}));
		}
		return getSubtopics(item).map((title, i) => ({
			id: `${item?.id || "topic"}-sub-${i}`,
			title,
			duration: "",
			completed: false,
		}));
	};
	// The schedule window is null when the backend cannot derive it from the
	// room's start date/timeframe. Guard so we show "Week 1" rather than NaN.
	const knownTotalDays = typeof roomData.totalDays === "number" && roomData.totalDays > 0
		? roomData.totalDays
		: null;
	const knownDaysLeft = typeof roomData.daysRemaining === "number" ? roomData.daysRemaining : null;
	const currentWeek = knownTotalDays !== null && knownDaysLeft !== null
		? Math.max(1, Math.ceil((knownTotalDays - knownDaysLeft) / 7))
		: 1;
	const totalWeeks = knownTotalDays !== null ? Math.ceil(knownTotalDays / 7) : 4;

	// Guards against an empty question set (0/0 used to render "NaN%").
	const activeQuestions = Array.isArray(currentQuiz?.questions) ? currentQuiz.questions : [];
	const answeredCount = activeQuestions.filter(q => selectedAnswers[q.id] !== undefined).length;
	const quizProgressPercent = activeQuestions.length === 0
		? 0
		: Math.round((answeredCount / activeQuestions.length) * 100);

	return (
		<div className="flex h-full">
			{/* Main Content Area */}
			<div className="flex-1 overflow-hidden p-0 transition-all duration-300">

				{/* Progress View */}
				{activeView === "progress" && (
					<div className="space-y-6 p-6 h-full overflow-y-auto">
						{/* Stats Grid */}
						<div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
							{[
								{
									title: "Overall Progress",
									value: `${userProgress}%`,
									icon: TrendingUp,
									color: "text-primary",
									bgColor: "bg-primary/10",
									bar: userProgress,
								},
								{
									title: "Days Remaining",
									value: knownDaysLeft ?? "—",
									icon: Clock,
									color: "text-orange-500",
									bgColor: "bg-orange-500/10",
									bar: knownTotalDays && knownDaysLeft !== null
										? Math.round(((knownTotalDays - knownDaysLeft) / knownTotalDays) * 100)
										: 0,
								},
								{
									title: "Active Members",
									value: roomData.activeUsers ?? members.length,
									icon: Target,
									color: "text-green-500",
									bgColor: "bg-green-500/10",
									bar: null,
								},
							].map((stat, index) => (
								<motion.div
									key={stat.title}
									initial={{ opacity: 0, y: 20 }}
									animate={{ opacity: 1, y: 0 }}
									transition={{ delay: index * 0.1 }}
								>
									<Card className="p-6 hover:shadow-lg transition-shadow">
										<div className="flex items-center justify-between mb-3">
											<div>
												<p className="text-text/60 text-sm font-medium">{stat.title}</p>
												<p className={`text-3xl font-bold ${stat.color} mt-1`}>{stat.value}</p>
											</div>
											<div className={`w-12 h-12 rounded-xl ${stat.bgColor} flex items-center justify-center`}>
												<stat.icon className={`w-6 h-6 ${stat.color}`} />
											</div>
										</div>
										{stat.bar !== null && (
											<div className="w-full h-1.5 bg-text/10 rounded-full mt-2">
												<motion.div
													initial={{ width: 0 }}
													animate={{ width: `${Math.min(stat.bar, 100)}%` }}
													transition={{ duration: 1, ease: "easeOut" }}
													className={`h-full rounded-full ${stat.color.replace("text-", "bg-")}`}
												/>
											</div>
										)}
									</Card>
								</motion.div>
							))}
						</div>

						{/* Today's Tasks */}
						<Card className="p-6">
							<div className="flex items-center justify-between mb-6">
								<h3 className="text-xl font-semibold text-text flex items-center">
									<Calendar className="w-5 h-5 mr-2 text-primary" />
									Today's Tasks
								</h3>
								<Badge variant="primary" className="bg-primary/10 text-primary">
									{completedTaskCount} / {todaysTasks.length} completed
								</Badge>
							</div>

							{/* Task completion progress bar */}
							{todaysTasks.length > 0 && (
								<div className="w-full h-2 bg-text/10 rounded-full mb-5">
									<motion.div
										initial={{ width: 0 }}
										animate={{ width: `${Math.round((completedTaskCount / todaysTasks.length) * 100)}%` }}
										transition={{ duration: 0.8 }}
										className="h-full bg-primary rounded-full"
									/>
								</div>
							)}

							<div className="space-y-3">
								{loading ? (
									<div className="flex items-center justify-center py-8 text-text/40">
										<Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading tasks...
									</div>
								) : scheduleState.notStarted ? (
									<div className="text-center py-8 px-4 bg-alt/10 rounded-xl">
										<Calendar className="w-8 h-8 text-primary mx-auto mb-2 opacity-80" />
										<p className="font-semibold text-text">Room has not started yet</p>
										<p className="text-sm text-text/60 mt-1">Starts on {scheduleState.startsOn}</p>
									</div>
								) : scheduleState.restDay ? (
									<div className="text-center py-8 px-4 bg-alt/10 rounded-xl">
										<Clock className="w-8 h-8 text-orange-400 mx-auto mb-2 opacity-80" />
										<p className="font-semibold text-text">Rest Day</p>
										<p className="text-sm text-text/60 mt-1">No tasks scheduled for today according to room availability ({scheduleState.availability || "schedule"}).</p>
									</div>
								) : todaysTasks.length === 0 ? (
									<p className="text-center text-text/40 py-6">No tasks for today yet.</p>
								) : todaysTasks.map((task, index) => {
									// The checkpoint is a TEST, not a checkbox. It used to be a
									// third row you simply ticked off, which meant the quiz was
									// "completed" without ever being taken — and nothing marked it
									// done when the quiz was actually passed.
									const isTest = task.id === "task-today-3";
									return (
									<motion.div
										key={task.id}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.07 }}
										className={`flex items-center justify-between p-4 rounded-xl transition-all select-none ${
											task.completed
												? "bg-green-50 dark:bg-green-900/20"
												: "bg-alt/10 hover:bg-alt/20"
										}`}
										// A test row must not toggle itself; the button below owns it.
										onClick={isTest ? undefined : () => onToggleTask?.(task.id, task.completed)}
									>
										<div className="flex items-center space-x-3">
											<motion.div whileTap={isTest ? undefined : { scale: 0.85 }}>
												{task.completed
													? <CheckCircle className="w-6 h-6 text-green-500" />
													: isTest
														? <ClipboardCheck className="w-6 h-6 text-primary" />
														: <Circle className="w-6 h-6 text-text/40" />
												}
											</motion.div>
											<div>
												<p className={`font-medium ${task.completed ? "text-text/50 line-through" : "text-text"}`}>
													{task.title}
												</p>
												{task.duration && (
													<p className="text-xs text-text/40 mt-0.5 flex items-center">
														<Clock className="w-3 h-3 mr-1" />{task.duration}
													</p>
												)}
											</div>
										</div>
										{isTest && !task.completed ? (
											<button
												type="button"
												onClick={(e) => { e.stopPropagation(); onOpenQuiz?.(); }}
												className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-white text-sm font-medium hover:opacity-90 transition-opacity flex-shrink-0"
											>
												<PlayCircle className="w-4 h-4" />
												Take Test
											</button>
										) : !task.completed ? (
											<PlayCircle className="w-5 h-5 text-primary/50 flex-shrink-0" />
										) : null}
									</motion.div>
									);
								})}
							</div>
						</Card>
					</div>
				)}

				{/* Roadmap View */}
				{activeView === "roadmap" && (
					<div className="space-y-6 p-4 h-full overflow-y-auto mb-32">
						<div className="flex items-center justify-between">
							<p className="text-text/60 flex items-center">
								<BookOpen className="w-4 h-4 mr-2 text-primary" />
								{roomData.description || "Your learning journey"}
							</p>
							<div className="flex items-center gap-2">
								{roadmapGeneratedBy === "template" && (
									<Badge variant="outline" className="text-xs text-text/60 border-text/20">
										Template roadmap
									</Badge>
								)}
								<Badge variant="primary" className="bg-primary/10 text-primary px-4 py-2">
									Module {currentWeek} of {totalWeeks}
								</Badge>
							</div>
						</div>

						{/* Adaptive Re-Plan Banner for Creator */}
						{roomData.isCreator && (
							<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 p-4 rounded-xl bg-gradient-to-r from-primary/10 via-primary/5 to-alt/20 border border-primary/20">
								<div className="flex items-center gap-3">
									<div className="w-8 h-8 rounded-lg bg-primary/20 text-primary flex items-center justify-center flex-shrink-0">
										<RotateCcw size={16} />
									</div>
									<div>
										<p className="text-xs font-semibold text-text">Life got in the way?</p>
										<p className="text-xs text-text/60">Re-plan remaining unstarted modules to fit your current schedule without losing past progress.</p>
									</div>
								</div>
								<Button
									size="sm"
									variant="outline"
									onClick={() => setShowReplanModal(true)}
									className="flex items-center gap-1.5 text-xs whitespace-nowrap border-primary/30 text-primary hover:bg-primary/10"
								>
									<Wand2 size={13} />
									<span>Re-plan Remaining</span>
								</Button>
							</div>
						)}

						{/* Roadmap overall progress bar */}
						{(roadmapItems.length > 0 || totalRoadmapTasks > 0) && (
							<div className="px-1">
								<div className="flex justify-between text-xs text-text/50 mb-1">
									<span>{completedRoadmapTasks} of {totalRoadmapTasks} tasks completed</span>
									<span>{userProgress}%</span>
								</div>
								<div className="w-full h-2 bg-text/10 rounded-full">
									<motion.div
										initial={{ width: 0 }}
										animate={{ width: `${userProgress}%` }}
										transition={{ duration: 1, ease: "easeOut" }}
										className="h-full bg-primary rounded-full"
									/>
								</div>
							</div>
						)}

						<div className="relative">
							<div className="absolute left-8 top-8 bottom-8 w-0.5 bg-text/20" />
							<div className="space-y-6">
								{loading ? (
									<div className="flex items-center justify-center py-12 text-text/40">
										<Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading roadmap...
									</div>
								) : roadmapItems.length === 0 ? (
									<p className="text-center text-text/40 py-8 ml-16">No roadmap items yet.</p>
								) : roadmapItems.map((item, index) => (
									<motion.div
										key={item.id}
										initial={{ opacity: 0, x: -20 }}
										animate={{ opacity: 1, x: 0 }}
										transition={{ delay: index * 0.07 }}
										className="relative"
									>
										<Card
											className={`ml-16 p-5 transition-all hover:shadow-lg ${
												item.current ? "ring-2 ring-primary shadow-lg" : ""
											}`}
										>
											{/* No card-level toggle.
											    The card used to call `onToggleRoadmapTask(item.id, …)`
											    with its OWN id. When the timeline held one card per
											    lesson that id was a real task; now the card is a whole
											    topic whose id is `module-N`, which is not a task at all
											    and would 404 server-side. Completion belongs to the
											    individual lessons in the dropdown, and a topic is done
											    only when all of them are — so there is nothing for a
											    click on the card itself to mean. */}
											{/* Timeline node */}
											<div className={`absolute -left-16 w-14 h-14 rounded-full flex items-center justify-center border-2 border-background ${
												item.completed ? "bg-green-500" : item.current ? "bg-primary" : "bg-text/20"
											}`}>
												{item.completed
													? <CheckCircle className="w-7 h-7 text-white" />
													: item.current
													? <PlayCircle className="w-7 h-7 text-white" />
													: <span className="text-white font-bold">{index + 1}</span>
												}
											</div>

											<div className="flex items-center justify-between">
												<div>
													<h3 className={`font-semibold text-text ${item.completed ? "line-through text-text/50" : ""}`}>
														{item.title}
													</h3>
													<p className="text-sm text-text/50 mt-0.5">
														Module {item.week || index + 1}{item.moduleTitle ? ` · ${item.moduleTitle}` : ""}
													</p>
													{item.current && (
														<div className="flex items-center mt-2 space-x-2">
															<Badge className="bg-primary/10 text-primary text-xs">Current</Badge>
															<Zap className="w-3 h-3 text-primary" />
														</div>
													)}
												</div>
												{/* "Continue" IS the topic dropdown trigger.
												    It used to be a bare <Button> with no onClick at all, so
												    pressing it did nothing and the subtopics below were
												    only reachable through a separate, easy-to-miss "N
												    subtopics" link. Two controls for one job, one of
												    them dead — hence "pressed Continue and nothing
												    happened". */}
												<Button
													variant="primary"
													size="sm"
													onClick={(e) => { e.stopPropagation(); toggleSubtopic(item.id); }}
													aria-expanded={expandedTopics.has(item.id)}
												>
													{expandedTopics.has(item.id) ? "Hide" : "Continue"}
													{expandedTopics.has(item.id)
														? <ChevronDown className="w-3 h-3 ml-1" />
														: <ArrowRight className="w-3 h-3 ml-1" />}
												</Button>
											</div>

										{getTopicSteps(item).length > 0 && (
										  <div className="mt-4 border-t border-text/10 pt-3">
										    {expandedTopics.has(item.id) && (
										      <motion.div
										        initial={{ opacity: 0, height: 0 }}
										        animate={{ opacity: 1, height: "auto" }}
										        className="mb-3 overflow-hidden"
										      >
										        <ul className="space-y-1.5">
										          {getTopicSteps(item).map((step) => (
										            <li key={step.id}>
										              {/* Each lesson is its own toggle. stopPropagation
										                  keeps the card's own click — which marks the
										                  whole topic done — from firing as well. */}
										              <button
										                type="button"
										                onClick={(e) => {
										                  e.stopPropagation();
										                  onToggleRoadmapTask?.(step.id, step.completed);
										                }}
										                className="w-full flex items-center gap-2.5 text-left px-2 py-1.5 rounded-lg hover:bg-text/[0.04] transition-colors"
										              >
										                {step.completed ? (
										                  <CheckCircle className="w-4 h-4 text-green-500 flex-shrink-0" />
										                ) : (
										                  <span className="w-4 h-4 rounded-full border-2 border-primary/40 flex-shrink-0" />
										                )}
										                <span className={`text-sm flex-1 ${step.completed ? "line-through text-text/40" : "text-text/80"}`}>
										                  {step.title}
										                </span>
										                {step.duration ? (
										                  <span className="text-xs text-text/40 flex-shrink-0">{step.duration}</span>
										                ) : null}
										              </button>
										            </li>
										          ))}
										        </ul>
										        {/* Concepts, when the wizard supplied additional ones beyond lessons */}
										        {(() => {
										          const stepTitles = new Set(
										            getTopicSteps(item).map(s => s.title.toLowerCase().replace(/^(study|practice|checkpoint):\s*/i, "").trim())
										          );
										          const filteredConcepts = getSubtopics(item).filter(sub => {
										            const norm = sub.toLowerCase().replace(/^(study|practice|checkpoint):\s*/i, "").trim();
										            return !stepTitles.has(norm);
										          });
										          if (filteredConcepts.length === 0) return null;
										          return (
										            <ul className="mt-2 pl-6 space-y-1 border-l border-text/10">
										              {filteredConcepts.map((sub, si) => {
										                const isDone = item.tasks?.[si]?.completed || item.completed;
										                return (
										                  <li key={si} className={`flex items-start gap-2 text-xs ${isDone ? "text-green-600 dark:text-green-400 line-through" : "text-text/60"}`}>
										                    {isDone ? (
										                      <CheckCircle className="w-3.5 h-3.5 text-green-500 flex-shrink-0 mt-0.5" />
										                    ) : (
										                      <span className="text-primary/60 mt-1.5 w-1 h-1 rounded-full bg-current flex-shrink-0" />
										                    )}
										                    {sub}
										                  </li>
										                );
										              })}
										            </ul>
										          );
										        })()}
										      </motion.div>
										    )}
										  </div>
										)}
										</Card>
									</motion.div>
								))}
							</div>
						</div>
					</div>
				)}

				{/* Quiz View */}
				{activeView === "quiz" && (
					<div className="p-4 space-y-6 h-full overflow-y-auto">
						<p className="text-text/60 flex items-center">
							<Brain className="w-4 h-4 mr-2 text-primary" />
							Test your knowledge and earn achievements
						</p>

						{/* Quiz result screen */}
						{quizResult && (
							<motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}>
								<Card className="p-8 text-center space-y-4">
									<div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${
										quizResult.scorePercent >= 80 ? "bg-green-500/20" : "bg-orange-500/20"
									}`}>
										<Trophy className={`w-10 h-10 ${quizResult.scorePercent >= 80 ? "text-green-500" : "text-orange-500"}`} />
									</div>
									<h3 className="text-2xl font-bold text-text">
										{quizResult.scorePercent >= 80 ? "Great job! 🎉" : "Keep practising!"}
									</h3>
									<p className="text-5xl font-bold text-primary">{quizResult.scorePercent}%</p>
									<p className="text-text/60">
										{quizResult.correctCount} / {quizResult.totalQuestions} correct
									</p>
									{/* Score bar */}
									<div className="w-full h-3 bg-text/10 rounded-full">
										<motion.div
											initial={{ width: 0 }}
											animate={{ width: `${quizResult.scorePercent}%` }}
											transition={{ duration: 1 }}
											className={`h-full rounded-full ${quizResult.scorePercent >= 80 ? "bg-green-500" : "bg-orange-500"}`}
										/>
									</div>
									{quizResult.earnedAchievement && (
										<div className="flex items-center gap-2 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl text-yellow-600 dark:text-yellow-400 text-sm font-medium">
											{/* The badge's own icon instead of a hardcoded trophy — the
											    generic 🏆 hid which achievement was actually earned. */}
											<AchievementIcon
												icon={quizResult.earnedAchievement.icon}
												size={18}
												className="shrink-0 text-yellow-600 dark:text-yellow-400"
											/>
											<span>Achievement unlocked: {quizResult.earnedAchievement.title}</span>
										</div>
									)}
									{quizResult.explanation && (
										<p className="text-sm text-text/60">{quizResult.explanation}</p>
									)}
									<Button
										variant="primary"
										onClick={() => {
											setQuizResult(null);
											setCurrentQuiz(null);
											setSelectedAnswers({});
											setQuizError("");
											if (roomData?.id) {
												getRoomQuizzes(roomData.id).then(res => setQuizzes(res.quizzes || [])).catch(() => {});
												getPastResults(roomData.id).then(res => setPastResults(res.results || [])).catch(() => {});
											}
										}}
									>
										Back to Quizzes
									</Button>
								</Card>
							</motion.div>
						)}

						{/* Quiz error */}
						{quizError && !quizResult && (
							<Card className="p-6 text-center border-red-500/40">
								<p className="text-sm text-red-500">{quizError}</p>
								<Button variant="ghost" className="mt-3" onClick={() => setQuizError("")}>
									Dismiss
								</Button>
							</Card>
						)}

						{/* Test hub — create one, or review past results.
						    Tests are NOT procreated: a room starts empty, and this is
						    where the learner asks for one covering today's topic. */}
						{!currentQuiz && !quizResult && (
							<div className="space-y-8">
								<Card className="p-6 text-center">
									<div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center mx-auto mb-4">
										<Brain className="w-7 h-7 text-primary" />
									</div>
									<h3 className="font-semibold text-text mb-1">Test yourself on today's topic</h3>
									<p className="text-sm text-text/60 mb-5">
										Generate a fresh test from what you covered today. Results are kept for 15 days.
									</p>
									<Button variant="primary" onClick={handleCreateTest} disabled={creatingTest}>
										{creatingTest ? (
											<>
												<Loader2 className="w-4 h-4 mr-2 animate-spin" /> Creating your test...
											</>
										) : (
											<>
												<ClipboardCheck className="w-4 h-4 mr-2" /> Create test
											</>
										)}
									</Button>
								</Card>

								{pastResults.length > 0 && (
									<div>
										<h3 className="text-sm font-semibold text-text mb-3">Your recent tests</h3>
										<div className="space-y-2">
											{pastResults.map((r, i) => (
												<div key={`${r.quizId}-${i}`} className="flex items-center justify-between p-3 rounded-xl border border-text/15 bg-background/50">
													<div className="min-w-0">
														<p className="text-sm font-medium text-text truncate">{r.quizTitle}</p>
														<p className="text-xs text-text/50">{formatResultDate(r.completedAt)}</p>
													</div>
													<span className={`text-sm font-semibold shrink-0 ${r.scorePercent >= 70 ? "text-green-500" : r.scorePercent >= 40 ? "text-yellow-500" : "text-red-500"}`}>
														{r.scorePercent}%
													</span>
												</div>
											))}
										</div>
										{/* The retention note sits directly under the list it
										    describes. A learner scrolling past the scores has to be
										    told that older attempts were dropped on purpose —
										    otherwise they hunt for a result that is simply gone. */}
										<p className="text-xs text-text/40 mt-3">
											Showing results from the past {resultsWindowDays} days. Anything older is no longer kept.
										</p>
									</div>
								)}

								{quizzes.length > 0 && (
									<div>
										<h3 className="text-sm font-semibold text-text mb-3">Tests you created</h3>
										<div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
											{quizzes.map((quiz, i) => (
												<motion.div key={quiz.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}>
													<Card className="p-6 hover:shadow-lg transition-shadow">
														<div className="flex items-start space-x-4 mb-4">
															<div className="w-14 h-14 bg-primary/20 rounded-xl flex items-center justify-center flex-shrink-0">
																<Brain className="w-7 h-7 text-primary" />
															</div>
															<div className="flex-1 min-w-0">
																<h3 className="font-semibold text-text">{quiz.title}</h3>
																<p className="text-sm text-text/60 mt-0.5">
																	{quiz.questionCount} questions · {quiz.durationMinutes} min
																</p>
															</div>
														</div>
														<Button
															variant={quiz.previousBestScore !== null ? "outline" : "primary"}
															className="w-full"
															onClick={() => {
																if (quiz.previousBestScore !== null) {
																	setQuizError("This test variant has already been submitted. Click 'Create test' above to generate a fresh variant!");
																	return;
																}
																handleStartQuiz(quiz);
															}}
														>
															{quiz.previousBestScore !== null ? `Submitted (${quiz.previousBestScore}%)` : "Start Test"}
															<PlayCircle className="w-4 h-4 ml-2" />
														</Button>
													</Card>
												</motion.div>
											))}
										</div>
									</div>
								)}
							</div>
						)}
						{/* Active quiz */}
						{currentQuiz && !quizResult && (
							<Card className="p-8">
								<div className="flex items-center justify-between mb-6">
									<h3 className="text-xl font-semibold text-text">{currentQuiz.title}</h3>
									<Badge className="bg-primary/10 text-primary">
										{answeredCount} / {activeQuestions.length} answered
									</Badge>
								</div>

								{/* Quiz progress bar */}
								<div className="w-full h-1.5 bg-text/10 rounded-full mb-8">
									<motion.div
										animate={{ width: `${quizProgressPercent}%` }}
										transition={{ duration: 0.3 }}
										className="h-full bg-primary rounded-full"
									/>
								</div>

								<div className="space-y-8">
									{activeQuestions.map((question, index) => (
										<motion.div
											key={question.id}
											initial={{ opacity: 0, y: 16 }}
											animate={{ opacity: 1, y: 0 }}
											transition={{ delay: index * 0.08 }}
											className="space-y-3"
										>
											<h4 className="font-medium text-text">
												{index + 1}. {question.question}
											</h4>
											<div className="grid grid-cols-1 gap-2">
												{(Array.isArray(question.options) ? question.options : []).map((option, optIdx) => (
													<motion.button
														key={optIdx}
														whileHover={{ scale: 1.01 }}
														whileTap={{ scale: 0.99 }}
														onClick={() => handleQuizAnswer(question.id, optIdx)}
														className={`p-4 text-left border rounded-xl transition-all ${
															selectedAnswers[question.id] === optIdx
																? "border-primary bg-primary/10 text-primary font-medium"
																: "border-text/20 hover:bg-alt/20 text-text"
														}`}
													>
														<span className="font-semibold mr-2">{String.fromCharCode(65 + optIdx)}.</span>
														{option}
													</motion.button>
												))}
											</div>
										</motion.div>
									))}
								</div>

								<div className="flex justify-between mt-10">
									<Button variant="ghost" onClick={() => { setCurrentQuiz(null); setSelectedAnswers({}); setQuizError(""); }}>
										Cancel
									</Button>
									<Button
										variant="primary"
										onClick={submitQuiz}
										disabled={quizSubmitting || activeQuestions.length === 0 || answeredCount < activeQuestions.length}
									>
										{quizSubmitting
											? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Submitting...</>
											: <><Award className="w-4 h-4 mr-2" /> Submit Quiz</>
										}
									</Button>
								</div>
							</Card>
						)}
					</div>
				)}

				{/* Kanban View */}
				{activeView === "kanban" && (
					<div className="py-6 h-full flex flex-col mx-6">
						<KanbanView roomData={roomData} />
					</div>
				)}
			</div>

			{/* Right Members Panel */}
			<AnimatePresence>
				{showMembers && (
					<motion.div
						initial={{ x: 320, opacity: 0 }}
						animate={{ x: 0, opacity: 1 }}
						exit={{ x: 320, opacity: 0 }}
						transition={{ duration: 0.3, ease: "easeInOut" }}
						className="w-80 bg-background/60 backdrop-blur-sm border-l border-text/10 p-6 overflow-y-auto md:mr-5"
					>
						<div className="flex items-center space-x-2 mb-6">
							<Users className="w-5 h-5 text-text/60" />
							<h3 className="font-semibold text-text">Members</h3>
							<Badge className="bg-primary/10 text-primary">{members.length}</Badge>
						</div>

						{/* Room-wide progress bar */}
						{members.length > 0 && (
							<div className="mb-5">
								<div className="flex justify-between text-xs text-text/50 mb-1">
									<span>Room average</span>
									<span>{roomData.completionRate ?? 0}%</span>
								</div>
								<div className="w-full h-2 bg-text/10 rounded-full">
									<motion.div
										initial={{ width: 0 }}
										animate={{ width: `${roomData.completionRate ?? 0}%` }}
										transition={{ duration: 1 }}
										className="h-full bg-primary rounded-full"
									/>
								</div>
							</div>
						)}

						<div className="space-y-3">
							{members.map((member, index) => (
								<motion.div
									key={member.id}
									initial={{ opacity: 0, x: 20 }}
									animate={{ opacity: 1, x: 0 }}
									transition={{ delay: index * 0.05 }}
								>
									<Card className={`p-4 transition-all hover:shadow-md ${member.isCurrentUser ? "ring-2 ring-primary/30" : ""}`}>
										<div className="flex items-center space-x-3">
											<div className="relative flex-shrink-0">
												{member.avatarUrl ? (
													<img src={member.avatarUrl} alt={member.name} className="w-11 h-11 rounded-full object-cover" />
												) : (
													<div className="w-11 h-11 bg-primary/20 rounded-full flex items-center justify-center">
														<span className="text-primary font-semibold">{(member.name || "?").charAt(0).toUpperCase()}</span>
													</div>
												)}
												{member.isCurrentUser && (
													<Crown className="absolute -top-1 -right-1 w-4 h-4 text-yellow-500" />
												)}
												<Circle className="absolute -bottom-0.5 -right-0.5 w-3 h-3 text-green-500 fill-current" />
											</div>

											<div className="flex-1 min-w-0">
												<div className="flex items-center justify-between">
													<p className="font-medium text-text truncate text-sm">
														{member.name}
														{member.isCurrentUser && <span className="text-primary text-xs ml-1">(You)</span>}
													</p>
													<span className="text-sm font-bold text-text ml-2">{member.progress ?? 0}%</span>
												</div>
												<span className={`text-xs font-medium capitalize ${getStatusColor(member.status)}`}>
													{member.status ? member.status.replace("-", " ") : "unknown"}
												</span>
												{/* Per-member progress bar */}
												<div className="w-full h-1.5 bg-text/10 rounded-full mt-2">
													<motion.div
														initial={{ width: 0 }}
														animate={{ width: `${member.progress ?? 0}%` }}
														transition={{ duration: 0.8, delay: index * 0.08 }}
														className={`h-full rounded-full ${getStatusBarColor(member.status)}`}
													/>
												</div>
											</div>
										</div>
									</Card>
								</motion.div>
							))}
						</div>
					</motion.div>
				)}
			</AnimatePresence>

			<AnimatePresence>
				{showReplanModal && (
					<ReplanModal
						currentDailyTime={roomData.daily_time || roomData.dailyTime}
						currentAvailability={roomData.availability}
						onReplan={async (opts) => {
							if (onReplanRoadmap) {
								await onReplanRoadmap(opts);
							}
						}}
						onClose={() => setShowReplanModal(false)}
					/>
				)}
			</AnimatePresence>
		</div>
	);
};

export default RoomContent;
