import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Header } from '../components/Header';
import { Footer } from '../components/Footer';


export const CustomPage = ({ user, siteSettings, activeLanguages, currentLang, setCurrentLang }: any) => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [page, setPage] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPage = async () => {
      try {
        const res = await fetch(`/api/pages/${slug}`);
        if (!res.ok) {
          if (res.status === 404) {
            navigate('/', { replace: true });
          }
          return;
        }
        const data = await res.json();
        setPage(data.page);
        document.title = `${data.page.title} - ${siteSettings?.siteName || 'VibeMatch'}`;
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchPage();
  }, [slug, navigate, siteSettings]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0d0e12] flex flex-col">
        <Header 
          activeTab="video-chat" 
          setActiveTab={(t) => navigate(t === 'video-chat' ? '/' : `/${t}`)} 
          user={user} 
          onOpenShop={() => {}} 
          onOpenDrawer={() => navigate('/')} 
          onOpenAuthModal={() => navigate('/')} 
          settings={siteSettings} activeLanguages={activeLanguages} currentLang={currentLang} setCurrentLang={setCurrentLang} />
        <div className="flex-1 flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-[#00E676] border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer settings={siteSettings} activeLanguages={activeLanguages} currentLang={currentLang} setCurrentLang={setCurrentLang} />
      </div>
    );
  }

  if (!page) return null;

  return (
    <div className="min-h-screen bg-[#0d0e12] flex flex-col">
      <Header 
        activeTab="video-chat" 
        setActiveTab={(t) => navigate(t === 'video-chat' ? '/' : `/${t}`)} 
        user={user} 
        onOpenShop={() => {}} 
        onOpenDrawer={() => navigate('/')} 
        onOpenAuthModal={() => navigate('/')} 
        settings={siteSettings} activeLanguages={activeLanguages} currentLang={currentLang} setCurrentLang={setCurrentLang} />
      
      <main className="flex-1 max-w-4xl w-full mx-auto px-4 py-12 md:py-20 mt-16 md:mt-20">
        <h1 className="text-4xl md:text-5xl font-black text-white mb-8 md:mb-12 text-center">{page.title}</h1>
        
        <div 
          className="prose prose-invert prose-green max-w-none text-gray-300 leading-relaxed font-medium
            prose-headings:text-white prose-headings:font-bold prose-a:text-[#00E676] hover:prose-a:text-[#00C853]
            prose-p:mb-6 prose-ul:my-6 prose-li:my-2 ql-editor"
          dangerouslySetInnerHTML={{ __html: page.content }}
        />
      </main>

      <Footer settings={siteSettings} activeLanguages={activeLanguages} currentLang={currentLang} setCurrentLang={setCurrentLang} />
    </div>
  );
};

