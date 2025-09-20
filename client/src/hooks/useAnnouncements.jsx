import { useMutation, useQuery } from "@tanstack/react-query";
import { useAuth } from "../context/AuthContext";

//use token from authContext as the single source of truth for authentication
// continue with the get, update, and delete functions for announcement

function useAnnouncements() {
    const { user } = useAuth();
    console.log("User in useAnnouncements:", user);

    const rsoId = user?.assigned_rso;

    const createAnnouncement = async ({ title, content }) => {
        const token = localStorage.getItem("token");

        //console log the request
        console.log("Creating announcement with title:", title, "and content:", content);
        console.log("authorization header:", token);

        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/rsoSpace/createAnnouncement`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                    'platform': 'web',
                },
                body: JSON.stringify({ title, content }),
            })
            if (!response.ok) {
                throw new Error("Failed to create announcement");
            }
            return response.json();
        } catch (error) {
            console.error("Error creating announcement:", error);
            throw error;
        }
    }

    const getAnnouncements = async () => {
        const token = localStorage.getItem("token");


        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/rsoSpace/getAnnouncement/${rsoId}`, {
                method: "GET",
                headers: {
                    Authorization: token,
                    'platform': 'web',
                },
            });
            if (!response.ok) {
                throw new Error("Failed to fetch announcements");
            }
            return response.json();
        } catch (error) {
            console.error("Error fetching announcements:", error);
            throw error;
        }
    }

    const deleteAnnouncement = async (announcementId) => {
        const token = localStorage.getItem("token");

        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/rsoSpace/deleteAnnouncement/${announcementId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                    'platform': 'web',
                },

            });
            if (!response.ok) {
                throw new Error("Failed to delete announcement");
            }
            return response.json();
        } catch (error) {
            throw error;
        }
    }

    const updateAnnouncement = async ({ announcementId, title, content }) => {
        const token = localStorage.getItem("token");

        // console log the request
        console.log("Updating announcement with ID:", announcementId, "title:", title, "content:", content);

        try {
            const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/rsoSpace/updateAnnouncement/${announcementId}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: token,
                    'platform': 'web',
                },
                body: JSON.stringify({ title, content }),
            });
            if (!response.ok) {
                console.error("Response status:", response);
                throw new Error("Failed to update announcement");
            }
            return response.json();
        } catch (error) {
            console.error("Error updating announcement:", error);
            throw error;
        }
    }




    const {
        data: announcements,
        isLoading: isLoadingAnnouncements,
        isError: isErrorAnnouncements,
        error: announcementsError,
        isSuccess: isSuccessAnnouncements,
        refetch: refetchAnnouncements,
        isRefetching: isRefetchingAnnouncements,
    } = useQuery({
        queryKey: ["announcements"],
        queryFn: getAnnouncements,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
        retry: 1, // Retry once on failure
        staleTime: 1000 * 60 * 5, // 5 minutes
    })

    const {
        mutate: createAnnouncementMutate,
        isLoading: isCreating
    }
        = useMutation({
            mutationFn: createAnnouncement,
            onSuccess: (data) => {
                console.log("Announcement created successfully:", data);
                // Optionally, you can invalidate queries or update the state here
            },
            onError: (error) => {
                console.error("Error creating announcement:", error);
            },
        });

    const {
        mutate: deleteAnnouncementMutate,
        isLoading: isDeleting,
        isSuccess: isSuccessDelete,
        isError: isErrorDelete,
    } = useMutation({
        mutationFn: deleteAnnouncement,
        onSuccess: (data) => {
            console.log("Announcement deleted successfully:", data);
            // Optionally, you can invalidate queries or update the state here
        },
        onError: (error) => {
            console.error("Error deleting announcement:", error);
        },
    });

    const {
        mutate: updateAnnouncementMutate,
        isLoading: isUpdating,
        isSuccess: isSuccessUpdate,
        isError: isErrorUpdate,
        error: updateError,
    } = useMutation({
        mutationFn: updateAnnouncement,
        onSuccess: (data) => {
            console.log("Announcement updated successfully:", data);
        },
        onError: (error) => {
            console.error("Error updating announcement:", error);
        },
    }
    );


    return {
        createAnnouncementMutate,
        isCreating,

        announcements,
        isLoadingAnnouncements,
        isErrorAnnouncements,
        announcementsError,
        isSuccessAnnouncements,
        refetchAnnouncements,
        isRefetchingAnnouncements,

        deleteAnnouncementMutate,
        isDeleting,
        isSuccessDelete,
        isErrorDelete,

        updateAnnouncementMutate,
        isUpdating,
        isSuccessUpdate,
        isErrorUpdate,
        updateError,

    };

}

export default useAnnouncements;