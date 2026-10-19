/* Luna's Oasis — staff portal: faster sign-in, saved accounts on this device, more cats.
   Loaded after core.js. It replaces the sign-in screen and start-up from core.js:
   · the sign-in tiles show at once (saved from last time) and update in the background
   · signing in brings the bookings in the same answer (one wait instead of two)
   · "Keep me signed in" saves that account on this device: next time just tap its cat
   · "Log out & forget me on this device" in the cat menu removes it */
'use strict';

// ---------- more cat pictures ----------
FUR.brown = ['#9A6B47', '#D9A88A', '#FFF6EA'];
FUR.white = ['#FFFFFF', '#F6C9C9', '#2E2621'];
FUR.purple = ['#B79CE8', '#E7D3FF', '#2E2621'];
FUR.yellow = ['#F7C948', '#F9DFA0', '#2E2621'];
FUR.green = ['#7CC47F', '#B9E3B5', '#1F3A22'];
CATS.push(
  { id: 'c19', label: 'Chef', bg: '#E8C9A0', fur: 'ginger', face: EYES_HAPPY + SMILE + BLUSH, extra: '<path d="M16.5 12.5h15v-3.2a4 4 0 0 0-2.6-5.6 4.6 4.6 0 0 0-4.9-1.9 4.6 4.6 0 0 0-4.9 1.9 4 4 0 0 0-2.6 5.6z" fill="#FFFFFF" stroke="#D9CBB5" stroke-width=".8"/><rect x="16.5" y="11.5" width="15" height="3" rx="1" fill="#FFFFFF" stroke="#D9CBB5" stroke-width=".8"/>' },
  { id: 'c20', label: 'Flower', bg: '#BFE0A8', fur: 'cream', face: DOTS + SMILE + BLUSH, extra: '<g fill="#F59AAE"><circle cx="35" cy="9" r="2.6"/><circle cx="39.6" cy="12" r="2.6"/><circle cx="38" cy="17" r="2.6"/><circle cx="32.2" cy="17" r="2.6"/><circle cx="30.6" cy="12" r="2.6"/></g><circle cx="35" cy="13.2" r="2.2" fill="#F2C14E"/>' },
  { id: 'c21', label: 'Music', bg: '#9AA8E8', fur: 'gray', face: EYES_HAPPY + W_MOUTH, extra: '<path d="M11.5 26a12.5 12.5 0 0 1 25 0" fill="none" stroke="#2E2621" stroke-width="2.4"/><rect x="8.5" y="22.5" width="5.5" height="9" rx="2.7" fill="#E2586B"/><rect x="34" y="22.5" width="5.5" height="9" rx="2.7" fill="#E2586B"/>' },
  { id: 'c22', label: 'Cheeky', bg: '#F7A9A8', fur: 'black', face: '<path d="M16.5 29.6q2.6 2 5.2 0" fill="none" stroke="S" stroke-width="1.8" stroke-linecap="round"/><circle cx="29" cy="29" r="2" fill="S"/><path d="M20.5 33.5q3.5 2.6 7 0" fill="none" stroke="S" stroke-width="1.5" stroke-linecap="round"/><path d="M23.6 34.6h3v2.6a1.5 1.5 0 0 1-3 0z" fill="#F2879A"/>' },
  { id: 'c23', label: 'Happy tears', bg: '#A0D8EF', fur: 'cream', face: EYES_HAPPY + '<path d="M17 32.5q-1.2 2.2 0 3.2q1.2-1 0-3.2zM31 32.5q-1.2 2.2 0 3.2q1.2-1 0-3.2z" fill="#5BB5E0"/>' + W_MOUTH },
  { id: 'c24', label: 'Angel', bg: '#F3E6C4', fur: 'white', face: EYES_HAPPY + SMILE + BLUSH, extra: '<ellipse cx="24" cy="5.6" rx="8" ry="2.4" fill="none" stroke="#E9C46A" stroke-width="2"/>' },
  { id: 'c25', label: 'Gentleman', bg: '#5E7C8A', fur: 'brown', face: DOTS + SMILE, extra: '<path d="M24 40.5l-5.5-3.2v6.4zM24 40.5l5.5-3.2v6.4z" fill="#C23E52"/><circle cx="24" cy="40.5" r="1.5" fill="#8E2A3A"/>' },
  { id: 'c26', label: 'Cozy scarf', bg: '#D7E3EA', fur: 'ginger', face: DOTS + W_MOUTH + BLUSH, extra: '<path d="M13 35.5q11 5 22 0v4.2q-11 5-22 0z" fill="#C23E52"/><path d="M28.5 39l2.4 7h-4.6z" fill="#C23E52"/>' },
  { id: 'c27', label: 'Detective', bg: '#C9B79C', fur: 'gray', face: '<circle cx="19" cy="29" r="2" fill="S"/><path d="M26.5 29h5" stroke="S" stroke-width="1.8" stroke-linecap="round"/><path d="M21.5 34.5q2.5 1 5-.6" fill="none" stroke="S" stroke-width="1.5" stroke-linecap="round"/>', extra: '<circle cx="36.5" cy="34" r="5" fill="rgba(255,255,255,.4)" stroke="#2E2621" stroke-width="1.8"/><path d="M40 37.5l4 4" stroke="#2E2621" stroke-width="2.4" stroke-linecap="round"/>' },
  { id: 'c28', label: 'Coffee', bg: '#8C6A3C', fur: 'cream', face: '<path d="M16.5 29h5M26.5 29h5" stroke="S" stroke-width="1.8" stroke-linecap="round"/>' + SMILE + BLUSH, extra: '<path d="M33 34h8.5v5.5a4 4 0 0 1-4 4h-.5a4 4 0 0 1-4-4z" fill="#FFF6EA" stroke="#5A3E22" stroke-width="1"/><path d="M41.5 35.8h1.4a1.9 1.9 0 0 1 0 3.8h-1.4" fill="none" stroke="#5A3E22" stroke-width="1"/><path d="M35.8 31.5q1-1.5 0-3M38.8 31.5q1-1.5 0-3" stroke="#FFF6EA" stroke-width="1.1" fill="none" stroke-linecap="round"/>' },
  { id: 'c29', label: 'Ninja', bg: '#4A4E69', fur: 'black', face: '<rect x="11" y="25.5" width="26" height="7" fill="#C23E52"/><path d="M16.5 28l5 1.4M31.5 28l-5 1.4" stroke="#FFF6EA" stroke-width="1.8" stroke-linecap="round"/>', extra: '<path d="M10 27l-6 -3M10 28l-6 2" stroke="#C23E52" stroke-width="1.8" stroke-linecap="round"/>' },
  { id: 'c30', label: 'Rainbow', bg: '#B5E3D8', fur: 'cream', face: EYES_HAPPY + SMILE + BLUSH, extra: '<path d="M14 12.5a10 10 0 0 1 20 0" fill="none" stroke="#E2586B" stroke-width="2"/><path d="M16.6 12.5a7.4 7.4 0 0 1 14.8 0" fill="none" stroke="#F2C14E" stroke-width="2"/><path d="M19.2 12.5a4.8 4.8 0 0 1 9.6 0" fill="none" stroke="#6FC2B5" stroke-width="2"/>' },
  { id: 'c31', label: 'Boba', bg: '#E9D3B6', fur: 'brown', face: EYES_HAPPY + W_MOUTH, extra: '<path d="M4.5 33h8l-1 10h-6z" fill="#F3E2C7" stroke="#7A5A2E" stroke-width=".9"/><path d="M10 33l2.5-6" stroke="#E2586B" stroke-width="1.6" stroke-linecap="round"/><g fill="#3A2A1E"><circle cx="7" cy="41" r="1"/><circle cx="9.5" cy="40.6" r="1"/><circle cx="8.2" cy="38.8" r="1"/></g>' },
  { id: 'c32', label: 'Strawberry', bg: '#FFC2C7', fur: 'white', face: DOTS + SMILE + BLUSH, extra: '<path d="M35 9q6 0 5 6-1.6 5-5 7-3.4-2-5-7-1-6 5-6z" fill="#E2586B"/><path d="M31.5 9.5l3.5-3 3.5 3-3.5 1z" fill="#7FB98A"/><g fill="#FFE9A8"><circle cx="33.5" cy="13" r=".6"/><circle cx="36.5" cy="13" r=".6"/><circle cx="35" cy="16" r=".6"/></g>' },
  { id: 'c33', label: 'Sailor', bg: '#7FB3D5', fur: 'white', face: DOTS + W_MOUTH + BLUSH, extra: '<path d="M15 12.5q9-6 18 0z" fill="#FFFFFF" stroke="#2E4A6B" stroke-width="1"/><rect x="15" y="11.5" width="18" height="2.4" fill="#2E4A6B"/>' },
  { id: 'c34', label: 'Grandma', bg: '#D8C3E6', fur: 'gray', face: '<circle cx="19" cy="29" r="3.4" fill="none" stroke="S" stroke-width="1.2"/><circle cx="29" cy="29" r="3.4" fill="none" stroke="S" stroke-width="1.2"/><path d="M22.4 29h3.2" stroke="S" stroke-width="1.2"/><path d="M17.3 29.4q1.7 1.2 3.4 0M27.3 29.4q1.7 1.2 3.4 0" fill="none" stroke="S" stroke-width="1.3" stroke-linecap="round"/>' + SMILE + BLUSH, extra: '<circle cx="24" cy="7.5" r="4.2" fill="#E7E2DA" stroke="#B9AE9F" stroke-width=".8"/>' },
  { id: 'c35', label: 'Super Paw', bg: '#6C5CE7', fur: 'cream', face: '<path d="M16 25.5l5 1.4M32 25.5l-5 1.4" stroke="S" stroke-width="1.6" stroke-linecap="round"/>' + DOTS + SMILE, extra: '<path d="M8 47q2-9 8-11h16q6 2 8 11z" fill="#E2586B"/><circle cx="24" cy="40.5" r="4" fill="#F2C14E" stroke="#FFF6EA" stroke-width=".8"/><g fill="#7A5A2E"><circle cx="24" cy="41.5" r="1.3"/><circle cx="22" cy="39.2" r=".7"/><circle cx="24" cy="38.5" r=".7"/><circle cx="26" cy="39.2" r=".7"/></g>' },
  { id: 'c36', label: 'Robot', bg: '#6FB7B2', fur: 'gray', face: '<rect x="13.5" y="25" width="21" height="7.5" rx="3.7" fill="#1B1714"/><rect x="16" y="27.2" width="5" height="3" rx="1.5" fill="#7FE0F0"/><rect x="27" y="27.2" width="5" height="3" rx="1.5" fill="#7FE0F0"/><path d="M21 36h6" stroke="S" stroke-width="1.6" stroke-linecap="round"/>', extra: '<path d="M24 12.5V6" stroke="#2E2621" stroke-width="1.4"/><circle cx="24" cy="5" r="2.2" fill="#E2586B"/>' },
  { id: 'c37', label: 'Lightning', bg: '#2D9CDB', fur: 'white', face: EYES_HAPPY + W_MOUTH + BLUSH, extra: '<path d="M38 2l-7 10h4.5l-3 9 9-12h-4.5l3.5-7z" fill="#F2D06B" stroke="#FFF6EA" stroke-width=".7" stroke-linejoin="round"/>' },
  { id: 'c38', label: 'Bunny ears', bg: '#F7D6E0', fur: 'white', face: DOTS + SMILE + BLUSH, extra: '<ellipse cx="18.5" cy="7.5" rx="3.2" ry="7.5" fill="#FFFFFF" stroke="#F2B8C6" stroke-width=".8"/><ellipse cx="18.5" cy="8" rx="1.4" ry="5" fill="#F6C9C9"/><ellipse cx="29.5" cy="7.5" rx="3.2" ry="7.5" fill="#FFFFFF" stroke="#F2B8C6" stroke-width=".8"/><ellipse cx="29.5" cy="8" rx="1.4" ry="5" fill="#F6C9C9"/>' },
  { id: 'c39', label: 'Pudding', bg: '#FFE8A3', fur: 'ginger', face: DOTS + SMILE + BLUSH, extra: '<path d="M32.5 37.5h10.5l-1.6 7h-7.3z" fill="#F5D27A" stroke="#C99A3E" stroke-width=".7"/><path d="M33 37.5q5-4.5 9.5 0z" fill="#8A5A2B"/>' },
  { id: 'c40', label: 'Alien', bg: '#3B3561', fur: 'purple', face: '<ellipse cx="19" cy="29" rx="2.6" ry="3.4" fill="#1B1714"/><ellipse cx="29" cy="29" rx="2.6" ry="3.4" fill="#1B1714"/><circle cx="19.8" cy="27.8" r=".9" fill="#fff"/><circle cx="29.8" cy="27.8" r=".9" fill="#fff"/>' + SMILE, extra: '<path d="M19 13l-3-8M29 13l3-8" stroke="#B79CE8" stroke-width="1.4" stroke-linecap="round"/><circle cx="16" cy="4.5" r="2" fill="#7FE0A8"/><circle cx="32" cy="4.5" r="2" fill="#7FE0A8"/>' },
  { id: 'c41', label: 'Strong', bg: '#F28C28', fur: 'ginger', face: '<path d="M16 25.5l5 1.6M32 25.5l-5 1.6" stroke="S" stroke-width="1.8" stroke-linecap="round"/>' + DOTS + '<path d="M20.5 33.5q3.5 2.6 7 0" fill="none" stroke="S" stroke-width="1.6" stroke-linecap="round"/>', extra: '<rect x="31" y="38" width="11" height="2.2" fill="#2E2621"/><rect x="29.5" y="35" width="3.2" height="8.2" rx="1" fill="#2E2621"/><rect x="40.3" y="35" width="3.2" height="8.2" rx="1" fill="#2E2621"/>' },
  { id: 'c42', label: 'Astronaut', bg: '#1F2A44', fur: 'white', face: DOTS + W_MOUTH + BLUSH, extra: '<circle cx="24" cy="25.5" r="15.5" fill="rgba(160,216,239,.16)" stroke="#E7E2DA" stroke-width="2"/><path d="M14 18q3-5 8-6" fill="none" stroke="#FFFFFF" stroke-width="1.6" stroke-linecap="round" opacity=".8"/><text x="38" y="9" font-size="7" fill="#F2D06B">★</text><text x="5" y="14" font-size="5" fill="#F2D06B">★</text>' },
  { id: 'c43', label: 'Witch', bg: '#5B3A7A', fur: 'black', face: '<circle cx="19" cy="29.5" r="2" fill="#E9C46A"/><circle cx="29" cy="29.5" r="2" fill="#E9C46A"/>' + W_MOUTH, extra: '<ellipse cx="24" cy="12.8" rx="12" ry="2.3" fill="#2E2621"/><path d="M17.5 12.5l6.5-11.5 2 4 4.5 7.5z" fill="#2E2621"/><rect x="18" y="9.6" width="12" height="2" fill="#B07CD8"/>' },
  { id: 'c44', label: 'Dino', bg: '#9BD17E', fur: 'cream', face: EYES_HAPPY + SMILE + BLUSH, extra: '<path d="M15 13l2.6-4.5 2.6 4.5zM21.4 12l2.6-5 2.6 5zM27.8 13l2.6-4.5 2.6 4.5z" fill="#4E9F3D"/>' },
  { id: 'c45', label: 'Cloud', bg: '#BFE6FF', fur: 'white', face: '<path d="M16.5 29h5M26.5 29h5" stroke="S" stroke-width="1.8" stroke-linecap="round"/>' + SMILE + BLUSH, extra: '<path d="M31.5 15a3.6 3.6 0 0 1 .4-7.2 4.6 4.6 0 0 1 8.7 1.6 3 3 0 0 1 .4 5.6z" fill="#FFFFFF"/><path d="M4 22a2.6 2.6 0 0 1 .3-5.2 3.4 3.4 0 0 1 6.3 1.1 2.2 2.2 0 0 1 .3 4.1z" fill="#FFFFFF" opacity=".85"/>' },
  { id: 'c46', label: 'Pirate', bg: '#3E7CB1', fur: 'ginger', face: '<circle cx="19" cy="29" r="2" fill="S"/><circle cx="29" cy="29" r="3.4" fill="#1B1714"/><path d="M12 24.5l25 8" stroke="#1B1714" stroke-width="1.1"/>' + SMILE, extra: '<path d="M14.5 13.5q9.5-6 19 0v1.5h-19z" fill="#C23E52"/><g fill="#FFF6EA"><circle cx="20" cy="12" r=".8"/><circle cx="24" cy="10.8" r=".8"/><circle cx="28" cy="12" r=".8"/></g><path d="M33.5 14l4 2-3 1.5z" fill="#C23E52"/>' },
  { id: 'c47', label: 'Mermaid', bg: '#7FD1C7', fur: 'cream', face: EYES_HAPPY + SMILE + BLUSH, extra: '<path d="M29 45q9-1 10-10" fill="none" stroke="#3FA79A" stroke-width="5" stroke-linecap="round"/><path d="M39.5 35.5l-5.5-4.5q4.5 0 5.2 2.2q1.4-2.2 5.8-1.6z" fill="#5FC3B4"/><path d="M29.5 13a4.5 4.5 0 0 1 9 0z" fill="#F7A9C4"/><path d="M34 13v-3.8M31.8 13l-1.2-3.2M36.2 13l1.2-3.2" stroke="#E07FA5" stroke-width=".7"/>' },
  { id: 'c48', label: 'Fish lover', bg: '#9ED2F0', fur: 'gray', face: DOTS + W_MOUTH + BLUSH, extra: '<path d="M29 40.5q6.5-5.5 13 0q-6.5 5.5-13 0z" fill="#F28C28"/><path d="M41.5 40.5l4.5-3.5v7z" fill="#F28C28"/><circle cx="32.3" cy="39.8" r=".9" fill="#2E2621"/><path d="M35 37.5q1 3 0 6" fill="none" stroke="#D96E12" stroke-width=".7"/>' },
  { id: 'c49', label: 'Parrot pal', bg: '#BDE8C8', fur: 'cream', face: DOTS + SMILE + BLUSH, extra: '<ellipse cx="35.5" cy="11.5" rx="3.6" ry="5" fill="#3FA34D"/><circle cx="36" cy="6.3" r="3.1" fill="#E2463B"/><path d="M38.8 6l2.4 1.3-2.4 1z" fill="#F2C14E"/><circle cx="36.9" cy="5.6" r=".75" fill="#1B1714"/><path d="M33.5 15.5l-1.6 4.2M36.5 16l.6 4.2" stroke="#2E7FD1" stroke-width="1.7" stroke-linecap="round"/>' },
  { id: 'c50', label: 'Butterfly', bg: '#F3D1F4', fur: 'white', face: EYES_HAPPY + SMILE + BLUSH, extra: '<g transform="translate(34.5 9)"><path d="M0 0q-6-6.5-7.5 0q1.2 4 7.5 0zM0 0q6-6.5 7.5 0q-1.2 4-7.5 0z" fill="#B07CD8"/><path d="M0 0q-5.5 4.5-4.5 6.5q3.2 0 4.5-6.5zM0 0q5.5 4.5 4.5 6.5q-3.2 0-4.5-6.5z" fill="#F59AAE"/><path d="M0-2.5v5.5" stroke="#2E2621" stroke-width="1.1" stroke-linecap="round"/></g>' },
  { id: 'c51', label: 'Bee', bg: '#FFF0B3', fur: 'yellow', face: DOTS + SMILE + BLUSH + '<rect x="11" y="38" width="26" height="2.4" fill="#2E2621"/>', extra: '<path d="M19.5 12.5l-2.8-6M28.5 12.5l2.8-6" stroke="#2E2621" stroke-width="1.2" stroke-linecap="round"/><circle cx="16.4" cy="6" r="1.7" fill="#2E2621"/><circle cx="31.6" cy="6" r="1.7" fill="#2E2621"/><ellipse cx="8.5" cy="25" rx="4" ry="6" fill="rgba(255,255,255,.8)" stroke="#9ED2F0" stroke-width=".8"/><ellipse cx="39.5" cy="25" rx="4" ry="6" fill="rgba(255,255,255,.8)" stroke="#9ED2F0" stroke-width=".8"/>' },
  { id: 'c52', label: 'Dragon', bg: '#F6C177', fur: 'green', face: EYES_HAPPY + SMILE, extra: '<path d="M17.5 13.5l-.8-5.5 3.3 4.4zM30.5 13.5l.8-5.5-3.3 4.4z" fill="#B5651D"/><path d="M12 27l-8-7 1.2 10 3.2-1.2 1 4.2z" fill="#4E9F3D"/><path d="M36 27l8-7-1.2 10-3.2-1.2-1 4.2z" fill="#4E9F3D"/><circle cx="20" cy="36" r="1" fill="#F2D06B"/>' }
);
catOf = function (p) {   // people who never picked keep the same cat when new ones are added
  var name = typeof p === 'string' ? p : (p && p.name) || '', pick = p && typeof p === 'object' && catById(p.avatar);
  if (pick) return pick;
  for (var i = 0; i < 5; i++) if (CATS[i].key.test(name)) return CATS[i];
  var h = 0; for (var j = 0; j < name.length; j++) h = (h * 31 + name.charCodeAt(j)) % 997;
  return CATS[5 + h % 13];
};

