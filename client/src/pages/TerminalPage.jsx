import { useState, useRef, useCallback, useEffect } from 'react'
import LinuxTerminal from '../components/linux/LinuxTerminal.jsx'
import {
  Terminal,
  Shield,
  Cpu,
  HardDrive,
  Play,
  BookOpen,
  FolderTree,
  RotateCcw,
  Download,
  Copy,
  Check,
  ChevronRight,
  FileText,
  Folder,
  AlertTriangle,
  X,
  Code2
} from 'lucide-react'
import './TerminalPage.css'

const CHEAT_SHEET_CATEGORIES = [
  {
    title: 'Compilers & Run',
    items: [
      { cmd: 'gcc hello.c && ./a.out', desc: 'Compile & run C program' },
      { cmd: 'g++ hello.cpp && ./a.out', desc: 'Compile & run C++ program' },
      { cmd: 'python3 hello.py', desc: 'Execute Python 3 script' },
      { cmd: 'python3 -c "print(42)"', desc: 'Run inline Python' },
      { cmd: 'javac App.java && java App', desc: 'Compile & run Java class' },
      { cmd: 'bash welcome.sh', desc: 'Execute shell script' }
    ]
  },
  {
    title: 'Text Editors',
    items: [
      { cmd: 'nano hello.c', desc: 'Open file in GNU nano editor' },
      { cmd: 'vim hello.c', desc: 'Open file in Vim modal editor' }
    ]
  },
  {
    title: 'Navigation & Folders',
    items: [
      { cmd: 'ls -la', desc: 'List files with detailed attributes' },
      { cmd: 'pwd', desc: 'Print current directory path' },
      { cmd: 'cd ~', desc: 'Change to home directory' },
      { cmd: 'mkdir project', desc: 'Create new directory' },
      { cmd: 'tree', desc: 'Display directory tree hierarchy' }
    ]
  },
  {
    title: 'File Operations',
    items: [
      { cmd: 'cat README.txt', desc: 'Print file contents' },
      { cmd: 'touch notes.txt', desc: 'Create empty file' },
      { cmd: 'cp hello.c backup.c', desc: 'Copy file to destination' },
      { cmd: 'mv notes.txt draft.txt', desc: 'Rename or move file' },
      { cmd: 'rm notes.txt', desc: 'Delete file' }
    ]
  },
  {
    title: 'System & Utilities',
    items: [
      { cmd: 'neofetch', desc: 'System specs and GLUG banner' },
      { cmd: 'whoami', desc: 'Print active username' },
      { cmd: 'uptime', desc: 'System uptime and load average' },
      { cmd: 'free -h', desc: 'Memory usage statistics' },
      { cmd: 'df -h', desc: 'Disk filesystem space usage' },
      { cmd: 'man gcc', desc: 'View command manual page' },
      { cmd: 'clear', desc: 'Clear terminal screen' }
    ]
  }
]

