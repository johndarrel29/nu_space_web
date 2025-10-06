import { Input as BaseInput } from '@mui/base/Input';
import { Box, styled } from '@mui/system';
import { useQuery } from "@tanstack/react-query";
import { PDFDocument } from 'pdf-lib';
import PropTypes from 'prop-types';
import React, { useEffect, useRef, useState } from 'react';
import Skeleton, { SkeletonTheme } from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button, CloseButton, DraggableSandbox, PDFViewer } from '../../../components';
import { useAdminUser, useAVPDocuments, useCoordinatorDocuments, useDirectorDocuments, useLogin, useModal, useSignature } from '../../../hooks';
import { useTokenStore, useUserStoreWithAuth } from '../../../store';

const blue = {
    100: '#DAECFF',
    200: '#80BFFF',
    400: '#3399FF',
    500: '#007FFF',
    600: '#0072E5',
    700: '#0059B2',
};

const grey = {
    50: '#F3F6F9',
    100: '#E5EAF2',
    200: '#DAE2ED',
    300: '#C7D0DD',
    400: '#B0B8C4',
    500: '#9DA8B7',
    600: '#6B7A90',
    700: '#434D5B',
    800: '#303740',
    900: '#1C2025',
};

const InputElement = styled('input')(
    ({ theme }) => `
  width: 40px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  padding: 8px 0;
  border-radius: 8px;
  text-align: center;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  box-shadow: 0 2px 4px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0, 0.5)' : 'rgba(0,0,0, 0.05)'
        };

  &:hover {
    border-color: ${blue[400]};
  }

  &:focus {
    border-color: ${blue[400]};
    box-shadow: 0 0 0 3px ${theme.palette.mode === 'dark' ? blue[600] : blue[200]};
  }

  /* firefox */
  &:focus-visible {
    outline: 0;
  }
`,
);

function OTP({ separator, length, value, onChange }) {
    const inputRefs = useRef(new Array(length).fill(null));

    const focusInput = (targetIndex) => {
        const targetInput = inputRefs.current[targetIndex];
        targetInput.focus();
    };

    const selectInput = (targetIndex) => {
        const targetInput = inputRefs.current[targetIndex];
        targetInput.select();
    };

    const handleKeyDown = (event, currentIndex) => {
        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case ' ':
                event.preventDefault();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                if (currentIndex > 0) {
                    focusInput(currentIndex - 1);
                    selectInput(currentIndex - 1);
                }
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (currentIndex < length - 1) {
                    focusInput(currentIndex + 1);
                    selectInput(currentIndex + 1);
                }
                break;
            case 'Delete':
                event.preventDefault();
                onChange((prevOtp) => {
                    const otp =
                        prevOtp.slice(0, currentIndex) + prevOtp.slice(currentIndex + 1);
                    return otp;
                });

                break;
            case 'Backspace':
                event.preventDefault();
                if (currentIndex > 0) {
                    focusInput(currentIndex - 1);
                    selectInput(currentIndex - 1);
                }

                onChange((prevOtp) => {
                    const otp =
                        prevOtp.slice(0, currentIndex) + prevOtp.slice(currentIndex + 1);
                    return otp;
                });
                break;

            default:
                break;
        }
    };

    const handleChange = (event, currentIndex) => {
        const currentValue = event.target.value;
        let indexToEnter = 0;

        while (indexToEnter <= currentIndex) {
            if (inputRefs.current[indexToEnter].value && indexToEnter < currentIndex) {
                indexToEnter += 1;
            } else {
                break;
            }
        }
        onChange((prev) => {
            const otpArray = prev.split('');
            const lastValue = currentValue[currentValue.length - 1];
            otpArray[indexToEnter] = lastValue;
            return otpArray.join('');
        });
        if (currentValue !== '') {
            if (currentIndex < length - 1) {
                focusInput(currentIndex + 1);
            }
        }
    };

    const handleClick = (event, currentIndex) => {
        selectInput(currentIndex);
    };

    const handlePaste = (event, currentIndex) => {
        event.preventDefault();
        const clipboardData = event.clipboardData;

        // Check if there is text data in the clipboard
        if (clipboardData.types.includes('text/plain')) {
            let pastedText = clipboardData.getData('text/plain');
            pastedText = pastedText.substring(0, length).trim();
            let indexToEnter = 0;

            while (indexToEnter <= currentIndex) {
                if (inputRefs.current[indexToEnter].value && indexToEnter < currentIndex) {
                    indexToEnter += 1;
                } else {
                    break;
                }
            }

            const otpArray = value.split('');

            for (let i = indexToEnter; i < length; i += 1) {
                const lastValue = pastedText[i - indexToEnter] ?? ' ';
                otpArray[i] = lastValue;
            }

            onChange(otpArray.join(''));
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {new Array(length).fill(null).map((_, index) => (
                <React.Fragment key={index}>
                    <BaseInput
                        slots={{
                            input: InputElement,
                        }}
                        aria-label={`Digit ${index + 1} of OTP`}
                        slotProps={{
                            input: {
                                ref: (ele) => {
                                    inputRefs.current[index] = ele;
                                },
                                onKeyDown: (event) => handleKeyDown(event, index),
                                onChange: (event) => handleChange(event, index),
                                onClick: (event) => handleClick(event, index),
                                onPaste: (event) => handlePaste(event, index),
                                value: value[index] ?? '',
                            },
                        }}
                    />
                    {index === length - 1 ? null : separator}
                </React.Fragment>
            ))}
        </Box>
    );
}

