# Calculations

Month-by-month simulation across 0–100 years at monthly precision.

- Income/Expense: amounts expressed in base-year terms; inflated to nominal if configured.
- Investments: nominal APR (fixed or yearly table). Monthly rate = APR/12.
- Net Worth: previous + net cashflow + change in investment balances.
- Retirement: stop employment income at retirement age; withdraw to cover expenses per policy.
- Safety Savings: target = monthsCoverage * monthlyExpenses (inflation-aware if enabled).
- Display: `nominal` or `real` (deflate by cumulative inflation factor from base year).

See `financial.plan.md` pseudocode for the detailed loop.
