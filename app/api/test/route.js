import { NextResponse } from 'next/server';

export async function GET(request) {
  // This function handles GET requests to /api/test
  return NextResponse.json({ message: 'Success! The API route is working. ✅' });
}