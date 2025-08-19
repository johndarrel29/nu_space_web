import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import useTokenStore from "../../store/tokenStore";
import { useUserStoreWithAuth } from '../../store';
import { useEffect } from "react";

// Create RSO function - clean implementation for React Query
const createRSO = async (newOrg) => {
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

    if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
};

// Update RSO function
const updateRSO = async ({ id, updatedOrg }) => {
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

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/update-rso/${id}`, {
        method: "PATCH",
        headers,
        body: isFileUpload ? formData : JSON.stringify(updatedOrg),
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
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
const fetchWebRSO = async () => {
    const token = useTokenStore.getState().getToken();

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/allRSOweb`, {
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

function useAdminRSO() {
    const queryClient = useQueryClient();
    const { isUserAdmin, isUserCoordinator } = useUserStoreWithAuth();

    // Clear queries when user loses admin/coordinator privileges
    useEffect(() => {
        if (!isUserAdmin && !isUserCoordinator) {
            queryClient.removeQueries(['rsoData']);
            queryClient.removeQueries(['membershipDate']);
        }
    }, [isUserAdmin, isUserCoordinator, queryClient]);

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
        enabled: isUserAdmin || isUserCoordinator,
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
        enabled: isUserAdmin || isUserCoordinator,
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
        enabled: isUserAdmin || isUserCoordinator,
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
        enabled: isUserAdmin || isUserCoordinator,
    });

    const {
        data: rsoData,
        isLoading: isRSOLoading,
        isError: isRSOError,
        error: rsoError,
        refetch: refetchRSOData,
    } = useQuery({
        queryKey: ["rsoData"],
        queryFn: fetchWebRSO,
        refetchOnWindowFocus: false,
        retry: 1,
        staleTime: 0,
        cacheTime: 0,
        enabled: isUserAdmin || isUserCoordinator,
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
        enabled: isUserAdmin || isUserCoordinator,
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
        enabled: isUserAdmin || isUserCoordinator,
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
        enabled: isUserAdmin || isUserCoordinator,
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
        enabled: isUserAdmin || isUserCoordinator,
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
    }
}

export default useAdminRSO;