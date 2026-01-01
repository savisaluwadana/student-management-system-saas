'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, X, FileText } from 'lucide-react';

interface FileUploadProps {
    accept?: string;
    onFileSelect: (file: File) => void;
    onClear?: () => void;
    selectedFile?: File | null;
    maxSizeMB?: number;
}

export function FileUpload({
    accept = '.csv',
    onFileSelect,
    onClear,
    selectedFile,
    maxSizeMB = 5,
}: FileUploadProps) {
    const [dragActive, setDragActive] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const handleFile = (file: File) => {
        setError(null);

        // Check file size
        const maxSize = maxSizeMB * 1024 * 1024;
        if (file.size > maxSize) {
            setError(`File size must be less than ${maxSizeMB}MB`);
            return;
        }

        // Check file type
        if (accept && !file.name.toLowerCase().endsWith(accept.replace('*', ''))) {
            setError(`Please upload a ${accept} file`);
            return;
        }

        onFileSelect(file);
    };

    const handleDrag = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            handleFile(e.dataTransfer.files[0]);
        }
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        e.preventDefault();
        if (e.target.files && e.target.files[0]) {
            handleFile(e.target.files[0]);
        }
    };

    const handleClear = () => {
        setError(null);
        if (inputRef.current) {
            inputRef.current.value = '';
        }
        onClear?.();
    };

    return (
        <div className="w-full">
            {!selectedFile ? (
                <div
                    onDragEnter={handleDrag}
                    onDragLeave={handleDrag}
                    onDragOver={handleDrag}
                    onDrop={handleDrop}
                    className={`
            relative border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive ? 'border-primary bg-primary/5' : 'border-muted-foreground/25'}
            ${error ? 'border-red-500 bg-red-50 dark:bg-red-950/10' : ''}
          `}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept={accept}
                        onChange={handleChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
                    <p className="text-sm font-medium">
                        Drag and drop your file here, or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                        {accept} files up to {maxSizeMB}MB
                    </p>
                </div>
            ) : (
                <div className="border rounded-lg p-4 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <FileText className="h-8 w-8 text-muted-foreground" />
                        <div>
                            <p className="font-medium">{selectedFile.name}</p>
                            <p className="text-sm text-muted-foreground">
                                {(selectedFile.size / 1024).toFixed(1)} KB
                            </p>
                        </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={handleClear}>
                        <X className="h-4 w-4" />
                    </Button>
                </div>
            )}

            {error && (
                <p className="text-sm text-red-500 mt-2">{error}</p>
            )}
        </div>
    );
}
