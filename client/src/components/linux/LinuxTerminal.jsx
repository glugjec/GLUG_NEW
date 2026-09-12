import { useEffect, useRef, useState, forwardRef, useImperativeHandle } from "react";
import { createPortal } from "react-dom";
import { useAuth } from "../../context/AuthContext.jsx";
import { usersApi } from "../../api.js";
import VimEditor from "./VimEditor.jsx";
import NanoEditor from "./NanoEditor.jsx";
import { executeCode } from "../../pages/compiler/api/judge0.js";
import {
  Zap,
  RefreshCw,
  Cloud,
  AlertTriangle,
  HardDrive,
  Terminal,
  X,
  Minus,
  Plus,
  ChevronUp,
  ChevronDown
} from "lucide-react";
import "./LinuxTerminal.css";

const STORAGE_KEY = "virtual-linux-fs";

const DEFAULT_FS = {
  type: "dir",
  children: {
    home: {
      type: "dir",
      children: {
        user: {
          type: "dir",
          children: {
            "README.txt": {
              type: "file",
              content:
                "Welcome to the GLUG Virtual Linux Terminal!\n\nFeatures:\n- Persistent Cloud File System (MongoDB Atlas)\n- Text Editors: vim, nano\n- Compilers: gcc, g++, python3, javac, java\n\nQuick Start:\n  gcc hello.c && ./a.out\n  python3 hello.py\n  vim hello.c\n  nano hello.py\n  neofetch\n  help",
            },
            "hello.c": {
              type: "file",
              content:
                "#include <stdio.h>\n\nint main() {\n    printf(\"Hello from GLUG Linux Terminal (GCC)!\\n\");\n    return 0;\n}\n",
            },
            "hello.py": {
              type: "file",
              content:
                "print(\"Hello from GLUG Python 3!\")\nfor i in range(1, 4):\n    print(f\"  [Task {i}] System operational!\")\n",
            },
            "welcome.sh": {
              type: "file",
              content:
                "echo '==============================='\necho ' Welcome to GLUG Virtual Linux!'\necho '==============================='\nneofetch\nls -la\n",
            },
          },
        },
      },
    },

    tmp: {
      type: "dir",
      children: {},
    },

    var: {
      type: "dir",
      children: {
        log: {
          type: "dir",
          children: {},
        },
      },
    },

    etc: {
      type: "dir",
      children: {
        "hostname": {
          type: "file",
          content: "virtual-linux",
        },
      },
    },

    "hello.txt": {
      type: "file",
      content: "Hello from LinuxTerminal!",
    },
  },
};

function clone(obj) {
  return JSON.parse(JSON.stringify(obj));
}

function normalizePath(path) {
  const parts = [];

  for (const part of path.split("/")) {
    if (!part || part === ".") continue;

    if (part === "..") {
      parts.pop();
    } else {
      parts.push(part);
    }
  }

  return "/" + parts.join("/");
}

function resolvePath(path, cwd) {
  if (!path) return cwd;

  if (path === "~") {
    return "/home/user";
  }

  if (path.startsWith("~/")) {
    return normalizePath("/home/user/" + path.slice(2));
  }

  if (path.startsWith("/")) {
    return normalizePath(path);
  }

  return normalizePath(`${cwd}/${path}`);
}

function getNode(fs, path) {
  if (path === "/") return fs;

  const parts = path.split("/").filter(Boolean);

  let node = fs;

  for (const part of parts) {
    if (!node || node.type !== "dir") return null;

    node = node.children?.[part];

    if (!node) return null;
  }

  return node;
}

function getParent(fs, path) {
  const normalized = normalizePath(path);

  if (normalized === "/") return null;

  const parts = normalized.split("/").filter(Boolean);
  const name = parts.pop();

  const parentPath = "/" + parts.join("/");

  return {
    parent: getNode(fs, parentPath || "/"),
    name,
  };
}

function basename(path) {
  const parts = normalizePath(path).split("/").filter(Boolean);
  return parts[parts.length - 1] || "/";
}

function dirname(path) {
  const parts = normalizePath(path).split("/").filter(Boolean);

  parts.pop();

  return "/" + parts.join("/");
}

function formatPrompt(cwd) {
  if (cwd === "/home/user") {
    return "~";
  }

  if (cwd.startsWith("/home/user/")) {
    return "~/" + cwd.slice("/home/user/".length);
  }

  return cwd;
}

