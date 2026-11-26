/**
 * The Router Confesses.
 *
 * A small deterministic packet router. It owns a fixed six-node mesh
 * (plus one unreachable node, G) and a fixed queue of twelve packets.
 * For every packet it computes the cheapest path with Dijkstra's
 * algorithm, breaking ties by lowest node id so the answer never
 * wavers, and confesses each decision — including the one packet it
 * had to drop — as a plain-text action log.
 *
 * Usage: node main.ts
 * Reads : MAKEFUN_OUTPUT_DIR (defaults to ./output)
 * Writes: $MAKEFUN_OUTPUT_DIR/entry.txt
 *
 * No network, no wall clock, no randomness: the same run always
 * produces the same confession, byte for byte. The program reads its
 * own output back and verifies the format before exiting.
 */

import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

type Edge = { from: string; to: string; cost: number };
type Packet = { id: string; from: string; to: string; bytes: number };

const NODES: string[] = ["A", "B", "C", "D", "E", "F", "G"];

const EDGES: Edge[] = [
  { from: "A", to: "B", cost: 2 },
  { from: "A", to: "C", cost: 5 },
  { from: "A", to: "E", cost: 9 },
  { from: "B", to: "C", cost: 1 },
  { from: "B", to: "D", cost: 4 },
  { from: "B", to: "F", cost: 8 },
  { from: "C", to: "D", cost: 2 },
  { from: "C", to: "E", cost: 6 },
  { from: "D", to: "E", cost: 3 },
  { from: "D", to: "F", cost: 5 },
  { from: "E", to: "F", cost: 2 },
  // Node G has no edges at all: it is the router's unreachable confession.
];

const PACKETS: Packet[] = [
  { id: "pkt-01", from: "A", to: "F", bytes: 128 },
  { id: "pkt-02", from: "B", to: "E", bytes: 64 },
  { id: "pkt-03", from: "C", to: "A", bytes: 256 },
  { id: "pkt-04", from: "F", to: "B", bytes: 32 },
  { id: "pkt-05", from: "A", to: "D", bytes: 512 },
  { id: "pkt-06", from: "E", to: "A", bytes: 96 },
  { id: "pkt-07", from: "D", to: "C", bytes: 48 },
  { id: "pkt-08", from: "B", to: "F", bytes: 200 },
  { id: "pkt-09", from: "C", to: "F", bytes: 80 },
  { id: "pkt-10", from: "F", to: "E", bytes: 160 },
  { id: "pkt-11", from: "E", to: "B", bytes: 72 },
  { id: "pkt-12", from: "A", to: "G", bytes: 40 },
];

/** Cheapest path by Dijkstra; ties broken by lowest node id. */
function shortestPath(from: string, to: string): string[] | null {
  const dist = new Map<string, number>();
  const prev = new Map<string, string | null>();
  for (const n of NODES) {
    dist.set(n, Infinity);
    prev.set(n, null);
  }
  dist.set(from, 0);
  const unvisited = new Set<string>(NODES);
  while (unvisited.size > 0) {
    let current: string | null = null;
    let best = Infinity;
    for (const n of [...unvisited].sort()) {
      const d = dist.get(n) as number;
      if (d < best) {
        best = d;
        current = n;
      }
    }
    if (current === null || best === Infinity) break;
    unvisited.delete(current);
    if (current === to) break;
    for (const e of EDGES) {
      let neighbour: string | null = null;
      if (e.from === current) neighbour = e.to;
      else if (e.to === current) neighbour = e.from;
      if (neighbour === null || !unvisited.has(neighbour)) continue;
      const alt = (dist.get(current) as number) + e.cost;
      if (alt < (dist.get(neighbour) as number)) {
        dist.set(neighbour, alt);
        prev.set(neighbour, current);
      }
    }
  }
  if ((dist.get(to) as number) === Infinity) return null;
  const path: string[] = [];
  let node: string | null = to;
  while (node !== null) {
    path.unshift(node);
    node = prev.get(node) as string | null;
  }
  return path;
}

