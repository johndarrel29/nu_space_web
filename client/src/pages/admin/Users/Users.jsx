import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
import Select from 'react-select';
import { toast } from "react-toastify";
import { DropIn } from "../../../animations/DropIn";
import { Backdrop, Button, CloseButton, CreateUserModal, ReusableDropdown, ReusableTable, TabSelector } from "../../../components";
import { useAdminRSO, useAdminUser, useModal, useRSODetails, useRSOUsers, useSuperAdminUsers } from "../../../hooks";
import { useUserStoreWithAuth } from "../../../store";
import { FormatDate } from "../../../utils";


export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const { isOpen, openModal, closeModal } = useModal();
  const { isUserRSORepresentative, isUserAdmin, isSuperAdmin, isCoordinator, isDirector, isAVP } = useUserStoreWithAuth();
  const [activeTab, setActiveTab] = useState(0);

  const [filters, setFilters] = useState({
    search: "",
    role: "",
    limit: 10,
    page: 1,
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
  } = useAdminRSO({ manualEnable: !isUserRSORepresentative ? true : false });

  useEffect(() => {
    setFilters((prev) => ({
      ...prev,
      search: searchQuery,
      page: 1, // Optionally reset page on new search
    }));
  }, [searchQuery]);
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
  } = useRSOUsers();

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
    deleteStudentAccount,
    isDeleteError,
    isDeleteLoading,
    isDeleteSuccess,
    deleteError,
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

    // SDAO delete
    deleteAdminAccount,
    isDeletingAccount,
    isDeleteAccountError,
    deleteErrorMessage,

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
  const [deleteModalData, setDeleteModalData] = useState({
    id: '',
    fullName: '',
  });

  const handleOpenUserModal = (row) => {
    console.log("row is ", row);
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

    setUserModalData({
      email: row.email || "",
      fullName: row.fullName || "",
      id: row.id,
      applicationId: row.applicantData?._id || undefined,
      index: row.index,
      pages
    });
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
        page: 1,
      }));
    }
    if (value == "RSO") {
      setFilters((prev) => ({
        ...prev,
        role: 'rso_representative',
        page: 1, // Reset to first page on filter change
      }));
    }

    if (value == "All") {
      setFilters((prev) => ({
        ...prev,
        role: "",
        page: 1, // Reset to first page on filter change
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
      }));
    }
    if (value == "Coordinator") {
      setFilters((prev) => ({
        ...prev,
        role: 'coordinator',
        page: 1,
      }));
    }
    if (value == "Director") {
      setFilters((prev) => ({
        ...prev,
        role: 'director',
        page: 1,
      }));
    }
    if (value == "AVP") {
      setFilters((prev) => ({
        ...prev,
        role: 'avp',
        page: 1,
      }));
    }

    if (value == "All") {
      setFilters((prev) => ({
        ...prev,
        role: "",
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

  const handleDeleteClick = (row) => {
    setDeleteModalData({
      id: row.id,
      fullName: row.fullName,
    });
    setIsDeleteModalOpen(true);
  };

  const closeEditModal = () => setIsEditModalOpen(false);
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
      toast.error("Please assign an RSO to the RSO Representative.");
      return;
    }

    // don't continue if no changes were made
    if (
      checkerData.role === editModalData.role &&
      checkerData.assignedRSO === editModalData.assignedRSO
    ) {
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
          refetchAccounts();
        },
        onError: (error) => {
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

          refetchUsersData();
        },
        onError: (error) => {
          console.error("Error updating user:", error);
          toast.error("Failed to update user. Please try again.");
        }
      });
    }
  }

  const handleDeleteUser = () => {

    if (isSuperAdmin) {
      deleteAdminAccount(deleteModalData.id, {
        onSuccess: () => {
          toast.success("User deleted successfully.");
          setIsDeleteModalOpen(false);
          setDeleteModalData({
            id: '',
            fullName: '',
          });
          refetchAccounts();
        },
        onError: (error) => {
          console.error("Error deleting user:", error);
          toast.error("Failed to delete user. Please try again.");
        }
      });
    }

    if (isUserAdmin || isCoordinator) {
      deleteStudentAccount(deleteModalData.id, {
        onSuccess: () => {
          toast.success("User deleted successfully.");
          setIsDeleteModalOpen(false);
          setDeleteModalData({
            id: '',
            fullName: '',
          });
          refetchUsersData();
        },
        onError: (error) => {
          console.error("Error deleting user:", error);
          toast.error("Failed to delete user. Please try again.");
        }
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
              options={["All", "Student", "RSO"]}
              totalData={usersData ? usersData?.total : 0}
              onChange={(e) => handleFilterChange(e.target.value)}
              tableRow={adminTableRow || []}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              placeholder={"Search a user"}
              tableHeading={tableAdminHeading()}
              isLoading={isUsersLoading || accountsLoading}
              onEditClick={handleEditClick}
              onActionClick={handleDeleteClick}
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
              options={["All", "Admin", "Coordinator", "Director", "AVP"]}
              totalData={usersData ? usersData?.total : 0}
              onChange={(e) => handleSuperAdminFilterChange(e.target.value)}
              tableRow={superAdminTableRow || []}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              placeholder={"Search a user"}
              tableHeading={tableSuperAdminHeading()}
              isLoading={isUsersLoading || accountsLoading}
              onEditClick={handleEditClick}
              onActionClick={handleDeleteClick}
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
                options={["All", "Student", "RSO"]}
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
                  <Button onClick={handleSaveEdit}>Save</Button>
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
                  <Button style="danger" onClick={handleDeleteUser}>Delete</Button>
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
      <AnimatePresence>
        {isUserModalOpen && (
          <>
            <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" />
            <motion.div
              className="fixed inset-0 z-50 w-screen overflow-auto"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="fixed inset-0 flex items-start justify-center z-50 p-8">
                <div className="bg-white rounded-lg w-full max-w-5xl shadow-lg flex flex-col md:flex-row gap-6 p-8 max-h-[85vh] overflow-hidden">
                  {/* Main Content: Form Review */}
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between mb-6">
                      <h2 className="text-xl font-semibold text-[#312895]">Application Review</h2>
                    </div>
                    {/* Scrollable responses container */}
                    <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar max-h-[70vh]">
                      {userModalData.pages.length === 0 && (
                        <p className="text-sm text-gray-500">No responses available.</p>
                      )}
                      {/* Pages rendered as form sections */}
                      {userModalData.pages.map((page) => (
                        <div
                          key={page.pageIndex}
                          className="border border-gray-200 rounded-lg p-5 bg-white shadow-sm"
                        >
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-sm font-semibold text-gray-800 capitalize">
                              {page.title || `Untitled Page`}
                            </h3>
                            <span className="text-[11px] px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-600 border border-indigo-100">
                              {page.elements.length} item{page.elements.length !== 1 && 's'}
                            </span>
                          </div>
                          {page.elements.length === 0 && (
                            <p className="text-sm text-gray-500 italic">No content available.</p>
                          )}
                          {page.elements.length > 0 && (
                            <dl className="divide-y divide-gray-100">
                              {page.elements.map((item, idx) => (
                                <div
                                  key={item.elementIndex || idx}
                                  className="py-3 grid grid-cols-12 gap-4"
                                >
                                  <dt className="col-span-12 md:col-span-5 text-[11px] font-medium uppercase tracking-wide text-gray-500">
                                    {item.title || `Question ${idx + 1}`}
                                  </dt>
                                  <dd
                                    className="col-span-12 md:col-span-7 text-sm text-gray-900 whitespace-pre-wrap break-words"
                                    title={item.answer}
                                  >
                                    {item.answer === "" || item.answer === null
                                      ? <span className="italic text-gray-400">No answer</span>
                                      : item.answer}
                                  </dd>
                                </div>
                              ))}
                            </dl>
                          )}
                        </div>
                      ))}
                    </div>

                  </div>

                  {/* Sidebar: Member Info + Actions */}
                  <div className="w-full md:w-72 flex-shrink-0">
                    <div className="w-full flex justify-end mb-4">
                      <CloseButton onClick={handleCloseUserModal} />
                    </div>
                    <div className="border border-gray-200 rounded-lg p-5 space-y-6">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-700 tracking-wide mb-3">Member Info</h3>
                        <table className="w-full text-sm">
                          <tbody>
                            <tr>
                              <td className="py-2 pr-4 text-gray-500 align-top">Full Name</td>
                              <td className="py-2 font-medium">{userModalData.fullName}</td>
                            </tr>
                            <tr>
                              <td className="py-2 pr-4 text-gray-500 align-top">Applicant No.</td>
                              <td className="py-2 font-medium">{userModalData.index}</td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                      <div className="pt-4 border-t border-gray-200">
                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Action</h4>
                        <div className="flex flex-col gap-3">
                          <Button
                            onClick={handleApproveMembership}
                            className="w-full"
                          >
                            Approve Membership
                          </Button>
                          <Button
                            onClick={handleRejectMembership}
                            style={"secondary"}
                            className="w-full"
                          >
                            <div className="flex items-center justify-center gap-2">
                              <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-off-black" viewBox="0 0 640 640"><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" /></svg>
                              Reject Membership
                            </div>
                          </Button>
                        </div>
                      </div>
                      <div className="pt-4 border-t border-mid-gray">
                        <Button
                          onClick={handleCloseUserModal}
                          style="secondary"
                          className="w-full"
                        >
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );


}