import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';
import os from 'os';
import { spawn } from 'child_process';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

async function saveUploadedFileToTemp(file, targetDir, nameHint) {
  const arrayBuffer = await file.arrayBuffer();
  const buffer = Buffer.from(arrayBuffer);
  const safeName = nameHint || file.name || `upload-${Date.now()}`;
  const dest = path.join(targetDir, safeName);
  await fs.writeFile(dest, buffer);
  return dest;
}

function runPythonProcess(args, options = {}) {
  return new Promise((resolve, reject) => {
    const proc = spawn(args.shift(), args, { ...options });
    let stdout = '';
    let stderr = '';
    proc.stdout.on('data', d => { stdout += d.toString(); });
    proc.stderr.on('data', d => { stderr += d.toString(); });
    proc.on('error', reject);
    proc.on('close', code => {
      if (code === 0) resolve({ code, stdout, stderr });
      else reject(new Error(`Python exited with code ${code}: ${stderr || stdout}`));
    });
  });
}

export async function POST(req) {
  let tmpRoot;
  try {
    const fd = await req.formData();

    const sources = fd.getAll('sources');

    if (!sources || sources.length === 0)
      return NextResponse.json({ error: 'حداقل یک فایل ورودی لازم است' }, { status: 400 });

    // Prepare temp workspace
    tmpRoot = await fs.mkdtemp(path.join(os.tmpdir(), 'invoice-proc-'));
    const sourcesDir = path.join(tmpRoot, 'sources');
    await fs.mkdir(sourcesDir, { recursive: true });

    // Save sources
    const savedSources = [];
    for (const f of sources) {
      if (typeof f === 'string') continue;
      const name = f.name || `src-${savedSources.length + 1}.xls`;
      const saved = await saveUploadedFileToTemp(f, sourcesDir, name);
      savedSources.push(saved);
    }

    if (savedSources.length === 0)
      return NextResponse.json({ error: 'هیچ فایل معتبری ارسال نشد' }, { status: 400 });

    // Fixed template path
    const templatePath = '/Users/taha/Documents/Work/sedaqat_warehouse/final/مصرف کننده.xlsm';

    // Build python command
    const pythonBin = '/Users/taha/Documents/Work/sedaqat_warehouse/final/venv/bin/python';
    const scriptPath = '/Users/taha/Documents/Work/sedaqat_warehouse/final/complete_solution.py';
    const outputPath = path.join(tmpRoot, `result-${Date.now()}.xlsx`);

    const args = [
      pythonBin,
      scriptPath,
      savedSources.length > 1 ? '--sources-dir' : '--source',
      savedSources.length > 1 ? sourcesDir : savedSources[0],
      '--template', templatePath,
      '--output', outputPath,
    ];

    // Run python
    const { stdout, stderr } = await runPythonProcess(args, { cwd: tmpRoot });
    if (stderr) console.error('[invoice-process] python stderr:', stderr);
    if (stdout) console.log('[invoice-process] python stdout:', stdout);

    // Read output
    const outBuf = await fs.readFile(outputPath);
    const fileName = 'result.xlsx';

    return new Response(outBuf, {
      status: 200,
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'Content-Disposition': `attachment; filename="${fileName}"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[invoice-process] ERROR', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  } finally {
    // Best-effort cleanup
    if (tmpRoot) {
      try { await fs.rm(tmpRoot, { recursive: true, force: true }); } catch (_) {}
    }
  }
}
