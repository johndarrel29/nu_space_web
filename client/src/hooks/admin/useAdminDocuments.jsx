import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { useAuth } from '../../context/AuthContext';
import { useTokenStore, useUserStoreWithAuth } from "../../store";

// =============API Calls
// for admin
const approveRSODocument = async (documentId, reviewedById) => {
    try {
        console.log("approveRSODocument called with:", { documentId, reviewedById });
        const token = localStorage.getItem("token");
        const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

        console.log("request url: " + `${process.env.REACT_APP_BASE_URL}/api/documents/approveDocument/${documentId}`);
        console.log("request body: ", JSON.stringify({ reviewedById }));

        const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/documents/approveDocument/${documentId}`, {
            method: "PATCH",
            headers: {
                'Authorization': formattedToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reviewedById }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Approval failed: ${errorText}`);
        }

        return res.json();
    } catch (error) {
        console.error("Error in approveRSODocument:", error);
        throw error;
    }
};

// for admin
const rejectRSODocument = async (documentId, reviewedById) => {
    try {
        const token = localStorage.getItem("token");
        const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

        const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/documents/rejectDocument/${documentId}`, {
            method: "PATCH",
            headers: {
                'Authorization': formattedToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ reviewedById }),
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Rejection failed: ${errorText}`);
        }

        return res.json();
    } catch (error) {
        console.error("Error in rejectRSODocument:", error);
        throw error;
    }
}

