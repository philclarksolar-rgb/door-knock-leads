import { NextResponse } from "next/server";
import {
  evaluateGovernor,
  insertCachedSales,
  logApiUsage,
} from "@/lib/recentSalesGovernor";

const RENTCAST_KEY = process.env.RENTCAST_API_KEY!;

export async function GET(req: Request) {

  try {

    const { searchParams } = new URL(req.url);

    const lat = Number(searchParams.get("lat"));
    const lng = Number(searchParams.get("lng"));
    const radius = Number(searchParams.get("radius") ?? 15);

    const userId = searchParams.get("userId") || null;
    const isAdmin = searchParams.get("isAdmin") === "true";
    const adminApproval = searchParams.get("adminApproval") === "true";
    const disableUntilReset =
      searchParams.get("disableUntilReset") === "true";

    if (!lat || !lng) {
      return NextResponse.json(
        { error: "Missing coordinates." },
        { status: 400 }
      );
    }

    const decision = await evaluateGovernor({
      lat,
      lng,
      radius,
      userId,
      isAdmin,
      adminApproval,
      disableUntilReset,
    });

    if (decision.kind !== "allow") {
      return NextResponse.json(decision.payload);
    }

    const tileLat = decision.tileLat;
    const tileLon = decision.tileLon;

    const rentcastUrl =
      `https://api.rentcast.io/v1/properties/sale` +
      `?latitude=${tileLat}` +
      `&longitude=${tileLon}` +
      `&radius=6` +
      `&soldWithinMonths=6`;

    const rc = await fetch(rentcastUrl, {
      headers: {
        "X-Api-Key": RENTCAST_KEY,
      },
      cache: "no-store",
    });

    if (!rc.ok) {
      return NextResponse.json(
        { error: `RentCast error ${rc.status}` },
        { status: rc.status }
      );
    }

    const sales = await rc.json();

    const results = Array.isArray(sales)
      ? sales.map((sale: any) => ({
          address:
            sale.formattedAddress ||
            sale.addressLine1 ||
            sale.address ||
            "",
          lat: sale.latitude,
          lon: sale.longitude,
          sale_price: sale.lastSalePrice || null,
          sale_date: sale.lastSaleDate || null,
          tile_lat: tileLat,
          tile_lon: tileLon,
        }))
      : [];

    await insertCachedSales(results);

    await logApiUsage({
      userId,
      lat,
      lng,
      radius,
      paidRequest: decision.paidRequest,
    });

    return NextResponse.json({
      source: "rentcast",
      results,
      requestCount: decision.requestCount + 1,
      adminThresholdWarning: decision.adminThresholdWarning,
      paidRequest: decision.paidRequest,
    });

  } catch (error: any) {

    return NextResponse.json(
      { error: error?.message || "recent-sales error" },
      { status: 500 }
    );

  }
}
