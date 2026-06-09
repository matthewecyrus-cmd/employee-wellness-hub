# Employee Wellness Hub - Manus Exit Plan

## The Short Version

You do not need Manus to keep this alive.

This repository now contains a Manus-free static website version at the repository root:

- `index.html` is the public wellness hub.
- `hub-admin-editor.html` is the monthly editor.
- `.nojekyll` tells GitHub Pages to serve the files as plain static files.

There is no MySQL database in this version. There is no Manus OAuth login in this version. There is no Manus hosting requirement in this version.

## Site URL

Once GitHub Pages is enabled, the site should live at:

https://matthewecyrus-cmd.github.io/employee-wellness-hub/

The editor will live at:

https://matthewecyrus-cmd.github.io/employee-wellness-hub/hub-admin-editor.html

## Turn On GitHub Pages

1. Open the repository on GitHub.
2. Go to **Settings**.
3. Go to **Pages** in the left sidebar.
4. Under **Build and deployment**, set **Source** to **Deploy from a branch**.
5. Set the branch to `main`.
6. Set the folder to `/root`.
7. Save.

GitHub may take a few minutes to publish.

## How Updates Work After That

The editor can update `index.html` in GitHub using a GitHub token. That means your ongoing dependency is GitHub, not Manus.

If you want zero online editor/token complexity, you can also edit `index.html` manually and upload it through GitHub's website.

## What Manus Was Half-Right About

The larger Node app in this repository uses a server, Manus-style environment variables, and a MySQL database. If you wanted that exact backend app preserved, then yes, you would need a backend host such as Render, Railway, or a VPS.

But for the wellness hub as a public mobile page with calendar links and monthly content, the static version is enough and much simpler.
