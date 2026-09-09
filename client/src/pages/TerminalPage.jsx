import { useState } from 'react'
import LinuxTerminal from '../components/linux/LinuxTerminal.jsx'
import { Terminal, Shield, Cpu, HardDrive } from 'lucide-react'
import './TerminalPage.css'

export default function TerminalPage() {
  return (
    <div className="terminal-page-container">
      <div className="terminal-page-header">
        <div className="terminal-page-title-group">
          <div className="terminal-badge-icon">
            <Terminal size={22} />
          </div>
          <div>
            <h1 className="terminal-page-title">GLUG Linux Terminal</h1>
            <p className="terminal-page-sub">Interactive browser-based Linux environment with GCC, Python 3, and persistent storage</p>
          </div>
        </div>

        <div className="terminal-pills">
          <span className="terminal-pill">
            <HardDrive size={14} /> Persistent FS
          </span>
          <span className="terminal-pill">
            <Cpu size={14} /> Judge0 Execution
          </span>
          <span className="terminal-pill">
            <Shield size={14} /> Isolated Sandbox
          </span>
        </div>
      </div>

      <div className="terminal-wrapper-frame">
        <LinuxTerminal username="student" hostname="glug" height={640} />
      </div>
    </div>
  )
}
