import { NodeProps, Handle, Position } from 'reactflow';

export default function PartnerNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center bg-white
        rounded-xl shadow-md
        ${selected ? 'ring-2 ring-blue-300' : ''}
      `}
      style={{
        width: 54,
        height: 54,
        padding: 0,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        position: 'relative',
      }}
    >
      {/* Handles on all sides */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: 'transparent', border: 'none', width: 8, height: 8 }}
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{ background: 'transparent', border: 'none', width: 8, height: 8 }}
        isConnectable={false}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{ background: 'transparent', border: 'none', width: 8, height: 8 }}
        isConnectable={false}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{ background: 'transparent', border: 'none', width: 8, height: 8 }}
        isConnectable={false}
      />
      {/* Node content */}
      <img
        src={data.image}
        alt={data.name}
        style={{
          width: 24,
          height: 24,
          borderRadius: 6,
          objectFit: 'cover',
          marginBottom: 2,
        }}
      />
      <div
        style={{
          fontSize: 8,
          fontWeight: 500,
          color: '#222',
          textAlign: 'center',
          maxWidth: 48,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          lineHeight: 1.1,
        }}
      >
        {data.name}
      </div>
    </div>
  );
}
