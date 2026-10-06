
# ✨Lecture-Run✨
## 🚀 Live Application

**[Open Lecture-Run](https://lecturerunner-c091q61ub-harshdakhare4s-projects.vercel.app/)**
## Features

- Manually enter total lecture duration.
- Manually choose any number of checkpoints.
- Checkpoint positions can be any duration:
  - `00:02`
  - `00:05`
  - `00:15`
  - `00:45`
  - `01:23`
  - `01:30`
- Manually enter the expected clock time for every checkpoint.
- Press **Crossed** to record the actual arrival time.
- Automatically calculates:
  - Minutes of lecture covered
  - Expected arrival
  - Actual arrival
  - Minutes early
  - Minutes late
  - On-time status
  - Overall progress
  - Projected completion time
- Fully responsive.
- No frameworks, packages, or backend required.

## Run Locally

Open `index.html` directly in a browser.

For a local development server:

```bash
python -m http.server 8000
```

Then visit:

`http://localhost:8000`

## Deploy

The folder can be deployed directly to any static hosting service.

### GitHub Pages

1. Create a GitHub repository.
2. Upload `index.html`, `style.css`, and `script.js`.
3. Open **Repository Settings → Pages**.
4. Select the branch and root folder.
5. Save.

### Netlify

Drag the project folder into Netlify's deploy area.

### Vercel

Import the repository into Vercel. No build command is required.

## Important Behavior

The application does **NOT** automatically calculate expected arrival times.

You decide them manually.

Example:

**Lecture duration:** `01:30`

| Lecture position | Expected arrival |
|---|---|
| 00:15 | 10:20 |
| 00:45 | 10:42 |
| 01:23 | 11:05 |
| 01:30 | 11:12 |

When you press **Crossed** at 10:23 for the first stop, the application records:

- **Actual arrival:** 10:23
- **Expected arrival:** 10:20
- **Status:** 3 min late
"""

path = Path("/mnt/data/README.md")
path.write_text(readme, encoding="utf-8")
print(f"Created: {path}")
