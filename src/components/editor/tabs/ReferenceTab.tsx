'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { useCharacterStore } from '@/store/characterStore';
import type { BodyPart } from '@/types/character';

interface AIAnalysis {
  analysis: {
    description: string;
    style: 'robot' | 'humanoid' | 'alien' | 'cyborg';
    aesthetic: string;
  };
  proportions: {
    headSize: number;
    torsoWidth: number;
    torsoHeight: number;
    armLength: number;
    armThickness: number;
    legLength: number;
    legThickness: number;
  };
  colors: {
    head: string;
    torso: string;
    leftArm: string;
    rightArm: string;
    leftLeg: string;
    rightLeg: string;
    emission: string;
    background: string;
  };
  materials: {
    metalness: number;
    roughness: number;
    emissionIntensity: number;
  };
  features: {
    hasGlowingParts: boolean;
    isSymmetrical: boolean;
    hasLargeHead: boolean;
    hasThinLimbs: boolean;
    hasWideBody: boolean;
  };
}

export function ReferenceTab() {
  const { setCharacterStyle, updatePart, setBackgroundColor } = useCharacterStore();
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [isWaiting, setIsWaiting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const pollIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Poll for analysis result
  const startPolling = useCallback(() => {
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
    }

    setIsWaiting(true);

    pollIntervalRef.current = setInterval(async () => {
      try {
        const response = await fetch('/api/reference/result');
        const data = await response.json();

        if (data.status === 'complete' && data.config) {
          setAnalysis(data.config);
          setIsWaiting(false);
          if (pollIntervalRef.current) {
            clearInterval(pollIntervalRef.current);
            pollIntervalRef.current = null;
          }
        }
      } catch (err) {
        console.error('Poll error:', err);
      }
    }, 1000); // Poll every second
  }, []);

  // Cleanup polling on unmount
  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
      }
    };
  }, []);

  const handleFileSelect = useCallback(async (file: File) => {
    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file (PNG, JPEG, etc.)');
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError('Image too large. Maximum size is 10MB.');
      return;
    }

    setError(null);
    setAnalysis(null);
    setUploadStatus('Uploading...');

    // Create preview URL
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);

    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (e) => {
      const base64 = e.target?.result as string;

      try {
        // Clear previous result
        await fetch('/api/reference/result', { method: 'DELETE' });

        // Upload to server
        const response = await fetch('/api/reference/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            image: base64,
            mimeType: file.type,
            filename: file.name,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Upload failed');
        }

        setUploadStatus('Ready for analysis');

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed');
        setUploadStatus(null);
      }
    };
    reader.readAsDataURL(file);
  }, []);

  const requestAnalysis = useCallback(async () => {
    setUploadStatus('Waiting for Claude Code analysis...');
    startPolling();
  }, [startPolling]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFileSelect(file);
  }, [handleFileSelect]);

  const applyToCharacter = useCallback(() => {
    if (!analysis) return;

    const { proportions, colors, materials, features } = analysis;

    // Apply style
    setCharacterStyle(analysis.analysis.style);

    // Apply proportions and colors to each part
    const partConfigs: Record<BodyPart, {
      color: string;
      scale: { x: number; y: number; z: number };
      metalness: number;
      roughness: number;
      emission: string;
      emissionIntensity: number;
    }> = {
      head: {
        color: colors.head,
        scale: { x: proportions.headSize, y: proportions.headSize, z: proportions.headSize },
        metalness: materials.metalness,
        roughness: materials.roughness,
        emission: features.hasGlowingParts ? colors.emission : '#000000',
        emissionIntensity: features.hasGlowingParts ? materials.emissionIntensity : 0,
      },
      torso: {
        color: colors.torso,
        scale: { x: proportions.torsoWidth, y: proportions.torsoHeight, z: proportions.torsoWidth * 0.6 },
        metalness: materials.metalness,
        roughness: materials.roughness,
        emission: '#000000',
        emissionIntensity: 0,
      },
      leftArm: {
        color: colors.leftArm,
        scale: { x: proportions.armThickness, y: proportions.armLength, z: proportions.armThickness },
        metalness: materials.metalness,
        roughness: materials.roughness,
        emission: features.hasGlowingParts ? colors.emission : '#000000',
        emissionIntensity: features.hasGlowingParts ? materials.emissionIntensity * 0.5 : 0,
      },
      rightArm: {
        color: colors.rightArm,
        scale: { x: proportions.armThickness, y: proportions.armLength, z: proportions.armThickness },
        metalness: materials.metalness,
        roughness: materials.roughness,
        emission: features.hasGlowingParts ? colors.emission : '#000000',
        emissionIntensity: features.hasGlowingParts ? materials.emissionIntensity * 0.5 : 0,
      },
      leftLeg: {
        color: colors.leftLeg,
        scale: { x: proportions.legThickness, y: proportions.legLength, z: proportions.legThickness },
        metalness: materials.metalness,
        roughness: materials.roughness,
        emission: '#000000',
        emissionIntensity: 0,
      },
      rightLeg: {
        color: colors.rightLeg,
        scale: { x: proportions.legThickness, y: proportions.legLength, z: proportions.legThickness },
        metalness: materials.metalness,
        roughness: materials.roughness,
        emission: '#000000',
        emissionIntensity: 0,
      },
    };

    // Apply all part configurations
    Object.entries(partConfigs).forEach(([part, config]) => {
      updatePart(part as BodyPart, config);
    });

    // Apply background
    setBackgroundColor(colors.background);
  }, [analysis, setCharacterStyle, updatePart, setBackgroundColor]);

  const clearReference = useCallback(() => {
    setPreviewUrl(null);
    setAnalysis(null);
    setError(null);
    setUploadStatus(null);
    setIsWaiting(false);
    if (pollIntervalRef.current) {
      clearInterval(pollIntervalRef.current);
      pollIntervalRef.current = null;
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  }, []);

  return (
    <div className="space-y-6">
      {/* Upload Area */}
      <section>
        <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
          Reference Image
        </h3>

        {!previewUrl ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            className="border-2 border-dashed border-surface-border hover:border-accent-primary transition-colors p-8 text-center cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
            <div className="space-y-3">
              <div className="text-4xl text-text-muted">+</div>
              <p className="text-sm text-text-secondary">
                Drop an image here or click to upload
              </p>
              <p className="text-xs text-text-muted">
                PNG, JPEG, WebP (max 10MB)
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Preview */}
            <div className="relative aspect-square bg-bg-tertiary border border-surface-border overflow-hidden">
              <img
                src={previewUrl}
                alt="Reference"
                className="w-full h-full object-contain"
              />
              <button
                onClick={clearReference}
                className="absolute top-2 right-2 w-6 h-6 bg-bg-primary/80 border border-surface-border text-text-muted hover:text-text-primary hover:border-accent-primary flex items-center justify-center"
              >
                ×
              </button>
            </div>

            {/* Status */}
            {uploadStatus && !analysis && (
              <div className="p-2 border border-surface-border bg-bg-tertiary text-center">
                <p className="text-xs font-mono text-text-secondary">{uploadStatus}</p>
              </div>
            )}

            {/* Request Analysis Button */}
            {!analysis && !isWaiting && uploadStatus === 'Ready for analysis' && (
              <button
                onClick={requestAnalysis}
                className="btn btn-primary w-full"
              >
                Request Claude Code Analysis
              </button>
            )}

            {/* Change Image */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn w-full text-xs"
            >
              Change Image
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleInputChange}
              className="hidden"
            />
          </div>
        )}
      </section>

      {/* Error Message */}
      {error && (
        <div className="p-3 border border-red-500 bg-red-500/10 text-red-400 text-xs font-mono">
          {error}
        </div>
      )}

      {/* Waiting State */}
      {isWaiting && (
        <div className="p-4 border border-accent-secondary bg-accent-secondary/5 text-center">
          <div className="inline-block w-6 h-6 border-2 border-surface-border border-t-accent-secondary animate-spin mb-2" />
          <p className="text-xs text-accent-secondary font-mono">Waiting for Claude Code...</p>
          <p className="text-[10px] text-text-muted mt-1">
            Tell Claude: "analyze the reference image"
          </p>
        </div>
      )}

      {/* Analysis Results */}
      {analysis && !isWaiting && (
        <>
          {/* Description */}
          <section>
            <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
              AI Analysis
            </h3>
            <div className="p-3 border border-surface-border bg-bg-tertiary">
              <p className="text-xs text-text-secondary leading-relaxed">
                {analysis.analysis.description}
              </p>
            </div>
          </section>

          {/* Detected Style & Features */}
          <section>
            <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
              Detected Style
            </h3>
            <div className="grid grid-cols-2 gap-2">
              <div className="p-2 border border-surface-border">
                <span className="text-[10px] text-text-muted block">Style</span>
                <span className="text-xs text-accent-primary capitalize">{analysis.analysis.style}</span>
              </div>
              <div className="p-2 border border-surface-border">
                <span className="text-[10px] text-text-muted block">Aesthetic</span>
                <span className="text-xs text-text-secondary capitalize">{analysis.analysis.aesthetic}</span>
              </div>
            </div>
          </section>

          {/* Proportions */}
          <section>
            <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
              Detected Proportions
            </h3>
            <div className="space-y-1 text-xs font-mono">
              {Object.entries(analysis.proportions).map(([key, value]) => (
                <div key={key} className="flex justify-between items-center">
                  <span className="text-text-muted">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-1 bg-surface-border">
                      <div
                        className="h-full bg-accent-primary"
                        style={{ width: `${Math.min(100, (value / 2) * 100)}%` }}
                      />
                    </div>
                    <span className="text-text-secondary w-8 text-right">{value.toFixed(1)}</span>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Colors */}
          <section>
            <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
              Detected Colors
            </h3>
            <div className="grid grid-cols-4 gap-1">
              {Object.entries(analysis.colors).map(([key, color]) => (
                <div key={key} className="text-center">
                  <div
                    className="w-full aspect-square border border-surface-border mb-1"
                    style={{ backgroundColor: color }}
                  />
                  <span className="text-[8px] text-text-muted capitalize">{key}</span>
                </div>
              ))}
            </div>
          </section>

          {/* Features */}
          {analysis.features && (
            <section>
              <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
                Features
              </h3>
              <div className="flex flex-wrap gap-1">
                {Object.entries(analysis.features)
                  .filter(([, value]) => value)
                  .map(([key]) => (
                    <span
                      key={key}
                      className="px-2 py-1 text-[10px] font-mono bg-accent-primary/10 text-accent-primary border border-accent-primary/30"
                    >
                      {key.replace(/([A-Z])/g, ' $1').replace('has ', '').trim()}
                    </span>
                  ))}
              </div>
            </section>
          )}

          {/* Apply Button */}
          <button
            onClick={applyToCharacter}
            className="btn btn-primary w-full text-sm py-3"
          >
            Apply to Character
          </button>

          {/* Re-analyze */}
          <button
            onClick={requestAnalysis}
            className="btn w-full text-xs"
          >
            Request Re-analysis
          </button>
        </>
      )}

      {/* Instructions */}
      {!previewUrl && (
        <section className="pt-4 border-t border-surface-border">
          <h3 className="text-xs font-mono text-text-muted uppercase tracking-wider mb-3">
            How It Works
          </h3>
          <ul className="text-xs text-text-muted space-y-2">
            <li>1. Upload a character reference image</li>
            <li>2. Click "Request Claude Code Analysis"</li>
            <li>3. Tell Claude Code: <code className="text-accent-primary">"analyze the reference image"</code></li>
            <li>4. Claude analyzes & sends back the config</li>
            <li>5. Click "Apply to Character"</li>
          </ul>
        </section>
      )}
    </div>
  );
}
