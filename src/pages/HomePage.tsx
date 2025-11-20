import { Link } from 'react-router-dom';
import { BookOpen, Target, Trophy, GraduationCap, Clock, Users, Menu } from 'lucide-react';
import { useState, useEffect } from 'react';
import { Layout } from '../components/layout';

export function HomePage() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [imageVisible, setImageVisible] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setImageVisible(true), 80);
    return () => clearTimeout(t);
  }, []);

  return (
    <Layout>
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-600">

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 sophia-grid-bg opacity-20" />
        
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="flex flex-col md:flex-row sm:items-center justify-between gap-12">
            {/* Hero Content */}
            <div className="flex-1 text-white space-y-6 text-center md:text-left">
  <div className="flex flex-col md:flex-row items-center md:items-start gap-3 mb-4">
    <div>
      <h1 className="text-4xl md:text-6xl font-bold text-yellow-400">
        Sophia Prep
      </h1>
    </div>
  </div>
  
  <p className="text-xl md:text-2xl text-blue-100">
    Your Complete JAMB & WAEC Exam Preparation Platform
  </p>
  
  <p className="text-lg text-blue-200 max-w-2xl mx-auto md:mx-0">
    Master your exams with interactive quizzes, comprehensive study materials, 
    and personalized progress tracking. Join thousands of students achieving 
    excellence in their JAMB and WAEC examinations.
  </p>
  
  <div className="flex flex-col sm:flex-row gap-4 pt-4 justify-center items-center md:justify-start md:items-start">
    <Link
      to="/subjects"
      className="px-8 py-4 bg-yellow-400 text-blue-900 rounded-lg font-semibold 
               hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg"
    >
      Start Practicing
    </Link>
    <Link
      to="/mock-exams"
      className="px-8 py-4 bg-blue-600 text-white rounded-lg font-semibold 
               hover:bg-blue-700 transition-all border-2 border-white"
    >
      Take Mock Exam
    </Link>
  </div>
</div>


            {/* Hero Image/Illustration */}
            <div className="flex-1 flex justify-center">
              <img
                src="/sophiahero2.png"
                alt="Hero Image"
                className={`w-80 h-80 sm:w-96 sm:h-96 md:w-[460px] md:h-[460px] lg:w-[620px] lg:h-[620px] object-contain transform transition-transform duration-700 ease-out ${imageVisible ? 'translate-x-0 opacity-100' : '-translate-x-6 opacity-0'}`}
                sizes="(max-width: 640px) 320px, (max-width: 1024px) 460px, 620px"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Quick Access Cards */}
      <section className="container mx-auto px-4 py-12 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Quick Practice */}
          <Link
            to="/practice"
            className="sophia-card p-6 hover:shadow-xl transition-all transform hover:-translate-y-2 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Quick Practice</h3>
            </div>
            <p className="text-gray-600">
              Practice questions by subject and topic with instant feedback
            </p>
          </Link>

          {/* Mock Exams */}
          <Link
            to="/mock-exams"
            className="sophia-card p-6 hover:shadow-xl transition-all transform hover:-translate-y-2 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-yellow-100 rounded-lg group-hover:bg-yellow-200 transition-colors">
                <Target className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Mock Exams</h3>
            </div>
            <p className="text-gray-600">
              Full-length timed exams simulating real JAMB/WAEC conditions
            </p>
          </Link>

          {/* Quiz Categories */}
          <Link
            to="/subjects"
            className="sophia-card p-6 hover:shadow-xl transition-all transform hover:-translate-y-2 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
                <GraduationCap className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Subjects</h3>
            </div>
            <p className="text-gray-600">
              Browse all subjects and topics for JAMB and WAEC preparation
            </p>
          </Link>

          {/* Leaderboard */}
          <Link
            to="/leaderboard"
            className="sophia-card p-6 hover:shadow-xl transition-all transform hover:-translate-y-2 group"
          >
            <div className="flex items-center gap-4 mb-4">
              <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
                <Trophy className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800">Leaderboard</h3>
            </div>
            <p className="text-gray-600">
              Compete with other students and track your ranking
            </p>
          </Link>
        </div>
      </section>

      {/* Features Section */}
      <section className="bg-white py-16">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
              Why Choose Sophia Prep?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to excel in your JAMB and WAEC examinations
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-4">
                <BookOpen className="w-8 h-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Comprehensive Study Materials
              </h3>
              <p className="text-gray-600">
                Access official syllabi, topic summaries, past questions, and video lessons 
                for all JAMB and WAEC subjects
              </p>
            </div>

            {/* Feature 2 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-yellow-100 rounded-full mb-4">
                <Clock className="w-8 h-8 text-yellow-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Multiple Practice Modes
              </h3>
              <p className="text-gray-600">
                Practice Mode, Mock Exams, Reader Mode, and Past Questions - 
                choose the mode that fits your learning style
              </p>
            </div>

            {/* Feature 3 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-green-100 rounded-full mb-4">
                <Target className="w-8 h-8 text-green-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Performance Analytics
              </h3>
              <p className="text-gray-600">
                Track your progress, identify weak areas, and get personalized 
                recommendations to improve your scores
              </p>
            </div>

            {/* Feature 4 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-full mb-4">
                <Users className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Community Support
              </h3>
              <p className="text-gray-600">
                Join our WhatsApp and Telegram groups, access one-on-one tutoring, 
                and connect with fellow students
              </p>
            </div>

            {/* Feature 5 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-red-100 rounded-full mb-4">
                <Trophy className="w-8 h-8 text-red-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Gamified Learning
              </h3>
              <p className="text-gray-600">
                Earn points, unlock achievements, and compete on the leaderboard 
                to stay motivated throughout your preparation
              </p>
            </div>

            {/* Feature 6 */}
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-100 rounded-full mb-4">
                <GraduationCap className="w-8 h-8 text-indigo-600" />
              </div>
              <h3 className="text-xl font-bold text-gray-800 mb-3">
                Subject Combinations
              </h3>
              <p className="text-gray-600">
                Choose from Science, Commercial, or Arts combinations tailored 
                to your academic goals and university requirements
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
    <section className="bg-gradient-to-r from-blue-900 to-blue-700 py-16">
      <div className="container mx-auto px-4 text-center md:text-left">

        <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
      Ready to Excel in Your Exams?
        </h2>

        <p className="text-xl text-blue-100 mb-8 max-w-2xl mx-auto md:mx-0">
          Join thousands of students who are achieving their academic dreams with Sophia Prep
        </p>

      <div className="flex flex-wrap justify-center md:justify-start gap-4">
      <Link
        to="/signup"
        className="px-8 py-4 bg-yellow-400 text-blue-900 rounded-lg font-semibold 
        hover:bg-yellow-300 transition-all transform hover:scale-105 shadow-lg"
      >
        Get Started Free
      </Link>

      <Link
        to="/subscription"
        className="px-8 py-4 bg-transparent text-white rounded-lg font-semibold 
        hover:bg-blue-800 transition-all border-2 border-white"
      >
        View Plans
      </Link>
      </div>

      </div>
    </section>


      </div>
    </Layout>
  );
}
