import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
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

function useRSODetails() {
    const { isUserRSORepresentative } = useUserStoreWithAuth();
    const queryClient = useQueryClient();

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
        enabled: isUserRSORepresentative,
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
        enabled: isUserRSORepresentative,
        onSuccess: (data) => queryClient.setQueryData(["membersData"], data),
    });

    const {
        mutate: createOfficerMutate,
        isLoading: isCreatingOfficer,
        isError: isCreateOfficerError,
        isSuccess: isCreateOfficerSuccess,
    } = useMutation({
        mutationFn: createOfficer,
        enabled: isUserRSORepresentative,
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
        enabled: isUserRSORepresentative,
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
    };
}

export default useRSODetails;
