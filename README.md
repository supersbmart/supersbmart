# SUPERSBMART

Fresh-start Indian e-commerce website starter.

## Included
- Customer: Home, categories, product details, cart, account, login, profile, addresses, wishlist, checkout, UTR/payment status, orders, returns/refunds, customer service.
- Admin: dashboard, products, orders, payments, customers, festival discounts, coupons, banners, support, settings.
- Festival offers can be created/edited by admin for any festival.
- Supabase SQL schema and RLS policies are included.

## Setup
1. Create a Supabase project.
2. Open `supabase/schema.sql` in Supabase SQL Editor and run it.
3. Copy `config.example.js` to `config.js`.
4. Put your Supabase project URL and anon key in `config.js`.
5. For GitHub Pages, upload the whole project while keeping the folder structure.
6. Open `index.html`.

Admin setup:
- Create an account normally.
- In Supabase, change that user's profile role to `admin` after the profile is created.

Important:
- Never put a Supabase service-role key in frontend files.
- The included frontend is designed for Supabase browser access using the anon key and RLS.


## UPI / QR admin setup
1. Run the complete `supabase/schema.sql` in Supabase SQL Editor.
2. Create `config.js` from `config.example.js` and enter the Supabase URL and anon key.
3. Create an account for the admin, then set that profile's role to `admin` using the SQL already documented in this project.
4. Open `admin/settings.html`.
5. Enter the UPI ID, payment instructions and customer-care contact.
6. Upload the QR image and press **Save Settings**.
7. Customers will see the saved UPI ID and QR on `payment.html`.
8. Never put a Supabase service-role key in `config.js` or any frontend file.

The ZIP implements the UPI/QR settings flow, but the remaining placeholder admin modules from the starter project still require their own implementation before claiming the whole marketplace is production-complete.


## Customer Service (functional)
Customer tickets support order linking, image/PDF attachment up to 5 MB, private Supabase Storage, customer ticket history, admin replies and ticket status updates. Run the updated `supabase/schema.sql` before using attachments.
