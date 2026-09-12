let pyodideInstance = null;
let pyodideLoadingPromise = null;
let currentInputResolver = null;
let currentInputRejector = null;
let executionAborted = false;

export async function getPyodide(onProgress) {
  if (pyodideInstance) {
    return pyodideInstance;
  }

  if (pyodideLoadingPromise) {
    return pyodideLoadingPromise;
  }

  pyodideLoadingPromise = (async () => {
    if (typeof window === 'undefined') {
      throw new Error('Pyodide can only run in a browser environment.');
    }

    if (onProgress) onProgress('Loading Python WebAssembly runtime...');

    if (!window.loadPyodide) {
      await new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/pyodide.js';
        script.async = true;
        script.onload = () => resolve();
        script.onerror = () => reject(new Error('Failed to load Pyodide from CDN.'));
        document.head.appendChild(script);
      });
    }

    if (onProgress) onProgress('Initializing Python environment...');

    const pyodide = await window.loadPyodide({
      indexURL: 'https://cdn.jsdelivr.net/pyodide/v0.26.4/full/',
    });

    await pyodide.runPythonAsync(`
import builtins
import asyncio
import ast
import js
import sys

async def __glug_async_input__(prompt=""):
    if prompt:
        js.__glug_term_write__(str(prompt), "stdout")
    val = await js.__glug_term_input_request__(str(prompt))
    return str(val)

def __transform_for_interactive_input__(source_code):
    try:
        tree = ast.parse(source_code)
    except Exception:
        return source_code

    async_funcs = {'input', '__glug_async_input__'}
    changed = True
    while changed:
        changed = False
        for node in ast.walk(tree):
            if isinstance(node, ast.FunctionDef) and node.name not in async_funcs:
                for sub in ast.walk(node):
                    if isinstance(sub, ast.Call) and isinstance(sub.func, ast.Name) and sub.func.id in async_funcs:
                        async_funcs.add(node.name)
                        changed = True
                        break

    class AsyncInputTransformer(ast.NodeTransformer):
        def visit_FunctionDef(self, node):
            self.generic_visit(node)
            if node.name in async_funcs:
                async_node = ast.AsyncFunctionDef(
                    name=node.name,
                    args=node.args,
                    body=node.body,
                    decorator_list=node.decorator_list,
                    returns=node.returns,
                    type_comment=getattr(node, 'type_comment', None)
                )
                return ast.copy_location(async_node, node)
            return node

        def visit_Call(self, node):
            self.generic_visit(node)
            func_name = node.func.id if isinstance(node.func, ast.Name) else None
            if func_name in async_funcs:
                if func_name == 'input':
                    node.func = ast.Name(id='__glug_async_input__', ctx=ast.Load())
                return ast.copy_location(ast.Await(value=node), node)
            return node

    transformed = AsyncInputTransformer().visit(tree)
    ast.fix_missing_locations(transformed)

    top_level_stmts = []
    def_stmts = []
    for stmt in transformed.body:
        if isinstance(stmt, (ast.FunctionDef, ast.AsyncFunctionDef, ast.ClassDef, ast.Import, ast.ImportFrom)):
            def_stmts.append(stmt)
        else:
            top_level_stmts.append(stmt)

    if not top_level_stmts:
        return ast.unparse(transformed)

    assigned_vars = set()
    for stmt in top_level_stmts:
        for n in ast.walk(stmt):
            if isinstance(n, ast.Name) and isinstance(n.ctx, ast.Store):
                assigned_vars.add(n.id)

    if assigned_vars:
        top_level_stmts.insert(0, ast.Global(names=list(assigned_vars)))

    runner_func = ast.AsyncFunctionDef(
        name='__glug_exec_runner__',
        args=ast.arguments(posonlyargs=[], args=[], vararg=None, kwonlyargs=[], kw_defaults=[], kwarg=None, defaults=[]),
        body=top_level_stmts,
        decorator_list=[]
    )

    final_mod = ast.Module(body=def_stmts + [runner_func], type_ignores=[])
    ast.fix_missing_locations(final_mod)
    return ast.unparse(final_mod)
`);

    pyodideInstance = pyodide;
    return pyodide;
  })();

  return pyodideLoadingPromise;
}

