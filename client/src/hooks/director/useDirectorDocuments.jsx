import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useUserStoreWithAuth } from '../../store';
import { useTokenStore } from "../../store/tokenStore";

const fetchDirectorDocuments = async ({ queryKey }) => {
    try {
        const token = useTokenStore.getState().getToken();
        const [_key, params] = queryKey;

        // Filter out undefined, null, or empty string values from params
        const filteredParams = {};
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                filteredParams[key] = value;
            }
        });

        // Construct the query string from params
        const queryString = new URLSearchParams(filteredParams).toString();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/director/documents/fetch-documents?${queryString}`, {
            method: "GET",
            headers: {
                Authorization: token || "",
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching director documents: ${response.statusText}`);
        }

        const data = await response.json();
        return data.documents || [];
    } catch (error) {
        console.error("Error fetching director documents:", error);
        throw error;
    }
}

const approveDirectorDocument = async ({ formData, documentId }) => {
    try {
        const token = useTokenStore.getState().getToken();

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/director/documents/approveDocument/${documentId}`, {
            method: "PATCH",
            headers: {
                Authorization: token || "",
            },
            body: formData
        });

        if (!response.ok) {
            const errorData = await response.json(); // try to read the server's message
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error approving director document:", error);
        throw error;
    }
}

const getDirectorActivityDocumentsRequest = async ({ queryKey, pageParam = 1 }) => {
    try {
        const token = useTokenStore.getState().getToken();
        const [_, filter] = queryKey;
        const { limit = 12, query = "", sorted = "", RSO = "", RSOType = "", college = "", isGPOA = "All", page = 1 } = filter;

        const url = new URL(`${process.env.REACT_APP_BASE_URL}/api/director/documents/all-activities`);

        if (page > 1) {
            if (page) url.searchParams.set("page", page);
        } else {
            url.searchParams.set("page", pageParam);
        }
        url.searchParams.set("limit", limit);
        if (query) url.searchParams.set("search", query);
        if (RSO) url.searchParams.set("RSO", RSO)
        if (RSOType) url.searchParams.set("RSOType", RSOType);
        if (isGPOA && isGPOA !== "All") url.searchParams.set("isGPOA", isGPOA === true ? "true" : "false");
        if (college) url.searchParams.set("college", college);
        if (sorted) url.searchParams.set("sorted", sorted);

        const response = await fetch(url, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        if (!response.ok) {
            const errorData = await response.json(); // try to read the server's message
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return {
            activities: data.activities,
            hasNextPage: data.pagination?.hasNextPage,
            nextPage: data.pagination?.hasNextPage ? pageParam + 1 : undefined,
            pagination: data.pagination,
            totalActivities: data.pagination?.total || 0,
        };
    } catch (error) {
        console.error("Error fetching director activity documents:", error);
        throw error;
    }
}

function useDirectorDocuments({
    page = 1,
    limit = 10,
    purpose = "",
    status = "",
    rsoId = "",
    startDate = "",
    endDate = "",
    search = "",
    documentType = "",
    yearId = "",
    query = "",
    debouncedQuery = "",
    sorted = "",
    RSO = "",
    isGPOA = "All",
    RSOType = "",
    college = "",
} = {}) {
    const { isDirector } = useUserStoreWithAuth();
    const queryClient = useQueryClient();

    const filters = {
        page,
        limit,
        purpose,
        status,
        rsoId,
        startDate,
        endDate,
        search,
        documentType,
        yearId,
    };

    const filter = {
        query: debouncedQuery,
        limit,
        sorted,
        RSO,
        isGPOA,
        RSOType,
        college,
        page,
    };

    useEffect(() => {
        if (!isDirector) {
            queryClient.removeQueries(['directorDocuments']);
        }
    }, [isDirector, queryClient]);

    const {
        data: directorDocuments,
        isLoading: documentsLoading,
        isError: documentsError,
        error: documentsErrorMessage,
        refetch: refetchDocuments,
        isRefetching: isRefetchingDocuments,
        isFetched: isDocumentsFetched,
    } = useQuery({
        queryKey: ["directorDocuments", filters],
        queryFn: fetchDirectorDocuments,
        enabled: isDirector,
    });

    const {
        mutate: approveDirectorDocumentMutate,
        isLoading: isDirectorApprovingDocument,
        isError: isDirectorApproveDocumentError,
        isSuccess: isDirectorApproveDocumentSuccess,
    } = useMutation({
        mutationFn: approveDirectorDocument,
        onSuccess: (data) => {
            // Optionally, you can refetch the data or update the state here
            queryClient.invalidateQueries(["directorDocuments"]);
        },
        onError: (error) => {
            console.error("Error approving document:", error);
        },
        enabled: isDirector,
    });

    const {
        data: getDirectorActivityDocuments,
        refetch: refetchDirectorActivityDocuments,
        isLoading: isDirectorActivityDocumentsLoading,
        isError: isDirectorActivityDocumentsError,
        error: directorActivityDocumentsError,
    } = useQuery({
        queryKey: ['directorActivityDocuments', filter],
        queryFn: getDirectorActivityDocumentsRequest,
        enabled: isDirector,
    });

    return {
        // Data and loading/error states for director documents
        directorDocuments,
        documentsLoading,
        documentsError,
        documentsErrorMessage,
        refetchDocuments,
        isRefetchingDocuments,
        isDocumentsFetched,

        // Approve document functionality
        approveDirectorDocumentMutate,
        isDirectorApprovingDocument,
        isDirectorApproveDocumentError,
        isDirectorApproveDocumentSuccess,

        // Director activity documents
        getDirectorActivityDocuments,
        refetchDirectorActivityDocuments,
        isDirectorActivityDocumentsLoading,
        isDirectorActivityDocumentsError,
        directorActivityDocumentsError,
    };
}

export default useDirectorDocuments;