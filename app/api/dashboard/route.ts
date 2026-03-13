import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export const dynamic = 'force-dynamic';

// GET dashboard metrics
export async function GET() {
  try {
    const now = new Date();
    const startOfThisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    // Total contacts (all time)
    const totalContacts = await prisma?.contact?.count?.() ?? 0;

    // New contacts this month vs last month
    const contactsThisMonth =
      (await prisma?.contact?.count?.({
        where: { createdAt: { gte: startOfThisMonth } },
      })) ?? 0;
    const contactsLastMonth =
      (await prisma?.contact?.count?.({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfThisMonth,
          },
        },
      })) ?? 0;
    const totalContactsDelta = contactsThisMonth - contactsLastMonth;
    const totalContactsDeltaPercent =
      contactsLastMonth > 0 ? (totalContactsDelta / contactsLastMonth) * 100 : null;

    // Open deals (lead, in_progress)
    const openDeals = await prisma?.deal?.count?.({
      where: {
        status: { in: ['lead', 'in_progress'] },
      },
    }) ?? 0;

    // New open deals this month vs last month
    const openDealsThisMonth =
      (await prisma?.deal?.count?.({
        where: {
          status: { in: ['lead', 'in_progress'] },
          createdAt: { gte: startOfThisMonth },
        },
      })) ?? 0;
    const openDealsLastMonth =
      (await prisma?.deal?.count?.({
        where: {
          status: { in: ['lead', 'in_progress'] },
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfThisMonth,
          },
        },
      })) ?? 0;
    const openDealsDelta = openDealsThisMonth - openDealsLastMonth;
    const openDealsDeltaPercent =
      openDealsLastMonth > 0 ? (openDealsDelta / openDealsLastMonth) * 100 : null;

    // Total value of open deals
    const deals = await prisma?.deal?.findMany?.({
      where: {
        status: { in: ['lead', 'in_progress'] },
      },
      select: { value: true },
    }) ?? [];
    const totalValue = (deals ?? []).reduce((sum, deal) => sum + (deal?.value ?? 0), 0);

    // Total value of deals created this month vs last month
    const dealsThisMonth =
      (await prisma?.deal?.findMany?.({
        where: {
          status: { in: ['lead', 'in_progress'] },
          createdAt: { gte: startOfThisMonth },
        },
        select: { value: true },
      })) ?? [];
    const dealsLastMonth =
      (await prisma?.deal?.findMany?.({
        where: {
          status: { in: ['lead', 'in_progress'] },
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfThisMonth,
          },
        },
        select: { value: true },
      })) ?? [];
    const totalValueThisMonth = (dealsThisMonth ?? []).reduce(
      (sum, deal) => sum + (deal?.value ?? 0),
      0
    );
    const totalValueLastMonth = (dealsLastMonth ?? []).reduce(
      (sum, deal) => sum + (deal?.value ?? 0),
      0
    );
    const totalValueDelta = totalValueThisMonth - totalValueLastMonth;
    const totalValueDeltaPercent =
      totalValueLastMonth > 0 ? (totalValueDelta / totalValueLastMonth) * 100 : null;

    // Pending tasks (cards without due date past or today)
    const pendingTasks = await prisma?.card?.count?.({
      where: {
        OR: [
          { dueDate: null },
          { dueDate: { gte: now } },
        ],
      },
    }) ?? 0;

    // New tasks created this month vs last month
    const pendingTasksThisMonth =
      (await prisma?.card?.count?.({
        where: {
          createdAt: { gte: startOfThisMonth },
        },
      })) ?? 0;
    const pendingTasksLastMonth =
      (await prisma?.card?.count?.({
        where: {
          createdAt: {
            gte: startOfLastMonth,
            lt: startOfThisMonth,
          },
        },
      })) ?? 0;
    const pendingTasksDelta = pendingTasksThisMonth - pendingTasksLastMonth;
    const pendingTasksDeltaPercent =
      pendingTasksLastMonth > 0 ? (pendingTasksDelta / pendingTasksLastMonth) * 100 : null;

    // Upcoming tasks (next 7 days)
    const sevenDaysFromNow = new Date();
    sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
    const upcomingTasks = await prisma?.card?.findMany?.({
      where: {
        dueDate: {
          gte: now,
          lte: sevenDaysFromNow,
        },
      },
      take: 5,
      orderBy: { dueDate: 'asc' },
      include: {
        list: { select: { title: true } },
      },
    }) ?? [];

    // Recent activities (last 10)
    const recentActivities = await prisma?.activity?.findMany?.({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        contact: { select: { name: true } },
        deal: { select: { title: true } },
      },
    }) ?? [];

    // Deals closing soon (next 14 days)
    const fourteenDaysFromNow = new Date();
    fourteenDaysFromNow.setDate(fourteenDaysFromNow.getDate() + 14);
    const closingDeals = await prisma?.deal?.findMany?.({
      where: {
        expectedCloseDate: {
          gte: now,
          lte: fourteenDaysFromNow,
        },
        status: { in: ['lead', 'in_progress'] },
      },
      take: 5,
      orderBy: { expectedCloseDate: 'asc' },
      include: {
        contact: { select: { name: true } },
      },
    }) ?? [];

    // Sales funnel data
    const funnelData = await prisma?.list?.findMany?.({
      where: {
        board: { type: 'contacts' },
      },
      include: {
        _count: {
          select: { cards: true },
        },
      },
      orderBy: { order: 'asc' },
    }) ?? [];

    return NextResponse.json({
      totalContacts,
      openDeals,
      totalValue,
      pendingTasks,
      totalContactsDelta,
      openDealsDelta,
      totalValueDelta,
      pendingTasksDelta,
      totalContactsDeltaPercent,
      openDealsDeltaPercent,
      totalValueDeltaPercent,
      pendingTasksDeltaPercent,
      upcomingTasks: (upcomingTasks ?? []).map((task) => ({
        id: task?.id ?? '',
        title: task?.title ?? '',
        dueDate: task?.dueDate ?? null,
        listTitle: task?.list?.title ?? '',
      })),
      recentActivities: (recentActivities ?? []).map((activity) => ({
        id: activity?.id ?? '',
        type: activity?.type ?? '',
        title: activity?.title ?? '',
        createdAt: activity?.createdAt ?? new Date(),
        contactName: activity?.contact?.name ?? null,
        dealTitle: activity?.deal?.title ?? null,
      })),
      closingDeals: (closingDeals ?? []).map((deal) => ({
        id: deal?.id ?? '',
        title: deal?.title ?? '',
        value: deal?.value ?? 0,
        expectedCloseDate: deal?.expectedCloseDate ?? new Date(),
        contactName: deal?.contact?.name ?? null,
      })),
      funnelData: (funnelData ?? []).map((list) => ({
        title: list?.title ?? '',
        count: list?._count?.cards ?? 0,
      })),
    });
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 });
  }
}
