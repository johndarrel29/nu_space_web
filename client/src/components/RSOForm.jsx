import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { DropIn } from "../animations/DropIn";
import defaultPic from '../assets/images/default-profile.jpg';
import { Backdrop, Button, CloseButton, TextInput } from "../components";
import TagSelector from '../components/TagSelector';
import useTagSelector from '../hooks/useTagSelector';


export default function RSOForm({ createRSO, onSubmit }) {
    const [tags, setTags] = useState([]);
    const [showSearch, setShowSearch] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [selectedTag, setSelectedTag] = useState("");
    const [selectedModalTag, setSelectedModalTag] = useState(null);

    const {
        selectedTags,
        setSelectedTags,
        searchQuery,
        setSearchQuery,
        isFocused,
        setIsFocused,
        searchedData,
        handleTagClick,
        handleApiTagRemove
    } = useTagSelector();

    const [RSO_picture, setRSOPicture] = useState(null);
    const [formData, setFormData] = useState({
        RSO_name: "",
        RSO_acronym: "",
        RSO_category: "",
        RSO_tags: "",
        RSO_college: "",
        RSO_status: "",
        RSO_description: "",
    });

    const onTagEdit = (tag) => {
        setSelectedTag(tag); // Set the clicked tag as the selected tag
    };

    const fileInputRef = useRef(null);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleTagModal = (tag) => {
        setSelectedModalTag(tag);
        setShowModal(true);
    }

    const handleTagDelete = (tag) => {
        console.log("Deleting tag:", tag);
        // Call the API to delete the tag
        setSelectedTags((prevTags) => prevTags.filter((t) => t !== tag));
        setShowModal(false);
        setSelectedModalTag(null);
    };

    const handleSubmit = async (e) => {
        const newOrg = {

            id: formData.id || Date.now(),
            ...formData,
            RSO_tags: selectedTags,
            RSO_picture: RSO_picture || "No RSO_picture uploaded"
        };
        console.log("New Organization Data:", newOrg);

        await createRSO(newOrg);

        setFormData({
            RSO_name: "",
            RSO_acronym: "",
            RSO_category: "",
            RSO_tags: "",
            RSO_college: "",
            RSO_status: "",
            RSO_description: "",
        });
        setRSOPicture(null);
        setSelectedTags([]);
        setSearchQuery("");

        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const handleImageChange = (event) => {
        const file = event.target.files[0];
        if (file) {
            const imageUrl = URL.createObjectURL(file);
            setRSOPicture(imageUrl);
        }
    };

    useEffect(() => {
        if (showModal) {

            if (formData.RSO_tags?.length) {
                setSelectedTags(formData.RSO_tags);
            }
        }
    }, [showModal]);


    return (
        <div className="max-w-3xl mx-auto dark:bg-gray-800">
            <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-6">Create New RSO</h1>

            {/* Image Upload Section */}
            <div className="flex items-center space-x-6 mb-8">
                <div
                    className="border-2 border-gray-200 mx-auto flex-none size-24 aspect-square shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-28 hover:bg-gray-100 transition duration-300 cursor-pointer overflow-hidden"
                    style={{
                        backgroundImage: RSO_picture ? `url(${RSO_picture})` : `url(${defaultPic})`,
                        backgroundSize: "cover",
                        backgroundPosition: "center",
                    }}
                ></div>
                <div className="flex-1">
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Upload Profile Picture</label>
                    <div className="flex items-center">
                        <label className="cursor-pointer bg-blue-50 hover:bg-blue-100 text-blue-700 px-4 py-2 rounded-lg border border-blue-200 transition duration-200">
                            Choose File
                            <input
                                className="hidden"
                                type="file"
                                id="file_input"
                                accept="image/*"
                                ref={fileInputRef}
                                onChange={handleImageChange}
                                required
                            />
                        </label>
                        <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">
                            {RSO_picture ? "Image selected" : "No file chosen"}
                        </span>
                    </div>
                    <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">SVG, PNG, JPG or GIF (MAX. 800x800px)</p>
                </div>
            </div>

            {/* Form Section */}
            <form onSubmit={handleSubmit} className="gap-6">
                <div className="grid gap-6 md:grid-cols-2">
                    {/* Organization Name */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Organization Name *</label>
                        <input
                            type="text"
                            name='RSO_name'
                            className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            placeholder="e.g. Computer Science Society"
                            required
                            onChange={handleChange}
                            value={formData.RSO_name}
                        />
                    </div>

                    {/* Organization Acronym */}
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Organization Acronym *</label>
                        <input
                            type="text"
                            name="RSO_acronym"
                            className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            placeholder="e.g. CSS"
                            required
                            onChange={handleChange}
                            value={formData.RSO_acronym}
                        />
                    </div>
                </div>

                {/* Tags Management */}
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Tags</label>
                    <TagSelector
                        searchQuery={searchQuery}
                        setSearchQuery={setSearchQuery}
                        setShowSearch={setShowSearch}
                        setIsFocused={setIsFocused}
                        searchedData={searchedData}
                        handleTagClick={handleTagClick}
                        selectedTags={selectedTags}
                        handleApiTagRemove={handleApiTagRemove}
                        setShowModal={setShowModal}
                        handleTagModal={handleTagModal}
                    />
                </div>

                {/* Grid for RSO Colleges & Organization Type */}
                <div className="grid gap-6 md:grid-cols-2">
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">College *</label>
                        <select
                            name='RSO_College'
                            className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            required
                            onChange={handleChange}
                            value={formData.RSO_College}
                        >
                            <option value="" disabled className='text-gray-400'>Select College</option>
                            <option value="CAH">CAH</option>
                            <option value="CA">CA</option>
                            <option value="CBA">CBA</option>
                            <option value="CCIT">CCIT</option>
                            <option value="CEAS">CEAS</option>
                            <option value="CE">CE</option>
                            <option value="CTHM">CTHM</option>
                        </select>
                    </div>
                    <div>
                        <label className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Organization Type *</label>
                        <select
                            name='RSO_category'
                            className="w-full px-4 py-2.5 text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                            required
                            onChange={handleChange}
                            value={formData.RSO_category}
                        >
                            <option value="" disabled className='text-gray-400'>Select organization type</option>
                            <option value="Probationary">Probationary</option>
                            <option value="Professional and Affiliates">Professional & Affiliates</option>
                            <option value="Professional">Professional</option>
                            <option value="Special Interest">Special Interest</option>
                        </select>
                    </div>
                </div>

                {/* Description */}
                <div>
                    <label htmlFor="large-input" className="block mb-2 text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
                    <textarea
                        rows="4"
                        name="RSO_description"
                        className="w-full px-4 py-3 text-gray-900 bg-white border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white"
                        placeholder="Tell us about your organization..."
                        onChange={handleChange}
                        value={formData.RSO_description}
                    />
                </div>

                {/* Terms and Conditions */}
                <div className="flex items-start">
                    <div className="flex items-center h-5">
                        <input
                            id="remember"
                            type="checkbox"
                            className="w-4 h-4 border border-gray-300 rounded bg-gray-50 focus:ring-3 focus:ring-blue-300 dark:bg-gray-700 dark:border-gray-600 dark:focus:ring-blue-600"
                            required
                        />
                    </div>
                    <label htmlFor="remember" className="ms-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                        I agree with the <Link to="#" className="text-blue-600 hover:underline dark:text-blue-500">terms and conditions</Link> *
                    </label>
                </div>

                {/* Submit Button */}
                <div className="flex justify-end">
                    <button
                        type="submit"
                        className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                        Create Organization
                    </button>
                </div>

                {/* Modal for Tag Selection */}
                <AnimatePresence>
                    {showModal && (
                        <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black  bg-opacity-50">
                            <motion.div
                                className="bg-white overflow-hidden rounded-lg shadow-lg w-[90%] max-w-[800px] p-6"
                                variants={DropIn}
                                initial="hidden"
                                animate="visible"
                                exit="exit"
                            >

                                <div className="flex justify-between items-center mb-4">
                                    <h2 className="text-xl font-bold text-gray-800 dark:text-white">Edit Tag</h2>
                                    <div>
                                        <CloseButton
                                            onClick={() => setShowModal(false)}
                                            className="absolute top-4 right-4 text-gray-400 hover:text-gray-500 dark:hover:text-gray-300"
                                        />
                                    </div>
                                </div>

                                <div className='w-full mb-4'>
                                    <TextInput
                                        value={selectedModalTag}
                                    />
                                </div>
                                <div className='flex justify-between '>
                                    <button
                                        className='px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg transition duration-200 shadow-sm hover:shadow-md focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2'
                                        onClick={() => handleTagDelete(selectedModalTag)}
                                        type="button"
                                    >
                                        <span className="text-sm">Delete Tag</span>
                                    </button>
                                    <div className='flex items-center gap-2'>
                                        <Button
                                            type="button"
                                            className={"px-2"}
                                        >
                                            <span className="text-sm">Edit Tag</span>
                                        </Button>
                                        <Button
                                            type="button"
                                            style={"secondary"}
                                            className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg transition dark:bg-gray-700 dark:hover:bg-gray-600 dark:text-white"
                                            onClick={() => setShowModal(false)}
                                        >
                                            Cancel
                                        </Button>
                                    </div>

                                </div>



                            </motion.div>
                        </Backdrop>
                    )}
                </AnimatePresence>
            </form>
        </div>
    );
}