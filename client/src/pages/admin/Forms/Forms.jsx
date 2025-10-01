import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { Button, Searchbar } from '../../../components';
import { useAdminCentralizedForms, useRSOForms } from '../../../hooks';
import { useSelectedFormStore, useUserStoreWithAuth } from "../../../store";
import { FormatDate } from '../../../utils';

// params for rso not tested yet

// problem with stale request after reloading page

export default function Forms() {
    const navigate = useNavigate();
    const location = useLocation();
    const isEdit = location.state?.mode === "edit" || false;
    const [searchQuery, setSearchQuery] = useState('');
    const [filterType, setFilterType] = useState('all');
    const [deleteModalOpen, setDeleteModalOpen] = useState(false);
    const [formToDelete, setFormToDelete] = useState(null);
    const [selectedFormName, setSelectedFormName] = useState(""); // new state
    const [formToDisplay, setFormToDisplay] = useState(null);
    const preSelectedForm = useSelectedFormStore(state => state.selectedForm);
    const [selectedForms, setSelectedForms] = useState({
        feedbackForm: "",
        preActForm: "",
    });
    const { isUserRSORepresentative } = useUserStoreWithAuth();
    const [filters, setFilters] = useState({
        search: "",
        formType: "All",
    });

    useEffect(() => {
        if (preSelectedForm) {
            setSelectedForms({
                feedbackForm: preSelectedForm.feedbackForm || "",
                preActForm: preSelectedForm.preActForm || "",
            });
        }
    }, [preSelectedForm]);

    useEffect(() => {
        if (searchQuery && searchQuery.length >= 3) {
            setFilters(prev => ({ ...prev, search: searchQuery }));
        } else (
            setFilters(prev => ({ ...prev, search: "" }))
        )
    }, [searchQuery]);

    const {
        allForms,
        isLoadingAllForms,
        isRefetchingAllForms,
        refetchAllForms,
        errorAllForms,

        // delete forms
        deleteFormMutate,
        isDeletingForm,
        isDeletingFormError,
        deleteFormError
    } = useAdminCentralizedForms({
        search: filters.search,
        formType: filters.formType,
    });

    const {
        rsoFormsTemplate,
        isLoadingRSOFormsTemplate,
        isErrorRSOFormsTemplate,
        errorRSOFormsTemplate,
    } = useRSOForms({
        search: filters.search,
        formType: filters.formType,
        manualEnabled: true, // always enabled to allow rso to see forms
    });

    console.log("RSO Forms Template:", rsoFormsTemplate);

    useEffect(() => {
        if (isUserRSORepresentative && rsoFormsTemplate) {
            setFormToDisplay(rsoFormsTemplate);
        } else if (!isUserRSORepresentative && allForms) {
            setFormToDisplay(allForms);
        }
    }, [isUserRSORepresentative, rsoFormsTemplate, allForms]);

    console.log("Form to Display:", formToDisplay, "from ", isUserRSORepresentative ? "RSO Forms" : "All Forms");

    useEffect(() => {
        if (isRefetchingAllForms) {
            console.log("Refetching centralized forms...");
        }
        if (allForms) {
            console.log("All centralized forms:", allForms);
        } else if (!isLoadingAllForms && !isRefetchingAllForms) {
            console.log("No centralized forms available.");
        }

        if (errorAllForms) {
            console.error("Error fetching centralized forms:", errorAllForms);
        }
    }, [allForms, isLoadingAllForms, isRefetchingAllForms, errorAllForms]);

    const handleDelete = (formId, formName) => {
        console.log(`Requesting deletion for form: ${formName} (ID: ${formId})`);
        setFormToDelete(formId);
        setSelectedFormName(formName); // store form name
        setDeleteModalOpen(true);
    };

    const confirmDelete = () => {
        if (formToDelete) {
            console.log("Deleting form with ID:", formToDelete);
            // Place actual delete logic here
            setDeleteModalOpen(false);
            setFormToDelete(null);
            setSelectedFormName(""); // clear form name
            deleteFormMutate(formToDelete, {
                onSuccess: () => {
                    toast.success(`Form "${selectedFormName}" deleted successfully`);
                    console.log("Form deleted successfully");
                    refetchAllForms();
                },
                onError: (error) => {
                    console.error("Error deleting form:", error);
                },
            });
        }
    };

    const cancelDelete = () => {
        setDeleteModalOpen(false);
        setFormToDelete(null);
        setSelectedFormName(""); // clear form name
    };

    // Categories for filtering
    const categories = [
        { label: 'All Categories', value: 'All' },
        { label: 'Pre-Activity', value: 'pre-activity' },
        { label: 'Post-Activity', value: 'post-activity' },
        { label: 'Membership', value: 'membership' },
    ];

    function getFormTypeBadgeClass(formType) {
        switch ((formType || '').toLowerCase()) {
            case 'pre-activity':
                return 'bg-blue-100 text-blue-800';
            case 'post-activity':
                return 'bg-green-100 text-green-800';
            case 'membership':
                return 'bg-purple-100 text-purple-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    }

    const handleRSOSelectedForm = (form) => {
        // useSelectedFormStore.getState().setSelectedForm(form);
        // navigate(-1, { state: { selectedFormId: form._id } });
        // Deselect if already selected
        if (selectedForms.preActForm && form._id === selectedForms.preActForm._id) {
            setSelectedForms(prev => ({ ...prev, preActForm: "" }));
            return;
        }
        if (selectedForms.feedbackForm && form._id === selectedForms.feedbackForm._id) {
            setSelectedForms(prev => ({ ...prev, feedbackForm: "" }));
            return;
        }

        // allow to select feedback form first
        if (!selectedForms.preActForm && !selectedForms.feedbackForm) {
            setSelectedForms(prev => ({ ...prev, feedbackForm: form }));
            return;
        }

        // double checks to prevent same form selection
        if (form._id === selectedForms.feedbackForm._id) {
            toast.error("You cannot select the same form for both Pre-Activity and Feedback.");
            return;
        } else {
            setSelectedForms(prev => ({ ...prev, preActForm: form }));
        }
    }

    const handleSubmitSelectedForms = (forms) => {
        useSelectedFormStore.getState().setSelectedForm(forms);
        if (isEdit) {
            navigate(-1, { state: { selectedForms: forms } });
            return;
        } else {
            navigate("/activities/activity-action", { state: { selectedForms: forms, mode: "create" } });
        }
        toast.success("Forms selected successfully!");
    }

    console.log("Selected Forms:", selectedForms);

    return (
        <>
            {/* Header with Create Form button */}
            <div className={`flex flex-col md:flex-row  items-start md:items-center mb-8 ${isUserRSORepresentative ? 'justify-between' : 'justify-end'}`}>

                {/* back feature only for rsos */}
                {isUserRSORepresentative && (
                    <div className="w-full">
                        <Button
                            onClick={() => navigate(-1)}
                            style={"secondary"}>Go Back</Button>
                    </div>
                )}
                {!isUserRSORepresentative && (
                    <button
                        onClick={() => navigate('/forms-builder')}
                        className="mt-4 md:mt-0 bg-primary hover:bg-primary-dark text-white font-bold py-2 px-4 rounded-lg flex items-center gap-2"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                            <path fillRule="evenodd" d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z" clipRule="evenodd" />
                        </svg>
                        Create New Form
                    </button>
                )}
            </div>

            {/* Search and Filter Section */}
            <div className="bg-white rounded-lg border border-gray-300 p-6 mb-6">
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1">
                        <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">Search Forms</label>
                        <Searchbar
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            setSearchQuery={setSearchQuery}
                            placeholder="Search for forms..."
                        // Search is now static, does not affect display
                        />
                    </div>
                    <div className="md:w-1/4">
                        <label htmlFor="filter" className="block text-sm font-medium text-gray-700 mb-1">Filter by Category</label>
                        <select
                            id="filter"
                            value={filters.formType}
                            onChange={(e) => setFilters(prev => ({ ...prev, formType: e.target.value }))}
                            className="block w-full rounded-md border-gray-300 border p-2 focus:border-primary focus:ring-primary"
                        // Dropdown is now static, does not affect display
                        >
                            {categories.map(category => (
                                <option key={category.value} value={category.value}>
                                    {category.label}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Action Required Banner for RSO Representatives */}
            {isUserRSORepresentative && (
                <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 shadow-sm flex items-center gap-3 mb-6">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
                    </svg>
                    <div className="flex flex-col">
                        <span className="text-blue-800 font-semibold text-base">Action Required</span>
                        <span className="text-blue-700 text-sm">Please select two (2) forms for your Activity. One (1) Pre-Activity form and one (1) Feedback form.</span>
                    </div>
                </div>
            )}

            {/* Forms Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
                {formToDisplay && formToDisplay.forms && formToDisplay.forms.length > 0 ? (
                    formToDisplay.forms.map(form => (
                        <div key={form.id} className="bg-white rounded-lg border border-gray-300 hover:border-gray-500 transition-shadow">
                            <div className="p-6">
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-800">{form.title || <span className="text-gray-400">Untitled Form</span>}</h3>
                                        <span
                                            className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${getFormTypeBadgeClass(form.formType)}`}
                                        >
                                            {form.formType
                                                ? form.formType.charAt(0).toUpperCase() + form.formType.slice(1)
                                                : <span className="text-gray-400">Unknown Type</span>}
                                        </span>
                                    </div>
                                </div>
                                <p className="text-gray-600 text-sm mt-4">Created on: {FormatDate(form.createdAt)}</p>
                                <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
                                    <button
                                        onClick={() => {
                                            navigate(`/form-viewer`, { state: { formId: form._id } })
                                            console.log("Viewing form:", form);
                                        }}
                                        className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center gap-1"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                        </svg>
                                        View
                                    </button>
                                    {!isUserRSORepresentative && (
                                        <>
                                            <button
                                                onClick={() => navigate(`/forms-builder`, { state: { formId: form._id } })}
                                                className="text-gray-500 hover:text-gray-800 font-medium text-sm flex items-center gap-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                                </svg>
                                                Edit
                                            </button>
                                            <button
                                                onClick={() => handleDelete(form._id, form.title)}
                                                className="text-gray-400 hover:text-gray-700 font-medium text-sm flex items-center gap-1"
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                                </svg>
                                                Delete
                                            </button>
                                        </>
                                    )}

                                    {(isUserRSORepresentative) && (
                                        <>
                                            <Button
                                                style={form._id === (selectedForms.feedbackForm && selectedForms.feedbackForm._id) || form._id === (selectedForms.preActForm && selectedForms.preActForm._id) ? "secondary" : "primary"}
                                                onClick={() => handleRSOSelectedForm(form)}
                                            >
                                                <div className='flex gap-2 items-center'>
                                                    {`${form._id === (selectedForms.feedbackForm && selectedForms.feedbackForm._id) ? "(Feedback)" : form._id === (selectedForms.preActForm && selectedForms.preActForm._id) ? "(Pre-Activity)" : "Select Form"}`}
                                                    {form._id === (selectedForms.feedbackForm && selectedForms.feedbackForm._id) || form._id === (selectedForms.preActForm && selectedForms.preActForm._id) ?
                                                        <svg xmlns="http://www.w3.org/2000/svg" className='size-5 fill-gray-400' viewBox="0 0 640 640"><path d="M320 576C461.4 576 576 461.4 576 320C576 178.6 461.4 64 320 64C178.6 64 64 178.6 64 320C64 461.4 178.6 576 320 576zM231 231C240.4 221.6 255.6 221.6 264.9 231L319.9 286L374.9 231C384.3 221.6 399.5 221.6 408.8 231C418.1 240.4 418.2 255.6 408.8 264.9L353.8 319.9L408.8 374.9C418.2 384.3 418.2 399.5 408.8 408.8C399.4 418.1 384.2 418.2 374.9 408.8L319.9 353.8L264.9 408.8C255.5 418.2 240.3 418.2 231 408.8C221.7 399.4 221.6 384.2 231 374.9L286 319.9L231 264.9C221.6 255.5 221.6 240.3 231 231z" /></svg>
                                                        :
                                                        ""}
                                                </div>
                                            </Button>
                                            {console.log("Selected Forms inside button:", selectedForms)}
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-1 sm:col-span-2 lg:col-span-3 flex flex-col items-center justify-center py-12">
                        <div className="bg-gray-100 rounded-lg px-6 py-4 shadow-sm flex flex-col items-center">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-lg font-medium text-gray-700">
                                {isLoadingAllForms || isLoadingRSOFormsTemplate ? 'Loading forms...' : 'No forms available.'}
                            </span>
                        </div>
                    </div>
                )}
            </div>

            {/* proceed back */}
            {selectedForms.feedbackForm && selectedForms.preActForm && isUserRSORepresentative && (
                <div className='w-full flex justify-end'>
                    <Button
                        onClick={() => handleSubmitSelectedForms(selectedForms)}
                    >
                        <div className='flex gap-2 items-center'>
                            <svg xmlns="http://www.w3.org/2000/svg" className='fill-white size-5' viewBox="0 0 640 640"><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" /></svg>
                            Confirm Selections
                        </div>
                    </Button>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {deleteModalOpen && (
                <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
                    <div className="bg-white p-6 rounded border border-gray-300 max-w-sm w-full">
                        <div className="flex items-center mb-4">
                            <div className="bg-red-100 rounded-full p-2 mr-3">
                                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </div>
                            <h2 className="text-lg font-semibold text-red-600">Delete Form</h2>
                        </div>
                        <p className="text-gray-700">{`Are you sure you want to delete ${selectedFormName}? This action cannot be undone.`}</p>
                        <div className="mt-4 flex justify-end gap-2">
                            <Button onClick={cancelDelete} style={"secondary"}>Cancel</Button>
                            <Button onClick={confirmDelete} style={"danger"}>Delete</Button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}