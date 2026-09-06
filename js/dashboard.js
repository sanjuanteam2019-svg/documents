"use strict";


// ============================================================
// DEVEX DOCUMENT PORTAL
// DASHBOARD
// ============================================================


// ============================================================
// CONFIGURATION
// ============================================================

// Replace this with your deployed Google Apps Script Web App URL.
// The URL must end with /exec.
//
// Example:
// https://script.google.com/macros/s/AKfycbxxxxxxxx/exec

const DOCUMENTS_API_URL =
    "https://script.google.com/macros/s/AKfycbwjZ_jsSXJlGmwAG68LxIOtKm0KAurN_jy89Z_3Ris0-2ujDtBbC-Zxvtr3wvlDtohTSA/exec";


// Number of latest documents displayed in the dashboard table.
const LATEST_DOCUMENT_LIMIT = 20;


// Locale used when displaying dates.
const DATE_LOCALE = "en-US";


// ============================================================
// PROJECT DISPLAY NAMES
// ============================================================

const PROJECT_NAMES = {

    "22-storey-multipurpose-building":
        "Multipurpose Building",

    "government-center":
        "Government Center",

    "school-cluster3":
        "School Cluster 3"

};


// ============================================================
// GLOBAL DASHBOARD DATA
// ============================================================

// Contains only the latest documents returned by the API.
let allDocs = [];


// Retains the latest successful dashboard summary.
let dashboardSummary = null;


// Prevents an older search request or rendering operation
// from replacing newer results.
let dashboardLoadSequence = 0;


// ============================================================
// CURRENT USER
// ============================================================

function initializeCurrentUser() {

    const welcomeElement =
        document.getElementById(
            "welcomeUser"
        );


    if (!welcomeElement) {
        return;
    }


    try {

        const storedUser =
            localStorage.getItem(
                "currentUser"
            );


        if (!storedUser) {

            welcomeElement.textContent =
                "Welcome";

            return;

        }


        const currentUser =
            JSON.parse(
                storedUser
            );


        const displayName =
            currentUser &&
            (
                currentUser.fullname ||
                currentUser.fullName ||
                currentUser.name ||
                currentUser.username
            );


        welcomeElement.textContent =
            displayName
                ? `Welcome, ${displayName}`
                : "Welcome";


    } catch (error) {

        console.error(
            "Unable to read the current user:",
            error
        );


        welcomeElement.textContent =
            "Welcome";

    }

}


// ============================================================
// LOGOUT
// ============================================================

function initializeLogoutButton() {

    const logoutButton =
        document.getElementById(
            "logoutBtn"
        );


    if (!logoutButton) {
        return;
    }


    // If auth.js already assigned a direct onclick handler,
    // do not replace it.
    if (
        typeof logoutButton.onclick ===
        "function"
    ) {

        return;

    }


    logoutButton.addEventListener(
        "click",
        function () {

            localStorage.removeItem(
                "currentUser"
            );


            // Change login.html if your login page uses
            // a different file name.
            window.location.href =
                "login.html";

        }
    );

}


// ============================================================
// START DASHBOARD
// ============================================================

async function loadDashboard() {

    const sequence =
        ++dashboardLoadSequence;


    console.log(
        "Dashboard started"
    );


    setDashboardLoadingState();


    // The latest-document request and the summary request do
    // not depend on each other, so load them simultaneously.
    const results =
        await Promise.allSettled([

            fetchLatestDocuments(
                LATEST_DOCUMENT_LIMIT
            ),

            fetchDashboardSummary()

        ]);


    // Ignore results from an older dashboard load.
    if (
        sequence !==
        dashboardLoadSequence
    ) {

        return;

    }


    const latestResult =
        results[0];


    const summaryResult =
        results[1];


    // --------------------------------------------------------
    // Latest documents
    // --------------------------------------------------------

    if (
        latestResult.status ===
        "fulfilled"
    ) {

        const latestData =
            latestResult.value;


        allDocs =
            Array.isArray(
                latestData.documents
            )
                ? latestData.documents
                : [];


        displayDocuments(
            allDocs
        );


        updateLatestDocumentsLabel(
            allDocs.length,
            latestData.totalRegisteredDocuments
        );


    } else {

        allDocs = [];


        console.error(
            "Latest documents error:",
            latestResult.reason
        );


        displayTableMessage(
            "Unable to load the latest documents."
        );


        updateLatestDocumentsLabel(
            0,
            0
        );

    }


    // --------------------------------------------------------
    // Overall dashboard summary
    // --------------------------------------------------------

    if (
        summaryResult.status ===
        "fulfilled"
    ) {

        dashboardSummary =
            summaryResult.value;


        updateDashboardSummary(
            dashboardSummary
        );


    } else {

        dashboardSummary = null;


        console.error(
            "Dashboard summary error:",
            summaryResult.reason
        );


        setDashboardSummaryError();

    }

}


