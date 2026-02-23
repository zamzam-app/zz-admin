/**
 * Renders an SVG element (e.g. from react-qr-code) to PNG and triggers a download.
 */
export function downloadQrFromSvg(elementId: string, filename: string): void {
  const svg = document.getElementById(elementId);
  if (!svg) return;

  const svgData = new XMLSerializer().serializeToString(svg);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  const img = new Image();

  img.onload = () => {
    canvas.width = img.width;
    canvas.height = img.height;
    if (ctx) {
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL('image/png');
      const downloadLink = document.createElement('a');
      downloadLink.download = filename;
      downloadLink.href = pngFile;
      downloadLink.click();
    }
  };

  img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
}
