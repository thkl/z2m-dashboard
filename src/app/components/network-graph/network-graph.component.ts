import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  viewChild,
  ElementRef,
  input,
  signal,
  effect,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import * as d3 from 'd3';
import { Link, Node, Networkmap, NetworkNodeData } from '../../models/bridge';

interface D3Node extends d3.SimulationNodeDatum {
  id: string;
  label: string;
  type: string;
  data: Node;
}

interface D3Link extends d3.SimulationLinkDatum<D3Node> {
  linkquality?: number;
  data: Link;
  sourceId: string;
  targetId: string;
}

// Force Simulation Configuration - adjust these values to tune the graph behavior
const SIMULATION_CONFIG = {
  // Initial layout
  INITIAL_SPACING_RADIUS_RATIO: 1 / 2, // Fraction of container size for initial circle
  INITIAL_RANDOM_OFFSET: 50, // Random offset from circle position

  // Alpha (cooling) - controls how long simulation runs
  ALPHA_DECAY: 0.05, // Lower = slower settling, higher = faster settling

  // Link force - connects nodes together
  LINK_DISTANCE: 120, // Desired distance between connected nodes
  LINK_STRENGTH: 0.2, // Force strength (0.0 = off, 1.0 = very strong)

  // Charge force - repels nodes from each other
  CHARGE_STRENGTH: -100, // Negative = repulsion, more negative = stronger
  CHARGE_DISTANCE_MIN: 50, // Minimum distance for charge to act
  CHARGE_DISTANCE_MAX: 500, // Maximum distance for charge to act

  // Center force - pulls nodes toward center
  CENTER_FORCE_STRENGTH: 0.05, // How strongly nodes are pulled to center

  // Collision force - prevents nodes from overlapping
  COLLISION_RADIUS: 50, // Radius around each node
  COLLISION_STRENGTH: 0.8, // Force strength for collisions

  // Drag behavior
  DRAG_ALPHA_TARGET: 0.01, // Alpha during dragging (lower = calmer)

  // Node styling
  NODE_RADIUS_COORDINATOR: 25,
  NODE_RADIUS_ROUTER: 20,
  NODE_RADIUS_ENDDEVICE: 15,
  NODE_RADIUS_DEFAULT: 20,
} as const;

@Component({
  selector: 'app-network-graph',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './network-graph.component.html',
  styleUrls: ['./network-graph.component.scss'],
})
export class NetworkGraphComponent implements OnInit, AfterViewInit, OnDestroy {
  networkContainer = viewChild<ElementRef<HTMLDivElement>>('networkContainer');
  svgElement = viewChild<ElementRef<SVGSVGElement>>('svgElement');

  networkData = input<NetworkNodeData | null>(null);

  selectedNode = signal<D3Node | null>(null);
  connectedNodeIds = signal<Set<string>>(new Set());

  private simulation!: d3.Simulation<D3Node, D3Link>;
  private svgGroup!: d3.Selection<SVGGElement, unknown, null, undefined>;
  private linkSelection!: d3.Selection<SVGLineElement, D3Link, SVGGElement, unknown>;
  private nodeSelection!: d3.Selection<SVGCircleElement, D3Node, SVGGElement, unknown>;
  private labelSelection!: d3.Selection<SVGTextElement, D3Node, SVGGElement, unknown>;
  private zoomBehavior!: d3.ZoomBehavior<SVGSVGElement, unknown>;
  private containerWidth = 800;
  private containerHeight = 600;
  private draggedNode: D3Node | null = null;
  private d3Nodes: D3Node[] = [];
  private d3Links: D3Link[] = [];
  private fixedNodes = signal<Set<string>>(new Set());

  private svgInitialized = false;

  constructor() {
    // Watch for networkData changes using effect
    effect(() => {
      const data = this.networkData();
      // Only initialize if SVG is ready
      if (data && this.svgInitialized) {
        this.initializeGraph();
      }
    });
  }

  ngOnInit(): void { }

