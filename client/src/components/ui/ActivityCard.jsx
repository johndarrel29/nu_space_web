import DefaultPicture from "../../assets/images/default-picture.png";
import Badge from './Badge';

function ActivityCard({
  onClick,
  activity,
  Activity_name,
  Activity_description,
  RSO_acronym,
  Activity_image,
  Activity_datetime,
  Activity_approval_status,
  Activity_place,
  Activity_registration_total,
}) {

  const status =
    Activity_approval_status === 'approved' ? 'Approved' :
      Activity_approval_status === 'rejected' ? 'Rejected' :
        'Pending';

  // Add status-based badge color with improved readability
  const statusBadgeClass =
    status === 'Approved'
      ? 'bg-green-100 text-green-900 border border-green-300'
      : status === 'Rejected'
        ? 'bg-red-100 text-red-900 border border-red-300'
        : 'bg-yellow-100 text-yellow-900 border border-yellow-300';


  // Handlers
  const handleBadge = (badge) => {
    switch (badge) {
      case "pending":
        return <Badge style="primary" text="Pending" />;
      case "approved":
        return <Badge style="success" text="Approved" />;
      case "rejected":
        return <Badge style="error" text="Rejected" />;
      default:
        return <Badge style="primary" text={badge || "Unknown"} />;
    }
  };

  return (
    <div
      className="max-w-[250px] bg-white rounded-md overflow-hidden transition ease-in-out cursor-pointer group"
      onClick={() => onClick(activity)}
      title={Activity_name}
    >
      {/* Image with status badge */}
      <div className="relative w-full aspect-square">
        <span className={`absolute top-2 left-2 z-10 px-2 py-1`}>
          {handleBadge(activity.Activity_approval_status)}
        </span>
        <div className="w-full h-full">
          <img
            src={Activity_image || DefaultPicture}
            alt={Activity_name}
            className="w-full h-full object-cover rounded-b-md group-hover:opacity-80"
          />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex justify-between items-start mb-2">
          <h3 className="font-bold text-off-black text-lg line-clamp-3 group-hover:underline">
            {Activity_name}
          </h3>
        </div>

        <p className="text-gray-600 text-sm line-clamp-2 mb-3">
          {RSO_acronym}
        </p>

        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-600">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-4 w-4 mr-1"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm">{Activity_datetime}</span>
          </div>
        </div>
        <div className="flex items-center text-gray-600">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z"
              clipRule="evenodd"
            />
          </svg>
          <span className="text-sm">{activity.Activity_place}</span>
        </div>
      </div>
    </div>
  );
}

export default ActivityCard;