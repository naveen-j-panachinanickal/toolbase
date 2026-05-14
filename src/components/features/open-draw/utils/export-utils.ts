
import { toPng, toSvg, toBlob } from 'html-to-image';
// jspdf is imported dynamically in exportAsPdf to reduce initial bundle size

// Utility to download a blob as a file
const downloadFile = (href: string, name: string) => {
    const link = document.createElement('a');
    link.download = name;
    link.href = href;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
};

const filterNode = (node: any) => {
    const classList = (node as HTMLElement).classList;
    if (!classList) return true;
    return (
        !classList.contains('react-flow__controls') &&
        !classList.contains('react-flow__minimap') &&
        !classList.contains('react-flow__nodesselection') &&
        !classList.contains('react-flow__selection')
    );
};

const cleanupClone = (documentClone: Document) => {
    // Remove selection classes
    const elements = documentClone.querySelectorAll('.selected');
    elements.forEach((el) => el.classList.remove('selected'));

    // Remove Nodes Selection Box (Group selection)
    const selection = documentClone.querySelectorAll('.react-flow__nodesselection');
    selection.forEach((el) => el.remove());

    const selectionRect = documentClone.querySelectorAll('.react-flow__nodesselection-rect');
    selectionRect.forEach((el) => el.remove());

    // Remove Node Resizer / Handles
    // NodeResizer container
    const resizers = documentClone.querySelectorAll('.react-flow__resizer');
    resizers.forEach((el) => el.remove());

    // Individual resize controls
    const resizeControls = documentClone.querySelectorAll('.react-flow__resize-control');
    resizeControls.forEach((el) => el.remove());

    // Connection handles
    const handles = documentClone.querySelectorAll('.react-flow__handle');
    handles.forEach((el) => el.remove());
};

export const exportAsPng = async (element: HTMLElement, fileName: string = 'diagram', backgroundColor?: string) => {
    try {
        const dataUrl = await toPng(element, {
            cacheBust: true,
            skipFonts: true,
            filter: filterNode,
            backgroundColor, // Use provided color or undefined for transparent/inherited
            onClone: cleanupClone
        } as any);
        downloadFile(dataUrl, `${fileName}.png`);
    } catch (err) {
        console.error('Export PNG failed', err);
    }
};

export const exportAsSvg = async (element: HTMLElement, fileName: string = 'diagram', backgroundColor?: string) => {
    try {
        const dataUrl = await toSvg(element, {
            cacheBust: true,
            skipFonts: true,
            filter: filterNode,
            backgroundColor, // Use provided color or undefined
            onClone: cleanupClone
        } as any);
        downloadFile(dataUrl, `${fileName}.svg`);
    } catch (err) {
        console.error('Export SVG failed', err);
    }
};

export const exportAsPdf = async (element: HTMLElement, fileName: string = 'diagram', backgroundColor?: string) => {
    try {
        // High quality PNG capture first
        const dataUrl = await toPng(element, {
            cacheBust: true,
            skipFonts: true,
            filter: filterNode,
            pixelRatio: 2,
            backgroundColor, // Use provided color or undefined
            onClone: cleanupClone
        } as any);

        const { jsPDF } = await import('jspdf');
        const pdf = new jsPDF({
            orientation: 'landscape',
        });

        const imgProps = pdf.getImageProperties(dataUrl);
        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;

        pdf.addImage(dataUrl, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${fileName}.pdf`);
    } catch (err) {
        console.error('Export PDF failed', err);
    }
};

export const copyAsImage = async (element: HTMLElement) => {
    try {
        const blob = await toBlob(element, {
            skipFonts: true,
            filter: filterNode,
            // Copy usually prefers transparent or white, but let's keep it transparent (undefined) for now
            onClone: cleanupClone
        } as any);
        if (blob) {
            await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
            alert("Copied to clipboard!");
        }
    } catch (err) {
        console.error('Copy Image failed', err);
        alert("Failed to copy image to clipboard.");
    }
};
