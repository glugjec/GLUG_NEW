/**
 * Language configuration for the online compiler.
 * Maps each supported language to its Judge0 ID, Monaco editor language,
 * default boilerplate code, and error line extraction regex.
 */

export const LANGUAGES = {
  python: {
    id: 'python',
    name: 'Python',
    judge0Id: 71, // Python 3.8.1
    monacoLang: 'python',
    extension: '.py',
    color: '#3572A5',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/python/python-original.svg',
    defaultCode: `# Python 3 — Hello, World!
def main():
    print("Hello, World!")

if __name__ == "__main__":
    main()
`,
    extractErrorLine: (stderr) => {
      // Python: "  File "<string>", line 5"
      const match = stderr.match(/line (\d+)/);
      return match ? parseInt(match[1], 10) : null;
    },
  },

  c: {
    id: 'c',
    name: 'C',
    judge0Id: 50, // C (GCC 9.2.0)
    monacoLang: 'c',
    extension: '.c',
    color: '#555555',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/c/c-original.svg',
    defaultCode: `// C — Hello, World!
#include <stdio.h>

int main() {
    printf("Hello, World!\\n");
    return 0;
}
`,
    extractErrorLine: (stderr) => {
      // GCC: "main.c:5:10: error: ..."
      const match = stderr.match(/:(\d+):\d+:/);
      return match ? parseInt(match[1], 10) : null;
    },
  },

  cpp: {
    id: 'cpp',
    name: 'C++',
    judge0Id: 54, // C++ (GCC 9.2.0)
    monacoLang: 'cpp',
    extension: '.cpp',
    color: '#f34b7d',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg',
    defaultCode: `// C++ — Hello, World!
#include <iostream>

int main() {
    std::cout << "Hello, World!" << std::endl;
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
    judge0Id: 62, // Java (OpenJDK 13.0.1)
    monacoLang: 'java',
    extension: '.java',
    color: '#b07219',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/java/java-original.svg',
    defaultCode: `// Java — Hello, World!
public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, World!");
    }
}
`,
    extractErrorLine: (stderr) => {
      // javac: "Main.java:5: error: ..."
      const match = stderr.match(/\.java:(\d+):/);
      return match ? parseInt(match[1], 10) : null;
    },
  },

  csharp: {
    id: 'csharp',
    name: 'C#',
    judge0Id: 51, // C# (Mono 6.6.0.161)
    monacoLang: 'csharp',
    extension: '.cs',
    color: '#178600',
    logo: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/csharp/csharp-original.svg',
    defaultCode: `// C# — Hello, World!
using System;

class Program {
    static void Main(string[] args) {
        Console.WriteLine("Hello, World!");
    }
}
`,
    extractErrorLine: (stderr) => {
      // Mono/csc: "Program.cs(5,10): error CS..."
      const matchParen = stderr.match(/\((\d+),\d+\)/);
      if (matchParen) return parseInt(matchParen[1], 10);
      // Alternative: "Program.cs:5 error..."
      const matchColon = stderr.match(/\.cs:(\d+)/);
      return matchColon ? parseInt(matchColon[1], 10) : null;
    },
  },
};

/** Ordered list for the language selector UI */
export const LANGUAGE_LIST = [
  LANGUAGES.python,
  LANGUAGES.c,
  LANGUAGES.cpp,
  LANGUAGES.java,
  LANGUAGES.csharp,
];

/**
 * Parse all error lines from a stderr string for a given language.
 * Returns an array of unique line numbers.
 */
export function extractAllErrorLines(languageId, stderr) {
  if (!stderr) return [];

  const lang = LANGUAGES[languageId];
  if (!lang) return [];

  const lines = new Set();

  // Try to extract every line number mentioned
  const linePatterns = {
    python: /line (\d+)/g,
    c: /:(\d+):\d+:/g,
    cpp: /:(\d+):\d+:/g,
    java: /\.java:(\d+):/g,
    csharp: /\((\d+),\d+\)/g,
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
