"use client"

import React,{ useEffect,useRef,useState } from "react"

export default function LeadMap({
  onPrefillLeadAddress
}:any){

  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<any>(null)

  const [markers,setMarkers] = useState<any[]>([])

  async function loadNearbyLeads(
    lat:number,
    lon:number
  ){

    const res =
      await fetch(
        "/api/leads-nearby",
        {
          method:"POST",
          headers:{
            "Content-Type":"application/json"
          },
          body:JSON.stringify({
            lat,
            lon,
            radius:1
          })
        }
      )

    const data =
      await res.json()

    return data.leads || []

  }

  useEffect(()=>{

    async function init(){

      const L =
        (await import("leaflet")).default

      if(!mapContainerRef.current){
        return
      }

      const map =
        L.map(mapContainerRef.current)
        .setView([32.7157,-117.1611],13)

      mapRef.current = map

      L.tileLayer(
        "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        { attribution:"OpenStreetMap" }
      ).addTo(map)

      navigator.geolocation.getCurrentPosition(
        async(pos)=>{

          const lat =
            pos.coords.latitude

          const lon =
            pos.coords.longitude

          map.setView([lat,lon],15)

          const leads =
            await loadNearbyLeads(
              lat,
              lon
            )

          leads.forEach((lead:any)=>{

            const marker =
              L.circleMarker(
                [lead.lat,lead.lon],
                {
                  radius:6,
                  color:"blue"
                }
              )

            marker.addTo(map)

            marker.on("click",()=>{

              const create =
                confirm(
                  `Create lead for\n${lead.address}?`
                )

              if(create){

                onPrefillLeadAddress({
                  display_name:lead.address,
                  lat:lead.lat,
                  lon:lead.lon
                })

              }

            })

          })

        }
      )

    }

    init()

  },[])

  return(

    <div className="border rounded-xl p-4 bg-white">

      <div className="font-medium mb-2">
        Nearby Leads Map
      </div>

      <div
        ref={mapContainerRef}
        className="h-[420px] w-full rounded-xl border"
      />

    </div>

  )

}
