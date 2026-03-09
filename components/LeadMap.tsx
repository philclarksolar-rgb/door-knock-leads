// @ts-nocheck
"use client"

import React, { useEffect, useRef, useState } from "react"
import { getTileId } from "@/lib/mapTile"

export default function LeadMap({
  leads,
  onOpenLead,
  onPrefillLeadAddress
}:any){

  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<any>(null)

  const [sales,setSales] = useState<any[]>([])

  async function loadSales(lat:number,lon:number){

    const res =
      await fetch("/api/recent-sales",{
        method:"POST",
        headers:{
          "Content-Type":"application/json"
        },
        body:JSON.stringify({
          lat,
          lon
        })
      })

    const data =
      await res.json()

    if(data.sales){

      setSales(data.sales)

    }

  }

  useEffect(()=>{

    async function init(){

      const L =
        (await import("leaflet")).default

      if(!mapContainerRef.current) return

      const map =
        L.map(mapContainerRef.current)
        .setView([32.7157,-117.1611],13)

      mapRef.current = map

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution:"OpenStreetMap" }
      ).addTo(map)

      navigator.geolocation.getCurrentPosition((pos)=>{

        const lat =
          pos.coords.latitude

        const lon =
          pos.coords.longitude

        map.setView([lat,lon],15)

        loadSales(lat,lon)

      })

      map.on("moveend",()=>{

        const center =
          map.getCenter()

        loadSales(
          center.lat,
          center.lng
        )

      })

    }

    init()

  },[])

  useEffect(()=>{

    const map =
      mapRef.current

    if(!map) return

    sales.forEach((home)=>{

      const L =
        window.L

      const marker =
        L.circleMarker(
          [home.lat,home.lon],
          {
            radius:6,
            color:"gold"
          }
        )

      marker.addTo(map)

      marker.on("click",()=>{

        const confirmLead =
          confirm(
            `Create lead for\n${home.address}?`
          )

        if(confirmLead){

          onPrefillLeadAddress({
            display_name:home.address,
            lat:home.lat,
            lon:home.lon
          })

        }

      })

    })

  },[sales])

  return (

    <div className="border rounded-xl p-4 bg-white">

      <div className="font-medium mb-2">
        Nearby Map
      </div>

      <div
        ref={mapContainerRef}
        className="h-[420px] w-full rounded-xl border"
      />

    </div>

  )

}
