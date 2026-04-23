import { useState, useEffect } from "react";
import axiosClient from "../axios-client";
import { FileText, Users, DollarSign, Download, Calendar, FileBarChart, TrendingUp, PieChart as PieChartIcon, BarChart3, AlertCircle, ChevronRight, ChevronLeft, GraduationCap, ArrowLeft, Search, X, FileDown, Medal, Award, BookOpen, Star, Activity } from "lucide-react";
import { Document, Packer, Paragraph, Table, TableRow, TableCell, TextRun, ImageRun, WidthType, AlignmentType, BorderStyle, HeadingLevel, PageBreak, VerticalAlign } from "docx";
import { saveAs } from "file-saver";
import Swal from "sweetalert2";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, AreaChart, Area, PieChart, Pie, Cell, LabelList } from "recharts";
import TopStudentsPanel from "./TopStudentsPanel";

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];



export default function Reports() {


    // Date Filter State
    const [dateRange, setDateRange] = useState("30");
    const [customStart, setCustomStart] = useState("");
    const [customEnd, setCustomEnd] = useState("");

    // Report Data State
    const [mostBorrowed, setMostBorrowed] = useState([]);
    const [topStudents, setTopStudents] = useState({ data: [], current_page: 1, last_page: 1, total: 0, per_page: 10 });
    const [studentSummary, setStudentSummary] = useState({ total_active_readers: 0, total_books_circulated: 0, avg_books_per_student: 0, most_popular_category: 'N/A' });
    const [studentPage, setStudentPage] = useState(1);
    const [studentSearch, setStudentSearch] = useState(""); // NEW: Search state
    const [penalties, setPenalties] = useState({ monthly: [], summary: {} });
    const [demographics, setDemographics] = useState({ by_course: [], by_year: [] });
    const [statistics, setStatistics] = useState({ ranges: [], months: [], data: [], academic_year: "" }); // NEW
    const [loading, setLoading] = useState(false);
    const [activeTab, setActiveTab] = useState("books");
    const [selectedStatType, setSelectedStatType] = useState(null); // 'faculty', 'student', or null

    // Financial Tracking State
    const [financialCurrent, setFinancialCurrent] = useState(null);
    const [financialHistory, setFinancialHistory] = useState({ records: [], totals: {} });
    const [financialView, setFinancialView] = useState("current"); // "current" or "history"



    // Calculate date range
    const getDateParams = () => {
        const now = new Date();
        let start, end;

        if (dateRange === "custom") {
            return { start_date: customStart, end_date: customEnd };
        }

        end = now.toISOString().split('T')[0];

        switch (dateRange) {
            case "7":
                start = new Date(now.setDate(now.getDate() - 7)).toISOString().split('T')[0];
                break;
            case "30":
                start = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
                break;
            case "90":
                start = new Date(now.setDate(now.getDate() - 90)).toISOString().split('T')[0];
                break;
            case "365":
                start = new Date(now.setFullYear(now.getFullYear() - 1)).toISOString().split('T')[0];
                break;
            default:
                start = new Date(now.setDate(now.getDate() - 30)).toISOString().split('T')[0];
        }

        return { start_date: start, end_date: new Date().toISOString().split('T')[0] };
    };

    // Fetch top students — all-time leaderboard, independent of date filter
    const fetchTopStudents = (page = 1, search = studentSearch) => {
        const params = { page, per_page: 10, search };
        axiosClient.get("/reports/top-students", { params })
            .then(({ data }) => {
                setTopStudents(data);
                setStudentPage(data.current_page);
                if (data.summary) setStudentSummary(data.summary);
            })
            .catch(err => console.error('Failed to fetch top students:', err));
    };

    // Handle search input
    const handleStudentSearch = (e) => {
        const query = e.target.value;
        setStudentSearch(query);
        fetchTopStudents(1, query);
    };

    // Clear search
    const clearStudentSearch = () => {
        setStudentSearch("");
        fetchTopStudents(1, "");
    };

    // Fetch all reports
    const fetchReports = () => {
        setLoading(true);
        setStudentPage(1);
        const params = getDateParams();

        Promise.all([
            axiosClient.get("/reports/most-borrowed", { params }),
            axiosClient.get("/reports/top-students", { params: { page: 1, per_page: 10 } }),
            axiosClient.get("/reports/penalties", { params }),
            axiosClient.get("/reports/demographics", { params }),
            axiosClient.get("/reports/statistics"),
            axiosClient.get("/reports/financial-current"),
            axiosClient.get("/reports/financial-history"),
        ])
            .then(([booksRes, studentsRes, penaltiesRes, demoRes, statsRes, financialCurrentRes, financialHistoryRes]) => {
                setMostBorrowed(booksRes.data);
                setTopStudents(studentsRes.data);
                if (studentsRes.data.summary) setStudentSummary(studentsRes.data.summary);
                setPenalties(penaltiesRes.data);
                setDemographics(demoRes.data);
                setStatistics(statsRes.data);
                setFinancialCurrent(financialCurrentRes.data);
                setFinancialHistory(financialHistoryRes.data);
                setLoading(false);
            })
            .catch(() => setLoading(false));
    };

    useEffect(() => {
        fetchReports();
    }, [dateRange, customStart, customEnd]);

    // Export CSV
    const exportCsv = (type) => {
        const params = getDateParams();
        const queryString = new URLSearchParams(params).toString();
        const token = localStorage.getItem("ACCESS_TOKEN");

        const link = document.createElement('a');
        const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api';
        link.href = `${baseUrl}/reports/export/${type}?${queryString}`;
        link.setAttribute('download', `report_${type}_${new Date().toISOString().split('T')[0]}.csv`);

        fetch(link.href, {
            headers: { 'Authorization': `Bearer ${token}` }
        })
            .then(res => res.blob())
            .then(blob => {
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `report_${type}_${new Date().toISOString().split('T')[0]}.csv`;
                a.click();
                window.URL.revokeObjectURL(url);
            });
    };

    // Export PDF
    const exportPdf = () => {
        window.print();
    };

    const handlePrintStatistics = (type = 'all') => {
        // Month number to display label mapping
        const monthLabels = {
            6: "JUNE", 7: "JULY", 8: "AUG.", 9: "SEPT.", 10: "OCT.", 11: "NOV.",
            12: "DEC.", 1: "JAN", 2: "FEB.", 3: "MAR.", 4: "APR.", 5: "MAY"
        };

        // Use the actual months from statistics (these are numeric keys from backend)
        const months = statistics.months || [6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5];

        const headerHtml = `
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
        `;

        const signaturesHtml = `
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
        `;

        // Helper function to generate table HTML
        const generateTableHtml = (title, dataKey) => {
            const tableRows = statistics.ranges.map(range => {
                const sourceData = statistics[dataKey];
                const rowTotal = months.reduce((sum, month) => {
                    return sum + (sourceData?.[range]?.[month] || 0);
                }, 0);

                const monthCells = months.map(month => {
                    const value = sourceData?.[range]?.[month] || 0;
                    return `<td class="num-col">${value > 0 ? value : ''}</td>`;
                }).join('');

                return `<tr>
                    <td class="range-col">${range}</td>
                    ${monthCells}
                    <td class="num-col total-col">${rowTotal > 0 ? rowTotal : ''}</td>
                </tr>`;
            }).join('');

            const monthTotals = months.map(month => {
                const total = statistics.ranges.reduce((sum, range) => {
                    return sum + (statistics[dataKey]?.[range]?.[month] || 0);
                }, 0);
                return `<td class="num-col">${total > 0 ? total : ''}</td>`;
            }).join('');

            const grandTotal = statistics.ranges.reduce((total, range) => {
                return total + statistics.months.reduce((sum, month) => {
                    return sum + (statistics[dataKey]?.[range]?.[month] || 0);
                }, 0);
            }, 0);

            return `
                <div class="title-section">
                    <h2>${title.toUpperCase()}</h2>
                    <p>FOR THE MONTH OF ${monthLabels[months[0]] || 'JUNE'} - ${monthLabels[months[months.length - 1]] || 'MAY'} ${statistics.academic_year || 'A.Y. 2025-2026'}</p>
                </div>

                <div class="stats-bar">
                    <h3>STATISTICS</h3>
                </div>

                <table>
                    <thead>
                        <tr>
                            <th rowspan="2" class="range-col"></th>
                            <th colspan="12" style="text-align: center;">MONTH</th>
                            <th rowspan="2" class="num-col"></th>
                        </tr>
                        <tr>
                            ${months.map(m => `<th class="num-col month-header">${monthLabels[m]}</th>`).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${tableRows}
                        <tr style="background: #DBEAFE; font-weight: bold;">
                            <td class="range-col">TOTAL</td>
                            ${monthTotals}
                            <td class="num-col total-col">${grandTotal > 0 ? grandTotal : ''}</td>
                        </tr>
                    </tbody>
                </table>
            `;
        };

        let bodyContent = "";
        const facultyTable = generateTableHtml("Statistics of Borrowed Books by Faculty", "faculty_data");
        const studentTable = generateTableHtml("Statistics of Borrowed Books by Students", "student_data");

        if (type === 'faculty') {
            bodyContent = `${headerHtml}${facultyTable}${signaturesHtml}`;
        } else if (type === 'student') {
            bodyContent = `${headerHtml}${studentTable}${signaturesHtml}`;
        } else {
            // Print All
            bodyContent = `
                ${headerHtml}
                ${facultyTable}
                ${signaturesHtml}
                <div style="page-break-before: always; height: 30px;"></div>
                ${headerHtml}
                ${studentTable}
                ${signaturesHtml}
            `;
        }

        const printContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <meta charset="UTF-8">
                <title>Statistics of Borrowed Books - ${statistics.academic_year || 'A.Y. 2025-2026'}</title>
                <style>
                    * { margin: 0; padding: 0; box-sizing: border-box; }
                    body {
                        font-family: 'Times New Roman', serif;
                        padding: 20px;
                        background: white;
                        color: #000;
                        font-size: 11px;
                        display: flex;
                        flex-direction: column;
                        -webkit-print-color-adjust: exact;
                        print-color-adjust: exact;
                    }
                    .header {
                        display: flex;
                        justify-content: space-between;
                        align-items: center;
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
                    .header-text p { font-size: 11px; margin: 2px 0; color: #000; }
                    
                    .iso-badge {
                        min-width: 80px;
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
                        margin-bottom: 15px;
                        text-align: center;
                    }
                    .stats-bar h3 { margin: 0; font-size: 14px; letter-spacing: 2px; }

                    table {
                        width: 100%;
                        border-collapse: collapse;
                        margin-bottom: 30px;
                    }
                    th, td {
                        border: 1px solid #000;
                        padding: 4px;
                        text-align: center;
                        font-size: 10px;
                    }
                    th {
                        background: #DBEAFE;
                        font-weight: bold;
                        vertical-align: middle;
                    }
                    .range-col { 
                        width: 80px; 
                        font-weight: bold; 
                        text-align: left;
                        padding-left: 6px;
                    }
                    .num-col { width: 45px; }
                    .total-col { background: #DBEAFE; font-weight: bold; }
                    .month-header { font-size: 10px; }
                    
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

                    @page { size: portrait; margin: 0.5in; }
                </style>
            </head>
            <body>
                ${bodyContent}
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

    // Download as DOCX
    const handleDownloadDocx = async (type = 'all') => {
        const monthLabels = {
            6: "JUNE", 7: "JULY", 8: "AUG.", 9: "SEPT.", 10: "OCT.", 11: "NOV.",
            12: "DEC.", 1: "JAN", 2: "FEB.", 3: "MAR.", 4: "APR.", 5: "MAY"
        };
        const months = statistics.months || [6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5];

        const BORDER_STYLE = {
            top: { style: BorderStyle.SINGLE, size: 1, color: "333333" },
            bottom: { style: BorderStyle.SINGLE, size: 1, color: "333333" },
            left: { style: BorderStyle.SINGLE, size: 1, color: "333333" },
            right: { style: BorderStyle.SINGLE, size: 1, color: "333333" },
        };

        // Fetch logo image once for reuse
        let logoImageData = null;
        try {
            const logoResponse = await fetch(`${window.location.origin}/pclu-logo.png`);
            if (logoResponse.ok) {
                const logoBlob = await logoResponse.blob();
                logoImageData = await logoBlob.arrayBuffer();
            }
        } catch (e) {
            console.warn('Could not load logo for DOCX:', e);
        }

        const NO_BORDER = {
            top: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            bottom: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            left: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            right: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideVertical: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
            insideHorizontal: { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
        };

        const buildHeaderParagraphs = () => {
            // Left cell: PCLU Logo (80x80 in print)
            const logoCell = new TableCell({
                width: { size: 1000, type: WidthType.DXA },
                borders: NO_BORDER,
                verticalAlign: VerticalAlign.CENTER,
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: logoImageData
                            ? [new ImageRun({ data: logoImageData, transformation: { width: 65, height: 65 }, type: "png" })]
                            : [new TextRun({ text: "PCLU", bold: true, size: 20, font: "Times New Roman" })],
                    }),
                ],
            });

            // Center cell: Institution text (matching print: h1=14px, p=10px)
            const centerCell = new TableCell({
                borders: NO_BORDER,
                verticalAlign: VerticalAlign.CENTER,
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 20 },
                        children: [new TextRun({ text: "POLYTECHNIC COLLEGE OF LA UNION (PCLU), INC.", bold: true, size: 24, font: "Times New Roman" })],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 10 },
                        children: [new TextRun({ text: "(Formerly PAMETS COLLEGES)", size: 18, font: "Times New Roman" })],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 10 },
                        children: [new TextRun({ text: "Don Pastor L. Panay Sr. Street, San Nicolas Sur, Agoo, La Union 2504", size: 18, font: "Times New Roman" })],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 10 },
                        children: [new TextRun({ text: "Tel. No. (072) 2061761 Mobile No.09171623141/09260953781", size: 18, font: "Times New Roman" })],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        spacing: { after: 10 },
                        children: [new TextRun({ text: "Email: pclucollege@pclu.com.ph", size: 18, font: "Times New Roman" })],
                    }),
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: [new TextRun({ text: "https://www.facebook.com/PCLUOfficialpage", size: 18, font: "Times New Roman" })],
                    }),
                ],
            });

            // Right cell: ISO 9001:2015 Badge (rendered as image to match print)
            const generateIsoBadge = () => {
                const canvas = document.createElement('canvas');
                const scale = 2;
                const w = 80 * scale;
                const h = 80 * scale;
                canvas.width = w;
                canvas.height = h;
                const ctx = canvas.getContext('2d');

                // Outer border
                ctx.strokeStyle = '#999999';
                ctx.lineWidth = 1 * scale;
                ctx.strokeRect(1, 1, w - 2, h - 2);

                // Inner blue background
                const pad = 3 * scale;
                ctx.fillStyle = '#1e3a8a';
                ctx.fillRect(pad, pad, w - pad * 2, h - pad * 2);

                ctx.textBaseline = 'middle';

                // Measure text for centering
                ctx.font = `900 ${24 * scale}px Arial`;
                const isoWidth = ctx.measureText('ISO').width;
                ctx.font = `bold ${10 * scale}px Arial`;
                const numWidth = ctx.measureText('9001').width;
                const totalWidth = isoWidth + 4 * scale + numWidth;
                const startX = (w - totalWidth) / 2;
                const row1Y = h * 0.30;

                // "ISO" in white
                ctx.fillStyle = '#ffffff';
                ctx.font = `900 ${24 * scale}px Arial`;
                ctx.textAlign = 'left';
                ctx.fillText('ISO', startX, row1Y);

                // Vertical divider
                const divX = startX + isoWidth + 2 * scale;
                ctx.strokeStyle = '#ffffff';
                ctx.lineWidth = 1 * scale;
                ctx.beginPath();
                ctx.moveTo(divX, row1Y - 12 * scale);
                ctx.lineTo(divX, row1Y + 12 * scale);
                ctx.stroke();

                // "9001" and "2015" in cyan
                ctx.fillStyle = '#22d3ee';
                ctx.font = `bold ${10 * scale}px Arial`;
                ctx.textAlign = 'left';
                ctx.fillText('9001', divX + 3 * scale, row1Y - 5 * scale);
                ctx.fillText('2015', divX + 3 * scale, row1Y + 8 * scale);

                // Horizontal divider
                ctx.strokeStyle = '#ffffff40';
                ctx.lineWidth = 0.5 * scale;
                ctx.beginPath();
                ctx.moveTo(pad + 4 * scale, row1Y + 16 * scale);
                ctx.lineTo(w - pad - 4 * scale, row1Y + 16 * scale);
                ctx.stroke();

                // "CERTIFIED" in white
                ctx.fillStyle = '#ffffff';
                ctx.font = `900 ${9 * scale}px Arial`;
                ctx.textAlign = 'center';
                ctx.fillText('CERTIFIED', w / 2, h * 0.75);

                return canvas.toDataURL('image/png');
            };

            let isoBadgeData = null;
            try {
                const badgeDataUrl = generateIsoBadge();
                const badgeBase64 = badgeDataUrl.split(',')[1];
                const badgeBinary = atob(badgeBase64);
                const badgeArray = new Uint8Array(badgeBinary.length);
                for (let i = 0; i < badgeBinary.length; i++) {
                    badgeArray[i] = badgeBinary.charCodeAt(i);
                }
                isoBadgeData = badgeArray.buffer;
            } catch (e) {
                console.warn('Could not generate ISO badge image:', e);
            }

            const isoCell = new TableCell({
                width: { size: 1000, type: WidthType.DXA },
                borders: NO_BORDER,
                verticalAlign: VerticalAlign.CENTER,
                children: [
                    new Paragraph({
                        alignment: AlignmentType.CENTER,
                        children: isoBadgeData
                            ? [new ImageRun({ data: isoBadgeData, transformation: { width: 65, height: 65 }, type: "png" })]
                            : [new TextRun({ text: "ISO 9001:2015 CERTIFIED", bold: true, size: 16, font: "Arial" })],
                    }),
                ],
            });

            const headerTable = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: NO_BORDER,
                rows: [
                    new TableRow({
                        children: [logoCell, centerCell, isoCell],
                    }),
                ],
            });

            // Bottom border line matching print: border-bottom: 3px solid #000
            const borderLine = new Paragraph({
                spacing: { before: 100, after: 300 },
                border: {
                    bottom: { style: BorderStyle.SINGLE, size: 24, color: "000000" },
                },
                children: [],
            });

            return [headerTable, borderLine];
        };

        const buildTable = (title, dataKey) => {
            const sourceData = statistics[dataKey];
            const ranges = statistics.ranges || [];

            // Title paragraphs (print: h2=14px bold, p=12px)
            const titleParagraphs = [
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { before: 200, after: 100 },
                    children: [new TextRun({ text: title.toUpperCase(), bold: true, size: 26, font: "Times New Roman" })],
                }),
                new Paragraph({
                    alignment: AlignmentType.CENTER,
                    spacing: { after: 300 },
                    children: [new TextRun({ text: `FOR THE MONTH OF JUNE - MAY ${statistics.academic_year || "A.Y. 2025-2026"}`, size: 22, font: "Times New Roman" })],
                }),
                // Blue Statistics Bar
                new Table({
                    width: { size: 100, type: WidthType.PERCENTAGE },
                    borders: NO_BORDER,
                    rows: [
                        new TableRow({
                            children: [
                                new TableCell({
                                    shading: { fill: "DBEAFE" },
                                    children: [
                                        new Paragraph({
                                            alignment: AlignmentType.CENTER,
                                            children: [new TextRun({ text: "STATISTICS", bold: true, size: 22, font: "Times New Roman", color: "000000" })],
                                        }),
                                    ],
                                }),
                            ],
                        }),
                    ],
                }),
                new Paragraph({ spacing: { before: 200 }, children: [] }),
            ];

            // Header row 1: empty range-col | MONTH (colspan 12) | TOTAL
            const headerRow1 = new TableRow({
                children: [
                    new TableCell({
                        rowSpan: 2,
                        width: { size: 1100, type: WidthType.DXA },
                        borders: BORDER_STYLE,
                        shading: { fill: "f0f0f0" },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "", size: 20, font: "Times New Roman" })] })],
                    }),
                    new TableCell({
                        columnSpan: 12,
                        borders: BORDER_STYLE,
                        shading: { fill: "f0f0f0" },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "MONTH", bold: true, size: 22, font: "Times New Roman" })] })],
                    }),
                    new TableCell({
                        rowSpan: 2,
                        width: { size: 700, type: WidthType.DXA },
                        borders: BORDER_STYLE,
                        shading: { fill: "f0f0f0" },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: "TOTAL", bold: true, size: 20, font: "Times New Roman" })] })],
                    }),
                ],
            });

            // Header row 2 - month names (print: font-size 10px = size 20)
            const headerRow2 = new TableRow({
                children: [
                    ...months.map(m => new TableCell({
                        borders: BORDER_STYLE,
                        shading: { fill: "f0f0f0" },
                        width: { size: 600, type: WidthType.DXA },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: monthLabels[m], bold: true, size: 18, font: "Times New Roman" })] })],
                    })),
                ],
            });

            // Data rows (print: 11px=size 22, range-col left-aligned bold, num-col centered)
            const dataRows = ranges.map(range => {
                const rowTotal = months.reduce((sum, month) => sum + (sourceData?.[range]?.[month] || 0), 0);
                return new TableRow({
                    children: [
                        // Range column: left-aligned, bold (matches print .range-col)
                        new TableCell({
                            borders: BORDER_STYLE,
                            verticalAlign: VerticalAlign.CENTER,
                            children: [new Paragraph({
                                indent: { left: 80 },
                                children: [new TextRun({ text: range, bold: true, size: 22, font: "Times New Roman" })],
                            })],
                        }),
                        // Month data cells: centered (matches print .num-col)
                        ...months.map(month => {
                            const value = sourceData?.[range]?.[month] || 0;
                            return new TableCell({
                                borders: BORDER_STYLE,
                                verticalAlign: VerticalAlign.CENTER,
                                children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: value > 0 ? String(value) : "", size: 22, font: "Times New Roman" })] })],
                            });
                        }),
                        // Total column: bold (matches print .total-col — no special shading in print)
                        new TableCell({
                            borders: BORDER_STYLE,
                            verticalAlign: VerticalAlign.CENTER,
                            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: rowTotal > 0 ? String(rowTotal) : "", bold: true, size: 22, font: "Times New Roman" })] })],
                        }),
                    ],
                });
            });

            // Grand total row (matches print .grand-total: bold, background #f0f0f0)
            const grandTotal = ranges.reduce((gt, range) => gt + months.reduce((sum, month) => sum + (sourceData?.[range]?.[month] || 0), 0), 0);
            const grandTotalRow = new TableRow({
                children: [
                    // TOTAL label: left-aligned bold
                    new TableCell({
                        borders: BORDER_STYLE,
                        shading: { fill: "f0f0f0" },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({
                            indent: { left: 80 },
                            children: [new TextRun({ text: "TOTAL", bold: true, size: 22, font: "Times New Roman" })],
                        })],
                    }),
                    // Monthly totals
                    ...months.map(month => {
                        const colTotal = ranges.reduce((sum, range) => sum + (sourceData?.[range]?.[month] || 0), 0);
                        return new TableCell({
                            borders: BORDER_STYLE,
                            shading: { fill: "f0f0f0" },
                            verticalAlign: VerticalAlign.CENTER,
                            children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ text: colTotal > 0 ? String(colTotal) : "", bold: true, size: 22, font: "Times New Roman" })] })],
                        });
                    }),
                    // Grand total value
                    new TableCell({
                        borders: BORDER_STYLE,
                        shading: { fill: "f0f0f0" },
                        verticalAlign: VerticalAlign.CENTER,
                        children: [new Paragraph({
                            alignment: AlignmentType.CENTER,
                            children: [new TextRun({
                                text: grandTotal > 0 ? String(grandTotal) : "",
                                bold: true, size: 22, font: "Times New Roman",
                            })],
                        })],
                    }),
                ],
            });

            const table = new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                rows: [headerRow1, headerRow2, ...dataRows, grandTotalRow],
            });

            return [...titleParagraphs, table];
        };

        // Signatures matching print layout: left-aligned with indent
        const buildSignatures = () => [
            new Paragraph({ spacing: { before: 800 }, children: [] }),
            new Table({
                width: { size: 100, type: WidthType.PERCENTAGE },
                borders: NO_BORDER,
                rows: [
                    new TableRow({
                        children: [
                            new TableCell({
                                width: { size: 40, type: WidthType.PERCENTAGE },
                                borders: NO_BORDER,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [new TextRun({ text: "Prepared by:", size: 22, font: "Times New Roman" })],
                                    }),
                                    new Paragraph({ spacing: { before: 600 }, children: [] }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        border: { top: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
                                        children: [new TextRun({ text: "PATRICIA NIKOLE C. MASILANG", bold: true, size: 22, font: "Times New Roman" })],
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [new TextRun({ text: "College Library Clerk", italics: true, size: 20, font: "Times New Roman" })],
                                    }),
                                ],
                            }),
                            new TableCell({ width: { size: 20, type: WidthType.PERCENTAGE }, borders: NO_BORDER, children: [] }),
                            new TableCell({
                                width: { size: 40, type: WidthType.PERCENTAGE },
                                borders: NO_BORDER,
                                children: [
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [new TextRun({ text: "Noted by:", size: 22, font: "Times New Roman" })],
                                    }),
                                    new Paragraph({ spacing: { before: 600 }, children: [] }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        border: { top: { style: BorderStyle.SINGLE, size: 6, color: "000000" } },
                                        children: [new TextRun({ text: "LEAH E. CAMSO.RL MLIS", bold: true, size: 22, font: "Times New Roman" })],
                                    }),
                                    new Paragraph({
                                        alignment: AlignmentType.CENTER,
                                        children: [new TextRun({ text: "Chief Librarian", italics: true, size: 20, font: "Times New Roman" })],
                                    }),
                                ],
                            }),
                        ],
                    }),
                ],
            }),
        ];

        try {
            let sections = [];

            if (type === 'faculty' || type === 'all') {
                sections.push({
                    children: [
                        ...buildHeaderParagraphs(),
                        ...buildTable("Statistics of Borrowed Books by Faculty", "faculty_data"),
                        ...buildSignatures(),
                    ],
                });
            }

            if (type === 'student' || type === 'all') {
                sections.push({
                    children: [
                        ...buildHeaderParagraphs(),
                        ...buildTable("Statistics of Borrowed Books by Students", "student_data"),
                        ...buildSignatures(),
                    ],
                });
            }

            const doc = new Document({
                sections: sections.map(s => ({
                    ...s,
                    properties: {
                        page: {
                            size: {
                                width: 11906, // A4 width in twips (210mm)
                                height: 16838, // A4 height in twips (297mm)
                            },
                            margin: {
                                top: 1440, // 1 inch (2.54cm) in twips
                                right: 1440,
                                bottom: 1440,
                                left: 1440,
                            },
                        },
                    },
                })),
            });

            const blob = await Packer.toBlob(doc);
            const label = type === 'faculty' ? 'Faculty' : type === 'student' ? 'Students' : 'All';
            const defaultFilename = `Borrowed_Books_Statistics_${label}_${new Date().toISOString().split('T')[0]}`;

            // Show filename confirmation modal
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
            console.error('DOCX generation error:', err);
            Swal.fire({
                icon: 'error',
                title: 'Oops...',
                text: 'Something went wrong while generating the document!',
            });
        }
    };

    // Custom Tooltip for Charts

    const CustomTooltip = ({ active, payload, label }) => {
        if (active && payload && payload.length) {
            return (
                <div className="bg-white dark:bg-slate-800 p-4 border border-gray-100 dark:border-slate-700 shadow-xl rounded-xl">
                    <p className="font-bold text-gray-800 dark:text-white mb-2">{label || payload[0].name}</p>
                    {payload.map((entry, index) => (
                        <p key={index} className="text-sm font-medium" style={{ color: entry.color || entry.fill }}>
                            {entry.name}: {entry.value}
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <div className="space-y-8 bg-gray-50 dark:bg-slate-900 p-8 min-h-screen print:bg-white print:m-0 print:p-0 transition-colors duration-300">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 print:hidden">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-gradient-to-br from-indigo-600 to-indigo-800 rounded-2xl shadow-lg shadow-indigo-900/20">
                        <FileBarChart size={28} className="text-white" />
                    </div>
                    <div>
                        <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-slate-400">
                            Analytics & Reports
                        </h2>
                        <p className="text-gray-500 dark:text-slate-400 font-medium">Deep insights into library performance</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-wrap items-center gap-3 bg-white dark:bg-slate-800 p-1.5 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex items-center gap-2 px-3 py-2 bg-gray-50 dark:bg-slate-700/50 rounded-xl">
                        <Calendar size={18} className="text-indigo-600 dark:text-indigo-400" />
                        <select
                            value={dateRange}
                            onChange={e => setDateRange(e.target.value)}
                            className="bg-transparent border-none text-sm font-semibold text-gray-700 dark:text-white focus:ring-0 cursor-pointer outline-none"
                        >
                            <option value="7">Last 7 Days</option>
                            <option value="30">Last 30 Days</option>
                            <option value="90">Last 90 Days</option>
                            <option value="365">This Year</option>
                            <option value="custom">Custom Range</option>
                        </select>
                    </div>

                    {dateRange === "custom" && (
                        <div className="flex items-center gap-2 px-2 animate-in fade-in slide-in-from-right-4 duration-300">
                            <input
                                type="date"
                                value={customStart}
                                onChange={e => setCustomStart(e.target.value)}
                                className="border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                            <span className="text-gray-400 text-xs">to</span>
                            <input
                                type="date"
                                value={customEnd}
                                onChange={e => setCustomEnd(e.target.value)}
                                className="border border-gray-200 dark:border-slate-600 rounded-lg px-2 py-1.5 text-xs bg-transparent dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none"
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* Print Header */}
            <div className="hidden print:block mb-8 pb-4 border-b border-gray-200">
                <h1 className="text-3xl font-bold text-gray-900">Library Analytics Report</h1>
                <div className="flex justify-between mt-2 text-gray-600">
                    <p>Generated by: System Administrator</p>
                    <p>Date: {new Date().toLocaleDateString()}</p>
                </div>
            </div>

            {/* Tab Navigation */}
            <div className="flex gap-2 print:hidden overflow-x-auto pb-2 no-scrollbar">
                {[
                    { id: "books", label: "Borrowing Trends", icon: TrendingUp },
                    { id: "students", label: "Top Students", icon: Users },
                    { id: "demographics", label: "Demographics", icon: PieChartIcon }, // NEW
                    { id: "penalties", label: "Financial Report", icon: DollarSign }
                ].map(tab => {
                    const Icon = tab.icon;
                    return (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all duration-300 min-w-fit
                                ${activeTab === tab.id
                                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 shadow-xl scale-105"
                                    : "bg-white dark:bg-slate-800 text-gray-500 dark:text-slate-400 hover:bg-gray-50 dark:hover:bg-slate-700 hover:text-gray-900 dark:hover:text-white"
                                }`}
                        >
                            <Icon size={18} /> {tab.label}
                        </button>
                    );
                })}
            </div>

            {loading ? (
                <div className="grid place-items-center h-96 bg-white dark:bg-slate-800 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                    <div className="flex flex-col items-center gap-4">
                        <div className="relative w-16 h-16">
                            <div className="absolute inset-0 border-4 border-gray-100 dark:border-slate-700 rounded-full"></div>
                            <div className="absolute inset-0 border-4 border-t-indigo-500 rounded-full animate-spin"></div>
                        </div>
                        <p className="text-gray-400 font-medium animate-pulse">Crunching numbers...</p>
                    </div>
                </div>
            ) : (
                <div className="animate-in fade-in slide-in-from-bottom-8 duration-500 space-y-8">


                    {/* Borrowed Books Statistics (Replaces Popularity) */}
                    {activeTab === "books" && (
                        <div className="space-y-6">
                            {/* Header for Detail View */}
                            {selectedStatType && (
                                <div className="flex items-center gap-4 mb-4">
                                    <button
                                        onClick={() => setSelectedStatType(null)}
                                        className="p-3 rounded-xl bg-white dark:bg-slate-800 border-2 border-gray-200 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition shadow-sm"
                                    >
                                        <ArrowLeft size={24} className="text-gray-600 dark:text-slate-300" />
                                    </button>
                                    <div>
                                        <h2 className="text-2xl font-bold text-gray-800 dark:text-white">
                                            {selectedStatType === "faculty" ? "Faculty Borrowing Statistics" : "Student Borrowing Statistics"}
                                        </h2>
                                        <p className="text-gray-500 dark:text-slate-400 text-sm">
                                            {statistics.academic_year || "A.Y. 2025-2026"}
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* GRID VIEW */}
                            {!selectedStatType && (
                                <div className="space-y-6">
                                    <div className="flex justify-between items-center bg-white dark:bg-slate-800 p-6 rounded-3xl shadow-sm border border-gray-100 dark:border-slate-700">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-white">Borrowing Overview</h3>
                                            <p className="text-sm text-gray-500 dark:text-slate-400">Monthly breakdown of borrowed books</p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePrintStatistics('all')}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-gray-900 hover:bg-gray-800 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-gray-900/20"
                                            >
                                                <Download size={18} />
                                                Print All Reports
                                            </button>
                                            <button
                                                onClick={() => handleDownloadDocx('all')}
                                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20"
                                            >
                                                <FileDown size={18} />
                                                Save as DOCX
                                            </button>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Faculty Card */}
                                        <button
                                            onClick={() => setSelectedStatType("faculty")}
                                            className="group relative overflow-hidden rounded-3xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-purple-50 dark:bg-slate-800 border-2 border-purple-200 dark:border-slate-700"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-purple-500 to-purple-600 opacity-10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500" />

                                            <div className="relative z-10">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="p-4 rounded-xl bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg">
                                                        <Users size={32} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-purple-700 dark:text-white">Faculty</h3>
                                                        <p className="text-sm text-purple-600/80 dark:text-purple-300">Borrowing Trends</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <p className="text-4xl font-bold text-gray-800 dark:text-white">
                                                        {statistics.ranges && statistics.ranges.reduce((grandTotal, range) => grandTotal + statistics.months.reduce((sum, month) => sum + (statistics.faculty_data?.[range]?.[month] || 0), 0), 0)}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-slate-400">Total Books Borrowed</p>
                                                </div>
                                            </div>

                                            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight size={28} className="text-purple-500" />
                                            </div>
                                        </button>

                                        {/* Student Card */}
                                        <button
                                            onClick={() => setSelectedStatType("student")}
                                            className="group relative overflow-hidden rounded-3xl p-8 text-left transition-all duration-300 hover:scale-105 hover:shadow-2xl bg-blue-50 dark:bg-slate-800 border-2 border-blue-200 dark:border-slate-700"
                                        >
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-blue-500 to-blue-600 opacity-10 rounded-full -translate-y-10 translate-x-10 group-hover:scale-150 transition-transform duration-500" />

                                            <div className="relative z-10">
                                                <div className="flex items-center gap-4 mb-6">
                                                    <div className="p-4 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg">
                                                        <GraduationCap size={32} className="text-white" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-xl font-bold text-blue-700 dark:text-white">Students</h3>
                                                        <p className="text-sm text-blue-600/80 dark:text-blue-300">Borrowing Trends</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <p className="text-4xl font-bold text-gray-800 dark:text-white">
                                                        {statistics.ranges && statistics.ranges.reduce((grandTotal, range) => grandTotal + statistics.months.reduce((sum, month) => sum + (statistics.student_data?.[range]?.[month] || 0), 0), 0)}
                                                    </p>
                                                    <p className="text-sm text-gray-500 dark:text-slate-400">Total Books Borrowed</p>
                                                </div>
                                            </div>

                                            <div className="absolute bottom-6 right-6 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ChevronRight size={28} className="text-blue-500" />
                                            </div>
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* DETAIL VIEW: FACULTY TABLE */}
                            {selectedStatType === "faculty" && (
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300">
                                    <div className="p-8 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                                Monthly Statistics
                                            </h3>
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                                                Faculty Transactions
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePrintStatistics("faculty")}
                                                className="print:hidden flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-indigo-500/20"
                                            >
                                                <Download size={16} />
                                                Print Report
                                            </button>
                                            <button
                                                onClick={() => handleDownloadDocx('faculty')}
                                                className="print:hidden flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20"
                                            >
                                                <FileDown size={16} />
                                                Save as DOCX
                                            </button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto p-2">
                                        <table className="w-full text-center border-collapse border border-gray-300 dark:border-slate-600">
                                            <thead>
                                                <tr className="bg-gray-100 dark:bg-slate-700">
                                                    <th className="border border-gray-300 dark:border-slate-600 p-2 min-w-[100px] bg-gray-200 dark:bg-slate-800"></th>
                                                    <th colSpan={12} className="border border-gray-300 dark:border-slate-600 p-2 font-bold text-gray-700 dark:text-white uppercase">MONTH</th>
                                                    <th className="border border-gray-300 dark:border-slate-600 p-2 min-w-[60px] bg-gray-200 dark:bg-slate-800"></th>
                                                </tr>
                                                <tr className="bg-gray-50 dark:bg-slate-700/50 text-xs font-bold uppercase">
                                                    <th className="border border-gray-300 dark:border-slate-600 p-2 text-left">Category / Range</th>
                                                    {["JUNE", "JULY", "AUG.", "SEPT.", "OCT.", "NOV.", "DEC.", "JAN", "FEB.", "MAR.", "APR.", "MAY"].map(month => (
                                                        <th key={month} className="border border-gray-300 dark:border-slate-600 p-2">{month}</th>
                                                    ))}
                                                    <th className="border border-gray-300 dark:border-slate-600 p-2 bg-yellow-50 dark:bg-yellow-900/10">TOTAL</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {statistics.ranges && statistics.ranges.map((range) => {
                                                    const rowTotal = statistics.months.reduce((sum, month) => {
                                                        return sum + (statistics.faculty_data?.[range]?.[month] || 0);
                                                    }, 0);
                                                    return (
                                                        <tr key={range} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                            <td className="border border-gray-300 dark:border-slate-600 p-2 font-bold text-left bg-gray-50 dark:bg-slate-800">{range}</td>
                                                            {statistics.months.map(month => (
                                                                <td key={month} className="border border-gray-300 dark:border-slate-600 p-2">
                                                                    {(statistics.faculty_data?.[range]?.[month] || 0) > 0 ? (
                                                                        <span className="font-semibold text-gray-800 dark:text-white">{statistics.faculty_data[range][month]}</span>
                                                                    ) : <span className="text-gray-300 dark:text-slate-600">-</span>}
                                                                </td>
                                                            ))}
                                                            <td className="border border-gray-300 dark:border-slate-600 p-2 font-bold bg-yellow-50 dark:bg-yellow-900/10">{rowTotal > 0 ? rowTotal : "-"}</td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr className="bg-gray-100 dark:bg-slate-700 font-bold">
                                                    <td className="border border-gray-300 dark:border-slate-600 p-3 text-left">TOTAL</td>
                                                    {statistics.months && statistics.months.map(month => {
                                                        const colTotal = statistics.ranges.reduce((sum, range) => sum + (statistics.faculty_data?.[range]?.[month] || 0), 0);
                                                        return <td key={month} className="border border-gray-300 dark:border-slate-600 p-2">{colTotal > 0 ? colTotal : ""}</td>;
                                                    })}
                                                    <td className="border border-gray-300 dark:border-slate-600 p-2 bg-yellow-100 dark:bg-yellow-900/20">
                                                        {statistics.ranges && statistics.ranges.reduce((grandTotal, range) => grandTotal + statistics.months.reduce((sum, month) => sum + (statistics.faculty_data?.[range]?.[month] || 0), 0), 0)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}

                            {/* DETAIL VIEW: STUDENTS TABLE */}
                            {selectedStatType === "student" && (
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden animate-in fade-in slide-in-from-right-8 duration-300">
                                    <div className="p-8 border-b border-gray-100 dark:border-slate-700 flex justify-between items-center">
                                        <div>
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                                                Monthly Statistics
                                            </h3>
                                            <p className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                                                Student Transactions
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => handlePrintStatistics("student")}
                                                className="print:hidden flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-500/20"
                                            >
                                                <Download size={16} />
                                                Print Report
                                            </button>
                                            <button
                                                onClick={() => handleDownloadDocx('student')}
                                                className="print:hidden flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-semibold text-sm transition-all shadow-lg shadow-emerald-600/20"
                                            >
                                                <FileDown size={16} />
                                                Save as DOCX
                                            </button>
                                        </div>
                                    </div>

                                    <div className="overflow-x-auto p-2">
                                        <table className="w-full text-center border-collapse border border-gray-300 dark:border-slate-600">
                                            <thead>
                                                <tr className="bg-gray-100 dark:bg-slate-700">
                                                    <th className="border border-gray-300 dark:border-slate-600 p-2 min-w-[100px] bg-gray-200 dark:bg-slate-800"></th>
                                                    <th colSpan={12} className="border border-gray-300 dark:border-slate-600 p-2 font-bold text-gray-700 dark:text-white uppercase">MONTH</th>
                                                    <th className="border border-gray-300 dark:border-slate-600 p-2 min-w-[60px] bg-gray-200 dark:bg-slate-800"></th>
                                                </tr>
                                                <tr className="bg-gray-50 dark:bg-slate-700/50 text-xs font-bold uppercase">
                                                    <th className="border border-gray-300 dark:border-slate-600 p-2 text-left">Category / Range</th>
                                                    {["JUNE", "JULY", "AUG.", "SEPT.", "OCT.", "NOV.", "DEC.", "JAN", "FEB.", "MAR.", "APR.", "MAY"].map(month => (
                                                        <th key={month} className="border border-gray-300 dark:border-slate-600 p-2">{month}</th>
                                                    ))}
                                                    <th className="border border-gray-300 dark:border-slate-600 p-2 bg-yellow-50 dark:bg-yellow-900/10">TOTAL</th>
                                                </tr>
                                            </thead>
                                            <tbody className="text-sm">
                                                {statistics.ranges && statistics.ranges.map((range) => {
                                                    const rowTotal = statistics.months.reduce((sum, month) => {
                                                        return sum + (statistics.student_data?.[range]?.[month] || 0);
                                                    }, 0);
                                                    return (
                                                        <tr key={range} className="hover:bg-slate-50 dark:hover:bg-slate-800/50">
                                                            <td className="border border-gray-300 dark:border-slate-600 p-2 font-bold text-left bg-gray-50 dark:bg-slate-800">{range}</td>
                                                            {statistics.months.map(month => (
                                                                <td key={month} className="border border-gray-300 dark:border-slate-600 p-2">
                                                                    {(statistics.student_data?.[range]?.[month] || 0) > 0 ? (
                                                                        <span className="font-semibold text-gray-800 dark:text-white">{statistics.student_data[range][month]}</span>
                                                                    ) : <span className="text-gray-300 dark:text-slate-600">-</span>}
                                                                </td>
                                                            ))}
                                                            <td className="border border-gray-300 dark:border-slate-600 p-2 font-bold bg-yellow-50 dark:bg-yellow-900/10">{rowTotal > 0 ? rowTotal : "-"}</td>
                                                        </tr>
                                                    );
                                                })}
                                                <tr className="bg-gray-100 dark:bg-slate-700 font-bold">
                                                    <td className="border border-gray-300 dark:border-slate-600 p-3 text-left">TOTAL</td>
                                                    {statistics.months && statistics.months.map(month => {
                                                        const colTotal = statistics.ranges.reduce((sum, range) => sum + (statistics.student_data?.[range]?.[month] || 0), 0);
                                                        return <td key={month} className="border border-gray-300 dark:border-slate-600 p-2">{colTotal > 0 ? colTotal : ""}</td>;
                                                    })}
                                                    <td className="border border-gray-300 dark:border-slate-600 p-2 bg-yellow-100 dark:bg-yellow-900/20">
                                                        {statistics.ranges && statistics.ranges.reduce((grandTotal, range) => grandTotal + statistics.months.reduce((sum, month) => sum + (statistics.student_data?.[range]?.[month] || 0), 0), 0)}
                                                    </td>
                                                </tr>
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Top Students Section */}
                    {activeTab === "students" && (
                        <TopStudentsPanel
                            topStudents={topStudents}
                            studentSummary={studentSummary}
                            studentSearch={studentSearch}
                            studentPage={studentPage}
                            onSearch={handleStudentSearch}
                            onClearSearch={clearStudentSearch}
                            onPageChange={(p) => fetchTopStudents(p)}
                            onExportCsv={() => exportCsv("students")}
                        />
                    )}



                    {/* Demographics Section */}
                    {activeTab === "demographics" && (
                        <div className="space-y-6">


                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                {/* Course Distribution Chart */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
                                        <PieChartIcon className="text-purple-500" size={24} /> Borrowers by Course
                                    </h3>
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height={350}>
                                            <PieChart>
                                                <Pie
                                                    data={demographics.by_course}
                                                    cx="50%"
                                                    cy="50%"
                                                    labelLine={false}
                                                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                                                    outerRadius={120}
                                                    fill="#8884d8"
                                                    dataKey="total"
                                                    nameKey="course"
                                                >
                                                    {demographics.by_course.map((entry, index) => (
                                                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                    ))}
                                                </Pie>
                                                <RechartsTooltip content={<CustomTooltip />} />
                                                <Legend />
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>

                                {/* Year Level Distribution Chart */}
                                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
                                    <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2 mb-6">
                                        <BarChart3 className="text-pink-500" size={24} /> Borrowers by Year Level
                                    </h3>
                                    <div className="h-[350px] w-full">
                                        <ResponsiveContainer width="100%" height={350}>
                                            <BarChart data={demographics.by_year} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                                <XAxis dataKey="year_level" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                <RechartsTooltip content={<CustomTooltip />} cursor={{ fill: '#f1f5f9', opacity: 0.4 }} />
                                                <Bar dataKey="total" name="Students" fill="#ec4899" radius={[4, 4, 0, 0]} barSize={50} />
                                            </BarChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Financial Report Section */}
                    {activeTab === "penalties" && (
                        <div className="space-y-6">
                            {/* View Toggle */}
                            <div className="flex gap-2 bg-white dark:bg-slate-800 p-2 rounded-xl w-fit border border-gray-100 dark:border-slate-700">
                                <button
                                    onClick={() => setFinancialView("current")}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${financialView === "current"
                                        ? "bg-gradient-to-r from-emerald-500 to-emerald-600 text-white shadow-lg"
                                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    Current Month
                                </button>
                                <button
                                    onClick={() => setFinancialView("history")}
                                    className={`px-4 py-2 rounded-lg text-sm font-bold transition-all ${financialView === "history"
                                        ? "bg-gradient-to-r from-purple-500 to-indigo-600 text-white shadow-lg"
                                        : "text-gray-500 hover:bg-gray-100 dark:hover:bg-slate-700"
                                        }`}
                                >
                                    Financial History
                                </button>
                            </div>

                            {/* Current Month View */}
                            {financialView === "current" && financialCurrent && (
                                <>
                                    {/* Month Header */}
                                    <div className="bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl p-6 text-white">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-emerald-100 text-sm font-medium uppercase tracking-wider">Current Period</p>
                                                <h2 className="text-3xl font-bold mt-1">{financialCurrent.month_name} {financialCurrent.year}</h2>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-emerald-100 text-xs uppercase">Real-time Data</p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <span className="w-2 h-2 bg-green-300 rounded-full animate-pulse"></span>
                                                    <span className="text-sm">Live</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Current Month Cards */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden group">
                                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                                <DollarSign size={80} />
                                            </div>
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Total Fines</p>
                                            <h3 className="text-3xl font-bold text-gray-800 dark:text-white">₱{financialCurrent.total_fines?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}</h3>
                                        </div>
                                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg relative overflow-hidden text-white">
                                            <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-1">Collected</p>
                                            <h3 className="text-3xl font-bold">₱{financialCurrent.total_collected?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}</h3>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Pending Payment</p>
                                            <h3 className="text-3xl font-bold text-amber-500">₱{financialCurrent.total_pending?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}</h3>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700 relative overflow-hidden">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Late Returns</p>
                                            <h3 className="text-3xl font-bold text-red-500">{financialCurrent.late_returns || 0}</h3>
                                        </div>
                                    </div>

                                    {/* Revenue Chart */}
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 p-8">
                                        <div className="flex justify-between items-center mb-8">
                                            <div>
                                                <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                                    <TrendingUp className="text-emerald-500" size={24} /> Revenue Trend (All Time)
                                                </h3>
                                                <p className="text-gray-400 text-sm mt-1">Monthly fine collection analysis</p>
                                            </div>
                                            <div className="flex gap-2">
                                                <button onClick={() => exportCsv("penalties")} className="p-2 hover:bg-gray-100 dark:hover:bg-slate-700 rounded-lg text-gray-500">
                                                    <Download size={20} />
                                                </button>
                                            </div>
                                        </div>

                                        <div className="h-[400px] w-full">
                                            <ResponsiveContainer width="100%" height={400}>
                                                <BarChart data={penalties.monthly} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" opacity={0.5} />
                                                    <XAxis dataKey="month" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                                                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value}`} />
                                                    <RechartsTooltip cursor={{ fill: '#f1f5f9', opacity: 0.4 }} content={<CustomTooltip />} />
                                                    <Legend />
                                                    <Bar dataKey="collected" name="Collected Revenue" fill="#10b981" radius={[4, 4, 0, 0]} barSize={40}>
                                                        <LabelList dataKey="collected" position="top" formatter={(value) => value > 0 ? `₱${value}` : ''} fontSize={12} fill="#059669" fontWeight="bold" />
                                                    </Bar>
                                                    <Bar dataKey="pending" name="Pending Fines" fill="#f59e0b" radius={[4, 4, 0, 0]} barSize={40}>
                                                        <LabelList dataKey="pending" position="top" formatter={(value) => value > 0 ? `₱${value}` : ''} fontSize={12} fill="#d97706" fontWeight="bold" />
                                                    </Bar>
                                                </BarChart>
                                            </ResponsiveContainer>
                                        </div>
                                    </div>
                                </>
                            )}

                            {/* Financial History View */}
                            {financialView === "history" && (
                                <>
                                    {/* History Header */}
                                    <div className="bg-gradient-to-r from-purple-600 to-indigo-600 rounded-2xl p-6 text-white">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-purple-100 text-sm font-medium uppercase tracking-wider">Financial History</p>
                                                <h2 className="text-3xl font-bold mt-1">Monthly Breakdown</h2>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-purple-100 text-xs uppercase">Total Records</p>
                                                <p className="text-2xl font-bold">{financialHistory.records?.length || 0}</p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Grand Totals */}
                                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">All-Time Fines</p>
                                            <h3 className="text-3xl font-bold text-gray-800 dark:text-white">₱{financialHistory.totals?.total_fines?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}</h3>
                                        </div>
                                        <div className="bg-gradient-to-br from-emerald-500 to-emerald-700 p-6 rounded-2xl shadow-lg text-white">
                                            <p className="text-xs font-bold text-emerald-100 uppercase tracking-widest mb-1">All-Time Collected</p>
                                            <h3 className="text-3xl font-bold">₱{financialHistory.totals?.total_collected?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}</h3>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">All-Time Pending</p>
                                            <h3 className="text-3xl font-bold text-amber-500">₱{financialHistory.totals?.total_pending?.toLocaleString(undefined, { minimumFractionDigits: 2 }) || "0.00"}</h3>
                                        </div>
                                        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-slate-700">
                                            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">All-Time Late Returns</p>
                                            <h3 className="text-3xl font-bold text-red-500">{financialHistory.totals?.total_late_returns || 0}</h3>
                                        </div>
                                    </div>

                                    {/* Monthly Records Table */}
                                    <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-gray-100 dark:border-slate-700 overflow-hidden">
                                        <div className="p-6 border-b border-gray-100 dark:border-slate-700">
                                            <h3 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                                                <Calendar className="text-purple-500" size={24} /> Monthly Records
                                            </h3>
                                            <p className="text-gray-400 text-sm mt-1">Track your financial performance month by month</p>
                                        </div>

                                        <div className="overflow-x-auto">
                                            <table className="w-full">
                                                <thead>
                                                    <tr className="bg-gray-50 dark:bg-slate-900/50">
                                                        <th className="text-left p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Period</th>
                                                        <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Total Fines</th>
                                                        <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Collected</th>
                                                        <th className="text-right p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Pending</th>
                                                        <th className="text-center p-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Late Returns</th>
                                                    </tr>
                                                </thead>
                                                <tbody className="divide-y divide-gray-100 dark:divide-slate-700">
                                                    {financialHistory.records?.map((record, index) => (
                                                        <tr key={record.id || index} className="hover:bg-gray-50 dark:hover:bg-slate-700/50 transition-colors">
                                                            <td className="p-4">
                                                                <div className="flex items-center gap-3">
                                                                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center text-white font-bold text-sm">
                                                                        {record.month_name?.substring(0, 3)}
                                                                    </div>
                                                                    <div>
                                                                        <p className="font-bold text-gray-800 dark:text-white">{record.period}</p>
                                                                        <p className="text-xs text-gray-400">{record.is_finalized ? "Finalized" : "Active"}</p>
                                                                    </div>
                                                                </div>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <span className="font-bold text-gray-800 dark:text-white">₱{record.total_fines?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <span className="font-bold text-emerald-600">₱{record.total_collected?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                            </td>
                                                            <td className="p-4 text-right">
                                                                <span className="font-bold text-amber-500">₱{record.total_pending?.toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                                                            </td>
                                                            <td className="p-4 text-center">
                                                                {record.late_returns > 0 ? (
                                                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400">
                                                                        {record.late_returns}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-400">-</span>
                                                                )}
                                                            </td>
                                                        </tr>
                                                    ))}
                                                    {(!financialHistory.records || financialHistory.records.length === 0) && (
                                                        <tr>
                                                            <td colSpan={5} className="p-8 text-center text-gray-400">
                                                                <AlertCircle size={48} className="mx-auto mb-4 opacity-50" />
                                                                <p>No financial records found</p>
                                                            </td>
                                                        </tr>
                                                    )}
                                                </tbody>
                                            </table>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
}
