// ==========================================
// DEVEX DOCUMENT PORTAL
// REPORT MANAGEMENT
// GOOGLE DRIVE + GOOGLE SHEET
// ==========================================


// ------------------------------------------
// GOOGLE APPS SCRIPT WEB APP
// ------------------------------------------

const GOOGLE_UPLOAD_URL =
    "https://script.google.com/macros/s/AKfycbx8T-nq4-k6esfX-k-20MJLjO-85zllZxEazo1QOVtqwYDd6-MCFzIVtNwRZ7Pdji8P/exec";


// ------------------------------------------
// ELEMENTS
// ------------------------------------------

const reportForm =
    document.getElementById("reportForm");

const clearButton =
    document.getElementById("clearButton");

const uploadStatus =
    document.getElementById("uploadStatus");

const reportTableBody =
    document.getElementById("reportTableBody");


// ------------------------------------------
// REPORT DATA
// ------------------------------------------

let reports = [];


// ------------------------------------------
// STORAGE KEY
// ------------------------------------------

const REPORT_STORAGE_KEY =
    "syc_reports";


// ------------------------------------------
// CURRENT USER
// ------------------------------------------

let currentUser =
    localStorage.getItem("username") ||
    localStorage.getItem("currentUser") ||
    "Unknown User";


// ------------------------------------------
// LOAD REPORTS
// ------------------------------------------

async function loadReports() {

    try {

        showStatus(
            "Loading reports...",
            true
        );


        const response =
            await fetch(
                GOOGLE_UPLOAD_URL
            );


        if (!response.ok) {

            throw new Error(
                "Server returned HTTP " +
                response.status
            );

        }


        const result =
            await response.json();


        if (
            result.success &&
            Array.isArray(result.reports)
        ) {

            reports =
                result.reports;

            renderReports(
                reports
            );

            uploadStatus.style.display =
                "none";

        }

        else {

            reports = [];

            renderReports(
                []
            );

            uploadStatus.style.display =
                "none";

        }

    }

    catch (error) {

        console.error(
            "Load reports error:",
            error
        );


        // ----------------------------------
        // FALLBACK TO LOCAL STORAGE
        // ----------------------------------

        const storedReports =
            localStorage.getItem(
                REPORT_STORAGE_KEY
            );


        if (storedReports) {

            try {

                reports =
                    JSON.parse(
                        storedReports
                    );

                renderReports(
                    reports
                );

                showStatus(
                    "Unable to connect to Google Sheet. Showing locally saved reports.",
                    false
                );

            }

            catch (storageError) {

                reports = [];

                renderReports(
                    []
                );

                showStatus(
                    "Unable to load reports.",
                    false
                );

            }

        }

        else {

            reports = [];

            renderReports(
                []
            );

            showStatus(
                "Unable to load reports: " +
                error.message,
                false
            );

        }

    }

}


// ------------------------------------------
// SAVE REPORTS LOCALLY
// ------------------------------------------

function saveReports(
    reportList
) {

    localStorage.setItem(

        REPORT_STORAGE_KEY,

        JSON.stringify(
            reportList
        )

    );

}


// ------------------------------------------
// GENERATE REPORT ID
// ------------------------------------------

function generateReportId() {

    const nextNumber =
        reports.length + 1;


    return "RPT-" +
        String(
            nextNumber
        ).padStart(
            3,
            "0"
        );

}


// ------------------------------------------
// FORMAT DATE
// ------------------------------------------

function formatDate(
    dateString
) {

    if (!dateString) {

        return "";

    }


    const date =
        new Date(
            dateString
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return dateString;

    }


    return date.toLocaleDateString(
        "en-PH",
        {
            year: "numeric",
            month: "short",
            day: "2-digit"
        }
    );

}


// ------------------------------------------
// SHOW STATUS
// ------------------------------------------

function showStatus(
    message,
    success = true
) {

    if (!uploadStatus) {

        return;

    }


    uploadStatus.style.display =
        "block";


    uploadStatus.textContent =
        message;


    uploadStatus.style.background =
        success
            ? "#dcfce7"
            : "#fee2e2";


    uploadStatus.style.color =
        success
            ? "#166534"
            : "#991b1b";

}


// ------------------------------------------
// CONVERT FILE TO BASE64
// ------------------------------------------

function fileToBase64(
    file
) {

    return new Promise(
        function(
            resolve,
            reject
        ) {

            const reader =
                new FileReader();


            reader.onload =
                function() {

                    try {

                        const result =
                            reader.result;


                        const base64 =
                            result.split(
                                ","
                            )[1];


                        if (!base64) {

                            reject(
                                new Error(
                                    "Unable to convert file to Base64."
                                )
                            );

                            return;

                        }


                        resolve(
                            base64
                        );

                    }

                    catch (error) {

                        reject(
                            error
                        );

                    }

                };


            reader.onerror =
                function(error) {

                    reject(
                        error
                    );

                };


            reader.readAsDataURL(
                file
            );

        }
    );

}