export function sendInputToPyodide(text) {
  if (currentInputResolver) {
    const resolver = currentInputResolver;
    currentInputResolver = null;
    currentInputRejector = null;
    resolver(text);
    return true;
  }
  return false;
}

export function abortPyodideExecution() {
  executionAborted = true;
  if (currentInputRejector) {
    const rejector = currentInputRejector;
    currentInputResolver = null;
    currentInputRejector = null;
    rejector(new Error('Execution interrupted by user.'));
  }
}

export async function runPythonInteractive(sourceCode, {
  onStdout = () => {},
  onStderr = () => {},
  onRequestInput = () => {},
  onStatusChange = () => {},
  prefilledStdin = '',
}) {
  executionAborted = false;
  currentInputResolver = null;
  currentInputRejector = null;

  const startTime = performance.now();
  const pyodide = await getPyodide(onStatusChange);

  onStatusChange('Running...');

  const stdinQueue = prefilledStdin ? prefilledStdin.split('\n') : [];

  window.__glug_term_write__ = (text, type = 'stdout') => {
    if (type === 'stderr') {
      onStderr(text);
    } else {
      onStdout(text);
    }
  };

  window.__glug_term_input_request__ = (prompt) => {
    if (executionAborted) {
      return Promise.reject(new Error('Execution interrupted by user.'));
    }

    if (stdinQueue.length > 0) {
      const nextInput = stdinQueue.shift();
      onStdout(nextInput + '\n');
      return Promise.resolve(nextInput);
    }

    onRequestInput(prompt || '');

    return new Promise((resolve, reject) => {
      currentInputResolver = resolve;
      currentInputRejector = reject;
    });
  };

  pyodide.setStdout({
    batched: (text) => {
      onStdout(text + '\n');
    },
  });

  pyodide.setStderr({
    batched: (text) => {
      onStderr(text + '\n');
    },
  });

  try {
    const transformPy = pyodide.globals.get('__transform_for_interactive_input__');
    const transformedCode = transformPy(sourceCode);

    await pyodide.runPythonAsync(transformedCode);

    if (pyodide.globals.has('__glug_exec_runner__')) {
      const runner = pyodide.globals.get('__glug_exec_runner__');
      await runner();
    }

    const duration = ((performance.now() - startTime) / 1000).toFixed(3);

    return {
      success: true,
      time: `${duration}s`,
      memory: 'WASM Browser Memory',
      statusDescription: 'Accepted',
      statusId: 3,
      errorLines: [],
    };
  } catch (err) {
    if (executionAborted || err.message?.includes('interrupted')) {
      return {
        success: false,
        error: 'Execution cancelled by user.',
        statusDescription: 'Interrupted',
        statusId: -1,
        time: `${((performance.now() - startTime) / 1000).toFixed(3)}s`,
        errorLines: [],
      };
    }

    const errorMsg = err.message || String(err);
    const lineMatches = Array.from(errorMsg.matchAll(/line (\d+)/g)).map((m) => parseInt(m[1], 10));
    const uniqueLines = Array.from(new Set(lineMatches));

    onStderr(errorMsg);

    return {
      success: false,
      error: errorMsg,
      statusDescription: errorMsg.includes('SyntaxError') ? 'Compilation Error' : 'Runtime Error',
      statusId: errorMsg.includes('SyntaxError') ? 6 : 11,
      time: `${((performance.now() - startTime) / 1000).toFixed(3)}s`,
      errorLines: uniqueLines,
      compilationError: errorMsg.includes('SyntaxError'),
      runtimeError: !errorMsg.includes('SyntaxError'),
    };
  } finally {
    currentInputResolver = null;
    currentInputRejector = null;
    delete window.__glug_term_write__;
    delete window.__glug_term_input_request__;
  }
}
