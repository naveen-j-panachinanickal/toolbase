'use client';

import React, { useState } from 'react';
import { m, AnimatePresence } from 'framer-motion';
import { FileUploader } from '@/components/ui/FileUploader';
import { Button } from '@/components/ui/Button';
import {
    Download,
    RefreshCw,
    Lock,
    Eye,
    EyeOff,
    CheckCircle,
    Shield,
    AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { cn } from '@/lib/utils';
import { useTIPTool } from '@/hooks/useTIPTool';

export default function ProtectPdf() {
    const [file, setFile] = useState<File | null>(null);
    const [userPassword, setUserPassword] = useState('');
    const [ownerPassword, setOwnerPassword] = useState('');
    const [useOwnerPassword, setUseOwnerPassword] = useState(false);
    const [showUserPassword, setShowUserPassword] = useState(false);
    const [showOwnerPassword, setShowOwnerPassword] = useState(false);
    const [isProtecting, setIsProtecting] = useState(false);
    const [protectedPdfUrl, setProtectedPdfUrl] = useState<string | null>(null);

    // Permissions
    const [allowPrinting, setAllowPrinting] = useState(true);
    const [allowModifying, setAllowModifying] = useState(false);
    const [allowCopying, setAllowCopying] = useState(false);
    const [allowAnnotating, setAllowAnnotating] = useState(true);
    const [allowFillingForms, setAllowFillingForms] = useState(true);

    const { execute, isProcessing, error, progress, progressMessage, tool } = useTIPTool('magic-pdf/protect');

    const handleFileSelected = (files: File[]) => {
        if (files.length > 0) {
            setFile(files[0]);
            setProtectedPdfUrl(null);
            setUserPassword('');
            setOwnerPassword('');
        }
    };

    const handleProtect = async () => {
        if (!file || !userPassword) {
            alert('Please select a file and enter a password');
            return;
        }

        setIsProtecting(true);

        try {
            // Use Python worker for encryption through TIP
            const outputFiles = await execute([file], {
                password: userPassword,
                owner_password: useOwnerPassword && ownerPassword ? ownerPassword : userPassword,
                permissions: JSON.stringify({
                    printing: allowPrinting,
                    modifying: allowModifying,
                    copying: allowCopying,
                    annotating: allowAnnotating,
                    fillingForms: allowFillingForms,
                    accessibility: true
                })
            });

            if (outputFiles && outputFiles.length > 0) {
                const url = URL.createObjectURL(outputFiles[0]);
                setProtectedPdfUrl(url);
            }
        } catch (error) {
            console.error('Error protecting PDF:', error);
            alert('Failed to protect PDF: ' + (error as Error).message);
        } finally {
            setIsProtecting(false);
        }
    };

    const passwordStrength = (password: string) => {
        if (!password) return { strength: 0, label: '', color: '' };

        let strength = 0;
        if (password.length >= 8) strength++;
        if (password.length >= 12) strength++;
        if (/[a-z]/.test(password) && /[A-Z]/.test(password)) strength++;
        if (/\d/.test(password)) strength++;
        if (/[^a-zA-Z0-9]/.test(password)) strength++;

        if (strength <= 1) return { strength, label: 'Weak', color: 'text-red-600' };
        if (strength <= 3) return { strength, label: 'Medium', color: 'text-yellow-600' };
        return { strength, label: 'Strong', color: 'text-green-500' };
    };

    const userStrength = passwordStrength(userPassword);

    return (
        <div className="w-full max-w-4xl mx-auto space-y-8">
            <AnimatePresence mode="wait">
                {!file ? (
                    <m.div
                        key="upload"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                    >
                        <Card className="p-8">
                            <div className="text-center mb-8">
                                <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
                                    <Shield className="w-8 h-8 text-primary" />
                                </div>
                                <h2 className="text-2xl font-semibold mb-2">Protect PDF</h2>
                                <p className="text-text-muted">Encrypt your PDF with a password to prevent unauthorized access.</p>
                            </div>
                            <FileUploader
                                onFilesSelected={handleFileSelected}
                                accept=".pdf"
                                multiple={false}
                                className="max-w-2xl mx-auto"
                            />
                        </Card>
                    </m.div>
                ) : (
                    <m.div
                        key="workspace"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="space-y-6"
                    >
                        {/* Header */}
                        <Card className="p-6">
                            <div className="flex items-center justify-between flex-wrap gap-4">
                                <div className="flex items-center gap-4">
                                    <div className="h-12 w-12 bg-primary/5 text-primary rounded-xl flex items-center justify-center">
                                        <Lock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-text-primary">{file.name}</h3>
                                        <p className="text-sm text-text-muted">Configure password protection</p>
                                    </div>
                                </div>
                                {!protectedPdfUrl && (
                                    <Button variant="ghost" onClick={() => setFile(null)}>
                                        Change File
                                    </Button>
                                )}
                            </div>
                        </Card>

                        {/* Result Section */}
                        {protectedPdfUrl && (
                            <m.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="p-8 bg-green-500/5/50 border-green-100">
                                    <div className="flex flex-col items-center text-center">
                                        <div className="h-16 w-16 bg-green-500/10 text-green-500 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircle className="w-8 h-8" />
                                        </div>
                                        <h3 className="text-2xl font-bold text-text-primary mb-2">PDF Protected!</h3>
                                        <p className="text-text-muted mb-6">Your PDF has been encrypted with a password.</p>

                                        <div className="flex gap-4">
                                            <Button
                                                variant="outline"
                                                onClick={() => {
                                                    setFile(null);
                                                    setProtectedPdfUrl(null);
                                                    setUserPassword('');
                                                    setOwnerPassword('');
                                                }}
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Protect Another
                                            </Button>
                                            <a href={protectedPdfUrl} download={`protected_${file.name}`}>
                                                <Button>
                                                    <Download className="w-4 h-4 mr-2" />
                                                    Download Protected PDF
                                                </Button>
                                            </a>
                                        </div>
                                    </div>
                                </Card>
                            </m.div>
                        )}

                        {/* Password Configuration */}
                        {!protectedPdfUrl && (
                            <Card className="p-6">
                                <h4 className="font-semibold text-text-primary mb-4">Password Settings</h4>

                                {/* User Password */}
                                <div className="space-y-4 mb-6">
                                    <div>
                                        <label className="block text-sm font-medium text-text-secondary mb-2">
                                            User Password (Required)
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showUserPassword ? 'text' : 'password'}
                                                value={userPassword}
                                                onChange={(e) => setUserPassword(e.target.value)}
                                                placeholder="Enter password to open the PDF"
                                                className="w-full px-4 py-2 pr-10 border border-border-medium rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowUserPassword(!showUserPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted"
                                            >
                                                {showUserPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                        {userPassword && (
                                            <div className="mt-2 flex items-center gap-2">
                                                <div className="flex-1 h-1 bg-border-medium rounded-full overflow-hidden">
                                                    <div
                                                        className={cn(
                                                            "h-full transition-all duration-300",
                                                            userStrength.strength <= 1 && "bg-red-500 w-1/3",
                                                            userStrength.strength > 1 && userStrength.strength <= 3 && "bg-yellow-500 w-2/3",
                                                            userStrength.strength > 3 && "bg-green-500 w-full"
                                                        )}
                                                    />
                                                </div>
                                                <span className={cn("text-xs font-medium", userStrength.color)}>
                                                    {userStrength.label}
                                                </span>
                                            </div>
                                        )}
                                        <p className="text-xs text-text-muted mt-1">
                                            This password will be required to open the PDF
                                        </p>
                                    </div>

                                    {/* Owner Password Toggle */}
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="useOwnerPassword"
                                            checked={useOwnerPassword}
                                            onChange={(e) => setUseOwnerPassword(e.target.checked)}
                                            className="w-4 h-4 text-primary border-border-medium rounded focus:ring-primary"
                                        />
                                        <label htmlFor="useOwnerPassword" className="text-sm text-text-secondary">
                                            Set separate owner password (advanced)
                                        </label>
                                    </div>

                                    {/* Owner Password */}
                                    {useOwnerPassword && (
                                        <m.div
                                            initial={{ opacity: 0, height: 0 }}
                                            animate={{ opacity: 1, height: 'auto' }}
                                            exit={{ opacity: 0, height: 0 }}
                                        >
                                            <label className="block text-sm font-medium text-text-secondary mb-2">
                                                Owner Password
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type={showOwnerPassword ? 'text' : 'password'}
                                                    value={ownerPassword}
                                                    onChange={(e) => setOwnerPassword(e.target.value)}
                                                    placeholder="Enter owner password"
                                                    className="w-full px-4 py-2 pr-10 border border-border-medium rounded-lg focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowOwnerPassword(!showOwnerPassword)}
                                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-text-faint hover:text-text-muted"
                                                >
                                                    {showOwnerPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                </button>
                                            </div>
                                            <p className="text-xs text-text-muted mt-1">
                                                Owner password allows changing permissions
                                            </p>
                                        </m.div>
                                    )}
                                </div>

                                {/* Permissions */}
                                <div className="border-t pt-6">
                                    <h5 className="font-medium text-text-primary mb-3">Document Permissions</h5>
                                    <p className="text-sm text-text-muted mb-4">Control what users can do with the PDF</p>

                                    <div className="space-y-3">
                                        <PermissionCheckbox
                                            id="allowPrinting"
                                            label="Allow Printing"
                                            description="Users can print the document"
                                            checked={allowPrinting}
                                            onChange={setAllowPrinting}
                                        />
                                        <PermissionCheckbox
                                            id="allowModifying"
                                            label="Allow Modifying"
                                            description="Users can edit the document content"
                                            checked={allowModifying}
                                            onChange={setAllowModifying}
                                        />
                                        <PermissionCheckbox
                                            id="allowCopying"
                                            label="Allow Copying"
                                            description="Users can copy text and images"
                                            checked={allowCopying}
                                            onChange={setAllowCopying}
                                        />
                                        <PermissionCheckbox
                                            id="allowAnnotating"
                                            label="Allow Annotating"
                                            description="Users can add comments and annotations"
                                            checked={allowAnnotating}
                                            onChange={setAllowAnnotating}
                                        />
                                        <PermissionCheckbox
                                            id="allowFillingForms"
                                            label="Allow Filling Forms"
                                            description="Users can fill in form fields"
                                            checked={allowFillingForms}
                                            onChange={setAllowFillingForms}
                                        />
                                    </div>
                                </div>

                                {/* Action Button */}
                                <div className="mt-8 flex flex-col items-center">
                                    <Button
                                        size="lg"
                                        onClick={handleProtect}
                                        disabled={isProtecting || isProcessing || !userPassword}
                                        isLoading={isProtecting || isProcessing}
                                        className="w-full max-w-xs"
                                    >
                                        <Lock className="w-4 h-4 mr-2" />
                                        {(isProtecting || isProcessing) ? progressMessage || 'Protecting...' : 'Protect PDF'}
                                    </Button>

                                    {!userPassword && (
                                        <div className="mt-3 flex items-center gap-2 text-sm text-amber-600">
                                            <AlertCircle className="w-4 h-4" />
                                            <span>Please enter a password</span>
                                        </div>
                                    )}
                                </div>
                            </Card>
                        )}
                    </m.div>
                )}
            </AnimatePresence>
        </div>
    );
}

interface PermissionCheckboxProps {
    id: string;
    label: string;
    description: string;
    checked: boolean;
    onChange: (checked: boolean) => void;
}

const PermissionCheckbox = ({ id, label, description, checked, onChange }: PermissionCheckboxProps) => {
    return (
        <div className="flex items-start gap-3 p-3 rounded-lg hover:bg-surface-secondary transition-colors">
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="mt-0.5 w-4 h-4 text-primary border-border-medium rounded focus:ring-primary"
            />
            <div className="flex-1">
                <label htmlFor={id} className="text-sm font-medium text-text-primary cursor-pointer">
                    {label}
                </label>
                <p className="text-xs text-text-muted mt-0.5">{description}</p>
            </div>
        </div>
    );
};
