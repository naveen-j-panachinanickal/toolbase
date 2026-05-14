"use client";

import React, { useState, useRef, useMemo, useEffect } from 'react';
import { useTIPTool } from '@/hooks/useTIPTool';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Label } from '@/components/ui/Label';
import { Select } from '@/components/ui/Select';
import { Slider } from '@/components/ui/Slider';
import { Card } from '@/components/ui/Card';
import { Download, Copy, Link2, ScanLine, Image as ImageIcon, QrCode } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function QrForgeFeature() {
  const [activeMode, setActiveMode] = useState<'url2qr' | 'qr2url' | 'img2qr' | 'qr2img'>('url2qr');

  // Generators
  const genTool = useTIPTool('qr-forge/generate');
  const decTool = useTIPTool('qr-forge/decode');

  // Configs
  const genDefaultConfig = useMemo(
    () => Object.fromEntries((genTool.tool?.configSchema.fields ?? []).map(f => [f.key, f.default])),
    [genTool.tool]
  );
  
  const [genConfig, setGenConfig] = useState<Record<string, any>>({});
  const seededRef = useRef(false);

  useEffect(() => {
    if (!seededRef.current && Object.keys(genDefaultConfig).length > 0) {
      setGenConfig(genDefaultConfig);
      seededRef.current = true;
    }
  }, [genDefaultConfig]);

  const updateGenConfig = (key: string, value: any) => {
    setGenConfig(prev => ({ ...prev, [key]: value }));
  };

  // State
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [qrFile, setQrFile] = useState<File | null>(null);
  const [genResult, setGenResult] = useState<string | null>(null); // Object URL of the generated PNG
  const [decResult, setDecResult] = useState<{ text?: string, objectUrl?: string } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const qrFileInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    if (!genConfig.text) return;
    try {
      const payloadFiles = logoFile 
        ? [logoFile] 
        : [new File([new Blob([''])], 'dummy.txt', { type: 'text/plain' })];
      
      const results = await genTool.execute(payloadFiles, genConfig);
      if (results && results.length > 0) {
        setGenResult(URL.createObjectURL(results[0]));
      }
    } catch (err: any) {
      alert('Error generating QR code: ' + err.message);
    }
  };

  const handleDecode = async (fileToDecode: File) => {
    try {
      setDecResult(null);
      const results = await decTool.execute([fileToDecode], {});
      if (results && results.length > 0) {
        const text = await results[0].text();
        setDecResult({ text, objectUrl: URL.createObjectURL(fileToDecode) });
      }
    } catch (err: any) {
      alert('Error decoding QR code: ' + err.message);
    }
  };

  const onLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setLogoFile(e.target.files[0]);
    }
  };

  const onQrUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setQrFile(e.target.files[0]);
      handleDecode(e.target.files[0]);
    }
  };

  const downloadResult = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
  };

  const copyText = (text: string) => {
    navigator.clipboard.writeText(text);
    alert('Copied to clipboard');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8 p-4">
      {/* Modes Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { id: 'url2qr', icon: Link2, label: 'URL → QR', desc: 'encode url as qr code' },
          { id: 'img2qr', icon: ImageIcon, label: 'Image → QR', desc: 'embed logo in qr code' },
          { id: 'qr2url', icon: ScanLine, label: 'QR → URL', desc: 'scan qr · extract url' },
          { id: 'qr2img', icon: QrCode, label: 'QR → Image', desc: 'scan qr · save as image' },
        ].map(m => (
          <Card
            key={m.id}
            className={cn(
              "p-4 cursor-pointer transition-all border-2 border-transparent hover:border-primary/50",
              activeMode === m.id && "border-primary bg-primary/5"
            )}
            onClick={() => {
              setActiveMode(m.id as any);
              setGenResult(null);
              setDecResult(null);
            }}
          >
            <m.icon className="w-6 h-6 mb-2 text-primary" />
            <div className="font-semibold">{m.label}</div>
            <div className="text-xs text-muted-foreground">{m.desc}</div>
          </Card>
        ))}
      </div>

      <Card className="p-6">
        {(activeMode === 'url2qr' || activeMode === 'img2qr') && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <div className="space-y-2">
              <Label>Content (URL or Text)</Label>
              <div className="flex gap-2">
                <Input
                  value={genConfig.text || ''}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateGenConfig('text', e.target.value)}
                  placeholder="https://example.com"
                  onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleGenerate()}
                />
                <Button onClick={handleGenerate} disabled={genTool.isProcessing}>
                  Generate
                </Button>
              </div>
            </div>

            {activeMode === 'img2qr' && (
              <div className="space-y-4">
                <Label>Logo Overlay</Label>
                <div 
                  className="border-2 border-dashed rounded-lg p-8 text-center cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={onLogoUpload} />
                  {logoFile ? (
                    <div className="text-sm">Selected: {logoFile.name}</div>
                  ) : (
                    <div className="text-sm text-muted-foreground">Click to select logo image</div>
                  )}
                </div>
                {logoFile && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <Label>Logo Size</Label>
                      <span>{genConfig.logoSize}%</span>
                    </div>
                    <Slider
                      value={genConfig.logoSize || 22}
                      min={10} max={40} step={1}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateGenConfig('logoSize', parseInt(e.target.value))}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-4 border-t">
              <div className="space-y-2">
                <Label>Size (px)</Label>
                <Input
                  type="number"
                  value={genConfig.size || 220}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateGenConfig('size', parseInt(e.target.value))}
                />
              </div>
              <div className="space-y-2">
                <Label>Error Correction</Label>
                <Select value={genConfig.errorCorrection || 'Q'} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => updateGenConfig('errorCorrection', e.target.value)}>
                  <option value="L">Low (L)</option>
                  <option value="M">Medium (M)</option>
                  <option value="Q">High (Q)</option>
                  <option value="H">Max (H)</option>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Dot Color</Label>
                <div className="flex h-10">
                  <Input type="color" value={genConfig.darkColor || '#000000'} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateGenConfig('darkColor', e.target.value)} className="p-1 h-10" />
                </div>
              </div>
              <div className="space-y-2">
                <Label>Background</Label>
                <div className="flex h-10">
                  <Input type="color" value={genConfig.lightColor || '#ffffff'} onChange={(e: React.ChangeEvent<HTMLInputElement>) => updateGenConfig('lightColor', e.target.value)} className="p-1 h-10" />
                </div>
              </div>
            </div>

            {genResult && (
              <div className="flex flex-col items-center gap-4 pt-6 border-t animate-in fade-in">
                <div className="p-4 bg-white rounded-lg border shadow-sm">
                  <img src={genResult} alt="Generated QR" className="max-w-[300px] w-full h-auto" />
                </div>
                <div className="flex gap-2">
                  <Button onClick={() => downloadResult(genResult, 'qr-code.png')} className="gap-2">
                    <Download className="w-4 h-4" /> Download PNG
                  </Button>
                  <Button variant="outline" onClick={() => copyText(genConfig.text)} className="gap-2">
                    <Copy className="w-4 h-4" /> Copy URL
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {(activeMode === 'qr2url' || activeMode === 'qr2img') && (
          <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4">
            <Label>Upload QR Code Image</Label>
            <div 
              className="border-2 border-dashed rounded-lg p-12 text-center cursor-pointer hover:bg-muted/50 transition-colors"
              onClick={() => qrFileInputRef.current?.click()}
            >
              <input type="file" ref={qrFileInputRef} className="hidden" accept="image/*" onChange={onQrUpload} />
              <ScanLine className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
              <div className="text-sm font-medium">Click to browse or drag and drop</div>
              <div className="text-xs text-muted-foreground mt-1">PNG, JPG, WEBP</div>
            </div>

            {decTool.isProcessing && <div className="text-center text-sm text-muted-foreground animate-pulse">Scanning...</div>}

            {decResult && (
              <div className="space-y-4 pt-6 border-t animate-in fade-in">
                <div className="bg-muted p-4 rounded-lg">
                  <Label className="text-xs uppercase tracking-wider text-muted-foreground mb-2 block">Decoded Content</Label>
                  <div className="font-mono text-sm break-all">{decResult.text}</div>
                </div>

                {activeMode === 'qr2img' && decResult.objectUrl && (
                  <div className="flex flex-col items-center gap-4">
                    <div className="p-4 bg-white rounded-lg border shadow-sm">
                      <img src={decResult.objectUrl} alt="Decoded QR" className="max-w-[300px] w-full h-auto" />
                    </div>
                  </div>
                )}

                <div className="flex justify-center gap-2">
                  <Button variant="outline" onClick={() => copyText(decResult.text || '')} className="gap-2">
                    <Copy className="w-4 h-4" /> Copy Text
                  </Button>
                  {activeMode === 'qr2url' && decResult.text?.startsWith('http') && (
                    <Button onClick={() => window.open(decResult.text, '_blank')} className="gap-2">
                      <Link2 className="w-4 h-4" /> Open Link
                    </Button>
                  )}
                  {activeMode === 'qr2img' && decResult.objectUrl && (
                    <Button onClick={() => downloadResult(decResult.objectUrl!, 'decoded-qr.png')} className="gap-2">
                      <Download className="w-4 h-4" /> Download Original
                    </Button>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
}
