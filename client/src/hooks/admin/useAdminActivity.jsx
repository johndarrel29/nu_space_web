import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useUserStoreWithAuth } from '../../store';
import { useTokenStore } from "../../store/tokenStore";

// admin fetch activity with parameters
const fetchAdminActivity = async ({ queryKey, pageParam = 1 }) => {
    const token = useTokenStore.getState().getToken();

    const [_, filter] = queryKey;
    const { limit = 12, query = "", sorted = "", RSO = "", RSOType = "", college = "", isGPOA = "All", page = 1, academicYearId } = filter;

    // figure out how page is being passed

    const url = new URL(`${process.env.REACT_APP_BASE_URL}/api/admin/activities/fetch-activities`);
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
    if (academicYearId) url.searchParams.set("academicYearId", academicYearId);

    console.log("Fetching admin activities with params:", {
        page: pageParam,
        query,
        sorted,
        isGPOA,
        RSO,
        RSOType,
        college,
        academicYearId
    });

    console.log("url with params :", url.toString());

    const response = await fetch(url, {
        headers: {
            "Content-Type": "application/json",
            "Authorization": token,
        }
    }
    )

    if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }


    const data = await response.json();
    return {
        activities: data.activities,
        hasNextPage: data.pagination?.hasNextPage,
        nextPage: data.pagination?.hasNextPage ? pageParam + 1 : undefined,
        pagination: data.pagination,
        totalActivities: data.pagination?.total || 0,
    }
    // return response.json();

}

const preDocumentDeadlineRequest = async ({ activityId, preDocumentDeadline }) => {
    try {
        console.log("url:", `${process.env.REACT_APP_BASE_URL}/api/admin/activities/deadline/preDocDeadline/${activityId}`);
        console.log("id and preDocumentDeadline:", { activityId, end_deadline: preDocumentDeadline });

        const token = useTokenStore.getState().getToken();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/activities/deadline/preDocDeadline/${activityId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
            body: JSON.stringify({ end_deadline: preDocumentDeadline }),
        });

        console.log("Response status:", response);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error setting pre-document deadline:", error);
        throw error;
    }
}

const postDocumentDeadlineRequest = async ({ activityId, postDocumentDeadline }) => {
    try {
        console.log("url:", `${process.env.REACT_APP_BASE_URL}/api/admin/activities/deadline/postDocDeadline/${activityId}`);
        console.log("postDocumentDeadline:", JSON.stringify({ postDocumentDeadline }), "id :", activityId);

        const token = useTokenStore.getState().getToken();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/activities/deadline/postDocDeadline/${activityId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
            body: JSON.stringify({ end_deadline: postDocumentDeadline }),
        });

        console.log("Response status:", response);

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error setting post-document deadline:", error);
        throw error;
    }
}




const approveActivity = async ({ activityId }) => {
    try {
        console.log("url:", `${process.env.REACT_APP_BASE_URL}/api/admin/activities/approveActivity/${activityId}`);

        const token = useTokenStore.getState().getToken();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/activities/approveActivity/${activityId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            }
        });

        console.log("Response status:", response);

        if (!response.ok) {
            const errorData = await response.json(); // try to read the server's message
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }


        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error approving activity for approvedocument:", error);
        throw error;
    }
}

const rejectActivity = async ({ activityId, remark }) => {
    try {
        console.log("url:", `${process.env.REACT_APP_BASE_URL}/api/admin/activities/rejectActivity/${activityId}`);
        console.log("Remark:", remark);

        const token = useTokenStore.getState().getToken();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/activities/rejectActivity/${activityId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: token,
            },
            body: JSON.stringify({ remarks: remark }),
        });

        console.log("Response status:", response);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `Error: ${response.status} - ${response.statusText}`);
        }

        const data = await response.json();
        return data;
    } catch (error) {
        console.error("Error rejecting activity for rejectDocument:", error);
        throw error;
    }
}