export default function TerminalPage() {
  const terminalRef = useRef(null)
  const pageRef = useRef(null)
  const [activeDrawer, setActiveDrawer] = useState(null)
  const [currentFs, setCurrentFs] = useState(null)
  const [currentCwd, setCurrentCwd] = useState('/home/user')
  const [copiedCmd, setCopiedCmd] = useState(null)
  const [toast, setToast] = useState(null)
  const [showResetModal, setShowResetModal] = useState(false)

  useEffect(() => {
    if (pageRef.current) {
      pageRef.current.scrollLeft = 0
    }
  }, [])

  const showToast = useCallback((msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 3000)
  }, [])

  const handleFsChange = useCallback((fs, cwd) => {
    setCurrentFs(fs)
    setCurrentCwd(cwd)
  }, [])

  const handleRun = useCallback((cmd) => {
    terminalRef.current?.runCommand(cmd)
  }, [])

  const handleInsert = useCallback((cmd) => {
    terminalRef.current?.insertCommand(cmd)
    showToast(`Pasted "${cmd}" to prompt`)
  }, [showToast])

  const handleCopy = useCallback((cmd) => {
    navigator.clipboard.writeText(cmd)
    setCopiedCmd(cmd)
    showToast('Command copied to clipboard')
    setTimeout(() => setCopiedCmd(null), 2000)
  }, [showToast])

  const handleReset = useCallback(() => {
    setShowResetModal(true)
  }, [])

  const confirmReset = useCallback(() => {
    terminalRef.current?.resetFs(true)
    setShowResetModal(false)
    showToast('Virtual filesystem reset to default')
  }, [showToast])

  const handleExportBackup = useCallback(() => {
    try {
      const userNode = currentFs?.children?.home?.children?.user?.children || {}
      const backupData = {
        exportedAt: new Date().toISOString(),
        files: userNode
      }
      const blob = new Blob([JSON.stringify(backupData, null, 2)], {
        type: 'application/json'
      })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `glug-terminal-backup-${Date.now()}.json`
      a.click()
      URL.revokeObjectURL(url)
      showToast('Virtual workspace exported successfully')
    } catch {
      showToast('Failed to export backup')
    }
  }, [currentFs, showToast])

  const userFiles = currentFs?.children?.home?.children?.user?.children || {}
  const userFileKeys = Object.keys(userFiles)

  return (
    <div className="terminal-page-container" ref={pageRef}>
      {toast && (
        <div className="terminal-toast">
          <span>{toast}</span>
        </div>
      )}

      <div className="terminal-page-header">
        <div className="terminal-page-title-group">
          <div className="terminal-badge-icon">
            <Terminal size={22} />
          </div>
          <div className="terminal-title-text-group">
            <div className="terminal-title-with-pill">
              <h1 className="terminal-page-title">GLUG Linux Terminal</h1>
              <span className="terminal-cloud-pill">Cloud Workstation</span>
            </div>
            <p className="terminal-page-sub">
              Persistent browser-based Linux shell with GCC 9.2, Python 3.10, OpenJDK, Vim, and GNU Nano
            </p>
          </div>
        </div>

        <div className="terminal-header-controls">
          <div className="terminal-pills">
            <span className="terminal-pill">
              <HardDrive size={13} /> Cloud Persisted
            </span>
            <span className="terminal-pill">
              <Cpu size={13} /> Judge0 Execution
            </span>
            <span className="terminal-pill">
              <Shield size={13} /> Isolated Sandbox
            </span>
          </div>
        </div>
      </div>

      <div className={`terminal-main-layout ${activeDrawer ? 'has-drawer' : ''}`}>
        <div className="terminal-wrapper-frame">
          <div className="terminal-toolbar">
            <div className="terminal-toolbar-left">
              <span className="terminal-toolbar-indicator" />
              <span className="terminal-toolbar-label">Console</span>
              <span className="terminal-toolbar-path">
                {currentCwd === '/home/user' ? '~' : currentCwd}
              </span>
            </div>

            <div className="terminal-toolbar-actions">
              <button
                type="button"
                className={`terminal-tool-btn ${activeDrawer === 'cheatsheet' ? 'active' : ''}`}
                onClick={() => setActiveDrawer((prev) => (prev === 'cheatsheet' ? null : 'cheatsheet'))}
                title="Command reference"
              >
                <BookOpen size={14} />
                <span>Cheat Sheet</span>
              </button>

              <button
                type="button"
                className={`terminal-tool-btn ${activeDrawer === 'files' ? 'active' : ''}`}
                onClick={() => setActiveDrawer((prev) => (prev === 'files' ? null : 'files'))}
                title="Virtual filesystem explorer"
              >
                <FolderTree size={14} />
                <span>Files ({userFileKeys.length})</span>
              </button>

              <button
                type="button"
                className="terminal-tool-btn"
                onClick={handleExportBackup}
                title="Download backup of /home/user"
              >
                <Download size={14} />
                <span>Export</span>
              </button>

              <button
                type="button"
                className="terminal-tool-btn reset"
                onClick={handleReset}
                title="Reset virtual filesystem"
              >
                <RotateCcw size={14} />
                <span>Reset</span>
              </button>
            </div>
          </div>

          <LinuxTerminal
            ref={terminalRef}
            username="student"
            hostname="glug"
            height={560}
            onFsChange={handleFsChange}
            onResetRequest={() => setShowResetModal(true)}
          />
        </div>

        {activeDrawer && (
          <aside className="terminal-drawer" aria-label="Utility Panel">
            <div className="terminal-drawer-header">
              <div className="terminal-drawer-tabs">
                <button
                  type="button"
                  className={`terminal-drawer-tab ${activeDrawer === 'cheatsheet' ? 'active' : ''}`}
                  onClick={() => setActiveDrawer('cheatsheet')}
                >
                  <BookOpen size={14} />
                  <span>Cheat Sheet</span>
                </button>
                <button
                  type="button"
                  className={`terminal-drawer-tab ${activeDrawer === 'files' ? 'active' : ''}`}
                  onClick={() => setActiveDrawer('files')}
                >
                  <FolderTree size={14} />
                  <span>Files ({userFileKeys.length})</span>
                </button>
              </div>
              <button
                type="button"
                className="terminal-drawer-close"
                onClick={() => setActiveDrawer(null)}
                aria-label="Close drawer"
              >
                <X size={16} />
              </button>
            </div>

            <div className="terminal-drawer-content">
              {activeDrawer === 'cheatsheet' && (
                <div className="cheatsheet-container">
                  {CHEAT_SHEET_CATEGORIES.map((cat) => (
                    <div key={cat.title} className="cheatsheet-section">
                      <h3 className="cheatsheet-section-title">{cat.title}</h3>
                      <div className="cheatsheet-list">
                        {cat.items.map((item) => (
                          <div key={item.cmd} className="cheatsheet-card">
                            <div className="cheatsheet-card-main">
                              <code className="cheatsheet-code">{item.cmd}</code>
                              <span className="cheatsheet-desc">{item.desc}</span>
                            </div>
                            <div className="cheatsheet-actions">
                              <button
                                type="button"
                                className="cheatsheet-action-btn run"
                                onClick={() => handleRun(item.cmd)}
                                title="Execute in terminal"
                              >
                                <Play size={11} />
                                <span>Run</span>
                              </button>
                              <button
                                type="button"
                                className="cheatsheet-action-btn"
                                onClick={() => handleInsert(item.cmd)}
                                title="Insert into input"
                              >
                                <span>Insert</span>
                              </button>
                              <button
                                type="button"
                                className="cheatsheet-action-btn copy"
                                onClick={() => handleCopy(item.cmd)}
                                title="Copy command"
                              >
                                {copiedCmd === item.cmd ? <Check size={12} /> : <Copy size={12} />}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {activeDrawer === 'files' && (
                <div className="filetree-container">
                  <div className="filetree-header-path">
                    <Folder size={14} />
                    <span>/home/user</span>
                  </div>
                  {userFileKeys.length === 0 ? (
                    <div className="filetree-empty">
                      <span>No files in /home/user</span>
                    </div>
                  ) : (
                    <div className="filetree-list">
                      {userFileKeys.map((name) => {
                        const file = userFiles[name]
                        const isDir = file?.type === 'dir'
                        const isCode = name.endsWith('.c') || name.endsWith('.cpp') || name.endsWith('.py') || name.endsWith('.sh')
                        const contentLength = file?.content ? file.content.length : 0

                        return (
                          <div key={name} className="filetree-item">
                            <div className="filetree-item-info">
                              {isDir ? (
                                <Folder size={15} className="filetree-icon folder" />
                              ) : isCode ? (
                                <Code2 size={15} className="filetree-icon code" />
                              ) : (
                                <FileText size={15} className="filetree-icon file" />
                              )}
                              <span className="filetree-filename">{name}</span>
                              {!isDir && (
                                <span className="filetree-size">{contentLength} B</span>
                              )}
                            </div>
                            <div className="filetree-item-actions">
                              {!isDir && (
                                <>
                                  <button
                                    type="button"
                                    className="filetree-btn"
                                    onClick={() => handleRun(`cat ${name}`)}
                                    title="Display file contents"
                                  >
                                    cat
                                  </button>
                                  <button
                                    type="button"
                                    className="filetree-btn"
                                    onClick={() => handleRun(`nano ${name}`)}
                                    title="Open in GNU nano"
                                  >
                                    nano
                                  </button>
                                  <button
                                    type="button"
                                    className="filetree-btn"
                                    onClick={() => handleRun(`vim ${name}`)}
                                    title="Open in Vim"
                                  >
                                    vim
                                  </button>
                                </>
                              )}
                              {isDir && (
                                <button
                                  type="button"
                                  className="filetree-btn"
                                  onClick={() => handleRun(`cd ${name}`)}
                                  title="Enter directory"
                                >
                                  cd
                                </button>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </aside>
        )}
      </div>

      {showResetModal && (
        <div className="terminal-modal-backdrop" onClick={() => setShowResetModal(false)}>
          <div className="terminal-modal" onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
            <div className="terminal-modal-header">
              <div className="terminal-modal-badge danger">
                <AlertTriangle size={22} />
              </div>
              <div className="terminal-modal-title-group">
                <h2 className="terminal-modal-title">Reset Virtual Filesystem?</h2>
                <p className="terminal-modal-sub">This action cannot be undone.</p>
              </div>
              <button
                type="button"
                className="terminal-modal-close"
                onClick={() => setShowResetModal(false)}
                aria-label="Close dialog"
              >
                <X size={18} />
              </button>
            </div>

            <div className="terminal-modal-body">
              <p className="terminal-modal-text">
                Resetting will restore all virtual files in <code>/home/user</code> to the original GLUG default configuration.
              </p>
              <div className="terminal-modal-warning-box">
                <AlertTriangle size={15} className="warning-icon" />
                <span>Any custom files, code scripts, or edits created in this session will be permanently wiped.</span>
              </div>
            </div>

            <div className="terminal-modal-footer">
              <button
                type="button"
                className="terminal-modal-btn cancel"
                onClick={() => setShowResetModal(false)}
              >
                Cancel
              </button>
              <button
                type="button"
                className="terminal-modal-btn danger"
                onClick={confirmReset}
              >
                <RotateCcw size={14} />
                <span>Reset Filesystem</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
