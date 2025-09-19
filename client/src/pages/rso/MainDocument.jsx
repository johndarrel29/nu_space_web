import { AnimatePresence, motion } from "framer-motion";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DropIn } from "../../animations/DropIn";
import {
    Backdrop,
    Button,
    CloseButton,
    ReusableTable,
    TabSelector, UploadBatchModal
} from '../../components';
import { useModal, useRSODocuments } from '../../hooks';
import useNotification from '../../utils/useNotification';

// add modal confirmation before deleting

function MainDocument() {
    // State and hooks initialization
    const Navigate = useNavigate();

    const {
        error,
        generalDocuments,
        generalDocumentsLoading,
        refetchGeneralDocuments,
        deleteAccreditationDocument,
    } = useRSODocuments();


    const { handleNotification } = useNotification();
    const [activeTab, setActiveTab] = useState(0);
    const { isOpen, openModal, closeModal } = useModal();
    const [modalType, setModalType] = useState("");
    const [selectedDocument, setSelectedDocument] = useState(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [documentToDelete, setDocumentToDelete] = useState(null);
    const user = JSON.parse(localStorage.getItem("user"));
    const userID = user?.id || "";


    /**
     * Formats a date string to a readable format
     * @param {string} dateString - The date string to format
     * @returns {string} Formatted date string
     */
    const formatDate = (dateString) => {
        const options = { year: 'numeric', month: 'long', day: 'numeric' };
        const date = new Date(dateString);
        return date.toLocaleDateString(undefined, options);
    };



    // Prepare table data from documents
    const tableRow = Array.isArray(generalDocuments)
        ? generalDocuments
            .filter(doc => doc.purpose !== "activities")
            .map((doc) => {


                return {
                    id: doc._id,
                    contentType: doc.contentType || '',
                    createdAt: formatDate(doc.createdAt) || '',
                    updatedAt: formatDate(doc.updatedAt) || '',
                    file: doc.file || '',
                    document_status: doc.document_status || '',
                    title: doc.title || '',
                    url: doc.url || '',
                };
            }) :

        [];

    /**
     * Filters documents based on active tab and search query
     * @returns {Array} Filtered list of documents
     */
    const filteredDocuments = () => {
        if (activeTab === 0 && searchQuery === "") {
            return tableRow;
        }

        return tableRow.filter((doc) => {
            const matchesTab = activeTab === 0 ||
                doc.document_status.toLowerCase() === tabs[activeTab].label.toLowerCase();
            const matchesSearch = doc.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesTab && matchesSearch;
        });
    }

    // Tab configuration
    const tabs = [
        { label: "All" },
        {
            label: "Pending"
        },
        {
            label: "Approved",
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 me-2 dark:text-blue-500" fill="currentColor" viewBox="0 0 448 512"><path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 338.7 393.4 105.4c12.5-12.5 32.8-12.5 45.3 0z" /></svg>
        },
        {
            label: "Rejected",
            icon: <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4 me-2 dark:text-blue-500" fill="currentColor" viewBox="0 0 512 512"><path d="M367.2 412.5L99.5 144.8C77.1 176.1 64 214.5 64 256c0 106 86 192 192 192c41.5 0 79.9-13.1 111.2-35.5zm45.3-45.3C434.9 335.9 448 297.5 448 256c0-106-86-192-192-192c-41.5 0-79.9 13.1-111.2 35.5L412.5 367.2zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256z" /></svg>
        },
    ];

    // Event handlers
    const handleDocumentUpload = () => {
        setModalType("upload");
        openModal();
    }

    const handleCloseModal = () => {
        setModalType("");
        closeModal();
    }

    const handleDeleteDocument = (row) => {

        deleteAccreditationDocument({ documentId: row.id }, {
            onSuccess: () => {

                toast.success("Document deleted successfully");
                refetchGeneralDocuments(); // Refresh the document list
            },
            onError: (error) => {
                console.error("Error deleting document:", error);
                toast.error(error.message || "Error deleting document");
            }
        });
    };

    // Note: Upload success handling is managed within UploadBatchModal.

    return (
        <div className='flex flex-col'>
            <div className='w-full flex flex-col md:flex-row justify-between mb-4'>

                <div className='flex justify-start md:order-2 p-2'>
                    <Button onClick={handleDocumentUpload}>
                        <div className='flex items-center gap-2'>
                            <svg xmlns="http://www.w3.org/2000/svg" className='size-4 fill-white' viewBox="0 0 512 512">
                                <path d="M288 109.3L288 352c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-242.7-73.4 73.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l128-128c12.5-12.5 32.8-12.5 45.3 0l128 128c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L288 109.3zM64 352l128 0c0 35.3 28.7 64 64 64s64-28.7 64-64l128 0c35.3 0 64 28.7 64 64l0 32c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64l0-32c0-35.3 28.7-64 64-64zM432 456a24 24 0 1 0 0-48 24 24 0 1 0 0 48z" />
                            </svg>
                            Upload a document
                        </div>
                    </Button>
                </div>

                <TabSelector tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>

            <ReusableTable
                options={["All", "A-Z", "Most Popular"]}
                onClick={(row) => Navigate(`/documents/${row.id}`, { state: { fromRequirements: true, documentId: row.id } })}
                value={""}
                showAllOption={false}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                tableRow={filteredDocuments()}
                error={error}
                isLoading={generalDocumentsLoading}
                tableHeading={[
                    { name: "Title", key: "title" },
                    { name: "Status", key: "document_status" },
                    { name: "Created At", key: "createdAt" },
                    { name: "Action", key: "actions" }
                ]}
                onActionClick={(row) => {
                    setDocumentToDelete(row);
                    setShowDeleteModal(true);
                }}
            />

            {/* Modal Views */}
            <AnimatePresence>
                {/* View Document Modal */}
                {isOpen && modalType === "view" && (
                    <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <motion.div
                            className="bg-white rounded-lg shadow-lg w-[90%] max-w-2xl border border-[#312895]/20"
                            variants={DropIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="p-6">
                                <div className="flex justify-between items-start mb-6">
                                    <h2 className="text-2xl font-bold text-[#312895]">Document Details</h2>
                                    <CloseButton onClick={handleCloseModal} />
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between py-3 border-b border-[#312895]/10">
                                        <span className="text-[#312895]/70 font-medium">Document Name:</span>
                                        <span
                                            onClick={() => {
                                                window.open(selectedDocument.url, "_blank");
                                            }}
                                            className="text-[#312895] font-semibold cursor-pointer hover:underline">{selectedDocument.title}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-3 border-b border-[#312895]/10">
                                        <span className="text-[#312895]/70 font-medium">Document For:</span>
                                        <span className="text-[#312895] font-semibold">Requirements Renewal Request</span>
                                    </div>

                                    <div className="flex items-center justify-between py-3 border-b border-[#312895]/10">
                                        <span className="text-[#312895]/70 font-medium">Upload Date:</span>
                                        <span className="text-[#312895]">{selectedDocument?.createdAt || "Document Date"}</span>
                                    </div>

                                    <div className="flex items-center justify-between py-3 border-b border-[#312895]/10">
                                        <span className="text-[#312895]/70 font-medium">Status:</span>
                                        <span className={`px-3 py-1 rounded-full text-sm font-medium ${selectedDocument?.document_status
                                            === 'approved' ? 'bg-green-100 text-green-800' : selectedDocument?.document_status
                                                === 'pending' ? 'bg-[#FFCC33]/20 text-[#FFCC33]/90' :
                                            'bg-red-100 text-red-800'
                                            }`}>
                                            {selectedDocument?.document_status || "n/a"}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-8 flex justify-end space-x-3">
                                    <Button style={"secondary"} onClick={handleCloseModal}>
                                        Close
                                    </Button>
                                    <Button className="px-6 py-2 bg-[#312895] hover:bg-[#312895]/90 text-white">
                                        Download
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </Backdrop>
                )}
                {/* Upload Document Modal */}
                {isOpen && modalType === "upload" && (
                    <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <motion.div
                            className="bg-white rounded-lg shadow-lg w-[90%] max-w-2xl border border-[#312895]/20"
                            variants={DropIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            {/* <UploadDocumentsModal handleCloseModal={handleCloseModal} /> */}
                            <UploadBatchModal handleCloseModal={handleCloseModal} page={"general"}></UploadBatchModal>
                        </motion.div>
                    </Backdrop>
                )}
                {showDeleteModal && (
                    <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <motion.div
                            className="bg-white rounded-lg shadow-lg w-[70%] max-w-[400px] border border-[#312895]/20"
                            variants={DropIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="p-4">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold mb-4">Confirm Delete</h2>
                                    <CloseButton onClick={() => setShowDeleteModal(false)} />
                                </div>
                                <div className="flex flex-col gap-2">
                                    <p className="text-sm text-gray-600">Are you sure you want to delete the document <span className="font-bold">{documentToDelete?.title}</span>?</p>
                                </div>
                                <div className="flex justify-end mt-8">
                                    <Button onClick={() => setShowDeleteModal(false)} style={"secondary"} className="mr-2">
                                        Cancel
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            handleDeleteDocument(documentToDelete);
                                            setShowDeleteModal(false);
                                        }}
                                        style={"danger"}
                                    >
                                        Confirm Delete
                                    </Button>
                                </div>
                            </div>
                        </motion.div>
                    </Backdrop>
                )}

            </AnimatePresence>
        </div>
    )
}

export default MainDocument