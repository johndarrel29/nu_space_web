import { useLocation } from 'react-router-dom';
import { Searchbar, SearchResultsList } from '../components';
import { handleShortenName } from '../utils/handleShortenName';

export default function TagSelector({
    apiTags = [],
    selectedTags = [],
    searchQuery,
    setSearchQuery,
    setShowSearch,
    setIsFocused,
    searchedData,
    handleTagClick,
    handleApiTagRemove,
    setShowModal,
    handleTagModal,
    style
}) {
    const location = useLocation();
    const isCreateForms = location.pathname === '/rsos/rso-action';

    const hasApiTags = apiTags && apiTags.length > 0;
    const hasTagData = selectedTags && selectedTags.length > 0;
    const normalizedTags = Array.isArray(apiTags) ? apiTags : [apiTags];

    return (
        <>
            {/* Tag */}
            <div className='mb-4'>
                <div className='flex flex-row items-center justify-start space-x-2 mb-2'>
                    <label className="text-sm font-medium text-gray-900 dark:text-white">Tags {isCreateForms && <span className="text-red-500">*</span>}</label>
                </div>

                {style === "crud" && (
                    <div className='w-full'>
                        <div className='relative'>
                            <Searchbar
                                placeholder="Search a tag"
                                style="secondary"
                                searchQuery={searchQuery}
                                setSearchQuery={setSearchQuery}
                                setShowSearch={setShowSearch}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setTimeout(() => setIsFocused(false), 200)}
                            />

                            <SearchResultsList
                                showSearch={searchedData}
                                searchQuery={searchQuery}
                                handleTagClick={handleTagClick}
                            />
                        </div>

                        {/* tag table */}
                        <div className='w-full p-2 mt-2 bg-white border border-mid-gray rounded-lg'>
                            <div className='flex flex-wrap items-center justify-start gap-2'>
                                {/* If there are no tags at all */}
                                {!hasApiTags && !hasTagData && (
                                    <h1 className='text-sm text-dark-gray'><em>No tags selected.</em></h1>
                                )}

                                {/* API tags */}
                                {hasApiTags && apiTags.map((tag, index) => (
                                    <div
                                        key={`api-${index}`}
                                        className='rounded-md bg-mid-gray p-1'
                                    >
                                        <div className='flex flex-row items-center justify-between gap-2 p-1'>
                                            <h1>{tag}</h1>
                                            <div
                                                onClick={() => handleApiTagRemove(tag)}
                                                className='flex flex-row items-center bg-blue-500 p-1 h-4 w-4 rounded-sm hover:bg-blue-600 cursor-pointer'
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="size-5 fill-white" viewBox="0 0 384 512">
                                                    <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {/* Selected tags */}
                                {hasTagData && selectedTags.map((tag, index) => (
                                    <div
                                        key={`selected-${index}`}
                                        className='rounded-md bg-mid-gray p-1'
                                    >
                                        <div className='flex flex-row items-center justify-between gap-2 p-1'>
                                            <h1
                                                title={tag}
                                                onClick={() => handleTagModal(tag)}
                                                className='hover:underline cursor-pointer text-sm'
                                            >
                                                {handleShortenName(tag)}
                                            </h1>
                                            <div
                                                onClick={() => handleTagClick(tag)}
                                                className='flex flex-row items-center bg-gray-500 p-1 h-4 w-4 rounded-sm hover:bg-gray-600 cursor-pointer'
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" className="size-5 fill-white" viewBox="0 0 384 512">
                                                    <path d="M342.6 150.6c12.5-12.5 12.5-32.8 0-45.3s-32.8-12.5-45.3 0L192 210.7 86.6 105.4c-12.5-12.5-32.8-12.5-45.3 0s-12.5 32.8 0 45.3L146.7 256 41.4 361.4c-12.5 12.5-12.5 32.8 0 45.3s32.8 12.5 45.3 0L192 301.3 297.4 406.6c12.5 12.5 32.8 12.5 45.3 0s12.5-32.8 0-45.3L237.3 256 342.6 150.6z" />
                                                </svg>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

                {style === "view" && (
                    <div className='flex flex-wrap items-center justify-start gap-2 w-full sm:w-[400px]'>
                        {/* If there are no tags at all */}
                        {!hasApiTags && !hasTagData && (
                            <h1 className='text-sm text-dark-gray'><em>No tags selected.</em></h1>
                        )}

                        {normalizedTags.map((tagObj, index) => (
                            <div
                                key={tagObj._id || `api-${index}`}
                                className="rounded-md bg-gray-200 p-1 px-2 font-light text-sm"
                            >
                                <h1>{tagObj.tag || tagObj}</h1> {/* handle both strings and objects */}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </>
    );
}