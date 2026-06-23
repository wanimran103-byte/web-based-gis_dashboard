/* ============================================================
   Tourist Attractions Dashboard in Lenggong Geopark
   Main functions: data handling, filters, Leaflet map, charts,
   KPI cards, ranking table and insights.
   ============================================================ */

const FALLBACK_ATTRACTIONS = [
  {
    id: 1,
    site_name: "Bukit Bunuh / Impak Meteorit Bukit Bunuh",
    site_type: "Archaeological / meteorite geosite",
    visitor_2022: 3243,
    visitor_2023: 4324,
    visitor_2024: 5160,
    visitor_2025: 5840,
    average: 4642,
    lat: 5.07305,
    lon: 100.97535
  },
  {
    id: 2,
    site_name: "Galeri Arkeologi Lembah Lenggong",
    site_type: "Gallery / main visitor attraction",
    visitor_2022: 17261,
    visitor_2023: 31026,
    visitor_2024: 32385,
    visitor_2025: 31682,
    average: 28089,
    lat: 5.05465,
    lon: 100.97374
  },
  {
    id: 3,
    site_name: "Bukit Jawa",
    site_type: "Archaeological geosite",
    visitor_2022: 1550,
    visitor_2023: 1750,
    visitor_2024: 2207,
    visitor_2025: 2190,
    average: 1924,
    lat: 5.12864,
    lon: 100.99245
  },
  {
    id: 4,
    site_name: "Lata Kekabu",
    site_type: "Waterfall / recreation attraction",
    visitor_2022: 4520,
    visitor_2023: 6567,
    visitor_2024: 6704,
    visitor_2025: 9053,
    average: 6711,
    lat: 5.05039,
    lon: 100.94480
  },
  {
    id: 5,
    site_name: "Tasik Raban Lenggong",
    site_type: "Lake / landscape attraction",
    visitor_2022: 1743,
    visitor_2023: 7388,
    visitor_2024: 15492,
    visitor_2025: 24373,
    average: 12249,
    lat: 5.00207,
    lon: 100.94463
  }
];

let attractions = [...FALLBACK_ATTRACTIONS];

/* ============================================================
   Supabase database configuration
   ------------------------------------------------------------
   To activate database mode:
   1. Create a Supabase table named tourist_attractions.
   2. Run the SQL in supabase_setup.sql.
   3. Replace the placeholder URL and anon key below.
   The app will read from Supabase first. If it is not configured,
   it will safely fall back to Data_Official_Lenggong.csv / built-in data.
   ============================================================ */
const SUPABASE_CONFIG = {
  url: "sb_publishable_5Czic8AjeLKUHRPyDiXOJg_Z__9zuoe",
  anonKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRjdnJvcGZma2J6eHBncmF5aWhtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODIyMTA2OTYsImV4cCI6MjA5Nzc4NjY5Nn0.4AStHMG7tFOc5r-NeyDMsRcx8DkQE25Z7eJIlZ7dr7I",
  table: "tourist_attractions"
};

function isSupabaseConfigured() {
  return SUPABASE_CONFIG.url.startsWith("https://") &&
         SUPABASE_CONFIG.anonKey.length > 40 &&
         !SUPABASE_CONFIG.url.includes("PASTE_YOUR") &&
         !SUPABASE_CONFIG.anonKey.includes("PASTE_YOUR");
}


const state = {
  search: "",
  type: "All",
  year: "2025",
  sort: "highest",
  activeId: null
};

const yearLabels = {
  "2022": "2022",
  "2023": "2023",
  "2024": "2024",
  "2025": "2025",
  avg: "Average"
};

const numberFmt = new Intl.NumberFormat("en-MY");
const percentFmt = new Intl.NumberFormat("en-MY", { maximumFractionDigits: 1 });

let map;
let markerLayer;
let markersById = {};
let barChart;
let lineChart;
let pieChart;

const els = {};

/* ============================================================
   Supabase loader. Uses the official supabase-js client to SELECT
   rows from the tourist_attractions table and convert them into the
   dashboard data structure.
   ============================================================ */
