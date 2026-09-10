# The School of Social Development — Bodgaun Portal

School management website for **Indrawati Rural Municipality Ward 11, Bodgaun, Sindhupalchowk**.

## Features

**Public site**
- Home, About, Programs, Activities, Team

**Staff portal (`/admin`)**
- Students CRUD
- Teachers CRUD
- Staff CRUD
- Daily staff & teacher attendance
- School activities (with photo upload)
- Programs management
- School information

## Run locally

```bash
cd school-portal
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

Admin login: [http://localhost:3000/admin](http://localhost:3000/admin)

- Username: `admin`
- Password: `bodgaun2024`

Change password with env vars:

```bash
ADMIN_PASSWORD=your-secure-password
ADMIN_SECRET=long-random-string
```

## Data storage

All school data is stored in `data/school.json`. Activity photos go to `public/uploads/`.

## Stack

Next.js (App Router) · TypeScript · Tailwind CSS · JSON file database
