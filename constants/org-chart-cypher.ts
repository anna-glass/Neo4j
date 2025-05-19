export const CYPHER = `
MATCH (f:Founder)-[:EMPLOYEES_AT]->(c:Company)-[:HAS_PARTNER]->(p:Partner)
WITH f, p, collect(c.name) AS shared_companies
RETURN 
  apoc.map.merge(properties(f), {labels: labels(f), elementId: elementId(f)}) AS person1, 
  apoc.map.merge(properties(p), {labels: labels(p), elementId: elementId(p)}) AS person2, 
  apoc.create.vRelationship(f, 'SHARES_COMPANY_WITH', {companies: shared_companies}, p) AS rel

UNION ALL

MATCH (f1:Founder)-[:EMPLOYEES_AT]->(c:Company)<-[:EMPLOYEES_AT]-(f2:Founder)
WHERE elementId(f1) < elementId(f2)
WITH f1, f2, collect(c.name) AS shared_companies
RETURN 
  apoc.map.merge(properties(f1), {labels: labels(f1), elementId: elementId(f1)}) AS person1, 
  apoc.map.merge(properties(f2), {labels: labels(f2), elementId: elementId(f2)}) AS person2, 
  apoc.create.vRelationship(f1, 'COFOUNDER_AT', {companies: shared_companies}, f2) AS rel
`;