  ngAfterViewInit(): void {
    const container = this.networkContainer();
    if (container) {
      this.containerWidth = container.nativeElement.clientWidth || 800;
      this.containerHeight = container.nativeElement.clientHeight || 600;
      this.setupSVG();
      this.svgInitialized = true;

      const data = this.networkData();
      if (data) {
        this.initializeGraph();
      }
    }
  }

  private setupSVG(): void {
    const svgEl = this.svgElement();
    if (!svgEl) {
      return;
    }

    const svg = d3.select(svgEl.nativeElement);
    svg.attr('width', this.containerWidth).attr('height', this.containerHeight);

    // Create main group for zoom/pan
    this.svgGroup = svg.append('g');

    // Add zoom behavior
    this.zoomBehavior = d3
      .zoom<SVGSVGElement, unknown>()
      .on('zoom', (event) => {
        this.svgGroup.attr('transform', event.transform);
      });

    svg.call(this.zoomBehavior);

    // Double-click to reset zoom
    svg.on('dblclick.zoom', () => {
      svg
        .transition()
        .duration(750)
        .call(
          this.zoomBehavior.transform as any,
          d3.zoomIdentity.translate(this.containerWidth / 2, this.containerHeight / 2)
        );
    });
  }

  prepareData():NetworkNodeData | null {
    const data = this.networkData();
    if (!data || !data.nodes || !data.links) {
      return null;
    }
    //loop thru all links and make sure every link has a node
    const links = data.links.filter(link=> {
      const source = link.sourceIeeeAddr;
      const target = link.targetIeeeAddr;
      // check if we have the nodes
      const sourcenode = data.nodes.find(node=>node.ieeeAddr===source);
      const targetnode = data.nodes.find(node=>node.ieeeAddr===target);
      return sourcenode !== undefined && targetnode !== undefined;
    });
    return {... data, links};
  }

