import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from '../../context/AuthContext';
import { useTokenStore, useUserStoreWithAuth } from "../../store";

// for rso representative
// looks like this url is no longer available in backend
const fetchDocuments = async () => {
    try {
        const token = useTokenStore.getState().getToken();

        console.log("response url ", `${process.env.REACT_APP_BASE_URL}/api/rsoRep/documents/fetch-accreditation-documents`);

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/documents/fetch-accreditation-documents`, {
            method: "GET",
            headers: {
                Authorization: token,
                'Content-Type': 'application/json'
            },
        });

        console.log("response received for fetch docs:", response)


        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} - ${response.statusText}`);
        }

        const json = await response.json();
        return json.documents ?? []; // return only array of docs
    } catch (error) {
        console.error("Error fetching documents:", error);
        throw error;
    }
}

// submit document - pure API function (no local state)
const submitDocument = async ({ formData }) => {
    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

    const headers = { Authorization: formattedToken || '' };

    const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/documents/submitDocument`, {
        method: "POST",
        headers,
        body: formData,
    });

    if (!response.ok) {
        throw new Error(`Error: ${response.status} - ${response.statusText}`);
    }

    return response.json();
};

const fetchDocumentTemplate = async (documentFor = "", user = {}) => {
    const token = localStorage.getItem("token");
    const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

    let url = '';
    const role = user?.role || '';
    switch (role) {
        case 'admin':
        case 'coordinator':
        case 'super_admin':
            url = `${process.env.REACT_APP_BASE_URL}/api/admin/documents/templateDocuments`;
            break;
        case 'rso_representative':
            url = `${process.env.REACT_APP_BASE_URL}/api/rsoRep/documents/template?documentFor=${documentFor}`;
            break;
        default:
            throw new Error(`No URL defined for role: ${role}`);
    }

    const res = await fetch(url, {
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

    return res.json();
}

const uploadAccreditationDocumentRequest = async ({ formData }) => {
    try {
        const token = localStorage.getItem("token");
        // const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

        console.log("received formData:", formData);
        // only take file
        // if (!formData.get("file")) {
        //     throw new Error("No file found");
        // }

        // Log all key-value pairs in FormData
        for (let pair of formData.entries()) {
            console.log("formsdata", pair[0], pair[1]);
        }

        const headers = { Authorization: token || '' };

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/documents/accreditation/upload`, {
            method: "POST",
            headers: {
                Authorization: token,
            },
            body: formData,
        });
        console.log("upload response:", response);

        if (!response.ok) {
            const errorData = await response.json(); // try to read the server's message
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);

        }

        return response.json();
    } catch (error) {
        console.error("Error uploading document:", error.message);
        throw error;
    }
};

const uploadActivityDocumentRequest = async ({ formData, activityId }) => {
    try {
        console.log("uploadActivityDocumentRequest received ", { formData, activityId });

        const token = localStorage.getItem("token");
        const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

        const headers = { Authorization: formattedToken || '' };

        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/documents/activity/upload/${activityId}`, {
            method: "POST",
            headers: {
                Authorization: token,
            },
            body: formData,
        });

        if (!response.ok) {
            throw new Error(`Error: ${response.status} - ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error("Error uploading document:", error);
        throw error;
    }
};

