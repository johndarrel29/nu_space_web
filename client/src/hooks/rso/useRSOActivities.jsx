import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '../../context/AuthContext';
import { useTokenStore, useUserStoreWithAuth } from "../../store";

const getActivityDocumentsRequest = async ({ queryKey }) => {
    try {
        const [_key, { activityId }] = queryKey;

        console.log("getActivityDocumentsRequest received activityId: ", activityId);
        const token = useTokenStore.getState().token;
        const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/documents/fetch-activity/${activityId}`, {
            method: "GET",
            headers: {
                Authorization: token,
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Fetch failed: ${errorText}`);
        }

        return response.json();

    } catch (error) {
        console.error("Error fetching activity documents:", error);
        throw error;
    }
};

// Pure API: create activity
const createActivityAPI = async (activity) => {
    // no local state updates here
    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

    console.log("received activity data ", activity)

    const isFileUpload = activity?.Activity_image instanceof File;
    let body;
    const headers = {};
    if (isFileUpload) {
        const formData = new FormData();
        Object.entries(activity || {}).forEach(([key, value]) => {
            if (key === "Activity_imagePreview") return;
            if (key === "Activity_image" && value instanceof File) {
                formData.append("file", value);
                return;
            }
            // Convert date fields to UTC string
            if (key === "Activity_start_datetime" && value) {
                formData.append(key, new Date(value).toISOString());
                return;
            }
            if (key === "Activity_end_datetime" && value) {
                formData.append(key, new Date(value).toISOString());
                return;
            }
            if (Array.isArray(value)) {
                value.forEach(v => formData.append(key, v));
            } else {
                formData.append(key, value);
            }
        });
        body = formData;
    } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(activity);
    }
    if (token) headers["Authorization"] = token ? `Bearer ${formattedToken}` : "";

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/activities/createActivity`, {
        method: "POST",
        headers,
        body,
    });

    if (!response.ok) {
        const errorData = await response.json(); // try to read the server's message
        throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
    }

    const json = await response.json();
    return json.activity ?? json;
};

// Pure API: update activity
const updateActivityAPI = async ({ activityId, updatedData }) => {
    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

    console.log("Updating activity ID:", activityId, "with data:", updatedData);

    const isFileUpload = updatedData?.Activity_image instanceof File;
    let body;
    const headers = {};
    if (isFileUpload) {
        const formData = new FormData();
        Object.entries(updatedData || {}).forEach(([key, value]) => {
            formData.append(key, value);
        });
        body = formData;
    } else {
        headers["Content-Type"] = "application/json";
        body = JSON.stringify(updatedData);
    }
    if (token) headers["Authorization"] = token ? `Bearer ${formattedToken}` : "";

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/activities/updateActivity/${activityId}`, {
        method: "PUT",
        headers,
        body,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.status} - ${response.statusText}`);
    }

    const json = await response.json();
    return json.activity ?? json;
};

// Pure API: delete activity
const deleteActivityAPI = async (activityId) => {
    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;
    const headers = {
        "Content-Type": "application/json",
    };
    if (token) headers["Authorization"] = token ? `Bearer ${formattedToken}` : "";

    console.log("Deleting activity with ID:", activityId);

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/activities/deleteActivity/${activityId}`, {
        method: "DELETE",
        headers,
    });

    if (!response.ok) {
        const errorBody = await response.text();
        throw new Error(errorBody || `Error: ${response.status} - ${response.statusText}`);
    }

    const json = await response.json();
    return json.activity ?? json;
};

// Pure API: fetch activity documents (by activityId)
const fetchActivityDocumentAPI = async ({ queryKey }) => {
    const [_key, { activityId }] = queryKey;
    if (!activityId) throw new Error("activityId is required");

    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/activities/${activityId}/documents`, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${formattedToken}` : "",
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
};

