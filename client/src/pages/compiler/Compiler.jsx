import { useState, useCallback, useRef, useEffect } from 'react';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import OutputPanel from './components/OutputPanel';
import { LANGUAGES } from './utils/languageConfig';
import { executeCode } from './api/judge0';
import { runPythonInteractive, sendInputToPyodide, abortPyodideExecution } from './api/pyodideRunner';
import './compiler.css';

export default function Compiler() {
  const [files, setFiles] = useState([
    { name: 'main.py', content: LANGUAGES.python.defaultCode, language: 'python' }
  ]);
  const [activeFileName, setActiveFileName] = useState('main.py');
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForInput, setIsWaitingForInput] = useState(false);
  const [inputPrompt, setInputPrompt] = useState('');
  const [errorLines, setErrorLines] = useState([]);
  const [stdin, setStdin] = useState('');
  const [terminalLogs, setTerminalLogs] = useState([]);
  const [activeTab, setActiveTab] = useState('terminal');

  const [editorWidth, setEditorWidth] = useState(58);
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const [mobileView, setMobileView] = useState(() => (window.innerWidth < 900 ? 'editor' : 'split'));
  const [isFullscreen, setIsFullscreen] = useState(false);

  const [fontSize, setFontSize] = useState(
    () => localStorage.getItem('glug_editor_font_size') || '14'
  );

  const containerRef = useRef(null);
  const mainContainerRef = useRef(null);
  const abortControllerRef = useRef(null);

  const activeFile = files.find(f => f.name === activeFileName) || files[0];
  const code = activeFile.content;
  const language = activeFile.language;

  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === 'glug_editor_font_size' && e.newValue) {
        setFontSize(e.newValue);
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(Boolean(document.fullscreenElement));
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handleFontSizeChange = useCallback((newSize) => {
    setFontSize(newSize);
    localStorage.setItem('glug_editor_font_size', String(newSize));
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleCodeChange = useCallback((newCode) => {
    setFiles(prev => prev.map(f => f.name === activeFileName ? { ...f, content: newCode } : f));
  }, [activeFileName]);

  const handleActiveFileChange = useCallback((fileName) => {
    setActiveFileName(fileName);
    setResult(null);
    setErrorLines([]);
  }, []);

  const handleAddFile = useCallback((fileName) => {
    if (files.some(f => f.name === fileName)) {
      alert(`File "${fileName}" already exists.`);
      return;
    }

    const ext = fileName.split('.').pop();
    let lang = 'python';
    Object.keys(LANGUAGES).forEach((key) => {
      if (LANGUAGES[key].extension === `.${ext}`) {
        lang = key;
      }
    });

    const defaultBoilerplate = LANGUAGES[lang]?.defaultCode || '';
    const newFile = {
      name: fileName,
      content: defaultBoilerplate,
      language: lang
    };

    setFiles(prev => [...prev, newFile]);
    setActiveFileName(fileName);
  }, [files]);

  const handleCloseFile = useCallback((fileName) => {
    if (files.length <= 1) return;

    setFiles(prev => {
      const filtered = prev.filter(f => f.name !== fileName);
      if (activeFileName === fileName) {
        setActiveFileName(filtered[0].name);
      }
      return filtered;
    });
  }, [files, activeFileName]);

  const handleLanguageChange = useCallback((newLang) => {
    const defaultExt = LANGUAGES[newLang].extension;
    const defaultName = `main${defaultExt}`;

    const existingFile = files.find(f => f.name === defaultName);
    if (existingFile) {
      setActiveFileName(defaultName);
    } else {
      const newFile = {
        name: defaultName,
        content: LANGUAGES[newLang].defaultCode,
        language: newLang
      };
      setFiles(prev => [...prev, newFile]);
      setActiveFileName(defaultName);
    }
    setResult(null);
    setErrorLines([]);
  }, [files]);

  const handleResetCode = useCallback(() => {
    const defaultSnippet = LANGUAGES[language]?.defaultCode || '';
    setFiles(prev =>
      prev.map(f => (f.name === activeFileName ? { ...f, content: defaultSnippet } : f))
    );
    setResult(null);
    setErrorLines([]);
  }, [language, activeFileName]);

  const handleDownloadCode = useCallback(() => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = activeFileName || `code${LANGUAGES[language]?.extension || '.txt'}`;
    link.click();
    URL.revokeObjectURL(url);
  }, [code, activeFileName, language]);

  const handleUploadCode = useCallback((fileName, fileContent) => {
    const ext = fileName.split('.').pop();
    let detectedLang = language;
    Object.keys(LANGUAGES).forEach((key) => {
      if (LANGUAGES[key].extension === `.${ext}`) {
        detectedLang = key;
      }
    });

    setFiles(prev => {
      const exists = prev.find(f => f.name === fileName);
      if (exists) {
        return prev.map(f => (f.name === fileName ? { ...f, content: fileContent, language: detectedLang } : f));
      }
      return [...prev, { name: fileName, content: fileContent, language: detectedLang }];
    });
    setActiveFileName(fileName);
  }, [language]);

  const addTerminalLog = useCallback((type, text) => {
    if (text === undefined || text === null) return;
    setTerminalLogs((prev) => [
      ...prev,
      {
        id: `${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        type,
        text,
      },
    ]);
  }, []);

  const handleClearTerminal = useCallback(() => {
    setTerminalLogs([]);
    setResult(null);
    setErrorLines([]);
  }, []);

  const handleStop = useCallback(() => {
    if (language === 'python') {
      abortPyodideExecution();
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setIsWaitingForInput(false);
    setIsRunning(false);
    addTerminalLog('system', '\n[Execution cancelled by user]\n');
  }, [language, addTerminalLog]);

  const handleSendInput = useCallback((inputValue) => {
    const textToSend = inputValue;

    if (isWaitingForInput) {
      addTerminalLog('stdin', textToSend + '\n');
      setIsWaitingForInput(false);
      setInputPrompt('');

      if (language === 'python') {
        const sent = sendInputToPyodide(textToSend);
        if (!sent) {
          setStdin((prev) => (prev ? `${prev}\n${textToSend}` : textToSend));
        }
      }
    } else {
      addTerminalLog('stdin', textToSend + '\n');
      setStdin((prev) => (prev ? `${prev}\n${textToSend}` : textToSend));

      if (result?.isInputMissing) {
        addTerminalLog(
          'system',
          `[Input buffered: "${textToSend}". Re-run code to submit with buffer]\n`
        );
      }
    }
  }, [isWaitingForInput, language, addTerminalLog, result]);

  const runCode = async (fileToRun) => {
    if (mobileView === 'editor') {
      setMobileView(window.innerWidth < 900 ? 'output' : 'split');
    }

    setIsRunning(true);
    setIsWaitingForInput(false);
    setInputPrompt('');
    setResult(null);
    setErrorLines([]);
    setActiveTab('terminal');

    const langConfig = LANGUAGES[fileToRun.language];
    const timestamp = new Date().toLocaleTimeString();
    addTerminalLog(
      'system',
      `> [${timestamp}] Running ${langConfig?.name || fileToRun.language}...\n`
    );

    abortControllerRef.current = new AbortController();

    if (fileToRun.language === 'python') {
      try {
        const execResult = await runPythonInteractive(fileToRun.content, {
          onStdout: (text) => addTerminalLog('stdout', text),
          onStderr: (text) => addTerminalLog('stderr', text),
          onRequestInput: (prompt) => {
            setIsWaitingForInput(true);
            setInputPrompt(prompt || '');
          },
          prefilledStdin: stdin,
        });

        setResult(execResult);
        if (execResult.errorLines && execResult.errorLines.length > 0) {
          setErrorLines(execResult.errorLines);
        }

        if (execResult.success) {
          addTerminalLog(
            'system',
            `\n[Process completed successfully in ${execResult.time || '0.01s'}]\n`
          );
        } else if (execResult.statusDescription === 'Interrupted') {
          addTerminalLog('system', `\n[Process interrupted]\n`);
        } else {
          addTerminalLog(
            'system',
            `\n[Process exited with error in ${execResult.time || '0.01s'}]\n`
          );
        }
      } catch (err) {
        const errorMsg = err.message || String(err);
        addTerminalLog('stderr', `${errorMsg}\n`);
        setResult({
          success: false,
          output: '',
          error: errorMsg,
          statusDescription: 'Execution Error',
          statusId: -1,
          time: null,
          memory: null,
          errorLines: [],
          compilationError: false,
          runtimeError: true,
          timeLimitExceeded: false,
        });
      } finally {
        setIsRunning(false);
        setIsWaitingForInput(false);
        abortControllerRef.current = null;
      }
    } else {
      try {
        const execResult = await executeCode(
          fileToRun.language,
          fileToRun.content,
          stdin,
          abortControllerRef.current?.signal
        );

        setResult(execResult);

        if (execResult.output) {
          addTerminalLog('stdout', execResult.output);
        }

        if (execResult.error) {
          addTerminalLog('stderr', execResult.error);
        }

        if (execResult.errorLines && execResult.errorLines.length > 0) {
          setErrorLines(execResult.errorLines);
        }

        if (execResult.success) {
          addTerminalLog(
            'system',
            `\n[Process finished in ${execResult.time || '0.01s'} with exit code 0]\n`
          );
        } else if (execResult.isInputMissing) {
          addTerminalLog(
            'system',
            `\n[Program paused: missing standard input for ${langConfig.name}]\n`
          );
        } else {
          addTerminalLog(
            'system',
            `\n[Process finished with error (${execResult.statusDescription}) in ${execResult.time || '0.01s'}]\n`
          );
        }
      } catch (error) {
        if (error.name === 'CanceledError' || error.message === 'canceled') {
          addTerminalLog('system', `\n[Process execution aborted]\n`);
        } else {
          addTerminalLog('stderr', `Execution failed: ${error.message}\n`);
          setResult({
            success: false,
            output: '',
            error: error.message,
            statusDescription: 'Error',
            statusId: -1,
            time: null,
            memory: null,
            errorLines: [],
            compilationError: false,
            runtimeError: false,
            timeLimitExceeded: false,
          });
        }
      } finally {
        setIsRunning(false);
        setIsWaitingForInput(false);
        abortControllerRef.current = null;
      }
    }
  };

  const handleRun = useCallback(async () => {
    if (isRunning || !activeFile.content.trim()) return;
    await runCode(activeFile);
  }, [isRunning, activeFile, stdin]);

  const handleSelectErrorLine = useCallback((line) => {
    setErrorLines([line]);
  }, []);

  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizingWidth(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleResizeMove = (moveEvent) => {
      if (!mainContainerRef.current) return;
      const container = mainContainerRef.current;
      const rect = container.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      const clamped = Math.min(Math.max(percentage, 25), 75);
      setEditorWidth(clamped);
    };

    const handleResizeEnd = () => {
      setIsResizingWidth(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  }, []);

  return (
    <div className={`compiler-scoped-container ${isFullscreen ? 'is-fullscreen' : ''}`} ref={containerRef}>
      <Header
        selectedLanguage={language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        onStop={handleStop}
        isRunning={isRunning}
        fontSize={fontSize}
        onChangeFontSize={handleFontSizeChange}
        isFullscreen={isFullscreen}
        onToggleFullscreen={handleToggleFullscreen}
        mobileView={mobileView}
        onChangeMobileView={setMobileView}
      />

      <div
        className={`main-container view-${mobileView}`}
        ref={mainContainerRef}
      >
        <div
          className="editor-pane-wrapper"
          style={{
            width: mobileView === 'split' ? `${editorWidth}%` : '100%',
            display: mobileView === 'output' ? 'none' : 'flex',
          }}
        >
          <CodeEditor
            language={language}
            code={code}
            onChange={handleCodeChange}
            errorLines={errorLines}
            onRun={handleRun}
            files={files}
            activeFileName={activeFileName}
            onActiveFileChange={handleActiveFileChange}
            onAddFile={handleAddFile}
            onCloseFile={handleCloseFile}
            fontSize={fontSize}
            onResetCode={handleResetCode}
            onDownloadCode={handleDownloadCode}
            onUploadCode={handleUploadCode}
          />
        </div>

        {mobileView === 'split' && (
          <div
            className={`resize-handle ${isResizingWidth ? 'active' : ''}`}
            onMouseDown={handleResizeStart}
          />
        )}

        <div
          className="output-pane-wrapper"
          style={{
            width: mobileView === 'split' ? `${100 - editorWidth}%` : '100%',
            display: mobileView === 'editor' ? 'none' : 'flex',
          }}
        >
          <OutputPanel
            terminalLogs={terminalLogs}
            isRunning={isRunning}
            isWaitingForInput={isWaitingForInput}
            inputPrompt={inputPrompt}
            onSendInput={handleSendInput}
            onClearTerminal={handleClearTerminal}
            result={result}
            stdin={stdin}
            onStdinChange={setStdin}
            activeTab={activeTab}
            setActiveTab={setActiveTab}
            errorLines={errorLines}
            onSelectErrorLine={handleSelectErrorLine}
            language={language}
          />
        </div>
      </div>

      {isResizingWidth && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            cursor: 'col-resize',
            background: 'transparent',
            userSelect: 'none',
          }}
        />
      )}
    </div>
  );
}
