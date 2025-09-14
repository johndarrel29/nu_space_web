import { useState, useMemo, memo } from "react";
import { Table, Searchbar, CreateUserModal, ReusableTable, Button, Backdrop, CloseButton } from "../../../components";
import { useModal, useRSO, useUserProfile, useRSOUsers } from "../../../hooks";
import { motion, AnimatePresence } from "framer-motion";
import { DropIn } from "../../../animations/DropIn";
import { FormatDate } from "../../../utils";
import { useUserStoreWithAuth } from "../../../store";
import { toast } from "react-toastify";

// approval status fix
// it returns rejected even if its approved
// doesnt refetch after approving

// todo: fix mapping of the json.

//add error preferrably from query

// function to handle the search and filter
const UserFilter = memo(({ searchQuery, setSearchQuery, setSelectedRole, selectedRole, openModal }) => {

  const { isUserRSORepresentative, isUserAdmin, isSuperAdmin, isCoordinator, isDirector, isAVP } = useUserStoreWithAuth();
  return (
    <>
      {/* button to open create user modal */}
      {(isSuperAdmin) && (
        <div>
          <Button onClick={openModal}>Create User</Button>
        </div>
      )}

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

    approveMembership({ id: userModalData.applicationId }, {
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

  const handleCloseUserModal = () => {
    setIsUserModalOpen(false);
  };

  return (
    <>
      <div className="flex flex-col">

        {/* table for admin & super admin */}
        {(isUserAdmin || isCoordinator || isSuperAdmin) && (
          <>
            <UserFilter searchQuery={searchQuery} setSearchQuery={setSearchQuery} setSelectedRole={setSelectedRole} openModal={openModal} />
            <Table
              searchQuery={searchQuery}
              selectedRole={selectedRole} />
          </>
        )}
        {isUserRSORepresentative && (
          <>
            <div className="flex items-center gap-6 w-full justify-start bg-white border border-mid-gray p-6 rounded-md">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${userProfile?.rso?.yearlyData?.RSO_membershipStatus === true ? 'bg-green-500' : 'bg-red-500'}`}></div>
                <h1 className="text-gray-700 font-medium">Membership Status: <span className={`font-semibold ${userProfile?.rso?.yearlyData?.RSO_membershipStatus === true ? 'text-green-600' : 'text-red-600'}`}>{userProfile?.rso?.yearlyData?.RSO_membershipStatus === true ? "Active" : "Inactive"}</span></h1>
              </div>
              <div className="h-6 w-px bg-gray-200"></div>
              {userProfile?.rso?.yearlyData?.RSO_membershipEndDate && (
                <div className="flex items-center gap-2">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                  </svg>
                  <h1 className="text-gray-700 font-medium">End Date: <span className="font-semibold text-gray-900">{FormatDate(userProfile?.rso?.yearlyData?.RSO_membershipEndDate)}</span></h1>
                </div>
              )}
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
                        <Button
                          onClick={handleApproveMembership}
                          className="w-full"
                        >
                          Approve Membership
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