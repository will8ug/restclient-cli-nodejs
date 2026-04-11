const KNOWN_FLAGS = new Set(['--insecure', '-k']);

export function parseArgs(argv: string[]): { filePath: string | undefined; insecure: boolean } {
  const args = argv.slice(2);
  const insecure = args.some((arg) => KNOWN_FLAGS.has(arg));
  const positionalArgs = args.filter((arg) => !KNOWN_FLAGS.has(arg));

  return { filePath: positionalArgs[0], insecure };
}
