/**
 * Utility for fast client-side dominant color palette extraction from an image URL.
 * Uses an offscreen HTML5 canvas with downsampling for sub-5ms processing.
 */

// Convert RGB components to Hex string
export const rgbToHex = (r, g, b) => {
  const toHex = (c) => c.toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
};

// Calculate perceived luminance (0 to 1)
export const getLuminance = (r, g, b) => {
  return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
};

// Calculate color distance (Euclidean in RGB space)
const colorDistance = (c1, c2) => {
  const dr = c1.r - c2.r;
  const dg = c1.g - c2.g;
  const db = c1.b - c2.b;
  return Math.sqrt(dr * dr + dg * dg + db * db);
};

/**
 * Extracts top dominant colors from an image URL.
 * @param {string} imageUrl - The image source URL.
 * @param {number} maxColors - Number of distinct colors to return (default: 5).
 * @returns {Promise<Array<{hex: string, rgb: [number, number, number], isDark: boolean}>>}
 */
export const extractPaletteFromImage = (imageUrl, maxColors = 5) => {
  return new Promise((resolve) => {
    if (!imageUrl) {
      resolve([]);
      return;
    }

    const img = new Image();
    img.crossOrigin = 'anonymous';

    const handleSuccess = () => {
      try {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        if (!ctx) {
          resolve([]);
          return;
        }

        // Downsample to 64x64 for instant analysis without memory overhead
        const SAMPLE_SIZE = 64;
        canvas.width = SAMPLE_SIZE;
        canvas.height = SAMPLE_SIZE;
        ctx.drawImage(img, 0, 0, SAMPLE_SIZE, SAMPLE_SIZE);

        const imgData = ctx.getImageData(0, 0, SAMPLE_SIZE, SAMPLE_SIZE).data;
        const colorBuckets = [];

        // Sample every 4th pixel to avoid processing 4096 pixels
        for (let i = 0; i < imgData.length; i += 16) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          // Skip transparent or near-transparent pixels
          if (a < 128) continue;

          // Skip extreme whites or extreme pitch blacks if possible, unless whole image is monochrome
          const lum = getLuminance(r, g, b);
          if (lum < 0.05 || lum > 0.96) continue;

          colorBuckets.push({ r, g, b, count: 1 });
        }

        if (colorBuckets.length === 0) {
          // Fallback if image was all pure black or pure white
          for (let i = 0; i < imgData.length; i += 16) {
            colorBuckets.push({ r: imgData[i], g: imgData[i + 1], b: imgData[i + 2], count: 1 });
          }
        }

        // Cluster similar colors using minimum distance threshold
        const DISTANCE_THRESHOLD = 45;
        const clustered = [];

        for (const pixel of colorBuckets) {
          let merged = false;
          for (const cluster of clustered) {
            if (colorDistance(pixel, cluster) < DISTANCE_THRESHOLD) {
              cluster.r = Math.round((cluster.r * cluster.count + pixel.r) / (cluster.count + 1));
              cluster.g = Math.round((cluster.g * cluster.count + pixel.g) / (cluster.count + 1));
              cluster.b = Math.round((cluster.b * cluster.count + pixel.b) / (cluster.count + 1));
              cluster.count += 1;
              merged = true;
              break;
            }
          }
          if (!merged) {
            clustered.push(pixel);
          }
        }

        // Sort by popularity (frequency in the artwork)
        clustered.sort((a, b) => b.count - a.count);

        // Take top distinct colors
        const palette = clustered.slice(0, maxColors).map((c) => {
          const hex = rgbToHex(c.r, c.g, c.b);
          const lum = getLuminance(c.r, c.g, c.b);
          return {
            hex,
            rgb: [c.r, c.g, c.b],
            isDark: lum < 0.5,
          };
        });

        resolve(palette);
      } catch (err) {
        console.warn('Canvas color extraction failed (likely CORS restriction):', err);
        resolve([]);
      }
    };

    img.onload = handleSuccess;
    img.onerror = () => {
      // CORS or network error fallback
      resolve([]);
    };

    img.src = imageUrl;
  });
};
