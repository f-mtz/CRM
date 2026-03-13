import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// PATCH update checklist
export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const body = await request?.json?.();
    const { title } = body ?? {};

    const checklist = await prisma?.checklist?.update?.({
      where: { id: id ?? '' },
      data: { title: title ?? '' },
      include: {
        items: { orderBy: { order: 'asc' } },
      },
    });

    return NextResponse.json(checklist ?? null);
  } catch (error) {
    console.error('Error updating checklist:', error);
    return NextResponse.json({ error: 'Failed to update checklist' }, { status: 500 });
  }
}

// DELETE checklist
export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    
    await prisma?.checklist?.delete?.({
      where: { id: id ?? '' },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error deleting checklist:', error);
    return NextResponse.json({ error: 'Failed to delete checklist' }, { status: 500 });
  }
}
