import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUserStoreWithAuth } from '../../store';
import { useTokenStore } from "../../store/tokenStore";

// Create RSO function - clean implementation for React Query
const createRSO = async (newOrg) => {
    try {
        console.log("Creating RSO:", newOrg);
        // Handle file upload case
        if (newOrg.RSO_picture && newOrg.RSO_picture instanceof File) {
            newOrg.RSO_image = newOrg.RSO_picture;
            delete newOrg.RSO_picture;
        }

        const token = useTokenStore.getState().getToken();
        const isFileUpload = newOrg.RSO_image instanceof File;

        let body;
        let headers = {
            "Authorization": token || "",
        };

        if (isFileUpload) {
            const formData = new FormData();

            Object.entries(newOrg).forEach(([key, value]) => {
                if (key === "RSO_picturePreview") return;
                if (key === "RSO_picture") {
                    formData.append("RSO_image", value);
                    return;
                }

                if (key === "RSO_tags" && Array.isArray(value)) {
                    value.forEach((tag) => formData.append("RSO_tags[]", tag));
                } else {
                    formData.append(key, value);
                }
            });

            body = formData;
        } else {
            headers["Content-Type"] = "application/json";
            body = JSON.stringify(newOrg);
        }

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/createRSO`, {
            method: "POST",
            headers,
            body,
        });
        console.log("Response from createRSO:", response);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error: ${response.status} - ${response.statusText}`);
        }

        // if (!response.ok) {
        //     const errorData = await response.json(); // try to read the server's message
        //     throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);

        // }
        return response.json();

    } catch (error) {
        console.error("Error creating RSO:", error);
        throw error;
    }
};

// Update RSO function
const updateRSO = async ({ id, updatedOrg, academicYearId }) => {
    try {
        const token = useTokenStore.getState().getToken();
        const isFileUpload = updatedOrg.RSO_picture instanceof File;
        const formData = new FormData();

        if (isFileUpload) {
            Object.keys(updatedOrg).forEach((key) => {
                if (key === "RSO_picture") {
                    formData.append("RSO_image", updatedOrg[key]);
                } else {
                    formData.append(key, updatedOrg[key]);
                }
            });
        }

        const headers = {
            "Authorization": token || "",
            ...(!isFileUpload && { "Content-Type": "application/json" }),
        };


        console.log("Updating RSO ID:", id, "with data:", updatedOrg, "academicYearId:", academicYearId);
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/update-rso/${id}/${academicYearId}`, {
            method: "PATCH",
            headers,
            body: isFileUpload ? formData : JSON.stringify(updatedOrg),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error("Error updating RSO:", error);
        throw error;
    }

};

// Update RSO status
const updateRSOStatus = async ({ id, status }) => {
    const token = useTokenStore.getState().getToken();

    const headers = {
        "Content-Type": "application/json",
        "Authorization": token || "",
    };

    const body = JSON.stringify({ RSO_membershipStatus: status });

    const response = await fetch(`${process.env.REACT_APP_UPDATE_RSO_URL}/${id}`, {
        method: "PATCH",
        headers,
        body,
    });

    if (!response.ok) {
        throw new Error(`Failed to update RSO status: ${response.status}`);
    }

    return response.json();
};

// Delete RSO
const deleteRSO = async (id) => {
    const token = useTokenStore.getState().getToken();

    const headers = {
        "Content-Type": "application/json",
        "Authorization": token || "",
    };

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/deleteRSO/${id}`, {
        method: "DELETE",
        headers,
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    return { success: true, id };
};

// Fetch all RSOs
const fetchWebRSO = async ({ queryKey }) => {
    const token = useTokenStore.getState().getToken();
    const [_key, filters] = queryKey;

    const queryParams = new URLSearchParams();
    if (filters) {
        Object.entries(filters).forEach(([key, value]) => {
            queryParams.append(key, value);
        });
    }
    console.log("parameter request url ", `${process.env.REACT_APP_BASE_URL}/api/admin/rso/allRSOweb?${queryParams.toString()}`)

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/allRSOweb?${queryParams.toString()}`, {
        method: "GET",
        headers: {
            "Authorization": token || "",
        },
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
};

// Update membership date
const updateMembershipDate = async ({ date }) => {
    const token = useTokenStore.getState().getToken();

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/open-update-membership`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token || "",
        },
        body: JSON.stringify({ membershipEndDate: date }),
    });

    if (!response.ok) {
        throw new Error(`Failed to update membership date: ${response.status}`);
    }

    return response.json();
};