// ---------- left menu: Bookings and Payments are separate ----------
NAV.bookings = ['Bookings', '#8E3B46', 2, false];
NAV.payments = ['Payments', '#B07A3A', 3, true];
NAV.records[2] = 4; NAV.upkeep[2] = 5; NAV.announce[2] = 6;
var plainBookingsHtml = bookingsHtml;
bookingsHtml = function () { return plainBookingsHtml().replace('<h1>Bookings &amp; payments</h1>', '<h1>Bookings</h1>'); };

// ---------- saved accounts ----------
// Accounts saved on this device ("Keep me signed in"): tap the cat on the sign-in page to go straight in.
function savedAccts() { try { return JSON.parse(localStorage.getItem('lo_accts') || '{}') || {}; } catch (e) { return {}; } }
function saveAcct(name, email, token) { try { var a = savedAccts(); a[name] = { email: email, token: token }; localStorage.setItem('lo_accts', JSON.stringify(a)); } catch (e) {} }
function forgetAcct(name) { try { var a = savedAccts(); delete a[name]; localStorage.setItem('lo_accts', JSON.stringify(a)); } catch (e) {} }

// ---------- sign-in screen ----------
renderLogin = function () {
  if (L.staff === null) {
    try { L.staff = JSON.parse(localStorage.getItem('lo_pick') || '[]'); } catch (e) { L.staff = []; }   // the tiles from last time show at once…
    post({ action: 'staffPicker' }).then(function (list) {   // …then the latest list
      var changed = JSON.stringify(list || []) !== JSON.stringify(L.staff);
      L.staff = list || []; try { localStorage.setItem('lo_pick', JSON.stringify(L.staff)); } catch (e) {}
      if (L.pick) pickAcct(L.pick);
      if (!S.token && changed) renderLogin();
    }).catch(function () {});
  }
  var accts = savedAccts();
  var isOp = L.role !== 'admin';
  var tiles = L.staff.map(function (s) {   // everyone is shown; tapping a tile picks the role too
    var on = L.pick === s.name, c = catOf(s).bg;
    var dim = L.role && !on && ((s.role === 'operator') !== (L.role === 'operator'));
    return '<button type="button" class="acct' + (dim ? ' dim' : '') + '" data-acct="' + esc(s.name) + '" aria-pressed="' + on + '" style="' + (on ? 'background:' + c + '1f;border:2px solid ' + c + ';box-shadow:0 8px 18px ' + c + '33' : '') + '">' +
      catSvg(s, 52) + '<span>' + esc(s.name) + '</span><small>' + (L.opening === s.name ? 'Opening…' : accts[s.name] ? '✓ Saved' : roleShort(s.role)) + '</small></button>';
  }).join('');
  var ring = 'STAFF ONLY ✦ ON TIME ✦ SPOTLESS ✦ COZY STAYS ✦ STAFF ONLY ✦ ON TIME ✦ SPOTLESS ✦ COZY STAYS ✦ ';
  app.innerHTML = '<div class="login">' +
    '<section class="lside"><div class="in"><div class="ringbox">' +
    '<svg viewBox="0 0 600 600" aria-hidden="true"><defs><path id="circS" d="M300,300 m-270,0 a270,270 0 1,1 540,0 a270,270 0 1,1 -540,0"/></defs><text font-size="22" letter-spacing="4" fill="#C9A96E" font-family="Jost, sans-serif"><textPath href="#circS" textLength="1690" lengthAdjust="spacing">' + ring + '</textPath></text></svg>' +
    '<div class="ph2"><div>' + (L.pick ? '<span class="bigcat">' + catSvg(pickedStaff(), 220) + '</span>' : '<img src="../assets/img/living-room-night.jpg" alt="" onerror="this.onerror=null;this.src=\'../assets/img/logo.png\';this.style.objectFit=\'contain\'">') + '</div></div></div>' +
    '<div class="script">Luna\'s</div><div class="oasis">OASIS</div><div class="rule">Staff portal</div></div></section>' +
    '<section class="lmain"><form class="lcard" id="lf" novalidate>' +
    '<p class="wb">Welcome back</p><h1>Staff sign-in</h1>' +
    '<span class="lbl">I am signing in as</span>' +
    '<div class="roles" role="group" aria-label="Role"><button type="button" data-lrole="admin" aria-pressed="' + (L.role === 'admin') + '">Admin</button><button type="button" data-lrole="operator" aria-pressed="' + (L.role === 'operator') + '">Operator</button></div>' +
    (tiles ? '<span class="lbl">Who\'s signing in?</span><div class="accts" role="group" aria-label="Staff">' + tiles + '</div>' : '') +
    '<label class="lbl" for="le">Gmail</label><input class="linp" id="le" type="email" autocomplete="username" inputmode="email" placeholder="yourname@gmail.com" value="' + esc(L.email) + '">' +
    '<label class="lbl" for="lp">Password</label><input class="linp" id="lp" type="password" autocomplete="current-password" placeholder="••••••••" value="' + esc(L.pw) + '">' +
    '<div class="lrow"><label><input type="checkbox" id="lr"' + (L.remember ? ' checked' : '') + '> Keep me signed in</label><span>Forgot password? ' + (isOp ? 'Ask the admin.' : 'Reset it from the Sheet menu.') + '</span></div>' +
    (S.loginErr ? '<div class="err" role="alert" style="margin:-10px 0 18px">' + esc(S.loginErr) + '</div>' : '') +
    '<button class="go" id="lgo"' + (loginReady() && !S.busy ? '' : ' disabled') + '>' + esc(goLabel()) +
    ' <svg width="26" height="14" viewBox="0 0 26 14" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 7h23M18 1l6 6-6 6"/></svg></button>' +
    '<p class="lback"><a href="../">← Back to the website</a></p></form></section></div>';
  var f = document.getElementById('lf');
  f.addEventListener('click', function (e) {
    var b = e.target.closest('[data-lrole],[data-acct]');
    if (!b) return;
    if (b.dataset.lrole) {
      L.role = b.dataset.lrole; S.loginErr = '';
      var cur = L.staff.filter(function (s) { return s.name === L.pick; })[0];
      if (cur && (cur.role === 'operator') !== (L.role === 'operator')) { L.pick = ''; L.email = ''; L.pw = ''; }
    } else {
      if (S.busy) return;
      S.loginErr = '';
      if (savedAccts()[b.dataset.acct]) { resumeAcct(b.dataset.acct); return; }   // saved on this device: straight in
      pickAcct(b.dataset.acct);
    }
    renderLogin();
  });
  f.addEventListener('input', function (e) {
    if (e.target.id === 'le') L.email = e.target.value;
    if (e.target.id === 'lp') L.pw = e.target.value;
    if (e.target.id === 'lr') L.remember = e.target.checked;
    document.getElementById('lgo').disabled = !loginReady() || S.busy;
  });
  f.addEventListener('change', function (e) { if (e.target.id === 'lr') L.remember = e.target.checked; });
  f.addEventListener('submit', function (e) {
    e.preventDefault();
    if (!loginReady()) { S.loginErr = 'Please enter your Gmail and password.'; renderLogin(); return; }
    S.remember = L.remember; S.busy = true; S.loginErr = ''; renderLogin();
    post({ action: 'staffLogin', email: L.email.trim(), password: L.pw, remember: L.remember }).then(function (d) {
      S.token = d.token; S.me = d.me; store('lo_staff', d.token); S.busy = false; L.pw = '';
      if (L.remember) {
        try { var m = savedMails(); m[d.me.name] = d.me.email; if (L.pick) m[L.pick] = d.me.email; localStorage.setItem('lo_mails', JSON.stringify(m)); } catch (x) {}
        saveAcct(d.me.name, d.me.email, d.token); if (L.pick && L.pick !== d.me.name) saveAcct(L.pick, d.me.email, d.token);
      }
      clearCache();
      if (d.boot) boot(d.boot); else loadAll();   // the bookings came with the sign-in: no second wait
    }).catch(function (err) {
      S.busy = false; S.loginErr = err.message === 'Failed to fetch' ? 'Could not reach the server.' : err.message; renderLogin();
    });
  });
};
// Tapping a saved account: one quick trip to the server, then the dashboard.
function resumeAcct(name) {
  var a = savedAccts()[name];
  L.opening = name; S.busy = true; renderLogin();
  S.token = a.token; S.remember = true;
  post({ action: 'staffResume', token: a.token }).then(function (d) {
    L.opening = ''; S.busy = false; store('lo_staff', a.token); clearCache(); boot(d);
  }).catch(function (err) {
    L.opening = ''; S.busy = false; S.token = '';
    if (err && err.auth) { forgetAcct(name); pickAcct(name); S.loginErr = 'Please type the password once more for ' + shortName(name) + '.'; }
    else S.loginErr = err && err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not reach the server.';
    renderLogin();
  });
}
function boot(d) {   // show the portal with bookings already in hand
  S.data = d; S.me = d.me; S.stale = false; S.offline = false; saveCache('bk', d);
  if (!S.landed) { S.landed = true; if (isFinance() && PAGES.overview && S.page === 'bookings') { S.page = 'overview'; PAGES.overview.enter(); } }
  render();
  prefetch();
}
signOut = function (msg) { L.staff = null; L.opening = ''; S.landed = false; S.page = 'bookings'; L.role = ''; L.pick = ''; L.email = ''; L.pw = ''; S.avPick = false; S.token = ''; S.data = null; S.up = null; S.an = null; clearCache(); S.open = ''; S.menu = false; store('lo_staff', null); S.loginErr = msg || ''; renderLogin(); };
loadAll = function (fresh) {
  var cached = !S.data && readCache('bk');
  if (cached) { S.data = cached; S.me = cached.me; S.stale = true; render(); }   // show the last data right away…
  else if (!S.data) app.innerHTML = '<div class="loading"><div class="spin"></div>Loading bookings…</div>';
  else { S.stale = true; render(); }
  post({ action: 'staffBookings', fresh: !!fresh }).then(function (d) {      // …then swap in the fresh data
    boot(d);   // admins start on Overview
  }).catch(function (err) {
    if (err.auth) { signOut('Please sign in again.'); return; }
    S.stale = false;
    var msg = err.message && err.message !== 'Failed to fetch' ? err.message : 'Could not reach the server. Check your internet and try again.';
    if (S.data) { S.offline = msg; render(); return; }
    app.innerHTML = '<div class="loading"><p style="color:var(--cream);margin:0 0 14px">' + esc(msg) + '</p><button type="button" class="pill gold" id="retry">Try again</button></div>';
    document.getElementById('retry').onclick = function () { loadAll(true); };
  });
};

