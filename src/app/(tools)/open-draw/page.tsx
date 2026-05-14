'use client';

import { OpenDrawLayout } from '@/components/features/open-draw/layouts/MainLayout';
import { ReturnToToolsButton } from "@/components/ui/ReturnToToolsButton";

function OpenDrawView() {
    return (
        <div className="relative w-full h-full">
            <div className="absolute top-4 right-4 z-50">
                <ReturnToToolsButton />
            </div>
            <OpenDrawLayout />
        </div>
    );
}

export default function OpenDrawPage() {
    return (
        <div className="w-screen h-screen overflow-hidden">
            <OpenDrawView />
        </div>
    );
}
