import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Select from 'react-select';
import { toast } from "react-toastify";
import { DropIn } from "../../../animations/DropIn";
import { Backdrop, Button, CloseButton, CreateUserModal, FormReviewModal, LoadingSpinner, ReusableDropdown, ReusableTable, TabSelector } from "../../../components";
import { useAdminRSO, useAdminUser, useModal, useRSODetails, useRSOUsers, useSuperAdminUsers } from "../../../hooks";
import { useUserStoreWithAuth } from "../../../store";
import { FormatDate } from "../../../utils";


export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isOpen, openModal, closeModal } = useModal();
  const { isUserRSORepresentative, isUserAdmin, isSuperAdmin, isCoordinator, isDirector, isAVP } = useUserStoreWithAuth();
  const [activeTab, setActiveTab] = useState(0);
  const [selectedUserId, setSelectedUserId] = useState(null);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    limit: 10,
    page: 1,
    isDeleted: false,
  });
  const {
    rsoDetails,
    isRSODetailsLoading,
    isRSODetailsError,
    isRSODetailsSuccess,
  } = useRSODetails();
  const {
    rsoData,
    isRSOLoading,
    isRSOError,
    rsoError,
    refetchRSOData,
  } = useAdminRSO({ manualEnable: !isUserRSORepresentative ? true : false, setActiveAY: true });

  useEffect(() => {
    console.log("searchQuery changed to:", searchQuery);
    setFilters((prev) => ({
      ...prev,
      search: searchQuery,
      page: 1, // Optionally reset page on new search
    }));
  }, [searchQuery, filters.role, filters.isDeleted]);

  const {
    rsoMembers,
    isLoadingMembers,
    isErrorFetchingMembers,
    errorFetchingMembers,
    isRefetchingMembers,
    refetchMembers,

    rsoApplicants,
    isErrorFetchingApplicants,
    isLoadingApplicants,
    errorFetchingApplicants,
    isRefetchingApplicants,
    refetchApplicants,

    approveMembership,
    isApprovingMembership,
    isErrorApprovingMembership,
    errorApprovingMembership,
    isSuccessApprovingMembership,

    applicantAnswer,
    isErrorFetchingApplicantAnswer,
    errorFetchingApplicantAnswer,
    isLoadingApplicantAnswer,
    refetchApplicantAnswer,
  } = useRSOUsers({ userId: selectedUserId });

  useEffect(() => {
    console.log("applicantAnswer changed to:", selectedUserId, "applicantAnswer is ", applicantAnswer);

    setUserModalData({
      email: applicantAnswer?.applicant?.studentId?.email || "",
      fullName: applicantAnswer?.applicant?.studentId?.firstName + " " + applicantAnswer?.applicant?.studentId?.lastName || "",
      id: applicantAnswer?.applicant?._id || undefined,
      applicationId: applicantAnswer?.applicant?._id || undefined,
      index: 0,
      pages: applicantAnswer?.applicant?.answers?.pages || []
    });
  }, [selectedUserId, applicantAnswer]);

  const {
    // fetching users admin
    usersData,
    isUsersLoading,
    isUsersError,
    usersError,
    refetchUsersData,
    updateError,

    // updating users
    updateUserMutate,
    isUpdateError,
    isUpdateLoading,
    isUpdateSuccess,

    // deleting users
    hardDeleteStudentAccount,
    isHardDeleteError,
    isHardDeleteLoading,
    isHardDeleteSuccess,
    hardDeleteError,

    // soft deleting users
    softDeleteStudentAccount,
    isSoftDeleteStudentError,
    isSoftDeleteStudentLoading,
    softDeleteStudentErrorMessage,

    // restoring users
    restoreStudentAccount,
    isRestoreStudentError,
    isRestoringStudent,
    restoreStudentErrorMessage,

  } = useAdminUser(filters);

  const {
    // SDAO accounts data
    sdaoAccounts,
    accountsLoading,
    accountsError,
    accountsErrorMessage,
    refetchAccounts,
    isRefetchingAccounts,
    isAccountsFetched,

    // SDAO create 
    createAccount,
    isCreatingAccount,
    isCreateError,
    createErrorMessage,

    // SDAO hard delete
    hardDeleteAdminAccount,
    isHardDeletingAccount,
    isHardDeleteAccountError,
    hardDeleteErrorMessage,

    // SDAO soft delete
    softDeleteAdminAccount,
    isSoftDeletingAccount,
    isSoftDeleteAccountError,
    softDeleteErrorMessage,

    // SDAO restore
    restoreAdminAccount,
    isRestoringAccount,
    isRestoreAccountError,
    restoreErrorMessage,

    // SDAO update role
    updateAdminRole,
    isUpdatingSDAORole,
    isUpdateSDAORoleError,
    updateSDAORoleErrorMessage
  } = useSuperAdminUsers(filters);

  console.log("rso members ", rsoMembers);

  console.log("searchquery is ", searchQuery, "filters are ", filters);

  const applicants = rsoApplicants?.applicants || [];

  const tableRow = applicants.map(applicant => {
    const applicantData = applicant || {};
    const student = applicant.studentId || {};

    return {
      applicantData: applicantData,
      applicationId: applicantData._id,
      studentId: student._id,
      approvalStatus: applicantData.approvalStatus || "N/A",
      fullName: `${student.firstName || 'N/A'} ${student.lastName || 'N/A'}`,
    }
  }) || [];

  const adminTableRow = usersData?.students?.map((user, index) => {
    return {
      index: (filters.page - 1) * filters.limit + index + 1,
      id: user?._id,
      email: user?.email || "no email",
      role: user?.role || "N/A",
      assignedRSO: user?.assigned_rso?.RSO_acronym || "",
      createdAt: FormatDate(user?.createdAt) || "N/A",
      fullName: `${user?.firstName || 'N/A'} ${user?.lastName || 'N/A'}`,
      isDeleted: user?.isDeleted || false,
    }
  }) || [];

  const superAdminTableRow = sdaoAccounts?.SDAOAccounts?.map((user, index) => {
    return {
      index: (filters.page - 1) * filters.limit + index + 1,
      id: user?._id,
      email: user?.email || "no email",
      role: user?.role || "N/A",
      assignedRSO: user?.assigned_rso?.RSO_acronym || "",
      createdAt: FormatDate(user?.createdAt) || "N/A",
      fullName: `${user?.firstName || 'N/A'} ${user?.lastName || 'N/A'}`,
      isDeleted: user?.isDeleted || false,
    }
  }) || [];

  const rsoMembersTableRow = rsoMembers?.members?.map((member, index) => {
    return {
      index: (filters.page - 1) * filters.limit + index + 1,
      id: member?._id,
      email: member?.email || "no email",
      fullName: `${member?.firstName || 'N/A'} ${member?.lastName || 'N/A'}`,
    }
  }) || [];

  console.log("adminTableRow is ", adminTableRow, "usersData is ", usersData);

  function membersTableRow() {
    return [
      { name: "Name", key: "fullName" },
    ];
  }

  function tableHeading() {
    return [
      { name: "Name", key: "fullName" },
      { name: "Approval Status", key: "approvalStatus" },
    ];
  }

  function tableAdminHeading() {
    return [
      { name: "Name", key: "fullName" },
      { name: "Role", key: "role" },
      { name: "Assigned RSO", key: "assignedRSO" },
      { name: "Date Created", key: "createdAt" },
      { name: "Actions", key: "actions" },
    ]
  }

  function tableSuperAdminHeading() {
    return [
      { name: "Name", key: "fullName" },
      { name: "Role", key: "role" },
      { name: "Date Created", key: "createdAt" },
      { name: "Actions", key: "actions" },
    ]
  }

  console.log("users data is ", usersData);


  const tableRowFiltered = useMemo(() => {
    const search = (searchQuery || '').toLowerCase();
    return tableRow
      .filter(row => {
        if (!search) return true;
        const nameMatch = row.fullName.toLowerCase().includes(search);
        return nameMatch;
      })
      .map((row, idx) => ({
        index: idx + 1,
        id: row.studentId,
        fullName: row.fullName,
        applicantData: row.applicantData,
        approvalStatus: row.approvalStatus,
      }));
  }, [tableRow, searchQuery]);

  // User Info Modal State
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [userModalData, setUserModalData] = useState({
    email: "",
    fullName: "",
    applicationId: undefined,
    id: undefined,
    index: 0,
    pages: [] // added
  });

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editModalData, setEditModalData] = useState({
    id: '',
    email: '',
    fullName: '',
    role: '',
    assignedRSO: '',
  });
  const [checkerData, setCheckerData] = useState({
    id: '',
    email: '',
    fullName: '',
    role: '',
    assignedRSO: '',
  });

  // Delete Modal State
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [actionModalClicked, setActionModalClicked] = useState(false);
  const [storeRowData, setStoreRowData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [deleteModalData, setDeleteModalData] = useState({
    id: '',
    fullName: '',
  });

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setLoading(false);
      }, 5000); // 5 seconds
    }
    return () => clearTimeout(timer);
  }, [loading]);

  const handleOpenUserModal = (row) => {
    console.log("row is ", row);
    setSelectedUserId(row.applicantData?._id);
    const rawPages = row?.applicantData?.answers?.pages || [];

    if (!row || !row.applicantData) {
      toast.error("Applicant data is missing or incomplete.");
      return;
    }

    const pages = rawPages.map((page, pIdx) => ({
      pageIndex: pIdx,
      title: page?.name || `Page ${pIdx + 1}`,
      elements: (page?.elements || []).map((e, eIdx) => ({
        elementIndex: eIdx,
        title: e?.title || `Question ${eIdx + 1}`,
        answer: (e?.answer && Array.isArray(e.answer))
          ? e.answer.join(", ")
          : (e?.answer ?? "N/A"),
      }))
    }));

    // setUserModalData({
    //   email: row.email || "",
    //   fullName: row.fullName || "",
    //   id: row.id,
    //   applicationId: row.applicantData?._id || undefined,
    //   index: row.index,
    //   pages
    // });
    setIsUserModalOpen(true);
  };



  const handleApproveMembership = () => {

    approveMembership({ id: userModalData.applicationId, approval: true }, {
      onSuccess: () => {
        refetchApplicants();
        // Optionally close the modal or give feedback
        toast.success("Membership approved successfully");
        setIsUserModalOpen(false);
      },
      onError: (error) => {
        console.error("Error approving membership:", error);
        toast.error("Failed to approve membership. Please try again.");
      }

    })
  }

  const handleRejectMembership = () => {
    console.log("Reject Membership clicked for user ID:", userModalData.applicationId);
    // Implement reject logic here
    approveMembership({ id: userModalData.applicationId, approval: false }, {
      onSuccess: () => {
        refetchApplicants();
        toast.success("Membership rejected successfully");
        setIsUserModalOpen(false);
      },
      onError: (error) => {
        console.error("Error rejecting membership:", error);
        toast.error("Failed to reject membership. Please try again.");
      }
    })
  }

  console.log("editModalData is ", editModalData.assignedRSO);

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
  };

  const handleFilterChange = (value) => {
    console.log("Filter changed to:", value);

    if (value == "Student") {
      setFilters((prev) => ({
        ...prev,
        role: 'student',
        isDeleted: false,
        page: 1,
      }));
    }
    if (value == "RSO") {
      setFilters((prev) => ({
        ...prev,
        role: 'rso_representative',
        isDeleted: false,
        page: 1, // Reset to first page on filter change
      }));
    }

    if (value == "Deleted Accounts") {
      setFilters((prev) => ({
        ...prev,
        role: "",
        isDeleted: true,
        page: 1, // Reset to first page on filter change
      }));
    }

    if (value == "All") {
      setFilters((prev) => ({
        role: "",
        limit: 10,
        page: 1,
        isDeleted: false,
      }));
    }
  }

  const handleSuperAdminFilterChange = (value) => {
    console.log("Filter changed to:", value);

    if (value == "Admin") {
      setFilters((prev) => ({
        ...prev,
        role: 'admin',
        page: 1,
        isDeleted: false,
      }));
    }
    if (value == "Coordinator") {
      setFilters((prev) => ({
        ...prev,
        role: 'coordinator',
        isDeleted: false,
        page: 1,
      }));
    }
    if (value == "Director") {
      setFilters((prev) => ({
        ...prev,
        role: 'director',
        isDeleted: false,
        page: 1,
      }));
    }

    if (value == "Super Admin") {
      setFilters((prev) => ({
        ...prev,
        role: 'super_admin',
        isDeleted: false,
        page: 1,
      }));
    }

    if (value == "AVP") {
      setFilters((prev) => ({
        ...prev,
        role: 'avp',
        isDeleted: false,
        page: 1,
      }));
    }

    if (value == "Deleted Accounts") {
      setFilters((prev) => ({
        ...prev,
        isDeleted: true,
        page: 1,
      }));
    }

    if (value == "All") {
      setFilters((prev) => ({
        ...prev,
        role: "",
        isDeleted: false,
        page: 1,
      }));
    }
  }

  const handleLimitChange = (newLimit) => {
    setFilters((prev) => ({
      ...prev,
      limit: Number(newLimit),
      page: 1,
    }));
  };

  const handlePageChange = (newPage) => {
    if (sdaoAccounts?.query.remainingPages === 0) return;
    console.log("Page changed to:", newPage);
    setFilters((prev) => ({
      ...prev,
      page: newPage,
    }));
  };


  // Handlers for edit and delete modals
  const handleEditClick = (row) => {
    setEditModalData({
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      role: row.role,
      assignedRSO: row.assignedRSO,
    });

    setCheckerData({
      id: row.id,
      email: row.email,
      fullName: row.fullName,
      role: row.role,
      assignedRSO: row.assignedRSO,
    });
    setIsEditModalOpen(true);
  };

  const handleActionClick = (row, { type } = {}) => {
    console.log("Action clicked:", type, "for row:", row);

    if (type === 'restore' && !row || type === 'restore' && !row.id) {
      toast.error("User data is missing or incomplete.");
      setLoading(false);
      return;
    }

    if (!storeRowData && type !== 'restore') {
      setLoading(false);
      toast.error("No action data stored. Please try again.");
      return;
    }

    const softDeleteOnRole = !isSuperAdmin ? softDeleteStudentAccount : softDeleteAdminAccount;
    const restoreOnRole = !isSuperAdmin ? restoreStudentAccount : restoreAdminAccount;
    const hardDeleteOnRole = !isSuperAdmin ? hardDeleteStudentAccount : hardDeleteAdminAccount;

    if (type === 'restore' || storeRowData?.type === 'restore') {
      toast.success("Restore action clicked");
      restoreOnRole(row.id, {
        onSuccess: () => {
          toast.success("User restored successfully.");
          setStoreRowData(null);
          setLoading(false);
          if (isSuperAdmin) {
            refetchAccounts();
          } else {
            refetchUsersData();
          }
        },
        onError: (error) => {
          setLoading(false);
          toast.error("Failed to restore user.");
        }
      });

    } else if (storeRowData.type === 'soft-delete') {
      toast.success("Soft delete action clicked");
      softDeleteOnRole(storeRowData.row.id, {
        onSuccess: () => {
          toast.success("User soft deleted successfully.");
          setStoreRowData(null);
          setLoading(false);
          setActionModalClicked(false);
          if (isSuperAdmin) {
            refetchAccounts();
          } else {
            refetchUsersData();
          }
        },
        onError: (error) => {
          setLoading(false);
          toast.error("Failed to soft delete user.");
        }
      });
    } else if (storeRowData.type === 'hard-delete') {
      toast.success("Hard delete action clicked");
      hardDeleteOnRole(storeRowData.row.id, {
        onSuccess: () => {
          toast.success("User hard deleted successfully.");
          setStoreRowData(null);
          setActionModalClicked(false);
          setLoading(false);
          if (isSuperAdmin) {
            refetchAccounts();
          } else {
            refetchUsersData();
          }
        },
        onError: (error) => {
          setLoading(false);
          toast.error("Failed to hard delete user.");
        }
      });
    }

    // setDeleteModalData({
    //   id: row.id,
    //   fullName: row.fullName,
    // });
    // setIsDeleteModalOpen(true);
  };

  const handleModalOpen = (row, { type } = {}) => {
    setStoreRowData({ row, type });
    console.log("handleModalOpen called with row:", row, "and type:", type);

    if (type === 'restore') {
      handleActionClick(row, { type: 'restore' });
    } else {
      setActionModalClicked(true);
    }

  }

  useEffect(() => {
    console.log("storeRowData changed to:", storeRowData?.row?.id);

  }, [storeRowData]);

  const closeEditModal = () => { setIsEditModalOpen(false) };
  const closeDeleteModal = () => setIsDeleteModalOpen(false);

  const rsoOptions = rsoData?.rsos?.map(r => ({
    value: r.rsoId,
    label: r.RSO_snapshot?.acronym
  }));

  const roleOptions = [
    { value: 'student', label: 'Student' },
    { value: 'rso_representative', label: 'RSO Representative' },
  ];

  const roleSDAOOptions = [
    { value: 'admin', label: 'Admin' },
    { value: 'coordinator', label: 'Coordinator' },
    { value: 'director', label: 'Director' },
    { value: 'avp', label: 'AVP' },
    { value: 'super_admin', label: 'Super Admin' }
  ];

  const handleSaveEdit = () => {
    try {
      // Prepare the data to be sent to the server
      const removeRSO = editModalData.role !== 'rso_representative' ? true : false;


      const updatedData = {
        id: editModalData.id,
        role: editModalData.role,
        ...(!isSuperAdmin && {
          assignedRSO: removeRSO ? '' : editModalData.assignedRSO,
        }),

      };

      // don't continue if role is rso representative and assignedRSO is empty
      if (editModalData.role === 'rso_representative' && !editModalData.assignedRSO) {
        setLoading(false);
        toast.error("Please assign an RSO to the RSO Representative.");
        return;
      }

      // don't continue if no changes were made
      if (checkerData.role === editModalData.role && checkerData.assignedRSO === editModalData.assignedRSO) {
        setLoading(false);
        toast.info("No changes were made.");
        setIsEditModalOpen(false);
        return;
      }
      if (isSuperAdmin) {
        updateAdminRole({ userId: updatedData.id, role: updatedData.role }, {
          onSuccess: () => {
            toast.success("User updated successfully.");
            setIsEditModalOpen(false);
            setCheckerData({
              id: '',
              email: '',
              fullName: '',
              role: '',
              assignedRSO: '',
            });
            setLoading(false);
            refetchAccounts();
          },
          onError: (error) => {
            setLoading(false);
            console.error("Error updating user:", error);
            toast.error("Failed to update user. Please try again.");
          }
        });
      }
      if (isCoordinator || isUserAdmin) {
        updateUserMutate({ userId: updatedData.id, userData: updatedData }, {
          onSuccess: () => {
            toast.success("User updated successfully.");
            setIsEditModalOpen(false);
            setCheckerData({
              id: '',
              email: '',
              fullName: '',
              role: '',
              assignedRSO: '',
            });
            setLoading(false);
            refetchUsersData();
          },
          onError: (error) => {
            console.error("Error updating user:", error);
            toast.error("Failed to update user. Please try again.");
            setLoading(false);
          }
        });
      }
    } catch (error) {
      console.error("Error in handleSaveEdit:", error);
      toast.error("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }

  }

  const handleDeleteUser = () => {
    try {
      if (isSuperAdmin) {
        hardDeleteAdminAccount(deleteModalData.id, {
          onSuccess: () => {
            toast.success("User deleted successfully.");
            setIsDeleteModalOpen(false);
            setDeleteModalData({
              id: '',
              fullName: '',
            });
            refetchAccounts();
            setLoading(false);
          },
          onError: (error) => {
            console.error("Error deleting user:", error);
            toast.error("Failed to delete user. Please try again.");
            setLoading(false);
          }
        });
      }

      if (isUserAdmin || isCoordinator) {
        hardDeleteStudentAccount(deleteModalData.id, {
          onSuccess: () => {
            toast.success("User hard deleted successfully.");
            setIsDeleteModalOpen(false);
            setDeleteModalData({
              id: '',
              fullName: '',
            });
            refetchUsersData();
            setLoading(false);
          },
          onError: (error) => {
            console.error("Error hard deleting user:", error);
            toast.error("Failed to delete user. Please try again.");
            setLoading(false);
          }
        });
      }

    } catch (error) {
      console.error("Error hard deleting user:", error);
      setLoading(false);
      toast.error("Failed to hard delete user. Please try again.");
    } finally {
      setLoading(false);
      setIsDeleteModalOpen(false);
      setDeleteModalData({
        id: '',
        fullName: '',
      });
    }

  }

  const tabs = [
    { label: "Applicants" },
    { label: "Members" }
  ]

  return (
    <>
      <div className="flex flex-col min-h-[400px]">
        {/* --- Header Banner --- */}
        <div className="mb-6">
          <div className="flex justify-end gap-4 w-full">
            {
              isSuperAdmin && (
                <Button onClick={openModal}>
                  Create User
                </Button>
              )
            }
          </div>
        </div>

        {/* table for admin & super admin */}
        {(isUserAdmin || isCoordinator) && (
          <>
            <ReusableTable
              options={["All", "Student", "RSO", "Deleted Accounts"]}
              totalData={usersData ? usersData?.total : 0}
              onChange={(e) => handleFilterChange(e.target.value)}
              tableRow={adminTableRow || []}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              placeholder={"Search a user"}
              tableHeading={tableAdminHeading()}
              isLoading={isUsersLoading || accountsLoading}
              onEditClick={handleEditClick}
              onActionClick={handleModalOpen}
              columnNumber={6}
              limit={filters.limit}
              page={filters.page}
              onLimitChange={handleLimitChange}
              onPageChange={handlePageChange}
              pageNumber={usersData?.query?.remainingPages || null}
            />

          </>
        )}
        {isSuperAdmin && (
          <>
            <ReusableTable
              options={["All", "Admin", "Coordinator", "Director", "AVP", "Super Admin", "Deleted Accounts"]}
              totalData={usersData ? usersData?.total : 0}
              onChange={(e) => handleSuperAdminFilterChange(e.target.value)}
              tableRow={superAdminTableRow || []}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              placeholder={"Search a user"}
              tableHeading={tableSuperAdminHeading()}
              isLoading={isUsersLoading || accountsLoading}
              onEditClick={handleEditClick}
              onActionClick={handleModalOpen}
              columnNumber={6}
              limit={filters.limit}
              page={filters.page}
              onLimitChange={handleLimitChange}
              onPageChange={handlePageChange}
              pageNumber={usersData?.query?.remainingPages || null}
            />

          </>
        )}
        {isUserRSORepresentative && (
          <>
            {/* redesigned banner (using membership data from old banner) */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg px-6 py-4 shadow-sm flex items-start gap-3 mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M12 20a8 8 0 100-16 8 8 0 000 16z" />
              </svg>
              <div className="flex flex-col">
                <span className="text-blue-800 font-semibold text-base">RSO Membership</span>
                <div className='mt-1 flex flex-col sm:flex-row sm:items-center gap-2'>
                  <span className="inline-flex items-center gap-2 text-blue-700 text-xs">
                    <span className={`w-2 h-2 rounded-full ${rsoDetails?.rso?.yearlyData?.RSO_membershipStatus === true ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>
                      Membership Status: {" "}
                      <span className={`font-semibold ${rsoDetails?.rso?.yearlyData?.RSO_membershipStatus === true ? 'text-green-700' : 'text-red-700'}`}>
                        {rsoDetails?.rso?.yearlyData?.RSO_membershipStatus === true ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </span>
                  {rsoDetails?.rso?.yearlyData?.RSO_membershipEndDate && (
                    <div className='hidden sm:block h-4 w-px bg-blue-200'></div>
                  )}
                  {rsoDetails?.rso?.yearlyData?.RSO_membershipEndDate && (
                    <span className="text-blue-700 text-xs">
                      End Date: {" "}
                      <span className="font-semibold text-blue-900">{FormatDate(rsoDetails?.rso?.yearlyData?.RSO_membershipEndDate)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* show error if rso membership is inactive */}
            {rsoDetails?.rso?.yearlyData?.RSO_membershipStatus === false && (
              <div className="mt-4 text-red-600">
                <p className="text-sm">RSO Membership is currently inactive. You are not allowed to update user membership.</p>
              </div>
            )}

            <TabSelector tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />

            {/* table for rso representative */}
            {activeTab === 0 && (
              <ReusableTable
                options={["All", "Student", "RSO", "Deleted Accounts"]}
                showDropdown={false}
                tableRow={tableRowFiltered}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                placeholder={"Search a user"}
                onClick={handleOpenUserModal}
                tableHeading={tableHeading()}
                isLoading={isLoadingApplicants}
                columnNumber={3}
              >

              </ReusableTable>
            )}

            {activeTab === 1 && (
              <ReusableTable
                showDropdown={false}
                tableRow={rsoMembersTableRow || []}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                placeholder={"Search a user"}
                isLoading={isLoadingMembers}
                // onClick={() => console.log("member clicked")}
                columnNumber={1}
                tableHeading={membersTableRow()}
              ></ReusableTable>
            )}
          </>
        )}

      </div>

      {/* Edit Modal */}
      <AnimatePresence>
        {isEditModalOpen && (
          <>
            <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" />
            <motion.div
              className="fixed inset-0 z-50 w-screen overflow-auto flex items-center justify-center p-4"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="bg-white rounded-lg w-full max-w-md shadow-lg flex flex-col gap-6 p-6 max-h-[85vh] overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-[#312895]">Edit User</h2>
                  <CloseButton onClick={closeEditModal} />
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Full Name</label>
                    <input className="w-full border rounded px-2 py-1 mt-1" value={editModalData.fullName} readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input className="w-full border rounded px-2 py-1 mt-1" value={editModalData.email} readOnly />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    {/* <input className="w-full border rounded px-2 py-1 mt-1" value={editModalData.role} readOnly /> */}
                    {(isSuperAdmin) ? (
                      <ReusableDropdown
                        options={roleSDAOOptions}
                        value={editModalData.role}
                        onChange={e => setEditModalData({ ...editModalData, role: e.target.value || '' })}
                      />
                    ) : (
                      <ReusableDropdown
                        options={roleOptions}
                        value={editModalData.role}
                        onChange={e => setEditModalData({ ...editModalData, role: e.target.value || '' })}
                      />
                    )}

                  </div>
                  {!isSuperAdmin && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Assigned RSO</label>
                      {/* <input className="w-full border rounded px-2 py-1 mt-1" value={editModalData.assignedRSO} readOnly /> */}
                      <Select
                        defaultValue={rsoOptions?.find(opt => opt.label === editModalData.assignedRSO) || null}
                        options={rsoOptions}
                        isDisabled={editModalData.role === 'rso_representative' ? false : true}
                        onChange={editModalData.role === 'rso_representative' ? (e => setEditModalData({ ...editModalData, assignedRSO: e?.value || '' })) : (e => setEditModalData({ ...editModalData, assignedRSO: '' || '' }))}
                        menuPortalTarget={document.body}
                        styles={{
                          menuPortal: base => ({ ...base, zIndex: 9999 })
                        }}
                      />
                    </div>
                  )}
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button style="secondary" onClick={closeEditModal}>Close</Button>
                  <Button onClick={() => { handleSaveEdit(); setLoading(true); }} disabled={loading}>{loading ? <LoadingSpinner /> : "Save"}</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Delete Modal */}
      <AnimatePresence>
        {isDeleteModalOpen && (
          <>
            <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" />
            <motion.div
              className="fixed inset-0 z-50 w-screen overflow-auto flex items-center justify-center p-4"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="bg-white rounded-lg w-full max-w-sm shadow-lg flex flex-col gap-6 p-6 max-h-[85vh] overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-[#b91c1c]">Delete User</h2>
                  <CloseButton onClick={closeDeleteModal} />
                </div>
                <div className="space-y-4">
                  <p className="text-gray-700">Are you sure you want to delete <span className="font-semibold">{deleteModalData.fullName}</span>?</p>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button style="secondary" onClick={closeDeleteModal}>Cancel</Button>
                  <Button style="danger" onClick={() => { handleDeleteUser(); setLoading(true); }} disabled={loading}>{loading ? <LoadingSpinner /> : "Delete"}</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence
        initial={false}
        exitBeforeEnter={true}
        onExitComplete={() => null}
      >
        {actionModalClicked && (
          <>
            <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" />
            <motion.div
              className="fixed inset-0 z-50 w-screen overflow-auto flex items-center justify-center p-4"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="bg-white rounded-lg w-full max-w-sm shadow-lg flex flex-col gap-6 p-6 max-h-[85vh] overflow-hidden">
                <div className="flex items-center justify-between mb-2">
                  <h2 className="text-lg font-semibold text-[#b91c1c]">{`${storeRowData?.type === 'soft-delete' ? '' : 'Permanently'} Delete User`}</h2>
                  <CloseButton onClick={() => setActionModalClicked(false)} />
                </div>
                <div className="space-y-4">
                  <p className="text-gray-700">Are you sure you want to delete this account?</p>
                </div>
                <div className="flex justify-end gap-2 mt-4">
                  <Button style="secondary" onClick={() => setActionModalClicked(false)}>Cancel</Button>
                  <Button style="danger" onClick={() => { handleActionClick(); setLoading(true); }} disabled={loading}>{loading ? <LoadingSpinner /> : "Delete"}</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence
        initial={false}
        exitBeforeEnter={true}
        onExitComplete={() => null}
      >
        {isOpen && (
          <CreateUserModal closeModal={closeModal} />

        )}
      </AnimatePresence>

      {/* review applicants modal */}
      <FormReviewModal
        userModalData={userModalData}
        isOpen={isUserModalOpen}
        onClose={() => setIsUserModalOpen(false)}
      />

    </>
  );


}