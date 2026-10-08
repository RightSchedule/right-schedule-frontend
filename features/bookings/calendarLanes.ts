export interface LaneInput {
  id: string;
  start: number;
  end: number;
}

export interface LanePlacement {
  /** Zero-based column within the cluster of overlapping bookings. */
  lane: number;
  /** How many columns the cluster needs; every booking in it shares the width equally. */
  lanes: number;
}

/**
 * Side-by-side layout for overlapping bookings in one day column. Bookings that touch only at an
 * edge do not overlap. `minMinutes` is the shortest height a block is drawn at, expressed in
 * minutes, so short bookings that are drawn taller than they are long still get their own lane.
 * `maxLanes` stops a pile-up from squeezing blocks to slivers: extra bookings stack on the last lane.
 */
export function layoutLanes(
  items: LaneInput[],
  minMinutes = 0,
  maxLanes = Number.POSITIVE_INFINITY
): Map<string, LanePlacement> {
  const sorted = [...items].sort((a, b) => a.start - b.start || b.end - a.end);
  const out = new Map<string, LanePlacement>();

  let cluster: { id: string; lane: number }[] = [];
  let laneEnds: number[] = [];
  let clusterEnd = Number.NEGATIVE_INFINITY;

  const flush = () => {
    const lanes = Math.min(laneEnds.length, maxLanes);
    for (const c of cluster) out.set(c.id, { lane: Math.min(c.lane, lanes - 1), lanes });
    cluster = [];
    laneEnds = [];
    clusterEnd = Number.NEGATIVE_INFINITY;
  };

  for (const item of sorted) {
    const visualEnd = Math.max(item.end, item.start + minMinutes);
    if (item.start >= clusterEnd) flush();
    let lane = laneEnds.findIndex((end) => end <= item.start);
    if (lane === -1) {
      lane = laneEnds.length;
      laneEnds.push(visualEnd);
    } else {
      laneEnds[lane] = visualEnd;
    }
    cluster.push({ id: item.id, lane });
    clusterEnd = Math.max(clusterEnd, visualEnd);
  }
  flush();
  return out;
}

/** CSS box for a block in a lane: full width inside a small gutter when alone, an equal share otherwise. */
export function laneStyle(placement: LanePlacement | undefined): { left: string; width: string } {
  const { lane, lanes } = placement ?? { lane: 0, lanes: 1 };
  if (lanes === 1) return { left: "4px", width: "calc(100% - 8px)" };
  return {
    left: `calc(${(lane / lanes) * 100}% + 2px)`,
    width: `calc(${100 / lanes}% - 4px)`,
  };
}
