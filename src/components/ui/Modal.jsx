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
                className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
                onClick={onClose}
            >
                <motion.div
                    initial={{ scale: 0.95, y: -30 }}
                    animate={{ scale: 1, y: 0 }}
                    exit={{ scale: 0.95, y: 30 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    className="bg-slate-800 rounded-xl shadow-2xl p-6 relative w-full max-w-7xl max-h-[90vh] flex flex-col border border-slate-700"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex-shrink-0 flex justify-between items-center mb-4">
                        <h2 className="text-2xl font-bold text-blue-400 text-center flex-grow">{title}</h2>
                        <button
                            onClick={onClose}
                            className="absolute top-3 right-3 text-slate-400 hover:text-white transition-colors"
                            title="Close"
                        >
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>
                    <div className="flex-grow overflow-y-auto pr-2">
                        {children}
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>,
        document.getElementById('modal-root')
    );
};