// ============================================================
// FETCH LATEST DOCUMENTS
// ============================================================

async function fetchLatestDocuments(limit) {

    const url =
        buildApiUrl({

            action:
                "latest",

            limit:
                limit

        });


    const data =
        await fetchJson(url);


    if (
        !Array.isArray(
            data.documents
        )
    ) {

        throw new Error(
            "The latest-document response does not contain a documents array."
        );

    }


    return data;

}


// ============================================================
// FETCH DASHBOARD SUMMARY
// ============================================================

async function fetchDashboardSummary() {

    const url =
        buildApiUrl({

            action:
                "count"

        });


    return fetchJson(url);

}


// ============================================================
// BUILD API URL
// ============================================================

function buildApiUrl(parameters) {

    if (
        !DOCUMENTS_API_URL ||
        DOCUMENTS_API_URL.includes(
            "YOUR_DEPLOYMENT_ID"
        )
    ) {

        throw new Error(
            "DOCUMENTS_API_URL has not been configured."
        );

    }


    const url =
        new URL(
            DOCUMENTS_API_URL
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


    // This helps identify a fresh request while the API
    // still uses cache: no-store.
    url.searchParams.set(
        "_",
        Date.now().toString()
    );


    return url.toString();

}


// ============================================================
// FETCH JSON
// ============================================================

async function fetchJson(url) {

    const response =
        await fetch(
            url,
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
            `The server returned HTTP ${response.status}.`
        );

    }


    const responseText =
        await response.text();


    let data;


    try {

        data =
            JSON.parse(
                responseText
            );


    } catch (error) {

        console.error(
            "Unexpected server response:",
            responseText
        );


        throw new Error(
            "The server did not return valid JSON."
        );

    }


    if (
        !data ||
        data.success !== true
    ) {

        throw new Error(
            data &&
            data.message
                ? data.message
                : "The Google Apps Script request failed."
        );

    }


    return data;

}


// ============================================================
// UPDATE DASHBOARD SUMMARY
// ============================================================

function updateDashboardSummary(data) {

    // Registered spreadsheet document records.
    //
    // To show physical Drive files instead, replace
    // data.registeredDocuments with data.driveFiles.
    setText(
        "totalDocuments",
        data.registeredDocuments
    );


    setText(
        "submitted",
        getStatusCount(
            data.statusCounts,
            "Submitted"
        )
    );


    setText(
        "approved",
        getStatusCount(
            data.statusCounts,
            "Approved"
        )
    );


    setText(
        "approvedAsCorrected",
        getStatusCount(
            data.statusCounts,
            "Approved As Corrected"
        )
    );


    setText(
        "reviseResubmit",
        getStatusCount(
            data.statusCounts,
            "Revise & Resubmit"
        )
    );


    setText(
        "draft",
        getStatusCount(
            data.statusCounts,
            "Draft"
        )
    );


    setText(
        "superseded",
        getStatusCount(
            data.statusCounts,
            "Superseded"
        )
    );


    setText(
        "cancelled",
        getStatusCount(
            data.statusCounts,
            "Cancelled"
        )
    );


    setText(
        "totalProjects",
        getTotalProjects(data)
    );


    setText(
        "dueThisWeek",
        data.dueThisWeek
    );


    setText(
        "overdue",
        data.overdue
    );


    setSummaryCardTitles(data);


    console.log(
        "Dashboard summary:",
        data
    );

}


