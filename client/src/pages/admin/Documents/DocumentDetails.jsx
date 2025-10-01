import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button, CloseButton, TabSelector } from '../../../components';
import { useAdminDocuments, useAdminUser, useAVPDocuments, useCoordinatorDocuments, useDirectorDocuments, useRSODocuments, useSignature } from '../../../hooks';
import { useUserStoreWithAuth } from '../../../store';
import { handleDocumentStatus } from '../../../utils/useDocumentStatus';

// TODO: the document detail returns null.
// find how the docu id is being passed on the hook

export default function DocumentDetails() {
    const location = useLocation();
    const navigate = useNavigate();
    const { isUserRSORepresentative, isUserAdmin, isCoordinator, isDirector, isAVP } = useUserStoreWithAuth();
    const { documentId, documentTitle, documentSize, documentType, url } = location.state || {};

    console.log("Location state:", location.state);

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

    const {
        documentDetail,
        documentDetailLoading,
        documentDetailError,
        documentDetailQueryError,
        refetchDocumentDetail,
        isDocumentDetailRefetching
    } = useAdminDocuments({ documentId });

    const {
        specificDocument,
        specificDocumentLoading,
        specificDocumentError,
        specificDocumentQueryError,
    } = useRSODocuments({ documentId });

    console.log("Document ID:", documentId);
    console.log("Document Details:", documentDetail?.document);
    console.log("specificDocument:", specificDocument, "and id of ", documentId);

    const nullWatermarkImage = signatureData?.data === null;

    console.log("signature ", signatureData);


    // add: derived doc + helpers
    const doc = documentDetail && !isUserRSORepresentative
        ? documentDetail.document
        : specificDocument && isUserRSORepresentative
            ? specificDocument
            : null;

    const formatDateTime = (iso) => {
        if (!iso) return 'N/A';
        const d = new Date(iso);
        return isNaN(d.getTime()) ? 'N/A' : d.toLocaleString();
    };
    const getUserDisplay = (u) => {
        if (!u) return 'N/A';
        if (u.RSO_name) return `${u.RSO_name}${u.RSO_acronym ? ` (${u.RSO_acronym})` : ''}`;
        const name = [u.firstName, u.lastName].filter(Boolean).join(' ');
        return `${name || ''}${u.role ? (name ? ` – ${u.role}` : u.role) : ''}` || 'N/A';
    };

    const documentIsApproved = documentDetail?.document?.avp_approved === true && documentDetail?.document?.director_approved === true && documentDetail?.document?.coordinator_approved === true;
    // TODO: the document detail returns null.
    // find how the docu id is being passed on the hook
    console.log("documentIsApproved", documentIsApproved);

    // Approve document functionality
    const {
        approveDocumentMutate,
        isApprovingDocument,
        isApproveDocumentError,
        isApproveDocumentSuccess,
    } = useCoordinatorDocuments();

    const {
        approveAVPDocumentMutate,
        isAVPApprovingDocument,
        isAVPApproveDocumentError,
        isAVPApproveDocumentSuccess,
    } = useAVPDocuments();

    const {
        // Approve document functionality
        approveDirectorDocumentMutate,
        isDirectorApprovingDocument,
        isDirectorApproveDocumentError,
        isDirectorApproveDocumentSuccess,
    } = useDirectorDocuments();

    // Define form state to store all form-related values
    const [formData, setFormData] = useState({
        toDirector: false,
        watermark: false,
        remarks: '',
        approve: false,
    });

    // Decline modal state
    const [declineModalOpen, setDeclineModalOpen] = useState(false);
    const [declineRemarks, setDeclineRemarks] = useState("");
    // Approve choice modal state
    const [approveChoiceOpen, setApproveChoiceOpen] = useState(false);
    // Non-PDF warning modal state
    const [nonPdfModalOpen, setNonPdfModalOpen] = useState(false);

    // Tabs: remove Action tab and keep only Remarks, per request
    const tabs = [{ label: "Remarks" }];

    console.log("file type: ", doc?.file_path?.split('.').pop());

    const [activeTab, setActiveTab] = useState(0);

    // If user is admin, ensure activeTab is adjusted
    useEffect(() => {
        if (((isUserAdmin || isUserRSORepresentative) || documentIsApproved || doc?.coordinator_approved) && activeTab > 0) {
            // Ensure we are on the only existing tab (Remarks) if Action was removed
            setActiveTab(0);
        }
    }, [isUserAdmin, isUserRSORepresentative, documentIsApproved, doc?.coordinator_approved, activeTab]);

    const handleBackClick = () => {
        navigate("/general-documents");
    };

    const handleDocumentClick = () => {
        // if (!isCoordinator && !isDirector && !isAVP) {
        //     window.open(url, "_blank");
        // } else {
        //     navigate(`/general-documents/${documentId}/watermark`, { state: { documentId, url } });
        // }

        console.log("Document click with url:", url);
        window.open(url, "_blank");
    };

    // Helper to render the only Remarks tab
    const getTabContent = (tabIndex) => (tabIndex === 0 ? renderRemarksTab() : null);

    // Rendering functions for tab content
    // Action tab removed per request

    const renderRemarksTab = () => (
        <div className="flex flex-col items-start w-full">
            {doc?.remarks && doc.remarks.trim() ? (
                <div className="max-w-lg w-fit bg-gray-50 border border-gray-200 rounded-2xl px-4 py-3 shadow-sm text-gray-800 whitespace-pre-line">
                    {doc.remarks}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center py-8">
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="mb-2 w-10 h-10 text-gray-300"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 14h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8s-9-3.582-9-8 4.03-8 9-8 9 3.582 9 8z" />
                    </svg>
                    <span className="text-gray-400 text-sm font-medium">No remarks provided.</span>
                </div>
            )}
        </div>
    );

    // this function will now be used for approve button in the approve choice modal
    // if approved is true, navigate to watermark page
    // if false, do the normal approve flow and the toDirector is false and watermark is false
    const handleDocumentApprove = (isApproved) => {
        // disregard the mutate for now. navigate to watermark page
        if (isApproved) {
            navigate(`/general-documents/${documentId}/watermark`, { state: { documentId, url } });
            return;
        }


        let updatedFormData = {
            ...formData,
            approve: isApproved,
        };


        // Update form state with approval status
        if (isCoordinator) {
            const fd = new FormData();
            fd.set("approve", true);
            fd.set("toDirector", false);
            fd.set("watermark", false);

            // not yet implemented on UI. but just in case
            if (formData?.remarks && formData.remarks.trim()) {
                fd.set("remarks", formData.remarks.trim());
            }

            updatedFormData = fd;
        }

        if (isDirector || isAVP) {
            // dont include fields: watermark, and toDirector
            // const { watermark, toDirector, ...dataWithoutExcludedFields } = updatedFormData;
            // updatedFormData = dataWithoutExcludedFields;
            const fd = new FormData();
            fd.set("approve", true);
            fd.set("watermark", false);
            // not yet implemented on UI. but just in case
            if (formData?.remarks && formData.remarks.trim()) {
                fd.set("remarks", formData.remarks.trim());
            }
            updatedFormData = fd;

        }


        const approveDocumentOnRole = isCoordinator ? approveDocumentMutate : isDirector ? approveDirectorDocumentMutate : isAVP ? approveAVPDocumentMutate : null;

        console.log(isCoordinator ? "using coordinator approve" : "not using coordinator approve");
        setFormData(updatedFormData);
        approveDocumentOnRole({ formData: updatedFormData, documentId: documentId },
            {
                onSuccess: () => {
                    console.log("Document approved successfully");
                    navigate(-1);
                    toast.success("Document approved successfully");
                },
                onError: (error) => {
                    console.error("Error approving document:", error);
                    toast.error(error.message || "Failed to approve document");
                }
            }
        );

        // Log the complete form state for debugging
        console.log("Document action form data:", {
            documentId,
            ...updatedFormData,
            action: isApproved ? "approve" : "decline"
        });

        // Here you would typically send the data to your API
        if (isApproved) {
            const payload = {
                documentId,
                remarks: updatedFormData.remarks,
                toDirector: updatedFormData.toDirector,
                watermark: updatedFormData.watermark
            };

            console.log("Sending approval with payload:", payload);
            // Uncomment this to actually send the data
            // approveDocumentMutate(payload);
        } else {
            console.log("Document declined with remarks:", updatedFormData.remarks);
            // Implement decline logic here
        }
    };

    const handleDocumentDecline = () => {
        try {
            // Choose mutate function based on role
            const declineOnRole = isCoordinator
                ? approveDocumentMutate
                : isDirector
                    ? approveDirectorDocumentMutate
                    : isAVP
                        ? approveAVPDocumentMutate
                        : null;

            if (!declineOnRole) {
                toast.error('Unable to decline: role not recognized.');
                return;
            }

            let payload;

            // Backend expects multipart form-data for coordinator; use strings for booleans
            const fd = new FormData();
            fd.set('approve', 'false');
            fd.set('watermark', 'false');
            if (isCoordinator) fd.set('toDirector', 'false');
            if (declineRemarks && declineRemarks.trim()) {
                fd.set('remarks', declineRemarks.trim());
            }
            payload = fd;

            declineOnRole(
                { formData: payload, documentId },
                {
                    onSuccess: () => {
                        toast.success('Document declined successfully');
                        setDeclineModalOpen(false);
                    },
                    onError: (error) => {
                        console.error('Error declining document:', error);
                        toast.error(error?.message || 'Failed to decline document');
                    }
                }
            );
        } catch (error) {
            console.error('Error declining document:', error);
            toast.error('Unexpected error while declining document');
        }
    }

    const statusDisplay = handleDocumentStatus(doc?.document_status);

    const documentStatusFinished = (doc?.document_status === 'approved' || doc?.document_status === 'rejected');
    const coordinatorFinished = (isCoordinator && (doc?.coordinator_approved === true || doc?.coordinator_approved === false));
    const directorFinished = (isDirector && (doc?.director_approved === true || doc?.director_approved === false));
    const avpFinished = (isAVP && (doc?.avp_approved === true || doc?.avp_approved === false));

    const disableBasedOnRole = () => {
        if (isCoordinator && ((doc?.coordinator_approved === false && documentStatusFinished) || doc?.coordinator_approved === true)) {
            return true;
        } else if (isDirector && ((doc?.director_approved === false && documentStatusFinished) || doc?.director_approved === true)) {
            return true;
        } else if (isAVP && ((doc?.avp_approved === false && documentStatusFinished) || doc?.avp_approved === true)) {
            return true;
        } else return false;
    }



    return (
        <div className="flex flex-col items-center justify-start w-full relative px-3 sm:px-4 lg:px-6 pb-16">
            {/* Back navigation button */}
            <div
                onClick={handleBackClick}
                className="absolute top-0 left-2 flex items-center justify-center rounded-full h-8 w-8 cursor-pointer border border-gray-300 group"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="fill-gray-600 size-4 group-hover:fill-off-black"
                    viewBox="0 0 448 512"
                >
                    <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
                </svg>
            </div>

            <div className="flex flex-col w-full max-w-5xl justify-center mb-6">
                {/* Document Detail Card */}
                <div
                    onClick={handleDocumentClick}
                    className="w-full bg-blue-50 rounded-lg border border-blue-200 p-3 sm:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4 cursor-pointer hover:bg-blue-100 shadow-sm ring-1 ring-inset ring-blue-100 transition-colors"
                >
                    <div className="flex gap-3 sm:gap-4 items-center w-full">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white rounded-full flex items-center justify-center flex-shrink-0 ring-1 ring-blue-200">
                            <svg
                                xmlns="http://www.w3.org/2000/svg"
                                className="size-5 sm:size-6 fill-blue-600"
                                viewBox="0 0 640 640"
                            >
                                <path d="M304 112L192 112C183.2 112 176 119.2 176 128L176 512C176 520.8 183.2 528 192 528L448 528C456.8 528 464 520.8 464 512L464 272L376 272C336.2 272 304 239.8 304 200L304 112zM444.1 224L352 131.9L352 200C352 213.3 362.7 224 376 224L444.1 224zM128 128C128 92.7 156.7 64 192 64L325.5 64C342.5 64 358.8 70.7 370.8 82.7L493.3 205.3C505.3 217.3 512 233.6 512 250.6L512 512C512 547.3 483.3 576 448 576L192 576C156.7 576 128 547.3 128 512L128 128z" />
                            </svg>
                        </div>
                        <div className="flex flex-col max-w-full overflow-hidden">
                            <h1 className="font-bold text-sm sm:text-base truncate text-blue-900">
                                {doc?.title || documentTitle || "Unknown Document"}
                            </h1>
                            <div className="flex gap-2 items-center">
                                <h2 className="text-blue-700 text-xs sm:text-sm truncate max-w-[150px] sm:max-w-[200px]">
                                    {(doc?.contentType || documentType)
                                        ? (doc?.contentType || documentType)
                                        : "Unknown Type"}
                                </h2>
                                <div className="aspect-square h-1.5 sm:h-2 w-1.5 sm:w-2 bg-blue-300 rounded-full flex-shrink-0" />
                                <h2 className="text-blue-700 text-xs sm:text-sm">
                                    {(doc?.documentSize ?? documentSize) ? (doc?.documentSize ?? documentSize) : "Unknown Size"} MB
                                </h2>
                            </div>
                        </div>
                    </div>
                    <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="fill-blue-700 size-5 sm:size-6 mt-2 sm:mt-0 self-end sm:self-center"
                        viewBox="0 0 640 640"
                    >
                        <path d="M354.4 83.8C359.4 71.8 371.1 64 384 64L544 64C561.7 64 576 78.3 576 96L576 256C576 268.9 568.2 280.6 556.2 285.6C544.2 290.6 530.5 287.8 521.3 278.7L464 221.3L310.6 374.6C298.1 387.1 277.8 387.1 265.3 374.6C252.8 362.1 252.8 341.8 265.3 329.3L418.7 176L361.4 118.6C352.2 109.4 349.5 95.7 354.5 83.7zM64 240C64 195.8 99.8 160 144 160L224 160C241.7 160 256 174.3 256 192C256 209.7 241.7 224 224 224L144 224C135.2 224 128 231.2 128 240L128 496C128 504.8 135.2 512 144 512L400 512C408.8 512 416 504.8 416 496L416 416C416 398.3 430.3 384 448 384C465.7 384 480 398.3 480 416L480 496C480 540.2 444.2 576 400 576L144 576C99.8 576 64 540.2 64 496L64 240z" />
                    </svg>
                </div>
                {console.log("Document for details:", doc)}

                {/* Actions: Approve / Decline (placed below the main view document) */}
                {(!isUserAdmin && !isUserRSORepresentative) && (
                    <section className="mt-4">
                        <div className="w-full flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2">
                            <Button
                                disabled={!documentId || disableBasedOnRole()}
                                onClick={() => {
                                    const ext = (doc?.file_path?.split('.').pop() || '').toLowerCase();
                                    if (ext === 'pdf') {
                                        if (isCoordinator) {
                                            setApproveChoiceOpen(true);
                                        } else {
                                            navigate(`/general-documents/${documentId}/watermark`, { state: { documentId, url } }); // direct to watermark page
                                        }
                                    } else {
                                        setNonPdfModalOpen(true);
                                    }
                                }}
                                className="w-full sm:w-auto"
                            >
                                <div className="flex gap-2 items-center justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="size-4 fill-white"
                                        viewBox="0 0 640 640"
                                    >
                                        <path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" />
                                    </svg>
                                    Approve Submission
                                </div>
                            </Button>
                            <Button
                                style="secondary"
                                disabled={!documentId || disableBasedOnRole()}
                                onClick={() => setDeclineModalOpen(true)}
                                className="w-full sm:w-auto"
                            >
                                <div className="flex gap-2 items-center justify-center">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="size-4"
                                        fill="current"
                                        viewBox="0 0 640 640"
                                    >
                                        <path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" />
                                    </svg>
                                    Decline Submission
                                </div>
                            </Button>
                        </div>
                    </section>
                )}
                {/* Status & Routing */}
                <div className=' mt-4 '>
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">

                        Status
                    </h3>
                </div>
                <div className="flex flex-wrap gap-2">
                    {/* Document Status */}
                    <div className={`flex items-center gap-1 py-1 px-3 rounded-full font-semibold text-xs shadow-sm
                        ${statusDisplay.label === 'Approved' ? 'bg-green-100 text-green-800 border border-green-300'
                            : statusDisplay.label === 'Rejected' ? 'bg-red-100 text-red-800 border border-red-300'
                                : 'bg-yellow-100 text-yellow-800 border border-yellow-300'}`}>
                        {statusDisplay.icon}
                        <span>{statusDisplay.label}</span>
                    </div>

                    {/* Approvals */}
                    <div className={`flex items-center gap-1 py-1 px-3 rounded-full font-semibold text-xs shadow-sm border
                        ${doc?.coordinator_approved ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                        {doc?.coordinator_approved ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-green-800" viewBox="0 0 640 640"><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-gray-400" viewBox="http://www.w3.org/2000/svg"><path d="M320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64zM296 184L296 320C296 328 300 335.5 306.7 340L402.7 404C413.7 411.4 428.6 408.4 436 397.3C443.4 386.2 440.4 371.4 429.3 364L344 307.2L344 184C344 170.7 333.3 160 320 160C306.7 160 296 170.7 296 184z" /></svg>
                        )}
                        Coordinator
                    </div>
                    <div className={`flex items-center gap-1 py-1 px-3 rounded-full font-semibold text-xs shadow-sm border
                        ${doc?.director_approved ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                        {doc?.director_approved ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-green-800" viewBox="0 0 640 640"><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-gray-400" viewBox="http://www.w3.org/2000/svg"><path d="M320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64zM296 184L296 320C296 328 300 335.5 306.7 340L402.7 404C413.7 411.4 428.6 408.4 436 397.3C443.4 386.2 440.4 371.4 429.3 364L344 307.2L344 184C344 170.7 333.3 160 320 160C306.7 160 296 170.7 296 184z" /></svg>
                        )}
                        Director
                    </div>
                    <div className={`flex items-center gap-1 py-1 px-3 rounded-full font-semibold text-xs shadow-sm border
                        ${doc?.avp_approved ? 'bg-green-100 text-green-800 border-green-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                        {doc?.avp_approved ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-green-800" viewBox="0 0 640 640"><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" /></svg>

                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-gray-400" viewBox="http://www.w3.org/2000/svg"><path d="M320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64zM296 184L296 320C296 328 300 335.5 306.7 340L402.7 404C413.7 411.4 428.6 408.4 436 397.3C443.4 386.2 440.4 371.4 429.3 364L344 307.2L344 184C344 170.7 333.3 160 320 160C306.7 160 296 170.7 296 184z" /></svg>

                        )}
                        AVP
                    </div>

                    {/* Routing */}
                    <div className={`flex items-center gap-1 py-1 px-3 rounded-full font-semibold text-xs shadow-sm border
                        ${doc?.to_director ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                        {doc?.to_director ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-blue-800" viewBox="http://www.w3.org/2000/svg"><circle cx="320" cy="320" r="256" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-gray-400" viewBox="http://www.w3.org/2000/svg"><circle cx="320" cy="320" r="256" /></svg>
                        )}
                        To Director
                    </div>
                    <div className={`flex items-center gap-1 py-1 px-3 rounded-full font-semibold text-xs shadow-sm border
                        ${doc?.to_avp ? 'bg-blue-100 text-blue-800 border-blue-300'
                            : 'bg-gray-100 text-gray-700 border-gray-300'}`}>
                        {doc?.to_avp ? (
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-blue-800" viewBox="http://www.w3.org/2000/svg"><circle cx="320" cy="320" r="256" /></svg>
                        ) : (
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-3.5 fill-gray-400" viewBox="http://www.w3.org/2000/svg"><circle cx="320" cy="320" r="256" /></svg>
                        )}
                        To AVP
                    </div>
                </div>

                {/* Key Approvals (most important) */}
                <section className="mt-8">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Key Approvals</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                        <div className="rounded border border-mid-gray bg-white p-3 flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-primary fill-current mt-0.5" viewBox="0 0 640 640">
                                <path d="M240 192C240 147.8 275.8 112 320 112C364.2 112 400 147.8 400 192C400 236.2 364.2 272 320 272C275.8 272 240 236.2 240 192zM448 192C448 121.3 390.7 64 320 64C249.3 64 192 121.3 192 192C192 262.7 249.3 320 320 320C390.7 320 448 262.7 448 192z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-500">Verified By</div>
                                <div className="font-medium truncate">{getUserDisplay(doc?.verifiedBy)}</div>
                            </div>
                        </div>
                        <div className="rounded border border-mid-gray bg-white p-3 flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-primary fill-current mt-0.5" viewBox="0 0 640 640">
                                <path d="M352 64L288 64 288 288 64 288 64 352 288 352 288 576 352 576 352 352 576 352 576 288 352 288 352 64z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-500">Endorsed By</div>
                                <div className="font-medium truncate">{getUserDisplay(doc?.endorsedBy)}</div>
                            </div>
                        </div>
                        <div className="rounded border border-mid-gray bg-white p-3 flex items-start gap-3">
                            <svg xmlns="http://www.w3.org/2000/svg" className="size-5 text-primary fill-current mt-0.5" viewBox="0 0 640 640">
                                <path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" />
                            </svg>
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-gray-500">Approved By</div>
                                <div className="font-medium truncate">{getUserDisplay(doc?.approvedBy)}</div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Submission Details (second priority) */}
                <section className="mt-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-3">Submission Details</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        <div className="rounded border border-mid-gray bg-white p-3">
                            <div className="text-xs text-gray-500">Submitted By</div>
                            <div className="font-medium break-words">{doc ? getUserDisplay(doc.submittedBy) : 'No User Found'}</div>
                        </div>
                        <div className="rounded border border-mid-gray bg-white p-3">
                            <div className="text-xs text-gray-500">Title</div>
                            <div className="font-medium break-words">{doc?.title || 'Untitled'}</div>
                        </div>
                        <div className="rounded border border-mid-gray bg-white p-3">
                            <div className="text-xs text-gray-500">Size</div>
                            <div className="font-medium">{doc?.documentSize ? `${doc.documentSize} MB` : 'No Data'}</div>
                        </div>
                        <div className="rounded border border-mid-gray bg-white p-3">
                            <div className="text-xs text-gray-500">Content Type</div>
                            <div className="font-medium capitalize">{doc?.contentType || 'N/A'}</div>
                        </div>
                        <div className="rounded border border-mid-gray bg-white p-3 sm:col-span-2 lg:col-span-3">
                            <div className="text-xs text-gray-500">Purpose</div>
                            <div className="font-medium capitalize">{doc?.purpose || 'N/A'}</div>
                        </div>
                    </div>

                    {/* Other metadata (least priority) */}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                        <div className="rounded border border-gray-200 bg-background p-3">
                            <div className="text-xs text-gray-500">Academic Year</div>
                            <div className="text-gray-700">{doc?.academicYear?.label || 'N/A'}</div>
                        </div>
                        <div className="rounded border border-gray-200 bg-background p-3">
                            <div className="text-xs text-gray-500">Created At</div>
                            <div className="text-gray-700">{formatDateTime(doc?.createdAt)}</div>
                        </div>
                        <div className="rounded border border-gray-200 bg-background p-3">
                            <div className="text-xs text-gray-500">Updated At</div>
                            <div className="text-gray-700">{formatDateTime(doc?.updatedAt)}</div>
                        </div>
                    </div>
                </section>

                {/* Tab Selector */}
                <div className="mt-10 mb-6">
                    <TabSelector tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
                </div>

                {/* Loading/Error Hints (non-blocking) */}
                {(documentDetailLoading && !isUserRSORepresentative) && (
                    <p className="text-xs text-gray-500 mb-2">Loading document details...</p>
                )}
                {(documentDetailError || documentDetailQueryError) && !isUserRSORepresentative && (
                    <p className="text-xs text-red-600 mb-2">Failed to load some details.</p>
                )}

                {/* Tab Content */}
                <div className="w-full">
                    {getTabContent(activeTab)}
                </div>
            </div>

            {/* Decline Confirmation Modal (static backdrop) */}
            {declineModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-red-100 flex items-center justify-center text-red-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-5 w-5 fill-current"><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">Confirm Decline</h3>
                                    <p className="text-xs text-gray-500">Please provide remarks before rejecting the document.</p>
                                </div>
                            </div>
                            <CloseButton onClick={() => setDeclineModalOpen(false)} />
                        </div>

                        {/* Body */}
                        <div className="px-4 py-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Remarks<span className="text-red-600">*</span></label>
                            <textarea
                                rows={4}
                                value={declineRemarks}
                                onChange={(e) => setDeclineRemarks(e.target.value)}
                                placeholder="Briefly explain why this document is being declined."
                                className="w-full bg-white border border-gray-300 rounded-md p-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300 placeholder:text-gray-400"
                            />
                            <p className="mt-1 text-xs text-gray-500">Your remarks will be visible to the submitter.</p>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2 bg-white">
                            <Button style="secondary" onClick={() => setDeclineModalOpen(false)}>Cancel</Button>
                            <Button
                                onClick={() => handleDocumentDecline()}
                                disabled={!declineRemarks.trim()}
                            >
                                Confirm Decline
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Approve Choice Modal (static backdrop) */}
            {approveChoiceOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-5 w-5 fill-current"><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">Approve Submission</h3>
                                    <p className="text-xs text-gray-500">Choose how to proceed with approval.</p>
                                </div>
                            </div>
                            <CloseButton onClick={() => setApproveChoiceOpen(false)} />
                        </div>

                        {/* Body */}
                        <div className="px-4 py-4 space-y-3">
                            <button
                                className="w-full text-left px-3 py-2 rounded-md border border-gray-300 hover:bg-gray-50 transition"
                                onClick={() => handleDocumentApprove()}
                            >
                                <div className="flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-5 w-5 mt-0.5 fill-gray-600"><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" /></svg>
                                    <div>
                                        <div className="font-medium text-sm text-gray-900">Approve without signature</div>
                                        <div className="text-xs text-gray-600">Record approval but skip watermarking/signature.</div>
                                    </div>
                                </div>
                            </button>

                            <button
                                className="w-full text-left px-3 py-2 rounded-md border border-indigo-300 text-indigo-700 hover:bg-indigo-50 transition"
                                onClick={() => {
                                    setApproveChoiceOpen(false);
                                    // Navigate to the watermark page
                                    navigate(`/general-documents/${documentId}/watermark`, { state: { documentId, url } });
                                }}
                            >
                                <div className="flex items-start gap-2">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-5 w-5 mt-0.5 fill-indigo-600"><path d="M352 64L288 64 288 288 64 288 64 352 288 352 288 576 352 576 352 352 576 352 576 288 352 288 352 64z" /></svg>
                                    <div>
                                        <div className="font-medium text-sm">Approve with signature</div>
                                        <div className="text-xs text-gray-600">Open the signature workflow to attach your signature.</div>
                                    </div>
                                </div>
                            </button>
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2 bg-white">
                            <Button style="secondary" onClick={() => setApproveChoiceOpen(false)}>Cancel</Button>
                        </div>
                    </div>
                </div>
            )}

            {/* Non-PDF Warning Modal (static backdrop) */}
            {nonPdfModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
                    <div className="bg-white rounded-lg shadow-2xl w-full max-w-md mx-4 overflow-hidden">
                        {/* Header */}
                        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-600">
                                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640" className="h-5 w-5 fill-current"><path d="M320 64C178.6 64 64 178.6 64 320 64 461.4 178.6 576 320 576 461.4 576 576 461.4 576 320 576 178.6 461.4 64 320 64zM352 448C352 465.7 337.7 480 320 480 302.3 480 288 465.7 288 448 288 430.3 302.3 416 320 416 337.7 416 352 430.3 352 448zM288 184C288 170.7 298.7 160 312 160L328 160C341.3 160 352 170.7 352 184L352 360C352 373.3 341.3 384 328 384L312 384C298.7 384 288 373.3 288 360L288 184z" /></svg>
                                </div>
                                <div>
                                    <h3 className="text-base font-semibold text-gray-900">Approval Unavailable</h3>
                                    <p className="text-xs text-gray-500">Approvals are only supported for PDF files.</p>
                                </div>
                            </div>
                            <CloseButton onClick={() => setNonPdfModalOpen(false)} />
                        </div>

                        {/* Body */}
                        <div className="px-4 py-4 space-y-2">
                            <p className="text-sm text-gray-700">
                                This document cannot be approved because it is not a PDF file. Please ask the submitter to resubmit a PDF or convert the file to PDF and try again.
                            </p>
                            {doc?.file_path && (
                                <p className="text-xs text-gray-500">Detected file: <span className="font-medium">{doc.file_path.split('.').pop()}</span></p>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-end gap-2 bg-white">
                            <Button onClick={() => setNonPdfModalOpen(false)}>OK</Button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}