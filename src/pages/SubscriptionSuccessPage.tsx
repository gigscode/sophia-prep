import { useNavigate } from 'react-router-dom';
import { CheckCircle2, ArrowRight, Star, Shield, Zap } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import confetti from 'canvas-confetti';
import { useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';

export function SubscriptionSuccessPage() {
    const navigate = useNavigate();
    const { refreshUser } = useAuth();

    useEffect(() => {
        // Refresh user details to get the new subscription plan
        refreshUser();

        // Trigger confetti on mount
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);
            // since particles fall down, start a bit higher than random
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 } });
            confetti({ ...defaults, particleCount, origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 } });
        }, 250);

        return () => clearInterval(interval);
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-20 px-4">
            <div className="max-w-2xl mx-auto text-center">
                <div className="mb-8 inline-flex items-center justify-center w-24 h-24 bg-green-100 rounded-full text-green-600 animate-bounce">
                    <CheckCircle2 className="w-12 h-12" />
                </div>

                <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-4 bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                    Subscription Successful!
                </h1>
                <p className="text-xl text-gray-600 mb-12">
                    Welcome to the Premium family. Your account has been upgraded and all features are now unlocked.
                </p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                    <Card className="p-6 bg-white/50 backdrop-blur-sm border-blue-100 hover:shadow-lg transition-all group">
                        <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center text-blue-600 mb-4 group-hover:scale-110 transition-transform">
                            <Star className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">Full Access</h3>
                        <p className="text-sm text-gray-600">All subjects and topics are now yours.</p>
                    </Card>

                    <Card className="p-6 bg-white/50 backdrop-blur-sm border-purple-100 hover:shadow-lg transition-all group">
                        <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center text-purple-600 mb-4 group-hover:scale-110 transition-transform">
                            <Zap className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">CBT Simulation</h3>
                        <p className="text-sm text-gray-600">Unlimited realistic JAMB simulations.</p>
                    </Card>

                    <Card className="p-6 bg-white/50 backdrop-blur-sm border-green-100 hover:shadow-lg transition-all group">
                        <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-green-600 mb-4 group-hover:scale-110 transition-transform">
                            <Shield className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-gray-900 mb-1">Priority Support</h3>
                        <p className="text-sm text-gray-600">We're here whenever you need help.</p>
                    </Card>
                </div>

                <div className="space-y-4">
                    <Button
                        className="w-full md:w-auto px-12 py-4 text-lg bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 shadow-xl shadow-blue-200"
                        onClick={() => navigate('/profile')}
                    >
                        Go to My Profile
                        <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>

                    <div>
                        <button
                            onClick={() => navigate('/practice')}
                            className="text-blue-600 font-semibold hover:text-blue-700 transition-colors"
                        >
                            Start Practicing Now
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
