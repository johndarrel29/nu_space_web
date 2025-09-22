import { Tooltip } from 'react-tooltip';
import editIcon from '../../assets/icons/pen-to-square-solid.svg';
import deleteIcon from '../../assets/icons/trash-solid.svg';
import { useUserProfile } from "../../hooks";
import { FormatDate } from '../../utils';
import { Badge } from '../ui';

const TableRow = ({ userRow, onOpenModal, index }) => {
  const { user, userProfile } = useUserProfile();

  const handleActionClick = (action) => () => {
    onOpenModal(action, userRow);
  };

  const isAdmin = userProfile?.user?.role === 'admin';
  const isSuperAdmin = userProfile?.user?.role === 'super_admin';

  // tooltip style dependency
  const tooltipId = `edit-tooltip-${userRow._id}`;
  const isRestricted = isAdmin && (userRow?.role === "admin" || userRow?.role === "super_admin");
  const restrictOwnAccount = userRow?._id === user?._id;



  const fullName = [userRow.firstName, userRow.lastName].filter(Boolean).join(' ');

  const formattedDate = FormatDate(userRow.createdAt);

  function handleStyle(userRole) {
    console.log("userRow role: " + userRole)

    switch (userRole) {
      case 'super_admin':
        return 'primary';
      case 'admin':
        return 'secondary';
      case 'coordinator':
        return 'secondary';
      case 'rso_representative':
        return 'success';
      case 'student':
        return 'quarternary';
      default:
        return '';

    }
  }

  function handleRoleName(userRole) {
    switch (userRole) {
      case 'super_admin':
        return 'Super Admin';
      case 'admin':
        return 'Admin';
      case 'coordinator':
        return 'Coordinator';
      case 'rso_representative':
        return 'RSO Representative';
      case 'student':
        return 'Student';
      default:
        return userRole;
    }
  }


  return (
    <tr className='hover:bg-gray-200 transition duration-300 ease-in-out' >
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center">
          <div className="text-sm font-medium text-gray-900">{index}</div>
          <div className="ml-4">
            <div className="text-sm font-medium text-gray-900">{fullName}</div>
            <div className="text-sm text-gray-600">{userRow.email}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-600 flex items-center justify-center">{formattedDate}</div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="flex items-center justify-center">
          <Badge style={handleStyle(userRow.role)} text={handleRoleName(userRow.role)} />
        </div>
      </td>
      <td className="px-6 py-4 whitespace-nowrap">

        {!(userRow.role === 'super_admin' || userRow.role === 'admin' || userRow.role === 'student') && (
          <div className="flex items-center justify-center">
            {console.log("results: " + userRow)}
            {console.log("role: " + userRow.role)}
            <Badge style={handleStyle(userRow.role)} text={userRow?.assigned_rso?.RSO_acronym} />
          </div>
        )}

      </td>
      <td className="px-6 py-4 whitespace-nowrap ">
        <div className='space-x-2 flex flex-row justify-center items-center'>

          {/* prevents user from editing or deleting their own profile */}
          {userRow?._id === userProfile?.user?._id ? ("") :
            (
              <>
                <div
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={isRestricted ? "You are not allowed to edit" : "edit"}
                  className={
                    `mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10 bg-white transition duration-300 cursor-pointer`
                    + (isRestricted ? " bg-gray-400" : "")}
                  onClick={isRestricted ? null : handleActionClick('edit')}
                >
                  <img src={editIcon} alt="edit" className={`size-4` + (isRestricted ? " opacity-40" : "")} />

                </div>
                {/* Tooltip component */}
                <Tooltip id="global-tooltip" className="bg-gray-600 text-white text-xs p-2 rounded shadow-sm opacity-50" />

                <div
                  data-tooltip-id="global-tooltip"
                  data-tooltip-content={isRestricted ? "You are not allowed to delete" : "delete"}
                  className={
                    `mx-auto flex size-12 shrink-0 items-center justify-center rounded-full sm:mx-0 sm:size-10 bg-white transition duration-300 cursor-pointer`
                    + (isRestricted ? " bg-gray-400" : "")}
                  onClick={isRestricted ? null : handleActionClick('delete')}
                >
                  <img src={deleteIcon} alt="delete" className={`size-4` + (isRestricted ? " opacity-40" : "")} />
                </div>
              </>
            )}
        </div>
      </td>
    </tr>
  );
};

export default TableRow;