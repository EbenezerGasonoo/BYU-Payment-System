import React from 'react';

export default function LanguageToggle({ currentLang, onToggle }) {
  return (
    <button 
      onClick={() => onToggle(currentLang === 'en' ? 'fr' : 'en')}
      className="language-toggle-btn"
      title="Switch Language / Changer la langue"
      aria-label="Toggle language"
    >
      <span className="lang-flag">{currentLang === 'en' ? '🇬🇧 EN' : '🇫🇷 FR'}</span>
      <span className="lang-arrow">⇄</span>
    </button>
  );
}
