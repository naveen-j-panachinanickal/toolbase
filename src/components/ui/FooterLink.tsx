import React from 'react';
import Image from 'next/image';

interface FooterLinkProps {
    href: string;
    iconUrl: string;
    children: React.ReactNode;
}

const FooterLink: React.FC<FooterLinkProps> = ({ href, iconUrl, children }) => {
    return (
        <a className="flex items-center gap-2" href={href}>
            <Image className='w-6 h-6' src={iconUrl} alt="" width={24} height={24} />
            {children}
        </a>
    );
};

export default FooterLink;