// for admin
// Add new function to fetch general documents with direct ID
const fetchGeneralDocuments = async (id) => {
    try {
        const token = localStorage.getItem("token");
        const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

        console.log("Fetching general documents for ID:", id);
        console.log("URL:", `${process.env.REACT_APP_BASE_URL}/${id}/general-documents-rso`);

        const res = await fetch(`${process.env.REACT_APP_BASE_URL}/${id}/general-documents-rso`, {
            method: "GET",
            headers: {
                'Authorization': formattedToken,
                'Content-Type': 'application/json'
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Fetch failed: ${errorText}`);
        }

        const json = await res.json();

        if (json.success && Array.isArray(json.documents)) {
            return json.documents || [];
        }

        throw new Error("Unexpected response structure");
    } catch (error) {
        console.error("Error in fetchGeneralDocuments:", error);
        throw error;
    }
};

// for admin
// get function for pdf viewer
const fetchPDFSignedUrlRequest = async (documentId) => {
    try {

        console.log("Fetching PDF signed URL for document ID:", documentId);
        const token = localStorage.getItem("token");
        const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

        const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/documents/pdfSignedUrl/${documentId}`, {
            method: "GET",
            headers: {
                'Authorization': formattedToken,
                'Content-Type': 'application/json'
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Fetch failed: ${errorText}`);
        }

        const json = await res.json();
        return json;
    } catch (error) {
        console.error("Error in fetchPDFSignedUrlRequest:", error);
        throw error;
    }
}

// checks if the user has a role and fetches the document template accordingly
const fetchDocumentTemplate = async ({ queryKey }) => {
    try {
        const [_key, params] = queryKey;
        // user is now passed as an argument
        const token = localStorage.getItem("token");
        const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

        const filteredParams = {};
        Object.entries(params).forEach(([key, value]) => {
            if (value != undefined && value != null && value != "") {
                filteredParams[key] = value;
            }
        });

        // construct query string from params
        const queryString = new URLSearchParams(filteredParams).toString();
        console.log("url request for templates: ", `${process.env.REACT_APP_BASE_URL}/api/admin/documents/templateDocuments?${queryString}`);
        const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/documents/templateDocuments?${queryString}`, {
            method: "GET",
            headers: {
                'Authorization': formattedToken,
                'Content-Type': 'application/json'
            },
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Fetch failed: ${errorText}`);
        }

        if (res.status === 204) {
            console.warn("No document templates found.");
            return [];
        }

        const json = await res.json();
        return json;
    } catch (error) {
        console.error("Error in fetchDocumentTemplate:", error);
        throw error;
    }
}

const deleteSingleDocumentTemplateRequest = async ({ documentId, templateId }) => {
    try {
        const token = useTokenStore.getState().getToken();

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/documents/templateDocuments/deleteDocument/${templateId}/${documentId}`, {
            method: "DELETE",
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} - ${response.statusText}`);
        }

        const json = await response.json();
        return json;
    } catch (error) {
        console.error("Error in deleteSingleDocumentTemplate:", error);
        throw error;
    }
}

const deleteDocumentTemplateRequest = async (templateId) => {
    try {
        const token = useTokenStore.getState().getToken();
        console.log("received id from template: ", templateId);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/documents/templateDocuments/deleteTemplate/${templateId}`, {
            method: "DELETE",
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} - ${response.statusText}`);
        }

        const json = await response.json();
        return json;
    } catch (error) {
        console.error("Error in deleteDocumentTemplate:", error);
        throw error;
    }
}

const uploadDocumentTemplateRequest = async ({ documentFor, files }) => {
    try {
        console.log("uploadDocumentTemplate has been called");
        console.log("Uploading document for:", documentFor);
        console.log("Files to upload:", files);

        const token = useTokenStore.getState().getToken();

        const formData = new FormData();
        formData.append("documentFor", documentFor);
        console.log("Uploading document for:", documentFor);
        files.forEach(file => {
            console.log("Appending file: ", file);
            formData.append("files", file);
        });

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/documents/templateDocuments/upload`, {
            method: "POST",
            headers: {
                'Authorization': token,
            },
            body: formData
        });

        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} - ${response.statusText}`);
        }

        const json = await response.json();
        return json;
    } catch (error) {
        console.error("Error in uploadDocumentTemplate:", error);
    }
}

// for admin
// add a parameter to fetch all documents based on documentFor, documentType, or userID
const fetchAllDocuments = async ({ queryKey }) => {
    try {
        const [_key, params] = queryKey;
        const token = localStorage.getItem("token");
        const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;

        // Filter out undefined, null, or empty string values from params
        const filteredParams = {};
        Object.entries(params).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== "") {
                filteredParams[key] = value;
            }
        });

        // Construct the query string from params
        const queryString = new URLSearchParams(filteredParams).toString();
        console.log("url request: ", `${process.env.REACT_APP_BASE_URL}/api/admin/documents/allDocuments?${queryString}`);
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/documents/allDocuments?${queryString}`, {
            method: "GET",
            headers: {
                Authorization: token ? `Bearer ${formattedToken}` : "",
                'Content-Type': 'application/json'
            },
        });

        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} - ${response.statusText}`);
        }

        if (response.status === 204) {
            console.warn("No documents found.");
            return [];
        }

        const json = await response.json();
        return json.documents || json || [];
    } catch (error) {
        console.error("Error in fetchAllDocuments:", error);
        throw error;
    }
}

const setAccreditationDeadlineRequest = async (data) => {
    try {
        const token = localStorage.getItem("token");
        const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;


        // take the dates and convert them to UTC before sending.
        const startDeadlineUtc = new Date(data.start_deadline).toISOString();
        const endDeadlineUtc = new Date(data.end_deadline).toISOString();

        const dataToSubmit = {
            ...data,
            start_deadline: startDeadlineUtc,
            end_deadline: endDeadlineUtc
        };
        console.log("Setting accreditation deadline with data:", dataToSubmit);

        const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/rso/rso-accreditation/deadline`, {
            method: "PATCH",
            headers: {
                'Authorization': formattedToken,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(dataToSubmit)
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Fetch failed: ${errorText}`);
        }

        const json = await res.json();
        return json;
    } catch (error) {
        console.error("Error setting accreditation deadline:", error);
        throw error;
    }
}

const fetchDocumentDetail = async ({ queryKey }) => {
    try {
        const token = localStorage.getItem("token");
        const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;
        const documentId = queryKey[1];
        console.log("Fetching document detail for ID:", documentId);

        const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/documents/specific-document/${documentId}`, {
            method: "GET",
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Fetch failed: ${errorText}`);
        }

        const json = await res.json();
        return json;
    } catch (error) {
        console.error("Error in fetchDocumentDetail:", error);
        throw error;
    }
}

const fetchActivityPreDocument = async ({ queryKey }) => {
    try {
        const token = localStorage.getItem("token");
        const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;
        const activityId = queryKey[1];
        console.log("Fetching pre-document for activity ID:", activityId);

        const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/documents/preDocumentActivity/${activityId}`, {
            method: "GET",
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Fetch failed: ${errorText}`);
        }

        const json = await res.json();
        return json;
    } catch (error) {
        console.error("Error in fetchActivityPreDocument:", error);
        throw error;
    }
}

const fetchActivityPostDocument = async ({ queryKey }) => {
    try {
        const token = localStorage.getItem("token");
        const formattedToken = token?.startsWith("Bearer ") ? token.slice(7) : token;
        const activityId = queryKey[1];

        const res = await fetch(`${process.env.REACT_APP_BASE_URL}/api/admin/documents/postDocumentActivity/${activityId}`, {
            method: "GET",
            headers: {
                'Authorization': token,
                'Content-Type': 'application/json'
            }
        });

        if (!res.ok) {
            const errorText = await res.text();
            throw new Error(`Fetch failed: ${errorText}`);
        }

        const json = await res.json();
        return json;
    } catch (error) {
        console.error("Error in fetchActivityPostDocument:", error);
        throw error;
    }
}

function useAdminDocuments({

    documentId = "",
    page = 1,
    limit = 10,
    purpose = "",
    status = "",
    rsoId = "",
    startDate = "",
    endDate = "",
    search = "",
    yearId = "",
    activityId = "",

    templatePage = 1,
    templateLimit = 10,
    documentType = "",
    templateSearch = ""
} = {}) {
    const { user } = useAuth();
    const { isUserAdmin, isCoordinator } = useUserStoreWithAuth();
    const queryClient = useQueryClient();

    console.log("received documentid ", documentId)

    const filters = {
        page,
        limit,
        purpose,
        status,
        rsoId,
        startDate,
        endDate,
        search,
        yearId,
    };

    const templateFilters = {
        page: templatePage,
        limit: templateLimit,
        documentFor: documentType,
        search: templateSearch
    }

    useEffect(() => {
        if (!isUserAdmin || isCoordinator) {
            console.log("not admin detected. removing documents query")
            queryClient.removeQueries(['documents']);
        }
    }, [isUserAdmin, queryClient, isCoordinator]);

    const {
        data: documentTemplate,
        isLoading: documentTemplateLoading,
        isError: documentTemplateError,
        error: documentTemplateQueryError,
        refetch: refetchDocumentTemplate,
        isRefetching: isDocumentTemplateRefetching,
    } = useQuery({
        queryKey: ["documentTemplate", templateFilters],
        queryFn: fetchDocumentTemplate,
        enabled: isUserAdmin || isCoordinator,
    });

    const {
        data: allDocuments,
        isLoading: allDocumentsLoading,
        isError: allDocumentsError,
        error: allDocumentsQueryError,
        refetch: refetchAllDocuments,
    } = useQuery({
        queryKey: ["documents", filters],
        queryFn: fetchAllDocuments,
        onSuccess: (data) => {
            // Optionally handle side effects here
            console.log("All documents fetched successfully:", data);
        },
        onError: (error) => {
            console.error("Error fetching all documents:", error);
        },
        // enabled: isUserAdmin,
        enabled: (() => {
            const isEnabled = isUserAdmin || isCoordinator;
            console.log("Query enabled:", isEnabled);
            return isEnabled;
        })(),
    });

    const {
        mutate: setAccreditationDeadline,
        error: setAccreditationDeadlineError,
        success: setAccreditationDeadlineSuccess,
        refetch: refetchSetAccreditationDeadline
    } = useMutation({
        mutationFn: setAccreditationDeadlineRequest,
        enabled: isUserAdmin || isCoordinator,
        onSuccess: (data) => {
            console.log("Accreditation deadline set successfully:", data);
        },
        onError: (error) => {
            console.error("Error setting accreditation deadline:", error);
        },
    });

    const {
        data: documentDetail,
        isLoading: documentDetailLoading,
        isError: documentDetailError,
        error: documentDetailQueryError,
        refetch: refetchDocumentDetail,
        isRefetching: isDocumentDetailRefetching,
    } = useQuery({
        queryKey: ["documentDetail", documentId],
        queryFn: fetchDocumentDetail,
        enabled: !!documentId,
    });

    const {
        data: activityPreDocument,
        isLoading: activityPreDocumentLoading,
        isError: activityPreDocumentError,
        error: activityPreDocumentQueryError,
        refetch: refetchActivityPreDocument,
        isRefetching: isActivityPreDocumentRefetching,
    } = useQuery({
        queryKey: ["activityPreDocument", activityId],
        queryFn: fetchActivityPreDocument,
        enabled: !!activityId,
    });

    const {
        data: activityPostDocument,
        isLoading: activityPostDocumentLoading,
        isError: activityPostDocumentError,
        error: activityPostDocumentQueryError,
        refetch: refetchActivityPostDocument,
        isRefetching: isActivityPostDocumentRefetching,
    } = useQuery({
        queryKey: ["activityPostDocument", activityId],
        queryFn: fetchActivityPostDocument,
        enabled: !!activityId,
    });

    const {
        mutate: deleteSingleDocumentTemplate,
        error: deleteSingleDocumentTemplateError,
        success: deleteSingleDocumentTemplateSuccess,
        refetch: refetchDeleteSingleDocumentTemplate
    } = useMutation({
        mutationFn: deleteSingleDocumentTemplateRequest,
        enabled: isUserAdmin || isCoordinator,
        onSuccess: (data) => {
            console.log("Document template deleted successfully:", data);
        },
        onError: (error) => {
            console.error("Error deleting document template:", error);
        },
    });

    const {
        mutate: deleteDocumentTemplate,
        error: deleteDocumentTemplateError,
        success: deleteDocumentTemplateSuccess,
        refetch: refetchDeleteDocumentTemplate
    } = useMutation({
        queryKey: ['deleteDocumentTemplate'],
        mutationFn: deleteDocumentTemplateRequest,
        enabled: isUserAdmin || isCoordinator,
        onSuccess: (data) => {
            console.log("Document template deleted successfully:", data);
        },
        onError: (error) => {
            console.error("Error deleting document template:", error);
        },
    });

    const {
        mutate: uploadDocumentTemplate,
        error: uploadDocumentTemplateError,
        success: uploadDocumentTemplateSuccess,
        refetch: refetchUploadDocumentTemplate
    } = useMutation({
        mutationFn: uploadDocumentTemplateRequest,
        enabled: isUserAdmin || isCoordinator,
        onSuccess: (data) => {
            console.log("Document template uploaded successfully:", data);
        },
        onError: (error) => {
            console.error("Error uploading document template:", error);
        },
    });

    const {
        data: pdfSignedUrlData,
        error: pdfSignedUrlError,
        isError: ispdfSignedUrlError,
        isLoading: ispdfSignedUrlLoading
    } = useQuery({
        queryKey: ["pdfSignedUrl", documentId],
        queryFn: () => fetchPDFSignedUrlRequest(documentId),
        enabled: !!documentId,
    });

    return {
        allDocuments,
        allDocumentsLoading,
        allDocumentsError,
        allDocumentsQueryError,
        refetchAllDocuments,

        // Set Accreditation Deadline
        refetchSetAccreditationDeadline,
        setAccreditationDeadline,
        setAccreditationDeadlineError,
        setAccreditationDeadlineSuccess,

        // Document Template
        documentTemplate,
        documentTemplateLoading,
        documentTemplateError,
        documentTemplateQueryError,
        refetchDocumentTemplate,
        isDocumentTemplateRefetching,

        documentDetail,
        documentDetailLoading,
        documentDetailError,
        documentDetailQueryError,
        refetchDocumentDetail,
        isDocumentDetailRefetching,

        activityPreDocument,
        activityPreDocumentLoading,
        activityPreDocumentError,
        activityPreDocumentQueryError,
        refetchActivityPreDocument,
        isActivityPreDocumentRefetching,

        activityPostDocument,
        activityPostDocumentLoading,
        activityPostDocumentError,
        activityPostDocumentQueryError,
        refetchActivityPostDocument,
        isActivityPostDocumentRefetching,

        // delete single template doc
        deleteSingleDocumentTemplate,
        deleteSingleDocumentTemplateError,
        deleteSingleDocumentTemplateSuccess,
        refetchDeleteSingleDocumentTemplate,

        // delete a document template type
        deleteDocumentTemplate,
        deleteDocumentTemplateError,
        deleteDocumentTemplateSuccess,
        refetchDeleteDocumentTemplate,

        // upload document template
        uploadDocumentTemplate,
        uploadDocumentTemplateError,
        uploadDocumentTemplateSuccess,
        refetchUploadDocumentTemplate,

        ispdfSignedUrlError,
        pdfSignedUrlError,
        pdfSignedUrlData,
        ispdfSignedUrlLoading

    };
}

export default useAdminDocuments;