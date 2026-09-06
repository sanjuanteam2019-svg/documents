"use strict";


// ============================================================
// DEVEX DOCUMENT PORTAL
// PROJECT DOCUMENT REGISTER
// GOOGLE APPS SCRIPT + GOOGLE SHEETS + GOOGLE DRIVE
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

// Use the plain deployed Google Apps Script Web App URL.
// Do not place HTML anchor tags inside this value.
const GOOGLE_DOCUMENT_API =
    "https://script.google.com/macros/s/AKfycbwjZ_jsSXJlGmwAG68LxIOtKm0KAurN_jy89Z_3Ris0-2ujDtBbC-Zxvtr3wvlDtohTSA/exec";


// Maximum original file size before Base64 conversion.
// Increase carefully because Base64 makes files larger.
const MAX_UPLOAD_SIZE_MB = 50;


// Date display format.
const DATE_LOCALE = "en-PH";


// ============================================================
// DATA
// ============================================================

// Contains all documents belonging to the currently selected
// project.
let documents = [];


// Chart.js chart instance.
let statusChart = null;


// Prevents an older loading request from replacing a newer one.
let loadSequence = 0;


// ============================================================
// PROJECT INFORMATION
// ============================================================

const params =
    new URLSearchParams(
        window.location.search
    );


const project =
    String(
        params.get("project") || ""
    ).trim();


// Project identifiers must match the identifiers stored in the
// Project column of the Documents sheet.
const projectNames = {

    "22-storey-multipurpose-building":
        "Multipurpose Building",

    "government-center":
        "Government Center",

    "school-cluster3":
        "School Cluster 3"

};


// ============================================================
// PAGE ELEMENTS
// ============================================================

const projectTitle =
    document.getElementById(
        "projectTitle"
    );


const tableBody =
    document.getElementById(
        "tableBody"
    );


const recordCount =
    document.getElementById(
        "recordCount"
    );


// Filter elements
const searchBox =
    document.getElementById(
        "searchBox"
    );


const statusFilter =
    document.getElementById(
        "statusFilter"
    );


const categoryFilter =
    document.getElementById(
        "categoryFilter"
    );


const tradeFilter =
    document.getElementById(
        "tradeFilter"
    );


const sortFilter =
    document.getElementById(
        "sortFilter"
    );


// Upload elements
const openUploadBtn =
    document.getElementById(
        "openUploadBtn"
    );


const closeUploadBtn =
    document.getElementById(
        "closeUploadBtn"
    );


const cancelUploadBtn =
    document.getElementById(
        "cancelUploadBtn"
    );


const uploadModal =
    document.getElementById(
        "uploadModal"
    );


const uploadForm =
    document.getElementById(
        "uploadForm"
    );


const uploadFile =
    document.getElementById(
        "uploadFile"
    );


const uploadFileInfo =
    document.getElementById(
        "uploadFileInfo"
    );


const uploadMessage =
    document.getElementById(
        "uploadMessage"
    );


const submitUploadBtn =
    document.getElementById(
        "submitUploadBtn"
    );


const uploadProject =
    document.getElementById(
        "uploadProject"
    );


// ============================================================
// CHECK SELECTED PROJECT
// ============================================================

function validateSelectedProject() {

    if (project) {
        return true;
    }


    alert(
        "No project selected."
    );


    window.location.replace(
        "projects.html"
    );


    return false;

}


// ============================================================
// PROJECT TITLE
// ============================================================

function initializeProjectTitle() {

    if (!projectTitle) {
        return;
    }


    projectTitle.textContent =
        "📄 " +
        getProjectDisplayName(
            project
        );

}


// ============================================================
// PROJECT DISPLAY NAME
// ============================================================

function getProjectDisplayName(
    projectId
) {

    const cleanProjectId =
        safeText(projectId);


    return (
        projectNames[
            cleanProjectId
        ] ||
        cleanProjectId
    );

}


// ============================================================
// BUILD API URL
// ============================================================

