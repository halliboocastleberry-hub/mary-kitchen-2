# Mary’s Kitchen 2: two plates

Mary’s ordering website, built by SiteStyles. It opens with the moving banner of Mary between the chicken and pasta plates. Customers build each plate (protein, two sides, a drink, a dessert), pick a dinner window and place their order.

**Live on SiteStyles**
- Customer page: `https://sitestyles.net/kitchens/marys-kitchen/two-plates/`
- Mary’s kitchen board: `https://sitestyles.net/kitchens/marys-kitchen/two-plates/kitchen.html` (Mary signs in with her SiteStyles account)

## Files

- `two-plates/index.html`, `app.js`, `styles.css`: the customer page and plate builder
- `two-plates/kitchen.html`: Mary’s kitchen board
- `two-plates/orders.js`: talks to SiteStyles (dinner windows, placing orders, the board) and builds the pickup text
- `assets/`: photos, videos and fonts. Keep it beside `two-plates/`.

## How orders work

- Orders are saved on SiteStyles, not in the browser. An order placed on a customer’s phone shows up on Mary’s board within 15 seconds.
- Only Mary’s account (and the SiteStyles owner) can open the board. Customers never see other orders.
- Mary moves each order: Start preparing, then Mark ready for pickup, then Mark picked up.
- When an order is ready, the board shows the customer’s number and a pickup text with the window, pickup spot and instructions. **Text customer** opens Mary’s own Messages app with the text filled in. Mary reviews it and taps Send herself. SiteStyles never sends texts.
- Mary sets the pickup spot, instructions, dinner windows and plate limits on her board.

## Privacy

This repository holds only the website. It has no orders and no customer names or phone numbers. Those live in the SiteStyles database, and phone numbers are erased 30 days after an order is picked up.

## Not connected yet

- Online payment (Mary confirms totals with customers)
- Prices on the plates

The server code for orders lives in the SiteStyles platform (`lib/portal/kitchen.mjs`).
