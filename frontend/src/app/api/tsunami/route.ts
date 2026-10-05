import { NextResponse } from 'next/server';

/**
 * Server-side proxy for the NOAA/NWS tsunami Atom feeds.
 *
 * These feeds do not send `Access-Control-Allow-Origin`, so the browser cannot
 * fetch them directly. Proxying through a route handler keeps the client
 * architecture unchanged and lets the client parse the XML with DOMParser.
 *
 * Parsing is deliberately left to the client: DOMParser understands namespaces
 * properly, whereas hand-rolled server-side XML munging risks mis-reading a
 * life-safety bulletin.
 */
const FEEDS = [
  {
    id: 'paaq',
    centre: 'NWS National Tsunami Warning Center (Palmer, AK)',
    url: 'https://www.tsunami.gov/events/xml/PAAQAtom.xml',
  },
  {
    id: 'pheb',
    centre: 'NWS Pacific Tsunami Warning Center (Honolulu, HI)',
    url: 'https://www.tsunami.gov/events/xml/PHEBAtom.xml',
  },
];

// Bulletins change slowly; cache the upstream fetch to stay a good citizen.
export const revalidate = 120;

export async function GET() {
  const feeds = await Promise.all(
    FEEDS.map(async (feed) => {
      try {
        const res = await fetch(feed.url, {
          headers: { Accept: 'application/atom+xml, application/xml, text/xml' },
          next: { revalidate: 120 },
        });
        if (!res.ok) return null;
        return { id: feed.id, centre: feed.centre, xml: await res.text() };
      } catch {
        return null;
      }
    })
  );

  return NextResponse.json({
    feeds: feeds.filter((f): f is NonNullable<typeof f> => f !== null),
  });
}
