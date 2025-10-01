import { useMutation } from "@tanstack/react-query";
import { useTokenStore } from "../../store";

const loginUserRequest = async ({ email, password, platform, deviceToken }) => {
    console.log("Login request initiated with email:", email, "and platform:", platform, "password:", password);
    try {

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/login/webLogin`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, password, platform, deviceToken }),
        });


        // Parse JSON first (even if response is not OK)
        const json = await response.json();

        if (!response.ok) {
            // Forward backend message (like "First login detected") instead of generic status
            // throw new Error(json || `Error: ${response.status} - ${response.statusText}`);
            throw json;
        }

        if (!json.success) {
            throw new Error(json || "Login failed");
        }

        return json;
    } catch (error) {
        console.error("Error during login request:", error);
        throw error; // Re-throw the error to be handled by the mutation

    }
}

const changeFirstPasswordRequest = async ({ email, password, newPassword, confirmPassword }) => {
    try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/auth/firstLogin/changePassword`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password, newPassword, confirmPassword }),
        });

        // Read body once
        let json;
        try {
            json = await response.json();
        } catch (e) {
            json = null; // non-JSON or empty body
        }

        if (!response.ok) {
            // Throw structured error so UI can branch on fields
            throw {
                status: response.status,
                message: json?.message || json?.error || "Password change failed",
                details: json,
            };
        }

        if (!json?.success) {
            throw {
                status: response.status,
                message: json?.message || "Password change failed",
                details: json,
            };
        }

        return json;
    } catch (error) {
        console.error("Error during password change request:", error);
        throw error;
    }
};

const checkEmailExistsRequest = async (email) => {
    try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/auth/check-email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, platform: "web" }),
        });

        const json = await response.json();

        if (!response.ok) {
            throw json;
        }

        if (!json.success) {
            throw new Error(json || "Email check failed");
        }

        return json;
    } catch (error) {
        console.error("Error during email check request:", error);
        throw error; // Re-throw the error to be handled by the mutation

    }
}

const sendCodeVerificationRequest = async (email) => {
    try {
        // count the verification received
        console.log("Sending code verification to email:", email);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/auth/send-email-code`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email }),
        });

        const json = await response.json();

        if (!response.ok) {
            throw json;
        }

        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        return json;
    } catch (error) {
        console.error("Error during code verification request:", error);
        throw error; // Re-throw the error to be handled by the mutation

    }
}

const verifyEmailCodeRequest = async ({ email, code }) => {
    try {
        console.log("Verifying email code:", { email, code });
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/auth/verify-email-code`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({ email, code }),
        });

        const json = await response.json();

        if (!response.ok) {
            throw json;
        }

        if (!json.success) {
            throw new Error(json || "Email code verification failed");
        }

        return json;
    } catch (error) {
        console.error("Error during email code verification request:", error);
        throw error; // Re-throw the error to be handled by the mutation
    }
}

const resetPasswordRequest = async ({ email, newPassword, confirmPassword, platform }) => {
    try {
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/auth/reset-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, newPassword, confirmPassword, platform }),
        });

        let json;
        try {
            json = await response.json();
        } catch (e) {
            json = null;
        }

        if (!response.ok) {
            throw {
                status: response.status,
                message: json?.message || json?.error || "Password reset failed",
                details: json,
            };
        }

        if (!json?.success) {
            throw {
                status: response.status,
                message: json?.message || "Password reset failed",
                details: json,
            };
        }

        return json;
    } catch (error) {
        console.error("Error during password reset request:", error);
        throw error;
    }
};

function useLogin() {
    const {
        mutate: loginUserMutate,
        isLoading: isLoginLoading,
        isError: isLoginError,
        error: loginError,
        data: loginData,
    } = useMutation({
        mutationFn: loginUserRequest,
        onSuccess: (data) => {
            // localStorage.setItem("token", data.token);
            useTokenStore.getState().setToken(data.token);

        },
        onError: (error) => {
            console.error("Error logging in:", error);
        },
    });

    const {
        mutate: changePasswordMutate,
        isLoading: isChangePasswordLoading,
        isError: isChangePasswordError,
        isSuccess: isChangePasswordSuccess,
        error: changePasswordError,
        data: changePasswordData,
    } = useMutation({
        mutationFn: changeFirstPasswordRequest,
        onSuccess: (data) => {
            console.log("Password changed successfully:", data);
        },
        onError: (error) => {
            console.error("Error changing password:", error);
        },
    });

    const {
        mutate: checkEmailExistsMutate,
        isLoading: isCheckEmailExistsLoading,
        isError: isCheckEmailExistsError,
        error: checkEmailExistsError,
        data: checkEmailExistsData,
    } = useMutation({
        mutationFn: checkEmailExistsRequest,
        onSuccess: (data) => {
            console.log("Email exists:", data);
        },
        onError: (error) => {
            console.error("Error checking email:", error);
        },
    });

    const {
        mutate: sendCodeVerificationMutate,
        isLoading: isSendCodeVerificationLoading,
        isError: isSendCodeVerificationError,
        error: sendCodeVerificationError,
        data: sendCodeVerificationData,
    } = useMutation({
        mutationFn: sendCodeVerificationRequest,
        onSuccess: (data) => {
            console.log("Code verification sent successfully:", data);
        },
        onError: (error) => {
            console.error("Error sending code verification:", error);
        },
    });

    const {
        mutate: verifyEmailCodeMutate,
        isLoading: isVerifyEmailCodeLoading,
        isError: isVerifyEmailCodeError,
        error: verifyEmailCodeError,
        data: verifyEmailCodeData,
    } = useMutation({
        mutationFn: verifyEmailCodeRequest,
        onSuccess: (data) => {
            console.log("Email code verified successfully:", data);
        },
        onError: (error) => {
            console.error("Error verifying email code:", error);
        },
    });

    const {
        mutate: resetPasswordMutate,
        isLoading: isResetPasswordLoading,
        isError: isResetPasswordError,
        error: resetPasswordError,
        data: resetPasswordData,
    } = useMutation({
        mutationFn: resetPasswordRequest,
        onSuccess: (data) => {
            console.log("Password reset successfully:", data);
        },
        onError: (error) => {
            console.error("Error resetting password:", error);
        },
    });

    return {
        // login mutation
        loginUserMutate,
        isLoginLoading,
        isLoginError,
        loginError,
        loginData,

        // change password mutation
        changePasswordMutate,
        isChangePasswordLoading,
        isChangePasswordError,
        changePasswordData,
        changePasswordError,
        isChangePasswordSuccess,

        // check email exists mutation
        checkEmailExistsMutate,
        isCheckEmailExistsLoading,
        isCheckEmailExistsError,
        checkEmailExistsError,
        checkEmailExistsData,

        // send code verification mutation
        sendCodeVerificationMutate,
        isSendCodeVerificationLoading,
        isSendCodeVerificationError,
        sendCodeVerificationError,
        sendCodeVerificationData,

        // verify email code mutation
        verifyEmailCodeMutate,
        isVerifyEmailCodeLoading,
        isVerifyEmailCodeError,
        verifyEmailCodeError,
        verifyEmailCodeData,

        // reset password mutation
        resetPasswordMutate,
        isResetPasswordLoading,
        isResetPasswordError,
        resetPasswordError,
        resetPasswordData,
    }
}

export default useLogin;