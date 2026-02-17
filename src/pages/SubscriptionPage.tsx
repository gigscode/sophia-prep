import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, X, Shield, Zap, Star, ArrowLeft } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { subscriptionService, SUBSCRIPTION_PLANS } from '../services/subscription-service';
import { showToast } from '../components/ui/Toast';
import { LoadingSpinner } from '../components/ui/LoadingSpinner';

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY;

if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY === 'pk_test_placeholder') {
    console.warn('Paystack Public Key is missing or using placeholder. Payment might not work.');
}

interface Plan {
    id: string;
    slug: string;
    name: string;
    price: number;
    duration: string;
    description: string;
    features: string[];
    recommended?: boolean;
    type: string;
}

const plans: Plan[] = [
    {
        id: 'free',
        slug: 'free',
        name: 'Free',
        price: 0,
        duration: 'Forever',
        description: 'Perfect for getting started',
        type: SUBSCRIPTION_PLANS.FREE,
        features: [
            '20 questions per subject',
            'Basic practice mode',
            'JAMB CBT Simulations (limited)',
            'Basic performance tracking',
        ],
    },
    {
        id: 'premium_monthly',
        slug: 'jamb-only',
        name: 'Monthly',
        price: 1500,
        duration: 'Month',
        description: 'Comprehensive prep for serious students',
        recommended: true,
        type: SUBSCRIPTION_PLANS.PREMIUM,
        features: [
            'Full 45 questions per subject',
            'Unlimited JAMB CBT Simulations',
            'Advanced performance analytics',
            'Access to all subject topics',
            'Detailed explanations for all answers',
            'Premium study materials',
        ],
    },
    {
        id: 'premium_3_months',
        slug: 'full-access',
        name: '3-Months',
        price: 4500,
        duration: '3 Months',
        description: 'Best value for a full quarter of preparation',
        type: SUBSCRIPTION_PLANS.PREMIUM,
        features: [
            'Everything in Monthly Plan',
            'Full access for three months',
            'Priority support',
            'Offline access to select materials',
        ],
    },
];