const deleteAccreditationDocumentRequest = async ({ documentId }) => {
    try {
        const token = localStorage.getItem("token");
        const formattedToken = token?.startsWith("Bearer ") ? token : `Bearer ${token}`;

        const headers = { Authorization: formattedToken || '' };

        console.log("url request for deleting document:", `${process.env.REACT_APP_BASE_URL}/api/rsoRep/documents/deleteAccreditationDocument/${documentId}`);

        if (!documentId) {
            throw new Error("Document ID is required to delete document");
        }
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/documents/deleteAccreditationDocument/${documentId}`, {
            method: "DELETE",
            headers,
        });

        if (!response.ok) {
            const errorData = await response.json(); // try to read the server's message
            throw new Error(errorData.message || `Error: ${response.status} - ${response.statusText}`);
        }

        return response.json();
    } catch (error) {
        console.error("Error deleting document:", error.message);
        throw error;
    }
}

const fetchSpecificDocument = async ({ queryKey }) => {
    try {
        const documentId = queryKey[1]; // Extract documentId from queryKey
        console.log(`url request is ${process.env.REACT_APP_BASE_URL}/api/rsoRep/documents/${documentId}`);
        if (!documentId) {
            throw new Error("Document ID is required to fetch specific document");
        }
        const token = useTokenStore.getState().getToken();
        const response = await fetch(`${process.env.REACT_APP_BASE_URL}/api/rsoRep/documents/${documentId}`, {
            method: "GET",
            headers: {
                Authorization: token,
                'Content-Type': 'application/json'
            },
        });
        if (!response.ok) {
            throw new Error(`Fetch failed: ${response.status} - ${response.statusText}`);
        }
        const json = await response.json();
        return json?.data || {}; // return specific document data
    } catch (error) {
        console.error("Error fetching specific document:", error);
        throw error;
    }
}

function useRSODocuments({ documentFor = "", documentId = "" } = {}) {
    const queryClient = useQueryClient();
    const { user } = useAuth();
    const { isUserRSORepresentative } = useUserStoreWithAuth();
    const token = useTokenStore.getState().getToken();
    console.log("received documedId:", documentId);

    console.log("useRSODOCS is being called.")


    const {
        data: generalDocuments,
        isLoading: generalDocumentsLoading,
        isError: generalDocumentsError,
        error: generalDocumentsQueryError,
        refetch: refetchGeneralDocuments,
    } = useQuery({
        queryKey: ["documents"],
        queryFn: fetchDocuments,
        enabled: !!isUserRSORepresentative && !!token,
        onSuccess: (data) => {
            console.log("Documents fetched successfully:", data);
        },
        onError: (error) => {
            console.error("Error fetching documents:", error);
        },
    });

    // mutation for submitting documents
    const {
        mutate: submitDocumentMutate,
        isLoading: submitDocumentLoading,
        isSuccess: submitDocumentSuccess,
        isError: submitDocumentError,
        error: submitDocumentQueryError,
    } = useMutation({
        enabled: isUserRSORepresentative,
        mutationFn: ({ formData }) => submitDocument({ formData }),
        onSuccess: () => {
            queryClient.invalidateQueries(["documents"]);
        },
    });

    const {
        data: documentTemplate,
        isLoading: documentTemplateLoading,
        isError: documentTemplateError,
        error: documentTemplateQueryError,
        refetch: refetchDocumentTemplate,
    } = useQuery({
        queryKey: ["documentTemplate", documentFor],
        queryFn: () => fetchDocumentTemplate(documentFor || "", user),
        enabled: !!documentFor && !!isUserRSORepresentative,
        onSuccess: (data) => {
            console.log("Document template fetched successfully:", data);
        },
        onError: (error) => {
            console.error("Error fetching document template:", error);
        }
    });

    const {
        mutate: uploadAccreditationDocument,
        isLoading: uploadAccreditationDocumentLoading,
        isSuccess: uploadAccreditationDocumentSuccess,
        isError: uploadAccreditationDocumentError,
        error: uploadAccreditationDocumentQueryError,
    } = useMutation({
        enabled: isUserRSORepresentative,
        mutationFn: ({ formData }) => uploadAccreditationDocumentRequest({ formData }),
        onSuccess: () => {
            queryClient.invalidateQueries(["documents"]);
        },
    });

    const {
        mutate: uploadActivityDocument,
        isLoading: uploadActivityDocumentLoading,
        isSuccess: uploadActivityDocumentSuccess,
        isError: uploadActivityDocumentError,
        error: uploadActivityDocumentQueryError,
    } = useMutation({
        enabled: isUserRSORepresentative,
        mutationFn: ({ formData, activityId }) => uploadActivityDocumentRequest({ formData, activityId }),
        onSuccess: () => {
            queryClient.invalidateQueries(["documents"]);
        },
    });

    const {
        mutate: deleteAccreditationDocument,
        isLoading: deleteAccreditationDocumentLoading,
        isSuccess: deleteAccreditationDocumentSuccess,
        isError: deleteAccreditationDocumentError,
        error: deleteAccreditationDocumentQueryError,
    } = useMutation({
        enabled: isUserRSORepresentative,
        mutationFn: deleteAccreditationDocumentRequest,
        onSuccess: () => {
            queryClient.invalidateQueries(["documents"]);
        },
    });

    const {
        data: specificDocument,
        isLoading: specificDocumentLoading,
        isError: specificDocumentError,
        error: specificDocumentQueryError,
    } = useQuery({
        queryKey: ["documents", documentId],
        queryFn: fetchSpecificDocument,
        enabled: !!documentId && !!isUserRSORepresentative,
    });

    return {
        // get document data
        generalDocuments,
        generalDocumentsLoading,
        generalDocumentsError,
        generalDocumentsQueryError,
        refetchGeneralDocuments,

        // submitDocument
        submitDocumentMutate,
        submitDocumentLoading,
        submitDocumentSuccess,
        submitDocumentError,
        submitDocumentQueryError,

        // document template
        documentTemplate,
        documentTemplateLoading,
        documentTemplateError,
        documentTemplateQueryError,
        refetchDocumentTemplate,

        // uploadAccreditationDocument
        uploadAccreditationDocument,
        uploadAccreditationDocumentLoading,
        uploadAccreditationDocumentSuccess,
        uploadAccreditationDocumentError,
        uploadAccreditationDocumentQueryError,

        // uploadActivityDocument
        uploadActivityDocument,
        uploadActivityDocumentLoading,
        uploadActivityDocumentSuccess,
        uploadActivityDocumentError,
        uploadActivityDocumentQueryError,

        // deleteAccreditationDocument
        deleteAccreditationDocument,
        deleteAccreditationDocumentLoading,
        deleteAccreditationDocumentSuccess,
        deleteAccreditationDocumentError,
        deleteAccreditationDocumentQueryError,

        // specific document
        specificDocument,
        specificDocumentLoading,
        specificDocumentError,
        specificDocumentQueryError,
    }
}

export default useRSODocuments;