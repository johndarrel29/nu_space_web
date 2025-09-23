import { AnimatePresence, motion } from "framer-motion";
import { memo, useMemo, useState } from "react";
import { toast } from "react-toastify";
import { DropIn } from "../../../animations/DropIn";
import { Backdrop, Button, CloseButton, CreateUserModal, ReusableTable, Searchbar, Table } from "../../../components";
import { useModal, useRSO, useRSOUsers, useUserProfile } from "../../../hooks";
import { useUserStoreWithAuth } from "../../../store";
import { FormatDate } from "../../../utils";

// approval status fix
// it returns rejected even if its approved
// doesnt refetch after approving

// todo: fix mapping of the json.

//add error preferrably from query

// function to handle the search and filter
// Lightweight filter bar (search + role dropdown). Create button moved to main header banner.
const UserFilter = memo(({ searchQuery, setSearchQuery, setSelectedRole, selectedRole }) => {

  const { isUserRSORepresentative, isUserAdmin, isSuperAdmin, isCoordinator, isDirector, isAVP } = useUserStoreWithAuth();
  return (
    <>
      {/* search query */}
      <div className="mt-4 w-full flex flex-col space-x-0 md:flex-row md:space-x-2 md:space-y-0 sm:flex-col sm:space-y-2 sm:space-x-0">
        <div className="w-full lg:w-full md:w-full">
          <label
            htmlFor="roleFilter"
            className="block mb-2 text-sm font-medium text-gray-600 dark:text-white"
          >
            Search
          </label>
          <Searchbar
            placeholder="Search a user"
            searchQuery={searchQuery || ''}
            setSearchQuery={setSearchQuery}
          />
        </div>

        {/* dropdown role filter */}
        <div className="w-full lg:w-1/2 md:w-full">
          <label
            htmlFor="roleFilter"
            className="block mb-2 mt-2 md:mt-0 text-sm font-medium text-gray-600 dark:text-white"
          >
            Filter by Role
          </label>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="w-full h-10 border border-mid-gray rounded-md p-1 bg-textfield focus:outline-none focus:ring-off-black  focus:ring-1"
          >
            <option value="">All</option>
            {(isUserAdmin || isCoordinator) && (
              <>
                <option value="student">Student</option>
                <option value="rso_representative">RSO Representative</option>
              </>
            )}
            {(isSuperAdmin) && (
              <>
                <option value="admin">Admin</option>
                <option value="coordinator">Coordinator</option>
                <option value="super_admin">Super Admin</option>
              </>
            )}
          </select>
        </div>
      </div>


    </>


  );
});

