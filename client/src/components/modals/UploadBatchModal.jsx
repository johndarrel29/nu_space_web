import { useCallback, useEffect, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button, CloseButton, LoadingSpinner, ReusableDropdown } from '../../components';
import { useRSODocuments } from '../../hooks';

// TODO: Implement forceful download of file to avoid redirects to file URL

function UploadBatchModal({ handleCloseModal, page, activityId }) {
    const location = useLocation();
    const [file, setFile] = useState(null);
    const [fileList, setFileList] = useState([]);
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const [initialPage, setInitialPage] = useState("templates");
    const [data, setData] = useState([]);
    // Add selectedTemplate state
    const [selectedTemplate, setSelectedTemplate] = useState([]);
    const { documentTemplate } = useRSODocuments({
        documentFor: selectedTemplate
    });


    const {
        // uploadAccreditationDocument
        uploadAccreditationDocument,
        uploadAccreditationDocumentLoading,
        uploadAccreditationDocumentSuccess,
        uploadAccreditationDocumentError,
        uploadAccreditationDocumentQueryError,

        // activity upload
        // uploadActivityDocument
        uploadActivityDocument,
        uploadActivityDocumentLoading,
        uploadActivityDocumentSuccess,
        uploadActivityDocumentError,
        uploadActivityDocumentQueryError,

    } = useRSODocuments();

    // Determine page type
    const currentPage = location.pathname;
    const isDocumentPage = currentPage.includes('/documents') && !currentPage.includes('/activities');
    const isActivitiesPage = currentPage.startsWith('/activities') && !isDocumentPage;

    console.log("activityId ", activityId);

    // Template options based on page type
    const genDocOptions = [
        "All Templates",
        "New Applicant Recognition",
        "Renewal Recognition",
    ];

    const actDocOptions = [
        "All Templates",
        "Off Campus Activities",
        "On Campus Activities",
    ];

    // Set initial template filter based on page location
    useEffect(() => {
        if (isDocumentPage) {
            setSelectedTemplate(["new_applicant_recognition", "renewal_recognition"]);
        } else if (isActivitiesPage) {
            setSelectedTemplate(["off_campus_activities", "on_campus_activities"]);
        }
    }, [isDocumentPage, isActivitiesPage]);

    // Update data when document template changes
    useEffect(() => {
        if (documentTemplate?.documents) {
            setData(documentTemplate.documents);
        } else {
            setData([]);
        }
    }, [documentTemplate]);

    // Dropzone configuration
    const onDrop = useCallback(acceptedFiles => {
        setFile(acceptedFiles[0]);
    }, []);

    const { getRootProps, getInputProps, isDragActive } = useDropzone({
        onDrop,
        multiple: true,
        maxFiles: 10,
        accept: {
            'application/pdf': ['.pdf'],
            'application/msword': ['.doc'],
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
        }
    });

    // Handlers
    const handleAddFile = () => {
        if (!file) {
            setError("Please select a file.");
            return;
        }

        const fileEntry = {
            id: Date.now(),
            file,
        };

        setFileList(prevFiles => [...prevFiles, fileEntry]);
        setFile(null);
        setError(null);
    };

    const removeFileFromList = (fileId) => {
        setFileList(prevFiles => prevFiles.filter(file => file.id !== fileId));
    };

    const handleTemplateFilter = (option) => {
        if (isDocumentPage) {
            switch (option) {
                case "New Applicant Recognition":
                    setSelectedTemplate("new_applicant_recognition");
                    break;
                case "Renewal Recognition":
                    setSelectedTemplate("renewal_recognition");
                    break;
                default:
                    setSelectedTemplate(["new_applicant_recognition", "renewal_recognition"]);
            }
        }

        if (isActivitiesPage) {
            switch (option) {
                case "Off Campus Activities":
                    setSelectedTemplate("off_campus_activities");
                    break;
                case "On Campus Activities":
                    setSelectedTemplate("on_campus_activities");
                    break;
                default:
                    setSelectedTemplate(["off_campus_activities", "on_campus_activities"]);
            }
        }
    };

    const downloadDocument = (document) => {
        if (document.signedUrl) {
            window.open(document.signedUrl, '_blank');
        }
    };

    const handleUploadDocuments = () => {
        console.log("Uploading documents:", fileList);
        if (fileList.length === 0) {
            setError("Please add files to upload.");
            return;
        }

        // Create a new FormData instance
        const uploadFormData = new FormData();

        // Only append the file itself
        fileList.forEach(fileEntry => {
            uploadFormData.append("files", fileEntry.file);
        });
        try {
            // Document upload
            if (isDocumentPage) {
                uploadAccreditationDocument({ formData: uploadFormData },
                    {
                        onSuccess: () => {
                            setLoading(false);
                            console.log("Document uploaded successfully");
                            toast.success("Document uploaded successfully");
                            // Clear the file list after upload
                            setFileList([]);
                        },
                        onError: (error) => {
                            setLoading(false);
                            console.error("Error uploading document:", error);
                            toast.error(error.message || '');
                        }
                    }
                );
            }
        } catch (error) {
            console.error("Error uploading document:", error);
            toast.error(error.message || '');
        } finally {
            setLoading(false);
        }

        try {
            if (isActivitiesPage) {
                uploadActivityDocument({ formData: uploadFormData, activityId: activityId },
                    {
                        onSuccess: () => {
                            setLoading(false);
                            console.log("Activity uploaded successfully");
                            toast.success("Activity uploaded successfully");
                            // Clear the file list after upload
                            setFileList([]);
                        },
                        onError: (error) => {
                            setLoading(false);
                            console.error("Error uploading activity:", error);
                            toast.error(error.message || '');
                        }
                    }
                );
            }
        } catch (error) {
            setLoading(false);
            console.error("Error uploading activity:", error);
            toast.error(error.message || '');
        }

    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className='flex justify-between items-center p-6'>
                <h1 className="text-2xl font-bold text-primary">
                    {initialPage === "templates"
                        ? "Download Template Documents"
                        : initialPage === "upload"
                            ? "Upload Documents"
                            : "No Documents to Upload"}
                </h1>
                <CloseButton onClick={handleCloseModal} />
            </div>

            {/* Content */}
            {initialPage === "templates" ? (
                <div className='flex flex-col gap-4 px-6 pb-6 flex-grow'>
                    <div className='flex items-center justify-between w-full'>
                        <h1 className='text-sm text-gray-600'>Templates</h1>
                        <ReusableDropdown
                            defaultValue="All Templates"
                            showAllOption={false}
                            options={isDocumentPage ? genDocOptions : isActivitiesPage ? actDocOptions : []}
                            onChange={(e) => handleTemplateFilter(e.target.value)}
                        />
                    </div>

                    <div className='max-h-[25rem] min-h-[10rem] overflow-y-auto overflow-x-hidden w-full'>
                        {data.length > 0 ? (
                            data.map((template) => (
                                template.documents?.map((document) => (
                                    <div
                                        key={document.id}
                                        onClick={() => downloadDocument(document)}
                                        title='Download document'
                                        className='w-full justify-between items-center p-4 flex h-12 border border-mid-gray rounded cursor-pointer hover:bg-gray-100 mb-2'
                                    >
                                        <div className='flex items-center gap-2'>
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className='size-4'
                                                fill="gray"
                                                viewBox="0 0 384 512"
                                            >
                                                <path d="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 288c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128z" />
                                            </svg>
                                            <h1 className='truncate'>
                                                {document?.title || "Document Name"}
                                            </h1>
                                        </div>
                                        <p className='text-sm text-gray-600'>
                                            {document?.documentSize ? `${document.documentSize} MB` : ''}
                                        </p>
                                    </div>
                                ))
                            ))
                        ) : (
                            <div className='p-4 text-center text-gray-600'>
                                No templates available.
                            </div>
                        )}
                    </div>

                    <div className='w-full flex justify-end mt-4'>
                        <Button
                            onClick={() => setInitialPage("upload")}
                            style="secondary"
                        >
                            Next
                        </Button>
                    </div>
                </div>
            ) : initialPage === "upload" ? (
                <div className='px-6 pb-6 flex-grow'>
                    <div
                        onClick={() => setInitialPage("templates")}
                        className='mb-6 flex items-center justify-center rounded-full h-8 w-8 cursor-pointer border border-gray-300 group hover:bg-gray-100'
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className='fill-gray-600 size-4 group-hover:fill-off-black'
                            viewBox="0 0 448 512"
                        >
                            <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
                        </svg>
                    </div>

                    <div className='flex flex-col md:flex-row gap-8 h-full'>
                        {/* Upload Section */}
                        <div className='flex flex-col gap-4 w-full'>
                            <div {...getRootProps()} className='w-full py-4 bg-gray-100 border border-mid-gray rounded flex justify-center cursor-pointer hover:bg-gray-200'>
                                <input {...getInputProps()} />
                                {isDragActive ? (
                                    "Drop the files here..."
                                ) : file ? (
                                    <div className='p-4 bg-background border border-primary rounded flex items-center justify-between text-primary w-full'>
                                        {file.name}
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setFile(null);
                                            }}
                                            className='aspect-square flex items-center justify-center cursor-pointer bg-primary rounded-full hover:bg-primary-dark'
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className='size-4 fill-background'
                                                viewBox="0 0 384 512"
                                            >
                                                <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                                            </svg>
                                        </button>
                                    </div>
                                ) : (
                                    "Drag 'n' drop or click to select files"
                                )}
                            </div>

                            {error && <p className='text-red-500 text-sm'>{error}</p>}

                            <div className='flex justify-end mt-4'>
                                <Button
                                    onClick={handleAddFile}
                                    style="secondary"
                                >
                                    <div className="flex items-center gap-2">
                                        <svg
                                            xmlns="http://www.w3.org/2000/svg"
                                            fill='currentColor'
                                            className='size-4'
                                            viewBox="0 0 448 512"
                                        >
                                            <path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" />
                                        </svg>
                                        Add File
                                    </div>
                                </Button>
                            </div>
                        </div>

                        {/* File List Section */}
                        <div className='flex flex-col gap-4 w-full'>
                            {fileList.length > 0 ? (
                                fileList.map((fileEntry) => (
                                    <div
                                        key={fileEntry.id}
                                        className='p-4 border border-mid-gray rounded flex items-center justify-between hover:bg-gray-50'
                                    >
                                        <span className='truncate'>{fileEntry.file.name}</span>
                                        <button
                                            onClick={() => removeFileFromList(fileEntry.id)}
                                            className='aspect-square flex items-center justify-center cursor-pointer rounded-full hover:bg-gray-200 p-1'
                                        >
                                            <svg
                                                xmlns="http://www.w3.org/2000/svg"
                                                className='size-4 fill-gray-600'
                                                viewBox="0 0 384 512"
                                            >
                                                <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                                            </svg>
                                        </button>
                                    </div>
                                ))
                            ) : (
                                <div className='p-4 text-center text-gray-600'>
                                    No files added yet.
                                </div>
                            )}

                            <Button
                                className={`w-full ${fileList.length === 0 ? 'bg-gray-200 text-gray-500' : ''}`}
                                disabled={fileList.length === 0 || loading}
                                onClick={() => { handleUploadDocuments(); setLoading(true); }}
                            >
                                {loading ? <LoadingSpinner /> : `Upload Documents`}
                            </Button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className='flex-grow flex justify-center items-center'>
                    <div className='text-center'>
                        <h1 className='text-2xl font-bold text-gray-700'>No documents to upload</h1>
                        <p className='text-gray-500'>Please select a document template to upload.</p>
                    </div>
                </div>
            )}
        </div>
    );
}

export default UploadBatchModal;