  private initializeGraph(): void {
   
    const data = this.prepareData();
    if (data===null) {
      return;
    }

    // Convert to D3 format with better initial spacing
    const radius =
      Math.min(this.containerWidth, this.containerHeight) * SIMULATION_CONFIG.INITIAL_SPACING_RADIUS_RATIO;
    this.d3Nodes = data.nodes.map((node: Node, index: number) => {
      // Distribute nodes in a circle initially to reduce jiggling
      const angle = (index / data.nodes!.length) * Math.PI * 2;
      const x =
        this.containerWidth / 2 +
        Math.cos(angle) * radius +
         // eslint-disable-next-line security/detect-non-literal-regexp
        (Math.random() - 0.5) * SIMULATION_CONFIG.INITIAL_RANDOM_OFFSET;
      const y =
        this.containerHeight / 2 +
        Math.sin(angle) * radius +
         // eslint-disable-next-line security/detect-non-literal-regexp
        (Math.random() - 0.5) * SIMULATION_CONFIG.INITIAL_RANDOM_OFFSET;
      return {
        id: node.ieeeAddr,
        label: node.friendlyName,
        type: node.type,
        data: node,
        x,
        y,
      };
    });

    this.d3Links = data.links.map((link: Link) => ({
      source: link.sourceIeeeAddr,
      target: link.targetIeeeAddr,
      linkquality: link.linkquality,
      data: link,
      sourceId: link.sourceIeeeAddr,
      targetId: link.targetIeeeAddr,
    }));

    // Clear existing simulation
    if (this.simulation) {
      this.simulation.stop();
    }

    // Create force simulation - conservative settings for stability
    this.simulation = d3
      .forceSimulation<D3Node>(this.d3Nodes)
      .alphaDecay(SIMULATION_CONFIG.ALPHA_DECAY)
      .force(
        'link',
        d3
          .forceLink<D3Node, D3Link>(this.d3Links)
          .id((d) => d.id)
          .distance(SIMULATION_CONFIG.LINK_DISTANCE)
          .strength(SIMULATION_CONFIG.LINK_STRENGTH)
      )
      .force(
        'charge',
        d3
          .forceManyBody()
          .strength(SIMULATION_CONFIG.CHARGE_STRENGTH)
          .distanceMin(SIMULATION_CONFIG.CHARGE_DISTANCE_MIN)
          .distanceMax(SIMULATION_CONFIG.CHARGE_DISTANCE_MAX)
      )
      .force(
        'center',
        d3
          .forceCenter(this.containerWidth / 2, this.containerHeight / 2)
          .strength(SIMULATION_CONFIG.CENTER_FORCE_STRENGTH)
      )
      .force('collision', d3.forceCollide(SIMULATION_CONFIG.COLLISION_RADIUS).strength(SIMULATION_CONFIG.COLLISION_STRENGTH));


    // Render links
    this.linkSelection = this.svgGroup
      .selectAll<SVGLineElement, D3Link>('line')
      .data(this.d3Links, (d) => `${(d.source as D3Node).id}-${(d.target as D3Node).id}`)
      .join(
        (enter) =>
          enter
            .append('line')
            .attr('stroke', (d) => this.getLinkColor(d))
            .attr('stroke-width', 2)
            .attr('class', 'network-link'),
        (update) => update.attr('stroke', (d) => this.getLinkColor(d)),
        (exit) => exit.remove()
      );

    // Render LQI labels - background boxes AND text together in groups
    this.svgGroup
      .selectAll<SVGGElement, D3Link>('g.lqi-label-group')
      .data(this.d3Links, (d) => `${(d.source as D3Node).id}-${(d.target as D3Node).id}`)
      .join(
        (enter) => {
          const g = enter.append('g').attr('class', 'lqi-label-group');

          // Add background rect to each group
          g.append('rect')
            .attr('class', 'lqi-label-bg')
            .attr('width', 24)
            .attr('height', 14)
            .attr('x', -12)
            .attr('y', -7)
            .attr('rx', 2)
            .attr('fill', '#1e1e2e')
            .attr('stroke', '#888')
            .attr('stroke-width', 1)
            .attr('pointer-events', 'none');

          // Add text to each group using raw DOM
          g.each(function(d: any) {
            const textEl = document.createElementNS('http://www.w3.org/2000/svg', 'text');
            textEl.setAttribute('class', 'lqi-label-text');
            textEl.setAttribute('text-anchor', 'middle');
            textEl.setAttribute('dominant-baseline', 'central');
            textEl.setAttribute('font-size', '10px');
            textEl.setAttribute('font-weight', '700');
            textEl.setAttribute('fill', '#ffffff');
            textEl.setAttribute('pointer-events', 'none');

            const lqi = d.data?.lqi ?? d.linkquality ?? 0;
            (textEl as any).textContent = lqi.toString();

            (this as SVGGElement).appendChild(textEl);
          });

          return g;
        },
        (update) => {
          // Update text content for existing groups
          update.each(function(d: any) {
            const textEl = d3.select(this).select('text.lqi-label-text').node() as SVGTextElement;
            if (textEl) {
              const lqi = d.data?.lqi ?? d.linkquality ?? 0;
              (textEl as any).textContent = lqi.toString();
            }
          });
          return update;
        },
        (exit) => exit.remove()
      );

    // Render nodes
    this.nodeSelection = this.svgGroup
      .selectAll<SVGCircleElement, D3Node>('circle')
      .data(this.d3Nodes, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append('circle')
            .attr('class', (d) => `network-node node-type-${d.type}`)
            .attr('r', (d) => this.getNodeRadius(d.type))
            .attr('fill', (d) => this.getNodeFill(d.type))
            .attr('stroke', (d) => this.getNodeStroke(d.type))
            .attr('stroke-width', (d) => this.getNodeStrokeWidth(d.type))
            .attr('cursor', 'pointer')
            .on('click', (event, d) => this.onNodeClick(event, d))
            .on('dblclick', (event, d) => this.onNodeDoubleClick(event, d))
            .call((selection) => this.addDragBehavior(selection)),
        (update) => update,
        (exit) => exit.remove()
      );

    // Render labels (node name labels, not LQI labels)
    this.labelSelection = this.svgGroup
      .selectAll<SVGTextElement, D3Node>('text.network-label')
      .data(this.d3Nodes, (d) => d.id)
      .join(
        (enter) =>
          enter
            .append('text')
            .attr('text-anchor', 'middle')
            .attr('dy', '0.3em')
            .attr('class', 'network-label')
            .attr('fill', '#dfe0e3') // var(--app-text-color) equivalent
            .attr('font-weight', '500')
            .attr('font-size', '12px')
            .attr('pointer-events', 'none')
            .text((d) => d.label),
        (update) => update,
        (exit) => exit.remove()
      );

    // Update positions on simulation tick
    this.simulation.on('tick', () => {
      this.linkSelection
        .attr('x1', (d) => (d.source as D3Node).x || 0)
        .attr('y1', (d) => (d.source as D3Node).y || 0)
        .attr('x2', (d) => (d.target as D3Node).x || 0)
        .attr('y2', (d) => (d.target as D3Node).y || 0);

      // Update LQI label group positions (positions both rect and text inside)
      this.svgGroup
        .selectAll<SVGGElement, D3Link>('g.lqi-label-group')
        .attr('transform', (d) => {
          const x = (((d.source as D3Node).x || 0) + ((d.target as D3Node).x || 0)) / 2;
          const y = (((d.source as D3Node).y || 0) + ((d.target as D3Node).y || 0)) / 2;
          return `translate(${x},${y})`;
        });

      this.nodeSelection
        .attr('cx', (d) => d.x || 0)
        .attr('cy', (d) => d.y || 0);

      this.labelSelection
        .attr('x', (d) => d.x || 0)
        .attr('y', (d) => d.y || 0);
    });
  }

