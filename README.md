# FinStat - Expense Tracker

Local development with Docker (Postgres + API + Web UI).

## Prerequisites
- Docker Desktop

## Quick start

```bash
# From repo root
docker compose up --build
```

- Web UI: http://localhost:5173
- API: http://localhost:4000/api/health
- Postgres: localhost:5432 (user: finstat / pass: finstat / db: finstat)

On first start the backend runs Prisma migrate deploy. To seed categories and subcategories:

```bash
# in another terminal
docker compose exec backend npm run seed
```

## Notes
- The transactions table shows total as (debit - credit).
- Choose Category and Subcategory via dropdowns or the Browse modal.
- Update `.env` or compose as needed for production. No auth included for home use. 
## Auto Location Feature

The FinStat application now includes an automatic location detection feature that helps users remember where they spent their money by pinpointing the exact shop location.

### Features

- **GPS Location Detection**: Automatically captures your current GPS coordinates when adding transactions
- **Reverse Geocoding**: Converts coordinates to human-readable addresses using OpenStreetMap's Nominatim API
- **Google Maps Integration**: Click on location data in transaction history to view the exact location on Google Maps
- **Privacy-First**: No API keys required, uses free OpenStreetMap services
- **Error Handling**: Graceful fallback when location services are unavailable or denied

### How to Use

1. When adding a new transaction, click the "📍 Auto Location" button
2. Grant location permission when prompted by your browser
3. The app will automatically fill in the location field with your current address
4. In the transaction history, click on location data to open it in Google Maps

### Browser Compatibility

- Works on all modern browsers that support the Geolocation API
- Requires HTTPS for location access (automatically handled in production)
- Mobile-friendly with responsive design

### Privacy & Security

- Location data is stored locally in your database
- No location data is sent to external services except for reverse geocoding
- You can manually edit or clear location data at any time
- Location permission can be revoked through browser settings
