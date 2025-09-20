import { useMutation, useQuery } from "@tanstack/react-query";
import { useUserStoreWithAuth } from '../../store';
import { useTokenStore } from "../../store/tokenStore";

// API call function
const getAcademicYears = async () => {
    try {
        const token = useTokenStore.getState().getToken();

        console.log("Fetching academic years with token:", token, "and url: ", `${process.env.REACT_APP_BASE_URL}/api/admin/academicYear/getAcademicYears`);
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/academicYear/getAcademicYears`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Academic years fetch failed:", errorText);
            throw new Error("Failed to fetch academic years");
        }
        console.log("Response status:", response.status);
        return response.json();

    } catch (error) {
        console.error("Error fetching academic years:", error);
        throw error; // rethrow so react-query can handle the error state
    }
}

const editAcademicYearRequest = async (params) => {
    try {
        const { academicYearData, yearId } = params;
        console.log("Editing academic year with data:", academicYearData, "and yearId:", yearId);
        // Send just the academicYearData object without wrapping it
        console.log("stringify json body ", JSON.stringify(academicYearData));
        const token = useTokenStore.getState().getToken();

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/academicYear/updateAcademicYear/${yearId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
            body: JSON.stringify(academicYearData),
        });
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText.message || `Error: ${response.status} - ${response.statusText}`);
        }

        return response.json();

    } catch (error) {
        console.error("Error editing academic year:", error);
        throw error; // rethrow so react-query can handle the error state
    }
}

const createAcademicYearRequest = async (params) => {
    try {
        const { academicYearData } = params;
        console.log("Creating academic year with data:", academicYearData);
        const token = useTokenStore.getState().getToken();

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/academicYear/createAcademicYear`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
            body: JSON.stringify(academicYearData),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Create academic year failed:", errorText);
            throw new Error("Failed to create academic year");
        }

        return response.json();

    } catch (error) {
        console.error("Error creating academic year:", error);
        throw error; // rethrow so react-query can handle the error state
    }
}

const deleteAcademicYearRequest = async ({ yearId }) => {
    console.log("ive been called")
    try {
        console.log("Deleting academic year with ID:", yearId);
        const token = useTokenStore.getState().getToken();

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/academicYear/deleteAcademicYear/${yearId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("Delete academic year failed:", errorText);
            throw new Error("Failed to delete academic year");
        }

        return response.json();

    } catch (error) {
        console.error("Error deleting academic year:", error);
        throw error; // rethrow so react-query can handle the error state
    }
}

function useAdminAcademicYears() {
    const { isUserAdmin, isCoordinator } = useUserStoreWithAuth();

    // custom hook to fetch academic years
    // admin only
    const {
        data: academicYears,
        isLoading: academicYearsLoading,
        isError: academicYearsError,
        error: academicYearsErrorMessage,
        refetch: refetchAcademicYears,
        isRefetching: isRefetchingAcademicYears,
        isFetched: isAcademicYearsFetched,
    } = useQuery({
        queryKey: ["academicYears"],
        queryFn: getAcademicYears,
        enabled: isUserAdmin || isCoordinator, // only run if user is admin or coordinator
    })

    const {
        mutate: editAcademicYear,
        isLoading: isEditingAcademicYear,
        isError: isEditingAcademicYearError,
        error: isEditingAcademicYearErrorMessage,
        isSuccess: isEditingAcademicYearSuccess,
    } = useMutation({
        mutationFn: editAcademicYearRequest,
        enabled: isUserAdmin || isCoordinator,
        onSuccess: () => {
            refetchAcademicYears();
        },
        onError: (error) => {
            console.error("Error editing academic year:", error);
        }
    });

    const {
        mutate: deleteAcademicYear,
        isLoading: isDeletingAcademicYear,
        isError: isDeletingAcademicYearError,
        error: isDeletingAcademicYearErrorMessage,
        isSuccess: isDeletingAcademicYearSuccess,
    } = useMutation({
        mutationFn: deleteAcademicYearRequest,
        enabled: isUserAdmin || isCoordinator,
        onSuccess: () => {
            refetchAcademicYears();
        },
        onError: (error) => {
            console.error("Error deleting academic year:", error);
        }
    });

    const {
        mutate: createAcademicYear,
        isLoading: isCreatingAcademicYear,
        isError: isCreatingAcademicYearError,
        error: isCreatingAcademicYearErrorMessage,
        isSuccess: isCreatingAcademicYearSuccess,
    } = useMutation({
        mutationFn: createAcademicYearRequest,
        enabled: isUserAdmin || isCoordinator,
        onSuccess: () => {
            refetchAcademicYears();
        },
        onError: (error) => {
            console.error("Error creating academic year:", error);
        }
    });

    return {
        academicYears,
        academicYearsLoading,
        academicYearsError,
        academicYearsErrorMessage,
        refetchAcademicYears,
        isRefetchingAcademicYears,
        isAcademicYearsFetched,

        editAcademicYear,
        isEditingAcademicYear,
        isEditingAcademicYearError,
        isEditingAcademicYearErrorMessage,
        isEditingAcademicYearSuccess,

        createAcademicYear,
        isCreatingAcademicYear,
        isCreatingAcademicYearError,
        isCreatingAcademicYearErrorMessage,
        isCreatingAcademicYearSuccess,

        deleteAcademicYear,
        isDeletingAcademicYear,
        isDeletingAcademicYearError,
        isDeletingAcademicYearErrorMessage,
        isDeletingAcademicYearSuccess
    };
}

export default useAdminAcademicYears;