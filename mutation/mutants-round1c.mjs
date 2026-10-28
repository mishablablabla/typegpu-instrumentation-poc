const HUB = 'src/core/instrumentation/hub.ts';
const BUF = 'src/core/buffer/buffer.ts';
const TEX = 'src/core/texture/texture.ts';
const TR = 'tests/instrumentation/consumers/textReport.ts';
export const mutants = [
  { id: 'M163', file: BUF, find: `      writeToArrayBuffer(mapped, this.dataType, data, options);
      return;`, repl: `      writeToArrayBuffer(mapped, this.dataType, data, options);
      this[$internal].root[$internal].instrumentation?.bufferWritten(this, 4);
      return;`, desc: 'hook on wrong branch: bufferWritten for writes into a mapped buffer (write)' },
  { id: 'M164', file: BUF, find: `      patchArrayBuffer(this.#getMappedRange(), this.dataType, data);`, repl: `      patchArrayBuffer(this.#getMappedRange(), this.dataType, data);
      this[$internal].root[$internal].instrumentation?.bufferWritten(this, 4);`, desc: 'hook on wrong branch: bufferWritten for patches of a mapped buffer' },
  { id: 'M165', file: BUF, find: `        return soul.raw;
      },
    };
  }

  get dataType`, repl: `        root[$internal].instrumentation?.bufferMaterialized(this, { size: 0, usage: 0 });
        return soul.raw;
      },
    };
  }

  get dataType`, desc: 'hook duplicated outside the materialize branch (buffer)' },
  { id: 'M166', file: TEX, find: `        return soul.raw;
      },
    };
  }`, repl: `        root[$internal].instrumentation?.textureMaterialized(this, { size: [1, 1], format: 'rgba8unorm', usage: 0 });
        return soul.raw;
      },
    };
  }`, desc: 'hook duplicated outside the materialize branch (texture)', nth: 1 },
  { id: 'M171', file: HUB, find: `  disable(): void {
    this.#active = false;`, repl: `  disable(): void {
    this.#ringSize = 0;
    this.#active = false;`, desc: 'disable() wipes history' },
  { id: 'M172', file: HUB, find: `    this.#active = true;
    this.#holder.instrumentation = this;`, repl: `    this.#active = true;
    this.#seq = 0;
    this.#holder.instrumentation = this;`, desc: 'enable() resets seq' },
  { id: 'M173', file: HUB, find: `    const layoutIds = info.layouts.map((layout) => this.#identityId(layout));`, repl: `    const layoutIds = [...info.layouts].reverse().map((layout) => this.#identityId(layout));`, desc: 'layoutIds reversed (not in group-index order)' },
  { id: 'M174', file: HUB, find: `      layoutLabels: info.layouts.map((layout) => getName(layout) ?? null),
    });

    this.#requestDiagnostics(rec.id, info.module);`, repl: `      layoutLabels: [...info.layouts].reverse().map((layout) => getName(layout) ?? null),
    });

    this.#requestDiagnostics(rec.id, info.module);`, desc: 'layoutLabels reversed relative to layoutIds' },
  { id: 'M175', file: HUB, find: `      seq: ++this.#seq,
      t: performance.now(),`, repl: `      seq: ++this.#seq,
      t: Date.now(),`, desc: 'event.t from Date.now() instead of performance.now()' },
  { id: 'M176', file: HUB, find: `  now(): number {
    return performance.now();`, repl: `  now(): number {
    return Date.now();`, desc: 'hub.now() uses Date.now()' },
  { id: 'M177', file: TR, find: `\${label ?? '<unnamed>'}#\${id}`, repl: `\${label ?? ''}#\${id}`, desc: 'textReport unnamed fallback' },
  { id: 'M178', file: HUB, find: `    this.#active = true;
    this.#holder.instrumentation = this;`, repl: `    this.#active = true;
    this.#ringSize = 0;
    this.#holder.instrumentation = this;`, desc: 'enable() wipes history (also runs in constructor: harmless there)' },
  { id: 'M179', file: HUB, find: `      this.#ring[this.#ringStart] = event;`, repl: `      this.#ring[(this.#ringStart + 1) % capacity] = event;`, desc: 'ring overwrites the wrong slot' },
  { id: 'M180', file: HUB, find: `      writes: 0,
      bytesWritten: 0,`, repl: `      writes: null,
      bytesWritten: 0,`, desc: 'buffer writes counter null initially' },
  { id: 'M181', file: HUB, find: `    const size = descriptor.size;
    this.#emit({`.slice(0,0)+`        ? [...size]`, repl: `        ? [...size].reverse()`, desc: 'array-form texture size reversed' },
  { id: 'M182', file: HUB, find: `: [size.width, size.height ?? 1, size.depthOrArrayLayers ?? 1],`, repl: `: [size.width, size.height ?? 0, size.depthOrArrayLayers ?? 0],`, desc: 'texture object-size defaults 0 (unreachable?)' },
];
