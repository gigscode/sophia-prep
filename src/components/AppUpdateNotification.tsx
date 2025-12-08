import { useEffect, useState } from 'react';
import { RefreshCw, X } from 'lucide-react';
import { useAppVersion } from '../hooks/useAppVersion';

/**
 * App Update Notification Component
 * 
 * Displays a banner when a new app version is detected
 * Provides options to update immediately or dismiss
 * Auto-reloads after countdown if not dismissed
 */
export function AppUpdateNotification() {
    const { hasUpdate, newVersion, applyUpdate } = useAppVersion();
    const [dismissed, setDismissed] = useState(false);
    const [countdown, setCountdown] = useState(30);
    const [showCountdown, setShowCountdown] = useState(false);

    // Reset dismissed state when a new update is detected
    useEffect(() => {
        if (hasUpdate) {
            setDismissed(false);
            setCountdown(30);
            setShowCountdown(true);
        }
    }, [hasUpdate]);

    // Countdown timer for auto-reload
    useEffect(() => {
        if (!hasUpdate || dismissed || !showCountdown) return;

        const timer = setInterval(() => {
            setCountdown((prev) => {
                if (prev <= 1) {
                    // Auto-reload when countdown reaches 0
                    applyUpdate();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [hasUpdate, dismissed, showCountdown, applyUpdate]);

    // Re-show notification after 30 seconds if dismissed
    useEffect(() => {
        if (dismissed && hasUpdate) {
            const timer = setTimeout(() => {
                setDismissed(false);
                setCountdown(30);
            }, 30000);

            return () => clearTimeout(timer);
        }
    }, [dismissed, hasUpdate]);

    const handleUpdateNow = () => {
        applyUpdate();
    };

    const handleDismiss = () => {
        setDismissed(true);
        setShowCountdown(false);
    };

    // Don't show if no update or dismissed
    if (!hasUpdate || dismissed) {
        return null;
    }

    return (
        <div className="fixed top-0 left-0 right-0 z-[2000] animate-slide-down">
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 text-white shadow-lg">
                <div className="container mx-auto px-4 py-3">
                    <div className="flex items-center justify-between gap-4">
                        {/* Left side - Icon and Message */}
                        <div className="flex items-center gap-3 flex-1">
                            <div className="flex-shrink-0 w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                                <RefreshCw className="w-5 h-5 animate-spin-slow" />
                            </div>

                            <div className="flex-1">
                                <p className="font-semibold text-sm md:text-base">
                                    New Version Available! 🎉
                                </p>
                                <p className="text-xs md:text-sm text-blue-100">
                                    {newVersion ? `v${newVersion}` : 'Update'} is ready.
                                    {showCountdown && countdown > 0 && (
                                        <span className="ml-1 font-medium">
                                            Auto-updating in {countdown}s...
                                        </span>
                                    )}
                                </p>
                            </div>
                        </div>

                        {/* Right side - Action Buttons */}
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleUpdateNow}
                                className="px-4 py-2 bg-white text-blue-600 rounded-lg font-semibold text-sm hover:bg-blue-50 transition-colors flex items-center gap-2 shadow-md"
                            >
                                <RefreshCw className="w-4 h-4" />
                                Update Now
                            </button>

                            <button
                                onClick={handleDismiss}
                                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                                aria-label="Dismiss"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Add to global styles for animation
const styles = `
@keyframes slide-down {
  from {
    transform: translateY(-100%);
    opacity: 0;
  }
  to {
    transform: translateY(0);
    opacity: 1;
  }
}

@keyframes spin-slow {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.animate-slide-down {
  animation: slide-down 0.3s ease-out;
}

.animate-spin-slow {
  animation: spin-slow 3s linear infinite;
}
`;

// Inject styles
if (typeof document !== 'undefined') {
    const styleSheet = document.createElement('style');
    styleSheet.textContent = styles;
    document.head.appendChild(styleSheet);
}
