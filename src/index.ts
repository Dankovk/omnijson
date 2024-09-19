
import { parseUserInput } from './system-wrapper';
import { spawnSync } from 'child_process';
import * as path from 'path';

const platform = process.platform;
const arch = process.arch;

let binaryName;

if (platform === 'darwin') {
  binaryName = `omnijson-darwin-${arch}`;
} else if (platform === 'linux') {
  binaryName = `omnijson-linux-${arch}`;
} else if (platform === 'win32') {
  binaryName = 'omnijson-windows-x64.exe';
} else {
  console.error('Unsupported platform');
  process.exit(1);
}

const binaryPath = path.join(process.cwd(), binaryName);



const config = parseUserInput();
try { 
    
    const exec = spawnSync(binaryPath, [config.dirPath, config.jsonPath, config.mode], { stdio: 'inherit' });
    if (exec.status !== 0) {
        console.error(exec.stderr);
        process.exit(exec.status);

    }
    console.log('Transform completed successfully');
    process.exit(0);
} catch (error) {
    console.error(error);
    process.exit(1);
}