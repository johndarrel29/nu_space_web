import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useNavigate } from 'react-router-dom';
import { DropIn } from "../../../animations/DropIn";
import { Backdrop, Button, CloseButton, LoadingSpinner } from '../../../components';
import { useAdminDocuments } from '../../../hooks';

import { toast } from 'react-toastify';

// BUGS: when a parameter is set for documentFor, the template option would show the filter option and not the whole options because it's affected to the filter.

export default function AdminTemplates() {
    const navigate = useNavigate();
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showUploadModal, setShowUploadModal] = useState(false);

    // New states for upload modal
    const [uploadStep, setUploadStep] = useState(1); // 1 for document type selection, 2 for file upload
    const [documentType, setDocumentType] = useState("");
    const [uploadFiles, setUploadFiles] = useState([]);
    const [loading, setLoading] = useState(false);
    const [selectedTemplateCategory, setSelectedTemplateCategory] = useState("");
    const [filters, setFilters] = useState({
        documentType: "",
        templatePage: 1,
        templateLimit: 10,
        templateSearch: ""
    });

    const {
        documentTemplate,
        documentTemplateLoading,
        documentTemplateError,
        documentTemplateQueryError,
        refetchDocumentTemplate,
        isDocumentTemplateRefetching,

        // delete single template doc
        deleteSingleDocumentTemplate,
        deleteSingleDocumentTemplateError,
        deleteSingleDocumentTemplateSuccess,
        refetchDeleteSingleDocumentTemplate,

        // delete a document template type
        deleteDocumentTemplate,
        deleteDocumentTemplateError,
        deleteDocumentTemplateSuccess,
        refetchDeleteDocumentTemplate,

        // upload document template
        uploadDocumentTemplate,
        uploadDocumentTemplateError,
        uploadDocumentTemplateSuccess,
        refetchUploadDocumentTemplate,
    } = useAdminDocuments(filters);

    useEffect(() => {
        if (documentTemplateError) {
            console.error("Error fetching document template:", documentTemplateError);
        }
    }, [documentTemplateError]);
    const flattenedDocuments = documentTemplate?.documents?.flatMap(doc => doc.documents || []) || [];

    const handleBackClick = () => {
        navigate(-1);
    };

    const handleDeleteClick = () => {
        setShowDeleteModal(true);
    };

    const handleDeleteTemplate = () => {
        deleteDocumentTemplate(selectedTemplateCategory, {
            onSuccess: () => {
                toast.success("Template deleted successfully");
                refetchDocumentTemplate();
                setSelectedTemplateCategory("");
            },
            onError: (error) => {
                console.error("Error deleting template:", error);
                toast.error("Failed to delete template");
            }
        });
    };

    const handleCategoryChange = (e) => {
        setFilters(prev => ({ ...prev, documentType: e.target.value }));
        // Here you would typically update your filters state or trigger a refetch
    };

    // deleting for document template
    const handleDeleteCategoryChange = (e) => {
        setSelectedTemplateCategory(e.target.value);
        // Here you would typically update your filters state or trigger a refetch
    };

    // Handle opening the upload modal
    const handleUploadClick = () => {
        setUploadStep(1);
        setDocumentType("");
        setUploadFiles([]);
        setShowUploadModal(true);
    };

    // Handle document type selection
    const handleDocumentTypeSelect = (type) => {
        setDocumentType(type);
    };

    // Handle upload files selection
    const handleUploadFilesChange = (files) => {
        setUploadFiles(files);
    };

    // Handle upload submission
    const handleUploadSubmit = () => {
        uploadDocumentTemplate({
            documentFor: documentType,
            files: uploadFiles
        },
            {
                onSuccess: () => {
                    toast.success("Document template uploaded successfully");
                    setLoading(false);
                    setShowUploadModal(false);
                    setUploadStep(1);
                    setDocumentType("");
                    setUploadFiles([]);
                    refetchDocumentTemplate();
                },
                onError: (error) => {
                    setLoading(false);
                    console.error("Error uploading document template:", error);
                    toast.error("Failed to upload document template");
                }
            });


    };

    // Dropzone configuration
    // Dropzone for upload modal
    const uploadDropzone = useDropzone({
        onDrop: (acceptedFiles) => {
            handleUploadFilesChange(acceptedFiles);
        },
        multiple: true,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        }
    });

    const handleDocumentTypeName = (type) => {
        if (type === "new_applicant_recognition") return "New Applicant Recognition";
        if (type === "off_campus_activities") return "Off-Campus Activities";
        if (type === "renewal_recognition") return "Renewal Recognition";
        return;
    }

    const handleDeleteDocument = (id, templateId) => {
        deleteSingleDocumentTemplate({ documentId: id, templateId }, {
            onSuccess: () => {
                toast.success("Template deleted successfully");
                refetchDocumentTemplate();
            },
            onError: (error) => {
                console.error("Error deleting template:", error);
                toast.error("Error deleting template");
            }
        });
    };

    const handleConfirmDelete = (e) => {
        setSelectedTemplateCategory(e);
    }

    const templateOptions = [
        { value: "new_applicant_recognition", label: "New Applicant Recognition" },
        { value: "off_campus_activities", label: "Off-Campus Activities" },
        { value: "on_campus_activities", label: "On-Campus Activities" },
        { value: "renewal_recognition", label: "Renewal Recognition" }
    ];

    return (
        <div className="flex flex-col items-center justify-start w-full relative min-h-[100vh]">
            {/* Back navigation button */}
            <div
                onClick={handleBackClick}
                className="absolute top-3 left-3 sm:top-4 sm:left-4 z-10 flex items-center justify-center rounded-full h-9 w-9 cursor-pointer border border-gray-300 bg-white/80 backdrop-blur group"
            >
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="fill-gray-600 size-4 group-hover:fill-off-black"
                    viewBox="0 0 448 512"
                >
                    <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
                </svg>
            </div>

            <div className="flex flex-col w-full max-w-4xl px-4 sm:px-6 lg:px-0 justify-center pt-12">
                <div className="mb-6">
                    <Button onClick={handleUploadClick}>
                        <div className='flex items-center gap-2'>
                            <svg xmlns="http://www.w3.org/2000/svg" className='fill-white size-4' viewBox="0 0 640 640"><path d="M128 64C92.7 64 64 92.7 64 128L64 512C64 547.3 92.7 576 128 576L208 576L208 464C208 428.7 236.7 400 272 400L448 400L448 234.5C448 217.5 441.3 201.2 429.3 189.2L322.7 82.7C310.7 70.7 294.5 64 277.5 64L128 64zM389.5 240L296 240C282.7 240 272 229.3 272 216L272 122.5L389.5 240zM272 444C261 444 252 453 252 464L252 592C252 603 261 612 272 612C283 612 292 603 292 592L292 564L304 564C337.1 564 364 537.1 364 504C364 470.9 337.1 444 304 444L272 444zM304 524L292 524L292 484L304 484C315 484 324 493 324 504C324 515 315 524 304 524zM400 444C389 444 380 453 380 464L380 592C380 603 389 612 400 612L432 612C460.7 612 484 588.7 484 560L484 496C484 467.3 460.7 444 432 444L400 444zM420 572L420 484L432 484C438.6 484 444 489.4 444 496L444 560C444 566.6 438.6 572 432 572L420 572zM508 464L508 592C508 603 517 612 528 612C539 612 548 603 548 592L548 548L576 548C587 548 596 539 596 528C596 517 587 508 576 508L548 508L548 484L576 484C587 484 596 475 596 464C596 453 587 444 576 444L528 444C517 444 508 453 508 464z" /></svg>
                            Upload Files
                        </div>
                    </Button>
                </div>

                {/* Header section */}
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-end gap-3 mb-4">
                    <h1 className="text-lg sm:text-xl font-semibold">All Templates</h1>
                    <div className='flex gap-3 flex-wrap items-center'>
                        {/* Static dropdown filter replacing the filter button */}
                        <div className='flex items-center gap-2 w-full sm:w-auto'>
                            <label htmlFor="category-filter" className="text-sm font-medium text-gray-600 whitespace-nowrap">Filter by:</label>
                            <select
                                id="category-filter"
                                value={filters.documentType}
                                onChange={handleCategoryChange}
                                className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm w-full sm:w-auto"
                            >
                                <option value="">-- Select Category --</option>
                                {templateOptions.map((option, index) => (
                                    <option key={option.value} value={option.value}>
                                        {option.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <Button style="secondary" onClick={handleDeleteClick}>
                            <div className='flex gap-2 items-center'>
                                <svg xmlns="http://www.w3.org/2000/svg" className='fill-off-black size-4' viewBox="0 0 640 640"><path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" /></svg>
                                Delete Template
                            </div>
                        </Button>
                    </div>
                </div>
                {/* Template item */}
                {documentTemplateLoading ? (
                    <>
                        {Array.from({ length: 4 }).map((_, i) => (
                            <div
                                key={i}
                                className="w-full bg-white rounded border border-mid-gray p-3 sm:p-4 flex justify-between items-center gap-3 sm:gap-4 mb-3 sm:mb-4"
                            >
                                <div className="flex items-center justify-between w-full px-2 sm:px-4">
                                    <div className='flex gap-3 sm:gap-6 items-center flex-1 min-w-0'>
                                        <Skeleton width={24} height={20} />
                                        <div className="flex flex-col min-w-0">
                                            <Skeleton width={180} height={18} style={{ marginBottom: 6 }} />
                                            <div className='flex gap-2 items-center text-xs sm:text-sm'>
                                                <Skeleton width={120} height={14} />
                                                <div className='aspect-square rounded-full bg-gray-300 h-1 w-1'></div>
                                                <Skeleton width={40} height={14} />
                                            </div>
                                        </div>
                                    </div>
                                    <div className='rounded-full aspect-square h-8 flex items-center justify-center bg-white'>
                                        <Skeleton circle width={24} height={24} />
                                    </div>
                                </div>
                            </div>
                        ))}
                    </>
                ) :
                    (flattenedDocuments.length === 0) ? (
                        <div className="flex flex-col items-center justify-center py-16">
                            <svg xmlns="http://www.w3.org/2000/svg" className="mb-4 w-12 h-12 text-gray-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2a4 4 0 018 0v2m-6 4h6a2 2 0 002-2v-5a2 2 0 00-2-2h-1.586a1 1 0 01-.707-.293l-2.414-2.414A2 2 0 0012.586 7H7a2 2 0 00-2 2v7a2 2 0 002 2h2" />
                            </svg>
                            <div className="text-center text-gray-500 text-lg font-medium">No templates found.</div>
                            <div className="text-gray-400 text-sm mt-2">Try uploading a new template or changing your filter.</div>
                        </div>
                    ) : (
                        documentTemplate?.documents?.map((doc, index) => (
                            doc?.documents.map((subDoc, i) => (
                                <div
                                    key={subDoc.id}
                                    className="w-full bg-white rounded border border-mid-gray p-3 sm:p-4 flex justify-between items-center gap-3 sm:gap-4 cursor-pointer hover:bg-gray-100 mb-3 sm:mb-4"
                                // onClick={() => setSelectedTemplate(doc)}
                                >
                                    <div className="flex items-center justify-between w-full px-2 sm:px-4">
                                        <div className='flex gap-3 sm:gap-6 items-center flex-1 min-w-0'>
                                            <p className="text-xs sm:text-sm w-5 sm:w-6 text-gray-600 tabular-nums">{i + 1}</p>
                                            <div className="flex flex-col min-w-0">
                                                <h1 className="font-semibold text-sm sm:text-base truncate max-w-[12rem] sm:max-w-[20rem] lg:max-w-[30rem]">{subDoc.title}</h1>
                                                <div className='flex gap-2 items-center text-xs sm:text-sm'>
                                                    <h2 className="text-gray-600">{handleDocumentTypeName(doc?.documentFor)}</h2>
                                                    <div className='aspect-square rounded-full bg-gray-400 h-1 w-1'></div>
                                                    <h1 className="text-gray-600">{subDoc.documentSize} MB</h1>
                                                </div>
                                            </div>
                                        </div>
                                        <div
                                            onClick={() => handleDeleteDocument(subDoc._id, doc._id)}
                                            className='rounded-full aspect-square h-8 flex items-center justify-center bg-white hover group'>
                                            <svg xmlns="http://www.w3.org/2000/svg" className='fill-gray-600 size-4 group-hover:fill-gray-800' viewBox="0 0 640 640"><path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" /></svg>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ))
                    )}
            </div>

            {/* Delete Template Modal */}
            <AnimatePresence>
                {showDeleteModal && (
                    <>
                        <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" />
                        <motion.div
                            className="fixed inset-0 z-50 w-screen overflow-auto flex items-center justify-center"
                            variants={DropIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit">
                            <div className="bg-white rounded-lg p-6 w-[92%] sm:w-[420px] md:w-[480px] shadow-xl border border-gray-100">
                                <div className='flex justify-between items-center mb-4'>
                                    <h2 className='text-sm font-semibold'>Delete Template</h2>
                                    <CloseButton onClick={() => setShowDeleteModal(false)} />
                                </div>
                                <div className='flex flex-col gap-4'>
                                    <label htmlFor="category-filter" className="text-sm font-medium text-gray-600">Delete Template from:</label>
                                    <select
                                        id="category-filter"
                                        value={selectedTemplateCategory}
                                        onChange={e => handleConfirmDelete(e.target.value)}
                                        className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm w-full"
                                    >
                                        <option value="">-- Select Category --</option>
                                        {documentTemplate?.documents
                                            ?.filter(option => Array.isArray(option.documents) && option.documents.length > 0)
                                            .map((option) => (
                                                <option key={option._id} value={option._id}>
                                                    {handleDocumentTypeName(option.documentFor)}
                                                </option>
                                            ))}
                                    </select>

                                    <div className='flex justify-end mt-4 gap-2'>
                                        <Button
                                            style="secondary"
                                            onClick={() => setShowDeleteModal(false)}
                                        >
                                            Cancel
                                        </Button>
                                        <Button
                                            style="danger"
                                            onClick={handleDeleteTemplate}
                                        >
                                            Confirm Delete
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* Upload Files Modal */}
            <AnimatePresence>
                {showUploadModal && (
                    <>
                        <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" />
                        <motion.div
                            className="fixed inset-0 z-50 w-screen overflow-auto flex items-center justify-center"
                            variants={DropIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit">
                            <div className="bg-white rounded-lg p-6 w-[92%] sm:w-[540px] md:w-[640px] shadow-xl border border-gray-100">
                                <div className='flex justify-between items-center mb-4'>
                                    <h2 className='text-sm font-semibold'>
                                        {uploadStep === 1 ? 'Select Document Type' : 'Upload Files'}
                                    </h2>
                                    <CloseButton onClick={() => setShowUploadModal(false)} />
                                </div>

                                {/* Step 1: Document Type Selection */}
                                {uploadStep === 1 && (
                                    <div className='flex flex-col gap-4'>
                                        <p className='text-sm text-gray-500 mb-2'>
                                            Please select the type of document you want to upload:
                                        </p>
                                        <div className='grid grid-cols-1 sm:grid-cols-2 gap-3'>
                                            {templateOptions.map((type, index) => (
                                                <div
                                                    key={index}
                                                    className={`p-4 border rounded-md flex flex-col items-center justify-center cursor-pointer hover:bg-gray-50 transition-colors ${documentType === type.value ? 'border-primary bg-blue-50' : 'border-gray-200'}`}
                                                    onClick={() => handleDocumentTypeSelect(type.value)}
                                                >
                                                    <div className='w-12 h-12 mb-2 flex items-center justify-center bg-blue-100 rounded-full'>
                                                        <svg xmlns="http://www.w3.org/2000/svg" className='size-6 fill-primary' viewBox="0 0 384 512">
                                                            <path d="M320 464c8.8 0 16-7.2 16-16V160H256c-17.7 0-32-14.3-32-32V48H64c-8.8 0-16 7.2-16 16V448c0 8.8 7.2 16 16 16H320zM0 64C0 28.7 28.7 0 64 0H229.5c17 0 33.3 6.7 45.3 18.7l90.5 90.5c12 12 18.7 28.3 18.7 45.3V448c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64z" />
                                                        </svg>
                                                    </div>
                                                    <span className='font-medium text-sm'>{type.label}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <div className='flex justify-end mt-4 gap-2 flex-wrap'>
                                            <Button
                                                style="secondary"
                                                onClick={() => setShowUploadModal(false)}
                                            >
                                                Cancel
                                            </Button>
                                            <Button
                                                onClick={() => setUploadStep(2)}
                                                disabled={!documentType}
                                            >
                                                Next
                                            </Button>
                                        </div>
                                    </div>
                                )}

                                {/* Step 2: File Upload */}
                                {uploadStep === 2 && (
                                    <div className='flex flex-col gap-4'>
                                        <p className='text-sm text-gray-500 mb-2'>
                                            Upload your {handleDocumentTypeName(documentType) || 'N/A'} template files:
                                        </p>

                                        <div
                                            {...uploadDropzone.getRootProps()}
                                            className='border-2 border-dashed border-gray-300 rounded-md p-6 flex flex-col items-center justify-center cursor-pointer hover:border-primary'
                                        >
                                            <input {...uploadDropzone.getInputProps()} />
                                            <svg xmlns="http://www.w3.org/2000/svg" className='size-10 fill-gray-400 mb-3' viewBox="0 0 512 512">
                                                <path d="M288 109.3V352c0 17.7-14.3 32-32 32s-32-14.3-32-32V109.3l-73.4 73.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l128-128c12.5-12.5 32.8-12.5 45.3 0l128 128c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L288 109.3zM64 352H192c0 35.3 28.7 64 64 64s64-28.7 64-64H448c35.3 0 64 28.7 64 64v32c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V416c0-35.3 28.7-64 64-64z" />
                                            </svg>
                                            {uploadFiles.length > 0 ? (
                                                <div>
                                                    <p className='text-primary font-medium'>{uploadFiles.length} file(s) selected</p>
                                                    <ul className='text-sm text-gray-500 mt-2'>
                                                        {uploadFiles.map((file, index) => (
                                                            <li key={index} className='truncate max-w-xs'>
                                                                {file.name}
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            ) : (
                                                <div className='text-center'>
                                                    <p className='font-medium'>Drag & drop files here, or click to select files</p>
                                                    <p className='text-sm text-gray-500 mt-1'>
                                                        Supports: PDF, DOC, DOCX
                                                    </p>
                                                </div>
                                            )}
                                        </div>

                                        <div className='flex flex-col-reverse sm:flex-row justify-between gap-2 mt-4'>
                                            <Button
                                                style="secondary"
                                                onClick={() => setUploadStep(1)}
                                            >
                                                Back
                                            </Button>
                                            <div className='flex gap-2 sm:justify-end'>
                                                <Button
                                                    style="secondary"
                                                    onClick={() => setShowUploadModal(false)}
                                                >
                                                    Cancel
                                                </Button>
                                                <Button
                                                    disabled={loading || uploadFiles.length === 0}
                                                    onClick={() => { handleUploadSubmit(); setLoading(true); }}
                                                >
                                                    {loading ? <LoadingSpinner /> : 'Upload'}
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}