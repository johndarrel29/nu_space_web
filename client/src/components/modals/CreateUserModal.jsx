import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { DropIn } from "../../animations/DropIn";
import { Button, CloseButton, LoadingSpinner } from "../../components";
import { useSuperAdminUsers } from "../../hooks";
import { isValidAdminEmail } from "../../utils";
import { Backdrop, ReusableDropdown, TextInput } from "../ui";

// debug edit API depending on the role


export default function CreateUserModal({ closeModal }) {
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        role: "",
        password: "",
        confirmpassword: "",
        platform: "web"
    });
    const { createAccount, isCreatingAccount, isCreateError, createErrorMessage, refetchAccounts } = useSuperAdminUsers();

    useEffect(() => {
        let timer;
        if (loading) {
            timer = setTimeout(() => {
                setLoading(false);
            }, 5000); // 5 seconds
        }
        return () => clearTimeout(timer);
    }, [loading]);

    const options = [
        { label: "Admin", value: "admin" },
        { label: "Coordinator", value: "coordinator" },
        { label: "Director", value: "director" },
        { label: "AVP", value: "avp" }
    ];



    const handleSubmit = () => {
        try {
            if (!formData.firstName || !formData.lastName || !formData.email || !formData.role || !formData.password || !formData.confirmpassword) {
                toast.error("All fields are required.");
                setLoading(false);
                return;
            }
            const errorMsg = isValidAdminEmail(formData.email);

            setLoading(true);
            if (errorMsg) {
                toast.error(errorMsg);
                return setLoading(false);
            }


            // Handle form submission logic here
            console.log("Form submitted with data:", formData);
            // You can add your API call here to create the user
            createAccount(formData,
                {
                    onSuccess: () => {
                        toast.success("User created successfully");
                        refetchAccounts();
                        setLoading(false);
                        closeModal();
                    },
                    onError: (error) => {
                        toast.error(`Error creating user: ${error.message}`);
                        setLoading(false);
                    }
                }
            );
        } catch (error) {
            toast.error("Error creating user: " + error.message);
            setLoading(false);
            throw new Error("Error creating user: " + error.message);
        } finally {
            setLoading(false);
        }
    };

    // Function to determine if the Create Account button should be disabled
    function isCreateButtonDisabled() {
        return (
            isCreatingAccount ||
            formData.password !== formData.confirmpassword ||
            !formData.firstName ||
            !formData.lastName ||
            !formData.email ||
            !formData.role ||
            !formData.password ||
            !formData.confirmpassword
        );
    }

    return (
        <>
            <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" >
                <motion.div
                    className="bg-white overflow-hidden rounded-lg shadow-lg w-[90%] max-w-[600px]"
                    variants={DropIn}
                    initial="hidden"
                    animate="visible"
                    exit="exit"
                >
                    <div className=" p-6 z-10">
                        <div>
                            {isCreateError && (
                                <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4" role="alert">
                                    <strong className="font-bold">Error!</strong>
                                    <span className="block sm:inline"> {createErrorMessage.message}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex flex-row justify-between items-center mb-8">
                            <h2 className="text-xl font-semibold">Create New Account</h2>
                            <CloseButton onClick={closeModal} />
                        </div>

                        {/* 
                        <div className="mb-4">
                            <TabSelector tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
                        </div> */}



                        {/* {activeTab === 0 ? <StudentForm /> : <StudentRSOForm role="rso_representative" />} */}
                        <div className="flex flex-col gap-2 mb-8">
                            {/* firstname and lastname */}
                            <div className="flex flex-row gap-4 ">
                                <div>
                                    <label htmlFor="firstName" className="text-sm text-gray-600">First Name</label>
                                    <TextInput name="firstName" value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} type="text" className="w-full p-2 bg-light-gray border border-mid-gray rounded focus:outline-none focus:ring-2 focus:ring-off-black" />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="text-sm text-gray-600">Last Name</label>
                                    <TextInput name="lastName" value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} type="text" className="w-full p-2 bg-light-gray border border-mid-gray rounded focus:outline-none focus:ring-2 focus:ring-off-black" />
                                </div>
                            </div>

                            {/* email */}
                            <label htmlFor="email" className="text-sm text-gray-600">Email</label>
                            <TextInput name="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} type="email" className="w-full p-2 bg-light-gray border border-mid-gray rounded focus:outline-none focus:ring-2 focus:ring-off-black" />

                            {/* role */}
                            <label htmlFor="role" className="text-sm text-gray-600">Role</label>
                            <ReusableDropdown
                                name="role"
                                options={options}
                                value={formData.role}
                                onChange={(e) => setFormData({ ...formData, role: e.target.value })} />

                            {/* password */}
                            <label htmlFor="password" className="text-sm text-gray-600">Password</label>
                            <TextInput name="password" value={formData.password} onChange={(e) => setFormData({ ...formData, password: e.target.value })} type="password" className="w-full p-2 bg-light-gray border border-mid-gray rounded focus:outline-none focus:ring-2 focus:ring-off-black" />

                            {/* confirm password */}
                            <label htmlFor="confirmpassword" className="text-sm text-gray-600">Confirm Password</label>
                            <TextInput name="confirmpassword" type="password" value={formData.confirmpassword} onChange={(e) => setFormData({ ...formData, confirmpassword: e.target.value })} className="w-full p-2 bg-light-gray border border-mid-gray rounded focus:outline-none focus:ring-2 focus:ring-off-black" />
                        </div>


                        <div className="flex flex-row space-x-2  justify-end">
                            <Button onClick={closeModal} className="text-off-black px-4" style="secondary">Cancel</Button>
                            <Button
                                onClick={() => { handleSubmit(); setLoading(true); }}
                                disabled={loading || !formData.firstName || !formData.lastName || !formData.email || !formData.role || !formData.password || !formData.confirmpassword || formData.password !== formData.confirmpassword}
                                className="px-4">
                                {loading ? <LoadingSpinner /> :
                                    <div className="flex flex-row space-x-2 items-center justify-center">
                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className="fill-white size-4"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" /></svg>
                                        <h1>Create Account</h1>
                                    </div>
                                }
                            </Button>
                        </div>

                    </div>
                </motion.div>
            </Backdrop>

        </>

    );


}

