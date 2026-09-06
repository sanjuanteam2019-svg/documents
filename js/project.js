// ==========================================
// Project Workspace
// ==========================================

document.addEventListener(
    "DOMContentLoaded",
    loadProject
);


// ==========================================
// Load Project
// ==========================================

async function loadProject() {

    const params = new URLSearchParams(
        window.location.search
    );

    const projectId = params.get("project");

    const projectName =
        document.getElementById("projectName");

    const projectDescription =
        document.getElementById("projectDescription");

    const workspace =
        document.getElementById("projectWorkspace");


    // --------------------------------------
    // No project selected
    // --------------------------------------

    if (!projectId) {

        projectName.textContent =
            "No Project Selected";

        projectDescription.textContent =
            "Please select a project.";

        workspace.innerHTML = `
            <div class="message">

                <strong>
                    No project was selected.
                </strong>

                <br><br>

                <a href="projects.html">
                    Return to Projects
                </a>

            </div>
        `;

        return;
    }


    // --------------------------------------
    // Load Projects.json
    // --------------------------------------

    try {

        const response =
            await fetch("data/Projects.json");


        if (!response.ok) {

            throw new Error(
                "Unable to load Projects.json"
            );

        }


        const projects =
            await response.json();


        // ----------------------------------
        // Find selected project
        // ----------------------------------

        const project =
            projects.find(
                item => item.id === projectId
            );


        if (!project) {

            throw new Error(
                "Project not found"
            );

        }


        // ----------------------------------
        // Display project information
        // ----------------------------------

        projectName.textContent =
            `${project.icon || "📁"} ${project.name}`;

        projectDescription.textContent =
            project.description || "";


        // ----------------------------------
        // Build workspace
        // ----------------------------------

        workspace.innerHTML = `

            <!-- Documents -->

            <div class="module">

                <div class="module-icon">
                    📄
                </div>

                <h2>
                    Documents
                </h2>

                <p>
                    Manage project documents,
                    drawings, RFIs, RFAs, MARs,
                    transmittals and other
                    controlled records.
                </p>

                <a
                    class="module-button"
                    href="documents.html?project=${encodeURIComponent(project.id)}"
                >
                    Open Documents
                </a>

            </div>


            <!-- Schedules -->

            <div class="module">

                <div class="module-icon">
                    📅
                </div>

                <h2>
                    Schedules
                </h2>

                <p>
                    Manage project schedules,
                    updates, look-ahead programs,
                    activities and progress.
                </p>

                <a
                    class="module-button"
                    href="schedule.html?project=${encodeURIComponent(project.id)}"
                >
                    Open Schedules
                </a>

            </div>


            <!-- Reports -->

            <div class="module">

                <div class="module-icon">
                    📊
                </div>

                <h2>
                    Reports
                </h2>

                <p>
                    View project reports,
                    progress information,
                    S-curves and other
                    project records.
                </p>

                <a
                    class="module-button"
                    href="reports.html?project=${encodeURIComponent(project.id)}"
                >
                    Open Reports
                </a>

            </div>

        `;

    }

    catch (error) {

        console.error(
            "Project loading error:",
            error
        );


        projectName.textContent =
            "Unable to Load Project";

        projectDescription.textContent =
            "";

        workspace.innerHTML = `

            <div class="message">

                <strong>
                    Unable to load the project.
                </strong>

                <br><br>

                Please check
                <strong>
                    Projects.json
                </strong>.

                <br><br>

                <a href="projects.html">
                    Return to Projects
                </a>

            </div>

        `;

    }

}
