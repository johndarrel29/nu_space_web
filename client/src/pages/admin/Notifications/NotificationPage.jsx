
import { AnimatePresence, motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { DropIn } from '../../../animations/DropIn';
import { Backdrop, Badge, Button, CloseButton, Searchbar } from '../../../components';
import { useRSONotification } from '../../../hooks';
import { FormatDate } from '../../../utils';


export default function NotificationPage() {
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedNotif, setSelectedNotif] = useState(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [filters, setFilters] = useState({ search: '' });
    const user = JSON.parse(localStorage.getItem("user")) || {};

    const {
        // get notifications (for all users)
        notificationsData,
        notificationsLoading,
        notificationsError,
        notificationsErrorDetails,
    } = useRSONotification({ userId: user?.id, filters });

    console.log("Notifications Data:", notificationsData);

    useEffect(() => {
        setFilters(prev => ({ ...prev, search: searchQuery }));
    }, [searchQuery])


    const filteredNotifications = notificationsData?.data?.map(
        n => ({
            id: n._id,
            title: n.title || '',
            message: n.message || '',
            isRead: n.isRead || false,
            type: n?.data?.type,
            createdAt: FormatDate(n.createdAt)
        })
    )

    const handleOpenModal = notif => {
        setSelectedNotif(notif);
        setIsModalOpen(true);
    };
    const handleCloseModal = () => {
        setIsModalOpen(false);
        setSelectedNotif(null);
    };

    return (
        <div className="max-w-3xl mx-auto min-h-[70vh] p-6">
            <div className="mb-16">
                <Searchbar
                    id="search-notifications"
                    placeholder="Search notifications..."
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                />
            </div>
            <h1 className='text-lg font-semibold text-gray-800 mb-4'>{`${notificationsData?.pagination?.totalNotifications || 0} Notification${notificationsData?.pagination?.totalNotifications === 1 ? '' : 's'}`}</h1>
            <div className="bg-white rounded-lg shadow divide-y divide-gray-200">
                {filteredNotifications?.length === 0 ? (
                    <div className="p-6 text-center text-gray-500">No notifications found.</div>
                ) : (
                    filteredNotifications?.map(notif => (
                        <div
                            key={notif.id}
                            className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
                            onClick={() => handleOpenModal(notif)}
                        >
                            <div>
                                <div className="font-medium text-0ff-black">{notif.title}</div>
                                <div className="text-sm text-gray-600 line-clamp-1 max-w-md">{notif.message}</div>
                            </div>
                            <div className="flex flex-col items-end">
                                {/* <span className={
                                    notif.type === 'info' ? 'text-blue-500' :
                                        notif.type === 'success' ? 'text-green-600' :
                                            notif.type === 'warning' ? 'text-yellow-600' :
                                                'text-gray-500'
                                }>
                                    {notif.type.charAt(0).toUpperCase() + notif.type.slice(1)}
                                </span> */}
                                <Badge style={"secondary"} text={notif.type} />
                                <span className="text-xs text-gray-400 mt-1">{notif.createdAt}</span>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal for notification details */}
            <AnimatePresence>
                {isModalOpen && selectedNotif && (
                    <>
                        <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" />
                        <motion.div
                            className="fixed inset-0 z-50 w-screen overflow-auto flex items-center justify-center p-4"
                            variants={DropIn}
                            initial="hidden"
                            animate="visible"
                            exit="exit"
                        >
                            <div className="bg-white rounded-lg w-full max-w-md shadow-lg flex flex-col gap-6 p-6 max-h-[85vh] overflow-hidden">
                                <div className="flex items-start justify-between mb-2">
                                    <div className="flex flex-col items-start gap-2">
                                        <h2 className="text-lg font-semibold text-[#312895]">{selectedNotif.title}</h2>
                                        <Badge style={"secondary"} text={selectedNotif.type} />
                                    </div>
                                    <CloseButton onClick={handleCloseModal} />
                                </div>
                                <div className="space-y-2">
                                    <div className="text-gray-700 whitespace-pre-line text-base">{selectedNotif.message}</div>
                                    <div className="flex flex-row gap-4 text-xs text-gray-500 mt-2">
                                        <span>Date: <span className="font-semibold text-gray-700">{selectedNotif.createdAt}</span></span>
                                    </div>
                                </div>
                                <div className="flex justify-end mt-4">
                                    <Button style="secondary" onClick={handleCloseModal}>Close</Button>
                                </div>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}