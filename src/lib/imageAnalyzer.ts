/**
 * Image Analyzer - Extracts colors and suggests character style from uploaded images
 */

export interface ImageAnalysis {
  dominantColors: string[];
  brightness: 'dark' | 'medium' | 'light';
  suggestedStyle: 'robot' | 'humanoid' | 'alien' | 'cyborg';
  colorPalette: {
    primary: string;
    secondary: string;
    accent: string;
    dark: string;
    light: string;
  };
}

/**
 * Extract dominant colors from an image using canvas
 */
export async function analyzeImage(file: File): Promise<ImageAnalysis> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');

    if (!ctx) {
      reject(new Error('Could not get canvas context'));
      return;
    }

    img.onload = () => {
      // Scale down for faster processing
      const maxSize = 100;
      const scale = Math.min(maxSize / img.width, maxSize / img.height);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;

      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const pixels = imageData.data;

      // Extract colors
      const colorMap = new Map<string, number>();
      let totalBrightness = 0;
      let pixelCount = 0;

      for (let i = 0; i < pixels.length; i += 4) {
        const r = pixels[i];
        const g = pixels[i + 1];
        const b = pixels[i + 2];
        const a = pixels[i + 3];

        if (a < 128) continue; // Skip transparent pixels

        // Quantize colors to reduce palette
        const qr = Math.round(r / 32) * 32;
        const qg = Math.round(g / 32) * 32;
        const qb = Math.round(b / 32) * 32;

        const hex = rgbToHex(qr, qg, qb);
        colorMap.set(hex, (colorMap.get(hex) || 0) + 1);

        // Calculate brightness
        const brightness = (r * 299 + g * 587 + b * 114) / 1000;
        totalBrightness += brightness;
        pixelCount++;
      }

      // Sort colors by frequency
      const sortedColors = Array.from(colorMap.entries())
        .sort((a, b) => b[1] - a[1])
        .map(([color]) => color);

      // Get top colors
      const dominantColors = sortedColors.slice(0, 10);

      // Calculate average brightness
      const avgBrightness = totalBrightness / pixelCount;
      const brightness: ImageAnalysis['brightness'] =
        avgBrightness < 85 ? 'dark' : avgBrightness < 170 ? 'medium' : 'light';

      // Analyze color characteristics to suggest style
      const suggestedStyle = suggestStyle(dominantColors, brightness);

      // Build color palette
      const colorPalette = buildColorPalette(dominantColors, brightness);

      resolve({
        dominantColors,
        brightness,
        suggestedStyle,
        colorPalette,
      });
    };

    img.onerror = () => reject(new Error('Failed to load image'));

    // Load image from file
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function rgbToHex(r: number, g: number, b: number): string {
  return '#' + [r, g, b].map((x) => Math.min(255, x).toString(16).padStart(2, '0')).join('');
}

function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : { r: 0, g: 0, b: 0 };
}

function getColorSaturation(hex: string): number {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;

  if (max === min) return 0;

  const d = max - min;
  return l > 0.5 ? d / (510 - max - min) : d / (max + min);
}

function isNeonColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const max = Math.max(r, g, b);
  const saturation = getColorSaturation(hex);
  return max > 200 && saturation > 0.5;
}

function isMetallicColor(hex: string): boolean {
  const { r, g, b } = hexToRgb(hex);
  const diff = Math.max(Math.abs(r - g), Math.abs(g - b), Math.abs(r - b));
  return diff < 30 && r > 100 && r < 220;
}

function suggestStyle(colors: string[], brightness: ImageAnalysis['brightness']): ImageAnalysis['suggestedStyle'] {
  const hasNeon = colors.some(isNeonColor);
  const hasMetallic = colors.filter(isMetallicColor).length > 2;
  const hasHighSaturation = colors.filter((c) => getColorSaturation(c) > 0.6).length > 3;

  // Neon colors suggest cyborg
  if (hasNeon && brightness === 'dark') return 'cyborg';

  // Metallic grays suggest robot
  if (hasMetallic && !hasHighSaturation) return 'robot';

  // High saturation unusual colors suggest alien
  if (hasHighSaturation && colors.some((c) => {
    const { r, g, b } = hexToRgb(c);
    return (g > r && g > b) || (b > r && b > g); // Greens or blues dominant
  })) return 'alien';

  // Default to humanoid
  return 'humanoid';
}

function buildColorPalette(colors: string[], brightness: ImageAnalysis['brightness']): ImageAnalysis['colorPalette'] {
  // Sort by brightness
  const sortedByBrightness = [...colors].sort((a, b) => {
    const aRgb = hexToRgb(a);
    const bRgb = hexToRgb(b);
    const aBright = (aRgb.r + aRgb.g + aRgb.b) / 3;
    const bBright = (bRgb.r + bRgb.g + bRgb.b) / 3;
    return bBright - aBright;
  });

  // Sort by saturation for accent
  const sortedBySaturation = [...colors].sort((a, b) =>
    getColorSaturation(b) - getColorSaturation(a)
  );

  return {
    primary: colors[0] || '#00C49A',
    secondary: colors[1] || '#1a1a25',
    accent: sortedBySaturation[0] || '#00ffff',
    dark: sortedByBrightness[sortedByBrightness.length - 1] || '#0a0a0f',
    light: sortedByBrightness[0] || '#ffffff',
  };
}

/**
 * Generate character config from image analysis
 */
export function generateCharacterFromAnalysis(
  analysis: ImageAnalysis,
  characterId: string
): {
  style: ImageAnalysis['suggestedStyle'];
  parts: Record<string, { color: string; metalness: number; roughness: number; emission: string; emissionIntensity: number }>;
  environment: { backgroundColor: string };
} {
  const { colorPalette, suggestedStyle, brightness } = analysis;

  // Determine material properties based on style
  const materialProps = {
    robot: { metalness: 0.9, roughness: 0.1 },
    humanoid: { metalness: 0.3, roughness: 0.7 },
    alien: { metalness: 0.5, roughness: 0.4 },
    cyborg: { metalness: 0.7, roughness: 0.2 },
  };

  const { metalness, roughness } = materialProps[suggestedStyle];

  // Should parts glow?
  const shouldGlow = suggestedStyle === 'cyborg' || suggestedStyle === 'alien';

  return {
    style: suggestedStyle,
    parts: {
      head: {
        color: colorPalette.primary,
        metalness,
        roughness,
        emission: shouldGlow ? colorPalette.accent : '#000000',
        emissionIntensity: shouldGlow ? 0.5 : 0,
      },
      torso: {
        color: colorPalette.secondary,
        metalness,
        roughness,
        emission: '#000000',
        emissionIntensity: 0,
      },
      leftArm: {
        color: colorPalette.primary,
        metalness,
        roughness,
        emission: shouldGlow ? colorPalette.accent : '#000000',
        emissionIntensity: shouldGlow ? 0.3 : 0,
      },
      rightArm: {
        color: colorPalette.primary,
        metalness,
        roughness,
        emission: shouldGlow ? colorPalette.accent : '#000000',
        emissionIntensity: shouldGlow ? 0.3 : 0,
      },
      leftLeg: {
        color: colorPalette.secondary,
        metalness,
        roughness,
        emission: '#000000',
        emissionIntensity: 0,
      },
      rightLeg: {
        color: colorPalette.secondary,
        metalness,
        roughness,
        emission: '#000000',
        emissionIntensity: 0,
      },
    },
    environment: {
      backgroundColor: brightness === 'dark' ? colorPalette.dark : '#0a0a0f',
    },
  };
}
