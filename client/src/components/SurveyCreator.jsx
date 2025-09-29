"use client";

import "survey-core/survey-core.css";
import "survey-creator-core/survey-creator-core.css";

import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { registerCreatorTheme } from "survey-creator-core";
import SurveyCreatorTheme from "survey-creator-core/themes";
import { SurveyCreator, SurveyCreatorComponent } from "survey-creator-react";

import { Button, TextInput } from "../components";
import PreLoader from "../components/Preloader";
import { useAdminCentralizedForms, useModal } from "../hooks";

// Allowed form fields
const ALLOWED_FORM_ELEMENTS = [
    "text", "comment", "checkbox", "rating", "dropdown",
    "tagbox", "radiogroup", "file"
];

const DEFAULT_CREATOR_OPTIONS = {
    autoSaveEnabled: true,
    collapseOnDrag: true,
};

registerCreatorTheme(SurveyCreatorTheme);

export default function SurveyCreatorWidget(props) {
    // Hooks and state initialization
    const location = useLocation();
    const navigate = useNavigate();
    const { isOpen, openModal, closeModal } = useModal();

    const [creator, setCreator] = useState(null);
    const [surveyMode, setSurveyMode] = useState("create");
    const [notAllowedList, setNotAllowedList] = useState([]);
    const [title, setTitle] = useState(location.state?.activityName ? `${location.state.activityName} Survey` : "");

    const { activityId, activityName, rsoId, formId } = location.state || {};

    const {
        createFormMutate,
        isCreatingForm,
        isCreatingFormError,
        createFormError,
        specificForm,
        isLoadingSpecificForm,
        isErrorSpecificForm,
        specificFormError,
        editFormMutate,
        isEditingForm,
        isEditingFormError,
        editFormError,
    } = useAdminCentralizedForms({ formId });

    const [temporaryData, setTemporaryData] = useState({
        title: "",
        description: "",
        formType: "",
        formJSON: null,
    });

    // Derived state
    const notAllowedElements = temporaryData?.formJSON?.pages
        ?.flatMap(page =>
            page.elements?.filter(item => !ALLOWED_FORM_ELEMENTS.includes(item.type))
                .map(item => item.type) || []
        );

    // Effects
    useEffect(() => {
        if (surveyMode === "edit" && formId) {
            setTemporaryData({
                title: specificForm?.form?.title || "",
                description: specificForm?.form?.description || "",
                formType: specificForm?.form?.formType || "",
                formJSON: specificForm?.form?.formJSON || null,
            });
        }
    }, [formId, specificForm, surveyMode]);

    useEffect(() => {
        setNotAllowedList([...new Set(notAllowedElements)]);
    }, [temporaryData.formJSON]);

    useEffect(() => {
        if (isLoadingSpecificForm) {
            console.log("Loading surveys from API...");
            return;
        }

        if (formId && specificForm?.form?.formJSON && surveyMode !== "edit") {
            setSurveyMode("edit");
        }

        if (!creator && !isLoadingSpecificForm) {
            initializeSurveyCreator();
        }
    }, [isLoadingSpecificForm, props.options, formId, specificForm, surveyMode]);

    useEffect(() => {
        console.log("Temporary Data:", {
            ...temporaryData,
            formJSON: temporaryData.formJSON,
        });
    }, [temporaryData]);

    // Event handlers
    const handleSubmitForm = () => {
        if (!creator) return;

        if (!validateForm()) return;

        const surveyJson = creator.JSON;
        console.log("submitting form", temporaryData);

        if (surveyMode === "create") {
            submitCreateForm();
        }

        if (surveyMode === "edit" && formId) {
            submitEditForm();
        }
    };

    const handleExit = () => {
        navigate(-1);
    };

    // Helper functions
    const initializeSurveyCreator = () => {
        const newCreator = new SurveyCreator(props.options || DEFAULT_CREATOR_OPTIONS);

        newCreator.saveSurveyFunc = (saveNo, callback) => {
            setTemporaryData(prev => ({
                ...prev,
                formJSON: newCreator.JSON
            }));
            callback(saveNo, true);
        };

        if (formId && specificForm?.form?.formJSON) {
            try {
                newCreator.JSON = specificForm.form.formJSON;
                newCreator.text = JSON.stringify(newCreator.JSON, null, 2);
            } catch (error) {
                console.error("Error parsing specific form JSON:", error);
            }
        }

        setCreator(newCreator);
    };

    const validateForm = () => {
        if (!temporaryData.title || !temporaryData.description || !temporaryData.formJSON) {
            console.error("All fields are required");
            toast.error("All fields are required");
            return false;
        }

        if (notAllowedList.length > 0) {
            console.error("One or more form elements are of disallowed type.");
            toast.error(`The element/s of type: ${[...new Set(notAllowedList)].join(", ")} are not allowed. Please remove them before submitting.`);
            return false;
        }

        return true;
    };

    const submitCreateForm = () => {
        createFormMutate(temporaryData, {
            onSuccess: (data) => {
                console.log("Form created successfully:", data);
                handleSuccess("Form created successfully");
            },
            onError: (error) => {
                console.error("Error creating form:", error);
            }
        });
    };

    const submitEditForm = () => {
        console.log("received edit mutate. sending: ", { formData: temporaryData, formId });
        editFormMutate({ formData: temporaryData, formId }, {
            onSuccess: (data) => {
                console.log("Form edited successfully:", data);
                handleSuccess("Form edited successfully");
            },
            onError: (error) => {
                console.error("Error editing form:", error);
            }
        });
    };

    const handleSuccess = (message) => {
        closeModal();
        resetTemporaryData();
        navigate(-1);
        toast.success(message);
    };

    const resetTemporaryData = () => {
        setTemporaryData({
            title: "",
            description: "",
            formJSON: {
                pages: []
            }
        });
    };

    // Render logic
    if (!creator) return <PreLoader />;

    return (
        <>
            <div className="w-full h-screen">
                <SurveyCreatorComponent creator={creator} />
                <FormActions
                    surveyMode={surveyMode}
                    hasFormData={temporaryData?.formJSON?.pages?.length > 0}
                    onExit={handleExit}
                    onOpenModal={openModal}
                />
            </div>

            {isOpen && (
                <SubmissionModal
                    temporaryData={temporaryData}
                    setTemporaryData={setTemporaryData}
                    surveyMode={surveyMode}
                    createFormError={createFormError}
                    isCreatingFormError={isCreatingFormError}
                    onClose={closeModal}
                    onSubmit={handleSubmitForm}
                />
            )}
        </>
    );
}