// ============================================================
// TOTAL PROJECTS
// ============================================================

function getTotalProjects(data) {

    const configuredTotal =
        toNonNegativeNumber(
            data.totalProjects
        );


    if (configuredTotal > 0) {

        return configuredTotal;

    }


    if (
        data.projectCounts &&
        typeof data.projectCounts ===
        "object"
    ) {

        return Object.keys(
            data.projectCounts
        ).filter(
            function (project) {

                return (
                    project &&
                    project !== "Unspecified"
                );

            }
        ).length;

    }


    return 0;

}


// ============================================================
// STATUS COUNT
// ============================================================

function getStatusCount(
    statusCounts,
    expectedStatus
) {

    if (
        !statusCounts ||
        typeof statusCounts !==
        "object"
    ) {

        return 0;

    }


    const normalizedExpectedStatus =
        normalizeText(
            expectedStatus
        );


    const matchingStatus =
        Object.keys(
            statusCounts
        ).find(
            function (status) {

                return (
                    normalizeText(status) ===
                    normalizedExpectedStatus
                );

            }
        );


    if (!matchingStatus) {

        return 0;

    }


    return toNonNegativeNumber(
        statusCounts[
            matchingStatus
        ]
    );

}


// ============================================================
// SET SUMMARY CARD TITLES
// ============================================================

function setSummaryCardTitles(data) {

    const totalDocumentsElement =
        document.getElementById(
            "totalDocuments"
        );


    if (totalDocumentsElement) {

        totalDocumentsElement.title =
            [
                "Registered document records: " +
                    toNonNegativeNumber(
                        data.registeredDocuments
                    ),

                "Unique registered files: " +
                    toNonNegativeNumber(
                        data.uniqueRegisteredFiles
                    ),

                "Physical Drive files: " +
                    toNonNegativeNumber(
                        data.driveFiles
                    )

            ].join("\n");

    }


    const overdueElement =
        document.getElementById(
            "overdue"
        );


    if (overdueElement) {

        overdueElement.title =
            "Outstanding documents with due dates before today.";

    }


    const dueThisWeekElement =
        document.getElementById(
            "dueThisWeek"
        );


    if (dueThisWeekElement) {

        dueThisWeekElement.title =
            "Outstanding documents due by the end of this week.";

    }

}


// ============================================================
// LATEST DOCUMENTS LABEL
// ============================================================

function updateLatestDocumentsLabel(
    displayedCount,
    totalCount
) {

    const table =
        document.querySelector(
            "table"
        );


    if (!table) {
        return;
    }


    table.setAttribute(
        "aria-label",
        `Latest ${displayedCount} of ${toNonNegativeNumber(totalCount)} registered documents`
    );

}


// ============================================================
// DASHBOARD LOADING STATE
// ============================================================

function setDashboardLoadingState() {

    const summaryElementIds = [

        "totalDocuments",
        "submitted",
        "approved",
        "approvedAsCorrected",
        "reviseResubmit",
        "draft",
        "dueThisWeek",
        "overdue",
        "totalProjects",
        "superseded",
        "cancelled"

    ];


    summaryElementIds.forEach(
        function (elementId) {

            const element =
                document.getElementById(
                    elementId
                );


            if (element) {

                element.textContent =
                    "...";

                element.removeAttribute(
                    "title"
                );

            }

        }
    );


    displayTableMessage(
        "Loading the latest documents..."
    );

}


// ============================================================
// DASHBOARD SUMMARY ERROR
// ============================================================

function setDashboardSummaryError() {

    const summaryElementIds = [

        "totalDocuments",
        "submitted",
        "approved",
        "approvedAsCorrected",
        "reviseResubmit",
        "draft",
        "dueThisWeek",
        "overdue",
        "totalProjects",
        "superseded",
        "cancelled"

    ];


    summaryElementIds.forEach(
        function (elementId) {

            const element =
                document.getElementById(
                    elementId
                );


            if (!element) {
                return;
            }


            element.textContent =
                "!";


            element.title =
                "Unable to load this dashboard total.";

        }
    );

}


