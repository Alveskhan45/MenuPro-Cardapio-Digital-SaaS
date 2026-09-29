---
name: Shared demo data ownership
description: Ownership safeguards when moving the MenuPro demo restaurant into user-scoped administration.
---

Do not automatically transfer ownerless shared demo restaurant data to the first authenticated Clerk user.

**Why:** Orders and customer records include personal information; first-signup ownership could expose another restaurant's private data.

**How to apply:** Keep ownerless demo records inaccessible from authenticated administration unless the user confirms which account owns them and an explicit migration is performed.