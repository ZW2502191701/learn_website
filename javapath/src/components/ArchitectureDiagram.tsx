import type { Scenario } from '../types';

export function ArchitectureDiagram({ scenario }: { scenario: Scenario }) {
  const nodes = Array.from(new Set(scenario.architecture.flatMap((edge) => [edge.from, edge.to])));
  return (
    <div className="architecture">
      <div className="arch-nodes">
        {nodes.map((node) => (
          <div className="arch-node" key={node}>
            {node}
          </div>
        ))}
      </div>
      <div className="arch-edges">
        {scenario.architecture.map((edge, index) => (
          <span key={`${edge.from}-${edge.to}-${index}`}>
            {edge.from} {'->'} {edge.to} · {edge.label}
          </span>
        ))}
      </div>
    </div>
  );
}
