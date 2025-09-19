import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useUserStoreWithAuth } from '../../store';
import { useTokenStore } from "../../store/tokenStore";

const getCoordinatorDocuments = async ({ queryKey }) => {
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
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/coordinator/documents/fetch-documents?${queryString}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Coordinator documents fetch failed:", errorText);
            throw new Error("Failed to fetch coordinator documents");
        }
        return response.json();

    } catch (error) {
        console.error("Error fetching coordinator documents:", error);
        throw error;
    }
}

const approveCoordinatorDocument = async ({ formData, documentId }) => {
    try {

        const token = useTokenStore.getState().getToken();

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/coordinator/documents/approveDocument/${documentId}`, {
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
        console.error("Error approving coordinator document:", error);
        throw error;
    }

}

function useCoordinatorDocuments({
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
    const { isCoordinator } = useUserStoreWithAuth();
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
        if (!isCoordinator) {
            queryClient.removeQueries(['coordinatorDocuments']);
        }
    }, [isCoordinator, queryClient]);

    const {
        data: coordinatorDocuments,
        isLoading: documentsLoading,
        isError: documentsError,
        error: documentsErrorMessage,
        refetch: refetchDocuments,
        isRefetching: isRefetchingDocuments,
        isFetched: isDocumentsFetched,
    } = useQuery({
        queryKey: ["coordinatorDocuments", filters],
        queryFn: getCoordinatorDocuments,
        enabled: isCoordinator
    });

    const {
        mutate: approveDocumentMutate,
        isLoading: isApprovingDocument,
        isError: isApproveDocumentError,
        isSuccess: isApproveDocumentSuccess,
    } = useMutation({
        mutationFn: approveCoordinatorDocument,
        onSuccess: (data) => {
            // Optionally, you can refetch the data or update the state here
            queryClient.invalidateQueries(["coordinatorDocuments"]);
        },
        onError: (error) => {
            console.error("Error approving document:", error);
        },
        enabled: isCoordinator
    });

    return {
        // Data and loading/error states for coordinator documents
        coordinatorDocuments,
        documentsLoading,
        documentsError,
        documentsErrorMessage,
        refetchDocuments,
        isRefetchingDocuments,
        isDocumentsFetched,

        // Approve document functionality
        approveDocumentMutate,
        isApprovingDocument,
        isApproveDocumentError,
        isApproveDocumentSuccess,
    };
}

export default useCoordinatorDocuments;