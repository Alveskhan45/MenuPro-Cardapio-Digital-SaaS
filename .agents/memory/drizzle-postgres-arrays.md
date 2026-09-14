---
name: Drizzle PostgreSQL arrays
description: Reliable filtering by a dynamic list of IDs in the workspace's Drizzle/PostgreSQL setup.
---

Use Drizzle's `inArray(column, values)` for dynamic ID lists. Interpolating a JavaScript array into a raw `ANY` SQL expression can bind as a scalar parameter and fail at runtime.

**Why:** The public order flow exposed this driver-specific failure only when resolving selected product IDs.

**How to apply:** Prefer `inArray` in route queries that resolve product, category, order, or customer ID lists; verify the endpoint with a real request after rebuilding the API.