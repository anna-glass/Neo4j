import { NodeProps } from 'reactflow';

export default function FounderNode({ data, selected }: NodeProps) {
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
