
import { useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useTokenStore, useUserStoreWithAuth } from "../store";

const uploadSignature = async ({ adminId, file }) => {
    try {
        const token = useTokenStore.getState().getToken();
        const formData = new FormData();
        formData.append("file", file);
        console.log("[Signature] Uploading file with id:", adminId, formData.get("file"));

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/signature/upload-signature/${adminId}`, {
            method: "POST",
            headers: {
                Authorization: token || "",
            },
            body: formData,
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("[Signature] Upload error:", error);
        throw error;
    }
}

const getSignature = async (id) => {
    try {
        const token = useTokenStore.getState().getToken();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/signature/fetch-signature/${id}`, {
            method: "GET",
            headers: {
                Authorization: token || "",
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("[Signature] Fetch error:", error);
        throw error;
    }
}

const deleteSignature = async (id) => {
    try {
        const token = useTokenStore.getState().getToken();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/signature/delete-signature/${id}`, {
            method: "DELETE",
            headers: {
                Authorization: token || "",
            },
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("[Signature] Delete error:", error);
        throw error;
    }
}

function useSignature({ id } = {}) {
    const { isCoordinator, isAdmin, isSuperAdmin, isAVP, isDirector } = useUserStoreWithAuth();
    const location = useLocation();
    const isOnDashboardPage = location.pathname === '/dashboard';
    const isOnWatermarkPage = location.pathname === '/watermark';

    const {
        mutate: mutateUploadSignature,
        isLoading: isUploading,
        isError: isUploadError,
        error: uploadError,
        data: uploadData
    } = useMutation({
        mutationFn: uploadSignature,
        enabled: (isCoordinator || isDirector || isAVP) && isOnDashboardPage,
        onSuccess: (data) => {
            console.log("[Signature] Upload successful:", data);
        }
    });

    const {
        data: signatureData,
        isLoading: isFetching,
        isError: isFetchError,
        error: fetchError,
        refetch: refetchSignature
    } = useQuery({
        queryKey: ['signature', id],
        queryFn: () => getSignature(id),
        enabled: (isCoordinator || isDirector || isAVP) && (isOnDashboardPage || isOnWatermarkPage) && !!id,
        enabled: !!id, // Only fetch if id is available
        onSuccess: (data) => {
            console.log("[Signature] Fetch successful:", data);
        }
    });

    const {
        mutate: mutateDeleteSignature,
        isLoading: isDeleting,
        isError: isDeleteError,
        error: deleteError,
        data: deleteData
    } = useMutation({
        mutationFn: deleteSignature,
        enabled: (isCoordinator || isDirector || isAVP) && isOnDashboardPage,
        onSuccess: (data) => {
            console.log("[Signature] Delete successful:", data);
        }
    });

    return {
        // upload mutation
        mutateUploadSignature,
        isUploading,
        isUploadError,
        uploadError,
        uploadData,
        // fetch query
        signatureData,
        isFetching,
        isFetchError,
        fetchError,
        refetchSignature,

        // delete mutation
        mutateDeleteSignature,
        isDeleting,
        isDeleteError,
        deleteError,
        deleteData
    }
}

export default useSignature;