export default function Users() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState("");
  const { isOpen, openModal, closeModal } = useModal();
  const user = JSON.parse(localStorage.getItem("user"));
  const { userProfile } = useUserProfile();
  const { isUserRSORepresentative, isUserAdmin, isSuperAdmin, isCoordinator, isDirector, isAVP } = useUserStoreWithAuth();

  const {
    rsoMembers,
    isErrorFetchingMembers,
    errorFetchingMembers,
    isRefetchingMembers,
    refetchMembers,

    rsoApplicants,
    isErrorFetchingApplicants,
    errorFetchingApplicants,
    isRefetchingApplicants,
    refetchApplicants,

    approveMembership,
    isApprovingMembership,
    isErrorApprovingMembership,
    errorApprovingMembership,
    isSuccessApprovingMembership,
  } = useRSOUsers();

  console.log("and the applicants are ", rsoApplicants?.applicants?.map(applicant => ({
    forms: applicant.answers,
    studentInfo: applicant.studentId,
  })) || null);

  const {
    membersData,
  } = useRSO();

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

  console.log(" tableRow ", tableRow);

  function tableHeading() {
    return [
      { name: "Index", key: "index" },
      { name: "Name", key: "fullName" },
      { name: "Approval Status", key: "approvalStatus" },
    ];
  }


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

  // --- Banner stats (mirroring Activities style) ---
  const totalApplicants = applicants.length;
  // Attempt to derive members count; fall back gracefully
  const totalMembers = (rsoMembers?.members && Array.isArray(rsoMembers.members))
    ? rsoMembers.members.length
    : (Array.isArray(rsoMembers) ? rsoMembers.length : 0);

  // Reusable small stat pill (kept local for simplicity)
  const StatPill = ({ label, value }) => (
    <div className="min-w-[110px] px-4 py-2 rounded-md border border-gray-200 bg-white shadow-sm">
      <p className="text-[10px] font-medium tracking-wide text-gray-500 uppercase">{label}</p>
      <p className="text-base font-semibold text-gray-900">{value}</p>
    </div>
  );

  const handleOpenUserModal = (row) => {
    console.log("row is ", row);
    const rawPages = row?.applicantData?.answers?.pages || [];


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
    console.log("Approve Membership clicked for user ID:", userModalData.applicationId);

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

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
  };

  return (
    <>
      <div className="flex flex-col">
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
        {(isUserAdmin || isCoordinator || isSuperAdmin) && (
          <>
            <UserFilter searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSelectedRole={setSelectedRole} />
            <Table
              searchQuery={searchQuery}
              selectedRole={selectedRole} />
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
                    <span className={`w-2 h-2 rounded-full ${userProfile?.rso?.yearlyData?.RSO_membershipStatus === true ? 'bg-green-500' : 'bg-red-500'}`}></span>
                    <span>
                      Membership Status: {" "}
                      <span className={`font-semibold ${userProfile?.rso?.yearlyData?.RSO_membershipStatus === true ? 'text-green-700' : 'text-red-700'}`}>
                        {userProfile?.rso?.yearlyData?.RSO_membershipStatus === true ? 'Active' : 'Inactive'}
                      </span>
                    </span>
                  </span>
                  {userProfile?.rso?.yearlyData?.RSO_membershipEndDate && (
                    <div className='hidden sm:block h-4 w-px bg-blue-200'></div>
                  )}
                  {userProfile?.rso?.yearlyData?.RSO_membershipEndDate && (
                    <span className="text-blue-700 text-xs">
                      End Date: {" "}
                      <span className="font-semibold text-blue-900">{FormatDate(userProfile?.rso?.yearlyData?.RSO_membershipEndDate)}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* show error if rso membership is inactive */}
            {userProfile?.rso?.yearlyData?.RSO_membershipStatus === false && (
              <div className="mt-4 text-red-600">
                <p className="text-sm">RSO Membership is currently inactive. You are not allowed to update user membership.</p>
              </div>
            )}

            {/* table for rso representative */}
            <ReusableTable
              options={["All", "Student", "RSO"]}
              tableRow={tableRowFiltered}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              placeholder={"Search a user"}
              onClick={handleOpenUserModal}
              tableHeading={tableHeading()}
              isLoading={isRefetchingMembers}
              columnNumber={3}
            >

            </ReusableTable>
          </>
        )}

      </div>

      {/* User Info Modal */}
      <AnimatePresence>
        {isUserModalOpen && (
          <>
            <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-30" />
            <motion.div
              className="fixed inset-0 z-50 w-screen overflow-auto flex items-center justify-center p-4"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="bg-white rounded-lg w-full max-w-[95%] sm:max-w-3xl md:max-w-5xl shadow-lg flex flex-col md:flex-row gap-6 p-6 sm:p-8 max-h:[85vh] md:max-h-[85vh] overflow-hidden">
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
                      <Button
                        onClick={handleApproveMembership}
                        className="w-full"
                      >
                        <div className="flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" className="size-4 text-off-black" viewBox="0 0 640 640"><path d="M530.8 134.1C545.1 144.5 548.3 164.5 537.9 178.8L281.9 530.8C276.4 538.4 267.9 543.1 258.5 543.9C249.1 544.7 240 541.2 233.4 534.6L105.4 406.6C92.9 394.1 92.9 373.8 105.4 361.3C117.9 348.8 138.2 348.8 150.7 361.3L252.2 462.8L486.2 141.1C496.6 126.8 516.6 123.6 530.9 134z" /></svg>
                          Approve Membership
                        </div>
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
                    <div>
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
    </>
  );


}