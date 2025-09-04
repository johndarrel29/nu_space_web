import { useState, useEffect } from "react";
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from "framer-motion";
import { TabSelector, ReusableTable, Button, CloseButton } from "../../../components";
import { DropIn } from "../../../animations/DropIn";
import useSearchQuery from "../../../hooks/useSearchQuery";
import { useRSO, useKeyBinding, useAdminRSO } from "../../../hooks";
import { FormatDate, useNotification } from "../../../utils";
import Switch from '@mui/material/Switch';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { DemoContainer } from '@mui/x-date-pickers/internals/demo';
import { toast } from "react-toastify";
import { useAuth } from "../../../context/AuthContext";
import { CardSkeleton } from '../../../components';

dayjs.extend(utc);
dayjs.extend(timezone);

const tabs = [
  { label: "All" },
  { label: "Professional" },
  { label: "Professional & Affiliates" },
  { label: "Special Interest" },
];

export default function MainRSO() {
  const navigate = useNavigate();
  const { searchQuery, setSearchQuery } = useSearchQuery();
  const { token } = useAuth();

  // Admin RSO Hooks
  const {
    rsoData,
    isRSOLoading,
    isRSOError,
    rsoError,
    refetchRSOData,

    softDeleteRSOMutate,
    isSoftDeleteRSOLoading,
    isSoftDeleteRSOSuccess,
    isSoftDeleteRSOError,
    softDeleteRSOError,
    resetSoftDeleteRSO,
  } = useAdminRSO();


  // RSO data and operations
  const {
    organizations,
    error,
    loading,
    fetchData,
    createRSO,
    updateRSO,
    // rsoData,
    fetchWebRSOError,
    updateMembershipDateMutate,
    membershipDateData,
    closeMembershipDateMutate,
  } = useRSO();



  // State management
  const [activeTab, setActiveTab] = useState(0);
  const [sort, setSort] = useState("All");
  const [selectedUser, setSelectedUser] = useState(null);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState(false);
  const [date, setDate] = useState(new Date());
  const [membershipEndDate, setMembershipEndDate] = useState(null);

  // Process RSO data for table
  const rsoList = rsoData?.rsos ?? [];
  console.log("Processed RSO List:", rsoList);
  console.log("rso membership status: ", rsoList.map(org => org.RSO_membershipStatus));

  const tableRow = rsoList
    .filter(org => org.rsoId != null)
    .map((org) => {
      const snapshot = org.RSO_snapshot || {};

      // snapshot will remain but some of the details are from the first layer
      // on rso detail, use id to show details
      return {
        id: org.rsoId || null,
        RSO_name: snapshot.name || '',
        RSO_acronym: snapshot.acronym || '',
        RSO_category: snapshot.category || '',
        RSO_college: snapshot.college || '',
        RSO_picture: org.RSO_picture || '',
        RSO_memberCount: org.RSO_members?.length || 0,
        RSO_membershipStatus: org.RSO_membershipStatus ? "true" : "false"
      };
    });

  console.log("Table Row Picture:", tableRow?.map(org => org.RSO_picture));

  // Filter and sort organizations
  const filteredOrgs = () => {
    if (activeTab === 0 && searchQuery === "" && sort === "All") {
      return tableRow;
    }

    let filteredList = tableRow.filter((org) => {
      const matchesTab = activeTab === 0 || org.RSO_category === tabs[activeTab].label;
      const matchesSearch = org.RSO_name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesTab && matchesSearch;
    });

    if (sort === "A-Z") {
      filteredList = filteredList.sort((a, b) => a.RSO_name.localeCompare(b.RSO_name));
    } else if (sort === "Most Popular") {
      filteredList.sort((a, b) => {
        const aScore = a.RSO_popularityScoreCount || 0;
        const bScore = b.RSO_popularityScoreCount || 0;
        return bScore - aScore;
      });
    }

    return filteredList;
  };

  // Effects
  useEffect(() => { fetchData(); }, [fetchData]);

  console.log("Membership Date Data:", membershipDateData);

  useEffect(() => {
    if (membershipDateData) {
      setMembershipStatus(membershipDateData?.RSO_membershipStatus);
      const endDate = membershipDateData?.RSO_membershipEndDate;
      if (endDate) {
        setMembershipEndDate(FormatDate(endDate));
        setDate(new Date(endDate));
      }
    }
  }, [membershipDateData]);

  // Handlers
  const handleSelectedUser = (user) => {
    setSelectedUser(user);
    console.log(" selected user data ", user)
    navigate('rso-details', { state: { user } });
  };

  const handleCreate = () => {
    navigate("rso-action", { state: { mode: "create" } });
  };

  const openSettingsModal = () => {
    setIsSettingsModalOpen(true);
  };

  const handleMembershipStatusChange = (e) => {
    const newStatus = e.target.checked;

    if (!newStatus) {
      setMembershipStatus(false);
      closeMembershipDateMutate();
      setMembershipEndDate("");
      return;
    }

    setMembershipStatus(newStatus);
  };

  const handleDateTimeChange = (newValue) => {
    if (newValue) {
      const phISOString = dayjs(newValue).tz("Asia/Manila").toISOString();
      setDate(phISOString);
    }
  };

  const handleDateAction = () => {
    if (!membershipStatus) return;

    // Ensure date is in ISO format
    const dateObject = new Date(date);
    if (isNaN(dateObject.getTime())) {
      toast.error("Invalid date selected. Please choose a valid date.");
      return;
    }

    // Update membership date
    updateMembershipDateMutate({ date: date },
      {
        onSuccess: (data) => {
          toast.success("Membership updated successfully!");
          // turn off the modal
          setIsSettingsModalOpen(false);
        },
        onError: (error) => {
          toast.error("Failed to update date. Please try again.");
          console.error("Error updating membership date:", error);
        }
      }
    );
  };

  // Keyboard shortcut
  useKeyBinding({
    key: "c",
    callback: handleCreate,
    dependencies: [handleCreate]
  });

  const handleActionClick = (user) => {
    // setSelectedUser(user);
    console.log(" selected user data ", user)
    // navigate('rso-details', { state: { user } });

    softDeleteRSOMutate({ id: user.id }, {
      onSuccess: (data) => {
        console.log("RSO soft deleted successfully:", data);
        toast.success("RSO soft deleted successfully!");
      },
      onError: (error) => {
        console.error("Error soft deleting RSO:", error);
        toast.error("Failed to soft delete RSO. Please try again.");
      }
    });
  };

  return (
    <>
      <div className="flex flex-col items-start lg:flex-row lg:justify-between lg:items-center">
        <div className="flex justify-start items-center gap-2 lg:order-2">
          <Button className={"px-4"} onClick={handleCreate}>
            <div className="flex items-center gap-2">
              <h1>Create RSO</h1>
              <div className="h-6 w-6 border border-gray-200 rounded flex items-center justify-center font-light active:bg-primary-rso active:text-white transition duration-200 ease-in-out">
                c
              </div>
            </div>
          </Button>
          <div
            onClick={openSettingsModal}
            className="rounded-full aspect-square w-10 flex items-center justify-center hover:bg-mid-gray cursor-pointer">
            <svg xmlns="http://www.w3.org/2000/svg" className="fill-gray-600 size-4" viewBox="0 0 512 512">
              <path d="M495.9 166.6c3.2 8.7 .5 18.4-6.4 24.6l-43.3 39.4c1.1 8.3 1.7 16.8 1.7 25.4s-.6 17.1-1.7 25.4l43.3 39.4c6.9 6.2 9.6 15.9 6.4 24.6c-4.4 11.9-9.7 23.3-15.8 34.3l-4.7 8.1c-6.6 11-14 21.4-22.1 31.2c-5.9 7.2-15.7 9.6-24.5 6.8l-55.7-17.7c-13.4 10.3-28.2 18.9-44 25.4l-12.5 57.1c-2 9.1-9 16.3-18.2 17.8c-13.8 2.3-28 3.5-42.5 3.5s-28.7-1.2-42.5-3.5c-9.2-1.5-16.2-8.7-18.2-17.8l-12.5-57.1c-15.8-6.5-30.6-15.1-44-25.4L83.1 425.9c-8.8 2.8-18.6 .3-24.5-6.8c-8.1-9.8-15.5-20.2-22.1-31.2l-4.7-8.1c-6.1-11-11.4-22.4-15.8-34.3c-3.2-8.7-.5-18.4 6.4-24.6l43.3-39.4C64.6 273.1 64 264.6 64 256s.6-17.1 1.7-25.4L22.4 191.2c-6.9-6.2-9.6-15.9-6.4-24.6c4.4-11.9 9.7-23.3 15.8-34.3l4.7-8.1c6.6-11 14-21.4 22.1-31.2c5.9-7.2 15.7-9.6 24.5-6.8l55.7 17.7c13.4-10.3 28.2-18.9 44-25.4l12.5-57.1c2-9.1 9-16.3 18.2-17.8C227.3 1.2 241.5 0 256 0s28.7 1.2 42.5 3.5c9.2 1.5 16.2 8.7 18.2 17.8l12.5 57.1c15.8 6.5 30.6 15.1 44 25.4l55.7-17.7c8.8-2.8 18.6-.3 24.5 6.8c8.1 9.8 15.5 20.2 22.1 31.2l4.7 8.1c6.1 11 11.4 22.4 15.8 34.3zM256 336a80 80 0 1 0 0-160 80 80 0 1 0 0 160z" />
            </svg>
          </div>
        </div>
        <TabSelector tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
      {/* Membership Status */}
      {/* <div className="flex items-center gap-6 w-full justify-start bg-white border border-mid-gray p-6 rounded-md mt-4">
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${membershipEndDate ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <h1 className="text-gray-700 font-medium">Membership Status: <span className={`font-semibold ${membershipEndDate ? 'text-green-600' : 'text-red-600'}`}>{membershipEndDate ? "Active" : "Inactive"}</span></h1>
        </div>
        <div className="h-6 w-px bg-gray-200"></div>
        {membershipEndDate && (
          <div className="flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
            </svg>
            <h1 className="text-gray-700 font-medium">End Date: <span className="font-semibold text-gray-900">{membershipEndDate}</span></h1>
          </div>
        )}
      </div> */}
      {isRSOLoading ? (
        <div className="flex items-center justify-center py-4">
          <CardSkeleton></CardSkeleton>
        </div>
      ) : (
        <ReusableTable
          options={["All", "A-Z", "Most Popular"]}
          showAllOption={false}
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          columnNumber={4}
          tableHeading={[
            { id: 1, name: "RSO Name", key: "RSO_name" },
            { id: 2, name: "RSO Category", key: "RSO_category" },
            { id: 3, name: "Membership Status", key: "RSO_membershipStatus" },
            { id: 4, name: "Action", key: "remove" },
          ]}
          tableRow={filteredOrgs()}
          onClick={handleSelectedUser}
          onActionClick={handleActionClick}
          error={fetchWebRSOError}
          isLoading={loading}
        />
      )}

      <AnimatePresence>
        {isSettingsModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
          >
            <div className='flex items-center justify-center h-screen'>
              <motion.div
                variants={DropIn}
                initial="hidden"
                animate="visible"
                exit="exit"
                className='bg-white rounded-lg w-auto p-4 shadow-md'
              >
                <div className="flex items-center justify-between mb-8">
                  <h1>Adjust Membership End Date</h1>
                  <CloseButton onClick={() => setIsSettingsModalOpen(false)} />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="w-full flex items-center gap-2 justify-between">
                    <h1 className="text-sm text-gray-600">Activate Membership</h1>
                    <Switch
                      checked={membershipStatus}
                      onChange={handleMembershipStatusChange}
                      sx={{
                        '& .MuiSwitch-switchBase.Mui-checked': {
                          color: '#312895',
                          '& + .MuiSwitch-track': {
                            backgroundColor: '#312895',
                          },
                        },
                      }}
                    />
                  </div>
                  <div className={`flex flex-col gap-2 ${membershipStatus ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
                    <LocalizationProvider dateAdapter={AdapterDayjs}>
                      <DemoContainer components={['DateTimePicker']}>
                        <DateTimePicker
                          onChange={handleDateTimeChange}
                          label="Select date and time"
                          value={date ? dayjs(date).tz("Asia/Manila") : null}
                          slotProps={{
                            popper: {
                              placement: 'bottom-end',
                              modifiers: [
                                {
                                  name: 'flip',
                                  enabled: true,
                                  options: {
                                    altBoundary: true,
                                    rootBoundary: 'viewport',
                                    padding: 8,
                                  },
                                },
                                {
                                  name: 'preventOverflow',
                                  enabled: true,
                                  options: {
                                    altAxis: true,
                                    altBoundary: true,
                                    tether: true,
                                    rootBoundary: 'viewport',
                                    padding: 8,
                                  },
                                },
                              ],
                              sx: { zIndex: 9999 }
                            },
                            actionBar: { actions: ['accept', 'cancel'] }
                          }}
                        />
                      </DemoContainer>
                    </LocalizationProvider>
                    <div className="flex justify-end">
                      <Button onClick={handleDateAction}>Set Date</Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}