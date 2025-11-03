import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase-admin';

export async function GET() {
  try {
    // Test read from analytics_counters
    const doc = await db.collection('analytics_counters').doc('main').get();
    
    if (doc.exists) {
      return NextResponse.json({ 
        success: true, 
        message: 'Firebase connection successful',
        data: doc.data()
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        message: 'analytics_counters/main document not found'
      }, { status: 404 });
    }
  } catch (error: any) {
    return NextResponse.json({ 
      success: false, 
      error: error.message 
    }, { status: 500 });
  }
}

