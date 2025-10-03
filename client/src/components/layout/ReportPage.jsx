import { useUserStoreWithAuth } from '../../store';
import { FormatDate } from '../../utils';

const a4Style = {
    width: "210mm",
    padding: "10mm",
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
    paddingBottom: "10px",
    marginBottom: "20px",
    textAlign: "center",
};

const sectionStyle = {
    marginBottom: "18px",
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
            <div style={headerStyle}>
                <h1 style={{ margin: 0, fontSize: "2em" }}>{reportTitle} Report</h1>
                <p style={{ margin: 0, fontSize: "1em", color: "#666" }}>Date: {today}</p>
            </div>
            {/* Summary Section */}
            <div style={sectionStyle}>
                <h2 style={{ fontSize: "1.2em", marginBottom: "8px" }}>{statsTitle.summary || "Summary"}</h2>
                <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "12px" }}>
                    <tbody>
                        <tr>
                            <td style={{ padding: "6px 0" }}>{statsTitle.totalDocuments || "Total Documents"}</td>
                            <td style={{ padding: "6px 0", fontWeight: "bold" }}>{dashboardData?.totalDocuments ?? 0}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: "6px 0" }}>{statsTitle.pendingApproval || "Pending Approval"}</td>
                            <td style={{ padding: "6px 0", fontWeight: "bold" }}>{dashboardData?.pendingApproval ?? 0}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: "6px 0" }}>{statsTitle.recentlyApproved || "Recently Approved"}</td>
                            <td style={{ padding: "6px 0", fontWeight: "bold" }}>{dashboardData?.recentlyApproved ?? 0}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {/* Documents by Type */}
            <div style={sectionStyle}>
                <h2 style={{ fontSize: "1.2em", marginBottom: "8px" }}>
                    {(statsTitle.documentsByTypeTitle) || "Documents by Type"}
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "4px" }}>
                                {statsTitle.typeHeader || "Type"}
                            </th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "4px" }}>
                                {statsTitle.countHeader || "Count"}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: "4px" }}>{statsTitle.documentsByType?.activities || "Activities"}</td>
                            <td style={{ padding: "4px" }}>{documentsByType.activities ?? 0}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: "4px" }}>{statsTitle.documentsByType?.recognition || "Recognition"}</td>
                            <td style={{ padding: "4px" }}>{documentsByType.recognition ?? 0}</td>
                        </tr>
                        {!isUserRSORepresentative && (
                            <>
                                <tr>
                                    <td style={{ padding: "4px" }}>{statsTitle.documentsByType?.renewal || "Renewal"}</td>
                                    <td style={{ padding: "4px" }}>{documentsByType.renewal ?? 0}</td>
                                </tr>
                                <tr>
                                    <td style={{ padding: "4px" }}>{statsTitle.documentsByType?.other || "Other"}</td>
                                    <td style={{ padding: "4px" }}>{documentsByType.other ?? 0}</td>
                                </tr>

                            </>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Documents by Status */}
            <div style={sectionStyle}>
                <h2 style={{ fontSize: "1.2em", marginBottom: "8px" }}>
                    {(statsTitle.documentsByStatusTitle) || "Documents by Status"}
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "4px" }}>
                                {statsTitle.statusHeader || "Status"}
                            </th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "4px" }}>
                                {statsTitle.countHeader || "Count"}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td style={{ padding: "4px" }}>{statsTitle.documentsByStatus?.approved || "Approved"}</td>
                            <td style={{ padding: "4px" }}>{documentsByStatus.approved ?? 0}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: "4px" }}>{statsTitle.documentsByStatus?.pending || "Pending"}</td>
                            <td style={{ padding: "4px" }}>{documentsByStatus.pending ?? 0}</td>
                        </tr>
                        <tr>
                            <td style={{ padding: "4px" }}>{statsTitle.documentsByStatus?.rejected || "Rejected"}</td>
                            <td style={{ padding: "4px" }}>{documentsByStatus.rejected ?? 0}</td>
                        </tr>
                    </tbody>
                </table>
            </div>
            {/* Recent Activity */}
            <div style={sectionStyle}>
                <h2 style={{ fontSize: "1.2em", marginBottom: "8px" }}>
                    {statsTitle.recentActivity || "Recent Activity"}
                </h2>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                    <thead>
                        <tr>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "4px" }}>
                                {statsTitle.titleHeader || "Title"}
                            </th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "4px" }}>
                                {statsTitle.statusHeader || "Status"}
                            </th>
                            <th style={{ textAlign: "left", borderBottom: "1px solid #ddd", padding: "4px" }}>
                                {statsTitle.dateHeader || "Date"}
                            </th>
                        </tr>
                    </thead>
                    <tbody>
                        {recentActivity.length > 0 ? (
                            recentActivity.map((item, idx) => (
                                <tr key={item.id || item._id || idx}>
                                    <td style={{ padding: "4px" }}>{item.title || item.Activity_name || "Untitled"}</td>
                                    <td style={{ padding: "4px" }}>{(item.status || item.document_status || "Unknown").toString().charAt(0).toUpperCase() + (item.status || item.document_status || "Unknown").toString().slice(1)}</td>
                                    <td style={{ padding: "4px" }}>{FormatDate(item.date || item.updatedAt || "-")}</td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan={3} style={{ padding: "4px", color: "#888" }}>No recent activity.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
            {/* Footer */}
            <div style={{ borderTop: "1px solid #ccc", marginTop: "30px", paddingTop: "10px", textAlign: "right", color: "#888" }}>
                <small>Page 1 of 1</small>
            </div>
        </div>
    );
};

export default ReportPage;
