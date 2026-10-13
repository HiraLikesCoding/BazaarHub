-- ============================================================================
-- BazaarHub demo seed (SQL Editor version)
-- Generated from supabase/seed-data.js - identical data to `npm run seed:supabase`.
-- Idempotent: safe to re-run; existing rows are skipped by name / sku / email / order number.
-- Run in: Supabase Dashboard -> SQL Editor -> New query -> paste -> Run.
-- ============================================================================

-- ---------------------------------------------------------------- accounts
-- Demo logins: admin@bazaarhub.com / Admin@123, customer@bazaarhub.com / Customer@123
insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'admin@bazaarhub.com',
       crypt('Admin@123', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Store Admin"}'::jsonb, now(), now()
where not exists (select 1 from auth.users existing where existing.email = 'admin@bazaarhub.com');

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
       'email', now(), now(), now()
from auth.users u
where u.email = 'admin@bazaarhub.com'
  and not exists (select 1 from auth.identities i where i.provider = 'email' and i.provider_id = u.id::text);

insert into auth.users (instance_id, id, aud, role, email, encrypted_password, email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
select '00000000-0000-0000-0000-000000000000', gen_random_uuid(), 'authenticated', 'authenticated', 'customer@bazaarhub.com',
       crypt('Customer@123', gen_salt('bf')), now(),
       '{"provider":"email","providers":["email"]}'::jsonb, '{"name":"Demo Customer"}'::jsonb, now(), now()
where not exists (select 1 from auth.users existing where existing.email = 'customer@bazaarhub.com');

insert into auth.identities (provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select u.id::text, u.id,
       jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true, 'phone_verified', false),
       'email', now(), now(), now()
from auth.users u
where u.email = 'customer@bazaarhub.com'
  and not exists (select 1 from auth.identities i where i.provider = 'email' and i.provider_id = u.id::text);

update public.profiles set role = 'admin' where email = 'admin@bazaarhub.com';

-- --------------------------------------------------------------- categories
insert into public.categories (name, description, icon, image)
values ('Electronics', 'Headphones, wearables, laptops and everything smart.', '💻', '/images/products/category-electronics.jpg')
on conflict (name) do nothing;

insert into public.categories (name, description, icon, image)
values ('Fashion', 'Everyday style, footwear and accessories.', '👕', '/images/products/category-fashion.jpg')
on conflict (name) do nothing;

insert into public.categories (name, description, icon, image)
values ('Beauty', 'Skincare, makeup and signature scents.', '💄', '/images/products/category-beauty.jpg')
on conflict (name) do nothing;

insert into public.categories (name, description, icon, image)
values ('Home & Living', 'Comfort and character for every room.', '🏠', '/images/products/category-home-living.jpg')
on conflict (name) do nothing;

insert into public.categories (name, description, icon, image)
values ('Sports', 'Gear that keeps you moving.', '🏃', '/images/products/category-sports.jpg')
on conflict (name) do nothing;

insert into public.categories (name, description, icon, image)
values ('Books', 'Programming, science, fiction and personal growth.', '📚', '/images/products/category-books.jpg')
on conflict (name) do nothing;

-- ----------------------------------------------------------------- products
insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'AuraSound Pro Wireless Headphones', 'Immerse yourself in rich, balanced audio with the AuraSound Pro. Adaptive noise cancellation blocks the world out, while 40 mm drivers deliver deep bass and crisp vocals. Up to 40 hours of battery life keeps the music going all week.', 149.99, 119.99, cat.id,
       'AuraSound', 'BZ-ELE-001', '["/images/products/aurasound-pro-wireless-headphones-1.jpg","/images/products/aurasound-pro-wireless-headphones-2.jpg"]'::jsonb, 42, 109, 4.8, 326, true,
       '[{"key":"Driver Size","value":"40 mm"},{"key":"Battery Life","value":"Up to 40 hours"},{"key":"Charging","value":"USB-C fast charge"},{"key":"Connectivity","value":"Bluetooth 5.3 + 3.5 mm"},{"key":"Weight","value":"254 g"},{"key":"Warranty","value":"12 months"}]'::jsonb, '[{"name":"Ayesha K.","rating":5,"comment":"Best headphones I have owned. Noise cancellation is superb on flights."},{"name":"Daniel R.","rating":4,"comment":"Great sound, comfortable for long sessions. Case is a bit bulky."}]'::jsonb
from public.categories cat
where cat.name = 'Electronics'
  and not exists (select 1 from public.products p where p.sku = 'BZ-ELE-001');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'PulseFit AMOLED Smart Watch', 'Track workouts, sleep and heart rate on a bright 1.43" AMOLED display. Water resistant to 50 m, with GPS, SpO2 monitoring and a battery that lasts up to 10 days on a single charge.', 199.99, 159.99, cat.id,
       'PulseFit', 'BZ-ELE-002', '["/images/products/pulsefit-amoled-smart-watch-1.jpg","/images/products/pulsefit-amoled-smart-watch-2.jpg"]'::jsonb, 28, 71, 4.6, 214, true,
       '[{"key":"Display","value":"1.43\" AMOLED, 466x466"},{"key":"Battery","value":"Up to 10 days"},{"key":"Water Resistance","value":"5 ATM (50 m)"},{"key":"Sensors","value":"Heart rate, SpO2, GPS"},{"key":"Compatibility","value":"iOS & Android"}]'::jsonb, '[{"name":"Marcus T.","rating":5,"comment":"Battery really does last a week. Sleep tracking is accurate."},{"name":"Sana M.","rating":4,"comment":"Lovely display, wish the strap colours were cheaper."}]'::jsonb
from public.categories cat
where cat.name = 'Electronics'
  and not exists (select 1 from public.products p where p.sku = 'BZ-ELE-002');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'BoomBox Mini Bluetooth Speaker', 'Pocket sized, surprisingly loud. The BoomBox Mini pumps 360° sound with punchy bass, is IPX7 waterproof and pairs two speakers together for true stereo.', 79.99, 59.99, cat.id,
       'BoomBox', 'BZ-ELE-003', '["/images/products/boombox-mini-bluetooth-speaker-1.jpg","/images/products/boombox-mini-bluetooth-speaker-2.jpg"]'::jsonb, 65, 59, 4.5, 178, false,
       '[{"key":"Output Power","value":"20 W"},{"key":"Playtime","value":"18 hours"},{"key":"Waterproof","value":"IPX7"},{"key":"Range","value":"30 m"},{"key":"Weight","value":"560 g"}]'::jsonb, '[{"name":"Omar F.","rating":5,"comment":"Took it to the beach, no issues. Great bass for the size."}]'::jsonb
from public.categories cat
where cat.name = 'Electronics'
  and not exists (select 1 from public.products p where p.sku = 'BZ-ELE-003');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'MechType 75 Mechanical Keyboard', 'A gasket-mounted 75% layout with hot-swappable switches, PBT keycaps and per-key RGB. Tuned stabilisers give a deep, satisfying thock straight out of the box.', 129.99, 0, cat.id,
       'MechType', 'BZ-ELE-004', '["/images/products/mechtype-75-mechanical-keyboard-1.jpg","/images/products/mechtype-75-mechanical-keyboard-2.jpg"]'::jsonb, 6, 44, 4.7, 132, false,
       '[{"key":"Layout","value":"75% (84 keys)"},{"key":"Switches","value":"Hot-swappable linear"},{"key":"Connection","value":"USB-C / Bluetooth 5.1 / 2.4 GHz"},{"key":"Keycaps","value":"Double-shot PBT"},{"key":"Backlight","value":"Per-key RGB"}]'::jsonb, '[{"name":"Leo P.","rating":5,"comment":"Sounds amazing, no rattle on the spacebar. Worth it."}]'::jsonb
from public.categories cat
where cat.name = 'Electronics'
  and not exists (select 1 from public.products p where p.sku = 'BZ-ELE-004');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'NovaBook Pro 14 Laptop', 'A 14-inch retina-grade display, 16 GB RAM and a 512 GB NVMe SSD in a 1.2 kg aluminium body. All day battery and whisper quiet cooling for focused work anywhere.', 1199, 1099, cat.id,
       'NovaBook', 'BZ-ELE-005', '["/images/products/novabook-pro-14-laptop-1.jpg","/images/products/novabook-pro-14-laptop-2.jpg"]'::jsonb, 12, 29, 4.6, 87, false,
       '[{"key":"Display","value":"14\" 2.8K IPS, 90 Hz"},{"key":"Memory","value":"16 GB LPDDR5"},{"key":"Storage","value":"512 GB NVMe SSD"},{"key":"Battery","value":"70 Wh, up to 16 h"},{"key":"Weight","value":"1.2 kg"}]'::jsonb, '[{"name":"Priya S.","rating":5,"comment":"Light, fast and the screen is gorgeous for the price."}]'::jsonb
from public.categories cat
where cat.name = 'Electronics'
  and not exists (select 1 from public.products p where p.sku = 'BZ-ELE-005');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'EchoBuds Wireless Earbuds', 'Comfortable semi-in-ear earbuds with active noise cancellation, transparency mode and 30 hours of total playtime with the charging case.', 89.99, 69.99, cat.id,
       'AuraSound', 'BZ-ELE-006', '["/images/products/echobuds-wireless-earbuds-1.jpg","/images/products/echobuds-wireless-earbuds-2.jpg"]'::jsonb, 0, 88, 4.4, 265, false,
       '[{"key":"Battery","value":"8 h buds / 30 h with case"},{"key":"ANC","value":"Adaptive noise cancelling"},{"key":"Water Resistance","value":"IPX4"},{"key":"Charging","value":"USB-C and wireless"}]'::jsonb, '[{"name":"Hassan A.","rating":4,"comment":"Good isolation for the price. Case could be smaller."}]'::jsonb
from public.categories cat
where cat.name = 'Electronics'
  and not exists (select 1 from public.products p where p.sku = 'BZ-ELE-006');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Classic Cotton Casual Shirt', 'A breathable 100% cotton shirt with a clean regular fit. Wrinkle resistant fabric makes it perfect for the office, travel or a relaxed weekend.', 44.99, 34.99, cat.id,
       'UrbanWeave', 'BZ-FAS-001', '["/images/products/classic-cotton-casual-shirt-1.jpg","/images/products/classic-cotton-casual-shirt-2.jpg"]'::jsonb, 88, 48, 4.5, 143, false,
       '[{"key":"Material","value":"100% cotton"},{"key":"Fit","value":"Regular"},{"key":"Care","value":"Machine wash cold"},{"key":"Sizes","value":"S - XXL"}]'::jsonb, '[{"name":"Bilal H.","rating":5,"comment":"Fabric is soft and the fit is true to size."}]'::jsonb
from public.categories cat
where cat.name = 'Fashion'
  and not exists (select 1 from public.products p where p.sku = 'BZ-FAS-001');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'UrbanStreet Running Sneakers', 'Lightweight mesh upper on a responsive foam midsole. Built for daily runs but styled for the street, with a grippy rubber outsole that handles wet pavement.', 119.99, 89.99, cat.id,
       'UrbanStreet', 'BZ-FAS-002', '["/images/products/urbanstreet-running-sneakers-1.jpg","/images/products/urbanstreet-running-sneakers-2.jpg"]'::jsonb, 34, 100, 4.7, 301, true,
       '[{"key":"Upper","value":"Breathable engineered mesh"},{"key":"Midsole","value":"Responsive EVA foam"},{"key":"Outsole","value":"Non-slip rubber"},{"key":"Sizes","value":"EU 38 - 46"}]'::jsonb, '[{"name":"Chris W.","rating":5,"comment":"Very light and cushioned. I run 5 km daily in these."},{"name":"Nadia L.","rating":4,"comment":"True to size, colour is even nicer in person."}]'::jsonb
from public.categories cat
where cat.name = 'Fashion'
  and not exists (select 1 from public.products p where p.sku = 'BZ-FAS-002');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Cozy Fleece Hoodie', 'Heavyweight brushed fleece with a relaxed fit, kangaroo pocket and adjustable drawstring hood. Warm without the bulk.', 59.99, 47.99, cat.id,
       'UrbanWeave', 'BZ-FAS-003', '["/images/products/cozy-fleece-hoodie-1.jpg","/images/products/cozy-fleece-hoodie-2.jpg"]'::jsonb, 9, 62, 4.6, 187, false,
       '[{"key":"Material","value":"80% cotton, 20% polyester"},{"key":"Fit","value":"Relaxed / unisex"},{"key":"Features","value":"Kangaroo pocket, drawstring hood"},{"key":"Sizes","value":"S - XXL"}]'::jsonb, '[{"name":"Ella J.","rating":5,"comment":"So soft inside. Perfect for cold evenings."}]'::jsonb
from public.categories cat
where cat.name = 'Fashion'
  and not exists (select 1 from public.products p where p.sku = 'BZ-FAS-003');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Everyday Leather Tote Handbag', 'Structured vegan leather tote with a padded 15" laptop sleeve, zip top and magnetic closure. Carries your day without losing its shape.', 139.99, 109.99, cat.id,
       'Maison Lune', 'BZ-FAS-004', '["/images/products/everyday-leather-tote-handbag-1.jpg","/images/products/everyday-leather-tote-handbag-2.jpg"]'::jsonb, 21, 32, 4.8, 96, true,
       '[{"key":"Material","value":"Premium vegan leather"},{"key":"Dimensions","value":"36 x 28 x 12 cm"},{"key":"Laptop Sleeve","value":"Fits up to 15\""},{"key":"Closure","value":"Zip + magnetic flap"}]'::jsonb, '[{"name":"Zara Q.","rating":5,"comment":"Fits my laptop, notebooks and a water bottle. Looks classy."}]'::jsonb
from public.categories cat
where cat.name = 'Fashion'
  and not exists (select 1 from public.products p where p.sku = 'BZ-FAS-004');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Slim Fit Stretch Denim Jeans', 'Mid-rise slim jeans cut from stretch denim that keeps its shape. Minimal distressing and a versatile dark wash that works with everything.', 69.99, 0, cat.id,
       'UrbanStreet', 'BZ-FAS-005', '["/images/products/slim-fit-stretch-denim-jeans-1.jpg","/images/products/slim-fit-stretch-denim-jeans-2.jpg"]'::jsonb, 53, 40, 4.3, 121, false,
       '[{"key":"Material","value":"98% cotton, 2% elastane"},{"key":"Fit","value":"Slim"},{"key":"Rise","value":"Mid rise"},{"key":"Sizes","value":"28 - 38"}]'::jsonb, '[{"name":"Tom B.","rating":4,"comment":"Comfortable stretch, colour has not faded after washing."}]'::jsonb
from public.categories cat
where cat.name = 'Fashion'
  and not exists (select 1 from public.products p where p.sku = 'BZ-FAS-005');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Velvet Matte Lipstick Set', 'Four transfer-resistant shades in one box. The velvet matte formula glides on smoothly and stays comfortable for up to 12 hours without drying.', 29.99, 24.99, cat.id,
       'Lumière', 'BZ-BEA-001', '["/images/products/velvet-matte-lipstick-set-1.jpg","/images/products/velvet-matte-lipstick-set-2.jpg"]'::jsonb, 74, 53, 4.5, 158, false,
       '[{"key":"Shades","value":"4 full-size colours"},{"key":"Finish","value":"Velvet matte"},{"key":"Longevity","value":"Up to 12 hours"},{"key":"Formula","value":"Cruelty free, vitamin E"}]'::jsonb, '[{"name":"Maya D.","rating":5,"comment":"The nude shade is my everyday go-to. Not drying at all."}]'::jsonb
from public.categories cat
where cat.name = 'Beauty'
  and not exists (select 1 from public.products p where p.sku = 'BZ-BEA-001');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'GlowRenew Vitamin C Face Serum', 'A 15% Vitamin C serum with hyaluronic acid and ferulic acid that brightens dark spots and evens skin tone. Lightweight, fast absorbing and suitable for all skin types.', 49.99, 39.99, cat.id,
       'DermaGlow', 'BZ-BEA-002', '["/images/products/glowrenew-vitamin-c-face-serum-1.jpg","/images/products/glowrenew-vitamin-c-face-serum-2.jpg"]'::jsonb, 47, 77, 4.7, 232, true,
       '[{"key":"Volume","value":"30 ml"},{"key":"Key Ingredients","value":"15% Vitamin C, hyaluronic acid"},{"key":"Skin Type","value":"All skin types"},{"key":"Free From","value":"Parabens, sulfates, cruelty"}]'::jsonb, '[{"name":"Fatima N.","rating":5,"comment":"Six weeks in and my dark spots have visibly faded."},{"name":"Grace O.","rating":4,"comment":"Nice texture, does not sting. Dropper is a bit stiff."}]'::jsonb
from public.categories cat
where cat.name = 'Beauty'
  and not exists (select 1 from public.products p where p.sku = 'BZ-BEA-002');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Blossom Eau de Parfum 50ml', 'A modern floral opening of peony and bergamot that settles into warm amber and white musk. Long lasting, with moderate sillage for day or evening.', 89.99, 69.99, cat.id,
       'Maison Lune', 'BZ-BEA-003', '["/images/products/blossom-eau-de-parfum-50ml-1.jpg","/images/products/blossom-eau-de-parfum-50ml-2.jpg"]'::jsonb, 18, 25, 4.6, 74, false,
       '[{"key":"Volume","value":"50 ml"},{"key":"Family","value":"Floral amber"},{"key":"Top Notes","value":"Bergamot, peony"},{"key":"Base Notes","value":"Amber, white musk"},{"key":"Longevity","value":"8 - 10 hours"}]'::jsonb, '[{"name":"Aisha R.","rating":5,"comment":"Elegant and not overpowering. Compliments every time."}]'::jsonb
from public.categories cat
where cat.name = 'Beauty'
  and not exists (select 1 from public.products p where p.sku = 'BZ-BEA-003');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Daily Glow Makeup Kit', 'Everything you need for a fresh everyday look: eyeshadow palette, blush, highlighter, two brushes and a mirror compact in one travel friendly case.', 59.99, 0, cat.id,
       'Lumière', 'BZ-BEA-004', '["/images/products/daily-glow-makeup-kit-1.jpg","/images/products/daily-glow-makeup-kit-2.jpg"]'::jsonb, 5, 21, 4.2, 63, false,
       '[{"key":"Contents","value":"9 shadows, blush, highlighter"},{"key":"Tools","value":"2 dual-ended brushes"},{"key":"Finish","value":"Natural, buildable"},{"key":"Case","value":"Magnetic travel case"}]'::jsonb, '[{"name":"Ivy C.","rating":4,"comment":"Colours are wearable and blend easily. Great value set."}]'::jsonb
from public.categories cat
where cat.name = 'Beauty'
  and not exists (select 1 from public.products p where p.sku = 'BZ-BEA-004');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Nordic Arc LED Table Lamp', 'A minimal arc lamp with a warm dimmable LED, touch control and three colour temperatures. The matte steel base stays put and the fabric shade softens the light.', 64.99, 51.99, cat.id,
       'NordicLine', 'BZ-HOM-001', '["/images/products/nordic-arc-led-table-lamp-1.jpg","/images/products/nordic-arc-led-table-lamp-2.jpg"]'::jsonb, 36, 37, 4.6, 112, true,
       '[{"key":"Material","value":"Matte steel + fabric shade"},{"key":"Light","value":"Dimmable LED, 2700K - 5000K"},{"key":"Control","value":"Touch dimmer"},{"key":"Height","value":"42 cm"},{"key":"Power","value":"8 W, USB powered"}]'::jsonb, '[{"name":"Hannah S.","rating":5,"comment":"Perfect bedside lamp. The warm setting is lovely for reading."}]'::jsonb
from public.categories cat
where cat.name = 'Home & Living'
  and not exists (select 1 from public.products p where p.sku = 'BZ-HOM-001');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Ceramic Coffee Mug Set (Pack of 2)', 'Two 350 ml stoneware mugs with a comfortable handle and a smooth glaze that resists staining. Dishwasher and microwave safe.', 24.99, 0, cat.id,
       'NordicLine', 'BZ-HOM-002', '["/images/products/ceramic-coffee-mug-set-pack-of-2-1.jpg","/images/products/ceramic-coffee-mug-set-pack-of-2-2.jpg"]'::jsonb, 92, 30, 4.4, 89, false,
       '[{"key":"Capacity","value":"350 ml each"},{"key":"Material","value":"Stoneware"},{"key":"Care","value":"Dishwasher & microwave safe"},{"key":"Set","value":"2 mugs"}]'::jsonb, '[{"name":"Ryan G.","rating":4,"comment":"Solid weight, feels premium. Handles are comfortable."}]'::jsonb
from public.categories cat
where cat.name = 'Home & Living'
  and not exists (select 1 from public.products p where p.sku = 'BZ-HOM-002');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Velvet Cushion Cover Set of 4', 'Four 45 x 45 cm velvet covers with hidden zips. The rich texture instantly lifts a sofa or bed, and they are machine washable.', 39.99, 31.99, cat.id,
       'CosyNest', 'BZ-HOM-003', '["/images/products/velvet-cushion-cover-set-of-4-1.jpg","/images/products/velvet-cushion-cover-set-of-4-2.jpg"]'::jsonb, 44, 25, 4.5, 76, false,
       '[{"key":"Size","value":"45 x 45 cm"},{"key":"Material","value":"100% polyester velvet"},{"key":"Closure","value":"Hidden zip"},{"key":"Set","value":"4 covers (inserts not included)"}]'::jsonb, '[{"name":"Laura M.","rating":5,"comment":"Colour is exactly as pictured and they wash well."}]'::jsonb
from public.categories cat
where cat.name = 'Home & Living'
  and not exists (select 1 from public.products p where p.sku = 'BZ-HOM-003');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Minimalist Wall Clock 30cm', 'A silent sweep 30 cm clock with a solid wood frame and high contrast hands. Reads clearly from across the room without ticking.', 49.99, 39.99, cat.id,
       'NordicLine', 'BZ-HOM-004', '["/images/products/minimalist-wall-clock-30cm-1.jpg","/images/products/minimalist-wall-clock-30cm-2.jpg"]'::jsonb, 27, 19, 4.3, 58, false,
       '[{"key":"Diameter","value":"30 cm"},{"key":"Movement","value":"Silent sweep"},{"key":"Frame","value":"Solid wood"},{"key":"Power","value":"1 x AA battery (not included)"}]'::jsonb, '[{"name":"Peter V.","rating":4,"comment":"Truly silent. Clean design that fits my study."}]'::jsonb
from public.categories cat
where cat.name = 'Home & Living'
  and not exists (select 1 from public.products p where p.sku = 'BZ-HOM-004');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Serene Indoor Plant with Ceramic Pot', 'A low maintenance leafy plant delivered in a glazed ceramic pot with drainage. Prefers bright indirect light and weekly watering.', 34.99, 0, cat.id,
       'GreenRoom', 'BZ-HOM-005', '["/images/products/serene-indoor-plant-with-ceramic-pot-1.jpg","/images/products/serene-indoor-plant-with-ceramic-pot-2.jpg"]'::jsonb, 31, 21, 4.7, 64, false,
       '[{"key":"Height","value":"40 - 50 cm incl. pot"},{"key":"Pot","value":"Glazed ceramic, 16 cm"},{"key":"Light","value":"Bright indirect"},{"key":"Care Level","value":"Easy"}]'::jsonb, '[{"name":"Noor A.","rating":5,"comment":"Arrived healthy and beautifully packed."}]'::jsonb
from public.categories cat
where cat.name = 'Home & Living'
  and not exists (select 1 from public.products p where p.sku = 'BZ-HOM-005');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Pro Adjustable Dumbbell Set 20kg', 'Two adjustable dumbbells covering 2.5 kg to 20 kg each with a quick dial lock. Compact stands keep your floor clear between sets.', 149.99, 119.99, cat.id,
       'IronGrip', 'BZ-SPT-001', '["/images/products/pro-adjustable-dumbbell-set-20kg-1.jpg","/images/products/pro-adjustable-dumbbell-set-20kg-2.jpg"]'::jsonb, 16, 48, 4.6, 143, true,
       '[{"key":"Weight Range","value":"2.5 - 20 kg per dumbbell"},{"key":"Increments","value":"2.5 kg"},{"key":"Grip","value":"Knurled steel handle"},{"key":"Includes","value":"2 dumbbells + storage tray"}]'::jsonb, '[{"name":"Kevin O.","rating":5,"comment":"Replaced a whole rack of weights. Adjustment is instant."}]'::jsonb
from public.categories cat
where cat.name = 'Sports'
  and not exists (select 1 from public.products p where p.sku = 'BZ-SPT-001');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'GripMaster Non-Slip Yoga Mat', 'A 6 mm TPE mat with an alignment guide and double sided texture. Cushions joints without sinking, and it is completely non slip even when sweaty.', 39.99, 29.99, cat.id,
       'FlexLife', 'BZ-SPT-002', '["/images/products/gripmaster-non-slip-yoga-mat-1.jpg","/images/products/gripmaster-non-slip-yoga-mat-2.jpg"]'::jsonb, 58, 68, 4.5, 204, false,
       '[{"key":"Size","value":"183 x 61 x 0.6 cm"},{"key":"Material","value":"Eco TPE"},{"key":"Grip","value":"Double sided non-slip"},{"key":"Includes","value":"Carry strap"}]'::jsonb, '[{"name":"Tara P.","rating":5,"comment":"No sliding in downward dog anymore. Light to carry."}]'::jsonb
from public.categories cat
where cat.name = 'Sports'
  and not exists (select 1 from public.products p where p.sku = 'BZ-SPT-002');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'TrailBlazer Water Resistant Backpack 25L', 'A 25 litre daypack with a padded laptop sleeve, breathable back panel and a rain cover tucked in the base. Balanced straps make heavy loads comfortable.', 79.99, 63.99, cat.id,
       'SummitCo', 'BZ-SPT-003', '["/images/products/trailblazer-water-resistant-backpack-25l-1.jpg","/images/products/trailblazer-water-resistant-backpack-25l-2.jpg"]'::jsonb, 40, 39, 4.4, 117, false,
       '[{"key":"Capacity","value":"25 litres"},{"key":"Laptop Sleeve","value":"Up to 15.6\""},{"key":"Material","value":"Water resistant 600D polyester"},{"key":"Extras","value":"Rain cover, hip belt, bottle pocket"}]'::jsonb, '[{"name":"Jonas E.","rating":4,"comment":"Great for hikes and daily commute. Zips feel sturdy."}]'::jsonb
from public.categories cat
where cat.name = 'Sports'
  and not exists (select 1 from public.products p where p.sku = 'BZ-SPT-003');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'The Complete JavaScript Handbook', 'From the fundamentals of the language to modern asynchronous patterns, this 480 page handbook teaches JavaScript the way you actually use it. Includes 120 practical exercises.', 49.99, 39.99, cat.id,
       'CodePress', 'BZ-BOK-001', '["/images/products/the-complete-javascript-handbook-1.jpg","/images/products/the-complete-javascript-handbook-2.jpg"]'::jsonb, 62, 59, 4.8, 176, true,
       '[{"key":"Pages","value":"480"},{"key":"Edition","value":"2026 edition"},{"key":"Format","value":"Paperback"},{"key":"Level","value":"Beginner to intermediate"}]'::jsonb, '[{"name":"Ahmed Z.","rating":5,"comment":"Clear explanations and the exercises really stick."}]'::jsonb
from public.categories cat
where cat.name = 'Books'
  and not exists (select 1 from public.products p where p.sku = 'BZ-BOK-001');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Artificial Intelligence: Foundations & Futures', 'A clear, non hype tour of modern AI: search, learning, neural networks, language models and ethics. Written for curious readers without a maths background.', 59.99, 0, cat.id,
       'ScienceHouse', 'BZ-BOK-002', '["/images/products/artificial-intelligence-foundations-futures-1.jpg","/images/products/artificial-intelligence-foundations-futures-2.jpg"]'::jsonb, 38, 31, 4.7, 92, false,
       '[{"key":"Pages","value":"396"},{"key":"Edition","value":"3rd edition"},{"key":"Format","value":"Paperback"},{"key":"Level","value":"General audience"}]'::jsonb, '[{"name":"Sofia B.","rating":5,"comment":"Finally an AI book that explains things without jargon."}]'::jsonb
from public.categories cat
where cat.name = 'Books'
  and not exists (select 1 from public.products p where p.sku = 'BZ-BOK-002');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'The Silent Hour - A Mystery Novel', 'When a coastal town loses power for exactly one hour each night, a detective discovers the blackout is hiding something far darker. A twisty, fast paced thriller.', 18.99, 14.99, cat.id,
       'HarbourPress', 'BZ-BOK-003', '["/images/products/the-silent-hour-a-mystery-novel-1.jpg","/images/products/the-silent-hour-a-mystery-novel-2.jpg"]'::jsonb, 71, 82, 4.4, 245, false,
       '[{"key":"Pages","value":"336"},{"key":"Genre","value":"Mystery / Thriller"},{"key":"Format","value":"Paperback"},{"key":"ISBN","value":"978-1-23456-789-0"}]'::jsonb, '[{"name":"Rachel F.","rating":4,"comment":"Could not put it down. Saw the ending coming, still loved it."}]'::jsonb
from public.categories cat
where cat.name = 'Books'
  and not exists (select 1 from public.products p where p.sku = 'BZ-BOK-003');

insert into public.products (name, description, price, discount_price, category_id, brand, sku, images, stock, sold, rating, num_reviews, featured, specifications, reviews)
select 'Focus: Building Lasting Habits', 'A practical guide to designing habits that survive busy weeks. Based on behaviour science, with a 30 day system you can start this morning.', 24.99, 19.99, cat.id,
       'GrowthLeaf', 'BZ-BOK-004', '["/images/products/focus-building-lasting-habits-1.jpg","/images/products/focus-building-lasting-habits-2.jpg"]'::jsonb, 4, 53, 4.6, 158, false,
       '[{"key":"Pages","value":"248"},{"key":"Format","value":"Paperback + workbook"},{"key":"Topic","value":"Productivity & habits"},{"key":"Includes","value":"30 day tracking workbook"}]'::jsonb, '[{"name":"Michael D.","rating":5,"comment":"Short, practical, no fluff. The 30 day plan works."}]'::jsonb
from public.categories cat
where cat.name = 'Books'
  and not exists (select 1 from public.products p where p.sku = 'BZ-BOK-004');

-- -------------------------------------------------------------- demo orders
with cust as (
  select id from public.profiles where email = 'customer@bazaarhub.com' limit 1
), ts as (
  select now() - interval '0 days' as created
), items_agg as (
  select jsonb_agg(jsonb_build_object('product', p.id, 'name', p.name, 'image', coalesce(p.images ->> 0, ''),
           'price', (case when p.discount_price > 0 and p.discount_price < p.price then p.discount_price else p.price end),
           'quantity', v.qty, 'stockAtOrder', p.stock) order by v.ord) as items
  from (values ('BZ-ELE-001', 1, 0)) as v(sku, qty, ord)
  join public.products p on p.sku = v.sku
), tot as (
  select coalesce(sum(round(((it ->> 'price')::numeric) * ((it ->> 'quantity')::int), 2)), 0) as subtotal
  from items_agg, jsonb_array_elements(items_agg.items) as it
)
insert into public.orders (order_number, user_id, items, shipping_address, payment_method, payment_status, subtotal, shipping, total, status, status_history, delivered_at, created_at)
select 'BZH-SEED-0001', cust.id, items_agg.items, '{"fullName":"Demo Customer","email":"customer@bazaarhub.com","phone":"+1 555 010 1234","address":"221B Maple Avenue","city":"Portland","province":"Oregon","postalCode":"97205","country":"United States"}'::jsonb, 'cod', 'Paid',
       tot.subtotal, case when tot.subtotal >= 75 then 0 else 6.99 end, tot.subtotal + case when tot.subtotal >= 75 then 0 else 6.99 end,
       'Delivered',
       jsonb_build_array(jsonb_build_object('status', 'Delivered', 'at', to_char(ts.created at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'by', 'system'))::jsonb,
       ts.created, ts.created
from cust, items_agg, tot, ts
where items_agg.items is not null
  and not exists (select 1 from public.orders o where o.order_number = 'BZH-SEED-0001');

with cust as (
  select id from public.profiles where email = 'customer@bazaarhub.com' limit 1
), ts as (
  select now() - interval '2 days' as created
), items_agg as (
  select jsonb_agg(jsonb_build_object('product', p.id, 'name', p.name, 'image', coalesce(p.images ->> 0, ''),
           'price', (case when p.discount_price > 0 and p.discount_price < p.price then p.discount_price else p.price end),
           'quantity', v.qty, 'stockAtOrder', p.stock) order by v.ord) as items
  from (values ('BZ-ELE-003', 1, 0), ('BZ-ELE-004', 2, 1)) as v(sku, qty, ord)
  join public.products p on p.sku = v.sku
), tot as (
  select coalesce(sum(round(((it ->> 'price')::numeric) * ((it ->> 'quantity')::int), 2)), 0) as subtotal
  from items_agg, jsonb_array_elements(items_agg.items) as it
)
insert into public.orders (order_number, user_id, items, shipping_address, payment_method, payment_status, subtotal, shipping, total, status, status_history, delivered_at, created_at)
select 'BZH-SEED-0002', cust.id, items_agg.items, '{"fullName":"Demo Customer","email":"customer@bazaarhub.com","phone":"+1 555 010 1234","address":"88 Harbor Street","city":"Seattle","province":"Washington","postalCode":"98101","country":"United States"}'::jsonb, 'cod', 'Paid',
       tot.subtotal, case when tot.subtotal >= 75 then 0 else 6.99 end, tot.subtotal + case when tot.subtotal >= 75 then 0 else 6.99 end,
       'Delivered',
       jsonb_build_array(jsonb_build_object('status', 'Delivered', 'at', to_char(ts.created at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'by', 'system'))::jsonb,
       ts.created, ts.created
from cust, items_agg, tot, ts
where items_agg.items is not null
  and not exists (select 1 from public.orders o where o.order_number = 'BZH-SEED-0002');

with cust as (
  select id from public.profiles where email = 'customer@bazaarhub.com' limit 1
), ts as (
  select now() - interval '4 days' as created
), items_agg as (
  select jsonb_agg(jsonb_build_object('product', p.id, 'name', p.name, 'image', coalesce(p.images ->> 0, ''),
           'price', (case when p.discount_price > 0 and p.discount_price < p.price then p.discount_price else p.price end),
           'quantity', v.qty, 'stockAtOrder', p.stock) order by v.ord) as items
  from (values ('BZ-ELE-005', 1, 0), ('BZ-ELE-006', 2, 1), ('BZ-FAS-001', 1, 2)) as v(sku, qty, ord)
  join public.products p on p.sku = v.sku
), tot as (
  select coalesce(sum(round(((it ->> 'price')::numeric) * ((it ->> 'quantity')::int), 2)), 0) as subtotal
  from items_agg, jsonb_array_elements(items_agg.items) as it
)
insert into public.orders (order_number, user_id, items, shipping_address, payment_method, payment_status, subtotal, shipping, total, status, status_history, delivered_at, created_at)
select 'BZH-SEED-0003', cust.id, items_agg.items, '{"fullName":"Demo Customer","email":"customer@bazaarhub.com","phone":"+1 555 010 1234","address":"221B Maple Avenue","city":"Portland","province":"Oregon","postalCode":"97205","country":"United States"}'::jsonb, 'cod', 'Unpaid',
       tot.subtotal, case when tot.subtotal >= 75 then 0 else 6.99 end, tot.subtotal + case when tot.subtotal >= 75 then 0 else 6.99 end,
       'Shipped',
       jsonb_build_array(jsonb_build_object('status', 'Shipped', 'at', to_char(ts.created at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'by', 'system'))::jsonb,
       null, ts.created
from cust, items_agg, tot, ts
where items_agg.items is not null
  and not exists (select 1 from public.orders o where o.order_number = 'BZH-SEED-0003');

with cust as (
  select id from public.profiles where email = 'customer@bazaarhub.com' limit 1
), ts as (
  select now() - interval '6 days' as created
), items_agg as (
  select jsonb_agg(jsonb_build_object('product', p.id, 'name', p.name, 'image', coalesce(p.images ->> 0, ''),
           'price', (case when p.discount_price > 0 and p.discount_price < p.price then p.discount_price else p.price end),
           'quantity', v.qty, 'stockAtOrder', p.stock) order by v.ord) as items
  from (values ('BZ-FAS-001', 1, 0)) as v(sku, qty, ord)
  join public.products p on p.sku = v.sku
), tot as (
  select coalesce(sum(round(((it ->> 'price')::numeric) * ((it ->> 'quantity')::int), 2)), 0) as subtotal
  from items_agg, jsonb_array_elements(items_agg.items) as it
)
insert into public.orders (order_number, user_id, items, shipping_address, payment_method, payment_status, subtotal, shipping, total, status, status_history, delivered_at, created_at)
select 'BZH-SEED-0004', cust.id, items_agg.items, '{"fullName":"Demo Customer","email":"customer@bazaarhub.com","phone":"+1 555 010 1234","address":"88 Harbor Street","city":"Seattle","province":"Washington","postalCode":"98101","country":"United States"}'::jsonb, 'cod', 'Unpaid',
       tot.subtotal, case when tot.subtotal >= 75 then 0 else 6.99 end, tot.subtotal + case when tot.subtotal >= 75 then 0 else 6.99 end,
       'Processing',
       jsonb_build_array(jsonb_build_object('status', 'Processing', 'at', to_char(ts.created at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'by', 'system'))::jsonb,
       null, ts.created
from cust, items_agg, tot, ts
where items_agg.items is not null
  and not exists (select 1 from public.orders o where o.order_number = 'BZH-SEED-0004');

with cust as (
  select id from public.profiles where email = 'customer@bazaarhub.com' limit 1
), ts as (
  select now() - interval '8 days' as created
), items_agg as (
  select jsonb_agg(jsonb_build_object('product', p.id, 'name', p.name, 'image', coalesce(p.images ->> 0, ''),
           'price', (case when p.discount_price > 0 and p.discount_price < p.price then p.discount_price else p.price end),
           'quantity', v.qty, 'stockAtOrder', p.stock) order by v.ord) as items
  from (values ('BZ-ELE-001', 1, 0), ('BZ-ELE-002', 2, 1)) as v(sku, qty, ord)
  join public.products p on p.sku = v.sku
), tot as (
  select coalesce(sum(round(((it ->> 'price')::numeric) * ((it ->> 'quantity')::int), 2)), 0) as subtotal
  from items_agg, jsonb_array_elements(items_agg.items) as it
)
insert into public.orders (order_number, user_id, items, shipping_address, payment_method, payment_status, subtotal, shipping, total, status, status_history, delivered_at, created_at)
select 'BZH-SEED-0005', cust.id, items_agg.items, '{"fullName":"Demo Customer","email":"customer@bazaarhub.com","phone":"+1 555 010 1234","address":"221B Maple Avenue","city":"Portland","province":"Oregon","postalCode":"97205","country":"United States"}'::jsonb, 'cod', 'Unpaid',
       tot.subtotal, case when tot.subtotal >= 75 then 0 else 6.99 end, tot.subtotal + case when tot.subtotal >= 75 then 0 else 6.99 end,
       'Confirmed',
       jsonb_build_array(jsonb_build_object('status', 'Confirmed', 'at', to_char(ts.created at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'by', 'system'))::jsonb,
       null, ts.created
from cust, items_agg, tot, ts
where items_agg.items is not null
  and not exists (select 1 from public.orders o where o.order_number = 'BZH-SEED-0005');

with cust as (
  select id from public.profiles where email = 'customer@bazaarhub.com' limit 1
), ts as (
  select now() - interval '10 days' as created
), items_agg as (
  select jsonb_agg(jsonb_build_object('product', p.id, 'name', p.name, 'image', coalesce(p.images ->> 0, ''),
           'price', (case when p.discount_price > 0 and p.discount_price < p.price then p.discount_price else p.price end),
           'quantity', v.qty, 'stockAtOrder', p.stock) order by v.ord) as items
  from (values ('BZ-ELE-003', 1, 0), ('BZ-ELE-004', 2, 1), ('BZ-ELE-005', 1, 2)) as v(sku, qty, ord)
  join public.products p on p.sku = v.sku
), tot as (
  select coalesce(sum(round(((it ->> 'price')::numeric) * ((it ->> 'quantity')::int), 2)), 0) as subtotal
  from items_agg, jsonb_array_elements(items_agg.items) as it
)
insert into public.orders (order_number, user_id, items, shipping_address, payment_method, payment_status, subtotal, shipping, total, status, status_history, delivered_at, created_at)
select 'BZH-SEED-0006', cust.id, items_agg.items, '{"fullName":"Demo Customer","email":"customer@bazaarhub.com","phone":"+1 555 010 1234","address":"88 Harbor Street","city":"Seattle","province":"Washington","postalCode":"98101","country":"United States"}'::jsonb, 'cod', 'Unpaid',
       tot.subtotal, case when tot.subtotal >= 75 then 0 else 6.99 end, tot.subtotal + case when tot.subtotal >= 75 then 0 else 6.99 end,
       'Pending',
       jsonb_build_array(jsonb_build_object('status', 'Pending', 'at', to_char(ts.created at time zone 'utc', 'YYYY-MM-DD"T"HH24:MI:SS.MS"Z"'), 'by', 'system'))::jsonb,
       null, ts.created
from cust, items_agg, tot, ts
where items_agg.items is not null
  and not exists (select 1 from public.orders o where o.order_number = 'BZH-SEED-0006');
