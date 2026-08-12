import { useEffect, useRef, useState } from "react";
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
                "Welcome to the virtual Linux terminal!\n\nThis filesystem is stored in localStorage.",
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

export default function LinuxTerminal({
  username = "user",
  hostname = "linux",
  height = 500,
  storageKey = STORAGE_KEY,
}) {
  const [fs, setFs] = useState(() => {
    try {
      const saved = localStorage.getItem(storageKey);

      return saved ? JSON.parse(saved) : clone(DEFAULT_FS);
    } catch {
      return clone(DEFAULT_FS);
    }
  });

  const [cwd, setCwd] = useState("/home/user");
  const [editor, setEditor] = useState(null);
  const [env, setEnv] = useState({
    USER: username,
    HOSTNAME: hostname,
    HOME: "/home/user",
    PWD: "/home/user",
  });

  function updateCwd(path) {
    setCwd(path);
    setEnv((prev) => ({ ...prev, PWD: path }));
  }


  const [lines, setLines] = useState([
    {
      type: "output",
      text: `Welcome to ${hostname}. Type "help" for available commands.`,
    },
  ]);

  const [input, setInput] = useState("");

  const [history, setHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  const inputRef = useRef(null);
  const terminalRef = useRef(null);
  const frameRef = useRef(null);

  function handleMouseMove(e) {
    const el = frameRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;
    el.style.setProperty("--tiltY", `${((x - 0.5) * 8).toFixed(2)}deg`);
    el.style.setProperty("--tiltX", `${((0.5 - y) * 8).toFixed(2)}deg`);
  }

  function handleMouseLeave() {
    const el = frameRef.current;
    if (!el) return;
    el.style.setProperty("--tiltX", "0deg");
    el.style.setProperty("--tiltY", "0deg");
  }

  // Persist filesystem
  useEffect(() => {
    localStorage.setItem(storageKey, JSON.stringify(fs));
  }, [fs, storageKey]);

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

  function executeSingleCommand(cmd, args, stdin) {
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
          "  date            Current date",
          "  export <var>=<val> Set environment variables",
          "  wc <file>       Word, line, and byte count",
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
      print(username);
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
        print(longFormat ? `-rw-r--r-- 1 ${username} ${basename(target)}` : basename(target));
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
              ? `drwxr-xr-x 2 ${username} ${name}`
              : `-rw-r--r-- 1 ${username} ${name}`;
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
      const confirmed = window.confirm(
        "Reset the virtual filesystem?"
      );

      if (confirmed) {
        const fresh = clone(DEFAULT_FS);

        setFs(fresh);
        localStorage.setItem(
          storageKey,
          JSON.stringify(fresh)
        );

        updateCwd("/home/user");

        print("Virtual filesystem reset.");
      }

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
        path,
        content: node?.content || "",
      });

      return;
    }

    /*
     * UNKNOWN COMMAND
     */

    printError(
      `${cmd}: command not found`
    );
  }

  function execute(command) {
    const trimmed = command.trim();

    if (!trimmed) return;

    setHistory((prev) => {
      const next = [...prev, trimmed];

      return next.slice(-100);
    });

    setHistoryIndex(-1);

    // Expand environment variables
    const expanded = expandEnvVars(trimmed);

    // Parse redirections (> and >>)
    const redirectMatch = expanded.match(/^(.*?)\s*(>>|>)\s*(.+)$/);
    let redirectTo = null;
    let redirectAppend = false;
    let cmdPart = expanded;

    if (redirectMatch) {
      cmdPart = redirectMatch[1].trim();
      const operator = redirectMatch[2];
      const target = redirectMatch[3].trim();
      
      redirectTo = resolvePath(target, cwd);
      redirectAppend = (operator === ">>");
    }

    // Split by pipes
    const pipeParts = cmdPart.split("|").map((p) => p.trim()).filter(Boolean);

    if (pipeParts.length === 0) return;

    let currentStdin = null;

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

      executeSingleCommand(cmd, args, currentStdin);

      interceptRef.current = null;

      if (captureOutput) {
        currentStdin = localBuffer.stdout.join("\n");

        if (localBuffer.stderr.length > 0) {
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
  }

  function handleSubmit(e) {
    e.preventDefault();

    const command = input;

    setLines((prev) => [
      ...prev,
      {
        type: "command",
        prompt: `${username}@${hostname}:${formatPrompt(cwd)}$`,
        text: command,
      },
    ]);

    setInput("");

    execute(command);
  }

  function handleKeyDown(e) {
    /*
     * CTRL + C
     */

    if (e.ctrlKey && e.key === "c") {
      e.preventDefault();

      setLines((prev) => [
        ...prev,
        {
          type: "command",
          prompt: `${username}@${hostname}:${formatPrompt(cwd)}$`,
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

      const parts = input.split(" ");

      const current = parts[parts.length - 1];

      const path = resolvePath(current || ".", cwd);

      const parentPath = dirname(path);

      const searchName = basename(path);

      const parent = getNode(fs, parentPath);

      if (!parent || parent.type !== "dir") return;

      const matches = Object.keys(parent.children).filter(
        (name) => name.startsWith(searchName)
      );

      if (matches.length === 1) {
        parts[parts.length - 1] =
          parentPath === "/"
            ? "/" + matches[0]
            : parentPath + "/" + matches[0];

        setInput(parts.join(" "));
      }
    }
  }

  return (
    <>
      {editor && (
        <div className="nano-overlay">
          <div className="nano-editor">
            <div className="nano-header">
              GNU nano
            </div>

            <textarea
              className="nano-textarea"
              value={editor.content}
              autoFocus
              onChange={(e) =>
                setEditor({
                  ...editor,
                  content: e.target.value,
                })
              }
              onKeyDown={(e) => {
                // Ctrl + X = exit
                if (e.ctrlKey && e.key.toLowerCase() === "x") {
                  e.preventDefault();

                  const save = window.confirm(
                    "Save modified buffer?"
                  );

                  if (save) {
                    updateFS((root) => {
                      const result = getParent(
                        root,
                        editor.path
                      );

                      if (!result?.parent) return;

                      result.parent.children[result.name] = {
                        type: "file",
                        content: editor.content,
                      };
                    });
                  }

                  setEditor(null);
                }

                // Ctrl + O = save
                if (e.ctrlKey && e.key.toLowerCase() === "o") {
                  e.preventDefault();

                  updateFS((root) => {
                    const result = getParent(
                      root,
                      editor.path
                    );

                    if (!result?.parent) return;

                    result.parent.children[result.name] = {
                      type: "file",
                      content: editor.content,
                    };
                  });
                }
              }}
            />

            <div className="nano-status">
              {editor.path}
            </div>

            <div className="nano-footer">
              <span>^O Write Out</span>
              <span>^X Exit</span>
            </div>
          </div>
        </div>
      )}

      <div
        className="terminal-frame"
        ref={frameRef}
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseLeave}
      >
      <div
        className="linux-terminal"
        style={{ height }}
        onClick={() => inputRef.current?.focus()}
      >
        <div className="terminal-titlebar">
          <div className="terminal-buttons">
            <span className="terminal-button close" />
            <span className="terminal-button minimize" />
            <span className="terminal-button maximize" />
          </div>

          <div className="terminal-title">
            {username}@{hostname}
          </div>

          <div className="terminal-spacer" />
        </div>

        <div
          ref={terminalRef}
          className="terminal-body"
        >
          {lines.map((line, index) => {
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
              {username}@{hostname}:{formatPrompt(cwd)}$
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
      </div>
      </div>
    </>
  );
}