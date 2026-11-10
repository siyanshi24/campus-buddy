let subjects = JSON.parse(localStorage.getItem("campusBuddySubjects")) || [];
let editingId = "";

const subjectForm = document.getElementById("subjectForm");

document.querySelectorAll(".nav-button").forEach(function (button) {
    button.addEventListener("click", function () {
        document.querySelectorAll(".page").forEach(function (page) {
            page.classList.remove("active");
        });

        document.getElementById(button.dataset.page).classList.add("active");

        document.querySelectorAll(".nav-button").forEach(function (item) {
            item.classList.remove("active");
        });

        button.classList.add("active");
        document.getElementById("pageTitle").textContent =
            button.dataset.page === "dashboard" ? "Dashboard" : "Subjects & Attendance";
    });
});

function saveSubjects() {
    localStorage.setItem("campusBuddySubjects", JSON.stringify(subjects));
}

function safeText(text) {
    return String(text).replace(/[&<>"']/g, function (character) {
        const symbols = {
            "&": "&amp;",
            "<": "&lt;",
            ">": "&gt;",
            '"': "&quot;",
            "'": "&#039;"
        };

        return symbols[character];
    });
}

subjectForm.addEventListener("submit", function (event) {
    event.preventDefault();

    const total = Number(document.getElementById("totalClasses").value);
    const attended = Number(document.getElementById("attendedClasses").value);

    if (attended > total) {
        alert("Classes attended cannot be more than total classes held.");
        return;
    }

    const subject = {
        id: editingId || Date.now().toString(),
        name: document.getElementById("subjectName").value.trim(),
        day: document.getElementById("classDay").value,
        time: document.getElementById("classTime").value,
        total: total,
        attended: attended
    };

    if (editingId) {
        for (let i = 0; i < subjects.length; i++) {
            if (subjects[i].id === editingId) {
                subjects[i] = subject;
            }
        }
    } else {
        subjects.push(subject);
    }

    editingId = "";
    document.getElementById("saveButton").textContent = "＋ Add subject";
    subjectForm.reset();
    document.getElementById("totalClasses").value = 0;
    document.getElementById("attendedClasses").value = 0;

    saveSubjects();
    renderPage();
});

function renderSubjects() {
    const list = document.getElementById("subjectList");

    if (subjects.length === 0) {
        list.innerHTML = '<div class="empty-state">No subjects yet. Add your first subject above.</div>';
        return;
    }

    list.innerHTML = "";

    for (let i = 0; i < subjects.length; i++) {
        const subject = subjects[i];
        let percentage = 0;

        if (subject.total > 0) {
            percentage = Math.round((subject.attended / subject.total) * 100);
        }

        const low = percentage < 75;

        list.innerHTML += `
            <article class="subject-card">
                <div class="subject-top">
                    <div>
                        <h3>${safeText(subject.name)}</h3>
                        <p>${safeText(subject.day)} · ${safeText(subject.time)} · ${subject.attended} of ${subject.total} classes attended</p>
                    </div>
                    <strong>${percentage}%</strong>
                </div>

                <div class="attendance-line">
                    <div class="progress">
                        <span style="width: ${Math.min(percentage, 100)}%"></span>
                    </div>
                    <span class="attendance-status ${low ? "low" : ""}">
                        ${low ? "Below 75%" : "On track"}
                    </span>
                </div>

                <div class="card-actions">
                    <button data-action="present" data-id="${subject.id}">＋ Present today</button>
                    <button data-action="absent" data-id="${subject.id}">＋ Missed today</button>
                    <button data-action="edit" data-id="${subject.id}">Edit</button>
                    <button class="delete-button" data-action="delete" data-id="${subject.id}">Delete</button>
                </div>
            </article>
        `;
    }
}

function renderTodayClasses() {
    const list = document.getElementById("todayClasses");
    const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
    let found = false;

    list.innerHTML = "";

    for (let i = 0; i < subjects.length; i++) {
        if (subjects[i].day === today) {
            found = true;
            list.innerHTML += `
                <article class="class-card">
                    <div>
                        <h3>${safeText(subjects[i].name)}</h3>
                        <p>${safeText(subjects[i].day)} class</p>
                    </div>
                    <strong>${safeText(subjects[i].time)}</strong>
                </article>
            `;
        }
    }

    if (!found) {
        list.innerHTML = '<div class="empty-state">No classes added for today. Add subjects and their class days to see your schedule here.</div>';
    }
}

function renderStats() {
    let totalClasses = 0;
    let attendedClasses = 0;
    let lowCount = 0;

    for (let i = 0; i < subjects.length; i++) {
        totalClasses += subjects[i].total;
        attendedClasses += subjects[i].attended;

        let percentage = 0;

        if (subjects[i].total > 0) {
            percentage = (subjects[i].attended / subjects[i].total) * 100;
        }

        if (percentage < 75) {
            lowCount++;
        }
    }

    let overall = 0;

    if (totalClasses > 0) {
        overall = Math.round((attendedClasses / totalClasses) * 100);
    }

    document.getElementById("subjectCount").textContent = subjects.length;
    document.getElementById("overallAttendance").textContent = overall + "%";
    document.getElementById("lowAttendance").textContent = lowCount;
}

document.getElementById("subjectList").addEventListener("click", function (event) {
    const button = event.target.closest("button[data-action]");

    if (!button) {
        return;
    }

    const id = button.dataset.id;
    const action = button.dataset.action;

    for (let i = 0; i < subjects.length; i++) {
        if (subjects[i].id === id) {
            if (action === "present") {
                subjects[i].total++;
                subjects[i].attended++;
            }

            if (action === "absent") {
                subjects[i].total++;
            }

            if (action === "edit") {
                editingId = id;
                document.getElementById("subjectName").value = subjects[i].name;
                document.getElementById("classDay").value = subjects[i].day;
                document.getElementById("classTime").value = subjects[i].time;
                document.getElementById("totalClasses").value = subjects[i].total;
                document.getElementById("attendedClasses").value = subjects[i].attended;
                document.getElementById("saveButton").textContent = "Save changes";

                document.querySelectorAll(".page").forEach(function (page) {
                    page.classList.remove("active");
                });

                document.getElementById("subjects").classList.add("active");
                document.getElementById("pageTitle").textContent = "Subjects & Attendance";
            }

            if (action === "delete") {
                subjects.splice(i, 1);
            }

            break;
        }
    }

    saveSubjects();
    renderPage();
});

function renderPage() {
    renderSubjects();
    renderTodayClasses();
    renderStats();
}

document.getElementById("todayDate").textContent =
    new Date().toLocaleDateString("en-US", {
        weekday: "short",
        day: "numeric",
        month: "short"
    });

renderPage();