export function SubscriptionPage() {
    const navigate = useNavigate();
    const { user } = useAuth();
    const [currentPlan, setCurrentPlan] = useState<string>(SUBSCRIPTION_PLANS.FREE);
    const [loading, setLoading] = useState(true);
    const [processingPayment, setProcessingPayment] = useState(false);

    useEffect(() => {
        loadUserPlan();
    }, [user]);

    const loadUserPlan = async () => {
        if (!user) {
            setLoading(false);
            return;
        }
        const plan = await subscriptionService.getActivePlan(user.id);
        setCurrentPlan(plan);
        setLoading(false);
    };

    const handlePaymentSuccess = async (reference: any, plan: Plan) => {
        setProcessingPayment(true);
        const ref = reference?.reference || reference;
        console.log(`[PAYMENT_SUCCESS_HANDLER] reference=${ref}, plan=${plan.slug}`);

        try {
            showToast('Payment successful! Finalizing subscription...', 'success');

            // Robust fallback: Attempt to update client-side immediately
            if (user?.id) {
                console.log(`[PAYMENT_FINALIZING] Triggering database update for user ${user.id}...`);
                const success = await subscriptionService.completeSubscriptionClientSide(user.id, plan, ref);
                console.log(`[PAYMENT_FINALIZING] Database update ${success ? 'succeeded' : 'failed'}`);
            } else {
                console.warn('[PAYMENT_FINALIZING] No user ID found, skipping direct database update');
            }

            console.log('[PAYMENT_FINALIZING] Redirecting to success page in 1000ms...');
            // Small delay to allow database replication/webhooks to catch up
            setTimeout(() => {
                setProcessingPayment(false);
                navigate('/subscription-success', { replace: true });
            }, 1000);
        } catch (error) {
            console.error('[PAYMENT_HANDLER_ERROR] Critical failure in success handler:', error);
            showToast('Payment successful, but we encountered an issue finalizing. Please contact support.', 'warning');

            // Still redirect to success page, polling will handle the rest
            console.log('[PAYMENT_FINALIZING_ERROR] Redirecting to success page despite error...');
            setProcessingPayment(false);
            navigate('/subscription-success', { replace: true });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <LoadingSpinner size="lg" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-12">
            <div className="container mx-auto px-4">
                <div className="max-w-4xl mx-auto">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
                    >
                        <ArrowLeft className="w-5 h-5" />
                        Back
                    </button>

                    <div className="text-center mb-12">
                        <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Plan</h1>
                        <p className="text-lg text-gray-600">
                            Unlock the full potential of Sophia Prep and ace your exams.
                        </p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.id}
                                className={`relative bg-white rounded-2xl p-8 border-2 transition-all ${plan.recommended
                                    ? 'border-blue-500 shadow-xl scale-105 z-10'
                                    : 'border-gray-200 hover:border-blue-200'
                                    }`}
                            >
                                {plan.recommended && (
                                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-sm font-bold flex items-center gap-1">
                                        <Star className="w-4 h-4 fill-current" />
                                        RECOMMENDED
                                    </div>
                                )}

                                <div className="mb-8">
                                    <h3 className="text-xl font-bold text-gray-900 mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-3xl font-bold">₦{plan.price.toLocaleString()}</span>
                                        <span className="text-gray-500">/{plan.duration}</span>
                                    </div>
                                    <p className="text-sm text-gray-600 mt-2">{plan.description}</p>
                                </div>

                                <div className="space-y-4 mb-8">
                                    {plan.features.map((feature, index) => (
                                        <div key={index} className="flex items-start gap-3">
                                            <div className={`mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${plan.type === SUBSCRIPTION_PLANS.PREMIUM ? 'bg-green-100' : 'bg-gray-100'
                                                }`}>
                                                <Check className={`w-3 h-3 ${plan.type === SUBSCRIPTION_PLANS.PREMIUM ? 'text-green-600' : 'text-gray-600'
                                                    }`} />
                                            </div>
                                            <span className="text-sm text-gray-700">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                {currentPlan === plan.type && plan.id !== 'premium_3_months' && plan.id !== 'premium_monthly' ? (
                                    <div className="w-full py-3 bg-gray-50 text-gray-500 rounded-xl font-semibold text-center mt-auto">
                                        Current Plan
                                    </div>
                                ) : plan.id === 'free' ? (
                                    <button
                                        disabled
                                        className="w-full py-3 bg-gray-50 text-gray-500 rounded-xl font-semibold text-center mt-auto"
                                    >
                                        Free Tier
                                    </button>
                                ) : (
                                    <PaystackButton
                                        plan={plan}
                                        user={user}
                                        processing={processingPayment}
                                        onSuccess={handlePaymentSuccess}
                                    >
                                        {currentPlan === SUBSCRIPTION_PLANS.PREMIUM ? 'Switch Plan' : 'Go Premium'}
                                    </PaystackButton>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="mt-16 bg-white rounded-2xl p-8 border border-gray-200 shadow-sm">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-blue-100 rounded-2xl flex items-center justify-center">
                                    <Shield className="w-8 h-8 text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Secure Payments</h3>
                                    <p className="text-gray-600">Your transactions are secured by Paystack.</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-orange-100 rounded-2xl flex items-center justify-center">
                                    <Zap className="w-8 h-8 text-orange-600" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-bold text-gray-900">Instant Activation</h3>
                                    <p className="text-gray-600">Premium features are unlocked immediately.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

interface PaystackButtonProps {
    plan: Plan;
    user: any;
    processing: boolean;
    onSuccess: (ref: any, plan: Plan) => void;
    children: React.ReactNode;
}

const PaystackButton = ({ plan, user, processing, onSuccess, children }: PaystackButtonProps) => {
    const navigate = useNavigate();

    const config = useMemo(() => ({
        reference: `SUB_${new Date().getTime()}_${Math.floor(Math.random() * 1000000)}`,
        email: user?.email || '',
        amount: plan.price * 100, // Amount in kobo
        publicKey: PAYSTACK_PUBLIC_KEY as string,
        metadata: {
            user_id: user?.id || "",
            plan: plan.name,
            plan_slug: plan.slug,
            custom_fields: [
                {
                    display_name: "Plan",
                    variable_name: "plan",
                    value: plan.name
                },
                {
                    display_name: "User ID",
                    variable_name: "user_id",
                    value: user?.id || ""
                },
                {
                    display_name: "Plan Slug",
                    variable_name: "plan_slug",
                    value: plan.slug
                }
            ]
        }
    }), [user?.email, user?.id, plan.price, plan.name, plan.slug]);

    const handleClick = () => {
        console.log(`[PAYMENT_INIT] plan=${plan.slug}, email=${user?.email}`);

        if (!user) {
            navigate('/login?redirect=/subscriptions');
            return;
        }

        if (!PAYSTACK_PUBLIC_KEY || PAYSTACK_PUBLIC_KEY === 'pk_test_placeholder') {
            console.error('[PAYMENT_AUTH_ERROR] Missing or placeholder Public Key');
            showToast('Unable to initialize payment. Please contact support.', 'error');
            return;
        }

        const scriptId = 'paystack-inline-js';
        const existingScript = document.getElementById(scriptId) as HTMLScriptElement | null;

        const startPayment = () => {
            const anyWindow = window as any;
            const paystack = anyWindow.PaystackPop?.setup({
                key: PAYSTACK_PUBLIC_KEY,
                email: user?.email || '',
                amount: plan.price * 100,
                reference: config.reference,
                metadata: config.metadata,
                callback: (response: any) => {
                    console.log('[PAYSTACK_CALLBACK] Success', response);
                    onSuccess(response.reference, plan);
                },
                onClose: () => {
                    console.log('Payment closed');
                    showToast('Payment cancelled', 'info');
                },
            });

            if (!paystack) {
                console.error('[PAYSTACK_INIT_ERROR] PaystackPop not available on window');
                showToast('Unable to initialize payment. Please refresh the page and try again.', 'error');
                return;
            }

            paystack.openIframe();
        };

        if (existingScript) {
            startPayment();
            return;
        }

        const script = document.createElement('script');
        script.id = scriptId;
        script.src = 'https://js.paystack.co/v1/inline.js';
        script.async = true;
        script.onload = () => {
            console.log('[PAYSTACK_SCRIPT] Loaded inline script');
            startPayment();
        };
        script.onerror = () => {
            console.error('[PAYSTACK_SCRIPT_ERROR] Failed to load inline script');
            showToast('Unable to load payment gateway. Please check your connection and try again.', 'error');
        };

        document.body.appendChild(script);
    };

    return (
        <button
            onClick={handleClick}
            disabled={processing}
            className={`w-full py-3 rounded-xl font-semibold transition-all ${plan.recommended
                ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
                : 'bg-gray-100 text-gray-900 hover:bg-gray-200'
                }`}
        >
            {children}
        </button>
    );
};
