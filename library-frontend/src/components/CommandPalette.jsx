import { useEffect, useState } from "react";
import { Command } from "cmdk";
import { Search, BookOpen, Users, Settings, LayoutDashboard, FileText, Plus, LogOut, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useTheme } from "../context/ThemeContext";

export default function CommandPalette({ isOpen, setIsOpen, setActiveTab }) {
    const { theme, toggleTheme } = useTheme();

    useEffect(() => {
        const down = (e) => {
            if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
                e.preventDefault();
                setIsOpen((open) => !open);
            }
        };

        document.addEventListener("keydown", down);
        return () => document.removeEventListener("keydown", down);
    }, [setIsOpen]);

    const runCommand = (command) => {
        setIsOpen(false);
        command();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] bg-black/60 backdrop-blur-sm animate-fadeIn">
            <div className="w-full max-w-lg overflow-hidden rounded-xl border border-gray-200 dark:border-slate-700 bg-white dark:bg-slate-900 shadow-2xl animate-scaleIn">
                <Command className="w-full">
                    <div className="flex items-center border-b border-gray-100 dark:border-slate-800 px-3">
                        <Search className="mr-2 h-5 w-5 text-gray-500" />
                        <Command.Input
                            placeholder="Type a command or search..."
                            className="flex h-12 w-full rounded-md bg-transparent py-3 text-sm outline-none placeholder:text-gray-400 dark:text-white"
                        />
                    </div>

                    <Command.List className="max-h-[300px] overflow-y-auto p-2 scroll-py-2">
                        <Command.Empty className="py-6 text-center text-sm text-gray-500">No results found.</Command.Empty>

                        <Command.Group heading="Navigation" className="text-xs font-medium text-gray-400 px-2 py-1.5 mb-1 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
                            <CommandItem icon={LayoutDashboard} onSelect={() => runCommand(() => setActiveTab('dashboard'))}>Dashboard</CommandItem>
                            <CommandItem icon={BookOpen} onSelect={() => runCommand(() => setActiveTab('books'))}>Books Inventory</CommandItem>
                            <CommandItem icon={Users} onSelect={() => runCommand(() => setActiveTab('students'))}>Students</CommandItem>
                            <CommandItem icon={FileText} onSelect={() => runCommand(() => setActiveTab('reports'))}>Reports</CommandItem>
                            <CommandItem icon={Settings} onSelect={() => runCommand(() => setActiveTab('settings'))}>Settings</CommandItem>
                        </Command.Group>

                        <Command.Separator className="my-2 h-px bg-gray-100 dark:bg-slate-800" />

                        <Command.Group heading="Quick Actions" className="text-xs font-medium text-gray-400 px-2 py-1.5 mb-1 bg-gray-50/50 dark:bg-slate-800/50 rounded-lg">
                            <CommandItem icon={Plus} onSelect={() => runCommand(() => setActiveTab('books'))}>Register New Book</CommandItem>
                            <CommandItem icon={Plus} onSelect={() => runCommand(() => setActiveTab('students'))}>Register New Student</CommandItem>
                            <CommandItem icon={theme === 'dark' ? Sun : Moon} onSelect={() => runCommand(() => toggleTheme())}>
                                Toggle Theme
                            </CommandItem>
                        </Command.Group>
                    </Command.List>
                </Command>
            </div>
        </div>
    );
}

function CommandItem({ children, icon: Icon, onSelect }) {
    return (
        <Command.Item
            onSelect={onSelect}
            className="flex cursor-pointer select-none items-center rounded-lg px-2 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-primary-50 dark:hover:bg-primary-900/20 hover:text-primary-600 dark:hover:text-primary-400 aria-selected:bg-primary-50 dark:aria-selected:bg-primary-900/20 aria-selected:text-primary-600 dark:aria-selected:text-primary-400 transition-colors"
        >
            {Icon && <Icon className="mr-2 h-4 w-4" />}
            {children}
        </Command.Item>
    );
}
