import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Dog, Cat, ChevronRight } from 'lucide-react';
import { cn } from '../lib/utils';

const HistoryList = ({ history, onSelect }) => {
    return (
        <div className="flex flex-col h-full bg-white/5 border border-white/10 rounded-2xl overflow-hidden backdrop-blur-md">
            <div className="p-4 border-b border-white/5 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-text-secondary flex items-center gap-2">
                    <Clock className="w-4 h-4 text-accent-primary" />
                    Recent Analysis
                </h3>
                <span className="text-xs text-text-muted bg-white/5 px-2 py-0.5 rounded-full">{history.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-3 space-y-2 custom-scrollbar">
                <AnimatePresence>
                    {history.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="h-32 flex flex-col items-center justify-center text-text-muted text-sm italic"
                        >
                            No history yet
                        </motion.div>
                    ) : (
                        history.map((item, index) => (
                            <motion.div
                                key={item.id}
                                layout
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ delay: index * 0.05 }}
                                onClick={() => onSelect(item)}
                                className="group p-3 rounded-xl bg-black/20 hover:bg-white/5 border border-transparent hover:border-accent-primary/20 cursor-pointer transition-all active:scale-95 flex items-center gap-3"
                            >
                                <div className="relative w-12 h-12 rounded-lg overflow-hidden border border-white/10 group-hover:border-accent-primary/50 transition-colors">
                                    <img src={item.image} alt="Thumbnail" className="w-full h-full object-cover" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                                </div>

                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center justify-between">
                                        <span className="font-medium text-white text-sm truncate">{item.label}</span>
                                        <span className="text-[10px] text-text-muted bg-white/10 px-1.5 py-0.5 rounded ml-2">
                                            {Math.round(item.confidence * 100)}%
                                        </span>
                                    </div>
                                    <p className="text-xs text-text-muted mt-0.5 truncate">
                                        {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </p>
                                </div>

                                <ChevronRight className="w-4 h-4 text-text-muted group-hover:text-accent-primary transform group-hover:translate-x-1 transition-all" />
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default HistoryList;
