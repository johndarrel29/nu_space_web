import { motion } from "framer-motion";
import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useReactToPrint } from "react-to-print";
import { toast } from 'react-toastify';
import { DropIn } from "../../../animations/DropIn";
import defaultImage from '../../../assets/images/default-picture.png';
import { Backdrop, Button, CloseButton, ReportPage } from '../../../components';
import { useAdminUser, useDashboard, useRSODetails, useSignature } from '../../../hooks';
import { useUserStoreWithAuth } from '../../../store';
import formatRelativeTime from '../../../utils/formatRelativeTime';

// map the data throughout the UI



export default function Dashboard() {
  const { isUserRSORepresentative, isUserAdmin, isCoordinator, isAVP, isDirector } = useUserStoreWithAuth();
  const navigate = useNavigate();
  const {
    rsoDetails,
    isRSODetailsLoading,
    isRSODetailsError,
    isRSODetailsSuccess,
  } = useRSODetails();

  const {
    // fetching admin profile
    adminProfile,
    isAdminProfileLoading,
    isAdminProfileError,
    adminProfileError,
    refetchAdminProfile,
    isAdminProfileRefetching,
  } = useAdminUser();


  const {
    // upload mutation
    mutateUploadSignature,
    isUploading,
    isUploadError,
    uploadError,
    uploadData,
    // fetch query
    signatureData,
    isFetching,
    isFetchError,
    fetchError,
    refetchSignature,

    // delete mutation
    mutateDeleteSignature,
    isDeleting,
    isDeleteError,
    deleteError,
    deleteData
  } = useSignature({ id: adminProfile?.user?._id || null });




  console.log("get signature data", signatureData, "with id", adminProfile?.user?._id);

  const [isSignatureData, setIsSignatureData] = useState(false);

  useEffect(() => {
    if (signatureData && signatureData.data !== null) {
      setIsSignatureData(true);
    }
  }, [signatureData]);

  const {
    adminDocs,
    isLoadingAdminDocs,
    isErrorAdminDocs,
    errorAdminDocs,

    accreditation,
    isLoadingAccreditation,
    isErrorAccreditation,
    errorAccreditation,

    activity,
    isLoadingActivity,
    isErrorActivity,
    errorActivity,

    createdActivities,
    isLoadingCreatedActivities,
    isErrorCreatedActivities,
    errorCreatedActivities,

    RSOMembers,
    isLoadingRSOMembers,
    isErrorRSOMembers,
    errorRSOMembers,

    RSOApplicants,
    isLoadingRSOApplicants,
    isErrorRSOApplicants,
    errorRSOApplicants
  } = useDashboard();
  const [username, setUsername] = useState("");
  const [signatureRequest, setSignatureRequest] = useState({
    id: null, file: null
  });

  const contentRef = useRef(null);
  const reactToPrintFn = useReactToPrint({ contentRef });


  console.log("rso user members", RSOMembers, "with applicants", RSOApplicants, "new revised activities", createdActivities);


  useEffect(() => {
    if (!isUserAdmin || !isUserRSORepresentative) {
      setSignatureRequest(prev => ({ ...prev, id: adminProfile?.user?._id || null }));
    }

    if (isUserRSORepresentative) {
      setUsername(rsoDetails?.rso?.RSO_name || "RSO User");
    } else {
      setUsername(adminProfile?.user?.firstName || "Admin User");
    }
  }, [isUserRSORepresentative, adminProfile, rsoDetails, isUserAdmin]);

  console.log("[Dashboard] Signature request state:", signatureRequest);

  // Extract dashboard stats from adminDocs if available
  const dashboardStats = adminDocs?.dashboard;

  // Compute stats for ReportPage, fallback to 0 for all fields
  const stats = {
    totalDocuments: isUserRSORepresentative
      ? accreditation?.documents?.totalDocuments ?? 0
      : dashboardStats?.totalDocuments ?? 0,
    pendingApproval: isUserRSORepresentative
      ? accreditation?.documents?.pendingApproval ?? 0
      : dashboardStats?.totalPendingDocuments ?? 0,
    recentlyApproved: isUserRSORepresentative
      ? accreditation?.documents?.rejectedDocuments ?? 0
      : dashboardStats?.recentlyApprovedDocuments ?? 0,
    documentsByType: {
      activities: isUserRSORepresentative
        ? RSOApplicants?.totalApplicants ?? 0
        : dashboardStats?.documentsByType?.activities ?? 0,
      recognition: isUserRSORepresentative
        ? RSOMembers?.totalRSOMembers ?? 0
        : dashboardStats?.documentsByType?.recognition ?? 0,
      renewal: isUserRSORepresentative
        ? activity?.data?.renewal ?? 0
        : dashboardStats?.documentsByType?.renewal ?? 0,
      other: isUserRSORepresentative
        ? activity?.data?.other ?? 0
        : dashboardStats?.documentsByType?.other ?? 0,
    },
    documentsByStatus: {
      approved: isUserRSORepresentative
        ? createdActivities?.metadata?.totalApprovedActivities ?? 0
        : dashboardStats?.approvedDocuments ?? 0,
      pending: isUserRSORepresentative
        ? createdActivities?.metadata?.totalPendingActivities ?? 0
        : dashboardStats?.pendingDocuments ?? 0,
      rejected: isUserRSORepresentative
        ? createdActivities?.metadata?.totalRejectedActivities ?? 0
        : dashboardStats?.rejectedDocuments ?? 0,
    },
    recentActivity: isUserRSORepresentative
      ? createdActivities?.activities?.map((activity) => ({
        id: activity._id,
        title: activity.Activity_name,
        status: activity.Activity_approval_status || activity.document_status,
        date: activity.updatedAt,
      })) ?? []
      : dashboardStats?.documentList?.map((doc) => ({
        id: doc._id,
        title: doc.title,
        status: doc.Activity_approval_status,
        date: doc.updatedAt,
      })) ?? [],
  };

  // Map stats fields to their paired UI titles/labels
  const statsTitle = {
    totalDocuments: isUserRSORepresentative
      ? "Total Accreditation Documents"
      : "Total Documents",
    documentsByTypeTitle: isUserRSORepresentative
      ? "Membership Data"
      : "Documents by Type",
    pendingApproval: isUserRSORepresentative
      ? "Pending Accreditation Documents"
      : "Pending Approval",
    recentlyApproved: isUserRSORepresentative
      ? "Rejected Accreditation Documents"
      : "Recently Approved",
    documentsByStatusTitle: isUserRSORepresentative
      ? "Activities"
      : "Documents by Status",
    documentsByType: {
      activities: isUserRSORepresentative
        ? "Applicants"
        : "Activities",
      recognition: isUserRSORepresentative
        ? "Members"
        : "Recognition",
      renewal: "Renewal",
      other: "Other",
    },
    documentsByStatus: {
      approved: "approved",
      pending: "pending",
      rejected: "rejected",
    },
    recentActivity: isUserRSORepresentative
      ? "Created Activities"
      : "Recent Activity",
  };

  // Helper function for status badges
  const getStatusBadge = (status) => {
    const baseClasses = "px-2 py-0.5 text-xs rounded-full";
    switch (status) {
      case "approved":
        return <span className={`${baseClasses} bg-green-100 text-green-800`}>Approved</span>;
      case "pending":
        return <span className={`${baseClasses} bg-blue-100 text-blue-800`}>Pending</span>;
      case "rejected":
        return <span className={`${baseClasses} bg-red-100 text-red-800`}>Rejected</span>;
      default:
        return <span className={`${baseClasses} bg-gray-100 text-gray-800`}>Unknown</span>;
    }
  };

  // Modal state for Generate Report
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  // Signature modal state
  const [isSignatureModalOpen, setIsSignatureModalOpen] = useState(false);
  const [signatureFile, setSignatureFile] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  // Prevent background scroll if either modal open
  useEffect(() => {
    if (isReportModalOpen || isSignatureModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isReportModalOpen, isSignatureModalOpen]);

  const handleOpenSignature = () => {
    setIsSignatureModalOpen(true);
  };
  const handleCloseSignature = () => {
    setIsSignatureModalOpen(false);
    setSignatureFile(null);
    if (signaturePreview) {
      URL.revokeObjectURL(signaturePreview);
      setSignaturePreview(null);
    }
  };
  const handleSignatureFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setSignatureFile(file);
    const url = URL.createObjectURL(file);
    setSignaturePreview(url);
  };
  const handleSignatureSave = () => {
    // TODO: integrate API upload; for now just log
    console.log('[Signature] Saving file:', signatureFile);
    mutateUploadSignature({ adminId: signatureRequest.id, file: signatureFile }, {
      onSuccess: () => {
        handleCloseSignature();
        toast.success("Signature uploaded successfully");
        refetchSignature();
        refetchAdminProfile();
      },
      onError: (error) => {
        toast.error(error.message || "Failed to upload signature");
        console.error("[Signature] Upload error:", error);
      }
    });
  };

  const handleDeleteSignature = () => {
    if (!signatureData?.data?.signatureId) {
      toast.error('Missing user id for deletion');
      return;
    }
    mutateDeleteSignature(signatureData?.data?.signatureId, {
      onSuccess: () => {
        toast.success('Signature deleted');
        setSignatureFile(null);
        if (signaturePreview) {
          URL.revokeObjectURL(signaturePreview);
          setSignaturePreview(null);
        }
        setIsSignatureData(false);
        refetchSignature();
        refetchAdminProfile();
      },
      onError: (error) => {
        toast.error(error.message || 'Failed to delete signature');
        console.error('[Signature] Delete error:', error);
      }
    });
  };

  return (
    <div className="w-full p-4 bg-white min-h-screen">
      {/* Page title */}
      <div className="mb-6">
        <h1 className='text-xl'>
          Hello, <span className='font-bold text-primary'>{username || "User"}</span>
        </h1>
      </div>

      {/* Top stats row - 3 equal columns */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
        {/* Total Documents */}
        <div className="bg-white border border-blue-100 shadow-sm rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-gray-500 text-sm">
              {isUserRSORepresentative ? "Total Accreditation Documents" : "Total Documents"}
            </span>
            <span className="text-3xl font-bold mt-2">
              {isUserRSORepresentative
                ? accreditation?.documents?.totalDocuments ?? "0"
                : dashboardStats?.totalDocuments ?? "0"}
            </span>
          </div>
        </div>

        {/* Pending Approval */}
        <div className="bg-white border border-blue-100 shadow-sm rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-gray-500 text-sm">
              {isUserRSORepresentative ? "Pending Accreditation Documents" : "Pending Approval"}
            </span>
            <span className="text-3xl font-bold mt-2">
              {isUserRSORepresentative
                ? accreditation?.documents?.pendingDocuments ?? "0"
                : dashboardStats?.totalPendingDocuments ?? "0"}
            </span>
          </div>
        </div>

        {/* Recently Approved */}
        <div className="bg-white border border-blue-100 shadow-sm rounded-lg p-5 hover:shadow-md transition-shadow">
          <div className="flex flex-col">
            <span className="text-gray-500 text-sm">
              {isUserRSORepresentative ? "Rejected Accreditation Documents" : "Recently Approved"}
            </span>
            <span className="text-3xl font-bold mt-2 text-green-600">
              {isUserRSORepresentative
                ? accreditation?.documents?.rejectedDocuments ?? "0"
                : dashboardStats?.recentlyApprovedDocuments ?? "0"}
            </span>
          </div>
        </div>
      </div>

      {/* Main bento grid layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Documents by Type - Spans 2 columns */}
        <div className="bg-white border border-blue-100 shadow rounded-lg p-5 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">{isUserRSORepresentative ? "RSO Membership Data" : "Documents by Type"}</h2>
          <div className='flex items-center gap-4'>
            {/* Activities */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex-1">
              <div className="text-xs capitalize">
                {isUserRSORepresentative ?
                  activity ? "Applicants" : "loading"
                  : dashboardStats?.documentsByType?.activities ? "Activities" : "loading"}
              </div>
              <div className="text-xl font-bold">
                {
                  isUserRSORepresentative ?
                    RSOApplicants?.totalApplicants ?? "0"
                    : dashboardStats?.documentsByType?.activities ?? "0"}
              </div>
            </div>
            {/* Recognition/ Members */}
            <div className="bg-blue-50 border border-blue-100 rounded-lg p-3 flex-1">
              <div className="text-xs capitalize">
                {isUserRSORepresentative ?
                  activity ? "Members" : "loading"
                  : dashboardStats?.documentsByType?.recognition ? "Recognition" : "loading"}
              </div>
              <div className="text-xl font-bold">
                {isUserRSORepresentative ?
                  RSOMembers?.totalRSOMembers ?? "0"
                  : dashboardStats?.documentsByType?.recognition ?? "0"}
              </div>
            </div>
          </div>
        </div>
        {/* Documents by Status - Vertical stacked */}
        <div className="bg-white border border-blue-100 shadow rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">{isUserRSORepresentative ? "Activities" : "Documents by Status"}</h2>
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="capitalize text-gray-600">approved</span>
              <span className="font-semibold text-green-700">
                {
                  isUserRSORepresentative ? createdActivities?.metadata?.totalApprovedActivities ?? "0" :
                    dashboardStats?.approvedDocuments ?? "0"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="capitalize text-gray-600">pending</span>
              <span className="font-semibold">
                {isUserRSORepresentative ? createdActivities?.metadata?.totalPendingActivities ?? "0" : dashboardStats?.pendingDocuments ?? "0"}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="capitalize text-gray-600">rejected</span>
              <span className="font-semibold text-red-700">
                {isUserRSORepresentative ? createdActivities?.metadata?.totalRejectedActivities ?? "0" : dashboardStats?.rejectedDocuments ?? "0"}
              </span>
            </div>
          </div>
        </div>

        {/* Recent Activity - Spans full width on smaller screens, 2 columns on larger */}
        <div className="bg-white border border-blue-100 shadow rounded-lg p-5 md:col-span-2">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <div className="space-y-3">
            {!isUserRSORepresentative && (
              dashboardStats?.documentList?.length > 0 ? (
                dashboardStats.documentList.map((activity) => (
                  <div key={activity._id} className="flex justify-between items-center border-b border-gray-100 pb-2">
                    <div className="flex flex-col">
                      <span className="font-medium">{activity.title}</span>
                      <span className="text-xs text-gray-500">{formatRelativeTime(activity.updatedAt)}</span>
                    </div>
                    <h1>
                      {getStatusBadge(activity.status || "Unknown")}
                    </h1>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-400 text-sm">No recent activity.</span>
                </div>
              )
            )}

            {isUserRSORepresentative && (
              createdActivities?.activities?.length > 0 ? (
                createdActivities.activities.map((activity) => (
                  <div key={activity._id} className="flex justify-start items-center border-b border-gray-100 pb-2 px-4 gap-4 hover:bg-blue-50 rounded transition-colors">
                    <img
                      src={activity.imageUrl || defaultImage}
                      alt={activity.Activity_name}
                      className="w-12 h-12 object-cover rounded-md border border-blue-100 bg-gray-100"
                    />
                    <div className="flex flex-col">
                      <span className="font-medium">{activity.Activity_name}</span>
                      <span className="text-xs text-gray-500">{formatRelativeTime(activity.updatedAt)}</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="flex justify-between items-center border-b border-gray-100 pb-2">
                  <span className="text-gray-400 text-sm">No created activities.</span>
                </div>
              )
            )}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white border border-blue-100 shadow rounded-lg p-5">
          <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
          <div className="flex flex-col gap-2 w-full">
            <Button onClick={() => setIsReportModalOpen(true)}>
              Generate Report
            </Button>
            {isUserRSORepresentative && (
              <Button style={"secondary"} onClick={() => navigate('/documents')}>
                Upload Document
              </Button>
            )}
            {(isCoordinator || isAVP || isDirector) && (
              <Button
                style={"secondary"}
                disabled={false}
                onClick={handleOpenSignature}
              >
                Upload Signature
              </Button>
            )}
            {(isUserAdmin || isCoordinator) && (
              <Button style={"secondary"} onClick={() => navigate('/admin-documents/templates')}>
                Create Template
              </Button>
            )}


          </div>
        </div>
      </div>

      {/* Generate Report Modal */}
      {isReportModalOpen && (
        <>
          {/* Backdrop with click to close */}
          <Backdrop
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setIsReportModalOpen(false)}
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Generate Report"
            onKeyDown={(e) => { if (e.key === 'Escape') setIsReportModalOpen(false); }}
          >
            <motion.div
              className="relative flex flex-col w-full h-full sm:h-auto sm:max-h-[95vh] sm:rounded-lg bg-white shadow-xl border border-gray-200 max-w-full md:max-w-[860px] lg:max-w-[900px]"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Sticky Header */}
              <div className="flex items-center justify-between px-5 sm:px-8 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h2 className="text-base sm:text-lg font-medium text-[#312895]">Generate Report</h2>
                <CloseButton onClick={() => setIsReportModalOpen(false)} />
              </div>
              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6">
                <div
                  className="mx-auto w-full"
                  style={{
                    maxWidth: '794px', // Exact A4 width at 96dpi; container widened outside to remove side scroll
                  }}
                >
                  <ReportPage
                    reference={contentRef}
                    reportTitle={isUserRSORepresentative ? rsoDetails?.rso?.RSO_name : 'SDAO Report'}
                    dashboardData={stats}
                    statsTitle={statsTitle}
                  />
                </div>
              </div>
              {/* Sticky Footer */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 px-5 sm:px-8 py-4 border-t border-gray-100 bg-white sticky bottom-0">
                <Button
                  onClick={() => setIsReportModalOpen(false)}
                  style="secondary"
                  className="w-full sm:w-auto"
                >
                  Close
                </Button>
                <Button
                  onClick={reactToPrintFn}
                  className="w-full sm:w-auto px-6 bg-[#312895] hover:bg-[#312895]/90 text-white"
                >
                  Generate
                </Button>
              </div>
            </motion.div>
          </div>
        </>
      )}

      {/* Signature Modal */}
      {isSignatureModalOpen && (
        <>
          <Backdrop
            className="fixed inset-0 z-50 bg-black/40"
            onClick={handleCloseSignature}
          />
          <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
            role="dialog"
            aria-modal="true"
            aria-label="Upload Signature"
            onKeyDown={(e) => { if (e.key === 'Escape') handleCloseSignature(); }}
          >
            <motion.div
              className="relative flex flex-col w-full h-full sm:h-auto sm:max-h-[95vh] sm:rounded-lg bg-white shadow-xl border border-gray-200 max-w-full md:max-w-[520px]"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 sm:px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <h2 className="text-base sm:text-lg font-medium text-[#312895]">Upload Signature</h2>
                <CloseButton onClick={handleCloseSignature} />
              </div>
              {/* Content */}
              {isSignatureData === true ? (
                <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-6">
                  <div className="space-y-5">
                    <div className="flex flex-col items-center text-center gap-3">
                      <h3 className="text-sm font-medium text-gray-700">Current Signature</h3>
                      <div className="relative group border border-gray-200 bg-white rounded-md p-4 shadow-sm w-full flex flex-col items-center">
                        <div className="w-full flex items-center justify-center bg-gray-50 rounded-md border border-dashed border-gray-300 min-h-40 py-6">
                          {signatureData?.data?.signedUrl ? (
                            <img
                              src={signatureData.data.signedUrl}
                              alt="Saved signature"
                              className="max-h-48 object-contain select-none pointer-events-none"
                              draggable={false}
                            />
                          ) : (
                            <span className="text-xs text-gray-400">No signature available</span>
                          )}
                        </div>
                        <div className="mt-4 flex flex-col sm:flex-row gap-2 w-full">
                          <label className="cursor-pointer flex-1 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded shadow text-center">
                            <input
                              type="file"
                              accept="image/png,image/jpeg"
                              className="hidden"
                              onChange={handleSignatureFileChange}
                            />
                            Replace
                          </label>
                          <Button
                            style="secondary"
                            className="flex-1 !text-red-600 border-red-200 hover:bg-red-50"
                            disabled={isDeleting}
                            onClick={() => handleDeleteSignature()}
                          >
                            {isDeleting ? 'Deleting...' : 'Delete'}
                          </Button>
                        </div>
                        {signatureFile && (
                          <div className="mt-3 w-full border-t pt-3">
                            <p className="text-[11px] text-gray-500 mb-2 text-left">New file selected (not saved yet):</p>
                            <div className="flex items-center gap-3">
                              <img src={signaturePreview} alt="New signature preview" className="h-20 object-contain" />
                              <div className="flex flex-col gap-1">
                                <span className="text-[11px] text-gray-600">{signatureFile.name}</span>
                                <div className="flex gap-2">
                                  <Button
                                    style="secondary"
                                    disabled={isUploading}
                                    onClick={() => handleSignatureSave()}
                                    className="!px-3 !py-1 text-xs"
                                  >
                                    {isUploading ? 'Saving...' : 'Save New'}
                                  </Button>
                                  <Button
                                    style="secondary"
                                    onClick={() => { setSignatureFile(null); if (signaturePreview) { URL.revokeObjectURL(signaturePreview); setSignaturePreview(null); } }}
                                    className="!px-3 !py-1 text-xs"
                                  >
                                    Cancel
                                  </Button>
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                      <p className="text-[11px] text-gray-500 max-w-sm">You can replace or delete your stored signature. Deleting it will remove it from future document signing actions.</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto px-5 sm:px-6 py-5 space-y-4">
                  <p className="text-sm text-gray-600">Choose a transparent PNG of your signature. It will be stored securely and can be applied to documents.</p>

                  <div className="border border-dashed border-gray-300 rounded p-4 flex flex-col items-center gap-3 bg-gray-50">
                    {!signaturePreview && (
                      <>
                        <span className="text-xs text-gray-500">PNG, JPG (recommended: transparent PNG)</span>
                        <label className="cursor-pointer px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded shadow">
                          <input
                            type="file"
                            accept="image/png,image/jpeg"
                            className="hidden"
                            onChange={handleSignatureFileChange}
                          />
                          Select File
                        </label>
                      </>
                    )}
                    {signaturePreview && (
                      <div className="w-full flex flex-col items-center gap-2">
                        <img src={signaturePreview} alt="Signature preview" className="max-h-40 object-contain" />
                        <div className="flex gap-2">
                          <label className="cursor-pointer px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs rounded shadow">
                            <input
                              type="file"
                              accept="image/png,image/jpeg"
                              className="hidden"
                              onChange={handleSignatureFileChange}
                            />
                            Replace
                          </label>
                          <Button style="secondary" onClick={() => { setSignatureFile(null); URL.revokeObjectURL(signaturePreview); setSignaturePreview(null); }}>Remove</Button>
                        </div>
                      </div>
                    )}
                  </div>

                  <ul className="text-[11px] text-gray-500 list-disc ml-4 space-y-1">
                    <li>Use a clear, high-contrast scan.</li>
                    <li>Transparent background preferred.</li>
                    <li>Max size recommendation: under 1MB.</li>
                  </ul>
                </div>)}
              {/* Footer */}
              <div className="flex flex-col sm:flex-row justify-end gap-3 px-5 sm:px-6 py-4 border-t border-gray-100 bg-white sticky bottom-0">
                <Button
                  onClick={handleCloseSignature}
                  style="secondary"
                  className="w-full sm:w-auto"
                >
                  Cancel
                </Button>
                {!isSignatureData && (
                  <Button
                    disabled={!signatureFile}
                    onClick={handleSignatureSave}
                    className="w-full sm:w-auto px-6 bg-[#312895] hover:bg-[#312895]/90 text-white disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Save
                  </Button>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </div>
  );
}