function buildApiUrl(parameters) {

    if (
        !GOOGLE_DOCUMENT_API ||
        !GOOGLE_DOCUMENT_API.endsWith(
            "/exec"
        )
    ) {

        throw new Error(
            "The Google Apps Script URL is not configured correctly."
        );

    }


    const url =
        new URL(
            GOOGLE_DOCUMENT_API
        );


    Object.entries(
        parameters || {}
    ).forEach(
        function ([key, value]) {

            if (
                value !== null &&
                typeof value !== "undefined" &&
                value !== ""
            ) {

                url.searchParams.set(
                    key,
                    String(value)
                );

            }

        }
    );


    // Cache-busting value so the register refreshes after upload.
    url.searchParams.set(
        "_",
        Date.now().toString()
    );


    return url.toString();

}


// ============================================================
// LOAD DOCUMENTS
// ============================================================

async function loadDocuments() {

    if (!project) {
        return;
    }


    const currentSequence =
        ++loadSequence;


    displayTableMessage(
        "Loading documents...",
        ""
    );


    try {

        const apiUrl =
            buildApiUrl({

                action:
                    "documents"

            });


        const response =
            await fetch(
                apiUrl,
                {

                    method:
                        "GET",

                    redirect:
                        "follow",

                    cache:
                        "no-store"

                }
            );


        if (!response.ok) {

            throw new Error(
                "Server returned HTTP " +
                response.status +
                "."
            );

        }


        const responseText =
            await response.text();


        let result;


        try {

            result =
                JSON.parse(
                    responseText
                );


        } catch (parseError) {

            console.error(
                "Unexpected document API response:",
                responseText
            );


            throw new Error(
                "The document server did not return valid JSON."
            );

        }


        if (
            !result ||
            result.success !== true
        ) {

            throw new Error(
                result &&
                result.message
                    ? result.message
                    : "Unable to load documents."
            );

        }


        const allDocuments =
            Array.isArray(
                result.documents
            )
                ? result.documents
                : [];


        // Ignore an older request if a newer request completed.
        if (
            currentSequence !==
            loadSequence
        ) {

            return;

        }


        documents =
            allDocuments

                .map(
                    normalizeDocument
                )

                .filter(
                    function (documentRecord) {

                        return (
                            normalizeText(
                                documentRecord.Project
                            ) ===
                            normalizeText(
                                project
                            )
                        );

                    }
                );


        console.log(
            "All API documents:",
            allDocuments.length
        );


        console.log(
            "Documents for project:",
            project,
            documents.length
        );


        populateFilterOptions();


        updateDashboard();


        filterDocuments();


    } catch (error) {

        console.error(
            "Document loading error:",
            error
        );


        documents = [];


        updateDashboard();


        displayTableMessage(
            "Unable to load the Document Register. " +
            getErrorMessage(error),
            "#dc2626"
        );

    }

}


// ============================================================
// NORMALIZE API DOCUMENT
//
// Supports both capitalized spreadsheet field names and
// lowercase dashboard field names.
// ============================================================

