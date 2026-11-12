# Project Prompts Log

This document records the prompt sequence used to construct the **ParkSG Live / CargoWhere** Singapore real-time carpark availability application and its serverless backend integration.

---

### Prompt 1: Initial Frontend Application Build
> **Prompt:**  
> "build a singapore based carpark application that tracks real time carpark lots availability. build just the frontend for now, i will integrate the backend later."

**Outcome & Delivered Scope:**
- Built full React + Vite + Tailwind CSS frontend tracking real-time carpark availability across Singapore.
- Embedded local offline dataset covering **2,283 Singapore carparks** (HDB, URA, and major shopping malls) with SVY21-to-WGS84 converted coordinates, structure types, gantry clearance heights, rates, and EV charging facilities.
- Integrated Leaflet interactive map with custom lot count pins (>20 green, 1–20 amber, 0 red), popups, and district quick jumps (Orchard, Marina Bay, Bugis, Jurong East, Tampines, Woodlands).
- Implemented multi-criteria search, vehicle type switcher (Cars, Motorcycles, Heavy vehicles), amenities filters, fee estimator, 24-hour hourly trend charts, local favorites storage, and Singapore driver rules handbook.

---

### Prompt 2: Remote Git Push to GitHub
> **Prompt:**  
> "git push https://[REDACTED_GH_TOKEN]@github.com/annytan3321-arch/cargowhere.git"  
> *(Note: Personal access token redacted for security)*

**Outcome & Delivered Scope:**
- Initialized local git repository on the `main` branch.
- Configured git author metadata and committed all 22 project files.
- Pushed initial commit (`0ff5809`) to remote repository `https://github.com/annytan3321-arch/cargowhere.git`.

---

### Prompt 3: LTA DataMall Connection Request (Initial)
> **Prompt:**  
> "add a serverless connection that pulls live data from LTA's datamall using the following endpoint:"

**Outcome & Delivered Scope:**
- Identified requirement to connect with Singapore Land Transport Authority (LTA) DataMall CarParkAvailabilityv2 API.

---

### Prompt 4: Serverless LTA DataMall Connection Specification
> **Prompt:**  
> "1. add a serverless connection that pulls live data from LTA's datamall using the following endpoint:  
> 
> \# Live carpark lots (HDB, LTA and URA):  
> https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2  
> 
> \# Every request needs the header:  AccountKey: <LTA_ACCOUNT_KEY>  
> 
> 2. store this in /api folder at project root level (not the src file)  
> 3. include /health.ts and /carparkavailability.ts within the same sub folder  
> 4. do not hardcode any key, i will input them later"

**Outcome & Delivered Scope:**
- Created root-level `/api` folder with:
  - `/api/carparkavailability.ts`: Serverless route handler querying `https://datamall2.mytransport.sg/ltaodataservice/CarParkAvailabilityv2` with `AccountKey: <LTA_ACCOUNT_KEY>` header, pagination handling (`$skip=500`), 45-second memory caching, and fallback support.
  - `/api/health.ts`: Diagnostic endpoint verifying service uptime and checking whether `LTA_ACCOUNT_KEY` is present.
- Updated `server.ts` to mount these route handlers at `/api/carparkavailability` and `/api/health`.
- Documented `LTA_ACCOUNT_KEY` in `.env.example` without hardcoding any keys.
- Committed and pushed changes (`91fe3bd`) to GitHub.

---

### Prompt 5: Collate Prompts Documentation
> **Prompt:**  
> "collate all of the prompts and store them as a PROMPTS.md file"

**Outcome & Delivered Scope:**
- Created `/PROMPTS.md` containing the complete chronological history, prompt texts, and feature outcomes.
