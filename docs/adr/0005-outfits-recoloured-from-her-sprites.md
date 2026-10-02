# Outfits are recoloured in the browser from Pratiksha's sprites

The wardrobe had to ship before any new outfit art existed, and her sprites are small paintings (about 10,000 colours each), not palette pixel art, so a simple colour swap was impossible. `js/wardrobe.js` instead finds each clothing item by its colour family inside a body band, keeps only the large connected patches, grows into the antialiased edges, and repaints them following the original light and shadow. The rules are tuned to these exact sprites: if a sprite is redrawn, its rules (or the laptop exclusion box) may need retuning, and in shared Pair-moment pictures Anubhav's dark trousers are left alone because they are the same colours as his hair.

## Consequences

When Pratiksha draws real outfits (see `docs/sprite-wishlist.md`), they should replace recolouring for those outfits rather than be layered on top of it.
