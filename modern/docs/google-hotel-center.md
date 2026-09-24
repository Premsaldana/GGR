# Google Hotel Center direct integration

GGR exposes the direct integration endpoints for Goa Garden Resort:

- Hotel List Feed: `https://goagardenresort.vercel.app/api/google/hotel-list.xml`
- Pull pricing/query endpoint: `https://goagardenresort.vercel.app/api/google/query`
- Google landing page: `https://goagardenresort.vercel.app/google-hotel`

## Hotel Center setup

1. Open [Google Hotel Center](https://hotelcenter.google.com/) using the Google account that manages the verified Goa Garden Resort Business Profile.
2. Create or claim the Goa Garden Resort property and resolve the property match against the existing Google Travel/Maps listing.
3. Add the hotel list feed URL above and validate/import it.
4. Choose the Pull pricing delivery mode and configure the query endpoint URL above.
5. Configure the landing page template as:

   `https://goagardenresort.vercel.app/google-hotel?checkinDay=(CHECKINDAY)&checkinMonth=(CHECKINMONTH)&checkinYear=(CHECKINYEAR)&nights=(LENGTH)&hotelId=(PARTNER-HOTEL-ID)&currency=(USER-CURRENCY)&userCountry=(USER-COUNTRY)&userDevice=(USER-DEVICE)`

6. Run Google’s test query and confirm that the displayed dates and total match the Transaction response.
7. Turn on **Live on Google** for the property. Free booking links are free; Hotel Ads are optional and paid.

## Important rate behavior

GGR sends the sum of the configured nightly prices for the requested itinerary in INR. The current pricing model does not store a separate tax or fee schedule, so the feed sends `Tax=0.00` and `OtherFees=0.00`. If taxes or mandatory fees are later added to GGR, update `src/lib/google-hotel.ts` so the feed and the visible landing page use the same totals.

The feed treats a date as unavailable if GGR marks it sold out or if an active/pending reservation overlaps it. A missing nightly price is also treated as unavailable so Google does not receive an incomplete rate.

## Verification checklist

- Confirm the Google Business Profile address, phone, and map point match the hotel list feed.
- Confirm the production deployment has `NEXT_PUBLIC_SITE_URL` set to `https://goagardenresort.vercel.app`.
- Confirm the feed coordinate override matches the verified property location. The default is near the Colva Police Station reference in the supplied address and should be checked in Hotel Center before import.
- Change a price in the GGR admin calendar, then rerun a Google test query for those dates.
- Check Hotel Center Feed Status and Price Accuracy before enabling free booking links.
