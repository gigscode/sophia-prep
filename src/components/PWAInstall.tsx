import { useEffect, useState } from 'react';
import { Download, X, Smartphone } from 'lucide-react';

export default function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already dismissed
    const isDismissed = localStorage.getItem('pwa-install-dismissed');
    if (isDismissed) {
      setDismissed(true);
      return;
    }

    // Check if already installed
    if (window.matchMedia('(display-mode: standalone)').matches) {
      return;
    }

    function beforeInstallHandler(e: any) {
      e.preventDefault();
      setDeferredPrompt(e);
      setShowPrompt(true);
      console.log('✅ beforeinstallprompt event fired');
    }

    function appInstalled() {
      setShowPrompt(false);
      setDeferredPrompt(null);
      console.log('✅ PWA installed successfully');
    }

    window.addEventListener('beforeinstallprompt', beforeInstallHandler as any);
    window.addEventListener('appinstalled', appInstalled as any);

    // Check if iOS device
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    const isInStandaloneMode = ('standalone' in window.navigator) && (window.navigator as any).standalone;

    if (isIOS && !isInStandaloneMode) {
      // Show iOS instructions after a delay
      setTimeout(() => {
        if (!isDismissed) {
          setShowIOSInstructions(true);
        }
      }, 3000);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', beforeInstallHandler as any);
      window.removeEventListener('appinstalled', appInstalled as any);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;

    try {
      deferredPrompt.prompt();
      const choiceResult = await deferredPrompt.userChoice;

      if (choiceResult && choiceResult.outcome === 'accepted') {
        console.log('✅ User accepted the PWA install prompt');
        setShowPrompt(false);
      } else {
        console.log('❌ User dismissed the PWA install prompt');
      }

      setDeferredPrompt(null);
    } catch (error) {
      console.error('Error during PWA installation:', error);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    setDismissed(true);
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Android/Chrome install prompt
  if (showPrompt && !dismissed) {
    return (
      <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-[60] animate-slide-up">
        <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border-t-4 md:border-t-0 md:border-l-4 p-6" style={{ borderColor: '#B78628' }}>
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FDF6E8' }}>
              <Smartphone className="w-6 h-6" style={{ color: '#B78628' }} />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Install Sophia Prep</h3>
              <p className="text-sm text-gray-600 mb-4">
                Install our app for quick access, offline support, and a better experience!
              </p>

              <div className="flex gap-3">
                <button
                  onClick={handleInstall}
                  className="flex-1 px-4 py-2.5 text-white rounded-lg font-semibold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2"
                  style={{ backgroundColor: '#B78628' }}
                >
                  <Download className="w-4 h-4" />
                  Install
                </button>
                <button
                  onClick={handleDismiss}
                  className="px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                >
                  Not Now
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // iOS install instructions
  if (showIOSInstructions && !dismissed) {
    return (
      <div className="fixed bottom-0 left-0 right-0 md:bottom-6 md:left-auto md:right-6 md:max-w-sm z-[60] animate-slide-up">
        <div className="bg-white rounded-t-2xl md:rounded-2xl shadow-2xl border-t-4 md:border-t-0 md:border-l-4 p-6" style={{ borderColor: '#B78628' }}>
          <button
            onClick={handleDismiss}
            className="absolute top-3 right-3 p-1 hover:bg-gray-100 rounded-full transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>

          <div className="flex items-start gap-4">
            <div className="flex-shrink-0 w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: '#FDF6E8' }}>
              <Smartphone className="w-6 h-6" style={{ color: '#B78628' }} />
            </div>

            <div className="flex-1">
              <h3 className="font-bold text-lg mb-1">Install Sophia Prep</h3>
              <p className="text-sm text-gray-600 mb-3">
                Add to your home screen for quick access:
              </p>

              <ol className="text-sm text-gray-700 space-y-2 mb-4">
                <li className="flex items-start gap-2">
                  <span className="font-bold" style={{ color: '#B78628' }}>1.</span>
                  <span>Tap the <strong>Share</strong> button <span className="inline-block">⎙</span> in Safari</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold" style={{ color: '#B78628' }}>2.</span>
                  <span>Scroll and tap <strong>"Add to Home Screen"</strong></span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="font-bold" style={{ color: '#B78628' }}>3.</span>
                  <span>Tap <strong>"Add"</strong> to confirm</span>
                </li>
              </ol>

              <button
                onClick={handleDismiss}
                className="w-full px-4 py-2.5 text-gray-700 bg-gray-100 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Got it
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
