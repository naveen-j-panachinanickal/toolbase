import { ToolCardProps } from '@/types/tool-search';
import Link from 'next/link';
import Image from 'next/image';
import React from 'react';

const ToolCard: React.FC<ToolCardProps> = ({ title, toolFolderName, icon }) => {
    return (
        <Link
            href={`/tools/${toolFolderName}`}
            className="tool-card flex flex-col items-center gap-4 cursor-pointer group haptic-click"
        >
            <div className="relative z-10 w-full h-full flex items-center justify-center">
                <Image
                    src={icon}
                    alt={title}
                    width={80}
                    height={80}
                    className="w-20 h-20 rounded-[28px] p-2 object-contain filter drop-shadow-[0_4px_8px_rgba(0,0,0,0.2)] group-hover:scale-110 transition-transform duration-500"
                />
            </div>
            <p className="text-[13px] font-semibold text-center text-[#3a3a3c] group-hover:text-black transition-colors tracking-tight">
                {title}
            </p>
        </Link>
    );
};


export default ToolCard;
