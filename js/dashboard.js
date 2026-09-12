// ============================================================
// DEVEX DOCUMENT PORTAL
// DASHBOARD.JS
// Google Spreadsheet / Apps Script API Version
// ============================================================


// ============================================================
// CURRENT USER
// ============================================================

const currentUser = JSON.parse(
    localStorage.getItem("currentUser")
);


if (currentUser) {

    const welcomeUser =
        document.getElementById("welcomeUser");

    if (welcomeUser) {

        welcomeUser.textContent =
            `Welcome, ${currentUser.fullname}`;

    }

}


// ============================================================
// GOOGLE APPS SCRIPT API
// ============================================================
//
// Replace this URL with your deployed Google Apps Script
// Web App URL.
//
// Example:
// https://script.google.com/macros/s/XXXXXXXXXXXX/exec
//
// ============================================================

const API_URL =
    "https://script.google.com/macros/s/AKfycbxJy2DjQET7xkMEP2w_scuZ3m-5upCLprCYbxxr0Xt9ijrZzQDrShN7NiPucUjNqQPXgw/exec";


// ============================================================
// GLOBAL DOCUMENT ARRAY
// ============================================================
//
// All documents retrieved from Google Spreadsheet
// will be stored here.
//
// ============================================================

let allDocs = [];


// ============================================================
// PROJECT NAME MAP
// ============================================================
//
// This converts project IDs stored in the spreadsheet
// into friendly project names.
//
// If your spreadsheet already contains the friendly
// project name, the value will simply be used as-is.
//
// ============================================================

const projectNames = {

    "22-storey-multipurpose-building":
        "Multipurpose Building",

    "government-center":
        "Government Center",

    "school-cluster3":
        "School Cluster 3"

};


// ============================================================
// NORMALIZE PROJECT NAME
// ============================================================

function normalizeProjectName(project) {

    if (!project) {
        return "";
    }

    const projectKey =
        String(project).trim();

    return (
        projectNames[projectKey] ||
        projectKey
    );

}


// ============================================================
// NORMALIZE STATUS
// ============================================================
//
// This makes status comparison more reliable.
//
// Example:
//
// "Approved"
// "approved"
// " APPROVED "
//
// will all be treated as "approved".
//
// ============================================================

function normalizeStatus(status) {

    return String(status || "")
        .trim()
        .toLowerCase()
        .replace(/\s+/g, " ");

}


// ============================================================
// NORMALIZE DOCUMENT DATA
// ============================================================
//
// Google Apps Script returns the column headers from
// Google Spreadsheet exactly as they appear:
//
// DocNo
// Category
// Trade
// Title
// Revision
// Status
// Date
// DueDate
// etc.
//
// Your existing dashboard uses:
//
// doc.docNo
// doc.category
// doc.trade
// doc.title
// doc.status
// etc.
//
// This function converts the Google Sheet structure
// into the structure already used by your dashboard.
//
// ============================================================

function normalizeDocument(d) {

    return {

        docNo:
            d.DocNo || "",

        category:
            d.Category || "",

        trade:
            d.Trade || "",

        title:
            d.Title || "",

        revision:
            d.Revision || "",

        status:
            d.Status || "",

        date:
            d.Date || "",

        dueDate:
            d.DueDate || "",

        ballInCourt:
            d.BallInCourt || "",

        activityId:
            d.ActivityID || "",

        activityName:
            d.ActivityName || "",

        project:
            normalizeProjectName(d.Project),

        preparedBy:
            d.PreparedBy || "",

        submittedBy:
            d.SubmittedBy || "",

        remarks:
            d.Remarks || "",

        fileName:
            d.FileName || "",

        fileId:
            d.FileID || "",

        fileLink:
            d.FileLink || "",

        fileSize:
            d.FileSize || "",

        fileType:
            d.FileType || "",

        uploadedBy:
            d.UploadedBy || "",

        uploadedDate:
            d.UploadedDate || "",

        folder:
            d.Folder || ""

    };

}


// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    console.log(
        "===================================="
    );

    console.log(
        "SYC Dashboard started"
    );

    console.log(
        "Loading documents from Google Spreadsheet..."
    );

    console.log(
        "API:",
        API_URL
    );

    console.log(
        "===================================="
    );


    allDocs = [];


    // --------------------------------------------------------
    // Validate API URL
    // --------------------------------------------------------

    if (
        !API_URL ||
        API_URL ===
        "YOUR_GOOGLE_APPS_SCRIPT_WEB_APP_URL"
    ) {

        console.error(
            "Google Apps Script API URL has not been configured."
        );

        showDashboardError(
            "Google Apps Script API URL has not been configured."
        );

        return;

    }


    // --------------------------------------------------------
    // Fetch Google Apps Script API
    // --------------------------------------------------------

    try {

        const response =
            await fetch(API_URL, {

                method: "GET",

                cache: "no-store"

            });


        console.log(
            "API Response Status:",
            response.status
        );


        if (!response.ok) {

            throw new Error(
                `HTTP ${response.status}`
            );

        }


        const result =
            await response.json();


        console.log(
            "API Response:",
            result
        );


        // ----------------------------------------------------
        // Check API result
        // ----------------------------------------------------

        if (!result.success) {

            throw new Error(
                result.message ||
                "Google Apps Script returned an error."
            );

        }


        // ----------------------------------------------------
        // Normalize documents
        // ----------------------------------------------------

        allDocs =
            (result.documents || [])
                .map(normalizeDocument);


        console.log(
            "Total Documents:",
            allDocs.length
        );


    }

    catch (error) {

        console.error(
            "Unable to load documents:",
            error
        );


        showDashboardError(
            "Unable to load documents from Google Spreadsheet."
        );


        return;

    }


    // ========================================================
    // SORT DOCUMENTS
    // ========================================================
    //
    // Newest documents first.
    //
    // ========================================================

    allDocs.sort(
        (a, b) => {

            const dateA =
                new Date(a.date);

            const dateB =
                new Date(b.date);


            return (
                dateB - dateA
            );

        }
    );


    // ========================================================
    // DISPLAY RECENT DOCUMENTS
    // ========================================================

    displayDocuments(
        allDocs.slice(0, 20)
    );


    // ========================================================
    // TOTAL PROJECTS
    // ========================================================

    const uniqueProjects =
        [
            ...new Set(

                allDocs

                    .map(
                        d => d.project
                    )

                    .filter(
                        Boolean
                    )

            )
        ];


    setElementText(
        "totalProjects",
        uniqueProjects.length
    );


    // ========================================================
    // TOTAL DOCUMENTS
    // ========================================================

    setElementText(
        "totalDocuments",
        allDocs.length
    );


    // ========================================================
    // STATUS COUNTS
    // ========================================================

    setElementText(
        "submitted",
        countStatus("Submitted")
    );


    setElementText(
        "approved",
        countStatus("Approved")
    );


    setElementText(
        "approvedAsCorrected",
        countStatus("Approved As Corrected")
    );


    setElementText(
        "reviseResubmit",
        countStatus("Revise & Resubmit")
    );


    setElementText(
        "draft",
        countStatus("Draft")
    );


    setElementText(
        "cancelled",
        countStatus("Cancelled")
    );


    setElementText(
        "superseded",
        countStatus("Superseded")
    );


    // ========================================================
    // DUE / OVERDUE
    // ========================================================
    //
    // These are calculated automatically from DueDate.
    //
    // ========================================================

    const dueThisWeek =
        countDueThisWeek();


    const overdue =
        countOverdue();


    setElementText(
        "dueThisWeek",
        dueThisWeek
    );


    setElementText(
        "overdue",
        overdue
    );


    console.log(
        "Dashboard successfully loaded."
    );

}


// ============================================================
// SET ELEMENT TEXT
// ============================================================

function setElementText(
    elementId,
    value
) {

    const element =
        document.getElementById(
            elementId
        );


    if (element) {

        element.textContent =
            value;

    }

}


// ============================================================
// COUNT STATUS
// ============================================================

function countStatus(
    status
) {

    const target =
        normalizeStatus(status);


    return allDocs.filter(
        doc =>
            normalizeStatus(
                doc.status
            ) === target
    ).length;

}


// ============================================================
// GET VALID DATE
// ============================================================

function getValidDate(
    value
) {

    if (!value) {
        return null;
    }


    const date =
        new Date(value);


    if (
        Number.isNaN(
            date.getTime()
        )
    ) {

        return null;

    }


    return date;

}


// ============================================================
// COUNT DUE THIS WEEK
// ============================================================

function countDueThisWeek() {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    const endOfWeek =
        new Date(today);


    endOfWeek.setDate(
        today.getDate() +
        7
    );


    endOfWeek.setHours(
        23,
        59,
        59,
        999
    );


    return allDocs.filter(
        doc => {

            const dueDate =
                getValidDate(
                    doc.dueDate
                );


            if (!dueDate) {
                return false;
            }


            return (
                dueDate >= today &&
                dueDate <= endOfWeek
            );

        }
    ).length;

}


// ============================================================
// COUNT OVERDUE
// ============================================================

function countOverdue() {

    const today =
        new Date();


    today.setHours(
        0,
        0,
        0,
        0
    );


    return allDocs.filter(
        doc => {

            const dueDate =
                getValidDate(
                    doc.dueDate
                );


            if (!dueDate) {
                return false;
            }


            if (
                dueDate >= today
            ) {

                return false;

            }


            const status =
                normalizeStatus(
                    doc.status
                );


            // Do not consider completed-type
            // documents as overdue.

            const completedStatuses = [

                "approved",
                "approved as corrected",
                "cancelled",
                "superseded",
                "closed"

            ];


            if (
                completedStatuses.includes(
                    status
                )
            ) {

                return false;

            }


            return true;

        }
    ).length;

}


// ============================================================
// DISPLAY DOCUMENTS
// ============================================================

