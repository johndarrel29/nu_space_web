import { useQuery } from "@tanstack/react-query";
import { useTokenStore, useUserStoreWithAuth } from "../../store";

const getTemplateFormsRequest = async ({ queryKey }) => {
    try {
        const token = useTokenStore.getState().token;
        const [, filter] = queryKey;
        const { search, formType } = filter;
        const queryParams = new URLSearchParams();
        if (search) queryParams.append("search", search);
        if (formType && formType !== "All") queryParams.append("formType", formType);

        console.log("Fetching template forms with params:", `${process.env.REACT_APP_BASE_URL}/api/rsoRep/forms/fetch-forms?${queryParams.toString()}`);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/forms/fetch-forms?${queryParams.toString()}`, {
            method: "GET",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
        });

        if (!response.ok) {
            const errorData = await response.json(); // try to read the server's message
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching template forms:", error);
        throw error;
    }
}

const getSpecificFormRequest = async ({ queryKey }) => {
    try {
        const token = useTokenStore.getState().token;
        const [_, formId] = queryKey;
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/forms/fetch-specific-form/${formId}`, {
            method: "GET",
            headers: {
                Authorization: token,
                "Content-Type": "application/json",
            },
        });
        if (!response.ok) {
            const errorData = await response.json(); // try to read the server's message
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);

        }
        return await response.json();
    } catch (error) {
        console.error("Error fetching specific form:", error);
        throw error;
    }
}

function useRSOForms({
    search = "",
    formType = "All",
    formId = null,
} = {}) {
    const { isUserRSORepresentative } = useUserStoreWithAuth();

    console.log("calling useRSOForms with:", { search, formType, isUserRSORepresentative });

    const filter = {
        search,
        formType,
    };

    const {
        data: rsoFormsTemplate,
        isLoading: isLoadingRSOFormsTemplate,
        isError: isErrorRSOFormsTemplate,
        error: errorRSOFormsTemplate,
    } = useQuery({
        queryKey: ["rsoFormsTemplate", filter],
        queryFn: getTemplateFormsRequest,
        refetchOnWindowFocus: false,
        enabled: !!isUserRSORepresentative, // Only run if the user is an RSO representative
    });

    const {
        data: specificRSOForm,
        isLoading: isLoadingSpecificRSOForm,
        isError: isErrorSpecificRSOForm,
        error: errorSpecificRSOForm,
    } = useQuery({
        queryKey: ["specificForm", formId],
        queryFn: getSpecificFormRequest,
        refetchOnWindowFocus: false,
        enabled: !!formId && !!isUserRSORepresentative, // Only run if formId is provided and the user is an RSO representative
    });

    return {
        rsoFormsTemplate,
        isLoadingRSOFormsTemplate,
        isErrorRSOFormsTemplate,
        errorRSOFormsTemplate,

        specificRSOForm,
        isLoadingSpecificRSOForm,
        isErrorSpecificRSOForm,
        errorSpecificRSOForm,
    };
}

export default useRSOForms;