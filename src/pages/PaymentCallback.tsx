import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { verifyStripeCheckout, capturePayPalOrder } from '../lib/auth';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';

export default function PaymentCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const processPayment = async () => {
      const paymentStatus = searchParams.get('status');
      const method = searchParams.get('method');
      
      if (paymentStatus === 'cancel') {
        setStatus('error');
        setErrorMsg('Payment was cancelled.');
        return;
      }

      if (paymentStatus === 'success') {
        try {
          if (method === 'stripe') {
            const sessionId = searchParams.get('session_id');
            if (!sessionId) throw new Error('Missing session ID');
            await verifyStripeCheckout(sessionId);
          } else if (method === 'paypal') {
            const token = searchParams.get('token');
            if (!token) throw new Error('Missing PayPal token');
            await capturePayPalOrder(token);
          } else {
            throw new Error('Unknown payment method callback');
          }
          setStatus('success');
          // Automatically redirect to home after 3 seconds
          setTimeout(() => navigate('/'), 3000);
        } catch (err: any) {
          console.error('Payment verification failed:', err);
          setStatus('error');
          setErrorMsg(err.message || 'Payment verification failed');
        }
      } else {
        setStatus('error');
        setErrorMsg('Invalid payment callback parameters.');
      }
    };

    processPayment();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen bg-[#0d0e12] flex items-center justify-center p-4">
      <div className="bg-[#181a20] p-8 rounded-3xl max-w-md w-full text-center border border-gray-800">
        {status === 'loading' && (
          <div className="flex flex-col items-center">
            <Loader2 className="w-16 h-16 text-[#00E676] animate-spin mb-4" />
            <h2 className="text-2xl font-black text-white">Verifying Payment...</h2>
            <p className="text-gray-400 mt-2">Please wait, do not close this window.</p>
          </div>
        )}
        
        {status === 'success' && (
          <div className="flex flex-col items-center">
            <CheckCircle className="w-20 h-20 text-[#00E676] mb-4" />
            <h2 className="text-3xl font-black text-white">Payment Successful!</h2>
            <p className="text-gray-400 mt-2">Your gems have been securely added.</p>
            <p className="text-sm text-gray-500 mt-6">Redirecting you back...</p>
          </div>
        )}

        {status === 'error' && (
          <div className="flex flex-col items-center">
            <XCircle className="w-20 h-20 text-red-500 mb-4" />
            <h2 className="text-3xl font-black text-white">Payment Failed</h2>
            <p className="text-gray-400 mt-2">{errorMsg}</p>
            <button 
              onClick={() => navigate('/')}
              className="mt-6 bg-gray-800 hover:bg-gray-700 text-white px-6 py-3 rounded-xl font-bold transition-all"
            >
              Return Home
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
