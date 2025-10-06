import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { useUserStoreWithAuth } from '../../store';
import { useTokenStore } from "../../store/tokenStore";

// also include coordinator to allow edits to this path

// for admin fetching users
const fetchUsersRequest = async ({ queryKey }) => {
    try {
        const token = useTokenStore.getState().token;
        // destructure queryKey to get filters
        const [_key, filters] = queryKey;
        const params = new URLSearchParams(filters).toString();

        console.log("Fetching users with params:", params);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/user/fetchUsers?${params}`, {
            method: "GET",
            headers: {
                Authorization: token,

            },
        });

        console.log("Response status users:", response.status);

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const json = await response.json();
        // return regular data
        console.log("Fetched users data in UseUser:", json);

        return json;

    } catch (error) {
        console.error("Error fetching users:", error);
        throw new Error(`Failed to fetch users: ${error.message}`);
    }

};

// double check how to destructure the request properly
// check if it is hitting the correct url based on role

// for admin updating user role
const updateUserRequest = async ({ userId, userData }) => {
    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : "";

    console.log('Updating user with ID:', userId, 'and data:', userData);


    try {
        console.log('User data being sent:', userData);
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/user/updateUserRole/${userId}`, {
            method: "PATCH",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${formattedToken}`,
            },

            body: JSON.stringify(userData),
        });
        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }
        const json = await response.json();
        return json;
    } catch (error) {
        console.error("Error updating user role:", error);
        throw error;
    }


};

// for admin deleting user
const hardDeleteUserRequest = async (userId) => {
    const token = localStorage.getItem("token");

    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : "";

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/user/hardDeleteStudentAccount/${userId}`, {
        method: "DELETE",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${formattedToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();

}

const softDeleteUserRequest = async (userId) => {
    const token = localStorage.getItem("token");

    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : "";

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/user/softDeleteStudentAccount/${userId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${formattedToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();

}

const restoreUserRequest = async (userId) => {
    const token = localStorage.getItem("token");

    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : "";

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/user/restoreStudentAccount/${userId}`, {
        method: "PATCH",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${formattedToken}`,
        },
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();

}


const fetchAdminProfile = async () => {
    try {
        const token = useTokenStore.getState().token;

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/user/fetchAdminProfile`, {
            method: "GET",
            headers: {
                Authorization: token,
            },
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        const json = await response.json();
        return json;

    } catch (error) {
        console.error("Error fetching admin profile:", error);
        throw new Error(`Failed to fetch admin profile: ${error.message}`);
    }

}


function useAdminUser({
    search = "",
    role = "",
    limit = 10,
    page = 1,
    isDeleted = false,
} = {}) {
    const { isUserAdmin, isCoordinator, isSuperAdmin, isDirector, isAVP, isUserRSORepresentative } = useUserStoreWithAuth();
    const queryClient = useQueryClient();
    const location = useLocation();
    const isUsersPage = location.pathname === '/users';

    useEffect(() => {
        if (!isUserAdmin && !isCoordinator) {
            queryClient.removeQueries(['users']);
        }
    }, [isUserAdmin, queryClient]);

    console.log("useAdminUser hook isUserAdmin:", isUserAdmin);

    const filters = {
        search,
        role,
        limit,
        page,
        isDeleted,
    }


    const {
        data: usersData,
        isLoading: isUsersLoading,
        isError: isUsersError,
        error: usersError,
        refetch: refetchUsersData,
    } = useQuery({
        // initialData: null,
        queryKey: ["users", filters],
        queryFn: fetchUsersRequest,
        refetchOnWindowFocus: false,
        staleTime: Infinity,
        cacheTime: Infinity,
        enabled: (isUserAdmin || isCoordinator) && isUsersPage, // Only fetch if the user is an admin or coordinator and on /users
    });

    const {
        mutate: updateUserMutate,
        isError: isUpdateError,
        isLoading: isUpdateLoading,
        isSuccess: isUpdateSuccess,
        error: updateError,
    } = useMutation({
        mutationFn: updateUserRequest,
        onSuccess: (data) => {
            console.log("User updated successfully", data);
            refetchUsersData();
            // refetch();
        },
        onError: (error) => {
            console.error("Error updating user role:", error);
        },
        enabled: (isUserAdmin || isCoordinator) && isUsersPage,
    });

    const {
        mutate: hardDeleteStudentAccount,
        isError: isHardDeleteError,
        isLoading: isHardDeleteLoading,
        isSuccess: isHardDeleteSuccess,
        error: hardDeleteError,
    } = useMutation({
        mutationFn: hardDeleteUserRequest,
        onSuccess: () => {
            console.log("User deleted successfully");
            refetchUsersData();
        },
        onError: (error) => {
            console.error("Error deleting user:", error);
        },
        enabled: (isUserAdmin || isCoordinator) && isUsersPage,
    });

    const {
        data: adminProfile,
        isLoading: isAdminProfileLoading,
        isError: isAdminProfileError,
        error: adminProfileError,
        refetch: refetchAdminProfile,
        isRefetching: isAdminProfileRefetching,
    } = useQuery({
        queryKey: ["adminProfile"],
        queryFn: fetchAdminProfile,
        refetchOnWindowFocus: false,
        retry: false,
        enabled: !isUserRSORepresentative,
    });

    const {
        mutate: softDeleteStudentAccount,
        isError: isSoftDeleteStudentError,
        isLoading: isSoftDeleteStudentLoading,
        error: softDeleteStudentErrorMessage,
    } = useMutation({
        mutationFn: softDeleteUserRequest,
        onSuccess: () => {
            console.log("User soft deleted successfully");
        },
    });

    const {
        mutate: restoreStudentAccount,
        isError: isRestoreStudentError,
        isLoading: isRestoringStudent,
        error: restoreStudentErrorMessage,
    } = useMutation({
        mutationFn: restoreUserRequest,
        onSuccess: () => {
            console.log("User restored successfully");
        },
    });

    return {
        // fetching users admin
        usersData,
        isUsersLoading,
        isUsersError,
        usersError,
        refetchUsersData,
        updateError,

        // updating users
        updateUserMutate,
        isUpdateError,
        isUpdateLoading,
        isUpdateSuccess,

        // deleting users
        hardDeleteStudentAccount,
        isHardDeleteError,
        isHardDeleteLoading,
        isHardDeleteSuccess,
        hardDeleteError,

        // soft deleting users
        softDeleteStudentAccount,
        isSoftDeleteStudentError,
        isSoftDeleteStudentLoading,
        softDeleteStudentErrorMessage,

        // restoring users
        restoreStudentAccount,
        isRestoreStudentError,
        isRestoringStudent,
        restoreStudentErrorMessage,

        // fetching admin profile
        adminProfile,
        isAdminProfileLoading,
        isAdminProfileError,
        adminProfileError,
        refetchAdminProfile,
        isAdminProfileRefetching,
    };
}

export default useAdminUser;