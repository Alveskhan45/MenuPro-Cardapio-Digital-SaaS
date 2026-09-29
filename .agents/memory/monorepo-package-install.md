---
name: Package installation in the monorepo
description: Installing dependencies into the correct leaf package in this pnpm workspace.
---

When a package belongs to one artifact, declare it in that artifact rather than at the workspace root.

**Why:** The Replit package-install helper attempted a root-level `pnpm add` and failed with `ERR_PNPM_ADDING_TO_ROOT`; leaf artifacts must declare their own dependencies.

**How to apply:** If the helper targets the workspace root, install the package with `pnpm --filter @workspace/<artifact> add <package>`.