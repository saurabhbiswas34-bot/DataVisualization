export function formatAddress(addr: string, chars = 6): string {
  if (!addr || addr.length <= chars * 2 + 2) return addr;
  return `${addr.slice(0, chars + 2)}...${addr.slice(-chars)}`;
}

export function isValidIotaAddress(addr: string): boolean {
  return /^0x[a-fA-F0-9]{64}$/.test(addr);
}
