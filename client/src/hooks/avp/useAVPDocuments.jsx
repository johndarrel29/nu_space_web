import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useTokenStore, useUserStoreWithAuth } from '../../store';

const getAVPDocuments = async ({ queryKey }) => {
    try {
        const token = useTokenStore.getState().getToken();
        const [, params = {}] = queryKey;

        // Filter out undefined, null, or empty string values from params
        const filteredParams = {};
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                filteredParams[key] = value;
            }
        });

        // Construct the query string from params
        const queryString = new URLSearchParams(filteredParams).toString();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/avp/documents/fetch-documents?${queryString}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });
        if (!response.ok) {
            const errorText = await response.text();
            console.error("AVP documents fetch failed:", errorText);
            throw new Error("Failed to fetch AVP documents");
        }
        return response.json();
    }
    catch (error) {
        console.error("Error fetching AVP documents:", error);
        throw error; // rethrow so react-query can handle the error state
    }
};

const approveAVPDocument = async ({ formData, documentId }) => {
    try {
        const token = useTokenStore.getState().getToken();

        console.log("Approving AVP document with ID:", documentId, "and formData:", formData);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/avp/documents/approveDocument/${documentId}`, {
            method: "PATCH",
            headers: {
                Authorization: token || "",
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json(); // try to read the server's message
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error approving AVP document:", error);
        throw error;
    }
}

const getAVPActivityDocumentsRequest = async ({ queryKey, pageParam = 1 }) => {
    try {
        const token = useTokenStore.getState().getToken();

        const [_, filter] = queryKey;
        const { limit = 12, query = "", sorted = "", RSO = "", RSOType = "", college = "", isGPOA = "All", page = 1 } = filter;

        let url = new URL(`${process.env.REACT_APP_BASE_URL}/api/avp/documents/all-activities`);
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

        console.log("Fetching admin activities with params:", {
            page: pageParam,
            query,
            sorted,
            isGPOA,
            RSO,
            RSOType,
            college,
        });


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
        console.error("Error fetching AVP activity documents:", error);
        throw error;
    }
}

function useAVPDocuments({
    debouncedQuery = "",
    limit = 12,
    sorted = "",
    RSO = "",
    RSOType = "",
    college = "",
    isGPOA = "All",
    page = 1,
} = {}) {
    const { isAVP } = useUserStoreWithAuth();
    const queryClient = useQueryClient();

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
        if (!isAVP) {
            queryClient.removeQueries(['avpDocuments']);
        }
    }, [isAVP, queryClient]);

    const {
        data: avpDocuments,
        isLoading: documentsLoading,
        isError: documentsError,
        error: documentsErrorMessage,
        refetch: refetchDocuments,
        isRefetching: isRefetchingDocuments,
        isFetched: isDocumentsFetched,
    } = useQuery({
        queryKey: ["avpDocuments"],
        queryFn: getAVPDocuments,
        enabled: isAVP,
    });

    const {
        mutate: approveAVPDocumentMutate,
        isLoading: isAVPApprovingDocument,
        isError: isAVPApproveDocumentError,
        isSuccess: isAVPApproveDocumentSuccess,
    } = useMutation({
        mutationFn: approveAVPDocument,
        onSuccess: () => {
            // Invalidate and refetch
            refetchDocuments();
        },
        enabled: isAVP,
    });

    const {
        data: avpActivityDocuments,
        refetch: refetchAVPActivityDocuments,
        isLoading: isAVPActivityDocumentsLoading,
        isError: isAVPActivityDocumentsError,
        error: avpActivityDocumentsError,
    } = useQuery({
        queryKey: ['avpActivityDocuments', filter],
        queryFn: getAVPActivityDocumentsRequest,
        enabled: isAVP,
    });

    return {
        avpDocuments,
        documentsLoading,
        documentsError,
        documentsErrorMessage,
        refetchDocuments,
        isRefetchingDocuments,
        isDocumentsFetched,

        approveAVPDocumentMutate,
        isAVPApprovingDocument,
        isAVPApproveDocumentError,
        isAVPApproveDocumentSuccess,

        avpActivityDocuments,
        refetchAVPActivityDocuments,
        isAVPActivityDocumentsLoading,
        isAVPActivityDocumentsError,
        avpActivityDocumentsError,
    };
}

export default useAVPDocuments;
