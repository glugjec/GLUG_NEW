import { useState, useRef, useEffect } from "react";
import "./LinuxTerminal.css";

export default function VimEditor({ path, initialContent = "", onSave, onClose }) {
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [mode, setMode] = useState("NORMAL"); // NORMAL | INSERT | COMMAND
  const [commandLine, setCommandLine] = useState("");
  const [statusMessage, setStatusMessage] = useState(`\"${path.split("/").pop()}\" [New File]`);
  const [showLineNumbers, setShowLineNumbers] = useState(true);
  const [cursorPos, setCursorPos] = useState({ row: 1, col: 1 });
  const [history, setHistory] = useState([initialContent]);
  const [yankBuffer, setYankBuffer] = useState("");

  const textareaRef = useRef(null);
  const commandInputRef = useRef(null);
  const editorRef = useRef(null);

  const isModified = content !== savedContent;
  const fileName = path.split("/").pop() || "untitled";
  const lines = content.split("\n");

  useEffect(() => {
    if (mode === "INSERT") {
      textareaRef.current?.focus();
    } else if (mode === "COMMAND") {
      commandInputRef.current?.focus();
    } else {
      editorRef.current?.focus();
    }
  }, [mode]);

  function handleTextareaSelect() {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = content.substring(0, pos);
    const linesBefore = textBefore.split("\n");
    const row = linesBefore.length;
    const col = linesBefore[linesBefore.length - 1].length + 1;
    setCursorPos({ row, col });
  }

  function pushHistory(newContent) {
    setHistory((prev) => [...prev.slice(-30), newContent]);
  }

  function executeVimCommand(cmdStr) {
    const trimmed = cmdStr.trim();
    if (!trimmed) {
      setMode("NORMAL");
      return;
    }

    if (trimmed === "w" || trimmed.startsWith("w ")) {
      onSave(content);
      setSavedContent(content);
      const byteCount = new Blob([content]).size;
      setStatusMessage(`\"${fileName}\" [w] ${lines.length}L, ${byteCount}B written`);
      setMode("NORMAL");
      return;
    }

    if (trimmed === "q") {
      if (isModified) {
        setStatusMessage("E37: No write since last change (add ! to override)");
        setMode("NORMAL");
        return;
      }
      onClose();
      return;
    }

    if (trimmed === "q!") {
      onClose();
      return;
    }

    if (trimmed === "wq" || trimmed === "x") {
      onSave(content);
      onClose();
      return;
    }

    if (trimmed === "set nu" || trimmed === "set number") {
      setShowLineNumbers(true);
      setStatusMessage("number");
      setMode("NORMAL");
      return;
    }

    if (trimmed === "set nonu" || trimmed === "set nonumber") {
      setShowLineNumbers(false);
      setStatusMessage("nonumber");
      setMode("NORMAL");
      return;
    }

    if (trimmed === "help") {
      setStatusMessage("VIM commands: :w (save), :q (quit), :wq (save & quit), :q! (discard)");
      setMode("NORMAL");
      return;
    }

    setStatusMessage(`E492: Not an editor command: ${trimmed}`);
    setMode("NORMAL");
  }

  function handleNormalKeyDown(e) {
    if (e.key === ":") {
      e.preventDefault();
      setCommandLine("");
      setMode("COMMAND");
      return;
    }

    if (e.key === "i") {
      e.preventDefault();
      setMode("INSERT");
      setStatusMessage("");
      return;
    }

    if (e.key === "a") {
      e.preventDefault();
      setMode("INSERT");
      setStatusMessage("");
      if (textareaRef.current) {
        const sel = textareaRef.current.selectionStart;
        textareaRef.current.setSelectionRange(sel + 1, sel + 1);
      }
      return;
    }

    if (e.key === "o") {
      e.preventDefault();
      const currentLines = content.split("\n");
      const r = Math.max(0, cursorPos.row - 1);
      currentLines.splice(r + 1, 0, "");
      const newText = currentLines.join("\n");
      pushHistory(content);
      setContent(newText);
      setCursorPos({ row: cursorPos.row + 1, col: 1 });
      setMode("INSERT");
      setStatusMessage("");
      return;
    }

    if (e.key === "d") {
      const currentLines = content.split("\n");
      const r = Math.max(0, cursorPos.row - 1);
      if (currentLines.length > 0) {
        const deleted = currentLines.splice(r, 1)[0];
        setYankBuffer(deleted);
        const newText = currentLines.join("\n");
        pushHistory(content);
        setContent(newText);
        setStatusMessage("1 line less");
      }
      return;
    }

    if (e.key === "y") {
      const currentLines = content.split("\n");
      const r = Math.max(0, cursorPos.row - 1);
      if (currentLines[r] !== undefined) {
        setYankBuffer(currentLines[r]);
        setStatusMessage("1 line yanked");
      }
      return;
    }

    if (e.key === "p") {
      if (!yankBuffer) return;
      const currentLines = content.split("\n");
      const r = Math.max(0, cursorPos.row - 1);
      currentLines.splice(r + 1, 0, yankBuffer);
      const newText = currentLines.join("\n");
      pushHistory(content);
      setContent(newText);
      setStatusMessage("1 line pasted");
      return;
    }

    if (e.key === "u") {
      if (history.length > 1) {
        const prevHistory = [...history];
        prevHistory.pop();
        const restored = prevHistory[prevHistory.length - 1];
        setHistory(prevHistory);
        setContent(restored);
        setStatusMessage("1 change undone");
      } else {
        setStatusMessage("Already at oldest change");
      }
      return;
    }

    if (e.key === "x") {
      if (!textareaRef.current) return;
      const pos = textareaRef.current.selectionStart;
      if (pos < content.length) {
        pushHistory(content);
        const newText = content.slice(0, pos) + content.slice(pos + 1);
        setContent(newText);
      }
      return;
    }

    if (e.key === "h" || e.key === "ArrowLeft") {
      e.preventDefault();
      if (textareaRef.current) {
        const pos = Math.max(0, textareaRef.current.selectionStart - 1);
        textareaRef.current.setSelectionRange(pos, pos);
        handleTextareaSelect();
      }
      return;
    }
    if (e.key === "l" || e.key === "ArrowRight") {
      e.preventDefault();
      if (textareaRef.current) {
        const pos = Math.min(content.length, textareaRef.current.selectionStart + 1);
        textareaRef.current.setSelectionRange(pos, pos);
        handleTextareaSelect();
      }
      return;
    }
    if (e.key === "G") {
      e.preventDefault();
      setCursorPos({ row: lines.length, col: 1 });
      if (textareaRef.current) {
        textareaRef.current.selectionStart = content.length;
        textareaRef.current.selectionEnd = content.length;
      }
      return;
    }
  }

  return (
    <div
      className="vim-overlay"
      ref={editorRef}
      tabIndex={0}
      onKeyDown={(e) => {
        if (mode === "NORMAL") {
          handleNormalKeyDown(e);
        }
      }}
    >
      <div className="vim-body">
        {showLineNumbers && (
          <div className="vim-linenumbers" aria-hidden="true">
            {lines.map((_, i) => (
              <div
                key={i}
                className={`vim-line-no ${cursorPos.row === i + 1 ? "active" : ""}`}
              >
                {i + 1}
              </div>
            ))}
            {Array.from({ length: Math.max(0, 15 - lines.length) }).map((_, i) => (
              <div key={`tilde-${i}`} className="vim-tilde">
                ~
              </div>
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          className="vim-textarea"
          value={content}
          readOnly={mode === "NORMAL"}
          onChange={(e) => {
            setContent(e.target.value);
            handleTextareaSelect();
          }}
          onSelect={handleTextareaSelect}
          onClick={handleTextareaSelect}
          onKeyDown={(e) => {
            if (e.key === "Escape") {
              e.preventDefault();
              setMode("NORMAL");
              setStatusMessage("");
              editorRef.current?.focus();
              return;
            }

            if (e.key === "Tab" && mode === "INSERT") {
              e.preventDefault();
              const start = e.target.selectionStart;
              const end = e.target.selectionEnd;
              const next = content.substring(0, start) + "  " + content.substring(end);
              setContent(next);
              setTimeout(() => {
                if (textareaRef.current) {
                  textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 2;
                }
              }, 0);
            }
          }}
          spellCheck="false"
          autoComplete="off"
        />
      </div>

      <div className="vim-bottombar">
        {mode === "COMMAND" ? (
          <div className="vim-commandline">
            <span className="vim-colon">:</span>
            <input
              ref={commandInputRef}
              className="vim-command-input"
              value={commandLine}
              onChange={(e) => setCommandLine(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  executeVimCommand(commandLine);
                } else if (e.key === "Escape") {
                  e.preventDefault();
                  setMode("NORMAL");
                  setStatusMessage("");
                  editorRef.current?.focus();
                }
              }}
              autoFocus
            />
          </div>
        ) : (
          <div className="vim-status-row">
            <div className="vim-status-left">
              {mode === "INSERT" ? (
                <span className="vim-mode-badge insert">-- INSERT --</span>
              ) : (
                <span className="vim-message">{statusMessage || (isModified ? "[+]" : "")}</span>
              )}
            </div>

            <div className="vim-status-right">
              <span className="vim-position">
                {cursorPos.row},{cursorPos.col}
              </span>
              <span className="vim-percent">
                {lines.length > 0 ? `${Math.round((cursorPos.row / lines.length) * 100)}%` : "Top"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
