/** Load any image source and return a downscaled JPEG data URL (keeps uploads and storage small). */
export function toDataUrl(src, max = 1280, quality = 0.88) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
      const c = document.createElement('canvas');
      c.width = Math.round(img.naturalWidth * scale);
      c.height = Math.round(img.naturalHeight * scale);
      const ctx = c.getContext('2d');
      ctx.fillStyle = '#fff';
      ctx.fillRect(0, 0, c.width, c.height);
      ctx.drawImage(img, 0, 0, c.width, c.height);
      try { resolve(c.toDataURL('image/jpeg', quality)); } catch (e) { reject(new Error('This image host blocks access from other sites. Download it and upload the file instead.')); }
    };
    img.onerror = () => reject(new Error('That image couldn’t be loaded. Check the link, or download it and upload the file.'));
    img.src = src;
  });
}

export const fileToDataUrl = (file, max, quality) => new Promise((resolve, reject) => {
  const url = URL.createObjectURL(file);
  toDataUrl(url, max, quality).then((d) => { URL.revokeObjectURL(url); resolve(d); }).catch((e) => { URL.revokeObjectURL(url); reject(e); });
});

export const formatBytes = (n = 0) => (n > 1048576 ? `${(n / 1048576).toFixed(1)} MB` : `${Math.max(1, Math.round(n / 1024))} KB`);
