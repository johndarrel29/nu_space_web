import { useQuery, useMutation } from "@tanstack/react-query";
import { useTokenStore } from "../../store/tokenStore";
import { useUserStoreWithAuth } from '../../store';
import { useAuth } from "../../context/AuthContext";
import { useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

// also include coordinator to allow edits to this path

// for admin fetching users
const fetchUsersRequest = async () => {
    try {
        console.log("Fetching users...");
        const token = localStorage.getItem("token");


        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/user/fetchUsers`, {
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

        return json?.students;

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
const deleteUserRequest = async (userId) => {
    const token = localStorage.getItem("token");

    const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : "";

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/user/deleteStudentAccount/${userId}`, {
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


function useAdminUser() {
    const { isUserAdmin, isUserCoordinator } = useUserStoreWithAuth();
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const location = useLocation();
    const isUsersPage = location.pathname === '/users';

    useEffect(() => {
        if (!isUserAdmin && !isUserCoordinator) {
            queryClient.removeQueries(['users']);
        }
    }, [isUserAdmin, queryClient]);

    console.log("useAdminUser hook isUserAdmin:", isUserAdmin);

    const {
        data: usersData,
        isLoading: isUsersLoading,
        isError: isUsersError,
        error: usersError,
        refetch: refetchUsersData,
    } = useQuery({
        // initialData: null,
        queryKey: ["users", user?.id],
        queryFn: fetchUsersRequest,
        // refetchOnWindowFocus: false,
        // retry: 1,
        // staleTime: 0,
        // cacheTime: 0,
        enabled: (isUserAdmin || isUserCoordinator) && isUsersPage, // Only fetch if the user is an admin or coordinator and on /users
    });

    const {
        mutate: updateUserMutate,
        isError: isUpdateError,
        isLoading: isUpdateLoading,
        isSuccess: isUpdateSuccess,
        error: updateError,
    } = useMutation({
        mutationFn: updateUserRequest,
        onSuccess: () => {
            console.log("User updated successfully");
            refetchUsersData();
            // refetch();
        },
        onError: (error) => {
            console.error("Error updating user role:", error);
        },
        enabled: (isUserAdmin || isUserCoordinator) && isUsersPage,
    });

    const {
        mutate: deleteStudentAccount,
        isError: isDeleteError,
        isLoading: isDeleteLoading,
        isSuccess: isDeleteSuccess,
        error: deleteError,
    } = useMutation({
        mutationFn: deleteUserRequest,
        onSuccess: () => {
            console.log("User deleted successfully");
            refetchUsersData();
        },
        onError: (error) => {
            console.error("Error deleting user:", error);
        },
        enabled: (isUserAdmin || isUserCoordinator) && isUsersPage,
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
        enabled: (isUserAdmin || isUserCoordinator) && isUsersPage,
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
        deleteStudentAccount,
        isDeleteError,
        isDeleteLoading,
        isDeleteSuccess,
        deleteError,

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