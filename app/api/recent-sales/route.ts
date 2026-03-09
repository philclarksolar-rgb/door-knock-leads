import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)

  const lat = searchParams.get("lat")
  const lng = searchParams.get("lng")
  const radius = searchParams.get("radius") || "2"

  const apiKey = process.env.RENTCAST_API_KEY

  if (!apiKey) {
    return NextResponse.json({ error: "Missing API key" }, { status: 500 })
  }

  const url = `https://api.rentcast.io/v1/properties/sale?latitude=${lat}&longitude=${lng}&radius=${radius}&soldWithinMonths=6`

  const res = await fetch(url, {
    headers: {
      "X-Api-Key": apiKey,
    },
  })

  const data = await res.json()

  return NextResponse.json(data)
}
