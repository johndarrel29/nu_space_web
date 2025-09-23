import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';

function ActivitySkeleton({ count = 3 }) {
  return (
    <>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="max-w-[250px] bg-white rounded-md overflow-hidden animate-pulse cursor-pointer"
        >
          {/* Image with status badge */}
          <div className="relative w-full aspect-square">
            <div className="absolute top-2 left-2 px-2 py-1 rounded-full w-16">
              <Skeleton height={20} />
            </div>
            <Skeleton className="w-full h-full object-cover rounded-b-md" />
          </div>

          {/* Content */}
          <div className="p-4 space-y-3">
            <div className="flex justify-between items-start mb-2">
              <Skeleton height={20} width="60%" />
              <div className="flex items-center gap-1">
                <Skeleton circle height={16} width={16} />
                <Skeleton height={14} width={30} />
              </div>
            </div>

            <Skeleton height={14} width="100%" />
            <Skeleton height={14} width="80%" />

            <div className="flex justify-between text-sm pt-2">
              <div className="flex items-center gap-1">
                <Skeleton circle height={16} width={16} />
                <Skeleton height={12} width={60} />
              </div>
              <div className="flex items-center gap-1">
                <Skeleton circle height={16} width={16} />
                <Skeleton height={12} width={30} />
              </div>
            </div>
          </div>
        </div>
      ))}
    </>
  );
}

export default ActivitySkeleton;
