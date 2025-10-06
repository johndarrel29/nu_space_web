import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import { DropIn } from "../../animations/DropIn";
import { Backdrop, Button, CloseButton, LoadingSpinner } from "../../components";
import { useRSOUsers } from "../../hooks";

export default function FormReviewModal({ userModalData, isOpen, onClose }) {
    const [isUserModalOpen, setIsUserModalOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [rejecting, setRejecting] = useState(false);
    const location = useLocation();
    const isOnActivityDetailsPage = location.pathname.startsWith("/activities/");

    const {
        rsoApplicants,
        isErrorFetchingApplicants,
        isLoadingApplicants,
        errorFetchingApplicants,
        isRefetchingApplicants,
        refetchApplicants,

        approveMembership,
        isApprovingMembership,
        isErrorApprovingMembership,
        errorApprovingMembership,
        isSuccessApprovingMembership,
    } = useRSOUsers();

    const handleCloseUserModal = () => {
        onClose();
    };

    const handleApproveMembership = () => {
        setLoading(true);
        try {
            approveMembership({ id: userModalData.applicationId, approval: true }, {
                onSuccess: () => {
                    refetchApplicants();
                    setLoading(false);
                    // Optionally close the modal or give feedback
                    toast.success("Membership approved successfully");
                    onClose();
                },
                onError: (error) => {
                    setLoading(false);
                    console.error("Error approving membership:", error);
                    toast.error("Failed to approve membership. Please try again.");
                }

            })

        } catch (error) {
            setLoading(false);
            console.error("Error approving membership:", error);
            toast.error("Failed to approve membership. Please try again.");
        } finally {
            setLoading(false);
        }

    }

    const handleRejectMembership = () => {
        setRejecting(true);
        try {
            console.log("Reject Membership clicked for user ID:", userModalData.applicationId);
            // Implement reject logic here
            approveMembership({ id: userModalData.applicationId, approval: false }, {
                onSuccess: () => {
                    setRejecting(false);
                    refetchApplicants();
                    toast.success("Membership rejected successfully");
                    onClose();
                },
                onError: (error) => {
                    setRejecting(false);
                    console.error("Error rejecting membership:", error);
                    toast.error("Failed to reject membership. Please try again.");
                }
            })
        } catch (error) {
            console.error("Error rejecting membership:", error);
            throw error;
        } finally {
            setRejecting(false);
        }

    };

    return (
        <>
            <AnimatePresence>
                {isOpen && (
                    <>
                        <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" />
                        <motion.div
                            className="fixed inset-0 z-50 w-screen overflow-auto"
                            variants={DropIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="fixed inset-0 flex items-start justify-center z-50 p-8">
                                <div className="bg-white rounded-lg w-full max-w-5xl shadow-lg flex flex-col md:flex-row gap-6 p-8 max-h-[85vh] overflow-hidden">
                                    {/* Main Content: Form Review */}
                                    <div className="flex-1 flex flex-col min-h-0">
                                        <div className="flex items-center justify-between mb-6">
                                            <h2 className="text-xl font-semibold text-[#312895]">Application Review</h2>
                                        </div>
                                        {/* Scrollable responses container */}
                                        <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[70vh]">
                                            {userModalData.pages.length === 0 && (
                                                <p className="text-sm text-gray-500">No responses available.</p>
                                            )}
                                            {/* Pages rendered as form sections */}
                                            {userModalData.pages.map((page) => (
                                                <div
                                                    key={page.pageIndex}
                                                    className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm"
                                                >
                                                    <div className="flex items-center justify-between mb-4">
                                                        <h3 className="text-sm font-semibold text-gray-800 capitalize">
                                                            {page.title || `Untitled Page`}
                                                        </h3>
                                                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                                                            {page.elements.length} item{page.elements.length !== 1 && 's'}
                                                        </span>
                                                    </div>
                                                    {page.elements.length === 0 && (
                                                        <p className="text-sm text-gray-500 italic">No content available.</p>
                                                    )}
                                                    {page.elements.length > 0 && (
                                                        <dl className="divide-y divide-gray-100">
                                                            {page.elements.map((item, idx) => (
                                                                <div
                                                                    key={item.elementIndex || idx}
                                                                    className="py-3 grid grid-cols-12 gap-4"
                                                                >
                                                                    <dt className="col-span-12 md:col-span-5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                                                                        {item.title || `Question ${idx + 1}`}
                                                                    </dt>
                                                                    <dd
                                                                        className="col-span-12 md:col-span-7 text-sm text-gray-900 whitespace-pre-wrap break-words"
                                                                        title={item.answer}
                                                                    >
                                                                        {item.answer === "" || item.answer === null
                                                                            ? <span className="italic text-gray-400">No answer</span>
                                                                            : item.answer}
                                                                    </dd>
                                                                </div>
                                                            ))}
                                                        </dl>
                                                    )}
                                                </div>
                                            ))}
                                        </div>

                                    </div>

                                    {/* Sidebar: Member Info + Actions */}
                                    <div className="w-full md:w-72 flex-shrink-0">
                                        <div className="w-full flex justify-end mb-4">
                                            <CloseButton onClick={handleCloseUserModal} />
                                        </div>
                                        <div className="border border-gray-200 rounded-lg p-5 space-y-6">
                                            <div>
                                                <h3 className="text-sm font-semibold text-gray-700 tracking-wide mb-3">Member Info</h3>
                                                <table className="w-full text-sm">
                                                    <tbody>
                                                        <tr>
                                                            <td className="py-2 pr-4 text-gray-500 align-top">Full Name</td>
                                                            <td className="py-2 font-medium">{userModalData.fullName}</td>
                                                        </tr>
                                                        <tr>
                                                            <td className="py-2 pr-4 text-gray-500 align-top">Applicant No.</td>
                                                            <td className="py-2 font-medium">{userModalData.index}</td>
                                                        </tr>
                                                    </tbody>
                                                </table>
                                            </div>
                                            {!isOnActivityDetailsPage && (
                                                <div className="pt-4 border-t border-gray-200">
                                                    <h4 className="text-sm font-semibold text-gray-700 mb-2">Action</h4>
                                                    <div className="flex flex-col gap-3">
                                                        <Button
                                                            disabled={isApprovingMembership || loading}
                                                            onClick={() => { handleApproveMembership(); setLoading(true); }}
                                                            className="w-full"
                                                        >
                                                            {loading ? <LoadingSpinner /> : 'Approve Membership'}
                                                        </Button>
                                                        <Button
                                                            onClick={() => { handleRejectMembership(); setRejecting(true); }}
                                                            disabled={rejecting || loading}
                                                            style={"secondary"}
                                                            className="w-full"
                                                        >
                                                            {rejecting ? <LoadingSpinner /> : <div className="flex items-center justify-center gap-2">
                                                                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-off-black" viewBox="0 0 640 640"><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" /></svg>
                                                                Reject Membership
                                                            </div>}
                                                        </Button>
                                                    </div>
                                                </div>
                                            )}
                                            <div className="pt-4 border-t border-mid-gray">
                                                <Button
                                                    onClick={handleCloseUserModal}
                                                    style="secondary"
                                                    className="w-full"
                                                >
                                                    Close
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    )
}