import { useRef, useCallback, useEffect, useState } from 'react';
import Editor from '@monaco-editor/react';
import { LANGUAGES } from '../utils/languageConfig';

export default function CodeEditor({
  language,
  code,
  onChange,
  errorLines,
  onRun,
  files = [],
  activeFileName = '',
  onActiveFileChange,
  onAddFile,
  onCloseFile,
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [newFileName, setNewFileName] = useState('');
  const editorRef = useRef(null);
  const monacoRef = useRef(null);
  const decorationsRef = useRef([]);

  const langConfig = LANGUAGES[language];

  const handleEditorDidMount = useCallback((editor, monaco) => {
    editorRef.current = editor;
    monacoRef.current = monaco;

    // Define custom dark theme
    monaco.editor.defineTheme('codeforge-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6a737d', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'ff7b72' },
        { token: 'string', foreground: 'a5d6ff' },
        { token: 'number', foreground: '79c0ff' },
        { token: 'type', foreground: 'ffa657' },
        { token: 'function', foreground: 'd2a8ff' },
        { token: 'variable', foreground: 'ffa657' },
      ],
      colors: {
        'editor.background': '#0d1117',
        'editor.foreground': '#e6edf3',
        'editor.lineHighlightBackground': '#161b2266',
        'editor.selectionBackground': '#264f7844',
        'editorLineNumber.foreground': '#484f58',
        'editorLineNumber.activeForeground': '#8b949e',
        'editorGutter.background': '#0d1117',
        'editor.inactiveSelectionBackground': '#264f7822',
        'editorIndentGuide.background': '#21262d',
        'editorCursor.foreground': '#58a6ff',
        'editorWhitespace.foreground': '#21262d',
        'minimap.background': '#0d1117',
      },
    });

    monaco.editor.setTheme('codeforge-dark');
    editor.focus();
  }, []);

  // Update error decorations when errorLines change
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const newDecorations = (errorLines || []).map((line) => ({
      range: new monaco.Range(line, 1, line, 1),
      options: {
        isWholeLine: true,
        className: 'error-line-decoration',
        glyphMarginClassName: 'error-line-glyph',
        glyphMarginHoverMessage: { value: `⚠️ Error on line ${line}` },
        overviewRuler: {
          color: '#f85149',
          position: monaco.editor.OverviewRulerLane.Full,
        },
      },
    }));

    decorationsRef.current = editor.deltaDecorations(
      decorationsRef.current,
      newDecorations
    );

    // Scroll to first error line
    if (errorLines && errorLines.length > 0) {
      editor.revealLineInCenter(errorLines[0]);
    }
  }, [errorLines]);

  // Ctrl+Enter to run
  useEffect(() => {
    const editor = editorRef.current;
    const monaco = monacoRef.current;
    if (!editor || !monaco) return;

    const actionId = editor.addAction({
      id: 'run-code',
      label: 'Run Code',
      keybindings: [monaco.KeyMod.CtrlCmd | monaco.KeyCode.Enter],
      run: () => {
        if (onRun) onRun();
      },
    });

    return () => actionId.dispose();
  }, [onRun]);

  return (
    <div className="editor-panel">
      <div className="editor-panel-header">
        <div className="editor-tabs-container">
          {files.map((file) => {
            const fileLangConfig = LANGUAGES[file.language] || { name: 'Plain Text', logo: '' };
            const isActive = file.name === activeFileName;
            return (
              <div
                key={file.name}
                className={`editor-tab ${isActive ? 'active' : ''}`}
                onClick={() => onActiveFileChange && onActiveFileChange(file.name)}
              >
                {fileLangConfig.logo && (
                  <img src={fileLangConfig.logo} alt={fileLangConfig.name} className="tab-logo-img" />
                )}
                <span>{file.name}</span>
                {files.length > 1 && (
                  <span
                    className="tab-close-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseFile && onCloseFile(file.name);
                    }}
                    title="Close file"
                  >
                    ×
                  </span>
                )}
              </div>
            );
          })}

          {isAdding ? (
            <div className="editor-add-tab-input-container">
              <input
                type="text"
                className="editor-add-tab-input"
                placeholder="filename.py"
                value={newFileName}
                onChange={(e) => setNewFileName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    if (newFileName.trim()) {
                      onAddFile && onAddFile(newFileName.trim());
                      setIsAdding(false);
                      setNewFileName('');
                    }
                  } else if (e.key === 'Escape') {
                    setIsAdding(false);
                    setNewFileName('');
                  }
                }}
                autoFocus
              />
              <button
                className="editor-add-tab-btnconfirm"
                onClick={() => {
                  if (newFileName.trim()) {
                    onAddFile && onAddFile(newFileName.trim());
                    setIsAdding(false);
                    setNewFileName('');
                  }
                }}
              >
                ✓
              </button>
              <button
                className="editor-add-tab-btncancel"
                onClick={() => {
                  setIsAdding(false);
                  setNewFileName('');
                }}
              >
                ×
              </button>
            </div>
          ) : (
            <button
              className="editor-add-tab-btn"
              onClick={() => setIsAdding(true)}
              title="Create new file"
            >
              +
            </button>
          )}
        </div>
      </div>
      <div className="editor-wrapper">
        <Editor
          height="100%"
          language={langConfig?.monacoLang || 'plaintext'}
          value={code}
          onChange={(value) => onChange(value || '')}
          onMount={handleEditorDidMount}
          theme="codeforge-dark"
          options={{
            fontSize: 19,
            fontFamily: "'JetBrains Mono', 'Fira Code', 'Cascadia Code', monospace",
            fontLigatures: true,
            lineHeight: 28,
            padding: { top: 12, bottom: 12 },
            minimap: { enabled: true, scale: 1, renderCharacters: false },
            scrollBeyondLastLine: false,
            smoothScrolling: true,
            cursorBlinking: 'smooth',
            cursorSmoothCaretAnimation: 'on',
            renderLineHighlight: 'all',
            glyphMargin: true,
            folding: true,
            bracketPairColorization: { enabled: true },
            autoClosingBrackets: 'always',
            autoClosingQuotes: 'always',
            tabSize: 4,
            insertSpaces: true,
            wordWrap: 'off',
            automaticLayout: true,
            suggest: {
              showKeywords: true,
              showSnippets: true,
            },
          }}
          loading={
            <div className="output-loading" style={{ height: '100%' }}>
              <div className="loading-spinner" />
              <span className="loading-text">Loading editor...</span>
            </div>
          }
        />
      </div>
    </div>
  );
}
