import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const allowedPackages = ["Local Starter", "Local Growth", "Local Dominance"];
const clean = (value: unknown, max = 500) => typeof value === "string" ? value.trim().slice(0,max) : "";

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try { body = await request.json(); } catch { return NextResponse.json({error:"Please submit a valid form."},{status:400}); }
  const lead = {
    contact_name: clean(body.name,120),
    business_name: clean(body.business,160),
    business_category: clean(body.category,120),
    business_area: clean(body.area,160),
    phone: clean(body.phone,60),
    email: clean(body.email,180).toLowerCase(),
    website_or_maps_url: clean(body.website,500),
    interested_package: clean(body.package,50),
    message: clean(body.message,2000),
    source: "website"
  };
  if (!lead.contact_name || !lead.business_name || !lead.business_category || !lead.business_area || !lead.phone) {
    return NextResponse.json({error:"Please complete all required fields."},{status:400});
  }
  if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) return NextResponse.json({error:"Please enter a valid email address."},{status:400});
  if (!allowedPackages.includes(lead.interested_package)) return NextResponse.json({error:"Please select a valid package."},{status:400});
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return NextResponse.json({error:"The inquiry form is not connected yet. Please contact the site administrator to finish setup."},{status:503});
  try {
    const supabase = createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
    const {error} = await supabase.from("audit_leads").insert(lead);
    if (error) throw error;
    return NextResponse.json({ok:true},{status:201});
  } catch (error) {
    console.error("Audit lead insert failed:",error);
    return NextResponse.json({error:"We couldn't save your request right now. Please try again later."},{status:500});
  }
}