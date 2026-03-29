# Task: Replace hardcoded speed with real Supabase data

## TODO Steps (Approved Plan)

- [x] Step 1: Update app/api/products/route.js to compute and return `speed` for each product (avg daily exports from stock_movements, last 30 days)
- [x] Step 2: Update app/page.tsx to display dynamic `p.speed` instead of hardcoded "15.5 items/day"
- [x] Step 3: Test the changes (restart dev server, verify real speeds display)
- [ ] Step 4: Complete task

**Status:** ✅ All changes implemented and tested. Speed now fetches real avg daily exports from Supabase stock_movements table (last 30 days).
