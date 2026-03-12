import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { X, Save, User, Mail, Phone, Building2 } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../components/ui/Toast";
import FloatingInput from "../components/ui/FloatingInput";
import FloatingSelect from "../components/ui/FloatingSelect";
import Button from "../components/ui/Button";

export default function FacultyFormModal({ facultyToEdit = null, onClose, onSuccess }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        phone_number: "",
        department: "BSIT"
    });

    useEffect(() => {
        if (facultyToEdit) {
            setFormData({
                name: facultyToEdit.name || "",
                email: facultyToEdit.email || "",
                phone_number: facultyToEdit.phone_number || "",
                department: facultyToEdit.department || "BSIT"
            });
        }
    }, [facultyToEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = { ...formData };

        const request = facultyToEdit
            ? axiosClient.put(`/faculties/${facultyToEdit.id}`, payload)
            : axiosClient.post("/faculties", payload);

        request
            .then(() => {
                toast.success(facultyToEdit ? "Faculty updated successfully" : "Faculty added successfully");
                onSuccess();
                onClose();
            })
            .catch((err) => {
                const msg = err.response?.data?.message || "An error occurred";
                toast.error(msg);
                console.error(err);
            })
            .finally(() => setLoading(false));
    };

    return (
        <AnimatePresence>
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                {/* Backdrop */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    onClick={onClose}
                    className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                />

                {/* Modal Content */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.95, opacity: 0, y: 20 }}
                    className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gradient-to-r from-purple-600/10 to-indigo-600/10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gradient-to-br from-purple-600 to-indigo-600 rounded-lg">
                                <Building2 className="text-white" size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                                    {facultyToEdit ? "Edit Faculty" : "Add New Faculty"}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {facultyToEdit ? "Update faculty information" : "Register a new faculty member"}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-full transition-colors text-gray-400 hover:text-gray-600 dark:hover:text-slate-200"
                        >
                            <X size={20} />
                        </button>
                    </div>

                    {/* Form Body */}
                    <div className="p-6 overflow-y-auto custom-scrollbar">
                        <form id="faculty-form" onSubmit={handleSubmit} className="space-y-5">
                            {/* Personal Info Section */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <User size={14} /> Personal Information
                                </h3>

                                <FloatingInput
                                    label="Full Name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    required
                                    icon={User}
                                    placeholder="e.g. Dr. Juan A. Dela Cruz"
                                />

                                <FloatingInput
                                    label="Email Address"
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    icon={Mail}
                                    placeholder="e.g. jdelacruz@pclu.edu.ph"
                                />

                                <FloatingInput
                                    label="Phone Number"
                                    value={formData.phone_number}
                                    onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                    icon={Phone}
                                    placeholder="e.g. 0917-123-4567"
                                />

                                <FloatingSelect
                                    label="Department/Course"
                                    value={formData.department}
                                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                                    required
                                    icon={Building2}
                                >
                                    <option value="BSIT">BSIT - Information Technology</option>
                                    <option value="BSED">BSED - Secondary Education</option>
                                    <option value="BEED">BEED - Elementary Education</option>
                                    <option value="BSHM">BSHM - Hospitality Management</option>
                                    <option value="BSBA">BSBA - Business Administration</option>
                                    <option value="BS Criminology">BS Criminology</option>
                                    <option value="BS Tourism">BS Tourism</option>
                                    <option value="Maritime">Maritime</option>
                                </FloatingSelect>
                            </div>
                        </form>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-4 border-t border-gray-100 dark:border-slate-800 bg-gray-50/50 dark:bg-slate-900/50 flex justify-end gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-6 py-2.5 rounded-xl text-sm font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-slate-800 transition-colors"
                        >
                            Cancel
                        </button>
                        <Button
                            type="submit"
                            form="faculty-form"
                            disabled={loading}
                            isLoading={loading}
                            icon={Save}
                            className="px-8 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700"
                        >
                            {facultyToEdit ? "Save Changes" : "Add Faculty"}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
