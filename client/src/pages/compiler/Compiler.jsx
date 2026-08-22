import { useState, useCallback, useRef } from 'react';
import Header from './components/Header';
import CodeEditor from './components/CodeEditor';
import OutputPanel from './components/OutputPanel';
import TerminalStdin from './components/TerminalStdin';
import { LANGUAGES } from './utils/languageConfig';
import { executeCode } from './api/judge0';
import './compiler.css';

export default function Compiler() {
  const [files, setFiles] = useState([
    { name: 'main.py', content: LANGUAGES.python.defaultCode, language: 'python' }
  ]);
  const [activeFileName, setActiveFileName] = useState('main.py');
  const [result, setResult] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [errorLines, setErrorLines] = useState([]);
  const [stdin, setStdin] = useState('');
  const [stdinOpen, setStdinOpen] = useState(false);

  // Terminal history logs
  const [terminalHistory, setTerminalHistory] = useState([
    { type: 'info', text: 'Welcome to GLUG Compiler Terminal.' },
    { type: 'info', text: 'Type "help" for a list of available commands.' }
  ]);

  // Resizable panel widths & heights
  const [editorWidth, setEditorWidth] = useState(70);
  const [terminalHeight, setTerminalHeight] = useState(180);
  const [isResizingHeight, setIsResizingHeight] = useState(false);
  const [isResizingWidth, setIsResizingWidth] = useState(false);
  const containerRef = useRef(null);
  const terminalHeightRef = useRef(terminalHeight);
  terminalHeightRef.current = terminalHeight;

  const activeFile = files.find(f => f.name === activeFileName) || files[0];
  const code = activeFile.content;
  const language = activeFile.language;

  // Code editor onChange handler
  const handleCodeChange = useCallback((newCode) => {
    setFiles(prev => prev.map(f => f.name === activeFileName ? { ...f, content: newCode } : f));
  }, [activeFileName]);

  // Tab change handler
  const handleActiveFileChange = useCallback((fileName) => {
    setActiveFileName(fileName);
    setResult(null);
    setErrorLines([]);
  }, []);

  // Add new file/tab
  const handleAddFile = useCallback((fileName) => {
    if (files.some(f => f.name === fileName)) {
      alert(`File "${fileName}" already exists.`);
      return;
    }

    // Determine language from file extension
    const ext = fileName.split('.').pop();
    let lang = 'plaintext';
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

  // Close tab
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

  // Handle header language dropdown change
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

  // Internal execution method
  const runCode = async (fileToRun) => {
    setIsRunning(true);
    setResult(null);
    setErrorLines([]);

    try {
      const execResult = await executeCode(fileToRun.language, fileToRun.content, stdin);
      setResult(execResult);
      if (execResult.errorLines && execResult.errorLines.length > 0) {
        setErrorLines(execResult.errorLines);
      }

      if (execResult.success) {
        const out = execResult.output || '(No output)';
        setTerminalHistory(prev => [
          ...prev,
          { type: 'output', text: out },
          { type: 'info', text: `Program exited successfully (Time: ${execResult.time || 'N/A'}, Memory: ${execResult.memory || 'N/A'})` }
        ]);
      } else {
        const err = execResult.error || execResult.output || 'Unknown error';
        setTerminalHistory(prev => [
          ...prev,
          { type: 'error', text: `${execResult.statusDescription}:` },
          { type: 'error', text: err }
        ]);
      }
    } catch (error) {
      const errMsg = error.message;
      setResult({
        success: false,
        output: '',
        error: errMsg,
        statusDescription: 'Error',
        statusId: -1,
        time: null,
        memory: null,
        errorLines: [],
      });
      setTerminalHistory(prev => [
        ...prev,
        { type: 'error', text: `Execution failed: ${errMsg}` }
      ]);
    } finally {
      setIsRunning(false);
    }
  };

  // Run triggered by click / shortcut
  const handleRun = useCallback(async () => {
    if (isRunning || !activeFile.content.trim()) return;

    // Simulate running command in terminal
    const runCmd = activeFile.language === 'python' ? `python3 ${activeFile.name}` :
                   activeFile.language === 'javascript' ? `node ${activeFile.name}` :
                   activeFile.language === 'cpp' ? `g++ ${activeFile.name} && ./a.out` :
                   activeFile.language === 'c' ? `gcc ${activeFile.name} && ./a.out` : `run ${activeFile.name}`;

    setTerminalHistory(prev => [
      ...prev,
      { type: 'prompt', text: runCmd },
      { type: 'info', text: `Compiling & executing ${activeFile.name}...` }
    ]);

    // Force-open terminal panel so users see the running prompt & output
    setStdinOpen(true);

    await runCode(activeFile);
  }, [isRunning, activeFile, stdin]);

  // Terminal shell commands parser
  const handleExecuteCommand = useCallback(async (cmdStr) => {
    const trimmed = cmdStr.trim();
    if (!trimmed) {
      // Just empty enter, add prompt line only
      setTerminalHistory(prev => [...prev, { type: 'prompt', text: '' }]);
      return;
    }

    // Add command prompt line to history
    setTerminalHistory(prev => [...prev, { type: 'prompt', text: trimmed }]);

    const parts = trimmed.split(/\s+/);
    const cmd = parts[0];
    const args = parts.slice(1);

    if (cmd === 'clear') {
      setTerminalHistory([]);
      return;
    }

    if (cmd === 'help') {
      setTerminalHistory(prev => [
        ...prev,
        { type: 'info', text: 'Available commands:' },
        { type: 'info', text: '  run               - Compile and run the active file' },
        { type: 'info', text: '  python3 <file>    - Run python file (e.g. python3 main.py)' },
        { type: 'info', text: '  node <file>       - Run javascript file (e.g. node main.js)' },
        { type: 'info', text: '  g++ <file>        - Compile C++ file (e.g. g++ main.cpp)' },
        { type: 'info', text: '  gcc <file>        - Compile C file (e.g. gcc main.c)' },
        { type: 'info', text: '  cat <file>        - View file contents' },
        { type: 'info', text: '  ls                - List files in current directory' },
        { type: 'info', text: '  clear             - Clear terminal screen' },
        { type: 'info', text: '  * Note: switch to "Raw Mode" to provide stdin buffer.' }
      ]);
      return;
    }

    if (cmd === 'ls') {
      const fileList = files.map(f => f.name).join('    ');
      setTerminalHistory(prev => [...prev, { type: 'output', text: fileList }]);
      return;
    }

    if (cmd === 'cat') {
      if (args.length === 0) {
        setTerminalHistory(prev => [...prev, { type: 'error', text: 'cat: missing file operand' }]);
        return;
      }
      const targetFile = files.find(f => f.name === args[0]);
      if (!targetFile) {
        setTerminalHistory(prev => [...prev, { type: 'error', text: `cat: ${args[0]}: No such file or directory` }]);
        return;
      }
      setTerminalHistory(prev => [...prev, { type: 'output', text: targetFile.content }]);
      return;
    }

    const isRunPython = (cmd === 'python3' || cmd === 'python');
    const isRunNode = (cmd === 'node');
    const isRunCpp = (cmd === 'g++');
    const isRunC = (cmd === 'gcc');
    const isRunGeneric = (cmd === 'run' || cmd === './a.out');

    if (isRunPython || isRunNode || isRunCpp || isRunC || isRunGeneric) {
      let fileToRun = activeFile;
      if (args.length > 0 && !isRunGeneric) {
        const found = files.find(f => f.name === args[0]);
        if (found) {
          fileToRun = found;
        } else {
          setTerminalHistory(prev => [...prev, { type: 'error', text: `${cmd}: ${args[0]}: No such file or directory` }]);
          return;
        }
      }

      setTerminalHistory(prev => [...prev, { type: 'info', text: `Compiling & executing ${fileToRun.name}...` }]);
      await runCode(fileToRun);
      return;
    }

    // Command not found
    setTerminalHistory(prev => [...prev, { type: 'error', text: `bash: ${cmd}: command not found` }]);
  }, [files, activeFile, stdin]);

  // Resize handlers
  const handleResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizingWidth(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const handleResizeMove = (moveEvent) => {
      if (!containerRef.current) return;
      const container = containerRef.current;
      const rect = container.getBoundingClientRect();
      const x = moveEvent.clientX - rect.left;
      const percentage = (x / rect.width) * 100;
      const clamped = Math.min(Math.max(percentage, 30), 85);
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

  const handleHeightResizeStart = useCallback((e) => {
    e.preventDefault();
    setIsResizingHeight(true);
    document.body.style.cursor = 'row-resize';
    document.body.style.userSelect = 'none';

    const startY = e.clientY;
    const startHeight = terminalHeightRef.current;

    const handleResizeMove = (moveEvent) => {
      const deltaY = moveEvent.clientY - startY;
      const newHeight = startHeight - deltaY;
      
      let maxHeight = 600;
      if (containerRef.current) {
        maxHeight = containerRef.current.getBoundingClientRect().height - 150;
      }
      const clamped = Math.min(Math.max(newHeight, 80), maxHeight);
      setTerminalHeight(clamped);
    };

    const handleResizeEnd = () => {
      setIsResizingHeight(false);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      window.removeEventListener('mousemove', handleResizeMove);
      window.removeEventListener('mouseup', handleResizeEnd);
    };

    window.addEventListener('mousemove', handleResizeMove);
    window.addEventListener('mouseup', handleResizeEnd);
  }, []);


  return (
    <div className="compiler-scoped-container">
      <Header
        selectedLanguage={language}
        onLanguageChange={handleLanguageChange}
        onRun={handleRun}
        isRunning={isRunning}
      />

      <div className="main-container" ref={containerRef}>
        <div style={{ width: `${editorWidth}%`, display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0, overflow: 'hidden' }}>
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
          />

          {/* Stdin section */}
          {!stdinOpen && (
            <div className="stdin-toggle-bar" onClick={() => setStdinOpen(true)}>
              <span className="stdin-toggle-label">
                <span>📥</span>
                <span>Open Terminal Input (stdin)</span>
              </span>
            </div>
          )}

          {stdinOpen && (
            <div
              className={`terminal-resize-handle ${isResizingHeight ? 'active' : ''}`}
              onMouseDown={handleHeightResizeStart}
            />
          )}

          <TerminalStdin
            stdin={stdin}
            onChange={setStdin}
            stdinOpen={stdinOpen}
            setStdinOpen={setStdinOpen}
            height={terminalHeight}
            terminalHistory={terminalHistory}
            onExecuteCommand={handleExecuteCommand}
          />
        </div>

        <div
          className={`resize-handle ${isResizingWidth ? 'active' : ''}`}
          onMouseDown={handleResizeStart}
        />

        <div style={{ width: `${100 - editorWidth}%`, height: '100%', minWidth: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          <OutputPanel result={result} isRunning={isRunning} />
        </div>
      </div>

      {/* Resizing Overlay to capture mouse events and bypass Monaco */}
      {(isResizingWidth || isResizingHeight) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            cursor: isResizingHeight ? 'row-resize' : 'col-resize',
            background: 'transparent',
            userSelect: 'none',
          }}
        />
      )}
    </div>
  );
}
