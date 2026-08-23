/**
 * Judge0 CE API integration via RapidAPI.
 *
 * To use this, sign up at https://rapidapi.com/judge0-official/api/judge0-ce
 * and paste your X-RapidAPI-Key below (or set VITE_JUDGE0_API_KEY env var).
 */
import axios from 'axios';
import { LANGUAGES, extractAllErrorLines } from '../utils/languageConfig';

const RAPIDAPI_BASE = 'https://judge0-ce.p.rapidapi.com';
const PUBLIC_BASE = 'https://ce.judge0.com';

/**
 * Status IDs from Judge0:
 * 1 = In Queue, 2 = Processing, 3 = Accepted,
 * 4 = Wrong Answer, 5 = Time Limit Exceeded,
 * 6 = Compilation Error, 7-12 = Runtime Errors,
 * 13 = Internal Error, 14 = Exec Format Error
 */
const STATUS = {
  IN_QUEUE: 1,
  PROCESSING: 2,
  ACCEPTED: 3,
  WRONG_ANSWER: 4,
  TLE: 5,
  COMPILATION_ERROR: 6,
  RUNTIME_SIGSEGV: 7,
  RUNTIME_SIGXFSZ: 8,
  RUNTIME_SIGFPE: 9,
  RUNTIME_SIGABRT: 10,
  RUNTIME_NZEC: 11,
  RUNTIME_OTHER: 12,
  INTERNAL_ERROR: 13,
  EXEC_FORMAT_ERROR: 14,
};

/**
 * Submit code for execution and wait for the result.
 * Uses ?wait=true for synchronous mode. Supports AbortSignal.
 */
export async function executeCode(languageId, sourceCode, stdin = '', signal = null) {
  const lang = LANGUAGES[languageId];
  if (!lang) {
    throw new Error(`Unsupported language: ${languageId}`);
  }

  const apiKey = import.meta.env.VITE_JUDGE0_API_KEY;

  const url = apiKey
    ? `${RAPIDAPI_BASE}/submissions?base64_encoded=false&wait=true&fields=*`
    : `${PUBLIC_BASE}/submissions?base64_encoded=false&wait=true`;

  const headers = apiKey
    ? {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': apiKey,
        'X-RapidAPI-Host': 'judge0-ce.p.rapidapi.com',
      }
    : {
        'Content-Type': 'application/json',
      };

  try {
    const response = await axios.post(
      url,
      {
        source_code: sourceCode,
        language_id: lang.judge0Id,
        stdin: stdin || undefined,
      },
      { headers, signal }
    );

    return parseResponse(response.data, languageId, sourceCode, stdin);
  } catch (error) {
    if (axios.isCancel(error) || error.name === 'CanceledError' || error.name === 'AbortError') {
      return {
        success: false,
        output: '',
        error: 'Execution cancelled by user.',
        statusDescription: 'Cancelled',
        statusId: -1,
        time: null,
        memory: null,
        errorLines: [],
        compilationError: false,
        runtimeError: false,
        timeLimitExceeded: false,
        isInputMissing: false,
      };
    }

    if (error.response) {
      const status = error.response.status;
      if (status === 429) {
        throw new Error('Rate limit exceeded. Please wait a moment and try again.');
      }
      if (status === 401 || status === 403) {
        throw new Error('API authorization error. Please check your API key.');
      }
      throw new Error(`Execution error (${status}): ${error.response.data?.message || error.response.data?.error || 'Unknown error'}`);
    }
    throw new Error(`Execution request failed: ${error.message}`);
  }
}

/**
 * Check if the code has standard input statements.
 */
export function detectCodeNeedsInput(languageId, sourceCode) {
  if (!sourceCode) return false;

  const patterns = {
    python: /\b(input|sys\.stdin\.readline|sys\.stdin\.read)\b/,
    c: /\b(scanf|getchar|gets|fgets|cin)\b/,
    cpp: /\b(cin|scanf|getchar|getline)\b/,
    java: /\b(Scanner|BufferedReader|System\.in)\b/,
    csharp: /\b(Console\.ReadLine|Console\.Read)\b/,
  };

  const pattern = patterns[languageId];
  return pattern ? pattern.test(sourceCode) : false;
}

/**
 * Check if an error was caused by missing standard input.
 */
export function isMissingInputError(stderr = '', stdout = '') {
  const combined = (stderr + ' ' + stdout).toLowerCase();
  return (
    combined.includes('eoferror') ||
    combined.includes('nosuchelementexception') ||
    combined.includes('end of file') ||
    combined.includes('eof when reading') ||
    combined.includes('input past end') ||
    combined.includes('unexpected end of stream')
  );
}

