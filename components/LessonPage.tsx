import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { 
  BookOpen, Clock, AlertTriangle, Lightbulb, 
  ArrowLeft, ChevronRight, ChevronLeft, X
} from 'lucide-react';
import { LESSONS } from '../data/cannabisUniversity';
import { Lesson } from '../types';

const LessonPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [quizFeedback, setQuizFeedback] = useState<{ isCorrect: boolean; message: string } | null>(null);
  
  const lessonIndex = LESSONS.findIndex(l => l.id === id);
  const lesson = LESSONS[lessonIndex];
  const prevLesson = lessonIndex > 0 ? LESSONS[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < LESSONS.length - 1 ? LESSONS[lessonIndex + 1] : null;

  if (!lesson) {
    return (
      <div className="min-h-screen pt-20 pb-32 px-4 flex flex-col items-center justify-center text-center">
        <div className="bg-[#064e3b]/80 backdrop-blur-xl border border-emerald-500/20 rounded-[2.5rem] p-12 max-w-md">
          <h2 className="text-2xl font-black text-white mb-4">Lesson Not Found</h2>
          <p className="text-emerald-100/60 mb-8">This lesson doesn't exist or has been removed.</p>
          <button
            onClick={() => navigate('/cannabis-university')}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#064e3b] font-bold rounded-2xl transition-all"
          >
            Back to University
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pt-16 md:pt-20 pb-32 px-4 md:px-8 max-w-4xl mx-auto">
      {/* Back Button */}
      <div className="fixed bottom-6 left-4 md:left-8 z-[60]">
        <button
          onClick={() => navigate('/cannabis-university')}
          className="flex flex-col items-center gap-2 group pointer-events-auto"
        >
          <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-emerald-950/90 text-emerald-400 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl group-hover:scale-110 group-hover:border-emerald-500/50 transition-all duration-300">
            <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <span className="font-bold uppercase tracking-widest text-[9px] md:text-[10px] text-emerald-400/70 group-hover:text-emerald-400 transition-colors">Back</span>
        </button>
      </div>

      {/* Lesson Content */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#064e3b]/80 backdrop-blur-xl border border-emerald-500/20 rounded-[2.5rem] p-8 md:p-12 shadow-2xl"
      >
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <span className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-bold uppercase tracking-wider">
            {lesson.category}
          </span>
          <span className="text-emerald-100/40 text-xs font-mono">• {lesson.level}</span>
          <span className="text-emerald-100/40 text-xs font-mono flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" /> 5 min
          </span>
        </div>

        <h1 className="text-3xl md:text-5xl font-black text-white tracking-tighter mb-8">
          {lesson.title}
        </h1>

        {/* Summary */}
        <p className="text-emerald-100/80 text-lg leading-relaxed mb-10">
          {lesson.summary}
        </p>

        {/* Key Points */}
        <div className="mb-10">
          <h4 className="flex items-center gap-2 text-emerald-400 font-bold mb-6 uppercase tracking-widest text-xs">
            <BookOpen className="w-4 h-4" /> Key Points
          </h4>
          <div className="grid gap-4">
            {lesson.keyPoints.map((point, i) => (
              <div key={i} className="flex items-start gap-3 bg-white/[0.03] border border-emerald-500/10 rounded-2xl p-5">
                <div className="mt-1.5 w-2 h-2 rounded-full bg-emerald-500 shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)]" />
                <span className="text-emerald-100/70 text-sm leading-relaxed">{point}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Tips Grid */}
        <div className="grid md:grid-cols-2 gap-4 mb-10">
          <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-2xl">
            <h4 className="flex items-center gap-2 text-rose-400 font-bold mb-3 uppercase tracking-widest text-[10px]">
              <AlertTriangle className="w-4 h-4" /> Common Mistake
            </h4>
            <p className="text-rose-100/70 text-sm leading-relaxed">{lesson.commonMistake}</p>
          </div>
          <div className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
            <h4 className="flex items-center gap-2 text-emerald-400 font-bold mb-3 uppercase tracking-widest text-[10px]">
              <Lightbulb className="w-4 h-4" /> Quick Tip
            </h4>
            <p className="text-emerald-100/70 text-sm leading-relaxed">{lesson.quickTip}</p>
          </div>
        </div>

        {/* Quiz */}
        <div className="border-t border-white/5 pt-10">
          <h4 className="flex items-center gap-2 text-white font-bold mb-6 uppercase tracking-widest text-xs">
            Mini Quiz
          </h4>
          <div className="bg-black/20 rounded-2xl p-8 border border-white/5">
            <p className="text-emerald-100 font-medium mb-6 text-center text-lg">{lesson.quiz.question}</p>
            <div className="grid gap-3 max-w-lg mx-auto">
              {lesson.quiz.options?.map((opt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (opt === lesson.quiz.answer) {
                      setQuizFeedback({ isCorrect: true, message: "Correct! Legend status." });
                    } else {
                      setQuizFeedback({ isCorrect: false, message: "Not quite, but keep learning!" });
                    }
                  }}
                  className={`py-4 px-6 rounded-xl border transition-all font-medium text-sm ${
                    quizFeedback?.isCorrect && opt === lesson.quiz.answer
                    ? 'bg-emerald-500/20 border-emerald-500 text-white shadow-[0_0_15px_rgba(16,185,129,0.2)]'
                    : 'bg-white/5 border-white/10 text-white hover:bg-emerald-500/20 hover:border-emerald-500/40'
                  }`}
                >
                  {opt}
                </button>
              ))}
            </div>
            {quizFeedback && (
              <motion.p
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className={`mt-6 font-bold text-sm text-center ${quizFeedback.isCorrect ? 'text-emerald-400' : 'text-rose-400'}`}
              >
                {quizFeedback.message}
              </motion.p>
            )}
          </div>
        </div>
      </motion.div>

      {/* Previous / Next Navigation */}
      <div className="flex justify-between mt-8 gap-4">
        {prevLesson ? (
          <button
            onClick={() => { navigate(`/cannabis-university/lesson/${prevLesson.id}`); setQuizFeedback(null); }}
            className="flex items-center gap-2 px-6 py-4 bg-[#064e3b]/80 backdrop-blur-xl border border-emerald-500/20 rounded-2xl text-emerald-400 hover:border-emerald-500/50 transition-all group"
          >
            <ChevronLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" />
            <div className="text-left">
              <div className="text-[9px] uppercase tracking-widest text-emerald-100/40 font-bold">Previous</div>
              <div className="text-sm font-bold text-white">{prevLesson.title}</div>
            </div>
          </button>
        ) : <div />}
        {nextLesson ? (
          <button
            onClick={() => { navigate(`/cannabis-university/lesson/${nextLesson.id}`); setQuizFeedback(null); }}
            className="flex items-center gap-2 px-6 py-4 bg-[#064e3b]/80 backdrop-blur-xl border border-emerald-500/20 rounded-2xl text-emerald-400 hover:border-emerald-500/50 transition-all group"
          >
            <div className="text-right">
              <div className="text-[9px] uppercase tracking-widest text-emerald-100/40 font-bold">Next</div>
              <div className="text-sm font-bold text-white">{nextLesson.title}</div>
            </div>
            <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          </button>
        ) : <div />}
      </div>
    </div>
  );
};

export default LessonPage;