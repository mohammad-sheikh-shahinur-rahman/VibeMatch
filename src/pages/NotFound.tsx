import React from 'react';
import { useNavigate } from 'react-router-dom';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();
  return (
    <div className="min-h-screen bg-[#0d0e12] flex flex-col items-center justify-center text-white font-sans text-center px-4">
      <h1 className="text-9xl font-black text-[#00E676] drop-shadow-[0_0_40px_rgba(0,230,118,0.3)]">404</h1>
      <h2 className="text-3xl font-extrabold mt-4 mb-2">Page Not Found</h2>
      <p className="text-gray-400 mb-8 max-w-md">The page you are looking for doesn't exist, has been moved, or is temporarily unavailable.</p>
      <button
        onClick={() => navigate('/')}
        className="bg-[#00E676] hover:bg-[#00C853] text-black font-extrabold px-8 py-3.5 rounded-full shadow-lg transition-transform hover:scale-105 active:scale-95"
      >
        Return Home
      </button>
    </div>
  );
};
