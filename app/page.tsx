import OrgChartPage from './org-chart/page';
import ChatOverlay from '@/components/ChatOverlay';

export default function Home() {
  return (
    <>
      <div className="p-4 bg-secondary/50 rounded-md">
        <p className="mb-2">
          Hey, this is Slate! Check out this demo of our product with YC data - ask me anything about YC founders, partners, or connections!
        </p>
      </div>
      <div className="flex flex-col h-full">
        <OrgChartPage />
        <ChatOverlay endpoint="api/chat/" />
      </div>
    </>
  );
}
