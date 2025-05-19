import { NodeProps } from 'reactflow';

export default function PartnerNode({ data, selected }: NodeProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center
        ${selected ? 'ring-4 ring-blue-400' : ''}
      `}
      style={{
        width: 80,
        height: 80,
        borderRadius: '50%',
        background: '#fff',
        border: '3px solid #7fdbff', // Neo4j blue
        boxShadow: '0 4px 12px rgba(0,0,0,0.10)',
        cursor: 'pointer',
        transition: 'box-shadow 0.2s',
      }}
    >
      <img
        src={data.image}
        alt={data.name}
        style={{
          width: 54,
          height: 54,
          borderRadius: '50%',
          objectFit: 'cover',
          border: '2px solid #b2f0ff',
        }}
      />
      <div
        style={{
          fontSize: 12,
          fontWeight: 600,
          marginTop: 4,
          textAlign: 'center',
          color: '#222',
          maxWidth: 70,
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
        }}
      >
        {data.name}
      </div>
    </div>
  );
}
