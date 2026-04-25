import { Languages } from 'lucide-react';
import { useLanguage } from '../contexts/LanguageContext';

export function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === 'en' ? 'ar' : 'en')}
      className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
      title={language === 'en' ? 'العربية' : 'English'}
    >
      <Languages className="w-5 h-5" />
    </button>
  );
}
