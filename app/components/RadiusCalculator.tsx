"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window { L?: any; }
}

const DEFAULT_CENTER: [number, number] = [8.508333, 124.759444];
const REFERENCE = "Cabanos Laundry Hub, Bugo-Reyes Main Road, Bugo, Cagayan de Oro City, Philippines";

export default function RadiusCalculator() {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markerRef = useRef<any>(null);
  const circleRef = useRef<any>(null);
  const [radius, setRadius] = useState(3);
  const [unit, setUnit] = useState<"mi" | "km">("mi");
  const [center, setCenter] = useState<[number, number]>(DEFAULT_CENTER);
  const [location, setLocation] = useState(REFERENCE);
  const [status, setStatus] = useState("Map starts near Bugo. Confirm the exact Cabanos Laundry Hub pin before using this as a client territory boundary.");
  const [ready, setReady] = useState(false);

  const radiusKm = unit === "mi" ? radius * 1.609344 : radius;
  const areaKm2 = Math.PI * radiusKm * radiusKm;
  const circumferenceKm = 2 * Math.PI * radiusKm;

  useEffect(() => {
    if (!mapRef.current || mapInstance.current) return;
    const load = async () => {
      if (!document.querySelector('link[data-leaflet="true"]')) {
        const css = document.createElement("link");
        css.rel = "stylesheet";
        css.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        css.dataset.leaflet = "true";
        document.head.appendChild(css);
      }
      if (!window.L) {
        await new Promise<void>((resolve, reject) => {
          const existing = document.querySelector('script[data-leaflet="true"]') as HTMLScriptElement | null;
          if (existing) {
            existing.addEventListener("load", () => resolve(), { once: true });
            existing.addEventListener("error", () => reject(new Error("Map library failed to load.")), { once: true });
            if (window.L) resolve();
            return;
          }
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.dataset.leaflet = "true";
          script.onload = () => resolve();
          script.onerror = () => reject(new Error("Map library failed to load."));
          document.body.appendChild(script);
        });
      }
      const L = window.L;
      if (!L || !mapRef.current || mapInstance.current) return;
      const map = L.map(mapRef.current).setView(DEFAULT_CENTER, 14);
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(map);
      mapInstance.current = map;
      markerRef.current = L.marker(DEFAULT_CENTER, { draggable: true }).addTo(map)
        .bindPopup("Bugo reference area — drag this pin to the exact business entrance.");
      circleRef.current = L.circle(DEFAULT_CENTER, {
        radius: 3 * 1609.344, color: "#e43b32", weight: 3, fillColor: "#f04a3d", fillOpacity: 0.16
      }).addTo(map);
      markerRef.current.on("dragend", (event: any) => {
        const p = event.target.getLatLng();
        setCenter([p.lat, p.lng]);
        setLocation("Custom map pin, Bugo / Cagayan de Oro");
      });
      map.on("click", (event: any) => {
        const p = event.latlng;
        setCenter([p.lat, p.lng]);
        setLocation("Custom map pin, selected on map");
      });
      setReady(true);
    };
    load().catch(() => setStatus("The interactive map could not load. Check your connection or use one of the external radius tools below."));
    return () => {
      if (mapInstance.current) {
        mapInstance.current.remove();
        mapInstance.current = null;
        markerRef.current = null;
        circleRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (!ready || !window.L || !mapInstance.current) return;
    const L = window.L;
    const point = L.latLng(center[0], center[1]);
    markerRef.current?.setLatLng(point);
    circleRef.current?.setLatLng(point).setRadius(radiusKm * 1000);
    mapInstance.current.fitBounds(circleRef.current.getBounds(), { padding: [24, 24] });
  }, [center, radiusKm, ready]);

  async function locateReference() {
    setStatus("Searching for the reference business…");
    try {
      const q = encodeURIComponent(REFERENCE);
      const response = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" + q);
      const results = await response.json();
      if (!results.length) {
        setStatus("The exact business pin was not found by the map search. The map is centered on the Bugo area; drag the marker or click the exact location to refine it.");
        return;
      }
      const point: [number, number] = [Number(results[0].lat), Number(results[0].lon)];
      setCenter(point);
      setLocation(REFERENCE);
      mapInstance.current?.setView(point, 16);
      setStatus("A matching map result was found. Please verify that the pin is on Cabanos Laundry Hub before using the radius for territory decisions.");
    } catch {
      setStatus("Could not search the reference business right now. You can still position the pin manually on the map.");
    }
  }

  async function searchAddress(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const input = (event.currentTarget.elements.namedItem("address") as HTMLInputElement).value.trim();
    if (!input) return;
    setStatus("Searching for the address…");
    try {
      const response = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" + encodeURIComponent(input + ", Cagayan de Oro, Philippines"));
      const results = await response.json();
      if (!results.length) { setStatus("No matching address found. Try a nearby landmark or place the pin directly on the map."); return; }
      const point: [number, number] = [Number(results[0].lat), Number(results[0].lon)];
      setCenter(point);
      setLocation(results[0].display_name);
      mapInstance.current?.setView(point, 15);
      setStatus("Location found. Click or drag the pin to fine-tune the center point.");
    } catch { setStatus("Address search is temporarily unavailable. Try placing the pin directly on the map."); }
  }

  const googleMapsUrl = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(center[0] + "," + center[1]);
  const googleDirectionsUrl = "https://www.google.com/maps/dir/?api=1&destination=" + encodeURIComponent(center[0] + "," + center[1]);

  return <section className="radiusSection" id="radius-calculator">
    <div className="wrap">
      <div className="sectionHead centered">
        <div className="eyebrow">PIFELEV INTERACTIVE MAP TOOL</div>
        <h2>3-Mile Radius Map Calculator</h2>
        <p>Draw a straight-line coverage circle around a business address, adjust the distance, and inspect the area on the map.</p>
      </div>
      <div className="radiusTool">
        <div className="radiusControls">
          <div className="radiusReference"><span className="radiusBadge">REFERENCE LOCATION</span><strong>Cabanos Laundry Hub</strong><small>Bugo-Reyes Main Road, Bugo, Cagayan de Oro City</small><button type="button" className="radiusTextButton" onClick={locateReference}>Locate reference business ↗</button></div>
          <form className="radiusSearch" onSubmit={searchAddress}><label htmlFor="radius-address">Search another address or business</label><div className="radiusSearchRow"><input id="radius-address" name="address" placeholder="Enter a place or street address"/><button className="btn primary" type="submit">Find</button></div></form>
          <div className="radiusRange"><div className="radiusRangeTop"><label htmlFor="radius-slider">Radius distance</label><strong>{radius.toFixed(2)} {unit === "mi" ? "miles" : "km"}</strong></div><input id="radius-slider" type="range" min="0.25" max="10" step="0.25" value={radius} onChange={e => setRadius(Number(e.target.value))}/><div className="radiusRangeEnds"><span>0.25</span><span>10</span></div><div className="radiusUnit"><button type="button" className={unit === "mi" ? "selected" : ""} onClick={() => { if (unit !== "mi") { setRadius(radius / 1.609344); setUnit("mi"); } }}>Miles</button><button type="button" className={unit === "km" ? "selected" : ""} onClick={() => { if (unit !== "km") { setRadius(radius * 1.609344); setUnit("km"); } }}>Kilometers</button></div></div>
          <div className="radiusMetrics"><div><small>Equivalent distance</small><b>{radiusKm.toFixed(2)} km</b></div><div><small>Approx. circle area</small><b>{areaKm2.toFixed(2)} km²</b></div><div><small>Circumference</small><b>{circumferenceKm.toFixed(2)} km</b></div></div>
          <div className="radiusTip"> <b>How to adjust the map:</b> Drag the red marker or click anywhere on the map to move the center. The radius circle updates automatically.</div>
          <div className="radiusActions"><a className="btn primary" href={googleMapsUrl} target="_blank" rel="noreferrer">Open in Google Maps ↗</a><a className="btn outline" href={googleDirectionsUrl} target="_blank" rel="noreferrer">Directions ↗</a></div>
          <div className="radiusExternal"><b>More radius mapping tools</b><div><a href="https://www.calcmaps.com/map-radius/" target="_blank" rel="noreferrer">CalcMaps</a><a href="https://www.freemaptools.com/radius-around-point.htm" target="_blank" rel="noreferrer">FreeMapTools</a><a href="https://radiusmapper.com/" target="_blank" rel="noreferrer">RadiusMapper</a></div></div>
        </div>
        <div className="radiusMapColumn"><div ref={mapRef} className="radiusMap" aria-label="Interactive radius map centered near Bugo, Cagayan de Oro"/><div className="radiusMapCaption"><span className="mapLegendDot"></span><span>Selected center</span><span className="mapLegendCircle"></span><span>{radius.toFixed(2)} {unit} radius</span></div><p className="radiusStatus" role="status">{status}</p><small className="radiusCoords">Center coordinates: {center[0].toFixed(6)}, {center[1].toFixed(6)} · {location}</small></div>
      </div>
      <p className="radiusDisclaimer">This tool draws a straight-line radius, not a road-distance or drive-time service area. The initial map view is an approximate Bugo-area reference, not a verified surveyed boundary or confirmed exact shop coordinate. Verify the pin before making territory, pricing, or exclusivity decisions. Map tiles © OpenStreetMap contributors.</p>
    </div>
  </section>;
}
