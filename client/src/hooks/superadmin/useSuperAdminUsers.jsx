import { useTokenStore, useUserStoreWithAuth } from "../../store";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";

// only enable this if the user is super admin
// this is for super admin to manage SDAO accounts

const deleteSDAOAccount = async (userId) => {
    try {
        const token = useTokenStore.getState().getToken();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/super-admin/user/deleteSDAOAccount/${userId}`, {
            method: "DELETE",
            headers: {
                Authorization: token || "",
            },
        });

        if (!response.ok) {
            throw new Error(`Error deleting SDAO account: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error deleting SDAO account:", error);
        throw error;

    }
}

const createSDAOAccount = async (formData) => {
    try {
        const token = useTokenStore.getState().getToken();
        console.log("Creating SDAO account with data:", formData);

        console.log("API URL:", `${process.env.REACT_APP_BASE_URL}/api/super-admin/user/createAdminAccount`);
        console.log("Payload:", formData);
        console.log("Token:", token);


        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/super-admin/user/createAdminAccount`, {
            method: "POST",
            headers: {
                Authorization: token || "",
                "Content-Type": "application/json",
            },
            body: JSON.stringify(formData),
        });

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.errors.map(e => e.msg).join(", ") || `Error: ${response.status} - ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error creating SDAO account:", error);
        throw error;

    }
}

const getSDAOAccounts = async () => {
    try {
        const token = useTokenStore.getState().getToken();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/super-admin/user/fetchSDAOaccounts`, {
            method: "GET",
            headers: {
                Authorization: token || "",
            },
        });

        if (!response.ok) {
            throw new Error(`Error fetching SDAO accounts: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error fetching SDAO accounts:", error);
        throw error;
    }
}

const updateSDAORoleRequest = async ({ userId, role }) => {
    console.log("Updating SDAO role for userId:", userId, "to role:", role);

    // determine the type of variable is the role 
    console.log("Role type:", typeof role);
    try {

        if (!userId || !role) {
            throw new Error("User ID and role are required for updating SDAO role.");
        }

        const token = useTokenStore.getState().getToken();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/super-admin/user/updateSDAORole/${userId}`, {
            method: "PATCH",
            headers: {
                Authorization: token || "",
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ role: role }),
        });

        if (!response.ok) {
            throw new Error(`Error updating SDAO role: ${response.statusText}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Error updating SDAO role:", error);
        throw error;
    }
}

function useSuperAdminSDAO() {
    const location = useLocation();
    const isUsersPage = location.pathname === '/users';
    const { isUserSuperAdmin } = useUserStoreWithAuth();

    const {
        data: sdaoAccounts,
        isLoading: accountsLoading,
        isError: accountsError,
        error: accountsErrorMessage,
        refetch: refetchAccounts,
        isRefetching: isRefetchingAccounts,
        isFetched: isAccountsFetched,
    } = useQuery({
        queryKey: ["sdaoAccounts"],
        queryFn: getSDAOAccounts,
        enabled: isUsersPage && isUserSuperAdmin,
    });

    const {
        mutate: createAccount,
        isLoading: isCreatingAccount,
        isError: isCreateError,
        error: createErrorMessage,
    } = useMutation({
        mutationFn: createSDAOAccount,
        onSuccess: () => {
            refetchAccounts();
        },
        enabled: isUsersPage && isUserSuperAdmin,
    });

    const {
        mutate: deleteAdminAccount,
        isLoading: isDeletingAccount,
        isError: isDeleteError,
        error: deleteErrorMessage,
    } = useMutation({
        mutationFn: deleteSDAOAccount,
        onSuccess: () => {
            refetchAccounts();
        },
        enabled: isUsersPage && isUserSuperAdmin,
    });

    const {
        mutate: updateAdminRole,
        isLoading: isUpdatingSDAORole,
        isError: isUpdateSDAORoleError,
        error: updateSDAORoleErrorMessage,
    } = useMutation({
        mutationFn: updateSDAORoleRequest,
        onSuccess: () => {
            refetchAccounts();
        },
        enabled: isUsersPage && isUserSuperAdmin,
    });

    return {
        // SDAO accounts data
        sdaoAccounts,
        accountsLoading,
        accountsError,
        accountsErrorMessage,
        refetchAccounts,
        isRefetchingAccounts,
        isAccountsFetched,

        // SDAO create 
        createAccount,
        isCreatingAccount,
        isCreateError,
        createErrorMessage,

        // SDAO delete
        deleteAdminAccount,
        isDeletingAccount,
        isDeleteError,
        deleteErrorMessage,

        // SDAO update role
        updateAdminRole,
        isUpdatingSDAORole,
        isUpdateSDAORoleError,
        updateSDAORoleErrorMessage
    };
}

export default useSuperAdminSDAO;