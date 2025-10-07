import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import Select from 'react-select';
import { toast } from "react-toastify";
import { DropIn } from "../../../animations/DropIn";
import { Backdrop, Button, CloseButton, LoadingSpinner, ReusableTable, TabSelector, TextInput } from "../../../components";
import { useAdminNotification, useAdminRSO, useModal, useRSONotification } from "../../../hooks";
import { useUserStoreWithAuth } from '../../../store';
import { FormatDate } from "../../../utils";

function AnnouncementsPage() {
    const [title, setTitle] = useState("");
    const [description, setDescription] = useState("");
    const user = JSON.parse(localStorage.getItem("user")) || {};
    const [searchQuery, setSearchQuery] = useState("");
    const [activeTab, setActiveTab] = useState(0);
    const { isUserRSORepresentative, isUserAdmin, isCoordinator } = useUserStoreWithAuth();
    const [selectedRSOs, setSelectedRSOs] = useState([]);
    const [filters, setFilters] = useState({ date: "latest" });
    const [selectedRSOsForEdit, setSelectedRSOsForEdit] = useState([]);
    const [loading, setLoading] = useState(false);

    const {
        rsoData,
        isRSOLoading,
        isRSOError,
        rsoError,
        refetchRSOData,
    } = useAdminRSO({ manualEnable: true, setActiveAY: true, }); // manual enable to control when to fetch

    console.log("RSO Data: ", rsoData);

    const {
        postRSONotification,
        postRSONotificationLoading,
        postRSONotificationError,
        postRSONotificationErrorDetails,

        rsoCreatedNotificationsData,
        rsoCreatedNotificationsLoading,
        rsoCreatedNotificationsError,
        rsoCreatedNotificationsErrorDetails,
        refetchRSOCreatedNotifications,

        // update sent announcement (for RSO representatives)
        updateSentRSOAnnouncement,
        updateSentRSOAnnouncementLoading,
        updateSentRSOAnnouncementError,
        updateSentRSOAnnouncementErrorDetails,
    } = useRSONotification({ userId: user?.id, date: filters.date });

    useEffect(() => {
        if (filters) {
            console.log("Filter applied. Refetching announcements...", { filters: filters.date });
        }
    }, [filters]);

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

        // for updating sent announcement
        updateSentAdminAnnouncement,
        updateSentAdminAnnouncementLoading,
        updateSentAdminAnnouncementError,
        updateSentAdminAnnouncementErrorDetails,
    } = useAdminNotification({ userId: user?.id, date: filters.date });

    console.log("Notifications for rso Data: ", rsoCreatedNotificationsData);

    const { isOpen, openModal, closeModal } = useModal();
    const [error, setError] = useState(null);

    // Add state for the details modal
    const [selectedAnnouncement, setSelectedAnnouncement] = useState({});
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
    const rowsToDisplay = !isUserRSORepresentative ? tableRowSent : tableRowRSO;

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
        console.log("Row clicked:", row);
        setSelectedAnnouncement({ ...row.fullData });
        setSelectedRSOsForEdit(
            row.fullData?.targetedRSOs
                ? row.fullData.targetedRSOs.map(rso => ({
                    value: rso._id,
                    label: rso.RSO_name || rso.RSO_acronym || 'Unnamed RSO'
                }))
                : []
        )
        setIsDetailsModalOpen(true);
    };

    const handleEditSelectedRSOs = (selectedOptions) => {
        setSelectedRSOsForEdit(selectedOptions);
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
                            setLoading(false);
                            // Reset form + close
                            setTitle("");
                            setDescription("");
                            closeModal();
                        },
                        onError: (err) => {
                            setError(err.message || "Failed to create announcement.");
                            setLoading(false);
                            toast.error(`Error: ${err.message || "Failed to create announcement."}`);
                        }
                    }
                );
            } else {
                postSpecificRSONotification({ title, content: description, rsoIds: selectedRSOs },
                    {
                        onSuccess: () => {
                            setLoading(false);
                            toast.success("Announcement created successfully!");
                            console.log("RSO-specific notification posted successfully");
                            // Reset form + close
                            setTitle("");
                            setDescription("");
                            setSelectedRSOs([]);
                            closeModal();
                        },
                        onError: (err) => {
                            setLoading(false);
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
                        setLoading(false);
                        // Reset form + close
                        setTitle("");
                        setDescription("");
                        closeModal();
                        console.log("RSO representative notification posted successfully");
                    },
                    onError: (err) => {
                        setLoading(false);
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

    const handleUpdateAnnouncement = () => {
        try {
            console.log("Update announcement:", selectedAnnouncement);
            console.log("data to pass: ", { announcementId: selectedAnnouncement._id, title: selectedAnnouncement.title, content: selectedAnnouncement.content });

            if (isUserRSORepresentative) {
                updateSentRSOAnnouncement({ announcementId: selectedAnnouncement._id, title: selectedAnnouncement.title, content: selectedAnnouncement.content },
                    {
                        onSuccess: () => {
                            setLoading(false);
                            toast.success("Announcement updated successfully!");
                            refetchRSOCreatedNotifications();
                            closeDetailsModal();
                            setTitle("");
                            setDescription("");
                            closeModal();
                            console.log("RSO representative notification updated successfully");
                        },
                        onError: (err) => {
                            setLoading(false);
                            setError(err.message || "Failed to update announcement.");
                            toast.error(`Error: ${err.message || "Failed to update announcement."}`);
                        }
                    }
                );
            }

            if (!isUserRSORepresentative) {
                try {
                    updateSentAdminAnnouncement({ announcementId: selectedAnnouncement._id, title: selectedAnnouncement.title, content: selectedAnnouncement.content, targetedRSOs: selectedRSOsForEdit.map(rso => rso.value) || [] },
                        {
                            onSuccess: () => {
                                setLoading(false);
                                toast.success("Announcement updated successfully!");
                                refetchRSOCreatedNotifications();
                                closeDetailsModal();
                                setTitle("");
                                setDescription("");
                                closeModal();
                                console.log("Admin notification updated successfully");
                            },
                            onError: (err) => {
                                setLoading(false);
                                setError(err.message || "Failed to update announcement.");
                                toast.error(`Error: ${err.message || "Failed to update announcement."}`);
                            }
                        }
                    );
                } catch (error) {
                    setLoading(false);
                    console.error("Error updating announcement:", error);
                    toast.error("Failed to update announcement.");
                }
            }
        } catch (error) {
            setLoading(false);
            console.error("Error updating announcement:", error);
            toast.error("Failed to update announcement.");
        } finally {
            setLoading(false);
        }
    }

    const handleFilterSelected = (value) => {
        console.log("Filter selected:", value);

        if (value === "Latest") {
            setFilters({ ...filters, date: "latest" });
        } else if (value === "Oldest") {
            setFilters({ ...filters, date: "oldest" });
        } else {
            setFilters({ ...filters, date: "" });
        }
    }

    useEffect(() => {
        if (filters) {
            console.log("Filter applied. Refetching announcements...", filters.date);
        }
    }, [filters]);


    return (
        <>
            <div className="flex flex-col md:flex-row justify-between mb-4">
                {(isUserAdmin || isCoordinator || isUserRSORepresentative) && (
                    <div className='flex justify-start md:order-2 p-2'>
                        <Button onClick={openModal}>Create an Announcement</Button>
                    </div>
                )}
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
                    isLoading={sentNotificationsLoading || rsoCreatedNotificationsLoading}
                    options={["Latest", "Oldest"]}
                    value={filters.date === "latest" ? "Latest" : filters.date === "oldest" ? "Oldest" : ""}
                    onChange={(e) => handleFilterSelected(e.target.value)}
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
                                    disabled={loading || postNotificationLoading || postRSONotificationLoading || postSpecificRSONotificationLoading}
                                    onClick={() => { handleNotification(); setLoading(true); }}
                                >
                                    {loading ? <LoadingSpinner /> : 'Create Announcement'}
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
                                {!isUserRSORepresentative && (
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-500">Targeted RSOs</h3>
                                        <Select
                                            isMulti
                                            className="basic-multi-select"
                                            onChange={handleEditSelectedRSOs}
                                            options={rsos}
                                            value={selectedRSOsForEdit} />
                                    </div>
                                )}

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Title</h3>
                                    <TextInput value={selectedAnnouncement.title || ""} onChange={(e) => setSelectedAnnouncement({ ...selectedAnnouncement, title: e.target.value })} />
                                </div>

                                <div>
                                    <h3 className="text-sm font-medium text-gray-500">Message / Content</h3>
                                    <textarea
                                        rows="4"
                                        name="announcement_description"
                                        className="bg-textfield border border-mid-gray text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                                        placeholder="Write your announcement here"
                                        value={selectedAnnouncement.content || ""}
                                        onChange={(e) => setSelectedAnnouncement({ ...selectedAnnouncement, content: e.target.value })}
                                    />
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
                                </div>
                            </div>

                            <div className="flex justify-end mt-6 gap-2">
                                <Button
                                    style="primary"
                                    disabled={updateSentAdminAnnouncementLoading || updateSentRSOAnnouncementLoading || loading}
                                    onClick={() => { handleUpdateAnnouncement(); setLoading(true); }}
                                >
                                    {loading ? <LoadingSpinner /> : 'Edit'}
                                </Button>
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