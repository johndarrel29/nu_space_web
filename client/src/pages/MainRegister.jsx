import { TextInput, Button } from "../components";
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { toast } from "react-toastify";

//observation when multiple error occurs, the error doesnt display at all.

function MainRegister() {
    const navigate = useNavigate();
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmpassword, setConfirmPassword] = useState("");
    const [error, setError] = useState("");

    useEffect(() => {
        // Simulate registration effect
        console.log("[Static] Registration effect triggered");
    })

    async function handleRegister() {
        if (!firstName || !lastName || !email || !password || !confirmpassword) {
            setError("All fields are required.");
            return;
        }
        if (password !== confirmpassword) {
            setError("Passwords do not match.");
            return;
        }
        if (password.length < 6 || confirmpassword.length < 6) {
            setError("Password must be at least 6 characters long.");
            return;
        }

        setError("");

        // Simulate registration
        console.log("[Static] Registering user with", {
            firstName,
            lastName,
            email,
            password,
            confirmpassword,
            platform: "web",
        });
        // Simulate registration result
        console.log("[Static] Registration attempted");
    }

    useEffect(() => {
        // Simulate registration success toast
        console.log("[Static] Registration success effect");
    })

    return (
        <div className="flex flex-col items-center justify-center gap-4 w-[70%]">
            <div className="w-full justify-start">
                <div
                    onClick={() => {
                        navigate(-1);
                    }}
                    className='flex items-center justify-center rounded-full h-8 w-8 cursor-pointer border border-gray-300 group'>
                    <svg xmlns="http://www.w3.org/2000/svg" className='fill-gray-600 size-4 group-hover:fill-off-black' viewBox="0 0 448 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" /></svg>
                </div>
            </div>
            <div className="flex w-full gap-2">
                <div className="flex flex-col w-full">
                    <label htmlFor="firstName" className="text-sm font-medium text-gray-700 mb-1">
                        First Name
                    </label>
                    <TextInput
                        id="firstName"
                        placeholder="Jane"
                        type="text"
                        value={firstName}
                        autoFocus
                        onChange={(e) => {
                            setFirstName(e.target.value);
                        }}
                    />
                </div>
                <div className="flex flex-col w-full">
                    <label htmlFor="lastName" className="text-sm font-medium text-gray-700 mb-1">
                        Last Name
                    </label>
                    <TextInput
                        id="lastName"
                        placeholder="Doe"
                        type="text"
                        value={lastName}
                        onChange={(e) => {
                            setLastName(e.target.value);
                        }}
                    />
                </div>
            </div>
            <div className="flex flex-col w-full">
                <label htmlFor="email" className="text-sm font-medium text-gray-700 mb-1">
                    Email
                </label>
                <TextInput
                    id="email"
                    placeholder=""
                    type="email"
                    value={email}
                    onChange={(e) => {
                        setEmail(e.target.value);
                    }}
                />
            </div>
            <div className="flex flex-col w-full">
                <label htmlFor="password" className="text-sm font-medium text-gray-700 mb-1">
                    Password
                </label>
                <TextInput
                    id="password"
                    placeholder=""
                    type="password"
                    value={password}
                    onChange={(e) => {
                        setPassword(e.target.value);
                    }}
                />
            </div>
            <div className="flex flex-col w-full">
                <label htmlFor="confirmpassword" className="text-sm font-medium text-gray-700 mb-1">
                    Confirm Password
                </label>
                <TextInput
                    id="confirmpassword"
                    placeholder=""
                    type="password"
                    value={confirmpassword}
                    onChange={(e) => {
                        setConfirmPassword(e.target.value);
                    }}

                />
            </div>

            {error && (
                <p className="mt-2 text-sm text-red-600">
                    {error}
                </p>
            )}

            <Button
                className={"w-full mt-6"}
                onClick={handleRegister}
            >
                Register
            </Button>
        </div>
    );
}

export default MainRegister;