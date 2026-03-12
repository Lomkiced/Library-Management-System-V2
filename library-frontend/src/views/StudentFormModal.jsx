import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { X, CheckCircle, Save, User, Hash, GraduationCap, Calendar, Mail, Phone, Layers } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useToast } from "../components/ui/Toast";
import FloatingInput from "../components/ui/FloatingInput";
import FloatingSelect from "../components/ui/FloatingSelect";
import Button from "../components/ui/Button";

export default function StudentFormModal({ studentToEdit = null, onClose, onSuccess }) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        student_id: "",
        name: "",
        email: "",
        phone_number: "",
        course: "BSIT",
        year_level: "1",
        section: ""
    });

    useEffect(() => {
        if (studentToEdit) {
            setFormData({
                student_id: studentToEdit.student_id || "",
                name: studentToEdit.name || "",
                email: studentToEdit.email || "",
                phone_number: studentToEdit.phone_number || "",
                course: studentToEdit.course || "BSIT",
                year_level: studentToEdit.year_level || "1",
                section: studentToEdit.section || ""
            });
        }
    }, [studentToEdit]);

    const handleSubmit = (e) => {
        e.preventDefault();
        setLoading(true);

        const payload = {
            ...formData,
            year_level: parseInt(formData.year_level)
        };

        const request = studentToEdit
            ? axiosClient.put(`/students/${studentToEdit.id}`, payload)
            : axiosClient.post("/students", payload);

        request
            .then(() => {
                toast.success(studentToEdit ? "Student updated successfully" : "Student added successfully");
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
                    className="relative w-full max-w-2xl bg-white dark:bg-slate-900 rounded-2xl shadow-2xl overflow-hidden border border-white/10 flex flex-col max-h-[90vh]"
                >
                    {/* Header */}
                    <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg">
                                <User className="text-primary-600 dark:text-primary-400" size={24} />
                            </div>
                            <div>
                                <h2 className="text-lg font-bold text-gray-800 dark:text-white">
                                    {studentToEdit ? "Edit Student" : "Add New Student"}
                                </h2>
                                <p className="text-sm text-gray-500 dark:text-slate-400">
                                    {studentToEdit ? "Update student information" : "Register a new student to the system"}
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
                        <form id="student-form" onSubmit={handleSubmit} className="space-y-6">
                            {/* Personal Info */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <User size={14} /> Personal Information
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="md:col-span-2">
                                        <FloatingInput
                                            label="Full Name"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            required
                                            icon={User}
                                            placeholder="e.g. Juan A. Dela Cruz"
                                        />
                                    </div>
                                    <FloatingInput
                                        label="Student ID"
                                        value={formData.student_id}
                                        onChange={(e) => setFormData({ ...formData, student_id: e.target.value })}
                                        required
                                        icon={Hash}
                                        placeholder="e.g. 2023-00123"
                                    />
                                    <FloatingInput
                                        label="Email Address"
                                        type="email"
                                        value={formData.email}
                                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                        icon={Mail}
                                        placeholder="Optional"
                                    />
                                    <div className="md:col-span-2">
                                        <FloatingInput
                                            label="Phone Number"
                                            value={formData.phone_number}
                                            onChange={(e) => setFormData({ ...formData, phone_number: e.target.value })}
                                            icon={Phone}
                                            placeholder="Optional"
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Academic Info */}
                            <div className="space-y-4 pt-4 border-t border-gray-100 dark:border-slate-800">
                                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2">
                                    <GraduationCap size={14} /> Academic Details
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div className="md:col-span-1">
                                        <FloatingSelect
                                            label="Course"
                                            value={formData.course}
                                            onChange={(e) => setFormData({ ...formData, course: e.target.value })}
                                            required
                                            icon={GraduationCap}
                                        >
                                            <option value="BSIT">BSIT</option>
                                            <option value="BSED">BSED</option>
                                            <option value="BEED">BEED</option>
                                            <option value="BSHM">BSHM</option>
                                            <option value="BSBA">BSBA</option>
                                            <option value="BS Criminology">BS Criminology</option>
                                            <option value="BS Tourism">BS Tourism</option>
                                            <option value="Maritime">Maritime</option>
                                        </FloatingSelect>
                                    </div>
                                    <div className="md:col-span-1">
                                        <FloatingSelect
                                            label="Year Level"
                                            value={formData.year_level}
                                            onChange={(e) => setFormData({ ...formData, year_level: e.target.value })}
                                            required
                                            icon={Calendar}
                                        >
                                            <option value="1">1st Year</option>
                                            <option value="2">2nd Year</option>
                                            <option value="3">3rd Year</option>
                                            <option value="4">4th Year</option>
                                        </FloatingSelect>
                                    </div>
                                    <div className="md:col-span-1">
                                        <FloatingInput
                                            label="Section"
                                            value={formData.section}
                                            onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                                            icon={Layers}
                                            placeholder="e.g. A"
                                        />
                                    </div>
                                </div>
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
                            form="student-form"
                            disabled={loading}
                            isLoading={loading}
                            icon={Save}
                            className="px-8"
                        >
                            {studentToEdit ? "Save Changes" : "Register Student"}
                        </Button>
                    </div>
                </motion.div>
            </div>
        </AnimatePresence>
    );
}
