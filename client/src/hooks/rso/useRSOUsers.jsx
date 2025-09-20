import { useMutation, useQuery } from "@tanstack/react-query";
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

const approveUserMembership = async ({ id }) => {
    try {
        const token = useTokenStore.getState().getToken();

        console.log("Approving membership for user ID:", id, "approval ", ({ "approval": true }));

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/user/membership-approval/${id}`, {
            method: "PATCH",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ approval: true }),
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

    const {
        data: rsoMembers,
        isError: isErrorFetchingMembers,
        error: errorFetchingMembers,
        isRefetching: isRefetchingMembers,
        refetch: refetchMembers,
    } = useQuery({
        enabled: isUserRSORepresentative,
        queryKey: ["rsoMembers"],
        queryFn: fetchMembers
    });

    const {
        data: rsoApplicants,
        isError: isErrorFetchingApplicants,
        error: errorFetchingApplicants,
        isRefetching: isRefetchingApplicants,
        refetch: refetchApplicants,
    } = useQuery({
        enabled: isUserRSORepresentative,
        queryKey: ["rsoApplicants"],
        queryFn: fetchApplicants
    });

    const {
        mutate: approveMembership,
        isLoading: isApprovingMembership,
        isError: isErrorApprovingMembership,
        error: errorApprovingMembership,
        isSuccess: isSuccessApprovingMembership,
    } = useMutation({
        enabled: isUserRSORepresentative,
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
        isRefetchingMembers,
        refetchMembers,

        rsoApplicants,
        isErrorFetchingApplicants,
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