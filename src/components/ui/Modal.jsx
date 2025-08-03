"use client";
import React, { useEffect, useState } from 'react';
import ReactDOM from 'react-dom';
import { XCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export const Modal = ({ title, children, onClose }) => {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleKeyDown);
        return () => document.removeEventListener('keydown', handleKeyDown);
    }, [onClose]);

    if (!isClient) {
        return null;
    }

    return ReactDOM.createPortal(
        <AnimatePresence>
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: -20, opacity: 0 }}
                    animate={{ scale: 1, y: 0, opacity: 1 }}
                    exit={{ scale: 0.95, y: 20, opacity: 0 }}
                    transition={{ type: 'spring', stiffness: 260, damping: 30 }}
                    // ZDE JE KLÍČOVÁ ZMĚNA VZHLEDU
                    className="glass-card bg-slate-900/50 p-1 rounded-2xl shadow-2xl w-full max-w-7xl max-h-[90vh] flex flex-col relative"
                    style={{
                        border: '1px solid',
                        borderImageSlice: 1,
                        borderImageSource: 'linear-gradient(to bottom right, rgba(255, 255, 255, 0.2), rgba(255, 255, 255, 0.05))'
                    }}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="bg-slate-900/80 rounded-xl w-full h-full flex flex-col">
                        <div className="flex-shrink-0 flex justify-between items-center p-4 border-b border-slate-700/50">
                            <h2 className="text-xl font-bold text-sky-300">{title}</h2>
                            <button
                                onClick={onClose}
                                className="text-slate-400 hover:text-white transition-colors"
                                title="Zavřít (Esc)"
                            >
                                <XCircle className="w-6 h-6" />
                            </button>
                        </div>
                        <div className="flex-grow overflow-y-auto p-4 sm:p-6 scrollbar-thin">
                            {children}
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.getElementById('modal-root')
    );
};