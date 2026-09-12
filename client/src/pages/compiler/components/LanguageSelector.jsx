import { useState, useRef, useEffect, useMemo } from 'react';
import { ChevronDown, Search } from 'lucide-react';
import { LANGUAGE_LIST } from '../utils/languageConfig';

export default function LanguageSelector({ selectedLanguage, onLanguageChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const dropdownRef = useRef(null);
  const searchInputRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    function handleKeyDown(e) {
      if (e.key === 'Escape') setIsOpen(false);
    }
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      setTimeout(() => searchInputRef.current?.focus({ preventScroll: true }), 50);
      return () => document.removeEventListener('keydown', handleKeyDown);
    } else {
      setSearchQuery('');
    }
  }, [isOpen]);

  const currentLang = LANGUAGE_LIST.find((l) => l.id === selectedLanguage) || LANGUAGE_LIST[0];

  const filteredLanguages = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return LANGUAGE_LIST;
    return LANGUAGE_LIST.filter(
      (l) => l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)
    );
  }, [searchQuery]);

  return (
    <div className="language-selector" ref={dropdownRef}>
      <button
        className={`language-btn ${isOpen ? 'open' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="listbox"
        id="language-selector-btn"
        type="button"
      >
        <img src={currentLang.logo} alt={currentLang.name} className="lang-btn-logo" />
        <span className="lang-btn-name">{currentLang.name}</span>
        <ChevronDown className={`chevron ${isOpen ? 'rotate' : ''}`} size={14} />
      </button>

      {isOpen && (
        <div
          className="language-dropdown visible"
          role="listbox"
          aria-labelledby="language-selector-btn"
        >
          <div className="lang-search-box">
            <Search size={13} className="lang-search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              placeholder="Search language..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="lang-search-input"
              spellCheck="false"
            />
          </div>

          <div className="lang-list-scroll">
            {filteredLanguages.length > 0 ? (
              filteredLanguages.map((lang) => (
                <button
                  key={lang.id}
                  className={`language-option ${lang.id === selectedLanguage ? 'active' : ''}`}
                  role="option"
                  aria-selected={lang.id === selectedLanguage}
                  type="button"
                  onClick={() => {
                    onLanguageChange(lang.id);
                    setIsOpen(false);
                  }}
                >
                  <img src={lang.logo} alt={lang.name} className="lang-option-logo" />
                  <span className="lang-option-title">{lang.name}</span>
                  <span className="lang-option-ext">{lang.extension}</span>
                </button>
              ))
            ) : (
              <div className="lang-no-match">No language matches found</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
