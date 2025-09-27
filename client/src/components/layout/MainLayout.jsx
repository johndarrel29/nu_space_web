import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import Skeleton from "react-loading-skeleton";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import DefaultPicture from "../../assets/images/default-profile.jpg";
import blueLogoText from "../../assets/images/NUSpace_blue.png";
import whiteLogoText from "../../assets/images/NUSpace_new.png";
import { Backdrop, Breadcrumb, Button, ProfileInitials, SidebarButton } from "../../components";
import { useAuth } from "../../context/AuthContext";
import { useSidebar } from "../../context/SidebarContext";
import style from "../../css/Sidebar.module.css";
import { useAdminActivity, useAdminRSO, useOnlineStatus, useRSODetails, useUserProfile } from "../../hooks";
import { selectedRSOStatusStore, selectedRSOStore, useActivityStatusStore, useDocumentStore, useUserStoreWithAuth } from '../../store';
import Sidebar from "./Sidebar";

// ======bug=====
// when logging director, coord, or avp, the profile dropdown name shows the admin first name last name
// instead of the currently assigned role's name
// fix recognition status. it should remove the "recognized" status after april 30

// mobile sidebar fix responsive issue only showing icon for collapsed sidebar

function MainLayout({ children }) {
  // Navigation & auth
  const navigate = useNavigate();
  const isOnline = useOnlineStatus();
  const { user, logout } = useAuth();
  const location = useLocation();
  const currentPath = location.pathname;
  const params = useParams();
  const activityId = params.activityId;
  const documentId = useDocumentStore((state) => state.documentId);
  const rsoID = selectedRSOStore((state) => state.selectedRSO);
  const rsoStatus = selectedRSOStatusStore((state) => state.selectedRSOStatus);
  const activityStatus = useActivityStatusStore((state) => state.activityStatus);


  const {
    // approve activity
    isApprovingActivity,
    isErrorApprovingActivity,
    isActivityApproved,
    approveActivityMutate,

    rejectActivityMutate,
    isRejectingActivity,
    isErrorRejectingActivity,
    isActivityRejected,
  } = useAdminActivity();

  const {
    recognizeRSOMutate,
    isRecognizingRSO,
    isRecognizeRSOSuccess,
    isRecognizeRSOError,
    recognizeRSOError,
  } = useAdminRSO();

  // RSO hooks
  const {
    rsoDetails,
    isRSODetailsLoading,
    isRSODetailsError,
    isRSODetailsSuccess,
  } = useRSODetails();

  // User roles / store
  const { isUserRSORepresentative, isUserAdmin, isSuperAdmin, isCoordinator, isDirector, isAVP } = useUserStoreWithAuth();

  // User profile hook
  const {
    userProfile,
    userProfileError,
    isUserProfileLoading,
    isUserProfileError,
    refetchUserProfile,
    deleteOfficerMutate,
    isDeleting,
    isDeleteError,
  } = useUserProfile();

  // Sidebar / layout context
  const { isCollapsed } = useSidebar();

  // UI state
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profileData, setProfileData] = useState(null);
  const [isNotificationClicked, setIsNotificationClicked] = useState(false);

  // Modal state for reject
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectRemark, setRejectRemark] = useState("");

  // Refs
  const dropdownRef = useRef(null);
  const notificationRef = useRef(null);

  // Computed values
  const excludedPaths = ["/documents", `/documents/${documentId}`];
  // only set for new rso for now
  const isUserStatusActive = (isUserRSORepresentative && userProfile?.rso?.yearlyData?.RSO_recognition_status?.status === 'new_rso')
  const shouldShowOverlay = isUserStatusActive && !excludedPaths.includes(currentPath) && !currentPath.startsWith('/documents/');
  console.log("excluded paths startwith documents", userProfile);

  useEffect(() => {
    if (rsoDetails) {
      setProfileData(rsoDetails?.rso || null);
      console.log("RSO Details loaded successfully:", rsoDetails?.rso);
    }
  }, [rsoDetails]);


  useEffect(() => {
    if (userProfile) {
      console.log("User profile loaded successfully:", userProfile);
      console.log("rso:", userProfile?.rso);
    }
  }, [userProfile]);

  useEffect(() => {
    refetchUserProfile();
  }, [refetchUserProfile]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setIsNotificationClicked(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  })

  console.log("User profile data:", userProfile);

  useEffect(() => {
    if (isUserRSORepresentative) {
      setProfileData(rsoDetails?.rso || null);
      console.log("RSO Profile Data:", rsoDetails?.rso);
    } else if (isUserAdmin || isSuperAdmin || isCoordinator || isDirector || isAVP) {
      setProfileData(userProfile?.user || null);
    }
  }, [isUserRSORepresentative, isUserAdmin, isSuperAdmin, isCoordinator, isDirector, isAVP, rsoDetails, userProfile]);

  useEffect(() => {
    if (userProfileError) {
      console.log("Profile load userProfileError state is now:", userProfileError);
    }
  }, [userProfileError]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Handle logout
  const handleLogout = () => {
    // wait 1 second before logging out
    setTimeout(() => {
      logout();
    }, 1000);

  };

  const isOnAnnouncementPage = currentPath.includes("/announcement");
  const isOnDashboardPage = currentPath.includes("/dashboard");

  // compute recognition banner visibility only after profile finished loading
  const recognitionStatus = userProfile?.rso?.yearlyData?.RSO_recognition_status?.status;
  const showViewOnlyBanner = !isUserProfileLoading && !!recognitionStatus && recognitionStatus !== "recognized";

  // Add this variable for activity details page
  const isActivityDetailsPage = location.pathname.startsWith('/activities/') && activityId && (isUserAdmin || isCoordinator);
  const isRSODetailsPage = location.pathname.startsWith('/rsos/rso-details') && (isUserAdmin || isCoordinator);

  const handleDocumentApproval = () => {
    console.log("approving document: ", documentId);
    console.log("rso id from store: ", rsoID);

    if (!isUserAdmin && !isCoordinator) {
      console.error("Only Admins and Coordinators can approve documents");
      return;
    }

    if (isActivityDetailsPage && documentId) {
      approveActivityMutate({ activityId: documentId }, {
        onSuccess: () => {
          console.log("Document approved successfully");
          toast.success("Document approved successfully");
        },
        onError: (error) => {
          console.error("Error approving document:", error);
          toast.error(error.message || "Error approving document");
        }
      });
      return;
    }
    console.log("isRSODetailsPage:", isRSODetailsPage, "documentId:", documentId, "rsoID:", rsoID);
    if (isRSODetailsPage && rsoID) {
      recognizeRSOMutate({ id: rsoID }, {
        onSuccess: () => {
          console.log("RSO Document recognized successfully");
          toast.success("RSO Document recognized successfully");
        },
        onError: (error) => {
          console.error("Error recognizing RSO document:", error);
          toast.error(error.message || "Error recognizing RSO document");
        }
      });
    }
  }

  const handleRejectDocument = () => {
    try {
      rejectActivityMutate({ activityId: documentId, remark: rejectRemark }, {
        onSuccess: () => {
          console.log("Document rejected successfully");
          toast.success("Document rejected successfully");
        },
        onError: (error) => {
          console.error("Error rejecting document:", error);
          toast.error(error.message || "Error rejecting document");
        }
      });
    } catch (error) {
      throw error;
    }
  }

  const handleOpenRejectModal = () => {
    setRejectModalOpen(true);
    setRejectRemark("");
  };

  const handleCloseRejectModal = () => {
    setRejectModalOpen(false);
    setRejectRemark("");
  };

  const handleRejectDocumentWithRemark = () => {
    handleRejectDocument(rejectRemark);
    setRejectModalOpen(false);
    setRejectRemark("");
  };

  return (
    <div className="h-screen bg-background flex">
      {/* Sidebar */}
      <Sidebar />

      {/* mobile sidebar */}
      <Backdrop className={`${mobileSidebarOpen ? 'block' : 'hidden'} fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 transition-ease-in-out duration-300 xl:hidden`} />
      <div className={`${mobileSidebarOpen ? 'block' : 'hidden'} fixed top-0 left-0 h-screen z-50 ${isUserRSORepresentative ? `bg-white` : `bg-primary`} w-[300px]  p-6 transition-ease-in-out duration-300 xl:hidden`}>

        <div className="flex items-center justify-between ">

          {/* header */}
          <img src={isUserRSORepresentative ? blueLogoText : whiteLogoText} alt="NU Space" className="h-8" />
          <div
            onClick={() => setMobileSidebarOpen(false)}
            className={`transition-ease-in-out duration-300 aspect-square w-10 ${isUserRSORepresentative ? `bg-white border border-mid-gray` : `bg-primary border border-white`} rounded-full flex items-center justify-center cursor-pointer`}>
            <svg xmlns="http://www.w3.org/2000/svg" className={`size-4 ${isUserRSORepresentative ? `fill-off-black` : `fill-white`}`} viewBox="0 0 448 512"><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z" /></svg>
          </div>
        </div>

        {/* Buttons */}
        <div className="mt-6 flex flex-col gap-2 h-full">
          {/* RSO Representative Mobile Menu - Updated to match desktop sidebar */}
          {isUserRSORepresentative ? (
            <>
              <SidebarButton
                isCollapsed={true}
                iconPath="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64L0 400c0 44.2 35.8 80 80 80l400 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L80 416c-8.8 0-16-7.2-16-16L64 64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z"
                text="Dashboard"
                active={location.pathname === "/dashboard"}
                onClick={() => {
                  navigate("/dashboard");
                  setMobileSidebarOpen(false);
                }}
              />
              <SidebarButton
                isCollapsed={true}
                iconPath="M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 38.6C310.1 219.5 256 287.4 256 368c0 59.1 29.1 111.3 73.7 143.3c-3.2 .5-6.4 .7-9.7 .7L64 512c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128zm48 96a144 144 0 1 1 0 288 144 144 0 1 1 0-288zm16 80c0-8.8-7.2-16-16-16s-16 7.2-16 16l0 48-48 0c-8.8 0-16 7.2-16 16s7.2 16 16 16l48 0 0 48c0 8.8 7.2 16 16 16s16-7.2 16-16l0-48 48 0c8.8 0 16-7.2 16-16s-7.2-16-16-16l-48 0 0-48z"
                text="Documents"
                active={location.pathname === "/documents"}
                onClick={() => {
                  navigate("/documents");
                  setMobileSidebarOpen(false);
                }}
              />
              <SidebarButton
                isCollapsed={true}
                iconPath="M144 0a80 80 0 1 1 0 160A80 80 0 1 1 144 0zM512 0a80 80 0 1 1 0 160A80 80 0 1 1 512 0zM0 298.7C0 239.8 47.8 192 106.7 192l42.7 0c15.9 0 31 3.5 44.6 9.7c-1.3 7.2-1.9 14.7-1.9 22.3c0 38.2 16.8 72.5 43.3 96c-.2 0-.4 0-.7 0L21.3 320C9.6 320 0 310.4 0 298.7zM405.3 320c-.2 0-.4 0-.7 0c26.6-23.5 43.3-57.8 43.3-96c0-7.6-.7-15-1.9-22.3c13.6-6.3 28.7-9.7 44.6-9.7l42.7 0C592.2 192 640 239.8 640 298.7c0 11.8-9.6 21.3-21.3 21.3l-213.3 0c-14.7 0-26.7-11.9-26.7-26.7zM224 224a96 96 0 1 1 192 0 96 96 0 1 1 -192 0zM128 485.3C128 411.7 187.7 352 261.3 352l117.3 0C452.3 352 512 411.7 512 485.3c0 14.7-11.9 26.7-26.7 26.7l-330.7 0c-14.7 0-26.7-11.9-26.7-26.7z"
                text="Users"
                active={location.pathname === "/users"}
                onClick={() => {
                  navigate("/users");
                  setMobileSidebarOpen(false);
                }}
              />
              <SidebarButton
                isCollapsed={true}
                iconPath="M234.5 5.7c13.9-5 29.1-5 43.1 0l192 68.6C495 83.4 512 107.5 512 134.6l0 242.9c0 27-17 51.2-42.5 60.3l-192 68.6c-13.9 5-29.1 5-43.1 0l-192-68.6C17 428.6 0 404.5 0 377.4L0 134.6c0-27 17-51.2 42.5-60.3l192-68.6zM256 66L82.3 128 256 190l173.7-62L256 66zm32 368.6l160-57.1 0-188L288 246.6l0 188z"
                text="Activities"
                active={location.pathname.startsWith("/activities")}
                onClick={() => {
                  navigate("/activities");
                  setMobileSidebarOpen(false);
                }}
              />
              <div className="mt-4 mb-4 bg-mid-gray py-[1px] rounded"></div>
              <SidebarButton
                isCollapsed={true}
                iconPath="M224 256A128 128 0 1 0 224 0a128 128 0 1 0 0 256zm-45.7 48C79.8 304 0 383.8 0 482.3C0 498.7 13.3 512 29.7 512l388.6 0c16.4 0 29.7-13.3 29.7-29.7C448 383.8 368.2 304 269.7 304l-91.4 0z"
                text="RSO Account"
                active={location.pathname === "/account"}
                onClick={() => {
                  navigate("/account");
                  setMobileSidebarOpen(false);
                }}
              />
            </>
          ) : (isUserAdmin || isCoordinator) ? (
            <>
              <SidebarButton
                isCollapsed={true}
                iconPath="M64 64c0-17.7-14.3-32-32-32S0 46.3 0 64L0 400c0 44.2 35.8 80 80 80l400 0c17.7 0 32-14.3 32-32s-14.3-32-32-32L80 416c-8.8 0-16-7.2-16-16L64 64zm406.6 86.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L320 210.7l-57.4-57.4c-12.5-12.5-32.8-12.5-45.3 0l-112 112c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L240 221.3l57.4 57.4c12.5 12.5 32.8 12.5 45.3 0l128-128z"
                text="Dashboard"
                active={location.pathname === "/dashboard"}
                onClick={() => {
                  navigate("/dashboard");
                  setMobileSidebarOpen(false);
                }}
              />
              <SidebarButton
                isCollapsed={true}
                iconPath={"M0 64C0 28.7 28.7 0 64 0h224v128c0 17.7 14.3 32 32 32h128v288c0 35.3-28.7 64-64 64H64c-35.3 0-64-28.7-64-64V64zm384-22.6L256 0v128h128V41.4zM224 224H64v32h160v-32zm0 64H64v32h160v-32zm-96 64H64v32h64v-32zm352-128H320v32h160v-32zm-96 64h-64v32h64v-32zm-64 64h64v32h-64v-32z"}
                text="Forms"
                active={location.pathname.startsWith("/forms")}
                onClick={() => {
                  navigate("/forms");
                  setMobileSidebarOpen(false);
                }}
              />
              <SidebarButton
                isCollapsed={true}
                iconPath={"M224 64C206.3 64 192 78.3 192 96L192 128L160 128C124.7 128 96 156.7 96 192L96 240L544 240L544 192C544 156.7 515.3 128 480 128L448 128L448 96C448 78.3 433.7 64 416 64C398.3 64 384 78.3 384 96L384 128L256 128L256 96C256 78.3 241.7 64 224 64zM96 288L96 480C96 515.3 124.7 544 160 544L480 544C515.3 544 544 515.3 544 480L544 288L96 288z"}
                text="Academic Year"
                active={location.pathname.startsWith("/academic-year")}
                onClick={() => {
                  navigate("/academic-year");
                  setMobileSidebarOpen(false);
                }}
              />
              <SidebarButton
                isCollapsed={true}
                iconPath={"M0 64C0 28.7 28.7 0 64 0L224 0l0 128c0 17.7 14.3 32 32 32l128 0 0 288c0 35.3-28.7 64-64 64L64 512c-35.3 0-64-28.7-64-64L0 64zm384 64l-128 0L256 0 384 128z"}
                text="Documents"
                active={location.pathname.startsWith("/admin-documents")}
                onClick={() => {
                  navigate("/admin-documents");
                  setMobileSidebarOpen(false);
                }}
              />
              <SidebarButton
                isCollapsed={true}
                iconPath={"M234.5 5.7c13.9-5 29.1-5 43.1 0l192 68.6C495 83.4 512 107.5 512 134.6l0 242.9c0 27-17 51.2-42.5 60.3l-192 68.6c-13.9 5-29.1 5-43.1 0l-192-68.6C17 428.6 0 404.5 0 377.4L0 134.6c0-27 17-51.2 42.5-60.3l192-68.6zM256 66L82.3 128 256 190l173.7-62L256 66zm32 368.6l160-57.1 0-188L288 246.6l0 188z"}
                text="Activities"
                active={location.pathname.startsWith("/activities")}
                onClick={() => {
                  navigate("/activities");
                  setMobileSidebarOpen(false);
                }}
              />
              <SidebarButton
                isCollapsed={true}
                iconPath={"M208 80c0-26.5 21.5-48 48-48l64 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-8 0 0 40 152 0c30.9 0 56 25.1 56 56l0 32 8 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-64 0c-26.5 0-48-21.5-48-48l0-64c0-26.5 21.5-48 48-48l8 0 0-32c0-4.4-3.6-8-8-8l-152 0 0 40 8 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-64 0c-26.5 0-48-21.5-48-48l0-64c0-26.5 21.5-48 48-48l8 0 0-40-152 0c-4.4 0-8 3.6-8 8l0 32 8 0c26.5 0 48 21.5 48 48l0 64c0 26.5-21.5 48-48 48l-64 0c-26.5 0-48-21.5-48-48l0-64c0-26.5 21.5-48 48-48l8 0 0-32c0-30.9 25.1-56 56-56l152 0 0-40-8 0c-26.5 0-48-21.5-48-48l0-64z"}
                text="RSOs"
                active={location.pathname.startsWith("/rsos")}
                onClick={() => {
                  navigate("/rsos");
                  setMobileSidebarOpen(false);
                }}
              />
              <SidebarButton
                isCollapsed={true}
                iconPath={"M144 160A80 80 0 1 0 144 0a80 80 0 1 0 0 160zm368 0A80 80 0 1 0 512 0a80 80 0 1 0 0 160zM0 298.7C0 310.4 9.6 320 21.3 320l213.3 0c.2 0 .4 0 .7 0c-26.6-23.5-43.3-57.8-43.3-96c0-7.6 .7-15 1.9-22.3c-13.6-6.3-28.7-9.7-44.6-9.7l-42.7 0C47.8 192 0 239.8 0 298.7zM320 320c24 0 45.9-8.8 62.7-23.3c2.5-3.7 5.2-7.3 8-10.7c2.7-3.3 5.7-6.1 9-8.3C410 262.3 416 243.9 416 224c0-53-43-96-96-96s-96 43-96 96s43 96 96 96zm65.4 60.2c-10.3-5.9-18.1-16.2-20.8-28.2l-103.2 0C187.7 352 128 411.7 128 485.3c0 14.7 11.9 26.7 26.7 26.7l300.6 0c-2.1-5.2-3.2-10.9-3.2-16.4l0-3c-1.3-.7-2.7-1.5-4-2.3l-2.6 1.5c-16.8 9.7-40.5 8-54.7-9.7c-4.5-5.6-8.6-11.5-12.4-17.6l-.1-.2-.1-.2-2.4-4.1-.1-.2-.1-.2c-3.4-6.2-6.4-12.6-9-19.3c-8.2-21.2 2.2-42.6 19-52.3l2.7-1.5c0-.8 0-1.5 0-2.3s0-1.5 0-2.3l-2.7-1.5zM533.3 192l-42.7 0c-15.9 0-31 3.5-44.6 9.7c1.3 7.2 1.9 14.7 1.9 22.3c0 17.4-3.5 33.9-9.7 49c2.5 .9 4.9 2 7.1 3.3l2.6 1.5c1.3-.8 2.6-1.6 4-2.3l0-3c0-19.4 13.3-39.1 35.8-42.6c7.9-1.2 16-1.9 24.2-1.9s16.3 .6 24.2 1.9c22.5 3.5 35.8 23.2 35.8 42.6l0 3c1.3 .7 2.7 1.5 4 2.3l2.6-1.5c16.8-9.7 40.5-8 54.7 9.7c2.3 2.8 4.5 5.8 6.6 8.7c-2.1-57.1-49-102.7-106.6-102.7zm91.3 163.9c6.3-3.6 9.5-11.1 6.8-18c-2.1-5.5-4.6-10.8-7.4-15.9l-2.3-4c-3.1-5.1-6.5-9.9-10.2-14.5c-4.6-5.7-12.7-6.7-19-3l-2.9 1.7c-9.2 5.3-20.4 4-29.6-1.3s-16.1-14.5-16.1-25.1l0-3.4c0-7.3-4.9-13.8-12.1-14.9c-6.5-1-13.1-1.5-19.9-1.5s-13.4 .5-19.9 1.5c-7.2 1.1-12.1 7.6-12.1 14.9l0 3.4c0 10.6-6.9 19.8-16.1 25.1s-20.4 6.6-29.6 1.3l-2.9-1.7c-6.3-3.6-14.4-2.6-19 3c-3.7 4.6-7.1 9.5-10.2 14.6l-2.3 3.9c-2.8 5.1-5.3 10.4-7.4 15.9c-2.6 6.8 .5 14.3 6.8 17.9l2.9 1.7c9.2 5.3 13.7 15.8 13.7 26.4s-4.5 21.1-13.7 26.4l-3 1.7c-6.3 3.6-9.5 11.1-6.8 17.9c2.1 5.5 4.6 10.7 7.4 15.8l2.4 4.1c3 5.1 6.4 9.9 10.1 14.5c4.6 5.7 12.7 6.7 19 3l2.9-1.7c9.2-5.3 20.4-4 29.6 1.3s16.1 14.5 16.1 25.1l0 3.4c0 7.3 4.9 13.8 12.1 14.9c6.5 1 13.1 1.5 19.9 1.5s13.4-.5 19.9-1.5c7.2-1.1 12.1-7.6 12.1-14.9l0-3.4c0-10.6 6.9-19.8 16.1-25.1s20.4-6.6 29.6-1.3l2.9 1.7c6.3 3.6 14.4 2.6 19-3c3.7-4.6 7.1-9.4 10.1-14.5l2.4-4.2c2.8-5.1 5.3-10.3 7.4-15.8c2.6-6.8-.5-14.3-6.8-17.9l-3-1.7c-9.2-5.3-13.7-15.8-13.7-26.4s4.5-21.1 13.7-26.4l3-1.7zM472 384a40 40 0 1 1 80 0 40 40 0 1 1 -80 0z"}
                text="Users"
                active={location.pathname === "/users"}
                onClick={() => {
                  navigate("/users");
                  setMobileSidebarOpen(false);
                }}
              />
            </>

          ) : (
            // Super admin or other roles
            <>
              <SidebarButton
                isCollapsed={true}
                iconPath={"M144 160A80 80 0 1 0 144 0a80 80 0 1 0 0 160zm368 0A80 80 0 1 0 512 0a80 80 0 1 0 0 160zM0 298.7C0 310.4 9.6 320 21.3 320l213.3 0c.2 0 .4 0 .7 0c-26.6-23.5-43.3-57.8-43.3-96c0-7.6 .7-15 1.9-22.3c-13.6-6.3-28.7-9.7-44.6-9.7l-42.7 0C47.8 192 0 239.8 0 298.7zM320 320c24 0 45.9-8.8 62.7-23.3c2.5-3.7 5.2-7.3 8-10.7c2.7-3.3 5.7-6.1 9-8.3C410 262.3 416 243.9 416 224c0-53-43-96-96-96s-96 43-96 96s43 96 96 96zm65.4 60.2c-10.3-5.9-18.1-16.2-20.8-28.2l-103.2 0C187.7 352 128 411.7 128 485.3c0 14.7 11.9 26.7 26.7 26.7l300.6 0c-2.1-5.2-3.2-10.9-3.2-16.4l0-3c-1.3-.7-2.7-1.5-4-2.3l-2.6 1.5c-16.8 9.7-40.5 8-54.7-9.7c-4.5-5.6-8.6-11.5-12.4-17.6l-.1-.2-.1-.2-2.4-4.1-.1-.2-.1-.2c-3.4-6.2-6.4-12.6-9-19.3c-8.2-21.2 2.2-42.6 19-52.3l2.7-1.5c0-.8 0-1.5 0-2.3s0-1.5 0-2.3l-2.7-1.5zM533.3 192l-42.7 0c-15.9 0-31 3.5-44.6 9.7c1.3 7.2 1.9 14.7 1.9 22.3c0 17.4-3.5 33.9-9.7 49c2.5 .9 4.9 2 7.1 3.3l2.6 1.5c1.3-.8 2.6-1.6 4-2.3l0-3c0-19.4 13.3-39.1 35.8-42.6c7.9-1.2 16-1.9 24.2-1.9s16.3 .6 24.2 1.9c22.5 3.5 35.8 23.2 35.8 42.6l0 3c1.3 .7 2.7 1.5 4 2.3l2.6-1.5c16.8-9.7 40.5-8 54.7 9.7c2.3 2.8 4.5 5.8 6.6 8.7c-2.1-57.1-49-102.7-106.6-102.7zm91.3 163.9c6.3-3.6 9.5-11.1 6.8-18c-2.1-5.5-4.6-10.8-7.4-15.9l-2.3-4c-3.1-5.1-6.5-9.9-10.2-14.5c-4.6-5.7-12.7-6.7-19-3l-2.9 1.7c-9.2 5.3-20.4 4-29.6-1.3s-16.1-14.5-16.1-25.1l0-3.4c0-7.3-4.9-13.8-12.1-14.9c-6.5-1-13.1-1.5-19.9-1.5s-13.4 .5-19.9 1.5c-7.2 1.1-12.1 7.6-12.1 14.9l0 3.4c0 10.6-6.9 19.8-16.1 25.1s-20.4 6.6-29.6 1.3l-2.9-1.7c-6.3-3.6-14.4-2.6-19 3c-3.7 4.6-7.1 9.5-10.2 14.6l-2.3 3.9c-2.8 5.1-5.3 10.4-7.4 15.9c-2.6 6.8 .5 14.3 6.8 17.9l2.9 1.7c9.2 5.3 13.7 15.8 13.7 26.4s-4.5 21.1-13.7 26.4l-3 1.7c-6.3 3.6-9.5 11.1-6.8 17.9c2.1 5.5 4.6 10.7 7.4 15.8l2.4 4.1c3 5.1 6.4 9.9 10.1 14.5c4.6 5.7 12.7 6.7 19 3l2.9-1.7c9.2-5.3 20.4-4 29.6 1.3s16.1 14.5 16.1 25.1l0 3.4c0 7.3 4.9 13.8 12.1 14.9c6.5 1 13.1 1.5 19.9 1.5s13.4-.5 19.9-1.5c7.2-1.1 12.1-7.6 12.1-14.9l0-3.4c0-10.6 6.9-19.8 16.1-25.1s20.4-6.6 29.6-1.3l2.9 1.7c6.3 3.6 14.4 2.6 19-3c3.7-4.6 7.1-9.4 10.1-14.5l2.4-4.2c2.8-5.1 5.3-10.3 7.4-15.8c2.6-6.8-.5-14.3-6.8-17.9l-3-1.7c-9.2-5.3-13.7-15.8-13.7-26.4s4.5-21.1 13.7-26.4l3-1.7zM472 384a40 40 0 1 1 80 0 40 40 0 1 1 -80 0z"}
                text="User Management"
                active={location.pathname === "/user-management"}
                onClick={() => {
                  navigate("/user-management");
                  setMobileSidebarOpen(false);
                }}
              />
            </>
          )}
        </div>
      </div>


      {/* Main Content Area */}
      {console.log(isDirector ? "role is director. Removing sidebar" : "role is not director. Showing sidebar")}
      <div
        className={`relative h-screen z-0 transition-all duration-300 
      ${(isCollapsed && (isUserAdmin || isUserRSORepresentative || isCoordinator)) ? 'xl:left-[250px] xl:w-[calc(100%-250px)] w-full' : (isDirector || isAVP || isSuperAdmin) ? 'w-full' : 'xl:left-[80px] xl:w-[calc(100%-80px)] w-full'}`}
      >

        {/* Top Navigation Bar */}
        <div className="flex flex-col w-full">
          <div className="fixed top-0 left-0 right-0 bg-white border border-mid-gray h-16 p-4 z-50 flex items-center justify-between gap-4">

            {/* collapse sidebar button */}
            <div
              onClick={() => setMobileSidebarOpen(true)}
              className={`block xl:invisible transition-ease-in-out duration-300 aspect-square w-10 bg-white border border-mid-gray rounded-full flex items-center justify-center cursor-pointer ${(isUserAdmin || isUserRSORepresentative || isCoordinator) ? "" : "invisible"}`}>
              <svg xmlns="http://www.w3.org/2000/svg" className='fill-off-black size-4' viewBox="0 0 448 512"><path d="M0 96C0 78.3 14.3 64 32 64l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 128C14.3 128 0 113.7 0 96zM0 256c0-17.7 14.3-32 32-32l384 0c17.7 0 32 14.3 32 32s-14.3 32-32 32L32 288c-17.7 0-32-14.3-32-32zM448 416c0 17.7-14.3 32-32 32L32 448c-17.7 0-32-14.3-32-32s14.3-32 32-32l384 0c17.7 0 32 14.3 32 32z" /></svg>
            </div>

            {/* group notification module and profile picture */}
            <div className="flex items-center gap-4">


              <Button
                onClick={() => navigate(isOnAnnouncementPage ? -1 : "/announcements")}
                style={"secondary"}
                className={`${isOnAnnouncementPage ? "bg-gray-100" : ""}`}
              >
                <div className={`flex items-center gap-2 text-sm font-light`}>
                  {isOnAnnouncementPage ? (
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="currentColor" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
                      Cancel
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="currentColor" viewBox="0 0 448 512"><path d="M224 0c-17.7 0-32 14.3-32 32l0 19.2C119 66 64 130.6 64 208l0 18.8c0 47-17.3 92.4-48.5 127.6l-7.4 8.3c-8.4 9.4-10.4 22.9-5.3 34.4S19.4 416 32 416l384 0c12.6 0 24-7.4 29.2-18.9s3.1-25-5.3-34.4l-7.4-8.3C401.3 319.2 384 273.9 384 226.8l0-18.8c0-77.4-55-142-128-156.8L256 32c0-17.7-14.3-32-32-32zm45.3 493.3c12-12 18.7-28.3 18.7-45.3l-64 0-64 0c0 17 6.7 33.3 18.7 45.3s28.3 18.7 45.3 18.7s33.3-6.7 45.3-18.7z" /></svg>
                      Announcements
                    </div>
                  )}
                </div>
              </Button>

              {(isSuperAdmin || isDirector || isAVP) && (
                <Button
                  onClick={() => navigate(isOnDashboardPage ? -1 : "/dashboard")}
                  style={isOnDashboardPage ? "secondary" : "primary"}
                  className={`${isOnDashboardPage ? "bg-gray-100" : ""}`}
                >
                  <div className={`flex items-center gap-2 text-sm font-light`}>
                    {isOnDashboardPage ? (
                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="currentColor" viewBox="0 0 384 512"><path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" /></svg>
                        Cancel
                      </div>
                    ) : (

                      <div className="flex items-center gap-2">
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4" fill="currentColor" viewBox="0 0 640 640"><path d="M128 128C128 110.3 113.7 96 96 96C78.3 96 64 110.3 64 128L64 464C64 508.2 99.8 544 144 544L544 544C561.7 544 576 529.7 576 512C576 494.3 561.7 480 544 480L144 480C135.2 480 128 472.8 128 464L128 128zM534.6 214.6C547.1 202.1 547.1 181.8 534.6 169.3C522.1 156.8 501.8 156.8 489.3 169.3L384 274.7L326.6 217.4C314.1 204.9 293.8 204.9 281.3 217.4L185.3 313.4C172.8 325.9 172.8 346.2 185.3 358.7C197.8 371.2 218.1 371.2 230.6 358.7L304 285.3L361.4 342.7C373.9 355.2 394.2 355.2 406.7 342.7L534.7 214.7z" /></svg>
                        Dashboard
                      </div>
                    )}
                  </div>
                </Button>
              )}


              <div className='flex items-center justify-between text-center pr-6 '>


                <div
                  onClick={() => setDropdownOpen(!dropdownOpen)}
                  className="relative"
                  ref={dropdownRef} >
                  <div className="flex items-center justify-center rounded-full h-8 w-8 cursor-pointer hover:bg-light-gray group">
                    {isUserRSORepresentative ? (
                      <img
                        src={profileData?.RSO_picture || DefaultPicture}
                        alt="Profile"
                        className="rounded-full h-full w-full object-cover"
                      />
                    ) :
                      (isUserAdmin || isSuperAdmin || isCoordinator || isDirector || isAVP) ? (
                        <ProfileInitials firstName={profileData?.firstName} lastName={profileData?.lastName} />
                      )
                        :
                        (
                          <img
                            src={DefaultPicture}
                            alt="Profile"
                            className="rounded-full h-full w-full object-cover"
                          />
                        )}
                  </div>

                  {/* Dropdown Menu */}
                  {dropdownOpen && (
                    <div className="absolute top-6 right-0 mt-2 w-64 bg-white rounded-md border border-mid-gray py-1 z-40 pl-2 pr-2">
                      <div
                        className="w-full flex items-start gap-2  py-2 text-sm rounded mb-2 "
                      >
                        <div className="flex items-center gap-2 justify-center">
                          {/* profile picture */}
                          {console.log("profileData", profileData)}
                          {isUserRSORepresentative ? (
                            <div className="rounded-full h-8 w-8 bg-gray-200">
                              <img src={profileData?.RSO_picture || DefaultPicture} alt="Profile" className="rounded-full h-full w-full object-cover" />
                            </div>
                          ) :
                            (isUserAdmin || isSuperAdmin || isCoordinator || isDirector || isAVP) ? (
                              <ProfileInitials firstName={profileData?.firstName} lastName={profileData?.lastName} />

                            ) : (
                              <div className="rounded-full h-8 w-8 bg-gray-200">
                                <img src={DefaultPicture} alt="Profile" className="rounded-full h-full w-full object-cover" />
                              </div>
                            )}

                          {/* name */}
                          <div className="flex flex-col justify-center items-start">
                            <h1 className="text-sm font-bold">
                              {loading ? (
                                <div className="flex flex-col justify-center items-start w-[120px]">
                                  <Skeleton width={80} height={10} />
                                  <Skeleton width={100} height={10} />
                                </div>
                              )
                                :
                                //replace user with API call user
                                isUserRSORepresentative ? (
                                  <div className="flex flex-col justify-center items-start w-[200px]">
                                    <h1 className='text-sm font-bold'>{profileData?.RSO_acronym || 'N/A'}</h1>
                                    <h2 className='text-xs w-full truncate text-gray-500 text-start'>{profileData?.RSO_name || 'Not Assigned'}</h2>
                                  </div>
                                )
                                  :
                                  (isUserAdmin || isSuperAdmin || isCoordinator || isDirector || isAVP) ? (
                                    <>
                                      <div className='flex flex-col justify-center items-start w-[120px]'>
                                        <div>
                                          <h1 className='text-sm font-bold text-start'>{profileData?.firstName} {profileData?.lastName}</h1>
                                        </div>
                                        <h1 className='text-xs truncate text-gray-500'>{isUserAdmin ? "Admin" : isCoordinator ? "Coordinator" : isSuperAdmin ? "Super Admin" : isDirector ? "Director" : isAVP ? "AVP" : ""}</h1>
                                      </div>

                                    </>
                                  )
                                    :
                                    (
                                      <div className="flex flex-col justify-center items-start w-[120px]">
                                        <h1 className='text-sm font-light text-gray-600 h-4 w-24'>User not found</h1>
                                      </div>
                                    )
                              }
                            </h1>
                          </div>
                        </div>
                      </div>

                      {/* line separator */}
                      <div className="h-px w-full bg-gray-200 mb-2"></div>

                      <div
                        className="flex items-center gap-2 px-4 py-2 text-sm text-off-black hover:bg-gray-100 cursor-pointer rounded mb-2"
                        onClick={handleLogout}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="fill-off-black size-4" viewBox="0 0 512 512">
                          <path d="M377.9 105.9L500.7 228.7c7.2 7.2 11.3 17.1 11.3 27.3s-4.1 20.1-11.3 27.3L377.9 406.1c-6.4 6.4-15 9.9-24 9.9c-18.7 0-33.9-15.2-33.9-33.9l0-62.1-128 0c-17.7 0-32-14.3-32-32l0-64c0-17.7 14.3-32 32-32l128 0 0-62.1c0-18.7 15.2-33.9 33.9-33.9c9 0 17.6 3.6 24 9.9zM160 96L96 96c-17.7 0-32 14.3-32 32l0 256c0 17.7 14.3 32 32 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32l-64 0c-53 0-96-43-96-96L0 128C0 75 43 32 96 32l64 0c17.7 0 32 14.3 32 32s-14.3 32-32 32z" />
                        </svg>
                        Log Out
                      </div>
                    </div>
                  )}

                </div>
              </div>
            </div>
          </div>
          {console.log("user profile status in rso", userProfile?.rso?.yearlyData?.RSO_recognition_status?.status)}

          {/* fix that this should open if rso and userProfile?.rso?.yearlyData?.RSO_recognition_status?.status === null */}
          {console.log("user profile status in rso", userProfile?.rso?.yearlyData?.RSO_recognition_status?.status)}
          {(isUserRSORepresentative && userProfile?.rso?.yearlyData?.RSO_recognition_status?.status === 'new_rso') && (
            <div className="fixed top-16 xl:left-[4%] bg-white w-full h-8  z-30">
              <div className="flex items-center justify-center h-full bg-yellow-100 text-yellow-800">
                <h1 className="text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="fill-yellow-800 size-4" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24l0 112c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-112c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" /></svg>
                    This account is in view-only mode. Settle Documents to enable editing.
                  </div>
                </h1>
              </div>
            </div>
          )}
          {(isUserRSORepresentative && userProfile?.rso?.yearlyData?.RSO_recognition_status?.status === 'pending') && (
            <div className="fixed top-16 md:left-[4%] bg-white w-full h-8  z-30">
              <div className="flex items-center justify-center h-full bg-yellow-100 text-yellow-800">
                <h1 className="text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="fill-yellow-800 size-4" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24l0 112c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-112c0-13.3 10.7-24 24-24zM224 352a32 32 0 1 1 64 0 32 32 0 1 1 -64 0z" /></svg>
                    Document has been submitted for review. You can view the document but cannot edit it until it is approved.
                  </div>
                </h1>
              </div>
            </div>
          )}

          {/* Offline Notification */}
          {!isOnline && (
            <div className="fixed top-16 md:left-[4%] bg-white w-full h-8  z-30">
              <div className="flex items-center justify-center h-full bg-red-100 text-red-800">
                <h1 className="text-sm font-semibold">
                  <div className="flex items-center gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="fill-red-800 size-4" viewBox="0 0 512 512"><path d="M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zm0-384c13.3 0 24 10.7 24 24l0 112c0 13.3-10.7 24-24 24s-24-10.7-24-24l0-112c0-13.3 10.7-24 24-24zM224 352a32
  32 0 1 1 64 0 32 32 0 1 1 -64 0z" /></svg>
                    You are currently offline. Some features may be unavailable.
                  </div>
                </h1>
              </div>
            </div>
          )}
        </div>
        <div className="relative">
          {(isUserRSORepresentative && shouldShowOverlay) && (
            <div className="absolute inset-0 z-10 bg-white/70 flex items-center justify-center pointer-events-auto">
              <h1 className="text-yellow-800 font-semibold bg-yellow-100 px-4 py-2 rounded shadow">
                View-only mode enabled
              </h1>
            </div>
          )}
          <main className={`mt-16  h-full overflow-y-auto p-4 lg:pl-12 lg:pr-12
            ${(isCollapsed) ? 'left-[15%] ' : 'left-[80px] '}`}>
            <div className="mb-6 flex flex-col">
              <Breadcrumb style={style.tabName} unSelected={style.disabled} />
            </div>

            {/* Page Content */}
            <div className={`bg-white rounded-lg shadow-lg p-6 relative ${((isActivityDetailsPage && activityStatus !== "approved" && activityStatus !== "rejected") || (isRSODetailsPage && rsoStatus !== "recognized")) ? 'mb-24' : ''}`}>
              {children}
            </div>
          </main>

          {/* Reject/ approve bottom nav button */}
          {((isActivityDetailsPage && activityStatus !== "approved" && activityStatus !== "rejected") || (isRSODetailsPage && rsoStatus !== "recognized")) && (
            <div className="w-full py-6 bg-white fixed bottom-0 z-40 mt-auto flex items-center justify-center gap-4 border-t border-mid-gray">
              {isActivityDetailsPage && (
                <Button
                  onClick={handleOpenRejectModal}
                  style="secondary"
                >
                  Reject
                </Button>
              )}
              <Button
                onClick={handleDocumentApproval}
              >
                {` Approve ${isActivityDetailsPage ? "Activity" : "RSO Recognition"}`}
              </Button>
            </div>
          )}

          {/* Reject Modal */}
          <AnimatePresence>
            {rejectModalOpen && (
              <>
                <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" />
                <motion.div
                  className="fixed inset-0 z-50 w-screen overflow-auto flex items-center justify-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                >
                  <div className="bg-white rounded-lg p-6 max-w-md shadow-xl border border-gray-100">
                    <div className='flex justify-between items-center mb-4'>
                      <h2 className='text-lg font-semibold'>Reject Document</h2>
                      <button
                        onClick={handleCloseRejectModal}
                        className="rounded-full p-1 hover:bg-gray-200"
                        aria-label="Close"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-gray-600" viewBox="0 0 384 512"><path d="M231 256l107-107c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L185.7 210.7 78.6 103.6c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L140.3 256 33.2 363.1c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0l107-107 107 107c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L231 256z" /></svg>
                      </button>
                    </div>
                    <div className='py-4'>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Remark (required)</label>
                      <textarea
                        rows="3"
                        value={rejectRemark}
                        onChange={e => setRejectRemark(e.target.value)}
                        className="bg-textfield border border-mid-gray text-gray-900 text-sm rounded-md block w-full p-2.5"
                        placeholder="Provide reason for rejection..."
                      />
                    </div>
                    <div className='flex justify-end gap-3 mt-6'>
                      <Button
                        style="secondary"
                        onClick={handleCloseRejectModal}
                      >
                        Cancel
                      </Button>
                      <Button
                        style="danger"
                        onClick={handleRejectDocumentWithRemark}
                        disabled={!rejectRemark.trim()}
                      >
                        Reject
                      </Button>
                    </div>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

export default MainLayout;