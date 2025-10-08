import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";
import { AnimatePresence, motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DropIn } from "../../animations/DropIn";
import { Backdrop, Button, CloseButton, LoadingSpinner } from '../../components';
import { useAdminActivity, useModal } from '../../hooks';
import { useUserStoreWithAuth } from '../../store';
import { FormatDate } from '../../utils';


export default function ActivityDeadlineBanner({ activity }) {
    const { isUserRSORepresentative, isAVP, isDirector } = useUserStoreWithAuth();
    const { isOpen, openModal, closeModal } = useModal();
    const [modalType, setModalType] = useState(null);
    const [preDocDeadline, setPreDocDeadline] = useState(null);
    const [postDocDeadline, setPostDocDeadline] = useState(null);
    const { activityId } = useParams();
    const [remarks, setRemarks] = useState("");
    const [loading, setLoading] = useState(false);

    const handleCloseModal = useCallback(() => {
        closeModal();
        setModalType(null);
    }, [closeModal]);

    useEffect(() => {
        let timer;
        if (loading) {
            timer = setTimeout(() => {
                setLoading(false);
            }, 5000); // 5 seconds
        }

        return () => clearTimeout(timer);
    }, [loading]);

    const noAccessUsers = (isUserRSORepresentative || isAVP || isDirector);


    const {
        // set pre-document deadline
        preDocumentDeadlineMutate,
        isSettingPreDocumentDeadline,
        isErrorSettingPreDocumentDeadline,
        isPreDocumentDeadlineSet,

        // set post-document deadline
        postDocumentDeadlineMutate,
        isSettingPostDocumentDeadline,
        isErrorSettingPostDocumentDeadline,
        isPostDocumentDeadlineSet,

        // approve activity
        isApprovingActivity,
        isErrorApprovingActivity,
        isActivityApproved,
        approveActivityMutate,

        rejectActivityMutate,
        isRejectingActivity,
        isErrorRejectingActivity,
        isActivityRejected,

        // view admin activity details
        viewAdminActivityData,
        viewAdminActivitySuccess,
        viewAdminActivityLoading,
        refetchViewAdminActivity,
        viewAdminActivityError,
    } = useAdminActivity(activityId);

    console.log("activity banner data: ", activity);

    // Helper booleans for document deadlines
    const isPreOngoing = activity?.Activity_pre_document_deadline?.date_status === 'ongoing';
    const isPostOngoing = activity?.Activity_post_document_deadline?.date_status === 'ongoing';
    const isPreDone = activity?.Activity_pre_document_deadline?.date_status === 'done';
    const isPostDone = activity?.Activity_post_document_deadline?.date_status === 'done';
    const isPreDeadlineNull = activity?.Activity_pre_document_deadline?.end_deadline === null;
    const isPostDeadlineNull = activity?.Activity_post_document_deadline?.end_deadline === null;

    useEffect(() => {
        if (activity?.Activity_pre_document_deadline?.end_deadline) {
            setPreDocDeadline(dayjs(activity.Activity_pre_document_deadline.end_deadline));
        }
        if (activity?.Activity_post_document_deadline?.end_deadline) {
            setPostDocDeadline(dayjs(activity.Activity_post_document_deadline.end_deadline));
        }
    }, [activity]);

    const handleDateSelected = () => {
        // Only compare if the value is valid
        const isPreDocDeadlineValid = preDocDeadline && dayjs(preDocDeadline).isValid();
        const isPostDocDeadlineValid = postDocDeadline && dayjs(postDocDeadline).isValid();

        const isPreDocDeadlineChanged = isPreDocDeadlineValid && dayjs(preDocDeadline).toISOString() !== activity?.Activity_pre_document_deadline?.end_deadline;
        const isPostDocDeadlineChanged = isPostDocDeadlineValid && dayjs(postDocDeadline).toISOString() !== activity?.Activity_post_document_deadline?.end_deadline;

        // check to see if there is a date change
        if (!isPreDocDeadlineValid && !isPostDocDeadlineValid) {
            setLoading(false);
            toast.error("Please select at least one valid deadline to set.");
            return;
        }

        if (!isPreDocDeadlineChanged && !isPostDocDeadlineChanged) {
            setLoading(false);
            toast.error("No changes detected in the selected deadlines.");
            return;
        }

        // Call the mutation to set the deadlines
        if (isPreDocDeadlineValid && isPreDocDeadlineChanged) {
            toast.info("Setting pre-document deadline...");
            setLoading(true);
            preDocumentDeadlineMutate({
                activityId: activity?._id,
                preDocumentDeadline: dayjs(preDocDeadline).toISOString(),
            },
                {
                    onSuccess: (data) => {
                        setLoading(false);
                        console.log('Pre-document deadline updated successfully', data);
                        toast.success('Pre-document deadline updated successfully');
                        refetchViewAdminActivity();
                        // clear the select state and the date state
                        setPreDocDeadline(null);
                        setPostDocDeadline(null);
                        handleCloseModal();
                    },
                    onError: (error) => {
                        setLoading(false);
                        console.error('Error updating pre-document deadline:', error);
                        toast.error(error.message || 'Error updating pre-document deadline');
                    }
                }
            );
        }
        if (isPostDocDeadlineValid && isPostDocDeadlineChanged) {
            toast.info("Setting post-document deadline...");
            setLoading(true);
            postDocumentDeadlineMutate({
                activityId: activity?._id,
                postDocumentDeadline: dayjs(postDocDeadline).toISOString(),
            },
                {
                    onSuccess: () => {
                        setLoading(false);
                        toast.success('Post-document deadline updated successfully');
                        // clear the select state and the date state
                        refetchViewAdminActivity();
                        setPreDocDeadline(null);
                        setPostDocDeadline(null);
                        handleCloseModal();
                    },
                    onError: (error) => {
                        setLoading(false);
                        console.error('Error updating post-document deadline:', error);
                        toast.error(error.message || 'Error updating post-document deadline');
                    }
                }
            );
        }
    }

    return (
        <>
            {(activity?.Activity_pre_document_deadline?.date_status === "ongoing" || activity?.Activity_post_document_deadline?.date_status === "ongoing") && (activity?.Activity_approval_status !== "rejected") && (
                <div
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={!noAccessUsers ? "Click to set or update deadlines" : null}
                    className={`${!noAccessUsers ? "cursor-pointer" : ""} bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 shadow-sm flex items-start gap-3 mb-6 group`}
                    onClick={!noAccessUsers ? (() => { openModal(); setModalType("banner"); }) : null}
                >
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                    <div className="flex flex-col">
                        <span className={`text-blue-800 font-semibold text-base ${!noAccessUsers ? "group-hover:underline" : ""}`}>Pre and Post Documents Opened</span>
                        {/* <span className="text-blue-700 text-sm">You can now upload pre and post documents for this activity.</span> */}
                        <div className='flex items-center gap-2'>
                            {/* <span className="text-blue-700 text-xs mt-1"><span className='font-semibold'>Pre Documents</span> from: {activity?.Activity_pre_document_deadline ? FormatDate(activity.Activity_pre_document_deadline.start_deadline) : "No deadline set"}</span> */}
                            <span className="text-blue-700 text-xs mt-1"><span className='font-semibold'>Pre Documents Deadline </span> </span>
                            <div className='h-4 w-px bg-blue-200'></div>
                            <span className="text-blue-700 text-xs mt-1">Until: {activity?.Activity_pre_document_deadline ? FormatDate(activity.Activity_pre_document_deadline.end_deadline) : "No deadline set"}</span>
                        </div>
                        <div className='flex items-center gap-2 mt-1'>
                            {/* <span className="text-blue-700 text-xs"><span className='font-semibold'>Post Documents</span> from: {activity?.Activity_post_document_deadline ? FormatDate(activity.Activity_post_document_deadline.start_deadline) : "No deadline set"}</span> */}
                            <span className="text-blue-700 text-xs"><span className='font-semibold'>Post Documents Deadline </span> </span>
                            <div className='h-4 w-px bg-blue-200'></div>
                            <span className="text-blue-700 text-xs">Until: {activity?.Activity_post_document_deadline ? FormatDate(activity.Activity_post_document_deadline.end_deadline) : "No deadline set"}</span>
                        </div>
                    </div>
                </div>
            )}
            {(isPreDone || isPostDone) && !(isPreOngoing || isPostOngoing) && (activity.Activity_approval_status !== 'pending') && (
                <div className="bg-green-50 border border-green-200 rounded-lg px-6 py-4 shadow-sm flex items-start gap-3 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-500 flex-shrink-0" viewBox="0 0 512 512"><path fill="currentColor" d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm113 169.1-128 144a16 16 0 0 1-11.4 5.3h-.4a16 16 0 0 1-11.3-4.7l-64-64a16 16 0 1 1 22.6-22.6l52.3 52.3 116.7-131.3a16 16 0 1 1 23.5 21z" /></svg>
                    <div className="flex flex-col">
                        <span className="text-green-800 font-semibold text-base">Document Submission Closed</span>
                        {(!isPreDeadlineNull && !isPostDeadlineNull) && (
                            <span className="text-green-700 text-sm">The submission period has ended. The admin will now undergo activity approval.</span>
                        )}
                        {(isPreDeadlineNull && isPostDeadlineNull) && (
                            <span className="text-green-700 text-sm">This is a GPOA Activity. The documents submission deadlines are not applicable.</span>
                        )}
                        <div className='flex flex-col mt-2 gap-1'>
                            {isPreDone && (!isPreDeadlineNull && !isPostDeadlineNull) && (
                                <span className="text-green-700 text-xs">Pre Documents submission closed: {activity?.Activity_pre_document_deadline?.end_deadline ? FormatDate(activity.Activity_pre_document_deadline.end_deadline) : 'N/A'}</span>
                            )}
                            {isPostDone && (!isPreDeadlineNull && !isPostDeadlineNull) && (
                                <span className="text-green-700 text-xs">Post Documents submission closed: {activity?.Activity_post_document_deadline?.end_deadline ? FormatDate(activity.Activity_post_document_deadline.end_deadline) : 'N/A'}</span>
                            )}

                        </div>
                    </div>
                </div>
            )}

            {activity?.Activity_approval_status === "rejected" && (
                <div
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content={!noAccessUsers ? "Click to set or update deadlines" : null}
                    onClick={!noAccessUsers ? (() => { openModal(); setModalType("banner"); }) : null}
                    className={`bg-red-50 border border-red-200 rounded-lg px-6 py-4 shadow-sm flex items-start gap-3 mb-6 group ${!noAccessUsers ? "cursor-pointer" : ""}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-red-500 flex-shrink-0" viewBox="0 0 512 512"><path fill="currentColor" d="M256 48C141.1 48 48 141.1 48 256s93.1 208 208 208 208-93.1 208-208S370.9 48 256 48zm0 320c-17.7 0-32-14.3-32-32s14.3-32 32-32 32 14.3 32 32-14.3 32-32 32zm16-112c0 8.8-7.2 16-16 16s-16-7.2-16-16V176c0-8.8 7.2-16 16-16s16 7.2 16 16v80z" /></svg>
                    <div className="flex flex-col">
                        <span className={`text-red-800 font-semibold text-base ${!noAccessUsers ? "group-hover:underline" : ""}`}>Activity Rejected</span>
                        <span className="text-red-700 text-sm">This activity was rejected. Please contact the admin to adjust the deadlines.</span>
                    </div>
                </div>
            )}

            {/* Modals */}
            <AnimatePresence>
                {/* Empty Modal for Banner Click */}
                {modalType === "banner" && (
                    <>
                        <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" />
                        <motion.div
                            className="fixed inset-0 z-50 w-screen overflow-auto"
                            variants={DropIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="fixed inset-0 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg p-6 w-1/3 shadow-xl border border-mid-gray">

                                    <div className='flex justify-between items-center mb-6'>
                                        <h2 className="text-lg font-medium text-[#312895]">Set Activity Deadlines</h2>
                                        <CloseButton onClick={() => { handleCloseModal(); setLoading(false); }} />
                                    </div>
                                    {/* Deadline fields */}
                                    <div className='space-y-4'>
                                        <div className="w-full">
                                            <div className="mb-4 w-full">
                                                <label htmlFor="activity-select" className="block text-sm font-medium text-gray-700">Activity Name</label>
                                                <div className='px-2 py-2 border border-gray-300 rounded-md mt-1 bg-gray-50'>
                                                    <h1>{activity?.Activity_name || "No Activity Selected"}</h1>
                                                </div>
                                            </div>
                                            {console.log("Pre-document deadline state:", preDocDeadline)}
                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                                <div className="w-full">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Pre Document Deadline</label>
                                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                        <DateTimePicker
                                                            value={preDocDeadline}
                                                            onChange={setPreDocDeadline}
                                                            className="w-full"
                                                            slotProps={{
                                                                textField: {
                                                                    fullWidth: true,
                                                                    size: 'small',
                                                                    variant: 'outlined'
                                                                }
                                                            }}
                                                        />
                                                    </LocalizationProvider>
                                                </div>
                                                <div className="w-full">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Post Document Deadline</label>
                                                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                                                        <DateTimePicker
                                                            value={postDocDeadline}
                                                            onChange={setPostDocDeadline}
                                                            className="w-full"
                                                            slotProps={{
                                                                textField: {
                                                                    fullWidth: true,
                                                                    size: 'small',
                                                                    variant: 'outlined'
                                                                }
                                                            }}
                                                        />
                                                    </LocalizationProvider>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    {/* Button to log deadlines */}
                                    <div className="flex justify-end mt-6 gap-3">
                                        <Button
                                            disabled={loading || (!preDocDeadline && !postDocDeadline)}
                                            onClick={() => { handleDateSelected(); setLoading(true); }}
                                            style="primary"
                                        >
                                            {loading ? <LoadingSpinner /> : 'Set Deadlines'}
                                        </Button>
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