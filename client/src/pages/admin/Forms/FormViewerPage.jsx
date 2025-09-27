import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { MainLayout } from '../../../components';
import FormViewer from '../../../components/FormViewer';
import PreLoader from '../../../components/Preloader';
import { useAdminCentralizedForms, useRSOForms } from '../../../hooks';
import { useUserStoreWithAuth } from '../../../store';

// get specific form for rso representative

// still thinking of removing view for RSO Representatives since this route is primarily for Admins
// but for now, we will keep it as is


function FormViewerPage() {
    const navigate = useNavigate();
    const location = useLocation();
    const { activityId, activityName, rsoId, formId } = location.state || {};
    const [formJson, setFormJson] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const { isUserRSORepresentative, isUserAdmin, isCoordinator } = useUserStoreWithAuth();

    const {
        specificForm,
        isLoadingSpecificForm,
        isErrorSpecificForm,
        specificFormError,
    } = useAdminCentralizedForms({ formId });
    const {
        specificRSOForm,
        isLoadingSpecificRSOForm,
        isErrorSpecificRSOForm,
        errorSpecificRSOForm,
    } = useRSOForms({ formId });

    console.log("specific form data:", specificRSOForm);

    useEffect(() => {
        if (isUserAdmin || isCoordinator) {
            if (isLoadingSpecificForm) {
                setLoading(true);
                return;
            }
            if (specificForm && specificForm.form && specificForm.form.formJSON) {
                setFormJson(specificForm.form.formJSON || null);
                setLoading(false);
                return;
            }
        } else if (isUserRSORepresentative) {
            if (isLoadingSpecificRSOForm) {
                setLoading(true);
                return;
            }
            if (specificRSOForm && specificRSOForm.form && specificRSOForm.form.formJSON) {
                setFormJson(specificRSOForm.form.formJSON || null);
                setLoading(false);
                return;
            }
        }
        if (!isLoadingSpecificForm && !formId) {
            toast.error('Form not found. Please check the form ID.');
            setFormJson(null);
            setLoading(false);
            navigate(-1);
        }
    }, [isUserAdmin, isCoordinator, isUserRSORepresentative, isLoadingSpecificForm, isLoadingSpecificRSOForm, specificForm, specificRSOForm, formId, navigate]);

    console.log("form id: ", formId, "the forms is ", specificForm);

    const handleFormSubmit = (data) => {
        setFormJson(data);
        setShowSubmitModal(true);
    };

    const closeSubmitModal = () => {
        setShowSubmitModal(false);
    };

    if (formJson === null) return <PreLoader />;

    return (
        <MainLayout>
            {formJson ? (
                <div className="container mx-auto border rounded-md">
                    <FormViewer formJson={formJson || null} onComplete={handleFormSubmit}></FormViewer>
                </div>
            ) : (
                <div className="text-center">
                    <h2>Form not found</h2>
                    <p>Please check the form ID and try again.</p>
                </div>
            )}
            {/* Submit Info Modal */}
            {showSubmitModal && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded shadow-lg max-w-sm w-full">
                        <div className="flex items-center mb-4">
                            <div className="bg-blue-100 rounded-full p-2 mr-3">
                                <svg className="h-6 w-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-blue-600">Viewing Mode Only</h2>
                        </div>
                        <p className="text-gray-700">
                            The data you entered will <span className="font-semibold text-red-600">not</span> be saved. This form is for viewing purposes only.
                        </p>
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">Your Answers</label>
                            <div className="bg-gray-100 rounded p-3 text-xs text-gray-800 max-h-60 overflow-auto border space-y-2">
                                {formJson && typeof formJson === "object" && Object.keys(formJson).length > 0 ? (
                                    Object.entries(formJson).map(([key, value]) => (
                                        <div key={key} className="flex flex-col mb-2">
                                            <span className="font-semibold text-gray-700">{key}:</span>
                                            {typeof value === "string" ? (
                                                <span className="ml-2 break-all">{value}</span>
                                            ) : value && typeof value === "object" && value.type === "file" ? (
                                                <span className="ml-2 italic text-blue-700">{value.name || "Uploaded file"}</span>
                                            ) : Array.isArray(value) ? (
                                                <span className="ml-2">{value.join(", ")}</span>
                                            ) : (
                                                <span className="ml-2 text-gray-400">[Unsupported field]</span>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <span className="text-gray-400">No answers to display.</span>
                                )}
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button
                                onClick={closeSubmitModal}
                                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                            >
                                OK
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </MainLayout>
        // <div>
        //     temporarily disabled
        // </div>
    );
}

export default FormViewerPage;