import { motion } from 'framer-motion';
import { PageHeader } from '../components/layout';
import { ShieldCheck, Lock, Database, Eye, Cookie } from 'lucide-react';

export function PrivacyPolicyPage() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        description="Your privacy matters. This policy explains what we collect, how we use it, and your choices."
        icon={<ShieldCheck className="w-8 h-8" />}
        breadcrumbs={[{ label: 'Privacy Policy' }]}
      />

      <div className="container mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-white rounded-xl shadow p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div className="p-4 rounded-lg bg-blue-50">
              <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center mb-2"><Database className="w-6 h-6 text-blue-600" /></div>
              <div className="font-semibold">Information We Collect</div>
              <div className="text-sm text-gray-700">Account details, usage analytics, and quiz performance to improve learning.</div>
            </div>
            <div className="p-4 rounded-lg bg-emerald-50">
              <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center mb-2"><Lock className="w-6 h-6 text-emerald-600" /></div>
              <div className="font-semibold">How We Use Data</div>
              <div className="text-sm text-gray-700">Personalize content, track progress, enhance features, and secure the platform.</div>
            </div>
          </div>

          <div className="space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold mb-2">Cookies</h2>
              <p>We use essential and performance cookies to enable core functionality and understand usage. You may control cookies in your browser settings.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Data Sharing</h2>
              <p>We do not sell your data. Limited sharing may occur with trusted providers strictly to operate features such as storage and analytics.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Security</h2>
              <p>We apply reasonable measures to protect your information. No method is perfectly secure, but we work to safeguard your data.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Your Choices</h2>
              <p>You may access, update, or delete your account information. Contact support to exercise privacy requests.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Updates</h2>
              <p>We may update this policy and will indicate the effective date. Continued use signifies acceptance of the updated terms.</p>
            </section>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-indigo-50 flex items-center gap-3"><Eye className="w-6 h-6 text-indigo-600" /><div className="font-medium">Transparency</div></div>
            <div className="p-4 rounded-lg bg-amber-50 flex items-center gap-3"><Cookie className="w-6 h-6 text-amber-600" /><div className="font-medium">Controls</div></div>
            <div className="p-4 rounded-lg bg-rose-50 flex items-center gap-3"><ShieldCheck className="w-6 h-6 text-rose-600" /><div className="font-medium">Protection</div></div>
          </div>
        </motion.div>
      </div>
    </>
  );
}