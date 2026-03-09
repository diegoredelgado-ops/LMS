import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { GraduationCap, CheckCircle, Loader2, XCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { api } = useAuth();
  const [status, setStatus] = useState('loading');
  const [paymentData, setPaymentData] = useState(null);
  const sessionId = searchParams.get('session_id');

  useEffect(() => {
    if (sessionId) {
      pollPaymentStatus(sessionId);
    } else {
      setStatus('error');
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sessionId]);

  const pollPaymentStatus = async (sid, attempts = 0) => {
    const maxAttempts = 5;
    const pollInterval = 2000;

    if (attempts >= maxAttempts) {
      setStatus('timeout');
      return;
    }

    try {
      const response = await api.get(`/payments/status/${sid}`);
      setPaymentData(response.data);

      if (response.data.payment_status === 'paid') {
        setStatus('success');
        toast.success('Payment successful!');
        return;
      } else if (response.data.status === 'expired') {
        setStatus('expired');
        return;
      }

      // Continue polling
      setTimeout(() => pollPaymentStatus(sid, attempts + 1), pollInterval);
    } catch (error) {
      console.error('Error checking payment status:', error);
      if (attempts < maxAttempts - 1) {
        setTimeout(() => pollPaymentStatus(sid, attempts + 1), pollInterval);
      } else {
        setStatus('error');
      }
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-md w-full text-center"
      >
        <Link to="/" className="inline-flex items-center gap-2 mb-8">
          <GraduationCap className="w-8 h-8 text-primary" />
          <span className="text-xl font-heading font-bold">Lumina</span>
        </Link>

        {status === 'loading' && (
          <div className="glass-card p-8">
            <Loader2 className="w-16 h-16 text-primary mx-auto mb-4 animate-spin" />
            <h1 className="text-2xl font-heading font-bold mb-2">Processing Payment</h1>
            <p className="text-muted-foreground">Please wait while we confirm your payment...</p>
          </div>
        )}

        {status === 'success' && (
          <div className="glass-card p-8">
            <div className="w-20 h-20 rounded-full bg-accent/20 flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-10 h-10 text-accent" />
            </div>
            <h1 className="text-2xl font-heading font-bold mb-2">Payment Successful!</h1>
            <p className="text-muted-foreground mb-6">
              Thank you for your purchase. You can now access your course.
            </p>
            {paymentData && (
              <p className="text-sm text-muted-foreground mb-6">
                Amount: ${(paymentData.amount).toFixed(2)} {paymentData.currency?.toUpperCase()}
              </p>
            )}
            <div className="flex flex-col gap-3">
              <Button onClick={() => navigate('/student')} className="glow-primary" data-testid="go-to-dashboard">
                Go to Dashboard
              </Button>
              <Button variant="outline" onClick={() => navigate('/courses')} data-testid="browse-courses">
                Browse More Courses
              </Button>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="glass-card p-8">
            <div className="w-20 h-20 rounded-full bg-destructive/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-destructive" />
            </div>
            <h1 className="text-2xl font-heading font-bold mb-2">Something Went Wrong</h1>
            <p className="text-muted-foreground mb-6">
              We couldn't verify your payment. Please contact support if you were charged.
            </p>
            <Button onClick={() => navigate('/courses')} data-testid="back-to-courses">
              Back to Courses
            </Button>
          </div>
        )}

        {status === 'expired' && (
          <div className="glass-card p-8">
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
              <XCircle className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-heading font-bold mb-2">Session Expired</h1>
            <p className="text-muted-foreground mb-6">
              Your payment session has expired. Please try again.
            </p>
            <Button onClick={() => navigate('/courses')} data-testid="back-to-courses">
              Back to Courses
            </Button>
          </div>
        )}

        {status === 'timeout' && (
          <div className="glass-card p-8">
            <div className="w-20 h-20 rounded-full bg-yellow-500/20 flex items-center justify-center mx-auto mb-6">
              <Loader2 className="w-10 h-10 text-yellow-500" />
            </div>
            <h1 className="text-2xl font-heading font-bold mb-2">Payment Processing</h1>
            <p className="text-muted-foreground mb-6">
              Your payment is still being processed. Please check your email for confirmation.
            </p>
            <Button onClick={() => navigate('/student')} data-testid="go-to-dashboard">
              Go to Dashboard
            </Button>
          </div>
        )}
      </motion.div>
    </div>
  );
};

export default PaymentSuccess;
