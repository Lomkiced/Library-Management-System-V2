import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '../../lib/utils';

export default function GlassCard({ children, className, hoverEffect = true, delay = 0, ...props }) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: delay, ease: "easeOut" }}
            className={cn(
                "relative overflow-hidden rounded-2xl border border-white/20 bg-white/70 dark:bg-slate-900/60 backdrop-blur-xl shadow-xl",
                hoverEffect && "transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl hover:bg-white/90 dark:hover:bg-slate-800/80",
                className
            )}
            {...props}
        >
            {children}
            {/* Glossy Reflection Effect */}
            <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-white/20 to-transparent pointer-events-none opacity-50" />
        </motion.div>
    );
}
