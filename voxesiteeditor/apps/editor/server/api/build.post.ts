import { exec } from 'child_process'

export default defineEventHandler(async () => {
  return new Promise((resolve, reject) => {
    exec(
      'pnpm --filter runtime generate',
      { cwd: process.cwd() + '/..' }, // root workspace
      (error, stdout, stderr) => {
        if (error) {
          reject(stderr)
          return
        }

        resolve({ ok: true, output: stdout })
      }
    )
  })
})
