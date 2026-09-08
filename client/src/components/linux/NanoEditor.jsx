import { useState, useRef, useEffect } from "react";
import "./LinuxTerminal.css";

export default function NanoEditor({ path, initialContent = "", onSave, onClose }) {
  const [content, setContent] = useState(initialContent);
  const [savedContent, setSavedContent] = useState(initialContent);
  const [statusMessage, setStatusMessage] = useState("");
  const [cutBuffer, setCutBuffer] = useState("");
  const [cursorPos, setCursorPos] = useState({ row: 1, col: 1 });

  const textareaRef = useRef(null);
  const isModified = content !== savedContent;
  const fileName = path.split("/").pop() || "untitled";
  const lines = content.split("\n");

  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  function handleSelect() {
    if (!textareaRef.current) return;
    const pos = textareaRef.current.selectionStart;
    const textBefore = content.substring(0, pos);
    const linesBefore = textBefore.split("\n");
    setCursorPos({
      row: linesBefore.length,
      col: linesBefore[linesBefore.length - 1].length + 1,
    });
  }

  function handleSave() {
    onSave(content);
    setSavedContent(content);
    setStatusMessage(`[ Wrote ${lines.length} lines ]`);
    setTimeout(() => setStatusMessage(""), 3000);
  }

  function handleExit() {
    if (isModified) {
      const confirmSave = window.confirm("Save modified buffer (ANSWERING \"No\" WILL DESTROY CHANGES)?");
      if (confirmSave) {
        onSave(content);
      }
    }
    onClose();
  }

  function handleCutLine() {
    const currentLines = content.split("\n");
    const r = Math.max(0, cursorPos.row - 1);
    if (currentLines.length > 0) {
      const deleted = currentLines.splice(r, 1)[0];
      setCutBuffer(deleted);
      setContent(currentLines.join("\n"));
      setStatusMessage("[ Cut 1 line ]");
      setTimeout(() => setStatusMessage(""), 2000);
    }
  }

  function handleUncutLine() {
    if (!cutBuffer && cutBuffer !== "") return;
    const currentLines = content.split("\n");
    const r = Math.max(0, cursorPos.row - 1);
    currentLines.splice(r, 0, cutBuffer);
    setContent(currentLines.join("\n"));
    setStatusMessage("[ Uncut 1 line ]");
    setTimeout(() => setStatusMessage(""), 2000);
  }

  return (
    <div className="nano-overlay">
      <div className="nano-editor">
        {/* Nano Header */}
        <div className="nano-header">
          <span className="nano-header-left">GNU nano 7.2</span>
          <span className="nano-header-center">File: {path}</span>
          <span className="nano-header-right">{isModified ? "[Modified]" : ""}</span>
        </div>

        {/* Nano Buffer */}
        <div className="nano-body">
          <div className="nano-linenumbers" aria-hidden="true">
            {lines.map((_, i) => (
              <div
                key={i}
                className={`nano-line-no ${cursorPos.row === i + 1 ? "active" : ""}`}
              >
                {i + 1}
              </div>
            ))}
          </div>

          <textarea
            ref={textareaRef}
            className="nano-textarea"
            value={content}
            onChange={(e) => {
              setContent(e.target.value);
              handleSelect();
            }}
            onSelect={handleSelect}
            onClick={handleSelect}
            onKeyDown={(e) => {
              // Ctrl + O = Write Out
              if (e.ctrlKey && e.key.toLowerCase() === "o") {
                e.preventDefault();
                handleSave();
                return;
              }

              // Ctrl + X = Exit
              if (e.ctrlKey && e.key.toLowerCase() === "x") {
                e.preventDefault();
                handleExit();
                return;
              }

              // Ctrl + K = Cut Line
              if (e.ctrlKey && e.key.toLowerCase() === "k") {
                e.preventDefault();
                handleCutLine();
                return;
              }

              // Ctrl + U = Uncut
              if (e.ctrlKey && e.key.toLowerCase() === "u") {
                e.preventDefault();
                handleUncutLine();
                return;
              }

              // Ctrl + C = Cur Pos
              if (e.ctrlKey && e.key.toLowerCase() === "c") {
                e.preventDefault();
                setStatusMessage(`[ line ${cursorPos.row}/${lines.length} (${Math.round((cursorPos.row / lines.length) * 100)}%), col ${cursorPos.col}/${lines[cursorPos.row - 1]?.length || 0} ]`);
                return;
              }

              // Tab indent
              if (e.key === "Tab") {
                e.preventDefault();
                const start = e.target.selectionStart;
                const end = e.target.selectionEnd;
                const next = content.substring(0, start) + "    " + content.substring(end);
                setContent(next);
                setTimeout(() => {
                  if (textareaRef.current) {
                    textareaRef.current.selectionStart = textareaRef.current.selectionEnd = start + 4;
                  }
                }, 0);
              }
            }}
            spellCheck="false"
            autoComplete="off"
          />
        </div>

        {/* Nano Status Bar */}
        <div className="nano-status">
          <span>{statusMessage || `${lines.length} lines`}</span>
        </div>

        {/* Nano Footer Keybinds */}
        <div className="nano-footer">
          <div className="nano-key-item">
            <span className="nano-key">^G</span> Get Help
          </div>
          <div className="nano-key-item" onClick={handleSave}>
            <span className="nano-key">^O</span> WriteOut
          </div>
          <div className="nano-key-item" onClick={handleCutLine}>
            <span className="nano-key">^K</span> Cut Line
          </div>
          <div className="nano-key-item" onClick={handleUncutLine}>
            <span className="nano-key">^U</span> Uncut Text
          </div>
          <div className="nano-key-item" onClick={handleExit}>
            <span className="nano-key">^X</span> Exit
          </div>
        </div>
      </div>
    </div>
  );
}
