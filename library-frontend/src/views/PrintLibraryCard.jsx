import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';

export default function PrintLibraryCard() {
    const [student, setStudent] = useState(null);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        const data = localStorage.getItem('print_student_data');
        if (data) {
            setStudent(JSON.parse(data));
            setReady(true);

        }
    }, []);

    if (!student) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100vh', fontFamily: 'sans-serif', backgroundColor: '#f1f5f9' }}>
                <p>Loading Card Data...</p>
            </div>
        );
    }

    return (
        <>
            {/* Helmet for title */}
            <title>Library Card - {student.name}</title>

            {/* Styles for print and screen */}
            <style dangerouslySetInnerHTML={{
                __html: `
                .print-card-page * { margin: 0; padding: 0; box-sizing: border-box; }
                .print-card-page { 
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; 
                    background: #e2e8f0;
                    min-height: 100vh;
                }
                @media print {
                    @page { 
                        size: A4 portrait; 
                        margin: 10mm; 
                    }
                    body, .print-card-page { 
                        background: white !important;
                        -webkit-print-color-adjust: exact !important;
                        print-color-adjust: exact !important;
                    }
                    .no-print { display: none !important; }
                    .card { 
                        box-shadow: none !important; 
                        border: 1px solid #999 !important;
                        margin-bottom: 10mm !important;
                    }
                }
                .card {
                    width: 323px;
                    height: 204px;
                    background: white;
                    border-radius: 4px;
                    overflow: hidden;
                    margin: 0 auto 20px auto;
                    border: 1px solid #000;
                    position: relative;
                }
                .header-front {
                    width: 100%;
                    background: white;
                    display: flex;
                    align-items: center;
                    justify-content: space-between;
                }
                .header-back {
                    width: 100%;
                    height: 30px;
                    background: #00008B;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }
                .gold-bar {
                    width: 100%;
                    height: 10px;
                    background: #FCD34D;
                }
                .content {
                    flex: 1;
                    display: flex;
                    padding: 8px 10px;
                    gap: 10px;
                    background: #f8fafc;
                    height: 140px;
                }
                .content-back {
                    padding: 8px 12px;
                    background: white;
                    height: 164px;
                    display: flex;
                    flex-direction: column;
                }
                .photo-box {
                    width: 80px;
                    height: 100px;
                    border: 2px solid #00008B;
                    border-radius: 4px;
                    overflow: hidden;
                    flex-shrink: 0;
                }
                .photo-box img {
                    width: 100%;
                    height: 100%;
                    object-fit: cover;
                }
                .details {
                    flex: 1;
                    display: flex;
                    flex-direction: column;
                    justify-content: space-between;
                }
                .label {
                    font-size: 7px;
                    font-weight: bold;
                    color: #64748b;
                    text-transform: uppercase;
                    letter-spacing: 0.5px;
                    margin-bottom: 1px;
                }
                .value {
                    font-size: 10px;
                    font-weight: bold;
                    color: #00008B;
                }
                .value-large {
                    font-size: 12px;
                    font-weight: 800;
                    color: #00008B;
                    text-transform: uppercase;
                }
                .sig-line {
                    border-bottom: 1px solid #94a3b8;
                    width: 90px;
                    height: 14px;
                    margin-top: 6px;
                }
            ` }} />

            <div className="print-card-page">
                {/* Controls - Screen Only */}
                <div className="no-print" style={{ padding: '30px', textAlign: 'center', background: '#e2e8f0' }}>
                    <h1 style={{ fontSize: '22px', fontWeight: 'bold', color: '#1e293b', marginBottom: '6px' }}>Library Card Preview</h1>
                    <p style={{ fontSize: '13px', color: '#64748b', marginBottom: '16px' }}>
                        Both cards are shown below. The print dialog will open automatically.
                    </p>
                    <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                        <button onClick={() => window.print()} style={{ padding: '10px 20px', backgroundColor: '#00008B', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                            🖨️ Print Cards
                        </button>
                        <button onClick={() => window.close()} style={{ padding: '10px 20px', backgroundColor: 'white', color: '#334155', border: '1px solid #cbd5e1', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                            Close
                        </button>
                    </div>
                </div>

                {/* PRINTABLE AREA - Both cards stacked vertically */}
                <div style={{ padding: '20px', background: '#e2e8f0' }} className="print-area">

                    {/* CARD FRONT */}
                    <div className="card">
                        <div className="header-front" style={{ backgroundColor: 'white', height: '60px', padding: '5px 10px', alignItems: 'flex-start', borderBottom: '1px solid #ccc' }}>
                            {/* Left Logo (PCLU) */}
                            <div style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                                <img src="/pclu-logo.png" alt="PCLU Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} onError={(e) => e.target.style.display = 'none'} />
                            </div>

                            {/* Center Text */}
                            <div style={{ flex: 1, textAlign: 'center', padding: '0 5px' }}>
                                <h1 style={{ fontSize: '9px', fontWeight: 'bold', color: '#000', margin: 0, fontFamily: 'Times New Roman, serif', textTransform: 'uppercase', lineHeight: '1.1' }}>POLYTECHNIC COLLEGE OF LA UNION</h1>
                                <h2 style={{ fontSize: '7px', fontWeight: 'bold', color: '#000', margin: '0 0 2px 0', fontFamily: 'Arial, sans-serif' }}>(Formerly PAMETS COLLEGES)</h2>
                                <p style={{ fontSize: '5px', color: '#000', margin: 0, lineHeight: '1.1', fontFamily: 'Arial, sans-serif' }}>
                                    Don Pastor L. Panay St. South, San Nicolas Sur, Agoo, La Union 2504
                                </p>
                                <p style={{ fontSize: '5px', color: '#000', margin: 0, lineHeight: '1.1', fontFamily: 'Arial, sans-serif' }}>
                                    Reg. No. (072) 607-0101 Mobile No. 09176847581 Email: pclu_launion@yahoo.com.ph
                                </p>
                                <p style={{ fontSize: '5px', color: '#000', margin: 0, lineHeight: '1.1', fontFamily: 'Arial, sans-serif' }}>
                                    Member: Philippine Association of Colleges & Universities
                                </p>
                            </div>

                            {/* Right Logo (ISO/GCL) */}
                            <div style={{ width: '40px', height: '40px', flexShrink: 0 }}>
                                <img
                                    src="/iso-logo.png"
                                    alt="ISO Logo"
                                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                                    onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.nextSibling.style.display = 'flex';
                                    }}
                                />
                                <div style={{ width: '100%', height: '100%', border: '1px solid #ccc', display: 'none', alignItems: 'center', justifyContent: 'center', fontSize: '5px', textAlign: 'center', color: '#000' }}>
                                    GCL<br />LOGO
                                </div>
                            </div>
                        </div>

                        {/* Restored Body Design as requested */}
                        <div className="content">
                            <div className="photo-box">
                                <img
                                    src={
                                        student.profile_picture_url
                                            ? student.profile_picture_url
                                            : `https://ui-avatars.com/api/?name=${encodeURIComponent(student.name)}&background=00008B&color=fff&size=200&bold=true`
                                    }
                                    alt="Student"
                                />
                            </div>
                            <div className="details">
                                {/* Student Name */}
                                <div>
                                    <div className="label">STUDENT NAME</div>
                                    <div className="value-large">{student.name || 'N/A'}</div>
                                </div>
                                {/* ID Number and Course/Year Row */}
                                <div style={{ display: 'flex', gap: '15px', marginTop: '4px' }}>
                                    {/* ID Number */}
                                    <div>
                                        <div className="label">ID NUMBER</div>
                                        <div className="value">{student.student_id || 'N/A'}</div>
                                    </div>
                                    {/* Course / Year */}
                                    <div>
                                        <div className="label">COURSE / YEAR</div>
                                        <div className="value">{student.course || 'N/A'} - {student.year_level || 'N/A'}</div>
                                    </div>
                                </div>
                                {/* Student Signature */}
                                <div style={{ marginTop: 'auto' }}>
                                    <div className="label">STUDENT SIGNATURE</div>
                                    <div className="sig-line"></div>
                                </div>
                            </div>
                            {/* QR CODE for Attendance */}
                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '4px', flexShrink: 0 }}>
                                <div style={{ background: 'white', padding: '4px', borderRadius: '4px', border: '1px solid #000' }}>
                                    {student.student_id ? (
                                        <QRCodeSVG
                                            value={student.student_id}
                                            size={70}
                                            level="M"
                                            bgColor="#ffffff"
                                            fgColor="#000000"
                                        />
                                    ) : (
                                        <div style={{ width: 70, height: 70, background: '#f5f5f5', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px' }}>No ID</div>
                                    )}
                                </div>
                                <div style={{ fontSize: '5px', color: '#64748b', marginTop: '2px', fontWeight: 'bold', textTransform: 'uppercase' }}>Scan for Attendance</div>
                            </div>
                        </div>
                    </div>

                    {/* GAP between cards for print */}
                    <div style={{ height: '20px' }}></div>

                    {/* CARD BACK */}
                    <div className="card back-card" style={{ position: 'relative' }}>
                        <div style={{ padding: '10px 15px 5px 15px', height: '100%', display: 'flex', flexDirection: 'column' }}>

                            {/* Header */}
                            <div style={{ textAlign: 'center', marginBottom: '6px' }}>
                                <h2 style={{ fontSize: '14px', fontWeight: '900', letterSpacing: '3px', fontFamily: 'Times New Roman, serif', color: '#000', textTransform: 'uppercase' }}>IMPORTANT</h2>
                            </div>

                            {/* Rules List */}
                            <div style={{ fontSize: '7.5px', fontFamily: 'Arial, sans-serif', lineHeight: '1.2', color: '#000' }}>
                                <div style={{ display: 'flex', marginBottom: '3px' }}>
                                    <span style={{ marginRight: '4px' }}>1.</span>
                                    <span>The owner of this card should be a bona-fide student of Polytechnic College of La Union.</span>
                                </div>
                                <div style={{ display: 'flex', marginBottom: '3px' }}>
                                    <span style={{ marginRight: '4px' }}>2.</span>
                                    <span>This card entitles the holder to all library privileges and is subject to the rules and regulations of the library.</span>
                                </div>
                                <div style={{ display: 'flex', marginBottom: '3px' }}>
                                    <span style={{ marginRight: '4px' }}>3.</span>
                                    <span>This card is for the exclusive use of the owner and non-transferable.</span>
                                </div>
                                <div style={{ display: 'flex' }}>
                                    <span style={{ marginRight: '4px' }}>4.</span>
                                    <span>In case of loss of this card, please notify the librarian and apply for replacement.</span>
                                </div>
                            </div>

                            {/* Validation Section */}
                            <div style={{ marginTop: '5px', marginBottom: '5px' }}>
                                <div style={{ fontSize: '8.5px', fontWeight: '900', fontFamily: 'Arial, sans-serif', textTransform: 'uppercase', marginBottom: '1px', color: '#000' }}>VALIDATION</div>
                                <div style={{ display: 'flex', border: '1px solid black', height: '18px' }}>
                                    <div style={{ flex: 1, borderRight: '1px solid black', position: 'relative' }}>
                                        <span style={{ position: 'absolute', bottom: '-10px', width: '100%', textAlign: 'center', fontSize: '7.5px', fontFamily: 'Arial, sans-serif' }}>1st</span>
                                    </div>
                                    <div style={{ flex: 1, borderRight: '1px solid black', position: 'relative' }}>
                                        <span style={{ position: 'absolute', bottom: '-10px', width: '100%', textAlign: 'center', fontSize: '7.5px', fontFamily: 'Arial, sans-serif' }}>2nd</span>
                                    </div>
                                    <div style={{ flex: 1, position: 'relative' }}>
                                        <span style={{ position: 'absolute', bottom: '-10px', width: '100%', textAlign: 'center', fontSize: '7.5px', fontFamily: 'Arial, sans-serif' }}>Summer</span>
                                    </div>
                                </div>
                            </div>

                            {/* Signatory */}
                            <div style={{ textAlign: 'center', marginTop: 'auto', position: 'relative', paddingBottom: '0px' }}>
                                <div style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', color: '#000', marginTop: '5px' }}>LEAH E. CAMSO, RL, MLIS</div>
                                <div style={{ fontSize: '10px', fontWeight: 'bold', fontFamily: 'Arial, sans-serif', color: '#000' }}>Chief Librarian</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
