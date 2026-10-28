import { ChangeDetectionStrategy, Component } from '@angular/core';
import { StatusBadge, type Status } from '../ui/status-badge';

interface Consumer {
  readonly name: string;
  readonly detail: string;
  readonly status: Status;
  readonly label?: string;
}

/**
 * The layers, drawn with CSS boxes rather than a raster/SVG picture so that the text stays readable on a phone,
 * follows the theme and can be read by assistive technology. Every box says whether it exists.
 */
@Component({
  selector: 'app-architecture-diagram',
  imports: [StatusBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './architecture-diagram.html',
  styleUrl: './architecture-diagram.css',
})
export class ArchitectureDiagram {
  protected readonly consumers: readonly Consumer[] = [
    { name: 'Console reporter', detail: 'consumers/consoleReporter.ts: one line per event', status: 'verified' },
    { name: 'JSONL export + reader', detail: 'consumers/jsonlExport.ts, jsonlRead.ts: the reader rejects unknown versions', status: 'verified' },
    { name: 'Text report', detail: 'consumers/textReport.ts: summaries and the "named repeatedly" heuristics', status: 'verified' },
    { name: 'Scenario harness', detail: 'real-gpu/run.mjs: runs a scenario in Chrome and prints the above', status: 'verified' },
    { name: 'Angular trace explorer (this page)', detail: 'reads recorded JSONL; not connected to a live runtime', status: 'prototype', label: 'Prototype: recorded data' },
    { name: 'Angular live feed (this page)', detail: 'subscribes to a live root in your browser', status: 'prototype' },
    { name: 'React / React Native', detail: 'a hook over subscribe(); React Native needs a WebGPU runtime first', status: 'proposed' },
    { name: 'Browser extension', detail: 'needs an activation hook (alternative 6) and a transport', status: 'proposed' },
    { name: 'MCP server', detail: 'a transport for the same events; no code exists', status: 'proposed' },
  ];
}
