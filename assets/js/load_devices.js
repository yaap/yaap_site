async function loadDevices() {
    const container = document.querySelector(".devices__grid");
    const filterContainer = document.querySelector(".device-filters");

    container.innerHTML = "Loading devices...";

    try {
        // Get folder list from GitHub repo
        const repoContents = await fetch("https://api.github.com/repos/yaap/device-info/contents").then(r => r.json());
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

        // Render all devices grouped by brand
        function renderDevices(brand = "all") {
            let html = "";
            sortedBrands.forEach(b => {
                if (brand === "all" || brand === b) {
                    html += `<div class="device-brand" data-brand="${b}">
                                <h3 class="device-brand__title">${b}</h3>
                                <div class="device-brand__models">
                                    ${brandMap[b].map(d => `
                                        <div class="device-card">
                                            <h4 class="device-card__name">${d.name}</h4>
                                            <a href="/device.html?codename=${d.codename}" class="btn btn--primary btn--sm">Download</a>
                                        </div>
                                    `).join("")}
                                </div>
                             </div>`;
                }
            });
            container.innerHTML = html || "<p>No devices found.</p>";
        }

        renderDevices();

        // Filter handling
        filterContainer.addEventListener("click", e => {
            if (e.target.classList.contains("filter-btn")) {
                document.querySelectorAll(".filter-btn").forEach(btn => btn.classList.remove("filter-btn--active"));
                e.target.classList.add("filter-btn--active");
                renderDevices(e.target.dataset.brand);
            }
        });

    } catch (err) {
        console.error(err);
        container.innerHTML = "<p>Failed to load devices.</p>";
    }
}

document.addEventListener("DOMContentLoaded", loadDevices);