  private addDragBehavior(
    selection: d3.Selection<SVGCircleElement, D3Node, SVGGElement, unknown>
  ): void {
    const dragStarted = (_event: d3.D3DragEvent<SVGCircleElement, D3Node, any>, d: D3Node) => {
      // Restart simulation so it's running during drag
      this.simulation.alphaTarget(SIMULATION_CONFIG.DRAG_ALPHA_TARGET).restart();
      this.draggedNode = d;
      d.fx = d.x;
      d.fy = d.y;
    };

    const dragged = (event: d3.D3DragEvent<SVGCircleElement, D3Node, any>, d: D3Node) => {
      d.fx = event.x;
      d.fy = event.y;
    };

    const dragEnded = (_event: d3.D3DragEvent<SVGCircleElement, D3Node, any>, d: D3Node) => {
      // Set alpha target to 0 to let simulation settle
      this.simulation.alphaTarget(0);
      // Keep the node fixed at its current position
      const fixed = new Set(this.fixedNodes());
      fixed.add(d.id);
      this.fixedNodes.set(fixed);
      this.draggedNode = null;
    };

    selection.call(
      d3.drag<SVGCircleElement, D3Node>()
        .on('start', dragStarted)
        .on('drag', dragged)
        .on('end', dragEnded)
    );
  }

  private onNodeClick(event: MouseEvent, node: D3Node): void {
    event.stopPropagation();
    // Toggle selection
    if (this.selectedNode()?.id === node.id) {
      this.selectedNode.set(null);
      this.connectedNodeIds.set(new Set());
    } else {
      this.selectedNode.set(node);
      this.connectedNodeIds.set(this.getConnectedNodes(node.id));
    }
    this.updateNodeVisibility();
  }

  private onNodeDoubleClick(event: MouseEvent, node: D3Node): void {
    event.stopPropagation();

    // Toggle fixed state
    const fixed = new Set(this.fixedNodes());
    if (fixed.has(node.id)) {
      fixed.delete(node.id);
      // Release the node back to simulation
      node.fx = null;
      node.fy = null;
    } else {
      fixed.add(node.id);
      // Fix the node at current position
      node.fx = node.x;
      node.fy = node.y;
    }
    this.fixedNodes.set(fixed);
  }

  private getConnectedNodes(nodeId: string): Set<string> {
    const data = this.networkData();
    if (!data || !data.links) {
      return new Set();
    }

    const connected = new Set<string>();
    connected.add(nodeId);

    data.links.forEach((link: Link) => {
      if (link.sourceIeeeAddr === nodeId) {
        connected.add(link.targetIeeeAddr);
      } else if (link.targetIeeeAddr === nodeId) {
        connected.add(link.sourceIeeeAddr);
      }
    });

    return connected;
  }

