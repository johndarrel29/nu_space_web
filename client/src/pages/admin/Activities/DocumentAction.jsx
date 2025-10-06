import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import dayjs from 'dayjs';
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from 'react';
import Cropper from "react-easy-crop";
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DropIn } from "../../../animations/DropIn";
import DefaultPicture from '../../../assets/images/default-picture.png';
import { Backdrop, Button, CloseButton, LoadingSpinner, ReusableDropdown, TextInput } from '../../../components';
import { useRSOActivities } from '../../../hooks';
import { useSelectedFormStore } from '../../../store';
import getCroppedImg from '../../../utils/cropImage';


function DocumentAction() {
  const location = useLocation();
  const navigate = useNavigate();
  const { mode, data, from } = location.state || {};
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const selectedForm = useSelectedFormStore((state) => state.selectedForm);
  const { createActivity, updateActivity, deleteActivity, error, success } = useRSOActivities();

  // hook for creating activity
  const {
    createActivityMutate,
    isCreatingActivity,
    isActivityCreated,
    isActivityCreationError,
    activityCreationError,

    updateActivityMutate,
    isUpdatingActivity,
    isActivityUpdated,
    isActivityUpdateError,
    activityUpdateError,

    // delete
    deleteActivityMutate,
    isDeletingActivity,
    isActivityDeleted,
    isActivityDeletionError,
    activityDeletionError,
  } = useRSOActivities();

  console.log("the selected form is ", selectedForm);


  const fileInputRef = useRef(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [defaultImage, setDefaultImage] = useState(true);
  const [descriptionError, setDescriptionError] = useState("");
  const [deleteModalOpen, setDeleteModalOpen] = useState(false); // Add this line for modal state

  //file manipulaion
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [readyCropper, setReadyCropper] = useState(false);
  const [originalData, setOriginalData] = useState(null);
  console.log("DocumentAction mode:", mode, "data:", data, "from:", from);

  console.log("data image", data?.Activity_image, "activityImageUrl:", data?.file);

  // Determine if we are in edit or create mode
  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const [activityData, setActivityData] = useState(() => {
    // on off campus not reflecting back on edit
    if (mode === 'edit' && data) {
      let displayCampusValue = '';
      if (data.Activity_on_off_campus === 'on_campus') {
        displayCampusValue = 'On Campus';
      } else if (data.Activity_on_off_campus === 'off_campus') {
        displayCampusValue = 'Off Campus';
      } else {
        displayCampusValue = data.Activity_on_off_campus || '';
      }
      return {
        Activity_name: data.Activity_name || '',
        Activity_image: data.Activity_image || '',
        activityImageUrl: data.activityImageUrl || null,
        Activity_start_datetime: data?.Activity_start_datetime ? dayjs(data.Activity_start_datetime) : null,
        Activity_end_datetime: data?.Activity_end_datetime ? dayjs(data.Activity_end_datetime) : null,
        Activity_picturePreview: data?.activityImageUrl || DefaultPicture,
        Activity_place: data.Activity_place || '',
        formsUsed: data.formsUsed || [],
        Activity_description: data.Activity_description || '',
        Activity_GPOA: data.Activity_GPOA ?? false,
        Activity_publicity: data.Activity_publicity ?? false,
        Activity_on_off_campus: displayCampusValue,
      };
    }
    return {
      Activity_name: '',
      Activity_datetime: null,
      Activity_description: '',
      Activity_GPOA: false,
      Activity_image: '',
      Activity_place: '',
      formsUsed: [],
      Activity_on_off_campus: '',
      Activity_publicity: false,
      Activity_start_datetime: null,
      Activity_end_datetime: null,
      activityImageUrl: null,
      Activity_picturePreview: DefaultPicture,
    };
  });

  useEffect(() => {
    const store = useSelectedFormStore.getState().selectedForm;
    const isStoreEmpty =
      !store ||
      (!store.feedbackForm || !store.feedbackForm?._id) &&
      (!store.preActForm || !store.preActForm?._id);

    if (isEdit &&
      activityData.formsUsed &&
      activityData.formsUsed.length > 0 &&
      isStoreEmpty
    ) {
      useSelectedFormStore.getState().setSelectedForm({
        feedbackForm: activityData.formsUsed[0] || "",
        preActForm: activityData.formsUsed[1] || "",
      });
    }
  }, [isEdit, activityData.formsUsed]);

  let campusValue = "";
  if (activityData.Activity_on_off_campus === 'on_campus') {
    campusValue = 'On Campus';
  } else if (activityData.Activity_on_off_campus === 'off_campus') {
    campusValue = 'Off Campus';
  } else {
    campusValue = activityData.Activity_on_off_campus || '';
  }

  const handleChange = (field) => (e) => {
    const value = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    setActivityData((prev) => ({
      ...prev,
      [field]: value
    }));
  };

  // console.log to check data from edit mode
  useEffect(() => {
    if (isEdit && data) {
      console.log("Editing activity data:", data);
      setOriginalData(data);
    }
  }, [isEdit, data]);

  useEffect(() => {
    if (success) {
      navigate('..', { relative: 'path' });
    }
  }, [success, navigate]);

  const handleSubmit = async (e) => {
    console.log("Submitting form with activityData:", activityData, "selectedForm:", selectedForm);
    e.preventDefault();

    const changedFields = {};
    // Use originalData to refer if the data has changed
    // double check
    if (isEdit && originalData) {
      console.log("Original data:", originalData);
      console.log("Current activity data:", activityData);

      // check Activity_image
      if (originalData.Activity_image === activityData.Activity_image) {
        console.log("Activity image unchanged, skipping update for this field.");
      } else {
        changedFields.Activity_image = activityData.Activity_image;
      }

      // Check Activity_name
      if (originalData.Activity_name === activityData.Activity_name) {
        console.log("Activity name unchanged, skipping update for this field.");
      } else {
        changedFields.Activity_name = activityData.Activity_name;
      }

      // Check Activity_description
      if (originalData.Activity_description === activityData.Activity_description) {
        console.log("Activity description unchanged, skipping update for this field.");
      } else {
        changedFields.Activity_description = activityData.Activity_description;
      }

      // Check Activity_place
      if (originalData.Activity_place === activityData.Activity_place) {
        console.log("Activity place unchanged, skipping update for this field.");
      } else {
        changedFields.Activity_place = activityData.Activity_place;
        console.log("Activity place changed, will update this field.");
      }

      // Check Activity_GPOA
      if (originalData.Activity_GPOA === activityData.Activity_GPOA) {
        console.log("Activity GPOA unchanged, skipping update for this field.");
      } else {
        changedFields.Activity_GPOA = activityData.Activity_GPOA;
      }

      // Check Activity_publicity
      if (originalData.Activity_publicity === activityData.Activity_publicity) {
        console.log("Activity publicity unchanged, skipping update for this field.");
      } else {
        changedFields.Activity_publicity = activityData.Activity_publicity;
        console.log("Activity publicity changed, will update this field.");
      }

      // Check Activity_on_off_campus
      const normalizedCurrentCampus = activityData.Activity_on_off_campus === 'On Campus' ? 'on_campus' :
        activityData.Activity_on_off_campus === 'Off Campus' ? 'off_campus' :
          activityData.Activity_on_off_campus;
      { console.log("Normalized current campus value:", normalizedCurrentCampus); }
      { console.log("Original campus value:", originalData.Activity_on_off_campus); }
      if (originalData.Activity_on_off_campus === normalizedCurrentCampus) {
        console.log("Activity campus status unchanged, skipping update for this field.");
      } else {
        changedFields.Activity_on_off_campus = normalizedCurrentCampus;
        console.log("Activity campus status changed, will update this field.");
      }

      // Check Activity_start_datetime
      if (dayjs(originalData.Activity_start_datetime).isSame(dayjs(activityData.Activity_start_datetime))) {
        console.log("Activity start datetime unchanged, skipping update for this field.");
      } else {
        changedFields.Activity_start_datetime = activityData.Activity_start_datetime;
        console.log("Activity start datetime changed, will update this field.");
      }

      // Check Activity_end_datetime
      if (dayjs(originalData.Activity_end_datetime).isSame(dayjs(activityData.Activity_end_datetime))) {
        console.log("Activity end datetime unchanged, skipping update for this field.");
      } else {
        changedFields.Activity_end_datetime = activityData.Activity_end_datetime;
        console.log("Activity end datetime changed, will update this field.");
      }

      // Check formsUsed (compare IDs)
      const originalFormsUsed = Array.isArray(originalData.formsUsed) ? originalData.formsUsed.map(f => f._id) : [];
      const storeFormsUsed = [selectedForm.feedbackForm?._id, selectedForm.preActForm?._id].filter(Boolean);
      const formsChanged = originalFormsUsed.length !== storeFormsUsed.length || originalFormsUsed.some((id, idx) => id !== storeFormsUsed[idx]);
      if (formsChanged) {
        setLoading(true);
        changedFields.formsUsed = storeFormsUsed;
        console.log("formsused comparison from original data", originalFormsUsed, "to store", storeFormsUsed);
        console.log("FormsUsed changed, will update this field. ", selectedForm);
      } else {
        setLoading(false);
        console.log("FormsUsed unchanged, skipping update for this field.");
      }

      if (Object.keys(changedFields).length === 0) {
        setLoading(false);
        console.log("No changes detected, not submitting.");
        return;
      }
    }

    // block GPOA edit if changed
    if (changedFields.Activity_GPOA) {
      setLoading(false);
      toast.error("GPOA status cannot be changed once set.");
      return;
    }

    if (activityData?.Activity_description === "" || activityData?.Activity_description === null) {
      setDescriptionError("Description is required");
      setTimeout(() => {
        setDescriptionError("");
      }, 1000);
      setLoading(false);

      return;

    } else if (activityData?.Activity_description.length > 500) {
      setDescriptionError("Description must not exceed 500 characters.");
      setTimeout(() => {
        setDescriptionError("");
      }, 1000);
      setLoading(false);
      return;
    } else {

      setDescriptionError("");

    }

    if (error || descriptionError) {
      setLoading(false);
      return;
    }

    // Prepare the data to match the API requirement
    const apiData = {
      ...activityData,
      Activity_GPOA: activityData.Activity_GPOA.toString(),
      formsUsed: selectedForm
        ? [selectedForm.feedbackForm?._id, selectedForm.preActForm?._id].filter(Boolean)
        : [],
      Activity_start_datetime: activityData.Activity_start_datetime
        ? dayjs(activityData.Activity_start_datetime).toISOString()
        : null,
      Activity_end_datetime: activityData.Activity_end_datetime
        ? dayjs(activityData.Activity_end_datetime).toISOString()
        : null,
    };
    delete apiData.Activity_datetime;
    delete apiData.activityImageUrl;

    try {
      let result;
      setLoading(true);
      if (isEdit && data?._id) {
        // Update existing activity
        console.log("Updating activity with data ", changedFields);
        result = await updateActivityMutate({ activityId: data._id, updatedData: changedFields },
          {
            onSuccess: (data) => {
              setLoading(false);
              console.log("Activity updated successfully:", data);
              toast.success("Activity updated successfully!");
              navigate(-1);
            },
            onError: (error) => {
              setLoading(false);
              console.error("Error updating activity:", error);
              toast.error("Error updating activity");
            },
          }
        );
      } else if (isCreate) {
        console.log("Creating new activity with data:", apiData);

        const created = await createActivityMutate(apiData,
          {
            onSuccess: (data) => {
              console.log("Activity created successfully:", data);
              toast.success("Activity created successfully!");
              setLoading(false);
              navigate("/activities");
            },
            onError: (error) => {
              console.error("Error creating activity:", error);
              setLoading(false);
              toast.error(error.message || "Error creating activity");
            },
          }
        );
        console.log("Activity created:", created);

        if (created) {
          navigate(from || "/admin/documents", {
            state: { message: isEdit ? "Activity updated successfully!" : "Activity created successfully!" },
          });
        }
      }

    }
    catch (error) {
      console.error("Error submitting form:", error);
      setLoading(false);
    } finally {
      setLoading(false);
    }
    setHasSubmitted(true);
  };

  const handleDelete = (e) => {
    e.preventDefault();
    // Show confirmation modal instead of deleting immediately
    setDeleteModalOpen(true);
  };


  const confirmDelete = async () => {
    console.log("id to send", data._id)
    deleteActivityMutate(data._id,
      {
        onSuccess: () => {
          setDeleting(false);
          console.log("Activity deleted successfully");
          toast.success("Activity deleted successfully");
          setDeleteModalOpen(false);
          navigate('/activities');
        },
        onError: (error) => {
          setDeleting(false);
          console.error("Error deleting activity:", error);
          setDeleteModalOpen(false);
          toast.error("Error deleting activity");
        },
      }
    );
  }

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);
      setImage(preview);
      setReadyCropper(false);

      const img = new Image();
      img.onload = () => {
        setReadyCropper(true);
      };
      img.src = preview;
    }
  };

  const onCropComplete = useCallback((_, croppedPixels) => {
    setCroppedAreaPixels(croppedPixels);
  }, []);

  const handleCrop = async () => {
    if (!image || !croppedAreaPixels || !readyCropper) {
      console.error("Image or crop data not ready");
      return;
    }
    try {
      const croppedBlob = await getCroppedImg(image, croppedAreaPixels);
      const croppedFile = new File([croppedBlob], "cropped.png", { type: "image/png" });
      setActivityData(prev => ({
        ...prev,
        Activity_image: croppedFile,
        Activity_picturePreview: URL.createObjectURL(croppedFile),
      }));
      setImage(null);
    } catch (error) {
      console.error("Error cropping image:", error);
    }
  };

  const handleDateChangeStart = (newValue) => {
    setActivityData((prev) => ({
      ...prev,
      Activity_datetime: newValue,
      Activity_start_datetime: newValue,
    }));
  };

  const handleDateChangeEnd = (newValue) => {
    setActivityData((prev) => ({
      ...prev,
      Activity_end_datetime: newValue,
    }));
  };

  console.log("error is: ", error);

  useEffect(() => {
    if (success) {
      toast.success(isEdit ? "Activity updated successfully!" : "Activity created successfully!");
    } else if (error) {
      toast.error(error.message || "An error occurred. Please try again.");
    }
    // else if (hasSubmitted) {
    //   toast.info(isEdit ? "Changes saved successfully!" : "Activity created successfully!");
    // }
  }, [success, error, hasSubmitted, isEdit]);

  const options = [
    "On Campus",
    "Off Campus",
  ]

  const handleCampusChange = (e) => {
    const value = e.target.value;

    let campusValue = value;
    if (value === "On Campus") {
      campusValue = "on_campus";
    } else if (value === "Off Campus") {
      campusValue = "off_campus";
    } else {
      campusValue = null; // Handle unexpected values
    }

    setActivityData((prev) => ({
      ...prev,
      Activity_on_off_campus: campusValue,
    }));
  }

  return (
    <>
      <div className='mb-8'>
        <div
          onClick={() => {
            navigate(-1);

          }}
          className='flex items-center justify-center rounded-full h-8 w-8 cursor-pointer border border-gray-300 group'>
          <svg xmlns="http://www.w3.org/2000/svg" className='fill-gray-600 size-4 group-hover:fill-off-black' viewBox="0 0 448 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" /></svg>
        </div>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8">
        {mode === "edit" ? "Edit Activity Details" : mode === "create" ? "Create New Activity" : "View Activity Details"}
      </h1>

      <div>
        <div className="flex items-center justify-center mb-4 gap-2">
          {/* edit and create, delete buttons */}
          <div className='flex items-center justify-center mb-4 gap-1'>
            <div
              onClick={() => fileInputRef.current?.click()}
              className='px-2 py-1 bg-transparent rounded-full border border-gray-400 text-sm flex justify-center cursor-pointer hover:text-gray-500'>

              {isEdit ? `Edit` : isCreate ? 'Upload' : 'Upload'}
            </div >
            <div
              onClick={() => {
                setImage(null);
                setDefaultImage(true);
                setActivityData(prev => ({
                  ...prev,
                  Activity_image: null,
                  Activity_picturePreview: DefaultPicture,
                }));
              }}
              className='cursor-pointer px-2 py-1 bg-transparent rounded-full aspect-square border border-gray-400 text-sm flex items-center justify-center group hover:text-gray-500'>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className='fill-off-black size-3 group-hover:fill-gray-500 '><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
            </div >
          </div>

          {!activityData.Activity_picturePreview && (
            <div className='h-[13rem] w-full lg:w-[13rem] bg-primary/10 rounded-lg overflow-hidden'>
              <img
                src={isEdit && hasSubmitted === false ? activityData?.activityImageUrl : defaultImage === true ? DefaultPicture : null}
                alt="Activity Preview testing"
                className="w-full h-full object-cover"
              />
            </div>
          )}

          {console.log("Activity_picturePreview value:", activityData.Activity_picturePreview)}
          {activityData.Activity_picturePreview && (
            <div className='h-[13rem] w-full lg:w-[13rem] bg-primary/10 rounded-lg overflow-hidden'>
              <img
                src={activityData.Activity_picturePreview}
                alt="Activity Preview image input"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div >
        <input
          type="file"
          accept="image/*"
          className="hidden"
          ref={fileInputRef}
          onChange={handleImageChange} />
      </div>



      <div className="flex items-center justify-center w-full">
        {/* details */}
        <div className=" w-full max-w-2xl">
          <section className="bg-white p-6 rounded-2xl space-y-4">
            <h2 className="text-xl font-semibold text-gray-800">Basic Information</h2>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Activity Name</label>
              <TextInput
                placeholder="Enter activity name"
                value={activityData.Activity_name}
                onChange={handleChange('Activity_name')}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Start Date</label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  value={activityData.Activity_start_datetime}
                  onChange={handleDateChangeStart}
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

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">End Date</label>
              <LocalizationProvider dateAdapter={AdapterDayjs}>
                <DateTimePicker
                  value={activityData.Activity_end_datetime}
                  onChange={handleDateChangeEnd}
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

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Location</label>
              <TextInput
                placeholder="Enter location"
                value={activityData.Activity_place}
                onChange={handleChange('Activity_place')}
              />
            </div>

            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Description</label>
              <textarea
                rows="4"
                name="Activity_place"
                value={activityData.Activity_description}
                onChange={handleChange('Activity_description')}
                className="bg-textfield border border-mid-gray text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                placeholder="Provide more details about the activity..."
              />
              {descriptionError && (
                <div className="text-red-500 text-sm mt-1">
                  {descriptionError}
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">On/Off Campus Activity</label>
              <ReusableDropdown
                options={options}
                value={campusValue}
                onChange={handleCampusChange}
              ></ReusableDropdown>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Select a Form for the Activity</label>
              <Button
                disabled={isCreate ? true : false}
                onClick={() => navigate("/activities/form-selection", { state: isEdit ? { mode: "edit" } : { mode: "create" } })}
                style={"secondary"}>
                <span className='text-sm truncate max-w-xs'>
                  {/* Selected {activityData?.formsUsed?.map((forms) => forms.title).join(", ") || "None"} */}
                  Selected: {selectedForm ? selectedForm.feedbackForm?.title + ", " + selectedForm.preActForm?.title : "none"}
                </span>
              </Button>
            </div>
          </section>

          <section className="flex flex-row justify-between px-6 items-start">
            <div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="gpoa-checkbox"
                  checked={activityData.Activity_GPOA}
                  onChange={handleChange('Activity_GPOA')}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="gpoa-checkbox" className="block text-sm font-medium text-gray-700">
                  Is GPOA Activity?
                </label>
              </div>
            </div>

            <div>
              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="publicity"
                  checked={activityData.Activity_publicity}
                  onChange={handleChange('Activity_publicity')}
                  className="h-4 w-4 rounded text-indigo-600 focus:ring-indigo-500"
                />
                <label htmlFor="gpoa-checkbox" className="block text-sm font-medium text-gray-700">
                  Is open for all colleges?
                </label>
              </div>
            </div>

          </section>
        </div>
      </div>

      <div className="mt-10 flex justify-end space-x-4">
        {success ? (
          <div className="text-green-600 font-semibold">
            {isEdit ? "Activity updated successfully!" : "Activity created successfully!"}
          </div>
        ) : error ? (
          <div className="text-red-600 font-semibold">
            {error.message || "An error occurred. Please try again."}
          </div>
        ) : loading && (
          <div className="text-blue-600 font-semibold">
            {isEdit ? "Updating activity..." : "Creating activity..."}
          </div>
        )}
        {isEdit && (
          <Button style="secondary" disabled={deleting} onClick={() => { handleDelete(); setDeleting(true); }}>
            Delete Activity
          </Button>
        )}
        <Button
          disabled={loading}
          onClick={() => { handleSubmit(); setLoading(true); }}>
          {loading ? <LoadingSpinner /> : (isEdit ? "Save Changes" : "Create Activity")}
        </Button>
      </div>

      {/* Modal for image preview */}
      <AnimatePresence>
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
                  <CloseButton onClick={() => setImage(null)}></CloseButton>
                </div>
                <div className='relative h-[300px] w-full mx-auto mb-4'>
                  {/* <img src={image} alt="Preview" className='w-32 h-32 object-cover rounded-md' /> */}
                  {image && readyCropper ? (
                    <Cropper
                      image={image}
                      crop={crop}
                      zoom={zoom}
                      aspect={1}
                      onCropChange={setCrop}
                      onZoomChange={setZoom}
                      onCropComplete={onCropComplete}
                      cropShape='square'
                      classes={{
                        containerClassName: 'rounded-xl overflow-hidden',
                      }}
                    />
                  )
                    :
                    (
                      <div className='flex items-center justify-center h-full'>
                        <p className='text-gray-500'>Loading image...</p>
                      </div>
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
                    disabled={!readyCropper || !croppedAreaPixels}
                  >Upload Image</Button>
                </div>
              </div>

            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Add the delete confirmation modal */}
      <AnimatePresence>
        {deleteModalOpen && (
          <>
            <Backdrop className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" />
            <motion.div
              className="fixed inset-0 z-50 w-screen overflow-auto flex items-center justify-center"
              variants={DropIn}
              initial="hidden"
              animate="visible"
              exit="exit">

              <div className="bg-white rounded-lg p-6 max-w-md shadow-xl border border-gray-100">
                <div className='flex justify-between items-center mb-4'>
                  <h2 className='text-lg font-semibold'>Confirm Deletion</h2>
                  <CloseButton onClick={() => setDeleteModalOpen(false)}></CloseButton>
                </div>

                <div className='py-4'>
                  <p className="text-gray-700 mb-2">Are you sure you want to delete this activity?</p>
                  <p className="text-gray-500 text-sm">This action cannot be undone.</p>
                </div>

                <div className='flex justify-end gap-3 mt-6'>
                  <Button
                    style="secondary"
                    onClick={() => setDeleteModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    style="danger"
                    onClick={confirmDelete}
                  >
                    Delete
                  </Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

export default DocumentAction;