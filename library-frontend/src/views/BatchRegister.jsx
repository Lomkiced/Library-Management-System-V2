import { useState } from "react";
import axiosClient from "../axios-client";
import { Users, Plus, Minus, Upload, FileSpreadsheet, User, Hash, GraduationCap } from "lucide-react";
import FloatingInput from "../components/ui/FloatingInput";
import FloatingSelect from "../components/ui/FloatingSelect";
import Button from "../components/ui/Button";

export default function BatchRegister({ onSuccess, onCancel }) {
    // Shared Attributes
    const [course, setCourse] = useState("");
    const [yearLevel, setYearLevel] = useState("");
    const [section, setSection] = useState("");

    // Dynamic Student List
    const [students, setStudents] = useState([
        { name: "" }
    ]);

    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState(null);

    const addRow = () => {
        setStudents([...students, { name: "" }]);
    };

    const removeRow = (index) => {
        if (students.length === 1) return;
        setStudents(students.filter((_, i) => i !== index));
    };

    const updateStudent = (index, field, value) => {
        const updated = [...students];
        updated[index][field] = value;
        setStudents(updated);
    };

    const handleSubmit = (e) => {
        e.preventDefault();

        // Validate shared attributes
        if (!course || !yearLevel || !section) {
            alert("Please fill in Course, Year Level, and Section.");
            return;
        }

        // Validate all students have data
        const validStudents = students.filter(s => s.name.trim());
        if (validStudents.length === 0) {
            alert("Please add at least one student with a name.");
            return;
        }

        setLoading(true);
        setResult(null);

        axiosClient.post("/students/batch", {
            course,
            year_level: parseInt(yearLevel),
            section,
            students: validStudents
        })
            .then(({ data }) => {
                setResult(data);
                if (data.registered > 0) {
                    onSuccess();
                }
                setLoading(false);
            })
            .catch(err => {
                setResult({
                    message: err.response?.data?.message || "Batch registration failed.",
                    errors: err.response?.data?.errors || []
                });
                setLoading(false);
            });
    };

    return (
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-emerald-600 to-emerald-700 px-6 py-4 flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg">
                    <FileSpreadsheet className="text-white" size={22} />
                </div>
                <div>
                    <h2 className="text-lg font-bold text-white">Batch Registration</h2>
                    <p className="text-white/70 text-sm">Register multiple students at once</p>
                </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
                {/* SHARED ATTRIBUTES */}
                <div className="bg-gray-50 p-5 rounded-xl border border-gray-200">
                    <div className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-4 flex items-center gap-2">
                        <GraduationCap size={14} />
                        Class Details (Applied to all)
                    </div>
                    <div className="flex flex-wrap gap-4">
                        <FloatingSelect
                            label="Course"
                            value={course}
                            onChange={e => setCourse(e.target.value)}
                            required
                            className="flex-grow min-w-[140px]"
                        >
                            <option value="BSIT">BSIT</option>
                            <option value="BSED">BSED</option>
                            <option value="BEED">BEED</option>
                            <option value="Maritime">Maritime</option>
                            <option value="BSHM">BSHM</option>
                            <option value="BS Criminology">BS Criminology</option>
                            <option value="BSBA">BSBA</option>
                            <option value="BS Tourism">BS Tourism</option>
                        </FloatingSelect>

                        <FloatingSelect
                            label="Year Level"
                            value={yearLevel}
                            onChange={e => setYearLevel(e.target.value)}
                            required
                            className="flex-grow min-w-[140px]"
                        >
                            <option value="1">1st Year</option>
                            <option value="2">2nd Year</option>
                            <option value="3">3rd Year</option>
                            <option value="4">4th Year</option>
                        </FloatingSelect>

                        <FloatingInput
                            label="Section"
                            value={section}
                            onChange={e => setSection(e.target.value)}
                            icon={Hash}
                            required
                            className="flex-grow min-w-[140px]"
                        />
                    </div>
                </div>

                {/* STUDENT LIST */}
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <div className="text-sm font-bold text-gray-700 flex items-center gap-2">
                            <Users size={16} />
                            Students List ({students.length})
                        </div>
                        <Button
                            type="button"
                            onClick={addRow}
                            variant="secondary"
                            className="py-2 text-xs"
                            icon={Plus}
                        >
                            Add Row
                        </Button>
                    </div>

                    <div className="max-h-80 overflow-y-auto space-y-2 border-2 border-gray-200 rounded-xl p-4 bg-gray-50">
                        {students.map((student, index) => (
                            <div key={index} className="flex gap-3 items-center bg-white p-3 rounded-xl border border-gray-100 shadow-sm">
                                <span className="text-sm font-bold text-gray-400 w-8 text-center">{index + 1}.</span>
                                <div className="flex-1">
                                    <FloatingInput
                                        value={student.name}
                                        onChange={e => updateStudent(index, "name", e.target.value)}
                                        label="Student Name"
                                        icon={User}
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={() => removeRow(index)}
                                    className="text-gray-400 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition"
                                    disabled={students.length === 1}
                                >
                                    <Minus size={18} />
                                </button>
                            </div>
                        ))}
                    </div>
                </div>

                {/* RESULT MESSAGE */}
                {result && (
                    <div className={`p-4 rounded-xl text-sm border-2 ${result.registered > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        <div className="font-bold">{result.message}</div>
                        {result.errors && result.errors.length > 0 && (
                            <ul className="mt-2 list-disc list-inside text-xs opacity-80">
                                {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                            </ul>
                        )}
                    </div>
                )}

                {/* ACTIONS */}
                <div className="flex gap-3 pt-2">
                    <Button
                        type="submit"
                        variant="success"
                        loading={loading}
                        fullWidth
                        icon={Upload}
                    >
                        Register All Students
                    </Button>
                    <Button
                        type="button"
                        onClick={onCancel}
                        variant="outline"
                        fullWidth
                    >
                        Cancel
                    </Button>
                </div>
            </form>
        </div>
    );
}

