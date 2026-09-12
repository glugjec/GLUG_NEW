export const LANGUAGES = {
  python: {
    id: 'python',
    name: 'Python',
    judge0Id: 71,
    monacoLang: 'python',
    extension: '.py',
    color: '#3572A5',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    defaultCode: `def main():
    print("Hello from Python!")

if __name__ == "__main__":
    main()
`,
    extractErrorLine: (stderr) => {
      const match = stderr.match(/line (\d+)/);
      return match ? parseInt(match[1], 10) : null;
    },
  },

  javascript: {
    id: 'javascript',
    name: 'JavaScript',
    judge0Id: 63,
    monacoLang: 'javascript',
    extension: '.js',
    color: '#f7df1e',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg',
    defaultCode: `function main() {
  console.log("Hello from JavaScript!");
}

main();
`,
    extractErrorLine: (stderr) => {
      const match = stderr.match(/:(\d+):\d+/);
      return match ? parseInt(match[1], 10) : null;
    },
  },

  typescript: {
    id: 'typescript',
    name: 'TypeScript',
    judge0Id: 74,
    monacoLang: 'typescript',
    extension: '.ts',
    color: '#3178c6',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg',
    defaultCode: `function greet(name: string): void {
  console.log(\`Hello, \${name} from TypeScript!\`);
}

greet("Developer");
`,
    extractErrorLine: (stderr) => {
      const match = stderr.match(/\((\d+),\d+\)/);
      return match ? parseInt(match[1], 10) : null;
    },
  },

  cpp: {
    id: 'cpp',
    name: 'C++',
    judge0Id: 54,
    monacoLang: 'cpp',
    extension: '.cpp',
    color: '#f34b7d',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    defaultCode: `#include <iostream>

int main() {
    std::cout << "Hello from C++!" << std::endl;
    return 0;
}
`,
    extractErrorLine: (stderr) => {
      const match = stderr.match(/:(\d+):\d+:/);
      return match ? parseInt(match[1], 10) : null;
    },
  },

  c: {
    id: 'c',
    name: 'C',
    judge0Id: 50,
    monacoLang: 'c',
    extension: '.c',
    color: '#555555',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
    defaultCode: `#include <stdio.h>

int main() {
    printf("Hello from C!\\n");
    return 0;
}
`,
    extractErrorLine: (stderr) => {
      const match = stderr.match(/:(\d+):\d+:/);
      return match ? parseInt(match[1], 10) : null;
    },
  },

  java: {
    id: 'java',
    name: 'Java',
    judge0Id: 62,
    monacoLang: 'java',
    extension: '.java',
    color: '#b07219',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    defaultCode: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello from Java!");
    }
}
`,
    extractErrorLine: (stderr) => {
      const match = stderr.match(/\.java:(\d+):/);
      return match ? parseInt(match[1], 10) : null;
    },
  },

  csharp: {
    id: 'csharp',
    name: 'C#',
    judge0Id: 51,
    monacoLang: 'csharp',
    extension: '.cs',
    color: '#178600',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
    defaultCode: `using System;

class Program {
    static void Main(string[] args) {
        Console.WriteLine("Hello from C#!");
    }
}
`,
    extractErrorLine: (stderr) => {
      const matchParen = stderr.match(/\((\d+),\d+\)/);
      if (matchParen) return parseInt(matchParen[1], 10);
      const matchColon = stderr.match(/\.cs:(\d+)/);
      return matchColon ? parseInt(matchColon[1], 10) : null;
    },
  },

  go: {
    id: 'go',
    name: 'Go',
    judge0Id: 60,
    monacoLang: 'go',
    extension: '.go',
    color: '#00add8',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/go/go-original.svg',
    defaultCode: `package main

import "fmt"

func main() {
    fmt.Println("Hello from Go!")
}
`,
    extractErrorLine: (stderr) => {
      const match = stderr.match(/:(\d+):\d+:/);
      return match ? parseInt(match[1], 10) : null;
    },
  },

  rust: {
    id: 'rust',
    name: 'Rust',
    judge0Id: 73,
    monacoLang: 'rust',
    extension: '.rs',
    color: '#dea584',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/rust/rust-original.svg',
    defaultCode: `fn main() {
    println!("Hello from Rust!");
}
`,
    extractErrorLine: (stderr) => {
      const match = stderr.match(/:(\d+):\d+/);
      return match ? parseInt(match[1], 10) : null;
    },
  },

  ruby: {
    id: 'ruby',
    name: 'Ruby',
    judge0Id: 72,
    monacoLang: 'ruby',
    extension: '.rb',
    color: '#701516',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/ruby/ruby-original.svg',
    defaultCode: `def main
  puts "Hello from Ruby!"
end

main
`,
    extractErrorLine: (stderr) => {
      const match = stderr.match(/:(\d+):in/);
      return match ? parseInt(match[1], 10) : null;
    },
  },

  php: {
    id: 'php',
    name: 'PHP',
    judge0Id: 68,
    monacoLang: 'php',
    extension: '.php',
    color: '#4F5D95',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/php/php-original.svg',
    defaultCode: `<?php
echo "Hello from PHP!\\n";
`,
    extractErrorLine: (stderr) => {
      const match = stderr.match(/on line (\d+)/i);
      return match ? parseInt(match[1], 10) : null;
    },
  },
};

export const LANGUAGE_LIST = [
  LANGUAGES.python,
  LANGUAGES.javascript,
  LANGUAGES.typescript,
  LANGUAGES.cpp,
  LANGUAGES.c,
  LANGUAGES.java,
  LANGUAGES.csharp,
  LANGUAGES.go,
  LANGUAGES.rust,
  LANGUAGES.ruby,
  LANGUAGES.php,
];

export function extractAllErrorLines(languageId, stderr) {
  if (!stderr) return [];

  const lines = new Set();
  const linePatterns = {
    python: /line (\d+)/g,
    javascript: /:(\d+):\d+/g,
    typescript: /\((\d+),\d+\)/g,
    cpp: /:(\d+):\d+:/g,
    c: /:(\d+):\d+:/g,
    java: /\.java:(\d+):/g,
    csharp: /\((\d+),\d+\)/g,
    go: /:(\d+):\d+:/g,
    rust: /:(\d+):\d+/g,
    ruby: /:(\d+):in/g,
    php: /on line (\d+)/gi,
  };

  const pattern = linePatterns[languageId];
  if (pattern) {
    let match;
    while ((match = pattern.exec(stderr)) !== null) {
      lines.add(parseInt(match[1], 10));
    }
  }

  return Array.from(lines);
}
