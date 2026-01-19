import React from 'react';
import ReactDOM from 'react-dom/client';
import './style.css';
import DisplaySettings from './components/DisplaySettings';
import ImageUpload from './components/ImageUpload';
import ImageList from './components/ImageList';

function OptionsApp() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto max-w-4xl px-4">
        <header className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Screen Saver Settings</h1>
          <p className="mt-2 text-gray-600">
            Manage your image collection and customize your screen saver experience
          </p>
        </header>

        <main>
          <DisplaySettings />
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
