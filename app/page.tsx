import OrgChartPage from './org-chart/page';
import ChatOverlay from '@/components/ChatOverlay';

export default function Home() {
  return (
    <>
      <div className="flex flex-col h-full">
        <OrgChartPage />
        <ChatOverlay endpoint="api/chat/" />
      </div>
    </>
  );
}
