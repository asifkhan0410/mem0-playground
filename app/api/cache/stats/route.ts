import { NextRequest, NextResponse } from 'next/server';
import { requireAuth } from '@/lib/auth-server';
import CacheService from '@/lib/cache';

export async function GET(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const stats = CacheService.getStats();
    
    return NextResponse.json({
      cache: stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // console.error('Error getting cache stats:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const authResult = await requireAuth(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    CacheService.clearAll();
    
    return NextResponse.json({ 
      message: 'Cache cleared successfully',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    // console.error('Error clearing cache:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
