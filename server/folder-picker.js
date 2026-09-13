import { execFile } from 'node:child_process';

let choosing = false;
export async function chooseStorageFolder() {
  if (process.platform !== 'win32') throw new Error('O seletor de pastas requer Windows. Informe o caminho manualmente.');
  if (choosing) throw new Error('Já existe uma janela de seleção de pasta aberta.');
  choosing = true;
  try {
    return await new Promise((resolve, reject) => {
      // No user-provided strings are interpolated into PowerShell.
      const script = `Add-Type -AssemblyName System.Windows.Forms; $dialog = New-Object System.Windows.Forms.FolderBrowserDialog; $dialog.Description = 'Escolha a pasta dos dados do Mini Preço'; $owner = New-Object System.Windows.Forms.Form; $owner.TopMost = $true; try { if ($dialog.ShowDialog($owner) -eq [System.Windows.Forms.DialogResult]::OK) { [Console]::Out.Write([Convert]::ToBase64String([Text.Encoding]::UTF8.GetBytes($dialog.SelectedPath))) } } finally { $dialog.Dispose(); $owner.Dispose() }`;
      execFile('powershell.exe', ['-NoProfile', '-STA', '-Command', script], { windowsHide: true, timeout: 120000 }, (error, stdout) => {
        if (error) reject(new Error('Não foi possível selecionar a pasta. Tente novamente ou digite o caminho.'));
        else resolve(stdout.trim() ? Buffer.from(stdout.trim(), 'base64').toString('utf8') : null);
      });
    });
  } finally { choosing = false; }
}
