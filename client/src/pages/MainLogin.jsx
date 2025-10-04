import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button, TextInput } from "../components";
import { useAuth } from "../context/AuthContext";
import { useKeyBinding, useLogin, useOnlineStatus } from '../hooks';
import { useFCMStore, useTokenStore } from '../store';

// BUG: data not showing loading UI


const ROLE_REDIRECTS = {
    admin: "/dashboard",
    coordinator: "/dashboard",
    rso_representative: "/dashboard",
    super_admin: "/users",
    director: "/general-documents",
    avp: "/general-documents",
};

export default function MainLogin() {
    const fcmStore = useFCMStore.getState();
    const isOnline = useOnlineStatus();
    const navigate = useNavigate();
    const [formData, setFormData] = useState({
        email: "",
        password: ""
    });
    const [error, setError] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [forgotPasswordLoading, setForgotPasswordLoading] = useState(false);

    const { login, isAuthenticated, user } = useAuth();
    const {
        checkEmailExistsMutate,
        isCheckEmailExistsLoading,
        isCheckEmailExistsError,
        checkEmailExistsError,
        checkEmailExistsData,

        loginUserMutate,
        isLoginLoading,
        isLoginError,
        loginError,
        loginData,
    } = useLogin();

    // Handle login errors and special cases
    useEffect(() => {
        if (!isLoginError) return;

        if (loginError?.requiresEmailVerification) {
            checkEmailExistsMutate({ email: formData.email }, {
                onSuccess: (data) => {
                    if (data.exists) {
                        toast.warn("Please verify your email before logging in.");
                        navigate("/email-action", {
                            state: {
                                email: formData.email,
                                password: formData.password,
                                platform: "web"
                            }
                        });
                    } else {
                        console.log("Email does not exist in the system.");
                    }
                },
                onError: (error) => {
                    console.error("Error checking email existence:", error);
                }
            });
        }

        if (loginError?.requiresPasswordChange) {
            console.error("Password change required:", loginError);
            toast.error("Please change your password before logging in.");
            navigate("/password-action", {
                state: {
                    email: formData.email,
                    password: formData.password,
                    platform: "web"
                }
            });
        }
    }, [isLoginError, loginError, navigate, formData]);

    // Redirect authenticated users based on role
    useEffect(() => {
        if (isAuthenticated && user?.role) {
            const redirectPath = ROLE_REDIRECTS[user.role];
            if (redirectPath) {
                navigate(redirectPath);
            } else {
                setError("Invalid role or access denied.");
            }
        }
    }, [isAuthenticated, navigate, user]);

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        setError("");
    };

    const handleSubmit = async (e) => {

        e?.preventDefault();
        setIsLoading(true);

        if (!formData.email || !formData.password) {
            setError("Email and Password are required.");
            setIsLoading(false);
            return;
        }

        setError("");

        try {
            loginUserMutate({
                email: formData.email,
                password: formData.password,
                platform: "web",
                deviceToken: fcmStore.deviceToken || null
            }, {
                onSuccess: (data) => {
                    if (!data?.token) {
                        throw new Error("No token received");
                        setIsLoading(false);
                    }

                    const token = data?.token || data?.data?.token;
                    if (token) {
                        useTokenStore.getState().setToken(token);
                    }

                    const tokenPart = data.token.replace('Bearer ', '');
                    const base64Payload = tokenPart.split('.')[1];
                    const decodedPayload = JSON.parse(atob(base64Payload));

                    const role = decodedPayload.role || decodedPayload.userRole || decodedPayload.type;

                    login({
                        token: data.token,
                        id: decodedPayload.id,
                        email: decodedPayload.email || formData.email,
                        role: role,
                        ...decodedPayload
                    });

                    toast.success("Login successful");
                },
                onError: (error) => {
                    console.error("Login failed:", error);
                    toast.error(error?.message || "Login failed. Please try again.");
                }
            });
        } catch (err) {
            console.error("Login error:", {
                message: err.message,
                stack: err.stack
            });
            setIsLoading(false);
        } finally {
            setIsLoading(false);
        }
    };

    useKeyBinding({
        key: "Enter",
        callback: handleSubmit,
    });

    const handleForgotPassword = () => {
        try {
            setForgotPasswordLoading(true);
            toast.info("Verifying email...");

            if (!formData.email) {
                toast.error("Please enter your email to reset password.");
                setForgotPasswordLoading(false);
                return;
            }
            checkEmailExistsMutate(formData.email, {
                onSuccess: () => {
                    toast.success("Email verification sent.");
                    setForgotPasswordLoading(false);
                    navigate('email-action', {
                        state: {
                            fromLogin: true,
                            email: formData.email || ""
                        }
                    });
                },
                onError: (error) => {
                    console.error("Error checking email existence:", error);
                    toast.error(error.message || "Failed to verify email. Please try again.");
                    setForgotPasswordLoading(false);
                }
            });
        } catch (error) {
            throw new Error("Navigation error: " + error.message);
        } finally {
            setForgotPasswordLoading(false);
        }
    };



    return (
        <div className='w-full'>
            <form onSubmit={handleSubmit}>
                {/* Email Input */}
                <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Email
                    </label>
                    <div className="relative">
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="fill-primary size-4 absolute top-3 right-3 z-10 bg-gray-300 rounded-full"
                            viewBox="0 0 512 512"
                        >
                            <path d="M399 384.2C376.9 345.8 335.4 320 288 320l-64 0c-47.4 0-88.9 25.8-111 64.2c35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 16a72 72 0 1 0 0-144 72 72 0 1 0 0 144z" />
                        </svg>
                        <TextInput
                            name="email"
                            placeholder="Email"
                            type="email"
                            value={formData.email}
                            onChange={handleInputChange}
                            required
                        />
                    </div>
                </div>

                {/* Password Input */}
                <div className="mb-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                        Password
                    </label>
                    <TextInput
                        name="password"
                        placeholder="Password"
                        type="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
                        required
                    />
                </div>

                {/* Forgot Password Link */}
                <div className="w-full flex justify-end mb-4">
                    <button
                        type="button"
                        disabled={forgotPasswordLoading}
                        onClick={() => { handleForgotPassword(); setForgotPasswordLoading(true); }}
                        className="text-sm font-medium text-primary hover:underline"
                    >
                        {forgotPasswordLoading ? "Checking..." : "Forgot password?"}
                    </button>
                </div>

                {/* Error Message */}
                {loginError && (
                    <p className="mt-2 text-sm text-red-600">
                        {loginError.message}
                    </p>
                )}

                {isOnline === false && (
                    <p className="mt-2 text-sm text-red-600">
                        No internet connection. Please try again later.
                    </p>
                )}

                {/* Submit Button */}
                <Button
                    onClick={() => { handleSubmit(); setIsLoading(true); }}
                    className="w-full mt-6 flex items-center justify-center"
                    disabled={isLoading}
                >
                    {isLoading ? <LoadingSpinner /> : "Login"}
                </Button>
            </form>
        </div>
    );
}