// ------------------------------------------
// UPLOAD REPORT TO GOOGLE DRIVE
// AND SAVE TO GOOGLE SHEET
// ------------------------------------------

async function uploadToGoogleDrive(
    file,
    reportData
) {


    // --------------------------------------
    // CONVERT FILE
    // --------------------------------------

    const base64Data =
        await fileToBase64(
            file
        );


    // --------------------------------------
    // PREPARE PAYLOAD
    // --------------------------------------

    const payload = {

        // Report information

        reportNo:
            reportData.reportNo,

        category:
            reportData.category,

        title:
            reportData.title,

        project:
            reportData.project,

        reportingPeriod:
            reportData.reportingPeriod,

        reportDate:
            reportData.reportDate,

        preparedBy:
            reportData.preparedBy,

        department:
            reportData.department,

        remarks:
            reportData.remarks,

        uploadedBy:
            currentUser,

        uploadedDate:
            new Date().toISOString(),


        // File information

        fileName:
            file.name,

        fileData:
            base64Data,

        mimeType:
            file.type ||
            "application/octet-stream"

    };


    console.log(
        "Sending report to Google Apps Script..."
    );


    // --------------------------------------
    // SEND TO GOOGLE APPS SCRIPT
    // --------------------------------------

    const response =
        await fetch(
            GOOGLE_UPLOAD_URL,
            {

                method:
                    "POST",

                headers: {

                    "Content-Type":
                        "text/plain;charset=utf-8"

                },

                body:
                    JSON.stringify(
                        payload
                    )

            }
        );


    // --------------------------------------
    // CHECK HTTP RESPONSE
    // --------------------------------------

    if (!response.ok) {

        throw new Error(
            "Google Apps Script returned HTTP " +
            response.status
        );

    }


    // --------------------------------------
    // READ RESPONSE
    // --------------------------------------

    const result =
        await response.json();


    console.log(
        "Google Apps Script response:",
        result
    );


    // --------------------------------------
    // CHECK APPLICATION RESPONSE
    // --------------------------------------

    if (!result.success) {

        throw new Error(
            result.message ||
            "Google Drive upload failed."
        );

    }


    return result;

}


// ------------------------------------------
// FORM SUBMIT
// ------------------------------------------

if (reportForm) {

    reportForm.addEventListener(
        "submit",
        async function(event) {

            event.preventDefault();


            // --------------------------------
            // FILE INPUT
            // --------------------------------

            const fileInput =
                document.getElementById(
                    "reportFile"
                );


            if (!fileInput) {

                showStatus(
                    "File input element #reportFile was not found.",
                    false
                );

                return;

            }


            const file =
                fileInput.files[0];


            if (!file) {

                showStatus(
                    "Please select a report file.",
                    false
                );

                return;

            }


            // --------------------------------
            // UPLOAD BUTTON
            // --------------------------------

            const uploadButton =
                reportForm.querySelector(
                    ".btn-upload"
                );


            if (uploadButton) {

                uploadButton.disabled =
                    true;

                uploadButton.textContent =
                    "Uploading...";

            }


            try {

                showStatus(
                    "Preparing report for upload..."
                );


                // ----------------------------
                // COLLECT REPORT INFORMATION
                // ----------------------------

                const reportData = {

                    reportNo:
                        document.getElementById(
                            "reportNo"
                        ).value.trim(),

                    category:
                        document.getElementById(
                            "category"
                        ).value.trim(),

                    title:
                        document.getElementById(
                            "title"
                        ).value.trim(),

                    project:
                        document.getElementById(
                            "project"
                        ).value.trim(),

                    reportingPeriod:
                        document.getElementById(
                            "period"
                        ).value.trim(),

                    reportDate:
                        document.getElementById(
                            "reportDate"
                        ).value,

                    preparedBy:
                        document.getElementById(
                            "preparedBy"
                        ).value.trim(),

                    department:
                        document.getElementById(
                            "department"
                        ).value.trim(),

                    remarks:
                        document.getElementById(
                            "remarks"
                        ).value.trim()

                };


                // ----------------------------
                // UPLOAD
                // ----------------------------

                showStatus(
                    "Uploading report to Google Drive..."
                );


                const driveResult =
                    await uploadToGoogleDrive(
                        file,
                        reportData
                    );


                // ----------------------------
                // CREATE LOCAL DISPLAY RECORD
                // ----------------------------

                const report = {

                    id:
                        generateReportId(),

                    reportNo:
                        reportData.reportNo,

                    category:
                        reportData.category,

                    title:
                        reportData.title,

                    project:
                        reportData.project,

                    reportingPeriod:
                        reportData.reportingPeriod,

                    reportDate:
                        reportData.reportDate,

                    preparedBy:
                        reportData.preparedBy,

                    department:
                        reportData.department,

                    remarks:
                        reportData.remarks,

                    fileName:
                        driveResult.fileName,

                    fileId:
                        driveResult.fileId,

                    fileLink:
                        driveResult.fileUrl,

                    fileSize:
                        file.size,

                    fileType:
                        file.type,

                    uploadedBy:
                        currentUser,

                    uploadedDate:
                        new Date().toISOString()

                };


                // ----------------------------
                // ADD TO LOCAL ARRAY
                // ----------------------------

                reports.push(
                    report
                );


                // ----------------------------
                // LOCAL BACKUP
                // ----------------------------

                saveReports(
                    reports
                );


                // ----------------------------
                // REFRESH TABLE
                // ----------------------------

                renderReports(
                    reports
                );


                // ----------------------------
                // SUCCESS
                // ----------------------------

                showStatus(
                    "Report uploaded successfully to Google Drive."
                );


                // ----------------------------
                // CLEAR FORM
                // ----------------------------

                reportForm.reset();

                setTodayDate();

            }

            catch (error) {

                console.error(
                    "Upload error:",
                    error
                );


                showStatus(
                    "Upload failed: " +
                    error.message,
                    false
                );

            }

            finally {

                if (uploadButton) {

                    uploadButton.disabled =
                        false;

                    uploadButton.textContent =
                        "Upload Report";

                }

            }

        }
    );

}


