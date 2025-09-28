# Publishing (VS Code Marketplace)

This guide covers packaging and publishing the extension to the Visual Studio Code Marketplace.

## Prerequisites
- Node.js and npm
- `vsce` (VS Code Extension Manager)
- A Marketplace publisher (e.g., `antpavlenko`) with a Personal Access Token (PAT)

### Install vsce
```bash
npm install -g @vscode/vsce
```

### Create / Use a Publisher
- Sign in at https://marketplace.visualstudio.com/manage
- Create a Publisher if you don't have one
- Ensure `publisher` in `package.json` matches your Publisher ID (currently `antpavlenko`)

### Create a Personal Access Token (PAT)
- Create a PAT with Marketplace scopes (Publish, Manage)
- Set it as an environment variable when publishing: `VSCE_PAT`

## Package
Creates a signed .vsix locally.
```bash
vsce package
```

## Publish
Publishes the current version in `package.json`. Bump the version before publishing.
```bash
# Ensure VSCE_PAT is set in your shell
export VSCE_PAT=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
vsce publish
```

To publish a specific version:
```bash
vsce publish 1.0.0
```

## Assets
- Icon: `media/taiga-emblem-mono-black-256.png` (set in package.json)
- Activity bar icon: `media/taiga-emblem-dark.svg`
- Webview tab icons: light/dark SVGs (referenced in editors’ HTML)
- Screenshots/GIFs (optional but recommended): place in `media/screenshots/`

## Marketplace Listing Tips
- Description: Short summary + highlights
- Keywords: taiga, agile, project management, epics, stories, tasks, issues, mcp
- Categories: Other
- Banner: set `galleryBanner` in `package.json` (done)
- Links: repository, issues, homepage (done)

## Verification Checklist
- [ ] Build succeeds: `npm run build`
- [ ] Extension activates and connects to a Taiga instance
- [ ] CRUD in editors works (Epics, Stories, Tasks, Issues)
- [ ] Trees show correct filtering and double‑click opens
- [ ] Dark/Light themes render correctly; date inputs visible
- [ ] README and CHANGELOG updated
- [ ] Version bumped in `package.json`

## Troubleshooting
- `Cannot find publisher` → ensure `publisher` matches your Marketplace Publisher ID
- `You do not have access` → PAT scopes or publisher membership
- `Icon not found` → verify path in `package.json` and included files in repo
- `vsce package` excludes files` → add a `.vscodeignore` if needed to omit large or dev folders
