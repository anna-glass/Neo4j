import { NodeProps, Handle, Position } from 'reactflow';

export default function PartnerNode({ data, selected }: NodeProps) {
  const nodeSize = 108;
  const imageSize = Math.round(nodeSize * 0.9);

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white
        rounded-xl shadow-md
        ${selected ? 'ring-2 ring-blue-300' : ''}
      `}
      style={{
        width: nodeSize,
        height: nodeSize,
        padding: 0,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        position: 'relative',
      }}
    >
      {/* Target handle (for incoming edges) */}
      <Handle
        type="target"
        position={Position.Top}
        style={{ background: 'transparent', border: 'none', width: 12, height: 12 }}
        isConnectable={false}
      />
      <img
        src={data.image}
        alt={data.name}
        style={{
          width: imageSize,
          height: imageSize,
          borderRadius: nodeSize * 0.2,
          objectFit: 'cover',
          marginBottom: 4,
        }}
      />
      <div
        style={{
          fontSize: 8,
          fontWeight: 500,
          color: '#222',
          textAlign: 'center',
          maxWidth: nodeSize * 0.95,
          overflowWrap: 'break-word',
          wordBreak: 'break-word',
          lineHeight: 1.1,
        }}
      >
        {data.name}
      </div>
      <Handle
        type="source"
        position={Position.Bottom}
        style={{ background: 'transparent', border: 'none', width: 12, height: 12 }}
        isConnectable={false}
      />
    </div>
  );
}
