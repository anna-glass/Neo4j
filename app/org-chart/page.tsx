'use client';

import OrgChart from '@/components/OrgChart';

async function getOrgChartData() {
  const res = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL!}/api/org-chart`, {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Failed to load org chart data');
  return res.json();
}

export default async function OrgChartPage() {
  const { nodes, edges } = await getOrgChartData();
  return (
    <div className="w-full h-[80vh]">
      <OrgChart initialNodes={nodes} initialEdges={edges} />
    </div>
  );
}
