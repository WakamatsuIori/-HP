// Test candidates 1 & 2 with node-ical
const ical = require('./node_modules/node-ical/node-ical.js');

// === CANDIDATE 1: EXDATE with timezone ===
// ICS with EXDATE;TZID=Asia/Tokyo
const ics1 = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VTIMEZONE
TZID:Asia/Tokyo
BEGIN:STANDARD
DTSTART:19700101T000000
TZOFFSETFROM:+0900
TZOFFSETTO:+0900
TZNAME:JST
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:test-exdate-1
DTSTART;TZID=Asia/Tokyo:20260619T200000
DTEND;TZID=Asia/Tokyo:20260619T210000
RRULE:FREQ=DAILY;COUNT=5
EXDATE;TZID=Asia/Tokyo:20260620T200000
SUMMARY:Test Event
END:VEVENT
END:VCALENDAR`;

const data1 = ical.sync.parseICS(ics1);
const ev1 = Object.values(data1).find(c => c.type === 'VEVENT');

console.log('=== CANDIDATE 1: EXDATE with TZID ===');
console.log('Event UID:', ev1.uid);
console.log('Event start:', ev1.start, 'tz:', ev1.start?.tz);
console.log('EXDATE object:', ev1.exdate);
console.log('EXDATE keys:', ev1.exdate ? Object.keys(ev1.exdate) : 'none');
if (ev1.exdate) {
  for (const [key, val] of Object.entries(ev1.exdate)) {
    console.log(`  Key: "${key}" -> Date: ${val}, tz: ${val?.tz}, toISOString: ${val?.toISOString()}`);
  }
}

console.log('\nRRULE between test:');
const occurrences = ev1.rrule.between(new Date('2026-06-19'), new Date('2026-06-24'), true);
for (const occ of occurrences) {
  console.log(`  Occurrence: ${occ.toISOString()}`);
  
  // Try isExcluded logic from ics.ts
  const isExcluded = Object.values(ev1.exdate || {}).some(
    d => d instanceof Date && Math.abs(d.getTime() - occ.getTime()) < 1000
  );
  console.log(`    Excluded: ${isExcluded}`);
}

// === CANDIDATE 2: RECURRENCE-ID with timezone ===
// ICS with recurrence override in JST (01:00 JST = 16:00 UTC previous day)
const ics2 = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Test//Test//EN
BEGIN:VTIMEZONE
TZID:Asia/Tokyo
BEGIN:STANDARD
DTSTART:19700101T000000
TZOFFSETFROM:+0900
TZOFFSETTO:+0900
TZNAME:JST
END:STANDARD
END:VTIMEZONE
BEGIN:VEVENT
UID:test-override-1
DTSTART;TZID=Asia/Tokyo:20260619T010000
DTEND;TZID=Asia/Tokyo:20260619T020000
RRULE:FREQ=DAILY;COUNT=3
SUMMARY:Test Recurrence
END:VEVENT
BEGIN:VEVENT
UID:test-override-1
RECURRENCE-ID;TZID=Asia/Tokyo:20260620T010000
DTSTART;TZID=Asia/Tokyo:20260620T020000
DTEND;TZID=Asia/Tokyo:20260620T030000
SUMMARY:Test Recurrence - Modified
END:VEVENT
END:VCALENDAR`;

const data2 = ical.sync.parseICS(ics2);
const ev2 = Object.values(data2).find(c => c.type === 'VEVENT');

console.log('\n=== CANDIDATE 2: RECURRENCE-ID with TZID ===');
console.log('Event UID:', ev2.uid);
console.log('Event start:', ev2.start, 'tz:', ev2.start?.tz);
console.log('Recurrences object:', ev2.recurrences);
console.log('Recurrences keys:', ev2.recurrences ? Object.keys(ev2.recurrences) : 'none');

console.log('\nRRULE between test:');
const occurrences2 = ev2.rrule.between(new Date('2026-06-19'), new Date('2026-06-22'), true);
for (const occ of occurrences2) {
  console.log(`  Occurrence: ${occ.toISOString()}`);
  
  // Try parseIcsEvents logic from ics.ts
  const overrideKey = occ.toISOString().slice(0, 10);
  const override = ev2.recurrences?.[overrideKey];
  console.log(`    UTC date key: "${overrideKey}" -> override: ${override ? 'FOUND' : 'NOT FOUND'}`);
}
