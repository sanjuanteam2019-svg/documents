// ==========================================
// DEVEX DOCUMENT PORTAL
// PROJECT DOCUMENT REGISTER
// Google Apps Script + Google Sheets
// ==========================================

const GOOGLE_DOCUMENT_API =
    "https://script.google.com/macros/s/AKfycbwjZ_jsSXJlGmwAG68LxIOtKm0KAurN_jy89Z_3Ris0-2ujDtBbC-Zxvtr3wvlDtohTSA/exec";


// ==========================================
// DATA
// ==========================================

let documents = [];
let statusChart;


// ==========================================
// PROJECT INFORMATION
// ==========================================

const params =
    new URLSearchParams(
        window.location.search
    );

const project =
    params.get("project");


// ==========================================
// ELEMENTS
// ==========================================

const projectTitle =
    document.getElementById(
        "projectTitle"
    );

const tableBody =
    document.getElementById(
        "tableBody"
    );


// ==========================================
// PROJECT NAME
// ==========================================

const projectNames = {

    "22-storey-multipurpose-building":
        "Multipurpose Building",

     "government-center":
        "Government Center",

     "school-cluster3":
         "School Cluster 3"
};


// ==========================================
// CHECK PROJECT
// ==========================================

if (!project) {

    alert(
        "No project selected."
    );

    window.location.href =
        "projects.html";

}


// ==========================================
// PROJECT TITLE
// ==========================================

if (projectTitle) {

    projectTitle.textContent =
        "📄 " +
        (
            projectNames[project] ||
            project
        );

}


// ==========================================
// LOAD DOCUMENTS
// ==========================================

async function loadDocuments() {

    try {

        if (tableBody) {

            tableBody.innerHTML = `
                <tr>
                    <td colspan="10"
                        style="text-align:center;padding:25px;">
                        Loading documents...
                    </td>
                </tr>
            `;

        }


        const response =
            await fetch(
                GOOGLE_DOCUMENT_API
            );


        if (!response.ok) {

            throw new Error(
                "Server returned HTTP " +
                response.status
            );

        }


        const result =
            await response.json();


        console.log(
            "Document API response:",
            result
        );


        if (
            !result.success
        ) {

            throw new Error(
                result.message ||
                "Unable to load documents."
            );

        }


        const allDocuments =
            Array.isArray(
                result.documents
            )
                ? result.documents
                : [];


        // ----------------------------------
// TEMPORARY: SHOW ALL DOCUMENTS
// ----------------------------------

documents = allDocuments.filter(doc => {

    const storedProject =
        String(doc.Project || "")
            .trim()
            .toLowerCase();

    const currentProject =
        String(project || "")
            .trim()
            .toLowerCase();

    return storedProject === currentProject;

});
        console.log(
            "Documents for project:",
            documents
        );


        updateDashboard();

        displayDocuments(
            documents
        );


    }

    catch (error) {

        console.error(
            "Document loading error:",
            error
        );


        if (tableBody) {

            tableBody.innerHTML = `

                <tr>

                    <td
                        colspan="10"
                        style="
                            text-align:center;
                            padding:25px;
                            color:#dc2626;
                        "
                    >

                        Unable to load the
                        Document Register.

                        <br><br>

                        ${escapeHTML(
                            error.message
                        )}

                    </td>

                </tr>

            `;

        }

    }

}


// ==========================================
// DASHBOARD
// ==========================================

