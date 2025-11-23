import { useState } from 'react';
import { motion } from 'framer-motion';
import { PageHeader } from '../components/layout';
import { Mail, Phone, MessageCircle, Send, MapPin } from 'lucide-react';

export function ContactPage() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  const submit = async () => {
    if (!name || !email || !message) return;
    setSending(true);
    try {
      const subject = encodeURIComponent('Sophia Prep Contact');
      const body = encodeURIComponent(`Name: ${name}\nEmail: ${email}\n\n${message}`);
      window.location.href = `mailto:support@sophiaprep.app?subject=${subject}&body=${body}`;
      setSent(true);
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <PageHeader
        title="Contact Us"
        description="Reach out for support, feedback, or partnership."
        icon={<MessageCircle className="w-8 h-8" />}
        breadcrumbs={[{ label: 'Contact Us' }]}
      />

      <div className="container mx-auto px-4 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-white rounded-xl shadow p-6">
            <div className="text-xl font-semibold mb-4">Send a Message</div>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-600">Name</label>
                <input value={name} onChange={e => setName(e.target.value)} className="w-full mt-1 p-3 border rounded" placeholder="Your name" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Email</label>
                <input value={email} onChange={e => setEmail(e.target.value)} className="w-full mt-1 p-3 border rounded" placeholder="you@example.com" />
              </div>
              <div>
                <label className="text-sm text-gray-600">Message</label>
                <textarea value={message} onChange={e => setMessage(e.target.value)} className="w-full mt-1 p-3 border rounded h-32" placeholder="How can we help?" />
              </div>
              <button onClick={submit} disabled={sending || !name || !email || !message} className={`px-4 py-2 rounded text-white flex items-center gap-2 ${sending ? 'bg-gray-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                <Send className="w-4 h-4" />
                {sending ? 'Sending...' : sent ? 'Sent' : 'Send'}
              </button>
            </div>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="bg-white rounded-xl shadow p-6">
            <div className="text-xl font-semibold mb-4">Other Channels</div>
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-indigo-50"><Mail className="w-5 h-5 text-indigo-600" /><a href="mailto:support@sophiaprep.app" className="text-indigo-700">support@sophiaprep.app</a></div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-emerald-50"><Phone className="w-5 h-5 text-emerald-600" /><a href="tel:+2347061735358" className="text-emerald-700">+234 706 173 5358</a></div>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-amber-50"><MapPin className="w-5 h-5 text-amber-600" /><div className="text-amber-700">Lagos, Nigeria</div></div>
            </div>
          </motion.div>
        </div>
      </div>
    </>
  );
}