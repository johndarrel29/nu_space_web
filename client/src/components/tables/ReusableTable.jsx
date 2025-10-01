import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import DefaultPicture from "../../assets/images/default-profile.jpg";
import { Badge, CardSkeleton } from "../../components";
import { ReusableDropdown, Searchbar } from "../ui";

// Moved the inline array into constants + helper
const SPECIAL_HEADING_KEYS = [
    "title",
    "document_status",
    "submittedBy",
    "createdAt",
    "actions",
    "RSO_membershipStatus",
    "remove",
    "RSO_isDeleted",
    "message",
    "notifType",
    "fullName",
    "email",
    "role",
    "assignedRSO",
];

const isSpecialHeadingKey = (key) => SPECIAL_HEADING_KEYS.includes(key);

export default function ReusableTable({
    columnNumber,
    totalData,
    tableHeading,
    tableRow,
    options,
    value,
    onChange,
    showAllOption,
    onActionClick,
    onEditClick,
    onClick,
    children,
    placeholder,
    error,
    isLoading,
    onDocumentClick,
    showFilters = true,
    showDropdown = true,
    activityId = null,
    searchQuery,
    setSearchQuery,
    limit,
    page,
    onLimitChange,
    onPageChange,
    pageNumber,
}) {
    const [currentPage, setCurrentPage] = useState(page || 1);
    const [postsPerPage, setPostsPerPage] = useState(limit || 10);
    const [showSearch, setShowSearch] = useState(false);
    const location = useLocation();

    const isOnUsersPage = location.pathname === '/users';

    useEffect(() => {
        if (typeof page === "number") setCurrentPage(page);
    }, [page]);

    useEffect(() => {
        if (typeof limit === "number") setPostsPerPage(limit);
    }, [limit]);


    const lastPostIndex = currentPage * postsPerPage;
    const firstPostIndex = lastPostIndex - postsPerPage;

    const filteredRows = tableRow.filter((row) => {
        return Object.values(row).some((value) => {
            if (typeof value === "string") {
                return value.toLowerCase().includes(searchQuery.toLowerCase());
            } else if (typeof value === "number") {
                return value.toString().includes(searchQuery.toLowerCase());
            }
            return false;
        });
    });


    function handleStyle(userRole) {


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


    const handleBadge = (badge) => {
        if (badge === "pending") {
            return <Badge style="primary" text={"Pending"} />
        }
        if (badge === "approved") {
            return <Badge style="success" text={"Approved"} />
        }
        if (badge === "rejected") {
            return <Badge style="error" text={"Rejected"} />
        }
    }

    const currentPosts = onPageChange ? tableRow : filteredRows.slice(firstPostIndex, lastPostIndex);
    // const currentPosts = tableRow;


    const pages = Array.from({ length: Math.ceil(filteredRows.length / postsPerPage) }, (_, i) => i + 1);

    const currentPageHandler = (selectedPage) => {
        if (onPageChange ? (selectedPage < 1 || selectedPage > currentPage.length) : (selectedPage < 1 || selectedPage > pages.length)) return; // Prevent going out of bounds

        if (onPageChange) {
            console.log("Calling onPageChange with:", selectedPage);
            onPageChange(selectedPage);
        } else {
            setCurrentPage(selectedPage);
        }
    }

    const handlePostsPerPageChange = (event) => {
        const value = event.target.value;
        if (onLimitChange) {
            onLimitChange(value);
        } else {
            setPostsPerPage(value); // Reset to the first page when changing posts per page
            setCurrentPage(1);
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
        <>
            {showFilters && (
                <>
                    {/* searchbar and dropdown */}
                    <div className="mt-4 mb-4 w-full flex flex-col space-x-0 md:flex-row md:space-x-2 md:space-y-0 sm:flex-col sm:space-y-2 sm:space-x-0">
                        <div className="w-full lg:w-full md:w-full">
                            <Searchbar placeholder={placeholder || "Search an organization"} searchQuery={searchQuery} setSearchQuery={setSearchQuery} />
                        </div>
                        {showDropdown && (
                            <div className="w-full mt-4 md:mt-0 lg:w-1/2 md:w-full">
                                <ReusableDropdown
                                    icon={true}
                                    options={options}
                                    showAllOption={showAllOption}
                                    value={value}
                                    onChange={onChange}
                                />
                            </div>
                        )}
                    </div>

                    <div className="flex justify-between items-center mb-4 w-full">
                        <span className="text-gray-700 font-semibold">
                            Showing {totalData ? totalData : filteredRows.length > 0 ? filteredRows.length : "0"} results
                        </span>
                        <li className="flex justify-center ">
                            <select
                                className={`w-24 h-10 rounded-md bg-white border border-mid-gray p-1 font-bold`}
                                value={postsPerPage}
                                onChange={handlePostsPerPageChange}
                            >
                                <option value={10}>10 rows</option>
                                <option value={20}>20 rows</option>
                                <option value={50}>50 rows</option>
                            </select>
                        </li>
                    </div>
                </>

            )}

            {/* children */}
            {children ? (
                <div className="flex justify-center mb-4">
                    {children}
                </div>
            ) :
                error ? (
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
                            {error}
                        </p>
                    </div>
                )
                    :
                    (
                        <div className="border border-mid-gray rounded-md">
                            <div className="overflow-x-auto">
                                {isLoading ? (
                                    <div className="w-full flex justify-center">
                                        <CardSkeleton></CardSkeleton>
                                    </div>
                                )
                                    :
                                    (
                                        <table className="w-full min-w-[800px]">
                                            <thead className="border-b border-mid-gray bg-textfield ">
                                                <tr
                                                    className="rounded-md text-left text-xs font-medium font-bold uppercase tracking-wider ">
                                                    {tableHeading.slice(0, columnNumber).map((heading, index) => (
                                                        <th key={`header-${index}-${heading.key || heading.name}`} className="text-left p-3">
                                                            <h1 className="text-gray-900 dark:text-white">{heading.name}</h1>
                                                        </th>
                                                    ))}
                                                </tr>

                                            </thead>


                                            <tbody>
                                                {currentPosts.length === 0 ? (
                                                    <tr>
                                                        <td colSpan={columnNumber} className="p-3 text-center">
                                                            <div className="text-gray-500">
                                                                No results found
                                                            </div>
                                                        </td>
                                                    </tr>
                                                ) : (
                                                    currentPosts.map((row, index) => (
                                                        <tr
                                                            key={row.id}
                                                            onClick={onClick ? () => onClick(row) : undefined}
                                                            className="border-b border-mid-gray hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">

                                                            {tableHeading.slice(0, columnNumber).map((heading) => (
                                                                <td key={heading.id} className="p-3">

                                                                    {
                                                                        isSpecialHeadingKey(heading.key)
                                                                            ? (
                                                                                <>
                                                                                    <div className="py-0">
                                                                                        {(heading.key === "title") && (
                                                                                            <div className="flex items-center space-x-3">
                                                                                                <div className="text-sm font-medium text-gray-900">{firstPostIndex + index + 1}</div>
                                                                                                <div>
                                                                                                    {/* <span className="text-sm font-semibold text-gray-900 dark:text-white">{row.title}</span> */}

                                                                                                    <>
                                                                                                        <span className="text-sm font-semibold text-gray-900 dark:text-white">{row.title}</span>
                                                                                                        <div className="text-xs text-gray-500 capitalize">{row.notifType ? row.notifType.replace(/_/g, " ") : ""
                                                                                                        }</div>
                                                                                                    </>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                        {heading.key === "document_status" && (
                                                                                            <span className="text-sm font-semibold text-gray-900 dark:text-white">{handleBadge(row.document_status)}</span>
                                                                                        )}
                                                                                        {heading.key === "submittedBy" && (
                                                                                            <span className="font-light text-gray-600 dark:text-white flex items-center text-xs ">{row.submittedBy}</span>
                                                                                        )}
                                                                                        {heading.key === "createdAt" && (
                                                                                            <span className="text-sm font-light text-gray-600 dark:text-white flex items-center ">{row.createdAt}</span>
                                                                                        )}
                                                                                        {heading.key === "actions" && (
                                                                                            <div className="flex gap-2">
                                                                                                {isOnUsersPage && (
                                                                                                    <div
                                                                                                        onClick={(e) => {
                                                                                                            e.stopPropagation();
                                                                                                            if (onEditClick) {
                                                                                                                onEditClick(row);
                                                                                                            }
                                                                                                        }}
                                                                                                        className="rounded-full w-8 h-8 bg-white flex justify-center items-center cursor-pointer group">
                                                                                                        <svg xmlns="http://www.w3.org/2000/svg" className="fill-gray-600 size-4 group-hover:fill-off-black" viewBox="0 0 640 640"><path d="M416.9 85.2L372 130.1L509.9 268L554.8 223.1C568.4 209.6 576 191.2 576 172C576 152.8 568.4 134.4 554.8 120.9L519.1 85.2C505.6 71.6 487.2 64 468 64C448.8 64 430.4 71.6 416.9 85.2zM338.1 164L122.9 379.1C112.2 389.8 104.4 403.2 100.3 417.8L64.9 545.6C62.6 553.9 64.9 562.9 71.1 569C77.3 575.1 86.2 577.5 94.5 575.2L222.3 539.7C236.9 535.6 250.2 527.9 261 517.1L476 301.9L338.1 164z" /></svg>
                                                                                                    </div>
                                                                                                )}
                                                                                                <div
                                                                                                    onClick={(e) => {
                                                                                                        e.stopPropagation();
                                                                                                        if (onActionClick) {
                                                                                                            onActionClick(row);
                                                                                                        }
                                                                                                    }}
                                                                                                    className="rounded-full w-8 h-8 bg-white flex justify-center items-center cursor-pointer group">
                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="fill-gray-600 size-4 group-hover:fill-off-black" viewBox="0 0 448 512"><path d="M135.2 17.7L128 32 32 32C14.3 32 0 46.3 0 64S14.3 96 32 96l384 0c17.7 0 32-14.3 32-32s-14.3-32-32-32l-96 0-7.2-14.3C307.4 6.8 296.3 0 284.2 0L163.8 0c-12.1 0-23.2 6.8-28.6 17.7zM416 128L32 128 53.2 467c1.6 25.3 22.6 45 47.9 45l245.8 0c25.3 0 46.3-19.7 47.9-45L416 128z" /></svg>
                                                                                                </div>

                                                                                            </div>
                                                                                        )}
                                                                                        {heading.key === "fullName" && (
                                                                                            <div className="flex items-center space-x-6">
                                                                                                <div>{row.index}</div>
                                                                                                <div className="flex flex-col items-start">
                                                                                                    <div className="text-sm font-medium text-gray-900">{row.fullName}</div>
                                                                                                    <div>
                                                                                                        <div className="text-sm text-gray-600">{row.email}</div>
                                                                                                    </div>
                                                                                                </div>
                                                                                            </div>
                                                                                        )}
                                                                                        {heading.key === "role" && (
                                                                                            <div className="flex items-center justify-start">
                                                                                                <Badge style={handleStyle(row.role)} text={handleRoleName(row.role)} />
                                                                                            </div>
                                                                                        )}
                                                                                        {heading.key === "assignedRSO" && (
                                                                                            <div className="flex items-center justify-start">
                                                                                                <Badge style={row.assignedRSO ? "success" : null} text={row.assignedRSO} />
                                                                                            </div>
                                                                                        )}

                                                                                        {heading.key === "remove" && (
                                                                                            <>
                                                                                                {row.RSO_isDeleted === true ? (
                                                                                                    <div className="flex gap-2">
                                                                                                        {/* restore */}
                                                                                                        <div
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation();
                                                                                                                if (onActionClick) {
                                                                                                                    onActionClick(row, { type: "restore" });
                                                                                                                }
                                                                                                            }}
                                                                                                            className="rounded-full w-8 h-8 bg-white flex justify-center items-center cursor-pointer group">
                                                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="fill-gray-600 size-4 group-hover:fill-off-black" viewBox="0 0 640 640"><path d="M534.6 182.6C547.1 170.1 547.1 149.8 534.6 137.3L470.6 73.3C461.4 64.1 447.7 61.4 435.7 66.4C423.7 71.4 416 83.1 416 96L416 128L256 128C150 128 64 214 64 320C64 337.7 78.3 352 96 352C113.7 352 128 337.7 128 320C128 249.3 185.3 192 256 192L416 192L416 224C416 236.9 423.8 248.6 435.8 253.6C447.8 258.6 461.5 255.8 470.7 246.7L534.7 182.7zM105.4 457.4C92.9 469.9 92.9 490.2 105.4 502.7L169.4 566.7C178.6 575.9 192.3 578.6 204.3 573.6C216.3 568.6 224 556.9 224 544L224 512L384 512C490 512 576 426 576 320C576 302.3 561.7 288 544 288C526.3 288 512 302.3 512 320C512 390.7 454.7 448 384 448L224 448L224 416C224 403.1 216.2 391.4 204.2 386.4C192.2 381.4 178.5 384.2 169.3 393.3L105.3 457.3z" /></svg>
                                                                                                        </div>
                                                                                                        {/* hard delete */}
                                                                                                        <div
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation();
                                                                                                                if (onActionClick) {
                                                                                                                    onActionClick(row);
                                                                                                                }
                                                                                                            }}
                                                                                                            className="rounded-full w-8 h-8 bg-white flex justify-center items-center cursor-pointer group">
                                                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="fill-gray-600 size-4 group-hover:fill-off-black" viewBox="0 0 640 640"><path d="M232.7 69.9L224 96L128 96C110.3 96 96 110.3 96 128C96 145.7 110.3 160 128 160L512 160C529.7 160 544 145.7 544 128C544 110.3 529.7 96 512 96L416 96L407.3 69.9C402.9 56.8 390.7 48 376.9 48L263.1 48C249.3 48 237.1 56.8 232.7 69.9zM512 208L128 208L149.1 531.1C150.7 556.4 171.7 576 197 576L443 576C468.3 576 489.3 556.4 490.9 531.1L512 208z" /></svg>
                                                                                                        </div>
                                                                                                    </div>
                                                                                                ) : (
                                                                                                    <>
                                                                                                        {/* soft delete */}
                                                                                                        <div
                                                                                                            onClick={(e) => {
                                                                                                                e.stopPropagation();
                                                                                                                if (onActionClick) {
                                                                                                                    onActionClick(row);
                                                                                                                }
                                                                                                            }}
                                                                                                            className="rounded-full w-8 h-8 bg-white flex justify-center items-center cursor-pointer group">
                                                                                                            <svg xmlns="http://www.w3.org/2000/svg" className="fill-gray-600 size-4 group-hover:fill-off-black" viewBox="0 0 640 640"><path d="M183.1 137.4C170.6 124.9 150.3 124.9 137.8 137.4C125.3 149.9 125.3 170.2 137.8 182.7L275.2 320L137.9 457.4C125.4 469.9 125.4 490.2 137.9 502.7C150.4 515.2 170.7 515.2 183.2 502.7L320.5 365.3L457.9 502.6C470.4 515.1 490.7 515.1 503.2 502.6C515.7 490.1 515.7 469.8 503.2 457.3L365.8 320L503.1 182.6C515.6 170.1 515.6 149.8 503.1 137.3C490.6 124.8 470.3 124.8 457.8 137.3L320.5 274.7L183.1 137.4z" /></svg>
                                                                                                        </div></>
                                                                                                )}
                                                                                            </>
                                                                                        )}
                                                                                        {heading.key === "message" && (
                                                                                            <div className="flex flex-col">
                                                                                                <span className="text-sm text-gray-500 dark:text-gray-400">{row.message}</span>
                                                                                            </div>
                                                                                        )}

                                                                                        {heading.key === "RSO_membershipStatus" && (
                                                                                            row.RSO_membershipStatus === true ? (
                                                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                                                        <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                                                                                                    </svg>
                                                                                                    Open
                                                                                                </span>
                                                                                            ) : (
                                                                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                                                                                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3 mr-1" viewBox="0 0 20 20" fill="currentColor">
                                                                                                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                                                                                                    </svg>
                                                                                                    Not open
                                                                                                </span>
                                                                                            )
                                                                                        )}
                                                                                    </div>

                                                                                </>
                                                                            ) : ["RSO_name", "RSO_College", "picture", "RSO_recognition"].includes(heading.key)
                                                                                ? (
                                                                                    // Grouping these in one <td> with custom layout
                                                                                    <div className="flex items-center space-x-3">
                                                                                        <div className="text-sm font-medium text-gray-900">{firstPostIndex + index + 1}</div>
                                                                                        {/* If it's the name column and image exists, show it */}
                                                                                        {heading.key === "RSO_name" && (
                                                                                            <img
                                                                                                src={
                                                                                                    row.RSO_picture &&
                                                                                                        !row.RSO_picture.includes("example.com")
                                                                                                        // && 
                                                                                                        // row.picture.match(/\.(jpeg|jpg|gif|png|webp|svg)$/i) // Check if it's an image URL
                                                                                                        ? row.RSO_picture
                                                                                                        : DefaultPicture
                                                                                                }
                                                                                                alt={row.RSO_name}
                                                                                                className="w-10 h-10 rounded-full object-cover"
                                                                                                onError={(e) => {
                                                                                                    e.target.src = DefaultPicture; // Fallback if image fails to load
                                                                                                }}
                                                                                            />
                                                                                        )}
                                                                                        <div className="flex flex-col">
                                                                                            {heading.key === "RSO_name" && (
                                                                                                <>
                                                                                                    <span className="text-xs text-gray-500 capitalize">{row.RSO_recognition ? row.RSO_recognition.replace(/_/g, " ").replace(/rso/gi, "RSO") : ""}</span>
                                                                                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{row.RSO_name}</span>
                                                                                                    <span className="text-xs text-gray-500">{row.RSO_College}</span>
                                                                                                </>
                                                                                            )}
                                                                                        </div>
                                                                                    </div>
                                                                                ) : (
                                                                                    (
                                                                                        <p className="text-gray-900 dark:text-white">{row[heading.key]}</p>
                                                                                    )
                                                                                )
                                                                    }
                                                                </td>
                                                            ))}
                                                        </tr>
                                                    )))}
                                            </tbody>
                                        </table>
                                    )
                                }
                            </div>
                        </div>
                    )}


            {/* pagination */}
            <div className='w-full bottom-20 mt-4'>
                <nav>
                    <div className="flex justify-center space-x-2">

                        <div className={`page-item mx-1 px-3 py-2 bg-white border border-mid-gray rounded-md font-semibold rounded`}>
                            <button className='page-link' onClick={() => currentPageHandler(currentPage - 1)}>Prev</button>
                        </div>
                        <div className="px-4 py-2 font-semibold">
                            {pageNumber ? (`${currentPage} of ${pageNumber}`) : (pages.length > 0 ? `${currentPage} of ${pages.length}` : "0 of 0")}
                        </div>
                        <div className={`page-item mx-1 px-3 py-2 bg-white border border-mid-gray rounded-md font-semibold rounded`}>
                            <button className='page-link' onClick={() => currentPageHandler(currentPage + 1)}>Next</button>
                        </div>
                    </div>
                </nav>
            </div>
        </>
    );
}