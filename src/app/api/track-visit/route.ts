import { NextResponse } from 'next/server';
import { prisma } from "@/lib/prisma";
import { allowRequest, clientAddress, isPlainIp } from "@/lib/security";
import { deviceFromRequest } from "@/lib/device";

interface GeoLocationData {
  country: string;
  city: string;
}

async function getIpLocation(ip: string): Promise<GeoLocationData | null> {
  if (!isPlainIp(ip)) return null;
  try {
    const response = await fetch(`https://ip-api.com/json/${encodeURIComponent(ip)}?fields=status,country,city`);
    const data = await response.json();
    
    if (data.status === 'success') {
      return {
        country: data.country,
        city: data.city || ''
      };
    }
  } catch (error) {
    console.warn('Failed to get IP location:', error);
  }
  return null;
}

function getClientIp(request: Request): string | null {
  const forwarded = request.headers.get('x-forwarded-for');
  const realIp = request.headers.get('x-real-ip');
  const cfConnectingIp = request.headers.get('cf-connecting-ip');
  
  if (forwarded) {
    const ips = forwarded.split(',').map(ip => ip.trim());
    return ips[0] || null;
  }
  
  if (realIp) return realIp;
  if (cfConnectingIp) return cfConnectingIp;
  
  return null;
}

export async function POST(request: Request) {
  if (!allowRequest(`visit:${clientAddress(request)}`, 60, 60 * 60 * 1000)) {
    return NextResponse.json({ success: true });
  }
  try {
    const text = await request.text();
    if (!text) {
      console.warn('Empty request body in track-visit');
      return NextResponse.json({ success: true });
    }

    let body;
    try {
      body = JSON.parse(text);
    } catch (e) {
      console.warn('Invalid JSON in track-visit:', text);
      return NextResponse.json({ success: true });
    }

    const { path } = body;
    const date = new Date().toISOString().split("T")[0];
    const ipAddress = getClientIp(request) || 'unknown';
    const device = deviceFromRequest(request) || null;

    let country: string | null = null;
    let city: string | null = null;

    if (ipAddress !== 'unknown' && ipAddress !== '127.0.0.1' && ipAddress !== '::1') {
      const location = await getIpLocation(ipAddress);
      if (location) {
        country = location.country;
        city = location.city || null;
      }
    }

    await prisma.pageVisit.upsert({
      where: {
        ipAddress_path_date: {
          ipAddress: ipAddress,
          path: path || "/",
          date: date,
        },
      },
      update: {
        count: {
          increment: 1,
        },
        device,
      },
      create: {
        ipAddress: ipAddress,
        path: path || "/",
        date: date,
        count: 1,
        country: country,
        city: city,
        device,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.warn('Unexpected error in track-visit:', error);
    return NextResponse.json({ success: true });
  }
}