async function loadSupabaseIfConfigured() {
  if (!isSupabaseConfigured()) {
    setDataSourceStatus("Data source: Local CSV / fallback data", false);
    return false;
  }

  if (typeof window.supabase === "undefined") {
    setDataSourceStatus("Data source: Supabase library not loaded. Using local fallback.", true);
    return false;
  }

  try {
    const client = window.supabase.createClient(SUPABASE_CONFIG.url, SUPABASE_CONFIG.anonKey);
    const { data, error } = await client
      .from(SUPABASE_CONFIG.table)
      .select("id, site_name, site_type, visitor_2022, visitor_2023, visitor_2024, visitor_2025, average, lat, lon")
      .order("id", { ascending: true });

    if (error) throw error;
    if (!Array.isArray(data) || data.length === 0) throw new Error("Supabase table returned no rows");

    const parsed = data.map(normalizeAttractionRow).filter(site => Number.isFinite(site.lat) && Number.isFinite(site.lon));
    if (parsed.length === 0) throw new Error("Supabase rows have invalid coordinates");

    attractions = parsed;
    setDataSourceStatus(`Data source: Supabase database (${parsed.length} records)`, false);
    console.log("Supabase data loaded:", attractions);
    return true;
  } catch (error) {
    console.warn("Supabase loading failed. Falling back to CSV / built-in data.", error.message || error);
    setDataSourceStatus("Data source: Supabase failed. Using local fallback.", true);
    return false;
  }
}

function normalizeAttractionRow(row, index = 0) {
  const visitor2022 = toNumber(row.visitor_2022);
  const visitor2023 = toNumber(row.visitor_2023);
  const visitor2024 = toNumber(row.visitor_2024);
  const visitor2025 = toNumber(row.visitor_2025);
  const suppliedAverage = toNumber(row.average);
  const computedAverage = Math.round((visitor2022 + visitor2023 + visitor2024 + visitor2025) / 4);

  return {
    id: toNumber(row.id) || index + 1,
    site_name: row.site_name || row.name || row.site || `Attraction ${index + 1}`,
    site_type: row.site_type || row.type || row.category || "Unknown",
    visitor_2022: visitor2022,
    visitor_2023: visitor2023,
    visitor_2024: visitor2024,
    visitor_2025: visitor2025,
    average: suppliedAverage || computedAverage,
    lat: toNumber(row.lat || row.latitude),
    lon: toNumber(row.lon || row.lng || row.longitude)
  };
}

function setDataSourceStatus(message, isError = false) {
  if (!els.dataSourceStatus) return;
  els.dataSourceStatus.textContent = message;
  els.dataSourceStatus.classList.toggle("error", Boolean(isError));
}

/* ============================================================
   CSV loader. The app uses hardcoded fallback data so it can run
   by double-clicking index.html. When opened through Live Server,
   it also attempts to read Data_Official_Lenggong.csv.
   ============================================================ */
async function loadCsvIfAvailable() {
  try {
    const response = await fetch("Data_Official_Lenggong.csv", { cache: "no-store" });
    if (!response.ok) throw new Error("CSV not available");
    const csvText = await response.text();
    const parsed = parseCsv(csvText);
    if (parsed.length > 0) {
      attractions = parsed;
      console.log("CSV data loaded:", attractions);
    }
  } catch (error) {
    console.warn("Using built-in fallback data because CSV cannot be fetched from file path.", error.message);
  }
}

function parseCsv(csvText) {
  const lines = csvText.split(/\r?\n/).filter(line => line.trim() !== "");
  if (lines.length < 2) return [];
  const headers = parseCsvLine(lines[0]).map(normalizeHeader);

  return lines.slice(1).map((line, index) => {
    const values = parseCsvLine(line);
    const row = {};
    headers.forEach((header, i) => { row[header] = values[i] ?? ""; });
    return normalizeAttractionRow(row, index);
  }).filter(site => Number.isFinite(site.lat) && Number.isFinite(site.lon));
}

