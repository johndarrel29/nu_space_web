import { useMutation, useQuery } from "@tanstack/react-query";
import { useUserStoreWithAuth } from '../../store';
import { useTokenStore } from "../../store/tokenStore";

const fetchAllForms = async ({ queryKey }) => {
    try {
        const token = useTokenStore.getState().getToken();
        console.log("Fetched token:", token);
        const [, filter] = queryKey;
        const { search, formType } = filter;
        const queryParams = new URLSearchParams();
        if (search) queryParams.append("search", search);
        if (formType && formType !== "All") queryParams.append("formType", formType);

        console.log("Fetching forms with params:", queryParams.toString());

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/forms/fetch-all-centralized-forms?${queryParams.toString()}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
        })

        if (!response.ok) {
            throw new Error("Failed to fetch forms");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.log("error encountered fetching forms: ", error.message)
        throw new Error("Failed to fetch forms");
    }
}

const createCentralizedForm = async (formData) => {
    try {
        const token = useTokenStore.getState().getToken();
        console.log("Creating form with data:", JSON.stringify(formData));

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/forms/createForm`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify(formData),
        })

        if (!response.ok) {
            throw new Error("Failed to create form");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.log("error encountered creating form: ", error.message)
        throw new Error("Failed to create form");
    }
}

const editCentralizedForm = async ({ formId, formData }) => {
    try {
        const token = useTokenStore.getState().getToken();

        console.log("data received ", { formId, formData });

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/forms/update-specific-form/${formId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
            body: JSON.stringify(formData),
        })

        if (!response.ok) {
            throw new Error("Failed to update form");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.log("error encountered updating form: ", error.message)
        throw new Error("Failed to update form");
    }
}

const fetchSpecificForms = async (formId) => {
    try {
        const token = useTokenStore.getState().getToken();
        console.log("fetched form id:", formId);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/forms/fetch-specific-form/${formId}`, {
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to fetch form");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error fetching specific form:", error);
        throw new Error("Failed to fetch specific form");
    }
}

const deleteCentralizedForm = async (formId) => {
    try {
        const token = useTokenStore.getState().getToken();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/forms/deleteForm/${formId}`, {
            method: "DELETE",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token,
            },
        });

        if (!response.ok) {
            throw new Error("Failed to delete form");
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error deleting form:", error);
        throw new Error("Failed to delete form");
    }
}

function useAdminCentralizedForms({
    formId = "",
    search = "",
    formType = "All",
} = {}) {
    const token = useTokenStore.getState().getToken();
    const { isUserAdmin, isCoordinator, isUserRSORepresentative } = useUserStoreWithAuth();

    console.log(" useAdminCentralizedForms has been called ", { formId });

    const filter = {
        search,
        formType,
    }

    const {
        data: allForms,
        isLoading: isLoadingAllForms,
        isRefetching: isRefetchingAllForms,
        refetch: refetchAllForms,
        error: errorAllForms
    } = useQuery({
        queryKey: ["admin-centralized-forms", filter],
        queryFn: fetchAllForms,
        staleTime: 60000,
        enabled: isUserAdmin || isCoordinator, // only run if user is admin or coordinator
    });

    const {
        mutate: createFormMutate,
        isLoading: isCreatingForm,
        isError: isCreatingFormError,
        error: createFormError
    } = useMutation({
        mutationFn: createCentralizedForm,
        enabled: !!token && (isUserAdmin || isCoordinator),
        onSuccess: () => {
            // Invalidate and refetch
            refetchAllForms();
        },
        onError: (error) => {
            console.error("Error creating form:", error);
        },
    });

    const {
        data: specificForm,
        isLoading: isLoadingSpecificForm,
        isError: isErrorSpecificForm,
        error: specificFormError
    } = useQuery({
        queryKey: ["admin-centralized-form", formId],
        queryFn: () => fetchSpecificForms(formId),
        enabled: !!formId && (isUserAdmin || isCoordinator), // only run if formId is provided and user is admin or coordinator
    });

    const {
        mutate: editFormMutate,
        isLoading: isEditingForm,
        isError: isEditingFormError,
        error: editFormError
    } = useMutation({
        mutationFn: editCentralizedForm,
        enabled: isUserAdmin || isCoordinator,
    });

    const {
        mutate: deleteFormMutate,
        isLoading: isDeletingForm,
        isError: isDeletingFormError,
        error: deleteFormError
    } = useMutation({
        mutationFn: deleteCentralizedForm,
        enabled: isUserAdmin || isCoordinator,
    });

    return {
        allForms,
        isLoadingAllForms,
        isRefetchingAllForms,
        refetchAllForms,
        errorAllForms,

        // create form
        createFormMutate,
        isCreatingForm,
        isCreatingFormError,
        createFormError,

        // specific forms
        specificForm,
        isLoadingSpecificForm,
        isErrorSpecificForm,
        specificFormError,

        // edit forms
        editFormMutate,
        isEditingForm,
        isEditingFormError,
        editFormError,

        // delete forms
        deleteFormMutate,
        isDeletingForm,
        isDeletingFormError,
        deleteFormError
    };
}

export default useAdminCentralizedForms;