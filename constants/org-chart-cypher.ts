export const CYPHER = `
MATCH (f:Founder)-[:FOUNDER_OF]->(c:Company)-[:HAS_PARTNER]->(p:Partner)
RETURN 
  apoc.map.merge(properties(f), {labels: labels(f), elementId: elementId(f)}) AS person1, 
  apoc.map.merge(properties(p), {labels: labels(p), elementId: elementId(p)}) AS person2,
  apoc.create.vRelationship(f, 'SHARES_COMPANY_WITH', {companies: collect(DISTINCT c.name)}, p) AS rel

UNION ALL

MATCH (f1:Founder)-[:FOUNDER_OF]->(c:Company)<-[:FOUNDER_OF]-(f2:Founder)
WHERE elementId(f1) < elementId(f2)
RETURN 
  apoc.map.merge(properties(f1), {labels: labels(f1), elementId: elementId(f1)}) AS person1, 
  apoc.map.merge(properties(f2), {labels: labels(f2), elementId: elementId(f2)}) AS person2, 
  apoc.create.vRelationship(f1, 'COFOUNDER_AT', {companies: collect(c.name)}, f2) AS rel

UNION ALL

MATCH (p1:Partner)<-[:HAS_HOST]-(v:YoutubeVideo)-[:HAS_HOST]->(p2:Partner)
WHERE elementId(p1) < elementId(p2)
RETURN
  apoc.map.merge(properties(p1), {labels: labels(p1), elementId: elementId(p1)}) AS person1,
  apoc.map.merge(properties(p2), {labels: labels(p2), elementId: elementId(p2)}) AS person2,
  apoc.create.vRelationship(p1, 'SHARED_VIDEO_WITH', {videos: collect(DISTINCT v.name)}, p2) AS rel
`;