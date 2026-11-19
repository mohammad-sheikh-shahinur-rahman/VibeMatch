import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Send, ArrowLeft, CheckCircle } from 'lucide-react';
import { sendContactMessage, getCurrentUser } from '../lib/auth';
import toast from 'react-hot-toast';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';

declare global {
  interface Window {
    grecaptcha: any;
    onRecaptchaLoad: () => void;
  }
}

export const ContactPage: React.FC<any> = ({ user, activeLanguages, currentLang, setCurrentLang, siteSettings }) => {
  const navigate = useNavigate();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [userId, setUserId] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Recaptcha state
  const [recaptchaSettings, setRecaptchaSettings] = useState<any>(null);
  const [recaptchaToken, setRecaptchaToken] = useState<string>('');
  const recaptchaWidgetId = useRef<any>(null);

  useEffect(() => {
    // Check if user is logged in
    getCurrentUser().then(user => {
      if (user) {
        setName(user.name || '');
        setEmail(user.email || '');
        setUserId(user.id);
      }
    });

    // Fetch public settings for ReCaptcha
    fetch('/api/settings/public')
      .then(res => res.json())
      .then(data => {
        if (data.enableRecaptcha && data.recaptchaSiteKey) {
          setRecaptchaSettings(data);
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (!recaptchaSettings) return;

    const { recaptchaVersion, recaptchaSiteKey } = recaptchaSettings;
    
    // Inject script
    const script = document.createElement('script');
    if (recaptchaVersion === 'v2') {
      window.onRecaptchaLoad = () => {
        if (window.grecaptcha && document.getElementById('recaptcha-container')) {
          recaptchaWidgetId.current = window.grecaptcha.render('recaptcha-container', {
            sitekey: recaptchaSiteKey,
            callback: (token: string) => setRecaptchaToken(token)
          });
        }
      };
      script.src = 'https://www.google.com/recaptcha/api.js?onload=onRecaptchaLoad&render=explicit';
    } else {
      script.src = `https://www.google.com/recaptcha/api.js?render=${recaptchaSiteKey}`;
    }
    script.async = true;
    script.defer = true;
    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
      delete window.onRecaptchaLoad;
    };
  }, [recaptchaSettings]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !message) {
      toast.error('Please fill in all fields');
      return;
    }

    setIsSubmitting(true);

    try {
      let finalToken = recaptchaToken;

      // For v3, we need to execute and get token on submit
      if (recaptchaSettings && recaptchaSettings.recaptchaVersion === 'v3') {
        if (!window.grecaptcha) {
          throw new Error('reCAPTCHA not loaded');
        }
        finalToken = await window.grecaptcha.execute(recaptchaSettings.recaptchaSiteKey, { action: 'submit_contact' });
      }

      // For v2, check if they checked the box
      if (recaptchaSettings && recaptchaSettings.recaptchaVersion === 'v2' && !finalToken) {
        toast.error('Please verify that you are not a robot');
        setIsSubmitting(false);
        return;
      }

      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, message, userId, recaptchaToken: finalToken })
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      setSubmitted(true);
      toast.success('Message sent successfully!');
    } catch (err: any) {
      toast.error(err.message || 'Failed to send message');
      if (recaptchaSettings && recaptchaSettings.recaptchaVersion === 'v2' && window.grecaptcha) {
        window.grecaptcha.reset(recaptchaWidgetId.current);
        setRecaptchaToken('');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex flex-col">
      <Header activeTab="video-chat" setActiveTab={(t) => navigate(t === 'video-chat' ? '/' : `/${t}`)} user={user} onOpenShop={() => {}} onOpenDrawer={() => navigate('/')} onOpenAuthModal={() => navigate('/')} settings={siteSettings} activeLanguages={activeLanguages} currentLang={currentLang} setCurrentLang={setCurrentLang} />
      <div className="flex-1 flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-gray-400 hover:text-white transition mb-8"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          Back
        </button>

        {submitted ? (
          <div className="bg-[#181a20] rounded-3xl p-8 border border-gray-800 text-center shadow-xl">
            <div className="w-16 h-16 bg-[#00E676]/20 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle className="w-8 h-8 text-[#00E676]" />
            </div>
            <h2 className="text-2xl font-black text-white mb-2">Message Sent!</h2>
            <p className="text-gray-400 mb-8">
              Thank you for contacting us. Our support team will get back to you shortly.
            </p>
            <button
              onClick={() => navigate('/')}
              className="w-full bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold py-4 rounded-xl transition-all"
            >
              Return Home
            </button>
          </div>
        ) : (
          <div className="bg-[#181a20] rounded-3xl p-8 border border-gray-800 shadow-xl">
            <div className="flex items-center space-x-3 mb-8">
              <div className="p-3 bg-[#00E676]/20 rounded-xl">
                <Mail className="w-6 h-6 text-[#00E676]" />
              </div>
              <div>
                <h1 className="text-2xl font-black text-white">Contact Us</h1>
                <p className="text-sm text-gray-400">We usually reply within 24 hours.</p>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00E676] transition-colors"
                  placeholder="John Doe"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Email Address</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00E676] transition-colors"
                  placeholder="john@example.com"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase mb-2">Message</label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  rows={4}
                  className="w-full bg-gray-900 border border-gray-800 rounded-xl px-4 py-3.5 text-white placeholder-gray-600 focus:outline-none focus:border-[#00E676] transition-colors resize-none"
                  placeholder="How can we help you?"
                  required
                />
              </div>

              {recaptchaSettings && recaptchaSettings.recaptchaVersion === 'v2' && (
                <div className="flex justify-center pt-2">
                  <div id="recaptcha-container"></div>
                </div>
              )}

              {recaptchaSettings && recaptchaSettings.recaptchaVersion === 'v3' && (
                <div className="text-[10px] text-gray-500 text-center">
                  This site is protected by reCAPTCHA and the Google <a href="https://policies.google.com/privacy" className="text-[#00E676] hover:underline">Privacy Policy</a> and <a href="https://policies.google.com/terms" className="text-[#00E676] hover:underline">Terms of Service</a> apply.
                </div>
              )}

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold py-4 rounded-xl transition-all flex items-center justify-center space-x-2 mt-4 disabled:opacity-70"
              >
                {isSubmitting ? (
                  <span className="animate-pulse">Sending...</span>
                ) : (
                  <>
                    <span>Send Message</span>
                    <Send className="w-4 h-4" />
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>
      </div>
      <Footer settings={siteSettings} />
    </div>
  );
};
