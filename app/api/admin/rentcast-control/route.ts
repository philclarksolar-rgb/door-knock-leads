import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function getMonthlyRequestCount() {

  const start = new Date();
  start.setDate(1);
  start.setHours(0,0,0,0);

  const { count, error } = await supabase
    .from("rentcast_api_usage")
    .select("*",{count:"exact",head:true})
    .gte("created_at",start.toISOString());

  if(error) throw error;

  return count ?? 0;
}

async function getSettings(){

  const {data,error} = await supabase
    .from("system_settings")
    .select("key,value");

  if(error) throw error;

  const map:Record<string,string> = {};

  for(const row of data || []){
    map[row.key] = row.value;
  }

  return map;
}

async function setSetting(key:string,value:string){

  const {error} = await supabase
    .from("system_settings")
    .upsert({key,value},{onConflict:"key"});

  if(error) throw error;
}

export async function GET(){

  try{

    const settings = await getSettings();

    const requestCount = await getMonthlyRequestCount();

    return NextResponse.json({

      requestCount,

      globalFreeze: settings.rentcast_global_freeze === "true",

      paidLockUntilReset: settings.rentcast_paid_lock_until_reset === "true",

      alertPending: settings.rentcast_45_alert_pending === "true"

    });

  }catch(error:any){

    return NextResponse.json(
      {error:error?.message ?? "Admin status error"},
      {status:500}
    );

  }

}

export async function POST(req:Request){

  try{

    const body = await req.json();

    const action = body.action;

    if(action === "freeze"){

      await setSetting("rentcast_global_freeze","true");

    }

    if(action === "unfreeze"){

      await setSetting("rentcast_global_freeze","false");

    }

    if(action === "lockPaid"){

      await setSetting("rentcast_paid_lock_until_reset","true");

    }

    if(action === "unlockPaid"){

      await setSetting("rentcast_paid_lock_until_reset","false");

    }

    if(action === "clear45Alert"){

      await setSetting("rentcast_45_alert_pending","false");

    }

    const requestCount = await getMonthlyRequestCount();

    const settings = await getSettings();

    return NextResponse.json({

      success:true,

      requestCount,

      globalFreeze: settings.rentcast_global_freeze === "true",

      paidLockUntilReset: settings.rentcast_paid_lock_until_reset === "true",

      alertPending: settings.rentcast_45_alert_pending === "true"

    });

  }catch(error:any){

    return NextResponse.json(
      {error:error?.message ?? "Admin control error"},
      {status:500}
    );

  }

}