// ============================================================
// DISPLAY DOCUMENTS
// ============================================================

function displayDocuments(documents) {

    const tbody =
        document.getElementById(
            "dashboardTable"
        );


    if (!tbody) {
        return;
    }


    tbody.replaceChildren();


    if (
        !Array.isArray(documents) ||
        documents.length === 0
    ) {

        displayTableMessage(
            "No documents found."
        );

        return;

    }


    const fragment =
        document.createDocumentFragment();


    documents.forEach(
        function (documentRecord) {

            const document =
                normalizeDocument(
                    documentRecord
                );


            const row =
                document.createElement(
                    "tr"
                );


            appendTextCell(
                row,
                document.docNo
            );


            appendTextCell(
                row,
                document.category
            );


            appendTextCell(
                row,
                document.projectName
            );


            appendDocumentTitleCell(
                row,
                document
            );


            appendStatusCell(
                row,
                document.status
            );


            appendDateCell(
                row,
                document.uploadedDate ||
                document.date
            );


            fragment.appendChild(
                row
            );

        }
    );


    tbody.appendChild(
        fragment
    );

}


// ============================================================
// NORMALIZE DOCUMENT
//
// Supports lowercase dashboard properties and original
// capitalized spreadsheet properties.
// ============================================================

function normalizeDocument(record) {

    const projectId =
        getFirstValue(
            record.project,
            record.Project
        );


    return {

        docNo:
            getFirstValue(
                record.docNo,
                record.DocNo
            ),

        category:
            getFirstValue(
                record.category,
                record.Category
            ),

        trade:
            getFirstValue(
                record.trade,
                record.Trade
            ),

        title:
            getFirstValue(
                record.title,
                record.Title,
                record.fileName,
                record.FileName,
                "Untitled document"
            ),

        revision:
            getFirstValue(
                record.revision,
                record.Revision
            ),

        status:
            getFirstValue(
                record.status,
                record.Status
            ),

        date:
            getFirstValue(
                record.date,
                record.Date
            ),

        dueDate:
            getFirstValue(
                record.dueDate,
                record.DueDate
            ),

        project:
            projectId,

        projectName:
            getFirstValue(
                record.projectName,
                getProjectDisplayName(
                    projectId
                )
            ),

        fileName:
            getFirstValue(
                record.fileName,
                record.FileName
            ),

        fileId:
            getFirstValue(
                record.fileId,
                record.FileID
            ),

        fileLink:
            getFirstValue(
                record.fileLink,
                record.FileLink
            ),

        uploadedBy:
            getFirstValue(
                record.uploadedBy,
                record.UploadedBy
            ),

        uploadedDate:
            getFirstValue(
                record.uploadedDate,
                record.UploadedDate
            )

    };

}


// ============================================================
// DISPLAY TABLE MESSAGE
// ============================================================

function displayTableMessage(message) {

    const tbody =
        document.getElementById(
            "dashboardTable"
        );


    if (!tbody) {
        return;
    }


    tbody.replaceChildren();


    const row =
        document.createElement(
            "tr"
        );


    const cell =
        document.createElement(
            "td"
        );


    // Your dashboard table has six columns.
    cell.colSpan = 6;


    cell.style.textAlign =
        "center";


    cell.style.padding =
        "25px";


    cell.textContent =
        message;


    row.appendChild(
        cell
    );


    tbody.appendChild(
        row
    );

}


// ============================================================
// APPEND NORMAL TEXT CELL
// ============================================================

function appendTextCell(
    row,
    value
) {

    const cell =
        document.createElement(
            "td"
        );


    cell.textContent =
        safeText(value);


    row.appendChild(
        cell
    );

}


// ============================================================
// APPEND DOCUMENT TITLE CELL
// ============================================================

