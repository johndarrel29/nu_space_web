import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useUserStoreWithAuth, useTokenStore } from '../../store';
import { useEffect } from "react";

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

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/avp/documents/approveDocument/${documentId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: token || "",
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            throw new Error(`Error approving document: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error approving AVP document:", error);
        throw error;
    }
}

function useAVPDocuments() {
    const { isAVP } = useUserStoreWithAuth();
    const queryClient = useQueryClient();

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
        enabled: !!isAVP,
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
    };
}

export default useAVPDocuments;
