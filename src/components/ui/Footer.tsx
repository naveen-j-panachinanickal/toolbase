import React from 'react';
import FooterLink from './FooterLink';

const Footer: React.FC = () => {
    return (
        <footer className="py-8 px-6 md:px-20 lg:px-40">
            <div className="max-w-[700px] mx-auto text-center space-y-4">
                {/* Legal Line */}
                <div>
                    <p
                        className="text-[11px]"
                        style={{ color: 'var(--text-faint)' }}
                    >
                        © 2026 Open Build Network. All rights reserved.
                    </p>
                </div>

            </div>
        </footer>
    );
};

export default Footer;