function normalizeDocument(record) {

    const source =
        record &&
        typeof record === "object"
            ? record
            : {};


    return {

        DocNo:
            getFirstValue(
                source.DocNo,
                source.docNo
            ),

        Category:
            getFirstValue(
                source.Category,
                source.category
            ),

        Trade:
            getFirstValue(
                source.Trade,
                source.trade
            ),

        Title:
            getFirstValue(
                source.Title,
                source.title,
                source.FileName,
                source.fileName
            ),

        Revision:
            getFirstValue(
                source.Revision,
                source.revision
            ),

        Status:
            getFirstValue(
                source.Status,
                source.status
            ),

        Date:
            getFirstValue(
                source.Date,
                source.date
            ),

        DueDate:
            getFirstValue(
                source.DueDate,
                source.dueDate
            ),

        BallInCourt:
            getFirstValue(
                source.BallInCourt,
                source.ballInCourt
            ),

        ActivityID:
            getFirstValue(
                source.ActivityID,
                source.activityId
            ),

        ActivityName:
            getFirstValue(
                source.ActivityName,
                source.activityName
            ),

        Project:
            getFirstValue(
                source.Project,
                source.project
            ),

        PreparedBy:
            getFirstValue(
                source.PreparedBy,
                source.preparedBy
            ),

        SubmittedBy:
            getFirstValue(
                source.SubmittedBy,
                source.submittedBy
            ),

        Remarks:
            getFirstValue(
                source.Remarks,
                source.remarks
            ),

        FileName:
            getFirstValue(
                source.FileName,
                source.fileName
            ),

        FileID:
            getFirstValue(
                source.FileID,
                source.fileId
            ),

        FileLink:
            getFirstValue(
                source.FileLink,
                source.fileLink
            ),

        FileSize:
            Number(
                getFirstValue(
                    source.FileSize,
                    source.fileSize,
                    0
                )
            ) || 0,

        FileType:
            getFirstValue(
                source.FileType,
                source.fileType
            ),

        UploadedBy:
            getFirstValue(
                source.UploadedBy,
                source.uploadedBy
            ),

        UploadedDate:
            getFirstValue(
                source.UploadedDate,
                source.uploadedDate
            ),

        Folder:
            getFirstValue(
                source.Folder,
                source.folder
            )

    };

}


// ============================================================
// DASHBOARD CARDS
// ============================================================

function updateDashboard() {

    safelySetText(
        "totalDocs",
        documents.length
    );


    safelySetText(
        "approvedDocs",
        countByStatus(
            "Approved"
        )
    );


    safelySetText(
        "approvedAsCorrectedDocs",
        countByStatus(
            "Approved As Corrected"
        )
    );


    safelySetText(
        "reviseResubmitDocs",
        countByStatus(
            "Revise & Resubmit"
        )
    );


    safelySetText(
        "submittedDocs",
        countByStatus(
            "Submitted"
        )
    );


    safelySetText(
        "draftDocs",
        countByStatus(
            "Draft"
        )
    );


    safelySetText(
        "cancelledDocs",
        countByStatus(
            "Cancelled"
        )
    );


    safelySetText(
        "supersededDocs",
        countByStatus(
            "Superseded"
        )
    );


    safelySetText(
        "overdueDocs",
        documents.filter(
            isDocumentOverdue
        ).length
    );


    updateChart();

}


// ============================================================
// STATUS HELPERS
// ============================================================

function getDocumentStatus(
    documentRecord
) {

    return safeText(
        documentRecord &&
        documentRecord.Status
    );

}


function statusEquals(
    documentRecord,
    expectedStatus
) {

    return (
        normalizeText(
            getDocumentStatus(
                documentRecord
            )
        ) ===
        normalizeText(
            expectedStatus
        )
    );

}


function countByStatus(
    expectedStatus
) {

    return documents.filter(
        function (documentRecord) {

            return statusEquals(
                documentRecord,
                expectedStatus
            );

        }
    ).length;

}


// ============================================================
// OVERDUE
//
// Approved, approved-as-corrected, cancelled, and superseded
// documents are treated as closed.
//
// A due date becomes overdue only after the end of that date.
// ============================================================

function isDocumentOverdue(
    documentRecord
) {

    const status =
        normalizeText(
            getDocumentStatus(
                documentRecord
            )
        );


    const closedStatuses = [

        "approved",
        "approved as corrected",
        "cancelled",
        "superseded"

    ];


    if (
        closedStatuses.includes(
            status
        )
    ) {

        return false;

    }


    const dueDateValue =
        documentRecord &&
        documentRecord.DueDate;


    if (!dueDateValue) {

        return false;

    }


    const dueDate =
        new Date(
            dueDateValue
        );


    if (
        Number.isNaN(
            dueDate.getTime()
        )
    ) {

        return false;

    }


    dueDate.setHours(
        23,
        59,
        59,
        999
    );


    return (
        Date.now() >
        dueDate.getTime()
    );

}