function appendDocumentTitleCell(
    row,
    documentRecord
) {

    const cell =
        document.createElement(
            "td"
        );


    const title =
        safeText(
            documentRecord.title ||
            documentRecord.fileName ||
            "Open document"
        );


    const fileUrl =
        getSafeDriveUrl(
            documentRecord.fileLink,
            documentRecord.fileId
        );


    if (fileUrl) {

        const link =
            document.createElement(
                "a"
            );


        link.href =
            fileUrl;


        link.target =
            "_blank";


        link.rel =
            "noopener noreferrer";


        link.textContent =
            title;


        link.title =
            documentRecord.fileName
                ? `Open ${documentRecord.fileName}`
                : "Open document in Google Drive";


        link.style.color =
            "#2563eb";


        link.style.textDecoration =
            "none";


        link.addEventListener(
            "mouseenter",
            function () {

                link.style.textDecoration =
                    "underline";

            }
        );


        link.addEventListener(
            "mouseleave",
            function () {

                link.style.textDecoration =
                    "none";

            }
        );


        cell.appendChild(
            link
        );


    } else {

        cell.textContent =
            title;

    }


    row.appendChild(
        cell
    );

}


// ============================================================
// APPEND STATUS CELL
// ============================================================

function appendStatusCell(
    row,
    status
) {

    const cell =
        document.createElement(
            "td"
        );


    const badge =
        document.createElement(
            "span"
        );


    const safeStatus =
        safeText(status) ||
        "Unspecified";


    badge.textContent =
        safeStatus;


    badge.style.display =
        "inline-block";


    badge.style.padding =
        "5px 9px";


    badge.style.borderRadius =
        "12px";


    badge.style.fontSize =
        "13px";


    badge.style.fontWeight =
        "600";


    const colors =
        getStatusColors(
            safeStatus
        );


    badge.style.backgroundColor =
        colors.background;


    badge.style.color =
        colors.text;


    cell.appendChild(
        badge
    );


    row.appendChild(
        cell
    );

}


// ============================================================
// STATUS COLORS
// ============================================================

function getStatusColors(status) {

    const normalizedStatus =
        normalizeText(status);


    const colorMap = {

        "submitted": {

            background:
                "#dbeafe",

            text:
                "#1d4ed8"

        },

        "approved": {

            background:
                "#dcfce7",

            text:
                "#166534"

        },

        "approved as corrected": {

            background:
                "#ecfccb",

            text:
                "#3f6212"

        },

        "revise & resubmit": {

            background:
                "#ffedd5",

            text:
                "#9a3412"

        },

        "draft": {

            background:
                "#f1f5f9",

            text:
                "#475569"

        },

        "superseded": {

            background:
                "#f3e8ff",

            text:
                "#6b21a8"

        },

        "cancelled": {

            background:
                "#fee2e2",

            text:
                "#991b1b"

        }

    };


    return colorMap[
        normalizedStatus
    ] || {

        background:
            "#e2e8f0",

        text:
            "#334155"

    };

}


// ============================================================
// APPEND DATE CELL
// ============================================================

function appendDateCell(
    row,
    value
) {

    const cell =
        document.createElement(
            "td"
        );


    cell.textContent =
        formatDashboardDate(
            value
        );


    if (value) {

        const date =
            new Date(value);


        if (
            !Number.isNaN(
                date.getTime()
            )
        ) {

            cell.title =
                date.toLocaleString(
                    DATE_LOCALE
                );

        }

    }


    row.appendChild(
        cell
    );

}


// ============================================================
// FORMAT DASHBOARD DATE
// ============================================================

function formatDashboardDate(value) {

    if (!value) {

        return "";

    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return safeText(value);

    }


    return date.toLocaleDateString(
        DATE_LOCALE,
        {

            year:
                "numeric",

            month:
                "short",

            day:
                "numeric"

        }
    );

}


// ============================================================
// SAFE GOOGLE DRIVE URL
// ============================================================

