import React from 'react';
import { motion } from 'framer-motion';
import { Zap, Activity } from 'lucide-react';

const Header = () => {
    return (
        <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            transition={{ type: 'spring', stiffness: 100, damping: 20 }}
            className="h-[70px] px-8 flex items-center justify-between border-b border-white/10 bg-black/50 backdrop-blur-xl sticky top-0 z-50 shadow-2xl"
        >
            <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-accent-primary to-accent-tertiary flex items-center justify-center shadow-[0_0_15px_rgba(249,115,22,0.3)]">
                    <Zap className="text-white w-5 h-5 fill-white" />
                </div>
                <h1 className="text-xl font-bold tracking-tight text-white">
                    Image <span className="text-accent-primary">Classifier</span>
                </h1>
            </div>

            <div className="flex items-center gap-3 px-4 py-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 backdrop-blur-sm">
                <div className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
                </div>
                <span className="text-xs font-semibold text-emerald-400 uppercase tracking-wider">Model Online</span>
                <Activity className="w-3.5 h-3.5 text-emerald-400" />
            </div>
        </motion.header>
    );
};

export default Header;
