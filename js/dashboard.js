const projectFiles = [
    "data/22-storey-multipurpose-building.json",
    "data/government-center.json",
    "data/school-cluster3.json",
    "data/medical-center.json",
    "data/evacuation-center.json",
    "data/crematorium.json"
];

const projectNames = {
    "22-storey-multipurpose-building": "22-Storey Multipurpose Building",
    "government-center": "Government Center",
    "school-cluster3": "School Cluster 3",
    "medical-center": "Medical Center",
    "evacuation-center": "Evacuation Center",
    "crematorium": "Crematorium"
};

async function loadDashboard() {

    let allDocs = [];

    for (const file of projectFiles) {

        try {

            const response = await fetch(file);

            if (!response.ok) {
                console.error(`Cannot load ${file}`);
                continue;
            }

           const docs = await response.json();

           const projectKey = file
              .replace("data/", "")
              .replace(".json", "");

           docs.forEach(doc => {
               doc.project = projectNames[projectKey];
           });

           allDocs = allDocs.concat(docs);

        } catch(err) {

            console.error(err);

        }

        } // Sort after all files are loaded
    allDocs.sort((a, b) => new Date(b.date) - new Date(a.date));

    // Build dashboard table
    const tbody = document.getElementById("dashboardTable");

    tbody.innerHTML = "";

    allDocs.slice(0, 10).forEach(doc => {

    const formattedDate = new Date(doc.date).toLocaleDateString(
    "en-US",
    {
        year: "numeric",
        month: "short",
        day: "numeric"
    }
);    

        tbody.innerHTML += `
        <tr>
            <td>${doc.docNo}</td>
            <td>${doc.project}</td>
            <td>${doc.title}</td>
            <td>${doc.status}</td>
           <td>${formattedDate}</td>
        </tr>
        `;

    });

    // Totals
    document.getElementById("totalProjects").textContent = projectFiles.length;
    document.getElementById("totalDocuments").textContent = allDocs.length;

    document.getElementById("submitted").textContent =
        allDocs.filter(d => d.status === "Submitted").length;

    document.getElementById("approved").textContent =
        allDocs.filter(d => d.status === "Approved").length;

    document.getElementById("approvedAsCorrected").textContent =
        allDocs.filter(d => d.status === "Approved As Corrected").length;

    document.getElementById("reviseResubmit").textContent =
        allDocs.filter(d => d.status === "Revise & Resubmit").length;

    document.getElementById("draft").textContent =
        allDocs.filter(d => d.status === "Draft").length;

    document.getElementById("cancelled").textContent =
        allDocs.filter(d => d.status === "Cancelled").length;

    document.getElementById("superseded").textContent =
        allDocs.filter(d => d.status === "Superseded").length;

    document.getElementById("dueThisWeek").textContent = 0;

    document.getElementById("overdue").textContent = 0;

    }
    loadDashboard();