function parseCsvLine(line) {
  const values = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const next = line[i + 1];
    if (char === '"' && inQuotes && next === '"') {
      current += '"';
      i++;
    } else if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

function normalizeHeader(header) {
  return header.replace(/^\uFEFF/, "").trim().toLowerCase().replace(/\s+/g, "_");
}

function toNumber(value) {
  if (typeof value === "number") return value;
  if (value === undefined || value === null) return 0;
  const cleaned = String(value).replace(/,/g, "").trim();
  const parsed = Number.parseFloat(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
}

/* ============================================================
   General calculations
   ============================================================ */
function getVisitor(site, selectedYear = state.year) {
  if (selectedYear === "avg") return site.average;
  return site[`visitor_${selectedYear}`];
}

function getGrowth(site) {
  return ((site.visitor_2025 - site.visitor_2022) / site.visitor_2022) * 100;
}

function getFilteredData() {
  let data = attractions.filter(site => {
    const matchesSearch = site.site_name.toLowerCase().includes(state.search.toLowerCase());
    const matchesType = state.type === "All" || site.site_type === state.type;
    return matchesSearch && matchesType;
  });

  data = [...data].sort((a, b) => {
    if (state.sort === "highest") return getVisitor(b) - getVisitor(a);
    if (state.sort === "lowest") return getVisitor(a) - getVisitor(b);
    return a.site_name.localeCompare(b.site_name);
  });

  return data;
}

function getVisitorColor(value, min, max) {
  const ratio = (value - min) / Math.max(max - min, 1);
  if (ratio >= 0.66) return "#0f766e";
  if (ratio >= 0.33) return "#52b788";
  return "#f4a261";
}

function getMarkerRadius(value, min, max) {
  const ratio = (value - min) / Math.max(max - min, 1);
  return 8 + ratio * 16;
}


function getVisitorLevel(value, min, max) {
  const ratio = (value - min) / Math.max(max - min, 1);
  if (ratio >= 0.66) return "high";
  if (ratio >= 0.33) return "medium";
  return "low";
}

function createTourismIcon(site, visitorValue, min, max) {
  const radius = getMarkerRadius(visitorValue, min, max);
  const size = Math.round(Math.max(30, Math.min(50, radius * 2.2)));
  const color = getVisitorColor(visitorValue, min, max);
  const level = getVisitorLevel(visitorValue, min, max);
  return L.divIcon({
    className: "tourism-div-icon",
    html: `<div class="tourism-marker ${level} ${state.activeId === site.id ? "pulse" : ""}" title="${site.site_name}" style="--marker-size:${size}px;--marker-color:${color}"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size],
    popupAnchor: [0, -size + 4]
  });
}

function shortName(name) {
  return name
    .replace("Galeri Arkeologi Lembah Lenggong", "Galeri Arkeologi")
    .replace("Bukit Bunuh / Impak Meteorit Bukit Bunuh", "Bukit Bunuh");
}

/* ============================================================
   UI initialization
   ============================================================ */
function cacheElements() {
  els.kpiGrid = document.getElementById("kpiGrid");
  els.recordCount = document.getElementById("recordCount");
  els.dataSourceStatus = document.getElementById("dataSourceStatus");
  els.searchInput = document.getElementById("searchInput");
  els.typeFilter = document.getElementById("typeFilter");
  els.yearSelect = document.getElementById("yearSelect");
  els.sortSelect = document.getElementById("sortSelect");
  els.clearFilters = document.getElementById("clearFilters");
  els.siteList = document.getElementById("siteList");
  els.resetView = document.getElementById("resetView");
  els.fitMarkers = document.getElementById("fitMarkers");
  els.legend = document.getElementById("legend");
  els.selectedYearLabel = document.getElementById("selectedYearLabel");
  els.rankingTable = document.getElementById("rankingTable");
  els.insightContent = document.getElementById("insightContent");
}

function populateTypeFilter() {
  const types = ["All", ...new Set(attractions.map(site => site.site_type))];
  els.typeFilter.innerHTML = types.map(type => `<option value="${type}">${type}</option>`).join("");
}

function bindEvents() {
  els.searchInput.addEventListener("input", event => {
    state.search = event.target.value;
    updateDashboard();
  });

  els.typeFilter.addEventListener("change", event => {
    state.type = event.target.value;
    updateDashboard();
  });

  els.yearSelect.addEventListener("change", event => {
    state.year = event.target.value;
    state.activeId = null;
    updateDashboard();
  });

  els.sortSelect.addEventListener("change", event => {
    state.sort = event.target.value;
    updateDashboard();
  });

  els.clearFilters.addEventListener("click", () => {
    state.search = "";
    state.type = "All";
    state.year = "2025";
    state.sort = "highest";
    state.activeId = null;
    els.searchInput.value = "";
    els.typeFilter.value = "All";
    els.yearSelect.value = "2025";
    els.sortSelect.value = "highest";
    updateDashboard();
  });

  els.resetView.addEventListener("click", () => {
    if (map) map.setView([5.065, 100.965], 11);
  });

  els.fitMarkers.addEventListener("click", () => fitToVisibleMarkers());
}

/* ============================================================
   KPI cards
   ============================================================ */
function renderKpis() {
  const totalAttractions = attractions.length;
  const total2022 = attractions.reduce((sum, site) => sum + site.visitor_2022, 0);
  const total2025 = attractions.reduce((sum, site) => sum + site.visitor_2025, 0);
  const highest2025 = attractions.reduce((top, site) => site.visitor_2025 > top.visitor_2025 ? site : top, attractions[0]);
  const averageAnnual = attractions.reduce((sum, site) => sum + site.average, 0) / totalAttractions;
  const totalGrowth = ((total2025 - total2022) / total2022) * 100;

  const cards = [
    { label: "Total Attractions", value: numberFmt.format(totalAttractions), sub: "Official sites in dataset" },
    { label: "Total Visitors in 2025", value: numberFmt.format(total2025), sub: "All attractions combined" },
    { label: "Highest 2025 Attraction", value: highest2025.site_name, sub: `${numberFmt.format(highest2025.visitor_2025)} visitors` },
    { label: "Average Annual Visitors", value: numberFmt.format(Math.round(averageAnnual)), sub: "Mean of site averages" },
    { label: "Growth 2022–2025", value: `${percentFmt.format(totalGrowth)}%`, sub: "Total visitor increase" }
  ];

  els.kpiGrid.innerHTML = cards.map(card => `
    <article class="kpi-card">
      <small>${card.label}</small>
      <strong>${card.value}</strong>
      <span class="subtext">${card.sub}</span>
    </article>
  `).join("");
}

/* ============================================================
   Leaflet interactive map
   ============================================================ */
function initializeMap() {
  if (typeof L === "undefined") {
    document.getElementById("map").innerHTML = `
      <div style="padding:24px;color:#0f3329;line-height:1.5;">
        Leaflet library cannot be loaded. Connect to the internet and open this file using Live Server.
      </div>`;
    return;
  }

  map = L.map("map", {
    center: [5.065, 100.965],
    zoom: 11,
    zoomControl: true,
    scrollWheelZoom: true
  });

  const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
  });

  const humanitarian = L.tileLayer("https://{s}.tile.openstreetmap.fr/hot/{z}/{x}/{y}.png", {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors, HOT'
  });

  osm.addTo(map);
  markerLayer = L.layerGroup().addTo(map);

  L.control.layers(
    { "OpenStreetMap": osm, "OSM Humanitarian": humanitarian },
    { "Tourist attraction points": markerLayer },
    { collapsed: false, position: "topright" }
  ).addTo(map);

  L.control.scale({ position: "bottomleft", metric: true, imperial: false }).addTo(map);

  // Important: fixes map tile rendering after the dashboard layout is calculated.
  setTimeout(() => {
    map.invalidateSize();
    fitToVisibleMarkers();
  }, 250);
}

function createPopup(site) {
  return `
    <div class="popup-title">${site.site_name}</div>
    <div class="popup-type">${site.site_type}</div>
    <div class="popup-grid">
      <span>Visitors 2022</span><strong>${numberFmt.format(site.visitor_2022)}</strong>
      <span>Visitors 2023</span><strong>${numberFmt.format(site.visitor_2023)}</strong>
      <span>Visitors 2024</span><strong>${numberFmt.format(site.visitor_2024)}</strong>
      <span>Visitors 2025</span><strong>${numberFmt.format(site.visitor_2025)}</strong>
      <span>Average</span><strong>${numberFmt.format(site.average)}</strong>
      <span>Latitude</span><strong>${site.lat.toFixed(5)}</strong>
      <span>Longitude</span><strong>${site.lon.toFixed(5)}</strong>
    </div>
  `;
}

function renderMapMarkers() {
  if (!map || !markerLayer) return;

  const data = getFilteredData();
  markerLayer.clearLayers();
  markersById = {};

  const values = data.map(site => getVisitor(site));
  const min = values.length ? Math.min(...values) : 0;
  const max = values.length ? Math.max(...values) : 1;

  data.forEach(site => {
    const visitorValue = getVisitor(site);

    // Use a Leaflet DivIcon marker instead of only SVG CircleMarker.
    // This keeps point features above the basemap tile layer and ensures popups work.
    const marker = L.marker([site.lat, site.lon], {
      icon: createTourismIcon(site, visitorValue, min, max),
      keyboard: true,
      alt: site.site_name,
      title: site.site_name,
      zIndexOffset: 1000
    });

    marker.bindPopup(createPopup(site), {
      maxWidth: 340,
      autoPan: true,
      closeButton: true
    });

    marker.on("click", () => {
      state.activeId = site.id;
      renderMapMarkers();
      renderSiteList();
      marker.openPopup();
    });

    marker.addTo(markerLayer);
    markersById[site.id] = marker;
  });

  renderLegend(min, max);
  console.log("Visible map markers rendered:", data.length, data.map(site => [site.site_name, site.lat, site.lon]));
}

function fitToVisibleMarkers() {
  if (!map) return;
  const data = getFilteredData();
  if (!data.length) return;
  const bounds = L.latLngBounds(data.map(site => [site.lat, site.lon]));
  map.invalidateSize();
  map.fitBounds(bounds.pad(0.18), { maxZoom: 14 });
}

function renderLegend(min, max) {
  const low = Math.round(min);
  const medium = Math.round((min + max) / 2);
  const high = Math.round(max);
  els.legend.innerHTML = `
    <h4>Visitor Intensity (${yearLabels[state.year]})</h4>
    <div class="legend-row"><span class="legend-symbol" style="background:#f4a261"></span> Low: ~${numberFmt.format(low)}</div>
    <div class="legend-row"><span class="legend-symbol" style="background:#52b788"></span> Medium: ~${numberFmt.format(medium)}</div>
    <div class="legend-row"><span class="legend-symbol" style="background:#0f766e"></span> High: ~${numberFmt.format(high)}</div>
  `;
}

/* ============================================================
   Sidebar list
   ============================================================ */
function renderSiteList() {
  const data = getFilteredData();
  els.recordCount.textContent = `${data.length} record${data.length === 1 ? "" : "s"}`;

  if (!data.length) {
    els.siteList.innerHTML = `<div class="small-note">No attraction found. Try clearing the filters.</div>`;
    return;
  }

  els.siteList.innerHTML = data.map(site => `
    <article class="site-card ${state.activeId === site.id ? "active" : ""}" data-id="${site.id}">
      <h3>${site.site_name}</h3>
      <p>${site.site_type}</p>
      <strong>${yearLabels[state.year]}: ${numberFmt.format(getVisitor(site))} visitors</strong>
    </article>
  `).join("");

  document.querySelectorAll(".site-card").forEach(card => {
    card.addEventListener("click", () => {
      const id = Number(card.dataset.id);
      const site = attractions.find(item => item.id === id);
      const marker = markersById[id];
      state.activeId = id;
      renderMapMarkers();
      renderSiteList();
      const activeMarker = markersById[id];
      if (map && site && activeMarker) {
        map.invalidateSize();
        map.setView([site.lat, site.lon], 15, { animate: true });
        setTimeout(() => activeMarker.openPopup(), 220);
      }
    });
  });
}

/* ============================================================
   Charts
   ============================================================ */
function renderCharts() {
  if (typeof Chart === "undefined") {
    document.querySelectorAll(".chart-wrapper").forEach(wrapper => {
      wrapper.innerHTML = `<p style="color:#66736f;line-height:1.5;">Chart.js cannot be loaded. Connect to the internet and refresh the page.</p>`;
    });
    return;
  }

  const filtered = getFilteredData();
  const labels = filtered.map(site => shortName(site.site_name));
  const values = filtered.map(site => getVisitor(site));

  const yearlyTotals = ["2022", "2023", "2024", "2025"].map(year =>
    attractions.reduce((sum, site) => sum + getVisitor(site, year), 0)
  );

  // Doughnut chart uses visitor totals by attraction, not simple type counts.
  // This makes the chart reflect which attraction receives the highest visitors.
  const visitorShareLabels = filtered.map(site => shortName(site.site_name));
  const visitorShareValues = filtered.map(site => getVisitor(site));

  if (barChart) barChart.destroy();
  if (lineChart) lineChart.destroy();
  if (pieChart) pieChart.destroy();

  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: context => `${context.dataset.label || "Value"}: ${numberFmt.format(context.raw)}`
        }
      }
    }
  };

  barChart = new Chart(document.getElementById("barChart"), {
    type: "bar",
    data: {
      labels,
      datasets: [{
        label: `Visitors (${yearLabels[state.year]})`,
        data: values,
        backgroundColor: "rgba(15, 118, 110, 0.72)",
        borderColor: "#0f3329",
        borderWidth: 1,
        borderRadius: 8
      }]
    },
    options: {
      ...commonOptions,
      plugins: { ...commonOptions.plugins, legend: { display: false } },
      scales: {
        x: { ticks: { maxRotation: 35, minRotation: 0 } },
        y: { beginAtZero: true, ticks: { callback: value => numberFmt.format(value) } }
      }
    }
  });

  lineChart = new Chart(document.getElementById("lineChart"), {
    type: "line",
    data: {
      labels: ["2022", "2023", "2024", "2025"],
      datasets: [{
        label: "Total Visitors",
        data: yearlyTotals,
        borderColor: "#0f766e",
        backgroundColor: "rgba(15, 118, 110, 0.14)",
        fill: true,
        tension: 0.35,
        pointRadius: 5,
        pointBackgroundColor: "#0f766e"
      }]
    },
    options: {
      ...commonOptions,
      plugins: { ...commonOptions.plugins, legend: { display: true, position: "bottom" } },
      scales: { y: { beginAtZero: true, ticks: { callback: value => numberFmt.format(value) } } }
    }
  });

  pieChart = new Chart(document.getElementById("pieChart"), {
    type: "doughnut",
    data: {
      labels: visitorShareLabels,
      datasets: [{
        label: `Visitor Share (${yearLabels[state.year]})`,
        data: visitorShareValues,
        backgroundColor: ["#0f766e", "#d97706", "#52b788", "#8e44ad", "#c0392b"],
        borderColor: "#ffffff",
        borderWidth: 2
      }]
    },
    options: {
      ...commonOptions,
      plugins: {
        ...commonOptions.plugins,
        legend: { display: true, position: "bottom" },
        tooltip: {
          callbacks: {
            label: context => {
              const total = context.dataset.data.reduce((sum, value) => sum + value, 0);
              const percent = total ? ((context.raw / total) * 100).toFixed(1) : "0.0";
              return `${context.label}: ${numberFmt.format(context.raw)} visitors (${percent}%)`;
            }
          }
        }
      },
      cutout: "58%"
    }
  });
}

/* ============================================================
   Ranking table and insights
   ============================================================ */
function renderRankingTable() {
  const ranked = [...attractions].sort((a, b) => b.visitor_2025 - a.visitor_2025);
  els.rankingTable.innerHTML = ranked.map((site, index) => `
    <tr>
      <td>${index + 1}</td>
      <td><strong>${site.site_name}</strong></td>
      <td>${site.site_type}</td>
      <td>${numberFmt.format(site.visitor_2025)}</td>
      <td>${numberFmt.format(site.average)}</td>
      <td>${percentFmt.format(getGrowth(site))}%</td>
    </tr>
  `).join("");
}

function renderInsights() {
  const highestAverage = attractions.reduce((top, site) => site.average > top.average ? site : top, attractions[0]);
  const strongestGrowth = attractions.reduce((top, site) => getGrowth(site) > getGrowth(top) ? site : top, attractions[0]);
  const filtered = getFilteredData();
  const lowestSelected = filtered.reduce((low, site) => getVisitor(site) < getVisitor(low) ? site : low, filtered[0] || attractions[0]);

  els.insightContent.innerHTML = `
    <p><strong>${highestAverage.site_name}</strong> records the highest average visitors, with about ${numberFmt.format(highestAverage.average)} visitors annually.</p>
    <p><strong>${strongestGrowth.site_name}</strong> shows the strongest growth from 2022 to 2025, increasing by ${percentFmt.format(getGrowth(strongestGrowth))}%.</p>
    <p>For the selected year/filter, the lowest visitor attraction is <strong>${lowestSelected.site_name}</strong> with ${numberFmt.format(getVisitor(lowestSelected))} visitors.</p>
  `;
}

/* ============================================================
   Full dashboard render cycle
   ============================================================ */
function updateDashboard() {
  renderKpis();
  renderMapMarkers();
  renderSiteList();
  renderCharts();
  renderRankingTable();
  renderInsights();
  els.selectedYearLabel.textContent = `Selected year: ${yearLabels[state.year]}`;
}

async function initializeDashboard() {
  cacheElements();
  const loadedFromSupabase = await loadSupabaseIfConfigured();
  if (!loadedFromSupabase) {
    await loadCsvIfAvailable();
    if (!isSupabaseConfigured()) setDataSourceStatus("Data source: Local CSV / fallback data", false);
  }
  populateTypeFilter();
  bindEvents();
  initializeMap();
  updateDashboard();
  setTimeout(() => fitToVisibleMarkers(), 350);
  console.log("Lenggong Web GIS Dashboard loaded successfully.");
}

document.addEventListener("DOMContentLoaded", initializeDashboard);
