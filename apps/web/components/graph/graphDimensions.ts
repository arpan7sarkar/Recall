export interface GraphContainerSize {
  width: number;
  height: number;
}

const MIN_GRAPH_WIDTH = 300;
const MIN_GRAPH_HEIGHT = 400;
const MAX_GRAPH_HEIGHT = 660;

export function getGraphDimensions(size: GraphContainerSize): GraphContainerSize {
  const width = Number.isFinite(size.width) ? size.width : 0;
  const height = Number.isFinite(size.height) ? size.height : 0;

  return {
    width: Math.max(MIN_GRAPH_WIDTH, Math.floor(width)),
    height: Math.min(
      MAX_GRAPH_HEIGHT,
      Math.max(MIN_GRAPH_HEIGHT, Math.floor(height))
    ),
  };
}
