import { NodeProps } from 'reactflow';

export default function FounderNode({ data }: NodeProps) {
  return (
    <div className="rounded-md shadow-md bg-white border border-blue-400 p-2 text-center min-w-[120px]">
      <img
        src={data.image}
        alt={data.name}
        className="mx-auto w-14 h-14 rounded-full object-cover border border-blue-300"
      />
      <div className="font-bold">{data.name}</div>
      {data.title && <div className="text-xs text-gray-500">{data.title}</div>}
    </div>
  );
}
