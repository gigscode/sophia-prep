import { useEffect, useState } from 'react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    function beforeInstallHandler(e: any) {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
    }

    function appInstalled() {
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('PWA installed');
    }

    window.addEventListener('beforeinstallprompt', beforeInstallHandler as any);
    window.addEventListener('appinstalled', appInstalled as any);

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler as any);
      window.removeEventListener('appinstalled', appInstalled as any);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    setShowPrompt(false);
    deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult && choiceResult.outcome === 'accepted') {
      console.log('User accepted the PWA install prompt');
    } else {
      console.log('User dismissed the PWA install prompt');
    }
    setDeferredPrompt(null);
  };

  if (!showPrompt) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={handleInstall}
        className="px-4 py-2 text-blue-900 rounded-lg shadow-lg font-semibold"
        style={{ backgroundColor: '#B78628' }}
        aria-label="Install Sophia Prep"
      >
        Install App
      </button>
    </div>
  );
}
