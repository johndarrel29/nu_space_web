

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useTokenStore, useUserStoreWithAuth } from "../../store";

const postNotificationsRequest = async ({ title, content }) => {
    try {
        // token from Zustand store (was localStorage)
        const token = useTokenStore.getState().token;

        console.log("postNotificationsRequest token used:", token);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rsoSpace/createForAllRSOs`, {
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
        console.error("Error creating notification:", error);
        throw error;
    }
}

const getSentNotificationsRequest = async () => {
    try {
        // token from Zustand store (was localStorage)
        const token = useTokenStore.getState().token;

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rsoSpace/getAllAnnouncements`, {
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
        console.error("Error fetching sent notifications:", error);
        throw error;
    }
}

const postSpecificRSONotificationRequest = async ({ rsoIds, title, content }) => {
    try {
        const token = useTokenStore.getState().token;

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rsoSpace/createForSpecificRSO`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: token,
            },
            body: JSON.stringify({ title, content, rsoIds }),
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

function useAdminNotification({ userId } = {}) {
    const queryClient = useQueryClient();
    const { isUserRSORepresentative } = useUserStoreWithAuth();
    const location = useLocation();
    const isNotificationsPage = location.pathname === '/notifications';

    const {
        mutate: postNotification,
        isLoading: postNotificationLoading,
        isError: postNotificationError,
        error: postNotificationErrorDetails,
    } = useMutation({
        mutationFn: postNotificationsRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['notificationData'] });
        },
    });

    const {
        data: sentNotificationsData,
        isLoading: sentNotificationsLoading,
        isError: sentNotificationsError,
        error: sentNotificationsErrorDetails,
    } = useQuery({
        queryKey: ['sentNotificationsData'],
        queryFn: getSentNotificationsRequest,
    });

    const {
        mutate: postSpecificRSONotification,
        isLoading: postSpecificRSONotificationLoading,
        isError: postSpecificRSONotificationError,
        error: postSpecificRSONotificationErrorDetails,
    } = useMutation({
        mutationFn: postSpecificRSONotificationRequest,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['sentNotificationsData'] });
        },
    });

    return {
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
    }
}

export default useAdminNotification;