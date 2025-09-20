import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Document, Page, pdfjs } from "react-pdf";
import "../css/pdfViewer.css";
import { useTokenStore } from "../store";

// Configure PDF.js worker from CDN to ensure compatibility across environments
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

// Use CDN-hosted assets for cMaps, standard fonts, and wasm to avoid manual copying
const options = {
    cMapUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/cmaps/`,
    standardFontDataUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/standard_fonts/`,
    wasmUrl: `https://unpkg.com/pdfjs-dist@${pdfjs.version}/wasm/`,
};

const maxWidth = 800;

function PDFViewer({ docId, file: externalFile }) {
    const [numPages, setNumPages] = useState(null);
    const [containerWidth, setContainerWidth] = useState();

    const onDocumentLoadSuccess = ({ numPages }) => {
        setNumPages(numPages);
    };
    const token = useTokenStore.getState().getToken();
    const hasExternalFile = !!externalFile;

    const { data: pdfData, isLoading, error } = useQuery({
        queryKey: ['pdf', docId],
        queryFn: async () => {
            const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/documents/pdf/${docId}`, {
                headers: {
                    'Authorization': token,
                }
            });
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            return res.blob();
        },
        enabled: !!docId && !!token && !hasExternalFile, // only fetch when both exist
    });

    const documentFile = hasExternalFile ? externalFile : pdfData;

    if (isLoading) return <p>Loading PDF...</p>;
    if (error) return <p>Error loading PDF</p>;


    return (
        <div className="flex flex-col items-center my-2.5 py-2.5 px-2.5 w-full">
            <div className="Example__container__document">
                <Document
                    // file="/docSample.pdf"
                    // file={docId}
                    file={documentFile}
                    onLoadSuccess={onDocumentLoadSuccess}
                    options={options}
                >
                    {Array.from(new Array(numPages), (_el, index) => (
                        <div key={`page_${index + 1}`} className="mb-8">
                            <Page
                                renderTextLayer={false}
                                renderAnnotationLayer={false}
                                pageNumber={index + 1}
                                width={containerWidth ? Math.min(containerWidth, maxWidth) : maxWidth}
                            />
                        </div>
                    ))}
                </Document>
            </div>
        </div>
    );
}

export default PDFViewer;
