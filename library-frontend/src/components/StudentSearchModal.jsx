import { Dialog, Transition } from '@headlessui/react'
import { Fragment, useState, useEffect, useCallback } from 'react'
import { Search, User, ChevronRight, Loader2, Users } from 'lucide-react'
import axiosClient from '../axios-client'

/**
 * Server-side student search modal.
 * Fetches students from the API as the user types, with debouncing.
 * No longer requires a pre-loaded `students` array prop.
 */
export default function StudentSearchModal({ isOpen, onClose, onSelect }) {
    const [query, setQuery] = useState('')
    const [results, setResults] = useState([])
    const [loading, setLoading] = useState(false)
    const [totalResults, setTotalResults] = useState(0)
    const [currentPage, setCurrentPage] = useState(1)
    const [lastPage, setLastPage] = useState(1)
    const [hasSearched, setHasSearched] = useState(false)

    // Debounced server-side search
    useEffect(() => {
        if (!isOpen) return

        // Require at least 1 character
        if (query.length < 1) {
            setResults([])
            setTotalResults(0)
            setHasSearched(false)
            return
        }

        setLoading(true)
        const timer = setTimeout(() => {
            axiosClient.get('/students/search', {
                params: { q: query, per_page: 20, page: 1 }
            })
                .then(({ data }) => {
                    setResults(data.data || [])
                    setTotalResults(data.total || 0)
                    setCurrentPage(data.current_page || 1)
                    setLastPage(data.last_page || 1)
                    setHasSearched(true)
                    setLoading(false)
                })
                .catch(() => {
                    setResults([])
                    setLoading(false)
                    setHasSearched(true)
                })
        }, 300) // 300ms debounce

        return () => clearTimeout(timer)
    }, [query, isOpen])

    // Load more results (next page)
    const loadMore = useCallback(() => {
        if (currentPage >= lastPage || loading) return

        setLoading(true)
        axiosClient.get('/students/search', {
            params: { q: query, per_page: 20, page: currentPage + 1 }
        })
            .then(({ data }) => {
                setResults(prev => [...prev, ...(data.data || [])])
                setCurrentPage(data.current_page || 1)
                setLastPage(data.last_page || 1)
                setLoading(false)
            })
            .catch(() => setLoading(false))
    }, [currentPage, lastPage, loading, query])

    // Reset state when modal closes
    useEffect(() => {
        if (!isOpen) {
            setQuery('')
            setResults([])
            setTotalResults(0)
            setHasSearched(false)
            setCurrentPage(1)
            setLastPage(1)
        }
    }, [isOpen])

    return (
        <Transition.Root show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-gray-500/75 dark:bg-black/80 backdrop-blur-sm transition-opacity" />
                </Transition.Child>

                <div className="fixed inset-0 z-10 w-screen overflow-y-auto p-4 sm:p-6 md:p-20">
                    <Transition.Child
                        as={Fragment}
                        enter="ease-out duration-300"
                        enterFrom="opacity-0 scale-95"
                        enterTo="opacity-100 scale-100"
                        leave="ease-in duration-200"
                        leaveFrom="opacity-100 scale-100"
                        leaveTo="opacity-0 scale-95"
                    >
                        <Dialog.Panel className="mx-auto max-w-2xl transform divide-y divide-gray-100 dark:divide-slate-700 overflow-hidden rounded-2xl bg-white dark:bg-slate-900 shadow-2xl ring-1 ring-black/5 transition-all">
                            {/* Search Input */}
                            <div className="relative">
                                <Search className="pointer-events-none absolute left-4 top-3.5 h-5 w-5 text-gray-400" aria-hidden="true" />
                                <input
                                    className="h-12 w-full border-0 bg-transparent pl-11 pr-4 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-0 sm:text-sm"
                                    placeholder="Search students by name, ID, email, or course..."
                                    value={query}
                                    onChange={(event) => setQuery(event.target.value)}
                                    autoFocus
                                />
                                {loading && (
                                    <Loader2 className="absolute right-4 top-3.5 h-5 w-5 text-primary-500 animate-spin" />
                                )}
                            </div>

                            {/* Results Count Badge */}
                            {hasSearched && !loading && results.length > 0 && (
                                <div className="px-4 py-2 bg-gray-50 dark:bg-slate-800/50 flex items-center gap-2">
                                    <Users size={14} className="text-gray-400" />
                                    <span className="text-xs text-gray-500 dark:text-slate-400 font-medium">
                                        {totalResults} student{totalResults !== 1 ? 's' : ''} found
                                    </span>
                                </div>
                            )}

                            {/* Results List */}
                            {results.length > 0 && (
                                <ul className="max-h-[60vh] scroll-py-3 overflow-y-auto p-3">
                                    {results.map((student) => (
                                        <li
                                            key={student.id}
                                            className="group flex cursor-pointer select-none rounded-xl p-3 hover:bg-primary-50 dark:hover:bg-primary-900/20 transition-colors"
                                            onClick={() => {
                                                onSelect(student);
                                                onClose();
                                            }}
                                        >
                                            <div className="flex h-10 w-10 flex-none items-center justify-center rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-600 dark:text-primary-400">
                                                <User className="h-6 w-6" aria-hidden="true" />
                                            </div>
                                            <div className="ml-4 flex-auto">
                                                <p className="text-sm font-medium text-gray-900 dark:text-white group-hover:text-primary-600 dark:group-hover:text-primary-400">
                                                    {student.name}
                                                </p>
                                                <p className="text-sm text-gray-500 dark:text-slate-400">{student.course} • Year {student.year_level}</p>
                                            </div>
                                            <div className="flex flex-none items-center gap-2">
                                                <span className="inline-flex items-center rounded-md bg-gray-50 dark:bg-slate-800 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-300 ring-1 ring-inset ring-gray-500/10 font-mono">
                                                    {student.student_id}
                                                </span>
                                                <ChevronRight className="h-5 w-5 text-gray-400" />
                                            </div>
                                        </li>
                                    ))}

                                    {/* Load More Button */}
                                    {currentPage < lastPage && (
                                        <li className="pt-2 pb-1">
                                            <button
                                                onClick={loadMore}
                                                disabled={loading}
                                                className="w-full py-2.5 text-sm font-medium text-primary-600 dark:text-primary-400 hover:bg-primary-50 dark:hover:bg-primary-900/20 rounded-xl transition-colors flex items-center justify-center gap-2"
                                            >
                                                {loading ? (
                                                    <>
                                                        <Loader2 size={14} className="animate-spin" />
                                                        Loading...
                                                    </>
                                                ) : (
                                                    `Show more results (${totalResults - results.length} remaining)`
                                                )}
                                            </button>
                                        </li>
                                    )}
                                </ul>
                            )}

                            {/* Empty States */}
                            {query.length < 1 && !hasSearched && (
                                <div className="px-6 py-14 text-center text-sm sm:px-14">
                                    <Search className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
                                    <p className="mt-4 font-semibold text-gray-900 dark:text-white">Search Students</p>
                                    <p className="mt-2 text-gray-500 dark:text-slate-400">
                                        Start typing to search by name, ID, email, or course.
                                    </p>
                                </div>
                            )}

                            {hasSearched && !loading && query !== '' && results.length === 0 && (
                                <div className="px-6 py-14 text-center text-sm sm:px-14">
                                    <User className="mx-auto h-6 w-6 text-gray-400" aria-hidden="true" />
                                    <p className="mt-4 font-semibold text-gray-900 dark:text-white">No students found</p>
                                    <p className="mt-2 text-gray-500 dark:text-slate-400">
                                        We couldn't find anything matching "{query}".
                                    </p>
                                </div>
                            )}
                        </Dialog.Panel>
                    </Transition.Child>
                </div>
            </Dialog>
        </Transition.Root>
    )
}
