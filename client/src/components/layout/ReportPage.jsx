import { useUserStoreWithAuth } from '../../store';
import { FormatDate } from '../../utils';


const a4Style = {
    width: "210mm",
    padding: "16mm",
    margin: "auto",
    background: "white",
    fontFamily: "Arial, sans-serif",
    fontSize: "12pt",
    color: "#222",
    boxSizing: "border-box",
    borderRadius: "4px",
};

const headerStyle = {
    borderBottom: "2px solid #333",
    paddingBottom: "6px",
    marginBottom: "12px",
    textAlign: "center",
};

const sectionStyle = {
    marginBottom: "10px",
};

const today = new Date().toISOString().slice(0, 10); // "2025-08-31"

const ReportPage = ({ reference, reportTitle, dashboardData, statsTitle = {} }) => {
    // fallback helpers
    const documentsByType = dashboardData?.documentsByType || {};
    const documentsByStatus = dashboardData?.documentsByStatus || {};
    const recentActivity = dashboardData?.recentActivity || [];
    const { isUserRSORepresentative, isUserAdmin, isCoordinator, isAVP, isDirector } = useUserStoreWithAuth();

    return (
        <div style={a4Style} ref={reference}>
            <div className='flex justify-center mb-2'>
                <img
                    className='h-24'
                    src={"https://www.fastonlinemasters.com/wp-content/uploads/2021/05/national-u.jpg"} alt="National University Logo" />
            </div>
            <div className='text-center mb-3'>
                <h1 className='text-md font-semibold' style={{ marginBottom: 2 }}>{reportTitle} Report</h1>
                <p className='text-sm' style={{ margin: 0 }}>Date: {today}</p>
            </div>
            {/* Summary Section */}
            <div style={sectionStyle}>
                <h2 style={{ fontSize: "1.1em", marginBottom: "4px" }}>{statsTitle.summary || "Summary"}</h2>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "6px" }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: "3px 0" }}>{statsTitle.totalDocuments || "Total Documents"}</td>
                            <td style={{ padding: "3px 0", fontWeight: "bold" }}>{dashboardData?.totalDocuments ?? 0}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: "3px 0" }}>{statsTitle.pendingApproval || "Pending Approval"}</td>
                            <td style={{ padding: "3px 0", fontWeight: "bold" }}>{dashboardData?.pendingApproval ?? 0}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: "3px 0" }}>{statsTitle.recentlyApproved || "Recently Approved"}</td>
                            <td style={{ padding: "3px 0", fontWeight: "bold" }}>{dashboardData?.recentlyApproved ?? 0}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {/* Documents by Type */}
            <div style={sectionStyle}>
                <h2 style={{ fontSize: "1.1em", marginBottom: "4px" }}>
                    {(statsTitle.documentsByTypeTitle) || "Documents by Type"}
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "2px" }}>
                                {statsTitle.typeHeader || "Type"}
                            </th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "2px" }}>
                                {statsTitle.countHeader || "Count"}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: "2px" }}>{statsTitle.documentsByType?.activities || "Activities"}</td>
                            <td style={{ padding: "2px" }}>{documentsByType.activities ?? 0}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: "2px" }}>{statsTitle.documentsByType?.recognition || "Recognition"}</td>
                            <td style={{ padding: "2px" }}>{documentsByType.recognition ?? 0}</td>
                        </tr>
                        {!isUserRSORepresentative && (
                            <>
                                <tr>
                                    <td style={{ padding: "2px" }}>{statsTitle.documentsByType?.renewal || "Renewal"}</td>
                                    <td style={{ padding: "2px" }}>{documentsByType.renewal ?? 0}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: "2px" }}>{statsTitle.documentsByType?.other || "Other"}</td>
                                    <td style={{ padding: "2px" }}>{documentsByType.other ?? 0}</td>
                                </tr>

                            </>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Documents by Status */}
            <div style={sectionStyle}>
                <h2 style={{ fontSize: "1.1em", marginBottom: "4px" }}>
                    {(statsTitle.documentsByStatusTitle) || "Documents by Status"}
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "2px" }}>
                                {statsTitle.statusHeader || "Status"}
                            </th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "2px" }}>
                                {statsTitle.countHeader || "Count"}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: "2px" }}>{statsTitle.documentsByStatus?.approved || "Approved"}</td>
                            <td style={{ padding: "2px" }}>{documentsByStatus.approved ?? 0}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: "2px" }}>{statsTitle.documentsByStatus?.pending || "Pending"}</td>
                            <td style={{ padding: "2px" }}>{documentsByStatus.pending ?? 0}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: "2px" }}>{statsTitle.documentsByStatus?.rejected || "Rejected"}</td>
                            <td style={{ padding: "2px" }}>{documentsByStatus.rejected ?? 0}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {/* Recent Activity */}
            <div style={sectionStyle}>
                <h2 style={{ fontSize: "1.1em", marginBottom: "4px" }}>
                    {statsTitle.recentActivity || "Recent Activity"}
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "2px" }}>
                                {statsTitle.titleHeader || "Title"}
                            </th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "2px" }}>
                                {statsTitle.statusHeader || "Status"}
                            </th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "2px" }}>
                                {statsTitle.dateHeader || "Date"}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentActivity.length > 0 ? (
                            recentActivity.map((item, idx) => (
                                <tr key={item.id || item._id || idx}>
                                    <td style={{ padding: "2px" }}>{item.title || item.Activity_name || "Untitled"}</td>
                                    <td style={{ padding: "2px" }}>{(item.status || item.document_status || "Unknown").toString().charAt(0).toUpperCase() + (item.status || item.document_status || "Unknown").toString().slice(1)}</td>
                                    <td style={{ padding: "2px" }}>{FormatDate(item.date || item.updatedAt || "-")}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} style={{ padding: "2px", color: "#888" }}>No recent activity.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

        </div>
    );
};

export default ReportPage;
