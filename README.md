# Tourist Attractions Dashboard in Lenggong Geopark

This Web GIS dashboard was developed to display tourist attraction locations, annual visitor statistics, and simple analytical information for selected attractions in Lenggong Geopark, Perak. It combines an interactive map, KPI cards, filters, charts, a ranking table, and automatically generated insights within a single interface.

## Technologies Used

- HTML5 for the page structure.
- CSS3 for styling, responsive layouts, and component design.
- JavaScript for data processing and user interaction.
- Leaflet for Web GIS mapping functions.
- OpenStreetMap as the main basemap.
- Chart.js for the bar, line, and doughnut charts.
- Supabase for the database structure and online data access.
- CSV as a local data source and fallback mechanism.

---

## Workflow + Explanation

### 1. Project file structure

| File | Function |
|---|---|
| `index.html` | Defines the dashboard structure, including the KPI cards, filter panel, map, charts, ranking table, and insight section. |
| `style.css` | Controls the colours, typography, layout, map symbols, buttons, and responsive interface. |
| `script.js` | Handles data loading, KPI calculations, filtering, mapping, chart generation, ranking, and user interaction. |
| `Data_Official_Lenggong.csv` | Stores attraction names, attraction types, visitor records from 2022 to 2025, averages, and coordinates. |
| `supabase_setup.sql` | Creates the `tourist_attractions` table, inserts the records, and establishes a public read-only access policy. |

### 2. Data preparation

Each attraction record contains the following fields:

- `id`
- `site_name`
- `site_type`
- `visitor_2022`
- `visitor_2023`
- `visitor_2024`
- `visitor_2025`
- `average`
- `lat`
- `lon`

The visitor fields are used to generate the KPI values, charts, rankings, and proportional map symbols. The `lat` and `lon` fields determine the geographical position of each marker on the map.

### 3. Data-loading workflow

When the page finishes loading, the `DOMContentLoaded` event runs `initializeDashboard()`. This function collects the required HTML elements, loads the data, creates the filters, binds the user events, initialises the map, and renders the full dashboard.

The system is designed with three levels of data availability:

1. Data is requested from the Supabase table when the project URL and public key are correctly configured.
2. If Supabase is unavailable, the system attempts to read `Data_Official_Lenggong.csv`.
3. If the CSV file cannot be loaded, the system uses the records stored in `FALLBACK_ATTRACTIONS`.

The complete workflow can be summarised as follows:

```text
Supabase / CSV / fallback data
             ↓
   Validation and normalisation
             ↓
       attractions array
             ↓
    Calculation and filtering
             ↓
KPI + map + list + charts + table + insights
```

### 4. Data cleaning and normalisation

The `normalizeAttractionRow()` function standardises every record before it is used by the dashboard. Visitor values are passed through `toNumber()`, which removes commas from values such as `"31,682"` and converts them into numbers. This step prevents the dashboard from treating visitor values as text.

If an average is not supplied, it is calculated automatically:

```javascript
const computedAverage = Math.round(
  (visitor2022 + visitor2023 + visitor2024 + visitor2025) / 4
);
```

Records with invalid coordinates are excluded from the mapped dataset. The cleaned records are then stored in the `attractions` array, which acts as the central data source for all dashboard components.

### 5. Web GIS map production

The `initializeMap()` function creates a Leaflet map centred on Lenggong. OpenStreetMap is used as the default basemap, while OSM Humanitarian is provided as an alternative layer.

The `renderMapMarkers()` function reads the coordinates of each attraction and creates its marker. Marker size and colour are determined by the visitor value for the selected year:

- A small orange marker represents a relatively low visitor value.
- A medium green marker represents a moderate visitor value.
- A large dark-green marker represents a relatively high visitor value.

Each marker contains a popup showing the attraction name, attraction type, visitor values from 2022 to 2025, annual average, latitude, and longitude. The `Reset View` button returns the map to its original position, while `Fit Markers` adjusts the map extent to include all currently visible markers.

### 6. Filtering and user interaction

The user's current selections are stored in the `state` object:

```javascript
const state = {
  search: "",
  type: "All",
  year: "2025",
  sort: "highest",
  activeId: null
};
```

Users can search by attraction name, filter by attraction type, select a visitor year, change the sorting method, and clear all filters. Every change calls `updateDashboard()`, allowing the relevant components to update without reloading the webpage.