function displayDocuments(docs) {

    const tbody =
        document.getElementById(
            "dashboardTable"
        );


    if (!tbody) {

        console.warn(
            "dashboardTable element not found."
        );

        return;

    }


    tbody.innerHTML = "";


    // --------------------------------------------------------
    // No documents
    // --------------------------------------------------------

    if (
        !docs ||
        docs.length === 0
    ) {

        tbody.innerHTML = `

            <tr>

                <td
                    colspan="7"
                    style="
                        text-align:center;
                        padding:20px;
                    "
                >

                    No documents found.

                </td>

            </tr>

        `;

        return;

    }


    // --------------------------------------------------------
    // Display documents
    // --------------------------------------------------------

    docs.forEach(
        doc => {

            const formattedDate =
                formatDate(
                    doc.date
                );


            const row =
                document.createElement(
                    "tr"
                );


            // ------------------------------------------------
            // FILE LINK
            // ------------------------------------------------

            let fileLinkHTML = "";


            if (doc.fileLink) {

                fileLinkHTML = `

                    <a
                        href="${escapeHTML(doc.fileLink)}"
                        target="_blank"
                        rel="noopener noreferrer"
                        style="
                            color:#2563eb;
                            text-decoration:none;
                            font-weight:600;
                        "
                    >
                        📄 View File
                    </a>

                `;

            } else {

                fileLinkHTML = `

                    <span
                        style="
                            color:#999;
                        "
                    >
                        No File
                    </span>

                `;

            }


            // ------------------------------------------------
            // TABLE ROW
            // ------------------------------------------------

            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        doc.docNo
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        doc.category
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        doc.project
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        doc.title
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        doc.status
                    )}
                </td>

                <td>
                    ${formattedDate}
                </td>

                <td>
                    ${fileLinkHTML}
                </td>

            `;


            tbody.appendChild(
                row
            );

        }
    );

}

// ============================================================
// FORMAT DATE
// ============================================================

function formatDate(
    value
) {

    if (!value) {
        return "";
    }


    const date =
        getValidDate(
            value
        );


    if (!date) {
        return "";
    }


    return date.toLocaleDateString(
        "en-US",
        {

            year: "numeric",

            month: "short",

            day: "numeric"

        }
    );

}


// ============================================================
// ESCAPE HTML
// ============================================================
//
// Prevents document information containing characters such
// as < > & from being interpreted as HTML.
//
// ============================================================

function escapeHTML(
    value
) {

    if (
        value === null ||
        value === undefined
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


// ============================================================
// SHOW DASHBOARD ERROR
// ============================================================

function showDashboardError(
    message
) {

    const tbody =
        document.getElementById(
            "dashboardTable"
        );


    if (!tbody) {
        return;
    }


    tbody.innerHTML = `

        <tr>

            <td
                colspan="7"
                style="
                    text-align:center;
                    padding:20px;
                "
            >

                ${escapeHTML(
                    message
                )}

            </td>

        </tr>

    `;


    // Reset dashboard counters

    setElementText(
        "totalProjects",
        0
    );


    setElementText(
        "totalDocuments",
        0
    );


    setElementText(
        "submitted",
        0
    );


    setElementText(
        "approved",
        0
    );


    setElementText(
        "approvedAsCorrected",
        0
    );


    setElementText(
        "reviseResubmit",
        0
    );


    setElementText(
        "draft",
        0
    );


    setElementText(
        "cancelled",
        0
    );


    setElementText(
        "superseded",
        0
    );


    setElementText(
        "dueThisWeek",
        0
    );


    setElementText(
        "overdue",
        0
    );

}


// ============================================================
// SEARCH
// ============================================================

const searchInput =
    document.getElementById(
        "searchInput"
    );


if (searchInput) {

    searchInput.addEventListener(
        "input",
        function () {

            const searchTerm =
                this.value
                    .trim()
                    .toLowerCase();


            // ------------------------------------------------
            // Empty search
            // ------------------------------------------------

            if (!searchTerm) {

                displayDocuments(
                    allDocs.slice(0, 10)
                );

                return;

            }


            // ------------------------------------------------
            // Search
            // ------------------------------------------------

            const results =
                allDocs.filter(
                    doc => {

                        return (

                            String(
                                doc.docNo || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            String(
                                doc.title || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            String(
                                doc.project || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            String(
                                doc.status || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            String(
                                doc.trade || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            String(
                                doc.category || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            String(
                                doc.revision || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            String(
                                doc.ballInCourt || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            String(
                                doc.activityId || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            String(
                                doc.activityName || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            String(
                                doc.preparedBy || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            String(
                                doc.submittedBy || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            String(
                                doc.fileName || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                            ||

                            String(
                                doc.uploadedBy || ""
                            )
                                .toLowerCase()
                                .includes(
                                    searchTerm
                                )

                        );

                    }
                );


            console.log(
                "Search:",
                searchTerm
            );


            console.log(
                "Results:",
                results.length
            );


            displayDocuments(
                results
            );

        }
    );

}


// ============================================================
// START DASHBOARD
// ============================================================

loadDashboard();
