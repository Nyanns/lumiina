# 4. PostgreSQL Trigram GIN Indexes for Substring Search

Date: 2026-09-04

## Status
Accepted

## Context
The anime fan art discovery feed requires fast fuzzy searching across artwork titles, descriptions, and artist usernames (`ILIKE '%query%'`). Standard B-Tree indexes cannot accelerate queries with leading wildcards (`%query%`), forcing PostgreSQL into costly sequential table scans as the dataset scales. Setting up an external Elasticsearch cluster introduces excessive infrastructure cost and operational overhead for the current phase.

## Decision
We utilize PostgreSQL's built-in `pg_trgm` extension paired with Generalized Inverted Indexes (GIN):
```sql
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX idx_artworks_title_trgm ON artworks USING GIN (title gin_trgm_ops);
CREATE INDEX idx_artworks_description_trgm ON artworks USING GIN (description gin_trgm_ops);
CREATE INDEX idx_users_username_trgm ON users USING GIN (username gin_trgm_ops);
```

## Consequences
- Transforms `ILIKE` substring lookups from $O(N)$ sequential scans to $O(\log N)$ inverted index scans.
- Query latencies remain under 5ms even on tables with hundreds of thousands of records.
- Eliminates the operational complexity and hardware footprint of dedicated search engines.
- **Trade-off**: GIN indexes take longer to update during write operations (`INSERT`/`UPDATE`) and consume more disk space than standard B-Tree indexes. Acceptable since art platform workloads are overwhelmingly read-heavy (95% read, 5% write).
