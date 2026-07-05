import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  CheckCircle2, 
  XCircle, 
  Clock, 
  Trophy,
  RefreshCw,
  Sparkles,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { aiService } from '../../../services/aiService';

/**
 * QuizDashboard Component
 * Fetches and displays AI-generated quizzes based on user's learning progress
 */
const QuizDashboard = ({ roomId, topic = null, difficulty = 'Medium', count = 5 }) => {
  const [quiz, setQuiz] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [showResults, setShowResults] = useState(false);
  const [quizStarted, setQuizStarted] = useState(false);

  const fetchQuiz = async () => {
    setLoading(true);
    setError('');
    try {
      let response;
      if (roomId) {
        // Fetch room-specific quiz based on progress
        response = await aiService.generateRoomQuiz(roomId, { topic, difficulty, count });
      } else {
        // Fetch generic quiz
        response = await aiService.generateQuiz({ topic, difficulty, count });
      }

      if (response.success && response.quiz) {
        setQuiz(response.quiz);
        setQuizStarted(false);
        setCurrentQuestionIndex(0);
        setSelectedAnswers({});
        setShowResults(false);
      } else {
        throw new Error('Failed to load quiz');
      }
    } catch (err) {
      console.error('Quiz fetch error:', err);
      setError(err.message || 'Failed to load quiz. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchQuiz();
  }, [roomId, topic, difficulty, count]);

  const handleStartQuiz = () => {
    setQuizStarted(true);
  };

  const handleAnswerSelect = (questionIndex, answerIndex) => {
    if (showResults) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionIndex]: answerIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < quiz.items.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmit = () => {
    setShowResults(true);
  };

  const calculateScore = () => {
    if (!quiz) return 0;
    let correct = 0;
    quiz.items.forEach((item, index) => {
      if (selectedAnswers[index] === item.correctAnswer) {
        correct++;
      }
    });
    return {
      correct,
      total: quiz.items.length,
      percentage: (correct / quiz.items.length) * 100
    };
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
        >
          <Brain className="w-16 h-16 text-purple-600" />
        </motion.div>
        <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
          Generating your personalized quiz...
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
        <p className="text-lg text-red-600 dark:text-red-400 mb-4">{error}</p>
        <button
          onClick={fetchQuiz}
          className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!quiz) return null;

  // Welcome Screen
  if (!quizStarted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-2xl mx-auto"
      >
        <div className="bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl p-8 text-white shadow-2xl">
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className="w-8 h-8" />
            <h2 className="text-3xl font-bold">AI-Generated Quiz</h2>
          </div>
          
          <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 mb-6">
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <div className="text-sm opacity-75 mb-1">Topic</div>
                <div className="text-xl font-bold">{quiz.topic}</div>
              </div>
              <div>
                <div className="text-sm opacity-75 mb-1">Difficulty</div>
                <div className="text-xl font-bold">{quiz.difficulty}</div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm opacity-90">
              <BookOpen className="w-4 h-4" />
              <span>{quiz.items.length} questions • ~{quiz.items.length * 2} minutes</span>
            </div>
          </div>

          <p className="text-lg opacity-90 mb-6">
            Test your knowledge and track your progress. Each question is designed to challenge your understanding.
          </p>

          <button
            onClick={handleStartQuiz}
            className="w-full py-4 bg-white text-purple-600 rounded-xl font-bold text-lg
                     hover:bg-gray-100 transition-all duration-200 shadow-lg hover:shadow-xl
                     flex items-center justify-center gap-2"
          >
            Start Quiz
            <ArrowRight className="w-5 h-5" />
          </button>
        </div>
      </motion.div>
    );
  }

  const currentQuestion = quiz.items[currentQuestionIndex];
  const score = showResults ? calculateScore() : null;

  // Results Screen
  if (showResults) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="max-w-3xl mx-auto"
      >
        {/* Score Header */}
        <div className={`rounded-2xl p-8 text-white shadow-2xl mb-6 ${
          score.percentage >= 80 ? 'bg-gradient-to-br from-green-500 to-emerald-600' :
          score.percentage >= 60 ? 'bg-gradient-to-br from-blue-500 to-cyan-600' :
          'bg-gradient-to-br from-orange-500 to-red-600'
        }`}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="w-10 h-10" />
              <h2 className="text-3xl font-bold">Quiz Complete!</h2>
            </div>
            <div className="text-right">
              <div className="text-5xl font-bold">{Math.round(score.percentage)}%</div>
              <div className="text-sm opacity-90">Score</div>
            </div>
          </div>
          
          <div className="bg-white/20 backdrop-blur-sm rounded-xl p-4">
            <div className="flex items-center justify-between text-lg">
              <span>{score.correct} out of {score.total} correct</span>
              <button
                onClick={fetchQuiz}
                className="flex items-center gap-2 px-4 py-2 bg-white/20 hover:bg-white/30 rounded-lg transition-colors"
              >
                <RefreshCw className="w-4 h-4" />
                New Quiz
              </button>
            </div>
          </div>
        </div>

        {/* Detailed Results */}
        <div className="space-y-4">
          {quiz.items.map((item, index) => {
            const userAnswer = selectedAnswers[index];
            const isCorrect = userAnswer === item.correctAnswer;

            return (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className={`bg-white dark:bg-gray-800 rounded-xl p-6 shadow-lg border-2 ${
                  isCorrect ? 'border-green-300 dark:border-green-700' : 'border-red-300 dark:border-red-700'
                }`}
              >
                <div className="flex items-start gap-3 mb-4">
                  {isCorrect ? (
                    <CheckCircle2 className="w-6 h-6 text-green-600 flex-shrink-0 mt-1" />
                  ) : (
                    <XCircle className="w-6 h-6 text-red-600 flex-shrink-0 mt-1" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-gray-100 mb-3">
                      {index + 1}. {item.question}
                    </h3>

                    <div className="space-y-2 mb-4">
                      {item.options.map((option, optionIndex) => {
                        const isUserAnswer = userAnswer === optionIndex;
                        const isCorrectAnswer = item.correctAnswer === optionIndex;

                        return (
                          <div
                            key={optionIndex}
                            className={`p-3 rounded-lg border-2 ${
                              isCorrectAnswer
                                ? 'bg-green-50 dark:bg-green-900/20 border-green-300 dark:border-green-700'
                                : isUserAnswer
                                ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700'
                                : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600'
                            }`}
                          >
                            <div className="flex items-center justify-between">
                              <span className={`${
                                isCorrectAnswer || isUserAnswer ? 'font-bold' : ''
                              } text-gray-900 dark:text-gray-100`}>
                                {option}
                              </span>
                              {isCorrectAnswer && (
                                <CheckCircle2 className="w-5 h-5 text-green-600" />
                              )}
                              {isUserAnswer && !isCorrectAnswer && (
                                <XCircle className="w-5 h-5 text-red-600" />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Explanation */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-4">
                      <div className="font-semibold text-blue-900 dark:text-blue-300 mb-2">
                        💡 Explanation:
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {item.explanation}
                      </p>
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    );
  }

  // Quiz Question Screen
  return (
    <div className="max-w-3xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-2">
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            Question {currentQuestionIndex + 1} of {quiz.items.length}
          </span>
          <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
            {Object.keys(selectedAnswers).length}/{quiz.items.length} answered
          </span>
        </div>
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <motion.div 
            className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
            initial={{ width: 0 }}
            animate={{ width: `${((currentQuestionIndex + 1) / quiz.items.length) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Question Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentQuestionIndex}
          initial={{ opacity: 0, x: 50 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -50 }}
          className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl p-8"
        >
          <h3 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-6">
            {currentQuestion.question}
          </h3>

          <div className="space-y-3 mb-8">
            {currentQuestion.options.map((option, index) => {
              const isSelected = selectedAnswers[currentQuestionIndex] === index;

              return (
                <button
                  key={index}
                  onClick={() => handleAnswerSelect(currentQuestionIndex, index)}
                  className={`w-full p-4 rounded-xl text-left border-2 transition-all duration-200
                    ${isSelected
                      ? 'bg-purple-50 dark:bg-purple-900/20 border-purple-500 ring-2 ring-purple-200 dark:ring-purple-800'
                      : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 hover:border-purple-300 dark:hover:border-purple-700'
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center
                      ${isSelected 
                        ? 'bg-purple-600 border-purple-600' 
                        : 'border-gray-300 dark:border-gray-600'
                      }`}
                    >
                      {isSelected && <div className="w-3 h-3 bg-white rounded-full" />}
                    </div>
                    <span className={`flex-1 ${isSelected ? 'font-semibold' : ''} text-gray-900 dark:text-gray-100`}>
                      {option}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation Buttons */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-6 py-3 rounded-lg border-2 border-gray-300 dark:border-gray-600
                       text-gray-700 dark:text-gray-300 font-medium
                       hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors
                       disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>

            {currentQuestionIndex === quiz.items.length - 1 ? (
              <button
                onClick={handleSubmit}
                disabled={Object.keys(selectedAnswers).length < quiz.items.length}
                className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-600 to-pink-600
                         text-white font-bold hover:shadow-lg transition-all duration-200
                         disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                Submit Quiz
                <CheckCircle2 className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={handleNext}
                className="px-8 py-3 rounded-lg bg-purple-600 hover:bg-purple-700
                         text-white font-bold transition-colors flex items-center gap-2"
              >
                Next
                <ArrowRight className="w-5 h-5" />
              </button>
            )}
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
};

export default QuizDashboard;
