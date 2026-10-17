export function isValidExternalImageUrl(value) {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 2048) return false;

  try {
    const url = new URL(value.trim());
    return url.protocol === 'https:' &&
      !url.username && !url.password &&
      url.hostname.includes('.') &&
      !['localhost', '127.0.0.1', '0.0.0.0'].includes(url.hostname.toLowerCase());
  } catch {
    return false;
  }
}