// ------------------------------------------
// CLEAR BUTTON
// ------------------------------------------

if (clearButton) {

    clearButton.addEventListener(
        "click",
        function() {

            reportForm.reset();

            uploadStatus.style.display =
                "none";

            setTodayDate();

        }
    );

}


// ------------------------------------------
// RENDER REPORT TABLE
// ------------------------------------------

function renderReports(
    reportList
) {

    if (!reportTableBody) {

        return;

    }


    reportTableBody.innerHTML =
        "";


    // --------------------------------------
    // NO REPORTS
    // --------------------------------------

    if (
        !reportList ||
        !reportList.length
    ) {

        reportTableBody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    style="
                        text-align:center;
                        color:#6b7280;
                        padding:25px;
                    "
                >

                    No reports uploaded yet.

                </td>

            </tr>

        `;

        return;

    }


    // --------------------------------------
    // NEWEST REPORTS FIRST
    // --------------------------------------

    const sortedReports =
        [...reportList].reverse();


    sortedReports.forEach(
        function(report) {


            const row =
                document.createElement(
                    "tr"
                );


            // --------------------------------
            // FILE LINK
            // --------------------------------

            const fileCell =
                report.fileLink

                    ? `

                        <a
                            class="view-link"
                            href="${escapeHTML(
                                report.fileLink
                            )}"
                            target="_blank"
                            rel="noopener noreferrer"
                        >
                            View File
                        </a>

                    `

                    : `

                        <span
                            style="
                                color:#6b7280;
                            "
                        >
                            No File
                        </span>

                    `;


            // --------------------------------
            // TABLE ROW
            // --------------------------------

            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        report.reportNo
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        report.category
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        report.title
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        report.project
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        report.reportingPeriod ||
                        report.ReportingPeriod ||
                        "-"
                    )}
                </td>

                <td>
                    ${formatDate(
                        report.reportDate ||
                        report.ReportDate
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        report.preparedBy ||
                        report.PreparedBy
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        report.department ||
                        report.Department ||
                        "-"
                    )}
                </td>

                <td>
                    ${formatDate(
                        report.uploadedDate ||
                        report.UploadedDate
                    )}
                </td>

                <td>
                    ${fileCell}
                </td>

            `;


            reportTableBody.appendChild(
                row
            );

        }
    );

}


// ------------------------------------------
// SET TODAY'S DATE
// ------------------------------------------

function setTodayDate() {

    const dateInput =
        document.getElementById(
            "reportDate"
        );


    if (!dateInput) {

        return;

    }


    const today =
        new Date()
            .toISOString()
            .split("T")[0];


    dateInput.value =
        today;

}


// ------------------------------------------
// ESCAPE HTML
// ------------------------------------------

function escapeHTML(
    value
) {

    if (
        value === undefined ||
        value === null
    ) {

        return "";

    }


    return String(value)

        .replace(
            /&/g,
            "&amp;"
        )

        .replace(
            /</g,
            "&lt;"
        )

        .replace(
            />/g,
            "&gt;"
        )

        .replace(
            /"/g,
            "&quot;"
        )

        .replace(
            /'/g,
            "&#039;"
        );

}


// ------------------------------------------
// INITIALIZE
// ------------------------------------------

setTodayDate();

loadReports();

