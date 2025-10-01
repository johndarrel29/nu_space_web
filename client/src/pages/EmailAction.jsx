import { Input as BaseInput } from '@mui/base/Input';
import { Box, styled } from '@mui/system';
import PropTypes from 'prop-types';
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { Button, TextInput } from "../components";
import { useLogin } from "../hooks";

import * as React from 'react';
const blue = {
    100: '#DAECFF',
    200: '#80BFFF',
    400: '#3399FF',
    500: '#007FFF',
    600: '#0072E5',
    700: '#0059B2',
};

const grey = {
    50: '#F3F6F9',
    100: '#E5EAF2',
    200: '#DAE2ED',
    300: '#C7D0DD',
    400: '#B0B8C4',
    500: '#9DA8B7',
    600: '#6B7A90',
    700: '#434D5B',
    800: '#303740',
    900: '#1C2025',
};

const InputElement = styled('input')(
    ({ theme }) => `
  width: 40px;
  font-family: 'IBM Plex Sans', sans-serif;
  font-size: 0.875rem;
  font-weight: 400;
  line-height: 1.5;
  padding: 8px 0;
  border-radius: 8px;
  text-align: center;
  color: ${theme.palette.mode === 'dark' ? grey[300] : grey[900]};
  background: ${theme.palette.mode === 'dark' ? grey[900] : '#fff'};
  border: 1px solid ${theme.palette.mode === 'dark' ? grey[700] : grey[200]};
  box-shadow: 0 2px 4px ${theme.palette.mode === 'dark' ? 'rgba(0,0,0, 0.5)' : 'rgba(0,0,0, 0.05)'
        };

  &:hover {
    border-color: ${blue[400]};
  }

  &:focus {
    border-color: ${blue[400]};
    box-shadow: 0 0 0 3px ${theme.palette.mode === 'dark' ? blue[600] : blue[200]};
  }

  /* firefox */
  &:focus-visible {
    outline: 0;
  }
`,
);

function OTP({ separator, length, value, onChange }) {
    const inputRefs = useRef(new Array(length).fill(null));

    const focusInput = (targetIndex) => {
        const targetInput = inputRefs.current[targetIndex];
        targetInput.focus();
    };

    const selectInput = (targetIndex) => {
        const targetInput = inputRefs.current[targetIndex];
        targetInput.select();
    };

    const handleKeyDown = (event, currentIndex) => {
        switch (event.key) {
            case 'ArrowUp':
            case 'ArrowDown':
            case ' ':
                event.preventDefault();
                break;
            case 'ArrowLeft':
                event.preventDefault();
                if (currentIndex > 0) {
                    focusInput(currentIndex - 1);
                    selectInput(currentIndex - 1);
                }
                break;
            case 'ArrowRight':
                event.preventDefault();
                if (currentIndex < length - 1) {
                    focusInput(currentIndex + 1);
                    selectInput(currentIndex + 1);
                }
                break;
            case 'Delete':
                event.preventDefault();
                onChange((prevOtp) => {
                    const otp =
                        prevOtp.slice(0, currentIndex) + prevOtp.slice(currentIndex + 1);
                    return otp;
                });

                break;
            case 'Backspace':
                event.preventDefault();
                if (currentIndex > 0) {
                    focusInput(currentIndex - 1);
                    selectInput(currentIndex - 1);
                }

                onChange((prevOtp) => {
                    const otp =
                        prevOtp.slice(0, currentIndex) + prevOtp.slice(currentIndex + 1);
                    return otp;
                });
                break;

            default:
                break;
        }
    };

    const handleChange = (event, currentIndex) => {
        const currentValue = event.target.value;
        let indexToEnter = 0;

        while (indexToEnter <= currentIndex) {
            if (inputRefs.current[indexToEnter].value && indexToEnter < currentIndex) {
                indexToEnter += 1;
            } else {
                break;
            }
        }
        onChange((prev) => {
            const otpArray = prev.split('');
            const lastValue = currentValue[currentValue.length - 1];
            otpArray[indexToEnter] = lastValue;
            return otpArray.join('');
        });
        if (currentValue !== '') {
            if (currentIndex < length - 1) {
                focusInput(currentIndex + 1);
            }
        }
    };

    const handleClick = (event, currentIndex) => {
        selectInput(currentIndex);
    };

    const handlePaste = (event, currentIndex) => {
        event.preventDefault();
        const clipboardData = event.clipboardData;

        // Check if there is text data in the clipboard
        if (clipboardData.types.includes('text/plain')) {
            let pastedText = clipboardData.getData('text/plain');
            pastedText = pastedText.substring(0, length).trim();
            let indexToEnter = 0;

            while (indexToEnter <= currentIndex) {
                if (inputRefs.current[indexToEnter].value && indexToEnter < currentIndex) {
                    indexToEnter += 1;
                } else {
                    break;
                }
            }

            const otpArray = value.split('');

            for (let i = indexToEnter; i < length; i += 1) {
                const lastValue = pastedText[i - indexToEnter] ?? ' ';
                otpArray[i] = lastValue;
            }

            onChange(otpArray.join(''));
        }
    };

    return (
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {new Array(length).fill(null).map((_, index) => (
                <React.Fragment key={index}>
                    <BaseInput
                        slots={{
                            input: InputElement,
                        }}
                        aria-label={`Digit ${index + 1} of OTP`}
                        slotProps={{
                            input: {
                                ref: (ele) => {
                                    inputRefs.current[index] = ele;
                                },
                                onKeyDown: (event) => handleKeyDown(event, index),
                                onChange: (event) => handleChange(event, index),
                                onClick: (event) => handleClick(event, index),
                                onPaste: (event) => handlePaste(event, index),
                                value: value[index] ?? '',
                            },
                        }}
                    />
                    {index === length - 1 ? null : separator}
                </React.Fragment>
            ))}
        </Box>
    );
}

