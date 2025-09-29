
import classNames from "classnames";
import { Link, useLocation, useParams } from "react-router-dom";
import { useAdminActivity, useAdminDocuments, useRSOActivities, useRSODocuments } from "../../hooks";
import { useUserStoreWithAuth } from "../../store";

export default function Breadcrumb({ style, unSelected }) {
    const location = useLocation();
    const paths = location.pathname.split("/").filter(Boolean);
    const { isUserRSORepresentative, isUserAdmin, isCoordinator } = useUserStoreWithAuth();
    const { activityId, documentId } = useParams();
    const {
        specificDocument,
        specificDocumentLoading,
        specificDocumentError,
    } = useRSODocuments({ documentId });

    const {
        // view admin activity details
        viewAdminActivityData,
        viewAdminActivitySuccess,
        viewAdminActivityLoading,
        refetchViewAdminActivity,
        viewAdminActivityError,
    } = useAdminActivity({ activityId });

    const {
        // activity view
        activityRSOView,
        activityRSOViewLoading,
        activityRSOViewError,
        activityRSOViewQueryError,
        refetchActivityRSOView,
    } = useRSOActivities({ activityId });
    const {
        documentDetail,
        documentDetailLoading,
        documentDetailError,
        documentDetailQueryError,
        refetchDocumentDetail,
        isDocumentDetailRefetching,
    } = useAdminDocuments({ documentId });

    const renderActivityOnRole = () => {
        if (!isUserRSORepresentative) {
            return viewAdminActivityData?.Activity_name || "...loading";
        } else if (isUserRSORepresentative) {
            return activityRSOView?.Activity_name || "...loading";
        }
    }


    const formatLabel = (str) => {
        if (str === activityId) {
            return renderActivityOnRole();
        }
        if (str === documentId && isUserRSORepresentative) {
            return specificDocument?.title || "...loading"; // Use the document title if available
        }
        if (str === documentId && !isUserRSORepresentative) {
            return documentDetail?.document?.title || "...loading"; // Use the document title if available
        }

        if (str.toLowerCase() === 'general-documents') {
            return 'General Documents';
        }

        return str
            .split('-')
            .map(word =>
                word.toLowerCase() === 'rso' || word.toLowerCase() === 'rsos'
                    ? `RSO${word.toLowerCase() === 'rsos' ? 's' : ''}` // Special case for "RSO"
                    : word.charAt(0).toUpperCase() + word.slice(1)
            )
            .join('-');
    }

    return (
        <nav className="flex w-full overflow-x-auto" aria-label="Breadcrumb">
            <ol className="inline-flex items-center space-x-1 rtl:space-x-reverse flex-nowrap w-full">

                {paths.map((path, index) => {
                    const routeTo = `/${paths.slice(0, index + 1).join("/")}`;
                    const isLast = index === paths.length - 1;
                    const isFirst = index === 0;
                    const label = formatLabel(path);

                    return (
                        <li key={routeTo} aria-current={isLast ? "page" : undefined}>
                            <div className="flex items-center">

                                {isFirst ? (null
                                ) : (
                                    <svg className="rtl:rotate-180 w-3 h-3 mx-2 text-[#656565]" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 6 10">
                                        <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 9 4-4-4-4" />
                                    </svg>
                                )
                                }
                                {isLast ? (
                                    <span
                                        className={classNames(
                                            style,
                                            "truncate max-w-[140px] sm:max-w-[220px] md:max-w-[320px]"
                                        )}
                                        title={label}
                                    >
                                        {label}
                                    </span>
                                ) : (
                                    <Link
                                        state={documentId ? { documentId } : undefined}
                                        to={routeTo}
                                        className={classNames(
                                            unSelected,
                                            "truncate max-w-[140px] sm:max-w-[220px] md:max-w-[320px]"
                                        )}
                                        title={label}
                                    >
                                        {label}
                                    </Link>
                                )}
                            </div>
                        </li>
                    );
                })}
            </ol>
        </nav>
    );
}