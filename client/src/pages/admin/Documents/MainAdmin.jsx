import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { DropIn } from "../../../animations/DropIn";
import { Backdrop, BackendTable, Button, CloseButton, LoadingSpinner, TabSelector } from "../../../components";
import { useAcademicYears, useAdminDocuments, useAdminRSO } from "../../../hooks";
import { useUserStoreWithAuth } from '../../../store';

// todo: change the data to PH standard time for start and end date.

export default function MainAdmin() {
    const navigate = useNavigate();
    const tabs = [
        { label: "All" },
        { label: "Recognition Documents" },
        { label: "Activity Documents" }
    ]
    const accreditations = [
        { label: "Set Accreditation Deadline" },
        { label: "Accreditation Records" }
    ]
    const [activeTab, setActiveTab] = useState(0);
    const [accreditationTab, setAccreditationTab] = useState(0);
    const [loading, setLoading] = useState(false);
    const { isUserRSORepresentative, isUserAdmin, isCoordinator } = useUserStoreWithAuth();
    const {

        // Set Accreditation Deadline
        refetchSetAccreditationDeadline,
        setAccreditationDeadline,
        setAccreditationDeadlineError,
        setAccreditationDeadlineSuccess
    } = useAdminDocuments();
    const {
        academicYears,
        academicYearsLoading,
        academicYearsError,
        academicYearsErrorMessage,
        refetchAcademicYears,
        isRefetchingAcademicYears,
        isAcademicYearsFetched,
    } = useAcademicYears();

    const {
        accreditationData,
        isAccreditationDataLoading,
        isAccreditationDataError,
        accreditationDataError,
        refetchAccreditationData,
    } = useAdminRSO();

    // new state for deadline modal (replaced with static fields)
    const [deadlineOpen, setDeadlineOpen] = useState(false);
    const [selectedAcademicYear, setSelectedAcademicYear] = useState("");
    const [modalData, setModalData] = useState({
        start_deadline: "",
        end_deadline: "",
        category: "",
        probationary: false,
        academicYearId: ""
    });

    useEffect(() => {
        if (academicYears?.status?.upcomingAY?._id) {
            setSelectedAcademicYear(academicYears.status.upcomingAY._id);
            setModalData(prev => ({
                ...prev,
                academicYearId: academicYears.status.upcomingAY._id
            }))
        }
    }, [academicYears]);

    useEffect(() => {
        console.log("the modal data is", modalData);
    }, [modalData]);

    const onTabChange = (index) => {
        setActiveTab(index);
    }

    const openDeadlineModal = () => {
        // open the deadline modal (static for now)
        setDeadlineOpen(true);
    }

    const handleCloseDeadline = () => {
        setDeadlineOpen(false);
    }

    const handleSaveDeadline = () => {
        // kept for compatibility; use handleSubmit to log/submit modal data
        handleSubmit();
    }

    const handleSubmit = (data = modalData) => {
        try {
            // For now just log the modal data. Pass probationary as boolean.
            console.log("Modal submit:", {
                ...data,
                probationary: data.probationary
            });

            const dataToSubmit = {
                ...data,
                probationary: data.probationary
            };

            setAccreditationDeadline(
                dataToSubmit
                ,
                {
                    onSuccess: (data) => {
                        setLoading(false);
                        console.log("Accreditation deadline set successfully:", data);
                        toast.success("Accreditation deadline set successfully");
                        setDeadlineOpen(false);
                    },
                    onError: (error) => {
                        setLoading(false);
                        console.error("Error setting accreditation deadline:", error);
                        toast.error("Failed to set accreditation deadline");
                    }
                }
            );
        } catch (error) {
            console.error("Error submitting accreditation deadline:", error);
            toast.error("Failed to submit accreditation deadline");
        } finally {
            setLoading(false);
        }


    }

    const handleAcademicYearChange = (e) => {
        setSelectedAcademicYear(e.target.value);
        setModalData(
            prev => ({
                ...prev,
                academicYearId: e.target.value
            })
        );
    }
    const categories = [
        { label: "Professional & Affiliates", value: "Professional & Affiliates" },
        { label: "Professional", value: "Professional" },
        { label: "Special Interest", value: "Special Interest" },
        { label: "Office Aligned Organization", value: "Office Aligned Organization" },

    ]

    return (
        <div>
            <div className="flex flex-col-reverse sm:flex-row justify-start sm:justify-between items-stretch sm:items-center w-full mb-4 gap-3">
                <TabSelector tabs={tabs} activeTab={activeTab} onTabChange={onTabChange} />
                {(isUserAdmin || isCoordinator) && (
                    <div className="flex gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
                        <Button style={"secondary"} onClick={() => {
                            // Navigate to templates page
                            openDeadlineModal();
                        }}>
                            <div className="flex gap-2 items-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="current" viewBox="0 0 640 640"><path d="M128 96C128 78.3 142.3 64 160 64L480 64C497.7 64 512 78.3 512 96C512 113.7 497.7 128 480 128L480 139C480 181.4 463.1 222.1 433.1 252.1L365.2 320L433.1 387.9C463.1 417.9 480 458.6 480 501L480 512C497.7 512 512 526.3 512 544C512 561.7 497.7 576 480 576L160 576C142.3 576 128 561.7 128 544C128 526.3 142.3 512 160 512L160 501C160 458.6 176.9 417.9 206.9 387.9L274.8 320L206.9 252.1C176.9 222.1 160 181.4 160 139L160 128C142.3 128 128 113.7 128 96zM224 128L224 139C224 164.5 234.1 188.9 252.1 206.9L320 274.8L387.9 206.9C405.9 188.9 416 164.5 416 139L416 128L224 128zM224 512L416 512L416 501C416 475.5 405.9 451.1 387.9 433.1L320 365.2L252.1 433.1C234.1 451.1 224 475.5 224 501L224 512z" /></svg>
                                Accreditation Deadline
                            </div>
                        </Button>
                        <Button style={"secondary"} onClick={() => {
                            // Navigate to templates page
                            navigate("templates");
                        }}>Document Templates</Button>
                    </div>
                )}
            </div>
            {<BackendTable activeTab={activeTab} />}

            {/* Deadline Modal */}
            <AnimatePresence>
                {deadlineOpen && (
                    <>
                        <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" />
                        <motion.div
                            className="fixed inset-0 z-50 w-screen overflow-auto flex items-center justify-center p-4"
                            variants={DropIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="bg-white rounded-lg p-6 w-full max-w-lg shadow-xl border border-[#312895]/20">
                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-lg font-semibold">Set Document Deadline</h2>
                                    <CloseButton onClick={handleCloseDeadline} />
                                </div>

                                <TabSelector tabs={accreditations} activeTab={accreditationTab} onTabChange={setAccreditationTab} />

                                {accreditationTab === 0 && (
                                    <div>
                                        <div className="space-y-4 mt-4">
                                            {console.log("accreditation data", accreditationData)}
                                            <div className="mb-8 border-b border-gray-300 pb-4">

                                                <label htmlFor="category-filter" className="text-sm font-medium text-gray-600">For Upcoming Academic Year</label>
                                                {/* <select
                                            id="category-filter"
                                            value={selectedAcademicYear}
                                            onChange={handleAcademicYearChange}
                                            className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
                                        >
                                            <option value="">-- Select Academic Year --</option>
                                            {academicYears?.years?.map((option) => (
                                                <option key={option._id} value={option._id}>
                                                    {option.label}
                                                </option>
                                            ))}
                                        </select> */}
                                                <div className="mt-2 text-off-black text-sm w-full flex justify-start py-2 px-3 border border-dashed border-gray-300 rounded bg-background">
                                                    {academicYears?.status?.upcomingAY?.label}
                                                </div>
                                            </div>
                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">Start Deadline</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full border rounded px-3 py-2 text-sm"
                                                    value={modalData.start_deadline}
                                                    onChange={(e) => {
                                                        setModalData(prev => ({
                                                            ...prev,
                                                            start_deadline: e.target.value
                                                        }))
                                                    }}
                                                />
                                            </div>

                                            <div>
                                                <label className="block text-sm text-gray-600 mb-1">End Deadline</label>
                                                <input
                                                    type="datetime-local"
                                                    className="w-full border rounded px-3 py-2 text-sm"
                                                    value={modalData.end_deadline}
                                                    onChange={(e) => {
                                                        setModalData(prev => ({
                                                            ...prev,
                                                            end_deadline: e.target.value
                                                        }))
                                                    }}
                                                />
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <input
                                                    id="probationary"
                                                    type="checkbox"
                                                    checked={modalData.probationary}
                                                    onChange={(e) => setModalData(prev => ({ ...prev, probationary: e.target.checked }))}
                                                    className="h-4 w-4"
                                                />
                                                <label htmlFor="probationary" className="text-sm text-gray-700">Probationary</label>
                                            </div>

                                            <div className="flex flex-col">

                                                {/* Category dropdown field */}
                                                <label htmlFor="category-dropdown" className="text-sm font-medium text-gray-600 mt-3">Category</label>
                                                <select
                                                    id="category-dropdown"
                                                    value={modalData.category}
                                                    onChange={(e) => setModalData(prev => ({ ...prev, category: e.target.value }))}
                                                    className="py-2 px-3 border border-gray-300 bg-white rounded-md shadow-sm focus:outline-none focus:ring-primary focus:border-primary text-sm"
                                                >
                                                    <option value="">-- Select Option --</option>
                                                    {categories?.map((category, index) => (
                                                        <option key={index} value={category.value}>
                                                            {category.label}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                        {console.log("error ", setAccreditationDeadlineError)}
                                        {/* error message */}
                                        {setAccreditationDeadlineError && (
                                            <div className="mt-4 text-sm text-red-600">
                                                {setAccreditationDeadlineError.message}
                                            </div>
                                        )}

                                        <div className="flex justify-end mt-6 gap-2">
                                            <Button onClick={handleCloseDeadline} style={"secondary"}>Cancel</Button>
                                            <Button disabled={loading} onClick={() => { handleSubmit(); setLoading(true); }}>
                                                {loading ? <LoadingSpinner /> : "Save"}
                                            </Button>
                                        </div>

                                    </div>
                                )}

                                {accreditationTab === 1 && (
                                    <div className="overflow-y-auto max-h-[400px] mt-4">
                                        <div className="space-y-3">
                                            {isAccreditationDataLoading ? (
                                                <div className="flex justify-center">
                                                    <LoadingSpinner></LoadingSpinner>
                                                </div>
                                            ) : (
                                                accreditationData?.data?.map((item, i) => (
                                                    <div
                                                        className="w-full bg-white rounded border border-gray-200 p-3 flex flex-col gap-1"
                                                        key={i}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-base font-medium text-gray-800">{item.category}</span>
                                                                <span className="text-xs text-gray-500">{item.totalRSOs} RSOs</span>
                                                            </div>
                                                            <span className={`px-2 py-1 rounded text-xs font-semibold ${item.date_status === 'ongoing' ? 'bg-green-100 text-green-700' : item.date_status === 'done' ? 'bg-gray-100 text-gray-700' : 'bg-yellow-100 text-yellow-700'}`}>{item.date_status}</span>
                                                        </div>
                                                        <div className="flex flex-col sm:flex-row gap-2 sm:gap-6 mt-1">
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-gray-400">Start Deadline</span>
                                                                <span className="text-xs text-gray-700">{new Date(item.start_deadline).toLocaleString()}</span>
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-xs text-gray-400">End Deadline</span>
                                                                <span className="text-xs text-gray-700">{new Date(item.end_deadline).toLocaleString()}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))
                                            )}
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
