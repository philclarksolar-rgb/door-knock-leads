import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"
import { Resend } from "npm:resend"

const resend = new Resend(Deno.env.get("RESEND_API_KEY"))

serve(async () => {

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  )

  const { data } = await supabase.rpc("get_daily_lead_reminder_payload")

  const followups = data.followups_today
  const expiring = data.newly_expiring

  let body = `Daily Lead Summary\n\n`

  body += `FOLLOW UPS TODAY\n\n`

  followups.forEach((l:any)=>{
    body += `${l.full_name} — ${l.phone} — ${l.address}\n`
  })

  body += `\nNEW EXPIRING LEADS\n\n`

  expiring.forEach((l:any)=>{
    body += `${l.full_name} — ${l.phone} — ${l.address}\n`
  })

  await resend.emails.send({
    from: "reminders@quickdoorleads.com",
    to: "philclarksolar@gmail.com",
    subject: "Daily Lead Reminder",
    text: body
  })

  await supabase.from("reminder_runs").insert({})

  return new Response("Reminder sent")

})
