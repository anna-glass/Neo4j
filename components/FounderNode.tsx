import { NodeProps, Handle, Position } from 'reactflow';

export default function FounderNode({ data, selected }: NodeProps) {
  const nodeSize = 128;
  const imageSize = Math.round(nodeSize * 0.7);

  return (
    <div
      className={`
        flex flex-col items-center justify-center
        rounded-2xl shadow-xl border border-white/40
        backdrop-blur-lg bg-white/40
        transition ring-2 ${selected ? 'ring-blue-400' : 'ring-transparent'}
        hover:shadow-2xl
      `}
      style={{
        width: nodeSize,
        height: nodeSize,
        cursor: 'pointer',
        position: 'relative',
        padding: 0,
        boxShadow: '0 4px 24px 0 rgba(31,38,135,0.17)',
        border: '1px solid rgba(255,255,255,0.35)',
        backdropFilter: 'blur(12px)',
      }}
    >
      {/* Target handle (for incoming edges) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{
          background: 'transparent',
          border: 'none',
          width: 14,
          height: 14,
        }}
        isConnectable={false}
      />
      <img
        src={data.image}
        alt={data.name}
        style={{
          width: imageSize,
          height: imageSize,
          borderRadius: 18,
          objectFit: 'cover',
          marginBottom: 8,
          boxShadow: '0 2px 8px 0 rgba(31,38,135,0.10)',
          border: '2px solid rgba(255,255,255,0.5)',
        }}
      />
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: '#1a202c',
          textAlign: 'center',
          maxWidth: nodeSize * 0.9,
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          lineHeight: 1.15,
          textShadow: '0 1px 3px rgba(255,255,255,0.3)',
        }}
      >
        {data.name}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{
          background: 'transparent',
          border: 'none',
          width: 14,
          height: 14,
        }}
        isConnectable={false}
      />
    </div>
  );
}