// Get membership date
const getMembershipDate = async () => {
    const token = useTokenStore.getState().getToken();

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/membership-status`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token || "",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to get membership date: ${response.status}`);
    }

    return response.json();
};

// Close membership date
const closeMembershipDate = async () => {
    const token = useTokenStore.getState().getToken();

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/manual-close-membership`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token || "",
        },
    });

    if (!response.ok) {
        throw new Error(`Failed to close membership date: ${response.status}`);
    }

    return response.json();
};

// Extend membership date
const extendMembershipDate = async ({ date, hours, minutes }) => {
    const token = useTokenStore.getState().getToken();

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/update-membership-endDate`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token || "",
        },
        body: JSON.stringify({ durationInDays: date, durationInHours: hours, durationInMinutes: minutes }),
    });

    if (!response.ok) {
        throw new Error(`Failed to extend membership date: ${response.status}`);
    }

    return response.json();
};

const getRSODetail = async (rsoID) => {
    try {
        const token = useTokenStore.getState().getToken();
        // use local tokenstorage
        // const token = localStorage.getItem('token');
        console.log("token in getRSODetail:", token);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/fetch-rso-details/${rsoID}`, {
            method: "GET",
            headers: {
                "Authorization": token || "",
            },
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error fetching RSO details:", error);
        throw error;
    }
};

const softDeleteRSORequest = async ({ id }) => {
    try {
        const token = useTokenStore.getState().getToken();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/softDeleteRSO/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token || "",
            },
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error soft deleting RSO:", error);
        throw error;
    }
}

const restoreRSORequest = async ({ id }) => {
    try {
        const token = useTokenStore.getState().getToken();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/restoreRSO/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token || "",
            },
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        return response.json();
    } catch (error) {
        console.error("Error soft deleting RSO:", error);
        throw error;
    }
}

const hardDeleteRSORequest = async ({ id }) => {
    try {
        const token = useTokenStore.getState().getToken();

        console.log("url request for hard delete:", `${process.env.REACT_APP_BASE_URL}/api/admin/rso/hardDeleteRSO/${id}`);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/hardDeleteRSO/${id}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token || "",
            },
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error("Error hard deleting RSO:", error);
        throw error;
    }
}

const updateUpcomingRSORequest = async ({ id, formData, academicYearId }) => {
    try {
        const token = useTokenStore.getState().getToken();

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/update-upcoming-rso/${id}/${academicYearId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token || "",
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error("Error updating upcoming RSO:", error);
        throw error;
    }
}

const recognizeRSORequest = async ({ id }) => {
    try {
        const token = useTokenStore.getState().getToken();

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/recognize-rso/${id}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token || "",
            },
        });

        if (!response.ok) {
            const errorData = await response.json(); // try to read the server's message
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);

        }

        return response.json();
    } catch (error) {
        console.error("Error recognizing RSO:", error);
        throw error;
    }
}

function useAdminRSO({
    rsoID = "",
    isDeleted = false,
    recognitionStatus = "",
    search = "",
    category = "",
    manualEnable = false,
    academicYearId = "",
    setActiveAY = false,
} = {}) {
    const queryClient = useQueryClient();
    const { isUserAdmin, isUserCoordinator } = useUserStoreWithAuth();
    const location = useLocation();
    const isRSOsPage = location.pathname.startsWith('/rsos');
    const isUsersPage = location.pathname.startsWith('/users');

    console.log("id is ", rsoID);

    console.log("isUserAdmin in useAdminRSO:", isUserAdmin);
    console.log("isUserCoordinator in useAdminRSO:", isUserCoordinator);

    // Clear queries when user loses admin/coordinator privileges
    useEffect(() => {
        if (!isUserAdmin && !isUserCoordinator) {
            queryClient.removeQueries(['rsoData']);
            queryClient.removeQueries(['membershipDate']);
        }
    }, [isUserAdmin, isUserCoordinator, queryClient]);

    const filters = {
        isDeleted,
        recognitionStatus,
        search,
        category,
        academicYearId,
        setActiveAY,
    }

    const {
        mutate: createRSOMutate,
        isLoading: isCreating,
        isSuccess: isCreateSuccess,
        isError: isCreateError,
        error: createError,
        reset: resetCreate,
    } = useMutation({
        mutationFn: createRSO,
        onSuccess: () => {
            console.log("RSO created successfully");
            queryClient.invalidateQueries(["rsoData"]);
        },
        onError: (error) => {
            console.error("Error creating RSO:", error);
        },
        enabled: (isUserAdmin || isUserCoordinator) && isRSOsPage,
    });

    const {
        mutate: updateRSOMutate,
        isLoading: isUpdating,
        isSuccess: isUpdateSuccess,
        isError: isUpdateError,
        error: updateError,
        reset: resetUpdate,
    } = useMutation({
        mutationFn: updateRSO,
        onSuccess: () => {
            console.log("RSO updated successfully");
            queryClient.invalidateQueries(["rsoData"]);
        },
        onError: (error) => {
            console.error("Error updating RSO:", error);
        },
        enabled: (isUserAdmin || isUserCoordinator) && isRSOsPage,
    });

    const {
        mutate: updateRSOStatusMutate,
        isLoading: isUpdatingStatus,
        isSuccess: isUpdateStatusSuccess,
        isError: isUpdateStatusError,
        error: updateStatusError,
        reset: resetUpdateStatus,
    } = useMutation({
        mutationFn: updateRSOStatus,
        onSuccess: () => {
            console.log("RSO status updated successfully");
            queryClient.invalidateQueries(["rsoData"]);
        },
        onError: (error) => {
            console.error("Error updating RSO status:", error);
        },
        enabled: (isUserAdmin || isUserCoordinator) && isRSOsPage,
    });

    const {
        mutate: deleteRSOMutate,
        isLoading: isDeletingRSO,
        isSuccess: isDeleteRSOSuccess,
        isError: isDeleteRSOError,
        error: deleteRSOError,
    } = useMutation({
        mutationFn: deleteRSO,
        onSuccess: () => {
            console.log("RSO deleted successfully");
            queryClient.invalidateQueries(["rsoData"]);
        },
        onError: (error) => {
            console.error("Error deleting RSO:", error);
        },
        enabled: (isUserAdmin || isUserCoordinator) && isRSOsPage,
    });

    const {
        data: rsoData,
        isLoading: isRSOLoading,
        isError: isRSOError,
        error: rsoError,
        refetch: refetchRSOData,
    } = useQuery({
        queryKey: ["rsoData", filters],
        queryFn: fetchWebRSO,
        refetchOnWindowFocus: true,
        retry: 1,
        staleTime: 0,
        cacheTime: 0,
        enabled: manualEnable ? true : (isUserAdmin || isUserCoordinator) && isRSOsPage,
    });

    const {
        mutate: updateMembershipDateMutate,
        isLoading: isUpdateMembershipDateLoading,
        isSuccess: isUpdateMembershipDateSuccess,
        isError: isUpdateMembershipDateError,
        error: updateMembershipDateError,
        reset: resetUpdateMembershipDate,
    } = useMutation({
        mutationFn: updateMembershipDate,
        onSuccess: () => {
            console.log("Membership date updated successfully");
            queryClient.invalidateQueries(["membershipDate"]);
        },
        onError: (error) => {
            console.error("Error updating membership date:", error);
        },
        enabled: (isUserAdmin || isUserCoordinator) && isRSOsPage,
    });


    const {
        data: membershipDateData,
        isLoading: isMembershipDateLoading,
        isSuccess: isMembershipDateSuccess,
        isError: isMembershipDateError,
        error: membershipDateError,
        refetch: refetchMembershipDate,
    } = useQuery({
        queryKey: ["membershipDate"],
        queryFn: getMembershipDate,
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 0,
        cacheTime: 0,
        enabled: (isUserAdmin || isUserCoordinator) && isRSOsPage,
    });

    const {
        mutate: closeMembershipDateMutate,
        isLoading: isCloseMembershipDateLoading,
        isSuccess: isCloseMembershipDateSuccess,
        isError: isCloseMembershipDateError,
        error: closeMembershipDateError,
        reset: resetCloseMembershipDate,
    } = useMutation({
        mutationFn: closeMembershipDate,
        onSuccess: () => {
            console.log("Membership date closed successfully");
            queryClient.invalidateQueries(["membershipDate"]);
        },
        onError: (error) => {
            console.error("Error closing membership date:", error);
        },
        enabled: (isUserAdmin || isUserCoordinator) && isRSOsPage,
    });

    const {
        mutate: extendMembershipDateMutate,
        isLoading: isExtendMembershipDateLoading,
        isSuccess: isExtendMembershipDateSuccess,
        isError: isExtendMembershipDateError,
        error: extendMembershipDateError,
        reset: resetExtendMembershipDate,
    } = useMutation({
        mutationFn: extendMembershipDate,
        onSuccess: () => {
            console.log("Membership date extended successfully");
            queryClient.invalidateQueries(["membershipDate"]);
        },
        onError: (error) => {
            console.error("Error extending membership date:", error);
        },
        enabled: (isUserAdmin || isUserCoordinator) && isRSOsPage,
    });

    const {
        data: rsoDetailData,
        isLoading: isRSODetailLoading,
        isError: isRSODetailError,
        error: rsoDetailError,
        refetch: refetchRSODetail,
    } = useQuery({
        queryKey: ["rsoDetail", rsoID],
        queryFn: () => getRSODetail(rsoID),
        enabled: !!rsoID,
    });

    const {
        mutate: restoreRSOMutate,
        isLoading: isRestoreRSOLoading,
        isSuccess: isRestoreRSOSuccess,
        isError: isRestoreRSOError,
        error: restoreRSOError,
        reset: resetRestoreRSO,
    } = useMutation({
        mutationFn: restoreRSORequest,
        onSuccess: () => {
            console.log("RSO restored successfully");
            queryClient.invalidateQueries(["rsoData"]);
        },
        onError: (error) => {
            console.error("Error restoring RSO:", error);
        },
        enabled: (isUserAdmin || isUserCoordinator) && isRSOsPage,
    });

    const {
        mutate: softDeleteRSOMutate,
        isLoading: isSoftDeleteRSOLoading,
        isSuccess: isSoftDeleteRSOSuccess,
        isError: isSoftDeleteRSOError,
        error: softDeleteRSOError,
        reset: resetSoftDeleteRSO,
    } = useMutation({
        mutationFn: softDeleteRSORequest,
        onSuccess: () => {
            console.log("RSO deleted successfully");
            queryClient.invalidateQueries(["rsoData"]);
        },
        onError: (error) => {
            console.error("Error deleting RSO:", error);
        },
        enabled: (isUserAdmin || isUserCoordinator) && isRSOsPage,
    });

    const {
        mutate: hardDeleteRSOMutate,
        isLoading: isHardDeleteRSOLoading,
        isSuccess: isHardDeleteRSOSuccess,
        isError: isHardDeleteRSOError,
        error: hardDeleteRSOError,
        reset: resetHardDeleteRSO,
    } = useMutation({
        mutationFn: hardDeleteRSORequest,
        onSuccess: () => {
            console.log("RSO hard deleted successfully");
            queryClient.invalidateQueries(["rsoData"]);
        },
        onError: (error) => {
            console.error("Error hard deleting RSO:", error);
        },
        enabled: (isUserAdmin || isUserCoordinator) && isRSOsPage,
    });

    const {
        mutate: recognizeRSOMutate,
        isLoading: isRecognizingRSO,
        isSuccess: isRecognizeRSOSuccess,
        isError: isRecognizeRSOError,
        error: recognizeRSOError,
    } = useMutation({
        mutationFn: recognizeRSORequest,
        onSuccess: () => {
            console.log("RSO recognized successfully");
            queryClient.invalidateQueries(["rsoData"]);
        },
        onError: (error) => {
            console.error("Error recognizing RSO:", error);
        },
        enabled: (isUserAdmin || isUserCoordinator) && isRSOsPage,
    });


    return {
        // for admin create RSO
        createRSOMutate,
        isCreating,
        isCreateSuccess,
        isCreateError,
        createError,
        resetCreate,

        // for admin update RSO
        updateRSOMutate,
        isUpdating,
        isUpdateSuccess,
        isUpdateError,
        updateError,
        resetUpdate,

        // for admin update RSO status
        updateRSOStatusMutate,
        isUpdatingStatus,
        isUpdateStatusSuccess,
        isUpdateStatusError,
        updateStatusError,
        resetUpdateStatus,

        // for admin delete RSO
        deleteRSOMutate,
        isDeletingRSO,
        isDeleteRSOSuccess,
        isDeleteRSOError,
        deleteRSOError,

        // fetching RSO data
        rsoData,
        isRSOLoading,
        isRSOError,
        rsoError,
        refetchRSOData,

        // for admin update membership date
        updateMembershipDateMutate,
        isUpdateMembershipDateLoading,
        isUpdateMembershipDateSuccess,
        isUpdateMembershipDateError,
        updateMembershipDateError,
        resetUpdateMembershipDate,

        // for admin get membership date
        membershipDateData,
        isMembershipDateLoading,
        isMembershipDateSuccess,
        isMembershipDateError,
        membershipDateError,
        refetchMembershipDate,

        // for admin close membership date
        closeMembershipDateMutate,
        isCloseMembershipDateLoading,
        isCloseMembershipDateSuccess,
        isCloseMembershipDateError,
        closeMembershipDateError,
        resetCloseMembershipDate,

        // for admin extend membership date
        extendMembershipDateMutate,
        isExtendMembershipDateLoading,
        isExtendMembershipDateSuccess,
        isExtendMembershipDateError,
        extendMembershipDateError,
        resetExtendMembershipDate,

        // for admin get RSO details
        rsoDetailData,
        isRSODetailLoading,
        isRSODetailError,
        rsoDetailError,
        refetchRSODetail,

        // for admin soft delete RSO
        softDeleteRSOMutate,
        isSoftDeleteRSOLoading,
        isSoftDeleteRSOSuccess,
        isSoftDeleteRSOError,
        softDeleteRSOError,
        resetSoftDeleteRSO,

        // for admin hard delete RSO
        hardDeleteRSOMutate,
        isHardDeleteRSOLoading,
        isHardDeleteRSOSuccess,
        isHardDeleteRSOError,
        hardDeleteRSOError,
        resetHardDeleteRSO,

        // for admin recognize RSO
        recognizeRSOMutate,
        isRecognizingRSO,
        isRecognizeRSOSuccess,
        isRecognizeRSOError,
        recognizeRSOError,

        // for admin restore RSO
        restoreRSOMutate,
        isRestoreRSOLoading,
        isRestoreRSOSuccess,
        isRestoreRSOError,
        restoreRSOError,
        resetRestoreRSO,
    }
}

export default useAdminRSO;