'use client'

import { AnimatePresence } from "framer-motion";
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import 'react-loading-skeleton/dist/skeleton.css';
import { toast } from 'react-toastify';
import { ActionModal, CardSkeleton, TableRow } from '../../components';
import { useAuth } from "../../context/AuthContext";
import { useAdminUser, useModal, useSuperAdminUsers } from "../../hooks";
import { useUserStoreWithAuth } from "../../store";

// Table Component
const Table = React.memo(({ searchQuery, selectedRole }) => {

  const [mode, setMode] = useState('delete');
  const { usersData, isUsersLoading, updateUserMutate, deleteStudentAccount, error, refetch, isLoading, refetchAdminProfile, refetchUsersData } = useAdminUser();
  const { sdaoAccounts, createAccount, deleteAdminAccount, updateAdminRole, refetchAccounts, accountsLoading } = useSuperAdminUsers();

  const { isUserRSORepresentative, isUserAdmin, isSuperAdmin, isCoordinator, isDirector, isAVP } = useUserStoreWithAuth();
  const [selectedUser, setSelectedUser] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [postsPerPage, setPostsPerPage] = useState(10);
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const { isOpen, openModal, closeModal } = useModal();
  const [success, setSuccess] = useState(false);
  const [filterError, setFilterError] = useState(null);
  const { user } = useAuth();
  const [tableData, setTableData] = useState([]);

  console.log("admin user data", usersData);

  // Effect to fetch accounts on first load
  useEffect(() => {
    const initialLoad = async () => {
      // Wait a bit to ensure auth state is fully loaded
      await new Promise(r => setTimeout(r, 100));

      if (isUserAdmin || isCoordinator) {
        await refetchAccounts();
      } else if (isSuperAdmin) {
        await refetchAdminProfile();
      }
    };

    initialLoad();
  }, []);

  // Effect to set table data based on user role
  useEffect(() => {
    if (isSuperAdmin) {
      setTableData(sdaoAccounts?.SDAOAccounts || []);
      return;
    }
    if (isUserAdmin || isCoordinator) {
      console.log("Admin user detected, using admin hook");
      setTableData(usersData || []);

      // Use admin hook
      console.log("Admin users:", usersData);
      return;
    }
  }, [user, isSuperAdmin, isUserAdmin, sdaoAccounts, usersData, isCoordinator]);

  console.log("Table Data:", tableData);

  // Makes the search query debounced so that it doesn't render on every key stroke
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedSearchQuery(searchQuery), 100);
    return () => clearTimeout(handler);
  }, [searchQuery]);

  const safeSearchQuery = debouncedSearchQuery || '';
  const indexOfLastPost = currentPage * postsPerPage;
  const indexOfFirstPost = indexOfLastPost - postsPerPage;

  const filteredRecords = useMemo(() => {
    try {
      console.log("users data:", tableData);
      setFilterError(null);

      if (!Array.isArray(tableData)) {
        console.error("Users is not an array:", tableData);

        return [];
      }

      return tableData.filter(user => {
        const matchesSearch = ['firstName', 'lastName', 'email'].some(field =>
          typeof user[field] === 'string' && user[field].toLowerCase().includes(safeSearchQuery.toLowerCase())
        );

        const matchesRole = !selectedRole ||
          (selectedRole === "student" ? user.role?.toLowerCase() === "student" :
            selectedRole === "rso_representative" ? user.role?.toLowerCase() === "rso_representative" :
              selectedRole === "admin" ? user.role?.toLowerCase() === "admin" :
                selectedRole === "coordinator" ? user.role?.toLowerCase() === "coordinator" :
                  selectedRole === "super_admin" ? user.role?.toLowerCase() === "super_admin" :
                    false
          );
        return matchesSearch && matchesRole;
      });
    } catch (error) {
      console.error(`Error filtering records: ${error.message}`);
      setFilterError(error.message);
      return [];
    }

  }, [tableData, safeSearchQuery, selectedRole]);

  const records = useMemo(() => {
    const indexOfLastPost = currentPage * postsPerPage;
    const indexOfFirstPost = indexOfLastPost - postsPerPage;
    return filteredRecords.slice(indexOfFirstPost, indexOfLastPost);
  }, [filteredRecords, currentPage, postsPerPage]);

  const npage = useMemo(() => Math.ceil(filteredRecords?.length / postsPerPage), [filteredRecords, postsPerPage]);

  const handleOpenModal = useCallback((mode, user) => {
    setSuccess(false);
    openModal();
    setMode(mode);
    setSelectedUser(user);
  }, []);

  const handleCloseModal = useCallback(() => {
    closeModal();
    setSelectedUser(null);
  }, []);

  // Handle confirm action received from ActionModal
  const handleConfirm = useCallback(async (_id, updatedData) => {
    console.log("handleConfirm called with ID:", _id, "and updatedData:", updatedData);

    if (updatedData) {
      console.log("updatedData role", updatedData.role)

      // If the role is being changed to 'student', ensure that assigned_rso is removed
      if (updatedData.role === 'student') {
        console.log("the first condition has been called")
        updatedData.category = null;
        updatedData.assignedRSO = null;
        updatedData.assigned_rso = null;
      }

      // If the role is 'rso_representative', ensure the category is assigned to assigned_rso
      if (updatedData.role === 'rso_representative' && updatedData.category) {
        console.log("the second condition has been called")
        updatedData.category = null;
        console.log("the updated data:", updatedData)
      }

      if (!['student', 'rso_representative'].includes(updatedData.role)) {
        console.log("the last condition has been called")
        // only pass role
        updatedData = { role: updatedData.role };
      }
    }

    try {
      if (updatedData) {
        // Update logic remains the same
        const updateUserOnRole = isUserAdmin || isCoordinator ? updateUserMutate : isSuperAdmin ? updateAdminRole : null;
        const refetchBasedOnRole = (isUserAdmin || isCoordinator) ? refetchUsersData : isSuperAdmin ? refetchAdminProfile : null;

        console.log("passing data: ", { userId: _id, role: updatedData.role });

        updateUserOnRole({ userId: _id, userData: updatedData }, {
          onSuccess: () => {
            console.log("User updated successfully");
            toast.success("User updated successfully");
            refetchBasedOnRole();
            closeModal();
          },
          onError: (error) => {
            console.error("Error updating user:", error);
            toast.error("Error updating user");
          },
        });
      } else {
        // Fixed delete logic - call the function directly
        if (isUserAdmin) {
          // Call deleteStudentAccount directly
          await deleteStudentAccount(_id, {
            onSuccess: () => {
              closeModal();
              console.log("User deleted successfully");
              toast.success("User deleted successfully");
            },
            onError: (error) => {
              console.error("Error deleting user:", error);
              toast.error("Error deleting user");
            }
          });
        } else if (isSuperAdmin) {
          // Call deleteAdminAccount directly
          await deleteAdminAccount(_id, {
            onSuccess: () => {
              closeModal();
              console.log("Admin account deleted successfully");
              toast.success("Admin account deleted successfully");
            },
            onError: (error) => {
              console.error("Error deleting admin account:", error);
              toast.error("Error deleting admin account");
            }
          });
        } else {
          throw new Error("No valid delete function available");
        }
      }
      // Refetch data after the operation
      setSuccess(true);
    } catch (error) {
      console.error("Error updating/deleting user:", error);
      toast.error("Error updating/deleting user");
    } finally {

      setSuccess(false);
    }
  }, [updateUserMutate, deleteStudentAccount, deleteAdminAccount, isUserAdmin, isSuperAdmin, updateAdminRole, closeModal]);


  const changePageNum = useCallback((page) => setPostsPerPage(Number(page)), []);
  const prePage = useCallback(() => setCurrentPage(prev => prev > 1 ? prev - 1 : prev), []);
  const nextPage = useCallback(() => setCurrentPage(prev => prev < npage ? prev + 1 : prev), [npage]);


  return (
    <div className=' min-w-full mt-2 sm:min-w-1/2 '>
      <AnimatePresence
        initial={false}
        exitBeforeEnter={true}
        onExitComplete={() => null}
      >
        {isOpen && (

          <ActionModal

            onClose={handleCloseModal}
            mode={mode}
            id={selectedUser?._id}
            name={selectedUser ? `${selectedUser.firstName} ${selectedUser.lastName}` : ''}
            createdAt={selectedUser?.createdAt}
            email={selectedUser?.email}
            role={selectedUser?.role}
            category={selectedUser?.assigned_rso?.RSO_acronym}
            user={selectedUser}
            onConfirm={handleConfirm}
            loading={isLoading}
            success={success}
          />
        )}
      </AnimatePresence>
      {console.log("Filtered Records:", filteredRecords)}

      <div className="flex justify-between items-center mb-4">
        <span className="text-gray-700 font-semibold">
          Showing {filteredRecords?.length} result{filteredRecords?.length !== 1 ? "s" : ""}
          {searchQuery && ` of ${safeSearchQuery}`}
        </span>
        <li className="flex justify-center ">
          <select
            className={`w-24 h-10 rounded-md bg-white border border-mid-gray p-1 font-bold  ${npage > 0 ? "text-off-black" : "text-gray-400 opacity-50"}`}
            onChange={(e) => changePageNum(e.target.value)}
            disabled={npage === 0}
          >
            <option value="10">10 rows</option>
            <option value="20">20 rows</option>
            <option value="50">50 rows</option>
          </select>
        </li>
      </div>
      {console.log("Table Data:", tableData)}
      {error ? (
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
            {typeof error === 'string' ? error : error?.message || 'An unknown error occurred'}
          </p>
        </div>
      ) : ((isUserAdmin || isCoordinator) ? isUsersLoading : accountsLoading) ? (
        <CardSkeleton />
      )
        : filterError ? (
          <div className="p-4 bg-red-50 text-red-600 rounded-lg flex flex-col items-center mb-4">
            <p className="text-red-500 font-medium text-center">
              Error filtering data: {filterError}
            </p>
          </div>
        ) :
          tableData?.length > 0 ? (
            <div className="w-full">
              <div className=' overflow-x-auto w-full border border-mid-gray rounded-md'>
                <table className=" lg:min-w-full divide-y divide-gray-200 rounded-md ">
                  <thead className="border-b border-mid-gray bg-textfield ">
                    <tr className='rounded-md text-left text-xs font-medium font-bold uppercase tracking-wider '>
                      <th scope="col" className='px-6 py-3'>
                        <div className="flex items-center justify-center">
                          Name
                        </div>
                      </th>
                      <th scope="col" className='px-6 py-3'>
                        <div className="flex items-center justify-center">
                          Date Created
                        </div>
                      </th>
                      <th scope="col" className='px-6 py-3'>
                        <div className="flex items-center justify-center">
                          Role
                        </div>
                      </th>
                      <th scope="col" className='px-6 py-3'>
                        {!isSuperAdmin && (
                          <div className="flex items-center justify-center">
                            Assigned RSO
                          </div>
                        )}
                      </th>
                      <th scope="col" className='px-6 py-3'>
                        <div className="flex items-center justify-center">
                          Actions
                        </div>
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-card-bg divide-y divide-gray-200">
                    {records?.length > 0 ? records?.map((user, index) => (


                      <TableRow key={index} userRow={user} onOpenModal={handleOpenModal} index={(currentPage - 1) * postsPerPage + index + 1} />
                    )) : (
                      <tr>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 text-center" colSpan={5}>
                          No records found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="p-4 bg-gray-50 text-gray-800 rounded-lg flex flex-col items-center mb-4">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-12 w-12 text-gray-400 mb-2"
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
              <p className="text-gray-800 font-medium text-center max-w-md px-4">
                No data available
              </p>
            </div>
          )}

      <div className='w-full bottom-20 mt-4'>
        <nav>
          <ul className="flex justify-center space-x-2">

            <li className={`page-item mx-1 px-3 py-2 bg-white border border-mid-gray rounded-md font-semibold rounded ${currentPage === 1 || npage === 0 ? "text-gray-400" : "text-gray-800"}`}>
              <button className='page-link' onClick={prePage}>Prev</button>
            </li>
            <div className="px-4 py-2 font-semibold">
              {npage > 0 ? `${currentPage} of ${npage}` : "0 of 0"}
            </div>
            <li className={`page-item mx-1 px-3 py-2 bg-white border border-mid-gray rounded-md font-semibold rounded ${currentPage === npage || npage === 0 ? "text-gray-400" : "text-gray-800"}`}>
              <button className='page-link' onClick={nextPage}>Next</button>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
});

export default Table;