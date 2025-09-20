import { useQuery } from "@tanstack/react-query";
import { useTokenStore } from "../store";

const fetchAdminDocsRequest = async () => {
    try {
        const token = useTokenStore.getState().token;



        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/dashboard/adminDocuments`, {
            method: "GET",
            headers: {
                Authorization: token,
            }
        });



        if (!response.ok) {
            throw new Error("Failed to fetch admin documents");
        }

        const data = await response.json();
        return data.documents ?? data; // <-- return the array if present, else fallback

    } catch (error) {
        console.error("Error fetching admin documents:", error.message);
        throw error;
    }
}

const fetchAccreditationRequest = async () => {
    try {
        const token = useTokenStore.getState().token;

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/dashboard/documents/accreditation`, {
            method: "GET",
            headers: {
                Authorization: token,
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch accreditation data");
        }

        const data = await response.json();
        return data.accreditation ?? data;

    } catch (error) {
        console.error("Error fetching accreditation data:", error.message);
        throw error;
    }
}

const fetchActivityRequest = async () => {
    try {
        const token = useTokenStore.getState().token;

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/dashboard/documents/fetch-activities`, {
            method: "GET",
            headers: {
                Authorization: token,
            }
        });

        if (!response.ok) {
            throw new Error("Failed to fetch activity data");
        }

        const data = await response.json();
        return data.activity ?? data;

    } catch (error) {
        console.error("Error fetching activity data:", error.message);
        throw error;
    }
}

const fetchCreatedActivityRequest = async () => {
    try {
        const token = useTokenStore.getState().token;

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/dashboard/rso/activities`, {
            method: "GET",
            headers: {
                Authorization: token,
                "Content-Type": "application/json"
            },
        });

        if (!response.ok) {
            throw new Error("Failed to create activity");
        }

        const data = await response.json();
        return data.activity ?? data;

    } catch (error) {
        console.error("Error creating activity:", error.message);
        throw error;
    }
}

const fetchMembersRequest = async () => {
    try {
        const token = useTokenStore.getState().token;

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/dashboard/members`, {
            method: "GET",
            headers: {
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
        console.error("Error fetching members data:", error.message);
        throw error;
    }
}

const fetchApplicantsRequest = async () => {
    try {
        const token = useTokenStore.getState().token;

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/dashboard/membership-applicants`, {
            method: "GET",
            headers: {
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
        console.error("Error fetching applicants data:", error.message);
        throw error;
    }
}



const useDashboard = () => {

    const {
        data: adminDocs,
        isLoading: isLoadingAdminDocs,
        isError: isErrorAdminDocs,
        error: errorAdminDocs
    } = useQuery({
        queryKey: ['adminDocs'],
        queryFn: fetchAdminDocsRequest,
        staleTime: 5 * 60 * 1000, // 5 minutes
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const {
        data: accreditation,
        isLoading: isLoadingAccreditation,
        isError: isErrorAccreditation,
        error: errorAccreditation
    } = useQuery({
        queryKey: ['accreditation'],
        queryFn: fetchAccreditationRequest,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const {
        data: activity,
        isLoading: isLoadingActivity,
        isError: isErrorActivity,
        error: errorActivity
    } = useQuery({
        queryKey: ['activity'],
        queryFn: fetchActivityRequest,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const {
        data: createdActivities,
        isLoading: isLoadingCreatedActivities,
        isError: isErrorCreatedActivities,
        error: errorCreatedActivities
    } = useQuery({
        queryKey: ['createdActivities'],
        queryFn: fetchCreatedActivityRequest,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const {
        data: RSOMembers,
        isLoading: isLoadingRSOMembers,
        isError: isErrorRSOMembers,
        error: errorRSOMembers
    } = useQuery({
        queryKey: ['RSOMembers'],
        queryFn: fetchMembersRequest,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    const {
        data: RSOApplicants,
        isLoading: isLoadingRSOApplicants,
        isError: isErrorRSOApplicants,
        error: errorRSOApplicants
    } = useQuery({
        queryKey: ['RSOApplicants'],
        queryFn: fetchApplicantsRequest,
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
        refetchOnReconnect: false,
    });

    return {
        adminDocs,
        isLoadingAdminDocs,
        isErrorAdminDocs,
        errorAdminDocs,

        accreditation,
        isLoadingAccreditation,
        isErrorAccreditation,
        errorAccreditation,

        activity,
        isLoadingActivity,
        isErrorActivity,
        errorActivity,

        createdActivities,
        isLoadingCreatedActivities,
        isErrorCreatedActivities,
        errorCreatedActivities,

        RSOMembers,
        isLoadingRSOMembers,
        isErrorRSOMembers,
        errorRSOMembers,

        RSOApplicants,
        isLoadingRSOApplicants,
        isErrorRSOApplicants,
        errorRSOApplicants
    };
}

export default useDashboard;