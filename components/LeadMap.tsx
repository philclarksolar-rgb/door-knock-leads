"use client"

import React,{ useEffect,useRef,useState } from "react"

const RADIUS_OPTIONS = [
  0.25,
  0.5,
  1,
  2,
  5,
  10,
  20
]

export default function LeadMap({
  onPrefillLeadAddress
}:any){

  const mapRef = useRef<any>(null)
  const mapContainerRef = useRef<any>(null)
  const layerRef = useRef<any>(null)

  const [radius,setRadius] = useState(1)

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
            radius
          })
        }
      )

    const data =
      await res.json()

    return data.leads || []

  }

  async function refreshMarkers(){

    const map = mapRef.current

    if(!map) return

    const center =
      map.getCenter()

    const leads =
      await loadNearbyLeads(
        center.lat,
        center.lng
      )

    const L = window.L

    layerRef.current.clearLayers()

    leads.forEach((lead:any)=>{

      const marker =
        L.circleMarker(
          [lead.lat,lead.lon],
          {
            radius:6,
            color:"blue"
          }
        )

      marker.addTo(layerRef.current)

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

      layerRef.current =
        L.layerGroup().addTo(map)

      navigator.geolocation.getCurrentPosition(
        async(pos)=>{

          const lat =
            pos.coords.latitude

          const lon =
            pos.coords.longitude

          map.setView([lat,lon],15)

          refreshMarkers()

        }
      )

      map.on("moveend",()=>{

        refreshMarkers()

      })

    }

    init()

  },[])

  useEffect(()=>{

    refreshMarkers()

  },[radius])

  return(

    <div className="border rounded-xl p-4 bg-white space-y-3">

      <div className="flex justify-between items-center">

        <div className="font-medium">
          Nearby Leads Map
        </div>

        <select
          value={radius}
          onChange={(e)=>
            setRadius(
              parseFloat(e.target.value)
            )
          }
          className="border rounded-lg px-2 py-1 text-sm"
        >
          {RADIUS_OPTIONS.map((r)=>(
            <option
              key={r}
              value={r}
            >
              {r} mi
            </option>
          ))}
        </select>

      </div>

      <div
        ref={mapContainerRef}
        className="h-[420px] w-full rounded-xl border"
      />

    </div>

  )

}