/**
 * Parse the Judge0 API response into a structured result.
 */
function parseResponse(data, languageId, sourceCode = '', stdin = '') {
  const statusId = data.status?.id;
  const isError =
    statusId === STATUS.COMPILATION_ERROR ||
    (statusId >= STATUS.RUNTIME_SIGSEGV && statusId <= STATUS.RUNTIME_OTHER) ||
    statusId === STATUS.TLE ||
    statusId === STATUS.INTERNAL_ERROR;

  const stderr = data.stderr || data.compile_output || '';
  const stdout = data.stdout || '';
  const errorLines = isError ? extractAllErrorLines(languageId, stderr) : [];

  const inputMissing = (isError && isMissingInputError(stderr, stdout)) ||
    (!stdin.trim() && detectCodeNeedsInput(languageId, sourceCode) && !stdout.trim() && statusId === STATUS.TLE);

  return {
    success: !isError,
    output: stdout,
    error: stderr,
    statusDescription: data.status?.description || 'Unknown',
    statusId,
    time: data.time ? `${data.time}s` : null,
    memory: data.memory ? `${(data.memory / 1024).toFixed(1)} MB` : null,
    errorLines,
    compilationError: statusId === STATUS.COMPILATION_ERROR,
    runtimeError: statusId >= STATUS.RUNTIME_SIGSEGV && statusId <= STATUS.RUNTIME_OTHER,
    timeLimitExceeded: statusId === STATUS.TLE,
    isInputMissing: inputMissing,
  };
}

/**
 * Mock response for demo mode (when no API key is configured).
 * Simulates compilation and detects basic syntax errors.
 */
function getMockResponse(languageId, sourceCode) {
  return new Promise((resolve) => {
    // Simulate network delay
    setTimeout(() => {
      // Simple mock: check for common syntax errors
      const hasError = detectMockError(languageId, sourceCode);

      if (hasError) {
        resolve({
          success: false,
          output: '',
          error: hasError.message,
          statusDescription: hasError.type,
          statusId: hasError.type === 'Compilation Error' ? STATUS.COMPILATION_ERROR : STATUS.RUNTIME_NZEC,
          time: '0.001s',
          memory: '0.5 MB',
          errorLines: hasError.lines,
          compilationError: hasError.type === 'Compilation Error',
          runtimeError: hasError.type !== 'Compilation Error',
          timeLimitExceeded: false,
        });
      } else {
        // Simulate successful execution with Hello World output
        const outputs = {
          python: 'Hello, World!\n',
          c: 'Hello, World!\n',
          cpp: 'Hello, World!\n',
          java: 'Hello, World!\n',
          csharp: 'Hello, World!\n',
        };
        resolve({
          success: true,
          output: outputs[languageId] || 'Program executed successfully.\n',
          error: '',
          statusDescription: 'Accepted',
          statusId: STATUS.ACCEPTED,
          time: '0.032s',
          memory: '3.2 MB',
          errorLines: [],
          compilationError: false,
          runtimeError: false,
          timeLimitExceeded: false,
        });
      }
    }, 800 + Math.random() * 700);
  });
}

/**
 * Very basic mock error detection for demo purposes.
 */
function detectMockError(languageId, sourceCode) {
  const lines = sourceCode.split('\n');

  if (languageId === 'python') {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line && !line.startsWith('#') && !line.startsWith('"""') && !line.startsWith("'''")) {
        // Check for missing colons after def/if/for/while/class
        if (/^(def|if|for|while|class|elif|else|try|except|finally)\b/.test(line) && !line.endsWith(':') && !line.endsWith(':\\')) {
          return {
            type: 'Compilation Error',
            message: `  File "main.py", line ${i + 1}\n    ${line}\n                     ^\nSyntaxError: expected ':'`,
            lines: [i + 1],
          };
        }
      }
    }
  }

  if (['c', 'cpp'].includes(languageId)) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Check for missing semicolons (very basic)
      if (line && !line.startsWith('//') && !line.startsWith('#') &&
          !line.startsWith('{') && !line.startsWith('}') &&
          !line.endsWith('{') && !line.endsWith('}') &&
          !line.endsWith(';') && !line.endsWith(',') &&
          !line.endsWith('\\') && !line.endsWith(':') &&
          !line.includes('//') &&
          /\w/.test(line) &&
          /(return|printf|cout|int |char |float |double |void )/.test(line)) {
        return {
          type: 'Compilation Error',
          message: `main.${languageId === 'c' ? 'c' : 'cpp'}:${i + 1}:${line.length}: error: expected ';' at end of statement\n    ${line}\n    ${' '.repeat(line.length - 1)}^`,
          lines: [i + 1],
        };
      }
    }
  }

  return null;
}