// ---------- "Log out & forget me on this device" in the cat menu ----------
var plainRender = render;
render = function () {
  var dr = S.avPick && app.querySelector('.drawer'), keep = dr ? dr.scrollTop : 0;   // the picture list stays where you scrolled
  plainRender();
  dr = S.avPick && app.querySelector('.drawer'); if (dr && keep) dr.scrollTop = keep;
  var lo = S.menu && app.querySelector('.menu [data-act="logout"]');
  if (lo && S.me && savedAccts()[S.me.name] && !app.querySelector('[data-act="forget"]'))
    lo.insertAdjacentHTML('afterend', '<button type="button" class="out" data-act="forget" style="font-size:12.5px">Log out &amp; forget me on this device</button>');
  var grid = S.avPick && app.querySelector('.catgrid');
  if (grid) {
    grid.querySelectorAll('button').forEach(function (b) { b.disabled = false; });
    var c = catById(S.me.avatar) || catOf(S.me);
    grid.insertAdjacentHTML('beforebegin', '<p class="avstat" role="status">' + (S.avSaving ? 'Saving “' + esc(c.label) + '”…' : S.avSaved ? '✓ Saved — everyone now sees “' + esc(c.label) + '”.' : 'Now: “' + esc(c.label) + '”') + '</p>');
    if (!S.avSaving && !S.avSaved) { var on = grid.querySelector('[aria-pressed="true"]'); if (on && on.scrollIntoView) on.scrollIntoView({ block: 'nearest' }); }
  }
};
// ---------- picture picker: the cat you tap lights up right away ----------
(function () {
  var st = document.createElement('style');
  st.textContent =
    '.catgrid button{transition:transform .12s,box-shadow .12s,background .12s;position:relative}' +
    '.catgrid button:active{transform:scale(.94)}' +
    '.catgrid button[aria-pressed="true"]{border:2px solid #C9A96E;background:#F3E6C8;box-shadow:0 0 0 3px rgba(201,169,110,.45),0 8px 18px rgba(122,90,46,.25);transform:scale(1.04)}' +
    '.catgrid button[aria-pressed="true"] span{color:#7A5A2E;font-weight:700}' +
    '.catgrid button[aria-pressed="true"]::after{content:"\\2713";position:absolute;top:6px;right:6px;width:22px;height:22px;border-radius:50%;background:#2F5A47;color:#fff;font-size:13px;font-weight:700;line-height:22px;text-align:center}' +
    '.avstat{margin:0 0 10px;font-size:13px;font-weight:600;color:#2F5A47}';
  document.head.appendChild(st);
})();
function avPick(id) {
  var old = S.me.avatar;
  S.me.avatar = id; S.avSaving = id; S.avSaved = false; S.error = '';
  if (S.an && S.an.people) S.an.people.forEach(function (p) { if (p.email === S.me.email) p.avatar = id; });
  render();
  post({ action: 'staffSetAvatar', avatar: id }, 1).then(function (d) {
    if (S.avSaving !== id) return;   // they already tapped another one
    S.avSaving = ''; S.avSaved = true; S.data = d; S.me = d.me; saveCache('bk', d); render();
  }).catch(function (err) {
    if (S.avSaving !== id) return;
    S.avSaving = ''; S.me.avatar = old; fail(err);
  });
}

PAGES.accounts = {
  show: function () { return false; },
  click: function (e) {
    var cat = e.target.closest('[data-cat]');
    if (cat) { avPick(cat.dataset.cat); return true; }
    if (e.target.closest('[data-act="avatar"]')) { S.avSaved = false; S.avSaving = ''; return false; }
    var el = e.target.closest('[data-act="forget"]');
    if (!el) return false;
    forgetAcct(S.me.name); signOut('');
    return true;
  }
};