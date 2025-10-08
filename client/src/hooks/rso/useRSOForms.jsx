import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
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

const getSpecificActivityFormsResponse = async ({ queryKey }) => {
    try {
        const token = useTokenStore.getState().token;
        const [_, activityId] = queryKey;

        console.log("Fetching specific activity forms for activity ID:", activityId);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/forms/fetch-activity-responses/${activityId}`, {
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

        if (response.ok) {
            const data = await response.json();
            return data;
        }
    } catch (error) {
        console.error("Error fetching specific activity forms:", error);
        throw error;
    }
}


function useRSOForms({
    search = "",
    formType = "All",
    formId = null,
    manualEnabled = false,
    activityId = null,
} = {}) {

    const { isUserRSORepresentative } = useUserStoreWithAuth();
    const location = useLocation();
    const isFormsPage = location.pathname.startsWith('/forms') || location.pathname.startsWith('/form');

    console.log("calling useRSOForms with:", { search, formType, isUserRSORepresentative });

    console.log("activity id from params:", activityId);

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
        enabled: manualEnabled ? true : (!!isUserRSORepresentative && isFormsPage), // Only run if the user is an RSO representative and on forms page
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
        enabled: !!formId && !!isUserRSORepresentative && isFormsPage, // Only run if formId is provided, user is an RSO representative, and on forms page
    });

    const {
        data: specificActivityFormsResponse,
        isLoading: isLoadingSpecificActivityFormsResponse,
        isError: isErrorSpecificActivityFormsResponse,
        error: errorSpecificActivityFormsResponse,
    } = useQuery({
        queryKey: ["specificActivityForms", activityId],
        queryFn: getSpecificActivityFormsResponse,
        onSuccess: (data) => {
            console.log("Fetched specific activity forms response:", data);
        },
        refetchOnWindowFocus: false,
        // staleTime: 5 * 60 * 1000, // 5 minutes
        enabled: !!isUserRSORepresentative && !!activityId, // Only run if user is an RSO representative and activityId is provided
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

        specificActivityFormsResponse,
        isLoadingSpecificActivityFormsResponse,
        isErrorSpecificActivityFormsResponse,
        errorSpecificActivityFormsResponse,
    };
}

export default useRSOForms;