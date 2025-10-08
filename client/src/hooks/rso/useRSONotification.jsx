import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useTokenStore, useUserStoreWithAuth } from "../../store";

// All token accesses now use useTokenStore.getState().token (Zustand) instead of localStorage.

const getNotificationsRequest = async ({ queryKey }) => {
    try {
        // token from Zustand store (was localStorage)
        const token = useTokenStore.getState().token;
        const userId = queryKey[1];
        const filters = queryKey[2];
        const params = new URLSearchParams(filters).toString();

        console.log("notification url called:", `${process.env.REACT_APP_BASE_URL}/api/notification/fetch-notification/${userId}?${params}`);
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/notification/fetch-notification/${userId}?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            }
        });

        if (!response.ok) {
            const errorData = await response.json(); // try to read the server's message
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data;

    } catch (error) {
        console.error("Error fetching notifications:", error);
    }
}

const postRSONotificationRequest = async ({ title, content }) => {
    try {
        const token = useTokenStore.getState().token;

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/announcements/createAnnouncement`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify({ title, content }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error creating specific RSO notification:", error);
        throw error;
    }
}

const getRSOCreatedNotificationsRequest = async ({ queryKey }) => {
    try {
        const token = useTokenStore.getState().token;
        const [_, date] = queryKey;
        const params = new URLSearchParams({ date }).toString();

        console.log("RSO created notifications url called:", `${process.env.REACT_APP_BASE_URL}/api/rsoRep/announcements/getAnnouncement?${params}`);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/announcements/getAnnouncement?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching RSO created notifications:", error);
        throw error;
    }
}

const getSDAOAnnouncementRequest = async ({ queryKey }) => {
    try {
        const token = useTokenStore.getState().token;
        const [_, date] = queryKey;
        const params = new URLSearchParams({ date }).toString();

        console.log("RSO created notifications url called:", `${process.env.REACT_APP_BASE_URL}/api/rsoRep/announcements/getSDAOAnnouncement?${params}`);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/announcements/getSDAOAnnouncement?${params}`, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            }
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching RSO created notifications:", error);
        throw error;
    }
}


const updateSentAnnouncementRequest = async ({ announcementId, title, content }) => {
    try {
        const token = useTokenStore.getState().token;
        console.log("received, announcementId, title, content:", announcementId, title, content);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/announcements/updateAnnouncement/${announcementId}`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify({ title, content }),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error updating sent announcement:", error);
        throw error;
    }
}

function useNotification({ userId, filters, date, page = 1 } = {}) {
    const queryClient = useQueryClient();
    const { isUserRSORepresentative } = useUserStoreWithAuth();
    const location = useLocation();
    const isNotificationsPage = location.pathname === '/notifications';
    const isAnnouncementsPage = location.pathname.startsWith('/dashboard/announcements');



    const {
        data: notificationsData,
        isLoading: notificationsLoading,
        isFetching: notificationsFetching,
        isError: notificationsError,
        error: notificationsErrorDetails
    } = useQuery({
        queryKey: ['notificationData', userId, filters],
        queryFn: getNotificationsRequest,
        enabled: userId && isNotificationsPage, // only fetch if userId is provided and not RSO rep and on notifications page
        refetchOnWindowFocus: false,
    });

    const {
        mutate: postRSONotification,
        isLoading: postRSONotificationLoading,
        isError: postRSONotificationError,
        error: postRSONotificationErrorDetails,
    } = useMutation({
        mutationFn: postRSONotificationRequest,
        enabled: isUserRSORepresentative && isNotificationsPage,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rsoCreatedNotificationsData'] });
        },
        refetchOnWindowFocus: false,

    });

    const {
        data: rsoCreatedNotificationsData,
        isLoading: rsoCreatedNotificationsLoading,
        isError: rsoCreatedNotificationsError,
        error: rsoCreatedNotificationsErrorDetails,
        refetch: refetchRSOCreatedNotifications,
    } = useQuery({
        queryKey: ['rsoCreatedNotificationsData', date],
        queryFn: getRSOCreatedNotificationsRequest,
        enabled: isUserRSORepresentative && isAnnouncementsPage, // only fetch if user is an RSO representative and on announcements page
        refetchOnWindowFocus: false,
    });

    const {
        data: sdaoAnnouncementData,
        isLoading: sdaoAnnouncementLoading,
        isError: sdaoAnnouncementError,
        error: sdaoAnnouncementErrorDetails,
    } = useQuery({
        queryKey: ['sdaoAnnouncementData', date],
        queryFn: getSDAOAnnouncementRequest,
        enabled: isUserRSORepresentative && isAnnouncementsPage, // only fetch if user is an RSO representative and on announcements page
        refetchOnWindowFocus: false,
    });

    const {
        mutate: updateSentRSOAnnouncement,
        isLoading: updateSentRSOAnnouncementLoading,
        isError: updateSentRSOAnnouncementError,
        error: updateSentRSOAnnouncementErrorDetails,
    } = useMutation({
        mutationFn: updateSentAnnouncementRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['rsoCreatedNotificationsData'] });
        }
    });

    return {
        // get notifications (for all users)
        notificationsData,
        notificationsLoading,
        notificationsError,
        notificationsErrorDetails,

        // post RSO notification (for RSO representatives)
        postRSONotification,
        postRSONotificationLoading,
        postRSONotificationError,
        postRSONotificationErrorDetails,

        // get RSO created notifications (for RSO representatives)
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

        // get SDAO announcements (for RSO representatives)
        sdaoAnnouncementData,
        sdaoAnnouncementLoading,
        sdaoAnnouncementError,
        sdaoAnnouncementErrorDetails,
    }
}

export default useNotification;

