import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";
import Cropper from "react-easy-crop";
import { toast } from "react-toastify";
import { DropIn } from "../../../animations/DropIn";
import DefaultPicture from "../../../assets/images/default-profile.jpg";
import { Backdrop, Badge, Button, CloseButton, ReusableRSODescription, TabSelector, TextInput } from "../../../components";
import ErrorBoundary from '../../../components/ErrorBoundary';
import { useAdminUser, useModal, useRSODetails } from "../../../hooks";
import { useUserStoreWithAuth } from '../../../store';
import getCroppedImg from '../../../utils/cropImage';

const tabs = [
  { label: "Officers" },
  { label: "RSO Details" },
]

const adminTabs = [
  { label: "Admin Details" }
]

export default function Account() {
  const { isUserRSORepresentative, isUserAdmin, isCoordinator, isSuperAdmin } = useUserStoreWithAuth();



  const {
    rsoDetails,
    isRSODetailsLoading,
    isRSODetailsError,
    isRSODetailsSuccess,

    // Update Officer
    updateOfficerMutate,
    isUpdatingOfficer,
    isUpdateOfficerError,
    isUpdateOfficerSuccess,

    // Create Officer
    createOfficerMutate,
    isCreatingOfficer,
    isCreateOfficerError,
    isCreateOfficerSuccess,

    deleteOfficerMutate,
    isDeleting,
    isDeleteError,
    isDeleteSuccess,
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


  function refetchOnRole() {
    if (isUserAdmin || isCoordinator || isSuperAdmin) {
      return refetchAdminProfile();
    } else if (isUserRSORepresentative) {
      return refetchAdminProfile(); // fallback, or implement RSO-specific refetch if needed
    }
  }

  function profileOnRole() {
    if (isUserAdmin || isCoordinator || isSuperAdmin) {
      return adminProfile?.user;
    } else if (isUserRSORepresentative) {
      return rsoDetails?.rso;
    }
    return null;
  }

  function profileOnRole() {
    if (isUserAdmin || isCoordinator || isSuperAdmin) {
      return adminProfile?.user;
    } else if (isUserRSORepresentative) {
      return rsoDetails?.rso;
    }
  }

  const user = JSON.parse(localStorage.getItem("user"));
  const { isOpen, openModal, closeModal } = useModal();
  const [officerName, setOfficerName] = useState("");
  const [officerPosition, setOfficerPosition] = useState("");
  const [officerId, setOfficerId] = useState(null);
  const [activeTab, setActiveTab] = useState(0);
  const [create, setCreate] = useState(false);
  const [officerError, setOfficerError] = useState("");

  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [readyCropper, setReadyCropper] = useState(false);
  const fileInputRef = useRef(null);
  const [profileData, setProfileData] = useState(null);

  const [formData, setFormData] = useState({
    OfficerPicture: null,
    OfficerPicturePreview: null,
    OfficerName: "",
    OfficerPosition: "",
  });

  const rsoDetailData = {
    data: {
      RSO_snapshot: {
        category: rsoDetails?.rso?.RSO_category || "",
        probationary: rsoDetails?.rso?.RSO_probationary || false,
      },
      RSOid: {
        RSO_tags: rsoDetails?.rso?.RSO_tags || [],
        RSO_description: rsoDetails?.rso?.RSO_description || "",
        RSO_acronym: rsoDetails?.rso?.RSO_acronym || "",
        RSO_College: rsoDetails?.rso?.RSO_College || "",
        RSO_assignedUsers: rsoDetails?.rso?.RSO_assignedUsers || [],
      },
      RSO_totalMembers: rsoDetails?.rso?.yearlyData?.RSO_totalMembers || 0,
      RSO_recognition_status: {
        status: rsoDetails?.rso?.yearlyData?.RSO_recognition_status?.status || "Unknown"
      },
    }
  }


  useEffect(() => {
    // Handle errors
    if (isUpdateOfficerError) {
      toast.error("Error updating officer. Please try again.");
    } else if (isDeleteError) {
      toast.error("Error deleting officer. Please try again.");
    } else if (isCreatingOfficer) {
      toast.error("Error creating officer. Please try again.");
    }

    // Handle success states
    if (isUpdateOfficerSuccess) {
      toast.success("Officer updated successfully!");
      refetchOnRole();
      handleCloseModal();
    } else if (isCreateOfficerSuccess) {
      toast.success("Officer created successfully!");
      refetchOnRole();
      handleCloseModal();
    } else if (isDeleteSuccess) {
      refetchOnRole();
      toast.success("Officer deleted successfully!");
    }
  }, [
    isUpdateOfficerError, isDeleteError, isCreatingOfficer,
    isUpdateOfficerSuccess, isCreateOfficerSuccess, isDeleteSuccess
  ]);

  // Set profile data based on user role
  useEffect(() => {
    if (isUserRSORepresentative) {
      console.log("User is RSO representative, setting profile to  ", rsoDetails?.rso);
      setProfileData(rsoDetails?.rso);
    } else if (isUserAdmin || isCoordinator || isSuperAdmin) {
      console.log("User is admin, coordinator or super admin, setting profile to ", profileOnRole());
      setProfileData(profileOnRole());
    } else {
      console.log("User role is not recognized, setting profile to null");
      setProfileData(null);
    }
  }, [user, adminProfile, rsoDetails]);


  const handleOfficer = (officer) => {
    if (!officer) {
      openModal();
      setCreate(true);
      setOfficerId(null);
      setFormData({
        OfficerName: "",
        OfficerPosition: "",
        OfficerPicture: null,
        OfficerPicturePreview: "",
      });

      return;
    }

    setOfficerId(officer._id);
    console.log("officerId: ", officer._id);
    setFormData({
      OfficerName: officer.OfficerName || "",
      OfficerPosition: officer.OfficerPosition || "",
      OfficerPicture: officer.OfficerPicture || null,
      OfficerPicturePreview: officer.OfficerPictureUrl || "",
    });
    setCreate(false);

    openModal();

  };

  const handleSubmit = () => {
    // Clear error state at the start
    setOfficerError("");
    console.log("officerPicture: ", formData.OfficerPicture);
    console.log("officerName: ", formData.OfficerName);
    console.log("officerPosition: ", formData.OfficerPosition);

    // Handle form submission logic here
    const { OfficerPicture, OfficerName, OfficerPosition } = formData;
    if (!OfficerPicture || !OfficerName || !OfficerPosition) {
      setOfficerError("Please fill in all fields and upload a picture.");
      return;
    }

    const formDataToSubmit = new FormData();

    if (OfficerPicture && OfficerPicture instanceof File) {
      formDataToSubmit.append("OfficerPicture", OfficerPicture);
    }

    formDataToSubmit.append("OfficerName", OfficerName);
    formDataToSubmit.append("OfficerPosition", OfficerPosition);

    if (create) {
      console.log("Creating new officer...");
      { console.log("profileOnRole", profileOnRole()) }
      { console.log("formDataToSubmit", formDataToSubmit) }
      { console.log("officerId: ", officerId) }

      // Method 1: Log individual FormData entries
      console.log("FormData contents:");
      for (let [key, value] of formDataToSubmit.entries()) {
        console.log(`${key}:`, value);
      }

      createOfficerMutate({
        // id: profileOnRole()?._id,
        createdOfficer: formDataToSubmit
      });
    } else {
      updateOfficerMutate({
        id: officerId,
        updatedOfficer: formDataToSubmit
      });
    }

    // Reset form data after submission
    setFormData({
      OfficerPicture: null,
      OfficerPicturePreview: null,
      OfficerName: "",
      OfficerPosition: "",
    });
    handleCloseModal();
  }

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleCloseModal = () => {
    setOfficerName("");
    setOfficerPosition("");
    closeModal();
  }

  const handleCloseImage = () => {
    setImage(null);
    setReadyCropper(false);
  }
  useEffect(() => {
    if (image) {
      const timeOut = setTimeout(() => {

        setReadyCropper(true);
      }, 300);

      return () => clearTimeout(timeOut);
    } else {
      setReadyCropper(false);
    }
  })

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCrop = async () => {
    const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
    const croppedFile = new File([croppedBlob], "cropped.png", { type: "image/png" });
    setFormData(prev => ({
      ...prev,
      OfficerPicture: croppedFile,
      OfficerPicturePreview: URL.createObjectURL(croppedFile),
    }));

    setImage(null);
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);

      setImage(preview);
    }
  };

  const handleOfficerDelete = (officerId) => {
    if (officerId) {
      console.log("Deleting officer with ID:", officerId);
      deleteOfficerMutate(officerId);
    }
  }

  return (
    <>
      <div className="grid grid-cols-1 w-full">
        {/* Profile Overview */}
        <div className="flex flex-col md:flex-row items-start gap-6 mb-6">
          <div className="flex flex-col items-start gap-2">
            {isUserRSORepresentative ? (
              <img
                src={profileData?.RSO_picture || DefaultPicture}
                alt="Profile"
                className="size-24 rounded-full object-cover"
              />
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" className="size-24 fill-gray-700" viewBox="0 0 512 512"><path d="M399 384.2C376.9 345.8 335.4 320 288 320l-64 0c-47.4 0-88.9 25.8-111 64.2c35.2 39.2 86.2 63.8 143 63.8s107.8-24.7 143-63.8zM0 256a256 256 0 1 1 512 0A256 256 0 1 1 0 256zm256 16a72 72 0 1 0 0-144 72 72 0 1 0 0 144z" /></svg>
            )}

          </div>
          <div className="flex flex-col gap-1">
            <div className="flex gap-2">
              {isUserAdmin ? (
                <Badge text="Admin" style="secondary" />
              ) : isSuperAdmin &&
              (<Badge text="Super Admin" style="primary" />)
              }
              {isUserRSORepresentative && (
                <Badge text="RSO" style="secondary" />
              )}
            </div>
            <h1 className="text-2xl font-bold text-gray-800">
              {isUserRSORepresentative
                ? (profileData?.RSO_name || "loading...")
                : (isUserAdmin || isSuperAdmin)
                  ? (
                    profileData?.firstName + " " + profileData?.lastName || "loading..."
                  )
                  : "loading..."}
            </h1>
            <p className="text-base text-gray-600">
              {isUserRSORepresentative
                ? (profileData?.RSO_acronym || "loading...")
                : (isUserAdmin || isSuperAdmin)
                  ? ('')
                  : "loading..."}
            </p>
          </div>
        </div>

        {/* Edit Form */}
        <div className="w-full">
          {isUserRSORepresentative && (
            <>
              <TabSelector tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab}></TabSelector>
              {activeTab === 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2 mt-4 ">

                  <div
                    onClick={() => handleOfficer(null)}
                    className="relative cursor-pointer bg-white hover:bg-background transition ease-in-out flex flex-col justify-center items-center w-full max-w-xs p-6 rounded-xl sm:px-12 dark:bg-gray-50 dark:text-gray-800 mx-auto" >
                    <div className="aspect-square h-14 w-14 rounded-full bg-primary flex items-center justify-center mb-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="size-12 fill-white" viewBox="0 0 448 512"><path d="M256 80c0-17.7-14.3-32-32-32s-32 14.3-32 32l0 144L48 224c-17.7 0-32 14.3-32 32s14.3 32 32 32l144 0 0 144c0 17.7 14.3 32 32 32s32-14.3 32-32l0-144 144 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-144 0 0-144z" /></svg>
                    </div>
                    <h1 className="text-primary text-sm">Add Officer</h1>
                  </div>
                  {console.log("profileData?.RSO_Officers", profileData?.RSO_Officers)}
                  {

                    profileData?.yearlyData?.RSO_Officers?.map((officer, index) => {
                      return (
                        <>
                          <div
                            key={index}
                            onClick={(e) => handleOfficer(officer)}

                            className="relative cursor-pointer hover:bg-gray-100 transition ease-in-out flex flex-col justify-center w-full max-w-xs p-6 rounded-xl sm:px-12 dark:bg-gray-50 dark:text-gray-800 mx-auto">
                            <div
                              onClick={
                                (e) => {
                                  e.stopPropagation();
                                  handleOfficerDelete(officer?._id);

                                }
                              }
                              className="bg-white h-8 w-8 aspect-square rounded-full flex items-center justify-center mb-2 absolute top-0 right-0 mr-2 mt-2 cursor-pointer group transition ease-in-out">
                              <svg xmlns="http://www.w3.org/2000/svg" className="size-4 fill-gray-400 group-hover:fill-gray-700" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                            </div>
                            {console.log("officer.OfficerPicture", officer.OfficerPicture)}
                            <img src={officer.OfficerPictureUrl || DefaultPicture} alt="" className="mx-auto rounded-full dark:bg-gray-500 aspect-square h-32 object-cover shrink-1" />
                            <div className="space-y-4 text-center divide-y dark:divide-gray-300">
                              <div className="my-2 space-y-1">
                                <h2 className="text-xl font-semibold sm:text-2xl truncate">{officer.OfficerName || ''}</h2>
                                <p className="px-5 text-xs sm:text-base dark:text-gray-600 truncate">{officer.OfficerPosition || ''}</p>
                              </div>
                            </div>
                          </div>
                        </>
                      );
                    })}
                </div>
              )}

              {activeTab === 1 && (
                <div className="mt-4">
                  <ReusableRSODescription rsoDetailData={rsoDetailData} />
                </div>
              )}
            </>

          )}
        </div>
      </div>

      {/* edit officer modal */}
      <AnimatePresence>
        {isOpen && (
          <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
            <motion.div
              className="bg-white rounded-lg shadow-lg w-[70%] max-w-[400px] border border-[#312895]/20"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit"
            >
              <div className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold mb-4">{create ? "Create Officer" : "Edit Officer"}</h2>
                  <CloseButton onClick={handleCloseModal} />
                </div>
                <div className="flex flex-col gap-2">
                  <div className="flex flex-col items-center mb-4">
                    <div className="flex justify-start w-full">
                      <label
                        htmlFor="officerPicture"
                        className="block mb-2 text-sm font-medium text-gray-600 dark:text-white"
                      >
                        Officer Picture
                      </label>
                    </div>
                    <input
                      type="file"
                      accept="image/*"
                      ref={fileInputRef}
                      className="hidden "
                      onChange={handleImageChange}
                    />

                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-full h-[10rem] bg-gray-400 hover:bg-gray-700 transition ease-in-out-300 cursor-pointer">
                      {/* only show preview when user uploads a picture */}
                      {formData?.OfficerPicturePreview ? (
                        <img
                          name="officerPicture"
                          className="w-full h-full object-cover rounded-full hover:opacity-50 transition ease-in-out-300"
                          src={formData.OfficerPicturePreview}
                          alt={officerName || "Officer Picture Preview"}
                        />
                      ) : (
                        <img
                          name="officerPicture"
                          className="w-full h-full object-cover rounded-full hover:opacity-50 transition ease-in-out-300"
                          src={formData.OfficerPicture || DefaultPicture}
                          alt="Default Officer Picture"
                        />
                      )}
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="officerName"
                      className="block mb-2 text-sm font-medium text-gray-600 dark:text-white"
                    >
                      Officer Name
                    </label>
                    <TextInput
                      id="officerName"
                      label="Officer Name"
                      name="OfficerName"
                      value={formData.OfficerName || ""}
                      onChange={handleChange}
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="officerPosition"
                      className="block mb-2 text-sm font-medium text-gray-600 dark:text-white"
                    >
                      Officer Position
                    </label>
                    <TextInput
                      id="officerPosition"
                      name="OfficerPosition"
                      label="Officer Position"
                      value={formData.OfficerPosition || ""}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="flex justify-end mt-8">
                  <div>
                    <Button onClick={handleCloseModal} style={"secondary"} className="mr-2">
                      Delete
                    </Button>
                    <Button
                      disabled={
                        !formData.OfficerPicture ||
                        !formData.OfficerName.trim() ||
                        !formData.OfficerPosition.trim()
                      }
                      onClick={handleSubmit}>Save</Button>
                  </div>
                </div>
                {officerError && (
                  <div className="text-red-500 text-sm mt-1">
                    {officerError}
                  </div>
                )}
              </div>
            </motion.div>
          </Backdrop>
        )}
        {image && (
          <>
            <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" />
            <motion.div
              className="fixed inset-0 z-50 w-screen overflow-auto flex items-center justify-center"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit">

              <div className="bg-white rounded-lg p-6 w-1/3 shadow-xl border border-gray-100">
                <div className='flex justify-between items-center mb-4'>
                  <h2 className='text-sm font-semibold'>Image Preview</h2>
                  <CloseButton onClick={handleCloseImage}></CloseButton>
                </div>
                <div className='relative h-[300px] w-full mx-auto mb-4'>
                  {/* <img src={image} alt="Preview" className='w-32 h-32 object-cover rounded-md' /> */}
                  {image && readyCropper && (
                    <ErrorBoundary>
                      <Cropper
                        image={image}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                        cropShape='round'
                        classes={{
                          containerClassName: 'rounded-xl overflow-hidden',
                        }}
                      />
                    </ErrorBoundary>
                  )}
                </div>

                <label>Zoom:</label>
                <input
                  type="range"
                  min={1}
                  max={3}
                  step={0.1}
                  value={zoom}
                  onChange={(e) => setZoom(Number(e.target.value))}
                />


                <div className='flex justify-end mt-4'>
                  <Button
                    onClick={handleCrop}
                  >Upload Image</Button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

    </>
  );
}