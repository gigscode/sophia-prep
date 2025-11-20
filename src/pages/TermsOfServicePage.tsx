import { motion } from 'framer-motion';
import { PageHeader } from '../components/layout';
import { FileText, Scale, CheckCircle2 } from 'lucide-react';

export function TermsOfServicePage() {
  return (
    <>
      <PageHeader
        title="Terms of Service"
        description="Please review these terms governing your use of Sophia Prep."
        icon={<FileText className="w-8 h-8" />}
        breadcrumbs={[{ label: 'Terms of Service' }]}
      />

      <div className="container mx-auto px-4 py-10">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-white rounded-xl shadow p-6">
          <div className="space-y-6 text-gray-700 leading-relaxed">
            <section>
              <h2 className="text-xl font-bold mb-2">Acceptance</h2>
              <p>By accessing or using the platform, you agree to these terms and to our Privacy Policy.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Use of Service</h2>
              <p>Use the platform for lawful purposes. Do not misuse features, attempt to disrupt services, or infringe intellectual property.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Accounts</h2>
              <p>You are responsible for maintaining account security and for activities under your account.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Content</h2>
              <p>Educational materials are provided for learning. Do not replicate or redistribute content without permission.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Disclaimer</h2>
              <p>The service is provided "as is" without warranties. We do not guarantee specific exam outcomes.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Limitation of Liability</h2>
              <p>To the extent permitted by law, we are not liable for indirect or consequential damages related to the use of the service.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Termination</h2>
              <p>We may suspend or terminate access for violations of these terms or to protect the platform.</p>
            </section>
            <section>
              <h2 className="text-xl font-bold mb-2">Changes</h2>
              <p>We may update these terms. Continued use after changes indicates acceptance.</p>
            </section>
          </div>

          <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="p-4 rounded-lg bg-indigo-50 flex items-center gap-3"><Scale className="w-6 h-6 text-indigo-600" /><div className="font-medium">Fair Use</div></div>
            <div className="p-4 rounded-lg bg-emerald-50 flex items-center gap-3"><CheckCircle2 className="w-6 h-6 text-emerald-600" /><div className="font-medium">Compliance</div></div>
            <div className="p-4 rounded-lg bg-amber-50 flex items-center gap-3"><FileText className="w-6 h-6 text-amber-600" /><div className="font-medium">Clarity</div></div>
          </div>
        </motion.div>
      </div>
    </>
  );
}