import type { Metadata } from 'next';

export const metadata: Metadata = {
    title: 'Bgremover    | OBN Toolkit',
    description: 'Securely merge, split, compress, and manage PDF documents with browser-based tools.',
};

export default function BgremoverLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return children;
}
