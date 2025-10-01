import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from 'react-toastify';
import { Button, TextInput } from "../components";
import { useLogin } from "../hooks";

export default function PasswordAction() {
    const navigate = useNavigate();
    const location = useLocation();
    const { email, password } = location.state || {};
    const { fromLogin } = location.state || {};
    const [loading, setLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: email || "",
        password: "",
        newPassword: "",
        confirmPassword: ""
    });
    const {
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

        // reset password mutation
        resetPasswordMutate,
        isResetPasswordLoading,
        isResetPasswordError,
        resetPasswordError,
        resetPasswordData,

        checkEmailExistsMutate,
        isCheckEmailExistsLoading,
        isCheckEmailExistsError,
        checkEmailExistsError,
        checkEmailExistsData,
    } = useLogin();

    const handleChangePassword = async () => {
        const { password, newPassword, confirmPassword, email: formEmail } = formData;

        console.log("fromLogin? ", fromLogin);
        console.log("form email: ", formEmail);

        if (fromLogin) {
            // Check if all fields are filled
            if (!formEmail || !newPassword || !confirmPassword) {
                toast.error("All fields are required.");
                return;
            }
        } else {
            // Check from a different path
            if (!password || !newPassword || !confirmPassword || (fromLogin && !formEmail)) {
                toast.error("All fields are required.");
                return;
            }
        }

        // Check if new password and confirm password match
        if (newPassword !== confirmPassword) {
            toast.error("Passwords do not match.");
            return;
        }

        // compare password with the new password
        if (password === (newPassword || confirmPassword)) {
            toast.error("New password cannot be the same as the current password.");
            return;
        }

        // Check if new password is at least 6 characters long
        if (newPassword.length < 6) {
            toast.error("Password must be at least 6 characters long.");
            return;
        }
        // Here you would typically call an API to change the password
        console.log("Changing password for", password);
        // Simulate API call
        console.log("formData", formData);
        { console.log("fromLogin? ", fromLogin); }
        try {
            if (fromLogin === true) {
                setLoading(true);
                console.log("reset password req: ", {
                    email: email || formEmail,
                    newPassword,
                    confirmPassword,
                    platform: "web"
                });
                resetPasswordMutate({
                    email: email || formEmail,
                    newPassword,
                    confirmPassword,
                    platform: "web"
                }, {
                    onSuccess: () => {
                        console.log("Password reset successfully");
                        toast.success("Password reset successfully");
                        setLoading(false);
                        navigate("/");
                    },
                    onError: (error) => {
                        console.error("Error resetting password:", error);
                        toast.error(error.message || "Failed to reset password");
                        setLoading(false);
                    }
                });
                console.log("the request sent: ", {
                    email: email || formEmail,
                    newPassword,
                    confirmPassword,
                    platform: "web"
                });
            } else {
                // if not fromLogin
                await changePasswordMutate({
                    email: email || formEmail,
                    password,
                    newPassword,
                    confirmPassword,
                    platform: "web"
                },
                    {
                        onSuccess: () => {
                            setLoading(false);
                            console.log("Password changed successfully");
                            toast.success("Password changed successfully");
                        },
                        onError: (error) => {
                            console.error("Error changing password:", error);
                            toast.error(error.details.error || "Failed to change password");
                        }
                    });
            }
        } catch (error) {
            console.error("Error changing password:", error);
        } finally {
            setLoading(false);
        }
    }

    // use effect to see if changePassword changed successfully
    useEffect(() => {
        if (isChangePasswordSuccess) {
            // pass that data to loginUserMutate
            loginUserMutate({
                email: email || formData.email,
                password: formData.newPassword,
                platform: "web",
            }, {
                onSuccess: (data) => {
                    // 1. Get the token (remove 'Bearer ' if present)
                    const token = data.token.replace('Bearer ', '');

                    // 2. Decode the payload (the second part of the JWT)
                    const base64Payload = token.split('.')[1];
                    const decodedPayload = JSON.parse(atob(base64Payload));

                    // 3. Extract the role
                    const role = decodedPayload.role || decodedPayload.userRole || decodedPayload.type;

                    // 4. Redirect based on role
                    if (role === "admin" || role === "coordinator") {
                        navigate("/dashboard");
                    } else if (role === "rso_representative") {
                        navigate("/dashboard");
                    } else if (role === "super_admin") {
                        navigate("/users");
                    } else if (role === "director" || role === "avp") {
                        navigate("/general-documents");
                    } else {
                        toast.error("Invalid role or access denied.");
                    }
                },
                onError: (error) => {
                    console.error("Error logging in after password change:", error);
                    toast.error(error.message || "Failed to log in after password change");
                }
            });
        }
    }, [isChangePasswordSuccess]);

    // check if the login error requires email verification
    useEffect(() => {
        if (isLoginError) {
            setLoading(true);
            if (loginError?.requiresEmailVerification === true) {
                checkEmailExistsMutate(email, {
                    onSuccess: (data) => {
                        setLoading(false);
                        console.log("Email exists check:", data);
                        toast.warn("Please verify your email before logging in.");
                        navigate("/email-action", {
                            state: {
                                email: email,
                                password: password,
                                platform: "web"
                            }
                        });
                    },
                    onError: (error) => {
                        setLoading(false);
                        console.error("Error checking email existence:", error);
                        toast.error(error.message || "Failed to verify email. Please try again.");
                    }
                });

            }
        }
    }, [isLoginError, loginError]);

    return (
        <div className="flex flex-col items-center justify-center gap-4 w-full">
            <div className="w-full justify-start flex items-center justify-start gap-2 mb-4">
                <div
                    onClick={() => {
                        navigate(-1);
                    }}
                    className='flex items-center justify-center rounded-full h-8 w-8 cursor-pointer border border-gray-300 group'>
                    <svg xmlns="http://www.w3.org/2000/svg" className='fill-gray-600 size-4 group-hover:fill-off-black' viewBox="0 0 448 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" /></svg>
                </div>
                <h1 className="text-lg font-semibold">Change Password</h1>
            </div>
            {/* Password Input */}
            <div className="flex flex-col w-full gap-4 mb-4">
                {fromLogin && (
                    <div>
                        <label htmlFor="email" className="text-sm text-gray-600">Email</label>
                        <TextInput
                            placeholder={"Email"}
                            disabled={formData.email ? true : false}
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            id="email"
                        />
                    </div>
                )}

                {/* only show for first login event */}
                {!fromLogin && (
                    <div>
                        <label htmlFor="password" className="text-sm text-gray-600">Current Password</label>
                        <TextInput
                            placeholder={"Current Password"}
                            value={formData.password}
                            type={"password"}
                            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                            id="password"
                        />
                    </div>
                )}
                <div>
                    <label htmlFor="new-password" className="text-sm text-gray-600">New Password</label>
                    <TextInput
                        placeholder="New Password"
                        value={formData.newPassword}
                        type={"password"}
                        onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
                        id="new-password"
                    />
                </div>
                <div>
                    <label htmlFor="confirm-password" className="text-sm text-gray-600">Confirm Password</label>
                    <TextInput
                        placeholder="Confirm Password"
                        value={formData.confirmPassword}
                        type={"password"}
                        onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                        id="confirm-password"
                    />
                </div>
                <Button className={"mt-4"} onClick={handleChangePassword} disabled={loading}>{loading ? "Making changes..." : "Confirm"}</Button>
            </div>
        </div>
    )
}