// function StudentRSOForm({ role }) {
//     const [selectedRole, setSelectedRole] = useState(role || "student");

//     return (
//         <>
//             <div className="flex flex-row gap-4 ">
//                 <div>
//                     <label htmlFor="firstName">First Name</label>
//                     <TextInput name="firstName" type="text" className="w-full p-2 bg-light-gray border border-mid-gray rounded mb-4 focus:outline-none focus:ring-2 focus:ring-off-black" />
//                 </div>
//                 <div >
//                     <label htmlFor="lastName">Last Name</label>
//                     <TextInput name="lastName" type="text" className="w-full p-2 bg-light-gray border border-mid-gray rounded mb-4 focus:outline-none focus:ring-2 focus:ring-off-black" />
//                 </div>
//             </div>

//             <label htmlFor="email">Email</label>
//             <TextInput name="email" type="email" className="w-full p-2 bg-light-gray border border-mid-gray rounded mb-4 focus:outline-none focus:ring-2 focus:ring-off-black" />


//             <div className="mb-6">
//                 <label htmlFor="role">Role</label>
//                 <DropdownSearch
//                     id="category"
//                     isDisabled={selectedRole !== "rso_representative"}
//                     role={role}
//                 />
//             </div>

//         </>


//     );
// }
//                 <DropdownSearch
//                     id="category"
//                     isDisabled={selectedRole !== "rso_representative"}
//                     role={role}
//                 />
//             </div>

//         </>


//     );
// }
