import cp, { SpawnOptions } from 'child_process';

export const exec = (command: string, args: string[], opts?: SpawnOptions) =>
  new Promise<void>((resolve, reject) => {
    const proc = cp.spawn(command, args, { stdio: 'inherit', ...opts });
    proc.on('close', code =>
      code !== 0 ? reject(new Error(`'${command}' failed with code: ${code}`)) : resolve(),
    );
  });