function updateDashboard() {

    document.getElementById(
        "totalDocs"
    ).textContent =
        documents.length;


    document.getElementById(
        "approvedDocs"
    ).textContent =

        documents.filter(
            d =>
                d.Status ===
                "Approved"
        ).length;


    document.getElementById(
        "approvedAsCorrectedDocs"
    ).textContent =

        documents.filter(
            d =>
                d.Status ===
                "Approved As Corrected"
        ).length;


    document.getElementById(
        "reviseResubmitDocs"
    ).textContent =

        documents.filter(
            d =>
                d.Status ===
                "Revise & Resubmit"
        ).length;


    document.getElementById(
        "submittedDocs"
    ).textContent =

        documents.filter(
            d =>
                d.Status ===
                "Submitted"
        ).length;


    document.getElementById(
        "draftDocs"
    ).textContent =

        documents.filter(
            d =>
                d.Status ===
                "Draft"
        ).length;


    document.getElementById(
        "cancelledDocs"
    ).textContent =

        documents.filter(
            d =>
                d.Status ===
                "Cancelled"
        ).length;


    document.getElementById(
        "supersededDocs"
    ).textContent =

        documents.filter(
            d =>
                d.Status ===
                "Superseded"
        ).length;


    document.getElementById(
        "overdueDocs"
    ).textContent =

        documents.filter(
            isDocumentOverdue
        ).length;


    updateChart();

}


// ==========================================
// OVERDUE
// ==========================================

function isDocumentOverdue(
    doc
) {

    if (
        doc.Status !==
        "Submitted"
    ) {

        return false;

    }


    if (
        !doc.DueDate
    ) {

        return false;

    }


    const due =
        new Date(
            doc.DueDate
        );


    return (
        !isNaN(
            due.getTime()
        ) &&
        new Date() > due
    );

}


// ==========================================
// STATUS CHART
// ==========================================

