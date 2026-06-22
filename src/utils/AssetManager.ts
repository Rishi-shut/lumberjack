/**
 * AssetManager resolves asset paths either from a configured CDN (e.g. ImageKit.io)
 * or falls back to the local public directory.
 */

let isCdnActive = true;

export function setCdnActive(active: boolean) {
  isCdnActive = active;
}

export function getCdnActive(): boolean {
  return isCdnActive;
}

export function getAssetUrl(fileName: string): string {
  const cdnUrl = import.meta.env.VITE_IMAGEKIT_URL;
  if (isCdnActive && cdnUrl && cdnUrl.trim() !== '') {
    // Ensure no trailing/leading slashes mismatch
    const cleanCdn = cdnUrl.replace(/\/+$/, '');
    const cleanFile = fileName.replace(/^\/+/, '');
    return `${cleanCdn}/${cleanFile}`;
  }
  // Fallback to local /images/ directory under public
  const cleanFile = fileName.replace(/^\/+/, '');
  return `/images/${cleanFile}`;
}

export function getLocalFallbackUrl(url: string): string {
  if (!url) return '';
  if (url.startsWith('http') && (url.includes('imagekit.io') || url.includes('ik.imagekit.io'))) {
    try {
      const parsed = new URL(url);
      const parts = parsed.pathname.split('/');
      const fileName = parts[parts.length - 1];
      if (fileName) {
        return `/images/${fileName}`;
      }
    } catch (e) {
      const parts = url.split('/');
      const fileName = parts[parts.length - 1];
      if (fileName) {
        return `/images/${fileName}`;
      }
    }
  }
  return url;
}

export function checkCdnReachability(timeoutMs: number = 1000): Promise<boolean> {
  const cdnUrl = import.meta.env.VITE_IMAGEKIT_URL;
  if (!cdnUrl || cdnUrl.trim() === '') {
    isCdnActive = false;
    return Promise.resolve(false);
  }

  const cleanCdn = cdnUrl.replace(/\/+$/, '');
  const testUrl = `${cleanCdn}/weap_axe_wood.svg`;

  return new Promise((resolve) => {
    let resolved = false;

    const timer = setTimeout(() => {
      if (!resolved) {
        resolved = true;
        console.warn(`CDN reachability check timed out after ${timeoutMs}ms. Disabling CDN.`);
        isCdnActive = false;
        resolve(false);
      }
    }, timeoutMs);

    fetch(testUrl, { method: 'GET' })
      .then((res) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          if (res.ok) {
            console.log("CDN reachability check passed. CDN enabled.");
            isCdnActive = true;
            resolve(true);
          } else {
            console.warn(`CDN returned non-ok status: ${res.status}. Disabling CDN.`);
            isCdnActive = false;
            resolve(false);
          }
        }
      })
      .catch((err) => {
        if (!resolved) {
          resolved = true;
          clearTimeout(timer);
          console.warn("CDN is unreachable. Disabling CDN.", err);
          isCdnActive = false;
          resolve(false);
        }
      });
  });
}
