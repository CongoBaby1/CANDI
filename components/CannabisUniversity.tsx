import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Leaf, Package, ShoppingCart, Wind, ShieldCheck, 
  Beaker, Sprout, Cookie, Users, HelpCircle, 
  ChevronRight, BookOpen, Clock, ArrowLeft
} from 'lucide-react';
import { UNIVERSITY_CATEGORIES, LESSONS } from '../data/cannabisUniversity';

const CannabisUniversity: React.FC = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const filteredLessons = LESSONS.filter(lesson => {
    const matchesCategory = !selectedCategory || lesson.category === selectedCategory;
    return matchesCategory;
  });

  const getIcon = (iconName: string) => {
    const icons: Record<string, any> = {
      Leaf, Package, ShoppingCart, Wind, ShieldCheck, 
      Beaker, Sprout, Cookie, Users, HelpCircle
    };
    const IconComponent = icons[iconName] || HelpCircle;
    return <IconComponent className="w-6 h-6" />;
  };

  return (
    <div className="min-h-screen pt-12 md:pt-20 pb-32 px-4 md:px-8 max-w-7xl mx-auto">
      {/* Floating Back Button */}
      <div className="fixed bottom-6 right-4 md:bottom-10 md:right-16 z-[60]">
        <Link 
          to="/" 
          className="flex flex-col items-center gap-2 group pointer-events-auto"
        >
          <div className="w-14 h-14 md:w-20 md:h-20 rounded-full bg-emerald-950/90 text-emerald-400 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl group-hover:scale-110 group-hover:border-emerald-500/50 transition-all duration-300">
            <ArrowLeft className="w-6 h-6 md:w-8 md:h-8" />
          </div>
          <span className="font-bold uppercase tracking-widest text-[9px] md:text-[10px] text-emerald-400/70 group-hover:text-emerald-400 transition-colors">Home</span>
        </Link>
      </div>

      {/* Hero Section */}
      <motion.section 
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="text-center mb-16"
      >
        <span className="inline-block px-4 py-1.5 mb-4 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold tracking-widest uppercase font-mono">
          Educational Center
        </span>
        <h1 className="text-5xl md:text-7xl font-black text-white tracking-tighter mb-6 drop-shadow-2xl">
          CANNABIS <span className="text-emerald-400">UNIVERSITY</span>
        </h1>
        <p className="text-emerald-100/70 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed">
          Learn the basics of cannabis, products, effects, safety, and growing in one beginner-friendly place.
        </p>
        <div className="mt-8">
          <button 
            onClick={() => {
              // Navigate to the first lesson
              if (LESSONS.length > 0) {
                navigate(`/cannabis-university/lesson/${LESSONS[0].id}`);
              }
            }}
            className="px-8 py-4 bg-emerald-500 hover:bg-emerald-400 text-[#064e3b] font-bold rounded-2xl transition-all hover:scale-105 active:scale-95 shadow-[0_0_20px_rgba(16,185,129,0.3)]"
          >
            Start Learning
          </button>
        </div>
      </motion.section>

      {/* Category Cards */}
      <section id="categories" className="mb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
            <BookOpen className="text-emerald-400" />
            Exploration Hub
          </h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {UNIVERSITY_CATEGORIES.map((category, idx) => (
            <motion.div
              key={category.id}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              transition={{ delay: idx * 0.05 }}
              viewport={{ once: true }}
              onClick={() => {
                // Find first lesson in this category and navigate to it
                const firstLesson = LESSONS.find(l => l.category === category.title);
                if (firstLesson) {
                  navigate(`/cannabis-university/lesson/${firstLesson.id}`);
                } else {
                  setSelectedCategory(selectedCategory === category.title ? null : category.title);
                }
              }}
              className={`group p-6 border rounded-3xl transition-all cursor-pointer backdrop-blur-sm ${
                selectedCategory === category.title
                ? 'bg-emerald-500/20 border-emerald-500 shadow-[0_0_20px_rgba(16,185,129,0.2)]' 
                : 'bg-[#064e3b]/30 border-emerald-500/10 hover:border-emerald-500/40'
              }`}
            >
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-4 transition-transform group-hover:scale-110 ${
                selectedCategory === category.title ? 'bg-emerald-500 text-[#064e3b]' : 'bg-emerald-500/20 text-emerald-400'
              }`}>
                {getIcon(category.icon)}
              </div>
              <h3 className={`font-bold mb-2 transition-colors ${
                selectedCategory === category.title ? 'text-emerald-400' : 'text-white group-hover:text-emerald-400'
              }`}>
                {category.title}
              </h3>
              <p className="text-emerald-100/50 text-sm leading-snug">{category.description}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Lessons Catalog */}
      <section className="mb-20">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <h2 className="text-2xl font-bold text-white tracking-tight">
            {selectedCategory ? `${selectedCategory} Lessons` : 'All Lessons'} 
            <span className="ml-3 text-emerald-100/30 text-sm font-mono font-normal">({filteredLessons.length})</span>
          </h2>
          {selectedCategory && (
            <button 
              onClick={() => setSelectedCategory(null)}
              className="text-xs font-bold text-emerald-400 uppercase tracking-widest hover:text-white transition-colors"
            >
              Clear Filter
            </button>
          )}
        </div>
        
        {filteredLessons.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson, idx) => (
              <motion.div
                key={lesson.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: idx * 0.05 }}
                onClick={() => navigate(`/cannabis-university/lesson/${lesson.id}`)}
                className="flex flex-col bg-white/[0.03] border border-emerald-500/10 rounded-3xl overflow-hidden hover:border-emerald-500/50 transition-all cursor-pointer group hover:bg-white/[0.05]"
              >
                <div className="p-8">
                  <div className="flex justify-between items-start mb-4">
                    <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-400 text-xs font-bold uppercase tracking-wider">
                      {lesson.category}
                    </span>
                    <div className="flex items-center gap-1 text-emerald-100/40 text-xs font-mono">
                      <Clock className="w-3 h-3" />
                      5 min
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3 group-hover:text-emerald-400 transition-colors">
                    {lesson.title}
                  </h3>
                  <p className="text-emerald-100/60 text-sm line-clamp-2 mb-6">
                    {lesson.summary}
                  </p>
                  <div className="mt-auto flex items-center justify-between">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded border uppercase ${
                      lesson.level === 'Beginner' ? 'border-emerald-500/30 text-emerald-400' : 'border-amber-500/30 text-amber-400'
                    }`}>
                      {lesson.level}
                    </span>
                    <span className="text-emerald-400 flex items-center gap-1 text-sm font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                      Start <ChevronRight className="w-4 h-4" />
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20 bg-white/5 rounded-3xl border border-dashed border-emerald-500/20">
            <p className="text-emerald-100/40 font-medium">No lessons found matching your criteria.</p>
            <button 
              onClick={() => { setSelectedCategory(null); }}
              className="mt-4 text-emerald-400 text-sm font-bold underline"
            >
              Reset all filters
            </button>
          </div>
        )}
      </section>

      {/* Disclaimer */}
      <footer className="text-center pb-12 border-t border-emerald-500/10 pt-12">
        <p className="text-emerald-100/30 text-xs max-w-2xl mx-auto leading-relaxed uppercase tracking-widest font-mono">
          Cannabis University is for educational purposes only. Cannabis laws vary by location. Always follow local laws, consume responsibly, and consult a qualified professional for medical advice.
        </p>
      </footer>
    </div>
  );
};

export default CannabisUniversity;