function updateChart() {

    const approved =
        documents.filter(
            d =>
                d.Status ===
                "Approved"
        ).length;


    const approvedAsCorrected =
        documents.filter(
            d =>
                d.Status ===
                "Approved As Corrected"
        ).length;


    const reviseResubmit =
        documents.filter(
            d =>
                d.Status ===
                "Revise & Resubmit"
        ).length;


    const submitted =
        documents.filter(
            d =>
                d.Status ===
                "Submitted"
        ).length;


    const draft =
        documents.filter(
            d =>
                d.Status ===
                "Draft"
        ).length;


    const superseded =
        documents.filter(
            d =>
                d.Status ===
                "Superseded"
        ).length;


    const cancelled =
        documents.filter(
            d =>
                d.Status ===
                "Cancelled"
        ).length;


    const overdue =
        documents.filter(
            isDocumentOverdue
        ).length;


    if (statusChart) {

        statusChart.destroy();

    }


    const canvas =
        document.getElementById(
            "statusChart"
        );


    if (!canvas) {

        return;

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

                            approved,
                            approvedAsCorrected,
                            reviseResubmit,
                            submitted,
                            draft,
                            superseded,
                            cancelled,
                            overdue

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

                        borderWidth: 1

                    }]

                },

                options: {

                    responsive: true,

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


// ==========================================
// DISPLAY DOCUMENTS
// ==========================================

function displayDocuments(
    list
) {

    if (!tableBody) {

        return;

    }


    tableBody.innerHTML = "";


    // --------------------------------------
    // EMPTY REGISTER
    // --------------------------------------

    if (
        !list.length
    ) {

        tableBody.innerHTML = `

            <tr>

                <td
                    colspan="10"
                    style="
                        text-align:center;
                        padding:30px;
                        color:#64748b;
                    "
                >

                    No project documents
                    have been registered yet.

                </td>

            </tr>

        `;


        document.getElementById(
            "recordCount"
        ).innerHTML =
            "Total Documents : <b>0</b>";


        return;

    }


    // --------------------------------------
    // DISPLAY
    // --------------------------------------

    list.forEach(
        doc => {

            let statusClass =
                "";


            const overdue =
                isDocumentOverdue(
                    doc
                );


            const displayStatus =
                overdue
                    ? "Overdue"
                    : (
                        doc.Status ||
                        ""
                    );


            // ------------------------------
            // STATUS CLASS
            // ------------------------------

            if (
                doc.Status ===
                "Approved"
            ) {

                statusClass =
                    "status-approved";

            }


            if (
                doc.Status ===
                "Approved As Corrected"
            ) {

                statusClass =
                    "status-approvedAsCorrected";

            }


            if (
                doc.Status ===
                "Revise & Resubmit"
            ) {

                statusClass =
                    "status-reviseResubmit";

            }


            if (
                doc.Status ===
                "Submitted"
            ) {

                statusClass =
                    "status-submitted";

            }


            if (
                doc.Status ===
                "Draft"
            ) {

                statusClass =
                    "status-draft";

            }


            if (
                doc.Status ===
                "Cancelled"
            ) {

                statusClass =
                    "status-cancelled";

            }


            if (
                doc.Status ===
                "Superseded"
            ) {

                statusClass =
                    "status-superseded";

            }


            if (overdue) {

                statusClass =
                    "status-overdue";

            }


            // ------------------------------
            // FILE
            // ------------------------------

            let fileCell =
                "—";


            if (
                doc.FileLink
            ) {

                fileCell = `

                    <a
                        href="${escapeHTML(
                            doc.FileLink
                        )}"
                        target="_blank"
                        rel="noopener noreferrer"
                        class="view-btn"
                    >
                        View
                    </a>

                `;

            }


            // ------------------------------
            // ROW
            // ------------------------------

            const row =
                document.createElement(
                    "tr"
                );


            row.innerHTML = `

                <td>
                    ${escapeHTML(
                        doc.DocNo
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        doc.Category
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        doc.Trade
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        doc.Title
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        doc.Revision
                    )}
                </td>

                <td
                    class="${statusClass}"
                >
                    ${escapeHTML(
                        displayStatus
                    )}
                </td>

                <td>
                    ${formatDate(
                        doc.Date
                    )}
                </td>

                <td>
                    ${formatDate(
                        doc.DueDate
                    )}
                </td>

                <td>
                    ${escapeHTML(
                        doc.BallInCourt
                    )}
                </td>

                <td>
                    ${fileCell}
                </td>

            `;


            tableBody.appendChild(
                row
            );

        }
    );


    document.getElementById(
        "recordCount"
    ).innerHTML =

        "Total Documents : <b>" +
        list.length +
        "</b>";

}


// ==========================================
// FILTER ELEMENTS
// ==========================================

const search =
    document.getElementById(
        "searchBox"
    );

const status =
    document.getElementById(
        "statusFilter"
    );

const category =
    document.getElementById(
        "categoryFilter"
    );

const trade =
    document.getElementById(
        "tradeFilter"
    );

const sort =
    document.getElementById(
        "sortFilter"
    );


// ==========================================
// FILTER
// ==========================================

function filterDocuments() {

    const keyword =
        (
            search.value ||
            ""
        ).toLowerCase();


    const selectedStatus =
        status.value;


    const selectedCategory =
        category.value;


    const selectedTrade =
        trade.value;


    const filtered =
        documents.filter(
            doc => {

                const matchText = [

                    doc.DocNo,
                    doc.Category,
                    doc.Trade,
                    doc.Title,
                    doc.Revision,
                    doc.Status,
                    doc.BallInCourt,
                    doc.ActivityID,
                    doc.ActivityName

                ]

                .some(
                    value =>
                        String(
                            value ||
                            ""
                        )
                        .toLowerCase()
                        .includes(
                            keyword
                        )
                );


                const overdue =
                    isDocumentOverdue(
                        doc
                    );


                const matchStatus =

                    selectedStatus === ""

                    ||

                    (
                        selectedStatus ===
                        "Overdue"

                            ? overdue

                            : doc.Status ===
                              selectedStatus
                    );


                const matchCategory =

                    selectedCategory === ""

                    ||

                    doc.Category ===
                    selectedCategory;


                const matchTrade =

                    selectedTrade === ""

                    ||

                    doc.Trade ===
                    selectedTrade;


                return (

                    matchText &&

                    matchStatus &&

                    matchCategory &&

                    matchTrade

                );

            }
        );


    // --------------------------------------
    // SORT
    // --------------------------------------

    switch (
        sort.value
    ) {

        case "date-desc":

            filtered.sort(
                (a, b) =>
                    new Date(
                        b.Date
                    ) -
                    new Date(
                        a.Date
                    )
            );

            break;


        case "date-asc":

            filtered.sort(
                (a, b) =>
                    new Date(
                        a.Date
                    ) -
                    new Date(
                        b.Date
                    )
            );

            break;


        case "doc-asc":

            filtered.sort(
                (a, b) =>
                    String(
                        a.DocNo ||
                        ""
                    )
                    .localeCompare(
                        String(
                            b.DocNo || ""
                        )
                    )
            );

            break;


        case "doc-desc":

            filtered.sort(
                (a, b) =>
                    String(
                        b.DocNo || ""
                    )
                    .localeCompare(
                        String(
                            a.DocNo || ""
                        )
                    )
            );

            break;


        case "title-asc":

            filtered.sort(
                (a, b) =>
                    String(
                        a.Title ||
                        ""
                    )
                    .localeCompare(
                        String(
                            b.Title ||
                            ""
                        )
                    )
            );

            break;


        case "title-desc":

            filtered.sort(
                (a, b) =>
                    String(
                        b.Title ||
                        ""
                    )
                    .localeCompare(
                        String(
                            a.Title ||
                            ""
                        )
                    )
            );

            break;


        case "dueDate-asc":

            filtered.sort(
                (a, b) =>
                    new Date(
                        a.DueDate
                    ) -
                    new Date(
                        b.DueDate
                    )
            );

            break;

    }


    displayDocuments(
        filtered
    );

}


// ==========================================
// EVENT LISTENERS
// ==========================================

if (search) {

    search.addEventListener(
        "keyup",
        filterDocuments
    );

}


if (status) {

    status.addEventListener(
        "change",
        filterDocuments
    );

}


if (category) {

    category.addEventListener(
        "change",
        filterDocuments
    );

}


if (trade) {

    trade.addEventListener(
        "change",
        filterDocuments
    );

}


if (sort) {

    sort.addEventListener(
        "change",
        filterDocuments
    );

}


// ==========================================
// DATE FORMAT
// ==========================================

function formatDate(
    value
) {

    if (!value) {

        return "—";

    }


    const date =
        new Date(
            value
        );


    if (
        isNaN(
            date.getTime()
        )
    ) {

        return escapeHTML(
            value
        );

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


// ==========================================
// ESCAPE HTML
// ==========================================

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


// ==========================================
// START
// ==========================================

// ==========================================
// UPLOAD DOCUMENT
// ==========================================

const openUploadBtn =
    document.getElementById("openUploadBtn");

const closeUploadBtn =
    document.getElementById("closeUploadBtn");

const cancelUploadBtn =
    document.getElementById("cancelUploadBtn");

const uploadModal =
    document.getElementById("uploadModal");

const uploadForm =
    document.getElementById("uploadForm");

const uploadFile =
    document.getElementById("uploadFile");

const uploadFileInfo =
    document.getElementById("uploadFileInfo");

const uploadMessage =
    document.getElementById("uploadMessage");

const submitUploadBtn =
    document.getElementById("submitUploadBtn");

const uploadProject =
    document.getElementById("uploadProject");


// ==========================================
// OPEN UPLOAD MODAL
// ==========================================

if (openUploadBtn) {

    openUploadBtn.addEventListener(
        "click",
        function () {

            if (!uploadModal) {
                return;
            }

            // Set current project automatically
            if (uploadProject) {

                uploadProject.value =
                    projectNames[project] ||
                    project ||
                    "";

            }

            // Clear previous message
            if (uploadMessage) {

                uploadMessage.textContent = "";

                uploadMessage.className =
                    "upload-message";

            }

            uploadModal.classList.add("show");

        }
    );

}


// ==========================================
// CLOSE UPLOAD MODAL
// ==========================================

function closeUploadModal() {

    if (!uploadModal) {
        return;
    }

    uploadModal.classList.remove("show");

}


// ==========================================
// CLOSE BUTTON
// ==========================================

if (closeUploadBtn) {

    closeUploadBtn.addEventListener(
        "click",
        closeUploadModal
    );

}


// ==========================================
// CANCEL BUTTON
// ==========================================

if (cancelUploadBtn) {

    cancelUploadBtn.addEventListener(
        "click",
        closeUploadModal
    );

}


// ==========================================
// CLOSE WHEN CLICKING OUTSIDE MODAL
// ==========================================

if (uploadModal) {

    uploadModal.addEventListener(
        "click",
        function (event) {

            if (
                event.target ===
                uploadModal
            ) {

                closeUploadModal();

            }

        }
    );

}


// ==========================================
// ESC KEY CLOSE
// ==========================================

document.addEventListener(
    "keydown",
    function (event) {

        if (
            event.key === "Escape" &&
            uploadModal &&
            uploadModal.classList.contains("show")
        ) {

            closeUploadModal();

        }

    }
);


// ==========================================
// FILE INFORMATION
// ==========================================

if (uploadFile) {

    uploadFile.addEventListener(
        "change",
        function () {

            if (!uploadFile.files.length) {

                uploadFileInfo.textContent =
                    "Select the document to upload.";

                return;

            }

            const file =
                uploadFile.files[0];

            const sizeMB =
                (
                    file.size /
                    (1024 * 1024)
                ).toFixed(2);

            uploadFileInfo.textContent =
                file.name +
                " (" +
                sizeMB +
                " MB)";

        }
    );

}


// ==========================================
// FILE TO BASE64
// ==========================================

function fileToBase64(file) {

    return new Promise(
        function (resolve, reject) {

            const reader =
                new FileReader();

            reader.onload = function () {

                const result =
                    reader.result;

                // Remove:
                // data:application/pdf;base64,
                // data:image/png;base64,
                // etc.

                const base64 =
                    result.split(",")[1];

                resolve(base64);

            };

            reader.onerror = function () {

                reject(
                    new Error(
                        "Unable to read selected file."
                    )
                );

            };

            reader.readAsDataURL(file);

        }
    );

}


// ==========================================
// SHOW UPLOAD MESSAGE
// ==========================================

function showUploadMessage(
    message,
    type
) {

    if (!uploadMessage) {
        return;
    }

    uploadMessage.textContent =
        message;

    uploadMessage.className =
        "upload-message " +
        type;

}


// ==========================================
// UPLOAD FORM SUBMISSION
// ==========================================

if (uploadForm) {

    uploadForm.addEventListener(
        "submit",
        async function (event) {

            event.preventDefault();


            // ----------------------------------
            // CHECK FILE
            // ----------------------------------

            if (
                !uploadFile ||
                !uploadFile.files.length
            ) {

                showUploadMessage(
                    "Please select a document file.",
                    "error"
                );

                return;

            }


            const file =
                uploadFile.files[0];


            // ----------------------------------
            // CHECK PROJECT
            // ----------------------------------

            const currentProject =
                project;


            if (!currentProject) {

                showUploadMessage(
                    "No project selected.",
                    "error"
                );

                return;

            }


            // ----------------------------------
            // CHECK CATEGORY
            // ----------------------------------

            const categoryValue =
                document.getElementById(
                    "uploadCategory"
                ).value;


            if (!categoryValue) {

                showUploadMessage(
                    "Please select a document category.",
                    "error"
                );

                return;

            }


            // ----------------------------------
            // DISABLE BUTTON
            // ----------------------------------

            if (submitUploadBtn) {

                submitUploadBtn.disabled =
                    true;

                submitUploadBtn.textContent =
                    "Uploading...";

            }


            showUploadMessage(
                "Uploading document. Please wait...",
                "success"
            );


            try {

                // ----------------------------------
                // CONVERT FILE TO BASE64
                // ----------------------------------

                const fileData =
                    await fileToBase64(file);


                // ----------------------------------
                // COLLECT FORM DATA
                // ----------------------------------

                const data = {

                    fileName:
                        file.name,

                    fileData:
                        fileData,

                    mimeType:
                        file.type ||
                        "application/octet-stream",

                    project:
                        currentProject,

                    docNo:
                        document.getElementById(
                            "uploadDocNo"
                        ).value.trim(),

                    category:
                        categoryValue,

                    trade:
                        document.getElementById(
                            "uploadTrade"
                        ).value,

                    title:
                        document.getElementById(
                            "uploadTitle"
                        ).value.trim(),

                    revision:
                        document.getElementById(
                            "uploadRevision"
                        ).value.trim() ||
                        "00",

                    status:
                        document.getElementById(
                            "uploadStatus"
                        ).value,

                    date:
                        document.getElementById(
                            "uploadDate"
                        ).value,

                    dueDate:
                        document.getElementById(
                            "uploadDueDate"
                        ).value,

                    ballInCourt:
                        document.getElementById(
                            "uploadBallInCourt"
                        ).value.trim(),

                    activityId:
                        document.getElementById(
                            "uploadActivityId"
                        ).value.trim(),

                    activityName:
                        document.getElementById(
                            "uploadActivityName"
                        ).value.trim(),

                    preparedBy:
                        document.getElementById(
                            "uploadPreparedBy"
                        ).value.trim(),

                    submittedBy:
                        document.getElementById(
                            "uploadSubmittedBy"
                        ).value.trim(),

                    remarks:
                        document.getElementById(
                            "uploadRemarks"
                        ).value.trim(),

                   uploadedBy:
                        localStorage.getItem("username") ||
                            "Document Controller"


                };


                // ----------------------------------
                // SEND TO GOOGLE APPS SCRIPT
                // ----------------------------------

                const response =
                    await fetch(
                        GOOGLE_DOCUMENT_API,
                        {

                            method: "POST",

                            headers: {
                                "Content-Type":
                                    "text/plain;charset=utf-8"
                            },

                            body:
                                JSON.stringify(data)

                        }
                    );


                // ----------------------------------
                // READ RESPONSE
                // ----------------------------------

                const result =
                    await response.json();


                console.log(
                    "Upload response:",
                    result
                );


                // ----------------------------------
                // CHECK RESULT
                // ----------------------------------

                if (
                    !result.success
                ) {

                    throw new Error(
                        result.message ||
                        "Upload failed."
                    );

                }


                // ----------------------------------
                // SUCCESS
                // ----------------------------------

                showUploadMessage(
                    "Document uploaded successfully.",
                    "success"
                );


                // ----------------------------------
                // RESET FORM
                // ----------------------------------

                uploadForm.reset();


                // Restore project
                if (uploadProject) {

                    uploadProject.value =
                        projectNames[project] ||
                        project ||
                        "";

                }


                if (uploadFileInfo) {

                    uploadFileInfo.textContent =
                        "Select the document to upload.";

                }


                // ----------------------------------
                // REFRESH REGISTER
                // ----------------------------------

                await loadDocuments();


                // ----------------------------------
                // CLOSE AFTER SHORT DELAY
                // ----------------------------------

                setTimeout(
                    function () {

                        closeUploadModal();

                    },
                    800
                );


            }
            catch (error) {

                console.error(
                    "Upload error:",
                    error
                );


                showUploadMessage(
                    error.message ||
                    "Unable to upload document.",
                    "error"
                );

            }
            finally {

                // ----------------------------------
                // RESTORE BUTTON
                // ----------------------------------

                if (submitUploadBtn) {

                    submitUploadBtn.disabled =
                        false;

                    submitUploadBtn.textContent =
                        "Upload Document";

                }

            }

        }
    );

}

loadDocuments();
