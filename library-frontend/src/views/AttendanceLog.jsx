import { AnimatePresence, motion } from "framer-motion";
import { BarChart3, Calendar, ChevronLeft, ChevronRight, ClipboardList, Clock, Download, FileText, Loader2, Printer, RefreshCw, Search, Users, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, XAxis, YAxis, LabelList } from "recharts";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, AlignmentType, TextRun, HeadingLevel, BorderStyle, ImageRun, VerticalAlign } from "docx";
import { saveAs } from "file-saver";
import axiosClient from "../axios-client";
import { useLibrarySettings } from "../context/LibrarySettingsContext";
import Swal from "sweetalert2";

export default function AttendanceLog() {
    const { libraryName } = useLibrarySettings();
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [totalCount, setTotalCount] = useState(0);
    const [displayDate, setDisplayDate] = useState("");
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [lastRefresh, setLastRefresh] = useState(null);
    const [searchTerm, setSearchTerm] = useState("");
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportLogs, setReportLogs] = useState([]); // Store full list for report
    const [generatingReport, setGeneratingReport] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const [lastPage, setLastPage] = useState(1);
    const [loadingMore, setLoadingMore] = useState(false);
    const pollIntervalRef = useRef(null);
    const currentPageRef = useRef(1);

    // Graph Report State
    const [showGraphModal, setShowGraphModal] = useState(false);
    const [graphData, setGraphData] = useState([]);
    const [graphMonthLabel, setGraphMonthLabel] = useState("");
    const [generatingGraph, setGeneratingGraph] = useState(false);
    const graphRef = useRef(null);


    // Keep ref in sync with state
    useEffect(() => {
        currentPageRef.current = currentPage;
    }, [currentPage]);

    useEffect(() => {
        fetchLogsByDate(selectedDate);

        const today = new Date().toISOString().split('T')[0];
        if (selectedDate === today) {
            pollIntervalRef.current = setInterval(() => {
                // Use ref to get latest current page inside closure
                fetchLogsByDate(selectedDate, true, currentPageRef.current);
            }, 15000);
        }

        return () => {
            if (pollIntervalRef.current) {
                clearInterval(pollIntervalRef.current);
            }
        };
    }, [selectedDate]);

    const fetchLogsByDate = async (date, silent = false, page = 1) => {
        if (!silent) setLoading(true);
        if (silent && page > 1) return; // Don't silent poll on other pages for now

        try {
            const response = await axiosClient.get(`/attendance/today?date=${date}&page=${page}`);
            setLogs(response.data.logs || []);
            setTotalCount(response.data.count || 0);
            setDisplayDate(response.data.date || date);

            if (response.data.pagination) {
                setCurrentPage(response.data.pagination.current_page);
                setLastPage(response.data.pagination.last_page);
            }

            setLastRefresh(new Date());
        } catch (err) {
            console.error("Failed to fetch attendance logs:", err);
        } finally {
            if (!silent) setLoading(false);
        }
    };

    const goToPreviousDay = () => {
        const prev = new Date(selectedDate);
        prev.setDate(prev.getDate() - 1);
        setSelectedDate(prev.toISOString().split('T')[0]);
        setCurrentPage(1);
    };

    const goToNextDay = () => {
        const next = new Date(selectedDate);
        next.setDate(next.getDate() + 1);
        const today = new Date().toISOString().split('T')[0];
        if (next.toISOString().split('T')[0] <= today) {
            setSelectedDate(next.toISOString().split('T')[0]);
            setCurrentPage(1);
        }
    };

    const goToToday = () => {
        const today = new Date().toISOString().split('T')[0];
        setSelectedDate(today);
        setCurrentPage(1); // Reset to page 1
    };

    const handleGenerateReport = async () => {
        setGeneratingReport(true);
        try {
            // Get start and end of the month for selected date
            const date = new Date(selectedDate);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
            const daysInMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();

            // Fetch all attendance for the month
            const response = await axiosClient.get(`/attendance/today?start_date=${startOfMonth}&end_date=${endOfMonth}&all=true`);
            const allLogs = response.data.logs || [];

            // Define courses (columns)
            const courses = ['FACULTY', 'IT', 'CRIM', 'MAR', 'EDUC', 'HM/TM', 'BSBA', 'GRAD SC'];

            // Create data structure: { day: { course: count } }
            const monthlyData = {};
            for (let d = 1; d <= daysInMonth; d++) {
                monthlyData[d] = {};
                courses.forEach(c => monthlyData[d][c] = 0);
                monthlyData[d].total = 0;
            }

            // Aggregate logs by day and course
            allLogs.forEach(log => {
                const logDate = new Date(log.logged_at);
                const day = logDate.getDate();
                let course = log.user?.course?.toUpperCase() || 'OTHER';

                // Map course variations
                if (course.includes('CRIMINOLOGY') || course.includes('CRIM')) course = 'CRIM';
                else if (course.includes('MARITIME') || course.includes('MAR')) course = 'MAR';
                else if (course.includes('EDUCATION') || course.includes('EDUC')) course = 'EDUC';
                else if (course.includes('HM') || course.includes('TOURISM') || course.includes('TM')) course = 'HM/TM';
                else if (course.includes('BSBA') || course.includes('BUSINESS')) course = 'BSBA';
                else if (course.includes('GRAD') || course.includes('SC')) course = 'GRAD SC';
                else if (course.includes('IT') || course.includes('INFORMATION')) course = 'IT';
                else if (course.includes('FACULTY')) course = 'FACULTY';
                else course = 'OTHER';

                if (monthlyData[day] && courses.includes(course)) {
                    monthlyData[day][course]++;
                    monthlyData[day].total++;
                } else if (monthlyData[day]) {
                    monthlyData[day].total++;
                }
            });

            // Store data for modal preview and print
            setReportLogs({ monthlyData, courses, daysInMonth, monthLabel: date.toLocaleString('default', { month: 'long', year: 'numeric' }) });
            setShowReportModal(true);
        } catch (error) {
            console.error("Failed to generate report:", error);
        } finally {
            setGeneratingReport(false);
        }
    };

    // Generate Graph Report - Aggregates by course for selected month
    const handleGenerateGraphReport = async () => {
        setGeneratingGraph(true);
        try {
            // Get start and end of the month for selected date
            const date = new Date(selectedDate);
            const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1).toISOString().split('T')[0];
            const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0).toISOString().split('T')[0];
            const monthLabel = date.toLocaleString('default', { month: 'long', year: 'numeric' });

            // Fetch all attendance for the month
            const response = await axiosClient.get(`/attendance/today?start_date=${startOfMonth}&end_date=${endOfMonth}&all=true`);
            const allLogs = response.data.logs || [];

            // Aggregate by course
            const courseMap = {};
            allLogs.forEach(log => {
                const course = log.user?.course || 'Unknown';
                courseMap[course] = (courseMap[course] || 0) + 1;
            });

            // Convert to array for chart
            const chartData = Object.entries(courseMap)
                .map(([course, count]) => ({ course, total: count }))
                .sort((a, b) => b.total - a.total);

            setGraphData(chartData);
            setGraphMonthLabel(monthLabel);
            setShowGraphModal(true);
        } catch (error) {
            console.error("Failed to generate graph report:", error);
            // Fallback: aggregate current page logs
            const courseMap = {};
            logs.forEach(log => {
                const course = log.user?.course || 'Unknown';
                courseMap[course] = (courseMap[course] || 0) + 1;
            });
            const chartData = Object.entries(courseMap)
                .map(([course, count]) => ({ course, total: count }))
                .sort((a, b) => b.total - a.total);
            const date = new Date(selectedDate);
            setGraphData(chartData);
            setGraphMonthLabel(date.toLocaleString('default', { month: 'long', year: 'numeric' }));
            setShowGraphModal(true);
        } finally {
            setGeneratingGraph(false);
        }
    };

    const handlePrintReport = () => {
        if (!reportLogs?.monthlyData) return;

        const { monthlyData, courses, daysInMonth, monthLabel } = reportLogs;

        // Check which days are Sundays
        const date = new Date(selectedDate);
        const year = date.getFullYear();
        const month = date.getMonth();

        const getSundays = () => {
            const sundays = [];
            for (let d = 1; d <= daysInMonth; d++) {
                if (new Date(year, month, d).getDay() === 0) sundays.push(d);
            }
            return sundays;
        };
        const sundays = getSundays();

        // Separation of Faculty and Students
        const facultyCourse = courses.find(c => c.toUpperCase() === 'FACULTY');
        const studentCourses = courses.filter(c => c.toUpperCase() !== 'FACULTY');

        // Calculate grand totals
        const grandTotals = {};
        courses.forEach(c => grandTotals[c] = 0);
        grandTotals.total = 0;

        Object.values(monthlyData).forEach(dayData => {
            courses.forEach(c => grandTotals[c] += (dayData[c] || 0));
            grandTotals.total += (dayData.total || 0);
        });

        // Generate table rows
        const tableRows = [];
        for (let d = 1; d <= daysInMonth; d++) {
            const isSunday = sundays.includes(d);
            const rowData = monthlyData[d] || {}; // Handle potential undefined day data

            // Cells for Faculty and Students
            const facultyCell = `<td class="num-col">${facultyCourse ? (rowData[facultyCourse] || '') : ''}</td>`;
            const studentCells = studentCourses.map(c => `<td class="num-col">${rowData[c] || ''}</td>`).join('');

            tableRows.push(`
                <tr>
    <td class="date-col">${d}</td>
                    ${isSunday ? `<td colspan="${courses.length + 1}" class="sunday">Sunday</td>` : `
                        ${facultyCell}
                        ${studentCells}
                        <td class="num-col total-col">${rowData.total || ''}</td>
                    `}
                </tr>
    `);
        }

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Monthly Statistics - ${monthLabel}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    @page { size: portrait; margin: 0.25in; }
                    body {
                        font-family: 'Times New Roman', serif;
                        padding: 20px;
                        background: white;
                        color: #000;
                        font-size: 11px;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .header {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .header-logo {
                        width: 80px;
                        flex-shrink: 0;
                        display: flex;
                        justify-content: center;
                    }
                    .header-logo img {
                        width: 60px;
                        height: 60px;
                    }
                    .header-text {
                        flex: 1;
                        text-align: center;
                    }
                    .header-text h1 { font-size: 14px; margin: 0; font-weight: bold; }
                    .header-text p { font-size: 10px; margin: 1px 0; }
                    
                    .iso-section {
                        width: 80px;
                        flex-shrink: 0;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                    }
                    .iso-text {
                        font-size: 6px;
                        font-weight: bold;
                        margin-bottom: 2px;
                        white-space: nowrap;
                    }
                    .iso-badge {
                        width: 80px;
                        height: auto;
                    }
                    
                    .divider {
                        border: 0;
                        border-top: 2px solid black;
                        margin: 5px 0 10px 0;
                    }

                    .title-section {
                        text-align: center;
                        margin-bottom: 10px;
                        background-color: #DBEAFE;
                        border: 1px solid #bfdbfe;
                        padding: 10px;
                    }
                    .title-section h2 { 
                        font-size: 16px; 
                        margin: 0; 
                        text-transform: uppercase; 
                        color: #1e3a8a;
                        font-weight: bold;
                    }
                    .title-section p { 
                        font-size: 12px; 
                        margin: 5px 0 0 0; 
                        color: #000;
                    }


                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 15px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 2px;
                        text-align: center;
                        font-size: 9px;
                        height: 18px; 
                    }
                    th {
                        background: #DBEAFE;
                        font-weight: bold;
                        height: auto;
                    }
                    .date-col { width: 40px; }
                    .num-col { width: 50px; }
                    .total-col { background: #DBEAFE; font-weight: bold; }
                    .sunday {
                        font-style: italic;
                        color: #64748b;
                        background: #f8fafc;
                    }

                    .signatures-row {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 25px;
                    }
                    .signature-box {
                        width: 45%;
                        text-align: center;
                    }
                    .sig-label { margin-bottom: 30px; font-size: 11px; }
                    .sig-name {
                        font-weight: bold;
                        border-top: 1px solid black;
                        display: inline-block;
                        padding-top: 5px;
                        width: 100%;
                        font-size: 12px;
                        text-transform: uppercase;
                    }
                    .sig-title { font-style: italic; font-size: 11px; color: #444; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-logo">
                        <img src="${window.location.origin}/pclu-logo.png" alt="PCLU" />
                    </div>
                    <div class="header-text">
                        <h1>POLYTECHNIC COLLEGE OF LA UNION (PCLU), INC.</h1>
                        <p>(Formerly PAMETS COLLEGES)</p>
                        <p>Don Pastor L. Panay Sr. Street, San Nicolas Sur, Agoo, La Union 2504</p>
                        <p>Tel. No. (072) 2061761 Mobile No. 09171623141/09260953781</p>
                        <p>Email: pclucollege@pclu.com.ph</p>
                        <p>https://www.facebook.com/PCLUOfficialpage</p>
                    </div>
                    <div class="iso-section">
                        <span class="iso-text">PLIB 014 ISSUE 1 REV 0 061614</span>
                        <img src="${window.location.origin}/iso-logo.png" class="iso-badge" alt="ISO Certified" />
                    </div>
                </div>
                <hr class="divider" />

                <div class="title-section">
                    <h2>MONTHLY STATISTICS</h2>
                    <p>Month: ${monthLabel.toUpperCase()}</p>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th rowspan="2" class="date-col">DATE</th>
                            <th rowspan="2" class="num-col">FACULTY</th>
                            <th colspan="${studentCourses.length}">STUDENTS</th>
                            <th rowspan="2" class="num-col total-col">Grand TOTAL</th>
                        </tr>
                        <tr>
                            ${studentCourses.map(c => `<th class="num-col">${c}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows.join('')}
                        <tr style="background: #DBEAFE; font-weight: bold;">
                            <td>TOTAL</td>
                            <td class="num-col">${facultyCourse ? (grandTotals[facultyCourse] || 0) : 0}</td>
                            ${studentCourses.map(c => `<td class="num-col">${grandTotals[c] || 0}</td>`).join('')}
                            <td class="total-col">${grandTotals.total || 0}</td>
                        </tr>
                    </tbody>
                </table>

                <div class="signatures-row">
                    <div class="signature-box">
                        <p class="sig-label" style="text-align: center;">Prepared by:</p>
                        <p class="sig-name">PATRICIA NIKOLE C. MASILANG</p>
                        <p class="sig-title">College Library Clerk</p>
                    </div>
                    <div class="signature-box">
                        <p class="sig-label" style="text-align: center;">Noted by:</p>
                        <p class="sig-name">LEAH E. CAMSO.RL MLIS</p>
                        <p class="sig-title">Chief Librarian</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        printFrame.style.left = '-9999px';
        printFrame.srcdoc = printContent;
        document.body.appendChild(printFrame);

        printFrame.onload = () => {
            try {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
            } catch (e) {
                console.error('Print error:', e);
            }
            setTimeout(() => {
                if (printFrame.parentNode) {
                    document.body.removeChild(printFrame);
                }
            }, 2000);
        };
    };

    const fetchImage = async (url) => {
        try {
            const response = await fetch(url);
            const blob = await response.blob();
            return await blob.arrayBuffer();
        } catch (error) {
            console.error("Error fetching image:", error);
            return null;
        }
    };

    // Function to generate ISO badge as a data URL (Pixel-Perfect Version)
    // const generateIsoBadgeImage = (width, height) => { ... } // Removed as we use image file now

    // Download Monthly Statistics Report as DOCX
    const handleDownloadReportDocx = async () => {
        if (!reportLogs?.monthlyData) return;

        const { monthlyData, courses, daysInMonth, monthLabel } = reportLogs;
        const pcluLogo = await fetchImage('/pclu-logo.png');
        const isoLogo = await fetchImage('/iso-logo.png');

        const date = new Date(selectedDate);
        const year = date.getFullYear();
        const month = date.getMonth();

        // Identify Sundays
        const sundays = [];
        for (let d = 1; d <= daysInMonth; d++) {
            if (new Date(year, month, d).getDay() === 0) sundays.push(d);
        }

        const facultyCourse = courses.find(c => c.toUpperCase() === 'FACULTY');
        const studentCourses = courses.filter(c => c.toUpperCase() !== 'FACULTY');
        const allColumns = [facultyCourse, ...studentCourses].filter(Boolean);

        // Shared border style for all cells
        const cellBorders = {
            top: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
            left: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
            right: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
        };

        // Helper to create a styled table cell
        const makeCell = (text, opts = {}) => {
            const { bold = false, shading, width, columnSpan } = opts;
            const cellOpts = {
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: String(text), bold, size: 18, font: 'Times New Roman' })],
                    }),
                ],
                borders: cellBorders,
                verticalAlign: 'center',
            };
            if (shading) cellOpts.shading = { fill: shading };
            if (width) cellOpts.width = { size: width, type: WidthType.DXA };
            if (columnSpan) cellOpts.columnSpan = columnSpan;
            return new TableCell(cellOpts);
        };

        // Generate ISO badge dynamically - REMOVED
        // const isoBadgeDataUrl = generateIsoBadgeImage(100, 60);
        // const isoBadgeImageData = isoBadgeDataUrl ? isoBadgeDataUrl.split(',')[1] : null;

        const NO_BORDER = {
            top: { style: BorderStyle.NIL },
            bottom: { style: BorderStyle.NIL },
            left: { style: BorderStyle.NIL },
            right: { style: BorderStyle.NIL },
            insideVertical: { style: BorderStyle.NIL },
            insideHorizontal: { style: BorderStyle.NIL },
        };

        // Header Table
        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: NO_BORDER,
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        pcluLogo ? new ImageRun({
                                            data: pcluLogo,
                                            transformation: { width: 80, height: 80 },
                                        }) : new TextRun(""),
                                    ],
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                            width: { size: 15, type: WidthType.PERCENTAGE },
                            verticalAlign: 'center',
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: 'POLYTECHNIC COLLEGE OF LA UNION (PCLU), INC.', bold: true, size: 20, font: 'Times New Roman' })], // Reduced size to 10pt
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: '(Formerly PAMETS COLLEGES)', size: 16, font: 'Times New Roman' })], // Reduced size to 8pt
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: 'Don Pastor L. Panay Sr. Street, San Nicolas Sur, Agoo, La Union 2504', size: 16, font: 'Times New Roman' })],
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: 'Tel. No. (072) 2061761 Mobile No. 09171623141/09260953781', size: 16, font: 'Times New Roman' })],
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: 'Email: pclucollege@pclu.com.ph', size: 16, font: 'Times New Roman' })],
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: 'https://www.facebook.com/PCLUOfficialpage', size: 16, font: 'Times New Roman' })],
                                }),
                            ],
                            width: { size: 70, type: WidthType.PERCENTAGE },
                            verticalAlign: 'center',
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: "PLIB 014 ISSUE 1 REV 0 061614", bold: true, size: 9, font: "Arial" })],
                                    alignment: AlignmentType.CENTER,
                                    spacing: { after: 50 }, // Small space after text
                                }),
                                new Paragraph({
                                    children: [
                                        isoLogo ? new ImageRun({
                                            data: isoLogo,
                                            transformation: { width: 80, height: 50 }, // Reverted size
                                        }) : new TextRun(""),
                                    ],
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                            width: { size: 15, type: WidthType.PERCENTAGE },
                            verticalAlign: 'center',
                        }),
                    ],
                }),
            ],
        });

        // Signature Table - 2-column layout to avoid middle column border issue
        const noBorderCell = {
            top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        };
        const signatureTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: "Prepared by:", size: 20, font: 'Times New Roman' })],
                                    alignment: AlignmentType.CENTER,
                                }),
                                new Paragraph({ text: "", spacing: { before: 1000 } }),
                                new Paragraph({
                                    children: [new TextRun({ text: "PATRICIA NIKOLE C. MASILANG", bold: true, size: 20, font: 'Times New Roman' })],
                                    alignment: AlignmentType.CENTER,
                                    border: { top: { style: BorderStyle.SINGLE, size: 12, space: 1, color: "000000" } },
                                }),
                                new Paragraph({
                                    children: [new TextRun({ text: "College Library Clerk", italics: true, size: 18, font: 'Times New Roman', color: "444444" })],
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                            width: { size: 40, type: WidthType.PERCENTAGE },
                            borders: noBorderCell,
                        }),
                        new TableCell({
                            children: [],
                            width: { size: 20, type: WidthType.PERCENTAGE },
                            borders: noBorderCell,
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: "Noted by:", size: 20, font: 'Times New Roman' })],
                                    alignment: AlignmentType.CENTER,
                                }),
                                new Paragraph({ text: "", spacing: { before: 1000 } }),
                                new Paragraph({
                                    children: [new TextRun({ text: "LEAH E. CAMSO.RL MLIS", bold: true, size: 20, font: 'Times New Roman' })],
                                    alignment: AlignmentType.CENTER,
                                    border: { top: { style: BorderStyle.SINGLE, size: 12, space: 1, color: "000000" } },
                                }),
                                new Paragraph({
                                    children: [new TextRun({ text: "Chief Librarian", italics: true, size: 18, font: 'Times New Roman', color: "444444" })],
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                            width: { size: 40, type: WidthType.PERCENTAGE },
                            borders: noBorderCell,
                        }),
                    ],
                }),
            ],
        });

        // --- Build header rows ---
        const headerRow1 = new TableRow({
            children: [
                makeCell('DATE', { bold: true, shading: 'DBEAFE', width: 600 }),
                makeCell('FACULTY', { bold: true, shading: 'DBEAFE', width: 900 }),
                new TableCell({
                    children: [
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({ text: 'STUDENTS', bold: true, size: 18, font: 'Times New Roman' })],
                        }),
                    ],
                    borders: cellBorders,
                    columnSpan: studentCourses.length,
                    shading: { fill: 'DBEAFE' },
                    verticalAlign: 'center',
                }),
                makeCell('Grand TOTAL', { bold: true, shading: 'DBEAFE', width: 1000 }),
            ],
        });

        const headerRow2 = new TableRow({
            children: [
                // Empty cells for DATE and FACULTY (spanned from row above — docx doesn't merge rows, so we repeat)
                makeCell('', { shading: 'DBEAFE', width: 600 }),
                makeCell('', { shading: 'DBEAFE', width: 900 }),
                ...studentCourses.map(c => makeCell(c, { bold: true, shading: 'DBEAFE', width: 900 })),
                makeCell('', { shading: 'DBEAFE', width: 1000 }),
            ],
        });

        // --- Build data rows ---
        const dataRows = [];
        const grandTotals = {};
        courses.forEach(c => grandTotals[c] = 0);
        grandTotals.total = 0;

        for (let d = 1; d <= daysInMonth; d++) {
            const isSunday = sundays.includes(d);
            const rowData = monthlyData[d] || {};

            // Accumulate grand totals
            courses.forEach(c => grandTotals[c] += (rowData[c] || 0));
            grandTotals.total += (rowData.total || 0);

            if (isSunday) {
                dataRows.push(
                    new TableRow({
                        children: [
                            makeCell(String(d), { bold: true, width: 600 }),
                            new TableCell({
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [new TextRun({ text: 'Sunday', italics: true, color: '94A3B8', size: 18, font: 'Times New Roman' })],
                                    }),
                                ],
                                borders: cellBorders,
                                columnSpan: allColumns.length + 1,
                                shading: { fill: 'F8FAFC' },
                            }),
                        ],
                    })
                );
            } else {
                dataRows.push(
                    new TableRow({
                        children: [
                            makeCell(String(d), { bold: true, width: 600 }),
                            makeCell(facultyCourse ? (rowData[facultyCourse] || '') : '', { width: 900 }),
                            ...studentCourses.map(c => makeCell(rowData[c] || '', { width: 900 })),
                            makeCell(rowData.total || '', { bold: true, shading: 'DBEAFE', width: 1000 }),
                        ],
                    })
                );
            }
        }

        // Grand total row
        const grandTotalRow = new TableRow({
            children: [
                makeCell('TOTAL', { bold: true, shading: 'DBEAFE', width: 600 }),
                makeCell(facultyCourse ? String(grandTotals[facultyCourse] || 0) : '0', { bold: true, shading: 'DBEAFE', width: 900 }),
                ...studentCourses.map(c => makeCell(String(grandTotals[c] || 0), { bold: true, shading: 'DBEAFE', width: 900 })),
                makeCell(String(grandTotals.total || 0), { bold: true, shading: 'DBEAFE', width: 1000 }),
            ],
        });

        const table = new Table({
            rows: [headerRow1, headerRow2, ...dataRows, grandTotalRow],
            width: { size: 100, type: WidthType.PERCENTAGE },
        });

        // --- Build the Document ---
        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            margin: { top: 400, bottom: 400, left: 600, right: 600 },
                        },
                    },
                    children: [
                        headerTable,

                        // Thick Black Line
                        new Paragraph({
                            spacing: { before: 100, after: 300 },
                            border: {
                                bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 24 },
                            },
                        }),

                        // Title
                        // Title Section (Blue Box)
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.SINGLE, size: 1, color: "1e3a8a" },
                                bottom: { style: BorderStyle.SINGLE, size: 1, color: "1e3a8a" },
                                left: { style: BorderStyle.SINGLE, size: 1, color: "1e3a8a" },
                                right: { style: BorderStyle.SINGLE, size: 1, color: "1e3a8a" },
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            shading: { fill: "E0F2FE" }, // Light blue background
                                            children: [
                                                new Paragraph({
                                                    alignment: AlignmentType.CENTER,
                                                    spacing: { before: 100, after: 50 },
                                                    children: [new TextRun({ text: "MONTHLY STATISTICS", bold: true, size: 28, font: 'Times New Roman', color: "1e3a8a" })],
                                                }),
                                                new Paragraph({
                                                    alignment: AlignmentType.CENTER,
                                                    spacing: { before: 50, after: 100 },
                                                    children: [new TextRun({ text: "Month: " + monthLabel.toUpperCase(), bold: true, size: 20, font: 'Times New Roman' })],
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        }),

                        new Paragraph({ spacing: { before: 400 }, children: [] }),

                        // Table
                        table,

                        // Spacer
                        new Paragraph({ spacing: { before: 600 }, children: [] }),

                        // Signatures
                        signatureTable,
                    ],
                },
            ],
        });

        try {
            const blob = await Packer.toBlob(doc);
            const defaultFilename = `Monthly_Statistics_${monthLabel.replace(/\s+/g, '_')}`;

            const { value: filename } = await Swal.fire({
                title: 'Enter Filename',
                input: 'text',
                inputLabel: 'Filename',
                inputValue: defaultFilename,
                showCancelButton: true,
                confirmButtonText: 'Download',
                cancelButtonText: 'Cancel',
                inputValidator: (value) => {
                    if (!value) {
                        return 'You need to write a filename!';
                    }
                }
            });

            if (filename) {
                saveAs(blob, `${filename}.docx`);
                Swal.fire({
                    icon: 'success',
                    title: 'Downloaded!',
                    text: 'Your report has been downloaded successfully.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (err) {
            console.error('Failed to generate DOCX:', err);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Something went wrong while generating the document!',
            });
        }
    };

    // Download Graph Statistics Report as DOCX
    const handleDownloadGraphDocx = async () => {
        if (!graphData || graphData.length === 0) return;

        const pcluLogo = await fetchImage('/pclu-logo.png');
        const isoLogo = await fetchImage('/iso-logo.png');

        // SVG to Image conversion helper for Recharts
        const getChartImage = async () => {
            if (!graphRef.current) return null;
            const svg = graphRef.current.querySelector('svg');
            if (!svg) return null;

            const svgData = new XMLSerializer().serializeToString(svg);
            const canvas = document.createElement("canvas");
            const ctx = canvas.getContext("2d");
            const img = new Image();

            // Set higher resolution for printing
            const scale = 2;
            const width = svg.clientWidth || 800;
            const height = svg.clientHeight || 400;
            canvas.width = width * scale;
            canvas.height = height * scale;

            return new Promise((resolve) => {
                img.onload = () => {
                    ctx.save();
                    ctx.scale(scale, scale);
                    ctx.fillStyle = "white"; // Add white background
                    ctx.fillRect(0, 0, width, height);
                    ctx.drawImage(img, 0, 0, width, height);
                    ctx.restore();
                    resolve(canvas.toDataURL("image/png"));
                };
                img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
            });
        };

        const chartImageBase64 = await getChartImage();
        const chartImageData = chartImageBase64 ? chartImageBase64.split(',')[1] : null;


        // Shared border style
        const cellBorders = {
            top: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
            left: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
            right: { style: BorderStyle.SINGLE, size: 1, color: '333333' },
        };

        // Header Table
        const headerTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NIL },
                bottom: { style: BorderStyle.NIL },
                left: { style: BorderStyle.NIL },
                right: { style: BorderStyle.NIL },
                insideVertical: { style: BorderStyle.NIL },
                insideHorizontal: { style: BorderStyle.NIL },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [
                                        pcluLogo ? new ImageRun({
                                            data: pcluLogo,
                                            transformation: { width: 80, height: 80 },
                                        }) : new TextRun(""),
                                    ],
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                            width: { size: 15, type: WidthType.PERCENTAGE },
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: 'POLYTECHNIC COLLEGE OF LA UNION (PCLU), INC.', bold: true, size: 24, font: 'Times New Roman' })],
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: '(Formerly PAMETS COLLEGES)', size: 18, font: 'Times New Roman' })],
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: 'Don Pastor L. Panay Sr. Street, San Nicolas Sur, Agoo, La Union 2504', size: 18, font: 'Times New Roman' })],
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: 'Tel. No. (072) 2061761 Mobile No. 09171623141/09260953781', size: 18, font: 'Times New Roman' })],
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: 'Email: pclucollege@pclu.com.ph', size: 18, font: 'Times New Roman' })],
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: 'https://www.facebook.com/PCLUOfficialpage', size: 18, font: 'Times New Roman' })],
                                }),
                                new Paragraph({
                                    alignment: AlignmentType.CENTER,
                                    children: [new TextRun({ text: 'Member: Philippine Association of Colleges & Universities', size: 18, font: 'Times New Roman' })],
                                }),
                            ],
                            width: { size: 70, type: WidthType.PERCENTAGE },
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({
                                    children: [new TextRun({ text: "PLIB 014 ISSUE 1 REV 0 061614", bold: true, size: 9, font: "Arial" })],
                                    alignment: AlignmentType.CENTER,
                                    spacing: { after: 50 },
                                }),
                                new Paragraph({
                                    children: [
                                        isoLogo ? new ImageRun({
                                            data: isoLogo,
                                            transformation: { width: 80, height: 50 },
                                        }) : new TextRun(""),
                                    ],
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                            width: { size: 15, type: WidthType.PERCENTAGE },
                            verticalAlign: 'center',
                        }),
                    ],
                }),
            ],
        });

        const noBorderCell = {
            top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
        };
        const signatureTable = new Table({
            width: { size: 100, type: WidthType.PERCENTAGE },
            borders: {
                top: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                bottom: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                left: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                right: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideVertical: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
                insideHorizontal: { style: BorderStyle.NONE, size: 0, color: 'FFFFFF' },
            },
            rows: [
                new TableRow({
                    children: [
                        new TableCell({
                            children: [
                                new Paragraph({ children: [new TextRun({ text: "Prepared by:", bold: false, size: 20, font: 'Times New Roman' })], alignment: AlignmentType.CENTER }),
                                new Paragraph({ text: "", spacing: { before: 300 } }),
                                new Paragraph({
                                    children: [new TextRun({ text: "PATRICIA NIKOLE C. MASILANG", bold: true, size: 20, font: 'Times New Roman' })],
                                    alignment: AlignmentType.CENTER,
                                    border: { top: { style: BorderStyle.SINGLE, size: 12, space: 1, color: "000000" } },
                                }),
                                new Paragraph({
                                    children: [new TextRun({ text: "College Library Clerk", italics: true, size: 18, font: 'Times New Roman', color: "444444" })],
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                            width: { size: 40, type: WidthType.PERCENTAGE },
                            borders: noBorderCell,
                        }),
                        new TableCell({
                            children: [],
                            width: { size: 20, type: WidthType.PERCENTAGE },
                            borders: noBorderCell,
                        }),
                        new TableCell({
                            children: [
                                new Paragraph({ children: [new TextRun({ text: "Noted by:", bold: false, size: 20, font: 'Times New Roman' })], alignment: AlignmentType.CENTER }),
                                new Paragraph({ text: "", spacing: { before: 300 } }),
                                new Paragraph({
                                    children: [new TextRun({ text: "LEAH E. CAMSO.RL MLIS", bold: true, size: 20, font: 'Times New Roman' })],
                                    alignment: AlignmentType.CENTER,
                                    border: { top: { style: BorderStyle.SINGLE, size: 12, space: 1, color: "000000" } },
                                }),
                                new Paragraph({
                                    children: [new TextRun({ text: "Chief Librarian", italics: true, size: 18, font: 'Times New Roman', color: "444444" })],
                                    alignment: AlignmentType.CENTER,
                                }),
                            ],
                            width: { size: 40, type: WidthType.PERCENTAGE },
                            borders: noBorderCell,
                        }),
                    ],
                }),
            ],
        });

        const doc = new Document({
            sections: [
                {
                    properties: {
                        page: {
                            margin: { top: 720, bottom: 720, left: 720, right: 720 },
                        },
                    },
                    children: [
                        headerTable,

                        // Thick Black Line
                        new Paragraph({
                            spacing: { before: 100, after: 300 },
                            border: {
                                bottom: { color: "000000", space: 1, style: BorderStyle.SINGLE, size: 6 },
                            },
                        }),

                        // Statistics Blue Bar (Consolidated Title)
                        new Table({
                            width: { size: 100, type: WidthType.PERCENTAGE },
                            borders: {
                                top: { style: BorderStyle.NIL },
                                bottom: { style: BorderStyle.NIL },
                                left: { style: BorderStyle.NIL },
                                right: { style: BorderStyle.NIL },
                                insideVertical: { style: BorderStyle.NIL },
                                insideHorizontal: { style: BorderStyle.NIL },
                            },
                            rows: [
                                new TableRow({
                                    children: [
                                        new TableCell({
                                            shading: { fill: "DBEAFE" },
                                            children: [
                                                new Paragraph({
                                                    alignment: AlignmentType.CENTER,
                                                    children: [new TextRun({ text: `STATISTICS FOR THE MONTH OF ${graphMonthLabel.toUpperCase()}`, bold: true, size: 22, font: 'Arial', color: "1E3A8A" })],
                                                }),
                                            ],
                                        }),
                                    ],
                                }),
                            ],
                        }),

                        // Graph / Chart Image
                        new Paragraph({
                            alignment: AlignmentType.CENTER,
                            spacing: { before: 600, after: 600 },
                            children: [
                                chartImageData ? new ImageRun({
                                    data: Uint8Array.from(atob(chartImageData), c => c.charCodeAt(0)),
                                    transformation: { width: 620, height: 450 },
                                }) : new TextRun({ text: "Graph data not available for DOCX", italics: true, color: "666666" }),
                            ],
                        }),

                        // Spacer
                        new Paragraph({ spacing: { before: 200 }, children: [] }),

                        // Signature Table
                        signatureTable,
                    ],
                },
            ],
        });

        try {
            const blob = await Packer.toBlob(doc);
            const defaultFilename = `Statistics_Graph_${graphMonthLabel.replace(/\s+/g, '_')}`;

            const { value: filename } = await Swal.fire({
                title: 'Enter Filename',
                input: 'text',
                inputLabel: 'Filename',
                inputValue: defaultFilename,
                showCancelButton: true,
                confirmButtonText: 'Download',
                cancelButtonText: 'Cancel',
                inputValidator: (value) => {
                    if (!value) {
                        return 'You need to write a filename!';
                    }
                }
            });

            if (filename) {
                saveAs(blob, `${filename}.docx`);
                Swal.fire({
                    icon: 'success',
                    title: 'Downloaded!',
                    text: 'Your report has been downloaded successfully.',
                    timer: 2000,
                    showConfirmButton: false
                });
            }
        } catch (err) {
            console.error('Failed to generate DOCX:', err);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Something went wrong while generating the document!',
            });
        }
    };

    // Print Graph Report

    const handlePrintGraphReport = () => {
        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Statistics Report - ${graphMonthLabel}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Times New Roman', serif;
                        padding: 20px;
                        background: white;
                        color: #000;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .header {
                        display: flex;
                        justify-content: center;
                        align-items: center;
                    }
                    .header-logo {
                        width: 80px;
                        flex-shrink: 0;
                        display: flex;
                        justify-content: center;
                    }
                    .header-logo img {
                        width: 80px;
                        height: 80px;
                    }
                    .header-text {
                        flex: 1;
                        text-align: center;
                    }
                    .header-text h1 { font-size: 16px; margin: 0; font-weight: bold; }
                    .header-text p { font-size: 11px; margin: 2px 0; }
                    
                    .iso-badge {
                        width: 80px;
                        flex-shrink: 0;
                        border: 1px solid #999;
                        padding: 2px;
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        background: white;
                    }
                    
                    .divider {
                        border: 0;
                        border-top: 3px solid black;
                        margin: 10px 0 20px 0;
                    }

                    .title-section {
                        text-align: center;
                        margin-bottom: 20px;
                    }
                    .title-section h2 { font-size: 16px; margin-bottom: 5px; text-transform: uppercase; }
                    .title-section p { font-size: 14px; margin-bottom: 15px; }

                    .stats-bar {
                        background-color: #DBEAFE;
                        padding: 6px;
                        border: 1px solid #DBEAFE;
                        margin-bottom: 20px;
                        text-align: center;
                    }
                    .stats-bar h3 { margin: 0; font-size: 14px; letter-spacing: 2px; }

                    .chart-container {
                        width: 100%;
                        max-width: 800px;
                        margin: 0 auto 30px auto;
                    }
                    
                    .signatures-row {
                        display: flex;
                        justify-content: space-between;
                        margin-top: 50px;
                    }
                    .signature-box {
                        width: 45%;
                        text-align: center;
                    }
                    .sig-label { margin-bottom: 40px; font-size: 12px; }
                    .sig-name {
                        font-weight: bold;
                        border-top: 1px solid black;
                        display: inline-block;
                        padding-top: 5px;
                        width: 100%;
                        font-size: 12px;
                        text-transform: uppercase;
                    }
                    .sig-title { font-style: italic; font-size: 11px; color: #444; }

                    @page { margin: 0.5in; }
                </style>
            </head>
            <body>
                <div class="header">
                    <div class="header-logo">
                        <img src="${window.location.origin}/pclu-logo.png" alt="PCLU" />
                    </div>
                    <div class="header-text">
                        <h1>POLYTECHNIC COLLEGE OF LA UNION (PCLU), INC.</h1>
                        <p>(Formerly PAMETS COLLEGES)</p>
                        <p>Don Pastor L. Panay Sr. Street, San Nicolas Sur, Agoo, La Union 2504</p>
                        <p>Tel. No. (072) 2061761 Mobile No. 09171623141/09260953781</p>
                        <p>Email: pclucollege@pclu.com.ph</p>
                        <p>https://www.facebook.com/PCLUOfficialpage</p>
                    </div>
                    <div class="iso-badge">
                        <div style="background: #1e3a8a; width: 100%; padding: 4px; display: flex; flex-direction: column; align-items: center;">
                            <div style="display: flex; align-items: center; justify-content: center; width: 100%; border-bottom: 1px solid #ffffff40; padding-bottom: 2px; margin-bottom: 2px;">
                                <span style="font-size: 20px; font-weight: 900; line-height: 1; color: white; font-family: Arial, sans-serif;">ISO</span>
                                <div style="display: flex; flex-direction: column; margin-left: 4px; border-left: 1px solid white; padding-left: 4px;">
                                    <span style="font-size: 8px; font-weight: bold; line-height: 1; color: #22d3ee;">9001</span>
                                    <span style="font-size: 8px; font-weight: bold; line-height: 1; color: #22d3ee;">2015</span>
                                </div>
                            </div>
                            <span style="font-size: 8px; font-weight: 900; color: white; letter-spacing: 1px; font-family: Arial, sans-serif;">CERTIFIED</span>
                        </div>
                    </div>
                </div>
                <hr class="divider" />

                <div class="title-section">
                    <h2>Library Attendance Statistics</h2>
                    <p>FOR THE MONTH OF ${graphMonthLabel.toUpperCase()}</p>
                </div>

                <div class="stats-bar">
                    <h3>STATISTICS</h3>
                </div>

                <div class="chart-container">
                    ${(() => {
                if (graphRef.current) {
                    const svg = graphRef.current.querySelector('svg');
                    if (svg) {
                        const clone = svg.cloneNode(true);
                        clone.setAttribute('width', '100%');
                        clone.setAttribute('height', '400px');
                        clone.style.width = '100%';
                        clone.style.height = '400px';
                        return clone.outerHTML;
                    }
                }
                return '<p>Graph not loaded</p>';
            })()}
                </div>

                <div class="signatures-row">
                    <div class="signature-box">
                        <p class="sig-label">Prepared by:</p>
                        <p class="sig-name">Patricia Nikole C. Masilang</p>
                        <p class="sig-title">College Library Clerk</p>
                    </div>
                    <div class="signature-box">
                        <p class="sig-label">Noted by:</p>
                        <p class="sig-name">Leah E. Camso.RL MLIS</p>
                        <p class="sig-title">Chief Librarian</p>
                    </div>
                </div>
            </body>
            </html>
        `;

        const printFrame = document.createElement('iframe');
        printFrame.style.position = 'absolute';
        printFrame.style.width = '0';
        printFrame.style.height = '0';
        printFrame.style.border = 'none';
        printFrame.style.left = '-9999px';
        printFrame.srcdoc = printContent;
        document.body.appendChild(printFrame);

        printFrame.onload = () => {
            try {
                printFrame.contentWindow.focus();
                printFrame.contentWindow.print();
            } catch (e) {
                console.error('Print error:', e);
            }
            setTimeout(() => {
                if (printFrame.parentNode) {
                    document.body.removeChild(printFrame);
                }
            }, 2000);
        };
    };




    const isToday = selectedDate === new Date().toISOString().split('T')[0];

    const getProfileImage = (user) => {
        if (user?.profile_picture_url) {
            return user.profile_picture_url;
        }
        return `https://ui-avatars.com/api/?name=${encodeURIComponent(user?.name || 'S')}&background=00008B&color=fff&size=100&bold=true`;
    };

    const formatTime = (timestamp) => {
        return new Date(timestamp).toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
            hour12: true
        });
    };

    const filteredLogs = logs.filter(log =>
        log.user?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.user?.student_id?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-6">
            {/* Report Modal */}
            <AnimatePresence>
                {showReportModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm report-no-print">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 report-no-print">
                                <div className="flex items-center gap-3">
                                    <FileText className="text-blue-600" size={24} />
                                    <h2 className="text-xl font-bold text-slate-800">Attendance Report Preview</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleDownloadReportDocx}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                                    >
                                        <Download size={16} />
                                        Save as DOCX
                                    </button>
                                    <button
                                        onClick={handlePrintReport}
                                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-semibold text-sm transition-colors"
                                    >
                                        <Printer size={16} />
                                        Print Report
                                    </button>
                                    <button
                                        onClick={() => setShowReportModal(false)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Report Document */}
                            <div className="overflow-auto flex-1 bg-slate-100 p-6">
                                <div
                                    id="report-document"
                                    className="mx-auto max-w-3xl p-10 shadow-lg"
                                    style={{
                                        fontFamily: 'Times New Roman, serif',
                                        backgroundColor: 'white',
                                        color: 'black'
                                    }}
                                >

                                    {/* Report Header */}
                                    {/* Report Header */}
                                    <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-4">
                                        <div className="w-[100px] h-[100px] flex items-center justify-center">
                                            <img src="/pclu-logo.png" alt="PCLU" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 text-center px-4">
                                            <h1 className="text-[16px] font-bold text-black">POLYTECHNIC COLLEGE OF LA UNION (PCLU), INC.</h1>
                                            <p className="text-[11px] text-black">(Formerly PAMETS COLLEGES)</p>
                                            <p className="text-[11px] text-black">Don Pastor L. Panay Sr. Street, San Nicolas Sur, Agoo, La Union 2504</p>
                                            <p className="text-[11px] text-black">Tel. No. (072) 2061761 Mobile No.09171623141/09260953781</p>
                                            <p className="text-[11px] text-black">Email: pclucollege@pclu.com.ph</p>
                                            <p className="text-[11px] text-black">https://www.facebook.com/PCLUOfficialpage</p>
                                            <p className="text-[11px] text-black mt-1">Member: Philippine Association of Colleges & Universities</p>
                                        </div>
                                        <div className="flex flex-col items-center gap-0.5">
                                            <span className="text-[8px] font-bold text-black leading-none">PLIB 014 ISSUE 1 REV 0 061614</span>
                                            <div className="w-[100px] h-[60px] flex items-center justify-center">
                                                <img src="/iso-logo.png" alt="GCL ISO Certified" className="w-full h-full object-contain" />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div className="bg-blue-100 p-2 text-center mb-4 rounded border border-blue-200">
                                        <h2 className="text-lg font-bold text-blue-900">
                                            MONTHLY STATISTICS
                                        </h2>
                                        <p className="text-sm text-slate-700">
                                            Month: <strong>{reportLogs?.monthLabel?.toUpperCase() || 'N/A'}</strong>
                                        </p>
                                    </div>

                                    {/* Monthly Table */}
                                    {reportLogs?.monthlyData ? (
                                        <div className="overflow-x-auto">
                                            <table className="w-full border-collapse text-xs">
                                                <thead>
                                                    <tr className="bg-slate-200">
                                                        <th rowSpan={2} className="border border-slate-400 px-2 py-1 text-center font-bold w-10 bg-blue-100 text-blue-900">DATE</th>
                                                        <th rowSpan={2} className="border border-slate-400 px-2 py-1 text-center font-bold bg-blue-100 text-blue-900">FACULTY</th>
                                                        <th colSpan={reportLogs.courses.filter(c => c.toUpperCase() !== 'FACULTY').length} className="border border-slate-400 px-2 py-1 text-center font-bold bg-blue-100 text-blue-900">STUDENTS</th>
                                                        <th rowSpan={2} className="border border-slate-400 px-2 py-1 text-center font-bold bg-blue-100 text-blue-900">Grand TOTAL</th>
                                                    </tr>
                                                    <tr className="bg-slate-200">
                                                        {reportLogs.courses.filter(c => c.toUpperCase() !== 'FACULTY').map(c => (
                                                            <th key={c} className="border border-slate-400 px-2 py-1 text-center font-bold text-blue-900">{c}</th>
                                                        ))}
                                                    </tr>
                                                </thead>
                                                <tbody>
                                                    {Array.from({ length: reportLogs.daysInMonth }, (_, i) => i + 1).map(day => {
                                                        const rowData = reportLogs.monthlyData[day] || {};
                                                        const date = new Date(selectedDate);
                                                        const isSunday = new Date(date.getFullYear(), date.getMonth(), day).getDay() === 0;
                                                        const facultyCourse = reportLogs.courses.find(c => c.toUpperCase() === 'FACULTY');
                                                        const studentCourses = reportLogs.courses.filter(c => c.toUpperCase() !== 'FACULTY');

                                                        return (
                                                            <tr key={day} className={isSunday ? 'bg-slate-50' : ''}>
                                                                <td className="border border-slate-300 px-2 py-1 text-center font-bold">{day}</td>
                                                                {isSunday ? (
                                                                    <td colSpan={reportLogs.courses.length + 1} className="border border-slate-300 px-2 py-1 text-center italic text-slate-400">
                                                                        Sunday
                                                                    </td>
                                                                ) : (
                                                                    <>
                                                                        <td className="border border-slate-300 px-2 py-1 text-center">
                                                                            {facultyCourse ? (rowData[facultyCourse] || '') : ''}
                                                                        </td>
                                                                        {studentCourses.map(c => (
                                                                            <td key={c} className="border border-slate-300 px-2 py-1 text-center">
                                                                                {rowData[c] || ''}
                                                                            </td>
                                                                        ))}
                                                                        <td className="border border-slate-300 px-2 py-1 text-center font-bold bg-blue-50">
                                                                            {rowData.total || ''}
                                                                        </td>
                                                                    </>
                                                                )}
                                                            </tr>
                                                        );
                                                    })}
                                                    {/* Grand Total Row */}
                                                    <tr className="bg-blue-100 font-bold text-blue-900">
                                                        <td className="border border-slate-400 px-2 py-1 text-center">TOTAL</td>
                                                        <td className="border border-slate-400 px-2 py-1 text-center">
                                                            {(() => {
                                                                const facultyCourse = reportLogs.courses.find(c => c.toUpperCase() === 'FACULTY');
                                                                return facultyCourse ? Object.values(reportLogs.monthlyData).reduce((sum, day) => sum + (day[facultyCourse] || 0), 0) : 0;
                                                            })()}
                                                        </td>
                                                        {reportLogs.courses.filter(c => c.toUpperCase() !== 'FACULTY').map(c => {
                                                            const total = Object.values(reportLogs.monthlyData).reduce((sum, day) => sum + (day[c] || 0), 0);
                                                            return (
                                                                <td key={c} className="border border-slate-400 px-2 py-1 text-center">{total}</td>
                                                            );
                                                        })}
                                                        <td className="border border-slate-400 px-2 py-1 text-center bg-blue-200">
                                                            {Object.values(reportLogs.monthlyData).reduce((sum, day) => sum + (day.total || 0), 0)}
                                                        </td>
                                                    </tr>
                                                </tbody>
                                            </table>
                                        </div>
                                    ) : (
                                        <div className="text-center py-10 text-slate-500 border border-dashed border-slate-300 rounded-lg">
                                            <p>Loading report data...</p>
                                        </div>
                                    )}

                                    {/* Signature Lines */}
                                    <div className="mt-10 flex justify-between px-8">
                                        <div className="text-center">
                                            <p className="text-sm text-slate-600 mb-10">Prepared by:</p>
                                            <div className="border-t border-slate-400 pt-2 w-48">
                                                <p className="text-sm font-semibold uppercase">Patricia Nikole C. Masilang</p>
                                                <p className="text-xs text-slate-500 italic">College Library Clerk</p>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-slate-600 mb-10">Noted by:</p>
                                            <div className="border-t border-slate-400 pt-2 w-48">
                                                <p className="text-sm font-semibold uppercase">Leah E. Camso.RL MLIS</p>
                                                <p className="text-xs text-slate-500 italic">Chief Librarian</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Graph Report Modal */}
            <AnimatePresence>
                {showGraphModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col"
                        >
                            {/* Modal Header */}
                            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
                                <div className="flex items-center gap-3">
                                    <BarChart3 className="text-amber-600" size={24} />
                                    <h2 className="text-xl font-bold text-slate-800">Monthly Statistics Report</h2>
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={handleDownloadGraphDocx}
                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                                    >
                                        <Download size={16} /> Save as DOCX
                                    </button>
                                    <button
                                        onClick={handlePrintGraphReport}
                                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-semibold text-sm transition-colors"
                                    >
                                        <Printer size={16} /> Print Report
                                    </button>
                                    <button
                                        onClick={() => setShowGraphModal(false)}
                                        className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                    >
                                        <X size={20} className="text-slate-500" />
                                    </button>
                                </div>
                            </div>

                            {/* Graph Preview */}
                            <div className="overflow-auto flex-1 bg-slate-100 p-6">
                                <div className="mx-auto max-w-3xl p-8 shadow-lg bg-white">
                                    {/* Header */}
                                    {/* Header */}
                                    <div className="flex justify-between items-center border-b-2 border-black pb-4 mb-6">
                                        <div className="w-[100px] h-[100px] flex items-center justify-center">
                                            <img src="/pclu-logo.png" alt="PCLU" className="w-full h-full object-contain" />
                                        </div>
                                        <div className="flex-1 text-center px-4">
                                            <h1 className="text-[16px] font-bold text-black">POLYTECHNIC COLLEGE OF LA UNION (PCLU), INC.</h1>
                                            <p className="text-[11px] text-black">(Formerly PAMETS COLLEGES)</p>
                                            <p className="text-[11px] text-black">Don Pastor L. Panay Sr. Street, San Nicolas Sur, Agoo, La Union 2504</p>
                                            <p className="text-[11px] text-black">Tel. No. (072) 2061761 Mobile No.09171623141/09260953781</p>
                                            <p className="text-[11px] text-black">Email: pclucollege@pclu.com.ph</p>
                                            <p className="text-[11px] text-black">https://www.facebook.com/PCLUOfficialpage</p>
                                            <p className="text-[11px] text-black mt-1">Member: Philippine Association of Colleges & Universities</p>
                                        </div>
                                        <div className="isolate flex flex-col items-center justify-center border border-slate-400 bg-white p-0.5 min-w-[100px]">
                                            <div className="bg-blue-900 w-full p-1 flex flex-col items-center">
                                                <div className="flex w-full items-center justify-center border-b border-blue-800 pb-0.5 mb-0.5">
                                                    <span className="text-4xl font-black leading-none text-white">ISO</span>
                                                    <div className="ml-1.5 flex flex-col border-l border-white/50 pl-1.5">
                                                        <span className="text-xs font-bold leading-none text-cyan-400">9001</span>
                                                        <span className="text-xs font-bold leading-none text-cyan-400">2015</span>
                                                    </div>
                                                </div>
                                                <span className="text-[11px] font-black leading-none tracking-widest text-white">CERTIFIED</span>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Title */}
                                    <div className="bg-blue-100 p-2 text-center mb-6 rounded border border-blue-200">
                                        <h2 className="text-lg font-bold text-blue-900">
                                            STATISTICS FOR THE MONTH OF {graphMonthLabel.toUpperCase()}
                                        </h2>
                                    </div>

                                    {/* Chart */}
                                    <div className="bg-slate-50 p-6 rounded-lg mb-8">
                                        <h3 className="text-center font-bold text-slate-700 mb-4 bg-blue-100 py-2">STATISTICS</h3>
                                        {graphData.length > 0 ? (
                                            <div className="h-[350px] w-full" ref={graphRef}>
                                                <ResponsiveContainer width="100%" height={350}>
                                                    <BarChart data={graphData} margin={{ top: 20, right: 30, left: 20, bottom: 80 }}>
                                                        <defs>
                                                            <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="0%" stopColor="#f59e0b" stopOpacity={1} />
                                                                <stop offset="95%" stopColor="#d97706" stopOpacity={1} />
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                                        <XAxis
                                                            dataKey="course"
                                                            angle={0}
                                                            textAnchor="middle"
                                                            height={30}
                                                            fontSize={12}
                                                            stroke="#374151"
                                                            fontWeight="bold"
                                                            interval={0}
                                                        />
                                                        <YAxis stroke="#374151" fontSize={12} />
                                                        <Bar dataKey="total" fill="url(#barGradient)" radius={[6, 6, 0, 0]} barSize={50}>
                                                            <LabelList dataKey="total" position="top" fontSize={14} fontWeight="bold" fill="#374151" />
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        ) : (
                                            <div className="text-center py-10 text-slate-500">
                                                No data available for this month.
                                            </div>
                                        )}

                                    </div>

                                    {/* Signatures */}
                                    <div className="flex justify-between mt-12 px-8">
                                        <div className="text-center">
                                            <p className="text-sm text-slate-600">Prepared by:</p>
                                            <div className="border-t border-slate-400 mt-10 pt-2 w-48">
                                                <p className="text-sm font-semibold uppercase">Patricia Nikole C. Masilang</p>
                                                <p className="text-xs text-slate-500 italic">College Library Clerk</p>
                                            </div>
                                        </div>
                                        <div className="text-center">
                                            <p className="text-sm text-slate-600">Noted by:</p>
                                            <div className="border-t border-slate-400 mt-10 pt-2 w-48">
                                                <p className="text-sm font-semibold uppercase">Leah E. Camso.RL MLIS</p>
                                                <p className="text-xs text-slate-500 italic">Chief Librarian</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Header with Date Navigation */}
            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mb-6">
                <div>
                    <h1 className="text-2xl font-bold text-slate-800 dark:text-white flex items-center gap-3">
                        <ClipboardList className="text-blue-600" size={28} />
                        Attendance Log
                    </h1>
                    <p className="text-slate-500 dark:text-slate-400 text-sm mt-1">
                        Library attendance history and reports
                    </p>
                </div>

                {/* Date Navigation Controls */}
                <div className="flex flex-wrap items-center gap-2">
                    <button
                        onClick={goToPreviousDay}
                        className="p-2 rounded-lg bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
                        title="Previous Day"
                    >
                        <ChevronLeft size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>

                    <input
                        type="date"
                        value={selectedDate}
                        max={new Date().toISOString().split('T')[0]}
                        onChange={(e) => {
                            setSelectedDate(e.target.value);
                            setCurrentPage(1);
                        }}
                        className="px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white font-medium text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                    />

                    <button
                        onClick={goToNextDay}
                        disabled={isToday}
                        className={`p-2 rounded-lg transition-colors ${isToday ? 'bg-slate-50 dark:bg-slate-800 cursor-not-allowed opacity-50' : 'bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600'}`}
                        title="Next Day"
                    >
                        <ChevronRight size={20} className="text-slate-600 dark:text-slate-300" />
                    </button>

                    <button
                        onClick={goToToday}
                        disabled={isToday}
                        className={`px-3 py-2 rounded-lg font-semibold text-sm transition-colors ${isToday ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 cursor-default' : 'bg-blue-600 hover:bg-blue-700 text-white'}`}
                    >
                        Today
                    </button>

                    <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 mx-1" />

                    <button
                        onClick={handleGenerateReport}
                        disabled={loading || generatingReport}
                        className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
                        title="Generate Printable Report"
                    >
                        {generatingReport ? <Loader2 size={16} className="animate-spin" /> : <FileText size={16} />}
                        Generate Report
                    </button>

                    <button
                        onClick={handleGenerateGraphReport}
                        disabled={loading || generatingGraph}
                        className="flex items-center gap-2 px-4 py-2 bg-amber-500 hover:bg-amber-600 disabled:bg-slate-400 disabled:cursor-not-allowed text-white rounded-lg font-semibold text-sm transition-colors"
                        title="Generate Monthly Statistics Graph"
                    >
                        {generatingGraph ? <Loader2 size={16} className="animate-spin" /> : <BarChart3 size={16} />}
                        Print Statistics
                    </button>

                    <button
                        onClick={() => fetchLogsByDate(selectedDate)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
                    >
                        <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
                        Refresh
                    </button>
                </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-lg">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-blue-100 text-sm font-medium uppercase tracking-wide">Total Visitors</p>
                            <p className="text-4xl font-black mt-1">{totalCount}</p>
                        </div>
                        <Users className="text-blue-200" size={48} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Viewing Date</p>
                            <p className="text-xl font-bold text-slate-800 dark:text-white mt-1">{displayDate}</p>
                        </div>
                        <Calendar className="text-slate-400" size={36} />
                    </div>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-2xl p-6 border border-slate-200 dark:border-slate-700 shadow-sm">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-slate-500 text-sm font-medium uppercase tracking-wide">Last Updated</p>
                            <p className="text-lg font-bold text-slate-800 dark:text-white mt-1">
                                {lastRefresh ? formatTime(lastRefresh) : '--'}
                            </p>
                        </div>
                        <Clock className={`text-green-500 ${isToday ? 'animate-pulse' : ''}`} size={36} />
                    </div>
                    {isToday && <p className="text-xs text-green-600 mt-2 font-medium">● Auto-refreshing every 15s</p>}
                </div>
            </div>

            {/* Search */}
            <div className="mb-4">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                    <input
                        type="text"
                        placeholder="Search by name or ID..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                    />
                </div>
            </div>

            {/* Attendance Table */}
            <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="p-12 text-center">
                        <Loader2 className="w-10 h-10 animate-spin text-blue-500 mx-auto mb-3" />
                        <p className="text-slate-500">Loading attendance logs...</p>
                    </div>
                ) : filteredLogs.length === 0 ? (
                    <div className="p-12 text-center">
                        <ClipboardList className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                        <p className="text-slate-500">No attendance records for {displayDate}</p>
                        <p className="text-slate-400 text-sm">Try selecting a different date</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-slate-50 dark:bg-slate-900/50 border-b border-slate-200 dark:border-slate-700">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">ID Number</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Course</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-slate-500 uppercase tracking-wider">Year</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-slate-500 uppercase tracking-wider">Time In</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                                <AnimatePresence>
                                    {filteredLogs.map((log, index) => (
                                        <motion.tr
                                            key={log.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            transition={{ duration: 0.3, delay: index * 0.02 }}
                                            className="hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                        >
                                            <td className="px-6 py-4">
                                                <div className="flex items-center gap-3">
                                                    <img
                                                        src={getProfileImage(log.user)}
                                                        alt={log.user?.name}
                                                        className="w-10 h-10 rounded-full object-cover border-2 border-blue-200"
                                                    />
                                                    <span className="font-semibold text-slate-800 dark:text-white">
                                                        {log.user?.name || 'Unknown'}
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className="font-mono text-sm text-slate-600 dark:text-slate-300 bg-slate-100 dark:bg-slate-700 px-2 py-1 rounded">
                                                    {log.user?.student_id || '--'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {log.user?.course || '--'}
                                            </td>
                                            <td className="px-6 py-4 text-slate-600 dark:text-slate-300">
                                                {log.user?.year_level || '--'}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-full text-sm font-bold">
                                                    <Clock size={14} />
                                                    {formatTime(log.logged_at)}
                                                </span>
                                            </td>
                                        </motion.tr>
                                    ))}
                                </AnimatePresence>
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
            {/* Pagination Controls */}
            {lastPage > 1 && (
                <div className="flex items-center justify-between mt-4 bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Page <span className="font-bold text-slate-800 dark:text-white">{currentPage}</span> of <span className="font-bold text-slate-800 dark:text-white">{lastPage}</span>
                    </p>
                    <div className="flex gap-2">
                        <button
                            onClick={() => fetchLogsByDate(selectedDate, false, currentPage - 1)}
                            disabled={currentPage === 1}
                            className="px-4 py-2 text-sm font-medium text-slate-600 bg-slate-100 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                        >
                            <ChevronLeft size={16} />
                            Previous
                        </button>
                        <button
                            onClick={() => fetchLogsByDate(selectedDate, false, currentPage + 1)}
                            disabled={currentPage === lastPage}
                            className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                        >
                            Next
                            <ChevronRight size={16} />
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