// Pure API: create activity document
const createActivityDocumentAPI = async ({ activityId, formData }) => {
    const token = localStorage.getItem("token");
    const headers = {};
    if (token) headers["Authorization"] = token;

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/activities/${activityId}/documents`, {
        method: "POST",
        headers,
        body: formData,
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
};

// Pure API: delete activity document
const deleteActivityDocumentAPI = async ({ activityId, documentId }) => {
    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/activities/${activityId}/documents/${documentId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${formattedToken}` : "",
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
};

// Pure API: fetch local activities (accepts params via queryKey)
const fetchLocalActivityAPI = async ({ queryKey }) => {
    const [_key, params = {}] = queryKey;
    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

    const url = new URL(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/activities/getRSOCreatedActivities`);
    Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== "") {
            url.searchParams.set(k, v);
        }
    });

    const response = await fetch(url.toString(), {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${formattedToken}` : "",
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.status} - ${response.statusText}`);
    }

    const json = await response.json();
    return json.activities ?? [];
};

// Pure API: view activity details (role-aware)
const viewActivityAPI = async ({ queryKey }) => {
    const [_key, { activityId, role }] = queryKey;
    if (!activityId) throw new Error("activityId is required");

    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

    let url = "";
    switch (role) {
        case "admin":
            url = `${process.env.REACT_APP_BASE_URL}/api/admin/activities/${activityId}`;
            break;
        case "rso_representative":
            url = `${process.env.REACT_APP_BASE_URL}/api/rsoRep/activities/viewRSOActivity/${activityId}`;
            break;
        default:
            throw new Error("No URL defined for role: " + role);
    }

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${formattedToken}` : "",
        },
    });

    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.status} - ${response.statusText}`);
    }

    const json = await response.json();
    return json.activity ?? json;
};

function useRSOActivities({ sorted, search, activityId } = {}) {
    const { user } = useAuth();
    const { isUserRSORepresentative } = useUserStoreWithAuth();
    const queryClient = useQueryClient();

    console.log("useRSOActivities called with activityId:", activityId);

    // Create activity
    const {
        mutate: createActivityMutate,
        isLoading: isCreatingActivity,
        isSuccess: isActivityCreated,
        isError: isActivityCreationError,
        error: activityCreationError,

    } = useMutation({
        mutationFn: createActivityAPI,
        enabled: isUserRSORepresentative,
        onSuccess: (data) => {
            console.log("Activity created successfully:", data);
            queryClient.invalidateQueries(["activities"]);
        },
    });


    // Update activity
    const {
        mutate: updateActivityMutate,
        isLoading: isUpdatingActivity,
        isSuccess: isActivityUpdated,
        isError: isActivityUpdateError,
        error: activityUpdateError,
    } = useMutation({
        enabled: isUserRSORepresentative,
        mutationFn: updateActivityAPI,
        onSuccess: (data) => {
            console.log("Activity updated successfully:", data);
            queryClient.invalidateQueries(["activities"]);
            if (activityId) {
                queryClient.invalidateQueries(["activityDetails", { activityId }]);
            }
        },

    });

    // Delete activity
    const {
        mutate: deleteActivityMutate,
        isLoading: isDeletingActivity,
        isSuccess: isActivityDeleted,
        isError: isActivityDeletionError,
        error: activityDeletionError,
    } = useMutation({
        enabled: isUserRSORepresentative,
        mutationFn: deleteActivityAPI,
        onSuccess: (data) => {
            console.log("Activity deleted successfully:", data);
            queryClient.invalidateQueries(["activities"]);
        },
    });

    // Fetch local activities list
    const {
        data: activityLocalData,
        isLoading: activityLocalLoading,
        isError: activityLocalError,
        error: activityLocalQueryError,
        refetch: refetchLocalActivityData,
        isRefetching: isLocalActivityRefetching,
    } = useQuery({
        queryKey: ["activities", { sorted, search }],
        queryFn: fetchLocalActivityAPI,
        enabled: isUserRSORepresentative,
        onSuccess: (data) => {
            console.log("Activities fetched successfully:", data);
        },
        onError: (error) => {
            console.error("Error fetching activities:", error);
        },
    });

    // Fetch activity documents/details (documents)
    const {
        data: activityDetails,
        isLoading: activityDetailsLoading,
        isError: activityDetailsError,
        error: activityDetailsQueryError,
        refetch: refetchActivityDetails,
    } = useQuery({
        queryKey: ["activityDetails", { activityId }],
        queryFn: fetchActivityDocumentAPI,
        enabled: !!activityId,
        onSuccess: (data) => {
            console.log("Activity documents fetched:", data);
        },
        onError: (error) => {
            console.error("Error fetching activity documents:", error);
        },
    });

    // Optionally fetch role-aware activity view/details
    const {
        data: activityView,
        isLoading: activityViewLoading,
        isError: activityViewError,
        error: activityViewQueryError,
        refetch: refetchActivityView,
    } = useQuery({
        queryKey: ["activityView", { activityId, role: user?.role }],
        queryFn: viewActivityAPI,
        enabled: !!activityId && isUserRSORepresentative,
        onSuccess: (data) => {
            console.log("Activity view fetched:", data);
        },
        onError: (error) => {
            console.error("Error fetching activity view:", error);
        },
    });

    // create/delete activity document mutations
    const {
        mutate: createActivityDocumentMutation,
        isLoading: createActivityDocumentLoading,
        isSuccess: createActivityDocumentSuccess,
        isError: createActivityDocumentError,
        error: createActivityDocumentErrorMessage,
    } = useMutation({
        enabled: isUserRSORepresentative,
        mutationFn: createActivityDocumentAPI,
        onSuccess: () => {
            if (activityId) queryClient.invalidateQueries(["activityDocuments", { activityId }]);
        },
    });

    const {
        mutate: deleteActivityDocumentMutation,
        isLoading: deleteActivityDocumentLoading,
        isSuccess: deleteActivityDocumentSuccess,
        isError: deleteActivityDocumentError,
        error: deleteActivityDocumentErrorMessage,
    } = useMutation({
        enabled: isUserRSORepresentative,
        mutationFn: deleteActivityDocumentAPI,
        onSuccess: () => {
            if (activityId) queryClient.invalidateQueries(["activityDocuments", { activityId }]);
        },
    });

    const {
        data: activityDocuments,
        isLoading: activityDocumentsLoading,
        isError: activityDocumentsError,
        error: activityDocumentsErrorMessage,
    } = useQuery({
        queryKey: ["uploadActivityDocument", { activityId }],
        queryFn: getActivityDocumentsRequest,
        enabled: !!activityId,
        onSuccess: (data) => {
            console.log("Upload activity document data fetched:", data);
        },
        onError: (error) => {
            console.error("Error fetching upload activity document data:", error);
        },
    });

    return {
        // create
        createActivityMutate,
        isCreatingActivity,
        isActivityCreated,
        isActivityCreationError,
        activityCreationError,

        // update
        updateActivityMutate,
        isUpdatingActivity,
        isActivityUpdated,
        isActivityUpdateError,
        activityUpdateError,

        // delete
        deleteActivityMutate,
        isDeletingActivity,
        isActivityDeleted,
        isActivityDeletionError,
        activityDeletionError,

        // activities list
        activityLocalData,
        activityLocalLoading,
        activityLocalError,
        activityLocalQueryError,
        refetchLocalActivityData,
        isLocalActivityRefetching,

        // activity documents/details
        activityDetails,
        activityDetailsLoading,
        activityDetailsError,
        activityDetailsQueryError,
        refetchActivityDetails,

        // activity view
        activityView,
        activityViewLoading,
        activityViewError,
        activityViewQueryError,
        refetchActivityView,

        // activity document mutations
        createActivityDocumentMutation,
        createActivityDocumentLoading,
        createActivityDocumentSuccess,
        createActivityDocumentError,
        createActivityDocumentErrorMessage,

        deleteActivityDocumentMutation,
        deleteActivityDocumentLoading,
        deleteActivityDocumentSuccess,
        deleteActivityDocumentError,
        deleteActivityDocumentErrorMessage,

        activityDocuments,
        activityDocumentsLoading,
        activityDocumentsError,
        activityDocumentsErrorMessage,
    };
}

export default useRSOActivities;