import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useTokenStore, useUserStoreWithAuth } from "../../store";

// for rso fetch members (pure API helper)
const fetchMembers = async () => {
    const token = useTokenStore.getState().getToken();
    const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rso/members`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": formattedToken || "",
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error fetching members: ${text || response.status}`);
    }

    const json = await response.json();
    return json.members ?? [];
};

// for rso update officer (pure API helper)
const updateOfficer = async ({ id, updatedOfficer }) => {
    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

    const headers = {
        Authorization: formattedToken || "",
    };

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/rso/updateRSOOfficer/${id}`, {
        method: "PUT",
        headers,
        body: updatedOfficer,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to update officer: ${text || response.status}`);
    }
    return response.json();
};

// for rso create officer (pure API helper)
const createOfficer = async ({ createdOfficer }) => {
    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

    const headers = {
        Authorization: formattedToken || "",
    };

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/rso/createRSOOfficer`, {
        method: "POST",
        headers,
        body: createdOfficer,
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Failed to create officer: ${text || response.status}`);
    }
    return response.json();
};

const fetchRSODetailsRequest = async () => {
    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/rso/rsoProfile`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": formattedToken || "",
        },
    });

    if (!response.ok) {
        const text = await response.text();
        throw new Error(`Error fetching RSO details: ${text || response.status}`);
    }

    return response.json();
};

const deleteOfficer = async (officerId) => {
    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

    const headers = {
        "Content-Type": "application/json",
        "Authorization": token ? `Bearer ${formattedToken}` : "",
    };

    try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/rso/deleteRSOOfficer/${officerId}`, {
            method: "DELETE",
            headers,
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }


        return response.json();
    } catch (err) {
        console.error("Error deleting officer:", err);
    }
}

function useRSODetails({ manualEnable = false } = {}) {
    const { isUserRSORepresentative } = useUserStoreWithAuth();
    const queryClient = useQueryClient();
    const location = useLocation();
    const isAccount = location.pathname === '/account';

    useEffect(() => {
        if (!isUserRSORepresentative) {
            queryClient.removeQueries(["membersData"]);
            queryClient.removeQueries(["rsoDetails"]);
        }
    }, [isUserRSORepresentative, queryClient]);

    const {
        mutate: updateOfficerMutate,
        isLoading: isUpdatingOfficer,
        isError: isUpdateOfficerError,
        isSuccess: isUpdateOfficerSuccess,
    } = useMutation({
        enabled: isUserRSORepresentative && isAccount,
        mutationFn: updateOfficer,
        onSuccess: () => queryClient.invalidateQueries(["membersData"]),
    });

    const {
        data: membersData,
        isLoading: isMembersLoading,
        error: membersError,
        refetch: refetchMembers,
        isSuccess: membersSuccess,
    } = useQuery({
        queryKey: ["membersData"],
        queryFn: fetchMembers,
        enabled: isUserRSORepresentative && isAccount,
        onSuccess: (data) => queryClient.setQueryData(["membersData"], data),
    });

    const {
        mutate: createOfficerMutate,
        isLoading: isCreatingOfficer,
        isError: isCreateOfficerError,
        isSuccess: isCreateOfficerSuccess,
    } = useMutation({
        mutationFn: createOfficer,
        enabled: isUserRSORepresentative && isAccount,
        onSuccess: () => queryClient.invalidateQueries(["membersData"]),
    });

    const {
        data: rsoDetails,
        isLoading: isRSODetailsLoading,
        isError: isRSODetailsError,
        isSuccess: isRSODetailsSuccess,
    } = useQuery({
        queryKey: ["rsoDetails"],
        queryFn: fetchRSODetailsRequest,
        // staleTime: Infinity,
        // cacheTime: Infinity,
        // refetchOnMount: false,
        // refetchOnWindowFocus: false,
        // refetchOnReconnect: false,
        staleTime: 5 * 60 * 1000,
        enabled: true,
    });

    const {
        mutate: deleteOfficerMutate,
        isLoading: isDeleting,
        isError: isDeleteError,
        isSuccess: isDeleteSuccess,
    } = useMutation({
        mutationFn: deleteOfficer,
        onSuccess: () => {
            queryClient.invalidateQueries(["membersData"]);
        },
        onError: (err) => {
            console.error("Error deleting officer:", err);
        }
    });

    return {
        // Update Officer
        updateOfficerMutate,
        isUpdatingOfficer,
        isUpdateOfficerError,
        isUpdateOfficerSuccess,

        // Members Data
        membersData,
        isMembersLoading,
        membersError,
        refetchMembers,
        membersSuccess,

        // Create Officer
        createOfficerMutate,
        isCreatingOfficer,
        isCreateOfficerError,
        isCreateOfficerSuccess,

        // RSO Details
        rsoDetails,
        isRSODetailsLoading,
        isRSODetailsError,
        isRSODetailsSuccess,

        // Delete Officer
        deleteOfficerMutate,
        isDeleting,
        isDeleteError,
        isDeleteSuccess,
    };
}



export default useRSODetails;
