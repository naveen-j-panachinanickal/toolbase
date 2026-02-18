
import * as React from "react"
import { Popover } from "./Popover"
import { cn } from "@/lib/utils"
import { Palette, Check, Pipette, Hash, Copy } from "lucide-react"

interface ColorPickerProps {
    value?: string
    onChange: (value: string) => void
    className?: string
    allowTransparent?: boolean
}

const PRESET_COLORS = [
    '#ffffff', '#f8fafc', '#f1f5f9', '#e2e8f0', '#cbd5e1', // Slate
    '#000000', '#1e293b', '#334155', '#475569', '#64748b', // Dark Slate
    '#ef4444', '#f87171', '#fca5a5', '#fecaca', '#fee2e2', // Red
    '#f97316', '#fb923c', '#fdba74', '#fed7aa', '#ffedd5', // Orange
    '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a', '#fef3c7', // Amber
    '#eab308', '#facc15', '#fde047', '#fef08a', '#fef9c3', // Yellow
    '#84cc16', '#a3e635', '#bef264', '#d9f99d', '#ecfccb', // Lime
    '#22c55e', '#4ade80', '#86efac', '#bbf7d0', '#dcfce7', // Green
    '#10b981', '#34d399', '#6ee7b7', '#a7f3d0', '#d1fae5', // Emerald
    '#06b6d4', '#22d3ee', '#67e8f9', '#a5f3fc', '#cffafe', // Cyan
    '#0ea5e9', '#38bdf8', '#7dd3fc', '#bae6fd', '#e0f2fe', // Sky
    '#3b82f6', '#60a5fa', '#93c5fd', '#bfdbfe', '#dbeafe', // Blue
    '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe', '#e0e7ff', // Indigo
    '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe', '#ede9fe', // Violet
    '#a855f7', '#c084fc', '#d8b4fe', '#e9d5ff', '#f3e8ff', // Purple
    '#d946ef', '#e879f9', '#f0abfc', '#f5d0fe', '#fae8ff', // Fuchsia
    '#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8', '#fce7f3', // Pink
    '#f43f5e', '#fb7185', '#fda4af', '#fecdd3', '#ffe4e6', // Rose
];

