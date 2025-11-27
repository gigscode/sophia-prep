import { Link } from 'react-router-dom';
import { MessageCircle, PhoneCall, Users, PlayCircle, Calendar } from 'lucide-react';

export function HelpCenter() {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Help Center</h1>
        <p className="text-gray-600 mb-8">Choose how you want to get help.</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <a href="https://chat.whatsapp.com/Bwh3ihawOsg5u8YDvwt45Q?mode=hqrt1" target="_blank" rel="noreferrer" className="sophia-card p-6 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <PhoneCall className="w-8 h-8 text-green-600" />
              <h3 className="text-xl font-semibold">WhatsApp </h3>
            </div>
            <p className="text-gray-600">Chat with our support team on WhatsApp</p>
          </a>

          <a href="https://t.me/+6NRb_IKowABiMDc0" target="_blank" rel="noreferrer" className="sophia-card p-6 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <Users className="w-8 h-8 text-blue-600" />
              <h3 className="text-xl font-semibold">Telegram Group</h3>
            </div>
            <p className="text-gray-600">Join our student community on Telegram</p>
          </a>

          <Link to="/tutorials" className="sophia-card p-6 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <PlayCircle className="w-8 h-8 text-red-600" />
              <h3 className="text-xl font-semibold">Online Tutorials</h3>
            </div>
            <p className="text-gray-600">Watch lessons organized by subject and topic</p>
          </Link>

          <a href="https://wa.me/2347061735358" target="_blank" className="sophia-card p-6 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <MessageCircle className="w-8 h-8 text-purple-600" />
              <h3 className="text-xl font-semibold">Direct Message/Chat</h3>
            </div>
            <p className="text-gray-600">Send a message to support staff</p>
          </a>

          <a href="https://wa.me/2347061735358" target="_blank" className="sophia-card p-6 hover:shadow-lg">
            <div className="flex items-center gap-4 mb-3">
              <Calendar className="w-8 h-8" style={{ color: '#B78628' }} />
              <h3 className="text-xl font-semibold">One-on-one Sessions</h3>
            </div>
            <p className="text-gray-600">Book time with tutors</p>
          </a>
        </div>
      </div>
    </div>
  );
}