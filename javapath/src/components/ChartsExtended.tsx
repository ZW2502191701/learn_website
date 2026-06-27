interface RadarDatum {
  label: string;
  value: number;
}

export function RadarChart({ data, size = 220 }: { data: RadarDatum[]; size?: number }) {
  if (!data.length) return null;
  const cx = size / 2;
  const cy = size / 2;
  const maxR = size / 2 - 30;
  const n = data.length;
  const angleStep = (2 * Math.PI) / n;
  const startAngle = -Math.PI / 2;

  const gridLevels = [0.25, 0.5, 0.75, 1];
  const getPoint = (i: number, ratio: number) => {
    const angle = startAngle + i * angleStep;
    return { x: cx + maxR * ratio * Math.cos(angle), y: cy + maxR * ratio * Math.sin(angle) };
  };

  const dataPoints = data.map((d, i) => getPoint(i, Math.min(1, d.value / 100)));
  const pathD = dataPoints.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {gridLevels.map((level) => {
        const pts = Array.from({ length: n }, (_, i) => getPoint(i, level));
        const d = pts.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ') + 'Z';
        return <path key={level} d={d} fill="none" stroke="var(--line)" strokeWidth={0.5} />;
      })}
      {Array.from({ length: n }, (_, i) => {
        const end = getPoint(i, 1);
        return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="var(--line)" strokeWidth={0.5} />;
      })}
      <path d={pathD} fill="var(--accent)" fillOpacity={0.15} stroke="var(--accent)" strokeWidth={1.5} />
      {data.map((d, i) => {
        const p = getPoint(i, 1.15);
        return (
          <text
            key={i}
            x={p.x}
            y={p.y}
            textAnchor="middle"
            dominantBaseline="central"
            fill="var(--text)"
            fontSize={10}
          >
            {d.label.length > 4 ? d.label.slice(0, 4) : d.label}
          </text>
        );
      })}
    </svg>
  );
}

interface TrendDatum {
  label: string;
  value: number;
}

export function TrendLine({ data, height = 120, label }: { data: TrendDatum[]; height?: number; label?: string }) {
  if (!data.length) return null;
  const width = 100;
  const padX = 5;
  const padY = 10;
  const maxVal = Math.max(1, ...data.map((d) => d.value));
  const stepX = (width - padX * 2) / Math.max(1, data.length - 1);
  const chartH = height - padY * 2;

  const points = data.map((d, i) => ({
    x: padX + i * stepX,
    y: padY + chartH * (1 - d.value / maxVal)
  }));
  const pathD = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaD = pathD + ` L${points[points.length - 1].x},${padY + chartH} L${points[0].x},${padY + chartH} Z`;

  return (
    <div>
      {label && <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{label}</div>}
      <svg width="100%" viewBox={`0 0 ${width} ${height}`} style={{ display: 'block' }}>
        <path d={areaD} fill="var(--accent)" fillOpacity={0.08} />
        <path d={pathD} fill="none" stroke="var(--accent)" strokeWidth={1.5} />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2} fill="var(--accent)" />
        ))}
        {data.map((d, i) => (
          i % Math.ceil(data.length / 5) === 0 || i === data.length - 1 ? (
            <text key={i} x={points[i].x} y={height - 1} textAnchor="middle" fill="var(--muted)" fontSize={7}>
              {d.label}
            </text>
          ) : null
        ))}
      </svg>
    </div>
  );
}
