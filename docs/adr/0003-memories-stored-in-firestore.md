# Memories are stored in Firestore, not Cloud Storage

Since 2024–26 Cloud Storage for Firebase requires the paid Blaze plan (a card on file, and no hard spending cap for Storage), which breaks the "free, no card" rule in ADR-0001. So each Memory is shrunk in the browser to a JPEG of roughly 150–250 KB and kept as one Firestore document of its own, exempt from indexing and outside any live-updating list. The free 1 GiB holds roughly 3,000–5,000 Memories; if they ever outgrow that, moving to Blaze + Cloud Storage is the way out.