function pathCost(path: string[]): number {
  let total = 0;
  for (let i = 0; i + 1 < path.length; i++) {
    const e = EDGES.find(
      (x) =>
        (x.from === path[i] && x.to === path[i + 1]) ||
        (x.from === path[i + 1] && x.to === path[i]),
    );
    if (e === undefined) throw new Error(`no edge ${path[i]}-${path[i + 1]}`);
    total += e.cost;
  }
  return total;
}

function buildConfession(): string[] {
  const lines: string[] = [
    "# The Router Confesses",
    "# action log v1",
  ];
  let routed = 0;
  let dropped = 0;
  let totalCost = 0;
  let totalBytes = 0;
  for (const p of PACKETS) {
    const path = shortestPath(p.from, p.to);
    if (path === null) {
      dropped += 1;
      lines.push(`DROP ${p.id} ${p.from} -> ${p.to} reason=unreachable bytes=${p.bytes}`);
    } else {
      const cost = pathCost(path);
      routed += 1;
      totalCost += cost;
      totalBytes += p.bytes;
      lines.push(
        `ROUTE ${p.id} ${path.join(" -> ")} cost=${cost} hops=${path.length - 1} bytes=${p.bytes}`,
      );
    }
  }
  lines.push(
    `SUMMARY routed=${routed} dropped=${dropped} total_cost=${totalCost} total_bytes=${totalBytes} packets=${PACKETS.length}`,
  );
  const body = lines.join("\n") + "\n";
  const checksum = createHash("sha256").update(body, "utf8").digest("hex");
  lines.push(`CHECKSUM sha256=${checksum}`);
  return lines;
}

function selfCheck(outPath: string, expected: string[]): void {
  const text = readFileSync(outPath, "utf8");
  const lines = text.split("\n");
  if (lines[lines.length - 1] !== "") {
    throw new Error("entry.txt must end with a newline");
  }
  lines.pop();
  if (lines.length !== expected.length) {
    throw new Error(`line count ${lines.length} != expected ${expected.length}`);
  }
  for (let i = 0; i < lines.length; i++) {
    if (lines[i] !== expected[i]) {
      throw new Error(`line ${i + 1} differs from expected`);
    }
  }
  if (lines[0] !== "# The Router Confesses" || lines[1] !== "# action log v1") {
    throw new Error("header mismatch");
  }
  const routeRe = /^ROUTE pkt-\d\d [A-G]( -> [A-G])+ cost=\d+ hops=\d+ bytes=\d+$/;
  const dropRe = /^DROP pkt-\d\d [A-G] -> [A-G] reason=unreachable bytes=\d+$/;
  const summaryRe = /^SUMMARY routed=\d+ dropped=\d+ total_cost=\d+ total_bytes=\d+ packets=\d+$/;
  const checksumRe = /^CHECKSUM sha256=[0-9a-f]{64}$/;
  for (const line of lines) {
    if (
      line.startsWith("#") ||
      routeRe.test(line) ||
      dropRe.test(line) ||
      summaryRe.test(line) ||
      checksumRe.test(line)
    ) {
      continue;
    }
    throw new Error(`malformed line: ${line}`);
  }
  const body = lines.slice(0, lines.length - 1).join("\n") + "\n";
  const recomputed = createHash("sha256").update(body, "utf8").digest("hex");
  if (lines[lines.length - 1] !== `CHECKSUM sha256=${recomputed}`) {
    throw new Error("checksum mismatch");
  }
}

function main(): void {
  const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? "./output";
  mkdirSync(outDir, { recursive: true });
  const lines = buildConfession();
  const outPath = join(outDir, "entry.txt");
  writeFileSync(outPath, lines.join("\n") + "\n", "utf8");
  selfCheck(outPath, lines);
  console.log(`wrote ${outPath} (${lines.length} lines)`);
}

main();
