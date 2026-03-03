import React, { useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, Dog, Cat, Loader2 } from 'lucide-react';
import { cn } from '../lib/utils';

const UploadZone = ({ onFileSelected, isProcessing }) => {
    const onDrop = useCallback((acceptedFiles) => {
        if (acceptedFiles?.length > 0) {
            onFileSelected(acceptedFiles[0]);
        }
    }, [onFileSelected]);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        accept: { 'image/*': [] },
        multiple: false,
        disabled: isProcessing
    });

    return (
        <div className="flex flex-col h-full gap-4">
            <motion.div
                {...getRootProps()}
                whileHover={{ scale: 1.01, borderColor: '#f97316' }}
                whileTap={{ scale: 0.99 }}
                className={cn(
                    "flex-1 rounded-2xl border-2 border-dashed transition-all duration-300 cursor-pointer relative overflow-hidden group",
                    isDragActive
                        ? "border-accent-primary bg-accent-primary/10 shadow-[0_0_30px_rgba(249,115,22,0.15)]"
                        : "border-white/10 bg-white/5 hover:bg-white/10"
                )}
            >
                <input {...getInputProps()} />

                {/* Animated Background Mesh */}
                <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-accent-primary/10 via-transparent to-transparent pointer-events-none" />

                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10">
                    <AnimatePresence mode="wait">
                        {isProcessing ? (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.8 }}
                                animate={{ opacity: 1, scale: 1 }}
                                exit={{ opacity: 0, scale: 0.8 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <Loader2 className="w-12 h-12 text-accent-primary animate-spin" />
                                <p className="text-sm font-medium text-text-secondary animate-pulse">Processing Image...</p>
                            </motion.div>
                        ) : (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="flex flex-col items-center gap-4"
                            >
                                <div className={cn(
                                    "w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl",
                                    isDragActive ? "bg-accent-primary text-white scale-110" : "bg-white/10 text-accent-primary group-hover:scale-110 group-hover:bg-accent-primary group-hover:text-white"
                                )}>
                                    <UploadCloud className="w-8 h-8" />
                                </div>

                                <div>
                                    <h3 className="text-lg font-semibold text-white group-hover:text-accent-primary transition-colors">
                                        {isDragActive ? "Drop it here!" : "Upload an Image"}
                                    </h3>
                                    <p className="text-sm text-text-muted mt-1 max-w-[200px] leading-relaxed">
                                        Drag and drop or click to browse files
                                    </p>
                                </div>

                                <div className="mt-2 px-3 py-1 rounded-full bg-black/30 border border-white/5 text-[10px] uppercase tracking-widest text-text-muted font-bold">
                                    JPG • PNG • GIF
                                </div>
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
                <QuickButton
                    icon={Dog}
                    label="Try Dog"
                    onClick={(e) => { e.stopPropagation(); onFileSelected('dog'); }}
                    disabled={isProcessing}
                />
                <QuickButton
                    icon={Cat}
                    label="Try Cat"
                    onClick={(e) => { e.stopPropagation(); onFileSelected('cat'); }}
                    disabled={isProcessing}
                />
            </div>
        </div>
    );
};

const QuickButton = ({ icon: Icon, label, onClick, disabled }) => (
    <motion.button
        whileHover={{ y: -2, backgroundColor: 'rgba(255,255,255,0.15)' }}
        whileTap={{ y: 0 }}
        onClick={onClick}
        disabled={disabled}
        className="flex items-center justify-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10 text-sm font-medium text-text-secondary transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:text-white hover:border-accent-primary/30"
    >
        <Icon className="w-4 h-4 text-accent-primary" />
        {label}
    </motion.button>
);

export default UploadZone;
