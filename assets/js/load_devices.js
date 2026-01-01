async function loadDevices() {
    const container = document.querySelector(".devices__grid");
    const filterContainer = document.querySelector(".device-filters");
    const searchInput = document.getElementById("device-search");

    container.innerHTML = "Loading devices...";

    try {
        // Get folder list from GitHub repo
        const repoContents = await fetch("https://yaaprom-device-info.idoybh2.workers.dev/repos/yaap/device-info/contents").then(r => r.json());
        const deviceFolders = repoContents.filter(item => item.type === "dir");

        // Fetch each device JSON
        const devicesData = await Promise.all(deviceFolders.map(async folder => {
            try {
                const infoUrl = `https://raw.githubusercontent.com/yaap/device-info/master/${folder.name}/${folder.name}.json`;
                const info = await fetch(infoUrl).then(r => r.json());
                const brand = info.name ? info.name.split(" ")[0] : "Unknown";
                return { codename: folder.name, brand, ...info };
            } catch (err) {
                console.error("Failed to load device", folder.name, err);
                return null;
            }
        }));

        const devices = devicesData.filter(Boolean);

        // Group by brand
        const brandMap = {};
        devices.forEach(device => {
            if (!brandMap[device.brand]) {
                brandMap[device.brand] = [];
            }
            brandMap[device.brand].push(device);
        });

        // sort each brand by device name
        Object.keys(brandMap).forEach(b => {
            brandMap[b].sort((a, b) => {
                const nameA = a.name || "";
                const nameB = b.name || "";
                return nameA.localeCompare(nameB);
            });
        });

        // Sort brands alphabetically
        const sortedBrands = Object.keys(brandMap).sort();

        // Render filter buttons
        filterContainer.innerHTML = `<button class="filter-btn filter-btn--active" data-brand="all">All Brands</button>` +
            sortedBrands.map(b => `<button class="filter-btn" data-brand="${b}">${b}</button>`).join("");

        let currentBrand = "all";
        let currentSearch = "";

        function renderDevices() {
            let html = "";
            let hasDevices = false;

            sortedBrands.forEach(b => {
                if (currentBrand === "all" || currentBrand === b) {
                    const filteredDevices = brandMap[b].filter(d => {
                        const searchTerm = currentSearch.toLowerCase();
                        const name = (d.name || "").toLowerCase();
                        const codename = (d.codename || "").toLowerCase();
                        return name.includes(searchTerm) || codename.includes(searchTerm);
                    });

                    if (filteredDevices.length > 0) {
                        hasDevices = true;
                        html += `<div class="device-brand" data-brand="${b}">
                                    <h3 class="device-brand__title">${b}</h3>
                                    <div class="device-brand__models">
                                        ${filteredDevices.map(d => `
                                            <a href="/device.html?codename=${d.codename}" class="device-card">
                                                <div class="device-card__content">
                                                    <h4 class="device-card__name">${d.name}</h4>
                                                    <span class="device-card__codename">${d.codename}</span>
                                                </div>
                                                <div class="device-card__action"></div>
                                            </a>
                                        `).join("")}
                                    </div>
                                 </div>`;
                    }
                }
            });

            container.innerHTML = html || `<div class="no-results">
                <p>No devices found matching "${currentSearch}"</p>
                <button class="btn btn--primary btn--sm" onclick="document.querySelector('.filter-btn[data-brand=all]').click()">Clear Filters</button>
            </div>`;
        }


        function updateMousePosition(e) {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            e.currentTarget.style.setProperty("--mouse-x", `${x}px`);
            e.currentTarget.style.setProperty("--mouse-y", `${y}px`);
        }

        function attachCardListeners() {
            document.querySelectorAll(".device-card").forEach(card => {
                card.removeEventListener("mousemove", updateMousePosition);
                card.addEventListener("mousemove", updateMousePosition);
            });
        }

        renderDevices();
        attachCardListeners();

        // Filter handling
        filterContainer.addEventListener("click", e => {
            if (e.target.classList.contains("filter-btn")) {
                document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("filter-btn--active"));
                e.target.classList.add("filter-btn--active");
                currentBrand = e.target.dataset.brand;
                renderDevices();
                attachCardListeners();
            }
        });

        // Search handling
        if (searchInput) {
            searchInput.addEventListener("input", (e) => {
                currentSearch = e.target.value.trim();
                renderDevices();
                attachCardListeners();
            });
        }

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Failed to load devices.</p>";
    }
}

document.addEventListener("DOMContentLoaded", loadDevices);
