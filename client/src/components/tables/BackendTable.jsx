import { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import DefaultPicture from "../../assets/images/default-picture.png";
import { CardSkeleton, DropdownSearch, ReusableDropdown, Searchbar } from "../../components";
import { useAdminAcademicYears, useAdminActivity, useAdminDocuments, useAVPDocuments, useCoordinatorDocuments, useDirectorDocuments } from "../../hooks";
import { useUserStoreWithAuth } from '../../store';
import { FormatDate } from "../../utils";
import Badge from "../ui/Badge";

// TODO: Add loading and error states for the table
// TODO: Fix the loading to show a skeleton loader
// TODO: Debounce the search input to avoid too many API calls
// NOTE: dropdownsearch currently doesn't filter because submittedBy model returns null

export default function BackendTable({ activeTab, rsoId = "" }) {
    const navigate = useNavigate();
    const location = useLocation();
    const [activitySelected, setActivitySelected] = useState(null);
    const [activityRoleData, setActivityRoleData] = useState(null);
    // State
    const [searchQuery, setSearchQuery] = useState("");
    const [tableData, setTableData] = useState([]);
    const [selectedDocType, setSelectedDocType] = useState('pre'); // 'pre' or 'post'
    const [filters, setFilters] = useState({
        page: 1,
        limit: 10,
        purpose: "",
        status: "",
        rso: "",
        startDate: "",
        endDate: "",
        search: "",
        academicYear: ""
    });
    const {
        adminPaginatedActivities,
        adminError,
        fetchNextPage,
        hasNextPage,
        isFetchingNextPage,
        isAdminActivitiesLoading,
        isAdminActivitiesError,
        isAdminActivitiesFetching,
    } = useAdminActivity({
        debouncedQuery: searchQuery,
        page: filters.page,
        limit: filters.limit,
        RSO: filters.rsoId
    });


    const isOnRSODetailsPage = location.pathname.includes("/rsos/rso-details");


    const { isUserAdmin, isCoordinator, isDirector, isAVP } = useUserStoreWithAuth();



    // Academic years data
    const {
        academicYears,
        academicYearsLoading,
        academicYearsError,
        academicYearsErrorMessage,
        refetchAcademicYears,
        isRefetchingAcademicYears,
        isAcademicYearsFetched,


    } = useAdminAcademicYears();

    // Documents data
    const {
        avpDocuments,

        avpActivityDocuments,
        refetchAVPActivityDocuments,
        isAVPActivityDocumentsLoading,
        isAVPActivityDocumentsError,
        avpActivityDocumentsError,
    } = useAVPDocuments({
        filters,
        debouncedQuery: searchQuery,
        page: filters.page,
        limit: filters.limit,
        RSO: filters.rsoId
    });
    const {
        directorDocuments,
        // Director activity documents
        getDirectorActivityDocuments,
        refetchDirectorActivityDocuments,
        isDirectorActivityDocumentsLoading,
        isDirectorActivityDocumentsError,
        directorActivityDocumentsError,
    } = useDirectorDocuments({
        filters,
        debouncedQuery: searchQuery,
        page: filters.page,
        limit: filters.limit,
        RSO: filters.rsoId
    });
    const {
        coordinatorDocuments,
        documentsLoading,
        documentsError,
        documentsErrorMessage,
        refetchDocuments,
        isRefetchingDocuments,
        isDocumentsFetched,
    } = useCoordinatorDocuments(filters);

    const {
        allDocuments,
        allDocumentsLoading,
        allDocumentsError,
        allDocumentsQueryError,
        refetchAllDocuments,
    } = useAdminDocuments(filters);

    useEffect(() => {
        if (adminPaginatedActivities && (isCoordinator || isUserAdmin)) {
            setActivityRoleData(adminPaginatedActivities?.pages?.[0]);
        } else if (getDirectorActivityDocuments && isDirector) {
            setActivityRoleData(getDirectorActivityDocuments);
        } else if (avpActivityDocuments && isAVP) {
            setActivityRoleData(avpActivityDocuments);
        } else {
            setActivityRoleData(null);
        }
    }, [adminPaginatedActivities, getDirectorActivityDocuments, avpActivityDocuments, isCoordinator, isUserAdmin, isDirector, isAVP]);

    console.log("activity role data ", activityRoleData);

    // Table headings
    const tableHeading = [
        { key: "name", name: "Document Name" },
        { key: "purpose", name: "Purpose" },
        { key: "status", name: "Status" },
        { key: "date", name: "Date Created" },
    ];

    const tableRSOHeading = [
        { key: "name", name: "Activity Name" },
        { key: "status", name: "Date Status" },
        { key: "submittedBy", name: "Submitted By" },
        { key: "date", name: "Date Created" },
    ];

    useEffect(() => {
        if (isOnRSODetailsPage) {
            setFilters(prev => ({
                ...prev,
                rsoId: rsoId, // Changed from rso to rsoId to match the property used in API calls
                purpose: "recognition",
                page: 1
            }));
            // set RSO filter using provided rsoId
        }
    }, [isOnRSODetailsPage, rsoId]);

    useEffect(() => {
        console.log("activity documents from roles ", {
            avp: avpActivityDocuments,
            director: getDirectorActivityDocuments,
            coordinatorAdmin: adminPaginatedActivities
        })
    }, [avpActivityDocuments, getDirectorActivityDocuments, adminPaginatedActivities]);


    // Effects
    useEffect(() => {
        if (coordinatorDocuments && isCoordinator) {
            setTableData(coordinatorDocuments?.documents);
        } else if (allDocuments && isUserAdmin) {
            setTableData(allDocuments);
        } else if (avpDocuments && isAVP) {
            setTableData(avpDocuments?.documents);
        } else if (directorDocuments && isDirector) {
            setTableData(directorDocuments);
        }
    }, [coordinatorDocuments, allDocuments, avpDocuments, directorDocuments]);

    useEffect(() => {
        if (Object.values(filters).some(value => value !== "")) {
            refetchAllDocuments();
        }
    }, [filters, refetchAllDocuments]);

    useEffect(() => {
        if (activeTab === 0 || activeTab === "All" && !isOnRSODetailsPage) {
            setFilters(prev => ({
                ...prev,
                purpose: "",
                status: "",
                rso: "",
                startDate: "",
                endDate: "",
                search: ""
            }));
        } else if (activeTab === 1 || activeTab === "General Documents") {
            setFilters(prev => ({
                ...prev,
                purpose: "recognition",
                page: 1
            }));
        } else if (activeTab === 2 || activeTab === "Activity Documents" && !isOnRSODetailsPage) {

        }
    }, [activeTab]);

    useEffect(() => {
        handleSearch(searchQuery);
    }, [searchQuery]);

    // Memoized values
    const documentType = useMemo(() => {
        if (activeTab === "All") return "";
        if (activeTab === "General Documents") return "recognition";
        if (activeTab === "Activity Documents") return "activities";
        return "";
    }, [activeTab]);

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

    const handleSorted = (value) => {

        let statusValue = "";
        if (value === "Approved") statusValue = "approved";
        else if (value === "Pending") statusValue = "pending";
        else if (value === "Rejected") statusValue = "rejected";

        setFilters(prev => ({
            ...prev,
            status: statusValue,
            page: 1
        }));
    };

    const handleNextPage = () => {
        if (filters.page < tableData.pagination.totalPages) {
            setFilters(prev => ({ ...prev, page: prev.page + 1 }));
        }
    };

    const handlePrevPage = () => {
        if (filters.page > 1) {
            setFilters(prev => ({ ...prev, page: prev.page - 1 }));
        }
    };

    const handleSearch = (value) => {
        setFilters(prev => ({ ...prev, search: value }));
    };

    const handleRSO = (value) => {
        setFilters(prev => ({ ...prev, rsoId: value, page: 1 }));
    };

    const handleAcademicYear = (value) => {
        setFilters(prev => ({ ...prev, yearId: value, page: 1 }));
    };

    const handleRowClick = (row) => {
        const route = isOnRSODetailsPage ? `/admin-documents/${row._id}` : `${row._id}`;
        navigate(route, {
            state: {
                documentId: row._id,
                documentTitle: row.title,
                documentSize: row.documentSize,
                documentType: row.purpose,
                url: row.url
            }
        });
    };

    const docsToRender = useMemo(() => {
        const pre = activitySelected?.Activity_pre_activity_documents ?? [];
        const post = activitySelected?.Activity_post_activity_documents ?? [];
        if (selectedDocType === 'pre') return pre;
        if (selectedDocType === 'post') return post;
        return [];
    }, [selectedDocType, activitySelected]);

    // Continuous row numbering across pages
    const docsStartIndex = useMemo(() => {
        const page = tableData?.pagination?.page ?? filters.page ?? 1;
        const limit = tableData?.pagination?.limit ?? filters.limit ?? 10;
        if (!Number.isFinite(page) || !Number.isFinite(limit)) return 0;
        return (page - 1) * limit;
    }, [tableData?.pagination?.page, tableData?.pagination?.limit, filters.page, filters.limit]);

    const activitiesStartIndex = useMemo(() => {
        const page = activityRoleData?.pagination?.page ?? filters.page ?? 1;
        const limit = activityRoleData?.pagination?.limit ?? filters.limit ?? 10;
        if (!Number.isFinite(page) || !Number.isFinite(limit)) return 0;
        return (page - 1) * limit;
    }, [activityRoleData, filters.page, filters.limit]);

    return (
        <div className="p-4">
            {/* Filters Section */}
            <div className="mt-4 mb-4 w-full flex flex-col space-x-0 md:flex-row md:space-x-2 md:space-y-0 sm:flex-col sm:space-y-2 sm:space-x-0">
                <div className="w-full justify-between flex flex-col md:flex-row items-center gap-2">
                    <div className="w-full">
                        <label htmlFor="document-search" className="block text-sm font-medium text-gray-700 mb-1">
                            Search Documents
                        </label>
                        <Searchbar
                            id="document-search"
                            onChange={handleSearch}
                            searchQuery={searchQuery}
                            setSearchQuery={setSearchQuery}
                            placeholder="Search documents..."
                        />
                    </div>
                    {!isOnRSODetailsPage && (
                        <div className="w-full mt-4 md:mt-0 lg:w-1/2 md:w-full">
                            <label htmlFor="rso-filter" className="block text-sm font-medium text-gray-700 mb-1">
                                Filter by RSO
                            </label>
                            <DropdownSearch
                                id="rso-filter"
                                isSorting={true}
                                setSelectedSorting={handleRSO}
                                setSelectedCategory={() => { }}
                                valueType="id"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* more filters */}
            {activeTab !== 2 && !isOnRSODetailsPage && (
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-4 w-full gap-4">
                    <div className="w-full mb-2 md:mb-0">
                        <label htmlFor="status-filter" className="block text-sm font-medium text-gray-700 mb-1">
                            Status Filter
                        </label>
                        <ReusableDropdown
                            id="status-filter"
                            onChange={(e) => handleSorted(e.target.value)}
                            options={["All Organizations", "Approved", "Pending", "Rejected"]}
                        />
                    </div>

                    <div className="w-full mb-2 md:mb-0">
                        <label htmlFor="academic-year" className="block text-sm font-medium text-gray-700 mb-1">
                            Academic Year
                        </label>
                        <select
                            id="academic-year"
                            onChange={(e) => handleAcademicYear(e.target.value)}
                            className="w-full h-10 rounded-md bg-white border border-mid-gray p-1 font-bold"
                        >
                            <option value="">Select Academic Year</option>
                            {academicYears?.years?.map(year => (
                                <option
                                    key={year._id}
                                    value={year._id}
                                >
                                    {year.label || "no data"}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="w-full mb-2 md:mb-0">
                        <label htmlFor="start-date" className="block text-sm font-medium text-gray-700 mb-1">
                            Start Date
                        </label>
                        <input
                            id="start-date"
                            type="date"
                            className="w-full h-10 rounded-md bg-white border border-mid-gray p-1 font-bold"
                            value={filters.startDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, startDate: e.target.value, page: 1 }))}
                            placeholder="Start Date"
                        />
                    </div>
                    <div className="w-full">
                        <label htmlFor="end-date" className="block text-sm font-medium text-gray-700 mb-1">
                            End Date
                        </label>
                        <input
                            id="end-date"
                            type="date"
                            className="w-full h-10 rounded-md bg-white border border-mid-gray p-1 font-bold"
                            value={filters.endDate}
                            onChange={(e) => setFilters(prev => ({ ...prev, endDate: e.target.value, page: 1 }))}
                            placeholder="End Date"
                        />
                    </div>
                </div>
            )}
            <div className="flex justify-between items-center mb-4 w-full">
                {activeTab !== 2 && (
                    <span className="text-gray-700 font-semibold">
                        Showing {tableData?.signedDocuments ? tableData.signedDocuments.length : tableData?.length || 0} results
                    </span>
                )}
                {activeTab === 2 && (
                    <span className="text-gray-700 font-semibold">
                        Showing {activityRoleData?.totalActivities ? activityRoleData?.totalActivities : activityRoleData?.activities.length || 0} results
                    </span>
                )}
                <li className="flex justify-center">
                    <select
                        value={filters.limit}
                        onChange={(e) => setFilters(prev => ({ ...prev, limit: Number(e.target.value), page: 1 }))}
                        className="w-24 h-10 rounded-md bg-white border border-mid-gray p-1 font-bold"
                    >
                        <option value={5}>5 rows</option>
                        <option value={10}>10 rows</option>
                        <option value={20}>20 rows</option>
                        <option value={50}>50 rows</option>
                    </select>
                </li>
            </div>

            {/* Activities Table Section (only when tab 2) */}
            {activeTab === 2 && !activitySelected ? (
                (isAdminActivitiesLoading || isAdminActivitiesFetching) ? (
                    <CardSkeleton />
                ) : (
                    <div className="border border-mid-gray rounded-md">
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[800px]">
                                <thead className="border-b border-mid-gray bg-textfield">
                                    <tr className="rounded-md text-left text-xs font-medium font-bold uppercase tracking-wider">
                                        {(tableRSOHeading).map((heading, index) => (
                                            <th
                                                key={`header-${index}-${heading.key || heading.name}`}
                                                className="text-left p-3"
                                            >
                                                <h1 className="text-gray-900">
                                                    {heading.name}
                                                </h1>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {(activityRoleData?.activities || activityRoleData)?.length > 0 ? (
                                        (activityRoleData?.activities || activityRoleData).map((row, index) => (
                                            <tr
                                                key={row._id}
                                                onClick={() => setActivitySelected(row)}
                                                className="border-b border-mid-gray hover:bg-gray-100 cursor-pointer"
                                            >
                                                <td className="p-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {activitiesStartIndex + index + 1}
                                                        </div>
                                                        <div className="w-12 h-12 rounded overflow-hidden">
                                                            <img
                                                                className="object-cover w-full h-full"
                                                                src={row.activityImageUrl || DefaultPicture} alt="" />
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-md font-semibold text-gray-900">
                                                                {row.Activity_name}
                                                            </span>
                                                            <span className="text-sm text-gray-600">
                                                                submitted by {row.RSO_id?.RSO_acronym || "N/A"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="p-3">
                                                    <span className="text-sm text-gray-600 capitalize">
                                                        {row.Activity_date_status || "N/A"}
                                                    </span>
                                                </td>



                                                <td className="p-3">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {handleBadge(row.Activity_approval_status)}
                                                    </span>
                                                </td>

                                                <td className="p-3">
                                                    <span className="text-sm font-light text-gray-600 flex items-center">
                                                        {FormatDate(row.createdAt)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={tableHeading.length} className="text-center py-8">
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                    <p className="mt-2 text-sm font-medium text-gray-500">No activities found</p>
                                                    <p className="text-xs text-gray-400">Try adjusting your filters or search terms</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )
            ) : activitySelected && activeTab === 2 ? (
                <>
                    <div className="overflow-x-auto">

                        {/* back button */}
                        <div className="p-3 flex items-center gap-4 justify-between">
                            <button
                                onClick={() => setActivitySelected(null)}
                                className="text-blue-600"
                            >
                                <div className="flex items-center gap-2 hover:underline">
                                    <svg xmlns="http://www.w3.org/2000/svg" className="fill-current text-blue-600 size-4" viewBox="0 0 640 640"><path d="M73.4 297.4C60.9 309.9 60.9 330.2 73.4 342.7L233.4 502.7C245.9 515.2 266.2 515.2 278.7 502.7C291.2 490.2 291.2 469.9 278.7 457.4L173.3 352L544 352C561.7 352 576 337.7 576 320C576 302.3 561.7 288 544 288L173.3 288L278.7 182.6C291.2 170.1 291.2 149.8 278.7 137.3C266.2 124.8 245.9 124.8 233.4 137.3L73.4 297.3z" /></svg>
                                    Back to Activities
                                </div>
                            </button>
                            <div className="flex items-center gap-4">
                                <button
                                    onClick={() => setSelectedDocType('pre')}
                                    className={`hover:underline ${selectedDocType === 'pre' ? 'font-bold underline text-off-black' : 'text-gray-600'}`}
                                >
                                    Pre-Activity Documents
                                </button>
                                <button
                                    onClick={() => setSelectedDocType('post')}
                                    className={`hover:underline ${selectedDocType === 'post' ? 'font-bold underline text-off-black' : 'text-gray-600'}`}
                                >
                                    Post-Activity Documents
                                </button>
                            </div>
                        </div>
                        <div className="border border-mid-gray rounded-md">
                            <table className="w-full min-w-[800px]">
                                <thead className="border-b border-mid-gray bg-textfield">
                                    <tr className="rounded-md text-left text-xs font-medium font-bold uppercase tracking-wider">
                                        {tableHeading.map((heading, index) => (
                                            <th
                                                key={`header-${index}-${heading.key || heading.name}`}
                                                className="text-left p-3"
                                            >
                                                <h1 className="text-gray-900">
                                                    {heading.name}
                                                </h1>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>

                                    {docsToRender.length > 0 ? (
                                        docsToRender.map((row, index) => (
                                            <tr
                                                key={row._id}
                                                onClick={() => handleRowClick(row)}
                                                className="border-b border-mid-gray hover:bg-gray-100 cursor-pointer"
                                            >
                                                <td className="p-3">
                                                    <div className="flex items-center space-x-3">
                                                        <div className="text-sm font-medium text-gray-900">
                                                            {index + 1}
                                                        </div>
                                                        <div className="flex flex-col">
                                                            <span className="text-md font-semibold text-gray-900">
                                                                {row.title}
                                                            </span>
                                                            <span className="text-sm text-gray-600">
                                                                submitted by {row.submittedBy?.RSO_acronym || "N/A"}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>

                                                <td className="p-3">
                                                    <span className="text-sm text-gray-600 capitalize">
                                                        {row.purpose || "N/A"}
                                                    </span>
                                                </td>

                                                <td className="p-3">
                                                    <span className="text-sm font-semibold text-gray-900">
                                                        {handleBadge(row.document_status)}
                                                    </span>
                                                </td>

                                                <td className="p-3">
                                                    {/* there's two dates: createdAt and updatedAt. clarify with darrel */}
                                                    <span className="text-sm font-light text-gray-600 flex items-center">
                                                        {FormatDate(row.createdAt)}
                                                    </span>
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={tableHeading.length} className="text-center py-8">
                                                <div className="flex flex-col items-center justify-center">
                                                    <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                    </svg>
                                                    <p className="mt-2 text-sm font-medium text-gray-500">No documents found</p>
                                                    <p className="text-xs text-gray-400">Try adjusting your filters or search terms</p>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                        {/* Static pagination for activity documents view (pre/post) */}
                        <div className="w-full bottom-20 mt-4">
                            <nav>
                                <ul className="flex justify-center space-x-2">
                                    <li className="page-item mx-1 px-3 py-2 bg-white border border-mid-gray rounded-md font-semibold rounded">
                                        <button className="page-link" disabled>
                                            Prev
                                        </button>
                                    </li>
                                    <div className="px-4 py-2 font-semibold">
                                        {`1 of 1`}
                                    </div>
                                    <li className="page-item mx-1 px-3 py-2 bg-white border border-mid-gray rounded-md font-semibold rounded">
                                        <button className="page-link" disabled>
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </div>
                </>
            ) : (
                null
            )}

            {(activeTab === 0 || activeTab === 1) && (
                allDocumentsLoading ? (
                    <CardSkeleton />
                ) : (
                    <>
                        <div className="border border-mid-gray rounded-md">
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-[800px]">
                                    <thead className="border-b border-mid-gray bg-textfield">
                                        <tr className="rounded-md text-left text-xs font-medium font-bold uppercase tracking-wider">
                                            {tableHeading.map((heading, index) => (
                                                <th
                                                    key={`header-${index}-${heading.key || heading.name}`}
                                                    className="text-left p-3"
                                                >
                                                    <h1 className="text-gray-900">
                                                        {heading.name}
                                                    </h1>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {(tableData?.signedDocuments || tableData).length > 0 ? (
                                            (tableData?.signedDocuments || tableData).map((row, index) => (
                                                <tr
                                                    key={row.id}
                                                    onClick={() => handleRowClick(row)}
                                                    className="border-b border-mid-gray hover:bg-gray-100 cursor-pointer"
                                                >
                                                    <td className="p-3">
                                                        <div className="flex items-center space-x-3">
                                                            <div className="text-sm font-medium text-gray-900">
                                                                {docsStartIndex + index + 1}
                                                            </div>
                                                            <div className="flex flex-col">
                                                                <span className="text-md font-semibold text-gray-900">
                                                                    {row.title}
                                                                </span>
                                                                <span className="text-sm text-gray-600">
                                                                    submitted by {row.submittedBy?.RSO_acronym || "N/A"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </td>

                                                    <td className="p-3">
                                                        <span className="text-sm text-gray-600 capitalize">
                                                            {row.purpose || "N/A"}
                                                        </span>
                                                    </td>

                                                    <td className="p-3">
                                                        <span className="text-sm font-semibold text-gray-900">
                                                            {handleBadge(row.document_status)}
                                                        </span>
                                                    </td>

                                                    <td className="p-3">
                                                        {/* there's two dates: createdAt and updatedAt. clarify with darrel */}
                                                        <span className="text-sm font-light text-gray-600 flex items-center">
                                                            {FormatDate(row.createdAt)}
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={tableHeading.length} className="text-center py-8">
                                                    <div className="flex flex-col items-center justify-center">
                                                        <svg xmlns="http://www.w3.org/2000/svg" className="w-12 h-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                                                        </svg>
                                                        <p className="mt-2 text-sm font-medium text-gray-500">No documents found</p>
                                                        <p className="text-xs text-gray-400">Try adjusting your filters or search terms</p>
                                                    </div>
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                        {/* Working pagination for documents table (tabs 0/1) */}
                        <div className="w-full bottom-20 mt-4">
                            <nav>
                                <ul className="flex justify-center space-x-2">
                                    <li className="page-item mx-1 px-3 py-2 bg-white border border-mid-gray rounded-md font-semibold rounded">
                                        <button
                                            className="page-link"
                                            onClick={handlePrevPage}
                                            disabled={(tableData?.pagination?.totalPages ?? 0) === 0 || filters.page === 1}
                                        >
                                            Prev
                                        </button>
                                    </li>
                                    <div className="px-4 py-2 font-semibold">
                                        {`${filters.page} of ${tableData?.pagination?.totalPages || 0}`}
                                    </div>
                                    <li className="page-item mx-1 px-3 py-2 bg-white border border-mid-gray rounded-md font-semibold rounded">
                                        <button
                                            className="page-link"
                                            onClick={handleNextPage}
                                            disabled={(tableData?.pagination?.totalPages ?? 0) === 0 || filters.page === tableData?.pagination?.totalPages}
                                        >
                                            Next
                                        </button>
                                    </li>
                                </ul>
                            </nav>
                        </div>
                    </>
                )
            )}

            {/* Static pagination for activities list (tab 2, no selection) */}
            {activeTab === 2 && !activitySelected && (
                <div className="w-full bottom-20 mt-4">
                    <nav>
                        <ul className="flex justify-center space-x-2">
                            <li className="page-item mx-1 px-3 py-2 bg-white border border-mid-gray rounded-md font-semibold rounded">
                                <button
                                    onClick={() => setFilters({ ...filters, page: filters.page - 1 })}
                                    className="page-link" disabled={(activityRoleData?.pagination?.totalPages ?? 0) === 0 || filters.page === 1}>
                                    Prev
                                </button>
                            </li>
                            <div className="px-4 py-2 font-semibold">{`${activityRoleData?.pagination?.page || 1} of ${activityRoleData?.pagination?.totalPages || 0}`}</div>
                            <li className="page-item mx-1 px-3 py-2 bg-white border border-mid-gray rounded-md font-semibold rounded">
                                <button
                                    // onClick={() => fetchNextPage()}
                                    onClick={() => setFilters({ ...filters, page: filters.page + 1 })}
                                    className="page-link" disabled={(activityRoleData?.pagination?.totalPages ?? 0) === 0 || filters.page === activityRoleData?.pagination?.totalPages}>
                                    Next
                                </button>
                            </li>
                        </ul>
                    </nav>
                </div>
            )}
        </div>
    );
}