  private updateNodeVisibility(): void {
    const selected = this.selectedNode();
    const connected = this.connectedNodeIds();

    // If nothing is selected, show everything at full opacity
    if (!selected) {
      // Reset nodes to full visibility
      this.nodeSelection.attr('opacity', 1).attr('fill', (d) => this.getNodeFill(d.type));

      // Reset labels to full visibility
      this.labelSelection.attr('opacity', 1);

      // Reset links to full visibility
      this.linkSelection
        .attr('opacity', 0.6)
        .attr('stroke', (d) => this.getLinkColor(d))
        .attr('stroke-width', 2);

      return;
    }

    // Something is selected - fade non-connected nodes and links
    this.nodeSelection
      .attr('opacity', (d) => (connected.has(d.id) ? 1 : 0.3))
      .attr('fill', (d) => {
        if (connected.has(d.id)) return this.getNodeFill(d.type);
        return '#737c87'; // faded color
      });

    // Update labels
    this.labelSelection.attr('opacity', (d) => (connected.has(d.id) ? 1 : 0.3));

    // Update links - only show links where both source and target are connected
    this.linkSelection
      .attr('opacity', (d) => {
        const sourceId = typeof d.source === 'string' ? d.source : (d.source as D3Node).id;
        const targetId = typeof d.target === 'string' ? d.target : (d.target as D3Node).id;
        return connected.has(sourceId) && connected.has(targetId) ? 0.6 : 0.1;
      })
      .attr('stroke', (d) => {
        const sourceId = typeof d.source === 'string' ? d.source : (d.source as D3Node).id;
        const targetId = typeof d.target === 'string' ? d.target : (d.target as D3Node).id;
        return connected.has(sourceId) && connected.has(targetId)
          ? this.getLinkColor(d)
          : '#737c87';
      });
  }

  onContainerClick(): void {
    this.selectedNode.set(null);
    this.connectedNodeIds.set(new Set());
    this.updateNodeVisibility();
  }

  private getNodeRadius(type: string): number {
    switch (type) {
      case 'Coordinator':
        return SIMULATION_CONFIG.NODE_RADIUS_COORDINATOR;
      case 'Router':
        return SIMULATION_CONFIG.NODE_RADIUS_ROUTER;
      case 'EndDevice':
        return SIMULATION_CONFIG.NODE_RADIUS_ENDDEVICE;
      default:
        return SIMULATION_CONFIG.NODE_RADIUS_DEFAULT;
    }
  }

  private getNodeFill(type: string): string {
    switch (type) {
      case 'Coordinator':
        return '#dc2626'; // Red
      case 'Router':
        return '#0891b2'; // Cyan
      case 'EndDevice':
        return '#84cc16'; // Green
      default:
        return '#4797ff'; // Blue
    }
  }

  private getNodeStroke(type: string): string {
    switch (type) {
      case 'Coordinator':
      case 'Router':
        return '#fff'; // White border
      case 'EndDevice':
        return 'rgba(0, 0, 0, 0.3)'; // Dark semi-transparent
      default:
        return '#4797ff'; // Blue frame
    }
  }

  private getNodeStrokeWidth(type: string): number {
    switch (type) {
      case 'Coordinator':
        return 3;
      default:
        return 2;
    }
  }

  private getLinkColor(link: D3Link): string {
    const source = link.source as D3Node;
    const target = link.target as D3Node;

    // Determine color based on node types
    // Priority: EndDevice (lowest), Router, Coordinator (highest)
    const sourceType = source.type;
    const targetType = target.type;

    // If either end is an EndDevice, use EndDevice color
    if (sourceType === 'EndDevice' || targetType === 'EndDevice') {
      return '#84cc16'; // EndDevice green
    }

    // If either end is a Router, use Router color
    if (sourceType === 'Router' || targetType === 'Router') {
      return '#0891b2'; // Router cyan
    }

    // Otherwise use Coordinator color
    return '#dc2626'; // Coordinator red
  }

  ngOnDestroy(): void {
    if (this.simulation) {
      this.simulation.stop();
    }
  }
}
