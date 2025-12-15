export function calculateChecksum(input: string): string {
  let hash = 0x12345678;

  for (let i = 0; i < input.length; i++) {
    hash += input.charCodeAt(i) * (i + 1);
  }

  return (hash & 0xffffffff).toString(16);
}
