import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useState } from 'react';
import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DropIn } from "../../../animations/DropIn";
import defaultPic from '../../../assets/images/default-picture.png';
import DefaultPicture from "../../../assets/images/default-profile.jpg";
import { ActivityDeadlineBanner, Backdrop, Button, CloseButton, FormReviewModal, ReusableTable, TabSelector, TextInput, UploadBatchModal } from '../../../components';
import { useAuth } from "../../../context/AuthContext";
import { useAdminActivity, useAdminDocuments, useModal, useRSOActivities, useRSOForms } from "../../../hooks";
import { useActivityStatusStore, useDocumentStore, useUserStoreWithAuth } from '../../../store';

// TODO: Replace static participants and forms data with live backend data when available.

export default function Activities() {
  const { user } = useAuth();

  // Router hooks
  const { activityId } = useParams();

  const navigate = useNavigate();
  const location = useLocation();

  const {
    activityDocuments,
    activityDocumentsLoading,
    activityDocumentsError,
    activityDocumentsErrorMessage,

    // activity view
    activityRSOView,
    activityRSOViewLoading,
    activityRSOViewError,
    activityRSOViewQueryError,
    refetchActivityRSOView,
  } = useRSOActivities({ activityId });

  const {
    specificActivityFormsResponse,
    isLoadingSpecificActivityFormsResponse,
    isErrorSpecificActivityFormsResponse,
    errorSpecificActivityFormsResponse,
  } = useRSOForms({ activityId });

  const {
    // set pre-document deadline
    preDocumentDeadlineMutate,
    isSettingPreDocumentDeadline,
    isErrorSettingPreDocumentDeadline,
    isPreDocumentDeadlineSet,

    // set post-document deadline
    postDocumentDeadlineMutate,
    isSettingPostDocumentDeadline,
    isErrorSettingPostDocumentDeadline,
    isPostDocumentDeadlineSet,

    // approve activity
    isApprovingActivity,
    isErrorApprovingActivity,
    isActivityApproved,
    approveActivityMutate,

    rejectActivityMutate,
    isRejectingActivity,
    isErrorRejectingActivity,
    isActivityRejected,

    // view admin activity details
    viewAdminActivityData,
    viewAdminActivitySuccess,
    viewAdminActivityLoading,
    refetchViewAdminActivity,
    viewAdminActivityError,
  } = useAdminActivity({ activityId });


  console.log("Activity documents :", activityDocuments);
  console.log("Activity forms :", specificActivityFormsResponse);

  // Modal control
  const { isOpen, openModal, closeModal } = useModal();
  const setActivityStatus = useActivityStatusStore((state) => state.setActivityStatus);

  // set document ID
  const setDocumentId = useDocumentStore((state) => state.setDocumentId);
  setDocumentId(activityId);

  // State management
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [modalType, setModalType] = useState(null);
  // Removed unused file upload related state (files, progress, msg)
  const [activeTab, setActiveTab] = useState(0);
  // Removed unused titles state
  const [searchQuery, setSearchQuery] = useState("");
  // Removed unused showStatusMessage state
  const [filter, setFilter] = useState("All");
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [remarks, setRemarks] = useState("");
  const [preDocDeadline, setPreDocDeadline] = useState(null);
  const [postDocDeadline, setPostDocDeadline] = useState(null);
  const { isUserRSORepresentative, isUserAdmin, isCoordinator } = useUserStoreWithAuth();
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [profileToView, setProfileToView] = useState(null);
  const [userModalData, setUserModalData] = useState({
    email: "",
    fullName: "",
    applicationId: undefined,
    id: undefined,
    index: 0,
    pages: [] // added
  });
  const {
    refetchSetAccreditationDeadline,
    setAccreditationDeadline,
    setAccreditationDeadlineError,
    setAccreditationDeadlineSuccess,

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


  } = useAdminDocuments({ activityId });


  const activity = displayActivityOnRole() || {};
  console.log("Activity data:", activity);

  function displayActivityOnRole() {
    if (!isUserRSORepresentative) {
      return viewAdminActivityData;
    } else {
      return activityRSOView;
    }
  }

  console.log("activity on role: ", viewAdminActivityData);

  function refetchActivityOnRole() {
    if (!isUserRSORepresentative) {
      return refetchViewAdminActivity();
    } else {
      return refetchActivityRSOView();
    }
  }

  const handleDateSelected = () => {

    if (preDocDeadline) {
      preDocumentDeadlineMutate({
        activityId: activityId,
        preDocumentDeadline: dayjs(preDocDeadline).toISOString(),
      },
        {
          onSuccess: () => {
            console.log('Pre-document deadline updated successfully');
            toast.success('Pre-document deadline updated successfully');
            refetchActivityOnRole();
            // clear the select state and the date state
            setPreDocDeadline(null);
            setPostDocDeadline(null);
            handleCloseModal();
          },
          onError: (error) => {
            console.error('Error updating pre-document deadline:', error);
            toast.error(error.message || 'Error updating pre-document deadline');
          }
        }
      );
    }
    if (postDocDeadline) {
      postDocumentDeadlineMutate({
        activityId: activityId,
        postDocumentDeadline: dayjs(postDocDeadline).toISOString(),
      },
        {
          onSuccess: () => {
            toast.success('Post-document deadline updated successfully');
            // clear the select state and the date state
            refetchActivityOnRole();
            setPreDocDeadline(null);
            setPostDocDeadline(null);
            handleCloseModal();
          },
          onError: (error) => {
            console.error('Error updating post-document deadline:', error);
            toast.error(error.message || 'Error updating post-document deadline');
          }
        }
      );
    }
  }

  // Ensure formsUsed is always an array to prevent runtime errors when mapping
  const mapFormsUsed = Array.isArray(activity?.formsUsed)
    ? activity.formsUsed
    : activity?.formsUsed && typeof activity.formsUsed === 'object'
      // In case backend returns an object keyed by ids instead of array
      ? Object.values(activity.formsUsed)
      : [];

  console.log("activityId:", activityId, "activityPreDocument:", activityPreDocument);

  useEffect(() => {
    if (activity.Activity_approval_status === 'approved') {
      setActivityStatus('approved');
    } else if (activity.Activity_approval_status === 'rejected') {
      setActivityStatus('rejected');
    } else if (activity.Activity_approval_status === 'pending') {
      setActivityStatus('pending');
    }
  }, [activity.Activity_approval_status, setActivityStatus]);

  // Effect to handle upload status messages
  // Cleanup: removed effect handling showStatusMessage & file cleanup (unused UI)

  // Tab configuration
  const tabs = [
    { label: "Documents" },
    { label: "Forms Used" },
    { label: "Participants" }
  ];

  // Removed msg timeout effect (msg state removed)

  // always start at top
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  let filteredDocuments = [];
  // Filter documents based on selected filter

  switch (filter) {
    case "Pre Documents":
      filteredDocuments = activity?.Activity_pre_activity_documents || [];
      break;
    case "Post Documents":
      filteredDocuments = activity?.Activity_post_activity_documents || [];
      break;
    case "All":
      filteredDocuments = ((activity?.Activity_pre_activity_documents ?? []).concat(activity?.Activity_post_activity_documents ?? []));
      break;
    default:
      filteredDocuments = activity?.Activity_pre_activity_documents || [];
      break;
  }

  // Process activity documents for table display
  const filterActivityDocuments = (filteredDocuments).map((doc) => ({
    id: doc._id,
    title: doc.title,
    purpose: doc.purpose,
    createdAt: new Date(doc.createdAt).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
    url: doc.url,
    status: doc.document_status,
  }));

  // Table configuration
  const tableHeading = [
    { name: "Document Name", key: "title" },
    { name: "Status", key: "status" },
    { name: "Purpose", key: "purpose" },
    { name: "Uploaded At", key: "createdAt" },
    { name: "Action", key: "actions" }
  ];

  /**
   * Closes the modal and resets modal type
   */
  const handleCloseModal = useCallback(() => {
    closeModal();
    setModalType(null);
  }, [closeModal]);

  /**
   * Opens the document upload modal
   */
  const handleDocumentUpload = () => {

    if (!(isPreOngoing || isPostOngoing)) {
      toast.error("Activity document submission is closed.");
      return;
    }

    openModal();
    setModalType("upload");
  };

  /**
   * Formats date string to readable format
   * @param {string} dateString - Date string to format
   * @returns {string} Formatted date string
   */
  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  /**
   * Handles edit button click to navigate to edit page
   */
  const handleEditClick = () => {
    navigate(`../activity-action`, {
      state: {
        mode: "edit",
        data: activity,
        from: user.RSO_name
      }
    });
    console.log("Edit button clicked", activity);
  };

  const handleActivityReview = () => {
    setReviewModalOpen(true);
    console.log("Activity review modal opened", activityId);
  }

  const handleAccept = async () => {
    try {
      console.log("Accepting activity review with remarks:", remarks);
      console.log("Activity ID:", activityId);
      approveActivityMutate({ activityId, remarks },
        {
          onSuccess: () => {
            toast.success("Activity review accepted successfully");
          },
          onError: (error) => {
            toast.error("Error accepting activity review:", error);
          }
        }
      );
    } catch (error) {
      console.error("Error accepting activity review:", error);
    } finally {
      setReviewModalOpen(false);
      setRemarks("");
    }
  };

  const handleDecline = async () => {
    try {
      console.log("Rejecting activity review with remarks:", remarks);
      console.log("Activity ID:", activityId);
      rejectActivityMutate({ activityId, remarks },
        {
          onSuccess: () => {
            toast.success("Activity review rejected successfully");
          },
          onError: (error) => {
            toast.error("Error rejecting activity review:", error);
          }
        }
      );
    } catch (error) {
      console.error("Error rejecting activity review:", error);
    } finally {
      setReviewModalOpen(false);
      setRemarks("");
    }
  };


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

  // Helper booleans for document deadlines
  const isPreOngoing = activity?.Activity_pre_document_deadline?.date_status === 'ongoing';
  const isPostOngoing = activity?.Activity_post_document_deadline?.date_status === 'ongoing';
  const isPreDone = activity?.Activity_pre_document_deadline?.date_status === 'done';
  const isPostDone = activity?.Activity_post_document_deadline?.date_status === 'done';

  const openProfileModal = (participant) => {
    if (!participant) return;

    console.log("Opening profile modal for participant:", participant);

    setProfileToView(participant);
    setIsProfileModalOpen(true);
    setUserModalData({
      email: participant?.studentId?.email || "",
      fullName: participant?.studentId?.firstName + " " + participant?.studentId?.lastName || "",
      applicationId: participant?._id || undefined,
      id: participant?.studentId?._id || undefined,
      index: participant?.index + 1 || 0,
      pages: participant?.answers?.pages || []
    });

    // add forms and replace the participant source of truth when backend is ready
  }

  return (
    <>
      <div className="flex flex-col items-start min-h-[150vh]">
        {/* Header Section */}
        <div className='flex flex-col justify-start gap-4 items-start w-full md:justify-between md:items-center md:flex-row'>
          <div className='flex flex-col md:flex-row items-center gap-4'>
            <div
              onClick={() => navigate(-1)}
              className='flex items-center justify-center rounded-full h-8 w-8 cursor-pointer border border-gray-300 group'
            >
              <svg xmlns="http://www.w3.org/2000/svg" className='fill-gray-600 size-4 group-hover:fill-off-black' viewBox="0 0 448 512">
                <path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" />
              </svg>
            </div>

            {/* Profile header section */}
            <div className='flex items-center gap-2'>
              <div className='aspect-square h-12 w-12 bg-white rounded-full flex items-center justify-center text-white font-bold'>
                <img
                  className='h-full w-full object-cover rounded-full'
                  src={activity?.RSO_id?.RSO_imageUrl || DefaultPicture}
                  alt="Activity Picture"
                />
              </div>

              <div className='flex flex-col justify-start'>
                <h2 className='text-xs text-gray-600'>Hosted By</h2>
                <h1 className='text-sm font-bold text-gray-800'>
                  {activity?.RSO_id?.RSO_name || 'RSO Name'}
                </h1>
              </div>
            </div>
          </div>
        </div>


        {/* Main Content */}
        <div className='w-full px-4 sm:px-8 lg:px-24 mt-6'>
          <div>
            {/* reusable banner */}
            <ActivityDeadlineBanner activity={activity} />
          </div>

          {/* Details Section */}
          <div className='justify-start flex flex-col mb-4'>
            <div className='flex items-center gap-4'>
              <h1 className='text-2xl font-bold text-off-black'>{activity?.Activity_name}</h1>
              <div className='flex items-center gap-2'>
                {isUserRSORepresentative && (
                  <div
                    data-tooltip-id="global-tooltip"
                    data-tooltip-content="Edit Activity"
                    className='aspect-square h-8 w-8 bg-white rounded-full flex items-center justify-center text-white font-bold cursor-pointer border border-gray-600 hover:border-gray-300 group'
                    onClick={handleEditClick} disabled={activityDocumentsLoading ? true : false}>
                    <div className="flex items-center gap-2 text-sm font-light ">
                      <svg xmlns="http://www.w3.org/2000/svg" className='size-4 fill-off-black group-hover:fill-gray-600' viewBox="0 0 640 640"><path d="M100.4 417.2C104.5 402.6 112.2 389.3 123 378.5L304.2 197.3L338.1 163.4C354.7 180 389.4 214.7 442.1 267.4L476 301.3L442.1 335.2L260.9 516.4C250.2 527.1 236.8 534.9 222.2 539L94.4 574.6C86.1 576.9 77.1 574.6 71 568.4C64.9 562.2 62.6 553.3 64.9 545L100.4 417.2zM156 413.5C151.6 418.2 148.4 423.9 146.7 430.1L122.6 517L209.5 492.9C215.9 491.1 221.7 487.8 226.5 483.2L155.9 413.5zM510 267.4C493.4 250.8 458.7 216.1 406 163.4L372 129.5C398.5 103 413.4 88.1 416.9 84.6C430.4 71 448.8 63.4 468 63.4C487.2 63.4 505.6 71 519.1 84.6L554.8 120.3C568.4 133.9 576 152.3 576 171.4C576 190.5 568.4 209 554.8 222.5C551.3 226 536.4 240.9 509.9 267.4z" /></svg>
                    </div>
                  </div>
                )}
              </div>
            </div>
            <p className='text-gray-600 text-sm'>{formatDate(activity?.createdAt)}</p>
          </div>

          {/* Image and Details Section */}
          <div className=' flex flex-col items-center w-full'>
            {/* Activity Image */}
            <div className='bg-dark-gray rounded-md flex justify-center items-center w-full'>
              <div className='aspect-square w-full sm:w-[60%] md:w-[50%] lg:w-[40%] bg-mid-gray overflow-hidden'>
                <img
                  src={activity?.activityImageUrl || defaultPic}
                  alt="Activity"
                  className='w-full h-full object-cover'
                />
              </div>
            </div>

            {/* Info Badges Row */}
            <div className="flex flex-row flex-wrap gap-2 w-full justify-start items-center mt-4">
              {/* Date & Time Badge */}
              <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 gap-2 min-w-[180px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-gray-600" viewBox="0 0 640 640"><path d="M224 64C206.3 64 192 78.3 192 96L192 128L160 128C124.7 128 96 156.7 96 192L96 240L544 240L544 192C544 156.7 515.3 128 480 128L448 128L448 96C448 78.3 433.7 64 416 64C398.3 64 384 78.3 384 96L384 128L256 128L256 96C256 78.3 241.7 64 224 64zM96 288L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 288L96 288z" /></svg>
                <span className="text-off-black text-xs">{formatDate(activity?.Activity_start_datetime)} - {formatDate(activity?.Activity_end_datetime)}</span>
              </div>
              {/* Location Badge */}
              <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 gap-2 min-w-[100px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-gray-600" viewBox="0 0 384 512"><path d="M215.7 499.2C267 435 384 279.4 384 192C384 86 298 0 192 0S0 86 0 192c0 87.4 117 243 168.3 307.2c12.3 15.3 35.1 15.3 47.4 0zM192 128a64 64 0 1 1 0 128 64 64 0 1 1 0-128z" /></svg>
                <span className="text-off-black text-xs">{activity?.Activity_place}</span>
              </div>
              {/* Total Registrations Badge */}
              <div className="flex items-center bg-white border border-gray-300 rounded-full px-4 py-2 gap-2 min-w-[140px]">
                <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-gray-600" viewBox="0 0 448 512">
                  <path d="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512H418.3c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304H178.3z" />
                </svg>
                <span className="text-off-black text-xs">{activity?.Activity_registration_total || 0} participants</span>
              </div>
              {/* Removed commented Created At badge */}
            </div>

            <div className='w-full flex flex-col gap-4 mt-4'>
              {
                activity?.Activity_approval_status && activity?.Activity_approval_status === "approved" ? (
                  <div className='bg-green-50 p-4 rounded-lg border border-green-200 w-full sm:w-[48%] lg:w-[20%] h-24 flex items-center justify-center'>
                    <div className='flex flex-col items-center gap-2'>
                      <div className='bg-green-500 p-1 rounded-full'>
                        <svg xmlns="http://www.w3.org/2000/svg" className='size-4 fill-white' viewBox="0 0 448 512">
                          <path d="M438.6 105.4c12.5 12.5 12.5 32.8 0 45.3l-256 256c-12.5 12.5-32.8 12.5-45.3 0l-128-128c-12.5-12.5-12.5-32.8 0-45.3s32.8-12.5 45.3 0L160 333.7 393.4 100.3c12.5-12.5 32.8-12.5 45.3 0z" />
                        </svg>
                      </div>
                      <h3 className="font-semibold text-green-700 text-sm text-center">Document Approved</h3>
                    </div>
                  </div>
                )
                  : activity?.Activity_approval_status === "rejected" ? (
                    <div className='bg-red-50 p-4 rounded-lg border border-red-200 w-full sm:w-[48%] lg:w-[20%] h-24 flex items-center justify-center'>
                      <div className='flex flex-col items-center gap-2'>
                        <div className='bg-red-500 p-1 rounded-full'>
                          <svg xmlns="http://www.w3.org/2000/svg" className='size-4 fill-white' viewBox="0 0 384 512">
                            <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-red-700 text-sm text-center">Document Rejected</h3>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={handleActivityReview}
                      className='cursor-pointer bg-yellow-50 p-4 rounded-lg border border-yellow-200 w-full sm:w-[48%] lg:w-[20%] h-24 flex items-center justify-center hover:bg-yellow-100 transition-colors'>
                      <div className='flex flex-col items-center gap-2'>
                        <div className='bg-yellow-500 p-1 rounded-full'>
                          <svg xmlns="http://www.w3.org/2000/svg" className='size-4 fill-white' viewBox="0 0 512 512">
                            <path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24V264c0 13.3-10.7 24-24 24s-24-10.7-24-24V152c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" />
                          </svg>
                        </div>
                        <h3 className="font-semibold text-yellow-700 text-sm text-center">Review Pending</h3>
                      </div>
                    </div>
                  )
              }
            </div>

            <div className="space-y-4 mt-4 w-full">
              <div>
                <h3 className="font-semibold text-off-black text-sm mb-2">Description</h3>
                <p className="text-gray-700 text-sm line-clamp-[8] overflow-hidden max-w-[40rem]">
                  {activity?.Activity_description}
                </p>
              </div>
            </div>
          </div>

          {/* Tabs Section */}
          <div className='mt-8 w-full'>
            <TabSelector
              tabs={tabs}
              activeTab={activeTab}
              onTabChange={setActiveTab}
              activeColor="#312895"
            />

            {activeTab === 0 && (
              <>
                {isUserRSORepresentative && (
                  <div className="flex justify-end w-full mt-4">
                    <div className="relative inline-block">
                      <Button
                        onClick={handleDocumentUpload}
                        className="px-4 bg-[#312895] hover:bg-[#312895]/90 text-white"
                      >
                        <div className='flex items-center gap-2'>
                          <svg xmlns="http://www.w3.org/2000/svg" className='fill-white size-4' viewBox="0 0 512 512">
                            <path d="M288 109.3L288 352c0 17.7-14.3 32-32 32s-32-14.3-32-32l0-242.7-73.4 73.4c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l128-128c12.5-12.5 32.8-12.5 45.3 0l128 128c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L288 109.3zM64 352l128 0c0 35.3 28.7 64 64 64s64-28.7 64-64l128 0c35.3 0 64 28.7 64 64l0 32c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64l0-32c0-35.3 28.7-64 64-64zM432 456a24 24 0 1 0 0-48 24 24 0 1 0 0 48z" />
                          </svg>
                          Upload Document
                        </div>
                      </Button>
                    </div>
                  </div>
                )}

                <div className="w-full mt-4 overflow-x-auto">
                  <ReusableTable
                    columnNumber={user.role === "rso_representative" ? 5 : 4}
                    tableHeading={tableHeading}
                    searchQuery={searchQuery}
                    setSearchQuery={setSearchQuery}
                    tableRow={filterActivityDocuments}
                    options={["All", "Pre Documents", "Post Documents"]}
                    value={filter}
                    onChange={(e) => setFilter(e.target.value)}
                    showAllOption={false}
                    onClick={(row) => navigate(`/documents/${activityId}/${row.id}`, { state: { documentId: row.id } })}
                    headerColor="#312895"
                    activityId={activityId}
                  />
                </div>
              </>
            )}

            {activeTab === 1 && (
              <div className="w-full mt-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {(mapFormsUsed || []).map(form => (
                    <div key={form._id} className="bg-white rounded-lg border border-gray-300 hover:border-gray-500 transition-shadow">
                      <div className="p-6">
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="text-lg font-semibold text-gray-800">{form.title}</h3>
                            <span className={`inline-block mt-2 px-2 py-1 text-xs font-semibold rounded-full ${getFormTypeBadgeClass(form.formType)}`}>
                              {form.formType.charAt(0).toUpperCase() + form.formType.slice(1)}
                            </span>
                          </div>
                        </div>
                        <p className="text-gray-600 text-sm mt-4">Created on: {formatDate(form.createdAt)}</p>
                        <div className="flex justify-between mt-6 pt-4 border-t border-gray-100">
                          <button
                            onClick={() => navigate('/form-viewer', { state: { formId: form._id } })}
                            className="text-gray-600 hover:text-gray-900 font-medium text-sm flex items-center gap-1"
                          >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                            View
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {activeTab === 2 && (
              <div className="w-full mt-4">
                {(specificActivityFormsResponse?.data || []).length > 0 ? (
                  <div className="bg-white border border-gray-300 rounded-lg p-6">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Participants</h3>
                    <ul className="space-y-2">
                      {(specificActivityFormsResponse?.data || []).map((p, index) => (
                        <li
                          data-tooltip-id="global-tooltip"
                          data-tooltip-content={`${p.studentId.firstName} ${p.studentId.lastName}`}
                          onClick={() => openProfileModal({ ...p, index })}
                          key={p._id} className="cursor-pointer text-sm text-gray-800 border border-gray-200 rounded-md px-4 py-2 bg-gray-50">
                          {p.studentId.firstName} {p.studentId.lastName}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-12">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a4 4 0 00-3-3.87M9 20h6M3 20h5v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75M8 3.13a4 4 0 000 7.75" />
                    </svg>
                    <span className="text-lg font-medium text-gray-700">No participants to display.</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AnimatePresence>
        {/* Document Details Modal */}
        {modalType === "details" && (
          <>
            <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" />
            <motion.div
              className="fixed inset-0 z-50 w-screen overflow-auto"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-1/3 shadow-xl border border-mid-gray">
                  <div className='flex justify-between items-center'>
                    <h2 className="text-lg font-semibold text-black mb-4">Document Details</h2>
                    <CloseButton onClick={handleCloseModal}></CloseButton>
                  </div>
                  <div className='space-y-3'>
                    <div>
                      <p className='text-sm text-gray-600'>Document Name</p>
                      <p
                        onClick={() => window.open(selectedActivity?.url, "_blank")}
                        className='text-black font-medium hover:underline cursor-pointer'>{selectedActivity?.title}</p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>Type</p>
                      <p className='text-black font-medium'>{selectedActivity?.purpose}</p>
                    </div>
                    <div>
                      <p className='text-sm text-gray-600'>Creation Date</p>
                      <p className='text-black font-medium'>{selectedActivity?.createdAt}</p>
                    </div>
                  </div>
                  <div className='flex justify-end mt-6'>
                    <div className='flex gap-2'>
                      <Button
                        onClick={handleCloseModal}
                        style={"secondary"}
                      >
                        Decline
                      </Button>
                      <Button
                        // onClick={handleApprove}
                        style={"primary"}
                      >
                        Approve
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Empty Modal for Banner Click */}
        {modalType === "banner" && (
          <>
            <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" />
            <motion.div
              className="fixed inset-0 z-50 w-screen overflow-auto"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="fixed inset-0 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-1/3 shadow-xl border border-mid-gray">

                  <div className='flex justify-between items-center mb-6'>
                    <h2 className="text-lg font-medium text-[#312895]">Set Activity Deadlines</h2>
                    <CloseButton onClick={handleCloseModal} />
                  </div>
                  {/* Deadline fields */}
                  <div className='space-y-4'>
                    <div className="w-full">
                      <div className="mb-4 w-full">
                        <label htmlFor="activity-select" className="block text-sm font-medium text-gray-700">Activity Name</label>
                        <div className='px-2 py-2 border border-gray-300 rounded-md mt-1 bg-gray-50'>
                          <h1>{activity?.Activity_name || "No Activity Selected"}</h1>
                        </div>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Pre Document Deadline</label>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker
                              value={preDocDeadline}
                              onChange={setPreDocDeadline}
                              className="w-full"
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  size: 'small',
                                  variant: 'outlined'
                                }
                              }}
                            />
                          </LocalizationProvider>
                        </div>
                        <div className="w-full">
                          <label className="block text-sm font-medium text-gray-700 mb-1">Post Document Deadline</label>
                          <LocalizationProvider dateAdapter={AdapterDayjs}>
                            <DateTimePicker
                              value={postDocDeadline}
                              onChange={setPostDocDeadline}
                              className="w-full"
                              slotProps={{
                                textField: {
                                  fullWidth: true,
                                  size: 'small',
                                  variant: 'outlined'
                                }
                              }}
                            />
                          </LocalizationProvider>
                        </div>
                      </div>
                    </div>
                  </div>
                  {/* Button to log deadlines */}
                  <div className="flex justify-end mt-6 gap-3">
                    <Button
                      onClick={() => handleDateSelected()}
                      style="primary"
                    >
                      Set Deadlines
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Upload Document Modal */}
        {modalType === "upload" && (
          <Backdrop className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 pt-8">
            <motion.div
              className="bg-white rounded-lg shadow-lg w-[120vh] h-[90vh] border border-[#312895]/20 flex flex-col"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <UploadBatchModal handleCloseModal={handleCloseModal} page={"activity"} activityId={activityId}></UploadBatchModal>
            </motion.div>
          </Backdrop>
        )}

        {/* Review Modal */}
        {reviewModalOpen && (
          <Backdrop className="fixed inset-0 z-50 flex items-start justify-center bg-black bg-opacity-50 pt-8">
            <motion.div
              className="bg-white rounded-lg shadow-lg w-[120vh] h-[90vh] border border-[#312895]/20 flex flex-col p-6"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className='flex flex-col gap-4'>
                <div className='flex justify-between items-center mb-4'>
                  <h1>Review Activity</h1>
                  <CloseButton
                    onClick={() => setReviewModalOpen(false)}
                  ></CloseButton>
                </div>
                <label htmlFor="remarks"></label>
                <TextInput
                  id={"remarks"}
                  value={remarks}
                  placeholder={"Remarks"}
                  onChange={(e) => setRemarks(e.target.value)}
                ></TextInput>

                <div className='flex justify-end mt-4 gap-2'>
                  <Button
                    onClick={handleDecline}
                    style={"secondary"}>Decline</Button>
                  <Button
                    onClick={handleAccept}
                  >Approve</Button>
                </div>
              </div>
            </motion.div>
          </Backdrop>
        )}

        {/* View Forms from users Modal */}
        <FormReviewModal userModalData={userModalData} isOpen={isProfileModalOpen} onClose={() => setIsProfileModalOpen(false)} />

      </AnimatePresence>
    </>
  );
}