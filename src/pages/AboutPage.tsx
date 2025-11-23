import { motion } from 'framer-motion';
import { PageHeader } from '../components/layout';
import { Sparkles, Target, Trophy, GraduationCap, BookOpen, Users } from 'lucide-react';

export function AboutPage() {
  return (
    <>
      <PageHeader
        title="About Us"
        description="Sophia Prep empowers students to excel in JAMB and WAEC through engaging practice, mock exams, and guided study."
        icon={<Sparkles className="w-8 h-8" />}
        breadcrumbs={[{ label: 'About Us' }]}
      />

      <div className="container mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 bg-white rounded-xl shadow-md p-6">
            <motion.h2 initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="text-2xl font-bold mb-4">Our Mission</motion.h2>
            <p className="text-gray-700 leading-relaxed mb-6">We provide a joyful, effective path to exam success. With interactive quizzes, realistic mock exams, and curated study guides, Sophia Prep helps learners build confidence and mastery across Science, Commercial, Arts, and Languages.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 rounded-lg bg-blue-50">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2"><Target className="w-6 h-6 text-blue-600" /></div>
                <div className="font-semibold">Focused Practice</div>
                <div className="text-sm text-gray-600">Practice by subject, topic, year, and exam type.</div>
              </div>
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#FDF6E8' }}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-2" style={{ backgroundColor: '#F5EBCF' }}><Trophy className="w-6 h-6" style={{ color: '#B78628' }} /></div>
                <div className="font-semibold">Real Mock Exams</div>
                <div className="text-sm text-gray-600">Timed sessions with instant feedback and scoring.</div>
              </div>
              <div className="p-4 rounded-lg bg-green-50">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center mb-2"><GraduationCap className="w-6 h-6 text-green-600" /></div>
                <div className="font-semibold">Guided Study</div>
                <div className="text-sm text-gray-600">Clear paths to master essential exam topics.</div>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center"><BookOpen className="w-6 h-6 text-purple-600" /></div>
              <div className="text-xl font-semibold">Why Sophia Prep</div>
            </div>
            <ul className="space-y-3 text-gray-700">
              <li>Interactive questions with clean explanations</li>
              <li>Compact filters that keep context via URL</li>
              <li>Beautiful, responsive UI and subtle animations</li>
              <li>Subject combinations tailored to your goals</li>
              <li>Reliable data flow backed by Supabase</li>
            </ul>
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2, duration: 0.5 }} className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-3"><Users className="w-8 h-8 text-indigo-600" /></div>
            <div className="text-2xl font-bold">Community</div>
            <div className="text-gray-600">Join thousands of learners preparing with excellence.</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-emerald-100 mb-3"><Trophy className="w-8 h-8 text-emerald-600" /></div>
            <div className="text-2xl font-bold">Results</div>
            <div className="text-gray-600">Track progress and celebrate improvements.</div>
          </div>
          <div className="bg-white rounded-xl shadow p-6 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-amber-100 mb-3"><Target className="w-8 h-8 text-amber-600" /></div>
            <div className="text-2xl font-bold">Focus</div>
            <div className="text-gray-600">Stay organized with subject, year, and exam type filters.</div>
          </div>
        </motion.div>
      </div>
    </>
  );
}