function getSafeDriveUrl(
    fileLink,
    fileId
) {

    const suppliedLink =
        safeText(fileLink);


    if (
        suppliedLink &&
        isAllowedGoogleUrl(
            suppliedLink
        )
    ) {

        return suppliedLink;

    }


    const safeFileId =
        safeText(fileId);


    if (
        safeFileId &&
        /^[A-Za-z0-9_-]+$/.test(
            safeFileId
        )
    ) {

        return (
            "https://drive.google.com/file/d/" +
            encodeURIComponent(
                safeFileId
            ) +
            "/view"
        );

    }


    return "";

}


// ============================================================
// VALIDATE GOOGLE URL
// ============================================================

function isAllowedGoogleUrl(value) {

    try {

        const url =
            new URL(value);


        if (
            url.protocol !==
            "https:"
        ) {

            return false;

        }


        const allowedHosts = [

            "drive.google.com",

            "docs.google.com"

        ];


        return allowedHosts.includes(
            url.hostname.toLowerCase()
        );


    } catch (error) {

        return false;

    }

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
        PROJECT_NAMES[
            cleanProjectId
        ] ||
        cleanProjectId
    );

}


// ============================================================
// SEARCH INITIALIZATION
// ============================================================

function initializeSearch() {

    const searchInput =
        document.getElementById(
            "searchInput"
        );


    if (!searchInput) {
        return;
    }


    searchInput.addEventListener(
        "input",
        function () {

            const searchTerm =
                normalizeText(
                    this.value
                );


            if (!searchTerm) {

                displayDocuments(
                    allDocs
                );

                return;

            }


            const results =
                allDocs.filter(
                    function (record) {

                        const document =
                            normalizeDocument(
                                record
                            );


                        const searchableValues = [

                            document.docNo,
                            document.category,
                            document.trade,
                            document.title,
                            document.revision,
                            document.status,
                            document.project,
                            document.projectName,
                            document.fileName,
                            document.uploadedBy,
                            formatDashboardDate(
                                document.date
                            ),
                            formatDashboardDate(
                                document.uploadedDate
                            )

                        ];


                        return searchableValues.some(
                            function (value) {

                                return normalizeText(
                                    value
                                ).includes(
                                    searchTerm
                                );

                            }
                        );

                    }
                );


            console.log(
                "Search:",
                searchTerm
            );


            console.log(
                "Search results:",
                results.length
            );


            displayDocuments(
                results
            );

        }
    );

}


// ============================================================
// REFRESH WHEN DASHBOARD BECOMES ACTIVE
//
// If a user uploads a document on another page and returns by
// using the browser's back button, the dashboard reloads its
// data.
// ============================================================

function initializePageRefresh() {

    window.addEventListener(
        "pageshow",
        function (event) {

            if (event.persisted) {

                loadDashboard();

            }

        }
    );

}


// ============================================================
// SET ELEMENT TEXT
// ============================================================

function setText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (!element) {
        return;
    }


    element.textContent =
        String(
            toNonNegativeNumber(value)
        );

}


// ============================================================
// SAFE TEXT
// ============================================================

function safeText(value) {

    if (
        value === null ||
        typeof value === "undefined"
    ) {

        return "";

    }


    return String(value).trim();

}


// ============================================================
// NORMALIZE TEXT
// ============================================================

function normalizeText(value) {

    return safeText(value)
        .toLowerCase()
        .replace(
            /\s+/g,
            " "
        );

}


// ============================================================
// FIRST NON-EMPTY VALUE
// ============================================================

function getFirstValue() {

    for (
        let index = 0;
        index < arguments.length;
        index++
    ) {

        const value =
            arguments[index];


        if (
            value !== null &&
            typeof value !== "undefined" &&
            String(value).trim() !== ""
        ) {

            return value;

        }

    }


    return "";

}


// ============================================================
// NON-NEGATIVE NUMBER
// ============================================================

function toNonNegativeNumber(value) {

    const number =
        Number(value);


    if (
        !Number.isFinite(number) ||
        number < 0
    ) {

        return 0;

    }


    return Math.floor(number);

}


// ============================================================
// INITIALIZE
// ============================================================

document.addEventListener(
    "DOMContentLoaded",
    function () {

        initializeCurrentUser();

        initializeLogoutButton();

        initializeSearch();

        initializePageRefresh();

        loadDashboard();

    }
);
