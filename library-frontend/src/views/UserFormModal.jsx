import { useEffect, useState, useCallback } from "react";
import {
    X,
    User,
    Mail,
    Lock,
    Eye,
    EyeOff,
    RefreshCw,
    Shield,
    Save,
    AlertCircle
} from "lucide-react";
import Swal from "sweetalert2";
import axiosClient from "../axios-client";
import Button from "../components/ui/Button";
import FloatingInput from "../components/ui/FloatingInput";

export default function UserFormModal({ isOpen, onClose, onSuccess, userToEdit = null }) {
    // Form Fields
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [permissions, setPermissions] = useState("full_access");
    const [notifyUser, setNotifyUser] = useState(true);

    // Form State
    const [loading, setLoading] = useState(false);
    const [errors, setErrors] = useState({});

    // Reset or Populate form when modal opens/closes/userToEdit changes
    useEffect(() => {
        if (isOpen) {
            setErrors({});
            if (userToEdit) {
                // Edit Mode
                setName(userToEdit.name || "");
                setEmail(userToEdit.email || "");
                setUsername(userToEdit.username || ""); // Might be null if student
                setPermissions(userToEdit.permissions || "full_access");
                setPassword(""); // Don't show password
                setNotifyUser(false);
            } else {
                // Create Mode
                resetForm();
            }
        }
    }, [isOpen, userToEdit]);

    const resetForm = () => {
        setName("");
        setEmail("");
        setUsername("");
        setPassword("");
        setPermissions("full_access");
        setNotifyUser(true);
        setErrors({});
        setShowPassword(false);
    };

    // Generate secure password
    const generatePassword = () => {
        const chars = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*";
        let result = "";
        const array = new Uint32Array(16);
        crypto.getRandomValues(array);
        for (let i = 0; i < 16; i++) {
            result += chars[array[i] % chars.length];
        }
        setPassword(result);
        setShowPassword(true);
        setNotifyUser(true);
    };

    // Validate unique fields
    const checkUnique = useCallback(async (field, value) => {
        if (!value) return true;

        // If editing and value hasn't changed, skip check
        if (userToEdit && userToEdit[field] === value) return true;

        try {
            const { data } = await axiosClient.post("/users/check-unique", {
                field,
                value,
                exclude_id: userToEdit?.id
            });
            if (!data.is_unique) {
                setErrors(prev => ({ ...prev, [field]: data.message }));
                return false;
            }
            setErrors(prev => ({ ...prev, [field]: null }));
            return true;
        } catch {
            return true;
        }
    }, [userToEdit]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrors({});

        // Validate unique fields before submitting
        const emailUnique = await checkUnique("email", email);
        const usernameUnique = userToEdit?.role !== 'student' ? await checkUnique("username", username) : true;

        if (!emailUnique || !usernameUnique) {
            setLoading(false);
            return;
        }

        const payload = {
            name,
            email,
        };

        if (password) {
            payload.password = password;
            // payload.notify_user = notifyUser; // Backend needs to catch this if implemented
        }

        // Add role-specific fields
        // Assuming we are mostly managing Admins here, but logic can extend
        if (!userToEdit || userToEdit.role === 'admin') {
            payload.account_type = 'admin';
            payload.username = username;
            payload.permissions = permissions;
            payload.notify_user = notifyUser;
        } else if (userToEdit && userToEdit.role === 'student') {
            // For students, we might not let them change much here, or add logic
            payload.student_id = userToEdit.student_id;
            payload.course = userToEdit.course;
            payload.year_level = userToEdit.year_level;
        }

        try {
            if (userToEdit) {
                await axiosClient.put(`/users/${userToEdit.id}`, payload);
                Swal.fire({
                    icon: 'success',
                    title: 'Updated!',
                    text: 'User account has been updated.',
                    timer: 1500,
                    showConfirmButton: false
                });
            } else {
                const { data } = await axiosClient.post("/users", payload);
                Swal.fire({
                    title: "Account Created!",
                    html: `<p class="text-gray-600">User <strong>${data.user.name}</strong> created successfully.</p>`,
                    icon: "success",
                    confirmButtonColor: "#2563eb",
                });
            }
            onSuccess();
            onClose();
        } catch (err) {
            const message = err.response?.data?.message || "Failed to save user.";
            setErrors(err.response?.data?.errors || {});
            // Only show alert if it's not a validation error we can show inline
            if (!err.response?.data?.errors) {
                Swal.fire("Error", message, "error");
            }
        } finally {
            setLoading(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
            <div
                className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-check-in border border-gray-100 dark:border-slate-700"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="sticky top-0 z-10 flex items-center justify-between p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur border-b border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary-100 dark:bg-primary-900/30 rounded-lg text-primary-600 dark:text-primary-400">
                            {userToEdit ? <User size={24} /> : <Shield size={24} />}
                        </div>
                        <div>
                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">
                                {userToEdit ? "Edit User" : "Create Administrator"}
                            </h3>
                            <p className="text-sm text-gray-500 dark:text-slate-400">
                                {userToEdit ? "Update account details and permissions" : "Add a new admin with system access"}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                        <X size={20} />
                    </button>
                </div>

                {/* Body */}
                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Account Info */}
                    <div className="space-y-4">
                        <h4 className="text-sm uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100 dark:border-slate-700 pb-2">
                            Account Information
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FloatingInput
                                label="Full Name"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                icon={User}
                                required
                                error={errors.name}
                            />
                            <FloatingInput
                                label="Email Address"
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                onBlur={() => checkUnique("email", email)}
                                icon={Mail}
                                required
                                error={errors.email}
                            />
                        </div>

                        {(!userToEdit || userToEdit.role === 'admin') && (
                            <FloatingInput
                                label="Username"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                onBlur={() => checkUnique("username", username)}
                                icon={User}
                                required
                                error={errors.username}
                            />
                        )}
                    </div>

                    {/* Security & Access */}
                    <div className="space-y-4">
                        <h4 className="text-sm uppercase tracking-wider text-gray-500 font-bold border-b border-gray-100 dark:border-slate-700 pb-2">
                            Security & Access
                        </h4>

                        <div className="relative">
                            <FloatingInput
                                label={userToEdit ? "New Password (Leave blank to keep current)" : "Password (Optional - Leave blank to auto-generate)"}
                                type={showPassword ? "text" : "password"}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                icon={Lock}
                                error={errors.password}
                                required={!userToEdit && false} // Only optional on create too (autogen)
                            />
                            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="p-2 text-gray-400 hover:text-gray-600 transition"
                                    disabled={!password}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                                <button
                                    type="button"
                                    onClick={generatePassword}
                                    className="p-2 text-primary-500 hover:text-primary-700 hover:bg-primary-50 rounded-lg transition"
                                    title="Generate Secure Password"
                                >
                                    <RefreshCw size={18} />
                                </button>
                            </div>
                        </div>

                        {!userToEdit && (
                            <div className="flex items-center gap-2 mt-2">
                                <input
                                    type="checkbox"
                                    id="notifyUser"
                                    checked={notifyUser}
                                    onChange={(e) => setNotifyUser(e.target.checked)}
                                    className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                                />
                                <label htmlFor="notifyUser" className="text-sm text-gray-600 dark:text-slate-300 select-none cursor-pointer">
                                    Send credentials to user via email
                                </label>
                            </div>
                        )}

                        {(!userToEdit || userToEdit.role === 'admin') && (
                            <div className="mt-4">
                                <label className="block text-sm font-medium text-gray-700 dark:text-slate-300 mb-2">Access Level</label>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <label className={`relative p-3 border rounded-xl cursor-pointer transition-all ${permissions === 'full_access' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <input
                                                type="radio"
                                                name="permissions"
                                                value="full_access"
                                                checked={permissions === 'full_access'}
                                                onChange={(e) => setPermissions(e.target.value)}
                                                className="text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="font-semibold text-gray-800 dark:text-white">Full Access</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 ml-6">Can manage all aspects of the system</p>
                                    </label>

                                    <label className={`relative p-3 border rounded-xl cursor-pointer transition-all ${permissions === 'read_only' ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-slate-700 hover:border-gray-300'}`}>
                                        <div className="flex items-center gap-2 mb-1">
                                            <input
                                                type="radio"
                                                name="permissions"
                                                value="read_only"
                                                checked={permissions === 'read_only'}
                                                onChange={(e) => setPermissions(e.target.value)}
                                                className="text-primary-600 focus:ring-primary-500"
                                            />
                                            <span className="font-semibold text-gray-800 dark:text-white">Read Only</span>
                                        </div>
                                        <p className="text-xs text-gray-500 dark:text-slate-400 ml-6">Can only view data and reports</p>
                                    </label>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-4 border-t border-gray-100 dark:border-slate-700">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={onClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="primary"
                            loading={loading}
                            icon={Save}
                        >
                            {userToEdit ? "Save Changes" : "Create Account"}
                        </Button>
                    </div>
                </form>
            </div>
        </div>
    );
}