function LoadingSpinner() {
    return (
        <svg
            aria-hidden="true"
            className="w-6 h-6 text-white animate-spin fill-primary"
            viewBox="0 0 100 101"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
        >
            <path d="M100 50.5908C100 78.2051 77.6142 100.591 50 100.591C22.3858 100.591 0 78.2051 0 50.5908C0 22.9766 22.3858 0.59082 50 0.59082C77.6142 0.59082 100 22.9766 100 50.5908ZM9.08144 50.5908C9.08144 73.1895 27.4013 91.5094 50 91.5094C72.5987 91.5094 90.9186 73.1895 90.9186 50.5908C90.9186 27.9921 72.5987 9.67226 50 9.67226C27.4013 9.67226 9.08144 27.9921 9.08144 50.5908Z" fill="currentColor" />
            <path d="M93.9676 39.0409C96.393 38.4038 97.8624 35.9116 97.0079 33.5539C95.2932 28.8227 92.871 24.3692 89.8167 20.348C85.8452 15.1192 80.8826 10.7238 75.2124 7.41289C69.5422 4.10194 63.2754 1.94025 56.7698 1.05124C51.7666 0.367541 46.6976 0.446843 41.7345 1.27873C39.2613 1.69328 37.813 4.19778 38.4501 6.62326C39.0873 9.04874 41.5694 10.4717 44.0505 10.1071C47.8511 9.54855 51.7191 9.52689 55.5402 10.0491C60.8642 10.7766 65.9928 12.5457 70.6331 15.2552C75.2735 17.9648 79.3347 21.5619 82.5849 25.841C84.9175 28.9121 86.7997 32.2913 88.1811 35.8758C89.083 38.2158 91.5421 39.6781 93.9676 39.0409Z" fill="currentFill" />
        </svg>
    );
}