// Pure API: view activity details (role-aware)
const viewActivityAPI = async ({ queryKey }) => {
    const [_, activityId] = queryKey;
    if (!activityId) throw new Error("activityId is required");

    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

    // Always use the admin route
    const url = `${process.env.REACT_APP_BASE_URL}/api/admin/activities/${activityId}`;

    const response = await fetch(url, {
        method: "GET",
        headers: {
            "Content-Type": "application/json",
            "Authorization": token ? `Bearer ${formattedToken}` : "",
        },
    });


    if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error: ${response.status} - ${response.statusText}`);
    }

    const json = await response.json();
    return json.activity ?? json;
};

function useAdminActivity({
    debouncedQuery = "",
    limit = 12,
    sorted = "",
    RSO = "",
    RSOType = "",
    college = "",
    isGPOA = "All",
    page = 1,
    manualEnable = false,
    activityId,
    academicYearId,
} = {}) {
    const { user } = useAuth();
    const { isUserAdmin, isCoordinator } = useUserStoreWithAuth();
    const location = useLocation();
    const isActivities = location.pathname.includes("activities") || location.pathname.includes("rsos");

    const filter = {
        query: debouncedQuery,
        limit,
        sorted,
        RSO,
        isGPOA,
        RSOType,
        college,
        page,
        academicYearId,
    };

    const {
        data: adminPaginatedActivities,
        error: adminError,
        isLoading: isAdminActivitiesLoading,
        isError: isAdminActivitiesError,
        isFetching: isAdminActivitiesFetching,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
    } = useInfiniteQuery({
        queryKey: ["adminActivities", filter],
        enabled: manualEnable ? true : (isUserAdmin || isCoordinator) && isActivities,
        queryFn: fetchAdminActivity,
        // enabled: !!debouncedQuery || !!sorted || !!RSO || !!RSOType || !!college,
        getNextPageParam: (lastPage) => lastPage.nextPage,
    })

    const {
        mutate: approveActivityMutate,
        isLoading: isApprovingActivity,
        isError: isErrorApprovingActivity,
        isSuccess: isActivityApproved,
    } = useMutation({
        mutationFn: approveActivity,
        enabled: (isUserAdmin || isCoordinator) && isActivities,
        onSuccess: () => {
            console.log("Activity approved successfully");
        },
        onError: (error) => {
            console.error("Error approving activity:", error);
        }
    });

    const {
        mutate: rejectActivityMutate,
        isLoading: isRejectingActivity,
        isError: isErrorRejectingActivity,
        isSuccess: isActivityRejected,
    } = useMutation({
        mutationFn: rejectActivity,
        enabled: (isUserAdmin || isCoordinator) && isActivities,
        onSuccess: () => {
            console.log("Activity rejected successfully");
        },
        onError: (error) => {
            console.error("Error rejecting activity:", error);
        }
    });

    const {
        mutate: preDocumentDeadlineMutate,
        isLoading: isSettingPreDocumentDeadline,
        isError: isErrorSettingPreDocumentDeadline,
        isSuccess: isPreDocumentDeadlineSet,
    } = useMutation({
        mutationFn: preDocumentDeadlineRequest,
        enabled: (isUserAdmin || isCoordinator) && isActivities,
    });

    const {
        mutate: postDocumentDeadlineMutate,
        isLoading: isSettingPostDocumentDeadline,
        isError: isErrorSettingPostDocumentDeadline,
        isSuccess: isPostDocumentDeadlineSet,
    } = useMutation({
        mutationFn: postDocumentDeadlineRequest,
        enabled: (isUserAdmin || isCoordinator) && isActivities,
    });

    const {
        data: viewAdminActivityData,
        isSuccess: viewAdminActivitySuccess,
        isLoading: viewAdminActivityLoading,
        refetch: refetchViewAdminActivity,
        isError: viewAdminActivityError
    } = useQuery({
        queryKey: ["activity", activityId],
        queryFn: viewActivityAPI,
        refetchOnWindowFocus: false,
        enabled: manualEnable ? manualEnable : (activityId && (isUserAdmin || isCoordinator)),
        onSuccess: (data) => {
            console.log("Activities fetched successfully:", data);
        },
        onError: (error) => {
            console.error("Error fetching activities:", error);
        },
    })

    return {
        // fetch admin activities
        adminPaginatedActivities,
        adminError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isAdminActivitiesLoading,
        isAdminActivitiesError,
        isAdminActivitiesFetching,

        // approve activity
        isApprovingActivity,
        isErrorApprovingActivity,
        isActivityApproved,
        approveActivityMutate,

        rejectActivityMutate,
        isRejectingActivity,
        isErrorRejectingActivity,
        isActivityRejected,

        // set pre-document deadline
        preDocumentDeadlineMutate,
        isSettingPreDocumentDeadline,
        isErrorSettingPreDocumentDeadline,
        isPreDocumentDeadlineSet,

        // set post-document deadline
        postDocumentDeadlineMutate,
        isSettingPostDocumentDeadline,
        isErrorSettingPostDocumentDeadline,
        isPostDocumentDeadlineSet,

        // view admin activity details
        viewAdminActivityData,
        viewAdminActivitySuccess,
        viewAdminActivityLoading,
        refetchViewAdminActivity,
        viewAdminActivityError,
    }

}

export default useAdminActivity;    