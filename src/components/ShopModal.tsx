import React, { useState, useEffect } from 'react';
import { X, Check, ShieldCheck, CreditCard, ChevronLeft } from 'lucide-react';
import { FreeFireDiamond } from './FreeFireDiamond';
import { createStripeCheckout, createPayPalOrder, createRazorpayOrder, verifyRazorpayOrder, getAdminSettings, getPacks, createFlutterwavePayment, createCashfreePayment, createPayUPayment, createPhonePePayment } from '../lib/auth';
import { User, AdminSettings, Pack } from '../types';

declare global {
  interface Window {
    Razorpay: any;
  }
}

interface ShopModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateGems: (newGems: number) => void;
}

export const ShopModal: React.FC<ShopModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateGems
}) => {
  const [purchasingId, setPurchasingId] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [packs, setPacks] = useState<Pack[]>([]);

  useEffect(() => {
    if (isOpen) {
      getAdminSettings().then(st => setSettings(st)).catch(() => {});
      getPacks().then(ps => setPacks(ps)).catch(() => {});
    } else {
      setSelectedPack(null);
      setSuccessMsg(null);
      setErrorMsg(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  // OS Detection
  const ua = navigator.userAgent;
  const isIOS = /iPhone|iPad|iPod/i.test(ua);
  const isAndroid = /Android/i.test(ua);



  const availableMethods = [
    { id: 'stripe', label: 'Credit Card (Stripe)', enabled: settings?.stripeEnabled !== false, imgSrc: '/images/stripe-logo.png' },
    { id: 'paypal', label: 'PayPal', enabled: settings?.paypalEnabled !== false, imgSrc: '/images/paypal-logo.png' },
    { id: 'razorpay', label: 'Razorpay', enabled: settings?.razorpayEnabled !== false, imgSrc: '/images/razorpay-logo.png' },
    { id: 'flutterwave', label: 'Flutterwave', enabled: settings?.flutterwaveEnabled === true, imgSrc: '/images/payment/flutterwave.png' },
    { id: 'cashfree', label: 'Cashfree', enabled: settings?.cashfreeEnabled === true, imgSrc: '/images/payment/cashfree.png' },
    { id: 'payu', label: 'PayU', enabled: settings?.payuEnabled === true, imgSrc: '/images/payment/payu.png' },
    { id: 'phonepe', label: 'PhonePe', enabled: settings?.phonepeEnabled === true, imgSrc: '/images/payment/phonepe.png' },
    { id: 'googlepay', label: 'Google Pay', enabled: settings?.googlePayEnabled !== false && isAndroid, icon: 'G' },
    { id: 'applepay', label: 'Apple Pay', enabled: settings?.applePayEnabled !== false && isIOS, icon: '🍎' },
  ].filter(m => m.enabled);

  const handleCheckout = async (methodId: string) => {
    if (!selectedPack) return;
    setPurchasingId(selectedPack.id);
    setErrorMsg(null);
    try {
      if (methodId === 'stripe') {
        const res = await createStripeCheckout(selectedPack.id, selectedPack.name, selectedPack.price, selectedPack.gems);
        if (res.url) window.location.href = res.url;
        else throw new Error(res.error || 'Failed to initialize Stripe checkout');
      } else if (methodId === 'paypal') {
        const res = await createPayPalOrder(selectedPack.id, selectedPack.price, selectedPack.gems);
        if (res.approveUrl) window.location.href = res.approveUrl;
        else throw new Error(res.error || 'Failed to initialize PayPal checkout');
      } else if (methodId === 'flutterwave') {
        const res = await createFlutterwavePayment(selectedPack.id, selectedPack.name, selectedPack.price, selectedPack.gems);
        if (res.link) window.location.href = res.link;
        else throw new Error(res.error || 'Failed to initialize Flutterwave');
      } else if (methodId === 'cashfree') {
        const res = await createCashfreePayment(selectedPack.id, selectedPack.name, selectedPack.price, selectedPack.gems);
        if (res.sessionId) window.location.href = `https://payments.cashfree.com/order/#${res.sessionId}`; // redirect to checkout
        else throw new Error(res.error || 'Failed to initialize Cashfree');
      } else if (methodId === 'payu') {
        const res = await createPayUPayment(selectedPack.id, selectedPack.name, selectedPack.price, selectedPack.gems);
        if (res.hash) {
           // We need to submit a form to PayU. We'll create it dynamically.
           const form = document.createElement('form');
           form.method = 'POST';
           form.action = 'https://secure.payu.in/_payment'; // Use test URL if testing
           const fields: Record<string, string> = {
             key: res.key, txnid: res.txnid, amount: res.amount, productinfo: res.productinfo,
             firstname: res.firstname, email: res.email, hash: res.hash, surl: res.surl, furl: res.furl
           };
           Object.keys(fields).forEach(key => {
             const input = document.createElement('input');
             input.type = 'hidden';
             input.name = key;
             input.value = fields[key];
             form.appendChild(input);
           });
           document.body.appendChild(form);
           form.submit();
        } else throw new Error(res.error || 'Failed to initialize PayU');
      } else if (methodId === 'phonepe') {
        const res = await createPhonePePayment(selectedPack.id);
        if (res.paymentUrl) window.location.href = res.paymentUrl;
        else throw new Error(res.error || 'Failed to initialize PhonePe');
      } else if (methodId === 'razorpay') {
        const res = await createRazorpayOrder(selectedPack.id, selectedPack.price, selectedPack.gems);
        if (res.orderId && window.Razorpay) {
          const options = {
            key: res.key,
            amount: Math.round(selectedPack.price * 100),
            currency: 'USD',
            name: 'VibeMatch',
            description: `Purchase ${selectedPack.gems} Diamonds`,
            order_id: res.orderId,
            handler: async function (response: any) {
              try {
                const verifyRes = await verifyRazorpayOrder({ ...response, gemsToAdd: selectedPack.gems, packId: selectedPack.id, amount: selectedPack.price });
                if (verifyRes.success) {
                  onUpdateGems(verifyRes.newGems || ((user ? user.gems : 0) + selectedPack.gems));
                  setSuccessMsg(`🎉 Successfully bought ${selectedPack.gems} Diamonds!`);
                  setTimeout(() => { setSuccessMsg(null); setSelectedPack(null); onClose(); }, 2000);
                }
              } catch (err: any) { setErrorMsg(err.message || 'Payment verification failed'); }
            },
            theme: { color: '#00E676' }
          };
          const rzp = new window.Razorpay(options);
          rzp.on('payment.failed', function (response: any) { setErrorMsg(response.error.description || 'Payment failed'); });
          rzp.open();
        } else {
          throw new Error(res.error || 'Failed to initialize Razorpay');
        }
      } else {
        throw new Error('Payment method ' + methodId + ' is currently unavailable.');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Payment failed');
    } finally {
      setPurchasingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fadeIn">
      <div className="bg-[#121418] border border-white/10 rounded-3xl w-full max-w-lg max-h-[90vh] overflow-y-auto overflow-x-hidden shadow-2xl text-white relative flex flex-col">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-[#00E676]/15 via-emerald-500/10 to-transparent border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center space-x-3">
            {selectedPack ? (
              <button onClick={() => setSelectedPack(null)} className="p-2 bg-gray-800 rounded-full hover:bg-gray-700 transition">
                <ChevronLeft className="w-5 h-5 text-gray-300" />
              </button>
            ) : (
              <div className="p-2.5 bg-[#00E676]/20 text-[#00E676] rounded-2xl border border-[#00E676]/30 shadow-[0_0_15px_rgba(0,230,118,0.3)]">
                <FreeFireDiamond className="w-7 h-7" />
              </div>
            )}
            <div>
              <h2 className="text-xl font-black flex items-center gap-2">
                {selectedPack ? 'Checkout' : 'Diamonds Shop'}
              </h2>
              <p className="text-xs text-gray-400">
                {selectedPack ? `Pay $${selectedPack.price} for ${selectedPack.gems} Diamonds` : 'Unlock Super Match, Gender Filters & Live Video Gifts'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-white bg-gray-800 rounded-full transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 space-y-4 flex-1">
          {successMsg && (
            <div className="p-3 bg-emerald-500/20 border border-emerald-500/40 text-emerald-300 rounded-2xl text-xs font-bold text-center mb-4">
              {successMsg}
            </div>
          )}
          {errorMsg && (
            <div className="p-3 bg-red-500/20 border border-red-500/40 text-red-400 rounded-2xl text-xs font-bold text-center mb-4">
              {errorMsg}
            </div>
          )}

          {!selectedPack ? (
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {packs.length === 0 ? (
                <div className="col-span-2 text-center text-gray-500 py-8">No packs available right now.</div>
              ) : packs.map(pkg => (
                <div
                  key={pkg.id}
                  onClick={() => setSelectedPack(pkg)}
                  className={`p-4 rounded-2xl border-2 transition-all cursor-pointer relative flex flex-col justify-between ${
                    pkg.popular
                      ? 'border-[#00E676] bg-[#00E676]/10 shadow-[0_0_20px_rgba(0,230,118,0.25)] scale-102'
                      : 'border-white/5 bg-white/5 hover:border-[#00E676]/50 hover:bg-white/10'
                  }`}
                >
                  {pkg.popular && (
                    <span className="absolute -top-2.5 right-1 sm:right-3 whitespace-nowrap bg-gradient-to-r from-[#00E676] to-emerald-500 text-black text-[9px] font-black px-2 py-0.5 rounded-full shadow-[0_0_10px_rgba(0,230,118,0.5)]">
                      MOST POPULAR
                    </span>
                  )}

                  <div>
                    <div className="flex items-center space-x-2 text-[#00E676] font-black text-lg">
                      <FreeFireDiamond className="w-5 h-5" />
                      <span>{pkg.gems}</span>
                    </div>
                    {pkg.name && (
                      <span className="text-[10px] text-[#00E676] font-extrabold mt-1 block">
                        {pkg.name}
                      </span>
                    )}
                    {pkg.description && (
                      <span className="text-[10px] text-gray-400 font-medium mt-0.5 block line-clamp-1">
                        {pkg.description}
                      </span>
                    )}
                  </div>

                  <button
                    className="mt-4 w-full bg-gradient-to-r from-[#00E676] to-emerald-500 hover:from-[#00E676]/90 hover:to-emerald-500/90 text-black font-black text-xs py-2 rounded-xl transition-all shadow-[0_0_12px_rgba(0,230,118,0.3)] active:scale-95"
                  >
                    ${pkg.price.toFixed(2)}
                  </button>
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-2">Select Payment Method</h3>
              {availableMethods.length > 0 ? availableMethods.map((method) => (
                <button
                  key={method.id}
                  disabled={purchasingId !== null}
                  onClick={() => handleCheckout(method.id)}
                  className="w-full flex items-center justify-between p-4 rounded-2xl border border-gray-700 bg-gray-800/50 hover:bg-gray-800 transition-colors group"
                >
                  <div className="flex items-center space-x-3">
                    {method.imgSrc ? (
                      <img src={method.imgSrc} alt={method.label} className="w-8 h-8 rounded-md object-contain" />
                    ) : (
                      <span className="text-2xl">{method.icon}</span>
                    )}
                    <span className="font-bold text-gray-200">{method.label}</span>
                  </div>
                  {purchasingId === selectedPack.id ? (
                    <span className="text-xs text-amber-400 font-bold animate-pulse">Processing...</span>
                  ) : (
                    <span className="text-xs font-bold text-white bg-white/10 px-3 py-1.5 rounded-lg group-hover:bg-[#00E676] group-hover:text-black transition-colors">
                      Pay ${selectedPack.price}
                    </span>
                  )}
                </button>
              )) : (
                <div className="p-4 text-center text-red-400 bg-red-400/10 rounded-2xl border border-red-400/20">
                  No payment methods available for your platform.
                </div>
              )}
            </div>
          )}

          <div className="flex items-center justify-center space-x-2 text-[11px] text-gray-400 pt-2">
            <ShieldCheck className="w-4 h-4 text-[#00E676]" />
            <span>Secure 256-bit encrypted checkout</span>
          </div>
        </div>
      </div>
    </div>
  );
};