```javascript
function updateDashboard() {
  renderKpis();
  renderMapMarkers();
  renderSiteList();
  renderCharts();
  renderRankingTable();
  renderInsights();
}
```

The map, attraction list, bar chart, doughnut chart, and legend respond to the selected filters. The headline KPI cards, overall trend chart, and 2025 ranking table remain overall summaries of the complete dataset.

---

## Generated UI + Explanation

### 1. Dashboard header

The header displays the project title, a short description, and the study location. Dark green and teal were selected to represent nature, geotourism, and the geopark environment.

### 2. KPI cards

Five KPI cards are positioned at the top of the dashboard so users can quickly understand the overall dataset. They display:

- The total number of attractions.
- The total number of visitors in 2025.
- The attraction with the highest number of visitors in 2025.
- The mean annual visitor value per attraction.
- The overall growth in visitors from 2022 to 2025.

The current dataset produces the following results:

| KPI | Value |
|---|---:|
| Total attractions | 5 |
| Total visitors in 2025 | 73,138 |
| Highest 2025 attraction | Galeri Arkeologi Lembah Lenggong |
| Visitors to the highest-ranked attraction | 31,682 |
| Mean annual visitors per attraction | 10,723 |
| Overall growth from 2022 to 2025 | 158.3% |

### 3. Filter panel and attraction list

The left panel contains a name search, an attraction-type filter, a year selector, and a sorting control. It also displays the current number of records. Selecting an attraction card zooms the map to the corresponding marker and opens its spatial information.

### 4. Interactive map

The map is the main spatial component of the dashboard. Users can zoom, pan, change the basemap, select markers, and read the marker popups. A legend explains the marker colours, sizes, and visitor-intensity levels for the selected year.

### 5. Analytical charts

The dashboard generates three charts:

- The bar chart compares visitor numbers among attractions for the selected year.
- The line chart shows the change in total visitors from 2022 to 2025.
- The doughnut chart shows each attraction's share of visitors for the selected year.

The annual visitor totals are:

| Year | Total visitors |
|---|---:|
| 2022 | 28,317 |
| 2023 | 51,055 |
| 2024 | 61,948 |
| 2025 | 73,138 |

### 6. Ranking table and insights

The ranking table orders the attractions according to their 2025 visitor numbers. It also displays the attraction type, annual average, and percentage growth from 2022 to 2025. The insight panel automatically identifies the attraction with the highest average, the strongest growth, and the lowest visitor value under the current filter.

### 7. Application of UI design principles

#### Visibility

The data-source status, record count, selected year, and main controls are clearly displayed. Users can identify the current condition of the dashboard and understand which data is being presented.

#### Consistency

Colours, typography, cards, spacing, shadows, and button styles are applied consistently throughout the interface. Primary actions use teal, while map controls use dark green.

#### Feedback

The dashboard responds immediately when a filter changes. The list, markers, legend, and charts update without refreshing the page. A selected attraction card receives an active style, and the map zooms to the corresponding location.

#### Affordance

Buttons, dropdown menus, the search field, and attraction cards are styled so that their interactive functions are recognisable. The map marker uses a pin-like shape to indicate a geographical location.

#### Mapping

Marker size and colour are directly mapped to visitor numbers. Selecting a year changes the values represented by the map, list, and relevant charts. The legend explains the relationship between each symbol and its visitor-intensity category.

### 8. Responsive design and accessibility

CSS media queries reorganise the dashboard for tablets and mobile devices. The KPI cards, filter panel, map, and charts change to a single-column layout on smaller screens. The HTML also includes `aria-label` attributes, input labels, and marker alternative text to improve structural accessibility.

---

## Coding + Explanation

### 1. Connection between the table, JavaScript, and KPI cards

Records obtained from the Supabase table or CSV file are cleaned and stored in the `attractions` array:

```javascript
attractions = parsed;
```

The `renderKpis()` function reads this array. The `reduce()` method is used to total the visitor fields:

```javascript
const total2022 = attractions.reduce(
  (sum, site) => sum + site.visitor_2022, 0
);

const total2025 = attractions.reduce(
  (sum, site) => sum + site.visitor_2025, 0
);
```

The highest-ranked attraction is identified by comparing the `visitor_2025` value of every record:

```javascript
const highest2025 = attractions.reduce(
  (top, site) =>
    site.visitor_2025 > top.visitor_2025 ? site : top,
  attractions[0]
);
```

Overall visitor growth is calculated as follows:

```javascript
const totalGrowth =
  ((total2025 - total2022) / total2022) * 100;
```

The calculated results are stored in the `cards` array before being inserted into the `kpiGrid` HTML element:

```javascript
els.kpiGrid.innerHTML = cards.map(card => `
  <article class="kpi-card">
    <small>${card.label}</small>
    <strong>${card.value}</strong>
    <span class="subtext">${card.sub}</span>
  </article>
`).join("");
```

The KPI connection can therefore be summarised as follows:

```text
tourist_attractions table / CSV file
                  ↓
      normalizeAttractionRow()
                  ↓
          attractions array
                  ↓
            renderKpis()
                  ↓
           #kpiGrid element
```

### 2. Mapping data fields to UI components

| UI component | Data or function used |
|---|---|
| Total attractions | `attractions.length` |
| Total visitors in 2025 | Sum of `visitor_2025` |
| Highest 2025 attraction | Comparison of all `visitor_2025` values |
| Mean annual visitors | Sum of `average` divided by the number of attractions |
| Overall growth | Change in total visitors from 2022 to 2025 |
| Map marker | `lat`, `lon`, and the selected year's visitor value |
| Map popup | Name, type, visitor values, average, and coordinates |
| Bar chart | Visitor values by attraction and selected year |
| Line chart | Total visitor numbers from 2022 to 2025 |
| Doughnut chart | Visitor share by attraction |
| Ranking table | Descending order of `visitor_2025` |
| Insights | Highest average, strongest growth, and lowest filtered value |

### 3. Filter coding

The `getFilteredData()` function filters the records according to the attraction name and type:

```javascript
const matchesSearch = site.site_name
  .toLowerCase()
  .includes(state.search.toLowerCase());

const matchesType =
  state.type === "All" || site.site_type === state.type;
```

The filtered data is then sorted by the highest visitor value, lowest visitor value, or alphabetical order. Each control has an event listener that updates the `state` object before running `updateDashboard()`.

### 4. Marker and popup coding

Markers are created from the latitude and longitude of each attraction:

```javascript
const marker = L.marker([site.lat, site.lon], {
  icon: createTourismIcon(site, visitorValue, min, max),
  keyboard: true,
  alt: site.site_name,
  title: site.site_name
});
```

`createTourismIcon()` determines marker size and colour from the selected visitor value. `createPopup()` generates the information displayed when a marker is selected.

### 5. Chart coding

Chart.js is used to generate the bar, line, and doughnut charts. Existing chart objects are destroyed before replacement charts are created, preventing duplicated canvas content and unnecessary memory use:

```javascript
if (barChart) barChart.destroy();
if (lineChart) lineChart.destroy();
if (pieChart) pieChart.destroy();
```

The bar and doughnut charts use the filtered records. The line chart uses the complete dataset so that the overall annual trend remains unchanged when a single attraction is searched or selected.

### 6. Ranking-table and insight coding

The ranking table sorts the attractions according to their 2025 visitor values:

```javascript
const ranked = [...attractions].sort(
  (a, b) => b.visitor_2025 - a.visitor_2025
);
```

The percentage growth of each attraction is calculated using:

```javascript
function getGrowth(site) {
  return (
    (site.visitor_2025 - site.visitor_2022) /
    site.visitor_2022
  ) * 100;
}
```

The `renderInsights()` function uses similar comparison logic to generate automatic statements about attraction performance.

### 7. Security and failure handling

Row Level Security is enabled in Supabase. The supplied policy allows public users to perform `SELECT` operations but does not give them permission to modify or delete records.

If Supabase, the CSV file, or an external library cannot be loaded, the application uses its fallback data or displays an error message. Coordinates are also checked before markers are generated, preventing invalid location records from disrupting the map.

---

## Running the Project

1. Ensure that the project files are named `index.html`, `style.css`, `script.js`, `Data_Official_Lenggong.csv`, and `supabase_setup.sql`.
2. Open the project folder in Visual Studio Code.
3. Run `index.html` through Live Server so the CSV file can be requested through HTTP.
4. Ensure that an internet connection is available to load Leaflet, Chart.js, Supabase JS, and OpenStreetMap tiles.
5. To use Supabase, run `supabase_setup.sql` in the Supabase SQL Editor and enter the correct project URL and public key in `SUPABASE_CONFIG`.

## Data Source

The dashboard uses official visitor records for five selected attractions in Lenggong Geopark from 2022 to 2025, together with each attraction's category and geographical coordinates.