OTP.propTypes = {
    length: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    separator: PropTypes.node,
    value: PropTypes.string.isRequired,
};


export default function WaterMarkPage() {
    const token = useTokenStore.getState().getToken();
    const [otp, setOtp] = useState("");
    const viewerRef = useRef(null);
    const {
        approveDocumentMutate,
        isApprovingDocument,
        isApproveDocumentError,
        isApproveDocumentSuccess,
    } = useCoordinatorDocuments();

    const {
        // Approve document functionality
        approveDirectorDocumentMutate,
        isDirectorApprovingDocument,
        isDirectorApproveDocumentError,
        isDirectorApproveDocumentSuccess,
    } = useDirectorDocuments();

    const {
        approveAVPDocumentMutate,
        isAVPApprovingDocument,
        isAVPApproveDocumentError,
        isAVPApproveDocumentSuccess,
    } = useAVPDocuments();

    const {
        // check email exists mutation
        checkEmailExistsMutate,
        isCheckEmailExistsLoading,
        isCheckEmailExistsError,
        checkEmailExistsError,
        checkEmailExistsData,

        // send code verification mutation
        sendCodeVerificationMutate,
        isSendCodeVerificationLoading,
        isSendCodeVerificationError,
        sendCodeVerificationError,
        sendCodeVerificationData,

        // verify email code mutation
        verifyEmailCodeMutate,
        isVerifyEmailCodeLoading,
        isVerifyEmailCodeError,
        verifyEmailCodeError,
        verifyEmailCodeData,
    } = useLogin();

    const [targetPage, setTargetPage] = useState(1);
    const [applyToAllPages, setApplyToAllPages] = useState(false);
    const navigate = useNavigate();
    const { state } = useLocation();
    const [loading, setLoading] = useState(false);
    const { documentId, url } = state || {};
    const [count, setCount] = useState(0)
    const [otpModalOpen, setOTPModalOpen] = useState(false);
    const [otpValue, setOtpValue] = useState("");
    const [coords, setCoords] = useState(null);
    const [generatedPdfUrl, setGeneratedPdfUrl] = useState(null);
    // Modal preview controls
    const [previewScale, setPreviewScale] = useState(0.85);
    const [confirmChecked, setConfirmChecked] = useState(false);
    const [watermark, setWatermark] = useState({ x: 50, y: 50, width: 100, height: 100 });
    const [watermarkPreviewUrl, setWatermarkPreviewUrl] = useState(null);
    const { isOpen, openModal, closeModal } = useModal();
    const [directorModalOpen, setDirectorModalOpen] = useState(false);
    const { isCoordinator, isAVP, isDirector } = useUserStoreWithAuth();
    const [resendTimer, setResendTimer] = useState(0);
    const timerRef = useRef(null);

    const {
        // fetching admin profile
        adminProfile,
        isAdminProfileLoading,
        isAdminProfileError,
        adminProfileError,
        refetchAdminProfile,
        isAdminProfileRefetching,
    } = useAdminUser();

    const {
        // fetch query
        signatureData,
        isFetching,
        isFetchError,
        fetchError,
        refetchSignature,
    } = useSignature({ id: adminProfile?.user?._id || null });

    // Auto-detect which page the box sits over and set targetPage
    useEffect(() => {
        if (!viewerRef.current || !watermark) return;
        const containerRect = viewerRef.current.getBoundingClientRect();
        const cx = containerRect.left + watermark.x + watermark.width / 2;
        const cy = containerRect.top + watermark.y + watermark.height / 2;
        const canvases = viewerRef.current.querySelectorAll('.react-pdf__Page__canvas');
        for (let i = 0; i < canvases.length; i++) {
            const r = canvases[i].getBoundingClientRect();
            if (cx >= r.left && cx <= r.right && cy >= r.top && cy <= r.bottom) {
                setTargetPage(i + 1);
                break;
            }
        }
    }, [watermark]);

    // Countdown timer for resend button
    useEffect(() => {
        if (resendTimer > 0) {
            timerRef.current = setTimeout(() => {
                setResendTimer(resendTimer - 1);
            }, 1000);
        } else {
            clearTimeout(timerRef.current);
        }
        return () => clearTimeout(timerRef.current);
    }, [resendTimer]);

    const nullWatermarkImage = signatureData?.data?.signedUrl === null;

    if (nullWatermarkImage) {
        toast.warn("No signature/watermark image available. Please create one first at Dashboard Page.");
        navigate(`/general-documents/${documentId}`, { state: { documentId, url } });
    }

    // const pdfUrl = (`http://localhost:5000/api/admin/documents/pdf/${documentId}`);
    const pdfUrl = (`${process.env.REACT_APP_BASE_URL}/api/admin/documents/pdf/${documentId}`);

    const { data: pdfData, isLoading, isError, error: pdfError, refetch: refetchPdf } = useQuery({
        queryKey: ['pdf', documentId],
        queryFn: async () => {
            const res = await fetch(pdfUrl, {
                headers: {
                    'Authorization': token
                }
            });
            if (!res.ok) {
                throw new Error('Network response was not ok');
            }
            return res.blob();
        },
        enabled: !!documentId && !!token,
    });

    const watermarkUrl = (`${process.env.REACT_APP_BASE_URL}/api/signature/stream-signature/${adminProfile?.user?._id}`);
    const { data: watermarkData, isLoading: isWatermarkLoading, isError: isWatermarkError } = useQuery({
        queryKey: ['watermark', adminProfile?.user?._id],
        queryFn: async () => {
            const res = await fetch(watermarkUrl, {
                headers: {
                    'Authorization': token
                }
            });
            if (!res.ok) {
                const errorData = await res.json();
                throw new Error(errorData.message || `Error: ${res.status} - ${res.statusText}`);
            }
            return res.blob();
        },
        enabled: !!adminProfile && !!token,
    });

    useEffect(() => {
        if (!watermarkData) return setWatermarkPreviewUrl(null);

        const url = URL.createObjectURL(watermarkData);
        setWatermarkPreviewUrl(url);
        return () => URL.revokeObjectURL(url);
    }, [watermarkData]);



    async function createPdf({ downloadAfter = false } = {}) {
        if (!pdfData) { toast.error("PDF not loaded yet."); return; }
        if (!watermarkData) { toast.error("No signature/watermark image available."); return; }

        const existingPdfBytes = await pdfData.arrayBuffer();
        const pdfDoc = await PDFDocument.load(existingPdfBytes);

        // --- Get image bytes from watermarkData (already a Blob) ---
        let imageBytes;
        let mime = watermarkData.type || '';
        try {
            imageBytes = await watermarkData.arrayBuffer();
        } catch (e) {
            console.error('[Watermark] Failed reading blob arrayBuffer', e);
            toast.error('Could not read watermark image.');
            return;
        }

        // Optional: PNG signature sniff (first 8 bytes)
        const isPngSignature = (() => {
            if (imageBytes.byteLength < 8) return false;
            const sig = new Uint8Array(imageBytes.slice(0, 8));
            // 89 50 4E 47 0D 0A 1A 0A
            return sig[0] === 0x89 && sig[1] === 0x50 && sig[2] === 0x4E &&
                sig[3] === 0x47 && sig[4] === 0x0D && sig[5] === 0x0A &&
                sig[6] === 0x1A && sig[7] === 0x0A;
        })();

        // Decide embed method
        let embeddedImage;
        try {
            if (mime.includes('png') || (mime === '' && isPngSignature)) {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
            } else if (mime.includes('jpeg') || mime.includes('jpg')) {
                embeddedImage = await pdfDoc.embedJpg(imageBytes);
            } else if (isPngSignature) {
                embeddedImage = await pdfDoc.embedPng(imageBytes);
            } else {
                // Try PNG then JPG fallback
                try {
                    embeddedImage = await pdfDoc.embedPng(imageBytes);
                } catch {
                    embeddedImage = await pdfDoc.embedJpg(imageBytes);
                }
            }
        } catch (err) {
            console.error('[Watermark] Embedding failed. MIME:', mime, err);
            toast.error('Unsupported watermark image format.');
            return;
        }

        const pages = pdfDoc.getPages();
        // const firstPage = pages[0];

        // pick the canvas for the selected page (fallback to first page)
        const canvases = document.querySelectorAll('.react-pdf__Page__canvas');
        const pageIndex = Math.min(Math.max(targetPage - 1, 0), pages.length - 1);
        const renderedCanvas = canvases[pageIndex] || canvases[0];

        // const { width: pdfWidth, height: pdfHeight } = firstPage.getSize();
        // const renderedPdfElement = document.querySelector('.react-pdf__Page__canvas');

        const rect = renderedCanvas?.getBoundingClientRect();
        const containerRect = viewerRef.current?.getBoundingClientRect();
        const fallbackSize = pages[pageIndex].getSize();
        const renderedCssWidth = rect?.width || fallbackSize.width;
        const renderedCssHeight = rect?.height || fallbackSize.height;


        if (!watermark) {
            toast.error('Place the watermark box first.');
            return;
        }

        // const scaleX = pdfWidth / renderedCssWidth;
        // const scaleY = pdfHeight / renderedCssHeight;

        // const pdfX = watermark.x * scaleX;
        // const pdfY = pdfHeight - (watermark.y + watermark.height) * scaleY;
        // const drawWidth = watermark.width * scaleX;
        // const drawHeight = watermark.height * scaleY;

        // console.log('[Export → PDF]', {
        //     mime,
        //     isPngSignature,
        //     browserBox: watermark,
        //     pdfCoords: { x: pdfX, y: pdfY, width: drawWidth, height: drawHeight }
        // });

        // if (drawWidth <= 0 || drawHeight <= 0) {
        //     toast.error('Invalid watermark size.');
        //     return;
        // }

        // firstPage.drawImage(embeddedImage, {
        //     x: pdfX,
        //     y: pdfY,
        //     width: drawWidth,
        //     height: drawHeight,
        //     opacity: 1
        // });

        // Translate box from container space to PAGE-LOCAL space
        const localX = rect && containerRect
            ? watermark.x - (rect.left - containerRect.left)
            : watermark.x;
        const localY = rect && containerRect
            ? watermark.y - (rect.top - containerRect.top)
            : watermark.y;

        // Normalize using page-local dimensions
        const nx = localX / renderedCssWidth;
        const nyBottom = (localY + watermark.height) / renderedCssHeight;
        const nw = watermark.width / renderedCssWidth;
        const nh = watermark.height / renderedCssHeight;

        const drawOnPage = (page) => {
            const { width: pw, height: ph } = page.getSize();
            const pdfX = nx * pw;
            const pdfY = ph - nyBottom * ph;
            const drawWidth = nw * pw;
            const drawHeight = nh * ph;
            if (drawWidth <= 0 || drawHeight <= 0) return;
            page.drawImage(embeddedImage, { x: pdfX, y: pdfY, width: drawWidth, height: drawHeight, opacity: 1 });
        };

        if (applyToAllPages) {
            pages.forEach(drawOnPage);
        } else {
            drawOnPage(pages[pageIndex]);
        }

        const out = await pdfDoc.save();
        // download(out, 'watermarked.pdf', 'application/pdf');
        const blob = new Blob([out], { type: 'application/pdf' });
        const file = new File([blob], `document_${documentId}_watermarked.pdf`, { type: 'application/pdf', lastModified: Date.now() });

        //    store in state
        setGeneratedPdfUrl(file);

        if (downloadAfter) {
            download(out, 'watermarked.pdf', 'application/pdf');
            toast.success('Watermark applied.');
        }
        return file;
    }

    useEffect(() => {
        // Only revoke if the state holds an object URL string; for File objects this is not applicable
        return () => {
            if (generatedPdfUrl && typeof generatedPdfUrl === 'string') {
                URL.revokeObjectURL(generatedPdfUrl);
            }
        };
    }, [generatedPdfUrl]);

    function download(data, filename, type) {
        const blob = new Blob([data], { type });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    }

    const handleSaveDocument = async () => {
        const file = await createPdf({ downloadAfter: false });
        if (file) {
            openModal();

        }
    }

    const handleBackClick = () => {
        navigate(`/general-documents/${documentId}`, { state: { documentId, url } });
    };

    if (isLoading) return (
        <SkeletonTheme baseColor="#2d2d30" highlightColor="#3d3d42">
            <div className='w-full flex flex-col px-3 sm:px-4 lg:px-6 pb-8 animate-fade-in'>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-start sm:items-center w-full mb-4 pt-2'>
                    <div className='flex items-center gap-2'>
                        <Skeleton circle width={32} height={32} />
                        <Skeleton width={140} height={20} />
                    </div>
                    <div className='flex gap-2 w-full sm:w-auto'>
                        <Skeleton width={130} height={36} />
                    </div>
                </div>
                <div className='w-full bg-gray-900 rounded-lg shadow-inner flex flex-col md:flex-row gap-4 md:gap-6 p-2 md:p-4 min-h-[60vh]'>
                    <div className='w-full md:flex-1 flex justify-center items-start overflow-hidden rounded border border-gray-700 bg-black/40 relative'>
                        <div className='w-full max-w-full md:max-w-[900px] flex flex-col gap-4 py-4 px-2'>
                            <Skeleton width={`60%`} height={24} />
                            <Skeleton width={`80%`} height={18} />
                            <Skeleton width={`90%`} height={18} />
                            <div className='mt-6'>
                                <Skeleton width={`100%`} height={420} />
                            </div>
                        </div>
                    </div>
                    <div className='w-full md:w-64 flex-shrink-0'>
                        <Skeleton width={`100%`} height={200} />
                        <div className='mt-4 space-y-2'>
                            <Skeleton width={`70%`} height={14} />
                            <Skeleton width={`90%`} height={14} />
                            <Skeleton width={`60%`} height={14} />
                        </div>
                    </div>
                </div>
            </div>
        </SkeletonTheme>
    );
    if (isError) return (
        <div className='w-full flex flex-col items-center justify-center px-4 py-16 animate-fade-in'>
            <div className='max-w-md w-full text-center bg-red-50 border border-red-200/70 rounded-lg p-6 shadow-sm relative overflow-hidden'>
                <div className='absolute inset-0 pointer-events-none opacity-[0.08] bg-[radial-gradient(circle_at_30%_20%,#ef4444,transparent_70%)]' />
                <div className='relative'>
                    <div className='mx-auto mb-5 h-14 w-14 flex items-center justify-center rounded-full bg-red-100 text-red-600'>
                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className='h-7 w-7 fill-red-600'>
                            <path d="M256 48c-17.7 0-32 14.3-32 32l0 176c0 17.7 14.3 32 32 32s32-14.3 32-32L288 80c0-17.7-14.3-32-32-32zM224 352a32 32 0 1 0 64 0 32 32 0 1 0 -64 0zM256 0C397.4 0 512 114.6 512 256s-114.6 256-256 256S0 397.4 0 256 114.6 0 256 0z" />
                        </svg>
                    </div>
                    <h2 className='text-lg font-semibold text-red-700 tracking-wide'>Unable to load PDF</h2>
                    <p className='text-sm text-red-600 mt-2'>
                        {pdfError?.message || 'An unexpected error occurred while fetching the document.'}
                    </p>
                    <div className='flex flex-col sm:flex-row gap-3 justify-center mt-6'>
                        <Button onClick={() => refetchPdf()} className='whitespace-nowrap'>Retry</Button>
                        <Button onClick={handleBackClick} style='secondary' className='text-off-black whitespace-nowrap'>Go Back</Button>
                    </div>
                    {pdfError && (
                        <details className='mt-5 text-left group'>
                            <summary className='cursor-pointer text-xs text-red-500 hover:text-red-600 select-none'>Show technical details</summary>
                            <div className='mt-2 bg-red-100/70 border border-red-200 rounded p-2 max-h-40 overflow-auto'>
                                <pre className='text-[11px] leading-relaxed whitespace-pre-wrap text-red-700'>
                                    {JSON.stringify({ message: pdfError.message, stack: pdfError.stack?.split('\n').slice(0, 4).join('\n') }, null, 2)}
                                </pre>
                            </div>
                        </details>
                    )}
                </div>
            </div>
        </div>
    );

    const handleConfirm = async () => {
        // Coordinators choose whether to send to director; others approve directly
        if (isCoordinator) {
            setDirectorModalOpen(true);
            return;
        }
        // For Director/AVP, go straight to approve mutate (no modal)
        await handleSendToDirector(false);
    };

    const handleSendToDirector = async (confirm) => {
        let formData = new FormData();

        const approveOnRole = isCoordinator ? approveDocumentMutate : isDirector ? approveDirectorDocumentMutate : isAVP ? approveAVPDocumentMutate : null;

        if (generatedPdfUrl) {
            formData.append("file", generatedPdfUrl);
        }
        if (isCoordinator) {
            // Send string values in multipart form-data for widest backend compatibility
            formData.set("toDirector", confirm ? true : false);
        }
        formData.set("watermark", true);
        formData.set("approve", true);

        console.log("formdata before submit", formData);


        approveOnRole({ documentId, formData }, {
            onSuccess: () => {
                toast.success('Document approved successfully.');
                // navigate to home documents page
                navigate('/general-documents');
            },
            onError: (error) => {
                toast.error(`Error approving document: ${error.message || 'Unknown error'}`);
            }
        });
        toast.success('Approving document...');
        setConfirmChecked(false);
        setDirectorModalOpen(false);
        closeModal();
        return;

    };

    const zoomIn = () => setPreviewScale((s) => Math.min(2, +(s + 0.1).toFixed(2)));
    const zoomOut = () => setPreviewScale((s) => Math.max(0.3, +(s - 0.1).toFixed(2)));
    const zoomReset = () => setPreviewScale(0.85);

    const openInNewTab = () => {
        if (!generatedPdfUrl) return;
        const url = URL.createObjectURL(generatedPdfUrl);
        window.open(url, '_blank');
        // Revoke shortly after to free memory
        setTimeout(() => URL.revokeObjectURL(url), 5000);
    };

    const downloadFromFile = () => {
        if (!generatedPdfUrl) return;
        const url = URL.createObjectURL(generatedPdfUrl);
        const a = document.createElement('a');
        a.href = url;
        a.download = generatedPdfUrl.name || 'watermarked.pdf';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
    };

    const fileInfo = () => {
        if (!generatedPdfUrl) return null;
        const sizeMB = (generatedPdfUrl.size / (1024 * 1024)).toFixed(2);
        return `${generatedPdfUrl.name} • ${sizeMB} MB`;
    };

    const handleOTPConfirmation = () => {
        try {
            setLoading(true);

            if (!adminProfile?.user?.email) {
                toast.error("No email associated with your profile.");
                setLoading(false);
                return;
            }

            checkEmailExistsMutate(adminProfile?.user?.email, {
                onSuccess: (data) => {
                    setLoading(false);
                    setOTPModalOpen(true);
                    setResendTimer(120);
                    toast.success("OTP sent to your email.");
                },
                onError: (error) => {
                    toast.error(`Error: ${error.message || 'Could not verify email.'}`);
                }
            });

        } catch (error) {
            console.error("Error during OTP confirmation:", error);
            toast.error("An error occurred during OTP confirmation. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleResendOTP = () => {
        try {
            if (!adminProfile?.user?.email) {
                toast.error("No email associated with your profile.");
                return;
            }
            sendCodeVerificationMutate(adminProfile?.user?.email, {
                onSuccess: (data) => {
                    setResendTimer(120);
                    toast.success("OTP resent to your email.");
                    setLoading(false);
                },
                onError: (error) => {
                    toast.error(`Error resending OTP: ${error.message || 'Unknown error'}`);
                    setLoading(false);
                }
            });

        } catch (error) {
            console.error("Error during OTP resend:", error);
            toast.error("An error occurred during OTP resend. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Handler for OTP verification button
    function handleOTPVerify() {
        try {
            if (isNaN(otpValue) || /[a-zA-Z]/.test(String(otpValue))) {
                toast.error("OTP code must be a number.");
                return;
            }

            if (!otpValue || otpValue.toString().length < 6) {
                toast.error("Please enter a valid 6-digit OTP code.");
                return;
            }

            verifyEmailCodeMutate({ email: adminProfile?.user?.email, code: otpValue }, {
                onSuccess: (data) => {
                    toast.success("OTP verified successfully.");
                    setLoading(false);
                    handleConfirm();
                    setOTPModalOpen(false);
                },
                onError: (error) => {
                    toast.error(`OTP verification failed: ${error.message || 'Unknown error'}`);
                    setLoading(false);
                }
            });

            console.log('Email:', adminProfile?.user?.email || 'user@email.com');
            console.log('OTP Code:', otpValue);

        } catch (error) {
            console.error("Error during OTP verification:", error);
            toast.error("An error occurred during OTP verification. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <>
            <div className='w-full flex flex-col px-3 sm:px-4 lg:px-6 pb-8'>
                <div className='flex flex-col sm:flex-row gap-3 sm:gap-0 justify-between items-start sm:items-center w-full bg-white mb-4 sticky top-0 z-10 py-2'>
                    {/* Back navigation button */}
                    <div
                        onClick={handleBackClick}
                        className="flex items-center justify-center rounded-full h-8 w-8 cursor-pointer border border-gray-300 group"
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="fill-gray-600 size-4 group-hover:fill-off-black"
                            viewBox="0 0 448 512"
                        >
                            <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
                        </svg>
                    </div>
                    <div className='flex gap-2'>
                        <Button onClick={handleSaveDocument} className='whitespace-nowrap'>Apply Signature</Button>
                    </div>
                </div>
                <div className='relative inline-block w-full bg-gray-900 rounded-lg shadow-inner flex flex-col md:flex-row gap-4 z-100 md:gap-6 p-2 md:p-4 min-h-[60vh]'>
                    <div className='w-full md:flex-1 flex justify-center items-start overflow-auto rounded border border-gray-700 bg-black/40 relative'>
                        <div ref={viewerRef} className='w-full max-w-full md:max-w-[900px] flex justify-center relative'>
                            <PDFViewer docId={documentId} />
                            <DraggableSandbox onUpdate={setWatermark} imageSample={watermarkPreviewUrl} />
                        </div>
                    </div>
                    <div className='w-full md:w-64 flex-shrink-0 relative'>
                        <div className='mt-4 text-xs text-gray-300 space-y-1'>
                            <p className='font-semibold text-gray-200'>Instructions:</p>
                            <p>Drag & resize the watermark box. Position it where you want it applied on the first page.</p>
                            <p className='text-[10px] italic opacity-70'>Preview may differ slightly from the final PDF scaling.</p>
                        </div>
                    </div>
                </div>
            </div>


            {/* Preview & Confirm Modal */}
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-[900px] mx-4 overflow-hidden">
                        {/* Modal Header */}
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <div>
                                <h2 className="text-base md:text-lg font-semibold text-gray-900">Preview & Confirm</h2>
                                <p className="text-[12px] text-gray-500 mt-0.5 truncate max-w-[70vw]">{fileInfo() || 'No file generated yet'}</p>
                            </div>
                            <CloseButton onClick={closeModal} />
                        </div>

                        {/* Toolbar */}
                        <div className="px-4 py-2 flex items-center justify-between bg-gray-50 border-b border-gray-200 text-sm">
                            <div className="flex items-center gap-2 text-gray-600 select-none">
                                <span className="px-2 py-0.5 rounded bg-gray-100 border border-gray-200">Scale: {(previewScale * 100).toFixed(0)}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <button onClick={zoomOut} className="px-2.5 py-1.5 rounded border border-gray-200 hover:bg-gray-100">-
                                </button>
                                <button onClick={zoomReset} className="px-2.5 py-1.5 rounded border border-gray-200 hover:bg-gray-100">Reset</button>
                                <button onClick={zoomIn} className="px-2.5 py-1.5 rounded border border-gray-200 hover:bg-gray-100">+
                                </button>
                                <div className="w-px h-5 bg-gray-200 mx-1" />
                                <button onClick={openInNewTab} disabled={!generatedPdfUrl} className="px-2.5 py-1.5 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-50">Open Tab</button>
                                <button onClick={downloadFromFile} disabled={!generatedPdfUrl} className="px-2.5 py-1.5 rounded border border-gray-200 hover:bg-gray-100 disabled:opacity-50">Download</button>
                            </div>
                        </div>

                        {/* Viewer Area */}
                        <div className='bg-gray-900 w-full flex justify-center max-h-[65vh] overflow-auto'>
                            <div className='inline-block p-3' style={{ transform: `scale(${previewScale})`, transformOrigin: 'top left' }}>
                                {generatedPdfUrl ? (
                                    <PDFViewer file={generatedPdfUrl} />
                                ) : (
                                    <div className="text-gray-400 text-sm">No preview available.</div>
                                )}
                            </div>
                        </div>

                        {/* Footer Actions */}
                        <div className="px-4 py-3 border-t border-gray-200 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-white">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <input type="checkbox" className="h-4 w-4" checked={confirmChecked} onChange={(e) => setConfirmChecked(e.target.checked)} />
                                I confirm this watermark preview is correct and approve applying it.
                            </label>
                            <div className="flex justify-end gap-2">
                                <Button onClick={closeModal} style={"secondary"}>Cancel</Button>
                                <Button
                                    onClick={() => { handleOTPConfirmation(); setLoading(true); }}
                                    disabled={(!confirmChecked || !generatedPdfUrl) || (loading && confirmChecked)}
                                // onClick={handleConfirm}
                                >
                                    {loading ? 'Loading...' : 'Confirm Changes'}
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* OTP Modal */}
            {otpModalOpen && (
                <div>
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                        <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                            {/* Modal Header */}
                            <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                                <div>
                                    <h2 className="text-base md:text-lg font-semibold text-gray-900">OTP Confirmation</h2>
                                </div>
                            </div>

                            {/* Modal Body */}
                            <div className="px-6 py-6 flex flex-col gap-4">
                                <h1 className="text-left text-gray-600 text-sm">A verification code was sent to your email address. Please check your inbox.</h1>
                                <div className="flex flex-col gap-1">
                                    <label className="text-sm text-gray-700 font-medium">Email</label>
                                    <div className="px-3 py-2 bg-gray-100 rounded text-gray-800 text-sm select-text">
                                        {adminProfile?.user?.email || 'user@email.com'}
                                    </div>
                                </div>
                                {resendTimer > 0 ? (
                                    <p className='text-sm text-gray-600'>{`Allow OTP resending in ${resendTimer} seconds`}</p>
                                ) : (
                                    <p className='text-sm text-gray-600'>OTP not received? <a onClick={() => { handleResendOTP(); setLoading(true); }} disabled={loading} className="text-indigo-600 hover:underline cursor-pointer">{loading ? 'Resending...' : 'Resend OTP'}</a></p>
                                )}

                                <label htmlFor="code" className="text-sm text-gray-600">Code</label>
                                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                                    <OTP
                                        separator={<span>-</span>}
                                        value={otpValue}
                                        onChange={(newOtp) => {
                                            setOtpValue(newOtp);
                                            // We don't need to manually update formData here anymore
                                            // as the useEffect will handle the synchronization
                                        }}
                                        length={6}
                                    />
                                </Box>
                            </div>
                            {/* Modal Footer */}
                            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-white">
                                <Button style={"secondary"} onClick={() => setOTPModalOpen(false)}>Cancel</Button>
                                <Button
                                    disabled={loading}
                                    onClick={() => { handleOTPVerify(); setLoading(true); }}
                                >
                                    Verify
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {isCoordinator && directorModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    {/* Paper plane icon */}
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" className="h-5 w-5 fill-current"><path d="M476 3.2c9.2 5.5 14.6 15.9 13.7 26.6l-32 384c-1 12.3-9.7 22.5-21.7 25.5s-24.3-2-31.2-12.2L311 300.7 201.3 410.4c-10.2 10.2-25 14.1-38.7 10.1s-23.9-15.5-27.9-29.2l-18.7-65.5-65.5-18.7c-13.7-4-24.3-14.2-29.2-27.9s-.1-28.5 10.1-38.7L251.3 45.2c10.1-10.1 24.9-13.9 38.6-9.9s23.8 15.4 27.8 29.1l22.8 78.5L425 40.2c8.8-11.3 24.4-14.4 37-7z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">Send to Director</h3>
                                    <p className="text-xs text-gray-500">Forward the watermarked PDF for director approval.</p>
                                </div>
                            </div>
                            <CloseButton onClick={() => setDirectorModalOpen(false)} />
                        </div>

                        {/* Body */}
                        <div className="px-4 py-4">
                            <p className="text-sm text-gray-700">Do you want to send this document to the director for review and approval?</p>
                            {generatedPdfUrl && (
                                <div className="mt-3 text-xs text-gray-500 bg-gray-50 border border-gray-200 rounded p-2">
                                    <span className="font-medium text-gray-700">File:</span> {fileInfo()}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-gray-200 flex flex-col items-center justify-end gap-2 bg-white">
                            {/* <Button onClick={() => handleSendToDirector(false)} style={"secondary"}>Don't send</Button> */}
                            <button
                                className="w-full text-left px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition"
                                onClick={() => handleSendToDirector(false)}
                            >
                                <div className="flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-5 w-5 mt-0.5 fill-gray-600"><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" /></svg>
                                    <div>
                                        <div className="font-medium text-sm text-gray-900">Don't Send to Director</div>
                                        <div className="text-xs text-gray-600">Approve but skip sending to director.</div>
                                    </div>
                                </div>
                            </button>

                            {/* <Button onClick={() => handleSendToDirector(true)} disabled={!generatedPdfUrl || isApprovingDocument}>
                                {isApprovingDocument ? (
                                    <span className="inline-flex items-center gap-2">
                                        <svg className="animate-spin h-4 w-4 text-white" viewBox="0 0 24 24">
                                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z"></path>
                                        </svg>
                                        Sending...
                                    </span>
                                ) : (
                                    'Send'
                                )}
                            </Button> */}

                            <button
                                className="w-full text-left px-3 py-2 rounded-md border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition"
                                onClick={() => handleSendToDirector(true)}
                            >
                                <div className="flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-5 w-5 mt-0.5 fill-indigo-600"><path d="M352 64L288 64 288 288 64 288 64 352 288 352 288 576 352 576 352 352 576 352 576 288 352 288 352 64z" /></svg>
                                    <div>
                                        <div className="font-medium text-sm text-gray-900">Send to Director</div>
                                        <div className="text-xs text-gray-600">Approve and send to director.</div>
                                    </div>
                                </div>
                            </button>

                        </div>
                        <div className='px-4 py-3 border-t border-gray-200 flex justify-end bg-white'>
                            <Button
                                style={"secondary"}
                                onClick={() => setDirectorModalOpen(false)}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}