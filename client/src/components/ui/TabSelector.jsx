

export default function TabSelector({ tabs, activeTab, onTabChange }) {
    return (
        <div className="bg-card-bg rounded-lg ">
            <ul className="flex flex-wrap -mb-px text-sm font-medium text-center text-gray-600 dark:text-gray-600 cursor-pointer">
                {tabs.map((tab, index) => (
                    <li key={index} className="me-2">
                        <button
                            onClick={() => onTabChange(index)}
                            className={
                                activeTab === index
                                    ? "inline-flex items-center justify-center p-4 text-[#314095] border-b-2 border-[#314095] rounded-t-lg active"
                                    : "inline-flex items-center justify-center p-4 border-b-2 border-transparent rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300 group"
                            }
                        >
                            {tab.icon && <span className="me-2">{tab.icon}</span>}
                            {tab.label}
                        </button>
                    </li>
                ))}
            </ul>
        </div>
    );
}