export function ColorPicker({ value = '#000000', onChange, className, allowTransparent }: ColorPickerProps) {
    const [inputValue, setInputValue] = React.useState(value);
    const [isHovering, setIsHovering] = React.useState(false);

    React.useEffect(() => {
        setInputValue(value);
    }, [value]);

    const handleConfirm = () => {
        if (/^#[0-9A-Fa-f]{6}$/.test(inputValue) || inputValue === 'transparent') {
            onChange(inputValue);
        }
    };

    const handleEyeDropper = async () => {
        if (!('EyeDropper' in window)) {
            alert("Your browser does not support the EyeDropper API");
            return;
        }
        // @ts-ignore
        const eyeDropper = new window.EyeDropper();
        try {
            const result = await eyeDropper.open();
            onChange(result.sRGBHex);
            setInputValue(result.sRGBHex);
        } catch (e) {
            console.log(e);
        }
    };

    const copyToClipboard = () => {
        navigator.clipboard.writeText(value === 'transparent' ? 'transparent' : value);
    };

    return (
        <Popover
            trigger={
                <div
                    className={cn(
                        "flex items-center gap-3 cursor-pointer group p-2 rounded-xl border border-gray-200 bg-white hover:border-cyan-400 hover:shadow-lg hover:shadow-cyan-100 transition-all duration-300",
                        className
                    )}
                    onMouseEnter={() => setIsHovering(true)}
                    onMouseLeave={() => setIsHovering(false)}
                >
                    <div className="relative">
                        <div
                            className={cn(
                                "w-10 h-10 rounded-lg shadow-inner ring-1 ring-black/5 transition-transform group-hover:scale-105",
                                value === 'transparent' ? "bg-checkered" : ""
                            )}
                            style={{ backgroundColor: value === 'transparent' ? undefined : value }}
                        />
                        {value === 'transparent' && (
                            <div className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-400 bg-white/50 backdrop-blur-[1px] rounded-lg">
                                TR
                            </div>
                        )}
                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-gray-100 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Palette className="w-3 h-3 text-cyan-500" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0 flex flex-col">
                        <span className="text-[10px] text-gray-400 uppercase font-semibold tracking-wider mb-0.5">Color</span>
                        <div className="flex items-center gap-2">
                            <span className="text-sm font-mono font-bold text-slate-700 uppercase">{value === 'transparent' ? 'None' : value}</span>
                        </div>
                    </div>

                    <div className="w-8 h-8 flex items-center justify-center rounded-lg bg-gray-50 text-gray-400 group-hover:bg-cyan-50 group-hover:text-cyan-600 transition-colors">
                        <Pipette className="w-4 h-4" />
                    </div>
                </div>
            }
            content={
                <div className="space-y-4 min-w-[240px]">
                    {/* Header: Input & Tools */}
                    <div className="flex gap-2 items-center">
                        <div className="relative flex-1 group/input">
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400">
                                <Hash className="w-3.5 h-3.5" />
                            </div>
                            <input
                                type="text"
                                value={inputValue === 'transparent' ? 'transparent' : inputValue.replace('#', '')}
                                onChange={(e) => {
                                    const val = e.target.value;
                                    setInputValue(val === 'transparent' ? val : `#${val.replace('#', '')}`);
                                }}
                                onBlur={handleConfirm}
                                onKeyDown={(e) => e.key === 'Enter' && handleConfirm()}
                                className="w-full pl-8 pr-8 py-2 text-xs font-mono font-medium border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-500/20 focus:border-cyan-500 transition-all uppercase text-slate-700"
                                placeholder="HEX"
                            />
                            {/* Color Dot Indicator inside input */}
                            <div
                                className={cn("absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 rounded-md border border-black/5 shadow-sm", inputValue === 'transparent' ? "bg-checkered" : "")}
                                style={{ backgroundColor: inputValue === 'transparent' ? undefined : (inputValue.startsWith('#') ? inputValue : `#${inputValue}`) }}
                            />
                        </div>
                        <button
                            onClick={handleEyeDropper}
                            className="p-2 bg-gray-50 hover:bg-cyan-50 text-gray-600 hover:text-cyan-600 rounded-xl border border-gray-200 hover:border-cyan-200 transition-all shadow-sm"
                            title="Pick color from screen"
                        >
                            <Pipette className="w-4 h-4" />
                        </button>
                    </div>

                    {/* Presets Grid */}
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Presets</span>
                        </div>
                        <div className="grid grid-cols-6 gap-2 max-h-[200px] overflow-y-auto p-1 custom-scrollbar">
                            {allowTransparent && (
                                <button
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all relative overflow-hidden group bg-checkered",
                                        value === 'transparent' ? "border-cyan-500 ring-2 ring-cyan-500/20 scale-110" : "border-gray-100 hover:border-gray-300 hover:scale-105"
                                    )}
                                    onClick={() => {
                                        onChange('transparent');
                                        setInputValue('transparent');
                                    }}
                                    title="Transparent"
                                >
                                    {value === 'transparent' && <div className="absolute inset-0 bg-cyan-500/20 flex items-center justify-center"><Check className="w-4 h-4 text-cyan-700 drop-shadow-md" /></div>}
                                </button>
                            )}
                            {PRESET_COLORS.map((color) => (
                                <button
                                    key={color}
                                    className={cn(
                                        "w-8 h-8 rounded-full border-2 transition-all relative group",
                                        value === color ? "border-white ring-2 ring-cyan-500 scale-110 shadow-lg" : "border-transparent hover:scale-110 hover:shadow-md"
                                    )}
                                    style={{ backgroundColor: color }}
                                    onClick={() => {
                                        onChange(color);
                                        setInputValue(color);
                                    }}
                                >
                                    {value === color && <Check className={cn("w-4 h-4 absolute inset-0 m-auto drop-shadow-md", ['#ffffff', '#f8fafc', '#f1f5f9'].includes(color) ? "text-slate-900" : "text-white")} />}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Native Picker */}
                    <div className="pt-3 border-t border-gray-100">
                        <label className="flex items-center gap-2 p-2 rounded-xl bg-gray-50 cursor-pointer hover:bg-gray-100 transition-colors group/picker relative overflow-hidden">
                            <div className="w-full h-6 rounded-lg bg-gradient-to-r from-red-500 via-green-500 to-blue-500 opacity-50 group-hover/picker:opacity-100 transition-opacity" />
                            <span className="absolute inset-0 flex items-center justify-center text-[10px] font-bold text-gray-500 uppercase tracking-wider group-hover/picker:text-gray-800 transition-colors">
                                Custom Spectrum
                            </span>
                            <input
                                type="color"
                                value={value === 'transparent' ? '#ffffff' : value}
                                onChange={(e) => {
                                    onChange(e.target.value);
                                    setInputValue(e.target.value);
                                }}
                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                disabled={value === 'transparent'}
                            />
                        </label>
                    </div>

                    <style jsx global>{`
                        .bg-checkered {
                            background-image: linear-gradient(45deg, #f0f0f0 25%, transparent 25%), linear-gradient(-45deg, #f0f0f0 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #f0f0f0 75%), linear-gradient(-45deg, transparent 75%, #f0f0f0 75%);
                            background-size: 8px 8px;
                            background-position: 0 0, 0 4px, 4px -4px, -4px 0px;
                        }
                        .custom-scrollbar::-webkit-scrollbar {
                            width: 4px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-track {
                            background: transparent;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb {
                            background: #e2e8f0;
                            border-radius: 4px;
                        }
                        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                            background: #cbd5e1;
                        }
                    `}</style>
                </div>
            }
        />
    )
}
