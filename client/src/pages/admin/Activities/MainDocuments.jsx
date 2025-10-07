import { DateTimePicker, LocalizationProvider } from '@mui/x-date-pickers';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from "dayjs";
import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Select from 'react-select';
import { toast } from "react-toastify";
import DefaultPicture from "../../../assets/images/default-picture.png";
import {
  ActivityCard,
  ActivitySkeleton,
  Button,
  CloseButton,
  DropdownSearch,
  LoadingSpinner,
  ReusableDropdown,
  Searchbar
} from "../../../components";
import { useAdminAcademicYears, useAdminActivity, useRSOActivities } from "../../../hooks";
import { useUserStoreWithAuth } from '../../../store';

// fix the rso path first to manipulate the activity data.
// system enhancement: use isLoading to make loading animation when fetching or filtering activities

const DropIn = {
  hidden: {
    opacity: 0,
    y: "100vh",
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
  exit: {
    opacity: 0,
    y: "100vh",
    transition: {
      duration: 0.3,
      ease: [0.16, 1, 0.3, 1],
    },
  },
};

const Backdrop = ({ children, ...props }) => {
  return (
    <motion.div
      {...props}
      className="fixed inset-0 bg-black bg-opacity-30"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      {children}
    </motion.div>
  );
};


export default function MainDocuments() {

  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));
  const [selectedActivity, setSelectedActivity] = useState(null);
  const [sorted, setSorted] = useState("All");
  const [RSO, setRSO] = useState("All");
  const [loading, setLoading] = useState(false);
  const [RSOType, setRSOType] = useState("All");
  const [college, setCollege] = useState("All");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [gpoa, setGPOA] = useState({
    value: "", label: "All"
  });
  const { isUserRSORepresentative, isUserAdmin, isCoordinator } = useUserStoreWithAuth();
  const [documentError, setDocumentError] = useState(null);
  const [isDeadlineModalOpen, setIsDeadlineModalOpen] = useState(false);
  const [preDocDeadline, setPreDocDeadline] = useState(null);
  const [postDocDeadline, setPostDocDeadline] = useState(null);
  const [selectedActivityId, setSelectedActivityId] = useState(null);
  const [academicYear, setAcademicYear] = useState(null);

  // Academic years data
  const {
    academicYears,
    academicYearsLoading,
    academicYearsError,
    academicYearsErrorMessage,
    refetchAcademicYears,
    isRefetchingAcademicYears,
    isAcademicYearsFetched,


  } = useAdminAcademicYears({ manualEnabled: true });

  // revised rso route
  const {
    activityLocalData,
    activityLocalLoading,
    activityLocalError,
    activityLocalQueryError,
    refetchLocalActivityData,
    isLocalActivityRefetching,
  } = useRSOActivities();

  useEffect(() => {
    if (isLocalActivityRefetching) {
      console.log("Refetching local activities...");
    }
    console.log("data from the new hook ", activityLocalData)
  }, [activityLocalData, isLocalActivityRefetching]);


  // admin activity route
  const {
    adminPaginatedActivities,
    adminError,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isAdminActivitiesLoading,
    isAdminActivitiesError,
    isAdminActivitiesFetching,

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
  } = useAdminActivity({
    debouncedQuery,
    sorted,
    RSO,
    RSOType,
    college,
    isGPOA: gpoa.value,
    academicYearId: academicYear,
  });


  const allActivities = adminPaginatedActivities?.pages?.flatMap(page => page?.activities || []) || [];
  console.log("Admin paginated activities:", adminPaginatedActivities?.pages?.[0]?.hasNextPage);


  // set document error based on user role
  useEffect(() => {
    if (user?.role === "admin" || user?.role === "coordinator" || user?.role === "super_admin") {
      setDocumentError(adminError);
    } else if (user?.role === "rso_representative") {
      setDocumentError(null);
    } else {
      setDocumentError(null);
    }
  }, [adminError, null, user?.role]);

  const handleCreate = () => {
    navigate("/activities/form-selection", {
      state: {
        mode: "create",
      },
    });
  }

  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedQuery(searchQuery);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchQuery]);

  const handleRSO = (value) => {
    console.log("Selected RSO:", value);
    setRSO(value);
  }

  const handleSorted = (value) => {
    console.log("Selected Sort Option:", value);
    if (value === "All") {
      setSorted(null);
    } else {
      setSorted(value);
    }
  }
  const handleRSOType = (value) => {
    console.log("Selected RSO Type:", value);
    if (value === "All") {
      setRSOType(null);
    } else {
      setRSOType(value);
    }
  }

  const handleCollege = (value) => {
    console.log("Selected College:", value);
    if (value === "All") {
      setCollege(null);
    }
    setCollege(value);
  }

  useEffect(() => {
    if (academicYears?.status?.activeAY?._id && !academicYear) {
      setAcademicYear(academicYears?.status?.activeAY?._id);
    }
  }, [academicYears, academicYear]);


  const handleAcademicYear = (value) => {
    setAcademicYear(value);
    console.log("Selected Academic Year:", value);
  };

  const handleActivityClick = (activity) => {
    setSelectedActivity(activity);
    console.log("Selected Activity:", activity);
    navigate(`/activities/${activity._id}`);
  };

  // console.log("activities:", fetchActivity);

  const assignedRSOs = Array.isArray(user?.assigned_rso)
    ? user.assigned_rso
    : user?.assigned_rso
      ? [user.assigned_rso]
      : [];


  const handleDateTime = (dateTime) => {
    const date = new Date(dateTime);
    return date.toLocaleString('en-US', {
      month: 'numeric',
      day: 'numeric',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  }

  const handleGPOA = (value) => {
    if (value === "All") {
      setGPOA({ value: "All", label: "All" });
    } else if (value === "GPOA Activities") {
      setGPOA({ value: true, label: "GPOA Activities" });
    } else if (value === "Non-GPOA Activities") {
      setGPOA({ value: false, label: "Non-GPOA Activities" });
    }
  }

  const activitiesToShow =
    isUserRSORepresentative ?
      (activityLocalData || [])
        // Apply search filter first
        .filter(activity => {
          if (!searchQuery) return true;
          return (
            activity.Activity_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.Activity_description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            activity.Activity_place?.toLowerCase().includes(searchQuery.toLowerCase())
          );
        })
        // Then apply sorting
        .sort((a, b) => {
          if (!sorted) return 0;
          switch (sorted) {
            case "A-Z":
              return (a.Activity_name || "").localeCompare(b.Activity_name || "");
            case "Most Joined":
              return (b.Activity_registration_total || 0) - (a.Activity_registration_total || 0);
            case "Recently Added":
              return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            case "All":
              return 0;
            default:
              return 0;
          }
        }) :
      (isUserAdmin || isCoordinator) ? allActivities :
        [];

  const handleDateSelected = () => {
    try {
      if (!selectedActivityId || !preDocDeadline || !postDocDeadline) {
        setLoading(false);
        toast.error('No activity selected');
        return;
      }
      // Log the deadline states from the modal
      console.log('Pre Document Deadline:', preDocDeadline ? dayjs(preDocDeadline).toISOString() : null);
      console.log('Post Document Deadline:', postDocDeadline ? dayjs(postDocDeadline).toISOString() + " id: " + selectedActivityId : null);

      if (preDocDeadline) {
        preDocumentDeadlineMutate({
          activityId: selectedActivityId,
          preDocumentDeadline: dayjs(preDocDeadline).toISOString(),
        },
          {
            onSuccess: () => {
              console.log('Pre-document deadline updated successfully');
              toast.success('Pre-document deadline updated successfully');
              setLoading(false);
              // clear the select state and the date state
              setSelectedActivityId(null);
              setPreDocDeadline(null);
              setPostDocDeadline(null);
            },
            onError: (error) => {
              setLoading(false);
              console.error('Error updating pre-document deadline:', error);
              toast.error(error.message || 'Error updating pre-document deadline');
            }
          }
        );
      }
      if (postDocDeadline) {
        postDocumentDeadlineMutate({
          activityId: selectedActivityId,
          postDocumentDeadline: dayjs(postDocDeadline).toISOString(),
        },
          {
            onSuccess: () => {
              toast.success('Post-document deadline updated successfully');
              setLoading(false);
              // clear the select state and the date state
              setSelectedActivityId(null);
              setPreDocDeadline(null);
              setPostDocDeadline(null);
            },
            onError: (error) => {
              setLoading(false);
              console.error('Error updating post-document deadline:', error);
              toast.error(error.message || 'Error updating post-document deadline');
            }
          }
        );
      }
    } catch (error) {
      setLoading(false);
      console.error('Error selecting dates:', error);
    } finally {
      setLoading(false);
    }
  }

  const activityOptions = activitiesToShow.map((activity) => ({
    value: activity._id,
    label: activity.Activity_name,
  }));

  return (
    <div className="w-full">

      {/* Header and Create Button */}
      <div >
        {user?.role === "rso_representative" && (
          <div className="flex justify-end mb-4 gap-2">
            <Button
              onClick={handleCreate}
              className="bg-primary hover:bg-primary-active text-white px-4 py-2"
            >
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" className="fill-white size-4" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" /></svg>
                Create an Activity
              </div>
            </Button>
          </div>
        )}
      </div>

      {/* Deadline Button */}
      {(isUserAdmin || isCoordinator) && (
        <div className="w-full flex justify-end mb-4 px-0 sm:px-0">
          <Button onClick={() => setIsDeadlineModalOpen(true)}>
            <div className="flex items-center gap-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-white" viewBox="0 0 640 640"><path d="M320 64C461.4 64 576 178.6 576 320C576 461.4 461.4 576 320 576C178.6 576 64 461.4 64 320C64 178.6 178.6 64 320 64zM296 184L296 320C296 328 300 335.5 306.7 340L402.7 404C413.7 411.4 428.6 408.4 436 397.3C443.4 386.2 440.4 371.4 429.3 364L344 307.2L344 184C344 170.7 333.3 160 320 160C306.7 160 296 170.7 296 184z" /></svg>
              Set Activity Deadline
            </div>
          </Button>
        </div>
      )}

      {/* Search and Filter Section */}
      <div className="mb-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <div className="md:col-span-2">
            <Searchbar
              placeholder="Search an Activity"
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
            />
          </div>
          {isUserRSORepresentative ? (
            <div>
              <ReusableDropdown
                icon={true}
                options={["All", "A-Z", "Most Joined", "Recently Added"]}
                showAllOption={false}
                onChange={(e) => handleSorted(e.target.value)}
                value={sorted}
                buttonClass="border-primary  text-primary "
              />
            </div>
          )
            :
            (
              <DropdownSearch
                isSorting={true}
                setSelectedSorting={handleRSO}
                setSelectedCategory={() => { }}
              />
            )
          }
        </div>

        {/* More Filter Section for Admin and Super Admin */}
        {(isUserAdmin || isCoordinator) && (
          <div className="block w-full border-b border-slate-200 pl-1 pr-1">
            <div className="grid grid-cols-1 sm:grid-cols-3 py-2 gap-2">
              <div className="flex flex-col gap-1">
                <label htmlFor="RSO" className="text-sm font-medium text-gray-600">
                  GPOA
                </label>
                <ReusableDropdown
                  icon={true}
                  id="RSO"
                  placeholder={"Select GPOA Option"}
                  options={["All", "GPOA Activities", "Non-GPOA Activities"]}
                  showAllOption={false}
                  onChange={(e) => handleGPOA(e.target.value)}
                  value={gpoa.label}
                  buttonClass="border-primary  text-primary "
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="sort" className="text-sm font-medium text-gray-600">
                  Sort By
                </label>
                <ReusableDropdown
                  icon={true}
                  id="sort"
                  placeholder={"Select Sort Option"}
                  options={["All", "A-Z", "Most Joined", "Recently Added"]}
                  showAllOption={false}
                  onChange={(e) => handleSorted(e.target.value)}
                  value={sorted}
                  buttonClass="border-primary  text-primary "
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="RSOType" className="text-sm font-medium text-gray-600">
                  RSO Type
                </label>
                <ReusableDropdown
                  id="RSOType"
                  icon={true}
                  placeholder={"Select RSO Type"}
                  options={["All", "Professional & Affiliates", "Professional", "Special Interest", "Probationary", "Office Aligned Organization"]}
                  showAllOption={false}
                  onChange={(e) => handleRSOType(e.target.value)}
                  value={RSOType}
                  buttonClass="border-primary  text-primary "
                />
              </div>
              <div className="flex flex-col gap-1">
                <label htmlFor="college" className="text-sm font-medium text-gray-600">
                  College
                </label>
                <ReusableDropdown
                  id="college"
                  placeholder={"Select College"}
                  options={["All", "CCIT", "CBA", "COA", "COE", "CAH", "CEAS", "CTHM"]}
                  value={college}
                  showAllOption={false}
                  onChange={(e) => handleCollege(e.target.value)}
                  buttonClass="border-primary  text-primary "
                />
              </div>
              <div className="w-full mb-2 md:mb-0">
                <label htmlFor="academic-year" className="block text-sm font-medium text-gray-700 mb-1">
                  Academic Year
                </label>
                <select
                  id="academic-year"
                  value={academicYear || ""}
                  onChange={(e) => handleAcademicYear(e.target.value)}
                  className="w-full h-10 rounded-md bg-white border border-mid-gray p-1"
                >
                  <option value="">Select Academic Year</option>
                  {academicYears?.years?.map(year => (
                    <option
                      key={year._id}
                      value={year._id}
                    >
                      {year.label || "no data"}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        )}

      </div>

      {/* Activity Cards Section */}
      {(isUserRSORepresentative ? null : isAdminActivitiesLoading) ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <ActivitySkeleton count={8} />
        </div>
      )
        :
        (isUserAdmin && documentError) ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg flex flex-col items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-12 w-12 text-red-500 mb-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <p className="text-red-500 font-medium text-center max-w-md px-4">
              {documentError?.message || "An error occurred while fetching activities."}
            </p>
          </div>
        )
          :

          (activitiesToShow.length > 0 && !isLocalActivityRefetching) ? (
            <>
              <div className="flex items-center justify-center mb-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-4 gap-8 ">
                  {console.log("Activities to Show:", activitiesToShow)}
                  {activitiesToShow?.map((activity) => (
                    <ActivityCard
                      key={activity._id}
                      activity={activity}
                      Activity_name={activity.Activity_name}
                      Activity_description={activity.Activity_description}
                      RSO_acronym={activity.RSO_id?.RSO_acronym || "N/A"}
                      // Activity_date_status={activity.Activity_date_status}
                      //user imageUrl if rso_representative role
                      Activity_image={
                        isUserRSORepresentative ? activity?.imageUrl || DefaultPicture :
                          (isUserAdmin || isCoordinator) ?
                            activity?.activityImageUrl || DefaultPicture : DefaultPicture}
                      Activity_registration_total={activity?.Activity_registration_total}
                      onClick={handleActivityClick}
                      Activity_datetime={handleDateTime(activity?.Activity_start_datetime) || "N/A"}
                      Activity_place={activity?.Activity_place}
                      Activity_approval_status={activity?.Activity_approval_status}
                    />
                  ))}
                </div>
              </div>

              {/* Load More Button */}
              {(isUserAdmin || isCoordinator) && (
                <div className="flex justify-center mt-6">
                  {hasNextPage && (
                    <Button
                      style={"secondary"}
                      onClick={() => fetchNextPage()}
                      disabled={isFetchingNextPage}
                    >
                      {isFetchingNextPage ? 'Loading more...' : 'Load More'}
                    </Button>
                  )}
                </div>
              )}

            </>
          ) : (isLocalActivityRefetching || isAdminActivitiesLoading || isAdminActivitiesFetching) ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              <ActivitySkeleton count={8} />
            </div>
          )
            : (
              <div className="flex flex-col items-center justify-center p-8 bg-gray-50 rounded-lg">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-primary /50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <h3 className="mt-2 text-lg font-medium text-primary ">No activities found</h3>
                <p className="text-sm text-gray-500">Try adjusting your search or filters</p>
              </div>
            )

      }

      {/* Activity Deadline Modal */}
      <AnimatePresence>
        {isDeadlineModalOpen && (
          <>
            {/* Modal for setting activity deadlines */}
            <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" />
            <motion.div
              className="fixed inset-0 z-50 w-screen overflow-auto"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg p-6 sm:p-8 w-full max-w-[90%] sm:max-w-xl md:max-w-2xl">
                  <div className='flex justify-between items-center mb-6'>
                    <h2 className="text-lg font-medium text-[#312895]">Set Activity Deadlines</h2>
                    <CloseButton onClick={() => { setIsDeadlineModalOpen(false); setLoading(false); }} />
                  </div>
                  {/* Deadline fields */}
                  <div className='space-y-4'>
                    <div className="w-full">
                      <div className="mb-4 w-full">
                        <label htmlFor="activity-select" className="block text-sm font-medium text-gray-700">Select Activity</label>
                        <Select
                          classNamePrefix="react-select"
                          onChange={(selectedOption) => setSelectedActivityId(selectedOption ? selectedOption.value : null)}
                          options={activityOptions}
                        />
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
                      onClick={() => { handleDateSelected(); setLoading(true); }}
                      disabled={loading}
                      style="primary"
                    >
                      {loading ? <LoadingSpinner /> : 'Set Deadlines'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </div>
  );
}