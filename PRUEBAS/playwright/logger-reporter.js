/**
 * Reporter personalizado de AutoLog.
 * Escribe un archivo .log por cada prueba en:
 *   logs/exitosas/<timestamp>-<nombre>.log
 *   logs/errores/<timestamp>-<nombre>.log
 */

const fs = require('fs');
const path = require('path');

const LOGS_BASE = path.join(__dirname, '..', 'logs');
const DIR_OK  = path.join(LOGS_BASE, 'exitosas');
const DIR_ERR = path.join(LOGS_BASE, 'errores');

function slug(str) {
  return str.replace(/[^a-zA-Z0-9_\-]/g, '_').slice(0, 80);
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
}

class AutoLogReporter {
  onBegin(config, suite) {
    [DIR_OK, DIR_ERR].forEach(d => fs.mkdirSync(d, { recursive: true }));
    console.log(`\n[AutoLog Logger] Logs → ${LOGS_BASE}\n`);
  }

  onTestEnd(test, result) {
    const ts     = timestamp();
    const name   = slug(test.title);
    const status = result.status; // 'passed' | 'failed' | 'timedOut' | 'skipped'
    const dir    = status === 'passed' ? DIR_OK : DIR_ERR;

    const lines = [
      `=== AutoLog Test Log ===`,
      `Fecha     : ${new Date().toLocaleString('es-AR')}`,
      `Caso      : ${test.title}`,
      `Archivo   : ${test.location.file}`,
      `Estado    : ${status.toUpperCase()}`,
      `Duración  : ${result.duration}ms`,
      `Reintentos: ${result.retry}`,
      ``,
    ];

    if (result.error) {
      lines.push('--- ERROR ---');
      lines.push(result.error.message || '');
      if (result.error.stack) {
        lines.push('--- STACK ---');
        lines.push(result.error.stack);
      }
    }

    if (result.attachments && result.attachments.length) {
      lines.push('--- ADJUNTOS ---');
      result.attachments.forEach(a => {
        lines.push(`  [${a.contentType}] ${a.name}: ${a.path || a.body}`);
      });
    }

    lines.push('');
    const filename = `${ts}_${name}.log`;
    fs.writeFileSync(path.join(dir, filename), lines.join('\n'), 'utf8');
  }

  onEnd(result) {
    console.log(`\n[AutoLog Logger] Suite finalizada: ${result.status}`);
    console.log(`  Logs de errores  → ${DIR_ERR}`);
    console.log(`  Logs de éxitos   → ${DIR_OK}\n`);
  }
}

module.exports = AutoLogReporter;
