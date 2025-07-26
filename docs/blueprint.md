# **App Name**: FiberVision

## Core Features:

- GIS Network Visualizer: Display all network elements (OLTs, ONUs, switches, clients, poles) and fiber paths on a map using Leaflet.js.
- Real-Time GPS Tracking: Track technician GPS coordinates in real-time using the HTML5 Geolocation API. Update technician locations on the map every 30 seconds.
- Geo-fenced Attendance: Implement geo-fencing to allow technician check-in only within 100m of the assigned job site. Record check-in/check-out times and location.
- Field Photo Upload: Allow technicians to upload photos as proof of work, capturing location and timestamp data with each image. Geotag, and display with task info.
- Task Assignment & Status: Enable assignment of tasks to technicians with details of the fiber ID, pole ID, and device type. Allow technicians to update the task status.
- Automated Fault Detection: Run regular network device pings to detect offline devices (ONTs, switches). The tool then creates alerts, assigns the closest available tech, and visualizes the issues on the map.
- Materials in/out tracker: Enable supervisors to issue materials required for assigned tasks (quantities, images etc). Use a tool to analyze photo upload from tech after a job, showing items used.

## Style Guidelines:

- Primary color: Medium blue (#4285F4) for trustworthiness and reliability.
- Background color: Light gray (#F5F5F5), providing a clean and neutral backdrop.
- Accent color: Teal (#009688) to highlight important actions and status indicators.
- Font pairing: 'Space Grotesk' (sans-serif) for headlines and 'Inter' (sans-serif) for body text, for a modern and readable style.
- Use consistent and clear icons to represent network devices and statuses. Icons should be easily recognizable and scalable.
- Employ a mobile-first, responsive layout, ensuring the application is accessible and functional across various devices and screen sizes.
- Implement subtle transitions and animations for map updates and status changes to improve user engagement without being distracting.