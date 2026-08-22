import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import { LANGUAGE_LIST } from '../utils/languageConfig';

export default function LanguageSelector({ selectedLanguage, onLanguageChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      return () => document.removeEventListener('keydown', handleKeyDown);
    }
  }, [isOpen]);

  const currentLang = LANGUAGE_LIST.find((l) => l.id === selectedLanguage) || LANGUAGE_LIST[0];

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className={`language-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        id="language-selector-btn"
      >
        <img src={currentLang.logo} alt={currentLang.name} className="lang-btn-logo" />
        <span>{currentLang.name}</span>
        <ChevronDown className="chevron" />
      </button>

      <div
        className={`language-dropdown ${isOpen ? 'visible' : ''}`}
        role="listbox"
        aria-labelledby="language-selector-btn"
      >
        {LANGUAGE_LIST.map((lang) => (
          <button
            key={lang.id}
            className={`language-option ${lang.id === selectedLanguage ? 'active' : ''}`}
            role="option"
            aria-selected={lang.id === selectedLanguage}
            onClick={() => {
              onLanguageChange(lang.id);
              setIsOpen(false);
            }}
          >
            <img src={lang.logo} alt={lang.name} className="lang-option-logo" />
            <span>{lang.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
