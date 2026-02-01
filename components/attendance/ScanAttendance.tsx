'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { markAttendanceByBarcode } from '@/lib/actions/attendance';
import { Institute } from '@/lib/actions/institutes';
import {
    ScanBarcode,
    CheckCircle2,
    XCircle,
    Volume2,
    VolumeX,
    Eye,
    EyeOff,
    Keyboard,
    Camera,
    User,
    Smartphone,
    RefreshCw
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ScanAttendanceProps {
    classes: Array<{ id: string; class_name: string; class_code: string }>;
    institutes: Institute[];
}

interface ScanResult {
    id: string;
    barcode: string;
    studentName: string;
    success: boolean;
    message: string;
    timestamp: Date;
}

type ScanMode = 'keyboard' | 'camera';

export function ScanAttendance({ classes, institutes }: ScanAttendanceProps) {
    const [selectedClass, setSelectedClass] = useState<string>('');
    const [selectedInstitute, setSelectedInstitute] = useState<string>('');
    const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [barcodeInput, setBarcodeInput] = useState('');
    const [scanResults, setScanResults] = useState<ScanResult[]>([]);
    const [isProcessing, setIsProcessing] = useState(false);
    const [soundEnabled, setSoundEnabled] = useState(true);
    const [visualFeedback, setVisualFeedback] = useState(true);
    const [lastStatus, setLastStatus] = useState<'success' | 'error' | null>(null);
    const [scanMode, setScanMode] = useState<ScanMode>('keyboard');
    const [isCameraActive, setIsCameraActive] = useState(false);
    const [cameraError, setCameraError] = useState<string | null>(null);

    const inputRef = useRef<HTMLInputElement>(null);
    const scannerRef = useRef<any>(null);
    const cameraViewRef = useRef<HTMLDivElement>(null);
    const successSound = useRef<HTMLAudioElement | null>(null);
    const errorSound = useRef<HTMLAudioElement | null>(null);

    // Initialize audio
    useEffect(() => {
        if (typeof window !== 'undefined') {
            successSound.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2teleOj1');
            errorSound.current = new Audio('data:audio/wav;base64,UklGRl9vAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YTtvAACAgICAgICA');
        }
    }, []);

    // Focus input on mount for keyboard mode
    useEffect(() => {
        if (scanMode === 'keyboard') {
            inputRef.current?.focus();
        }
    }, [scanMode]);

    // Cleanup camera on unmount
    useEffect(() => {
        return () => {
            stopCamera();
        };
    }, []);

    const playSound = useCallback((type: 'success' | 'error') => {
        if (!soundEnabled) return;
        try {
            if (type === 'success') {
                successSound.current?.play().catch(() => { });
            } else {
                errorSound.current?.play().catch(() => { });
            }
        } catch (e) {
            // Ignore audio errors
        }
    }, [soundEnabled]);

    const handleScan = useCallback(async (barcode: string) => {
        if (!selectedClass || !barcode.trim() || isProcessing) return;

        setIsProcessing(true);
        setBarcodeInput('');

        try {
            const result = await markAttendanceByBarcode(selectedClass, date, barcode.trim());

            const scanResult: ScanResult = {
                id: Date.now().toString(),
                barcode: barcode.trim(),
                studentName: result.studentName || 'Unknown',
                success: result.success,
                message: result.message || (result.success ? 'Attendance marked' : 'Failed'),
                timestamp: new Date(),
            };

            setScanResults((prev) => [scanResult, ...prev].slice(0, 50));
            setLastStatus(result.success ? 'success' : 'error');
            playSound(result.success ? 'success' : 'error');

            // Clear visual feedback after delay
            setTimeout(() => setLastStatus(null), 1000);
        } catch (error) {
            const scanResult: ScanResult = {
                id: Date.now().toString(),
                barcode: barcode.trim(),
                studentName: 'Unknown',
                success: false,
                message: 'Error processing scan',
                timestamp: new Date(),
            };
            setScanResults((prev) => [scanResult, ...prev].slice(0, 50));
            setLastStatus('error');
            playSound('error');
            setTimeout(() => setLastStatus(null), 1000);
        } finally {
            setIsProcessing(false);
            if (scanMode === 'keyboard') {
                inputRef.current?.focus();
            }
        }
    }, [selectedClass, date, isProcessing, playSound, scanMode]);

    const startCamera = async () => {
        if (!selectedClass) {
            setCameraError('Please select a class first');
            return;
        }

        setCameraError(null);

        try {
            // Dynamic import to avoid SSR issues
            const { Html5Qrcode } = await import('html5-qrcode');

            if (!cameraViewRef.current) return;

            // Create scanner instance
            const scanner = new Html5Qrcode('camera-view');
            scannerRef.current = scanner;

            await scanner.start(
                { facingMode: 'environment' }, // Rear camera
                {
                    fps: 10,
                    qrbox: { width: 250, height: 150 },
                },
                (decodedText) => {
                    // On successful scan
                    handleScan(decodedText);
                },
                () => {
                    // Ignore errors during scanning
                }
            );

            setIsCameraActive(true);
        } catch (err: any) {
            console.error('Camera error:', err);
            setCameraError(err.message || 'Failed to start camera. Please check permissions.');
            setIsCameraActive(false);
        }
    };

    const stopCamera = async () => {
        if (scannerRef.current) {
            try {
                await scannerRef.current.stop();
                scannerRef.current.clear();
            } catch (e) {
                // Ignore cleanup errors
            }
            scannerRef.current = null;
        }
        setIsCameraActive(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter' && barcodeInput.trim()) {
            e.preventDefault();
            handleScan(barcodeInput);
        }
    };

    const toggleScanMode = async (mode: ScanMode) => {
        if (mode === scanMode) return;

        if (mode === 'keyboard') {
            await stopCamera();
        }
        setScanMode(mode);
    };

    const successCount = scanResults.filter((r) => r.success).length;
    const errorCount = scanResults.filter((r) => !r.success).length;

    return (
        <div className="space-y-6">
            {/* Settings */}
            <Card>
                <CardHeader>
                    <CardTitle>Scanner Settings</CardTitle>
                    <CardDescription>Configure class, date, and feedback options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="space-y-2">
                            <Label>Institute (Optional)</Label>
                            <Select
                                value={selectedInstitute || 'all'}
                                onValueChange={(val) => setSelectedInstitute(val === 'all' ? '' : val)}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All institutes" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Institutes</SelectItem>
                                    {institutes.map((inst) => (
                                        <SelectItem key={inst.id} value={inst.id}>
                                            {inst.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Class *</Label>
                            <Select value={selectedClass} onValueChange={setSelectedClass}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select class" />
                                </SelectTrigger>
                                <SelectContent>
                                    {classes.map((cls) => (
                                        <SelectItem key={cls.id} value={cls.id}>
                                            {cls.class_name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div className="space-y-2">
                            <Label>Date</Label>
                            <input
                                type="date"
                                value={date}
                                onChange={(e) => setDate(e.target.value)}
                                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                            />
                        </div>
                    </div>

                    <div className="flex flex-wrap gap-6 pt-2">
                        <div className="flex items-center gap-2">
                            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                            <Label htmlFor="sound" className="text-sm">Sound Feedback</Label>
                            <Switch
                                id="sound"
                                checked={soundEnabled}
                                onCheckedChange={setSoundEnabled}
                            />
                        </div>
                        <div className="flex items-center gap-2">
                            {visualFeedback ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            <Label htmlFor="visual" className="text-sm">Visual Feedback</Label>
                            <Switch
                                id="visual"
                                checked={visualFeedback}
                                onCheckedChange={setVisualFeedback}
                            />
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Scan Mode Toggle */}
            <div className="flex gap-2 justify-center">
                <Button
                    variant={scanMode === 'keyboard' ? 'default' : 'outline'}
                    onClick={() => toggleScanMode('keyboard')}
                    className="gap-2"
                >
                    <Keyboard className="h-4 w-4" />
                    USB Scanner / Keyboard
                </Button>
                <Button
                    variant={scanMode === 'camera' ? 'default' : 'outline'}
                    onClick={() => toggleScanMode('camera')}
                    className="gap-2"
                >
                    <Smartphone className="h-4 w-4" />
                    Mobile Camera
                </Button>
            </div>

            {/* Scanner Input */}
            <Card className={`transition-all duration-300 ${visualFeedback && lastStatus === 'success' ? 'ring-4 ring-green-500/50 bg-green-500/5' :
                visualFeedback && lastStatus === 'error' ? 'ring-4 ring-red-500/50 bg-red-500/5' : ''
                }`}>
                <CardContent className="py-8">
                    {scanMode === 'keyboard' ? (
                        <div className="max-w-xl mx-auto text-center space-y-6">
                            <div className="h-24 w-24 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                                <ScanBarcode className={`h-12 w-12 text-primary ${isProcessing ? 'animate-pulse' : ''}`} />
                            </div>

                            <div>
                                <h3 className="text-xl font-semibold mb-2">USB Scanner / Keyboard Mode</h3>
                                <p className="text-muted-foreground">
                                    Connect a USB barcode scanner or type the barcode manually and press Enter
                                </p>
                            </div>

                            <div className="relative">
                                <Input
                                    ref={inputRef}
                                    type="text"
                                    placeholder="Scan or enter barcode..."
                                    value={barcodeInput}
                                    onChange={(e) => setBarcodeInput(e.target.value)}
                                    onKeyDown={handleKeyDown}
                                    disabled={!selectedClass || isProcessing}
                                    className="text-center text-lg h-14 font-mono"
                                    autoFocus
                                />
                                <Keyboard className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            </div>

                            {!selectedClass && (
                                <p className="text-sm text-yellow-600">Please select a class before scanning</p>
                            )}
                        </div>
                    ) : (
                        <div className="max-w-xl mx-auto text-center space-y-6">
                            <div>
                                <h3 className="text-xl font-semibold mb-2 flex items-center justify-center gap-2">
                                    <Camera className="h-6 w-6" />
                                    Mobile Camera Mode
                                </h3>
                                <p className="text-muted-foreground">
                                    Point your camera at a student's barcode to scan
                                </p>
                            </div>

                            {/* Camera View */}
                            <div
                                id="camera-view"
                                ref={cameraViewRef}
                                className="w-full max-w-md mx-auto aspect-video bg-black rounded-xl overflow-hidden relative"
                            >
                                {!isCameraActive && (
                                    <div className="absolute inset-0 flex flex-col items-center justify-center text-white gap-4">
                                        <Camera className="h-16 w-16 opacity-50" />
                                        <Button
                                            onClick={startCamera}
                                            disabled={!selectedClass}
                                            size="lg"
                                            className="gap-2"
                                        >
                                            <Camera className="h-5 w-5" />
                                            Start Camera
                                        </Button>
                                    </div>
                                )}
                            </div>

                            {cameraError && (
                                <div className="text-red-500 text-sm flex items-center justify-center gap-2">
                                    <XCircle className="h-4 w-4" />
                                    {cameraError}
                                </div>
                            )}

                            {isCameraActive && (
                                <div className="flex gap-2 justify-center">
                                    <Button
                                        variant="outline"
                                        onClick={stopCamera}
                                        className="gap-2"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        Stop Camera
                                    </Button>
                                    <Button
                                        variant="outline"
                                        onClick={async () => {
                                            await stopCamera();
                                            await startCamera();
                                        }}
                                        className="gap-2"
                                    >
                                        <RefreshCw className="h-4 w-4" />
                                        Restart
                                    </Button>
                                </div>
                            )}

                            {!selectedClass && (
                                <p className="text-sm text-yellow-600">Please select a class before scanning</p>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Stats */}
            {scanResults.length > 0 && (
                <div className="grid grid-cols-3 gap-4">
                    <Card>
                        <CardContent className="py-4 text-center">
                            <p className="text-3xl font-bold">{scanResults.length}</p>
                            <p className="text-sm text-muted-foreground">Total Scans</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-4 text-center">
                            <p className="text-3xl font-bold text-green-500">{successCount}</p>
                            <p className="text-sm text-muted-foreground">Successful</p>
                        </CardContent>
                    </Card>
                    <Card>
                        <CardContent className="py-4 text-center">
                            <p className="text-3xl font-bold text-red-500">{errorCount}</p>
                            <p className="text-sm text-muted-foreground">Failed</p>
                        </CardContent>
                    </Card>
                </div>
            )}

            {/* Scan History */}
            {scanResults.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>Scan History</CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y max-h-96 overflow-y-auto">
                            <AnimatePresence>
                                {scanResults.map((result) => {
                                    const timeStr = `${result.timestamp.getUTCHours().toString().padStart(2, '0')}:${result.timestamp.getUTCMinutes().toString().padStart(2, '0')}:${result.timestamp.getUTCSeconds().toString().padStart(2, '0')}`;
                                    return (
                                        <motion.div
                                            key={result.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            className={`flex items-center justify-between p-4 ${result.success ? 'bg-green-500/5' : 'bg-red-500/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div className={`h-10 w-10 rounded-full flex items-center justify-center ${result.success ? 'bg-green-500/20' : 'bg-red-500/20'
                                                    }`}>
                                                    {result.success ? (
                                                        <CheckCircle2 className="h-5 w-5 text-green-500" />
                                                    ) : (
                                                        <XCircle className="h-5 w-5 text-red-500" />
                                                    )}
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <User className="h-4 w-4 text-muted-foreground" />
                                                        <p className="font-medium">{result.studentName}</p>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground font-mono">{result.barcode}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <Badge variant={result.success ? 'default' : 'destructive'}>
                                                    {result.message}
                                                </Badge>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {timeStr}
                                                </p>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