OTP.propTypes = {
    length: PropTypes.number.isRequired,
    onChange: PropTypes.func.isRequired,
    separator: PropTypes.node,
    value: PropTypes.string.isRequired,
};

// before sending code, check email exists, then send code
// after sending code, user fill up the code and submit
// then verify the code
// when successful, redirect to main login page

// add state for storing value email

// enhancement: add loading states and error handling, add timer after sending code to prevent spamming

export default function EmailAction() {
    const navigate = useNavigate();
    const location = useLocation();
    const [loading, setLoading] = useState(false);
    const { email = "", fromLogin = false } = location.state || {};
    const [formData, setFormData] = useState({
        email: email || "",
        code: ""
    });
    const [otp, setOtp] = useState("");
    const [resendTimer, setResendTimer] = useState(116);
    const timerRef = useRef(null);

    // Countdown timer for resend button
    useEffect(() => {
        if (resendTimer > 0) {
            timerRef.current = setTimeout(() => {
                setResendTimer(resendTimer - 1);
            }, 1000);
        } else {
            clearTimeout(timerRef.current);
        }
        return () => clearTimeout(timerRef.current);
    }, [resendTimer]);
    const {
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
    } = useLogin();

    useEffect(() => {
        console.log("Location state:", location.state);
    }, [location.state]);

    // Sync otp with formData.code
    useEffect(() => {
        setFormData(prev => ({
            ...prev,
            code: otp
        }));
    }, [otp]);

    console.log("otp:", otp);
    console.log("formData.code:", formData.code);

    useEffect(() => {
        console.log("Code updated:", formData.code);
    }, [formData.code]);

    const handleVerifyCode = () => {
        // Handle email verification logic here
        console.log("fromLogin? ", location.state?.fromLogin);

        // Using the synchronized formData.code which contains the OTP value
        verifyEmailCodeMutate({ email: formData.email, code: otp },
            {
                onSuccess: (data) => {
                    console.log("Email code verified successfully:", data);
                    toast.success("Email code verified successfully");
                    // Navigate to the next step or show success message
                    if (fromLogin === true) {
                        navigate("../password-action", {
                            state: {
                                email: formData.email,
                                fromLogin: fromLogin
                            }
                        })
                    } else {
                        navigate("/");
                    }
                },
                onError: (error) => {
                    console.error("Error verifying email code:", error);
                    toast.error(error.message || "Failed to verify email code. Please try again.");
                }
            }
        )
    }

    const handleSendCode = () => {
        const { email } = formData;
        if (!email) {
            alert("Email is required to send code.");
            return;
        }

        setLoading(true);

        try {
            sendCodeVerificationMutate(email,
                {
                    onSuccess: (data) => {
                        setLoading(false);
                        setResendTimer(116); // Set timer for 116 seconds
                        console.log("Code sent successfully:", data);
                        toast.success("Code sent to your email");
                    },
                    onError: (error) => {
                        setLoading(false);
                        console.error("Error sending code verification:", error);
                        toast.error(error.message || "Failed to send code. Please try again.");
                    }
                }
            );
        } catch (error) {
            console.error("Error sending code verification:", error);
            toast.error(error.message || "Failed to send code. Please try again.");
        } finally {
            setLoading(false);
        }
    }

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
                <h1 className="text-lg font-semibold">Email Action</h1>
            </div>
            {/* Email and Code Input */}
            <div className="flex flex-col w-full gap-4 mb-4">
                <div>
                    <label htmlFor="email" className="text-sm text-gray-600">Email</label>
                    <div className="relative w-full">
                        <TextInput
                            placeholder="Email"
                            disabled={email ? true : false}
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            id="email"
                        />
                        <Button onClick={handleSendCode} style={"secondary"} disabled={loading || resendTimer > 0} className={"absolute right-0 top-0 px-2"}>{`${(loading) ? "Sending..." : "Send Code"}`}</Button>
                    </div>
                    <p>{`Resend in ${resendTimer} seconds`}</p>
                </div>

                <div>
                    <label htmlFor="code" className="text-sm text-gray-600">Code</label>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        <OTP
                            separator={<span>-</span>}
                            value={otp}
                            onChange={(newOtp) => {
                                setOtp(newOtp);
                                // We don't need to manually update formData here anymore
                                // as the useEffect will handle the synchronization
                            }}
                            length={6}
                        />
                    </Box>
                </div>
                <Button className={"mt-4"} onClick={handleVerifyCode}>Confirm</Button>
            </div>
        </div>
    );
}