import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import LanguageSettings from './components/LanguageSettings';
import DisplaySettings from './components/DisplaySettings';
import ClockSettings from './components/ClockSettings';
import ImageUpload from './components/ImageUpload';
import ImageList from './components/ImageList';
import { useTranslation } from '@/lib/useTranslation';

function OptionsApp() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">{t('settingsTitle')}</h1>
          <p className="mt-2 text-gray-600">
            {t('settingsSubtitle')}
          </p>
        </header>

        <main>
          <LanguageSettings />
          <DisplaySettings />
          <ClockSettings />
          <ImageUpload />
          <ImageList />
        </main>
      </div>
    </div>
  );
}

const root = document.getElementById('root');
if (root) {
  ReactDOM.createRoot(root).render(
    <React.StrictMode>
      <OptionsApp />
    </React.StrictMode>
  );
}

export default OptionsApp;
