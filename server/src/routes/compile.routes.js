import { Router } from 'express';

const router = Router();

const PISTON_URL = process.env.PISTON_URL || 'http://localhost:2000';

router.post('/compile', async (req, res) => {
  const { code, stdin = '' } = req.body;

  if (!code || typeof code !== 'string') {
    return res.status(400).json({ error: 'Code is required' });
  }

  try {
    const response = await fetch(`${PISTON_URL}/api/v2/execute`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        language: 'c',
        version: '*',
        files: [{ name: 'main.c', content: code }],
        stdin,
        run_timeout: 3000,
        compile_timeout: 10000,
      }),
    });

    if (!response.ok) {
      const text = await response.text();
      return res.status(502).json({ error: `Compiler service error: ${text}` });
    }

    const data = await response.json();

    const compile = data.compile
      ? {
          stdout: data.compile.stdout || '',
          stderr: data.compile.stderr || '',
          code: data.compile.code,
        }
      : null;

    res.json({
      language: 'C',
      compile,
      run: {
        stdout: data.run.stdout || '',
        stderr: data.run.stderr || '',
        code: data.run.code,
        signal: data.run.signal ?? null,
        output: data.run.output ?? '',
      },
    });
  } catch (err) {
    console.error('Compile proxy error:', err.message);
    res.status(502).json({ error: 'Cannot reach compiler service' });
  }
});

export default router;