// Extracted components for better readability
const FormActions = ({ surveyMode, hasFormData, onExit, onOpenModal }) => (
    <div className="flex justify-center items-center gap-4 bg-white h-16 absolute bottom-0 w-full">
        {!hasFormData && surveyMode !== "edit" && (
            <div className="w-full absolute bg-white/50 h-16"></div>
        )}
        <Button style="secondary" onClick={onExit}>Cancel Form</Button>
        <Button onClick={onOpenModal}>
            {`Submit ${surveyMode === "edit" ? "Editing " : "New "} Form`}
        </Button>
    </div>
);

const SubmissionModal = ({
    temporaryData,
    setTemporaryData,
    surveyMode,
    createFormError,
    isCreatingFormError,
    onClose,
    onSubmit
}) => (
    <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
        <div className="bg-white p-6 rounded shadow-lg">
            <h2 className="text-lg font-semibold mb-4">Create Survey</h2>
            <p>{`Create a title and description before submitting.`}</p>

            <div className="mt-4 flex flex-col gap-4">
                <TextInput
                    label="Survey Title"
                    placeholder="Enter survey title"
                    value={temporaryData.title}
                    onChange={(e) => {
                        setTemporaryData({ ...temporaryData, title: e.target.value });
                    }}
                />

                <textarea
                    rows={4}
                    name="description"
                    id="description"
                    placeholder="Enter survey description"
                    className="bg-textfield border border-mid-gray text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                    value={temporaryData.description}
                    onChange={(e) => setTemporaryData({ ...temporaryData, description: e.target.value })}
                />

                <FormTypeSelector
                    value={temporaryData.formType}
                    onChange={(e) => setTemporaryData({ ...temporaryData, formType: e.target.value })}
                />
            </div>

            {createFormError && (
                <div className="text-red-500 mt-2">
                    {isCreatingFormError ? createFormError.message : "An error occurred while creating the survey."}
                </div>
            )}

            <div className="mt-4 flex justify-end gap-2">
                <Button onClick={onClose} style="secondary">Cancel</Button>
                <Button onClick={onSubmit}>Confirm</Button>
            </div>
        </div>
    </div>
);

const FormTypeSelector = ({ value, onChange }) => (
    <div className="flex flex-col">
        <label className="text-sm font-medium text-gray-700 mb-1">Form Type</label>
        <select
            value={value}
            onChange={onChange}
            className="bg-textfield border border-mid-gray text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
        >
            <option value="" disabled>Select form type</option>
            <option value="pre-activity">Pre-Activity Forms</option>
            <option value="post-activity">Post-Activity Forms</option>
            <option value="membership">Membership Forms</option>
        </select>
    </div>
);