import Switch from '@mui/material/Switch';
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { DropIn } from "../../../animations/DropIn";
import DefaultPicture from '../../../assets/images/default-profile.jpg';
import { Backdrop, Button, CloseButton, LoadingSpinner, ReusableDropdown, TextInput } from '../../../components';
import TagSelector from '../../../components/TagSelector';
import { useAcademicYears, useAdminRSO, useTagSelector } from '../../../hooks';

// make the academicYears an object so that the display is label while when clicked, the selected value is an id

// todo: academic year not showing the correct data from edit data
// allow acad year dropdown to read id and display label


// file manipulation
import Cropper from "react-easy-crop";
import getCroppedImg from '../../../utils/cropImage';

function RSOAction() {
  const location = useLocation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { mode, data, from, id } = location.state || {};
  const {
    rsoDetailData,
    isRSODetailLoading,
    isRSODetailError,
    rsoDetailError,
    refetchRSODetail,

    // for admin create RSO
    createRSOMutate,
    isCreating,
    isCreateSuccess,
    isCreateError,
    resetCreate,

    softDeleteRSOMutate,
    isSoftDeleteRSOLoading,
    isSoftDeleteRSOSuccess,
    isSoftDeleteRSOError,
    softDeleteRSOError,
    resetSoftDeleteRSO,

    updateRSOMutate,
    isUpdating,
    isUpdateSuccess,
    isUpdateError,
    updateError,
    resetUpdate,

  } = useAdminRSO({ rsoID: id });
  const {
    academicYears,
    academicYearsLoading,
    academicYearsError,
    academicYearsErrorMessage,
    refetchAcademicYears,
    isRefetchingAcademicYears,
    isAcademicYearsFetched
  } = useAcademicYears({ manualEnabled: true });

  const [showSearch, setShowSearch] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedTag, setSelectedTag] = useState("");
  const [selectedModalTag, setSelectedModalTag] = useState(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [tagName, setTagName] = useState("");
  const [originalTagName, setOriginalTagName] = useState("");
  const [error, setError] = useState("");
  const [descriptionError, setDescriptionError] = useState("");
  const [tagError, setTagError] = useState("");
  // Removed deprecated rsoStatus state (was tied to RSO_status field)

  useEffect(() => {
    let timer;
    if (loading) {
      timer = setTimeout(() => {
        setLoading(false);
      }, 5000); // 5 seconds
    }
    if (error) {
      timer = setTimeout(() => {
        setError("");
      }, 5000); // 5 seconds
    }

    if (setDescriptionError) {
      timer = setTimeout(() => {
        setDescriptionError("");
      }, 5000); // 5 seconds
    }

    return () => clearTimeout(timer);
  }, [loading, error, descriptionError]);


  //file manipulaion
  const [image, setImage] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [readyCropper, setReadyCropper] = useState(false);


  const isEdit = mode === 'edit';
  const isCreate = mode === 'create';

  const {
    selectedTags,
    tagsData,
    setSelectedTags,
    searchQuery,
    setSearchQuery,
    isFocused,
    setIsFocused,
    searchedData,
    handleTagClick,
    handleApiTagRemove,

    deleteTagMutation,
    isDeletingTag,
    deleteTagError,

    updateTagMutation,
    isUpdatingTag,
    updateTagError,

  } = useTagSelector();

  useEffect(() => {
    if (isEdit) {
      console.log("Edit mode data:", data);
    }
  }, [isEdit]);

  // make sure the two data are the same
  // const academicYearOptions = academicYears?.years?.map(year => ({
  //   label: year.label,
  //   value: year.id
  // })) || [];

  const academicYearOptions = academicYears?.years?.map(year => year.label) || [];

  const options = academicYears?.years || [];

  useEffect(() => {
    if (isEdit && rsoDetailData) {
      setFormData({
        RSO_name: rsoDetailData?.data?.RSO_snapshot?.name || "",
        RSO_acronym: rsoDetailData?.data?.RSO_snapshot?.acronym || "",
        picture: rsoDetailData?.data?.RSOid?.RSO_picture?.signedURL || null,
        RSO_category: rsoDetailData?.data?.RSO_snapshot?.category || "",
        RSO_tags: rsoDetailData?.data?.RSOid?.RSO_tags || [],
        RSO_College: rsoDetailData?.data?.RSO_snapshot?.college || "",
        // RSO_status removed
        RSO_description: rsoDetailData?.data?.RSO_snapshot?.description || "",
        RSO_picture: rsoDetailData?.data?.RSOid?.RSO_picture?.signedURL || null,
        RSO_picturePreview: rsoDetailData?.data?.RSOid?.RSO_picture?.signedURL || DefaultPicture,
        RSO_probationary: rsoDetailData?.data?.RSO_snapshot?.probationary || false,
        RSO_academicYear: rsoDetailData?.data?.academicYear || "",
        // academicYearId: rsoDetailData?.data?.academicYear || "",

      });
      { console.log("RSO details data for tags:", rsoDetailData?.data?.RSOid?.RSO_tags) }

      if (rsoDetailData?.data?.RSOid?.RSO_tags?.length) {
        const tagStrings = rsoDetailData?.data?.RSOid?.RSO_tags.map(tagObj =>
          typeof tagObj === 'object' ? tagObj.tag : tagObj
        );
        setSelectedTags(tagStrings);
      }
    }
  }, [isEdit, data]);

  useEffect(() => {
    if (isCreateSuccess) {
      navigate('..', { relative: 'path' });
    }
  }, [isCreateSuccess, navigate]);







  const handleOptions = ['CCIT', 'CBA', 'COA', 'COE', 'CAH', 'CEAS', 'CTHM'];
  const handleOptionsCategory = ['Professional & Affiliates', 'Professional', 'Special Interest', 'Office Aligned Organization'];

  const [RSO_picture, setRSOPicture] = useState(null);
  const [formData, setFormData] = useState({
    RSO_name: "",
    RSO_acronym: "",
    RSO_category: "",
    RSO_tags: [],
    RSO_college: "",
    // RSO_status removed from initial form state
    RSO_description: "",
    RSO_probationary: false,
    RSO_picture: null,
    RSO_picturePreview: DefaultPicture,
  });

  console.log("formData:", formData);

  const fileInputRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleTagId = (tag) => {
    const matchingTag = tagsData?.tags.find(tagObj => tagObj.tag.toLowerCase().trim() === tag.toLowerCase().trim());

    if (matchingTag) {
      console.log("Matching tag object found:", matchingTag);
      return matchingTag;
    } else {
      console.log("No matching tag found for:", tag);
      return null;
    }

  }

  const handleTagUpdate = () => {
    const tagId = selectedModalTag?._id;
    const newTag = selectedModalTag?.tag;

    updateTagMutation({ tagId: tagId, tagName: newTag }, {
      onSuccess: () => {
        console.log("Tag updated successfully:", newTag);
        // Update the selected tags with the new tag name
        setSelectedTags((prevTags) =>
          prevTags.map((t) =>
            t === originalTagName ? selectedModalTag?.tag : t
          )
        );
        // Only close modal and clear form on success
        setShowModal(false);
        setSelectedModalTag(null);
      },
      onError: (error) => {
        console.error("Error updating tag:", error);
        // Keep the modal open and form data intact on error
      }
    });

  }

  const handleTagDelete = (tag) => {
    console.log("Deleting tag:", tag);

    deleteTagMutation(tag, {
      onSuccess: () => {
        console.log("Tag deleted successfully:", tag);
        setSelectedTags((prevTags) =>
          prevTags.filter((t) => t !== selectedModalTag.tag)
        );
        setShowModal(false);
        setSelectedModalTag(null);
      },
      onError: (error) => {
        console.error("Error deleting tag:", error);
      }
    });

  };

  const handleTagModal = (tag) => {
    const tagObj = handleTagId(tag);
    console.log("Tag object for modal:", tagObj);

    if (tagObj) {
      setSelectedModalTag(tagObj);
      setOriginalTagName(tagObj.tag);
      setShowModal(true);
    }
  }



  const handleSubmit = async (e) => {
    try {
      const originalUrl = rsoDetailData?.data?.RSOid?.RSO_picture?.signedURL || null;

      const pictureUnchanged = (() => {
        // If user produced a File, it's definitely a change
        if (formData.RSO_picture instanceof File) return false;
        // If both are strings, normalize and compare
        if (typeof formData.RSO_picture === 'string' && typeof originalUrl === 'string') {
          // Optional: strip query params from signed URLs to compare base path
          const stripQuery = url => url.split('?')[0];
          return stripQuery(formData.RSO_picture) === stripQuery(originalUrl);
        }
        // Null vs null = unchanged
        return formData.RSO_picture == null && originalUrl == null;
      })();


      // No need to find the year object again, we already have the ID
      const payload = {
        ...formData,
        RSO_tags: selectedTags,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        // Use the stored academicYearId directly
        // academicYearId: formData.academicYearId || null,
      };

      console.log("compare formData from edit:", formData.RSO_picture, "with rsoDetailData:", rsoDetailData?.data?.RSOid?.RSO_picture?.signedURL);


      // go through all the fields and check one by one if the formData matches rsoDetailData
      // if it is, remove it from the payload
      if (isEdit && rsoDetailData) {


        if (formData.RSO_name === (rsoDetailData?.data?.RSOid?.RSO_name || "")) {
          delete payload.RSO_name;
        }

        if (formData.RSO_acronym === (rsoDetailData?.data?.RSOid?.RSO_acronym || "")) {
          delete payload.RSO_acronym;
        }

        if (formData.RSO_category === (rsoDetailData?.data?.RSOid?.RSO_category || "")) {
          delete payload.RSO_category;
        }

        if (JSON.stringify(selectedTags) === JSON.stringify(rsoDetailData?.data?.RSOid?.RSO_tags?.map(tagObj => typeof tagObj === 'object' ? tagObj.tag : tagObj) || [])) {
          delete payload.RSO_tags;
        }
        if (formData.RSO_College === (rsoDetailData?.data?.RSOid?.RSO_College || "")) {
          delete payload.RSO_College;
        }
        // Removed RSO_status comparison block
        if (formData.RSO_description === (rsoDetailData?.data?.RSO_snapshot?.description || "")) {
          delete payload.RSO_description;
        }
        if (formData.RSO_probationary === (rsoDetailData?.data?.RSO_snapshot?.probationary || false)) {
          delete payload.RSO_probationary;
        }

        // find out why they are not equal when they are the samex`
        if (pictureUnchanged) {
          console.log("compare formData from edit:", formData.RSO_picture, "with rsoDetailData:", rsoDetailData?.data?.RSOid?.RSO_picture?.signedURL);
          delete payload.RSO_picture;
        }

        // dont include RSO_picture, RSO_picturePreview, createdAt, picture, and updatedAt in payload

        delete payload.RSO_picturePreview;
        delete payload.RSO_academicYear;
        // delete payload.RSO_picture;
        delete payload.picture;
        delete payload.createdAt;
        delete payload.updatedAt;
      }

      if (isEdit && !Object.keys(payload).length) {
        console.log("type of formData.RSO_picture:", typeof rsoDetailData?.data?.RSOid?.RSO_picture?.signedURL, "Is file?", formData.RSO_picture instanceof File);
        toast.info("No changes made.");
        setLoading(false);
        return;
      }

      // Remove display-only fields from payload
      delete payload.RSO_academicYear;

      // Validate form data
      if (formData.RSO_description === "" || formData.RSO_description === null) {
        setDescriptionError("Description is required");
        setLoading(false);
        return;
      } else if (formData.RSO_description.length > 500) {
        setDescriptionError("Description must not exceed 500 characters.");
        setLoading(false);
        return;
      } else {
        setDescriptionError("");
      }

      if (selectedTags.length === 0) {
        setTagError("At least one tag is required");
        setLoading(false);
        return;
      } else if (selectedTags.length < 3) {
        setTagError("You must select at least 3 tags");
        setLoading(false);
        return;
      } else if (selectedTags.length > 5) {
        setTagError("You can only select up to 5 tags");
        setLoading(false);
        return;
      } else {
        setTagError("");
      }
      // Don't proceed if there are any errors
      if (error || descriptionError || tagError) {
        setLoading(false);
        return;
      }

      if (payload.RSO_academicYear) {
        console.log("Academic year selected:", payload.RSO_academicYear);
      }

      try {
        setLoading(true);
        let result;
        if (isEdit && data?.id) {
          console.log("Sending to updateRSOMutate:", payload);
          result = await updateRSOMutate({ id: data.id, updatedOrg: payload },
            {
              onSuccess: (data) => {
                console.log("RSO updated successfully:", data);
                toast.success('RSO updated successfully!');
                setLoading(false);
                navigate(-1);
              },
              onError: (error) => {
                console.error("Error updating RSO:", error);
                toast.error(error.message || "Failed to update RSO");
                setLoading(false);
                resetUpdate();
              }
            }
          );
        } else if (isCreate) {
          console.log("Sending to createRSO:", payload);
          createRSOMutate(payload,
            {
              onSuccess: (data) => {
                console.log("RSO created successfully:", data);
                toast.success('RSO created successfully!');
                setLoading(false);
                navigate(-1);
              },
              onError: (error) => {
                console.error("Error creating RSO:", error);
                toast.error(error.message || "Failed to create RSO");
                setLoading(false);
              }
            }
          );
        }

        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }

        setHasSubmitted(true);

        // Only navigate on success
        if (isCreateSuccess) {
          console.log("RSO operation successful:", result);
          navigate('..', { relative: 'path' });

          // Only clear form and navigate on success
          setFormData({
            RSO_name: "",
            RSO_acronym: "",
            RSO_category: "",
            RSO_tags: "",
            RSO_College: "",
            // RSO_status removed from reset form state
            RSO_description: "",
            RSO_probationary: false,
            RSO_picture: null,
          });
          setRSOPicture(null);
          setSelectedTags([]);
          setSearchQuery("");
        }
      } catch (error) {
        console.error("Error submitting RSO:", error);
        setLoading(false);
        // Keep form data intact on error
      }
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const handleImageChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      const preview = URL.createObjectURL(file);

      setImage(preview);
    }
  };

  if (image) {
    console.log("image is a File object:", image);
  }


  const handleDelete = async () => {
    try {
      softDeleteRSOMutate({ id: data.id }, {
        onSuccess: (data) => {
          console.log("RSO soft deleted successfully:", data);
          navigate('..', { relative: 'path' });
          toast.success("RSO soft deleted successfully!");
        },
        onError: (error) => {
          console.error("Error soft deleting RSO:", error);
          toast.error("Failed to soft delete RSO. Please try again.");
        }
      });
    } catch (error) {
      console.error("Error soft deleting RSO:", error);
      toast.error("Failed to soft delete RSO. Please try again.");
    }

  };

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
      RSO_picture: croppedFile,
      RSO_picturePreview: URL.createObjectURL(croppedFile),
    }));
    setImage(null);
  };




  return (
    <div>
      <div className='flex items-center gap-4 mb-8'>
        <div
          onClick={() => {
            navigate(-1);
          }}
          className='flex items-center justify-center rounded-full h-8 w-8 cursor-pointer border border-gray-300 group'>
          <svg xmlns="http://www.w3.org/2000/svg" className='fill-gray-600 size-4 group-hover:fill-off-black' viewBox="0 0 448 512"><path d="M9.4 233.4c-12.5 12.5-12.5 32.8 0 45.3l160 160c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L109.2 288 416 288c17.7 0 32-14.3 32-32s-14.3-32-32-32l-306.7 0L214.6 118.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0l-160 160z" /></svg>
        </div>
        <div>
          <h1 className='text-xl font-bold'>
            {isEdit ? `Edit ${from}` : isCreate ? 'Create RSO' : 'RSO Action'}
          </h1>
          <h2 className='text-sm font-200'>
            {isEdit ? `Manage Account details` : isCreate ? 'Create a new RSO Account' : ''}
          </h2>
        </div>
      </div>


      {/* first section */}
      <div className='flex flex-col md:flex-row items-start gap-4 mt-12'>
        {/* headers */}
        <div className='md:w-1/2 w-full'>
          <h1 className='text-lg font-semibold'>Profile</h1>
          <h2 className='text-sm'>Set account details</h2>
        </div>

        <form className='w-full'>
          {/* detailed sections */}
          <div className='flex flex-col items-start w-full'>
            <div className='flex justify-start items-end gap-4 w-full mb-4'>
              {/* Profile picture section */}
              <div className='flex flex-col items-center justify-center'>

                {/* only show if there's no image */}
                {!formData.RSO_picturePreview && (
                  <img
                    src={isEdit && !hasSubmitted ? formData?.picture : DefaultPicture}
                    alt="RSO Preview"
                    className="rounded-full h-24 w-24 object-cover"
                  />
                )}

                {/* image input */}
                {formData.RSO_picturePreview && (
                  <img
                    src={formData.RSO_picturePreview}
                    alt="RSO Preview"
                    className="rounded-full h-24 w-24 object-cover"
                  />
                )}
                <div className='flex gap-1 mt-2'>

                  {/* input image button */}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={fileInputRef}
                    onChange={handleImageChange}
                  />

                  <div
                    id="upload-button"
                    onClick={() => fileInputRef.current?.click()}
                    className='px-2 py-1 bg-transparent rounded-xl border border-gray-400 text-sm flex justify-center cursor-pointer'>

                    {isEdit ? `Edit` : isCreate ? 'Upload' : 'Upload'}
                  </div >
                  <label htmlFor="upload-button">
                    <span className="text-red-500">*</span>
                  </label>
                  {/* <div
                    onClick={() => {
                      setImage(null);
                      setFormData(prev => ({
                        ...prev,
                        RSO_picture: null,
                        RSO_picturePreview: DefaultPicture,
                      }));
                    }}
                    className='cursor-pointer px-2 py-1 bg-transparent rounded-full border border-gray-400 text-sm flex items-center justify-center'>
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512" className='fill-off-black size-3'><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                  </div > */}
                </div>
              </div>

            </div>
            <div className='w-full'>
              <label htmlFor="RSO_name" className='text-sm'>RSO Name <span className="text-red-500">*</span></label>
              <TextInput
                id={'RSO_name'}
                name={'RSO_name'}
                type={'text'}
                placeholder={'RSO Full Name'}
                value={formData.RSO_name}
                onChange={handleChange}
              ></TextInput>
              <div className='flex flex-col md:flex-row gap-4 mt-2'>
                <div className='w-full'>
                  <label htmlFor="RSO_acronym" className='text-sm'>RSO Acronym <span className="text-red-500">*</span></label>
                  <TextInput
                    id='RSO_acronym'
                    name='RSO_acronym'
                    type='text'
                    placeholder='Acronym'
                    value={formData.RSO_acronym}
                    onChange={handleChange}
                  >

                  </TextInput>
                </div>
                <div className='w-full'>
                  <label htmlFor="RSO_college" className='text-sm'>RSO College</label>
                  <ReusableDropdown
                    name="RSO_college"
                    value={formData.RSO_College}
                    options={handleOptions}
                    onChange={(e) => {
                      console.log("Selected:", e.target.value);
                      setFormData({ ...formData, RSO_College: e.target.value })
                    }
                    }
                  ></ReusableDropdown>
                </div>
              </div>

              <div className='w-full'>
                <label htmlFor="RSO_category" className='text-sm'>RSO Category <span className="text-red-500">*</span></label>
                <ReusableDropdown
                  name="RSO_category"
                  value={formData.RSO_category}
                  options={handleOptionsCategory}
                  onChange={(e) => {
                    console.log("Selected:", e.target.value);
                    setFormData({ ...formData, RSO_category: e.target.value })
                  }
                  }
                ></ReusableDropdown>
              </div>

              <div className='mt-2'>
                <label htmlFor="large-input" className='text-sm'>Description <span className="text-red-500">*</span></label>
                <textarea
                  rows="4"
                  name="RSO_description"
                  value={formData.RSO_description}
                  onChange={handleChange}
                  className="bg-textfield border border-mid-gray text-gray-900 text-sm rounded-md focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                  placeholder="Tell us about your organization..."
                />
                {descriptionError && (
                  <div className="text-red-500 text-sm mt-1">
                    {descriptionError}
                  </div>
                )}
              </div>
              <label htmlFor="probationary" className='text-sm'>Probationary Status</label>


              <Switch
                id='probationary'
                checked={formData.RSO_probationary}
                value={formData.RSO_probationary}
                onChange={(e) => {
                  const isChecked = e.target.checked;
                  console.log("Switch toggled", e.target.checked)
                  setFormData((prev) => ({
                    ...prev,
                    RSO_probationary: isChecked,
                  }));
                }}
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
          </div>

        </form>


      </div>

      <div className='w-full h-[1px] bg-gray-200 mt-4'></div>

      {/* second section */}
      <div className='flex flex-col md:flex-row justify-between items-start gap-4 mt-12'>
        {/* headers */}
        <div className='md:w-1/2 w-full'>
          <h1 className='text-lg font-semibold'>Tags</h1>
          <h2 className='text-sm'>Add account tags</h2>
        </div>

        {/* detailed sections */}
        <div className='w-full'>
          <TagSelector
            style={"crud"}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            setShowSearch={setShowSearch}
            setIsFocused={setIsFocused}
            searchedData={searchedData}
            handleTagClick={handleTagClick}
            selectedTags={selectedTags}
            handleApiTagRemove={handleApiTagRemove}
            setShowModal={setShowModal}
            handleTagModal={(tag) => {
              handleTagModal(tag);
            }}
          />
          {tagError && (
            <div className="text-red-500 text-sm mt-1">
              {tagError}
            </div>
          )}
        </div>
      </div>

      <div className='w-full h-[1px] bg-gray-200 mt-4'></div>

      <div className={`w-full flex gap-2 mt-4 ` + (isEdit && (rsoDetailData?.data?.RSO_isDeleted === false) ? 'justify-between' : 'justify-end')}>
        {isEdit && (rsoDetailData?.data?.RSO_isDeleted === false) && (
          <Button
            variant="danger"
            onClick={handleDelete}
          >
            Delete
          </Button>
        )}
        <div className='flex gap-2 items-center'>
          {isCreateSuccess ? (
            <div className='text-green-600 text-sm font-semibold'>
              {isEdit ? 'RSO updated successfully!' : isCreate ? 'RSO created successfully!' : 'Action completed successfully!'}
            </div>
          ) :
            (updateError || isCreateError) ? (
              <div className='text-red-600 text-sm font-semibold'>
                {updateError ? updateError : isCreateError}
              </div>
            ) :
              (isUpdating || isCreating) && (
                <div className='text-gray-600 text-sm font-semibold'>
                  {isEdit ? 'Updating RSO...' : isCreate ? 'Creating RSO...' : 'Processing...'}
                </div>
              )
          }
          <Button
            style="secondary"
            size="small"
            onClick={() => navigate(-1)}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="small"
            disabled={loading}
            onClick={() => { handleSubmit(); setLoading(true); }}
            type="submit"
          >
            {loading ? <LoadingSpinner /> : (isEdit ? 'Update' : isCreate ? 'Create' : 'Submit')}
          </Button>
        </div>
      </div>

      {/* Modal for tag editing */}
      <AnimatePresence>
        {showModal && (
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
                  <h2 className='text-sm font-semibold'>Edit Tag</h2>
                  <CloseButton onClick={() => setShowModal(false)}></CloseButton>
                </div>
                <div className='flex flex-col gap-2'>
                  <label className='text-sm'>Tag Name</label>
                  <TextInput
                    type="text"
                    placeholder='Enter tag name'
                    value={selectedModalTag?.tag || "No tag detected"}
                    onChange={(e) => {
                      setSelectedModalTag((prev) => ({
                        ...prev,
                        tag: e.target.value,
                      }));
                    }}
                  />
                  <div className='flex justify-end mt-4 gap-2'>

                    {/* delete */}
                    <Button
                      onClick={() => {

                        handleTagDelete(selectedModalTag?._id);
                      }}
                      style={"secondary"}
                    >
                      Delete Tag
                    </Button>
                    {/* edit */}
                    <Button
                      onClick={
                        handleTagUpdate
                      }
                    >
                      Save Changes
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>


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
                  <CloseButton onClick={() => {
                    setImage(null);
                    setReadyCropper(false);
                  }}></CloseButton>
                </div>
                <div className='relative h-[300px] w-full mx-auto mb-4'>
                  {/* <img src={image} alt="Preview" className='w-32 h-32 object-cover rounded-md' /> */}
                  {image && readyCropper && (
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

    </div>

  )
}

export default RSOAction;