const LinuxTerminal = forwardRef(function LinuxTerminal(
  {
    username = "student",
    hostname = "glug",
    height = 560,
    storageKey = STORAGE_KEY,
    onFsChange,
    onResetRequest,
  },
  ref
) {
  const { user } = useAuth();
  const effectiveUser = user?.username || username;
  const activeStorageKey = user ? `virtual-linux-fs_${user.id || user._id}` : storageKey;

  const [fs, setFs] = useState(() => {
    try {
      const saved = localStorage.getItem(activeStorageKey);

      return saved ? JSON.parse(saved) : clone(DEFAULT_FS);
    } catch {
      return clone(DEFAULT_FS);
    }
  });

  const [cwd, setCwd] = useState("/home/user");
  const [editor, setEditor] = useState(null);
  const [isRunning, setIsRunning] = useState(false);
  const [syncStatus, setSyncStatus] = useState(user ? "syncing" : "guest");
  const isLoadedRef = useRef(false);
  const saveTimeoutRef = useRef(null);
  const [isAwaitingStdin, setIsAwaitingStdin] = useState(false);
  const stdinResolverRef = useRef(null);

  useEffect(() => {
    if (onFsChange) {
      onFsChange(fs, cwd);
    }
  }, [fs, cwd, onFsChange]);

  function promptForInput() {
    setIsAwaitingStdin(true);
    return new Promise((resolve) => {
      stdinResolverRef.current = (val) => {
        setIsAwaitingStdin(false);
        resolve(val);
      };
    });
  }

  const [env, setEnv] = useState({
    USER: effectiveUser,
    HOSTNAME: hostname,
    HOME: "/home/user",
    PWD: "/home/user",
  });

  useEffect(() => {
    setEnv((prev) => ({ ...prev, USER: effectiveUser }));
  }, [effectiveUser]);

  function updateCwd(path) {
    setCwd(path);
    setEnv((prev) => ({ ...prev, PWD: path }));
  }

  // Load persistent terminal session from MongoDB Atlas when authenticated
  useEffect(() => {
    let cancelled = false;

    async function loadCloudTerminal() {
      if (!user) {
        try {
          const local = localStorage.getItem(activeStorageKey);
          if (local) setFs(JSON.parse(local));
          else setFs(clone(DEFAULT_FS));
        } catch {
          setFs(clone(DEFAULT_FS));
        }
        setSyncStatus("guest");
        isLoadedRef.current = true;
        return;
      }

      setSyncStatus("syncing");
      try {
        const res = await usersApi.getTerminalState();
        if (cancelled) return;

        if (res?.terminalState?.fs) {
          setFs(res.terminalState.fs);
          if (res.terminalState.cwd) {
            setCwd(res.terminalState.cwd);
            setEnv((prev) => ({ ...prev, PWD: res.terminalState.cwd }));
          }
          if (Array.isArray(res.terminalState.history)) {
            setHistory(res.terminalState.history);
          }
          localStorage.setItem(activeStorageKey, JSON.stringify(res.terminalState.fs));
          setSyncStatus("synced");
        } else {
          // No cloud terminal yet, check local storage or use default
          let initialFs = clone(DEFAULT_FS);
          try {
            const local = localStorage.getItem(activeStorageKey);
            if (local) initialFs = JSON.parse(local);
          } catch {
            // fallback
          }
          setFs(initialFs);
          await usersApi.saveTerminalState({
            fs: initialFs,
            history: [],
            cwd: "/home/user",
          });
          setSyncStatus("synced");
        }
      } catch (err) {
        console.error("Failed to load cloud terminal state:", err);
        if (!cancelled) setSyncStatus("error");
      } finally {
        if (!cancelled) isLoadedRef.current = true;
      }
    }

    loadCloudTerminal();

    return () => {
      cancelled = true;
    };
  }, [user, activeStorageKey]);

  const [lines, setLines] = useState([
    {
      type: "output",
      text: `Welcome to ${hostname}. Type "help" for available commands.`,
    },
  ]);

  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState(false);

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const inputRef = useRef(null);
  const terminalRef = useRef(null);
  const frameRef = useRef(null);

  // Persist filesystem to localStorage and sync to MongoDB Atlas with debounce
  useEffect(() => {
    localStorage.setItem(activeStorageKey, JSON.stringify(fs));

    if (!user || !isLoadedRef.current) return;

    setSyncStatus("saving");
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      try {
        await usersApi.saveTerminalState({
          fs,
          history,
          cwd,
        });
        setSyncStatus("synced");
      } catch (err) {
        console.error("Failed to sync terminal state to cloud:", err);
        setSyncStatus("error");
      }
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [fs, history, cwd, user, activeStorageKey]);

  // Auto scroll
  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop =
        terminalRef.current.scrollHeight;
    }
  }, [lines]);

  // Focus terminal
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Keep focus after expand/restore
  useEffect(() => {
    if (expanded) inputRef.current?.focus();
  }, [expanded]);

  const interceptRef = useRef(null);

  function print(text = "") {
    if (interceptRef.current) {
      interceptRef.current.stdout.push(text);
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        type: "output",
        text,
      },
    ]);
  }

  function printError(text) {
    if (interceptRef.current) {
      interceptRef.current.stderr.push(text);
      return;
    }
    setLines((prev) => [
      ...prev,
      {
        type: "error",
        text,
      },
    ]);
  }

  function updateFS(callback) {
    setFs((oldFs) => {
      const newFs = clone(oldFs);
      callback(newFs);
      return newFs;
    });
  }

  function tokenize(command) {
    const tokens = [];
    const regex = /"([^"]*)"|'([^']*)'|(\S+)/g;

    let match;

    while ((match = regex.exec(command))) {
      tokens.push(match[1] ?? match[2] ?? match[3]);
    }

    return tokens;
  }

  function expandEnvVars(commandStr) {
    return commandStr.replace(/\$[a-zA-Z_][a-zA-Z0-9_]*/g, (match) => {
      const varName = match.slice(1);
      return env[varName] !== undefined ? env[varName] : "";
    });
  }

  async function executeSingleCommand(cmd, args, stdin) {
    /*
     * HELP
     */

    if (cmd === "help") {
      print(
        [
          "Available commands:",
          "",
          "  ls              List files",
          "  cd <dir>        Change directory",
          "  pwd             Print working directory",
          "  cat <file>      Display file",
          "  touch <file>    Create file",
          "  mkdir <dir>     Create directory",
          "  rmdir <dir>     Remove empty directory",
          "  rm <file>       Remove file/directory",
          "  cp <src> <dst>  Copy file",
          "  mv <src> <dst>  Move file",
          "  echo <text>     Print text",
          "  echo > file     Write to file",
          "  echo >> file    Append to file",
          "  tree            Display directory tree",
          "  find <name>     Find files",
          "  grep <x> <file> Search file",
          "  head <file>     First lines",
          "  tail <file>     Last lines",
          "  clear           Clear terminal",
          "  history         Command history",
          "  whoami          Current user",
          "  hostname        System hostname",
          "  uname           System information",
          "  neofetch        System specs & GLUG banner",
          "  date            Current date",
          "  uptime          System load and uptime",
          "  free            Memory statistics",
          "  df              Disk usage statistics",
          "  curl <url>      Fetch URL data",
          "  man <cmd>       Manual page for command",
          "  bash <script>   Execute shell script",
          "  export <var>=<v> Set environment variables",
          "  wc <file>       Word, line, and byte count",
          "  vim <file>      Vim modal text editor (:w, :q, :wq, dd, i)",
          "  nano <file>     GNU nano text editor (^O, ^X, ^K, ^U)",
          "  gcc <file.c>    Compile C program (GCC 9.2.0)",
          "  g++ <file.cpp>  Compile C++ program (G++ 9.2.0)",
          "  ./<binary>      Execute compiled binary",
          "  python3 <file>  Execute Python 3 script",
          "  javac <file>    Compile Java class (OpenJDK 13)",
          "  java <class>    Execute Java class",
          "  resetfs         Reset virtual filesystem",
          "",
        ].join("\n")
      );

      return;
    }

    /*
     * EXPORT
     */

    if (cmd === "export") {
      if (!args.length) {
        const output = Object.entries(env)
          .map(([key, val]) => `declare -x ${key}="${val}"`)
          .join("\n");
        print(output);
        return;
      }

      for (const arg of args) {
        const parts = arg.split("=");
        const key = parts[0];
        const val = parts.slice(1).join("=");

        if (key) {
          setEnv((prev) => ({
            ...prev,
            [key]: val || "",
          }));
        }
      }

      return;
    }

    /*
     * WC
     */

    if (cmd === "wc") {
      let content;

      if (args.length >= 1) {
        const file = resolvePath(args[0], cwd);
        const node = getNode(fs, file);

        if (!node) {
          printError(`wc: ${args[0]}: No such file or directory`);
          return;
        }

        if (node.type !== "file") {
          printError(`wc: ${args[0]}: Is a directory`);
          return;
        }

        content = node.content;
      } else if (stdin !== null) {
        content = stdin;
      } else {
        printError("wc: missing operand");
        return;
      }

      const linesCount = content.split("\n").filter(Boolean).length;
      const wordsCount = content.split(/\s+/).filter(Boolean).length;
      const bytesCount = new Blob([content]).size;

      print(`  ${linesCount}   ${wordsCount}  ${bytesCount}`);
      return;
    }

    /*
     * CLEAR
     */

    if (cmd === "clear") {
      setLines([]);
      return;
    }

    /*
     * PWD
     */

    if (cmd === "pwd") {
      print(cwd);
      return;
    }

    /*
     * WHOAMI
     */

    if (cmd === "whoami") {
      print(effectiveUser);
      return;
    }

    /*
     * HOSTNAME
     */

    if (cmd === "hostname") {
      print(hostname);
      return;
    }

    /*
     * UNAME
     */

    if (cmd === "uname") {
      print("Linux");
      return;
    }

    /*
     * DATE
     */

    if (cmd === "date") {
      print(new Date().toString());
      return;
    }

    /*
     * ECHO
     */

    if (cmd === "echo") {
      print(args.join(" "));
      return;
    }

    /*
     * LS
     */

    if (cmd === "ls") {
      let target = cwd;

      const longFormat = args.includes("-l") || args.includes("-la");
      const all = args.includes("-a") || args.includes("-la");

      const pathArg = args.find((x) => !x.startsWith("-"));

      if (pathArg) {
        target = resolvePath(pathArg, cwd);
      }

      const node = getNode(fs, target);

      if (!node) {
        printError(`ls: cannot access '${target}': No such file or directory`);
        return;
      }

      if (node.type === "file") {
        print(longFormat ? `-rw-r--r-- 1 ${effectiveUser} ${basename(target)}` : basename(target));
        return;
      }

      const names = Object.keys(node.children || {});

      if (!names.length) {
        return;
      }

      const output = names
        .filter((name) => all || !name.startsWith("."))
        .map((name) => {
          const child = node.children[name];

          if (longFormat) {
            return child.type === "dir"
              ? `drwxr-xr-x 2 ${effectiveUser} ${name}`
              : `-rw-r--r-- 1 ${effectiveUser} ${name}`;
          }

          return child.type === "dir"
            ? `${name}/`
            : name;
        })
        .join(longFormat ? "\n" : "    ");

      print(output);
      return;
    }

    /*
     * CD
     */

    if (cmd === "cd") {
      const target = args[0] || "~";

      const path = resolvePath(target, cwd);

      const node = getNode(fs, path);

      if (!node) {
        printError(
          `cd: ${target}: No such file or directory`
        );
        return;
      }

      if (node.type !== "dir") {
        printError(`cd: ${target}: Not a directory`);
        return;
      }

      updateCwd(path);
      return;
    }

    /*
     * CAT
     */

    if (cmd === "cat") {
      if (!args.length) {
        if (stdin !== null) {
          print(stdin);
          return;
        }
        printError("cat: missing file operand");
        return;
      }

      for (const arg of args) {
        const path = resolvePath(arg, cwd);

        const node = getNode(fs, path);

        if (!node) {
          printError(
            `cat: ${arg}: No such file or directory`
          );
          continue;
        }

        if (node.type !== "file") {
          printError(`cat: ${arg}: Is a directory`);
          continue;
        }

        print(node.content);
      }

      return;
    }

    /*
     * TOUCH
     */

    if (cmd === "touch") {
      if (!args.length) {
        printError("touch: missing file operand");
        return;
      }

      updateFS((root) => {
        for (const arg of args) {
          const path = resolvePath(arg, cwd);

          const result = getParent(root, path);

          if (!result?.parent) continue;

          if (!result.parent.children[result.name]) {
            result.parent.children[result.name] = {
              type: "file",
              content: "",
            };
          }
        }
      });

      return;
    }

    /*
     * MKDIR
     */

    if (cmd === "mkdir") {
      if (!args.length) {
        printError("mkdir: missing operand");
        return;
      }

      updateFS((root) => {
        for (const arg of args) {
          const path = resolvePath(arg, cwd);

          const result = getParent(root, path);

          if (!result?.parent) continue;

          if (result.parent.children[result.name]) {
            printError(
              `mkdir: cannot create directory '${arg}': File exists`
            );
            continue;
          }

          result.parent.children[result.name] = {
            type: "dir",
            children: {},
          };
        }
      });

      return;
    }

    /*
     * RMDIR
     */

    if (cmd === "rmdir") {
      if (!args.length) {
        printError("rmdir: missing operand");
        return;
      }

      updateFS((root) => {
        for (const arg of args) {
          const path = resolvePath(arg, cwd);

          const result = getParent(root, path);

          if (!result?.parent) continue;

          const node = result.parent.children[result.name];

          if (!node) {
            printError(
              `rmdir: failed to remove '${arg}': No such file or directory`
            );
            continue;
          }

          if (node.type !== "dir") {
            printError(
              `rmdir: failed to remove '${arg}': Not a directory`
            );
            continue;
          }

          if (Object.keys(node.children).length) {
            printError(
              `rmdir: failed to remove '${arg}': Directory not empty`
            );
            continue;
          }

          delete result.parent.children[result.name];
        }
      });

      return;
    }

    /*
     * RM
     */

    if (cmd === "rm") {
      const recursive =
        args.includes("-r") ||
        args.includes("-rf") ||
        args.includes("-fr");

      const targets = args.filter(
        (arg) => !arg.startsWith("-")
      );

      if (!targets.length) {
        printError("rm: missing operand");
        return;
      }

      updateFS((root) => {
        for (const target of targets) {
          const path = resolvePath(target, cwd);

          if (path === "/") {
            printError("rm: cannot remove root");
            continue;
          }

          const result = getParent(root, path);

          if (!result?.parent) continue;

          const node = result.parent.children[result.name];

          if (!node) {
            printError(
              `rm: cannot remove '${target}': No such file or directory`
            );
            continue;
          }

          if (
            node.type === "dir" &&
            Object.keys(node.children).length &&
            !recursive
          ) {
            printError(
              `rm: cannot remove '${target}': Directory not empty`
            );
            continue;
          }

          delete result.parent.children[result.name];
        }
      });

      return;
    }

    /*
     * CP
     */

    if (cmd === "cp") {
      if (args.length < 2) {
        printError("cp: missing destination");
        return;
      }

      const source = resolvePath(args[0], cwd);
      const destination = resolvePath(args[1], cwd);

      const sourceNode = getNode(fs, source);

      if (!sourceNode) {
        printError(
          `cp: cannot stat '${args[0]}': No such file or directory`
        );
        return;
      }

      updateFS((root) => {
        let destPath = destination;

        const destNode = getNode(root, destination);

        if (destNode?.type === "dir") {
          destPath = normalizePath(
            `${destination}/${basename(source)}`
          );
        }

        const result = getParent(root, destPath);

        if (!result?.parent) return;

        result.parent.children[result.name] =
          clone(sourceNode);
      });

      return;
    }

    /*
     * MV
     */

    if (cmd === "mv") {
      if (args.length < 2) {
        printError("mv: missing destination");
        return;
      }

      const source = resolvePath(args[0], cwd);
      const destination = resolvePath(args[1], cwd);

      const sourceNode = getNode(fs, source);

      if (!sourceNode) {
        printError(
          `mv: cannot stat '${args[0]}': No such file or directory`
        );
        return;
      }

      updateFS((root) => {
        let destPath = destination;

        const destNode = getNode(root, destination);

        if (destNode?.type === "dir") {
          destPath = normalizePath(
            `${destination}/${basename(source)}`
          );
        }

        const destParent = getParent(root, destPath);

        if (!destParent?.parent) return;

        destParent.parent.children[destParent.name] =
          clone(sourceNode);

        const sourceParent = getParent(root, source);

        if (sourceParent?.parent) {
          delete sourceParent.parent.children[sourceParent.name];
        }
      });

      return;
    }

    /*
     * TREE
     */

    if (cmd === "tree") {
      const target = resolvePath(args[0] || ".", cwd);

      const rootNode = getNode(fs, target);

      if (!rootNode) {
        printError(
          `tree: '${args[0]}': No such file or directory`
        );
        return;
      }

      function buildTree(node, prefix = "") {
        if (node.type === "file") {
          return "";
        }

        const names = Object.keys(node.children || {});

        let result = "";

        names.forEach((name, index) => {
          const last = index === names.length - 1;

          const child = node.children[name];

          result +=
            prefix +
            (last ? "└── " : "├── ") +
            name +
            (child.type === "dir" ? "/" : "") +
            "\n";

          if (child.type === "dir") {
            result += buildTree(
              child,
              prefix + (last ? "    " : "│   ")
            );
          }
        });

        return result;
      }

      print(buildTree(rootNode));
      return;
    }

    /*
     * FIND
     */

    if (cmd === "find") {
      const search = args[0] || ".";

      function searchTree(node, path, results) {
        if (node.type !== "dir") return;

        for (const name of Object.keys(node.children || {})) {
          const child = node.children[name];

          const childPath =
            path === "/" ? `/${name}` : `${path}/${name}`;

          if (
            !search ||
            name.toLowerCase().includes(search.toLowerCase())
          ) {
            results.push(childPath);
          }

          if (child.type === "dir") {
            searchTree(child, childPath, results);
          }
        }
      }

      const results = [];

      searchTree(fs, "/", results);

      print(results.join("\n"));

      return;
    }

    /*
     * GREP
     */

    if (cmd === "grep") {
      if (args.length < 1) {
        printError("grep: missing pattern");
        return;
      }

      const searchText = args[0];
      let content;

      if (args.length >= 2) {
        const file = resolvePath(args[1], cwd);
        const node = getNode(fs, file);

        if (!node) {
          printError(
            `grep: ${args[1]}: No such file or directory`
          );
          return;
        }

        if (node.type !== "file") {
          printError(`grep: ${args[1]}: Is a directory`);
          return;
        }

        content = node.content;
      } else if (stdin !== null) {
        content = stdin;
      } else {
        printError("grep: missing file operand");
        return;
      }

      const matches = content
        .split("\n")
        .filter((line) => line.includes(searchText));

      print(matches.join("\n"));

      return;
    }

    /*
     * HEAD
     */

    if (cmd === "head") {
      const file = resolvePath(args[0], cwd);

      const node = getNode(fs, file);

      if (!node || node.type !== "file") {
        printError(`head: ${args[0]}: Cannot read file`);
        return;
      }

      print(
        node.content
          .split("\n")
          .slice(0, 10)
          .join("\n")
      );

      return;
    }

    /*
     * TAIL
     */

    if (cmd === "tail") {
      const file = resolvePath(args[0], cwd);

      const node = getNode(fs, file);

      if (!node || node.type !== "file") {
        printError(`tail: ${args[0]}: Cannot read file`);
        return;
      }

      print(
        node.content
          .split("\n")
          .slice(-10)
          .join("\n")
      );

      return;
    }

    /*
     * HISTORY
     */

    if (cmd === "history") {
      print(
        history
          .map((command, index) => `${index + 1}  ${command}`)
          .join("\n")
      );

      return;
    }

    /*
     * RESET FILESYSTEM
     */

    if (cmd === "resetfs") {
      handleResetFs();
      return;
    }

    /*
     * EXIT
     */

    if (cmd === "exit") {
      print("logout");
      return;
    }

    /*
     * VIM / VI
     */
    if (cmd === "vim" || cmd === "vi") {
      if (!args.length) {
        printError("vim: missing file operand");
        return;
      }

      const path = resolvePath(args[0], cwd);
      const node = getNode(fs, path);

      if (node && node.type === "dir") {
        printError(`vim: ${args[0]}: Is a directory`);
        return;
      }

      setEditor({
        type: "vim",
        path,
        content: node?.content || "",
      });

      return;
    }

    /*
     * NANO
     */
    if (cmd === "nano") {
      if (!args.length) {
        printError("nano: missing file operand");
        return;
      }

      const path = resolvePath(args[0], cwd);
      const node = getNode(fs, path);

      if (node && node.type === "dir") {
        printError(`nano: ${args[0]}: Is a directory`);
        return;
      }

      setEditor({
        type: "nano",
        path,
        content: node?.content || "",
      });

      return;
    }

    /*
     * GCC (C Compiler)
     */
    if (cmd === "gcc") {
      if (!args.length) {
        printError("gcc: fatal error: no input files");
        printError("compilation terminated.");
        return;
      }

      let outFile = "a.out";
      const oIndex = args.indexOf("-o");
      if (oIndex !== -1 && args[oIndex + 1]) {
        outFile = args[oIndex + 1];
      }

      const sourceFile = args.find((a) => !a.startsWith("-") && a !== outFile);
      if (!sourceFile) {
        printError("gcc: fatal error: no input files");
        return;
      }

      const sourcePath = resolvePath(sourceFile, cwd);
      const node = getNode(fs, sourcePath);

      if (!node) {
        printError(`gcc: error: ${sourceFile}: No such file or directory`);
        return;
      }
      if (node.type === "dir") {
        printError(`gcc: error: ${sourceFile}: Is a directory`);
        return;
      }

      try {
        const res = await executeCode("c", node.content, "");
        if (res.compilationError || (!res.success && res.error)) {
          printError(res.error || "compilation error");
          return;
        }

        const outPath = resolvePath(outFile, cwd);
        updateFS((root) => {
          const result = getParent(root, outPath);
          if (!result?.parent) return;
          result.parent.children[result.name] = {
            type: "file",
            isExecutable: true,
            executableLang: "c",
            sourceCode: node.content,
            cachedResult: res.output,
            content: "\x7fELF 64-bit LSB pie executable, x86-64, dynamically linked",
          };
        });
      } catch (err) {
        printError(`gcc: error: ${err.message}`);
      }
      return;
    }

    /*
     * G++ (C++ Compiler)
     */
    if (cmd === "g++") {
      if (!args.length) {
        printError("g++: fatal error: no input files");
        printError("compilation terminated.");
        return;
      }

      let outFile = "a.out";
      const oIndex = args.indexOf("-o");
      if (oIndex !== -1 && args[oIndex + 1]) {
        outFile = args[oIndex + 1];
      }

      const sourceFile = args.find((a) => !a.startsWith("-") && a !== outFile);
      if (!sourceFile) {
        printError("g++: fatal error: no input files");
        return;
      }

      const sourcePath = resolvePath(sourceFile, cwd);
      const node = getNode(fs, sourcePath);

      if (!node) {
        printError(`g++: error: ${sourceFile}: No such file or directory`);
        return;
      }
      if (node.type === "dir") {
        printError(`g++: error: ${sourceFile}: Is a directory`);
        return;
      }

      try {
        const res = await executeCode("cpp", node.content, "");
        if (res.compilationError || (!res.success && res.error)) {
          printError(res.error || "compilation error");
          return;
        }

        const outPath = resolvePath(outFile, cwd);
        updateFS((root) => {
          const result = getParent(root, outPath);
          if (!result?.parent) return;
          result.parent.children[result.name] = {
            type: "file",
            isExecutable: true,
            executableLang: "cpp",
            sourceCode: node.content,
            cachedResult: res.output,
            content: "\x7fELF 64-bit LSB pie executable, x86-64, dynamically linked",
          };
        });
      } catch (err) {
        printError(`g++: error: ${err.message}`);
      }
      return;
    }

    /*
     * PYTHON / PYTHON3
     */
    if (cmd === "python" || cmd === "python3") {
      if (!args.length) {
        print("Python 3.10.12 (main, virtual terminal)\nType \"help\" for more information.\n(Pass a script file: python3 <script.py>)");
        return;
      }

      if (args[0] === "-c") {
        const inlineCode = args.slice(1).join(" ");
        if (!inlineCode) {
          printError("python3: -c requires an argument");
          return;
        }
        try {
          const res = await executeCode("python", inlineCode, stdin || "");
          if (res.output) print(res.output.trimEnd());
          if (res.error) printError(res.error.trimEnd());
        } catch (err) {
          printError(`python3: error: ${err.message}`);
        }
        return;
      }

      const fileArg = args[0];
      const filePath = resolvePath(fileArg, cwd);
      const node = getNode(fs, filePath);

      if (!node) {
        printError(`python3: can\x27t open file \x27${fileArg}\x27: [Errno 2] No such file or directory`);
        return;
      }
      if (node.type === "dir") {
        printError(`python3: error: \x27${fileArg}\x27 is a directory`);
        return;
      }

      try {
        let inputData = stdin;
        if (inputData === null) {
          const needsInput = /input\s*\(|sys\.stdin/.test(node.content || "");
          if (needsInput) {
            print("Enter standard input (or press Enter for EOF):");
            const entered = await promptForInput();
            if (entered === null) return;
            inputData = entered;
          } else {
            inputData = "";
          }
        }
        const res = await executeCode("python", node.content, inputData);
        if (res.output) {
          print(res.output.trimEnd());
        }
        if (res.error) {
          printError(res.error.trimEnd());
        }
      } catch (err) {
        printError(`python3 runtime error: ${err.message}`);
      }
      return;
    }

    /*
     * JAVAC
     */
    if (cmd === "javac") {
      if (!args.length) {
        printError("javac: no source files specified");
        return;
      }

      const fileArg = args[0];
      const filePath = resolvePath(fileArg, cwd);
      const node = getNode(fs, filePath);

      if (!node) {
        printError(`javac: file not found: ${fileArg}`);
        return;
      }

      try {
        const res = await executeCode("java", node.content, "");
        if (res.compilationError || (!res.success && res.error)) {
          printError(res.error || "javac compilation error");
          return;
        }

        const base = basename(filePath).replace(/\.java$/, "");
        const classPath = resolvePath(`${base}.class`, cwd);
        updateFS((root) => {
          const result = getParent(root, classPath);
          if (!result?.parent) return;
          result.parent.children[result.name] = {
            type: "file",
            isExecutable: true,
            executableLang: "java",
            sourceCode: node.content,
            cachedResult: res.output,
            content: `Compiled Java class [${base}]`,
          };
        });
      } catch (err) {
        printError(`javac: error: ${err.message}`);
      }
      return;
    }

    /*
     * JAVA
     */
    if (cmd === "java") {
      if (!args.length) {
        printError("Usage: java [options] <mainclass> [args...]");
        return;
      }

      const className = args[0].replace(/\.class$/, "").replace(/\.java$/, "");
      const javaPath = resolvePath(`${className}.java`, cwd);
      const classPath = resolvePath(`${className}.class`, cwd);

      const javaNode = getNode(fs, javaPath);
      const classNode = getNode(fs, classPath);

      if (!javaNode && !classNode) {
        printError(`Error: Could not find or load main class ${className}`);
        return;
      }

      const source = javaNode?.content || classNode?.sourceCode;
      if (!source) {
        printError(`Error: Could not find or load main class ${className}`);
        return;
      }

      try {
        const inputData = stdin || "";
        const res = await executeCode("java", source, inputData);
        if (res.output) {
          print(res.output.trimEnd());
        }
        if (res.error) {
          printError(res.error.trimEnd());
        }
      } catch (err) {
        printError(`java execution error: ${err.message}`);
      }
      return;
    }

    /*
     * EXECUTE COMPILED BINARY (e.g. ./a.out)
     */
    const isLocalRun = cmd.startsWith("./") || cmd.startsWith("/");
    const execPath = resolvePath(cmd, cwd);
    const execNode = getNode(fs, execPath);

    if (execNode && execNode.type === "file" && (isLocalRun || execNode.isExecutable)) {
      if (!execNode.isExecutable) {
        printError(`bash: ${cmd}: Permission denied`);
        return;
      }

      try {
        let inputData = stdin;
        if (inputData === null) {
          const needsInput = /scanf\s*\(|cin\s*>>|getchar\s*\(|fgets\s*\(|getline\s*\(/.test(execNode.sourceCode || "");
          if (needsInput) {
            print("Enter standard input (or press Enter for EOF):");
            const entered = await promptForInput();
            if (entered === null) return;
            inputData = entered;
          } else {
            inputData = "";
          }
        }
        const res = await executeCode(execNode.executableLang || "c", execNode.sourceCode, inputData);
        if (res.output) {
          print(res.output.trimEnd());
        }
        if (res.error) {
          printError(res.error.trimEnd());
        }
      } catch (err) {
        printError(`Execution error: ${err.message}`);
      }
      return;
    }

    /*
     * UNKNOWN COMMAND
     */

    if (cmd === "neofetch" || cmd === "fastfetch") {
      const banner = [
        "       /\\         " + effectiveUser + "@" + hostname,
        "      /  \\        " + "-".repeat((effectiveUser + "@" + hostname).length),
        "     /\\   \\       OS: GLUG GNU/Linux x86_64",
        "    /  __  \\      Host: GLUG Virtual Browser Sandbox",
        "   /  (  )  \\     Kernel: 6.8.0-glug-cloud",
        "  /  .-''-.  \\    Uptime: 3 hours, 24 mins",
        " /_-'      '-_\\   Shell: bash 5.2.21",
        "                  Terminal: xterm-256color",
        "                  CPU: Virtual Quad-Core Execution Node",
        "                  Memory: 512MB / 2048MB (MongoDB Atlas Synced)",
        "                  Storage: Virtual Root FS (/home/user)",
        "                  Toolchain: GCC 9.2, G++ 9.2, Python 3.10, OpenJDK 13",
      ].join("\n");
      print(banner);
      return;
    }

    if (cmd === "uptime") {
      print(" 10:45:14 up 3:24,  1 user,  load average: 0.08, 0.04, 0.01");
      return;
    }

    if (cmd === "free" || cmd === "free -h" || cmd === "free -m") {
      print([
        "               total        used        free      shared  buff/cache   available",
        "Mem:           2.0Gi       512Mi       1.1Gi        24Mi       384Mi       1.4Gi",
        "Swap:          1.0Gi          0B       1.0Gi",
      ].join("\n"));
      return;
    }

    if (cmd === "df" || cmd === "df -h") {
      print([
        "Filesystem      Size  Used Avail Use% Mounted on",
        "/dev/root        10G  1.2G  8.3G  13% /",
        "tmpfs           512M     0  512M   0% /tmp",
        "/dev/mongodb     50M  3.2M   47M   7% /home/user",
      ].join("\n"));
      return;
    }

    if (cmd === "curl") {
      if (!args.length) {
        printError("curl: try 'curl --help' for more information");
        return;
      }
      const url = args[args.length - 1];
      if (url.includes("glug") || url.includes("api")) {
        print(JSON.stringify({ status: "ok", community: "GLUG JEC", version: "2.0.0", activeUsers: 420 }, null, 2));
      } else {
        print(`HTTP/1.1 200 OK\nContent-Type: text/plain\n\nConnected to ${url} (Virtual Network Sandbox)`);
      }
      return;
    }

    if (cmd === "bash" || cmd === "sh") {
      if (!args.length) {
        print(`GNU bash, version 5.2.21(1)-release (${effectiveUser}-pc-linux-gnu)`);
        return;
      }
      const scriptFile = args[0];
      const scriptPath = resolvePath(scriptFile, cwd);
      const node = getNode(fs, scriptPath);
      if (!node || node.type !== "file") {
        printError(`${cmd}: ${scriptFile}: No such file or directory`);
        return;
      }
      const scriptLines = node.content.split("\n");
      for (const line of scriptLines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;
        await execute(trimmed);
      }
      return;
    }

    if (cmd === "man") {
      if (!args.length) {
        printError("What manual page do you want?\nFor example, try 'man ls'.");
        return;
      }
      const manualTarget = args[0];
      const MANUALS = {
        ls: "LS(1)\nNAME\n    ls - list directory contents\nSYNOPSIS\n    ls [-a] [-l] [FILE]...\nDESCRIPTION\n    List information about the FILEs (the current directory by default).",
        cd: "CD(1)\nNAME\n    cd - change the shell working directory\nSYNOPSIS\n    cd [dir]\nDESCRIPTION\n    Change the current directory to DIR. The default DIR is /home/user.",
        pwd: "PWD(1)\nNAME\n    pwd - print name of current/working directory\nSYNOPSIS\n    pwd",
        gcc: "GCC(1)\nNAME\n    gcc - GNU project C and C++ compiler\nSYNOPSIS\n    gcc [-o outfile] infile.c\nDESCRIPTION\n    Compiles C source code via Judge0 backend and generates executable binary.",
        python3: "PYTHON(1)\nNAME\n    python3 - an interpreted, interactive, object-oriented programming language\nSYNOPSIS\n    python3 [file.py | -c cmd]",
        cat: "CAT(1)\nNAME\n    cat - concatenate files and print on the standard output\nSYNOPSIS\n    cat [FILE]...",
        rm: "RM(1)\nNAME\n    rm - remove files or directories\nSYNOPSIS\n    rm [-r] FILE...",
        mkdir: "MKDIR(1)\nNAME\n    mkdir - make directories\nSYNOPSIS\n    mkdir DIRECTORY...",
        vim: "VIM(1)\nNAME\n    vim - Vi IMproved, a programmer's text editor\nSYNOPSIS\n    vim [file]\nCOMMANDS\n    i: Insert mode, Esc: Normal mode, :w: Save, :q: Quit, :wq: Save and quit, dd: Delete line",
        nano: "NANO(1)\nNAME\n    nano - Nano's ANOther editor, an enhanced free Pico clone\nSYNOPSIS\n    nano [file]\nSHORTCUTS\n    Ctrl+O: WriteOut, Ctrl+X: Exit, Ctrl+K: Cut, Ctrl+U: Uncut",
        neofetch: "NEOFETCH(1)\nNAME\n    neofetch - CLI system information tool\nSYNOPSIS\n    neofetch",
      };
      if (MANUALS[manualTarget]) {
        print(MANUALS[manualTarget]);
      } else {
        print(`No manual entry for ${manualTarget}.\nType 'help' for a list of available commands.`);
      }
      return;
    }

    if (cmd === "./a/out") {
      printError(`${cmd}: command not found (Did you mean './a.out'?)`);
      return;
    }

    printError(
      `${cmd}: command not found`
    );
  }

  async function runPipeline(cmdPartStr) {
    let initialStdin = null;
    let cmdPart = cmdPartStr;

    // Parse input redirection (<)
    const inputMatch = cmdPart.match(/^(.*?)\s*<\s*([^>]+)$/);
    if (inputMatch) {
      cmdPart = inputMatch[1].trim();
      const inputTarget = inputMatch[2].trim();
      const inPath = resolvePath(inputTarget, cwd);
      const inNode = getNode(fs, inPath);
      if (!inNode || inNode.type !== "file") {
        printError(`bash: ${inputTarget}: No such file or directory`);
        return false;
      }
      initialStdin = inNode.content;
    }

    // Parse output redirections (> and >>)
    const redirectMatch = cmdPart.match(/^(.*?)\s*(>>|>)\s*(.+)$/);
    let redirectTo = null;
    let redirectAppend = false;

    if (redirectMatch) {
      cmdPart = redirectMatch[1].trim();
      const operator = redirectMatch[2];
      const target = redirectMatch[3].trim();

      redirectTo = resolvePath(target, cwd);
      redirectAppend = (operator === ">>");
    }

    // Split by pipes
    const pipeParts = cmdPart.split("|").map((p) => p.trim()).filter(Boolean);
    if (pipeParts.length === 0) return true;

    let currentStdin = initialStdin;
    let hasError = false;

    for (let i = 0; i < pipeParts.length; i++) {
      const part = pipeParts[i];
      const tokens = tokenize(part);
      const cmd = tokens[0];
      const args = tokens.slice(1);

      if (!cmd) continue;

      const isLast = (i === pipeParts.length - 1);
      const captureOutput = !isLast || redirectTo;

      let localBuffer = null;
      if (captureOutput) {
        localBuffer = { stdout: [], stderr: [] };
        interceptRef.current = localBuffer;
      } else {
        interceptRef.current = null;
      }

      await executeSingleCommand(cmd, args, currentStdin);

      interceptRef.current = null;

      if (captureOutput) {
        currentStdin = localBuffer.stdout.join("\n");

        if (localBuffer.stderr.length > 0) {
          hasError = true;
          localBuffer.stderr.forEach((err) => {
            setLines((prev) => [
              ...prev,
              {
                type: "error",
                text: err,
              },
            ]);
          });
        }
      }
    }

    // Handle Redirection writing
    if (redirectTo) {
      updateFS((root) => {
        const result = getParent(root, redirectTo);

        if (!result?.parent) {
          hasError = true;
          setLines((prev) => [
            ...prev,
            {
              type: "error",
              text: `bash: ${redirectTo}: No such file or directory`,
            },
          ]);
          return;
        }

        if (
          result.parent.children[result.name] &&
          result.parent.children[result.name].type === "dir"
        ) {
          hasError = true;
          setLines((prev) => [
            ...prev,
            {
              type: "error",
              text: `bash: ${redirectTo}: Is a directory`,
            },
          ]);
          return;
        }

        const existingContent =
          redirectAppend && result.parent.children[result.name]
            ? result.parent.children[result.name].content
            : "";

        const newContent = currentStdin + (currentStdin.endsWith("\n") || !currentStdin ? "" : "\n");

        result.parent.children[result.name] = {
          type: "file",
          content: existingContent + newContent,
        };
      });
    }

    return !hasError;
  }

  async function execute(command) {
    const trimmed = command.trim();
    if (!trimmed) return;

    setHistory((prev) => {
      const next = [...prev, trimmed];
      return next.slice(-100);
    });

    setHistoryIndex(-1);

    // Expand environment variables
    const expanded = expandEnvVars(trimmed);

    // Split by command sequence operators (&& or ;)
    const chainTokens = expanded.split(/(&&|;)/g);
    const chain = [];
    let curCmd = "";
    let curOp = null;

    for (let i = 0; i < chainTokens.length; i++) {
      const tok = chainTokens[i].trim();
      if (tok === "&&" || tok === ";") {
        if (curCmd.trim()) {
          chain.push({ cmd: curCmd.trim(), op: curOp });
        }
        curOp = tok;
        curCmd = "";
      } else {
        curCmd += (curCmd ? " " : "") + chainTokens[i];
      }
    }
    if (curCmd.trim()) {
      chain.push({ cmd: curCmd.trim(), op: curOp });
    }

    setIsRunning(true);
    try {
      for (const item of chain) {
        const ok = await runPipeline(item.cmd);
        // Abort on failure if chained with &&
        if (item.op === "&&" && !ok) {
          break;
        }
      }
    } finally {
      setIsRunning(false);
    }
  }

  function handleSubmit(e) {
    e.preventDefault();

    const command = input;
    setInput("");

    if (stdinResolverRef.current) {
      setLines((prev) => [
        ...prev,
        {
          type: "input-echo",
          text: command,
        },
      ]);
      const resolver = stdinResolverRef.current;
      stdinResolverRef.current = null;
      resolver(command);
      return;
    }

    setLines((prev) => [
      ...prev,
      {
        type: "command",
        prompt: `${effectiveUser}@${hostname}:${formatPrompt(cwd)}$`,
        text: command,
      },
    ]);

    execute(command);
  }

  function handleKeyDown(e) {
    /*
     * CTRL + C
     */

    if (e.ctrlKey && e.key === "c") {
      e.preventDefault();

      if (stdinResolverRef.current) {
        setLines((prev) => [
          ...prev,
          {
            type: "input-echo",
            text: input + "^C",
          },
        ]);
        const resolver = stdinResolverRef.current;
        stdinResolverRef.current = null;
        setIsAwaitingStdin(false);
        resolver(null);
        setInput("");
        return;
      }

      setLines((prev) => [
        ...prev,
        {
          type: "command",
          prompt: `${effectiveUser}@${hostname}:${formatPrompt(cwd)}$`,
          text: input + "^C",
        },
      ]);

      setInput("");
      return;
    }

    /*
     * CTRL + L
     */

    if (e.ctrlKey && e.key === "l") {
      e.preventDefault();

      setLines([]);
      return;
    }

    /*
     * ARROW UP
     */

    if (e.key === "ArrowUp") {
      e.preventDefault();

      if (!history.length) return;

      const newIndex =
        historyIndex === -1
          ? history.length - 1
          : Math.max(0, historyIndex - 1);

      setHistoryIndex(newIndex);
      setInput(history[newIndex]);
    }

    /*
     * ARROW DOWN
     */

    if (e.key === "ArrowDown") {
      e.preventDefault();

      if (historyIndex === -1) return;

      const newIndex = historyIndex + 1;

      if (newIndex >= history.length) {
        setHistoryIndex(-1);
        setInput("");
        return;
      }

      setHistoryIndex(newIndex);
      setInput(history[newIndex]);
    }

    /*
     * TAB AUTOCOMPLETE
     */

    if (e.key === "Tab") {
      e.preventDefault();
      handleTabAutocomplete();
    }
  }

  function handleTabAutocomplete() {
    const parts = input.split(" ");
    const current = parts[parts.length - 1] || "";
    const path = resolvePath(current || ".", cwd);
    const parentPath = current.endsWith("/") ? path : dirname(path);
    const searchName = current.endsWith("/") ? "" : basename(path);

    const parent = getNode(fs, parentPath);
    if (!parent || parent.type !== "dir") return;

    const matches = Object.keys(parent.children || {}).filter((name) =>
      name.startsWith(searchName)
    );

    if (matches.length === 1) {
      const matchName = matches[0];
      const isDir = parent.children[matchName]?.type === "dir";
      const suffix = isDir ? "/" : " ";
      let completed = matchName;
      if (current.includes("/")) {
        const prefix = current.substring(0, current.lastIndexOf("/") + 1);
        completed = prefix + matchName;
      }
      parts[parts.length - 1] = completed + suffix;
      setInput(parts.join(" "));
    } else if (matches.length > 1) {
      setLines((prev) => [
        ...prev,
        {
          type: "command",
          prompt: `${effectiveUser}@${hostname}:${formatPrompt(cwd)}$`,
          text: input,
        },
        {
          type: "output",
          text: matches.join("   "),
        },
      ]);
    }
  }

  function handleResetFs(skipConfirm = false) {
    if (!skipConfirm && onResetRequest) {
      onResetRequest();
      return;
    }

    const confirmed = skipConfirm || window.confirm("Reset the virtual filesystem to default?");
    if (confirmed) {
      const fresh = clone(DEFAULT_FS);
      setFs(fresh);
      localStorage.setItem(activeStorageKey, JSON.stringify(fresh));
      updateCwd("/home/user");
      print("Virtual filesystem reset.");
    }
  }

  function handleClearScreen() {
    setLines([]);
    inputRef.current?.focus();
  }

  function handleTriggerKey(action) {
    if (action === "Tab") {
      handleTabAutocomplete();
    } else if (action === "Ctrl+C") {
      if (stdinResolverRef.current) {
        setLines((prev) => [
          ...prev,
          {
            type: "input-echo",
            text: input + "^C",
          },
        ]);
        const resolver = stdinResolverRef.current;
        stdinResolverRef.current = null;
        setIsAwaitingStdin(false);
        resolver(null);
        setInput("");
      } else {
        setLines((prev) => [
          ...prev,
          {
            type: "command",
            prompt: `${effectiveUser}@${hostname}:${formatPrompt(cwd)}$`,
            text: input + "^C",
          },
        ]);
        setInput("");
      }
    } else if (action === "ArrowUp") {
      if (!history.length) return;
      const newIndex = historyIndex === -1 ? history.length - 1 : Math.max(0, historyIndex - 1);
      setHistoryIndex(newIndex);
      setInput(history[newIndex]);
    } else if (action === "ArrowDown") {
      if (historyIndex === -1) return;
      const newIndex = historyIndex + 1;
      if (newIndex >= history.length) {
        setHistoryIndex(-1);
        setInput("");
        return;
      }
      setHistoryIndex(newIndex);
      setInput(history[newIndex]);
    }
    inputRef.current?.focus();
  }

  function runCommandFromKey(cmd) {
    setLines((prev) => [
      ...prev,
      {
        type: "command",
        prompt: `${effectiveUser}@${hostname}:${formatPrompt(cwd)}$`,
        text: cmd,
      },
    ]);
    execute(cmd);
    inputRef.current?.focus();
  }

  useImperativeHandle(ref, () => ({
    runCommand: (cmd) => {
      setLines((prev) => [
        ...prev,
        {
          type: "command",
          prompt: `${effectiveUser}@${hostname}:${formatPrompt(cwd)}$`,
          text: cmd,
        },
      ]);
      execute(cmd);
    },
    insertCommand: (cmd) => {
      setInput(cmd);
      inputRef.current?.focus();
    },
    resetFs: (skipConfirm = false) => handleResetFs(skipConfirm),
    clearScreen: handleClearScreen,
    getFs: () => fs,
    getCwd: () => cwd,
  }));

  const terminal = (
    <div
      className={`terminal-frame${expanded ? " is-expanded" : ""}`}
      ref={frameRef}
    >
      <div
        className="linux-terminal"
        style={{ height }}
        onClick={() => inputRef.current?.focus()}
      >
        {editor && editor.type === "vim" && (
          <VimEditor
            path={editor.path}
            initialContent={editor.content}
            onSave={(newContent) => {
              updateFS((root) => {
                const result = getParent(root, editor.path);
                if (!result?.parent) return;
                result.parent.children[result.name] = {
                  type: "file",
                  content: newContent,
                };
              });
            }}
            onClose={() => setEditor(null)}
          />
        )}

        {editor && editor.type === "nano" && (
          <NanoEditor
            path={editor.path}
            initialContent={editor.content}
            onSave={(newContent) => {
              updateFS((root) => {
                const result = getParent(root, editor.path);
                if (!result?.parent) return;
                result.parent.children[result.name] = {
                  type: "file",
                  content: newContent,
                };
              });
            }}
            onClose={() => setEditor(null)}
          />
        )}

        <div className="terminal-titlebar">
          <div className="terminal-buttons">
            <button
              type="button"
              className="terminal-window-dot close"
              onClick={handleClearScreen}
              aria-label="Clear terminal"
              title="Clear terminal screen"
            >
              <X size={8} />
            </button>
            <button
              type="button"
              className="terminal-window-dot minimize"
              onClick={handleResetFs}
              aria-label="Reset filesystem"
              title="Reset virtual filesystem"
            >
              <Minus size={8} />
            </button>
            <button
              type="button"
              className={`terminal-window-dot maximize${expanded ? " is-active" : ""}`}
              onClick={() => setExpanded(!expanded)}
              aria-label={expanded ? "Restore terminal" : "Expand terminal"}
              title={expanded ? "Restore" : "Expand"}
            >
              <Plus size={8} />
            </button>
          </div>

          <div className="terminal-title">
            <Terminal size={14} className="terminal-title-icon" />
            <span>{effectiveUser}@{hostname}:{formatPrompt(cwd)}</span>
          </div>

          <div className={`terminal-cloud-status ${isRunning ? "running" : syncStatus}`}>
            {isRunning && (
              <>
                <Zap size={12} />
                <span>Running</span>
              </>
            )}
            {!isRunning && syncStatus === "syncing" && (
              <>
                <RefreshCw size={12} className="animate-spin" />
                <span>Syncing</span>
              </>
            )}
            {!isRunning && syncStatus === "saving" && (
              <>
                <Cloud size={12} />
                <span>Saving</span>
              </>
            )}
            {!isRunning && syncStatus === "synced" && (
              <>
                <Cloud size={12} />
                <span>Synced</span>
              </>
            )}
            {!isRunning && syncStatus === "error" && (
              <>
                <AlertTriangle size={12} />
                <span>Local</span>
              </>
            )}
            {!isRunning && syncStatus === "guest" && (
              <>
                <HardDrive size={12} />
                <span>Guest</span>
              </>
            )}
          </div>
        </div>

        <div
          ref={terminalRef}
          className="terminal-body"
        >
          {lines.map((line, index) => {
            if (line.type === "input-echo") {
              return (
                <div
                  className="terminal-line command-line"
                  key={index}
                >
                  <span className="terminal-prompt">&gt;&nbsp;</span>
                  <span className="terminal-command">{line.text}</span>
                </div>
              );
            }

            if (line.type === "command") {
              return (
                <div
                  className="terminal-line command-line"
                  key={index}
                >
                  <span className="terminal-prompt">
                    {line.prompt}
                  </span>

                  <span className="terminal-command">
                    {line.text}
                  </span>
                </div>
              );
            }

            return (
              <pre
                key={index}
                className={`terminal-output ${
                  line.type === "error"
                    ? "terminal-error"
                    : ""
                }`}
              >
                {line.text}
              </pre>
            );
          })}

          <form
            className="terminal-input-line"
            onSubmit={handleSubmit}
          >
            <span className="terminal-prompt">
              {isAwaitingStdin ? "> " : `${effectiveUser}@${hostname}:${formatPrompt(cwd)}$ `}
            </span>

            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              autoComplete="off"
              spellCheck="false"
              autoFocus
            />
          </form>
        </div>

        <div className="terminal-quick-keys-bar">
          <button
            type="button"
            className="terminal-quick-key"
            onClick={() => handleTriggerKey("Tab")}
            title="Autocomplete current argument"
          >
            Tab
          </button>
          <button
            type="button"
            className="terminal-quick-key"
            onClick={() => handleTriggerKey("Ctrl+C")}
            title="Interrupt process"
          >
            ^C
          </button>
          <button
            type="button"
            className="terminal-quick-key"
            onClick={() => handleTriggerKey("ArrowUp")}
            title="Previous command"
          >
            <ChevronUp size={13} />
          </button>
          <button
            type="button"
            className="terminal-quick-key"
            onClick={() => handleTriggerKey("ArrowDown")}
            title="Next command"
          >
            <ChevronDown size={13} />
          </button>
          <button
            type="button"
            className="terminal-quick-key"
            onClick={() => runCommandFromKey("clear")}
          >
            clear
          </button>
          <button
            type="button"
            className="terminal-quick-key"
            onClick={() => runCommandFromKey("ls -la")}
          >
            ls -la
          </button>
          <button
            type="button"
            className="terminal-quick-key"
            onClick={() => runCommandFromKey("pwd")}
          >
            pwd
          </button>
          <button
            type="button"
            className="terminal-quick-key"
            onClick={() => runCommandFromKey("help")}
          >
            help
          </button>
          <button
            type="button"
            className="terminal-quick-key"
            onClick={() => runCommandFromKey("neofetch")}
          >
            neofetch
          </button>
        </div>
      </div>
    </div>
  );

  return expanded ? createPortal(terminal, document.body) : terminal;
});

export default LinuxTerminal;