// ============================================================
// STATUS CHART
// ============================================================

function updateChart() {

    const canvas =
        document.getElementById(
            "statusChart"
        );


    if (!canvas) {
        return;
    }


    if (
        typeof Chart ===
        "undefined"
    ) {

        console.warn(
            "Chart.js is not loaded."
        );

        return;

    }


    if (statusChart) {

        statusChart.destroy();

        statusChart = null;

    }


    statusChart =
        new Chart(
            canvas,
            {

                type:
                    "doughnut",

                data: {

                    labels: [

                        "Approved",
                        "Approved As Corrected",
                        "Revise & Resubmit",
                        "Submitted",
                        "Draft",
                        "Superseded",
                        "Cancelled",
                        "Overdue"

                    ],

                    datasets: [{

                        data: [

                            countByStatus(
                                "Approved"
                            ),

                            countByStatus(
                                "Approved As Corrected"
                            ),

                            countByStatus(
                                "Revise & Resubmit"
                            ),

                            countByStatus(
                                "Submitted"
                            ),

                            countByStatus(
                                "Draft"
                            ),

                            countByStatus(
                                "Superseded"
                            ),

                            countByStatus(
                                "Cancelled"
                            ),

                            documents.filter(
                                isDocumentOverdue
                            ).length

                        ],

                        backgroundColor: [

                            "#16a34a",
                            "#FEBE1E",
                            "#FE0000",
                            "#765BFF",
                            "#D2591C",
                            "#D8E438",
                            "#EDADAD",
                            "#DC2626"

                        ],

                        borderWidth:
                            1

                    }]

                },

                options: {

                    responsive:
                        true,

                    maintainAspectRatio:
                        false,

                    plugins: {

                        legend: {

                            position:
                                "bottom"

                        }

                    }

                }

            }
        );

}


// ============================================================
// DISPLAY DOCUMENTS
// ============================================================

function displayDocuments(list) {

    if (!tableBody) {
        return;
    }


    tableBody.replaceChildren();


    if (
        !Array.isArray(list) ||
        list.length === 0
    ) {

        displayTableMessage(
            "No project documents were found.",
            "#64748b"
        );


        updateRecordCount(0);

        return;

    }


    const fragment =
        document.createDocumentFragment();


    list.forEach(
        function (documentRecord) {

            const row =
                document.createElement(
                    "tr"
                );


            appendTextCell(
                row,
                documentRecord.DocNo
            );


            appendTextCell(
                row,
                documentRecord.Category
            );


            appendTextCell(
                row,
                documentRecord.Trade
            );


            appendTextCell(
                row,
                documentRecord.Title
            );


            appendTextCell(
                row,
                documentRecord.Revision
            );


            appendStatusCell(
                row,
                documentRecord
            );


            appendDateCell(
                row,
                documentRecord.Date
            );


            appendDateCell(
                row,
                documentRecord.DueDate
            );


            appendTextCell(
                row,
                documentRecord.BallInCourt
            );


            appendFileCell(
                row,
                documentRecord
            );


            fragment.appendChild(
                row
            );

        }
    );


    tableBody.appendChild(
        fragment
    );


    updateRecordCount(
        list.length
    );

}


// ============================================================
// TABLE MESSAGE
// ============================================================

function displayTableMessage(
    message,
    color
) {

    if (!tableBody) {
        return;
    }


    tableBody.replaceChildren();


    const row =
        document.createElement(
            "tr"
        );


    const cell =
        document.createElement(
            "td"
        );


    // The current document table has ten columns.
    cell.colSpan = 10;


    cell.style.textAlign =
        "center";


    cell.style.padding =
        "25px";


    if (color) {

        cell.style.color =
            color;

    }


    cell.textContent =
        safeText(message);


    row.appendChild(
        cell
    );


    tableBody.appendChild(
        row
    );

}


// ===================================================
