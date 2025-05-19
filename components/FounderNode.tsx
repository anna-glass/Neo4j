import { NodeProps, Handle, Position } from 'reactflow';

export default function FounderNode({ data, selected }: NodeProps) {
  // Helper for handle style
  const handleStyle = {
    background: 'transparent',
    border: 'none',
    width: 8,
    height: 8,
    position: 'absolute' as const,
    zIndex: 2,
  };

  return (
    <div
      className={`flex flex-col items-center justify-center bg-white
        rounded-xl shadow-md
        ${selected ? 'ring-2 ring-blue-300' : ''}
      `}
      style={{
        width: 108,
        height: 108,
        padding: 0,
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
        position: 'relative',
      }}
    >
      {/* Sides */}
      <Handle type="source" position={Position.Top} id="top" style={handleStyle} />
      <Handle type="source" position={Position.Right} id="right" style={handleStyle} />
      <Handle type="source" position={Position.Bottom} id="bottom" style={handleStyle} />
      <Handle type="source" position={Position.Left} id="left" style={handleStyle} />

      {/* Corners: use custom style for absolute positioning */}
      <Handle
        type="source"
        id="top-left"
        position={Position.Top}
        style={{ ...handleStyle, left: -4, top: -4 }}
      />
      <Handle
        type="source"
        id="top-right"
        position={Position.Top}
        style={{ ...handleStyle, right: -4, top: -4 }}
      />
      <Handle
        type="source"
        id="bottom-left"
        position={Position.Bottom}
        style={{ ...handleStyle, left: -4, bottom: -4 }}
      />
      <Handle
        type="source"
        id="bottom-right"
        position={Position.Bottom}
        style={{ ...handleStyle, right: -4, bottom: -4 }}
      />

      {/* Node content */}
      <img
        src={data.image}
        alt={data.name}
        style={{
          width: 48,
          height: 48,
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
          overflowWrap: 'break-word',
          lineHeight: 1.1,
        }}
      >
        {data.name}
      </div>
    </div>
  );
}
