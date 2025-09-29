import { AnimatePresence, motion } from "framer-motion";
import { useState } from "react";
import Select from 'react-select';
import { toast } from "react-toastify";
import { DropIn } from "../../../animations/DropIn";
import { Backdrop, Button, CloseButton, ReusableTable, TabSelector, TextInput } from "../../../components";
import { useAdminNotification, useAdminRSO, useModal, useRSONotification } from "../../../hooks";
import { useUserStoreWithAuth } from '../../../store';
import { FormatDate } from "../../../utils";

function AnnouncementsPage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState(0); // added active tab state
    const { isUserRSORepresentative, isUserAdmin, isCoordinator } = useUserStoreWithAuth();
    const [selectedRSOs, setSelectedRSOs] = useState([]);

    const {
        rsoData,
        isRSOLoading,
        isRSOError,
        rsoError,
        refetchRSOData,
    } = useAdminRSO({ manualEnable: true }); // manual enable to control when to fetch

    console.log("RSO Data: ", rsoData);

    const {
        // get notifications
        notificationsData,
        notificationsLoading,
        notificationsError,
        notificationsErrorDetails,

        postRSONotification,
        postRSONotificationLoading,
        postRSONotificationError,
        postRSONotificationErrorDetails,

        rsoCreatedNotificationsData,
        rsoCreatedNotificationsLoading,
        rsoCreatedNotificationsError,
        rsoCreatedNotificationsErrorDetails,
        refetchRSOCreatedNotifications
    } = useRSONotification({ userId: user?.id });

    const {
        postNotification,
        postNotificationLoading,
        postNotificationError,
        postNotificationErrorDetails,

        sentNotificationsData,
        sentNotificationsLoading,
        sentNotificationsError,
        sentNotificationsErrorDetails,

        postSpecificRSONotification,
        postSpecificRSONotificationLoading,
        postSpecificRSONotificationError,
        postSpecificRSONotificationErrorDetails,
    } = useAdminNotification({ userId: user?.id });

    console.log("Notifications for rso Data: ", rsoCreatedNotificationsData);


    const { isOpen, openModal, closeModal } = useModal();
    const [error, setError] = useState(null);

    // Add state for the details modal
    const [selectedAnnouncement, setSelectedAnnouncement] = useState(null);
    const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

    // Helper to safely format createdBy which may be an array, object, string, or undefined
    const formatCreatedBy = (createdBy) => {
        if (Array.isArray(createdBy)) {
            return createdBy
                .map(c => {
                    if (c == null) return null;
                    if (typeof c === 'string') return c;
                    if (typeof c === 'object') {
                        // Try common name fields
                        return [c.firstName, c.lastName].filter(Boolean).join(' ') || c.name || c.username || c.email || null;
                    }
                    return null;
                })
                .filter(Boolean)
                .join(', ');
        }
        if (createdBy && typeof createdBy === 'object') {
            return [createdBy.firstName, createdBy.lastName].filter(Boolean).join(' ') || createdBy.name || createdBy.username || createdBy.email || '—';
        }
        if (typeof createdBy === 'string') return createdBy;
        return '—';
    };

    const tableRow = notificationsData?.data?.map((notification) => ({
        title: notification.title,
        // Truncate content for table display (show only first 50 chars)
        message: notification.message?.length > 50
            ? `${notification.message.substring(0, 50)}...`
            : notification.message,
        createdBy: formatCreatedBy(notification.createdBy),
        createdAt: FormatDate(notification.createdAt),
        notifType: notification.data?.type,
        // Store the full data for the modal
        fullData: notification
    })) || [];

    // Mock sent notifications data (tableRowSent)
    const tableRowSent = sentNotificationsData?.announcements?.map((notification) => ({
        title: notification.title,
        // Truncate content for table display (show only first 50 chars)
        message: notification.content?.length > 50
            ? `${notification.content.substring(0, 50)}...`
            : notification.content,
        createdBy: formatCreatedBy(notification.createdBy),
        createdAt: FormatDate(notification.createdAt),
        notifType: null,
        // Store the full data for the modal
        fullData: notification
    })) || [];

    const tableRowRSO = Array.isArray(rsoCreatedNotificationsData?.RSOSpace)
        ? rsoCreatedNotificationsData.RSOSpace.map(n => ({
            title: n.title,
            message: n.content?.length > 50 ? n.content.substring(0, 50) + '...' : n.content,
            createdBy: formatCreatedBy(n.createdBy),
            createdAt: FormatDate(n.createdAt),
            notifType: n.data?.type,
            fullData: n
        }))
        : [];

    // const rowsToDisplay = activeTab === 0 ? tableRow : isUserRSORepresentative && activeTab === 1 ? tableRowRSO : tableRowSent;
    const rowsToDisplay = tableRowSent;

    console.log("selectedRSOs:", selectedRSOs);

    const announcementHeading = [
        {
            "key": "title",
            "name": "Title"
        },
        {
            "key": "message",
            "name": "Message"
        },
        {
            "key": "createdAt",
            "name": "Date"
        },
        {
            "key": "notifType",
            "name": "Type"
        },
    ];

    // Handle row click to show details modal
    const handleRowClick = (row) => {
        setSelectedAnnouncement(row.fullData);
        setIsDetailsModalOpen(true);
    };

    // Close details modal
    const closeDetailsModal = () => {
        setIsDetailsModalOpen(false);
        setSelectedAnnouncement(null);
    };

    const handleNotification = () => {
        if (!title || !description) {
            setError("Please fill in all fields.");
            return;
        }

        if (isUserAdmin || isCoordinator) {
            if (selectedRSOs.length === 0) {
                postNotification({ title, content: description },
                    {
                        onSuccess: () => {
                            toast.success("Announcement created successfully!");
                            console.log("Notification posted successfully");
                            // Reset form + close
                            setTitle("");
                            setDescription("");
                            closeModal();
                        },
                        onError: (err) => {
                            setError(err.message || "Failed to create announcement.");
                            toast.error(`Error: ${err.message || "Failed to create announcement."}`);
                        }
                    }
                );
            } else {
                postSpecificRSONotification({ title, content: description, rsoIds: selectedRSOs },
                    {
                        onSuccess: () => {
                            toast.success("Announcement created successfully!");
                            console.log("RSO-specific notification posted successfully");
                            // Reset form + close
                            setTitle("");
                            setDescription("");
                            setSelectedRSOs([]);
                            closeModal();
                        },
                        onError: (err) => {
                            setError(err.message || "Failed to create announcement.");
                            toast.error(`Error: ${err.message || "Failed to create announcement."}`);
                        }
                    }
                );
            }
        } else if (isUserRSORepresentative) {
            postRSONotification({ title, content: description },
                {
                    onSuccess: () => {
                        toast.success("Announcement created successfully!");
                        refetchRSOCreatedNotifications();
                        // Reset form + close
                        setTitle("");
                        setDescription("");
                        closeModal();
                        console.log("RSO representative notification posted successfully");
                    },
                    onError: (err) => {
                        setError(err.message || "Failed to create announcement.");
                        toast.error(`Error: ${err.message || "Failed to create announcement."}`);
                    }
                }
            );
        }
    };

    const notificationTab =
        [
            { label: "Sent" }
        ];

    // TEMP: Using mock RSO options for testing instead of live API data
    // Restore original mapping below when backend is ready:
    const rsos = rsoData?.rsos?.map((rso) => ({
        value: rso.rsoId || rso.id,
        label: rso.RSO_snapshot?.name || 'Unnamed RSO'
    })) || [];

    const handleSelectedRSOs = (selectedOptions) => {
        console.log("Selected RSOs:", selectedOptions);
        // You can store selected RSOs in state if needed
        setSelectedRSOs(selectedOptions.map(option => option.value));
    }

    return (
        <>
            <div className="flex flex-col md:flex-row justify-between mb-4">
                <div className='flex justify-start md:order-2 p-2'>
                    <Button onClick={openModal}>Create an Announcement</Button>
                </div>
                <TabSelector tabs={notificationTab} activeTab={activeTab} onTabChange={setActiveTab} />
            </div>
            <div >
                <ReusableTable
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    columnNumber={3}
                    tableHeading={announcementHeading}
                    tableRow={rowsToDisplay}
                    onClick={handleRowClick}
                    isLoading={false}
                    options={["All", "Latest", "Oldest"]}
                    error={null}
                />
            </div>

            {/* Create Announcement Modal */}
            <AnimatePresence
                initial={false}
                exitBeforeEnter={true}
                onExitComplete={() => null}
            >
                {isOpen && (
                    <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <motion.div
                            className="bg-white overflow-hidden rounded-lg shadow-lg w-[90%] max-w-[600px] p-4"
                            variants={DropIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold mb-4">Create Announcement</h2>
                                <CloseButton onClick={closeModal} />
                            </div>
                            <div className="space-y-4">
                                {(isUserAdmin || isCoordinator) && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Select RSO</h3>
                                        <Select
                                            isMulti
                                            className="basic-multi-select"
                                            onChange={handleSelectedRSOs}
                                            options={rsos} />
                                    </div>
                                )}
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Title</h3>
                                    <TextInput
                                        label="Title"
                                        placeholder="Make a title for your announcement"
                                        onChange={(e) => setTitle(e.target.value)}
                                        value={title}
                                        onClick={() => setError(null)}
                                    />
                                </div>
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Content</h3>
                                    <textarea
                                        rows="4"
                                        name="announcement_description"
                                        className="bg-textfield border border-mid-gray text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        placeholder="Write your announcement here"
                                        onChange={(e) => setDescription(e.target.value)}
                                        value={description}
                                        onClick={() => setError(null)}
                                    />
                                </div>
                            </div>
                            <div className="flex items-center justify-end mt-4 gap-2">
                                {error && (
                                    <div className="text-red-500 text-sm mb-2">
                                        {error}
                                    </div>
                                )}
                                <Button
                                    style="secondary"
                                    onClick={closeModal}
                                    className="ml-2"
                                >
                                    Cancel
                                </Button>
                                <Button
                                    onClick={handleNotification}
                                >
                                    Create Announcement
                                </Button>
                            </div>
                        </motion.div>
                    </Backdrop>
                )}
            </AnimatePresence>

            {/* View Details Modal */}
            <AnimatePresence
                initial={false}
                exitBeforeEnter={true}
                onExitComplete={() => null}
            >
                {isDetailsModalOpen && selectedAnnouncement && (
                    <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                        <motion.div
                            className="bg-white overflow-hidden rounded-lg shadow-lg w-[90%] max-w-[600px] p-4"
                            variants={DropIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold">Announcement Details</h2>
                                <CloseButton onClick={closeDetailsModal} />
                            </div>

                            <div className="space-y-5">
                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Title</h3>
                                    <p className="text-base font-medium break-words">
                                        {selectedAnnouncement.title || "—"}
                                    </p>
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Message / Content</h3>
                                    <p className="text-sm whitespace-pre-wrap break-words">
                                        {selectedAnnouncement.message ||
                                            selectedAnnouncement.content ||
                                            "—"}
                                    </p>
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Type</h3>
                                        <p className="text-sm capitalize">
                                            {selectedAnnouncement?.data?.type || "—"}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Created On</h3>
                                        <p className="text-sm">
                                            {FormatDate(selectedAnnouncement.createdAt)}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Created By</h3>
                                        <p className="text-sm">
                                            {formatCreatedBy(selectedAnnouncement.createdBy)}
                                        </p>
                                    </div>
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">ID</h3>
                                        <p className="text-xs text-gray-600 break-all">
                                            {selectedAnnouncement._id || "—"}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end mt-6">
                                <Button style="secondary" onClick={closeDetailsModal}>
                                    Close
                                </Button>
                            </div>
                        </motion.div>
                    </Backdrop>
                )}
            </AnimatePresence>
        </>
    );
}

export default AnnouncementsPage;