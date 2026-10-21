"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { FaTimes } from "react-icons/fa";
import { Button } from "@/components/ui/Button";

interface ExpandableModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
}

export function ExpandableModal({ isOpen, onClose, children }: ExpandableModalProps) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setMounted(true);
        }, 0);

        if (isOpen) {
            document.body.style.overflow = "hidden";
        }

        return () => {
            window.clearTimeout(timer);
            document.body.style.overflow = "unset";
        };
    }, [isOpen]);

    if (!mounted || !isOpen) return null;

    // Render directly to body to ensure it's on top of everything
    return createPortal(
        <div
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 md:p-8 animate-in fade-in duration-200"
            onClick={onClose}
        >
            <div className="absolute top-4 right-4 z-[101]">
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={onClose}
                    className="rounded-full h-10 w-10 p-0 flex items-center justify-center bg-black/50 hover:bg-black text-white border-white/20"
                >
                    <FaTimes size={18} />
                </Button>
            </div>

            <div
                className="relative max-w-full max-h-full w-auto h-auto overflow-auto flex items-center justify-center rounded-lg shadow-2xl"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>,
        document.body
    );
}
