import { useLocation } from 'react-router-dom';

const WHATSAPP_NUMBER = '+2347061735358';

export function WhatsAppButton() {
  const { pathname } = useLocation();

  const allowed = ['/', '/study', '/help'];
  // show also on exact matches and allow querystrings
  if (!allowed.some(p => pathname === p || pathname.startsWith(p + '?'))) return null;

  const phone = WHATSAPP_NUMBER.replace(/[^0-9]/g, '');
  const message = encodeURIComponent('Hello, I need support with Sophia Prep.');
  const url = `https://wa.me/${phone}?text=${message}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
      title="Message +234 706 173 5358"
      className="fixed z-50 right-4 bottom-24 md:bottom-8 flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-green-500 to-green-600 text-white shadow-2xl hover:scale-105 transform transition-all duration-200"
      style={{ boxShadow: '0 10px 30px rgba(37,211,102,0.18)' }}
    >
      <span className="absolute inline-flex h-14 w-14 rounded-full bg-green-400 opacity-30 animate-ping" />
      <span className="relative z-10 flex items-center justify-center">
        <svg className="w-7 h-7" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M20.52 3.48A11.955 11.955 0 0 0 12 0C5.373 0 0 5.373 0 12c0 2.118.554 4.098 1.606 5.86L0 24l6.46-1.64A11.938 11.938 0 0 0 12 24c6.627 0 12-5.373 12-12 0-3.203-1.247-6.193-3.48-8.52z" fill="#25D366"/>
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.472-.149-.672.15-.198.297-.767.966-.94 1.164-.173.198-.347.223-.644.074-.297-.149-1.255-.462-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.297-.347.446-.52.149-.173.198-.297.297-.497.099-.198.05-.372-.025-.52-.074-.149-.672-1.618-.921-2.217-.242-.582-.487-.503-.672-.513l-.573-.01c-.198 0-.52.074-.792.372s-1.04 1.016-1.04 2.479 1.064 2.876 1.212 3.074c.149.198 2.096 3.2 5.077 4.487 1.416.611 2.52.975 3.385 1.247 1.423.452 2.72.388 3.75.236.114-.036.357-.146.408-.287.05-.14.05-.519-.148-.667z" fill="#fff"/>
        </svg>
      </span>
      <span className="sr-only">Chat on WhatsApp</span>
    </a>
  );
}

export default WhatsAppButton;
