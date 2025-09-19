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
                "Content-Type": "application/json",
                Authorization: token || "",
            },
            body: JSON.stringify(formData)
        });

        if (!response.ok) {
            throw new Error(`Error approving document: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error approving director document:", error);
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

    };
}

export default useDirectorDocuments;