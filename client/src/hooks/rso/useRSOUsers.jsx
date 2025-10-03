import { QueryClient, useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useTokenStore, useUserStoreWithAuth } from '../../store';

const fetchMembers = async () => {
    try {
        const token = useTokenStore.getState().getToken();

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/user/get-members`, {
            method: "GET",
            headers: {
                Authorization: token,
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error("Failed to fetch members");
        }
    } catch (error) {
        console.error("error getting RSO members", error.message);
    }
}

const fetchApplicants = async () => {
    try {
        const token = useTokenStore.getState().getToken();

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/user/fetch-applicants`, {
            method: "GET",
            headers: {
                Authorization: token,
            },
        });

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error("Failed to fetch applicants");
        }
    } catch (error) {
        console.error("error getting RSO applicants", error.message);
    }
}

const approveUserMembership = async ({ id, approval }) => {
    try {
        const token = useTokenStore.getState().getToken();

        console.log("Approving membership for user ID:", id, "approval ", ({ "approval": true }));

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/user/membership-approval/${id}`, {
            method: "PATCH",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ approval }),
        });

        if (!response.ok) {
            const errorData = await response.json(); // try to read the server's message
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        if (response.ok) {
            const data = await response.json();
            return data;
        } else {
            throw new Error("Failed to approve membership");
        }


    } catch (error) {
        console.error("Error approving membership:", error.message);
        throw error;
    }
}

function useRSOUsers() {
    const { isUserRSORepresentative } = useUserStoreWithAuth();
    const location = useLocation();
    const isUsersPage = location.pathname === '/users';

    const {
        data: rsoMembers,
        isError: isErrorFetchingMembers,
        error: errorFetchingMembers,
        isLoading: isLoadingMembers,
        isRefetching: isRefetchingMembers,
        refetch: refetchMembers,
    } = useQuery({
        enabled: isUserRSORepresentative && isUsersPage,
        queryKey: ["rsoMembers"],
        queryFn: fetchMembers,
        onSuccess: () => {
            QueryClient.invalidateQueries(['rsoApplicants']);
            // Invalidate and refetch
            console.log("Members fetched successfully");
        }
    });

    const {
        data: rsoApplicants,
        isError: isErrorFetchingApplicants,
        isLoading: isLoadingApplicants,
        error: errorFetchingApplicants,
        isRefetching: isRefetchingApplicants,
        refetch: refetchApplicants,
    } = useQuery({
        enabled: isUserRSORepresentative && isUsersPage,
        queryKey: ["rsoApplicants"],
        queryFn: fetchApplicants,
        onSuccess: () => {
            QueryClient.invalidateQueries(['rsoMembers']);
            // Invalidate and refetch
            console.log("Applicants fetched successfully");
        }
    });

    const {
        mutate: approveMembership,
        isLoading: isApprovingMembership,
        isError: isErrorApprovingMembership,
        error: errorApprovingMembership,
        isSuccess: isSuccessApprovingMembership,
    } = useMutation({
        enabled: isUserRSORepresentative && isUsersPage,
        mutationFn: approveUserMembership,
        onSuccess: () => {
            refetchApplicants();
            // Invalidate and refetch
            console.log("Membership approved successfully");
        }
    });

    return {
        rsoMembers,
        isErrorFetchingMembers,
        errorFetchingMembers,
        isLoadingMembers,
        isRefetchingMembers,
        refetchMembers,

        rsoApplicants,
        isErrorFetchingApplicants,
        isLoadingApplicants,
        errorFetchingApplicants,
        isRefetchingApplicants,
        refetchApplicants,

        approveMembership,
        isApprovingMembership,
        isErrorApprovingMembership,
        errorApprovingMembership,
        isSuccessApprovingMembership,
    };
}

export default useRSOUsers;