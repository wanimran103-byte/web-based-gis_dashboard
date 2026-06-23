# Tourist Attractions Dashboard in Lenggong Geopark

A Web-Based GIS dashboard for visualising tourist attraction points, visitor statistics, trends and simple spatial exploration in Lenggong Geopark, Perak.

## Main Features

- Interactive Leaflet map with OpenStreetMap basemap
- Coordinate-based tourist attraction point markers
- Marker popup attribute information
- Search by attraction name
- Filter by attraction type
- Visitor year selector: 2022, 2023, 2024, 2025 and Average
- Visitor intensity legend
- Reset View and Fit Markers controls
- KPI cards
- Bar chart, line chart and visitor-share donut chart
- Ranking table
- Insight section
- Supabase database-ready setup with CSV/fallback support

## Files

- `index.html` - main dashboard page
- `style.css` - dashboard and map styling
- `script.js` - data loading, Supabase connection, map, filters, charts and insights
- `Data_Official_Lenggong.csv` - local official dataset fallback
- `supabase_setup.sql` - SQL table, sample data and read-only policy for Supabase

## How to Run Locally

1. Extract the ZIP file.
2. Open the folder in Visual Studio Code.
3. Install the Live Server extension.
4. Right click `index.html`.
5. Select **Open with Live Server**.

Internet connection is required because Leaflet, OpenStreetMap tiles, Chart.js and Supabase JS are loaded from CDN.

## Supabase Database Setup

The dashboard can run in two modes:

1. **Supabase database mode** - reads attraction data from Supabase table `tourist_attractions`.
2. **Local fallback mode** - uses `Data_Official_Lenggong.csv` or built-in fallback data if Supabase is not configured.

### Step 1: Create Supabase Project

Create a new project in Supabase.

### Step 2: Run SQL

Open **SQL Editor** in Supabase and run the content of `supabase_setup.sql`.

This will create the table:

```sql
public.tourist_attractions
```

and insert the five Lenggong attraction records.

### Step 3: Get API Keys

Go to:

```text
Project Settings > API
```

Copy:

- Project URL
- anon public key

### Step 4: Update `script.js`

Open `script.js` and replace:

```js
const SUPABASE_CONFIG = {
  url: "PASTE_YOUR_SUPABASE_PROJECT_URL_HERE",
  anonKey: "PASTE_YOUR_SUPABASE_ANON_KEY_HERE",
  table: "tourist_attractions"
};
```

with your real Supabase URL and anon key.

### Step 5: Refresh Dashboard

Run the dashboard again using Live Server.

If connected successfully, the filter panel will show:

```text
Data source: Supabase database (5 records)
```

If Supabase is not configured or fails, the dashboard will still work using the local CSV/fallback dataset.

## Database Table Structure

| Column | Type | Description |
|---|---|---|
| id | bigint | Primary key |
| site_name | text | Tourist attraction name |
| site_type | text | Attraction category/type |
| visitor_2022 | integer | Visitor count for 2022 |
| visitor_2023 | integer | Visitor count for 2023 |
| visitor_2024 | integer | Visitor count for 2024 |
| visitor_2025 | integer | Visitor count for 2025 |
| average | integer | Average annual visitors |
| lat | numeric | Latitude |
| lon | numeric | Longitude |
| created_at | timestamp | Record creation time |

## Security Note

The dashboard only needs public read access. Do not expose the Supabase service role key in browser code. Use only the anon public key with a Row Level Security policy that allows SELECT access.
