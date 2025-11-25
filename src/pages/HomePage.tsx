import { Link } from 'react-router-dom';
import { BookOpen, Target, Trophy, GraduationCap, Clock, Users } from 'lucide-react';
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
                    <h1 className="text-4xl md:text-6xl font-bold" style={{ color: '#B78628' }}>
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
                    className="px-8 py-4 text-blue-900 rounded-lg font-semibold
               hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
                    style={{ backgroundColor: '#B78628' }}
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
                <div className="p-3 rounded-lg transition-colors" style={{ backgroundColor: '#F5EBCF' }}>
                  <Target className="w-8 h-8" style={{ color: '#B78628' }} />
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
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4" style={{ backgroundColor: '#F5EBCF' }}>
                  <Clock className="w-8 h-8" style={{ color: '#B78628' }} />
                </div>
                <h3 className="text-xl font-bold text-gray-800 mb-3">
                  Multiple Practice Modes
                </h3>
                <p className="text-gray-600">
                  Practice Mode, Mock Exams, and Reader Mode -
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

        {/* Pricing Section */}
        <section className="py-16 bg-gray-50">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-800 mb-4">
                Simple, Transparent Pricing
              </h2>
              <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                Choose the plan that works best for your learning journey
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
              {/* Tier 1: Lifetime Access */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300 border-2 border-blue-100">
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Lifetime Access</h3>
                  <p className="text-gray-600 mb-6">One-time payment for unlimited access</p>
                  <div className="flex items-baseline mb-6">
                    <span className="text-4xl font-extrabold text-blue-600">₦1,500</span>
                    <span className="text-gray-500 ml-2">/ lifetime</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center text-gray-600">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      Unlimited Practice Questions
                    </li>
                    <li className="flex items-center text-gray-600">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      Full Mock Exams
                    </li>
                    <li className="flex items-center text-gray-600">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      Performance Analytics
                    </li>
                    <li className="flex items-center text-gray-600">
                      <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3">
                        <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      No Recurring Fees
                    </li>
                  </ul>
                  <Link
                    to="/subscription"
                    className="block w-full py-4 px-6 bg-blue-600 text-white text-center font-bold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                  >
                    Get Started Now
                  </Link>
                </div>
              </div>

              {/* Tier 2: Online Tutor */}
              <div className="bg-white rounded-2xl shadow-xl overflow-hidden transform hover:-translate-y-1 transition-all duration-300 border-2 relative" style={{ borderColor: '#B78628' }}>
                <div className="absolute top-0 right-0 text-blue-900 text-xs font-bold px-3 py-1 rounded-bl-lg" style={{ backgroundColor: '#B78628' }}>
                  PREMIUM SUPPORT
                </div>
                <div className="p-8">
                  <h3 className="text-2xl font-bold text-gray-800 mb-2">Request Online Tutor</h3>
                  <p className="text-gray-600 mb-6">Personalized guidance from experts</p>
                  <div className="flex items-baseline mb-6">
                    <span className="text-2xl font-bold text-gray-800">Contact for Pricing</span>
                  </div>
                  <ul className="space-y-4 mb-8">
                    <li className="flex items-center text-gray-600">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5EBCF' }}>
                        <svg className="w-4 h-4" style={{ color: '#B78628' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      One-on-One Sessions
                    </li>
                    <li className="flex items-center text-gray-600">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5EBCF' }}>
                        <svg className="w-4 h-4" style={{ color: '#B78628' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      Customized Study Plans
                    </li>
                    <li className="flex items-center text-gray-600">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5EBCF' }}>
                        <svg className="w-4 h-4" style={{ color: '#B78628' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      Topic Explanations
                    </li>
                    <li className="flex items-center text-gray-600">
                      <div className="w-6 h-6 rounded-full flex items-center justify-center mr-3" style={{ backgroundColor: '#F5EBCF' }}>
                        <svg className="w-4 h-4" style={{ color: '#B78628' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path></svg>
                      </div>
                      Exam Strategy Tips
                    </li>
                  </ul>
                  <a
                    href="https://wa.me/2347061735358?text=Hello,%20I%20would%20like%20to%20request%20an%20online%20tutor."
                    target="_blank"
                    rel="noreferrer"
                    className="block w-full py-4 px-6 text-blue-900 text-center font-bold rounded-xl hover:opacity-90 transition-colors shadow-lg hover:shadow-xl"
                    style={{ backgroundColor: '#B78628' }}
                  >
                    Chat on WhatsApp
                  </a>
                </div>
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
                className="px-8 py-4 text-blue-900 rounded-lg font-semibold
        hover:opacity-90 transition-all transform hover:scale-105 shadow-lg"
                style={{ backgroundColor: '#B78628' }}
              >
                Get Started Free
              </Link>

              <Link
                to="/subjects"
                className="px-8 py-4 bg-transparent text-white rounded-lg font-semibold
        hover:bg-blue-800 transition-all border-2 border-white"
              >
                Browse Subjects
              </Link>
            </div>

          </div>
        </section>


      </div>
    </Layout>
  );
}
