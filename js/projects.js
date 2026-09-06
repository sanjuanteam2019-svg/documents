// ==========================================
// Projects Module
// ==========================================

document.addEventListener("DOMContentLoaded", loadProjects);


// ==========================================
// Load Projects
// ==========================================

async function loadProjects() {

    const grid = document.getElementById("projectsGrid");

    try {

        const response = await fetch("data/Projects.json");

        if (!response.ok) {
            throw new Error("Unable to load Projects.json");
        }

        const projects = await response.json();

        grid.innerHTML = "";

        projects.forEach(project => {

            const card = document.createElement("div");

            card.className = "card";

            card.innerHTML = `
                <h2>${project.icon || "📁"} ${project.name}</h2>

                <p>${project.description || ""}</p>

                <a
                    class="button"
                    href="project.html?project=${encodeURIComponent(project.id)}"
                >
                    Open Project
                </a>
            `;

            grid.appendChild(card);

        });

    } catch (error) {

        console.error("Project loading error:", error);

        grid.innerHTML = `
            <div class="message">
                <strong>Unable to load projects.</strong>
                <br><br>
                Please check the Projects.json file.
            </div>
        `;

    }

}
