import { useEffect, useState } from 'react';
import Select from 'react-select';
import { useAdminRSO } from '../../hooks';

export default function DropdownSearch({ isDisabled, category, setSelectedCategory, selectedCategory, isSorting, setSelectedSorting, role, valueType = "label" }) {

  const [selectedOption, setSelectedOption] = useState(null);

  const {
    rsoData,
    isRSOLoading,
    isRSOError,
    rsoError,
    refetchRSOData,
  } = useAdminRSO({ manualEnable: true });


  // Extract only RSO_acronym values
  const options = rsoData?.rsos?.map((org) => {
    const snapshot = org.RSO_snapshot || {};
    return {
      value: org.rsoId,
      label: snapshot.acronym,
    };
  }) || [];

  useEffect(() => {
    if (isDisabled || role === "student") {
      setSelectedOption(null);
      setSelectedCategory("N/A");
    }
  }, [isDisabled, role, setSelectedCategory]);

  return (
    <Select
      placeholder={category ? category : "Select an RSO"}
      options={options}
      isLoading={isRSOLoading}
      isDisabled={isDisabled || role === "student"}
      isClearable={true}
      isSearchable={true}
      menuPortalTarget={document.body}
      value={category ? options?.find((opt) => opt.value === category) : selectedOption}
      onChange={(option) => {

        if (option === null) {
          // When clearing, set to empty string
          setSelectedOption(null);
          setSelectedCategory("");
          if (isSorting) {
            setSelectedSorting("");
          }
        } else {
          setSelectedOption(option);
          setSelectedCategory(option.value);
          if (isSorting) {
            setSelectedSorting(valueType === "id" ? option.value : option.label);
          }
        }
      }}
    />
  );
}
