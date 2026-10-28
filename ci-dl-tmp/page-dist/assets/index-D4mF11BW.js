//#region \0rolldown/runtime.js
var __defProp = Object.defineProperty;
var __exportAll = (all, no_symbols) => {
	let target = {};
	for (var name in all) __defProp(target, name, {
		get: all[name],
		enumerable: true
	});
	if (!no_symbols) __defProp(target, Symbol.toStringTag, { value: "Module" });
	return target;
};
//#endregion
//#region \0vite/modulepreload-polyfill.js
(function polyfill() {
	const relList = document.createElement("link").relList;
	if (relList && relList.supports && relList.supports("modulepreload")) return;
	for (const link of document.querySelectorAll("link[rel=\"modulepreload\"]")) processPreload(link);
	new MutationObserver((mutations) => {
		for (const mutation of mutations) {
			if (mutation.type !== "childList") continue;
			for (const node of mutation.addedNodes) if (node.tagName === "LINK" && node.rel === "modulepreload") processPreload(node);
		}
	}).observe(document, {
		childList: true,
		subtree: true
	});
	function getFetchOpts(link) {
		const fetchOpts = {};
		if (link.integrity) fetchOpts.integrity = link.integrity;
		if (link.referrerPolicy) fetchOpts.referrerPolicy = link.referrerPolicy;
		if (link.crossOrigin === "use-credentials") fetchOpts.credentials = "include";
		else if (link.crossOrigin === "anonymous") fetchOpts.credentials = "omit";
		else fetchOpts.credentials = "same-origin";
		return fetchOpts;
	}
	function processPreload(link) {
		if (link.ep) return;
		link.ep = true;
		const fetchOpts = getFetchOpts(link);
		fetch(link.href, fetchOpts);
	}
})();
//#endregion
//#region package.json
var version = "0.12.8";
//#endregion
//#region src/shared/symbols.ts
var $internal = Symbol(`typegpu:${version}:$internal`);
/** A plain record of all definitional state of a resource, surviving transfer between runtimes */
var $soul = Symbol(`typegpu:${version}:$soul`);
/**
* The getter to the value of this resource, accessible on the GPU
*/
var $gpuValueOf = Symbol(`typegpu:${version}:$gpuValueOf`);
/**
* If this symbol is present, this means that getName and setName
* will refer to object behind this property instead.
*/
var $getNameForward = Symbol(`typegpu:${version}:$getNameForward`);
/**
* Marks an object with slot-value bindings
*/
var $providing = Symbol(`typegpu:${version}:$providing`);
/**
* Objects can provide the snippet that represents them.
*/
var $ownSnippet = Symbol(`typegpu:${version}:$ownSnippet`);
/**
* Objects can provide the value that they represent at comptime (e.g. when passed
* into comptime functions), or signal that they are not known at comptime.
*/
var $comptimeValueOf = Symbol(`typegpu:${version}:$comptimeValueOf`);
var $resolve = Symbol(`typegpu:${version}:$resolve`);
/**
* A way for a schema to provide casting behavior, without the need to be explicitly
* callable by the end-user (e.g. vertex formats)
*/
var $cast = Symbol(`typegpu:${version}:$cast`);
/**
* Can be called on the GPU
*/
var $gpuCallable = Symbol(`typegpu:${version}:$gpuCallable`);
/**
* Type token for the inferred (CPU & GPU) representation of a resource
*/
var $repr = Symbol(`typegpu:${version}:$repr`);
Symbol(`typegpu:${version}:$gpuRepr`);
Symbol(`typegpu:${version}:$reprPartial`);
Symbol(`typegpu:${version}:$reprPatch`);
Symbol(`typegpu:${version}:$inRepr`);
Symbol(`typegpu:${version}:$memIdent`);
Symbol(`typegpu:${version}:$invalidStorageSchema`);
Symbol(`typegpu:${version}:$validUniformSchema`);
Symbol(`typegpu:${version}:$validVertexSchema`);
Symbol(`typegpu:${version}:$invalidSchemaReason`);
function isMarkedInternal(value) {
	return !!value?.[$internal];
}
//#endregion
//#region ../../node_modules/.pnpm/tsover-runtime@0.0.7/node_modules/tsover-runtime/dist/index.js
function polyfillSymbol(name) {
	if (typeof Symbol[name] === "undefined") Object.defineProperty(Symbol, name, {
		value: Symbol.for(`Symbol.${name}`),
		writable: false,
		enumerable: false,
		configurable: false
	});
}
/**
* Checks if a value has the [T] property
*/
function hasOperator(value, operator) {
	return typeof value?.[operator] === "function";
}
function binOp(a, b, opSymbol, fallback) {
	let result = Operator.deferOperation;
	if (hasOperator(a, opSymbol)) result = a[opSymbol](a, b);
	if (result === Operator.deferOperation && hasOperator(b, opSymbol)) result = b[opSymbol](a, b);
	if (result === Operator.deferOperation) return fallback(a, b);
	return result;
}
var normalAdd = (a, b) => a + b;
/**
* Performs the + operation with support for operator overloading
* If either operand has Symbol.operatorPlus, uses that operator
* Otherwise falls back to standard JavaScript + behavior
*/
function add$1(a, b) {
	if ((typeof a === "number" || typeof a === "string") && (typeof b === "number" || typeof b === "string")) return a + b;
	return binOp(a, b, Operator.plus, normalAdd);
}
var normalSub = (a, b) => a - b;
/**
* Performs the - operation with support for operator overloading
* If either operand has Symbol.operatorMinus, uses that operator
* Otherwise falls back to standard JavaScript - behavior
*/
function sub$1(a, b) {
	if (typeof a === "number" && typeof b === "number") return a - b;
	return binOp(a, b, Operator.minus, normalSub);
}
var normalMul = (a, b) => a * b;
/**
* Performs the * operation with support for operator overloading
* If either operand has Symbol.operatorStar, uses that operator
* Otherwise falls back to standard JavaScript * behavior
*/
function mul$1(a, b) {
	if (typeof a === "number" && typeof b === "number") return a * b;
	return binOp(a, b, Operator.star, normalMul);
}
var normalDiv = (a, b) => a / b;
/**
* Performs the / operation with support for operator overloading
* If either operand has Symbol.operatorSlash, uses that operator
* Otherwise falls back to standard JavaScript / behavior
*/
function div$1(a, b) {
	if (typeof a === "number" && typeof b === "number") return a / b;
	return binOp(a, b, Operator.slash, normalDiv);
}
var normalPow = (a, b) => a ** b;
/**
* Performs the ** operation with support for operator overloading
* If either operand has Symbol.operatorStarStar, uses that operator
* Otherwise falls back to standard JavaScript ** behavior
*/
function pow$1(a, b) {
	if (typeof a === "number" && typeof b === "number") return a ** b;
	return binOp(a, b, Operator.starStar, normalPow);
}
var normalMod = (a, b) => a % b;
/**
* Performs the % operation with support for operator overloading
* If either operand has Symbol.operatorPercent, uses that operator
* Otherwise falls back to standard JavaScript % behavior
*/
function mod$1(a, b) {
	if (typeof a === "number" && typeof b === "number") return a % b;
	return binOp(a, b, Operator.percent, normalMod);
}
var Operator = /* @__PURE__ */ (() => {
	polyfillSymbol("deferOperation");
	polyfillSymbol("operatorPlus");
	polyfillSymbol("operatorMinus");
	polyfillSymbol("operatorStar");
	polyfillSymbol("operatorSlash");
	polyfillSymbol("operatorStarStar");
	polyfillSymbol("operatorPercent");
	polyfillSymbol("operatorEqEq");
	polyfillSymbol("operatorPrePlusPlus");
	polyfillSymbol("operatorPreMinusMinus");
	polyfillSymbol("operatorPostPlusPlus");
	polyfillSymbol("operatorPostMinusMinus");
	polyfillSymbol("operatorPreMinus");
	globalThis.__tsover_add = add$1;
	globalThis.__tsover_sub = sub$1;
	globalThis.__tsover_mul = mul$1;
	globalThis.__tsover_div = div$1;
	globalThis.__tsover_pow = pow$1;
	globalThis.__tsover_mod = mod$1;
	return {
		deferOperation: Symbol.deferOperation,
		plus: Symbol.operatorPlus,
		minus: Symbol.operatorMinus,
		star: Symbol.operatorStar,
		slash: Symbol.operatorSlash,
		starStar: Symbol.operatorStarStar,
		percent: Symbol.operatorPercent,
		eqEq: Symbol.operatorEqEq,
		prePlusPlus: Symbol.operatorPrePlusPlus,
		preMinusMinus: Symbol.operatorPreMinusMinus,
		postPlusPlus: Symbol.operatorPostPlusPlus,
		postMinusMinus: Symbol.operatorPostMinusMinus,
		preMinus: Symbol.operatorPreMinus
	};
})();
//#endregion
//#region src/data/wgslTypes.ts
var Void = {
	[$internal]: {},
	type: "void",
	toString() {
		return "void";
	}
};
var wgslTypeLiterals = [
	"bool",
	"f32",
	"f16",
	"i32",
	"u32",
	"u16",
	"vec2f",
	"vec2h",
	"vec2i",
	"vec2u",
	"vec2<bool>",
	"vec3f",
	"vec3h",
	"vec3i",
	"vec3u",
	"vec3<bool>",
	"vec4f",
	"vec4h",
	"vec4i",
	"vec4u",
	"vec4<bool>",
	"mat2x2f",
	"mat3x3f",
	"mat4x4f",
	"struct",
	"array",
	"ptr",
	"atomic",
	"decorated",
	"abstractInt",
	"abstractFloat",
	"void",
	"texture_1d",
	"texture_storage_1d",
	"texture_2d",
	"texture_storage_2d",
	"texture_multisampled_2d",
	"texture_depth_2d",
	"texture_depth_multisampled_2d",
	"texture_2d_array",
	"texture_storage_2d_array",
	"texture_depth_2d_array",
	"texture_cube",
	"texture_depth_cube",
	"texture_cube_array",
	"texture_depth_cube_array",
	"texture_3d",
	"texture_storage_3d",
	"texture_external",
	"sampler",
	"sampler_comparison"
];
function isVecInstance(value) {
	const v = value;
	return isMarkedInternal(v) && typeof v.kind === "string" && v.kind.startsWith("vec");
}
function isVec2(value) {
	const v = value;
	return isMarkedInternal(v) && typeof v.type === "string" && v.type.startsWith("vec2");
}
function isVec3(value) {
	const v = value;
	return isMarkedInternal(v) && typeof v.type === "string" && v.type.startsWith("vec3");
}
function isVec4(value) {
	const v = value;
	return isMarkedInternal(v) && typeof v.type === "string" && v.type.startsWith("vec4");
}
function isVec(value) {
	return isVec2(value) || isVec3(value) || isVec4(value);
}
function isVecBool(value) {
	return isVec(value) && value.type.includes("b");
}
function isMatInstance(value) {
	const v = value;
	return isMarkedInternal(v) && typeof v.kind?.startsWith === "function" && v.kind.startsWith("mat");
}
function isMat2x2f(value) {
	return isMarkedInternal(value) && value?.type === "mat2x2f";
}
function isMat3x3f(value) {
	return isMarkedInternal(value) && value?.type === "mat3x3f";
}
function isMat4x4f(value) {
	return isMarkedInternal(value) && value?.type === "mat4x4f";
}
function isMat(value) {
	return isMat2x2f(value) || isMat3x3f(value) || isMat4x4f(value);
}
function isInteger(value) {
	return isMarkedInternal(value) && [
		"abstractInt",
		"i32",
		"u32"
	].includes(value?.type);
}
function isIntegerVec(value) {
	return isVec(value) && isInteger(value.primitive);
}
function isFloat32VecInstance(element) {
	return isVecInstance(element) && [
		"vec2f",
		"vec3f",
		"vec4f"
	].includes(element.kind);
}
function isInteger32VecInstance(value) {
	return isVecInstance(value) && /[iu]$/.test(value.kind);
}
function isUint32VecInstance(value) {
	return isVecInstance(value) && /[u]$/.test(value.kind);
}
function isWgslData(value) {
	return isMarkedInternal(value) && wgslTypeLiterals.includes(value?.type);
}
/**
* Checks whether passed in value is an array schema,
* as opposed to, e.g., a disarray schema.
*
* Array schemas can be used to describe uniform and storage buffers,
* whereas disarray schemas cannot.
*
* @example
* isWgslArray(d.arrayOf(d.u32, 4)) // true
* isWgslArray(d.disarray(d.u32, 4)) // false
* isWgslArray(d.vec3f) // false
*/
function isWgslArray(schema) {
	return isMarkedInternal(schema) && schema?.type === "array";
}
/**
* Checks whether passed in value is a struct schema,
* as opposed to, e.g., an unstruct schema.
*
* Struct schemas can be used to describe uniform and storage buffers,
* whereas unstruct schemas cannot.
*
* @example
* isWgslStruct(d.struct({ a: d.u32 })) // true
* isWgslStruct(d.unstruct({ a: d.u32 })) // false
* isWgslStruct(d.vec3f) // false
*/
function isWgslStruct(schema) {
	return isMarkedInternal(schema) && schema?.type === "struct";
}
/**
* Checks whether passed in value is a pointer schema.
*
* @example
* isPtr(d.ptrFn(d.f32)) // true
* isPtr(d.ptrPrivate(d.f32)) // true
* isPtr(d.f32) // false
*/
function isPtr(schema) {
	return isMarkedInternal(schema) && schema?.type === "ptr";
}
/**
* Checks whether the passed in value is an atomic schema.
*
* @example
* isAtomic(d.atomic(d.u32)) // true
* isAtomic(d.u32) // false
*/
function isAtomic(schema) {
	return isMarkedInternal(schema) && schema?.type === "atomic";
}
function isAlignAttrib(value) {
	return isMarkedInternal(value) && value?.type === "@align";
}
function isSizeAttrib(value) {
	return isMarkedInternal(value) && value?.type === "@size";
}
function isLocationAttrib(value) {
	return isMarkedInternal(value) && value?.type === "@location";
}
function isInterpolateAttrib(value) {
	return isMarkedInternal(value) && value?.type === "@interpolate";
}
function isBuiltinAttrib(value) {
	return isMarkedInternal(value) && value?.type === "@builtin";
}
function isDecorated(value) {
	return isMarkedInternal(value) && value?.type === "decorated";
}
function isVoid(value) {
	return isMarkedInternal(value) && value.type === "void";
}
function isBool$1(value) {
	return isMarkedInternal(value) && value.type === "bool";
}
function isNumericSchema(schema) {
	const type = schema?.type;
	return isMarkedInternal(schema) && (type === "abstractInt" || type === "abstractFloat" || type === "f32" || type === "f16" || type === "i32" || type === "u32");
}
var ephemeralTypes = [
	"abstractInt",
	"abstractFloat",
	"f32",
	"f16",
	"i32",
	"u32",
	"bool"
];
/**
* Returns true for schemas that are not naturally referential in JS (primitives).
* @param schema
* @returns
*/
function isNaturallyEphemeral(schema) {
	return !isMarkedInternal(schema) || ephemeralTypes.includes(schema?.type);
}
function WORKAROUND_getSchema(vec) {
	return vec.schema;
}
//#endregion
//#region src/tgpuLogger.ts
var warningTypes = [
	"deprecated",
	"suspicious",
	"fallback",
	"precision-loss",
	"implicit-conversion",
	"webgpu-feature-missing",
	"webgpu-limits-exceeded",
	"log-limit-exceeded",
	"external-omitted",
	"uniform-schema-misaligned"
];
var TgpuLogger = class {
	#initialEnabledWarnings;
	#enabledWarnings;
	#warned = /* @__PURE__ */ new WeakMap();
	constructor(prod) {
		if (prod) this.#initialEnabledWarnings = [
			"webgpu-feature-missing",
			"webgpu-limits-exceeded",
			"log-limit-exceeded",
			"external-omitted"
		];
		else this.#initialEnabledWarnings = warningTypes;
		this.#enabledWarnings = new Set(this.#initialEnabledWarnings);
	}
	disable(type) {
		this.#enabledWarnings.delete(type);
	}
	reset() {
		this.#enabledWarnings = new Set(this.#initialEnabledWarnings);
	}
	isEnabled(type) {
		return this.#enabledWarnings.has(type);
	}
	warn(type, ...args) {
		if (this.#enabledWarnings.has(type)) console.warn(`⚠️ [${type}] `, ...args);
	}
	warnOnce(type, key, tag, ...args) {
		if (!this.#enabledWarnings.has(type)) return;
		let warnings = this.#warned.get(key);
		if (!warnings) {
			warnings = /* @__PURE__ */ new Set();
			this.#warned.set(key, warnings);
		}
		const warningId = `${type}:${tag}`;
		if (warnings.has(warningId)) return;
		warnings.add(warningId);
		this.warn(type, ...args);
	}
};
var logger = new TgpuLogger(true);
//#endregion
//#region src/shared/stringify.ts
function safeStringify(item) {
	if (Array.isArray(item)) return `[${item.map(safeStringify).join(", ")}]`;
	const asString = String(item);
	if (asString !== "[object Object]") return asString;
	try {
		return JSON.stringify(item);
	} catch (error) {
		logger.warn("suspicious", "Error parsing JSON:", error);
		return "<invalid json>";
	}
}
function niceStringify(item) {
	if (isVecInstance(item) || isMatInstance(item)) return item.toString();
	if (Array.isArray(item)) return `[${item.map(niceStringify).join(", ")}]`;
	if (item && typeof item === "object") return `{ ${Object.entries(item).map(([key, value]) => `${key}: ${niceStringify(value)}`).join(", ")} }`;
	return String(item);
}
//#endregion
//#region src/shared/normalizeMetadata.ts
/**
* The values of ExternalsV2 are zero-argument functions for accessing the value.
* Since they would be recognized by the WgslGenerator as regular, non 'use gpu' functions,
* we turn them into getters.
*
* @example
* normalizeExternalsV2({ "ext.prop": () => ext.prop; }); // { get "ext.prop"() => ext.prop; }
*/
function normalizeExternalsV2(externals) {
	const result = {};
	for (const [key, value] of Object.entries(externals)) Object.defineProperty(result, key, {
		get: value,
		enumerable: true
	});
	return result;
}
function normalizeMetadata(meta) {
	if (meta.v === 1) {
		const rawExternals = meta.externals;
		const externals = typeof rawExternals === "function" ? rawExternals : () => rawExternals;
		return {
			...meta,
			externals
		};
	}
	if (meta.v === 2) {
		const externals = normalizeExternalsV2(meta?.externals);
		return {
			...meta,
			externals: () => externals
		};
	}
	throw new Error(`Unrecognized TypeGPU metadata format: ${safeStringify(meta)}`);
}
//#endregion
//#region src/shared/meta.ts
var globalExt = globalThis;
if (globalExt.__TYPEGPU_VERSION__ !== void 0) console.warn(`Found duplicate TypeGPU version. First was ${globalExt.__TYPEGPU_VERSION__}, this one is ${version}. This may cause unexpected behavior.`);
globalExt.__TYPEGPU_VERSION__ = version;
globalExt.__TYPEGPU_AUTONAME__ = (exp, label) => isNamable(exp) && isMarkedInternal(exp) && !getName(exp) ? exp.$name(label) : exp;
var nameMap = /* @__PURE__ */ new WeakMap();
function isNamable(value) {
	return !!value?.$name;
}
function isForwarded(value) {
	return !!value?.[$getNameForward];
}
function soulOf(value) {
	return value?.[$soul];
}
function getName(definition) {
	if (isForwarded(definition)) return getName(definition[$getNameForward]);
	return nameMap.get(definition) ?? soulOf(definition)?.label ?? globalExt.__TYPEGPU_META__?.get(definition)?.name;
}
function setName(definition, name) {
	if (isForwarded(definition)) {
		setName(definition[$getNameForward], name);
		return;
	}
	nameMap.set(definition, name);
	const soul = soulOf(definition);
	if (soul) soul.label = name;
}
var metadataMap = /* @__PURE__ */ new WeakMap();
/**
* Retrieves normalized (non-raw) function metadata.
* If `globalExt.__TYPEGPU_META__` contains raw metadata for the function,
* it is normalized, and then deleted to avoid unnecessary re-normalization.
*/
function getFunctionMetadata(definition) {
	const maybeRawMeta = globalExt.__TYPEGPU_META__?.get(definition);
	if (maybeRawMeta) {
		globalExt.__TYPEGPU_META__?.delete(definition);
		const normalized = normalizeMetadata(maybeRawMeta);
		metadataMap.set(definition, normalized);
		if (maybeRawMeta.name && nameMap.get(definition) === void 0) nameMap.set(definition, maybeRawMeta.name);
	}
	return metadataMap.get(definition);
}
/**
* AST's are given to functions with a 'use gpu' directive, which this function checks for.
*/
function hasTinyestMetadata(value) {
	return typeof value === "function" && !!getFunctionMetadata(value);
}
/**
* Performance measurements are only enabled in dev & test environments for now
*/
var PERF = void 0;
//#endregion
//#region src/core/instrumentation/deviceEvents.ts
var entries = /* @__PURE__ */ new WeakMap();
var cleanup = new FinalizationRegistry(({ entry, ref }) => {
	entry.errorSinks.delete(ref);
	entry.lostSinks.delete(ref);
	releaseListener(entry);
});
function makeErrorListener(entry) {
	return (event) => {
		for (const ref of entry.errorSinks) {
			const sink = ref.deref();
			if (sink === void 0) entry.errorSinks.delete(ref);
			else sink.handleDeviceError(event);
		}
	};
}
function makeLostHandler(entry) {
	return (info) => {
		entry.lostInfo = info;
		for (const ref of entry.lostSinks) ref.deref()?.handleDeviceLost(info);
		entry.lostSinks.clear();
	};
}
function entryFor(device) {
	let entry = entries.get(device);
	if (entry === void 0) {
		entry = {
			device,
			errorSinks: /* @__PURE__ */ new Set(),
			lostSinks: /* @__PURE__ */ new Set(),
			listener: void 0,
			lostInfo: void 0
		};
		entries.set(device, entry);
		const lost = device.lost;
		if (typeof lost?.then === "function") lost.then(makeLostHandler(entry));
	}
	return entry;
}
function releaseListener(entry) {
	if (entry.listener !== void 0 && entry.errorSinks.size === 0) {
		entry.device.removeEventListener("uncapturederror", entry.listener);
		entry.listener = void 0;
	}
}
function notifyLate(ref, info) {
	queueMicrotask(() => ref.deref()?.handleDeviceLost(info));
}
function watchDevice(device, sink) {
	const entry = entryFor(device);
	const ref = new WeakRef(sink);
	entry.errorSinks.add(ref);
	if (entry.lostInfo !== void 0) notifyLate(ref, entry.lostInfo);
	else entry.lostSinks.add(ref);
	if (entry.listener === void 0 && typeof device.addEventListener === "function") {
		entry.listener = makeErrorListener(entry);
		device.addEventListener("uncapturederror", entry.listener);
	}
	cleanup.register(sink, {
		entry,
		ref
	});
	return {
		stopErrors() {
			entry.errorSinks.delete(ref);
			releaseListener(entry);
		},
		stopAll() {
			entry.errorSinks.delete(ref);
			entry.lostSinks.delete(ref);
			releaseListener(entry);
		}
	};
}
//#endregion
//#region src/core/instrumentation/eventSize.ts
/**
* Estimated retained payload size of an event, in bytes: UTF-16 string length × 2, 8 per number, 4 per boolean
* or null, plus a fixed cost per object, array and field. It exists to bound the history deterministically;
* it is **not** a heap measurement (engine object headers, string sharing and hidden classes are not modelled).
* Strings dominate real events (generated WGSL, compiler messages), and those are counted exactly.
*/
var OBJECT_COST = 32;
var FIELD_COST = 8;
function estimateEventBytes(value) {
	switch (typeof value) {
		case "string": return 16 + value.length * 2;
		case "number": return 8;
		case "boolean": return 4;
		case "object": {
			if (value === null) return 4;
			let bytes = OBJECT_COST;
			for (const key in value) bytes += FIELD_COST + estimateEventBytes(value[key]);
			return bytes;
		}
		default: return 4;
	}
}
//#endregion
//#region src/core/instrumentation/hub.ts
var DEFAULT_HISTORY_SIZE = 256;
var MAX_HISTORY_SIZE = 1e6;
var DEFAULT_HISTORY_MAX_BYTES = 4 * 1024 * 1024;
/** Events a single delivery pass may chain through re-entrant listeners before the storm is cut off. */
var MAX_EVENTS_PER_DELIVERY = 1e4;
/** Distinct failures surfaced per hub; later ones are only counted. */
var MAX_SURFACED_ERRORS = 5;
var MAX_RETAINED_PIPELINE_FAILURES = 16;
var MIN_SWEEP_SIZE = 1024;
/** Frozen: every snapshot and every root shares it. */
var UNAVAILABLE = Object.freeze([
	"gpuExecutionTime",
	"gpuMemoryUsage",
	"wrappedResources",
	"internalResources",
	"rawWebGPUCalls",
	"workgroupCounts",
	"perDispatchBindings",
	"textureMemory",
	"helperSubmissions",
	"restoredPipelines",
	"samplers",
	"textureViews",
	"renderBundles",
	"bindGroupLayouts"
]);
/**
* The per-root instrumentation state. Hook sites in TypeGPU call the sink methods; consumers only get
* {@link InstrumentationHub.api}, which exposes the public interface and nothing else.
*
* Holds no strong reference to the root, to any tracked object or to any GPU object other than the device.
*
* Failure policy: every sink method is guarded. An exception inside this layer is counted, surfaced once, and
* switches the layer off for good (`internalErrors` in the snapshot); it never reaches the application.
*/
var InstrumentationHub = class {
	api;
	#watch;
	#holder;
	#historySize;
	#historyMaxBytes;
	#captureSource;
	#active = false;
	#disposed = false;
	/** Set by `root.destroy()` of an owned device: only the device's `lost` notification may still be delivered. */
	#closing = false;
	#rootDestroyedSeen = false;
	#listeners = [];
	#seq = 0;
	#nextId = 1;
	#events = [];
	#eventBytes = [];
	#head = 0;
	#historyBytes = 0;
	#failures = [];
	#pending = [];
	#delivering = false;
	#byObject = /* @__PURE__ */ new WeakMap();
	#live = /* @__PURE__ */ new Map();
	/** `#live` is swept of collected objects whenever it reaches this size (and on every snapshot). */
	#sweepAt = MIN_SWEEP_SIZE;
	#submits = 0;
	#collectedWithoutDestroy = 0;
	#droppedEvents = 0;
	#droppedBytes = 0;
	#listenerErrors = 0;
	#lastListenerError = null;
	#internalErrors = 0;
	#lastInternalError = null;
	#surfacedErrors = /* @__PURE__ */ new Set();
	/**
	* @param holder Where hook sites read the hub from; the hub publishes (or clears) itself there.
	* See {@link TgpuInstrumentationProvider} for why it must be a plain object that does not lead back to the root.
	* @throws RangeError for an invalid option, at attach time (a developer error, never at run time).
	*/
	constructor(device, options, holder) {
		this.#holder = holder;
		const checked = validateOptions(options);
		this.#historySize = checked.historySize;
		this.#historyMaxBytes = checked.historyMaxBytes;
		this.#captureSource = checked.captureSource;
		this.api = createApi(this);
		this.#watch = watchDevice(device, this);
		this.enable();
	}
	get enabled() {
		return this.#active;
	}
	enable() {
		if (this.#disposed || this.#closing) return;
		this.#active = true;
		this.#holder.instrumentation = this;
	}
	disable() {
		this.#active = false;
		this.#holder.instrumentation = void 0;
	}
	subscribe(listener) {
		if (typeof listener !== "function") throw new TypeError("instrumentation.subscribe expects a function");
		if (this.#disposed) return () => {};
		const entry = {
			fn: listener,
			active: true
		};
		this.#listeners = [...this.#listeners, entry];
		return () => {
			entry.active = false;
			this.#listeners = this.#listeners.filter((l) => l !== entry);
		};
	}
	history() {
		return this.#events.slice(this.#head);
	}
	getSnapshot() {
		this.#sweep();
		const resources = [];
		const bindGroups = [];
		const pipelines = [];
		for (const rec of this.#live.values()) {
			const object = rec.ref.deref();
			if (object === void 0) continue;
			const label = getName(object) ?? null;
			if (rec.kind === "buffer" || rec.kind === "texture") resources.push({
				id: rec.id,
				resource: rec.kind,
				label,
				sizeBytes: rec.sizeBytes,
				usage: rec.usage,
				writes: rec.writes,
				bytesWritten: rec.bytesWritten
			});
			else if (rec.kind === "bind-group") bindGroups.push({
				id: rec.id,
				label,
				layoutId: rec.layoutId,
				origin: rec.origin,
				entries: rec.entries
			});
			else if (rec.kind === "pipeline") pipelines.push({
				id: rec.id,
				pipeline: rec.pipeline,
				label,
				trigger: rec.trigger,
				resolveMs: rec.resolveMs,
				createMs: rec.createMs,
				wgsl: rec.wgsl,
				wgslLength: rec.wgslLength,
				layoutIds: rec.layoutIds,
				dispatches: rec.dispatches,
				draws: rec.draws
			});
		}
		return {
			v: 2,
			t: performance.now(),
			enabled: this.#active,
			resources,
			bindGroups,
			pipelines,
			counters: {
				submits: this.#submits,
				collectedWithoutDestroy: this.#collectedWithoutDestroy,
				droppedEvents: this.#droppedEvents,
				droppedBytes: this.#droppedBytes,
				historyBytes: this.#historyBytes,
				listenerErrors: this.#listenerErrors,
				lastListenerError: this.#lastListenerError,
				internalErrors: this.#internalErrors,
				lastInternalError: this.#lastInternalError
			},
			retainedFailures: [...this.#failures],
			unavailable: UNAVAILABLE
		};
	}
	dispose() {
		this.#active = false;
		this.#disposed = true;
		this.#holder.instrumentation = void 0;
		for (const listener of this.#listeners) listener.active = false;
		this.#listeners = [];
		this.#surfacedErrors.clear();
		this.#watch.stopAll();
	}
	handleDeviceError(event) {
		if (!this.#active) return;
		try {
			const error = event.error;
			this.#emit({
				type: "device-error",
				errorType: error?.constructor?.name ?? "unknown",
				message: String(error?.message ?? "")
			});
		} catch (error) {
			this.#fail(error);
		}
	}
	handleDeviceLost(info) {
		if (!this.#active && !this.#closing) return;
		try {
			this.#emit({
				type: "device-lost",
				reason: String(info.reason),
				message: info.message
			});
		} catch (error) {
			this.#fail(error);
		}
		if (this.#closing) this.dispose();
	}
	now() {
		return performance.now();
	}
	bufferMaterialized(buffer, descriptor) {
		try {
			const rec = {
				kind: "buffer",
				id: this.#nextId++,
				ref: new WeakRef(buffer),
				sizeBytes: descriptor.size,
				usage: descriptor.usage,
				writes: 0,
				bytesWritten: 0
			};
			this.#register(buffer, rec);
			this.#emit({
				type: "resource-materialized",
				resource: "buffer",
				id: rec.id,
				label: getName(buffer) ?? null,
				sizeBytes: descriptor.size,
				usage: descriptor.usage
			});
		} catch (error) {
			this.#fail(error);
		}
	}
	textureMaterialized(texture, descriptor) {
		try {
			const rec = {
				kind: "texture",
				id: this.#nextId++,
				ref: new WeakRef(texture),
				sizeBytes: null,
				usage: descriptor.usage,
				writes: null,
				bytesWritten: null
			};
			this.#register(texture, rec);
			const size = descriptor.size;
			this.#emit({
				type: "resource-materialized",
				resource: "texture",
				id: rec.id,
				label: getName(texture) ?? null,
				format: descriptor.format,
				size: Array.isArray(size) ? [...size] : [
					size.width,
					size.height ?? 1,
					size.depthOrArrayLayers ?? 1
				],
				mipLevelCount: descriptor.mipLevelCount ?? 1,
				sampleCount: descriptor.sampleCount ?? 1,
				dimension: descriptor.dimension ?? "2d",
				usage: descriptor.usage
			});
		} catch (error) {
			this.#fail(error);
		}
	}
	bufferWritten(buffer, bytes) {
		try {
			const rec = this.#byObject.get(buffer);
			if (rec?.kind === "buffer") {
				rec.writes = (rec.writes ?? 0) + 1;
				rec.bytesWritten = (rec.bytesWritten ?? 0) + bytes;
			}
		} catch (error) {
			this.#fail(error);
		}
	}
	/** Ignores objects that were never tracked (wrapped, or created while disabled). */
	resourceDestroyed(resource) {
		try {
			const rec = this.#byObject.get(resource);
			if (rec?.kind !== "buffer" && rec?.kind !== "texture") return;
			this.#live.delete(rec.id);
			this.#byObject.delete(resource);
			this.#emit({
				type: "resource-destroyed",
				resource: rec.kind,
				id: rec.id,
				label: getName(resource) ?? null
			});
		} catch (error) {
			this.#fail(error);
		}
	}
	bindGroupCreated(bindGroupObject, origin) {
		try {
			const bindGroup = bindGroupObject;
			const entries = [];
			for (const [name, layoutEntry] of Object.entries(bindGroup.layout.entries)) {
				if (layoutEntry === null) continue;
				const value = bindGroup.entries[name];
				let kind = "other";
				let resourceId = null;
				if ("uniform" in layoutEntry || "storage" in layoutEntry) {
					kind = "buffer";
					resourceId = this.#trackedId(bufferOf(value));
				} else if ("texture" in layoutEntry || "storageTexture" in layoutEntry || "externalTexture" in layoutEntry) {
					kind = "texture";
					resourceId = this.#trackedId(value) ?? this.#trackedId(value?.[$soul]?.texture);
				} else if ("sampler" in layoutEntry) kind = "sampler";
				entries.push({
					name,
					kind,
					resourceId
				});
			}
			const layoutId = this.#identityId(bindGroup.layout);
			const rec = {
				kind: "bind-group",
				id: this.#nextId++,
				ref: new WeakRef(bindGroupObject),
				layoutId,
				origin,
				entries
			};
			this.#register(bindGroupObject, rec);
			this.#emit({
				type: "bind-group-created",
				id: rec.id,
				label: getName(bindGroup.layout) ?? null,
				layoutId,
				origin,
				entries
			});
		} catch (error) {
			this.#fail(error);
		}
	}
	pipelineCreated(core, info) {
		if (!this.#active) return;
		try {
			const layoutIds = info.layouts.map((layout) => this.#identityId(layout));
			const wgsl = this.#captureSource ? info.wgsl : null;
			const known = this.#byObject.get(core);
			const rec = {
				kind: "pipeline",
				id: known?.kind === "identity" ? known.id : this.#nextId++,
				ref: new WeakRef(core),
				pipeline: info.pipeline,
				trigger: info.trigger,
				resolveMs: info.resolveMs,
				createMs: info.createMs,
				wgsl,
				wgslLength: info.wgsl.length,
				layoutIds,
				dispatches: 0,
				draws: 0
			};
			this.#register(core, rec);
			this.#emit({
				type: "pipeline-created",
				id: rec.id,
				pipeline: info.pipeline,
				label: getName(core) ?? null,
				trigger: info.trigger,
				validation: info.trigger === "initAsync" ? "passed" : "deferred",
				resolveMs: info.resolveMs,
				createMs: info.createMs,
				wgsl,
				wgslLength: info.wgsl.length,
				layoutIds,
				layoutLabels: info.layouts.map((layout) => getName(layout) ?? null)
			});
			this.#requestDiagnostics(rec.id, info.module);
		} catch (error) {
			this.#fail(error);
		}
	}
	/** The async creation rejected: no pipeline exists to list, but the WGSL and the compiler messages remain. */
	pipelineCreationFailed(core, info, error) {
		if (!this.#active) return;
		try {
			const id = this.#identityId(core);
			this.#emit({
				type: "pipeline-creation-failed",
				id,
				pipeline: info.pipeline,
				label: getName(core) ?? null,
				trigger: info.trigger,
				phase: "create",
				resolveMs: info.resolveMs,
				createMs: info.createMs,
				wgsl: this.#captureSource ? info.wgsl : null,
				wgslLength: info.wgsl.length,
				layoutIds: info.layouts.map((layout) => this.#identityId(layout)),
				layoutLabels: info.layouts.map((layout) => getName(layout) ?? null),
				...describeThrown(error)
			});
			this.#requestDiagnostics(id, info.module);
		} catch (thrown) {
			this.#fail(thrown);
		}
	}
	/** TypeGPU could not generate the WGSL (the error is rethrown to the application unchanged). */
	pipelineResolutionFailed(core, pipeline, trigger, error) {
		if (!this.#active) return;
		try {
			this.#emit({
				type: "pipeline-creation-failed",
				id: this.#identityId(core),
				pipeline,
				label: getName(core) ?? null,
				trigger,
				phase: "resolve",
				resolveMs: 0,
				createMs: 0,
				wgsl: null,
				wgslLength: 0,
				layoutIds: [],
				layoutLabels: [],
				...describeThrown(error)
			});
		} catch (thrown) {
			this.#fail(thrown);
		}
	}
	#requestDiagnostics(pipelineId, shaderModule) {
		const module = shaderModule;
		if (typeof module?.getCompilationInfo !== "function") return;
		module.getCompilationInfo().then((compilation) => {
			if (!this.#active) return;
			try {
				this.#emit({
					type: "shader-diagnostics",
					pipelineId,
					messages: compilation.messages.map((m) => ({
						type: m.type,
						message: m.message,
						lineNum: m.lineNum,
						linePos: m.linePos
					}))
				});
			} catch (error) {
				this.#fail(error);
			}
		}, () => {});
	}
	dispatched(core) {
		if (!this.#active) return;
		try {
			const rec = this.#byObject.get(core);
			if (rec?.kind === "pipeline") rec.dispatches++;
		} catch (error) {
			this.#fail(error);
		}
	}
	drew(core) {
		if (!this.#active) return;
		try {
			const rec = this.#byObject.get(core);
			if (rec?.kind === "pipeline") rec.draws++;
		} catch (error) {
			this.#fail(error);
		}
	}
	submitted() {
		this.#submits++;
	}
	/**
	* Reports leftover resources, then detaches. A device owned by the root is destroyed by the root, so the
	* `lost` notification (reason `destroyed`) is still delivered to current subscribers; after it the stream
	* ends. For a borrowed device nothing more will be observed, so the layer is disposed at once.
	*/
	rootDestroyed(ownDevice) {
		if (this.#rootDestroyedSeen) return;
		this.#rootDestroyedSeen = true;
		try {
			let liveBuffers = 0;
			let liveTextures = 0;
			for (const rec of this.#live.values()) {
				if (rec.ref.deref() === void 0) continue;
				if (rec.kind === "buffer") liveBuffers++;
				else if (rec.kind === "texture") liveTextures++;
			}
			if (this.#active) this.#emit({
				type: "root-destroyed",
				ownDevice,
				liveBuffers,
				liveTextures
			});
		} catch (error) {
			this.#fail(error);
		}
		if (ownDevice) {
			this.#closing = true;
			this.#active = false;
			this.#holder.instrumentation = void 0;
			this.#live.clear();
			this.#watch.stopErrors();
		} else this.dispose();
	}
	#register(object, rec) {
		this.#byObject.set(object, rec);
		this.#live.set(rec.id, rec);
		if (this.#live.size >= this.#sweepAt) this.#sweep();
	}
	/**
	* Forgets records whose object was garbage-collected, counting the resources among them. Deterministic
	* (no finalizer callbacks): it runs when the registry has doubled since the last sweep, so a long-running
	* application that never asks for a snapshot cannot grow it without bound, and in every `getSnapshot()`.
	*/
	#sweep() {
		for (const [id, rec] of this.#live) if (rec.ref.deref() === void 0) {
			this.#live.delete(id);
			if (rec.kind === "buffer" || rec.kind === "texture") this.#collectedWithoutDestroy++;
		}
		this.#sweepAt = Math.max(MIN_SWEEP_SIZE, this.#live.size * 2);
	}
	#identityId(object) {
		let rec = this.#byObject.get(object);
		if (rec === void 0) {
			rec = {
				kind: "identity",
				id: this.#nextId++
			};
			this.#byObject.set(object, rec);
		}
		return rec.id;
	}
	#trackedId(object) {
		if (typeof object !== "object" || object === null) return null;
		return this.#byObject.get(object)?.id ?? null;
	}
	#emit(init) {
		const stamped = init;
		stamped.v = 2;
		stamped.seq = ++this.#seq;
		stamped.t = performance.now();
		const event = deepFreeze$1(init);
		this.#record(event);
		this.#pending.push(event);
		if (this.#delivering) return;
		this.#delivering = true;
		try {
			for (let i = 0; i < this.#pending.length; i++) {
				if (i >= MAX_EVENTS_PER_DELIVERY) {
					this.#noteListenerError(/* @__PURE__ */ new Error(`a subscriber keeps causing new events (over ${MAX_EVENTS_PER_DELIVERY} in one delivery); delivery stopped`));
					break;
				}
				const queued = this.#pending[i];
				for (const listener of this.#listeners) {
					if (!listener.active) continue;
					try {
						listener.fn(queued);
					} catch (error) {
						this.#noteListenerError(error);
					}
				}
			}
		} finally {
			this.#pending = [];
			this.#delivering = false;
		}
	}
	#record(event) {
		const bytes = estimateEventBytes(event);
		if (event.type === "pipeline-creation-failed" || event.type === "device-lost") this.#retainFailure(event);
		if (this.#historySize === 0) {
			this.#droppedEvents++;
			this.#droppedBytes += bytes;
			return;
		}
		this.#events.push(event);
		this.#eventBytes.push(bytes);
		this.#historyBytes += bytes;
		while (this.#events.length - this.#head > this.#historySize || this.#historyBytes > this.#historyMaxBytes && this.#events.length - this.#head > 1) this.#evictOldest();
	}
	#evictOldest() {
		const bytes = this.#eventBytes[this.#head];
		this.#events[this.#head] = void 0;
		this.#head++;
		this.#historyBytes -= bytes;
		this.#droppedEvents++;
		this.#droppedBytes += bytes;
		if (this.#head >= 1024 && this.#head * 2 >= this.#events.length) {
			this.#events = this.#events.slice(this.#head);
			this.#eventBytes = this.#eventBytes.slice(this.#head);
			this.#head = 0;
		}
	}
	/** At most 16 pipeline failures and one device loss, within the history's byte bound (newest always kept). */
	#retainFailure(event) {
		const kept = event.type === "device-lost" ? this.#failures.filter((f) => f.type !== "device-lost") : this.#failures;
		kept.push(event);
		let failureCount = kept.filter((f) => f.type === "pipeline-creation-failed").length;
		let total = kept.reduce((sum, f) => sum + estimateEventBytes(f), 0);
		while (kept.length > 1 && (failureCount > MAX_RETAINED_PIPELINE_FAILURES || total > this.#historyMaxBytes)) {
			const oldest = kept.findIndex((f) => f !== event && f.type !== "device-lost");
			if (oldest < 0) break;
			const [removed] = kept.splice(oldest, 1);
			if (removed?.type === "pipeline-creation-failed") failureCount--;
			total -= estimateEventBytes(removed);
		}
		this.#failures = kept;
	}
	/**
	* A subscriber failure must not reach the instrumented application and must not be silent: it is counted,
	* and the first few distinct ones are surfaced to the environment's error reporting.
	*/
	#noteListenerError(error) {
		this.#listenerErrors++;
		const text = describeError(error);
		this.#lastListenerError = text;
		this.#surfaceOnce(text, error);
	}
	/** An internal failure switches the layer off: observing must never be able to disturb the application. */
	#fail(error) {
		this.#internalErrors++;
		const text = describeError(error);
		this.#lastInternalError = text;
		this.#surfaceOnce(`internal: ${text}`, error);
		this.dispose();
	}
	#surfaceOnce(key, error) {
		if (this.#surfacedErrors.size >= MAX_SURFACED_ERRORS || this.#surfacedErrors.has(key)) return;
		this.#surfacedErrors.add(key);
		surfaceError(error);
	}
};
/** The public face: only the documented methods, frozen. Built outside the class so no closure sees the hub's internals. */
function createApi(hub) {
	return Object.freeze({
		get enabled() {
			return hub.enabled;
		},
		enable: () => hub.enable(),
		disable: () => hub.disable(),
		subscribe: (listener) => hub.subscribe(listener),
		history: () => hub.history(),
		getSnapshot: () => hub.getSnapshot(),
		dispose: () => hub.dispose()
	});
}
/** `String(value)` that cannot throw (null-prototype objects, throwing `toString`, revoked proxies). */
function safeString(value) {
	try {
		return String(value);
	} catch {
		try {
			return Object.prototype.toString.call(value);
		} catch {
			return "[unprintable value]";
		}
	}
}
function describeThrown(error) {
	try {
		return {
			errorType: error?.constructor?.name ?? "unknown",
			message: safeString(error?.message ?? error)
		};
	} catch {
		return {
			errorType: "unknown",
			message: safeString(error)
		};
	}
}
function describeError(error) {
	try {
		if (error instanceof Error) return `${error.name}: ${safeString(error.message)}`;
	} catch {}
	return safeString(error);
}
function surfaceError(error) {
	try {
		if (typeof globalThis.reportError === "function") globalThis.reportError(error);
		else console.error("[typegpu instrumentation]", error);
	} catch {}
}
/**
* Validates and normalises the options. Called by `createInstrumentation()` (so a mistake fails before
* `tgpu.init` has requested a device) and again when a hub is attached.
*/
function validateOptions(options) {
	if (typeof options !== "object" || options === null) throw new TypeError(`unstable_instrumentation: options must be an object or undefined, got ${options === null ? "null" : typeof options}`);
	const { historySize, historyMaxBytes, captureSource } = options;
	if (captureSource !== void 0 && typeof captureSource !== "boolean") throw new TypeError(`unstable_instrumentation: captureSource must be a boolean, got ${typeof captureSource}`);
	return {
		historySize: checkedOption("historySize", historySize, DEFAULT_HISTORY_SIZE, MAX_HISTORY_SIZE),
		historyMaxBytes: checkedOption("historyMaxBytes", historyMaxBytes, DEFAULT_HISTORY_MAX_BYTES, Number.MAX_SAFE_INTEGER),
		captureSource: captureSource ?? true
	};
}
function checkedOption(name, value, fallback, max) {
	if (value === void 0) return fallback;
	if (typeof value !== "number" || !Number.isInteger(value) || value < 0 || value > max) throw new RangeError(`unstable_instrumentation: ${name} must be an integer between 0 and ${max}, got ${String(value)}`);
	return value;
}
function deepFreeze$1(value) {
	if (typeof value === "object" && value !== null && !Object.isFrozen(value)) {
		Object.freeze(value);
		for (const key in value) deepFreeze$1(value[key]);
	}
	return value;
}
/** A buffer entry is a buffer, or a binding that wraps one; touching `.buffer` of a TgpuBuffer would materialize it. */
function bufferOf(value) {
	if (typeof value !== "object" || value === null) return;
	if (value.resourceType === "buffer") return value;
	const inner = value.buffer;
	return inner?.resourceType === "buffer" ? inner : void 0;
}
//#endregion
//#region src/core/instrumentation/index.ts
/**
* Public entry point of the instrumentation layer (`typegpu/unstable-instrumentation`).
*
* TypeGPU's core refers to instrumentation through type-only imports, so this module (the hub, the device
* listener registry, the event size estimate) is bundled only into applications that import it.
*/
/**
* Creates the value for the `unstable_instrumentation` option of `tgpu.init` / `tgpu.initFromDevice`:
* `tgpu.init({ unstable_instrumentation: createInstrumentation() })`, then read the data from
* `root['~unstable'].instrumentation`. The provider can be passed to several roots; each gets its own state.
*/
function createInstrumentation(options = {}) {
	validateOptions(options);
	return { attach(device, holder) {
		return new InstrumentationHub(device, options, holder);
	} };
}
//#endregion
//#region src/shared/vertexFormat.ts
var vertexFormats = [
	"uint8",
	"uint8x2",
	"uint8x4",
	"sint8",
	"sint8x2",
	"sint8x4",
	"unorm8",
	"unorm8x2",
	"unorm8x4",
	"snorm8",
	"snorm8x2",
	"snorm8x4",
	"uint16",
	"uint16x2",
	"uint16x4",
	"sint16",
	"sint16x2",
	"sint16x4",
	"unorm16",
	"unorm16x2",
	"unorm16x4",
	"snorm16",
	"snorm16x2",
	"snorm16x4",
	"float16",
	"float16x2",
	"float16x4",
	"float32",
	"float32x2",
	"float32x3",
	"float32x4",
	"uint32",
	"uint32x2",
	"uint32x3",
	"uint32x4",
	"sint32",
	"sint32x2",
	"sint32x3",
	"sint32x4",
	"unorm10-10-10-2",
	"unorm8x4-bgra"
];
//#endregion
//#region src/data/dataTypes.ts
/**
* Runtime function to extract the inner data type from decorated types.
* If the data is not decorated, returns the data as-is.
*/
function undecorate(data) {
	if (isDecorated(data) || isLooseDecorated(data)) return data.inner;
	return data;
}
function unptr(data) {
	if (isPtr(data)) return data.inner;
	return data;
}
var looseTypeLiterals = [
	"unstruct",
	"disarray",
	"loose-decorated",
	...vertexFormats
];
function isLooseData(data) {
	return isMarkedInternal(data) && looseTypeLiterals.includes(data?.type);
}
/**
* Checks whether the passed in value is a disarray schema,
* as opposed to, e.g., a regular array schema.
*
* Array schemas can be used to describe uniform and storage buffers,
* whereas disarray schemas cannot. Disarrays are useful for
* defining vertex buffers instead.
*
* @example
* isDisarray(d.arrayOf(d.u32, 4)) // false
* isDisarray(d.disarrayOf(d.u32, 4)) // true
* isDisarray(d.vec3f) // false
*/
function isDisarray(schema) {
	return isMarkedInternal(schema) && schema?.type === "disarray";
}
/**
* Checks whether passed in value is a unstruct schema,
* as opposed to, e.g., a struct schema.
*
* Struct schemas can be used to describe uniform and storage buffers,
* whereas unstruct schemas cannot. Unstructs are useful for
* defining vertex buffers instead.
*
* @example
* isUnstruct(d.struct({ a: d.u32 })) // false
* isUnstruct(d.unstruct({ a: d.u32 })) // true
* isUnstruct(d.vec3f) // false
*/
function isUnstruct(schema) {
	return isMarkedInternal(schema) && schema?.type === "unstruct";
}
function isLooseDecorated(value) {
	return isMarkedInternal(value) && value?.type === "loose-decorated";
}
function getCustomAlignment(data) {
	return data.attribs?.find(isAlignAttrib)?.params[0];
}
function getCustomSize(data) {
	return data.attribs?.find(isSizeAttrib)?.params[0];
}
function getCustomLocation(data) {
	return data.attribs?.find(isLocationAttrib)?.params[0];
}
function isData(value) {
	return isWgslData(value) || isLooseData(value);
}
var UnknownData = Symbol("UNKNOWN");
//#endregion
//#region src/data/snippet.ts
/**
* What happens to a snippet's origin when it's deep copied in JS, and left as is in WGSL?
* e.g. `vec3f(vec3f(0, 1, 2))`
*/
function fallthroughCopyOrigin(origin) {
	if (origin === "runtime" || origin === "constant") return origin;
	return "runtime";
}
/**
* Whether a snippet refers to a value already stored in memory.
*
* @example
* ```ts
* function foo(a: number) {
*   'use gpu';
*   const color = d.vec3f(1, 2, 3);
*   return color * a;
* }
*
* // Stored in memory:
* // -  color
* // -  a
* //
* // Ephemeral values:
* // - d.vec3f(1, 2, 3)
* // - color * a
* ```
*/
function isStoredInMemory(snippet) {
	return !(snippet.origin === "runtime" || snippet.origin === "constant");
}
var originToPtrParams = {
	uniform: {
		space: "uniform",
		access: "read"
	},
	immediate: {
		space: "immediate",
		access: "read"
	},
	readonly: {
		space: "storage",
		access: "read"
	},
	mutable: {
		space: "storage",
		access: "read-write"
	},
	workgroup: {
		space: "workgroup",
		access: "read-write"
	},
	private: {
		space: "private",
		access: "read-write"
	},
	function: {
		space: "function",
		access: "read-write"
	},
	"local-def": {
		space: "function",
		access: "read-write"
	}
};
/**
* Whether values of this origin can have their address taken.
*/
function isAddressableOrigin(origin) {
	return origin in originToPtrParams;
}
/**
* Whether values of this origin can be mutated.
*/
function isMutableOrigin(origin) {
	return isAddressableOrigin(origin) && originToPtrParams[origin].access === "read-write";
}
var SnippetImpl = class {
	value;
	dataType;
	origin;
	possibleSideEffects;
	constructor(value, dataType, origin, possibleSideEffects) {
		this.value = value;
		this.dataType = dataType;
		this.origin = origin;
		this.possibleSideEffects = possibleSideEffects;
	}
};
function isSnippet(value) {
	return value instanceof SnippetImpl;
}
function isSnippetNumeric(snippet) {
	return isNumericSchema(snippet.dataType);
}
function snip(value, dataType, origin, possibleSideEffects = true) {
	return new SnippetImpl(value, undecorate(dataType), origin, possibleSideEffects);
}
function withDataType(dataType, snippet) {
	return new SnippetImpl(snippet.value, dataType, snippet.origin, snippet.possibleSideEffects);
}
function withValue(value, snippet) {
	return new SnippetImpl(value, snippet.dataType, snippet.origin, snippet.possibleSideEffects);
}
function withSideEffects(possibleSideEffects, snippet) {
	return new SnippetImpl(snippet.value, snippet.dataType, snippet.origin, possibleSideEffects);
}
function noSideEffects(snippet) {
	return withSideEffects(false, snippet);
}
//#endregion
//#region src/getGPUValue.ts
function getGPUValue(object) {
	return object?.[$gpuValueOf];
}
//#endregion
//#region src/core/slot/slotTypes.ts
function isSlot(value) {
	return value?.resourceType === "slot";
}
function isLazy(value) {
	return value?.resourceType === "lazy";
}
function isProviding(value) {
	return value?.[$providing] !== void 0;
}
function isAccessor(value) {
	return value?.resourceType === "accessor";
}
function isMutableAccessor(value) {
	return value?.resourceType === "mutable-accessor";
}
//#endregion
//#region src/types.ts
var NormalState = class {
	type = "normal";
};
var CodegenState = class {
	type = "codegen";
};
function isSelfResolvable(value) {
	return !!value?.[$resolve];
}
function getOwnSnippet(value) {
	return value?.[$ownSnippet];
}
/**
* A `[$comptimeValueOf]` implementation for resources that are only known at runtime
*/
function runtimeOnly() {
	return { comptime: false };
}
function isGPUCallable(value) {
	return !!value?.[$gpuCallable];
}
function hasCast(value) {
	return !!value?.[$cast];
}
/**
* @returns A snippet holding the JS value that `snippet` represents at comptime,
* or `undefined` if it is only known at runtime.
*/
function asComptime(snippet) {
	const { value } = snippet;
	if (typeof value === "string" && snippet.dataType !== UnknownData) return;
	const getter = value?.[$comptimeValueOf];
	if (!getter) return snippet;
	const result = getter.call(value);
	return result.comptime ? withValue(result.value, snippet) : void 0;
}
function isConstant(snippet) {
	return asComptime(snippet) !== void 0 || snippet.origin === "constant" || snippet.origin === "constant-immutable-def";
}
function isWgsl(value) {
	return typeof value === "number" || typeof value === "boolean" || isSelfResolvable(value) || isWgslData(value) || isSlot(value) || isLazy(value) || isProviding(value);
}
function isGPUBuffer(value) {
	return !!value && typeof value === "object" && "getMappedRange" in value && "mapAsync" in value;
}
function isBuffer(value) {
	return value.resourceType === "buffer";
}
function isUsableAsUniform(buffer) {
	return !!buffer.usableAsUniform;
}
function isUsableAsStorage(value) {
	return !!value?.usableAsStorage;
}
//#endregion
//#region src/execMode.ts
/**
* Used to track if the code we're currently
* executing is inside an executing TypeGPU function.
*
* Helpful for providing better error messages.
*/
var insideTgpuFn = false;
function provideInsideTgpuFn(callback) {
	if (insideTgpuFn) return callback();
	try {
		insideTgpuFn = true;
		return callback();
	} finally {
		insideTgpuFn = false;
	}
}
function isInsideTgpuFn() {
	return insideTgpuFn;
}
var resolutionCtx;
function provideCtx(ctx, callback) {
	if (resolutionCtx === ctx) return callback();
	const prevCtx = resolutionCtx;
	resolutionCtx = ctx;
	try {
		return callback();
	} finally {
		resolutionCtx = prevCtx;
	}
}
function getResolutionCtx() {
	return resolutionCtx;
}
/**
* Applicable when code is being executed outside of any
* execution-altering APIs.
*/
var topLevelState = new NormalState();
function getExecMode() {
	return resolutionCtx?.mode ?? topLevelState;
}
function inCodegenMode() {
	return resolutionCtx?.mode.type === "codegen";
}
//#endregion
//#region src/core/resolve/stitch.ts
/**
* "The reverse of snipping"
* Injects resolved snippets into a template string.
*/
function stitch(strings, ...snippets) {
	const ctx = getResolutionCtx();
	function resolveSnippet(maybeSnippet) {
		return isSnippet(maybeSnippet) ? ctx.resolveSnippet(maybeSnippet).value : maybeSnippet;
	}
	let result = "";
	for (let i = 0; i < strings.length; ++i) {
		result += strings[i];
		const snippet = snippets[i];
		if (Array.isArray(snippet)) result += snippet.filter((s) => s !== void 0).map(resolveSnippet).join(", ");
		else if (snippet) result += resolveSnippet(snippet);
	}
	return result;
}
//#endregion
//#region src/data/matrixColumnsAccess.ts
var MatrixColumnsAccess = class {
	matrix;
	constructor(matrix) {
		this.matrix = matrix;
	}
	[$comptimeValueOf]() {
		const known = asComptime(this.matrix);
		return known ? {
			comptime: true,
			value: known.value.columns
		} : { comptime: false };
	}
};
//#endregion
//#region src/data/schemaCallWrapper.ts
/**
* A wrapper for `schema(item)` or `schema()` call on JS side.
* If the schema is a pointer, returns the value pointed to without copying.
* If the schema is a TgpuVertexFormatData, calls the corresponding constructible schema instead.
* If the schema is not callable, throws an error.
* Otherwise, returns `schema(item)` or `schema()`.
*/
function schemaCallWrapper(schema, item) {
	const callSchema = schema;
	if (hasCast(callSchema)) return callSchema[$cast](item);
	if (typeof callSchema !== "function") return item;
	return item === void 0 ? callSchema() : callSchema(item);
}
/**
* A wrapper for `schema(item)` or `schema()` call on the GPU side.
* If the schema is a pointer, returns the value pointed to without copying.
* If the schema is a TgpuVertexFormatData, calls the corresponding constructible schema instead.
* If the schema is not callable, throws an error.
* Otherwise, returns `schema(item)` or `schema()`.
*/
function schemaCallWrapperGPU(ctx, schema, item) {
	if (!isGPUCallable(schema)) return item;
	const callSchema = schema;
	return item === void 0 || item.value === void 0 ? callSchema[$gpuCallable].call(ctx, []) : callSchema[$gpuCallable].call(ctx, [item]);
}
//#endregion
//#region ../tinyest/src/nodes.ts
var NodeTypeCatalog = {
	block: 0,
	binaryExpr: 1,
	assignmentExpr: 2,
	logicalExpr: 3,
	unaryExpr: 4,
	numericLiteral: 5,
	call: 6,
	memberAccess: 7,
	indexAccess: 8,
	identifier: 9,
	return: 10,
	if: 11,
	let: 12,
	const: 13,
	for: 14,
	while: 15,
	continue: 16,
	break: 17,
	forOf: 18,
	switch: 19,
	arrayExpr: 100,
	preUpdate: 101,
	postUpdate: 102,
	stringLiteral: 103,
	objectExpr: 104,
	conditionalExpr: 105,
	nullLiteral: 106,
	booleanLiteral: 107
};
var FuncParameterType = {
	identifier: "i",
	destructuredObject: "d"
};
function map(arr, line, column) {
	return [
		-1,
		line,
		column,
		arr
	];
}
/**
* Returns a new node with embedded source map.
*
* Only array nodes will be mapped, this means that
* identifier and boolean won't be mapped unless they are in array form.
*
* Use {@link stripSourceMap} to restore node and sourceMap.
*/
function embedSourceMap(node, sourceMap) {
	function embed(item) {
		let result;
		if (Array.isArray(item)) result = item.map((elem) => embed(elem));
		else if (item && typeof item === "object") result = Object.fromEntries(Object.entries(item).map(([key, value]) => [key, embed(value)]));
		else result = item;
		if (Array.isArray(result) && Array.isArray(item)) {
			const maybeSource = sourceMap.get(item);
			if (maybeSource) return map(result, ...maybeSource);
		}
		return result;
	}
	return embed(node);
}
/**
* Use this function to split SourceMappedNode into AnyNode and SourceMap.
* It is not recommended to strip source maps in any other way.
*/
function stripSourceMap(node) {
	const sourceMap = /* @__PURE__ */ new Map();
	function strip(item) {
		if (typeof item !== "object") return item;
		if (Array.isArray(item) && item[0] === -1) {
			const [, line, column, inner] = item;
			const stripped = strip(inner);
			if (Array.isArray(stripped)) sourceMap.set(stripped, [line, column]);
			return stripped;
		}
		if (Array.isArray(item)) return item.map(strip);
		else if (item) return Object.fromEntries(Object.entries(item).map(([key, value]) => [key, strip(value)]));
		return item;
	}
	return [strip(node), sourceMap];
}
//#endregion
//#region ../tinyest/src/index.ts
var src_exports = /* @__PURE__ */ __exportAll({
	FuncParameterType: () => FuncParameterType,
	NodeTypeCatalog: () => NodeTypeCatalog,
	embedSourceMap: () => embedSourceMap,
	stripSourceMap: () => stripSourceMap
});
//#endregion
//#region src/shared/tseynit.ts
var { NodeTypeCatalog: NODE$1 } = src_exports;
function stringifyNode(node) {
	if (isExpression(node)) return stringifyExpression(node);
	return stringifyStatement(node, "");
}
function stringifyStatement(node, indent) {
	if (isExpression(node)) return `${indent}${stringifyExpression(node)};`;
	if (node[0] === NODE$1.block) return `{\n${node[1].map((n) => stringifyStatement(n, indent + "  ")).join("\n")}\n${indent}}`;
	if (node[0] === NODE$1.return) return `${indent}return${node[1] === void 0 ? "" : ` ${stringifyExpression(node[1])}`};`;
	if (node[0] === NODE$1.if) {
		const base = `${indent}if (${stringifyExpression(node[1])}) ${stringifyStatement(node[2], indent)}`;
		if (node[3] !== void 0) return `${base} else ${stringifyStatement(node[3], indent)}`;
		return base;
	}
	if (node[0] === NODE$1.let) {
		const decl = `${indent}let ${stringifyExpression(node[1])}`;
		if (node[2] !== void 0) return `${decl} = ${stringifyExpression(node[2])};`;
		return `${decl};`;
	}
	if (node[0] === NODE$1.const) {
		const decl = `${indent}const ${stringifyExpression(node[1])}`;
		if (node[2] !== void 0) return `${decl} = ${stringifyExpression(node[2])};`;
		return `${decl};`;
	}
	if (node[0] === NODE$1.for) {
		const init = node[1] ? stringifyStatement(node[1], "") : ";";
		const cond = node[2] ? stringifyExpression(node[2]) : "";
		const update = node[3] ? stringifyStatement(node[3], "") : "";
		const body = stringifyStatement(node[4], indent);
		return `${indent}for (${init} ${cond}; ${update.slice(0, -1)}) ${body}`;
	}
	if (node[0] === NODE$1.while) return `${indent}while (${stringifyExpression(node[1])}) ${stringifyStatement(node[2], indent)}`;
	if (node[0] === NODE$1.continue) return `${indent}continue;`;
	if (node[0] === NODE$1.break) return `${indent}break;`;
	if (node[0] === NODE$1.forOf) return `${indent}for (${node[1][0] === NODE$1.const ? "const" : "let"} ${stringifyExpression(node[1][1])} of ${stringifyExpression(node[2])}) ${stringifyStatement(node[3], indent)}`;
	if (node[0] === NODE$1.switch) return `${indent}switch (${stringifyExpression(node[1])}) {\n${node[2].map((c) => {
		const test = c[0] === null ? "default" : `case ${stringifyExpression(c[0])}`;
		if (c[1].length === 0) return `${test}:`;
		return `${test}:\n${c[1].map((s) => stringifyStatement(s, indent + "    ")).join("\n")}`;
	}).map((c) => `${indent + "  "}${c}`).join("\n")}\n${indent}}`;
	assertExhaustive$2(node);
}
var JS_IDENTIFIER = /^[$_\p{ID_Start}][$_\u{200c}\u{200d}\p{ID_Continue}]*$/u;
function stringifyObjectPropertyKey(key) {
	return JS_IDENTIFIER.test(key) ? key : JSON.stringify(key);
}
function stringifyObjectProperty([key, value, computed]) {
	return `${computed ? `[${stringifyExpression(key)}]` : stringifyObjectPropertyKey(key)}: ${stringifyExpression(value)}`;
}
function stringifyExpression(node) {
	if (typeof node === "string") return node;
	if (typeof node === "boolean") return `${node}`;
	if (node[0] === NODE$1.identifier) return node[1];
	if (node[0] === NODE$1.booleanLiteral) return `${node[1]}`;
	if (node[0] === NODE$1.numericLiteral) return node[1];
	if (node[0] === NODE$1.stringLiteral) return JSON.stringify(node[1]);
	if (node[0] === NODE$1.arrayExpr) return `[${node[1].map((n) => stringifyExpression(n)).join(", ")}]`;
	if (node[0] === NODE$1.binaryExpr) return `${wrapIfComplex(node[1])} ${node[2]} ${wrapIfComplex(node[3])}`;
	if (node[0] === NODE$1.assignmentExpr) return `${stringifyExpression(node[1])} ${node[2]} ${stringifyExpression(node[3])}`;
	if (node[0] === NODE$1.logicalExpr) return `${wrapIfComplex(node[1])} ${node[2]} ${wrapIfComplex(node[3])}`;
	if (node[0] === NODE$1.unaryExpr) {
		const sep = node[1].length > 1 ? " " : "";
		return `${node[1]}${sep}${wrapIfComplex(node[2])}`;
	}
	if (node[0] === NODE$1.call) return `${wrapIfComplex(node[1])}(${node[2].map((n) => stringifyExpression(n)).join(", ")})`;
	if (node[0] === NODE$1.memberAccess) {
		if (Array.isArray(node[1]) && node[1][0] === NODE$1.numericLiteral) return `(${stringifyExpression(node[1])}).${stringifyExpression(node[2])}`;
		return `${wrapIfComplex(node[1])}.${stringifyExpression(node[2])}`;
	}
	if (node[0] === NODE$1.indexAccess) return `${wrapIfComplex(node[1])}[${stringifyExpression(node[2])}]`;
	if (node[0] === NODE$1.preUpdate) return `${node[1]}${wrapIfComplex(node[2])}`;
	if (node[0] === NODE$1.postUpdate) return `${wrapIfComplex(node[2])}${node[1]}`;
	if (node[0] === NODE$1.objectExpr) {
		if (Array.isArray(node[1])) return `{ ${node[1].map(stringifyObjectProperty).join(", ")} }`;
		return `{ ${Object.entries(node[1]).map(([key, val]) => `${stringifyObjectPropertyKey(key)}: ${stringifyExpression(val)}`).join(", ")} }`;
	}
	if (node[0] === NODE$1.conditionalExpr) return `${wrapIfComplex(node[1])} ? ${wrapIfComplex(node[2])} : ${wrapIfComplex(node[3])}`;
	if (node[0] === NODE$1.nullLiteral) return "null";
	assertExhaustive$2(node);
}
function assertExhaustive$2(value) {
	throw new Error(`'${JSON.stringify(value)}' was not handled by the stringify function.`);
}
function isExpression(node) {
	if (typeof node === "string" || typeof node === "boolean" || node[0] === NODE$1.identifier || node[0] === NODE$1.booleanLiteral || node[0] === NODE$1.numericLiteral || node[0] === NODE$1.stringLiteral || node[0] === NODE$1.arrayExpr || node[0] === NODE$1.binaryExpr || node[0] === NODE$1.assignmentExpr || node[0] === NODE$1.logicalExpr || node[0] === NODE$1.unaryExpr || node[0] === NODE$1.call || node[0] === NODE$1.memberAccess || node[0] === NODE$1.indexAccess || node[0] === NODE$1.preUpdate || node[0] === NODE$1.postUpdate || node[0] === NODE$1.objectExpr || node[0] === NODE$1.conditionalExpr || node[0] === NODE$1.nullLiteral) return true;
	return false;
}
var SIMPLE_NODES = [
	NODE$1.memberAccess,
	NODE$1.indexAccess,
	NODE$1.call,
	NODE$1.arrayExpr,
	NODE$1.stringLiteral,
	NODE$1.numericLiteral,
	NODE$1.identifier,
	NODE$1.booleanLiteral
];
/**
* Stringifies expression, and wraps it in parentheses if they cannot be trivially omitted
*/
function wrapIfComplex(node) {
	const s = stringifyExpression(node);
	if (typeof node === "string" || typeof node === "boolean") return s;
	if (SIMPLE_NODES.includes(node[0])) return s;
	return `(${s})`;
}
//#endregion
//#region src/errors.ts
var prefix = "Invariant failed";
/**
* Inspired by: https://github.com/alexreardon/tiny-invariant/blob/master/src/tiny-invariant.ts
*/
function invariant(condition, message) {
	if (condition) return;
	throw new Error(prefix);
}
/**
* An error that happens during resolution of WGSL code.
* Contains a trace of all ancestor resolvables in
* which this error originated.
*
* @category Errors
*/
var ResolutionError = class ResolutionError extends Error {
	cause;
	trace;
	constructor(cause, trace) {
		let entries = trace.map((ancestor) => `- ${hasTinyestMetadata(ancestor) ? `fn*:${getName(ancestor)}` : ancestor}`);
		if (entries.length > 20) entries = [
			...entries.slice(0, 11),
			"...",
			...entries.slice(-10)
		];
		super(`Resolution of the following tree failed:\n${entries.join("\n")}: ${cause && typeof cause === "object" && "message" in cause ? cause.message : cause}`);
		this.cause = cause;
		this.trace = trace;
		Object.setPrototypeOf(this, ResolutionError.prototype);
	}
	appendToTrace(ancestor) {
		const newTrace = [ancestor, ...this.trace];
		return new ResolutionError(this.cause, newTrace);
	}
};
/**
* An error that happens during execution of TypeGPU functions.
* Contains a trace of all TypeGPU functions called along the way.
*
* @category Errors
*/
var ExecutionError = class ExecutionError extends Error {
	cause;
	trace;
	constructor(cause, trace) {
		let entries = trace.map((ancestor) => `- ${ancestor}`);
		if (entries.length > 20) entries = [
			...entries.slice(0, 11),
			"...",
			...entries.slice(-10)
		];
		super(`Execution of the following tree failed:\n${entries.join("\n")}: ${cause && typeof cause === "object" && "message" in cause ? cause.message : cause}`);
		this.cause = cause;
		this.trace = trace;
		Object.setPrototypeOf(this, ExecutionError.prototype);
	}
	appendToTrace(ancestor) {
		const newTrace = [ancestor, ...this.trace];
		return new ExecutionError(this.cause, newTrace);
	}
};
/**
* @category Errors
*/
var MissingSlotValueError = class MissingSlotValueError extends Error {
	slot;
	constructor(slot) {
		super(`Missing value for '${slot}'`);
		this.slot = slot;
		Object.setPrototypeOf(this, MissingSlotValueError.prototype);
	}
};
/**
* @category Errors
*/
var NotUniformError = class NotUniformError extends Error {
	constructor(value) {
		super(`Buffer '${getName(value) ?? "<unnamed>"}' is not bindable as a uniform. Use .$usage('uniform') to allow it.`);
		Object.setPrototypeOf(this, NotUniformError.prototype);
	}
};
var MissingBindGroupsError = class MissingBindGroupsError extends Error {
	constructor(layouts) {
		super(`Missing bind groups for layouts: '${[...layouts].map((layout) => getName(layout) ?? "<unnamed>").join(", ")}'. Please provide it using pipeline.with(bindGroup).(...)`);
		Object.setPrototypeOf(this, MissingBindGroupsError.prototype);
	}
};
var MissingVertexBuffersError = class MissingVertexBuffersError extends Error {
	constructor(layouts) {
		super(`Missing vertex buffers for layouts: '${[...layouts].map((layout) => getName(layout) ?? "<unnamed>").join(", ")}'. Please provide it using pipeline.with(layout, buffer).(...)`);
		Object.setPrototypeOf(this, MissingVertexBuffersError.prototype);
	}
};
var MissingImmediatesError = class MissingImmediatesError extends Error {
	constructor(name) {
		super(`Missing value for immediate variable '${name ?? "<unnamed>"}'. Please provide it using pipeline.with(immediate, value), pass.setImmediates(immediate, value), or give the variable a default value`);
		Object.setPrototypeOf(this, MissingImmediatesError.prototype);
	}
};
var IllegalVarAccessError = class IllegalVarAccessError extends Error {
	constructor(msg) {
		super(msg);
		Object.setPrototypeOf(this, IllegalVarAccessError.prototype);
	}
};
var IllegalBufferAccessError = class IllegalBufferAccessError extends Error {
	constructor(msg) {
		super(msg);
		Object.setPrototypeOf(this, IllegalBufferAccessError.prototype);
	}
};
var WgslTypeError = class WgslTypeError extends Error {
	constructor(msg) {
		super(msg);
		Object.setPrototypeOf(this, WgslTypeError.prototype);
	}
};
var WgslForbiddenStatementError = class WgslForbiddenStatementError extends Error {
	constructor(node) {
		super(`Expression statements like '${stringifyNode(node)};' are forbidden in WGSL. Remove the statement, or use the result in code (for example, assign it to a variable).`);
		Object.setPrototypeOf(this, WgslForbiddenStatementError.prototype);
	}
};
var SignatureNotSupportedError = class SignatureNotSupportedError extends Error {
	constructor(actual, candidates) {
		super(`Unsupported data types: ${actual.map((a) => a.type).join(", ")}. Supported types are: ${candidates.map((r) => r.type).join(", ")}.`);
		Object.setPrototypeOf(this, SignatureNotSupportedError.prototype);
	}
};
var FiniteMathAssumptionError = class FiniteMathAssumptionError extends Error {
	constructor(value, type) {
		super(`Cannot convert value '${value}' to type ${type.type} because of the Finite Math Assumption (see: https://www.w3.org/TR/WGSL/#finite-math-assumption)`);
		Object.setPrototypeOf(this, FiniteMathAssumptionError.prototype);
	}
};
//#endregion
//#region src/shared/utilityTypes.ts
function assertExhaustive$1(x, location) {
	throw new Error(`Failed to handle ${x} at ${location}`);
}
//#endregion
//#region src/tgsl/accessStructProp.ts
/**
* This function is separate from `accessProp` to avoid a circular dependency.
*/
function accessStructProp(target, propName) {
	invariant(isWgslStruct(target.dataType) || isUnstruct(target.dataType), "Expected snippet type to be struct/unstruct.");
	let propType = target.dataType.propTypes[propName];
	if (!propType) return;
	propType = undecorate(propType);
	return snip(stitch`${target}.${propName}`, propType, target.origin, target.possibleSideEffects);
}
//#endregion
//#region src/tgsl/stringifySnippet.ts
/**
* The JS expression that first produced a given snippet.
* Snippets can be shared (e.g. every reference to a variable returns the same snippet),
* so only the first, most specific node is remembered.
*/
var sourceNodes = /* @__PURE__ */ new WeakMap();
function setSourceNode(snippet, node) {
	if (!sourceNodes.has(snippet)) sourceNodes.set(snippet, node);
	return snippet;
}
function getSourceNode(snippet) {
	return sourceNodes.get(snippet);
}
/**
* Describes a snippet in a human-readable way, meant to be used in error messages.
* Prefers the JS expression that produced the snippet, falling back to its value.
*/
function stringifySnippet(snippet) {
	const node = getSourceNode(snippet);
	return node !== void 0 ? stringifyNode(node) : String(snippet.value);
}
//#endregion
//#region src/tgsl/conversion.ts
var INFINITE_RANK = {
	rank: Number.POSITIVE_INFINITY,
	action: "none"
};
function getAutoConversionRank(src, dest) {
	const trueSrc = undecorate(src);
	const trueDst = undecorate(dest);
	if (trueSrc.type === trueDst.type) {
		if (trueSrc.type === "struct" && trueSrc !== trueDst) return {
			rank: 1,
			action: "cast",
			targetType: dest
		};
		return {
			rank: 0,
			action: "none"
		};
	}
	if (trueSrc.type === "abstractFloat") {
		if (trueDst.type === "f32") return {
			rank: 1,
			action: "none"
		};
		if (trueDst.type === "f16") return {
			rank: 2,
			action: "none"
		};
	}
	if (trueSrc.type === "abstractInt") {
		if (trueDst.type === "i32") return {
			rank: 3,
			action: "none"
		};
		if (trueDst.type === "u32") return {
			rank: 4,
			action: "none"
		};
		if (trueDst.type === "abstractFloat") return {
			rank: 5,
			action: "none"
		};
		if (trueDst.type === "f32") return {
			rank: 6,
			action: "none"
		};
		if (trueDst.type === "f16") return {
			rank: 7,
			action: "none"
		};
	}
	if (isVec(trueSrc) && isVec(trueDst) && trueSrc.type[3] === trueDst.type[3]) return getAutoConversionRank(trueSrc.primitive, trueDst.primitive);
	if (isMat(trueSrc) && isMat(trueDst) && trueSrc.type[3] === trueDst.type[3]) return {
		rank: 0,
		action: "none"
	};
	return INFINITE_RANK;
}
function getImplicitConversionRank(src, dest) {
	const trueSrc = undecorate(src);
	const trueDst = undecorate(dest);
	if (isPtr(trueSrc) && trueSrc.implicit && getAutoConversionRank(trueSrc.inner, trueDst).rank < Number.POSITIVE_INFINITY) return {
		rank: 0,
		action: "deref"
	};
	if (isPtr(trueDst) && getAutoConversionRank(trueSrc, trueDst.inner).rank < Number.POSITIVE_INFINITY) return {
		rank: 1,
		action: "ref"
	};
	const primitivePreference = {
		f32: 0,
		f16: 1,
		i32: 2,
		u32: 3,
		bool: 4
	};
	if (trueSrc.type in primitivePreference && trueDst.type in primitivePreference) {
		const srcType = trueSrc.type;
		const destType = trueDst.type;
		if (srcType !== destType) {
			const srcPref = primitivePreference[srcType];
			return {
				rank: primitivePreference[destType] < srcPref ? 10 : 20,
				action: "cast",
				targetType: trueDst
			};
		}
	}
	if ((trueSrc.type === "u32" || trueSrc.type === "i32") && trueDst.type === "abstractFloat") return {
		rank: 1,
		action: "cast",
		targetType: trueDst.concretized
	};
	if (trueSrc.type === "abstractFloat") {
		if (trueDst.type === "i32") return {
			rank: 2,
			action: "cast",
			targetType: trueDst
		};
		if (trueDst.type === "u32") return {
			rank: 3,
			action: "cast",
			targetType: trueDst
		};
	}
	return INFINITE_RANK;
}
function getConversionRank(src, dest, allowImplicit) {
	const autoRank = getAutoConversionRank(src, dest);
	if (autoRank.rank < Number.POSITIVE_INFINITY) return autoRank;
	if (allowImplicit) return getImplicitConversionRank(src, dest);
	return INFINITE_RANK;
}
function findBestType(types, uniqueTypes, allowImplicit) {
	let bestResult;
	for (const targetType of uniqueTypes) {
		/**
		* The type we end up converting to. Will be different than `targetType` if `targetType === abstractFloat`
		*/
		let destType = targetType;
		const details = [];
		let sum = 0;
		for (const sourceType of types) {
			const conversion = getConversionRank(sourceType, targetType, allowImplicit);
			sum += conversion.rank;
			if (conversion.rank === Number.POSITIVE_INFINITY) break;
			details.push(conversion);
			if (conversion.action === "cast") destType = conversion.targetType;
		}
		if (sum < (bestResult?.sum ?? Number.POSITIVE_INFINITY)) bestResult = {
			type: destType,
			details,
			sum
		};
	}
	if (!bestResult) return;
	const actions = bestResult.details.map((detail, index) => ({
		sourceIndex: index,
		action: detail.action,
		...detail.action === "cast" && { targetType: detail.targetType }
	}));
	return {
		targetType: bestResult.type,
		actions,
		hasImplicitConversions: actions.some((action) => action.action === "cast")
	};
}
function getBestConversion(types, targetTypes) {
	if (types.length === 0) return void 0;
	const uniqueTargetTypes = [...new Set((targetTypes || types).map(undecorate))];
	const explicitResult = findBestType(types, uniqueTargetTypes, false);
	if (explicitResult) return explicitResult;
	const implicitResult = findBestType(types, uniqueTargetTypes, true);
	if (implicitResult) return implicitResult;
}
function applyActionToSnippet(ctx, snippet, action, targetType) {
	if (action.action === "none") {
		if (targetType === snippet.dataType) return snippet;
		return withDataType(targetType, snippet);
	}
	switch (action.action) {
		case "ref": return snip(new RefOperator(snippet, targetType), targetType, snippet.origin, snippet.possibleSideEffects);
		case "deref": return derefSnippet(snippet);
		case "cast":
			if (isWgslStruct(snippet.dataType) && isWgslStruct(targetType)) {
				const typeName = getName(snippet.dataType) ?? "<unnamed>";
				const targetName = getName(targetType) ?? "<unnamed>";
				if (snippet.possibleSideEffects) throw new Error(`Cannot resolve struct cast from '${typeName}' to '${targetName}'. Store the value to a variable first, then cast it.`);
				const propSnips = Object.entries(targetType.propTypes).map(([key, dataType]) => {
					const accessedProp = accessStructProp(snippet, key);
					if (!accessedProp) throw new Error(`Cannot auto-convert struct '${typeName}' to '${targetName}' because the property '${key}' is missing.`);
					const converted = convertToCommonType(ctx, [accessedProp], [dataType]);
					if (!converted || !converted[0]) throw new Error(`Cannot auto-convert struct '${typeName}' to '${targetName}' because type '${getName(accessedProp.dataType) ?? "<unnamed>"}' is not convertible to '${getName(undecorate(dataType)) ?? "<unnamed>"}'.`);
					return converted[0];
				});
				const targetSnippet = ctx.resolve(targetType).value;
				return snip(`${targetSnippet}(${propSnips.map((snip) => snip.value).join(", ")})`, targetType, "runtime", false);
			}
			return schemaCallWrapperGPU(ctx, targetType, snippet);
		default: assertExhaustive$1(action.action, "applyActionToSnippet");
	}
}
/**
* Unifies input types to a common type.
* Ties between equally good `restrictTo` candidates go to the one listed first.
*/
function unify(inTypes, restrictTo) {
	if (inTypes.some((type) => type === UnknownData)) return;
	const conversion = getBestConversion(inTypes, restrictTo);
	if (!conversion) return;
	return inTypes.map((type) => isVec(type) || isMat(type) ? type : conversion.targetType);
}
/**
* Unifies input types to a common type.
* Unlike `unify`, it does not allow implicit conversions.
* Ties between equally good `restrictTo` candidates go to the one listed first.
*/
function unifyStrict(inTypes, restrictTo) {
	if (inTypes.some((type) => type === UnknownData)) return;
	const conversion = findBestType(inTypes, [...new Set((restrictTo || inTypes).map(undecorate))], false);
	if (!conversion) return;
	return inTypes.map((type) => isVec(type) || isMat(type) ? type : conversion.targetType);
}
function convertToCommonType(ctx, values, restrictTo, verbose = true) {
	const types = values.map((value) => value.dataType);
	if (types.some((type) => type === UnknownData)) return;
	invariant(!(Array.isArray(restrictTo) && restrictTo.length === 0), "Internal error, expected 'restrictTo' to not be an empty array.");
	const conversion = getBestConversion(types, restrictTo);
	if (!conversion) return;
	if (verbose && conversion.hasImplicitConversions) logger.warn("implicit-conversion", `Implicit conversions from [\n${values.map((v) => `  ${stringifySnippet(v)}: ${safeStringify(v.dataType)}`).join(",\n")}\n] to ${conversion.targetType.type} are supported, but not recommended.
Consider using explicit conversions instead.`);
	return values.map((value, index) => {
		const action = conversion.actions[index];
		invariant(action, "Action should not be undefined");
		return applyActionToSnippet(ctx, value, action, conversion.targetType);
	});
}
function tryConvertSnippet(ctx, snippet, targetDataTypes, verbose = true) {
	const targets = Array.isArray(targetDataTypes) ? targetDataTypes : [targetDataTypes];
	const { value, dataType, origin, possibleSideEffects } = snippet;
	if (targets.length === 1) {
		const target = targets[0];
		if (target === dataType) return snip(value, target, origin, possibleSideEffects);
		if (dataType === UnknownData) return ctx.resolveSnippet(snip(value, target, origin, possibleSideEffects));
	}
	const converted = convertToCommonType(ctx, [snippet], targets, verbose);
	if (converted) return converted[0];
	throw new WgslTypeError(`Cannot convert '${stringifySnippet(snippet)}' of type '${String(dataType)}' to any of the target types: [${targets.map((t) => t.type).join(", ")}]`);
}
function convertStructValues(ctx, structType, values) {
	return Object.entries(structType.propTypes).map(([key, targetType]) => {
		const val = values[key];
		if (!val) throw new Error(`Missing property ${key}`);
		return convertToCommonType(ctx, [val], [targetType])?.[0] ?? val;
	});
}
//#endregion
//#region src/core/function/createCallableSchema.ts
function callableSchema(options) {
	const impl = ((...args) => {
		return options.normalImpl(...args);
	});
	setName(impl, options.name);
	impl.toString = () => options.name;
	impl[$gpuCallable] = {
		get strictSignature() {},
		call(ctx, args) {
			const argTypes = options.argTypes(...args.map((s) => {
				if (isPtr(s.dataType) && s.dataType.implicit) return s.dataType.inner;
				return s.dataType;
			}));
			const converted = args.map((s, idx) => {
				const argType = argTypes[idx];
				if (!argType) throw new Error("Function called with invalid arguments");
				return tryConvertSnippet(ctx, s, argType, false);
			});
			let result;
			const comptimeArgs = converted.map((s) => asComptime(s));
			if (comptimeArgs.every((s) => s !== void 0)) {
				ctx.pushMode(new NormalState());
				try {
					result = snip(options.normalImpl(...comptimeArgs.map((s) => s.value)), options.schema(), "constant");
				} finally {
					ctx.popMode("normal");
				}
			} else result = options.codegenImpl(ctx, converted);
			if (!args.some((a) => a.possibleSideEffects)) return noSideEffects(result);
			return result;
		}
	};
	return impl;
}
//#endregion
//#region src/data/numeric.ts
var boolCast = callableSchema({
	name: "bool",
	schema: () => bool,
	argTypes: (arg) => arg ? [arg] : [],
	normalImpl(v = false) {
		if (typeof v === "boolean") return v;
		if (typeof v === "number") {
			if (!Number.isFinite(v)) throw new FiniteMathAssumptionError(v, bool);
			return Boolean(v);
		}
		throw new Error(`Invalid argument type for 'd.bool'. Got '${typeof v}', expected number or boolean`);
	},
	codegenImpl: (ctx, [v]) => {
		if (v === void 0) return ctx.gen.typeInstantiation(bool, []);
		if (isBool$1(v.dataType) || isSnippetNumeric(v)) return ctx.gen.typeInstantiation(bool, [v]);
		if (v.dataType === UnknownData) throw new WgslTypeError("Unknown argument type for 'd.bool'.");
		throw new SignatureNotSupportedError([v.dataType], [
			bool,
			u32,
			i32,
			f32,
			f16
		]);
	}
});
/**
* A schema that represents a boolean value. (equivalent to `bool` in WGSL)
*
* Can also be called to cast a value to a bool in accordance with WGSL casting rules.
*
* @example
* const value = bool(); // false
* @example
* const value = bool(0); // false
* @example
* const value = bool(-0); // false
* @example
* const value = bool(21.37); // true
*/
var bool = Object.assign(boolCast, {
	[$internal]: {},
	type: "bool"
});
var u32Cast = callableSchema({
	name: "u32",
	schema: () => u32,
	argTypes: (arg) => arg ? [arg] : [],
	normalImpl(v) {
		if (v === void 0) return 0;
		if (typeof v === "boolean") return v ? 1 : 0;
		if (!Number.isFinite(v)) throw new FiniteMathAssumptionError(v, u32);
		if (!Number.isInteger(v)) {
			const truncated = Math.trunc(v);
			if (truncated < 0) return 0;
			if (truncated > 4294967295) return 4294967295;
			return truncated;
		}
		return (v & 4294967295) >>> 0;
	},
	codegenImpl: (ctx, [v]) => ctx.gen.typeInstantiation(u32, v ? [v] : [])
});
/**
* A schema that represents an unsigned 32-bit integer value. (equivalent to `u32` in WGSL)
*
* Can also be called to cast a value to an u32 in accordance with WGSL casting rules.
*
* @example
* const value = u32(); // 0
* @example
* const value = u32(7); // 7
* @example
* const value = u32(3.14); // 3
* @example
* const value = u32(-1); // 4294967295
* @example
* const value = u32(-3.1); // 0
*/
var u32 = Object.assign(u32Cast, {
	[$internal]: {},
	type: "u32"
});
var i32Cast = callableSchema({
	name: "i32",
	schema: () => i32,
	argTypes: (arg) => arg ? [arg] : [],
	normalImpl(v) {
		if (v === void 0) return 0;
		if (typeof v === "boolean") return v ? 1 : 0;
		if (!Number.isFinite(v)) throw new FiniteMathAssumptionError(v, i32);
		return v | 0;
	},
	codegenImpl: (ctx, [v]) => ctx.gen.typeInstantiation(i32, v ? [v] : [])
});
/**
* A schema that represents a signed 32-bit integer value. (equivalent to `i32` in WGSL)
*
* Can also be called to cast a value to an i32 in accordance with WGSL casting rules.
*
* @example
* const value = i32(); // 0
* @example
* const value = i32(3.14); // 3
* @example
* const value = i32(-3.9); // -3
* @example
* const value = i32(10000000000) // 1410065408
*/
var i32 = Object.assign(i32Cast, {
	[$internal]: {},
	type: "i32"
});
var f32Cast = callableSchema({
	name: "f32",
	schema: () => f32,
	argTypes: (arg) => arg ? [arg] : [],
	normalImpl(v) {
		if (v === void 0) return 0;
		if (typeof v === "boolean") return v ? 1 : 0;
		if (!Number.isFinite(v)) throw new FiniteMathAssumptionError(v, f32);
		return Math.fround(v);
	},
	codegenImpl: (ctx, [v]) => ctx.gen.typeInstantiation(f32, v ? [v] : [])
});
/**
* A schema that represents a 32-bit float value. (equivalent to `f32` in WGSL)
*
* Can also be called to cast a value to an f32.
*
* @example
* const value = f32(); // 0
* @example
* const value = f32(1.23); // 1.23
* @example
* const value = f32(true); // 1
*/
var f32 = Object.assign(f32Cast, {
	[$internal]: {},
	type: "f32"
});
var buf32$1 = /* @__PURE__ */ new ArrayBuffer(4);
var f32arr$1 = new Float32Array(buf32$1);
var u32arr$1 = new Uint32Array(buf32$1);
/**
* Convert a JavaScript number (treated as float32) to **binary16** bit pattern.
* @param x 32-bit floating-point value
* @returns 16-bit half-precision encoding (stored in a JS number)
*/
function toHalfBits(x) {
	f32arr$1[0] = x;
	const bits = u32arr$1[0];
	const sign = bits >>> 31 & 1;
	let exp = bits >>> 23 & 255;
	const mant = bits & 8388607;
	if (exp === 255) return sign << 15 | 31744 | (mant ? 512 : 0);
	exp = exp - 127 + 15;
	if (exp <= 0) {
		if (exp < -10) return sign << 15;
		const full = mant | 8388608;
		const shift = 14 - exp;
		const roundBit = full >>> shift - 1 & 1;
		const sticky = full & (1 << shift - 1) - 1 ? 1 : 0;
		let half = full >>> shift;
		if (roundBit & (sticky | half & 1)) half += 1;
		return sign << 15 | half;
	}
	if (exp >= 31) return sign << 15 | 31744;
	const roundBit = mant >>> 12 & 1;
	const sticky = mant & 4095 ? 1 : 0;
	let half = mant >>> 13;
	if (roundBit & (sticky | half & 1)) half += 1;
	if (half === 1024) {
		half = 0;
		++exp;
		if (exp >= 31) return sign << 15 | 31744;
	}
	return sign << 15 | exp << 10 | half;
}
/**
* Convert a **binary16** encoded bit pattern back to JavaScript number.
* @param h 16-bit half-precision bits
* @returns JavaScript number (64-bit float) with same numerical value
*/
function fromHalfBits(h) {
	const sign = h & 32768 ? -1 : 1;
	const exp = h >> 10 & 31;
	const mant = h & 1023;
	if (exp === 0) return mant ? sign * mant * 2 ** -24 : sign * 0;
	if (exp === 31) return mant ? NaN : sign === 1 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY;
	return sign * (1 + mant / 1024) * 2 ** (exp - 15);
}
function roundToF16(x) {
	return fromHalfBits(toHalfBits(x));
}
var f16Cast = callableSchema({
	name: "f16",
	schema: () => f16,
	argTypes: (arg) => arg ? [arg] : [],
	normalImpl(v) {
		if (v === void 0) return 0;
		if (typeof v === "boolean") return v ? 1 : 0;
		if (!Number.isFinite(v)) throw new FiniteMathAssumptionError(v, f16);
		return roundToF16(v);
	},
	codegenImpl: (ctx, [v]) => ctx.gen.typeInstantiation(f16, v ? [v] : [])
});
/**
* A schema that represents a 16-bit float value. (equivalent to `f16` in WGSL)
*
* Can also be called to cast a value to an f16.
*
* @example
* const value = f16(); // 0
* @example
* const value = f32(1.23); // 1.23
* @example
* const value = f16(true); // 1
* @example
* const value = f16(21877.5); // 21872
*/
var f16 = Object.assign(f16Cast, {
	[$internal]: {},
	type: "f16"
});
var abstractInt = {
	[$internal]: {},
	type: "abstractInt",
	toString() {
		return "abstractInt";
	},
	concretized: i32
};
var abstractFloat = {
	[$internal]: {},
	type: "abstractFloat",
	toString() {
		return "abstractFloat";
	},
	concretized: f32
};
//#endregion
//#region src/tgsl/generationHelpers.ts
function numericLiteralToSnippet(value) {
	if (value >= 2 ** 63 || value < -(2 ** 63)) return snip(value, abstractFloat, "constant", false);
	if (Number.isInteger(value)) {
		if (!Number.isSafeInteger(value)) logger.warn("precision-loss", `The integer ${value} exceeds the safe integer range and may have lost precision.`);
		return snip(value, abstractInt, "constant", false);
	}
	return snip(value, abstractFloat, "constant", false);
}
function concretize(type) {
	if (type.type === "abstractFloat") return f32;
	if (type.type === "abstractInt") return i32;
	return type;
}
function concretizeSnippet(snippet) {
	return withDataType(concretize(snippet.dataType), snippet);
}
function coerceToSnippet(value) {
	if (isSnippet(value)) return value;
	if (isRef(value)) throw new Error("Cannot use refs (d.ref(...)) from the outer scope.");
	const ownSnippet = getOwnSnippet(value);
	if (ownSnippet) return ownSnippet;
	if (isVecInstance(value) || isMatInstance(value)) return snip(value, WORKAROUND_getSchema(value), "constant", false);
	if (typeof value === "number") return numericLiteralToSnippet(value);
	if (typeof value === "boolean") return snip(value, bool, "constant", false);
	return snip(value, UnknownData, "constant", false);
}
/**
* Intermediate representation for WGSL array expressions.
* Defers resolution. Stores array elements as snippets so the
* generator can access them when needed.
*/
var ArrayExpression = class {
	[$internal] = true;
	type;
	elements;
	constructor(type, elements) {
		this.type = type;
		this.elements = elements;
	}
	toString() {
		return "ArrayExpression";
	}
	[$comptimeValueOf]() {
		const values = [];
		for (const elem of this.elements) {
			const known = asComptime(elem);
			if (!known) return { comptime: false };
			values.push(known.value);
		}
		return {
			comptime: true,
			value: values
		};
	}
	[$resolve](ctx) {
		for (const elem of this.elements) if (isStoredInMemory(elem) && !isNaturallyEphemeral(elem.dataType)) {
			const snippetStr = stringifySnippet(elem);
			const snippetType = ctx.resolve(concretize(elem.dataType)).value;
			throw new WgslTypeError(`'${snippetStr}' reference cannot be used in an array constructor.\n-----\nTry '${snippetType}(${snippetStr})' or 'arrayOf(${snippetType}, count)([...])' to copy the value instead.\n-----`);
		}
		return ctx.gen.typeInstantiation(this.type, this.elements);
	}
};
//#endregion
//#region src/data/ptr.ts
function ptrFn(inner) {
	return INTERNAL_createPtr("function", inner, "read-write");
}
function INTERNAL_createPtr(addressSpace, inner, access, implicit = false) {
	return {
		[$internal]: {},
		type: "ptr",
		addressSpace,
		inner,
		access,
		implicit,
		toString: () => `ptr<${addressSpace}, ${inner}, ${access}>`
	};
}
function createPtrFromOrigin(origin, innerDataType) {
	const ptrParams = originToPtrParams[origin];
	if (ptrParams) return INTERNAL_createPtr(ptrParams.space, innerDataType, ptrParams.access);
}
function implicitFrom(ptr) {
	return INTERNAL_createPtr(ptr.addressSpace, ptr.inner, ptr.access, true);
}
function explicitFrom(ptr) {
	return INTERNAL_createPtr(ptr.addressSpace, ptr.inner, ptr.access, false);
}
//#endregion
//#region src/data/ref.ts
var _ref = (() => {
	const impl = ((value) => INTERNAL_createRef(value));
	setName(impl, "ref");
	impl.toString = () => "ref";
	impl[$internal] = true;
	impl[$gpuCallable] = { call(ctx, [value]) {
		if (value.origin === "argument") throw new WgslTypeError(`d.ref(${stringifySnippet(value)}) is illegal, cannot take a reference of an argument. Copy the value first, and take a reference of the copy.`);
		if (value.origin === "constant-immutable-def" || value.origin === "runtime-immutable-def") {
			const typeStr = ctx.resolve(value.dataType).value;
			throw new WgslTypeError(`d.ref(${stringifySnippet(value)}) is illegal, cannot take a reference to a constant.
-----
- Try 'd.ref(${typeStr}(${stringifySnippet(value)}));' instead to create a new referencable value.
-----`);
		}
		if (isStoredInMemory(value) && isNaturallyEphemeral(value.dataType)) {
			const typeStr = ctx.resolve(value.dataType).value;
			throw new WgslTypeError(`d.ref(${stringifySnippet(value)}) is illegal, cannot take a reference to a scalar value.
-----
- Try 'd.ref(${typeStr}(${stringifySnippet(value)}));' instead to create a new referencable scalar.
-----`);
		}
		if (isPtr(value.dataType)) return withDataType(explicitFrom(value.dataType), value);
		if (value.dataType === UnknownData || isVoid(value.dataType)) throw new WgslTypeError(`d.ref(${stringifySnippet(value)}) is illegal, cannot determine the WGSL type of '${stringifySnippet(value)}'.`);
		/**
		* The value is addressable only if the ref was created from a reference (buttery-butter).
		*
		* @example
		* ```ts
		* const life = ref(42); // created from a value, has to be stored in a variable
		* const boid = ref(layout.$.boids[0]); // created from a reference
		* ```
		*/
		const ptrType = createPtrFromOrigin(value.origin, value.dataType) ?? ptrFn(concretize(value.dataType));
		return snip(new RefOperator(value, ptrType), ptrType, "runtime", value.possibleSideEffects);
	} };
	return impl;
})();
function isRef(value) {
	return value?.[$internal]?.type === "ref";
}
function INTERNAL_createRef(value) {
	const target = {
		[$internal]: { type: "ref" },
		get $() {
			return value;
		},
		set $(newValue) {
			if (newValue && typeof newValue === "object") for (const key of Object.keys(newValue)) value[key] = newValue[key];
			else value = newValue;
		}
	};
	if (value === void 0 || value === null) throw new Error("Cannot create a ref from undefined or null");
	if (typeof value === "object") return new Proxy(target, {
		get(target, prop) {
			if (prop in target) return target[prop];
			return value[prop];
		},
		set(_target, prop, propValue) {
			if (prop === $internal) return false;
			if (prop === "$") return Reflect.set(target, prop, propValue);
			return Reflect.set(value, prop, propValue);
		}
	});
	return target;
}
/**
* The result of calling `d.ref(...)`. The code responsible for
* generating shader code can check if the value of a snippet is
* an instance of `RefOperator`, and act accordingly.
*/
var RefOperator = class {
	[$internal];
	snippet;
	ptrType;
	constructor(snippet, ptrType) {
		this[$internal] = true;
		this.snippet = snippet;
		this.ptrType = ptrType;
	}
	/**
	* Whether `snippet` refers to an existing value in memory. If not (e.g. `d.ref(42)`),
	* the ref has to be stored in a variable (`const life = d.ref(42)`) before it can be used.
	*/
	get addressable() {
		return isAddressableOrigin(this.snippet.origin);
	}
	get [$ownSnippet]() {
		return snip(this, this.ptrType, this.snippet.origin, this.snippet.possibleSideEffects);
	}
	toString() {
		return `d.ref(${stringifySnippet(this.snippet)})`;
	}
	[$comptimeValueOf]() {
		return { comptime: false };
	}
	[$resolve]() {
		if (!this.addressable) {
			const valueStr = stringifySnippet(this.snippet);
			throw new WgslTypeError(`d.ref(${valueStr}) has to be stored in a variable before use, since '${valueStr}' is not an existing value that can be referenced.
-----
- Try 'const ref = d.ref(${valueStr});', and use 'ref' instead.
-----`);
		}
		return snip(stitch`(&${this.snippet})`, this.ptrType, this.snippet.origin, this.snippet.possibleSideEffects);
	}
};
function derefSnippet(snippet) {
	if (!isPtr(snippet.dataType)) return snippet;
	const innerType = snippet.dataType.inner;
	if (snippet.value instanceof RefOperator) {
		const inner = snippet.value.snippet;
		return snip(stitch`${inner}`, innerType, inner.origin, snippet.possibleSideEffects);
	}
	return snip(stitch`(*${snippet})`, innerType, snippet.origin, snippet.possibleSideEffects);
}
//#endregion
//#region src/data/vectorImpl.ts
var XYZW = [
	"x",
	"y",
	"z",
	"w"
];
var RGBA = [
	"r",
	"g",
	"b",
	"a"
];
var VecBase = class VecBase extends Array {
	static {
		for (let e0 = 0; e0 < 4; e0++) for (let e1 = 0; e1 < 4; e1++) for (let e2 = 0; e2 < 4; e2++) for (let e3 = 0; e3 < 4; e3++) {
			const xyzwProp = `${XYZW[e0]}${XYZW[e1]}${XYZW[e2]}${XYZW[e3]}`;
			const rgbaProp = `${RGBA[e0]}${RGBA[e1]}${RGBA[e2]}${RGBA[e3]}`;
			Object.defineProperty(VecBase.prototype, xyzwProp, { get() {
				return new this._Vec4(this[e0], this[e1], this[e2], this[e3]);
			} });
			Object.defineProperty(VecBase.prototype, rgbaProp, { get() {
				return new this._Vec4(this[e0], this[e1], this[e2], this[e3]);
			} });
		}
		for (let e0 = 0; e0 < 4; e0++) for (let e1 = 0; e1 < 4; e1++) for (let e2 = 0; e2 < 4; e2++) {
			const xyzwProp = `${XYZW[e0]}${XYZW[e1]}${XYZW[e2]}`;
			const rgbaProp = `${RGBA[e0]}${RGBA[e1]}${RGBA[e2]}`;
			Object.defineProperty(VecBase.prototype, xyzwProp, { get() {
				return new this._Vec3(this[e0], this[e1], this[e2]);
			} });
			Object.defineProperty(VecBase.prototype, rgbaProp, { get() {
				return new this._Vec3(this[e0], this[e1], this[e2]);
			} });
		}
		for (let e0 = 0; e0 < 4; e0++) for (let e1 = 0; e1 < 4; e1++) {
			const xyzwProp = `${XYZW[e0]}${XYZW[e1]}`;
			const rgbaProp = `${RGBA[e0]}${RGBA[e1]}`;
			Object.defineProperty(VecBase.prototype, xyzwProp, { get() {
				return new this._Vec2(this[e0], this[e1]);
			} });
			Object.defineProperty(VecBase.prototype, rgbaProp, { get() {
				return new this._Vec2(this[e0], this[e1]);
			} });
		}
	}
	castElement() {
		return this[$internal].elementSchema;
	}
	[$resolve](ctx) {
		const vecSchema = WORKAROUND_getSchema(this);
		if (this.every((e) => !e)) return ctx.gen.typeInstantiation(vecSchema, []);
		if (this.every((e) => this[0] === e)) return ctx.gen.typeInstantiation(vecSchema, [numericLiteralToSnippet(this[0])]);
		return ctx.gen.typeInstantiation(vecSchema, this.map((e) => numericLiteralToSnippet(e)));
	}
	toString() {
		return `${this.kind}(${this.join(", ")})`;
	}
};
var Vec2 = class extends VecBase {
	e0;
	e1;
	constructor(x, y) {
		super(2);
		this.e0 = this.castElement()(x);
		this.e1 = this.castElement()(y ?? x);
	}
	get 0() {
		return this.e0;
	}
	get 1() {
		return this.e1;
	}
	set 0(value) {
		this.e0 = this.castElement()(value);
	}
	set 1(value) {
		this.e1 = this.castElement()(value);
	}
	get x() {
		return this[0];
	}
	get y() {
		return this[1];
	}
	set x(value) {
		this[0] = this.castElement()(value);
	}
	set y(value) {
		this[1] = this.castElement()(value);
	}
	get r() {
		return this[0];
	}
	get g() {
		return this[1];
	}
	set r(value) {
		this[0] = this.castElement()(value);
	}
	set g(value) {
		this[1] = this.castElement()(value);
	}
};
var Vec3 = class extends VecBase {
	e0;
	e1;
	e2;
	constructor(x, y, z) {
		super(3);
		this.e0 = this.castElement()(x);
		this.e1 = this.castElement()(y ?? x);
		this.e2 = this.castElement()(z ?? x);
	}
	get 0() {
		return this.e0;
	}
	get 1() {
		return this.e1;
	}
	get 2() {
		return this.e2;
	}
	set 0(value) {
		this.e0 = this.castElement()(value);
	}
	set 1(value) {
		this.e1 = this.castElement()(value);
	}
	set 2(value) {
		this.e2 = this.castElement()(value);
	}
	get x() {
		return this[0];
	}
	get y() {
		return this[1];
	}
	get z() {
		return this[2];
	}
	set x(value) {
		this[0] = this.castElement()(value);
	}
	set y(value) {
		this[1] = this.castElement()(value);
	}
	set z(value) {
		this[2] = this.castElement()(value);
	}
	get r() {
		return this[0];
	}
	get g() {
		return this[1];
	}
	get b() {
		return this[2];
	}
	set r(value) {
		this[0] = this.castElement()(value);
	}
	set g(value) {
		this[1] = this.castElement()(value);
	}
	set b(value) {
		this[2] = this.castElement()(value);
	}
};
var Vec4 = class extends VecBase {
	e0;
	e1;
	e2;
	e3;
	constructor(x, y, z, w) {
		super(4);
		this.e0 = this.castElement()(x);
		this.e1 = this.castElement()(y ?? x);
		this.e2 = this.castElement()(z ?? x);
		this.e3 = this.castElement()(w ?? x);
	}
	get 0() {
		return this.e0;
	}
	get 1() {
		return this.e1;
	}
	get 2() {
		return this.e2;
	}
	get 3() {
		return this.e3;
	}
	set 0(value) {
		this.e0 = this.castElement()(value);
	}
	set 1(value) {
		this.e1 = this.castElement()(value);
	}
	set 2(value) {
		this.e2 = this.castElement()(value);
	}
	set 3(value) {
		this.e3 = this.castElement()(value);
	}
	get x() {
		return this[0];
	}
	get y() {
		return this[1];
	}
	get z() {
		return this[2];
	}
	get w() {
		return this[3];
	}
	set x(value) {
		this[0] = value;
	}
	set y(value) {
		this[1] = value;
	}
	set z(value) {
		this[2] = value;
	}
	set w(value) {
		this[3] = value;
	}
	get r() {
		return this[0];
	}
	get g() {
		return this[1];
	}
	get b() {
		return this[2];
	}
	get a() {
		return this[3];
	}
	set r(value) {
		this[0] = value;
	}
	set g(value) {
		this[1] = value;
	}
	set b(value) {
		this[2] = value;
	}
	set a(value) {
		this[3] = value;
	}
};
var Vec2fImpl = class Vec2fImpl extends Vec2 {
	get [$internal]() {
		return { elementSchema: f32 };
	}
	get kind() {
		return "vec2f";
	}
	get _Vec2() {
		return Vec2fImpl;
	}
	get _Vec3() {
		return Vec3fImpl;
	}
	get _Vec4() {
		return Vec4fImpl;
	}
};
var Vec2hImpl = class Vec2hImpl extends Vec2 {
	get [$internal]() {
		return { elementSchema: f16 };
	}
	get kind() {
		return "vec2h";
	}
	get _Vec2() {
		return Vec2hImpl;
	}
	get _Vec3() {
		return Vec3hImpl;
	}
	get _Vec4() {
		return Vec4hImpl;
	}
};
var Vec2iImpl = class Vec2iImpl extends Vec2 {
	get [$internal]() {
		return { elementSchema: i32 };
	}
	get kind() {
		return "vec2i";
	}
	get _Vec2() {
		return Vec2iImpl;
	}
	get _Vec3() {
		return Vec3iImpl;
	}
	get _Vec4() {
		return Vec4iImpl;
	}
};
var Vec2uImpl = class Vec2uImpl extends Vec2 {
	get [$internal]() {
		return { elementSchema: u32 };
	}
	get kind() {
		return "vec2u";
	}
	get _Vec2() {
		return Vec2uImpl;
	}
	get _Vec3() {
		return Vec3uImpl;
	}
	get _Vec4() {
		return Vec4uImpl;
	}
};
var Vec2bImpl = class Vec2bImpl extends Vec2 {
	get [$internal]() {
		return { elementSchema: bool };
	}
	get kind() {
		return "vec2<bool>";
	}
	get _Vec2() {
		return Vec2bImpl;
	}
	get _Vec3() {
		return Vec3bImpl;
	}
	get _Vec4() {
		return Vec4bImpl;
	}
};
var Vec3fImpl = class Vec3fImpl extends Vec3 {
	get [$internal]() {
		return { elementSchema: f32 };
	}
	get kind() {
		return "vec3f";
	}
	get _Vec2() {
		return Vec2fImpl;
	}
	get _Vec3() {
		return Vec3fImpl;
	}
	get _Vec4() {
		return Vec4fImpl;
	}
};
var Vec3hImpl = class Vec3hImpl extends Vec3 {
	get [$internal]() {
		return { elementSchema: f16 };
	}
	get kind() {
		return "vec3h";
	}
	get _Vec2() {
		return Vec2hImpl;
	}
	get _Vec3() {
		return Vec3hImpl;
	}
	get _Vec4() {
		return Vec4hImpl;
	}
};
var Vec3iImpl = class Vec3iImpl extends Vec3 {
	get [$internal]() {
		return { elementSchema: i32 };
	}
	get kind() {
		return "vec3i";
	}
	get _Vec2() {
		return Vec2iImpl;
	}
	get _Vec3() {
		return Vec3iImpl;
	}
	get _Vec4() {
		return Vec4iImpl;
	}
};
var Vec3uImpl = class Vec3uImpl extends Vec3 {
	get [$internal]() {
		return { elementSchema: u32 };
	}
	get kind() {
		return "vec3u";
	}
	get _Vec2() {
		return Vec2uImpl;
	}
	get _Vec3() {
		return Vec3uImpl;
	}
	get _Vec4() {
		return Vec4uImpl;
	}
};
var Vec3bImpl = class Vec3bImpl extends Vec3 {
	get [$internal]() {
		return { elementSchema: bool };
	}
	get kind() {
		return "vec3<bool>";
	}
	get _Vec2() {
		return Vec2bImpl;
	}
	get _Vec3() {
		return Vec3bImpl;
	}
	get _Vec4() {
		return Vec4bImpl;
	}
};
var Vec4fImpl = class Vec4fImpl extends Vec4 {
	get [$internal]() {
		return { elementSchema: f32 };
	}
	get kind() {
		return "vec4f";
	}
	get _Vec2() {
		return Vec2fImpl;
	}
	get _Vec3() {
		return Vec3fImpl;
	}
	get _Vec4() {
		return Vec4fImpl;
	}
};
var Vec4hImpl = class Vec4hImpl extends Vec4 {
	get [$internal]() {
		return { elementSchema: f16 };
	}
	get kind() {
		return "vec4h";
	}
	get _Vec2() {
		return Vec2hImpl;
	}
	get _Vec3() {
		return Vec3hImpl;
	}
	get _Vec4() {
		return Vec4hImpl;
	}
};
var Vec4iImpl = class Vec4iImpl extends Vec4 {
	get [$internal]() {
		return { elementSchema: i32 };
	}
	get kind() {
		return "vec4i";
	}
	get _Vec2() {
		return Vec2iImpl;
	}
	get _Vec3() {
		return Vec3iImpl;
	}
	get _Vec4() {
		return Vec4iImpl;
	}
};
var Vec4uImpl = class Vec4uImpl extends Vec4 {
	get [$internal]() {
		return { elementSchema: u32 };
	}
	get kind() {
		return "vec4u";
	}
	get _Vec2() {
		return Vec2uImpl;
	}
	get _Vec3() {
		return Vec3uImpl;
	}
	get _Vec4() {
		return Vec4uImpl;
	}
};
var Vec4bImpl = class Vec4bImpl extends Vec4 {
	get [$internal]() {
		return { elementSchema: bool };
	}
	get kind() {
		return "vec4<bool>";
	}
	get _Vec2() {
		return Vec2bImpl;
	}
	get _Vec3() {
		return Vec3bImpl;
	}
	get _Vec4() {
		return Vec4bImpl;
	}
};
//#endregion
//#region src/data/vector.ts
/**
* Schema representing vec2f - a vector with 2 elements of type f32.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec2f(); // (0.0, 0.0)
* const vector = d.vec2f(1); // (1.0, 1.0)
* const vector = d.vec2f(0.5, 0.1); // (0.5, 0.1)
*
* @example
* const buffer = root.createBuffer(d.vec2f, d.vec2f(0, 1)); // buffer holding a d.vec2f value, with an initial value of vec2f(0, 1);
*/
var vec2f$1 = makeVecSchema(Vec2fImpl, f32);
/**
* Schema representing vec2h - a vector with 2 elements of type f16.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec2h(); // (0.0, 0.0)
* const vector = d.vec2h(1); // (1.0, 1.0)
* const vector = d.vec2h(0.5, 0.1); // (0.5, 0.1)
*
* @example
* const buffer = root.createBuffer(d.vec2h, d.vec2h(0, 1)); // buffer holding a d.vec2h value, with an initial value of vec2h(0, 1);
*/
var vec2h$1 = makeVecSchema(Vec2hImpl, f16);
/**
* Schema representing vec2i - a vector with 2 elements of type i32.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec2i(); // (0, 0)
* const vector = d.vec2i(1); // (1, 1)
* const vector = d.vec2i(-1, 1); // (-1, 1)
*
* @example
* const buffer = root.createBuffer(d.vec2i, d.vec2i(0, 1)); // buffer holding a d.vec2i value, with an initial value of vec2i(0, 1);
*/
var vec2i$1 = makeVecSchema(Vec2iImpl, i32);
/**
* Schema representing vec2u - a vector with 2 elements of type u32.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec2u(); // (0, 0)
* const vector = d.vec2u(1); // (1, 1)
* const vector = d.vec2u(1, 2); // (1, 2)
*
* @example
* const buffer = root.createBuffer(d.vec2u, d.vec2u(0, 1)); // buffer holding a d.vec2u value, with an initial value of vec2u(0, 1);
*/
var vec2u$1 = makeVecSchema(Vec2uImpl, u32);
/**
* Schema representing `vec2<bool>` - a vector with 2 elements of type `bool`.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec2b(); // (false, false)
* const vector = d.vec2b(true); // (true, true)
* const vector = d.vec2b(false, true); // (false, true)
*/
var vec2b$1 = makeVecSchema(Vec2bImpl, bool);
/**
* Schema representing vec3f - a vector with 3 elements of type f32.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec3f(); // (0.0, 0.0, 0.0)
* const vector = d.vec3f(1); // (1.0, 1.0, 1.0)
* const vector = d.vec3f(1, 2, 3.5); // (1.0, 2.0, 3.5)
*
* @example
* const buffer = root.createBuffer(d.vec3f, d.vec3f(0, 1, 2)); // buffer holding a d.vec3f value, with an initial value of vec3f(0, 1, 2);
*/
var vec3f$1 = makeVecSchema(Vec3fImpl, f32);
/**
* Schema representing vec3h - a vector with 3 elements of type f16.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec3h(); // (0.0, 0.0, 0.0)
* const vector = d.vec3h(1); // (1.0, 1.0, 1.0)
* const vector = d.vec3h(1, 2, 3.5); // (1.0, 2.0, 3.5)
*
* @example
* const buffer = root.createBuffer(d.vec3h, d.vec3h(0, 1, 2)); // buffer holding a d.vec3h value, with an initial value of vec3h(0, 1, 2);
*/
var vec3h$1 = makeVecSchema(Vec3hImpl, f16);
/**
* Schema representing vec3i - a vector with 3 elements of type i32.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec3i(); // (0, 0, 0)
* const vector = d.vec3i(1); // (1, 1, 1)
* const vector = d.vec3i(1, 2, -3); // (1, 2, -3)
*
* @example
* const buffer = root.createBuffer(d.vec3i, d.vec3i(0, 1, 2)); // buffer holding a d.vec3i value, with an initial value of vec3i(0, 1, 2);
*/
var vec3i$1 = makeVecSchema(Vec3iImpl, i32);
/**
* Schema representing vec3u - a vector with 3 elements of type u32.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec3u(); // (0, 0, 0)
* const vector = d.vec3u(1); // (1, 1, 1)
* const vector = d.vec3u(1, 2, 3); // (1, 2, 3)
*
* @example
* const buffer = root.createBuffer(d.vec3u, d.vec3u(0, 1, 2)); // buffer holding a d.vec3u value, with an initial value of vec3u(0, 1, 2);
*/
var vec3u$1 = makeVecSchema(Vec3uImpl, u32);
/**
* Schema representing `vec3<bool>` - a vector with 3 elements of type `bool`.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec3b(); // (false, false, false)
* const vector = d.vec3b(true); // (true, true, true)
* const vector = d.vec3b(false, true, false); // (false, true, false)
*/
var vec3b$1 = makeVecSchema(Vec3bImpl, bool);
/**
* Schema representing vec4f - a vector with 4 elements of type f32.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec4f(); // (0.0, 0.0, 0.0, 0.0)
* const vector = d.vec4f(1); // (1.0, 1.0, 1.0, 1.0)
* const vector = d.vec4f(1, 2, 3, 4.5); // (1.0, 2.0, 3.0, 4.5)
*
* @example
* const buffer = root.createBuffer(d.vec4f, d.vec4f(0, 1, 2, 3)); // buffer holding a d.vec4f value, with an initial value of vec4f(0, 1, 2, 3);
*/
var vec4f$1 = makeVecSchema(Vec4fImpl, f32);
/**
* Schema representing vec4h - a vector with 4 elements of type f16.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec4h(); // (0.0, 0.0, 0.0, 0.0)
* const vector = d.vec4h(1); // (1.0, 1.0, 1.0, 1.0)
* const vector = d.vec4h(1, 2, 3, 4.5); // (1.0, 2.0, 3.0, 4.5)
*
* @example
* const buffer = root.createBuffer(d.vec4h, d.vec4h(0, 1, 2, 3)); // buffer holding a d.vec4h value, with an initial value of vec4h(0, 1, 2, 3);
*/
var vec4h$1 = makeVecSchema(Vec4hImpl, f16);
/**
* Schema representing vec4i - a vector with 4 elements of type i32.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec4i(); // (0, 0, 0, 0)
* const vector = d.vec4i(1); // (1, 1, 1, 1)
* const vector = d.vec4i(1, 2, 3, -4); // (1, 2, 3, -4)
*
* @example
* const buffer = root.createBuffer(d.vec4i, d.vec4i(0, 1, 2, 3)); // buffer holding a d.vec4i value, with an initial value of vec4i(0, 1, 2, 3);
*/
var vec4i$1 = makeVecSchema(Vec4iImpl, i32);
/**
* Schema representing vec4u - a vector with 4 elements of type u32.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec4u(); // (0, 0, 0, 0)
* const vector = d.vec4u(1); // (1, 1, 1, 1)
* const vector = d.vec4u(1, 2, 3, 4); // (1, 2, 3, 4)
*
* @example
* const buffer = root.createBuffer(d.vec4u, d.vec4u(0, 1, 2, 3)); // buffer holding a d.vec4u value, with an initial value of vec4u(0, 1, 2, 3);
*/
var vec4u$1 = makeVecSchema(Vec4uImpl, u32);
/**
* Schema representing `vec4<bool>` - a vector with 4 elements of type `bool`.
* Also a constructor function for this vector value.
*
* @example
* const vector = d.vec4b(); // (false, false, false, false)
* const vector = d.vec4b(true); // (true, true, true, true)
* const vector = d.vec4b(false, true, false, true); // (false, true, false, true)
*/
var vec4b$1 = makeVecSchema(Vec4bImpl, bool);
var vecTypeToConstructor = {
	vec2f: vec2f$1,
	vec2h: vec2h$1,
	vec2i: vec2i$1,
	vec2u: vec2u$1,
	"vec2<bool>": vec2b$1,
	vec3f: vec3f$1,
	vec3h: vec3h$1,
	vec3i: vec3i$1,
	vec3u: vec3u$1,
	"vec3<bool>": vec3b$1,
	vec4f: vec4f$1,
	vec4h: vec4h$1,
	vec4i: vec4i$1,
	vec4u: vec4u$1,
	"vec4<bool>": vec4b$1
};
function makeVecSchema(VecImpl, primitive) {
	const { kind: type, length } = new VecImpl();
	const componentCount = length;
	const cpuConstruct = (...args) => {
		const values = Array.from({ length: args.length });
		let j = 0;
		for (const arg of args) if (typeof arg === "number" || typeof arg === "boolean") values[j++] = arg;
		else for (let c = 0; c < arg.length; ++c) values[j++] = arg[c];
		if (values.length <= 1 || values.length === componentCount) return new VecImpl(...values);
		throw new Error(`'${type}' constructor called with invalid number of arguments.`);
	};
	const construct = callableSchema({
		name: type,
		schema: () => schema,
		argTypes: (...args) => args.map((arg) => isVec(arg) ? arg : primitive),
		normalImpl: cpuConstruct,
		codegenImpl: (ctx, args) => ctx.gen.typeInstantiation(schema, args)
	});
	const schema = Object.assign(construct, {
		[$internal]: {},
		type,
		primitive,
		componentCount,
		[$repr]: void 0
	});
	VecImpl.prototype.schema = schema;
	return schema;
}
//#endregion
//#region src/data/vertexFormatData.ts
var TgpuVertexFormatDataImpl = class {
	[$internal] = {};
	type;
	[$gpuCallable];
	constructor(type) {
		this.type = type;
		this[$gpuCallable] = { call: (ctx, [v]) => {
			return schemaCallWrapperGPU(ctx, formatToWGSLType[this.type], v);
		} };
	}
	[$cast](v) {
		return schemaCallWrapper(formatToWGSLType[this.type], v);
	}
};
var formatToWGSLType = {
	uint8: u32,
	uint8x2: vec2u$1,
	uint8x4: vec4u$1,
	sint8: i32,
	sint8x2: vec2i$1,
	sint8x4: vec4i$1,
	unorm8: f32,
	unorm8x2: vec2f$1,
	unorm8x4: vec4f$1,
	snorm8: f32,
	snorm8x2: vec2f$1,
	snorm8x4: vec4f$1,
	uint16: u32,
	uint16x2: vec2u$1,
	uint16x4: vec4u$1,
	sint16: i32,
	sint16x2: vec2i$1,
	sint16x4: vec4i$1,
	unorm16: f32,
	unorm16x2: vec2f$1,
	unorm16x4: vec4f$1,
	snorm16: f32,
	snorm16x2: vec2f$1,
	snorm16x4: vec4f$1,
	float16: f32,
	float16x2: vec2f$1,
	float16x4: vec4f$1,
	float32: f32,
	float32x2: vec2f$1,
	float32x3: vec3f$1,
	float32x4: vec4f$1,
	uint32: u32,
	uint32x2: vec2u$1,
	uint32x3: vec3u$1,
	uint32x4: vec4u$1,
	sint32: i32,
	sint32x2: vec2i$1,
	sint32x3: vec3i$1,
	sint32x4: vec4i$1,
	"unorm10-10-10-2": vec4f$1,
	"unorm8x4-bgra": vec4f$1
};
var packedFormats = new Set(Object.keys(formatToWGSLType));
new TgpuVertexFormatDataImpl("uint8");
new TgpuVertexFormatDataImpl("uint8x2");
new TgpuVertexFormatDataImpl("uint8x4");
new TgpuVertexFormatDataImpl("sint8");
new TgpuVertexFormatDataImpl("sint8x2");
new TgpuVertexFormatDataImpl("sint8x4");
new TgpuVertexFormatDataImpl("unorm8");
new TgpuVertexFormatDataImpl("unorm8x2");
new TgpuVertexFormatDataImpl("unorm8x4");
new TgpuVertexFormatDataImpl("snorm8");
new TgpuVertexFormatDataImpl("snorm8x2");
new TgpuVertexFormatDataImpl("snorm8x4");
new TgpuVertexFormatDataImpl("uint16");
new TgpuVertexFormatDataImpl("uint16x2");
new TgpuVertexFormatDataImpl("uint16x4");
new TgpuVertexFormatDataImpl("sint16");
new TgpuVertexFormatDataImpl("sint16x2");
new TgpuVertexFormatDataImpl("sint16x4");
new TgpuVertexFormatDataImpl("unorm16");
new TgpuVertexFormatDataImpl("unorm16x2");
new TgpuVertexFormatDataImpl("unorm16x4");
new TgpuVertexFormatDataImpl("snorm16");
new TgpuVertexFormatDataImpl("snorm16x2");
new TgpuVertexFormatDataImpl("snorm16x4");
new TgpuVertexFormatDataImpl("float16");
new TgpuVertexFormatDataImpl("float16x2");
new TgpuVertexFormatDataImpl("float16x4");
new TgpuVertexFormatDataImpl("float32");
new TgpuVertexFormatDataImpl("float32x2");
new TgpuVertexFormatDataImpl("float32x3");
new TgpuVertexFormatDataImpl("float32x4");
new TgpuVertexFormatDataImpl("uint32");
new TgpuVertexFormatDataImpl("uint32x2");
new TgpuVertexFormatDataImpl("uint32x3");
new TgpuVertexFormatDataImpl("uint32x4");
new TgpuVertexFormatDataImpl("sint32");
new TgpuVertexFormatDataImpl("sint32x2");
new TgpuVertexFormatDataImpl("sint32x3");
new TgpuVertexFormatDataImpl("sint32x4");
new TgpuVertexFormatDataImpl("unorm10-10-10-2");
new TgpuVertexFormatDataImpl("unorm8x4-bgra");
function isPackedData(value) {
	return isMarkedInternal(value) && packedFormats.has(value?.type);
}
//#endregion
//#region src/data/alignmentOf.ts
var knownAlignmentMap = {
	f32: 4,
	f16: 2,
	i32: 4,
	u32: 4,
	bool: 4,
	u16: 2,
	vec2f: 8,
	vec2h: 4,
	vec2i: 8,
	vec2u: 8,
	"vec2<bool>": 8,
	vec3f: 16,
	vec3h: 8,
	vec3i: 16,
	vec3u: 16,
	"vec3<bool>": 16,
	vec4f: 16,
	vec4h: 8,
	vec4i: 16,
	vec4u: 16,
	"vec4<bool>": 16,
	mat2x2f: 8,
	mat3x3f: 16,
	mat4x4f: 16,
	atomic: 4
};
function computeAlignment(data) {
	const dataType = data?.type;
	const knownAlignment = knownAlignmentMap[dataType];
	if (knownAlignment !== void 0) return knownAlignment;
	if (isWgslStruct(data)) return Object.values(data.propTypes).map(alignmentOf).reduce((a, b) => a > b ? a : b);
	if (isWgslArray(data)) return alignmentOf(data.elementType);
	if (isUnstruct(data)) {
		const firstProp = Object.values(data.propTypes)[0];
		return firstProp ? getCustomAlignment(firstProp) ?? 1 : 1;
	}
	if (isDisarray(data)) return getCustomAlignment(data.elementType) ?? 1;
	if (isDecorated(data) || isLooseDecorated(data)) return getCustomAlignment(data) ?? alignmentOf(data.inner);
	if (packedFormats.has(dataType)) return 1;
	throw new Error(`Cannot determine alignment of data: ${safeStringify(data)}`);
}
function computeCustomAlignment(data) {
	if (isUnstruct(data)) {
		const firstProp = Object.values(data.propTypes)[0];
		return firstProp ? customAlignmentOf(firstProp) : 1;
	}
	if (isDisarray(data)) return customAlignmentOf(data.elementType);
	if (isLooseDecorated(data)) return getCustomAlignment(data) ?? customAlignmentOf(data.inner);
	return getCustomAlignment(data) ?? 1;
}
/**
* Since alignments can be inferred from data types, they are not stored on them.
* Instead, this weak map acts as an extended property of those data types.
*/
var cachedAlignments = /* @__PURE__ */ new WeakMap();
var cachedCustomAlignments = /* @__PURE__ */ new WeakMap();
function alignmentOf(data) {
	let alignment = cachedAlignments.get(data);
	if (alignment === void 0) {
		alignment = computeAlignment(data);
		cachedAlignments.set(data, alignment);
	}
	return alignment;
}
function customAlignmentOf(data) {
	let alignment = cachedCustomAlignments.get(data);
	if (alignment === void 0) {
		alignment = computeCustomAlignment(data);
		cachedCustomAlignments.set(data, alignment);
	}
	return alignment;
}
//#endregion
//#region src/mathUtils.ts
/**
* @param value
* @param modulo has to be power of 2
*/
var roundUp = (value, modulo) => {
	const bitMask = modulo - 1;
	const invBitMask = ~bitMask;
	return (value & bitMask) === 0 ? value : (value & invBitMask) + modulo;
};
//#endregion
//#region src/data/schemaMemoryLayout.ts
var knownSizesMap = {
	bool: 4,
	f32: 4,
	f16: 2,
	i32: 4,
	u32: 4,
	u16: 2,
	vec2f: 8,
	vec2h: 4,
	vec2i: 8,
	vec2u: 8,
	"vec2<bool>": 8,
	vec3f: 12,
	vec3h: 6,
	vec3i: 12,
	vec3u: 12,
	"vec3<bool>": 12,
	vec4f: 16,
	vec4h: 8,
	vec4i: 16,
	vec4u: 16,
	"vec4<bool>": 16,
	mat2x2f: 16,
	mat3x3f: 48,
	mat4x4f: 64,
	uint8: 1,
	uint8x2: 2,
	uint8x4: 4,
	sint8: 1,
	sint8x2: 2,
	sint8x4: 4,
	unorm8: 1,
	unorm8x2: 2,
	unorm8x4: 4,
	snorm8: 1,
	snorm8x2: 2,
	snorm8x4: 4,
	uint16: 2,
	uint16x2: 4,
	uint16x4: 8,
	sint16: 2,
	sint16x2: 4,
	sint16x4: 8,
	unorm16: 2,
	unorm16x2: 4,
	unorm16x4: 8,
	snorm16: 2,
	snorm16x2: 4,
	snorm16x4: 8,
	float16: 2,
	float16x2: 4,
	float16x4: 8,
	float32: 4,
	float32x2: 8,
	float32x3: 12,
	float32x4: 16,
	uint32: 4,
	uint32x2: 8,
	uint32x3: 12,
	uint32x4: 16,
	sint32: 4,
	sint32x2: 8,
	sint32x3: 12,
	sint32x4: 16,
	"unorm10-10-10-2": 4,
	"unorm8x4-bgra": 4,
	atomic: 4
};
function computeMLOfStruct(struct) {
	let size = 0;
	let longestContiguousPrefix = 0;
	let isContiguous = true;
	let prefixEnd = false;
	for (const property of Object.values(struct.propTypes)) {
		if (Number.isNaN(size)) throw new Error("Only the last property of a struct can be unbounded");
		const prevSize = size;
		size = roundUp(size, alignmentOf(property));
		const hasPadding = prevSize !== size;
		const propLayout = computeMemoryLayout(property);
		size += propLayout.size;
		if (Number.isNaN(size) && property.type !== "array") throw new Error("Cannot nest unbounded struct within another struct");
		if (prefixEnd) continue;
		if (!hasPadding && propLayout.isContiguous) longestContiguousPrefix += propLayout.size;
		else {
			prefixEnd = true;
			isContiguous = false;
			if (!hasPadding) longestContiguousPrefix += propLayout.longestContiguousPrefix;
		}
	}
	const trueSize = roundUp(size, alignmentOf(struct));
	return {
		isContiguous: size === trueSize && isContiguous,
		size: trueSize,
		longestContiguousPrefix
	};
}
function computeMLOfUnstruct(data) {
	let size = 0;
	let longestContiguousPrefix = 0;
	let isContiguous = true;
	let prefixEnd = false;
	for (const property of Object.values(data.propTypes)) {
		const alignment = customAlignmentOf(property);
		const prevSize = size;
		size = roundUp(size, alignment);
		const hasPadding = prevSize !== size;
		if (hasPadding) isContiguous = false;
		const propLayout = computeMemoryLayout(property);
		size += propLayout.size;
		if (prefixEnd) continue;
		if (!hasPadding && propLayout.isContiguous) longestContiguousPrefix += propLayout.size;
		else {
			prefixEnd = true;
			isContiguous = false;
			if (!hasPadding) longestContiguousPrefix += propLayout.longestContiguousPrefix;
		}
	}
	return {
		isContiguous,
		size,
		longestContiguousPrefix
	};
}
function computeMLOfWgslArray(data) {
	const elementType = data.elementType;
	const elementMemoryLayout = computeMemoryLayout(elementType);
	const elementSize = elementMemoryLayout.size;
	const stride = roundUp(elementSize, alignmentOf(elementType));
	const isContiguous = !(stride > elementSize) && elementMemoryLayout.isContiguous;
	const size = data.elementCount === 0 ? NaN : data.elementCount * stride;
	let longestContiguousPrefix;
	if (isContiguous) longestContiguousPrefix = size;
	else longestContiguousPrefix = elementMemoryLayout.longestContiguousPrefix;
	return {
		size,
		isContiguous,
		longestContiguousPrefix
	};
}
function computeMLOfDisarray(data) {
	const elementType = data.elementType;
	const elementMemoryLayout = computeMemoryLayout(elementType);
	const elementSize = elementMemoryLayout.size;
	const stride = roundUp(elementSize, customAlignmentOf(elementType));
	const isContiguous = !(stride > elementSize) && elementMemoryLayout.isContiguous;
	const size = data.elementCount * stride;
	let longestContiguousPrefix;
	if (isContiguous) longestContiguousPrefix = size;
	else longestContiguousPrefix = elementMemoryLayout.longestContiguousPrefix;
	return {
		size,
		isContiguous,
		longestContiguousPrefix
	};
}
function computeMemoryLayout(data) {
	const knownSize = knownSizesMap[data.type];
	if (knownSize !== void 0) return {
		isContiguous: data.type !== "mat3x3f",
		size: knownSize,
		longestContiguousPrefix: data.type === "mat3x3f" ? 12 : knownSize
	};
	if (isWgslStruct(data)) return computeMLOfStruct(data);
	if (isUnstruct(data)) return computeMLOfUnstruct(data);
	if (isWgslArray(data)) return computeMLOfWgslArray(data);
	if (isDisarray(data)) return computeMLOfDisarray(data);
	if (isDecorated(data) || isLooseDecorated(data)) {
		const size = getCustomSize(data);
		const undecoratedLayout = computeMemoryLayout(undecorate(data));
		if (size) return {
			isContiguous: size === undecoratedLayout.size && undecoratedLayout.isContiguous,
			size,
			longestContiguousPrefix: undecoratedLayout.longestContiguousPrefix
		};
		return computeMemoryLayout(data.inner);
	}
	throw new Error(`Cannot determine memory layout of data: ${data}`);
}
/**
* Since memory layout can be inferred from data types, they are not stored on them.
* Instead, this weak map acts as an extended property of those data types.
*/
var cachedLayouts = /* @__PURE__ */ new WeakMap();
function getLayoutInfo(schema, key) {
	let layout = cachedLayouts.get(schema);
	if (layout === void 0) {
		layout = computeMemoryLayout(schema);
		cachedLayouts.set(schema, layout);
	}
	return layout[key];
}
//#endregion
//#region src/data/sizeOf.ts
function sizeOf(schema) {
	return getLayoutInfo(schema, "size");
}
//#endregion
//#region src/data/attributes.ts
function attribute(data, attrib) {
	if (isDecorated(data)) return new DecoratedImpl(data.inner, [attrib, ...data.attribs]);
	if (isLooseDecorated(data)) return new LooseDecoratedImpl(data.inner, [attrib, ...data.attribs]);
	if (isLooseData(data)) return new LooseDecoratedImpl(data, [attrib]);
	return new DecoratedImpl(data, [attrib]);
}
/**
* Assigns an explicit numeric location to a struct member or a parameter that has this type.
*
* @example
* const VertexOutput = {
*   a: d.u32, // has implicit location 0
*   b: d.location(5, d.u32),
*   c: d.u32, // has implicit location 6
* };
*
* @param location The explicit numeric location.
* @param data The data-type to wrap.
*/
function location$1(location, data) {
	return attribute(data, {
		[$internal]: true,
		type: "@location",
		params: [location]
	});
}
function interpolate(interpolationType, data) {
	return attribute(data, {
		[$internal]: true,
		type: "@interpolate",
		params: [interpolationType]
	});
}
function isBuiltin(value) {
	return (isDecorated(value) || isLooseDecorated(value)) && value.attribs.find(isBuiltinAttrib) !== void 0;
}
function getAttributesString(field) {
	if (!isDecorated(field) && !isLooseDecorated(field)) return "";
	return field.attribs.map((attrib) => {
		if (attrib.params.length === 0) return `${attrib.type} `;
		return `${attrib.type}(${attrib.params.join(", ")}) `;
	}).join("");
}
var BaseDecoratedImpl = class {
	[$internal] = {};
	inner;
	attribs;
	constructor(inner, attribs) {
		this.inner = inner;
		this.attribs = attribs;
		const alignAttrib = attribs.find(isAlignAttrib)?.params[0];
		const sizeAttrib = attribs.find(isSizeAttrib)?.params[0];
		if (alignAttrib !== void 0) {
			if (alignAttrib <= 0) throw new Error(`Custom data alignment must be a positive number, got: ${alignAttrib}.`);
			if (Math.log2(alignAttrib) % 1 !== 0) throw new Error(`Alignment has to be a power of 2, got: ${alignAttrib}.`);
			if (isWgslData(this.inner)) {
				if (alignAttrib % alignmentOf(this.inner) !== 0) throw new Error(`Custom alignment has to be a multiple of the standard data alignment. Got: ${alignAttrib}, expected multiple of: ${alignmentOf(this.inner)}.`);
			}
		}
		if (sizeAttrib !== void 0) {
			if (sizeAttrib < sizeOf(this.inner)) throw new Error(`Custom data size cannot be smaller then the standard data size. Got: ${sizeAttrib}, expected at least: ${sizeOf(this.inner)}.`);
			if (sizeAttrib <= 0) throw new Error(`Custom data size must be a positive number. Got: ${sizeAttrib}.`);
		}
	}
};
var DecoratedImpl = class extends BaseDecoratedImpl {
	[$internal] = {};
	type = "decorated";
};
var LooseDecoratedImpl = class extends BaseDecoratedImpl {
	[$internal] = {};
	type = "loose-decorated";
};
//#endregion
//#region src/nameUtils.ts
var bannedTokens = new Set([
	"alias",
	"break",
	"case",
	"const",
	"const_assert",
	"continue",
	"continuing",
	"default",
	"diagnostic",
	"discard",
	"else",
	"enable",
	"false",
	"fn",
	"for",
	"if",
	"let",
	"loop",
	"override",
	"requires",
	"return",
	"struct",
	"switch",
	"true",
	"var",
	"while",
	"NULL",
	"Self",
	"abstract",
	"active",
	"alignas",
	"alignof",
	"as",
	"asm",
	"asm_fragment",
	"async",
	"attribute",
	"auto",
	"await",
	"become",
	"cast",
	"catch",
	"class",
	"co_await",
	"co_return",
	"co_yield",
	"coherent",
	"column_major",
	"common",
	"compile",
	"compile_fragment",
	"concept",
	"const_cast",
	"consteval",
	"constexpr",
	"constinit",
	"crate",
	"debugger",
	"decltype",
	"delete",
	"demote",
	"demote_to_helper",
	"do",
	"dynamic_cast",
	"enum",
	"explicit",
	"export",
	"extends",
	"extern",
	"external",
	"fallthrough",
	"filter",
	"final",
	"finally",
	"friend",
	"from",
	"fxgroup",
	"get",
	"goto",
	"groupshared",
	"highp",
	"impl",
	"implements",
	"import",
	"inline",
	"instanceof",
	"interface",
	"layout",
	"lowp",
	"macro",
	"macro_rules",
	"match",
	"mediump",
	"meta",
	"mod",
	"module",
	"move",
	"mut",
	"mutable",
	"namespace",
	"new",
	"nil",
	"noexcept",
	"noinline",
	"nointerpolation",
	"non_coherent",
	"noncoherent",
	"noperspective",
	"null",
	"nullptr",
	"of",
	"operator",
	"package",
	"packoffset",
	"partition",
	"pass",
	"patch",
	"pixelfragment",
	"precise",
	"precision",
	"premerge",
	"priv",
	"protected",
	"pub",
	"public",
	"readonly",
	"ref",
	"regardless",
	"register",
	"reinterpret_cast",
	"require",
	"resource",
	"restrict",
	"self",
	"set",
	"shared",
	"sizeof",
	"smooth",
	"snorm",
	"static",
	"static_assert",
	"static_cast",
	"std",
	"subroutine",
	"super",
	"target",
	"template",
	"this",
	"thread_local",
	"throw",
	"trait",
	"try",
	"type",
	"typedef",
	"typeid",
	"typename",
	"typeof",
	"union",
	"unless",
	"unorm",
	"unsafe",
	"unsized",
	"use",
	"using",
	"varying",
	"virtual",
	"volatile",
	"wgsl",
	"where",
	"with",
	"writeonly",
	"yield",
	"sampler",
	"uniform",
	"storage"
]);
/**
* Predeclared enumerants that appear as template parameters, e.g. `var<storage, read_write>` or
* `texture_storage_2d<rgba8unorm, write>`. A module-scope or local declaration with one of these names
* would shadow the enumerant, so a template using it would refer to the declaration instead.
* Unlike `bannedTokens`, these remain valid as struct member names, which never shadow anything.
*/
var templateEnumerants = new Set([
	"function",
	"private",
	"workgroup",
	"uniform",
	"storage",
	"immediate",
	"read",
	"write",
	"read_write",
	"rgba8unorm",
	"rgba8snorm",
	"rgba8uint",
	"rgba8sint",
	"rgba16unorm",
	"rgba16snorm",
	"rgba16uint",
	"rgba16sint",
	"rgba16float",
	"rg8unorm",
	"rg8snorm",
	"rg8uint",
	"rg8sint",
	"rg16unorm",
	"rg16snorm",
	"rg16uint",
	"rg16sint",
	"rg16float",
	"r8unorm",
	"r8snorm",
	"r8uint",
	"r8sint",
	"r16unorm",
	"r16snorm",
	"r16uint",
	"r16sint",
	"r16float",
	"r32uint",
	"r32sint",
	"r32float",
	"rg32uint",
	"rg32sint",
	"rg32float",
	"rgba32uint",
	"rgba32sint",
	"rgba32float",
	"bgra8unorm",
	"rgb10a2unorm",
	"rgb10a2uint",
	"rg11b10ufloat"
]);
var builtins = new Set([
	"array",
	"bool",
	"f16",
	"f32",
	"i32",
	"u32",
	"mat2x2",
	"mat2x3",
	"mat2x4",
	"mat3x2",
	"mat3x3",
	"mat3x4",
	"mat4x2",
	"mat4x3",
	"mat4x4",
	"vec2",
	"vec3",
	"vec4",
	"bitcast",
	"all",
	"any",
	"select",
	"arrayLength",
	"abs",
	"acos",
	"acosh",
	"asin",
	"asinh",
	"atan",
	"atanh",
	"atan2",
	"ceil",
	"clamp",
	"cos",
	"cosh",
	"countLeadingZeros",
	"countOneBits",
	"countTrailingZeros",
	"cross",
	"degrees",
	"determinant",
	"distance",
	"dot",
	"dot4U8Packed",
	"dot4I8Packed",
	"exp",
	"exp2",
	"extractBits",
	"faceForward",
	"firstLeadingBit",
	"firstTrailingBit",
	"floor",
	"fma",
	"fract",
	"frexp",
	"insertBits",
	"inverseSqrt",
	"ldexp",
	"length",
	"log",
	"log2",
	"max",
	"min",
	"mix",
	"modf",
	"normalize",
	"pow",
	"quantizeToF16",
	"radians",
	"reflect",
	"refract",
	"reverseBits",
	"round",
	"saturate",
	"sign",
	"sin",
	"sinh",
	"smoothstep",
	"sqrt",
	"step",
	"tan",
	"tanh",
	"transpose",
	"trunc",
	"dpdx",
	"dpdxCoarse",
	"dpdxFine",
	"dpdy",
	"dpdyCoarse",
	"dpdyFine",
	"fwidth",
	"fwidthCoarse",
	"fwidthFine",
	"textureDimensions",
	"textureGather",
	"textureGatherCompare",
	"textureLoad",
	"textureNumLayers",
	"textureNumLevels",
	"textureNumSamples",
	"textureSample",
	"textureSampleBias",
	"textureSampleCompare",
	"textureSampleCompareLevel",
	"textureSampleGrad",
	"textureSampleLevel",
	"textureSampleBaseClampToEdge",
	"textureStore",
	"atomicLoad",
	"atomicStore",
	"atomicAdd",
	"atomicSub",
	"atomicMax",
	"atomicMin",
	"atomicAnd",
	"atomicOr",
	"atomicXor",
	"atomicExchange",
	"atomicCompareExchangeWeak",
	"pack4x8snorm",
	"pack4x8unorm",
	"pack4xI8",
	"pack4xU8",
	"pack4xI8Clamp",
	"pack4xU8Clamp",
	"pack2x16snorm",
	"pack2x16unorm",
	"pack2x16float",
	"unpack4x8snorm",
	"unpack4x8unorm",
	"unpack4xI8",
	"unpack4xU8",
	"unpack2x16snorm",
	"unpack2x16unorm",
	"unpack2x16float",
	"storageBarrier",
	"textureBarrier",
	"workgroupBarrier",
	"workgroupUniformLoad",
	"subgroupAdd",
	"subgroupExclusiveAdd",
	"subgroupInclusiveAdd",
	"subgroupAll",
	"subgroupAnd",
	"subgroupAny",
	"subgroupBallot",
	"subgroupBroadcast",
	"subgroupBroadcastFirst",
	"subgroupElect",
	"subgroupMax",
	"subgroupMin",
	"subgroupMul",
	"subgroupExclusiveMul",
	"subgroupInclusiveMul",
	"subgroupOr",
	"subgroupShuffle",
	"subgroupShuffleDown",
	"subgroupShuffleUp",
	"subgroupShuffleXor",
	"subgroupXor",
	"quadBroadcast",
	"quadSwapDiagonal",
	"quadSwapX",
	"quadSwapY"
]);
/**
* Sanitizes the primer so that it is compliant with WGSL guidelines.
* This primer is not necessarily a valid identifier yet, as it may still collide with other idents or reserved keywords.
*/
/* @__NO_SIDE_EFFECTS__ */
function sanitizePrimer(primer) {
	if (primer) {
		const base = primer.replaceAll(/\s/g, "_").replaceAll(/[^\w]/g, "");
		if (!(/* @__PURE__ */ validateIdentifier(base)).success) return "item";
		return base;
	}
	return "item";
}
/**
* A function for checking whether an identifier is valid.
* If `ident` passes the checks, it is not necessarily a valid identifier yet, as it may still collide with other idents or reserved keywords.
* @example
* validateIdentifier("ident"); // { success: true }
* validateIdentifier("_"); // { success: false, error: `Identifiers cannot be equal to '' or '_'` }
* validateIdentifier("my variable"); // { success: false, error: "Identifiers cannot contain whitespace." }
* validateIdentifier("0"); // { success: false, error: "Identifier is not compliant with the WGSL guideline." }
*/
/* @__NO_SIDE_EFFECTS__ */
function validateIdentifier(ident) {
	if (ident === "_" || ident === "") return {
		success: false,
		error: `Identifiers cannot be equal to '' or '_'`
	};
	if (/\s/.test(ident)) return {
		success: false,
		error: `Identifiers cannot contain whitespace.`
	};
	if (ident.startsWith("__")) return {
		success: false,
		error: `Identifiers cannot start with double underscores.`
	};
	if (!/^(([_\p{XID_Start}][\p{XID_Continue}]+)|([\p{XID_Start}]))$/u.test(ident)) return {
		success: false,
		error: `Not compliant with WGSL guidelines.`
	};
	return { success: true };
}
/**
* Same as `validateIdentifier`, except also checks for bannedToken clashes.
*/
/* @__NO_SIDE_EFFECTS__ */
function validateProp(ident) {
	const identResult = /* @__PURE__ */ validateIdentifier(ident);
	if (!identResult.success) return identResult;
	if (bannedTokens.has(ident)) return {
		success: false,
		error: `Identifiers cannot start with reserved keywords.`
	};
	return { success: true };
}
//#endregion
//#region src/data/struct.ts
/**
* Creates a struct schema that can be used to construct GPU buffers.
* Ensures proper alignment and padding of properties (as opposed to a `d.unstruct` schema).
* The order of members matches the passed in properties object.
*
* @example
* const CircleStruct = d.struct({ radius: d.f32, pos: d.vec3f });
*
* @param props Record with `string` keys and `TgpuData` values,
* each entry describing one struct member.
*/
/* @__NO_SIDE_EFFECTS__ */
function struct(props) {
	if (Object.keys(props).length === 0) throw new Error("Cannot create struct schema with no properties.");
	return INTERNAL_createStruct(props, false);
}
function INTERNAL_createStruct(props, isAbstruct) {
	Object.keys(props).forEach((key) => {
		const result = /* @__PURE__ */ validateProp(key);
		if (!result.success) throw new Error(`Invalid property key '${key}'${result.error ? `: ${result.error}` : ""}`);
	});
	const structSchema = (instanceProps) => Object.fromEntries(Object.entries(props).map(([key, schema]) => [key, schemaCallWrapper(schema, instanceProps?.[key])]));
	Object.setPrototypeOf(structSchema, WgslStructImpl);
	structSchema.propTypes = props;
	Object.defineProperty(structSchema, $internal, { value: { isAbstruct } });
	return structSchema;
}
var WgslStructImpl = {
	type: "struct",
	$name(label) {
		setName(this, label);
		return this;
	},
	toString() {
		return `struct:${getName(this) ?? "<unnamed>"}`;
	}
};
//#endregion
//#region src/core/function/ioSchema.ts
/**
* Assigns locations to members.
* The priority of assigned location is as follows:
* - location already present in member,
* - location provided in `locations`,
* - a free number.
*
* Assumes `locations` are consistent with already decorated `members`,
* throws if a location is repeated.
*/
function withLocations(members, locations = {}, autoInterpolateIntegers = false) {
	let nextLocation = 0;
	const usedCustomLocations = new Set([...Object.values(locations), ...Object.values(members ?? {}).map(getCustomLocation).filter((v) => v !== void 0)]);
	const entries = Object.entries(members ?? {}).map(([key, member]) => {
		return [key, autoInterpolateIntegers ? withFlatInterpolationForInteger(member) : member];
	}).map(([key, member]) => {
		if (isBuiltin(member)) return [key, member];
		if (getCustomLocation(member) !== void 0) return [key, member];
		if (locations[key] !== void 0) return [key, location$1(locations[key], member)];
		while (usedCustomLocations.has(nextLocation)) nextLocation++;
		return [key, location$1(nextLocation++, member)];
	});
	const used = /* @__PURE__ */ new Map();
	entries.forEach(([key, member]) => {
		const location = getCustomLocation(member);
		if (location !== void 0) {
			if (used.has(location)) throw new Error(`Location '${location}' is used by multiple keys: '${used.get(location)}', '${key}'.`);
			used.set(location, key);
		}
	});
	return Object.fromEntries(entries);
}
function separateBuiltins(schema, locations = {}) {
	const positionalArgs = [];
	const dataFields = {};
	for (const [key, type] of Object.entries(schema)) if (isBuiltin(type)) positionalArgs.push({
		schemaKey: key,
		type
	});
	else dataFields[key] = type;
	return {
		dataSchema: Object.keys(dataFields).length > 0 ? INTERNAL_createStruct(withLocations(dataFields, locations), false) : void 0,
		positionalArgs
	};
}
function separateAllAsPositional(schema) {
	const withLocs = withLocations(schema);
	return {
		dataSchema: void 0,
		positionalArgs: Object.entries(withLocs).map(([key, type]) => ({
			schemaKey: key,
			type
		}))
	};
}
function createIoSchema(layout, locations = {}, autoInterpolateIntegers = false) {
	if (isData(layout)) {
		if (isVoid(layout) || isBuiltin(layout)) return layout;
		return getCustomLocation(layout) !== void 0 ? layout : location$1(0, layout);
	}
	return INTERNAL_createStruct(withLocations(layout, locations, autoInterpolateIntegers), false);
}
function needsFlatInterpolation(data) {
	if (isBuiltin(data) || isDecorated(data) && data.attribs.some(isInterpolateAttrib)) return false;
	const inner = isDecorated(data) ? data.inner : data;
	return isInteger(inner) || isIntegerVec(inner);
}
function withFlatInterpolationForInteger(data) {
	return needsFlatInterpolation(data) ? interpolate("flat", data) : data;
}
/**
* WGSL requires integer inter-stage values to be flat interpolated. Interpolation is only
* inferred for shellless entry functions, so shells have to specify it explicitly.
*/
function assertIntegerVaryingsInterpolated(layout, location) {
	if (layout === void 0 || isData(layout)) return;
	for (const [key, member] of Object.entries(layout)) if (needsFlatInterpolation(member)) throw new Error(`Integer value "${key}" in ${location} requires flat interpolation. Wrap its schema in d.interpolate('flat', ...) or d.interpolate('flat, either', ...).`);
}
//#endregion
//#region src/data/autoStruct.ts
/**
* A requirement for the generated struct is that non-builtin properties need to
* have the same name in WGSL as they do in JS. This allows locations to be properly
* matched between the Vertex output and Fragment input.
*/
var AutoStruct = class AutoStruct {
	/**
	* js key -> data type
	*/
	#validProps;
	/**
	* js key -> { prop: 'wgsl key', type: ... }
	* @example '$position' -> { prop: 'position', type: ... }
	*/
	#allocated;
	#usedWgslKeys;
	#locations;
	#cachedStruct;
	#typeForExtraProps;
	#autoInterpolateIntegers;
	static {
		AutoStruct.prototype[$internal] = {};
		AutoStruct.prototype.type = "auto-struct";
	}
	constructor(validProps, typeForExtraProps, locations, autoInterpolateIntegers = false) {
		this.#validProps = validProps;
		this.#typeForExtraProps = typeForExtraProps;
		this.#allocated = {};
		this.#locations = locations;
		this.#autoInterpolateIntegers = autoInterpolateIntegers;
		this.#usedWgslKeys = /* @__PURE__ */ new Set();
	}
	/**
	* Used for accessing builtins, varying and attributes in code.
	*/
	accessProp(key) {
		const dataType = this.#validProps[key] ?? this.#typeForExtraProps;
		if (!dataType) return;
		return this.provideProp(key, dataType);
	}
	/**
	* Used for providing new varyings.
	*
	* @privateRemarks
	* Internally used by `accessProp`.
	*/
	provideProp(key, dataType) {
		let alloc = this.#allocated[key];
		if (!alloc) {
			const wgslKey = key.replaceAll("$", "");
			if (this.#usedWgslKeys.has(wgslKey)) throw new Error(`Property name '${wgslKey}' causes naming clashes. Choose a different name.`);
			const result = /* @__PURE__ */ validateProp(wgslKey);
			if (!result.success) throw new Error(`Invalid property key '${key}'${result.error ? `: ${result.error}` : ""}`);
			this.#usedWgslKeys.add(wgslKey);
			alloc = {
				prop: wgslKey,
				type: dataType
			};
			this.#allocated[key] = alloc;
		}
		return alloc;
	}
	get completeStruct() {
		if (!this.#cachedStruct) {
			this.#cachedStruct = createIoSchema(Object.fromEntries(Object.values(this.#allocated).map((alloc) => {
				return [alloc.prop, alloc.type];
			})), this.#locations, this.#autoInterpolateIntegers);
			const ownName = getName(this);
			if (ownName) setName(this.#cachedStruct, ownName);
		}
		return this.#cachedStruct;
	}
	[$resolve](ctx) {
		return ctx.resolve(this.completeStruct);
	}
	toString() {
		return `auto-struct:${getName(this) ?? "<unnamed>"}`;
	}
};
//#endregion
//#region src/core/function/entryInputRouter.ts
/**
* Routes `(input) => { input.x }` style property access to the correct WGSL
* expression: positional args get a direct snippet, struct fields get
* `structArgName.fieldName`.
*/
var EntryInputRouter = class {
	[$internal] = {};
	type = "entry-input-router";
	structArg;
	/** Maps schemaKey → { WGSL arg name, type } */
	positionalArgsMap;
	constructor(structArg, positionalArgs) {
		this.structArg = structArg;
		this.positionalArgsMap = new Map(positionalArgs.map((a) => [a.schemaKey, a.arg]));
	}
	toString() {
		return "entry-input-router";
	}
	accessProp(propName) {
		const positionalEntry = this.positionalArgsMap.get(propName);
		if (positionalEntry) return positionalEntry();
		const structSnippet = this.structArg?.();
		if (structSnippet && isWgslStruct(structSnippet.dataType)) return {
			target: structSnippet,
			prop: propName
		};
	}
};
//#endregion
//#region src/core/function/dualImpl.ts
var MissingCpuImplError = class extends Error {
	constructor(message) {
		super(message);
		this.name = this.constructor.name;
	}
};
/* @__NO_SIDE_EFFECTS__ */
function dualImpl(options) {
	const impl = ((...args) => {
		if (typeof options.normalImpl === "string") throw new MissingCpuImplError(options.normalImpl);
		return options.normalImpl(...args);
	});
	if (options.name) setName(impl, options.name);
	impl.toString = () => options.name ?? "<unknown>";
	impl[$gpuCallable] = {
		get strictSignature() {
			return typeof options.signature !== "function" ? options.signature : void 0;
		},
		call(ctx, args) {
			const { argTypes, returnType } = typeof options.signature === "function" ? options.signature(...args.map((s) => {
				if (isPtr(s.dataType) && s.dataType.implicit) return s.dataType.inner;
				return s.dataType;
			})) : options.signature;
			const converted = args.map((s, idx) => {
				const argType = argTypes[idx];
				if (!argType) throw new Error("Function called with invalid arguments");
				return tryConvertSnippet(ctx, s, argType, !options.ignoreImplicitCastWarning);
			});
			if (!options.noComptime && typeof options.normalImpl === "function") {
				const comptimeArgs = converted.map((s) => asComptime(s));
				if (comptimeArgs.every((s) => s !== void 0)) {
					ctx.pushMode(new NormalState());
					try {
						return snip(options.normalImpl(...comptimeArgs.map((s) => s.value)), returnType, "constant", options.sideEffects);
					} catch (e) {
						if (!(e instanceof MissingCpuImplError)) throw e;
					} finally {
						ctx.popMode("normal");
					}
				}
			}
			const possibleSideEffects = options.sideEffects || args.some((a) => a.possibleSideEffects);
			const concreteReturnType = concretize(returnType);
			return snip(options.codegenImpl(ctx, converted, concreteReturnType), concreteReturnType, "runtime", possibleSideEffects);
		}
	};
	return impl;
}
//#endregion
//#region src/core/function/comptime.ts
/**
* Creates a version of `func` that can called safely in a TypeGPU function to
* precompute and inject a value into the final shader code.
*
* Note how the function passed into `comptime` doesn't have to be marked with
* 'use gpu'. That's because the function doesn't execute on the GPU, it gets
* executed before the shader code gets sent to the GPU.
*
* @example
* ```ts
* const color = tgpu.comptime((int: number) => {
*   const r = (int >> 16) & 0xff;
*   const g = (int >> 8) & 0xff;
*   const b = int & 0xff;
*   return d.vec3f(r / 255, g / 255, b / 255);
* });
*
* const material = (diffuse: d.v3f): d.v3f => {
*   'use gpu';
*   const albedo = color(0xff00ff);
*   return albedo.mul(diffuse);
* };
* ```
*/
function comptime(func) {
	const impl = ((...args) => {
		return func(...args);
	});
	impl.toString = () => "comptime";
	impl[$getNameForward] = func;
	impl[$gpuCallable] = { call(ctx, args) {
		const comptimeArgs = args.map((s) => asComptime(s));
		if (!comptimeArgs.every((s) => s !== void 0)) throw new WgslTypeError(`Called comptime function with runtime-known values: ${args.filter((_, idx) => comptimeArgs[idx] === void 0).map((s) => `'${stringifySnippet(s)}'`).join(", ")}`);
		ctx.pushMode(new NormalState());
		try {
			return coerceToSnippet(func(...comptimeArgs.map((s) => s.value)));
		} finally {
			ctx.popMode();
		}
	} };
	impl.$name = (label) => {
		setName(func, label);
		return impl;
	};
	Object.defineProperty(impl, $internal, { value: { isComptime: true } });
	return impl;
}
//#endregion
//#region src/data/matrix.ts
var MatBase = class {};
function createMatSchema(options) {
	const construct = callableSchema({
		name: options.type,
		schema: () => schema,
		normalImpl: (...args) => {
			const elements = [];
			for (const arg of args) if (isMatInstance(arg)) for (const column of arg.columns) for (const elem of column) elements.push(elem);
			else if (typeof arg === "number") elements.push(arg);
			else for (let i = 0; i < arg.length; ++i) elements.push(arg[i]);
			if (elements.length !== 0 && elements.length !== options.columns * options.rows) throw new Error(`'${options.type}' constructor called with invalid number of arguments.`);
			for (let i = elements.length; i < options.columns * options.rows; ++i) elements.push(0);
			return new options.MatImpl(...elements);
		},
		argTypes: (...args) => args.map((arg) => isVec(arg) || isMat(arg) ? arg : f32),
		codegenImpl: (ctx, args) => ctx.gen.typeInstantiation(schema, args)
	});
	const schema = Object.assign(construct, {
		[$internal]: {},
		type: options.type,
		primitive: f32,
		identity: identityFunctions[options.columns],
		translation: options.columns === 4 ? translation4 : void 0,
		scaling: options.columns === 4 ? scaling4 : void 0,
		rotationX: options.columns === 4 ? rotationX4 : void 0,
		rotationY: options.columns === 4 ? rotationY4 : void 0,
		rotationZ: options.columns === 4 ? rotationZ4 : void 0
	});
	options.MatImpl.prototype.schema = schema;
	return schema;
}
var VALID_MAT2x2_ELEMENTS = [
	0,
	1,
	2,
	3
];
var mat2x2Impl = class extends MatBase {
	[$internal] = true;
	columns;
	length = 4;
	constructor(...elements) {
		super();
		this.columns = [this.makeColumn(elements[0], elements[1]), this.makeColumn(elements[2], elements[3])];
	}
	get 0() {
		return this.columns[0].x;
	}
	get 1() {
		return this.columns[0].y;
	}
	get 2() {
		return this.columns[1].x;
	}
	get 3() {
		return this.columns[1].y;
	}
	set 0(value) {
		this.columns[0].x = value;
	}
	set 1(value) {
		this.columns[0].y = value;
	}
	set 2(value) {
		this.columns[1].x = value;
	}
	set 3(value) {
		this.columns[1].y = value;
	}
	*[Symbol.iterator]() {
		yield this[0];
		yield this[1];
		yield this[2];
		yield this[3];
	}
	[$resolve](ctx) {
		return ctx.gen.typeInstantiation(mat2x2f$1, VALID_MAT2x2_ELEMENTS.map((i) => numericLiteralToSnippet(this[i])));
	}
	toString() {
		return `${this.kind}(${VALID_MAT2x2_ELEMENTS.map((i) => this[i]).join(", ")})`;
	}
};
var mat2x2fImpl = class extends mat2x2Impl {
	kind = "mat2x2f";
	makeColumn(e0, e1) {
		return vec2f$1(e0, e1);
	}
};
var VALID_MAT3x3_ELEMENTS = [
	0,
	1,
	2,
	4,
	5,
	6,
	8,
	9,
	10
];
var mat3x3Impl = class extends MatBase {
	[$internal] = true;
	columns;
	length = 12;
	constructor(...elements) {
		super();
		this.columns = [
			this.makeColumn(elements[0], elements[1], elements[2]),
			this.makeColumn(elements[3], elements[4], elements[5]),
			this.makeColumn(elements[6], elements[7], elements[8])
		];
	}
	get 0() {
		return this.columns[0].x;
	}
	get 1() {
		return this.columns[0].y;
	}
	get 2() {
		return this.columns[0].z;
	}
	get 3() {
		return 0;
	}
	get 4() {
		return this.columns[1].x;
	}
	get 5() {
		return this.columns[1].y;
	}
	get 6() {
		return this.columns[1].z;
	}
	get 7() {
		return 0;
	}
	get 8() {
		return this.columns[2].x;
	}
	get 9() {
		return this.columns[2].y;
	}
	get 10() {
		return this.columns[2].z;
	}
	get 11() {
		return 0;
	}
	set 0(value) {
		this.columns[0].x = value;
	}
	set 1(value) {
		this.columns[0].y = value;
	}
	set 2(value) {
		this.columns[0].z = value;
	}
	set 3(_) {}
	set 4(value) {
		this.columns[1].x = value;
	}
	set 5(value) {
		this.columns[1].y = value;
	}
	set 6(value) {
		this.columns[1].z = value;
	}
	set 7(_) {}
	set 8(value) {
		this.columns[2].x = value;
	}
	set 9(value) {
		this.columns[2].y = value;
	}
	set 10(value) {
		this.columns[2].z = value;
	}
	set 11(_) {}
	*[Symbol.iterator]() {
		for (let i = 0; i < 12; i++) yield this[i];
	}
	[$resolve](ctx) {
		return ctx.gen.typeInstantiation(mat3x3f$1, VALID_MAT3x3_ELEMENTS.map((i) => numericLiteralToSnippet(this[i])));
	}
	toString() {
		return `${this.kind}(${VALID_MAT3x3_ELEMENTS.map((i) => this[i]).join(", ")})`;
	}
};
var mat3x3fImpl = class extends mat3x3Impl {
	kind = "mat3x3f";
	makeColumn(x, y, z) {
		return vec3f$1(x, y, z);
	}
};
var VALID_MAT4x4_ELEMENTS = Array.from({ length: 16 }, (_, i) => i);
var mat4x4Impl = class extends MatBase {
	[$internal] = true;
	columns;
	constructor(...elements) {
		super();
		this.columns = [
			this.makeColumn(elements[0], elements[1], elements[2], elements[3]),
			this.makeColumn(elements[4], elements[5], elements[6], elements[7]),
			this.makeColumn(elements[8], elements[9], elements[10], elements[11]),
			this.makeColumn(elements[12], elements[13], elements[14], elements[15])
		];
	}
	length = 16;
	get 0() {
		return this.columns[0].x;
	}
	get 1() {
		return this.columns[0].y;
	}
	get 2() {
		return this.columns[0].z;
	}
	get 3() {
		return this.columns[0].w;
	}
	get 4() {
		return this.columns[1].x;
	}
	get 5() {
		return this.columns[1].y;
	}
	get 6() {
		return this.columns[1].z;
	}
	get 7() {
		return this.columns[1].w;
	}
	get 8() {
		return this.columns[2].x;
	}
	get 9() {
		return this.columns[2].y;
	}
	get 10() {
		return this.columns[2].z;
	}
	get 11() {
		return this.columns[2].w;
	}
	get 12() {
		return this.columns[3].x;
	}
	get 13() {
		return this.columns[3].y;
	}
	get 14() {
		return this.columns[3].z;
	}
	get 15() {
		return this.columns[3].w;
	}
	set 0(value) {
		this.columns[0].x = value;
	}
	set 1(value) {
		this.columns[0].y = value;
	}
	set 2(value) {
		this.columns[0].z = value;
	}
	set 3(value) {
		this.columns[0].w = value;
	}
	set 4(value) {
		this.columns[1].x = value;
	}
	set 5(value) {
		this.columns[1].y = value;
	}
	set 6(value) {
		this.columns[1].z = value;
	}
	set 7(value) {
		this.columns[1].w = value;
	}
	set 8(value) {
		this.columns[2].x = value;
	}
	set 9(value) {
		this.columns[2].y = value;
	}
	set 10(value) {
		this.columns[2].z = value;
	}
	set 11(value) {
		this.columns[2].w = value;
	}
	set 12(value) {
		this.columns[3].x = value;
	}
	set 13(value) {
		this.columns[3].y = value;
	}
	set 14(value) {
		this.columns[3].z = value;
	}
	set 15(value) {
		this.columns[3].w = value;
	}
	*[Symbol.iterator]() {
		for (let i = 0; i < 16; i++) yield this[i];
	}
	[$resolve](ctx) {
		return ctx.gen.typeInstantiation(mat4x4f$1, VALID_MAT4x4_ELEMENTS.map((i) => numericLiteralToSnippet(this[i])));
	}
	toString() {
		return `${this.kind}(${VALID_MAT4x4_ELEMENTS.map((i) => this[i]).join(", ")})`;
	}
};
var mat4x4fImpl = class extends mat4x4Impl {
	kind = "mat4x4f";
	makeColumn(x, y, z, w) {
		return vec4f$1(x, y, z, w);
	}
};
/**
* Returns a 2-by-2 identity matrix.
* @returns {m2x2f} The result matrix.
*/
var identity2 = comptime(() => mat2x2f$1(1, 0, 0, 1)).$name("identity2");
/**
* Returns a 3-by-3 identity matrix.
* @returns {m3x3f} The result matrix.
*/
var identity3 = comptime(() => mat3x3f$1(1, 0, 0, 0, 1, 0, 0, 0, 1)).$name("identity3");
/**
* Returns a 4-by-4 identity matrix.
* @returns {m4x4f} The result matrix.
*/
var identity4 = comptime(() => mat4x4f$1(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)).$name("identity4");
var identityFunctions = {
	2: identity2,
	3: identity3,
	4: identity4
};
/**
* Creates a 4-by-4 matrix which translates by the given vector v.
* @param {v3f} vector - The vector by which to translate.
* @returns {m4x4f} The translation matrix.
*/
var translation4 = /* @__PURE__ */ dualImpl({
	name: "translation4",
	normalImpl: (vector) => mat4x4f$1(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, vector.x, vector.y, vector.z, 1),
	get signature() {
		return {
			argTypes: [vec3f$1],
			returnType: mat4x4f$1
		};
	},
	codegenImpl: (_ctx, [v]) => stitch`mat4x4f(1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, ${v}.x, ${v}.y, ${v}.z, 1)`,
	sideEffects: false
});
/**
* Creates a 4-by-4 matrix which scales in each dimension by an amount given by the corresponding entry in the given vector.
* @param {v3f} vector - A vector of three entries specifying the factor by which to scale in each dimension.
* @returns {m4x4f} The scaling matrix.
*/
var scaling4 = /* @__PURE__ */ dualImpl({
	name: "scaling4",
	normalImpl: (vector) => mat4x4f$1(vector.x, 0, 0, 0, 0, vector.y, 0, 0, 0, 0, vector.z, 0, 0, 0, 0, 1),
	get signature() {
		return {
			argTypes: [vec3f$1],
			returnType: mat4x4f$1
		};
	},
	codegenImpl: (_ctx, [v]) => stitch`mat4x4f(${v}.x, 0, 0, 0, 0, ${v}.y, 0, 0, 0, 0, ${v}.z, 0, 0, 0, 0, 1)`,
	sideEffects: false
});
/**
* Creates a 4-by-4 matrix which rotates around the x-axis by the given angle.
* @param {number} angle - The angle by which to rotate (in radians).
* @returns {m4x4f} The rotation matrix.
*/
var rotationX4 = /* @__PURE__ */ dualImpl({
	name: "rotationX4",
	normalImpl: (a) => mat4x4f$1(1, 0, 0, 0, 0, Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1),
	get signature() {
		return {
			argTypes: [f32],
			returnType: mat4x4f$1
		};
	},
	codegenImpl: (_ctx, [a]) => stitch`mat4x4f(1, 0, 0, 0, 0, cos(${a}), sin(${a}), 0, 0, -sin(${a}), cos(${a}), 0, 0, 0, 0, 1)`,
	sideEffects: false
});
/**
* Creates a 4-by-4 matrix which rotates around the y-axis by the given angle.
* @param {number} angle - The angle by which to rotate (in radians).
* @returns {m4x4f} The rotation matrix.
*/
var rotationY4 = /* @__PURE__ */ dualImpl({
	name: "rotationY4",
	normalImpl: (a) => mat4x4f$1(Math.cos(a), 0, -Math.sin(a), 0, 0, 1, 0, 0, Math.sin(a), 0, Math.cos(a), 0, 0, 0, 0, 1),
	get signature() {
		return {
			argTypes: [f32],
			returnType: mat4x4f$1
		};
	},
	codegenImpl: (_ctx, [a]) => stitch`mat4x4f(cos(${a}), 0, -sin(${a}), 0, 0, 1, 0, 0, sin(${a}), 0, cos(${a}), 0, 0, 0, 0, 1)`,
	sideEffects: false
});
/**
* Creates a 4-by-4 matrix which rotates around the z-axis by the given angle.
* @param {number} angle - The angle by which to rotate (in radians).
* @returns {m4x4f} The rotation matrix.
*/
var rotationZ4 = /* @__PURE__ */ dualImpl({
	name: "rotationZ4",
	normalImpl: (a) => mat4x4f$1(Math.cos(a), Math.sin(a), 0, 0, -Math.sin(a), Math.cos(a), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1),
	get signature() {
		return {
			argTypes: [f32],
			returnType: mat4x4f$1
		};
	},
	codegenImpl: (_ctx, [a]) => stitch`mat4x4f(cos(${a}), sin(${a}), 0, 0, -sin(${a}), cos(${a}), 0, 0, 0, 0, 1, 0, 0, 0, 0, 1)`,
	sideEffects: false
});
/**
* Schema representing mat2x2f - a matrix with 2 rows and 2 columns, with elements of type f32.
* Also a constructor function for this matrix type.
*
* @example
* const zero2x2 = mat2x2f(); // filled with zeros
*
* @example
* const mat = mat2x2f(0, 1, 2, 3);
* mat.columns[0] // vec2f(0, 1)
* mat.columns[1] // vec2f(2, 3)
*
* @example
* const mat = mat2x2f(
*  vec2f(0, 1), // column 0
*  vec2f(1, 2), // column 1
* );
*
* @example
* const buffer = root.createBuffer(d.mat2x2f, d.mat2x2f(0, 1, 2, 3)); // buffer holding a d.mat2x2f value, with an initial value of ((0, 1), (2, 3))
*/
var mat2x2f$1 = createMatSchema({
	type: "mat2x2f",
	rows: 2,
	columns: 2,
	MatImpl: mat2x2fImpl
});
/**
* Schema representing mat3x3f - a matrix with 3 rows and 3 columns, with elements of type f32.
* Also a constructor function for this matrix type.
*
* @example
* const zero3x3 = mat3x3f(); // filled with zeros
*
* @example
* const mat = mat3x3f(0, 1, 2, 3, 4, 5, 6, 7, 8);
* mat.columns[0] // vec3f(0, 1, 2)
* mat.columns[1] // vec3f(3, 4, 5)
* mat.columns[2] // vec3f(6, 7, 8)
*
* @example
* const mat = mat3x3f(
*  vec3f(0, 1, 2), // column 0
*  vec3f(2, 3, 4), // column 1
*  vec3f(5, 6, 7), // column 2
* );
*
* @example
* const buffer = root.createBuffer(d.mat3x3f, d.mat3x3f()); // buffer holding a d.mat3x3f value, with an initial value of mat3x3f filled with zeros
*/
var mat3x3f$1 = createMatSchema({
	type: "mat3x3f",
	rows: 3,
	columns: 3,
	MatImpl: mat3x3fImpl
});
/**
* Schema representing mat4x4f - a matrix with 4 rows and 4 columns, with elements of type f32.
* Also a constructor function for this matrix type.
*
* @example
* const zero4x4 = mat4x4f(); // filled with zeros
*
* @example
* const mat = mat4x4f(0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15);
* mat.columns[0] // vec4f(0, 1, 2, 3)
* mat.columns[1] // vec4f(4, 5, 6, 7)
* mat.columns[2] // vec4f(8, 9, 10, 11)
* mat.columns[3] // vec4f(12, 13, 14, 15)
*
* @example
* const mat = mat4x4f(
*  vec4f(0, 1, 2, 3),     // column 0
*  vec4f(4, 5, 6, 7),     // column 1
*  vec4f(8, 9, 10, 11),   // column 2
*  vec4f(12, 13, 14, 15), // column 3
* );
*
* @example
* const buffer = root.createBuffer(d.mat4x4f, d.mat4x4f()); // buffer holding a d.mat4x4f value, with an initial value of mat4x4f filled with zeros
*/
var mat4x4f$1 = createMatSchema({
	type: "mat4x4f",
	rows: 4,
	columns: 4,
	MatImpl: mat4x4fImpl
});
//#endregion
//#region src/data/numberOps.ts
var buf32 = /* @__PURE__ */ new ArrayBuffer(4);
var f32arr = new Float32Array(buf32);
var u32arr = new Uint32Array(buf32);
var i32arr = new Int32Array(buf32);
function bitcastU32toF32Impl(n) {
	u32arr[0] = n;
	return f32arr[0];
}
function bitcastU32toI32Impl(n) {
	u32arr[0] = n;
	return i32arr[0];
}
function bitcastF32toU32Impl(n) {
	f32arr[0] = n;
	return u32arr[0];
}
//#endregion
//#region src/data/vectorOps.ts
var lengthVec2 = (v) => Math.sqrt(v.x ** 2 + v.y ** 2);
var lengthVec3 = (v) => Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2);
var lengthVec4 = (v) => Math.sqrt(v.x ** 2 + v.y ** 2 + v.z ** 2 + v.w ** 2);
var dotVec2 = (lhs, rhs) => lhs.x * rhs.x + lhs.y * rhs.y;
var dotVec3 = (lhs, rhs) => lhs.x * rhs.x + lhs.y * rhs.y + lhs.z * rhs.z;
var dotVec4 = (lhs, rhs) => lhs.x * rhs.x + lhs.y * rhs.y + lhs.z * rhs.z + lhs.w * rhs.w;
var binaryComponentWise2u = (op) => (a, b) => vec2u$1(op(a.x, b.x), op(a.y, b.y));
var binaryComponentWise3u = (op) => (a, b) => vec3u$1(op(a.x, b.x), op(a.y, b.y), op(a.z, b.z));
var binaryComponentWise4u = (op) => (a, b) => vec4u$1(op(a.x, b.x), op(a.y, b.y), op(a.z, b.z), op(a.w, b.w));
var binaryComponentWise2i2u = (op) => (a, b) => vec2i$1(op(a.x, b.x), op(a.y, b.y));
var binaryComponentWise3i3u = (op) => (a, b) => vec3i$1(op(a.x, b.x), op(a.y, b.y), op(a.z, b.z));
var binaryComponentWise4i4u = (op) => (a, b) => vec4i$1(op(a.x, b.x), op(a.y, b.y), op(a.z, b.z), op(a.w, b.w));
/**
* Functions that cannot be simply generalized via `generalizeFn`
* have their overloads listed explicitly here.
*/
var VectorOps = {
	all: {
		"vec2<bool>": (e) => e.x && e.y,
		"vec3<bool>": (e) => e.x && e.y && e.z,
		"vec4<bool>": (e) => e.x && e.y && e.z && e.w
	},
	length: {
		vec2f: lengthVec2,
		vec2h: lengthVec2,
		vec3f: lengthVec3,
		vec3h: lengthVec3,
		vec4f: lengthVec4,
		vec4h: lengthVec4
	},
	mulMxM: {
		mat2x2f: (a, b) => {
			const a_ = a.columns;
			const b_ = b.columns;
			return mat2x2f$1(a_[0].x * b_[0].x + a_[1].x * b_[0].y, a_[0].y * b_[0].x + a_[1].y * b_[0].y, a_[0].x * b_[1].x + a_[1].x * b_[1].y, a_[0].y * b_[1].x + a_[1].y * b_[1].y);
		},
		mat3x3f: (a, b) => {
			const a_ = a.columns;
			const b_ = b.columns;
			return mat3x3f$1(a_[0].x * b_[0].x + a_[1].x * b_[0].y + a_[2].x * b_[0].z, a_[0].y * b_[0].x + a_[1].y * b_[0].y + a_[2].y * b_[0].z, a_[0].z * b_[0].x + a_[1].z * b_[0].y + a_[2].z * b_[0].z, a_[0].x * b_[1].x + a_[1].x * b_[1].y + a_[2].x * b_[1].z, a_[0].y * b_[1].x + a_[1].y * b_[1].y + a_[2].y * b_[1].z, a_[0].z * b_[1].x + a_[1].z * b_[1].y + a_[2].z * b_[1].z, a_[0].x * b_[2].x + a_[1].x * b_[2].y + a_[2].x * b_[2].z, a_[0].y * b_[2].x + a_[1].y * b_[2].y + a_[2].y * b_[2].z, a_[0].z * b_[2].x + a_[1].z * b_[2].y + a_[2].z * b_[2].z);
		},
		mat4x4f: (a, b) => {
			const a_ = a.columns;
			const b_ = b.columns;
			return mat4x4f$1(a_[0].x * b_[0].x + a_[1].x * b_[0].y + a_[2].x * b_[0].z + a_[3].x * b_[0].w, a_[0].y * b_[0].x + a_[1].y * b_[0].y + a_[2].y * b_[0].z + a_[3].y * b_[0].w, a_[0].z * b_[0].x + a_[1].z * b_[0].y + a_[2].z * b_[0].z + a_[3].z * b_[0].w, a_[0].w * b_[0].x + a_[1].w * b_[0].y + a_[2].w * b_[0].z + a_[3].w * b_[0].w, a_[0].x * b_[1].x + a_[1].x * b_[1].y + a_[2].x * b_[1].z + a_[3].x * b_[1].w, a_[0].y * b_[1].x + a_[1].y * b_[1].y + a_[2].y * b_[1].z + a_[3].y * b_[1].w, a_[0].z * b_[1].x + a_[1].z * b_[1].y + a_[2].z * b_[1].z + a_[3].z * b_[1].w, a_[0].w * b_[1].x + a_[1].w * b_[1].y + a_[2].w * b_[1].z + a_[3].w * b_[1].w, a_[0].x * b_[2].x + a_[1].x * b_[2].y + a_[2].x * b_[2].z + a_[3].x * b_[2].w, a_[0].y * b_[2].x + a_[1].y * b_[2].y + a_[2].y * b_[2].z + a_[3].y * b_[2].w, a_[0].z * b_[2].x + a_[1].z * b_[2].y + a_[2].z * b_[2].z + a_[3].z * b_[2].w, a_[0].w * b_[2].x + a_[1].w * b_[2].y + a_[2].w * b_[2].z + a_[3].w * b_[2].w, a_[0].x * b_[3].x + a_[1].x * b_[3].y + a_[2].x * b_[3].z + a_[3].x * b_[3].w, a_[0].y * b_[3].x + a_[1].y * b_[3].y + a_[2].y * b_[3].z + a_[3].y * b_[3].w, a_[0].z * b_[3].x + a_[1].z * b_[3].y + a_[2].z * b_[3].z + a_[3].z * b_[3].w, a_[0].w * b_[3].x + a_[1].w * b_[3].y + a_[2].w * b_[3].z + a_[3].w * b_[3].w);
		}
	},
	mulMxV: {
		mat2x2f: (m, v) => {
			const m_ = m.columns;
			return vec2f$1(m_[0].x * v.x + m_[1].x * v.y, m_[0].y * v.x + m_[1].y * v.y);
		},
		mat3x3f: (m, v) => {
			const m_ = m.columns;
			return vec3f$1(m_[0].x * v.x + m_[1].x * v.y + m_[2].x * v.z, m_[0].y * v.x + m_[1].y * v.y + m_[2].y * v.z, m_[0].z * v.x + m_[1].z * v.y + m_[2].z * v.z);
		},
		mat4x4f: (m, v) => {
			const m_ = m.columns;
			return vec4f$1(m_[0].x * v.x + m_[1].x * v.y + m_[2].x * v.z + m_[3].x * v.w, m_[0].y * v.x + m_[1].y * v.y + m_[2].y * v.z + m_[3].y * v.w, m_[0].z * v.x + m_[1].z * v.y + m_[2].z * v.z + m_[3].z * v.w, m_[0].w * v.x + m_[1].w * v.y + m_[2].w * v.z + m_[3].w * v.w);
		}
	},
	mulVxM: {
		mat2x2f: (v, m) => {
			const m_ = m.columns;
			return vec2f$1(v.x * m_[0].x + v.y * m_[0].y, v.x * m_[1].x + v.y * m_[1].y);
		},
		mat3x3f: (v, m) => {
			const m_ = m.columns;
			return vec3f$1(v.x * m_[0].x + v.y * m_[0].y + v.z * m_[0].z, v.x * m_[1].x + v.y * m_[1].y + v.z * m_[1].z, v.x * m_[2].x + v.y * m_[2].y + v.z * m_[2].z);
		},
		mat4x4f: (v, m) => {
			const m_ = m.columns;
			return vec4f$1(v.x * m_[0].x + v.y * m_[0].y + v.z * m_[0].z + v.w * m_[0].w, v.x * m_[1].x + v.y * m_[1].y + v.z * m_[1].z + v.w * m_[1].w, v.x * m_[2].x + v.y * m_[2].y + v.z * m_[2].z + v.w * m_[2].w, v.x * m_[3].x + v.y * m_[3].y + v.z * m_[3].z + v.w * m_[3].w);
		}
	},
	dot: {
		vec2f: dotVec2,
		vec2h: dotVec2,
		vec2i: dotVec2,
		vec2u: dotVec2,
		vec3f: dotVec3,
		vec3h: dotVec3,
		vec3i: dotVec3,
		vec3u: dotVec3,
		vec4f: dotVec4,
		vec4h: dotVec4,
		vec4i: dotVec4,
		vec4u: dotVec4
	},
	cross: {
		vec3f: (a, b) => {
			return vec3f$1(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
		},
		vec3h: (a, b) => {
			return vec3h$1(a.y * b.z - a.z * b.y, a.z * b.x - a.x * b.z, a.x * b.y - a.y * b.x);
		}
	},
	bitShiftLeft: {
		vec2i: binaryComponentWise2i2u((a, b) => a << b),
		vec2u: binaryComponentWise2u((a, b) => a << b),
		vec3i: binaryComponentWise3i3u((a, b) => a << b),
		vec3u: binaryComponentWise3u((a, b) => a << b),
		vec4i: binaryComponentWise4i4u((a, b) => a << b),
		vec4u: binaryComponentWise4u((a, b) => a << b)
	},
	bitShiftRight: {
		vec2i: binaryComponentWise2i2u((a, b) => a >> b),
		vec2u: binaryComponentWise2u((a, b) => a >>> b),
		vec3i: binaryComponentWise3i3u((a, b) => a >> b),
		vec3u: binaryComponentWise3u((a, b) => a >>> b),
		vec4i: binaryComponentWise4i4u((a, b) => a >> b),
		vec4u: binaryComponentWise4u((a, b) => a >>> b)
	},
	bitcastU32toF32: {
		vec2u: (n) => vec2f$1(bitcastU32toF32Impl(n.x), bitcastU32toF32Impl(n.y)),
		vec3u: (n) => vec3f$1(bitcastU32toF32Impl(n.x), bitcastU32toF32Impl(n.y), bitcastU32toF32Impl(n.z)),
		vec4u: (n) => vec4f$1(bitcastU32toF32Impl(n.x), bitcastU32toF32Impl(n.y), bitcastU32toF32Impl(n.z), bitcastU32toF32Impl(n.w))
	},
	bitcastU32toI32: {
		vec2u: (n) => vec2i$1(bitcastU32toI32Impl(n.x), bitcastU32toI32Impl(n.y)),
		vec3u: (n) => vec3i$1(bitcastU32toI32Impl(n.x), bitcastU32toI32Impl(n.y), bitcastU32toI32Impl(n.z)),
		vec4u: (n) => vec4i$1(bitcastU32toI32Impl(n.x), bitcastU32toI32Impl(n.y), bitcastU32toI32Impl(n.z), bitcastU32toI32Impl(n.w))
	},
	bitcastF32toU32: {
		vec2f: (n) => vec2u$1(bitcastF32toU32Impl(n.x), bitcastF32toU32Impl(n.y)),
		vec3f: (n) => vec3u$1(bitcastF32toU32Impl(n.x), bitcastF32toU32Impl(n.y), bitcastF32toU32Impl(n.z)),
		vec4f: (n) => vec4u$1(bitcastF32toU32Impl(n.x), bitcastF32toU32Impl(n.y), bitcastF32toU32Impl(n.z), bitcastF32toU32Impl(n.w))
	}
};
//#endregion
//#region src/data/generalizeFn.ts
var booleanFor = {
	vec2f: vec2b$1,
	vec2h: vec2b$1,
	vec2i: vec2b$1,
	vec2u: vec2b$1,
	"vec2<bool>": vec2b$1,
	vec3f: vec3b$1,
	vec3h: vec3b$1,
	vec3i: vec3b$1,
	vec3u: vec3b$1,
	"vec3<bool>": vec3b$1,
	vec4f: vec4b$1,
	vec4h: vec4b$1,
	vec4i: vec4b$1,
	vec4u: vec4b$1,
	"vec4<bool>": vec4b$1
};
var constructorFor = {
	...vecTypeToConstructor,
	mat2x2f: mat2x2f$1,
	mat3x3f: mat3x3f$1,
	mat4x4f: mat4x4f$1
};
function getConstructorFor(mode, kind) {
	const map = mode === "boolean" ? booleanFor : constructorFor;
	if (kind in map) return map[kind];
	throw new Error(`No corresponding vector/matrix type for '${kind}' kind in '${mode}' mode.`);
}
function makeIterable(item) {
	if (item.kind.startsWith("vec")) return item;
	return item.columns.flat();
}
function applyArgs(fn, args, mode) {
	const kinds = args.map(kindOf);
	if (kinds.every((type) => type === "boolean" || type === "number")) return fn(...args);
	const kind = kinds[0];
	invariant(kind, `Expected kind of the first argument to be present.`);
	const constructor = getConstructorFor(mode, kind);
	const iterableArgs = args.map(makeIterable);
	const length = iterableArgs[0]?.length;
	invariant(length !== void 0, `Expected constructor to have at least one argument.`);
	return constructor(...Array.from({ length }, (_, i) => {
		return fn(...iterableArgs.map((arg) => arg[i]));
	}));
}
function generalizeFn(fn, args) {
	return applyArgs(fn, args, "first");
}
function generalizeBoolFn(fn, args) {
	return applyArgs(fn, args, "boolean");
}
function kindOf(v) {
	if (typeof v === "number") return "number";
	if (typeof v === "boolean") return "boolean";
	return v.kind;
}
var i32Kind = new Set([
	"number",
	"vec2i",
	"vec3i",
	"vec4i"
]);
var u32Kind = new Set([
	"number",
	"vec2u",
	"vec3u",
	"vec4u"
]);
var f32Kind = new Set([
	"number",
	"vec2f",
	"vec3f",
	"vec4f"
]);
var f16Kind = new Set([
	"number",
	"vec2h",
	"vec3h",
	"vec4h"
]);
var matrixKind = new Set([
	"mat2x2f",
	"mat3x3f",
	"mat4x4f"
]);
var booleanKind = new Set([
	"boolean",
	"vec2<bool>",
	"vec3<bool>",
	"vec4<bool>"
]);
var floatKind = new Set([...f32Kind, ...f16Kind]);
var signedKind = new Set([
	...i32Kind,
	...f32Kind,
	...f16Kind
]);
var numericKind = new Set([...signedKind, ...u32Kind]);
var numericOrBooleanKind = new Set([...numericKind, ...booleanKind]);
var numericOrMatrixKind = new Set([...numericKind, ...matrixKind]);
function assertKind(v, valid, excludeScalar = false) {
	if (!isVecInstance(v) && Array.isArray(v)) {
		v.forEach((item) => assertKind(item, valid, excludeScalar));
		return;
	}
	const kind = kindOf(v);
	if (!valid.has(kind)) throw new WgslTypeError(`Unsupported signature. Expected one of '${[...valid].join(", ")}', got '${kind}'.`);
	if (excludeScalar && (kind === "number" || kind === "boolean")) throw new WgslTypeError(`Unsupported signature. Expected kind to not be scalar, got '${kind}'.`);
}
function assertEqualKinds(...values) {
	const kinds = new Set(values.map(kindOf));
	if (kinds.size !== 1) throw new WgslTypeError(`Unsupported signature. Expected the following kinds to be equal: '${[...kinds].join(", ")}'.`);
}
/**
* If one of the arguments is a vector and other is a number,
* the number is up-cased to a vector.
*/
function upCast(args) {
	const [lhs, rhs] = args;
	if (typeof lhs === "number" && isVecInstance(rhs)) {
		const schema = constructorFor[rhs.kind];
		return [schema(lhs), rhs];
	} else if (isVecInstance(lhs) && typeof rhs === "number") {
		const schema = constructorFor[lhs.kind];
		return [lhs, schema(rhs)];
	}
	return [lhs, rhs];
}
//#endregion
//#region src/std/operators.ts
var getPrimitive = (t) => "primitive" in t ? t.primitive : t;
var makeBinarySignature = (opts) => (lhs, rhs) => {
	const { restrict } = opts ?? {};
	const fail = (msg) => {
		if (restrict) throw new SignatureNotSupportedError([lhs, rhs], restrict);
		throw new Error(`Cannot apply operator to ${lhs.type} and ${rhs.type}: ${msg}`);
	};
	if (opts?.noMat && (isMat(lhs) || isMat(rhs))) return fail("matrices not supported");
	const lhsC = isVec(lhs) || isMat(lhs);
	const rhsC = isVec(rhs) || isMat(rhs);
	if (!lhsC && !rhsC) {
		const unified = unify([lhs, rhs], restrict);
		if (!unified) return fail("incompatible scalar types");
		return {
			argTypes: unified,
			returnType: unified[0]
		};
	}
	if (lhsC && rhsC) {
		if (opts?.matVecProduct && isVec(lhs) !== isVec(rhs)) return {
			argTypes: [lhs, rhs],
			returnType: isVec(lhs) ? lhs : rhs
		};
		if (lhs.type !== rhs.type) return fail("operands must have the same type");
		return {
			argTypes: [lhs, rhs],
			returnType: lhs
		};
	}
	const [scalar, composite] = lhsC ? [rhs, lhs] : [lhs, rhs];
	const unified = unify([scalar], [getPrimitive(composite)]);
	if (!unified) return fail(`scalar not convertible to ${getPrimitive(composite).type}`);
	return {
		argTypes: lhsC ? [lhs, unified[0]] : [unified[0], rhs],
		returnType: composite
	};
};
var binaryArithmeticSignature = makeBinarySignature();
var binaryMulSignature = makeBinarySignature({ matVecProduct: true });
var binaryDivSignature = makeBinarySignature({
	noMat: true,
	restrict: [
		f32,
		f16,
		abstractFloat
	]
});
function cpuAdd(lhs, rhs) {
	assertKind([lhs, rhs], numericOrMatrixKind);
	if (isMatInstance(lhs) !== isMatInstance(rhs)) throw new WgslTypeError("There is no matrix/non-matrix addition or subtraction in WGSL.");
	if (typeof lhs === "number" === (typeof rhs === "number")) assertEqualKinds(lhs, rhs);
	return generalizeFn((a, b) => a + b, upCast([lhs, rhs]));
}
var add = /* @__PURE__ */ dualImpl({
	name: "add",
	signature: binaryArithmeticSignature,
	normalImpl: cpuAdd,
	codegenImpl: (ctx, [lhs, rhs]) => ctx.gen.emitBinaryOp(lhs, "+", rhs),
	sideEffects: false
});
function cpuSub(lhs, rhs) {
	return cpuAdd(lhs, cpuMul(-1, rhs));
}
var sub = /* @__PURE__ */ dualImpl({
	name: "sub",
	signature: binaryArithmeticSignature,
	normalImpl: cpuSub,
	codegenImpl: (ctx, [lhs, rhs]) => ctx.gen.emitBinaryOp(lhs, "-", rhs),
	sideEffects: false
});
function cpuMul(lhs, rhs) {
	assertKind([lhs, rhs], numericOrMatrixKind);
	if (typeof lhs === "number" && typeof rhs === "number") return lhs * rhs;
	if (typeof lhs === "number" && (isVecInstance(rhs) || isMatInstance(rhs))) return generalizeFn((e) => lhs * e, [rhs]);
	if ((isVecInstance(lhs) || isMatInstance(lhs)) && typeof rhs === "number") return generalizeFn((e) => e * rhs, [lhs]);
	if (isVecInstance(lhs) && isVecInstance(rhs)) {
		assertEqualKinds(lhs, rhs);
		return generalizeFn((a, b) => a * b, [lhs, rhs]);
	}
	if (isFloat32VecInstance(lhs) && isMatInstance(rhs)) {
		if (lhs.length !== rhs.columns.length) throw new WgslTypeError(`Unsupported signature. Kind '${kindOf(lhs)}' cannot be multiplied by '${kindOf(rhs)}'.`);
		return VectorOps.mulVxM[rhs.kind](lhs, rhs);
	}
	if (isMatInstance(lhs) && isFloat32VecInstance(rhs)) {
		if (lhs.columns.length !== rhs.length) throw new WgslTypeError(`Unsupported signature. Kind '${kindOf(lhs)}' cannot be multiplied by '${kindOf(rhs)}'.`);
		return VectorOps.mulMxV[lhs.kind](lhs, rhs);
	}
	if (isMatInstance(lhs) && isMatInstance(rhs)) {
		assertEqualKinds(lhs, rhs);
		return VectorOps.mulMxM[lhs.kind](lhs, rhs);
	}
	throw new WgslTypeError(`Unsupported signature. Kind '${kindOf(lhs)}' cannot be multiplied by '${kindOf(rhs)}'.`);
}
var mul = /* @__PURE__ */ dualImpl({
	name: "mul",
	signature: binaryMulSignature,
	normalImpl: cpuMul,
	codegenImpl: (ctx, [lhs, rhs]) => ctx.gen.emitBinaryOp(lhs, "*", rhs),
	sideEffects: false
});
function cpuDiv(lhs, rhs) {
	assertKind([lhs, rhs], numericKind);
	const cast = upCast([lhs, rhs]);
	assertEqualKinds(...cast);
	return generalizeFn((a, b) => a / b, cast);
}
var div = /* @__PURE__ */ dualImpl({
	name: "div",
	signature: binaryDivSignature,
	normalImpl: cpuDiv,
	codegenImpl: (ctx, [lhs, rhs]) => ctx.gen.emitBinaryOp(lhs, "/", rhs),
	ignoreImplicitCastWarning: true,
	sideEffects: false
});
/**
* @privateRemarks
* Both JS and WGSL implementations use truncated definition of modulo
*/
var mod = /* @__PURE__ */ dualImpl({
	name: "mod",
	signature: binaryDivSignature,
	normalImpl: ((a, b) => {
		assertKind([a, b], numericKind);
		const cast = upCast([a, b]);
		assertEqualKinds(...cast);
		return generalizeFn((a, b) => a % b, cast);
	}),
	codegenImpl: (ctx, [lhs, rhs]) => ctx.gen.emitBinaryOp(lhs, "%", rhs),
	sideEffects: false
});
function cpuNeg(value) {
	assertKind(value, signedKind);
	return generalizeFn((value) => -value, [value]);
}
var neg = /* @__PURE__ */ dualImpl({
	name: "neg",
	signature: (arg) => {
		if (getPrimitive(arg) === u32) throw new WgslTypeError(`Unsupported signature. Unary operator - cannot be applied to argument of kind '${arg.type}'.`);
		return {
			argTypes: [arg],
			returnType: arg
		};
	},
	normalImpl: cpuNeg,
	codegenImpl: (_ctx, [arg]) => stitch`-(${arg})`,
	sideEffects: false
});
var intVecToUnsignedVec = {
	vec2i: vec2u$1,
	vec2u: vec2u$1,
	vec3i: vec3u$1,
	vec3u: vec3u$1,
	vec4i: vec4u$1,
	vec4u: vec4u$1
};
var bitShiftSignature = (lhs, rhs) => {
	const lhsUnified = unify([lhs], [
		vec2i$1,
		vec3i$1,
		vec4i$1,
		vec2u$1,
		vec3u$1,
		vec4u$1
	])?.[0];
	if (!lhsUnified || !isVec(lhsUnified)) throw new SignatureNotSupportedError([lhs], [
		vec2i$1,
		vec3i$1,
		vec4i$1,
		vec2u$1,
		vec3u$1,
		vec4u$1
	]);
	const cc = lhsUnified.componentCount;
	const vecU = cc === 2 ? vec2u$1 : cc === 3 ? vec3u$1 : vec4u$1;
	const rhsUnified = unify([rhs], [u32, vecU])?.[0];
	if (!rhsUnified) throw new SignatureNotSupportedError([rhs], [u32, vecU]);
	return {
		argTypes: [lhsUnified, rhsUnified],
		returnType: lhsUnified
	};
};
function cpuBitShiftLeft(lhs, rhs) {
	if (isInteger32VecInstance(lhs) && isUint32VecInstance(rhs) && lhs.length == rhs.length) return VectorOps.bitShiftLeft[lhs.kind](lhs, rhs);
	if (isInteger32VecInstance(lhs) && typeof rhs === "number") {
		const rhsVec = intVecToUnsignedVec[lhs.kind](rhs);
		return VectorOps.bitShiftLeft[lhs.kind](lhs, rhsVec);
	}
	throw new Error("'bitShiftLeft' called with invalid arguments, expected: left-hand side to be an integer vector, right-hand side to be a number or unsigned integer vector of the same arity as the left-hand side.");
}
var bitShiftLeft = /* @__PURE__ */ dualImpl({
	name: "bitShiftLeft",
	signature: bitShiftSignature,
	normalImpl: cpuBitShiftLeft,
	codegenImpl: (ctx, [lhs, rhs]) => {
		if (isVec(lhs.dataType) && !isVec(rhs.dataType)) {
			const cc = lhs.dataType.componentCount;
			const schema = cc === 2 ? vec2u$1 : cc === 3 ? vec3u$1 : vec4u$1;
			return ctx.gen.emitBinaryOp(lhs, "<<", ctx.gen.typeInstantiation(schema, [rhs]));
		}
		return ctx.gen.emitBinaryOp(lhs, "<<", rhs);
	},
	sideEffects: false
});
function cpuBitShiftRight(lhs, rhs) {
	if (isInteger32VecInstance(lhs) && isUint32VecInstance(rhs) && lhs.length == rhs.length) return VectorOps.bitShiftRight[lhs.kind](lhs, rhs);
	if (isInteger32VecInstance(lhs) && typeof rhs === "number") {
		const rhsVec = intVecToUnsignedVec[lhs.kind](rhs);
		return VectorOps.bitShiftRight[lhs.kind](lhs, rhsVec);
	}
	throw new Error("'bitShiftRight' called with invalid arguments, expected: left-hand side to be an integer vector, right-hand side to be a number or unsigned integer vector of the same arity as the left-hand side.");
}
//#endregion
//#region src/tgsl/infixDispatch.ts
var infixOperators = {
	add,
	sub,
	mul,
	div,
	mod,
	bitShiftLeft,
	bitShiftRight: /* @__PURE__ */ dualImpl({
		name: "bitShiftRight",
		signature: bitShiftSignature,
		normalImpl: cpuBitShiftRight,
		codegenImpl: (ctx, [lhs, rhs]) => {
			if (isVec(lhs.dataType) && !isVec(rhs.dataType)) {
				const cc = lhs.dataType.componentCount;
				const schema = cc === 2 ? vec2u$1 : cc === 3 ? vec3u$1 : vec4u$1;
				return ctx.gen.emitBinaryOp(lhs, ">>", ctx.gen.typeInstantiation(schema, [rhs]));
			}
			return ctx.gen.emitBinaryOp(lhs, ">>", rhs);
		},
		sideEffects: false
	})
};
/**
* InfixDispatch is only used in codegen mode.
* `lhs` may either be Numeric or Snippet.
* @example
* const external = d.vec2u(1);
* const fn = () => {
*    'use gpu';
*    external.mul(2); // lhs is Numeric
*    d.vec2u(1).mul(2) // lhs is a snippet
* }
*/
var InfixDispatch = class {
	lhs;
	operator;
	constructor(lhs, operator) {
		this.lhs = lhs;
		this.operator = operator;
	}
	[$comptimeValueOf]() {
		const known = isSnippet(this.lhs) ? asComptime(this.lhs) : { value: this.lhs };
		if (!known) return { comptime: false };
		const lhs = known.value;
		const operator = this.operator;
		return {
			comptime: true,
			value: (rhs) => operator(lhs, rhs)
		};
	}
};
function isInfixDispatch(o) {
	return o instanceof InfixDispatch;
}
/**
* This function is used on vec/mat prototypes.
* This is done in runtime in order to avoid a circular dependency.
*/
function assignInfixOperator(base, operator, operatorSymbol) {
	const opImpl = infixOperators[operator];
	Object.defineProperty(base.prototype, operatorSymbol, { value: opImpl });
	function jsInfixDispatchFor(arg) {
		return opImpl(this, arg);
	}
	Object.defineProperty(base.prototype, operator, { get() {
		if (inCodegenMode()) return new InfixDispatch(this, opImpl);
		return jsInfixDispatchFor;
	} });
}
//#endregion
//#region src/tgsl/accessProp.ts
var infixKinds = [
	"vec2f",
	"vec3f",
	"vec4f",
	"vec2h",
	"vec3h",
	"vec4h",
	"vec2i",
	"vec3i",
	"vec4i",
	"vec2u",
	"vec3u",
	"vec4u",
	"mat2x2f",
	"mat3x3f",
	"mat4x4f"
];
var swizzleLenToType = {
	f: {
		1: f32,
		2: vec2f$1,
		3: vec3f$1,
		4: vec4f$1
	},
	h: {
		1: f16,
		2: vec2h$1,
		3: vec3h$1,
		4: vec4h$1
	},
	i: {
		1: i32,
		2: vec2i$1,
		3: vec3i$1,
		4: vec4i$1
	},
	u: {
		1: u32,
		2: vec2u$1,
		3: vec3u$1,
		4: vec4u$1
	},
	b: {
		1: bool,
		2: vec2b$1,
		3: vec3b$1,
		4: vec4b$1
	}
};
function accessProp(target, propName) {
	if (infixKinds.includes(target.dataType.type) && propName in infixOperators) {
		const operator = infixOperators[propName];
		return snip(new InfixDispatch(target, operator), UnknownData, target.origin, target.possibleSideEffects);
	}
	if (isWgslArray(target.dataType) && propName === "length") {
		if (target.dataType.elementCount === 0) return snip(stitch`arrayLength(&${target})`, u32, "runtime", target.possibleSideEffects);
		return numericLiteralToSnippet(target.dataType.elementCount);
	}
	if (isMat(target.dataType) && propName === "columns") return snip(new MatrixColumnsAccess(target), UnknownData, target.origin, target.possibleSideEffects);
	if (isWgslStruct(target.dataType) || isUnstruct(target.dataType)) return accessStructProp(target, propName);
	if (target.dataType instanceof AutoStruct) {
		const result = target.dataType.accessProp(propName);
		if (!result) return;
		return snip(stitch`${target}.${result.prop}`, result.type, "argument", target.possibleSideEffects);
	}
	if (target.dataType instanceof EntryInputRouter) {
		const result = target.dataType.accessProp(propName);
		if (isSnippet(result)) return result;
		if (result) return accessProp(result.target, result.prop);
		return;
	}
	if (isPtr(target.dataType)) {
		const derefed = derefSnippet(target);
		if (propName === "$") return derefed;
		return accessProp(derefed, propName);
	}
	if (isVec(target.dataType)) {
		if (propName === "kind") return snip(target.dataType.type, UnknownData, "constant", false);
	}
	const propLength = propName.length;
	if (isVec(target.dataType) && propLength >= 1 && propLength <= 4 && /^[xyzw]+$|^[rgba]+$/.test(propName)) {
		const swizzleType = swizzleLenToType[target.dataType.type.includes("bool") ? "b" : target.dataType.type[4]][propLength];
		if (!swizzleType) return;
		const knownTarget = asComptime(target);
		return snip(knownTarget ? knownTarget.value[propName] : stitch`${target}.${propName}`, swizzleType, propLength === 1 ? target.origin : target.origin === "constant" || target.origin === "constant-immutable-def" ? "constant" : "runtime", target.possibleSideEffects);
	}
	const knownTarget = asComptime(target);
	if (knownTarget) {
		const prop = knownTarget.value[propName];
		if (isNamable(prop) && getName(prop) === void 0) setName(prop, propName);
		return coerceToSnippet(prop);
	}
}
//#endregion
//#region src/tgsl/accessIndex.ts
var indexableTypeToResult = {
	mat2x2f: vec2f$1,
	mat3x3f: vec3f$1,
	mat4x4f: vec4f$1
};
function deriveIndexAccessOrigin(targetOrigin, indexOrigin) {
	if (targetOrigin === "constant-immutable-def") return indexOrigin === "constant" || indexOrigin === "constant-immutable-def" ? "constant-immutable-def" : "runtime-immutable-def";
	if (targetOrigin === "constant") return indexOrigin === "constant" || indexOrigin === "constant-immutable-def" ? "constant" : "runtime";
	return targetOrigin;
}
function accessIndex(target, indexArg) {
	const index = typeof indexArg === "number" ? coerceToSnippet(indexArg) : indexArg;
	const knownIndex = asComptime(index);
	if (isWgslArray(target.dataType) || isDisarray(target.dataType)) {
		const elementType = target.dataType.elementType;
		if (target.value instanceof ArrayExpression && knownIndex) return target.value.elements[knownIndex.value];
		const origin = deriveIndexAccessOrigin(target.origin, index.origin);
		const knownTarget = knownIndex && asComptime(target);
		return snip(knownTarget && knownIndex ? knownTarget.value[knownIndex.value] : stitch`${target}[${index}]`, elementType, origin, target.possibleSideEffects || index.possibleSideEffects);
	}
	if (isVec(target.dataType)) {
		const knownTarget = knownIndex && asComptime(target);
		return snip(knownTarget && knownIndex ? knownTarget.value[knownIndex.value] : stitch`${target}[${index}]`, target.dataType.primitive, deriveIndexAccessOrigin(target.origin, index.origin), target.possibleSideEffects || index.possibleSideEffects);
	}
	if (isPtr(target.dataType)) return accessIndex(derefSnippet(target), index);
	if (target.value instanceof MatrixColumnsAccess) {
		const propType = indexableTypeToResult[target.value.matrix.dataType.type];
		return snip(stitch`${target.value.matrix}[${index}]`, propType, deriveIndexAccessOrigin(target.origin, index.origin), target.possibleSideEffects || index.possibleSideEffects);
	}
	if (target.dataType.type in indexableTypeToResult) throw new Error("The only way of accessing matrix elements in TypeGPU functions is through the 'columns' property.");
	const knownTarget = knownIndex && asComptime(target);
	if (knownTarget && knownIndex) return coerceToSnippet(knownTarget.value[knownIndex.value]);
	if (typeof knownIndex?.value === "string") return accessProp(target, knownIndex.value);
}
//#endregion
//#region src/core/valueProxyUtils.ts
var valueProxyHandler = { get(target, prop) {
	if (prop in target) return Reflect.get(target, prop);
	if (prop === "toString" || prop === Symbol.toStringTag || prop === Symbol.toPrimitive) return () => target.toString();
	if (typeof prop === "symbol") return;
	const targetSnippet = getOwnSnippet(target);
	const index = Number(prop);
	if (!Number.isNaN(index)) {
		const accessed = accessIndex(targetSnippet, index);
		if (!accessed) return;
		return new Proxy({
			[$internal]: true,
			[$resolve]: (ctx) => ctx.resolveSnippet(accessed),
			[$ownSnippet]: accessed,
			[$comptimeValueOf]: runtimeOnly,
			toString: () => `${String(target)}[${prop}]`
		}, valueProxyHandler);
	}
	const accessed = accessProp(targetSnippet, String(prop));
	if (!accessed) return;
	return new Proxy({
		[$internal]: true,
		[$resolve]: (ctx) => ctx.resolveSnippet(accessed),
		[$ownSnippet]: accessed,
		[$comptimeValueOf]: runtimeOnly,
		toString: () => `${String(target)}.${prop}`
	}, valueProxyHandler);
} };
function getGpuValueRecursively(value) {
	let unwrapped = value;
	while (true) {
		const gpuValue = getGPUValue(unwrapped);
		if (!gpuValue) break;
		unwrapped = gpuValue;
	}
	return unwrapped;
}
//#endregion
//#region src/tgsl/makeDereferenceable.ts
/**
* WARNING: This is an API that touches a lot of internals, and is not stable
* (can change between patches). You should probably talk to the TypeGPU team
* before using this, maybe we can provide a better public API for your use case.
*
* Defines additional properties on `value` (mutates it) that makes TypeGPU
* understand how it should handle using .$ on that object. All dereferenceable
* value must also be made resolvable (through the makeResolvable API).
*
* `value` can in particular be the prototype of a class, meaning all instances
* of that class will be dereferenceable.
*/
function makeDereferenceable(value, options) {
	Object.defineProperty(value, $gpuValueOf, { get() {
		if ("get" in options.codegenMode) return options.codegenMode.get.apply(this);
		const resource = this;
		return new Proxy({
			[$internal]: true,
			get [$ownSnippet]() {
				if (!("getBaseSnippet" in options.codegenMode)) throw new Error(`Expected 'getBaseSnippet' to be defined.`);
				return options.codegenMode.getBaseSnippet.apply(resource, [this]);
			},
			[$comptimeValueOf]: runtimeOnly,
			[$resolve]: (ctx) => ctx.resolve(resource),
			toString: () => `${resource.toString()}.$`
		}, valueProxyHandler);
	} });
	Object.defineProperty(value, "$", {
		get() {
			const mode = getExecMode();
			if (mode.type === "codegen") return this[$gpuValueOf];
			if (mode.type === "simulate") {
				if (options.simulateMode?.get) return options.simulateMode.get.apply(this, [mode]);
				return options.normalMode.get.apply(this);
			}
			if (mode.type === "normal") return options.normalMode.get.apply(this);
			return assertExhaustive$1(mode, "makeDereferenceable.ts#$ (get)");
		},
		set(value) {
			const mode = getExecMode();
			if (mode.type === "normal") {
				if (!options.normalMode.set) throw new Error(`'${this.toString()}' cannot be set in normal mode`);
				options.normalMode.set.apply(this, [value]);
				return;
			}
			if (mode.type === "simulate") {
				if (options.simulateMode?.set) options.simulateMode.set.apply(this, [mode, value]);
				else if (options.normalMode.set) options.normalMode.set.apply(this, [value]);
				else throw new Error(`'${this.toString()}' cannot be set in simulate mode`);
				return;
			}
			if (mode.type === "codegen") throw new Error("Unreachable makeDerefenceable.ts#$ (set)");
			return assertExhaustive$1(mode, "makeDereferenceable.ts#$ (set)");
		}
	});
	return value;
}
//#endregion
//#region src/tgsl/makeResolvable.ts
/**
* WARNING: This is an API that touches a lot of internals, and is not stable
* (can change between patches). You should probably talk to the TypeGPU team
* before using this, maybe we can provide a better public API for your use case.
*
* Defines additional properties on `value` (mutates it) that makes TypeGPU
* understand how it should handle passing this object to the `tgpu.resolve`
* API, or just how to generate shader code from it to begin with.
*
* `value` can in particular be the prototype of a class, meaning all instances
* of that class will be resolvable.
*/
function makeResolvable(value, options) {
	if (!isMarkedInternal(value)) Object.defineProperty(value, $internal, {
		value: true,
		writable: true
	});
	Object.defineProperty(value, "toString", { value() {
		return options.asString.apply(this);
	} });
	Object.defineProperty(value, $resolve, { value(ctx) {
		return options.resolve.apply(this, [ctx]);
	} });
	return value;
}
//#endregion
//#region src/core/constant/tgpuConstant.ts
function constant(dataType, value) {
	if (!isData(dataType)) {
		if (!Array.isArray(value)) throw new Error(`Expected an array value for a partially-applied array schema, but received: ${typeof value}.`);
		return new TgpuConstImpl(dataType(value.length), value);
	}
	return new TgpuConstImpl(dataType, value);
}
function deepFreeze(object) {
	const propNames = Reflect.ownKeys(object);
	for (const name of propNames) {
		const value = object[name];
		if (value && typeof value === "object" || typeof value === "function") deepFreeze(value);
	}
	return Object.freeze(object);
}
var TgpuConstImpl = class TgpuConstImpl {
	[$soul];
	static {
		TgpuConstImpl.prototype[$internal] = {};
		TgpuConstImpl.prototype.resourceType = "const";
		makeDereferenceable(makeResolvable(TgpuConstImpl.prototype, {
			asString() {
				return `const:${getName(this) ?? "<unnamed>"}`;
			},
			resolve(ctx) {
				const id = ctx.makeUniqueIdentifier(getName(this), "global");
				return ctx.gen.declareGlobalConst({
					id,
					dataType: this.dataType,
					init: snip(this[$soul].value, this.dataType, "constant")
				});
			}
		}), {
			codegenMode: { getBaseSnippet(trackingProxy) {
				return snip(trackingProxy, this.dataType, "constant-immutable-def", false);
			} },
			normalMode: { get() {
				return this[$soul].value;
			} }
		});
	}
	constructor(dataType, value) {
		this[$soul] = {
			type: "const",
			dataType,
			value: value && typeof value === "object" ? deepFreeze(value) : value,
			label: void 0
		};
	}
	get dataType() {
		return this[$soul].dataType;
	}
	$name(label) {
		setName(this, label);
		return this;
	}
};
//#endregion
//#region src/core/resolve/externals.ts
function isResolvable(value) {
	return isWgsl(value) || isLooseData(value) || hasTinyestMetadata(value);
}
/**
* Merges function externals into one map.
*/
function mergeFunctionExternals(fnExternals) {
	const base = fnExternals.pluginProvided ?? fnExternals.userProvided ?? {};
	const result = Object.defineProperties({}, Object.getOwnPropertyDescriptors(base));
	for (const flatExternal of [fnExternals.args, fnExternals.out].filter((e) => e !== void 0)) for (const [key, value] of Object.entries(flatExternal)) {
		if (key in result && result[key] !== value) throw new Error(`Key '${key}' appears in externals despite already being used for argument/return type. Please rename this external.`);
		result[key] = value;
	}
	return result;
}
function addArgTypesToExternals(implementation, argTypes, core) {
	const argTypeNames = [...implementation.matchAll(/:\s*(?<arg>.*?)\s*[,)]/g)].map((found) => found?.[1]);
	const args = Object.fromEntries(argTypes.flatMap((argType, i) => {
		const argTypeName = argTypeNames?.[i];
		return isWgslStruct(argType) && argTypeName !== void 0 ? [[argTypeName, argType]] : [];
	}));
	core.setExternals("args", args);
}
function addReturnTypeToExternals(implementation, returnType, core) {
	const matched = implementation.match(/->\s(?<output>[\w\d_]+)\s{/);
	const outputName = matched ? matched[1]?.trim() : void 0;
	if (isWgslStruct(returnType) && outputName && !/\s/g.test(outputName)) core.setExternals("out", { [outputName]: returnType });
}
var anyIdent = /([$_\p{XID_Start}][$\p{XID_Continue}]*)/u;
var anyPropChain = new RegExp(`(${anyIdent.source})(\\.${anyIdent.source})*`, "ug");
var boundedPropChain = new RegExp(`(?<![\\p{XID_Continue}\\$.])${anyPropChain.source}(?![\\p{XID_Continue}\\$])`, "ug");
/**
* Replaces all occurrences of external names in WGSL code with their resolved values.
* It adds all necessary definitions to the resolution context.
* @param ctx - The resolution context.
* @param externalMap - The external map. Assumes that keys don't contain dots.
* @param wgsl - The WGSL code.
*
* @returns The WGSL code with all external names replaced with their resolved values.
*/
function replaceExternalsInWgsl(ctx, externalMap, wgsl) {
	const keys = Object.keys(externalMap);
	if (keys.length === 0) return wgsl;
	const maybeInvalidKey = keys.find((key) => key.includes("."));
	if (maybeInvalidKey) throw new Error(`External key '${maybeInvalidKey}' contains invalid character '.'`);
	return wgsl.replaceAll(boundedPropChain, (match) => {
		const chain = match.split(".");
		if (!Object.hasOwn(externalMap, chain.at(0))) return match;
		let currentItem = externalMap;
		let suffix = "";
		for (const [i, elem] of chain.entries()) {
			currentItem = currentItem[elem];
			if (isResolvable(currentItem) || typeof currentItem === "string") {
				suffix = chain.slice(i + 1).map((s) => `.${s}`).join("");
				if (isNamable(currentItem) && getName(currentItem) === void 0) setName(currentItem, chain.slice(0, i + 1).join("_"));
				break;
			}
			if (typeof currentItem !== "object" || currentItem === null || i === chain.length - 1) {
				logger.warn("external-omitted", `During resolution, the external '${chain.slice(0, i + 1).join(".")}' has been omitted. Only TGPU resources, 'use gpu' functions, primitives, and plain JS objects can be used as externals.`);
				return match;
			}
		}
		return ctx.resolve(currentItem).value + suffix;
	});
}
//#endregion
//#region src/core/resolve/resolvableString.ts
var ResolvableString = class {
	[$internal] = true;
	#value;
	constructor(value) {
		this.#value = value;
	}
	[$resolve]() {
		return snip(this.#value, UnknownData, "runtime", true);
	}
};
//#endregion
//#region src/core/whitespaces.ts
var lineBreaks = new Set([
	"\n",
	"\v",
	"\f",
	"\r",
	"",
	"\u2028",
	"\u2029"
]);
var blankSpaces = new Set([
	...lineBreaks,
	" ",
	"	",
	"‎",
	"‏"
]);
//#endregion
//#region src/core/function/extractArgs.ts
/**
* Extracts info about arguments of a given WGSL function string.
* @example
* const code = `
*   fn add(a: i32, ＠location(0) b: i32, c) -> i32 {
*     return a + b + c;
*   }`;
*
* extractArgs(code);
* // {
* //   args: [
* //     { identifier: 'a', attributes: [], type: 'i32' },
* //     { identifier: 'b', attributes: ['＠location(0)'], type: 'i32' },
* //     { identifier: 'c', attributes: [], type: undefined }
* //   ],
* //   ret: { type: 'i32', attributes: [] },
* //   range: { begin: 11, end: 51 }
* // }
*/
function extractArgs(rawCode) {
	const { strippedCode, argRange: range } = strip(rawCode);
	const code = new ParsableString(strippedCode);
	code.consume("(");
	const args = [];
	while (!code.isAt(")")) {
		const attributes = [];
		while (code.isAt("@")) {
			code.parseUntil(closingParenthesis, parentheses);
			code.consume(")");
			attributes.push(code.lastParsed);
		}
		code.parseUntil(identifierEndSymbols);
		const identifier = code.lastParsed;
		let maybeType;
		if (code.isAt(":")) {
			code.consume(":");
			code.parseUntil(typeEndSymbols, angleBrackets);
			maybeType = code.lastParsed;
		}
		args.push({
			identifier,
			attributes,
			type: maybeType
		});
		if (code.isAt(",")) code.consume(",");
	}
	code.consume(")");
	let maybeRet;
	if (code.isAt("->")) {
		code.consume("->");
		const attributes = [];
		while (code.isAt("@")) {
			code.parseUntil(closingParenthesis, parentheses);
			code.consume(")");
			attributes.push(code.lastParsed);
		}
		maybeRet = {
			type: code.str.slice(code.pos),
			attributes
		};
	}
	return {
		args,
		ret: maybeRet,
		range: {
			begin: range[0],
			end: range[1]
		}
	};
}
/**
* Strips comments, whitespaces, the name and the body of the function.
* @example
* const code = `
*    fn add( a,  // first argument
*            ＠location(0) b : i32 ) -> i32   {
*        return a + b; // returns the sum
*  }`;
*
* strip(code); // "(a,@location(0)b:i32)->i32"
*/
function strip(rawCode) {
	const code = new ParsableString(rawCode);
	let strippedCode = "";
	let argsStart;
	while (!code.isFinished()) {
		if (code.isAt(blankSpaces)) {
			code.advanceBy(1);
			continue;
		}
		if (code.isAt("//")) {
			code.consume("//");
			code.parseUntil(lineBreaks);
			code.advanceBy(1);
			continue;
		}
		if (code.isAt("/*")) {
			code.parseUntil(openingCommentBlock, commentBlocks);
			code.consume("*/");
			continue;
		}
		if (code.isAt("{")) return {
			strippedCode,
			argRange: [argsStart, code.pos]
		};
		if (code.isAt("(") && argsStart === void 0) argsStart = code.pos;
		if (argsStart !== void 0) strippedCode += code.str[code.pos];
		code.advanceBy(1);
	}
	throw new Error("Invalid wgsl code!");
}
var ParsableString = class {
	str;
	#parseStartPos;
	#pos;
	constructor(str) {
		this.str = str;
		this.#pos = 0;
	}
	get pos() {
		return this.#pos;
	}
	/**
	* This property is equivalent to the substring of `this.str`
	* from the position of the last `parseUntil` call, to the current position.
	*/
	get lastParsed() {
		if (this.#parseStartPos === void 0) throw new Error("Parse was not called yet!");
		return this.str.slice(this.#parseStartPos, this.pos);
	}
	isFinished() {
		return this.#pos >= this.str.length;
	}
	isAt(substr) {
		if (typeof substr === "string") {
			for (let i = 0; i < substr.length; i++) if (this.str[this.#pos + i] !== substr[i]) return false;
			return true;
		}
		for (const elem of substr) if (this.isAt(elem)) return true;
		return false;
	}
	/**
	* @param toFind a set of strings either of which satisfy the search.
	* @param brackets a pair of brackets that has to be closed for result to be valid. This includes the found character(s).
	* @example
	* // internal state:
	* // '(@attribute(0) identifier: type)'
	* //   ^
	* this.parse(new Set(')'), ['(', ')']);
	* // internal state:
	* // '(@attribute(0) identifier: type)'
	* //               ^
	*/
	parseUntil(toFind, brackets) {
		this.#parseStartPos = this.#pos;
		let openedBrackets = 0;
		while (this.#pos < this.str.length) {
			if (brackets && this.isAt(brackets[0])) openedBrackets += 1;
			if (brackets && this.isAt(brackets[1])) openedBrackets -= 1;
			if (openedBrackets === 0) {
				if (this.isAt(toFind)) return this.#pos;
			}
			this.#pos += 1;
		}
		throw new Error("Reached the end of the string without finding a match!");
	}
	advanceBy(steps) {
		this.#pos += steps;
	}
	consume(str) {
		if (!this.isAt(str)) throw new Error(`Expected '${str}' at position ${this.#pos}, but found '${this.str.slice(this.#pos, this.#pos + str.length)}'`);
		this.advanceBy(str.length);
	}
};
var closingParenthesis = new Set([")"]);
var identifierEndSymbols = new Set([
	":",
	",",
	")"
]);
var typeEndSymbols = new Set([",", ")"]);
var openingCommentBlock = new Set(["*/"]);
var parentheses = ["(", ")"];
var angleBrackets = ["<", ">"];
var commentBlocks = ["/*", "*/"];
//#endregion
//#region src/core/function/fnCore.ts
function createFnCore(implementation, functionType, workgroupSize) {
	/**
	* External application has to be deferred until resolution because
	* some externals can reference the owner function which has not been
	* initialized yet (like when accessing the Output struct of a vertex
	* entry fn).
	*/
	const externals = {};
	return {
		[$getNameForward]: typeof implementation === "function" ? implementation : void 0,
		setExternals(key, newExternal) {
			if (key === "userProvided" && "userProvided" in externals) throw new Error("Cannot call '$uses' multiple times. If you wish to override dependencies, use slots or accessors instead.");
			externals[key] = newExternal;
			if (externals.userProvided && externals.pluginProvided) throw new Error("Cannot call '$uses' on functions whose metadata was provided by unplugin-typegpu.");
		},
		resolve(ctx, argTypes, returnType, entryInput) {
			let attributes = "";
			if (functionType === "compute") attributes = `@compute @workgroup_size(${workgroupSize?.join(", ")}) `;
			else if (functionType === "vertex") attributes = `@vertex `;
			else if (functionType === "fragment") attributes = `@fragment `;
			const id = ctx.makeUniqueIdentifier(getName(this), "global");
			if (typeof implementation === "string") {
				if (!returnType) throw new Error("Explicit return type is required for string implementation");
				if (entryInput) {
					for (const arg of entryInput.positionalArgs) {
						const result = /* @__PURE__ */ validateIdentifier(arg.schemaKey);
						if (!result.success) throw new Error(`Invalid argument name "${arg.schemaKey}"${result.error ? `: ${result.error}` : ""}`);
						if (ctx.isIdentifierBanned(arg.schemaKey)) throw new Error(`Invalid argument name "${arg.schemaKey}", the identifier is a reserved keyword.`);
					}
					this.setExternals("args", { in: Object.fromEntries(entryInput.positionalArgs.map((a) => [a.schemaKey, new ResolvableString(a.schemaKey)])) });
				}
				const replacedImpl = replaceExternalsInWgsl(ctx, mergeFunctionExternals(externals), implementation);
				let header = "";
				let body = "";
				if (functionType !== "normal" && entryInput) {
					const { dataSchema, positionalArgs } = entryInput;
					const parts = [];
					if (dataSchema && isArgUsedInBody("in", replacedImpl)) parts.push(`in: ${ctx.resolve(dataSchema).value}`);
					for (const a of positionalArgs) {
						const argName = a.schemaKey;
						if (isArgUsedInBody(argName, replacedImpl)) parts.push(`${getAttributesString(a.type)}${argName}: ${ctx.resolve(a.type).value}`);
					}
					const input = `(${parts.join(", ")})`;
					const attributes = isWgslData(returnType) ? getAttributesString(returnType) : "";
					header = `${input}${returnType !== Void ? isWgslStruct(returnType) ? ` -> ${ctx.resolve(returnType).value} ` : ` -> ${attributes !== "" ? attributes : "@location(0)"} ${ctx.resolve(returnType).value} ` : " "}`;
					body = replacedImpl;
				} else {
					const providedArgs = extractArgs(replacedImpl);
					if (providedArgs.args.length !== argTypes.length) throw new Error(`WGSL implementation has ${providedArgs.args.length} arguments, while the shell has ${argTypes.length} arguments.`);
					header = `(${providedArgs.args.map((argInfo, i) => `${argInfo.identifier}: ${checkAndReturnType(ctx, `parameter ${argInfo.identifier}`, argInfo.type, argTypes[i])}`).join(", ")})${returnType === Void ? " " : ` -> ${checkAndReturnType(ctx, "return type", providedArgs.ret?.type, returnType)} `}`;
					body = replacedImpl.slice(providedArgs.range.end);
				}
				ctx.addDeclaration(`${attributes}fn ${id}${header}${body}`, id);
				return snip(id, returnType, "runtime");
			}
			const pluginData = getFunctionMetadata(implementation);
			const pluginExternals = pluginData?.externals();
			if (pluginExternals) this.setExternals("pluginProvided", pluginExternals);
			const ast = pluginData?.ast;
			if (!ast) throw new Error("Missing metadata for tgpu.fn function body (either missing 'use gpu' directive, or misconfigured `unplugin-typegpu`)");
			const maybeSecondArg = ast.params[1];
			if (maybeSecondArg && maybeSecondArg.type === "i" && functionType !== "normal") this.setExternals("out", { [maybeSecondArg.name]: undecorate(returnType) });
			const { code, returnType: actualReturnType } = ctx.resolveFunction({
				functionType,
				name: id,
				workgroupSize,
				argTypes,
				entryInput,
				params: ast.params,
				returnType,
				body: ast.body,
				externalMap: mergeFunctionExternals(externals)
			});
			ctx.addDeclaration(code, id);
			return snip(id, actualReturnType, "runtime");
		}
	};
}
function isArgUsedInBody(argName, body) {
	return new RegExp(`\\b${argName}\\b`).test(body);
}
function checkAndReturnType(ctx, name, wgslType, jsType) {
	const resolvedJsType = ctx.resolve(jsType).value.replace(/\s/g, "");
	if (!wgslType) return resolvedJsType;
	const resolvedWgslType = wgslType.replace(/\s/g, "");
	if (resolvedWgslType !== resolvedJsType) throw new Error(`Type mismatch between TGPU shell and WGSL code string: ${name}, JS type "${resolvedJsType}", WGSL type "${resolvedWgslType}".`);
	return wgslType;
}
//#endregion
//#region src/core/function/templateUtils.ts
function stripTemplate(arg, ...values) {
	return isTemplateStringsArray(arg) ? templateLiteralIdentity(arg, ...values) : arg;
}
function isTemplateStringsArray(value) {
	return Array.isArray(value) && "raw" in value && Array.isArray(value.raw) && value.raw.every((item) => typeof item === "string");
}
function templateLiteralIdentity(strings, ...values) {
	return strings.slice(1).reduce((acc, elem, index) => `${acc}${values[index]}${elem}`, strings[0]);
}
//#endregion
//#region src/core/root/configurableImpl.ts
var ConfigurableImpl = class ConfigurableImpl {
	bindings;
	constructor(bindings) {
		this.bindings = bindings;
	}
	with(slot, value) {
		return new ConfigurableImpl([...this.bindings, [isAccessor(slot) || isMutableAccessor(slot) ? slot.slot : slot, value]]);
	}
	pipe(transform) {
		return transform(this);
	}
};
//#endregion
//#region src/core/function/tgpuFn.ts
function fn(argTypesOrCallback, returnType) {
	if (typeof argTypesOrCallback === "function") return createGenericFn(argTypesOrCallback, []);
	const argTypes = argTypesOrCallback;
	const shell = {
		[$internal]: true,
		argTypes,
		returnType: returnType ?? Void
	};
	const call = (arg, ...values) => createFn(shell, stripTemplate(arg, ...values));
	return Object.assign(call, shell);
}
function isTgpuFn(value) {
	return isMarkedInternal(value) && value?.resourceType === "function";
}
function isGenericFn(value) {
	return isMarkedInternal(value) && value?.resourceType === "generic-function";
}
function stringifyPair([slot, value]) {
	return `${getName(slot) ?? "<unnamed>"}=${value}`;
}
function bindingsOf(transform) {
	return transform(new ConfigurableImpl([])).bindings;
}
function createFn(shell, _implementation) {
	let pairs = [];
	let implementation;
	if (isGenericFn(_implementation)) {
		pairs = _implementation[$providing]?.pairs ?? [];
		implementation = _implementation[$internal].inner;
	} else implementation = _implementation;
	const core = createFnCore(implementation, "normal");
	const fnBase = {
		shell,
		resourceType: "function",
		[$internal]: { implementation },
		$uses(newExternals) {
			core.setExternals("userProvided", newExternals);
			return this;
		},
		[$getNameForward]: core,
		$name(label) {
			setName(this, label);
			return this;
		},
		with: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(comptime((slot, value) => {
			return createBoundFunction(fn, [[isAccessor(slot) || isMutableAccessor(slot) ? slot.slot : slot, value]]);
		}), "with"),
		pipe: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(comptime((transform) => createBoundFunction(fn, bindingsOf(transform))), "pipe"),
		[$resolve](ctx) {
			if (typeof implementation === "string") {
				addArgTypesToExternals(implementation, shell.argTypes, core);
				addReturnTypeToExternals(implementation, shell.returnType, core);
			}
			return core.resolve(ctx, shell.argTypes, shell.returnType);
		}
	};
	const call = /* @__PURE__ */ dualImpl({
		name: void 0,
		noComptime: true,
		signature: {
			argTypes: shell.argTypes,
			returnType: shell.returnType
		},
		normalImpl: (...args) => provideInsideTgpuFn(() => {
			try {
				if (typeof implementation === "string") throw new Error("Cannot execute on the CPU functions constructed with raw WGSL");
				const castAndCopiedArgs = args.map((arg, index) => schemaCallWrapper(shell.argTypes[index], arg));
				const result = implementation(...castAndCopiedArgs);
				return schemaCallWrapper(shell.returnType, result);
			} catch (err) {
				if (err instanceof ExecutionError) throw err.appendToTrace(fn);
				throw new ExecutionError(err, [fn]);
			}
		}),
		codegenImpl: (ctx, args) => ctx.withResetIndentLevel(() => stitch`${ctx.resolve(fn).value}(${args})`),
		sideEffects: true
	});
	const fn = Object.assign(call, fnBase);
	Object.defineProperty(fn, "toString", { value() {
		return `fn:${getName(core) ?? "<unnamed>"}`;
	} });
	if (pairs.length > 0) return createBoundFunction(fn, pairs);
	return fn;
}
function createBoundFunction(innerFn, pairs) {
	const fnBase = {
		resourceType: "function",
		shell: innerFn.shell,
		[$internal]: { implementation: innerFn[$internal].implementation },
		[$providing]: {
			inner: innerFn,
			pairs
		},
		$uses(newExternals) {
			innerFn.$uses(newExternals);
			return this;
		},
		$name(label) {
			setName(this, label);
			return this;
		},
		with: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(comptime((slot, value) => {
			const s = isAccessor(slot) || isMutableAccessor(slot) ? slot.slot : slot;
			return createBoundFunction(innerFn, [...pairs, [s, value]]);
		}), "with"),
		pipe: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(comptime((transform) => createBoundFunction(innerFn, [...pairs, ...bindingsOf(transform)])), "pipe")
	};
	const call = /* @__PURE__ */ dualImpl({
		name: void 0,
		noComptime: true,
		signature: {
			argTypes: innerFn.shell.argTypes,
			returnType: innerFn.shell.returnType
		},
		normalImpl: innerFn,
		codegenImpl: (ctx, args) => ctx.withResetIndentLevel(() => stitch`${ctx.resolve(fn).value}(${args})`),
		sideEffects: true
	});
	const fn = Object.assign(call, fnBase);
	Object.defineProperty(fn, "toString", { value() {
		return `fn:${getName(this) ?? "<unnamed>"}[${pairs.map(stringifyPair).join(", ")}]`;
	} });
	const innerName = getName(innerFn);
	if (innerName) setName(fn, innerName);
	return fn;
}
function createGenericFn(inner, pairs) {
	const fnBase = {
		[$internal]: { inner },
		resourceType: "generic-function",
		[$providing]: pairs.length > 0 ? {
			inner,
			pairs
		} : void 0,
		$name(label) {
			setName(this, label);
			if (!getName(inner)) setName(inner, label);
			return this;
		},
		[$resolve](ctx) {
			return ctx.resolve(inner);
		},
		with: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(comptime((slot, value) => {
			const s = isAccessor(slot) || isMutableAccessor(slot) ? slot.slot : slot;
			return createGenericFn(inner, [...pairs, [s, value]]);
		}), "with"),
		pipe: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(comptime((transform) => createGenericFn(inner, [...pairs, ...bindingsOf(transform)])), "pipe")
	};
	const call = (...args) => {
		return inner(...args);
	};
	const genericFn = Object.assign(call, fnBase);
	const innerName = getName(inner);
	if (innerName) setName(genericFn, innerName);
	Object.defineProperty(genericFn, "toString", { value() {
		const fnLabel = getName(genericFn) ?? "<unnamed>";
		if (pairs.length > 0) return `fn*:${fnLabel}[${pairs.map(stringifyPair).join(", ")}]`;
		return `fn*:${fnLabel}`;
	} });
	return genericFn;
}
//#endregion
//#region src/data/array.ts
/**
* Creates an array schema that can be used to construct gpu buffers.
* Describes arrays with fixed-size length, storing elements of the same type.
*
* The only decoration allowed on element types is `d.location`. Decorators like
* `d.align` and `d.size` cannot be applied directly — wrap them in a struct instead,
* e.g. `d.arrayOf(d.struct({ value: d.align(16, d.u32) }), n)`.
*
* @example
* const LENGTH = 3;
* const array = d.arrayOf(d.u32, LENGTH);
*
* If `elementCount` is not specified, a partially applied function is returned.
* @example
* const array = d.arrayOf(d.vec3f);
* //    ^? (n: number) => WgslArray<d.Vec3f>
*
* @param elementType The type of elements in the array.
* @param elementCount The number of elements in the array.
* @throws If `elementType` is decorated with anything other than `d.location`.
*/
var arrayOf = comptime(((elementType, elementCount) => {
	if (isDecorated(elementType) && !elementType.attribs.every(isLocationAttrib)) throw new Error("Arrays cannot hold decorated types other than @location. Wrap it in a struct instead, e.g. d.arrayOf(d.struct({ value: d.align(16, d.u32) }), n).");
	if (elementCount === void 0) return comptime((count) => cpu_arrayOf(elementType, count));
	return cpu_arrayOf(elementType, elementCount);
})).$name("arrayOf");
function cpu_arrayOf(elementType, elementCount) {
	const arraySchema = (elements) => {
		if (elements && elements.length !== elementCount) throw new Error(`Array schema of ${elementCount} elements of type ${elementType.type} called with ${elements.length} argument(s).`);
		return Array.from({ length: elementCount }, (_, i) => schemaCallWrapper(elementType, elements?.[i]));
	};
	Object.setPrototypeOf(arraySchema, WgslArrayImpl);
	if (Number.isNaN(sizeOf(elementType))) throw new Error("Cannot nest runtime sized arrays.");
	arraySchema.elementType = elementType;
	if (!Number.isInteger(elementCount) || elementCount < 0) throw new Error(`Cannot create array schema with invalid element count: ${elementCount}.`);
	arraySchema.elementCount = elementCount;
	return arraySchema;
}
var WgslArrayImpl = {
	[$internal]: true,
	type: "array",
	toString() {
		return `arrayOf(${String(this.elementType)}, ${this.elementCount})`;
	}
};
//#endregion
//#region src/std/numeric.ts
var unaryIdentitySignature = (arg) => {
	return {
		argTypes: [arg],
		returnType: arg
	};
};
var variadicUnifySignature = (...args) => {
	const uargs = unify(args) ?? args;
	return {
		argTypes: uargs,
		returnType: uargs[0]
	};
};
/* @__NO_SIDE_EFFECTS__ */
function unifyRestrictedSignature(restrict) {
	return (...args) => {
		const uargs = unify(args, restrict);
		if (!uargs) throw new SignatureNotSupportedError(args, restrict);
		return {
			argTypes: uargs,
			returnType: uargs[0]
		};
	};
}
function variadicReduce(fn) {
	return (fst, ...rest) => {
		let acc = fst;
		for (const r of rest) acc = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn(acc, r), "acc");
		return acc;
	};
}
function variadicStitch(wrapper) {
	return (_ctx, [fst, ...rest]) => {
		let acc = stitch`${fst}`;
		for (const r of rest) acc = stitch`${wrapper}(${acc}, ${r})`;
		return acc;
	};
}
var anyFloatPrimitive = [
	f32,
	f16,
	abstractFloat
];
var anyFloatVec = [
	vec2f$1,
	vec3f$1,
	vec4f$1,
	vec2h$1,
	vec3h$1,
	vec4h$1
];
var anyFloat = [...anyFloatPrimitive, ...anyFloatVec];
var anyConcreteIntegerPrimitive = [i32, u32];
var anyConcreteIntegerVec = [
	vec2i$1,
	vec3i$1,
	vec4i$1,
	vec2u$1,
	vec3u$1,
	vec4u$1
];
var anyConcreteInteger = [...anyConcreteIntegerPrimitive, ...anyConcreteIntegerVec];
function cpuAbs(value) {
	assertKind(value, numericKind);
	return generalizeFn(Math.abs, [value]);
}
var abs = /* @__PURE__ */ dualImpl({
	name: "abs",
	signature: unaryIdentitySignature,
	normalImpl: cpuAbs,
	codegenImpl: (_ctx, [value]) => stitch`abs(${value})`,
	sideEffects: false
});
function cpuAcos(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.acos, [value]);
}
var acos = /* @__PURE__ */ dualImpl({
	name: "acos",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuAcos,
	codegenImpl: (_ctx, [value]) => stitch`acos(${value})`,
	sideEffects: false
});
function cpuAcosh(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.acosh, [value]);
}
var acosh = /* @__PURE__ */ dualImpl({
	name: "acosh",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuAcosh,
	codegenImpl: (_ctx, [value]) => stitch`acosh(${value})`,
	sideEffects: false
});
function cpuAsin(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.asin, [value]);
}
var asin = /* @__PURE__ */ dualImpl({
	name: "asin",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuAsin,
	codegenImpl: (_ctx, [value]) => stitch`asin(${value})`,
	sideEffects: false
});
function cpuAsinh(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.asinh, [value]);
}
var asinh = /* @__PURE__ */ dualImpl({
	name: "asinh",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuAsinh,
	codegenImpl: (_ctx, [value]) => stitch`asinh(${value})`,
	sideEffects: false
});
function cpuAtan(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.atan, [value]);
}
var atan = /* @__PURE__ */ dualImpl({
	name: "atan",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuAtan,
	codegenImpl: (_ctx, [value]) => stitch`atan(${value})`,
	sideEffects: false
});
function cpuAtanh(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.atanh, [value]);
}
var atanh = /* @__PURE__ */ dualImpl({
	name: "atanh",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuAtanh,
	codegenImpl: (_ctx, [value]) => stitch`atanh(${value})`,
	sideEffects: false
});
function cpuAtan2(y, x) {
	assertKind([y, x], floatKind);
	assertEqualKinds(y, x);
	return generalizeFn(Math.atan2, [y, x]);
}
var atan2 = /* @__PURE__ */ dualImpl({
	name: "atan2",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuAtan2,
	codegenImpl: (_ctx, [y, x]) => stitch`atan2(${y}, ${x})`,
	sideEffects: false
});
function cpuCeil(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.ceil, [value]);
}
var ceil = /* @__PURE__ */ dualImpl({
	name: "ceil",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuCeil,
	codegenImpl: (_ctx, [value]) => stitch`ceil(${value})`,
	sideEffects: false
});
function cpuCos(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.cos, [value]);
}
var cos = /* @__PURE__ */ dualImpl({
	name: "cos",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuCos,
	codegenImpl: (_ctx, [value]) => stitch`cos(${value})`,
	sideEffects: false
});
function cpuCosh(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.cosh, [value]);
}
var cosh = /* @__PURE__ */ dualImpl({
	name: "cosh",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuCosh,
	codegenImpl: (_ctx, [value]) => stitch`cosh(${value})`,
	sideEffects: false
});
var countLeadingZeros = /* @__PURE__ */ dualImpl({
	name: "countLeadingZeros",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyConcreteInteger),
	normalImpl: "CPU implementation for countLeadingZeros not implemented yet. Please submit an issue at https://github.com/software-mansion/TypeGPU/issues",
	codegenImpl: (_ctx, [value]) => stitch`countLeadingZeros(${value})`,
	sideEffects: false
});
function cpuExp(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.exp, [value]);
}
var exp = /* @__PURE__ */ dualImpl({
	name: "exp",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuExp,
	codegenImpl: (_ctx, [value]) => stitch`exp(${value})`,
	sideEffects: false
});
function cpuFloor(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.floor, [value]);
}
var floor = /* @__PURE__ */ dualImpl({
	name: "floor",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuFloor,
	codegenImpl: (_ctx, [arg]) => stitch`floor(${arg})`,
	sideEffects: false
});
function cpuLog(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.log, [value]);
}
var log = /* @__PURE__ */ dualImpl({
	name: "log",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuLog,
	codegenImpl: (_ctx, [value]) => stitch`log(${value})`,
	sideEffects: false
});
function cpuLog2(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.log2, [value]);
}
var log2 = /* @__PURE__ */ dualImpl({
	name: "log2",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuLog2,
	codegenImpl: (_ctx, [value]) => stitch`log2(${value})`,
	sideEffects: false
});
function cpuMax(a, b) {
	assertKind([a, b], numericKind);
	assertEqualKinds(a, b);
	return generalizeFn(Math.max, [a, b]);
}
var max = /* @__PURE__ */ dualImpl({
	name: "max",
	signature: variadicUnifySignature,
	normalImpl: variadicReduce(cpuMax),
	codegenImpl: variadicStitch("max"),
	sideEffects: false
});
function cpuMin(a, b) {
	assertKind([a, b], numericKind);
	assertEqualKinds(a, b);
	return generalizeFn(Math.min, [a, b]);
}
var min = /* @__PURE__ */ dualImpl({
	name: "min",
	signature: variadicUnifySignature,
	normalImpl: variadicReduce(cpuMin),
	codegenImpl: variadicStitch("min"),
	sideEffects: false
});
function powCpu(base, exponent) {
	assertKind([base, exponent], floatKind);
	assertEqualKinds(base, exponent);
	return generalizeFn((a, b) => a ** b, [base, exponent]);
}
var pow = /* @__PURE__ */ dualImpl({
	name: "pow",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: powCpu,
	codegenImpl: (_ctx, [lhs, rhs]) => stitch`pow(${lhs}, ${rhs})`,
	sideEffects: false
});
function cpuSign(e) {
	assertKind(e, signedKind);
	return generalizeFn(Math.sign, [e]);
}
var sign = /* @__PURE__ */ dualImpl({
	name: "sign",
	signature: (arg) => {
		const candidates = [
			...anyFloat,
			i32,
			vec2i$1,
			vec3i$1,
			vec4i$1
		];
		const uarg = unify([arg], candidates)?.[0];
		if (!uarg) throw new SignatureNotSupportedError([arg], candidates);
		return {
			argTypes: [uarg],
			returnType: uarg
		};
	},
	normalImpl: cpuSign,
	codegenImpl: (_ctx, [e]) => stitch`sign(${e})`,
	sideEffects: false
});
function cpuSin(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.sin, [value]);
}
var sin = /* @__PURE__ */ dualImpl({
	name: "sin",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuSin,
	codegenImpl: (_ctx, [value]) => stitch`sin(${value})`,
	sideEffects: false
});
function cpuSinh(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.sinh, [value]);
}
var sinh = /* @__PURE__ */ dualImpl({
	name: "sinh",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuSinh,
	codegenImpl: (_ctx, [value]) => stitch`sinh(${value})`,
	sideEffects: false
});
function cpuSqrt(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.sqrt, [value]);
}
var sqrt = /* @__PURE__ */ dualImpl({
	name: "sqrt",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuSqrt,
	codegenImpl: (_ctx, [value]) => stitch`sqrt(${value})`,
	sideEffects: false
});
function cpuTan(value) {
	assertKind(value, floatKind);
	if (typeof value === "number") return Math.tan(value);
	throw new MissingCpuImplError("CPU implementation for tan on vectors not implemented yet. Please submit an issue at https://github.com/software-mansion/TypeGPU/issues");
}
var tan = /* @__PURE__ */ dualImpl({
	name: "tan",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuTan,
	codegenImpl: (_ctx, [value]) => stitch`tan(${value})`,
	sideEffects: false
});
function cpuTanh(value) {
	assertKind(value, floatKind);
	return generalizeFn(Math.tanh, [value]);
}
var tanh = /* @__PURE__ */ dualImpl({
	name: "tanh",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: cpuTanh,
	codegenImpl: (_ctx, [value]) => stitch`tanh(${value})`,
	sideEffects: false
});
var trunc = /* @__PURE__ */ dualImpl({
	name: "trunc",
	signature: /* @__PURE__ */ unifyRestrictedSignature(anyFloat),
	normalImpl: "CPU implementation for trunc not implemented yet. Please submit an issue at https://github.com/software-mansion/TypeGPU/issues",
	codegenImpl: (_ctx, [value]) => stitch`trunc(${value})`,
	sideEffects: false
});
//#endregion
//#region src/std/boolean.ts
function correspondingBooleanVectorSchema(dataType) {
	if (dataType.type.includes("2")) return vec2b$1;
	if (dataType.type.includes("3")) return vec3b$1;
	return vec4b$1;
}
/**
* Checks whether `lhs == rhs` on all components.
* Equivalent to `all(eq(lhs, rhs))`.
* @example
* allEq(vec2f(0.0, 1.0), vec2f(0.0, 2.0)) // returns false
* allEq(vec3u(0, 1, 2), vec3u(0, 1, 2)) // returns true
*/
var allEq = /* @__PURE__ */ dualImpl({
	name: "allEq",
	signature: (...argTypes) => ({
		argTypes,
		returnType: bool
	}),
	normalImpl: (lhs, rhs) => cpuAll(cpuEq(lhs, rhs)),
	codegenImpl: (ctx, [lhs, rhs]) => stitch`all(${ctx.gen.emitBinaryOp(lhs, "==", rhs)})`,
	sideEffects: false
});
var cpuEq = (lhs, rhs) => {
	assertKind([lhs, rhs], numericOrBooleanKind);
	assertEqualKinds(lhs, rhs);
	return generalizeBoolFn((a, b) => a === b, [lhs, rhs]);
};
/**
* Checks **component-wise** whether `lhs == rhs`.
* This function does **not** return `bool`, for that use-case, wrap the result in `all`, or use `allEq`.
* @example
* eq(vec2f(0.0, 1.0), vec2f(0.0, 2.0)) // returns vec2b(true, false)
* eq(vec3u(0, 1, 2), vec3u(2, 1, 0)) // returns vec3b(false, true, false)
* all(eq(vec4i(4, 3, 2, 1), vec4i(4, 3, 2, 1))) // returns true
* allEq(vec4i(4, 3, 2, 1), vec4i(4, 3, 2, 1)) // returns true
*/
var eq = /* @__PURE__ */ dualImpl({
	name: "eq",
	signature: (...argTypes) => ({
		argTypes,
		returnType: correspondingBooleanVectorSchema(argTypes[0])
	}),
	normalImpl: cpuEq,
	codegenImpl: (ctx, [lhs, rhs]) => ctx.gen.emitBinaryOp(lhs, "==", rhs),
	sideEffects: false
});
/**
* Checks **component-wise** whether `lhs != rhs`.
* This function does **not** return `bool`, for that use-case, wrap the result in `any`.
* @example
* ne(vec2f(0.0, 1.0), vec2f(0.0, 2.0)) // returns vec2b(false, true)
* ne(vec3u(0, 1, 2), vec3u(2, 1, 0)) // returns vec3b(true, false, true)
* any(ne(vec4i(4, 3, 2, 1), vec4i(4, 2, 2, 1))) // returns true
*/
var ne = /* @__PURE__ */ dualImpl({
	name: "ne",
	signature: (...argTypes) => ({
		argTypes,
		returnType: correspondingBooleanVectorSchema(argTypes[0])
	}),
	normalImpl: (lhs, rhs) => cpuNot(cpuEq(lhs, rhs)),
	codegenImpl: (ctx, [lhs, rhs]) => ctx.gen.emitBinaryOp(lhs, "!=", rhs),
	sideEffects: false
});
var cpuLt = (lhs, rhs) => {
	assertKind([lhs, rhs], numericKind);
	assertEqualKinds(lhs, rhs);
	return generalizeBoolFn((a, b) => a < b, [lhs, rhs]);
};
/**
* Checks **component-wise** whether `lhs < rhs`.
* This function does **not** return `bool`, for that use-case, wrap the result in `all`.
* @example
* lt(vec2f(0.0, 0.0), vec2f(0.0, 1.0)) // returns vec2b(false, true)
* lt(vec3u(0, 1, 2), vec3u(2, 1, 0)) // returns vec3b(true, false, false)
* all(lt(vec4i(1, 2, 3, 4), vec4i(2, 3, 4, 5))) // returns true
*/
var lt = /* @__PURE__ */ dualImpl({
	name: "lt",
	signature: (...argTypes) => ({
		argTypes,
		returnType: correspondingBooleanVectorSchema(argTypes[0])
	}),
	normalImpl: cpuLt,
	codegenImpl: (ctx, [lhs, rhs]) => ctx.gen.emitBinaryOp(lhs, "<", rhs),
	sideEffects: false
});
/**
* Checks **component-wise** whether `lhs <= rhs`.
* This function does **not** return `bool`, for that use-case, wrap the result in `all`.
* @example
* le(vec2f(0.0, 0.0), vec2f(0.0, 1.0)) // returns vec2b(true, true)
* le(vec3u(0, 1, 2), vec3u(2, 1, 0)) // returns vec3b(true, true, false)
* all(le(vec4i(1, 2, 3, 4), vec4i(2, 3, 3, 5))) // returns true
*/
var le = /* @__PURE__ */ dualImpl({
	name: "le",
	signature: (...argTypes) => ({
		argTypes,
		returnType: correspondingBooleanVectorSchema(argTypes[0])
	}),
	normalImpl: (lhs, rhs) => cpuOr(cpuLt(lhs, rhs), cpuEq(lhs, rhs)),
	codegenImpl: (ctx, [lhs, rhs]) => ctx.gen.emitBinaryOp(lhs, "<=", rhs),
	sideEffects: false
});
/**
* Checks **component-wise** whether `lhs > rhs`.
* This function does **not** return `bool`, for that use-case, wrap the result in `all`.
* @example
* gt(vec2f(0.0, 0.0), vec2f(0.0, 1.0)) // returns vec2b(false, false)
* gt(vec3u(0, 1, 2), vec3u(2, 1, 0)) // returns vec3b(false, false, true)
* all(gt(vec4i(2, 3, 4, 5), vec4i(1, 2, 3, 4))) // returns true
*/
var gt = /* @__PURE__ */ dualImpl({
	name: "gt",
	signature: (...argTypes) => ({
		argTypes,
		returnType: correspondingBooleanVectorSchema(argTypes[0])
	}),
	normalImpl: (lhs, rhs) => cpuAnd(cpuNot(cpuLt(lhs, rhs)), cpuNot(cpuEq(lhs, rhs))),
	codegenImpl: (ctx, [lhs, rhs]) => ctx.gen.emitBinaryOp(lhs, ">", rhs),
	sideEffects: false
});
/**
* Checks **component-wise** whether `lhs >= rhs`.
* This function does **not** return `bool`, for that use-case, wrap the result in `all`.
* @example
* ge(vec2f(0.0, 0.0), vec2f(0.0, 1.0)) // returns vec2b(true, false)
* ge(vec3u(0, 1, 2), vec3u(2, 1, 0)) // returns vec3b(false, true, true)
* all(ge(vec4i(2, 2, 4, 5), vec4i(1, 2, 3, 4))) // returns true
*/
var ge = /* @__PURE__ */ dualImpl({
	name: "ge",
	signature: (...argTypes) => ({
		argTypes,
		returnType: correspondingBooleanVectorSchema(argTypes[0])
	}),
	normalImpl: (lhs, rhs) => cpuNot(cpuLt(lhs, rhs)),
	codegenImpl: (ctx, [lhs, rhs]) => ctx.gen.emitBinaryOp(lhs, ">=", rhs),
	sideEffects: false
});
function cpuNot(value) {
	assertKind(value, booleanKind);
	return generalizeBoolFn((a) => !a, [value]);
}
/**
* Returns the logical negation of the given value.
* For booleans returns `!value`.
* For boolean vectors, returns **component-wise** `!value`.
* @example
* not(true) // returns false
* not(vec3b(true, true, false)) // returns vec3b(false, false, true)
*/
var not = /* @__PURE__ */ dualImpl({
	name: "not",
	signature: (arg) => {
		if (!isBool$1(arg) && !isVecBool(arg)) throw new SignatureNotSupportedError([arg], [
			bool,
			vec2b$1,
			vec3b$1,
			vec4b$1
		]);
		return {
			argTypes: [arg],
			returnType: arg
		};
	},
	normalImpl: cpuNot,
	codegenImpl: (_ctx, [arg]) => stitch`!(${arg})`,
	sideEffects: false
});
var cpuOr = (lhs, rhs) => {
	assertKind([lhs, rhs], booleanKind);
	assertEqualKinds(lhs, rhs);
	return generalizeBoolFn((a, b) => a || b, [lhs, rhs]);
};
var cpuAnd = (lhs, rhs) => cpuNot(cpuOr(cpuNot(lhs), cpuNot(rhs)));
var cpuAll = (value) => {
	assertKind(value, booleanKind);
	if (typeof value === "boolean") return value;
	return VectorOps.all[value.kind](value);
};
var validSelectBranchTypes = [
	f32,
	f16,
	i32,
	u32,
	bool,
	vec2f$1,
	vec3f$1,
	vec4f$1,
	vec2h$1,
	vec3h$1,
	vec4h$1,
	vec2i$1,
	vec3i$1,
	vec4i$1,
	vec2u$1,
	vec3u$1,
	vec4u$1,
	vec2b$1,
	vec3b$1,
	vec4b$1
];
//#endregion
//#region src/data/sampler.ts
function sampler() {
	return {
		[$internal]: {},
		type: "sampler",
		[$repr]: void 0
	};
}
function comparisonSampler() {
	return {
		[$internal]: {},
		type: "sampler_comparison",
		[$repr]: void 0
	};
}
function isWgslSampler(value) {
	return !!value[$internal] && value.type === "sampler";
}
function isWgslComparisonSampler(value) {
	return !!value[$internal] && value.type === "sampler_comparison";
}
//#endregion
//#region src/data/texture.ts
function textureDescriptorToSchema(desc) {
	if ("multisampled" in desc) {
		if (desc.multisampled) {
			if (desc.dimension === "2d") return textureMultisampled2d(desc.sampleType);
			throw new Error(`Multisampled textures only support '2d' dimension, got '${desc.dimension}'`);
		}
		switch (desc.dimension) {
			case "1d": return texture1d(desc.sampleType);
			case "2d": return texture2d(desc.sampleType);
			case "2d-array": return texture2dArray(desc.sampleType);
			case "3d": return texture3d(desc.sampleType);
			case "cube": return textureCube(desc.sampleType);
			case "cube-array": return textureCubeArray(desc.sampleType);
			default: throw new Error(`Unsupported texture dimension: '${desc.dimension}'`);
		}
	}
	if (!("access" in desc)) throw new Error("Descriptor is neither a sampled nor a storage texture");
	switch (desc.dimension) {
		case "1d": return textureStorage1d(desc.format, desc.access);
		case "2d": return textureStorage2d(desc.format, desc.access);
		case "2d-array": return textureStorage2dArray(desc.format, desc.access);
		case "3d": return textureStorage3d(desc.format, desc.access);
		default: throw new Error(`Unsupported storage texture dimension: '${desc.dimension}'`);
	}
}
function createTexture(type, props) {
	const sampleTypes = type.startsWith("texture_depth") ? [
		"depth",
		"float",
		"unfilterable-float"
	] : props.sampleType.type === "i32" ? ["sint"] : props.sampleType.type === "u32" ? ["uint"] : ["float", "unfilterable-float"];
	return {
		[$internal]: {},
		[$repr]: void 0,
		type,
		bindingSampleType: sampleTypes,
		...props
	};
}
function createStorageTexture(type, props) {
	return {
		[$internal]: {},
		[$repr]: void 0,
		type,
		...props
	};
}
var textureCache = /* @__PURE__ */ new Map();
var accessModeMap = {
	"write-only": "write",
	"read-only": "read",
	"read-write": "read_write"
};
function getOrCreate(key, factory) {
	let cached = textureCache.get(key);
	if (!cached) {
		cached = factory();
		textureCache.set(key, cached);
	}
	return cached;
}
function texture1d(sampleType) {
	const actualSampleType = sampleType || f32;
	return getOrCreate(`texture_1d<${actualSampleType.type}>`, () => createTexture("texture_1d", {
		dimension: "1d",
		sampleType: actualSampleType,
		multisampled: false
	}));
}
function texture2d(sampleType) {
	const actualSampleType = sampleType || f32;
	return getOrCreate(`texture_2d<${actualSampleType.type}>`, () => createTexture("texture_2d", {
		dimension: "2d",
		sampleType: actualSampleType,
		multisampled: false
	}));
}
function textureMultisampled2d(sampleType) {
	const actualSampleType = sampleType || f32;
	return getOrCreate(`texture_multisampled_2d<${actualSampleType.type}>`, () => createTexture("texture_multisampled_2d", {
		dimension: "2d",
		sampleType: actualSampleType,
		multisampled: true
	}));
}
function texture2dArray(sampleType) {
	const actualSampleType = sampleType || f32;
	return getOrCreate(`texture_2d_array<${actualSampleType.type}>`, () => createTexture("texture_2d_array", {
		dimension: "2d-array",
		sampleType: actualSampleType,
		multisampled: false
	}));
}
function textureCube(sampleType) {
	const actualSampleType = sampleType || f32;
	return getOrCreate(`texture_cube<${actualSampleType.type}>`, () => createTexture("texture_cube", {
		dimension: "cube",
		sampleType: actualSampleType,
		multisampled: false
	}));
}
function textureCubeArray(sampleType) {
	const actualSampleType = sampleType || f32;
	return getOrCreate(`texture_cube_array<${actualSampleType.type}>`, () => createTexture("texture_cube_array", {
		dimension: "cube-array",
		sampleType: actualSampleType,
		multisampled: false
	}));
}
function texture3d(sampleType) {
	const actualSampleType = sampleType || f32;
	return getOrCreate(`texture_3d<${actualSampleType.type}>`, () => createTexture("texture_3d", {
		dimension: "3d",
		sampleType: actualSampleType,
		multisampled: false
	}));
}
function textureStorage1d(format, access) {
	const actualAccess = access || "write-only";
	return getOrCreate(`texture_storage_1d<${format}, ${accessModeMap[actualAccess]}>`, () => createStorageTexture("texture_storage_1d", {
		dimension: "1d",
		format,
		access: actualAccess
	}));
}
function textureStorage2d(format, access) {
	const actualAccess = access || "write-only";
	return getOrCreate(`texture_storage_2d<${format}, ${accessModeMap[actualAccess]}>`, () => createStorageTexture("texture_storage_2d", {
		dimension: "2d",
		format,
		access: actualAccess
	}));
}
function textureStorage2dArray(format, access) {
	const actualAccess = access || "write-only";
	return getOrCreate(`texture_storage_2d_array<${format}, ${accessModeMap[actualAccess]}>`, () => createStorageTexture("texture_storage_2d_array", {
		dimension: "2d-array",
		format,
		access: actualAccess
	}));
}
function textureStorage3d(format, access) {
	const actualAccess = access || "write-only";
	return getOrCreate(`texture_storage_3d<${format}, ${accessModeMap[actualAccess]}>`, () => createStorageTexture("texture_storage_3d", {
		dimension: "3d",
		format,
		access: actualAccess
	}));
}
function textureExternal() {
	return getOrCreate("texture_external", () => ({
		[$internal]: {},
		[$repr]: void 0,
		type: "texture_external",
		dimension: "2d"
	}));
}
function isWgslTexture(value) {
	return !!value[$internal] && typeof value.multisampled === "boolean";
}
function isWgslStorageTexture(value) {
	return !!value[$internal] && typeof value.format === "string" && typeof value.access === "string";
}
//#endregion
//#region src/core/vertexLayout/connectAttributesToShader.ts
function isAttribute(value) {
	return typeof value?.format === "string";
}
function connectAttributesToShader(shaderInputLayout, attributes) {
	const usedVertexLayouts = [];
	if (isData(shaderInputLayout)) {
		if (!isAttribute(attributes)) throw new Error("Shader expected a single attribute, not a record of attributes to be passed in.");
		usedVertexLayouts.push(attributes._layout);
		return {
			usedVertexLayouts,
			bufferDefinitions: [{
				arrayStride: attributes._layout.stride,
				stepMode: attributes._layout.stepMode,
				attributes: [{
					format: attributes.format,
					offset: attributes.offset,
					shaderLocation: getCustomLocation(shaderInputLayout) ?? 0
				}]
			}]
		};
	}
	const bufferDefinitions = [];
	const layoutToAttribListMap = /* @__PURE__ */ new WeakMap();
	let nextShaderLocation = 0;
	for (const [key, member] of Object.entries(shaderInputLayout)) {
		if (isBuiltin(member)) continue;
		const matchingAttribute = attributes[key];
		if (!matchingAttribute) throw new Error(`An attribute by the name of '${key}' was not provided to the shader.`);
		const layout = matchingAttribute._layout;
		let attribList = layoutToAttribListMap.get(layout);
		if (!attribList) {
			usedVertexLayouts.push(layout);
			attribList = [];
			bufferDefinitions.push({
				arrayStride: layout.stride,
				stepMode: layout.stepMode,
				attributes: attribList
			});
			layoutToAttribListMap.set(layout, attribList);
		}
		nextShaderLocation = getCustomLocation(member) ?? nextShaderLocation;
		attribList.push({
			format: matchingAttribute.format,
			offset: matchingAttribute.offset,
			shaderLocation: nextShaderLocation++
		});
	}
	return {
		usedVertexLayouts,
		bufferDefinitions
	};
}
//#endregion
//#region src/core/resolve/resolveData.ts
/**
* Schemas for which their `type` property directly
* translates to the resulting WGSL code.
*/
var identityTypes = [
	"bool",
	"f32",
	"f16",
	"i32",
	"u32",
	"vec2f",
	"vec3f",
	"vec4f",
	"vec2h",
	"vec3h",
	"vec4h",
	"vec2i",
	"vec3i",
	"vec4i",
	"vec2u",
	"vec3u",
	"vec4u",
	"vec2<bool>",
	"vec3<bool>",
	"vec4<bool>",
	"mat2x2f",
	"mat3x3f",
	"mat4x4f",
	"texture_external"
];
function isIdentityType(data) {
	return identityTypes.includes(data.type);
}
/**
* Resolves a single property of a struct.
* @param ctx - The resolution context.
* @param key - The key of the property.
* @param property - The property itself.
*
* @returns The resolved property string.
*/
function resolveStructProperty(ctx, [key, property]) {
	return `  ${getAttributesString(property)}${key}: ${ctx.resolve(property).value},\n`;
}
/**
* Resolves a struct and adds its declaration to the resolution context.
* @param ctx - The resolution context.
* @param struct - The struct to resolve.
*
* @returns The resolved struct name.
*/
function resolveStruct(ctx, struct) {
	if (struct[$internal].isAbstruct) throw new Error("Cannot resolve abstract struct types to WGSL.");
	const id = ctx.makeUniqueIdentifier(getName(struct), "global");
	ctx.addDeclaration(`\
struct ${id} {
${Object.entries(struct.propTypes).map((prop) => resolveStructProperty(ctx, prop)).join("")}\
}`, id);
	return id;
}
/**
* Resolves an unstruct (struct that does not align data by default) to its struct data counterpart.
* @param ctx - The resolution context.
* @param unstruct - The unstruct to resolve.
*
* @returns The resolved unstruct name.
*
* @example
* ```ts
* resolveUnstruct(ctx, {
*   uv: d.float16x2, // -> d.vec2f after resolution
*   color: d.snorm8x4, -> d.vec4f after resolution
* });
* ```
*/
function resolveUnstruct(ctx, unstruct) {
	const id = ctx.makeUniqueIdentifier(getName(unstruct), "global");
	ctx.addDeclaration(`\
struct ${id} {
${Object.entries(unstruct.propTypes).map((prop) => isAttribute(prop[1]) ? resolveStructProperty(ctx, [prop[0], formatToWGSLType[prop[1].format]]) : resolveStructProperty(ctx, prop)).join("")}
}`, id);
	return id;
}
/**
* Resolves an array.
* @param ctx - The resolution context.
* @param array - The array to resolve.
*
* @returns The resolved array name along with its element type and count (if not runtime-sized).
*
* @example
* ```ts
* resolveArray(ctx, d.arrayOf(d.u32, 0)); // 'array<u32>' (not a real pattern, a function is preferred)
* resolveArray(ctx, d.arrayOf(d.u32, 5)); // 'array<u32, 5>'
* ```
*/
function resolveArray(ctx, array) {
	const element = ctx.resolve(array.elementType).value;
	return array.elementCount === 0 ? `array<${element}>` : `array<${element}, ${array.elementCount}>`;
}
function resolveDisarray(ctx, disarray) {
	const element = ctx.resolve(isAttribute(disarray.elementType) ? formatToWGSLType[disarray.elementType.format] : disarray.elementType).value;
	return disarray.elementCount === 0 ? `array<${element}>` : `array<${element}, ${disarray.elementCount}>`;
}
/**
* Resolves a WGSL data-type schema to a string.
* @param ctx - The resolution context.
* @param data - The data-type to resolve.
*
* @returns The resolved data-type string.
*/
function resolveData(ctx, data) {
	if (isLooseData(data)) {
		if (data.type === "unstruct") return resolveUnstruct(ctx, data);
		if (data.type === "disarray") return resolveDisarray(ctx, data);
		if (data.type === "loose-decorated") return ctx.resolve(isAttribute(data.inner) ? formatToWGSLType[data.inner.format] : data.inner).value;
		return ctx.resolve(formatToWGSLType[data.type]).value;
	}
	if (isIdentityType(data)) return data.type;
	if (data.type === "struct") return resolveStruct(ctx, data);
	if (data.type === "array") return resolveArray(ctx, data);
	if (data.type === "atomic") return `atomic<${resolveData(ctx, data.inner)}>`;
	if (data.type === "decorated") return ctx.resolve(data.inner).value;
	if (data.type === "ptr") {
		if (data.addressSpace === "storage") return `ptr<storage, ${ctx.resolve(data.inner).value}, ${data.access === "read-write" ? "read_write" : data.access}>`;
		return `ptr<${data.addressSpace}, ${ctx.resolve(data.inner).value}>`;
	}
	if (data.type === "abstractInt" || data.type === "abstractFloat" || data.type === "void" || data.type === "u16") throw new Error(`${data.type} has no representation in WGSL`);
	if (isWgslStorageTexture(data)) return `${data.type}<${data.format}, ${accessModeMap[data.access]}>`;
	if (isWgslTexture(data)) return data.type.startsWith("texture_depth") ? data.type : `${data.type}<${data.sampleType.type}>`;
	if (isWgslComparisonSampler(data) || isWgslSampler(data)) return data.type;
	assertExhaustive$1(data, "resolveData");
}
//#endregion
//#region src/core/unroll/tgpuUnroll.ts
/**
* The result of calling `tgpu.unroll(...)`. The code responsible for
* generating shader code can check if the value of a snippet is
* an instance of `UnrollableIterable`, and act accordingly.
*/
var UnrollableIterable = class {
	[$internal] = true;
	snippet;
	constructor(snippet) {
		this.snippet = snippet;
	}
	[$comptimeValueOf]() {
		const known = asComptime(this.snippet);
		return known ? {
			comptime: true,
			value: known.value
		} : { comptime: false };
	}
	[$resolve](ctx) {
		return ctx.resolveSnippet(this.snippet);
	}
};
/**
* Marks an iterable to be unrolled by the shader generator when used in a for loop.
*
* @example
* ```ts
* const neighborOffsets = [d.vec2i(0, 1), d.vec2i(0, -1), d.vec2i(1, 0), d.vec2i(-1, 0)];
*
* // Unrolls into 4 blocks of code, one for each offset.
* for (const offset of tgpu.unroll(neighborOffsets)) {
*   // ...
* }
* ```
*
* If you'd like to unroll over a range of numbers, use `tgpu.unroll(std.range(n))`.
*
* @example
* ```ts
* // (...)
* const FBM_OCTAVES = 3;
*
* function fbm(pos: d.v3f): number {
*   'use gpu';
*   let sum = d.f32();
*
*   // i = 0, 1, 2
*   for (const i of tgpu.unroll(std.range(FBM_OCTAVES))) {
*     sum +=
*       noise3d(pos * (CLOUD_FREQUENCY * FBM_LACUNARITY ** i)) *
*       (CLOUD_AMPLITUDE * FBM_PERSISTENCE ** i);
*   }
*
*   return sum;
* }
*
* ```
*
* Generates:
*
* ```wgsl
* // (...)
*
* fn fbm(pos: vec3f) -> f32 {
*   var sum = 0f;
*   // unrolled iteration #0
*   sum += noise3d(pos * 1.4f) * 1f;
*   // unrolled iteration #1
*   sum += noise3d(pos * 2.8f) * 0.5f;
*   // unrolled iteration #2
*   sum += noise3d(pos * 5.6f) * 0.25f;
*   // ---
*   return sum;
* }
* ```
*/
var unroll = (() => {
	function jsImpl(iterable) {
		return iterable;
	}
	const impl = jsImpl;
	setName(impl, "unroll");
	impl.toString = () => "unroll";
	impl[$internal] = true;
	impl[$gpuCallable] = { call(_ctx, [value]) {
		return withValue(new UnrollableIterable(value), value);
	} };
	return impl;
})();
//#endregion
//#region src/tgsl/jsPolyfills.ts
var mathToStd = new Map([
	[Math.abs, abs],
	[Math.acos, acos],
	[Math.acosh, acosh],
	[Math.asin, asin],
	[Math.asinh, asinh],
	[Math.atan, atan],
	[Math.atan2, atan2],
	[Math.atanh, atanh],
	[Math.ceil, ceil],
	[Math.cos, cos],
	[Math.cosh, cosh],
	[Math.exp, exp],
	[Math.floor, floor],
	[Math.fround, f32],
	[Math.clz32, countLeadingZeros],
	[Math.trunc, trunc],
	[Math.log, log],
	[Math.log2, log2],
	[Math.pow, pow],
	[Math.sign, sign],
	[Math.sin, sin],
	[Math.sinh, sinh],
	[Math.sqrt, sqrt],
	[Math.tan, tan],
	[Math.tanh, tanh],
	[Math.max, max],
	[Math.min, min]
]);
var supportedLogOps = () => [
	console.log,
	console.debug,
	console.info,
	console.warn,
	console.error,
	console.clear
];
//#endregion
//#region src/std/array.ts
var sizeOfPointedToArray = (dataType) => isPtr(dataType) && isWgslArray(dataType.inner) ? dataType.inner.elementCount : 0;
var arrayLength = /* @__PURE__ */ dualImpl({
	name: "arrayLength",
	signature: (arg) => {
		const ptrArg = isPtr(arg) ? arg : ptrFn(arg);
		return {
			argTypes: [ptrArg],
			returnType: sizeOfPointedToArray(ptrArg) > 0 ? abstractInt : u32
		};
	},
	normalImpl: (a) => isRef(a) ? a.$.length : a.length,
	codegenImpl(ctx, [a]) {
		const length = sizeOfPointedToArray(a.dataType);
		return length > 0 ? `${length}` : ctx.gen.emitCall("arrayLength", [], [a]);
	},
	sideEffects: false
});
comptime((start, end, step = 1) => {
	if (end === void 0) {
		end = start;
		start = 0;
	}
	if (!Number.isInteger(start)) throw new Error(`'start' must be an integer, got ${start}`);
	if (!Number.isInteger(end)) throw new Error(`'end' must be an integer, got ${end}`);
	if (!Number.isInteger(step) || step === 0) throw new Error(`'step' must be a non-zero integer, got ${step}`);
	const result = [];
	result.start = start;
	result.end = end;
	result.step = step;
	if (Math.sign(step) !== Math.sign(end - start)) return result;
	if (step > 0) for (let i = start; i < end; i += step) result.push(i);
	if (step < 0) for (let i = start; i > end; i += step) result.push(i);
	return result;
});
function isTgpuRange(value) {
	return Array.isArray(value) && "start" in value && "end" in value && "step" in value;
}
//#endregion
//#region src/tgsl/forOfUtils.ts
function getLoopVarKind(elementSnippet) {
	return elementSnippet.origin === "constant-immutable-def" ? "const" : "let";
}
function getElementSnippet(iterableSnippet, index) {
	const elementSnippet = accessIndex(iterableSnippet, index);
	if (!elementSnippet) throw new WgslTypeError("`for ... of ...` loops only support array or vector iterables");
	return elementSnippet;
}
/**
* Determines the type of the element as accessible inside of the `for .. of` loop body
*/
function getElementType(elementSnippet, iterableSnippet) {
	let elementType = elementSnippet.dataType;
	if (elementType === UnknownData) throw new WgslTypeError(`The elements in iterable '${stringifySnippet(iterableSnippet)}' are of unknown type`);
	if (isNaturallyEphemeral(elementSnippet.dataType) || !isAddressableOrigin(elementSnippet.origin)) return elementType;
	if (!isPtr(elementType)) {
		const ptrType = createPtrFromOrigin(elementSnippet.origin, concretize(elementType));
		invariant(ptrType !== void 0, `Creating pointer type from origin ${elementSnippet.origin}`);
		elementType = ptrType;
	}
	return implicitFrom(elementType);
}
function getRangeSnippets(ctx, iterableSnippet, unroll = false) {
	const { value, dataType } = iterableSnippet;
	if (isTgpuRange(value)) {
		const { start, end, step } = value;
		const dataType = [
			start,
			end,
			step
		].every((v) => v >= 0) ? u32 : i32;
		return {
			start: snip(start, dataType, "constant", false),
			end: snip(end, dataType, "constant", false),
			step: snip(step, dataType, "constant", false),
			comparison: step < 0 ? ">" : "<"
		};
	}
	if (iterableSnippet.possibleSideEffects) throw new Error("`for ... of ...` loops do not support iterables with possible side effects. Store the iterable in a variable first.");
	if (!unroll && !isStoredInMemory(iterableSnippet)) throw new Error(`\`for ... of ...\` loops only support std.range or iterables stored in variables.
-----
You can wrap iterable with \`tgpu.unroll(...)\`. If iterable is known at comptime, the loop will be unrolled.
-----`);
	const defaults = {
		start: snip(0, u32, "constant", false),
		step: snip(1, u32, "constant", false),
		comparison: "<"
	};
	if (isWgslArray(dataType)) return {
		...defaults,
		end: dataType.elementCount > 0 ? snip(dataType.elementCount, u32, "constant", false) : arrayLength[$gpuCallable].call(ctx, [iterableSnippet])
	};
	if (isVec(dataType)) return {
		...defaults,
		end: snip(dataType.componentCount, u32, "constant", false)
	};
	if (unroll) {
		if (Array.isArray(value)) return {
			...defaults,
			end: snip(value.length, u32, "constant", false)
		};
		if (value instanceof ArrayExpression) return {
			...defaults,
			end: snip(value.elements.length, u32, "constant", false)
		};
	}
	throw new WgslTypeError("`for ... of ...` loops only support array or vector iterables");
}
//#endregion
//#region src/core/declare/tgpuDeclare.ts
var TgpuDeclareImpl = class {
	[$internal] = true;
	#externals;
	#declaration;
	constructor(declaration) {
		this.#declaration = declaration;
	}
	$uses(dependencyMap) {
		if (this.#externals !== void 0) throw new Error("Cannot call '$uses' multiple times. If you wish to override dependencies, use slots or accessors instead.");
		this.#externals = dependencyMap;
		return this;
	}
	[$resolve](ctx) {
		const replacedDeclaration = replaceExternalsInWgsl(ctx, this.#externals ?? {}, this.#declaration);
		ctx.addDeclaration(replacedDeclaration);
		return snip("", Void, "constant");
	}
	toString() {
		return `declare: ${this.#declaration}`;
	}
};
//#endregion
//#region src/tgsl/wgslGenerator.ts
var { NodeTypeCatalog: NODE } = src_exports;
var parenthesizedOps = [
	"==",
	"!=",
	"===",
	"!==",
	"<",
	"<=",
	">",
	">=",
	"<<",
	">>",
	">>>",
	"+",
	"-",
	"*",
	"/",
	"%",
	"|",
	"^",
	"&"
];
var binaryLogicalOps = [
	"&&",
	"||",
	"==",
	"!=",
	"===",
	"!==",
	"<",
	"<=",
	">",
	">="
];
var binaryRelationalOpToStdMap = {
	"===": eq.toString(),
	"!==": ne.toString(),
	"<": lt.toString(),
	"<=": le.toString(),
	">": gt.toString(),
	">=": ge.toString()
};
var bitShiftOps = [
	"<<",
	">>",
	"<<=",
	">>=",
	">>>",
	">>>="
];
var OP_MAP = {
	"===": "==",
	"!==": "!=",
	">>>": ">>",
	get in() {
		throw new Error("The `in` operator is unsupported in TypeGPU functions.");
	},
	get instanceof() {
		throw new Error("The `instanceof` operator is unsupported in TypeGPU functions.");
	},
	get "|>"() {
		throw new Error("The `|>` operator is unsupported in TypeGPU functions.");
	},
	get "??"() {
		throw new Error("The `??` operator is unsupported in TypeGPU functions.");
	},
	">>>=": ">>=",
	get "**="() {
		throw new Error("The `**=` operator is unsupported in TypeGPU functions.");
	},
	get "??="() {
		throw new Error("The `??=` operator is unsupported in TypeGPU functions.");
	},
	get "&&="() {
		throw new Error("The `&&=` operator is unsupported in TypeGPU functions.");
	},
	get "||="() {
		throw new Error("The `||=` operator is unsupported in TypeGPU functions.");
	}
};
function operatorToType(lhs, op, rhs) {
	if (!rhs) {
		if (op === "!") return bool;
		return lhs;
	}
	if (binaryLogicalOps.includes(op)) return bool;
	if (op === "=") return rhs;
	return lhs;
}
var unaryOpCodeToCodegen = {
	"-": neg[$gpuCallable].call.bind(neg),
	void: () => snip(void 0, Void, "constant", false),
	"!": (ctx, [argExpr]) => {
		if (argExpr === void 0) throw new Error("The unary operator `!` expects 1 argument, but 0 were provided.");
		const knownArg = asComptime(argExpr);
		if (knownArg) return snip(!knownArg.value, bool, "constant", false);
		const argStr = ctx.resolveSnippet(argExpr).value;
		if (!isBool$1(argExpr.dataType)) throw new WgslTypeError(`Unary operator ! requires boolean operand. Got '${stringifySnippet(argExpr)}' of type ${String(argExpr.dataType)}.${isVecBool(argExpr.dataType) ? ` For component-wise negation, use 'std.${not.toString()}'.` : ""}`);
		return snip(`!(${argStr})`, bool, "runtime", argExpr.possibleSideEffects);
	}
};
var binaryOpCodeToCodegen = {
	"+": add[$gpuCallable].call.bind(add),
	"-": sub[$gpuCallable].call.bind(sub),
	"*": mul[$gpuCallable].call.bind(mul),
	"/": div[$gpuCallable].call.bind(div),
	"**": pow[$gpuCallable].call.bind(pow)
};
var usageToVarTemplateMap = {
	private: "private",
	workgroup: "workgroup",
	uniform: "uniform",
	mutable: "storage, read_write",
	readonly: "storage, read",
	immediate: "immediate"
};
/**
* The block depth that we can expect when generating code in the function scope, not in any nested blocks.
*/
var functionInitialBlockDepth = 2;
var switchDefault = snip("default", UnknownData, "constant");
function schemaWrappingSuggestion(declaration, rhs, value) {
	if (value === null || value === void 0 || typeof value === "string") return "";
	return `
-----
- Try using or defining a schema that matches your desired value the most, and wrap the value with it: '${declaration} = Schema(${rhs})'
-----`;
}
var WgslGenerator = class WgslGenerator {
	#ctx = void 0;
	#unrollingChain = [];
	static {
		WgslGenerator.prototype.languageKey = "wgsl";
	}
	initGenerator(ctx) {
		if (this.#ctx !== void 0) throw new Error(`Cannot initialize shader generators twice. Create one generator per resolution.`);
		this.#ctx = ctx;
	}
	get ctx() {
		if (!this.#ctx) throw new Error("WGSL Generator has not yet been initialized. Please call initialize(ctx) before using the generator.");
		return this.#ctx;
	}
	_block([_, statementNodes], allowInlining, externalMap) {
		this.ctx.pushBlockScope();
		try {
			if (externalMap) {
				const externals = Object.fromEntries(Object.entries(externalMap).map(([id, value]) => [id, coerceToSnippet(value)]));
				this.ctx.setBlockExternals(externals);
			}
			let body = "";
			/**
			* True if any of the statements in the block define variables that would
			* be scoped to the currently generated block. If not, we can safely inline it.
			*/
			let definesInNearestScope = false;
			let endsWithControlFlow;
			this.ctx.indent();
			for (const statementNode of statementNodes) {
				const statement = this._statement(statementNode);
				if (statement.code.length > 0) body += `${statement.code}\n`;
				definesInNearestScope ||= statement.definesInNearestScope ?? false;
				if (statement.endsWithControlFlow !== void 0) {
					endsWithControlFlow = statement.endsWithControlFlow;
					break;
				}
			}
			this.ctx.dedent();
			const willInline = allowInlining && !definesInNearestScope;
			if (this.ctx.blockDepth === functionInitialBlockDepth) body = body.replace(/[ ]*return\s*;\s*$/u, "");
			if (body === "") return {
				code: "",
				endsWithControlFlow,
				definesInNearestScope: false
			};
			if (willInline) return {
				code: this.ctx.getDedented(body.trim()),
				endsWithControlFlow,
				definesInNearestScope
			};
			return {
				code: `{\n${body}${this.ctx.pre}}`,
				endsWithControlFlow,
				definesInNearestScope: false
			};
		} finally {
			this.ctx.popBlockScope();
		}
	}
	_blockStatement(block, externalMap) {
		const { code, ...properties } = this._block(block, true, externalMap);
		if (code === "") return {
			...properties,
			code: ""
		};
		return {
			...properties,
			code: `${this.ctx.pre}${code}`
		};
	}
	refVariable(id, dataType) {
		const varName = this.ctx.makeUniqueIdentifier(id, "block");
		const ptrType = ptrFn(dataType);
		const snippet = snip(new RefOperator(snip(varName, dataType, "function", false), ptrType), ptrType, "function", false);
		this.ctx.defineVariable(id, snippet);
		return varName;
	}
	/**
	* Creates a variable declaration string.
	* `keyword` may be a placeholder filled in later.
	*/
	_emitVarDecl(keyword, name, _dataType, rhsStr) {
		return `${this.ctx.pre}${keyword} ${name} = ${rhsStr};`;
	}
	_identifier(id) {
		if (!id) throw new Error("Cannot resolve an empty identifier");
		if (id === "undefined") return snip(void 0, Void, "constant", false);
		const res = this.ctx.getById(id);
		if (!res) throw new Error(`Identifier ${id} not found`);
		return res;
	}
	_emitSwitchStatement(discriminantExpr, groupedCaseExprs) {
		const cases = groupedCaseExprs.map(([tests, consequent]) => {
			const last = consequent.at(-1);
			if (last && /^\s*break\s*;\s*$/.test(last.code) && last.endsWithControlFlow === "break") consequent.pop();
			return {
				tests,
				resolvedConsequent: consequent.map((s) => s.code).join("\n")
			};
		});
		if (cases.flatMap(({ tests }) => tests).every((test) => test !== switchDefault)) cases.push({
			tests: [switchDefault],
			resolvedConsequent: ""
		});
		const onlyCase = cases.length === 1 ? cases.at(0) : void 0;
		if (asComptime(discriminantExpr) !== void 0 && onlyCase && onlyCase.tests.length === 1 && onlyCase.tests.at(0) === switchDefault) {
			const { resolvedConsequent } = onlyCase;
			if (!/\bbreak\b/.test(resolvedConsequent)) return `${this.ctx.pre}{\n${this.ctx.getDedented(resolvedConsequent)}\n${this.ctx.pre}}`;
		}
		this.ctx.indent();
		const resolvedCases = cases.map(({ tests, resolvedConsequent }) => {
			const resolvedTests = tests.map((test) => test.value === "default" ? "default" : this.ctx.resolveSnippet(test).value).join(", ");
			return `${this.ctx.pre}case ${resolvedTests}: {\n${resolvedConsequent}\n${this.ctx.pre}}`;
		});
		this.ctx.dedent();
		const body = resolvedCases.join("\n");
		return stitch`${this.ctx.pre}switch ${discriminantExpr} {\n${body}\n${this.ctx.pre}}`;
	}
	_callShellless(callee, args) {
		const isGeneric = isGenericFn(callee);
		const slotPairs = isGeneric ? callee[$providing]?.pairs ?? [] : [];
		const callback = isGeneric ? callee[$internal].inner : callee;
		return this.ctx.withRenamed(callback, getName(callee), () => this.ctx.withSlots(slotPairs, () => {
			const shellless = this.ctx.shelllessRepo.get(callback, args);
			if (!shellless) return;
			const converted = args.map((s, idx) => {
				const argType = shellless.argTypes[idx];
				return tryConvertSnippet(this.ctx, s, argType, false);
			});
			return this.ctx.withResetIndentLevel(() => {
				const snippet = this.ctx.resolve(shellless);
				return snip(stitch`${snippet.value}(${converted})`, snippet.dataType, "runtime");
			});
		}));
	}
	/**
	* A wrapper for `generateExpression` that updates `ctx.expectedType`
	* and tries to convert the result when it does not match the expected type.
	*/
	_typedExpression(expression, expectedType) {
		const prevExpectedType = this.ctx.expectedType;
		this.ctx.expectedType = expectedType;
		try {
			const result = this._expression(expression);
			if (expectedType instanceof AutoStruct) return result;
			return setSourceNode(tryConvertSnippet(this.ctx, result, expectedType), expression);
		} finally {
			this.ctx.expectedType = prevExpectedType;
		}
	}
	_expression(expression) {
		return setSourceNode(this._expressionImpl(expression), expression);
	}
	_expressionImpl(expression) {
		if (isId(expression)) return this._identifier(extractId(expression));
		if (isBool(expression)) return snip(extractBool(expression), bool, "constant", false);
		if (expression[0] === NODE.logicalExpr) {
			const [_, lhs, op, rhs] = expression;
			const lhsExpr = this._expression(lhs);
			const knownLhs = asComptime(lhsExpr);
			if (knownLhs) {
				const castToBool = isBool$1(this.ctx.expectedType);
				if (!(op === "&&" ? knownLhs.value : !knownLhs.value)) return castToBool ? snip(op === "||", bool, "constant", false) : coerceToSnippet(knownLhs.value);
				const rhsExpr = this._expression(rhs);
				const knownRhs = asComptime(rhsExpr);
				if (knownRhs) {
					const rhsSnippet = coerceToSnippet(knownRhs.value);
					return castToBool ? tryConvertSnippet(this.ctx, rhsSnippet, bool, false) : rhsSnippet;
				}
				if (rhsExpr.dataType === UnknownData) throw new WgslTypeError(`Right-hand side '${stringifySnippet(rhsExpr)}' of '${op}' is of unknown type.`);
				return castToBool ? tryConvertSnippet(this.ctx, rhsExpr, bool, false) : rhsExpr;
			}
			const rhsExpr = this._expression(rhs);
			if (lhsExpr.dataType === UnknownData) throw new WgslTypeError(`Left-hand side '${stringifySnippet(lhsExpr)}' of '${op}' is of unknown type.`);
			if (!asComptime(rhsExpr) && rhsExpr.dataType === UnknownData) throw new WgslTypeError(`Right-hand side '${stringifySnippet(rhsExpr)}' of '${op}' is of unknown type.`);
			if (!isBool$1(lhsExpr.dataType) || !isBool$1(rhsExpr.dataType)) throw new WgslTypeError(`Logical expression '${stringifyNode(expression)}' requires boolean operands. Got '${String(lhsExpr.dataType)}' and '${String(rhsExpr.dataType)}'.`);
			const lhsStr = this.ctx.resolveSnippet(lhsExpr).value;
			const rhsStr = this.ctx.resolveSnippet(rhsExpr).value;
			return snip(`(${lhsStr} ${op} ${rhsStr})`, bool, "runtime", lhsExpr.possibleSideEffects || rhsExpr.possibleSideEffects);
		}
		if (expression[0] === NODE.binaryExpr || expression[0] === NODE.assignmentExpr) {
			const [exprType, lhs, op, rhs] = expression;
			const lhsExpr = this._expression(lhs);
			const rhsExpr = this._expression(rhs);
			if (rhsExpr.value instanceof RefOperator) throw new WgslTypeError(`Cannot assign a ref to an existing variable '${stringifyNode(lhs)}', define a new variable instead.`);
			if (op === "==") throw new Error("Please use the === operator instead of ==");
			if (op === "!=") throw new Error("Please use the !== operator instead of !=");
			const stdBinaryRelationalOp = binaryRelationalOpToStdMap[op];
			const knownLhs = stdBinaryRelationalOp && asComptime(lhsExpr);
			const knownRhs = knownLhs && asComptime(rhsExpr);
			if (stdBinaryRelationalOp && knownLhs && knownRhs) {
				const left = knownLhs.value;
				const right = knownRhs.value;
				switch (op) {
					case "===": return snip(left === right, bool, "constant", false);
					case "!==": return snip(left !== right, bool, "constant", false);
				}
				if (typeof left !== "number" || typeof right !== "number") {
					const bothVectors = isVec(lhsExpr.dataType) && isVec(rhsExpr.dataType);
					throw new WgslTypeError(`Comparison '${stringifyNode(expression)}' requires numeric operands.${bothVectors ? ` For component-wise comparison, use 'std.${stdBinaryRelationalOp}'.` : ""}`);
				}
				switch (op) {
					case "<": return snip(left < right, bool, "constant", false);
					case "<=": return snip(left <= right, bool, "constant", false);
					case ">": return snip(left > right, bool, "constant", false);
					case ">=": return snip(left >= right, bool, "constant", false);
				}
			}
			if (lhsExpr.dataType === UnknownData) throw new WgslTypeError(`Left-hand side '${stringifySnippet(lhsExpr)}' of '${op}' is of unknown type.`);
			if (rhsExpr.dataType === UnknownData) throw new WgslTypeError(`Right-hand side '${stringifySnippet(rhsExpr)}' of '${op}' is of unknown type.`);
			const codegen = binaryOpCodeToCodegen[op];
			if (codegen) return codegen(this.ctx, [lhsExpr, rhsExpr]);
			let convLhs;
			let convRhs;
			if (bitShiftOps.includes(op)) {
				const lhsDataType = lhsExpr.dataType;
				if (!isInteger(lhsDataType) && !isIntegerVec(lhsDataType)) throw new WgslTypeError(`Expression: ${stringifyNode(expression)}\nLeft-hand side of '${op}' must be an integer or vector of integers.\nGot ${this.ctx.resolve(lhsDataType).value}.`);
				const lhsPrimitive = isVec(lhsDataType) ? lhsDataType.primitive : lhsDataType;
				if ([">>>", ">>>="].includes(op) && lhsPrimitive.type !== "u32") throw new WgslTypeError(`Expression: ${stringifyNode(expression)}\nLeft-hand side of '${op}' must be an unsigned integer or vector of unsigned integers.\nGot ${this.ctx.resolve(lhsDataType).value}.\nUse ${op.slice(1)} instead.`);
				if ([">>", ">>="].includes(op) && lhsPrimitive.type === "u32") logger.warn("deprecated", `\nExpression: ${stringifyNode(expression)}\nUsing u32 or vecN<u32> as left-hand side of ${op} is deprecated.\nUse >${op} instead.`);
				let rhsTarget;
				if (isVec(lhsDataType)) {
					const cc = lhsDataType.componentCount;
					rhsTarget = cc === 2 ? vec2u$1 : cc === 3 ? vec3u$1 : vec4u$1;
				} else rhsTarget = u32;
				convRhs = tryConvertSnippet(this.ctx, rhsExpr, rhsTarget, false);
				convLhs = lhsExpr;
			} else {
				const forcedType = exprType === NODE.assignmentExpr ? [lhsExpr.dataType] : void 0;
				[convLhs, convRhs] = convertToCommonType(this.ctx, [lhsExpr, rhsExpr], forcedType) ?? [lhsExpr, rhsExpr];
			}
			const type = operatorToType(convLhs.dataType, op, convRhs.dataType);
			if (exprType === NODE.assignmentExpr) {
				validateSnippetMutation(convLhs, expression);
				this.tryMarkModified(lhs);
				if (op === "=" && isStoredInMemory(rhsExpr) && !isNaturallyEphemeral(rhsExpr.dataType)) throw new WgslTypeError(`'${stringifyNode(expression)}' is invalid, because references cannot be assigned.\n-----\nTry '${stringifyNode(lhs)} = ${this.ctx.resolve(unptr(rhsExpr.dataType)).value}(${stringifyNode(rhs)})' to copy the value instead.\n-----`);
			}
			if (stdBinaryRelationalOp) {
				const equalityCheck = ["===", "!=="].includes(op);
				if (!(isNumericSchema(convLhs.dataType) && isNumericSchema(convRhs.dataType) || equalityCheck && isBool$1(convLhs.dataType) && isBool$1(convRhs.dataType))) {
					const bothVectors = isVec(convLhs.dataType) && isVec(convRhs.dataType);
					throw new WgslTypeError(`Comparison '${stringifyNode(expression)}' requires numeric${equalityCheck ? " or boolean" : ""} operands. Got '${String(convLhs.dataType)}' and '${String(convRhs.dataType)}'.${bothVectors ? ` For component-wise comparison, use 'std.${stdBinaryRelationalOp}'.` : ""}`);
				}
			}
			return snip(this.emitBinaryOp(convLhs, OP_MAP[op] ?? op, convRhs), type, "runtime", exprType === NODE.assignmentExpr || lhsExpr.possibleSideEffects || rhsExpr.possibleSideEffects);
		}
		if (expression[0] === NODE.postUpdate) throw new Error(`'${stringifyNode(expression)}' is invalid because update is only allowed as a statement.`);
		if (expression[0] === NODE.unaryExpr) {
			const [_, op, arg] = expression;
			const argExpr = this._expression(arg);
			const codegen = unaryOpCodeToCodegen[op];
			if (codegen) return codegen(this.ctx, [argExpr]);
			const argStr = this.ctx.resolveSnippet(argExpr).value;
			const type = operatorToType(argExpr.dataType, op);
			return snip(`${op}${argStr}`, type, "runtime", argExpr.possibleSideEffects);
		}
		if (expression[0] === NODE.memberAccess) {
			const [_, targetNode, propertyNode] = expression;
			const target = this._expression(targetNode);
			const property = extractId(propertyNode);
			const accessed = accessProp(target, property);
			if (!accessed) throw new Error(`Property '${property}' not found on '${stringifyNode(targetNode)}'`);
			return accessed;
		}
		if (expression[0] === NODE.indexAccess) {
			const [_, targetNode, propertyNode] = expression;
			const target = this._expression(targetNode);
			const inProperty = this._expression(propertyNode);
			const accessed = accessIndex(target, convertToCommonType(this.ctx, [inProperty], [u32, i32], false)?.[0] ?? inProperty);
			if (!accessed) throw new Error(`Index access '${stringifyNode(expression)}' is invalid. If the value is an array, to address this, consider one of the following approaches: (1) declare the array using 'tgpu.const', (2) store the array in a buffer, or (3) define the array within the GPU function scope.`);
			return accessed;
		}
		if (expression[0] === NODE.numericLiteral) {
			const type = typeof expression[1] === "string" ? numericLiteralToSnippet(parseNumericString(expression[1])) : numericLiteralToSnippet(expression[1]);
			invariant(type, `Expected ${stringifyNode(expression)} to be valid numeric literal`);
			return type;
		}
		if (expression[0] === NODE.call) {
			const [_, calleeNode, argNodes] = expression;
			const _callee = this._expression(calleeNode);
			const callee = mathToStd.has(_callee.value) ? snip(mathToStd.get(_callee.value), UnknownData, "runtime", _callee.possibleSideEffects) : _callee;
			if (supportedLogOps().includes(callee.value)) return this.ctx.generateLog(callee.value, argNodes.map((arg) => this._expression(arg)));
			if (isWgslStruct(callee.value)) {
				if (argNodes.length > 1) throw new WgslTypeError("Struct schemas should always be called with at most 1 argument");
				if (!argNodes[0]) return snip(`${this.ctx.resolve(callee.value).value}()`, callee.value, "runtime", false);
				const arg = this._typedExpression(argNodes[0], callee.value);
				return snip(this.ctx.resolveSnippet(arg).value, callee.value, "runtime", arg.possibleSideEffects);
			}
			if (isWgslArray(callee.value)) {
				if (argNodes.length > 1) throw new WgslTypeError("Array schemas should always be called with at most 1 argument");
				if (!argNodes[0]) return this.typeInstantiation(callee.value, []);
				const arg = this._typedExpression(argNodes[0], callee.value);
				if (arg.value instanceof ArrayExpression) return this.typeInstantiation(callee.value, arg.value.elements);
				return snip(this.ctx.resolveSnippet(arg).value, callee.value, fallthroughCopyOrigin(arg.origin), arg.possibleSideEffects);
			}
			if (callee.value === constant) throw new Error("Constants cannot be defined within TypeGPU function scope. To address this, move the constant definition outside the function scope.");
			if (isInfixDispatch(callee.value)) {
				if (!argNodes[0]) throw new WgslTypeError(`An infix operator '${getName(callee.value.operator)}' was called without any arguments`);
				const lhs = coerceToSnippet(callee.value.lhs);
				const rhs = this._expression(argNodes[0]);
				return callee.value.operator[$gpuCallable].call(this.ctx, [lhs, rhs]);
			}
			if ((callee.value === _ref || callee.value === unroll) && argNodes[0]) this.tryMarkModified(argNodes[0]);
			if (isGPUCallable(callee.value)) {
				const callable = callee.value[$gpuCallable];
				const strictSignature = callable.strictSignature;
				let convertedArguments;
				if (strictSignature) convertedArguments = argNodes.map((arg, i) => {
					const argType = strictSignature.argTypes[i];
					if (!argType) throw new WgslTypeError(`Call '${stringifyNode(expression)}' is invalid since the function expected fewer arguments`);
					return this._typedExpression(arg, argType);
				});
				else convertedArguments = argNodes.map((arg) => this._expression(arg));
				try {
					return callable.call(this.ctx, convertedArguments);
				} catch (err) {
					if (err instanceof ResolutionError) throw err;
					throw new ResolutionError(err, [{ toString: () => `fn:${getName(callee.value)}` }]);
				}
			}
			if (!isMarkedInternal(callee.value) || isGenericFn(callee.value)) {
				const args = argNodes.map((arg) => this._expression(arg));
				const result = this._callShellless(callee.value, args);
				if (result) return result;
			}
			const maybeMathMethod = Object.getOwnPropertyNames(Math).find((prop) => Math[prop] === callee.value);
			if (maybeMathMethod) throw new Error(`Unsupported Math functionality 'Math.${maybeMathMethod}()'. Use an std alternative, or implement the function manually.`);
			const maybeConsoleMethod = Object.getOwnPropertyNames(console).find((prop) => console[prop] === callee.value);
			if (maybeConsoleMethod) throw new Error(`Unsupported console functionality 'console.${maybeConsoleMethod}()'.`);
			throw new Error(`Function '${getName(callee.value) ?? stringifySnippet(callee)}' is not marked with the 'use gpu' directive and cannot be used in a shader`);
		}
		if (expression[0] === NODE.objectExpr) {
			const properties = Array.isArray(expression[1]) ? expression[1] : Object.entries(expression[1]).map(([key, value]) => [
				key,
				value,
				false
			]);
			const seenKeys = /* @__PURE__ */ new Map();
			const resolveUniqueKey = (prop) => {
				const key = this._resolveObjectPropertyKey(prop);
				const dupProp = seenKeys.get(key);
				if (dupProp) throw new WgslTypeError(`Duplicate object property key found: '${stringifyObjectProperty(dupProp)}' and '${stringifyObjectProperty(prop)}'.`);
				seenKeys.set(key, prop);
				return key;
			};
			const structType = this.ctx.expectedType;
			if (structType instanceof AutoStruct) {
				const keySnippetPairs = properties.map((prop) => {
					const key = resolveUniqueKey(prop);
					const value = prop[1];
					let accessed = structType.accessProp(key);
					let expr;
					if (accessed) expr = this._typedExpression(value, accessed.type);
					else {
						expr = this._expression(value);
						if (expr.dataType === UnknownData) throw new WgslTypeError(`Value '${stringifySnippet(expr)}' of property '${key}' in object literal is of unknown type.`);
						accessed = structType.provideProp(key, unptr(concretize(expr.dataType)));
					}
					return [accessed.prop, expr];
				});
				const entries = Object.fromEntries(keySnippetPairs);
				const completeStruct = structType.completeStruct;
				const convertedSnippets = convertStructValues(this.ctx, completeStruct, entries);
				return snip(stitch`${this.ctx.resolve(structType).value}(${convertedSnippets})`, completeStruct, "runtime");
			}
			if (isWgslStruct(structType)) {
				const entries = {};
				const keysWithSideEffectsInSourceOrder = [];
				for (const prop of properties) {
					const key = resolveUniqueKey(prop);
					const value = prop[1];
					const propType = structType.propTypes[key];
					if (propType === void 0) {
						if (this._expression(value).possibleSideEffects) logger.warn("suspicious", `\
Object property '${stringifyObjectProperty(prop)}' in '${stringifyNode(expression)}' does not exist on type '${String(structType)}'.
The generated shader will omit it, so its runtime side effects will not occur.`);
						continue;
					}
					const expr = this._typedExpression(value, propType);
					entries[key] = expr;
					if (expr.possibleSideEffects) keysWithSideEffectsInSourceOrder.push(key);
				}
				for (const key of Object.keys(structType.propTypes)) if (entries[key] === void 0) throw new WgslTypeError(`Missing property ${key} in object literal for struct ${structType}`);
				const keysWithSideEffectsInSchemaOrder = Object.keys(structType.propTypes).filter((key) => entries[key].possibleSideEffects);
				if (keysWithSideEffectsInSourceOrder.some((key, index) => key !== keysWithSideEffectsInSchemaOrder[index])) logger.warn("suspicious", `\
Properties with possible side effects in '${stringifyNode(expression)}' do not match '${String(structType)}' declaration order:

  Source order:           [${keysWithSideEffectsInSourceOrder.join(", ")}]
  Declaration order:      [${keysWithSideEffectsInSchemaOrder.join(", ")}]

The generated shader will evaluate them in declaration order.`);
				const convertedSnippets = convertStructValues(this.ctx, structType, entries);
				return snip(stitch`${this.ctx.resolve(structType).value}(${convertedSnippets})`, structType, "runtime", convertedSnippets.some((s) => s.possibleSideEffects));
			}
			throw new WgslTypeError(`No target type could be inferred for object '${stringifyNode(expression)}', please wrap the object in the corresponding schema.`);
		}
		if (expression[0] === NODE.arrayExpr) {
			const [_, valueNodes] = expression;
			const arrType = this.ctx.expectedType;
			let elemType;
			let values;
			if (isWgslArray(arrType)) {
				elemType = arrType.elementType;
				values = valueNodes.map((value) => this._typedExpression(value, elemType));
				if (values.length !== arrType.elementCount) throw new WgslTypeError(`Cannot create value of type '${arrType}' from an array of length: ${values.length}`);
			} else {
				const valuesSnippets = valueNodes.map((value) => this._expression(value));
				if (valuesSnippets.length === 0) throw new WgslTypeError("Cannot infer the type of an empty array literal.");
				const converted = convertToCommonType(this.ctx, valuesSnippets);
				if (!converted) throw new WgslTypeError(`Values '${stringifyNode(expression)}' cannot be automatically converted to a common type. Consider wrapping the array in an appropriate schema`);
				values = converted;
				elemType = concretize(values[0]?.dataType);
			}
			const arrayType = arrayOf(elemType, values.length);
			const allConstant = values.every((value) => value.origin === "constant");
			return snip(new ArrayExpression(arrayType, values), arrayType, allConstant ? "constant" : "runtime", values.some((v) => v.possibleSideEffects));
		}
		if (expression[0] === NODE.conditionalExpr) {
			const [_, testNode, consequentNode, alternativeNode] = expression;
			const test = this._expression(testNode);
			const knownTest = asComptime(test);
			if (knownTest) return knownTest.value ? this._expression(consequentNode) : this._expression(alternativeNode);
			else {
				const convertedTest = tryConvertSnippet(this.ctx, test, bool, false);
				const consequent = this._expression(consequentNode);
				const alternative = this._expression(alternativeNode);
				const [con, alt] = convertToCommonType(this.ctx, [consequent, alternative], validSelectBranchTypes) ?? [];
				if (!con || !alt || consequent.possibleSideEffects || alternative.possibleSideEffects || isStoredInMemory(consequent) && !isNaturallyEphemeral(consequent.dataType) || isStoredInMemory(alternative) && !isNaturallyEphemeral(alternative.dataType)) throw new Error(`Ternary operator '${stringifyNode(expression)}' is invalid. For more complex branching, please use 'std.select' or if/else statements.`);
				return snip(stitch`select(${alt}, ${con}, ${convertedTest})`, con.dataType, "runtime", test.possibleSideEffects);
			}
		}
		if (expression[0] === NODE.stringLiteral) return snip(expression[1], UnknownData, "constant", false);
		if (expression[0] === NODE.preUpdate) throw new Error("Cannot use pre-updates in TypeGPU functions.");
		if (expression[0] === NODE.nullLiteral) return snip(null, UnknownData, "constant", false);
		assertExhaustive(expression);
	}
	declareGlobalConst(options) {
		const resolvedDataType = this.ctx.resolve(options.dataType).value;
		const resolvedValue = this.ctx.resolveSnippet(options.init).value;
		this.ctx.addDeclaration(`const ${options.id}: ${resolvedDataType} = ${resolvedValue};`, options.id);
		return snip(options.id, options.dataType, "constant-immutable-def");
	}
	declareGlobalVar(options) {
		let pre = "";
		if (options.group !== void 0) pre += `@group(${options.group}) `;
		if (options.binding !== void 0) pre += `@binding(${options.binding}) `;
		if (options.scope in usageToVarTemplateMap) pre += `var<${usageToVarTemplateMap[options.scope]}> `;
		else pre += `var `;
		pre += `${options.id}: ${this.ctx.resolve(options.dataType).value}`;
		this.ctx.addDeclaration(options.init ? `${pre} = ${this.ctx.resolveSnippet(options.init).value};` : `${pre};`, options.id);
		return snip(options.id, options.dataType, options.scope);
	}
	functionDefinition(options) {
		invariant(this.ctx.blockDepth === functionInitialBlockDepth - 1, `Expecting exactly ${functionInitialBlockDepth - 1} block(s) before going into the first function block scope`);
		let body = this._block(options.body, false);
		const scope = this.ctx.topFunctionScope;
		invariant(scope, "Expected function scope to be present");
		const replacements = Object.fromEntries([...scope.placeholderForVariable.entries()].map(([variable, placeholder]) => [placeholder, scope.modifiedVariables.has(variable) ? "var" : "let"]));
		if (Object.keys(replacements).length > 0) {
			const regex = new RegExp(Object.keys(replacements).join("|"), "gi");
			body.code = body.code.replace(regex, (match) => replacements[match] ?? "#ERR");
		}
		const returnType = options.determineReturnType();
		const argList = options.args.filter((arg) => arg.used || options.functionType === "normal").map((arg) => {
			return `${getAttributesString(arg.decoratedType)}${arg.name}: ${this.ctx.resolve(arg.decoratedType).value}`;
		}).join(", ");
		const head = returnType.type !== "void" ? `(${argList}) -> ${getAttributesString(returnType)}${this.ctx.resolve(returnType).value} ` : `(${argList}) `;
		let attributes = "";
		if (options.functionType === "compute") {
			if (!options.workgroupSize) throw new Error("Compute shaders must have a workgroup size");
			attributes = `@compute @workgroup_size(${options.workgroupSize.join(", ")}) `;
		} else if (options.functionType === "vertex") attributes = `@vertex `;
		else if (options.functionType === "fragment") attributes = `@fragment `;
		return `${attributes}fn ${options.name}${head}${body.code || "{}"}`;
	}
	/**
	* Generates a WGSL type string for the given data type, and adds necessary
	* definitions to the shader preamble. This shouldn't be called directly, only
	* through `ctx.resolve` to properly cache the result.
	*/
	emitTypeAnnotation(data) {
		return resolveData(this.ctx, data);
	}
	typeInstantiation(schema, args) {
		if (args.length === 1 && args[0]?.dataType === schema) return snip(stitch`${args[0]}`, schema, fallthroughCopyOrigin(args[0].origin), args[0].possibleSideEffects);
		return snip(stitch`${this.ctx.resolve(schema).value}(${args})`, schema, args.every((arg) => arg.origin === "constant") ? "constant" : "runtime", args.some((s) => s.possibleSideEffects));
	}
	numericLiteral(value, schema) {
		if (!Number.isFinite(value)) throw new Error(`Value '${value}' (${schema.type}) cannot be resolved due to WGSL's Finite Math Assumption (see: https://www.w3.org/TR/WGSL/#finite-math-assumption). This value might be a result of a comptime-evaluated operation.`);
		if (schema.type === "abstractInt") return snip(`${value}`, schema, "constant", false);
		if (schema.type === "u32") return snip(`${value}u`, schema, "constant", false);
		if (schema.type === "i32") return snip(`${value}i`, schema, "constant", false);
		const exp = value.toExponential();
		const decimal = schema.type === "abstractFloat" && Number.isInteger(value) ? `${value}.` : `${value}`;
		const base = exp.length < decimal.length ? exp : decimal;
		if (schema.type === "f32") return snip(`${base}f`, schema, "constant", false);
		if (schema.type === "f16") return snip(`${base}h`, schema, "constant", false);
		return snip(base, schema, "constant", false);
	}
	emitCall(name, templateParams, args) {
		const resolvedTemplateParams = templateParams.map((arg) => this.ctx.resolveSnippet(arg).value).join(", ");
		const resolvedArgs = args.map((arg) => this.ctx.resolveSnippet(arg).value).join(", ");
		if (resolvedTemplateParams.length > 0) return `${name}<${resolvedTemplateParams}>(${resolvedArgs})`;
		return `${name}(${resolvedArgs})`;
	}
	emitBinaryOp(lhs, op, rhs) {
		const lhsStr = this.ctx.resolveSnippet(lhs).value;
		const rhsStr = this.ctx.resolveSnippet(rhs).value;
		return parenthesizedOps.includes(op) ? `(${lhsStr} ${op} ${rhsStr})` : `${lhsStr} ${op} ${rhsStr}`;
	}
	_return(statement) {
		const returnNode = statement[1];
		if (returnNode !== void 0) {
			const expectedReturnType = this.ctx.topFunctionReturnType;
			let returnSnippet = expectedReturnType ? this._typedExpression(returnNode, expectedReturnType) : this._expression(returnNode);
			if (returnSnippet.value === void 0 && isVoid(returnSnippet.dataType)) {
				this.ctx.reportReturnType(Void);
				return `${this.ctx.pre}return;`;
			}
			if (returnSnippet.value instanceof RefOperator) throw new WgslTypeError(`Cannot return '${stringifyNode(returnNode)}' because it is a d.ref`);
			if (returnSnippet.origin === "argument" && !isNaturallyEphemeral(returnSnippet.dataType) && this.ctx.topFunctionScope?.functionType === "normal") throw new WgslTypeError(`'${stringifyNode(statement)}' is invalid, cannot return references to arguments. Copy the argument before returning it.`);
			if (!expectedReturnType && isStoredInMemory(returnSnippet) && !isNaturallyEphemeral(returnSnippet.dataType) && returnSnippet.origin !== "local-def") {
				const str = stringifyNode(returnNode);
				const typeStr = this.ctx.resolve(unptr(returnSnippet.dataType)).value;
				throw new WgslTypeError(`'return ${str};' is invalid, cannot return references.
-----
Try 'return ${typeStr}(${str});' instead.
-----`);
			}
			returnSnippet = tryConvertSnippet(this.ctx, returnSnippet, unptr(returnSnippet.dataType), false);
			invariant(returnSnippet.dataType !== UnknownData, "Return type should be known");
			this.ctx.reportReturnType(returnSnippet.dataType);
			return stitch`${this.ctx.pre}return ${returnSnippet};`;
		}
		this.ctx.reportReturnType(Void);
		return `${this.ctx.pre}return;`;
	}
	_letStatement(statement) {
		const [_, rawIdNode, eqNode] = statement;
		const rawId = extractId(rawIdNode);
		if (eqNode === void 0) throw new Error(`'${stringifyNode(statement)}' is invalid because all variables need initializers.`);
		const eq = this._expression(eqNode);
		if (eq.value instanceof RefOperator) {
			const rhsStr = stringifyNode(eqNode);
			throw new WgslTypeError(`'let ${rawId} = ${rhsStr}' is invalid, cannot initialize 'let' variables with d.ref()
-----
- Try 'const ${rawId} = ${rhsStr}'.
-----`);
		}
		const definitionDataType = eq.dataType;
		if (definitionDataType === UnknownData || isVoid(definitionDataType)) {
			const rhsStr = stringifyNode(eqNode);
			const declaration = `let ${rawId}`;
			throw new WgslTypeError(`'${declaration} = ${rhsStr}' is invalid, cannot determine WGSL type of '${rhsStr}'${schemaWrappingSuggestion(declaration, rhsStr, eq.value)}`);
		}
		if (isStoredInMemory(eq) && !isNaturallyEphemeral(eq.dataType)) {
			const rhsStr = stringifyNode(eqNode);
			const rhsTypeStr = this.ctx.resolve(unptr(eq.dataType)).value;
			throw new WgslTypeError(`'let ${rawId} = ${rhsStr}' is invalid, because references cannot be assigned to 'let' variable declarations.
-----
- Try 'let ${rawId} = ${rhsTypeStr}(${rhsStr})' if you need to reassign '${rawId}' later
- Try 'const ${rawId} = ${rhsStr}' if you won't reassign '${rawId}' later.
-----`);
		}
		const concreteType = concretize(definitionDataType);
		const snippet = snip(this.ctx.makeUniqueIdentifier(rawId, "block"), concreteType, "local-def", false);
		this.ctx.defineVariable(rawId, snippet);
		const rhsSnippet = tryConvertSnippet(this.ctx, eq, definitionDataType, false);
		const rhsStr = this.ctx.resolveSnippet(rhsSnippet).value;
		const scope = this.ctx.topFunctionScope;
		invariant(scope, `Expected function scope to be present for ${rawId}`);
		const emittedVarType = `#VAR_${scope.placeholderForVariable.size}#`;
		scope.placeholderForVariable.set(snippet, emittedVarType);
		return {
			code: this._emitVarDecl(emittedVarType, snippet.value, concreteType, rhsStr),
			definesInNearestScope: true
		};
	}
	_constStatement(statement) {
		const [_, rawIdNode, eqNode] = statement;
		const rawId = extractId(rawIdNode);
		if (eqNode === void 0) throw new Error(`'${stringifyNode(statement)}' is invalid because all variables need initializers.`);
		const eq = this._expression(eqNode);
		if (eq.value instanceof RefOperator) {
			if (eq.value.addressable) {
				const refStr = stringifyNode(eqNode);
				throw new WgslTypeError(`'const ${rawId} = ${refStr}' is invalid, cannot store ${refStr} in a variable if it references another value. Copy the value passed into d.ref() instead, or inline ${refStr}.`);
			}
			const refSnippet = eq.value.snippet;
			const varName = this.refVariable(rawId, concretize(refSnippet.dataType));
			return {
				code: stitch`${this.ctx.pre}var ${varName} = ${tryConvertSnippet(this.ctx, refSnippet, refSnippet.dataType, false)};`,
				definesInNearestScope: true
			};
		}
		const rhsNaturallyEphemeral = isNaturallyEphemeral(eq.dataType);
		let varOrigin = "local-def";
		let varType = "<deferred>";
		let definitionDataType = eq.dataType;
		if (definitionDataType === UnknownData || isVoid(definitionDataType)) {
			const rhsStr = stringifyNode(eqNode);
			const declaration = `const ${rawId}`;
			throw new WgslTypeError(`'${declaration} = ${rhsStr}' is invalid, cannot determine WGSL type of '${rhsStr}'${schemaWrappingSuggestion(declaration, rhsStr, eq.value)}`);
		}
		if (eq.origin === "argument") {
			varType = "let";
			varOrigin = rhsNaturallyEphemeral ? "local-def" : "argument";
		} else if (eq.origin === "constant-immutable-def") {
			varType = "const";
			varOrigin = "constant-immutable-def";
		} else if (eq.origin === "runtime-immutable-def") {
			varType = "let";
			varOrigin = "runtime-immutable-def";
		} else if (rhsNaturallyEphemeral) {
			varType = eq.origin === "constant" ? "const" : "let";
			varOrigin = "local-def";
		} else if (!isStoredInMemory(eq)) {
			varType = "<deferred>";
			varOrigin = "local-def";
		} else return this._aliasConstStatement(rawId, eqNode, eq);
		const concreteType = concretize(definitionDataType);
		const snippet = snip(this.ctx.makeUniqueIdentifier(rawId, "block"), concreteType, varOrigin, false);
		this.ctx.defineVariable(rawId, snippet);
		const rhsSnippet = tryConvertSnippet(this.ctx, eq, definitionDataType, false);
		const rhsStr = this.ctx.resolveSnippet(rhsSnippet).value;
		let emittedVarType;
		if (varType === "<deferred>") {
			const scope = this.ctx.topFunctionScope;
			invariant(scope, `Expected function scope to be present for ${rawId}`);
			emittedVarType = `#VAR_${scope.placeholderForVariable.size}#`;
			scope.placeholderForVariable.set(snippet, emittedVarType);
		} else emittedVarType = varType;
		return {
			code: this._emitVarDecl(emittedVarType, snippet.value, concreteType, rhsStr),
			definesInNearestScope: true
		};
	}
	/**
	* Handles `const x = <rhs>;` declarations in which the right-hand side aliases memory
	* that outlives the expression (a buffer, a local variable, an array element, ...).
	*
	* In WGSL we store an *implicit* pointer to that memory, so mutations done through `x`
	* affect the original. Languages without pointers (e.g. GLSL) override this.
	*/
	_aliasConstStatement(rawId, eqNode, eq) {
		let definitionDataType = eq.dataType;
		if (!isPtr(definitionDataType)) {
			const ptrType = createPtrFromOrigin(eq.origin, concretize(definitionDataType));
			invariant(ptrType !== void 0, `Creating pointer type from origin ${eq.origin}`);
			definitionDataType = ptrType;
		}
		definitionDataType = implicitFrom(definitionDataType);
		this.tryMarkModified(eqNode);
		const concreteType = concretize(definitionDataType);
		const snippet = snip(this.ctx.makeUniqueIdentifier(rawId, "block"), concreteType, eq.origin, false);
		this.ctx.defineVariable(rawId, snippet);
		const rhsSnippet = tryConvertSnippet(this.ctx, eq, definitionDataType, false);
		const rhsStr = this.ctx.resolveSnippet(rhsSnippet).value;
		return {
			code: this._emitVarDecl("let", snippet.value, concreteType, rhsStr),
			definesInNearestScope: true
		};
	}
	_statement(statement) {
		if (isId(statement)) {
			const item = this.ctx.getById(extractId(statement));
			if (item?.value instanceof TgpuDeclareImpl) {
				this.ctx.resolveSnippet(item);
				return {
					code: "",
					definesInNearestScope: false
				};
			}
		}
		if (isId(statement) || isBool(statement)) throw new WgslForbiddenStatementError(statement);
		if (statement[0] === NODE.return) return {
			code: this._return(statement),
			endsWithControlFlow: "return",
			definesInNearestScope: false
		};
		if (statement[0] === NODE.if) {
			const [_, condNode, consNode, altNode] = statement;
			const condition = this._typedExpression(condNode, bool);
			if (typeof condition.value === "boolean") {
				let node = condition.value ? consNode : altNode;
				if (node === void 0) return {
					code: "",
					definesInNearestScope: false
				};
				if (!Array.isArray(node)) node = blockifySingleStatement(node);
				if (node[0] === NODE.block && node[1].length === 1 && node[1][0][0] === NODE.if) return this._statement(node[1][0]);
				if (node[0] === NODE.if) return this._statement(node);
				return this._blockStatement(blockifySingleStatement(node));
			}
			const consequent = this._block(blockifySingleStatement(consNode), false);
			const alternate = !altNode ? void 0 : this._block(blockifySingleStatement(altNode), false).code;
			if (!alternate) return {
				code: stitch`${this.ctx.pre}if (${condition}) ${consequent.code || "{}"}`,
				definesInNearestScope: false
			};
			return {
				code: stitch`\
${this.ctx.pre}if (${condition}) ${consequent.code || "{}"}
${this.ctx.pre}else ${alternate}`,
				definesInNearestScope: false
			};
		}
		if (statement[0] === NODE.let) return this._letStatement(statement);
		if (statement[0] === NODE.const) return this._constStatement(statement);
		if (statement[0] === NODE.block) return this._blockStatement(statement);
		if (statement[0] === NODE.for) {
			const [_, init, condition, update, body] = statement;
			const prevUnrollingChain = this.#unrollingChain;
			this.#unrollingChain = [];
			try {
				this.ctx.pushBlockScope();
				const [initStatement, conditionExpr, updateStatement] = this.ctx.withResetIndentLevel(() => [
					init ? this._statement(init).code : void 0,
					condition ? this._typedExpression(condition, bool) : void 0,
					update ? this._statement(update).code : void 0
				]);
				const initStr = initStatement ? initStatement.slice(0, -1) : "";
				const updateStr = updateStatement ? updateStatement.slice(0, -1) : "";
				const bodyStr = this._block(blockifySingleStatement(body), false).code;
				return {
					code: stitch`${this.ctx.pre}for (${initStr}; ${conditionExpr}; ${updateStr}) ${bodyStr || "{}"}`,
					definesInNearestScope: false
				};
			} finally {
				this.#unrollingChain = prevUnrollingChain;
				this.ctx.popBlockScope();
			}
		}
		if (statement[0] === NODE.while) {
			const prevUnrollingChain = this.#unrollingChain;
			this.#unrollingChain = [];
			try {
				const [_, condition, body] = statement;
				const condSnippet = this._typedExpression(condition, bool);
				const conditionStr = this.ctx.resolveSnippet(condSnippet).value;
				const bodyStr = this._block(blockifySingleStatement(body), false).code;
				return {
					code: `${this.ctx.pre}while (${conditionStr}) ${bodyStr || "{}"}`,
					definesInNearestScope: false
				};
			} finally {
				this.#unrollingChain = prevUnrollingChain;
			}
		}
		if (statement[0] === NODE.forOf) {
			const [_, loopVar, iterable, body] = statement;
			if (loopVar[0] !== NODE.const) throw new WgslTypeError("Only `for (const ... of ... )` loops are supported");
			this.tryMarkModified(iterable);
			let ctxIndent = false;
			const prevUnrollingChain = this.#unrollingChain;
			try {
				this.ctx.pushBlockScope();
				const iterableExpr = this._expression(iterable);
				const shouldUnroll = iterableExpr.value instanceof UnrollableIterable;
				const iterableSnippet = shouldUnroll ? iterableExpr.value.snippet : iterableExpr;
				const range = getRangeSnippets(this.ctx, iterableSnippet, shouldUnroll);
				const originalLoopVarName = extractId(loopVar[1]);
				const blockified = blockifySingleStatement(body);
				if (shouldUnroll) {
					const knownEnd = asComptime(range.end);
					if (!knownEnd) throw new Error("Cannot unroll loop. Length of iterable is unknown at comptime.");
					const { value } = iterableSnippet;
					const elements = isTgpuRange(value) ? value.map((i) => coerceToSnippet(i)) : value instanceof ArrayExpression ? value.elements : Array.from({ length: knownEnd.value }, (_, i) => getElementSnippet(iterableSnippet, snip(i, u32, "constant")));
					if (elements.length === 0) return {
						code: "",
						definesInNearestScope: false
					};
					const firstElement = elements[0];
					if (!isStoredInMemory(firstElement) && !isNaturallyEphemeral(firstElement.dataType)) throw new WgslTypeError(`Cannot unroll '${stringifyNode(iterable)}'. The elements of iterable are constructed in place but are not value types.`);
					let blocksCode = "";
					let endsWithControlFlow;
					let definesInNearestScope = false;
					for (let i = 0; i < elements.length; i++) {
						const e = elements[i];
						this.#unrollingChain = [...prevUnrollingChain, i];
						const resolvedBlock = this._blockStatement(blockified, { [originalLoopVarName]: e });
						definesInNearestScope ||= resolvedBlock.definesInNearestScope;
						blocksCode += `${this.ctx.pre}// unrolled iteration ${this.#unrollingChain.map((idx) => `#${idx}`).join(" / ")}\n${resolvedBlock.code}\n`;
						if (resolvedBlock.endsWithControlFlow !== void 0) {
							endsWithControlFlow = resolvedBlock.endsWithControlFlow;
							break;
						}
					}
					return {
						code: `${blocksCode}${this.ctx.pre}// ---`,
						endsWithControlFlow,
						definesInNearestScope
					};
				}
				this.#unrollingChain = [];
				const index = this.ctx.makeUniqueIdentifier("i", "block");
				const forHeaderStr = stitch`${this.ctx.pre}for (var ${index} = ${range.start}; ${index} ${range.comparison} ${range.end}; ${index} += ${range.step})`;
				let bodyStr = "";
				if (isTgpuRange(iterableSnippet.value)) bodyStr = this._block(blockified, false, { [originalLoopVarName]: snip(index, range.start.dataType, "runtime", false) }).code;
				else {
					this.ctx.indent();
					ctxIndent = true;
					const loopVarName = this.ctx.makeUniqueIdentifier(originalLoopVarName, "block");
					const elementSnippet = getElementSnippet(iterableSnippet, snip(index, u32, "runtime"));
					const loopVarKind = getLoopVarKind(elementSnippet);
					const elementType = getElementType(elementSnippet, iterableSnippet);
					bodyStr = `{\n${stitch`${this.ctx.pre}${loopVarKind} ${loopVarName} = ${tryConvertSnippet(this.ctx, elementSnippet, elementType, false)};`}\n${this._blockStatement(blockified, { [originalLoopVarName]: snip(loopVarName, elementType, elementSnippet.origin, false) }).code}\n`;
					this.ctx.dedent();
					bodyStr += `${this.ctx.pre}}`;
					ctxIndent = false;
				}
				return {
					code: stitch`${forHeaderStr} ${bodyStr.trim() || "{}"}`,
					definesInNearestScope: false
				};
			} finally {
				if (ctxIndent) this.ctx.dedent();
				this.#unrollingChain = prevUnrollingChain;
				this.ctx.popBlockScope();
			}
		}
		if (statement[0] === NODE.switch) {
			const [_, discriminant, cases] = statement;
			let discriminantExpr = this._expression(discriminant);
			let caseExprs = cases.map(([test, consequent]) => {
				return [test === null ? switchDefault : this._expression(test), consequent];
			});
			let matchedCaseWasNotLast = false;
			const knownDiscriminant = asComptime(discriminantExpr);
			const knownTests = knownDiscriminant && caseExprs.map(([test]) => asComptime(test));
			if (knownDiscriminant && knownTests?.every((test) => test !== void 0)) {
				let matchedCaseIndex = knownTests.findIndex((test) => test !== switchDefault && test?.value === knownDiscriminant.value);
				if (matchedCaseIndex === -1) matchedCaseIndex = caseExprs.findIndex(([test]) => test === switchDefault);
				if (matchedCaseIndex === -1) return {
					code: "",
					definesInNearestScope: false
				};
				const matchedConsequent = caseExprs.slice(matchedCaseIndex).find(([, consequent]) => consequent.length !== 0)?.[1];
				if (matchedConsequent === void 0) return {
					code: "",
					definesInNearestScope: false
				};
				if (matchedConsequent !== caseExprs.at(-1)?.[1]) matchedCaseWasNotLast = true;
				discriminantExpr = snip(0, u32, "constant", false);
				caseExprs = [[switchDefault, matchedConsequent]];
			}
			discriminantExpr = tryConvertSnippet(this.ctx, discriminantExpr, [i32, u32]);
			const switchType = discriminantExpr.dataType;
			invariant(switchType !== UnknownData);
			caseExprs = caseExprs.map(([test, consequent]) => {
				if (test !== switchDefault && test.dataType === UnknownData) throw new Error(`Failed to convert one of the switch tests to '${switchType.type}'`);
				return [test === switchDefault ? test : tryConvertSnippet(this.ctx, test, [switchType]), consequent];
			});
			const resolvedCaseExprs = caseExprs.map(([test, consequent]) => {
				this.ctx.pushBlockScope();
				this.ctx.indent();
				this.ctx.indent();
				try {
					return [test, consequent.map((s) => this._statement(s))];
				} finally {
					this.ctx.dedent();
					this.ctx.dedent();
					this.ctx.popBlockScope();
				}
			});
			const groupedCaseExprs = [];
			let currentGroup = [];
			for (const [index, [test, consequent]] of resolvedCaseExprs.entries()) {
				currentGroup.push(test);
				if (consequent.length > 0 || index === caseExprs.length - 1) {
					groupedCaseExprs.push([currentGroup, consequent]);
					currentGroup = [];
				}
			}
			caseExprs.forEach(([testExpr], i) => {
				if (!isConstant(testExpr)) {
					const testNode = cases[i]?.[0];
					invariant(testNode, `Expected node to be not nullish.`);
					throw new Error(`All of switch tests must be constant.
Test '${stringifyNode(testNode)}' is not constant, making the following switch statement invalid. 
This error may be caused by an implicit conversion.
${stringifyNode(statement)}`);
				}
			});
			resolvedCaseExprs.slice(0, matchedCaseWasNotLast ? void 0 : -1).forEach(([_, consequent]) => {
				const last = consequent.at(-1);
				if (last && !last.endsWithControlFlow) throw new Error(`Switch statement cannot have non-trivial fallthrough.
The following switch statement is invalid:
${stringifyNode(statement)}`);
			});
			return {
				code: this._emitSwitchStatement(discriminantExpr, groupedCaseExprs),
				definesInNearestScope: false
			};
		}
		if (statement[0] === NODE.postUpdate) {
			const [_, op, arg] = statement;
			const argExpr = this._expression(arg);
			const argStr = this.ctx.resolveSnippet(argExpr).value;
			validateSnippetMutation(argExpr, statement);
			this.tryMarkModified(arg);
			return {
				code: `${this.ctx.pre}${argStr}${op};`,
				definesInNearestScope: false
			};
		}
		if (statement[0] === NODE.continue) {
			if (this.#unrollingChain.length > 0) throw new WgslTypeError("Cannot unroll loop containing `continue`");
			return {
				code: `${this.ctx.pre}continue;`,
				endsWithControlFlow: "continue",
				definesInNearestScope: false
			};
		}
		if (statement[0] === NODE.break) {
			if (this.#unrollingChain.length > 0) throw new WgslTypeError("Cannot unroll loop containing `break`");
			return {
				code: `${this.ctx.pre}break;`,
				endsWithControlFlow: "break",
				definesInNearestScope: false
			};
		}
		if (statement[0] === NODE.numericLiteral || statement[0] === NODE.binaryExpr || statement[0] === NODE.unaryExpr || statement[0] === NODE.logicalExpr || statement[0] === NODE.arrayExpr || statement[0] === NODE.objectExpr || statement[0] === NODE.nullLiteral) throw new WgslForbiddenStatementError(statement);
		const expr = this._expression(statement);
		const resolved = expr.value !== void 0 && expr.value !== null ? this.ctx.resolveSnippet(expr).value : "";
		return {
			code: resolved ? `${this.ctx.pre}${resolved};` : "",
			definesInNearestScope: false
		};
	}
	/**
	* Resolves the key of an object property. Handles both computed and non-computed keys.
	*/
	_resolveObjectPropertyKey(property) {
		if (!property[2]) return property[0];
		const key = asComptime(this._expression(property[0]));
		if (!key) throw new WgslTypeError(`Computed object property key '${stringifyObjectProperty(property)}' must be known at comptime.`);
		if (typeof key.value !== "string") throw new WgslTypeError("Object property keys must be strings in TypeGPU functions.");
		return key.value;
	}
	/**
	* Attempts a member access lookup to mark a variable as modified.
	* @example
	* // given `let a; a = 1;`
	* tryMarkModified('a') // `a` is marked in the function scope
	*
	* // given `const obj; obj.prop = 1;`
	* tryMarkModified('obj.prop') // `obj` is marked in the function scope
	*
	* // given `this.buffer.$;`
	* tryMarkModified('this.buffer.$') // `this` is not marked, since there is no placeholder for it
	*/
	tryMarkModified(expr) {
		if (!expr) return;
		const maybeObject = extractObject(expr);
		if (maybeObject !== void 0) {
			const snippet = this.ctx.getById(maybeObject);
			const scope = this.ctx.topFunctionScope;
			if (snippet && scope && scope.placeholderForVariable.has(snippet)) scope.modifiedVariables.add(snippet);
		}
	}
};
var immutabilityReasons = {
	constant: "the left side is a constant",
	"constant-immutable-def": "the left side is a constant",
	"runtime-immutable-def": "the left side is immutable",
	uniform: "uniform buffers cannot be mutated",
	readonly: "readonly buffers cannot be mutated",
	immediate: "immediate variables cannot be mutated",
	argument: "non-pointer arguments cannot be mutated",
	handle: "textures and samplers cannot be mutated"
};
function validateSnippetMutation(mutated, expr) {
	if (isMutableOrigin(mutated.origin)) return;
	const reason = asComptime(mutated) ? "the left side is immutable during shader execution. Try using tgpu.privateVar or buffers" : immutabilityReasons[mutated.origin] ?? "the left side is not a reference to an existing value";
	throw new WgslTypeError(`'${stringifyNode(expr)}' is invalid, because ${reason}.`);
}
function assertExhaustive(value) {
	throw new Error(`'${safeStringify(value)}' was not handled by the WGSL generator.`);
}
function parseNumericString(str) {
	if (/^0x[0-9a-f]+$/i.test(str)) return Number.parseInt(str);
	if (/^0b[01]+$/i.test(str)) return Number.parseInt(str.slice(2), 2);
	return Number.parseFloat(str);
}
function blockifySingleStatement(statement) {
	return typeof statement !== "object" || statement[0] !== NODE.block ? [NODE.block, [statement]] : statement;
}
function extractObject(expr) {
	let object = expr;
	while (Array.isArray(object) && (object[0] === NODE.memberAccess || object[0] === NODE.indexAccess)) object = object[1];
	if (isId(object)) return extractId(object);
}
function isId(expr) {
	return typeof expr === "string" || Array.isArray(expr) && expr[0] === NODE.identifier;
}
function extractId(ident) {
	if (typeof ident === "string") return ident;
	return ident[1];
}
function isBool(expr) {
	return typeof expr === "boolean" || Array.isArray(expr) && expr[0] === NODE.booleanLiteral;
}
function extractBool(ident) {
	if (typeof ident === "boolean") return ident;
	return ident[1];
}
//#endregion
//#region ../../node_modules/.pnpm/typed-binary@4.3.4/node_modules/typed-binary/dist/io/measurer.js
var UnboundedMeasurer = class {
	size = NaN;
	unbounded = this;
	isUnbounded = true;
	add() {
		return this;
	}
	fork() {
		return this;
	}
};
var unboundedMeasurer = /* @__PURE__ */ new UnboundedMeasurer();
var Measurer = class Measurer {
	size = 0;
	unbounded = unboundedMeasurer;
	isUnbounded = false;
	add(bytes) {
		this.size += bytes;
		return this;
	}
	fork() {
		const forked = new Measurer();
		forked.size = this.size;
		return forked;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/typed-binary@4.3.4/node_modules/typed-binary/dist/util.js
/**
* @returns {Boolean} true if system is big endian
*/
/* @__NO_SIDE_EFFECTS__ */
function isSystemBigEndian() {
	const array = new Uint8Array(4);
	const view = new Uint32Array(array.buffer);
	view[0] = 1;
	return array[0] === 0;
}
/* @__NO_SIDE_EFFECTS__ */
function getSystemEndianness() {
	return /* @__PURE__ */ isSystemBigEndian() ? "big" : "little";
}
//#endregion
//#region ../../node_modules/.pnpm/typed-binary@4.3.4/node_modules/typed-binary/dist/io/unwrapBuffer.js
/**
* Removes up to one layer of view over a buffer.
*/
/* @__NO_SIDE_EFFECTS__ */
function unwrapBuffer(buffer) {
	let byteOffset = 0;
	let innerBuffer = buffer;
	if (!!innerBuffer && "buffer" in innerBuffer && "byteOffset" in innerBuffer) {
		byteOffset += innerBuffer.byteOffset;
		innerBuffer = innerBuffer.buffer;
	}
	return {
		buffer: innerBuffer,
		byteOffset,
		byteLength: buffer.byteLength
	};
}
//#endregion
//#region ../../node_modules/.pnpm/typed-binary@4.3.4/node_modules/typed-binary/dist/io/bufferIOBase.js
var BufferIOBase = class {
	dataView;
	littleEndian;
	needsByteSwap;
	byteOffset = 0;
	endianness;
	constructor(buffer, options) {
		const { byteOffset = 0, endianness = "system" } = options ?? {};
		this.byteOffset = byteOffset;
		const systemEndianness = /* @__PURE__ */ getSystemEndianness();
		this.endianness = endianness === "system" ? systemEndianness : endianness;
		this.littleEndian = this.endianness === "little";
		this.needsByteSwap = this.endianness !== systemEndianness;
		const unwrapped = /* @__PURE__ */ unwrapBuffer(buffer);
		this.byteOffset += unwrapped.byteOffset;
		this.dataView = new DataView(unwrapped.buffer);
	}
	get currentByteOffset() {
		return this.byteOffset;
	}
	seekTo(offset) {
		this.byteOffset = offset;
	}
	skipBytes(bytes) {
		this.byteOffset += bytes;
	}
};
//#endregion
//#region ../../node_modules/.pnpm/typed-binary@4.3.4/node_modules/typed-binary/dist/io/bufferReader.js
var BufferReader = class extends BufferIOBase {
	_cachedTextDecoder;
	get _textDecoder() {
		if (!this._cachedTextDecoder) this._cachedTextDecoder = new TextDecoder(void 0, { fatal: true });
		return this._cachedTextDecoder;
	}
	readBool() {
		return this.dataView.getUint8(this.byteOffset++) !== 0;
	}
	readByte() {
		return this.dataView.getUint8(this.byteOffset++);
	}
	readInt8() {
		return this.dataView.getInt8(this.byteOffset++);
	}
	readUint8() {
		return this.dataView.getUint8(this.byteOffset++);
	}
	readInt16() {
		const value = this.dataView.getInt16(this.byteOffset, this.littleEndian);
		this.byteOffset += 2;
		return value;
	}
	readUint16() {
		const value = this.dataView.getUint16(this.byteOffset, this.littleEndian);
		this.byteOffset += 2;
		return value;
	}
	readInt32() {
		const value = this.dataView.getInt32(this.byteOffset, this.littleEndian);
		this.byteOffset += 4;
		return value;
	}
	readUint32() {
		const value = this.dataView.getUint32(this.byteOffset, this.littleEndian);
		this.byteOffset += 4;
		return value;
	}
	readFloat16() {
		const value = this.dataView.getFloat16(this.byteOffset, this.littleEndian);
		this.byteOffset += 2;
		return value;
	}
	readFloat32() {
		const value = this.dataView.getFloat32(this.byteOffset, this.littleEndian);
		this.byteOffset += 4;
		return value;
	}
	readString() {
		let strLength = 0;
		while (this.byteOffset + strLength < this.dataView.byteLength) if (this.dataView.getUint8(this.byteOffset + strLength++) === 0) break;
		const result = this._textDecoder.decode(new Uint8Array(this.dataView.buffer, this.byteOffset, strLength - 1));
		this.byteOffset += strLength;
		return result;
	}
	readSlice(bufferView, offset, byteLength) {
		const unwrapped = /* @__PURE__ */ unwrapBuffer(bufferView);
		const destU8 = new Uint8Array(unwrapped.buffer, unwrapped.byteOffset + offset);
		const bytesPerElement = bufferView.BYTES_PER_ELEMENT;
		if (this.needsByteSwap && bytesPerElement > 1) for (let i = 0; i < byteLength; i += bytesPerElement) for (let j = bytesPerElement - 1; j >= 0; j--) destU8[i + j] = this.dataView.getUint8(this.byteOffset++);
		else {
			destU8.set(new Uint8Array(this.dataView.buffer, this.byteOffset, byteLength));
			this.byteOffset += byteLength;
		}
	}
};
//#endregion
//#region ../../node_modules/.pnpm/typed-binary@4.3.4/node_modules/typed-binary/dist/io/bufferWriter.js
var BufferWriter = class extends BufferIOBase {
	_cachedTextEncoder;
	get _textEncoder() {
		if (!this._cachedTextEncoder) this._cachedTextEncoder = new TextEncoder();
		return this._cachedTextEncoder;
	}
	writeBool(value) {
		this.dataView.setUint8(this.byteOffset++, value ? 1 : 0);
	}
	writeByte(value) {
		this.dataView.setUint8(this.byteOffset++, value);
	}
	writeInt8(value) {
		this.dataView.setInt8(this.byteOffset++, value);
	}
	writeUint8(value) {
		this.dataView.setUint8(this.byteOffset++, value);
	}
	writeInt16(value) {
		this.dataView.setInt16(this.byteOffset, value, this.littleEndian);
		this.byteOffset += 2;
	}
	writeUint16(value) {
		this.dataView.setUint16(this.byteOffset, value, this.littleEndian);
		this.byteOffset += 2;
	}
	writeInt32(value) {
		this.dataView.setInt32(this.byteOffset, value, this.littleEndian);
		this.byteOffset += 4;
	}
	writeUint32(value) {
		this.dataView.setUint32(this.byteOffset, value, this.littleEndian);
		this.byteOffset += 4;
	}
	writeFloat16(value) {
		this.dataView.setFloat16(this.byteOffset, value, this.littleEndian);
		this.byteOffset += 2;
	}
	writeFloat32(value) {
		this.dataView.setFloat32(this.byteOffset, value, this.littleEndian);
		this.byteOffset += 4;
	}
	writeString(value) {
		const result = this._textEncoder.encodeInto(value, new Uint8Array(this.dataView.buffer, this.byteOffset));
		this.byteOffset += result.written;
		this.dataView.setUint8(this.byteOffset++, 0);
	}
	writeSlice(bufferView) {
		const unwrapped = /* @__PURE__ */ unwrapBuffer(bufferView);
		const srcU8 = new Uint8Array(unwrapped.buffer, unwrapped.byteOffset, unwrapped.byteLength);
		const bytesPerElement = bufferView.BYTES_PER_ELEMENT;
		if (this.needsByteSwap && bytesPerElement > 1) for (let i = 0; i < srcU8.length; i += bytesPerElement) for (let j = bytesPerElement - 1; j >= 0; j--) this.dataView.setUint8(this.byteOffset++, srcU8[i + j]);
		else {
			new Uint8Array(this.dataView.buffer, this.byteOffset).set(srcU8);
			this.byteOffset += srcU8.length;
		}
	}
};
//#endregion
//#region src/data/alignIO.ts
/**
* @param io the IO to align
* @param baseAlignment must be power of 2
*/
function alignIO(io, baseAlignment) {
	const currentPos = "size" in io ? io.size : io.currentByteOffset;
	const bitMask = baseAlignment - 1;
	const offset = currentPos & bitMask;
	if ("skipBytes" in io) io.skipBytes(baseAlignment - offset & bitMask);
	else io.add(baseAlignment - offset & bitMask);
}
//#endregion
//#region src/data/offsets.ts
var cachedOffsets = /* @__PURE__ */ new WeakMap();
function offsetsForProps(struct) {
	const cached = cachedOffsets.get(struct);
	if (cached) return cached;
	const measurer = new Measurer();
	const offsets = {};
	let lastEntry;
	for (const key in struct.propTypes) {
		const prop = struct.propTypes[key];
		if (prop === void 0) throw new Error(`Property ${key} is undefined in struct`);
		const beforeAlignment = measurer.size;
		alignIO(measurer, isUnstruct(struct) ? customAlignmentOf(prop) : alignmentOf(prop));
		if (lastEntry) lastEntry.padding = measurer.size - beforeAlignment;
		const propSize = sizeOf(prop);
		offsets[key] = {
			offset: measurer.size,
			size: propSize
		};
		lastEntry = offsets[key];
		measurer.add(propSize);
	}
	if (lastEntry) lastEntry.padding = roundUp(sizeOf(struct), alignmentOf(struct)) - measurer.size;
	cachedOffsets.set(struct, offsets);
	return offsets;
}
//#endregion
//#region src/data/compiledIO.ts
var EVAL_ALLOWED_IN_ENV = (() => {
	try {
		new Function("return true");
		return true;
	} catch {
		return false;
	}
})();
var compiledWriters = /* @__PURE__ */ new WeakMap();
var didWarnAboutEvalFallback = false;
var typeToPrimitive = {
	u32: "u32",
	vec2u: "u32",
	vec3u: "u32",
	vec4u: "u32",
	u16: "u16",
	i32: "i32",
	vec2i: "i32",
	vec3i: "i32",
	vec4i: "i32",
	f32: "f32",
	vec2f: "f32",
	vec3f: "f32",
	vec4f: "f32",
	f16: "f16",
	vec2h: "f16",
	vec3h: "f16",
	vec4h: "f16",
	mat2x2f: "f32",
	mat3x3f: "f32",
	mat4x4f: "f32"
};
var vertexFormatToPrimitive = {
	uint8: "u8",
	uint8x2: "u8",
	uint8x4: "u8",
	sint8: "i8",
	sint8x2: "i8",
	sint8x4: "i8",
	unorm8: "u8",
	unorm8x2: "u8",
	unorm8x4: "u8",
	snorm8: "i8",
	snorm8x2: "i8",
	snorm8x4: "i8",
	uint16: "u16",
	uint16x2: "u16",
	uint16x4: "u16",
	sint16: "i16",
	sint16x2: "i16",
	sint16x4: "i16",
	unorm16: "u16",
	unorm16x2: "u16",
	unorm16x4: "u16",
	snorm16: "i16",
	snorm16x2: "i16",
	snorm16x4: "i16",
	float16: "f16",
	float16x2: "f16",
	float16x4: "f16",
	float32: "f32",
	float32x2: "f32",
	float32x3: "f32",
	float32x4: "f32",
	uint32: "u32",
	uint32x2: "u32",
	uint32x3: "u32",
	uint32x4: "u32",
	sint32: "i32",
	sint32x2: "i32",
	sint32x3: "i32",
	sint32x4: "i32"
};
var primitiveToWriteFunction = {
	u32: "setUint32",
	i32: "setInt32",
	f32: "setFloat32",
	u16: "setUint16",
	i16: "setInt16",
	f16: "setFloat16",
	u8: "setUint8",
	i8: "setInt8"
};
/**
* @privateRemarks
* based on the `Channel Formats` table https://www.w3.org/TR/WGSL/#texel-formats
*/
var vertexFormatValueTransform = {
	unorm8: (value) => `Math.round(${value} * 255)`,
	unorm8x2: (value) => `Math.round(${value} * 255)`,
	unorm8x4: (value) => `Math.round(${value} * 255)`,
	snorm8: (value) => `Math.round(${value} * 127)`,
	snorm8x2: (value) => `Math.round(${value} * 127)`,
	snorm8x4: (value) => `Math.round(${value} * 127)`,
	unorm16: (value) => `Math.round(${value} * 65535)`,
	unorm16x2: (value) => `Math.round(${value} * 65535)`,
	unorm16x4: (value) => `Math.round(${value} * 65535)`,
	snorm16: (value) => `Math.round(${value} * 32767)`,
	snorm16x2: (value) => `Math.round(${value} * 32767)`,
	snorm16x4: (value) => `Math.round(${value} * 32767)`
};
var specialPackedFormats = {
	"unorm10-10-10-2": {
		writeFunction: "setUint32",
		generator: (offsetExpr, valueExpr) => `output.setUint32(${offsetExpr}, ((${valueExpr}.x*1023&0x3FF)<<22)|((${valueExpr}.y*1023&0x3FF)<<12)|((${valueExpr}.z*1023&0x3FF)<<2)|(${valueExpr}.w*3&3), littleEndian);\n`
	},
	"unorm8x4-bgra": {
		writeFunction: "setUint8",
		generator: (offsetExpr, valueExpr) => {
			return [
				"z",
				"y",
				"x",
				"w"
			].map((c, idx) => `output.setUint8((${offsetExpr} + ${idx}), Math.round(${valueExpr}.${c} * 255), littleEndian);\n`).join("");
		}
	}
};
function buildWriter(node, offsetExpr, valueExpr, depth = 0, partial = false) {
	const emitWrite = (writeFunc, addr, value) => partial ? `if (${addr} < endOffset) { output.${writeFunc}(${addr}, ${value}, littleEndian); }\n` : `output.${writeFunc}(${addr}, ${value}, littleEndian);\n`;
	const emitBlock = (addr, block) => partial ? `if (${addr} < endOffset) {\n${block}}\n` : block;
	function go(node, offsetExpr, valueExpr, depth) {
		const loopVar = [
			"i",
			"j",
			"k"
		][depth] || `i${depth}`;
		if (isAtomic(node) || isDecorated(node) || isLooseDecorated(node)) return go(node.inner, offsetExpr, valueExpr, depth);
		if (isWgslStruct(node) || isUnstruct(node)) return Object.entries(offsetsForProps(node)).map(([key, propOffset]) => {
			const subSchema = node.propTypes[key];
			return subSchema ? go(subSchema, `(${offsetExpr} + ${propOffset.offset})`, `${valueExpr}.${key}`, depth) : "";
		}).join("");
		if (isWgslArray(node) || isDisarray(node)) {
			if (node.elementCount === 0) throw new Error("Cannot write using a runtime-sized schema.");
			const elementSize = roundUp(sizeOf(node.elementType), alignmentOf(node));
			const totalSize = node.elementCount * elementSize;
			const copyLen = partial ? `Math.min(${valueExpr}.byteLength, Math.max(0, endOffset - (${offsetExpr})))` : `Math.min(${valueExpr}.byteLength, ${totalSize})`;
			let code = `if (ArrayBuffer.isView(${valueExpr})) {\n`;
			code += `  new Uint8Array(output.buffer).set(new Uint8Array(${valueExpr}.buffer, ${valueExpr}.byteOffset, ${copyLen}), output.byteOffset + (${offsetExpr}));\n`;
			code += `} else {\n`;
			code += `for (let ${loopVar} = 0; ${loopVar} < ${node.elementCount}; ${loopVar}++) {\n`;
			if (partial) code += `if ((${offsetExpr} + ${loopVar} * ${elementSize}) >= endOffset) return;\n`;
			code += go(node.elementType, `(${offsetExpr} + ${loopVar} * ${elementSize})`, `${valueExpr}[${loopVar}]`, depth + 1);
			code += "}\n";
			code += "}\n";
			return code;
		}
		if (isVec(node)) {
			if (isVecBool(node)) throw new Error("Compiled writers do not support boolean vectors");
			const primitive = typeToPrimitive[node.type];
			const componentSize = sizeOf(node.primitive);
			const writeFunc = primitiveToWriteFunction[primitive];
			return Array.from({ length: node.componentCount }, (_, i) => emitWrite(writeFunc, `(${offsetExpr} + ${i * componentSize})`, `${valueExpr}[${i}]`)).join("");
		}
		if (isMat(node)) {
			const writeFunc = primitiveToWriteFunction[typeToPrimitive[node.type]];
			const matSize = isMat2x2f(node) ? 2 : isMat3x3f(node) ? 3 : 4;
			const components = [
				"x",
				"y",
				"z",
				"w"
			];
			const wgslElementStride = roundUp(matSize, 2);
			return Array.from({ length: matSize * wgslElementStride }, (_, idx) => {
				const col = Math.floor(idx / wgslElementStride);
				const row = idx % wgslElementStride;
				const addr = `(${offsetExpr} + ${idx * 4})`;
				if (row >= matSize) return emitWrite(writeFunc, addr, "0");
				return emitWrite(writeFunc, addr, `ArrayBuffer.isView(${valueExpr}) ? ${valueExpr}[${idx}] : Array.isArray(${valueExpr}) ? ${valueExpr}[${col * matSize + row}] : ${valueExpr}.columns[${col}].${components[row]}`);
			}).join("");
		}
		if (isPackedData(node)) {
			const formatName = node.type;
			if (formatName in specialPackedFormats) {
				const handler = specialPackedFormats[formatName];
				return emitBlock(`(${offsetExpr})`, handler.generator(offsetExpr, valueExpr));
			}
			const primitive = vertexFormatToPrimitive[formatName];
			const writeFunc = primitiveToWriteFunction[primitive];
			const wgslType = formatToWGSLType[formatName];
			const componentCount = isVec(wgslType) ? wgslType.componentCount : 1;
			const componentSize = primitive === "u8" || primitive === "i8" ? 1 : primitive === "u16" || primitive === "i16" || primitive === "f16" ? 2 : 4;
			const components = [
				"x",
				"y",
				"z",
				"w"
			];
			const transform = vertexFormatValueTransform[formatName];
			return Array.from({ length: componentCount }, (_, idx) => {
				const accessor = componentCount === 1 ? valueExpr : `${valueExpr}.${components[idx]}`;
				const value = transform ? transform(accessor) : accessor;
				return emitWrite(writeFunc, `(${offsetExpr} + ${idx * componentSize})`, value);
			}).join("");
		}
		if (!Object.hasOwn(typeToPrimitive, node.type)) throw new Error(`Primitive ${node.type} is unsupported by compiled writer`);
		const primitive = typeToPrimitive[node.type];
		return emitWrite(primitiveToWriteFunction[primitive], offsetExpr, valueExpr);
	}
	return go(node, offsetExpr, valueExpr, depth);
}
function getCompiledWriter(schema) {
	if (!EVAL_ALLOWED_IN_ENV) {
		if (!didWarnAboutEvalFallback) {
			logger.warn("fallback", "This environment does not allow eval - using default writer as fallback");
			didWarnAboutEvalFallback = true;
		}
		return;
	}
	const cached = compiledWriters.get(schema);
	if (cached) return cached;
	try {
		const fullBody = buildWriter(schema, "offset", "value", 0, false);
		const body = `if (offset > 0 || endOffset < output.byteLength) {\n${buildWriter(schema, "offset", "value", 0, true)}} else {\n${fullBody}}\n`;
		const fn = new Function("output", "offset", "value", "littleEndian=true", "endOffset=output.byteLength", body);
		compiledWriters.set(schema, fn);
		return fn;
	} catch (error) {
		logger.warn("fallback", `Failed to compile writer for schema: ${schema}\nReason: ${error instanceof Error ? error.message : String(error)}\nFalling back to default writer`);
	}
}
//#endregion
//#region src/data/float16Conversion.ts
function writeFloat16(output, value) {
	output.writeUint16(toHalfBits(value));
}
function readFloat16(input) {
	return fromHalfBits(input.readUint16());
}
//#endregion
//#region src/data/dataIO.ts
var dataWriters = {
	bool() {
		throw new Error("Booleans are not host-shareable");
	},
	f32(output, _schema, value) {
		output.writeFloat32(value);
	},
	f16(output, _schema, value) {
		writeFloat16(output, value);
	},
	i32(output, _schema, value) {
		output.writeInt32(value);
	},
	u32(output, _schema, value) {
		output.writeUint32(value);
	},
	u16(output, _schema, value) {
		output.writeUint16(value);
	},
	vec2f(output, _, value) {
		output.writeFloat32(value[0]);
		output.writeFloat32(value[1]);
	},
	vec2h(output, _, value) {
		writeFloat16(output, value[0]);
		writeFloat16(output, value[1]);
	},
	vec2i(output, _, value) {
		output.writeInt32(value[0]);
		output.writeInt32(value[1]);
	},
	vec2u(output, _, value) {
		output.writeUint32(value[0]);
		output.writeUint32(value[1]);
	},
	"vec2<bool>"() {
		throw new Error("Booleans are not host-shareable");
	},
	vec3f(output, _, value) {
		output.writeFloat32(value[0]);
		output.writeFloat32(value[1]);
		output.writeFloat32(value[2]);
	},
	vec3h(output, _, value) {
		writeFloat16(output, value[0]);
		writeFloat16(output, value[1]);
		writeFloat16(output, value[2]);
	},
	vec3i(output, _, value) {
		output.writeInt32(value[0]);
		output.writeInt32(value[1]);
		output.writeInt32(value[2]);
	},
	vec3u(output, _, value) {
		output.writeUint32(value[0]);
		output.writeUint32(value[1]);
		output.writeUint32(value[2]);
	},
	"vec3<bool>"() {
		throw new Error("Booleans are not host-shareable");
	},
	vec4f(output, _, value) {
		output.writeFloat32(value[0]);
		output.writeFloat32(value[1]);
		output.writeFloat32(value[2]);
		output.writeFloat32(value[3]);
	},
	vec4h(output, _, value) {
		writeFloat16(output, value[0]);
		writeFloat16(output, value[1]);
		writeFloat16(output, value[2]);
		writeFloat16(output, value[3]);
	},
	vec4i(output, _, value) {
		output.writeInt32(value[0]);
		output.writeInt32(value[1]);
		output.writeInt32(value[2]);
		output.writeInt32(value[3]);
	},
	vec4u(output, _, value) {
		output.writeUint32(value[0]);
		output.writeUint32(value[1]);
		output.writeUint32(value[2]);
		output.writeUint32(value[3]);
	},
	"vec4<bool>"() {
		throw new Error("Booleans are not host-shareable");
	},
	mat2x2f(output, _, value) {
		for (let i = 0; i < value.length; ++i) output.writeFloat32(value[i]);
	},
	mat3x3f(output, _, value) {
		if (value instanceof Float32Array || isMatInstance(value)) for (let i = 0; i < value.length; ++i) output.writeFloat32(value[i]);
		else for (let i = 0; i < 3; ++i) {
			for (let j = 0; j < 3; ++j) output.writeFloat32(value[3 * i + j]);
			output.writeFloat32(0);
		}
	},
	mat4x4f(output, _, value) {
		for (let i = 0; i < value.length; ++i) output.writeFloat32(value[i]);
	},
	struct(output, schema, value) {
		const alignment = alignmentOf(schema);
		alignIO(output, alignment);
		for (const [key, property] of Object.entries(schema.propTypes)) {
			alignIO(output, alignmentOf(property));
			writeData(output, property, value[key]);
		}
		alignIO(output, alignment);
	},
	array(output, schema, value) {
		if (schema.elementCount === 0) throw new Error("Cannot write using a runtime-sized schema.");
		const alignment = alignmentOf(schema);
		alignIO(output, alignment);
		const beginning = output.currentByteOffset;
		for (let i = 0; i < Math.min(schema.elementCount, value.length); i++) {
			alignIO(output, alignment);
			writeData(output, schema.elementType, value[i]);
		}
		output.seekTo(beginning + sizeOf(schema));
	},
	ptr() {
		throw new Error("Pointers are not host-shareable");
	},
	atomic(output, schema, value) {
		dataWriters[schema.inner.type]?.(output, schema, value);
	},
	decorated(output, schema, value) {
		alignIO(output, customAlignmentOf(schema));
		const beginning = output.currentByteOffset;
		dataWriters[schema.inner?.type]?.(output, schema.inner, value);
		output.seekTo(beginning + sizeOf(schema));
	},
	uint8(output, _, value) {
		output.writeUint8(value);
	},
	uint8x2(output, _, value) {
		output.writeUint8(value.x);
		output.writeUint8(value.y);
	},
	uint8x4(output, _, value) {
		output.writeUint8(value.x);
		output.writeUint8(value.y);
		output.writeUint8(value.z);
		output.writeUint8(value.w);
	},
	sint8(output, _, value) {
		output.writeInt8(value);
	},
	sint8x2(output, _, value) {
		output.writeInt8(value.x);
		output.writeInt8(value.y);
	},
	sint8x4(output, _, value) {
		output.writeInt8(value.x);
		output.writeInt8(value.y);
		output.writeInt8(value.z);
		output.writeInt8(value.w);
	},
	unorm8(output, _, value) {
		output.writeUint8(Math.round(value * 255));
	},
	unorm8x2(output, _, value) {
		output.writeUint8(Math.round(value.x * 255));
		output.writeUint8(Math.round(value.y * 255));
	},
	unorm8x4(output, _, value) {
		output.writeUint8(Math.round(value.x * 255));
		output.writeUint8(Math.round(value.y * 255));
		output.writeUint8(Math.round(value.z * 255));
		output.writeUint8(Math.round(value.w * 255));
	},
	snorm8(output, _, value) {
		output.writeInt8(Math.round(value * 127));
	},
	snorm8x2(output, _, value) {
		output.writeInt8(Math.round(value.x * 127));
		output.writeInt8(Math.round(value.y * 127));
	},
	snorm8x4(output, _, value) {
		output.writeInt8(Math.round(value.x * 127));
		output.writeInt8(Math.round(value.y * 127));
		output.writeInt8(Math.round(value.z * 127));
		output.writeInt8(Math.round(value.w * 127));
	},
	uint16(output, _, value) {
		output.writeUint16(value);
	},
	uint16x2(output, _, value) {
		output.writeUint16(value.x);
		output.writeUint16(value.y);
	},
	uint16x4(output, _, value) {
		output.writeUint16(value.x);
		output.writeUint16(value.y);
		output.writeUint16(value.z);
		output.writeUint16(value.w);
	},
	sint16(output, _, value) {
		output.writeInt16(value);
	},
	sint16x2(output, _, value) {
		output.writeInt16(value.x);
		output.writeInt16(value.y);
	},
	sint16x4(output, _, value) {
		output.writeInt16(value.x);
		output.writeInt16(value.y);
		output.writeInt16(value.z);
		output.writeInt16(value.w);
	},
	unorm16(output, _, value) {
		output.writeUint16(value * 65535);
	},
	unorm16x2(output, _, value) {
		output.writeUint16(value.x * 65535);
		output.writeUint16(value.y * 65535);
	},
	unorm16x4(output, _, value) {
		output.writeUint16(value.x * 65535);
		output.writeUint16(value.y * 65535);
		output.writeUint16(value.z * 65535);
		output.writeUint16(value.w * 65535);
	},
	snorm16(output, _, value) {
		output.writeInt16(Math.round(value * 32767));
	},
	snorm16x2(output, _, value) {
		output.writeInt16(Math.round(value.x * 32767));
		output.writeInt16(Math.round(value.y * 32767));
	},
	snorm16x4(output, _, value) {
		output.writeInt16(Math.round(value.x * 32767));
		output.writeInt16(Math.round(value.y * 32767));
		output.writeInt16(Math.round(value.z * 32767));
		output.writeInt16(Math.round(value.w * 32767));
	},
	float16(output, _, value) {
		writeFloat16(output, value);
	},
	float16x2(output, _, value) {
		writeFloat16(output, value.x);
		writeFloat16(output, value.y);
	},
	float16x4(output, _, value) {
		writeFloat16(output, value.x);
		writeFloat16(output, value.y);
		writeFloat16(output, value.z);
		writeFloat16(output, value.w);
	},
	float32(output, _, value) {
		output.writeFloat32(value);
	},
	float32x2(output, _, value) {
		output.writeFloat32(value.x);
		output.writeFloat32(value.y);
	},
	float32x3(output, _, value) {
		output.writeFloat32(value.x);
		output.writeFloat32(value.y);
		output.writeFloat32(value.z);
	},
	float32x4(output, _, value) {
		output.writeFloat32(value.x);
		output.writeFloat32(value.y);
		output.writeFloat32(value.z);
		output.writeFloat32(value.w);
	},
	uint32(output, _, value) {
		output.writeUint32(value);
	},
	uint32x2(output, _, value) {
		output.writeUint32(value.x);
		output.writeUint32(value.y);
	},
	uint32x3(output, _, value) {
		output.writeUint32(value.x);
		output.writeUint32(value.y);
		output.writeUint32(value.z);
	},
	uint32x4(output, _, value) {
		output.writeUint32(value.x);
		output.writeUint32(value.y);
		output.writeUint32(value.z);
		output.writeUint32(value.w);
	},
	sint32(output, _, value) {
		output.writeInt32(value);
	},
	sint32x2(output, _, value) {
		output.writeInt32(value.x);
		output.writeInt32(value.y);
	},
	sint32x3(output, _, value) {
		output.writeInt32(value.x);
		output.writeInt32(value.y);
		output.writeInt32(value.z);
	},
	sint32x4(output, _, value) {
		output.writeInt32(value.x);
		output.writeInt32(value.y);
		output.writeInt32(value.z);
		output.writeInt32(value.w);
	},
	"unorm10-10-10-2"(output, _, value) {
		let packed = 0;
		packed |= (value.x * 1023 & 1023) << 22;
		packed |= (value.y * 1023 & 1023) << 12;
		packed |= (value.z * 1023 & 1023) << 2;
		packed |= value.w * 3 & 3;
		output.writeUint32(packed);
	},
	"unorm8x4-bgra"(output, _, value) {
		output.writeUint8(value.z * 255);
		output.writeUint8(value.y * 255);
		output.writeUint8(value.x * 255);
		output.writeUint8(value.w * 255);
	},
	disarray(output, schema, value) {
		const alignment = alignmentOf(schema);
		alignIO(output, alignment);
		const beginning = output.currentByteOffset;
		for (let i = 0; i < Math.min(schema.elementCount, value.length); i++) {
			alignIO(output, alignment);
			dataWriters[schema.elementType?.type]?.(output, schema.elementType, value[i]);
		}
		output.seekTo(beginning + sizeOf(schema));
	},
	unstruct(output, schema, value) {
		const propTypes = schema.propTypes;
		for (const [key, property] of Object.entries(propTypes)) dataWriters[property.type]?.(output, property, value[key]);
	},
	"loose-decorated"(output, schema, value) {
		alignIO(output, customAlignmentOf(schema));
		const beginning = output.currentByteOffset;
		const writer = dataWriters[schema.inner?.type];
		writer?.(output, schema.inner, value);
		output.seekTo(beginning + sizeOf(schema));
		return value;
	}
};
function writeData(output, schema, value) {
	if (ArrayBuffer.isView(value)) {
		const src = value;
		const expected = sizeOf(schema);
		if (src.byteLength !== expected) logger.warn("suspicious", `TypedArray size mismatch: schema expects ${expected} bytes, got ${src.byteLength}. ` + (src.byteLength < expected ? "Data truncated." : "Excess ignored."));
		const start = output.currentByteOffset;
		output.writeSlice(new Uint8Array(src.buffer, src.byteOffset, Math.min(src.byteLength, expected)));
		output.seekTo(start + expected);
		return;
	}
	const writer = dataWriters[schema.type];
	if (!writer) throw new Error(`Cannot write data of type '${schema.type}'.`);
	writer(output, schema, value);
}
var dataReaders = {
	bool() {
		throw new Error("Booleans are not host-shareable");
	},
	f32(input) {
		return input.readFloat32();
	},
	f16(input) {
		return readFloat16(input);
	},
	i32(input) {
		return input.readInt32();
	},
	u32(input) {
		return input.readUint32();
	},
	u16(input) {
		return input.readUint16();
	},
	vec2f(input) {
		return vec2f$1(input.readFloat32(), input.readFloat32());
	},
	vec3f(input) {
		return vec3f$1(input.readFloat32(), input.readFloat32(), input.readFloat32());
	},
	vec4f(input) {
		return vec4f$1(input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32());
	},
	vec2h(input) {
		return vec2h$1(readFloat16(input), readFloat16(input));
	},
	vec3h(input) {
		return vec3h$1(readFloat16(input), readFloat16(input), readFloat16(input));
	},
	vec4h(input) {
		return vec4h$1(readFloat16(input), readFloat16(input), readFloat16(input), readFloat16(input));
	},
	vec2i(input) {
		return vec2i$1(input.readInt32(), input.readInt32());
	},
	vec3i(input) {
		return vec3i$1(input.readInt32(), input.readInt32(), input.readInt32());
	},
	vec4i(input) {
		return vec4i$1(input.readInt32(), input.readInt32(), input.readInt32(), input.readInt32());
	},
	vec2u(input) {
		return vec2u$1(input.readUint32(), input.readUint32());
	},
	vec3u(input) {
		return vec3u$1(input.readUint32(), input.readUint32(), input.readUint32());
	},
	vec4u(input) {
		return vec4u$1(input.readUint32(), input.readUint32(), input.readUint32(), input.readUint32());
	},
	"vec2<bool>"() {
		throw new Error("Booleans are not host-shareable");
	},
	"vec3<bool>"() {
		throw new Error("Booleans are not host-shareable");
	},
	"vec4<bool>"() {
		throw new Error("Booleans are not host-shareable");
	},
	mat2x2f(input) {
		return mat2x2f$1(input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32());
	},
	mat3x3f(input) {
		const skipOneAfter = () => {
			const value = input.readFloat32();
			input.readFloat32();
			return value;
		};
		return mat3x3f$1(input.readFloat32(), input.readFloat32(), skipOneAfter(), input.readFloat32(), input.readFloat32(), skipOneAfter(), input.readFloat32(), input.readFloat32(), skipOneAfter());
	},
	mat4x4f(input) {
		return mat4x4f$1(input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32(), input.readFloat32());
	},
	struct(input, schema) {
		const alignment = alignmentOf(schema);
		alignIO(input, alignment);
		const result = {};
		const propTypes = schema.propTypes;
		for (const [key, property] of Object.entries(propTypes)) {
			alignIO(input, alignmentOf(property));
			result[key] = readData(input, property);
		}
		alignIO(input, alignment);
		return result;
	},
	array(input, schema) {
		if (schema.elementCount === 0) throw new Error("Cannot read using a runtime-sized schema.");
		const alignment = alignmentOf(schema);
		const elements = [];
		for (let i = 0; i < schema.elementCount; i++) {
			alignIO(input, alignment);
			const elementType = schema.elementType;
			const value = readData(input, elementType);
			elements.push(value);
		}
		alignIO(input, alignment);
		return elements;
	},
	ptr() {
		throw new Error("Pointers are not host-shareable");
	},
	atomic(input, schema) {
		return readData(input, schema.inner);
	},
	decorated(input, schema) {
		alignIO(input, customAlignmentOf(schema));
		const beginning = input.currentByteOffset;
		const value = readData(input, schema.inner);
		input.seekTo(beginning + sizeOf(schema));
		return value;
	},
	uint8: (i) => i.readUint8(),
	uint8x2: (i) => vec2u$1(i.readUint8(), i.readUint8()),
	uint8x4: (i) => vec4u$1(i.readUint8(), i.readUint8(), i.readUint8(), i.readUint8()),
	sint8: (i) => i.readInt8(),
	sint8x2: (i) => {
		return vec2i$1(i.readInt8(), i.readInt8());
	},
	sint8x4: (i) => vec4i$1(i.readInt8(), i.readInt8(), i.readInt8(), i.readInt8()),
	unorm8: (i) => i.readUint8() / 255,
	unorm8x2: (i) => vec2f$1(i.readUint8() / 255, i.readUint8() / 255),
	unorm8x4: (i) => vec4f$1(i.readUint8() / 255, i.readUint8() / 255, i.readUint8() / 255, i.readUint8() / 255),
	snorm8: (i) => i.readInt8() / 127,
	snorm8x2: (i) => vec2f$1(i.readInt8() / 127, i.readInt8() / 127),
	snorm8x4: (i) => vec4f$1(i.readInt8() / 127, i.readInt8() / 127, i.readInt8() / 127, i.readInt8() / 127),
	uint16: (i) => i.readUint16(),
	uint16x2: (i) => vec2u$1(i.readUint16(), i.readUint16()),
	uint16x4: (i) => vec4u$1(i.readUint16(), i.readUint16(), i.readUint16(), i.readUint16()),
	sint16: (i) => i.readInt16(),
	sint16x2: (i) => vec2i$1(i.readInt16(), i.readInt16()),
	sint16x4: (i) => vec4i$1(i.readInt16(), i.readInt16(), i.readInt16(), i.readInt16()),
	unorm16: (i) => i.readUint16() / 65535,
	unorm16x2: (i) => vec2f$1(i.readUint16() / 65535, i.readUint16() / 65535),
	unorm16x4: (i) => vec4f$1(i.readUint16() / 65535, i.readUint16() / 65535, i.readUint16() / 65535, i.readUint16() / 65535),
	snorm16: (i) => i.readInt16() / 32767,
	snorm16x2: (i) => vec2f$1(i.readInt16() / 32767, i.readInt16() / 32767),
	snorm16x4: (i) => vec4f$1(i.readInt16() / 32767, i.readInt16() / 32767, i.readInt16() / 32767, i.readInt16() / 32767),
	float16(i) {
		return readFloat16(i);
	},
	float16x2: (i) => vec2f$1(readFloat16(i), readFloat16(i)),
	float16x4: (i) => vec4f$1(readFloat16(i), readFloat16(i), readFloat16(i), readFloat16(i)),
	float32: (i) => i.readFloat32(),
	float32x2: (i) => vec2f$1(i.readFloat32(), i.readFloat32()),
	float32x3: (i) => vec3f$1(i.readFloat32(), i.readFloat32(), i.readFloat32()),
	float32x4: (i) => vec4f$1(i.readFloat32(), i.readFloat32(), i.readFloat32(), i.readFloat32()),
	uint32: (i) => i.readUint32(),
	uint32x2: (i) => vec2u$1(i.readUint32(), i.readUint32()),
	uint32x3: (i) => vec3u$1(i.readUint32(), i.readUint32(), i.readUint32()),
	uint32x4: (i) => vec4u$1(i.readUint32(), i.readUint32(), i.readUint32(), i.readUint32()),
	sint32: (i) => i.readInt32(),
	sint32x2: (i) => vec2i$1(i.readInt32(), i.readInt32()),
	sint32x3: (i) => vec3i$1(i.readInt32(), i.readInt32(), i.readInt32()),
	sint32x4: (i) => vec4i$1(i.readInt32(), i.readInt32(), i.readInt32(), i.readInt32()),
	"unorm10-10-10-2"(i) {
		const packed = i.readUint32();
		return vec4f$1((packed >> 22) / 1023, (packed >> 12 & 1023) / 1023, (packed >> 2 & 1023) / 1023, (packed & 3) / 3);
	},
	"unorm8x4-bgra"(i) {
		const b = i.readByte() / 255;
		const g = i.readByte() / 255;
		return vec4f$1(i.readByte() / 255, g, b, i.readByte() / 255);
	},
	unstruct(input, schema) {
		const result = {};
		const propTypes = schema.propTypes;
		for (const [key, property] of Object.entries(propTypes)) result[key] = readData(input, property);
		return result;
	},
	disarray(input, schema) {
		const alignment = alignmentOf(schema);
		const elements = [];
		for (let i = 0; i < schema.elementCount; i++) {
			alignIO(input, alignment);
			elements.push(readData(input, schema.elementType));
		}
		alignIO(input, alignment);
		return elements;
	},
	"loose-decorated"(input, schema) {
		alignIO(input, customAlignmentOf(schema));
		const beginning = input.currentByteOffset;
		const value = readData(input, schema.inner);
		input.seekTo(beginning + sizeOf(schema));
		return value;
	}
};
function readData(input, schema) {
	const reader = dataReaders[schema.type];
	if (!reader) throw new Error(`Cannot read data of type '${schema.type}'.`);
	return reader(input, schema);
}
var endianness = /* @__PURE__ */ getSystemEndianness();
function calculateOffsets(options, schema, data) {
	const bufferSize = sizeOf(schema);
	const startOffset = options?.startOffset ?? 0;
	let naturalSize = void 0;
	if (isWgslArray(schema) && Array.isArray(data)) naturalSize = data.length * roundUp(sizeOf(schema.elementType), alignmentOf(schema.elementType));
	else if (ArrayBuffer.isView(data) || data instanceof ArrayBuffer) naturalSize = data.byteLength;
	const naturalEndOffset = naturalSize !== void 0 ? Math.min(startOffset + naturalSize, bufferSize) : void 0;
	return {
		startOffset,
		endOffset: options?.endOffset ?? naturalEndOffset ?? bufferSize
	};
}
/**
* A function for filling in buffers with data based on TypeGPU schemas.
* When schema instances or JS arrays are passed, the padding is applied automatically.
* ArrayBuffers are expected to be already padded.
*/
function writeToArrayBuffer(buffer, schema, data, options) {
	const { startOffset, endOffset } = calculateOffsets(options, schema, data);
	if (data instanceof ArrayBuffer || ArrayBuffer.isView(data)) {
		const src = data instanceof ArrayBuffer ? new Uint8Array(data) : new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
		const regionSize = endOffset - startOffset;
		if (src.byteLength !== regionSize) logger.warn("suspicious", `Buffer size mismatch: expected ${regionSize} bytes, got ${src.byteLength}. ` + (src.byteLength < regionSize ? "Data truncated." : "Excess ignored."));
		const copyLen = Math.min(src.byteLength, regionSize);
		new Uint8Array(buffer).set(src.subarray(0, copyLen), startOffset);
		return;
	}
	const dataView = new DataView(buffer);
	const isLittleEndian = endianness === "little";
	const compiledWriter = getCompiledWriter(schema);
	if (compiledWriter) try {
		compiledWriter(dataView, startOffset, data, isLittleEndian, endOffset);
		return;
	} catch (error) {
		logger.warn("fallback", `Error when using compiled writer for data type '${schema.type}' (${getName(schema) ?? "unnamed"}) - this is likely a bug, please submit an issue at https://github.com/software-mansion/TypeGPU/issues\nUsing fallback writer instead.`, error);
	}
	const writer = new BufferWriter(buffer);
	writer.seekTo(startOffset);
	writeData(writer, schema, data);
}
function readFromArrayBuffer(buffer, schema) {
	return readData(new BufferReader(buffer), schema);
}
//#endregion
//#region src/data/partialIO.ts
/**
* Converts `{idx, value}[]` sparse arrays into `Record<number, T>` format.
*/
function convertPartialToPatch(schema, data) {
	if (data === void 0 || data === null) return data;
	if (isWgslStruct(schema) || isUnstruct(schema)) {
		const result = {};
		const record = data;
		for (const key of Object.keys(schema.propTypes)) {
			const subSchema = schema.propTypes[key];
			const value = record[key];
			if (value !== void 0 && subSchema) result[key] = convertPartialToPatch(subSchema, value);
		}
		return result;
	}
	if (isWgslArray(schema) || isDisarray(schema)) {
		const arrSchema = schema;
		const result = {};
		for (const { idx, value } of data) result[idx] = convertPartialToPatch(arrSchema.elementType, value);
		return result;
	}
	return data;
}
var isLittleEndian = /* @__PURE__ */ getSystemEndianness() === "little";
/**
* @param validateRange Called for every byte range that is about to be written, before any data
*   is written into `targetBuffer`. Returns how many bytes to upload for that range.
*   Throwing from it leaves `targetBuffer` untouched.
*/
function getPatchInstructions(schema, data, targetBuffer, validateRange) {
	const totalSize = sizeOf(schema);
	if (totalSize === 0 || data === void 0 || data === null) return [];
	const buf = targetBuffer ?? new ArrayBuffer(totalSize);
	const writer = new BufferWriter(buf);
	const compiledView = new DataView(buf);
	const segments = [];
	const pendingWrites = [];
	function collect(node, value, offset, padding) {
		if (value === void 0 || value === null) return;
		if (isWgslStruct(node) || isUnstruct(node)) {
			const propOffsets = offsetsForProps(node);
			for (const [key, propOffset] of Object.entries(propOffsets)) {
				const childValue = value[key];
				const subSchema = node.propTypes[key];
				if (childValue !== void 0 && subSchema) collect(subSchema, childValue, offset + propOffset.offset, propOffset.padding ?? padding);
			}
			return;
		}
		if (isWgslArray(node) || isDisarray(node)) {
			const arrSchema = node;
			const elementSize = roundUp(sizeOf(arrSchema.elementType), alignmentOf(arrSchema.elementType));
			const elementPadding = elementSize - sizeOf(arrSchema.elementType);
			if (ArrayBuffer.isView(value)) {
				const copyLen = Math.min(value.byteLength, arrSchema.elementCount * elementSize);
				pendingWrites.push(() => {
					new Uint8Array(buf, offset, copyLen).set(new Uint8Array(value.buffer, value.byteOffset, copyLen));
				});
				segments.push({
					start: offset,
					end: offset + copyLen,
					padding
				});
				return;
			}
			if (Array.isArray(value)) {
				for (let i = 0; i < Math.min(arrSchema.elementCount, value.length); i++) collect(arrSchema.elementType, value[i], offset + i * elementSize, elementPadding);
				return;
			}
			const sparse = value;
			for (const key of Object.keys(sparse)) {
				const idx = Number(key);
				if (!Number.isNaN(idx)) collect(arrSchema.elementType, sparse[key], offset + idx * elementSize, elementPadding);
			}
			return;
		}
		const leafSize = sizeOf(node);
		const compiledWriter = getCompiledWriter(node);
		pendingWrites.push(() => {
			if (compiledWriter) compiledWriter(compiledView, offset, value, isLittleEndian, offset + leafSize);
			else {
				writer.seekTo(offset);
				writeData(writer, node, value);
			}
		});
		segments.push({
			start: offset,
			end: offset + leafSize,
			padding
		});
	}
	collect(schema, data, 0);
	const runs = [];
	let run = null;
	for (const seg of segments) if (run && seg.start === run.end + (run.padding ?? 0)) run = {
		start: run.start,
		end: seg.end,
		padding: seg.padding
	};
	else {
		if (run) runs.push(run);
		run = seg;
	}
	if (run) runs.push(run);
	const uploads = runs.map(({ start, end }) => ({
		start,
		end,
		uploadSize: validateRange?.(start, end) ?? end - start
	}));
	for (const write of pendingWrites) write();
	return uploads.map(({ start, end, uploadSize }) => ({
		gpuOffset: start,
		data: new Uint8Array(buf, start, end - start).slice(),
		uploadSize
	}));
}
function patchArrayBuffer(buffer, schema, data) {
	const instructions = getPatchInstructions(schema, data, buffer);
	const mappedView = new Uint8Array(buffer);
	for (const { data, gpuOffset } of instructions) mappedView.set(data, gpuOffset);
}
//#endregion
//#region src/extension.ts
/**
* @category Errors
*/
var NotStorageError = class NotStorageError extends Error {
	constructor(value) {
		super(`Resource '${getName(value) ?? "<unnamed>"}' cannot be bound as 'storage'. Use .$usage('storage') to allow it.`);
		Object.setPrototypeOf(this, NotStorageError.prototype);
	}
};
//#endregion
//#region src/core/buffer/bufferBinding.ts
function isBufferBinding(value) {
	return value instanceof TgpuBufferBindingImpl;
}
function isUniformBinding(value) {
	return isBufferBinding(value) && value.resourceType === "uniform";
}
function isMutableBinding(value) {
	return isBufferBinding(value) && value.resourceType === "mutable";
}
function isReadonlyBinding(value) {
	return isBufferBinding(value) && value.resourceType === "readonly";
}
var TgpuBufferBindingImpl = class TgpuBufferBindingImpl {
	[$soul];
	[$getNameForward];
	resourceType;
	static {
		TgpuBufferBindingImpl.prototype[$internal] = true;
		makeDereferenceable(makeResolvable(TgpuBufferBindingImpl.prototype, {
			asString() {
				return `${this.resourceType}BufferBinding:${getName(this) ?? "<unnamed>"}`;
			},
			resolve(ctx) {
				const dataType = this.buffer.dataType;
				const id = ctx.makeUniqueIdentifier(getName(this), "global");
				const { group, binding } = ctx.allocateFixedEntry(this.resourceType === "uniform" ? { uniform: dataType } : {
					storage: dataType,
					access: this.resourceType
				}, this.buffer);
				return ctx.gen.declareGlobalVar({
					group,
					binding,
					scope: this.resourceType,
					id,
					dataType,
					init: void 0
				});
			}
		}), {
			codegenMode: { getBaseSnippet(trackingProxy) {
				return snip(trackingProxy, this.buffer.dataType, this.resourceType, false);
			} },
			simulateMode: {
				get(state) {
					if (!state.buffers.has(this.buffer)) state.buffers.set(this.buffer, schemaCallWrapper(this.buffer.dataType, this.buffer.initial));
					return state.buffers.get(this.buffer);
				},
				set(state, value) {
					state.buffers.set(this.buffer, value);
				}
			},
			normalMode: {
				get() {
					throw new IllegalBufferAccessError(isInsideTgpuFn() ? `Cannot access ${String(this.buffer)}. TypeGPU functions that depends on GPU resources need to be part of a compute dispatch, draw call or simulation` : ".$ is inaccessible during normal JS execution. Try `.read()`");
				},
				set() {
					throw new IllegalBufferAccessError(isInsideTgpuFn() ? `Cannot access ${String(this.buffer)}. TypeGPU functions that depends on GPU resources need to be part of a compute dispatch, draw call or simulation` : ".$ is inaccessible during normal JS execution. Try `.write()`");
				}
			}
		});
	}
	constructor(usage, buffer) {
		this.resourceType = usage;
		this[$getNameForward] = buffer;
		this[$soul] = {
			type: usage,
			buffer,
			label: void 0
		};
	}
	get buffer() {
		return this[$soul].buffer;
	}
	$name(label) {
		setName(this, label);
		return this;
	}
	write(data, options) {
		this.buffer.write(data, options);
	}
	/** @deprecated Use {@link patch} instead. */
	writePartial(data) {
		this.buffer.writePartial(data);
	}
	patch(data) {
		this.buffer.patch(data);
	}
	read() {
		return this.buffer.read();
	}
};
var mutableUsageMap = /* @__PURE__ */ new WeakMap();
function mutable(buffer) {
	if (!isUsableAsStorage(buffer)) throw new Error(`Cannot call as('mutable') on ${buffer}, as it is not allowed to be used as storage. To allow it, call .$usage('storage') when creating the buffer.`);
	let usage = mutableUsageMap.get(buffer);
	if (!usage) {
		usage = new TgpuBufferBindingImpl("mutable", buffer);
		mutableUsageMap.set(buffer, usage);
	}
	return usage;
}
var readonlyUsageMap = /* @__PURE__ */ new WeakMap();
function readonly(buffer) {
	if (!isUsableAsStorage(buffer)) throw new Error(`Cannot call as('readonly') on ${buffer}, as it is not allowed to be used as storage. To allow it, call .$usage('storage') when creating the buffer.`);
	let usage = readonlyUsageMap.get(buffer);
	if (!usage) {
		usage = new TgpuBufferBindingImpl("readonly", buffer);
		readonlyUsageMap.set(buffer, usage);
	}
	return usage;
}
var uniformUsageMap = /* @__PURE__ */ new WeakMap();
function uniform(buffer) {
	if (!isUsableAsUniform(buffer)) throw new Error(`Cannot call as('uniform') on ${buffer}, as it is not allowed to be used as a uniform. To allow it, call .$usage('uniform') when creating the buffer.`);
	let usage = uniformUsageMap.get(buffer);
	if (!usage) {
		usage = new TgpuBufferBindingImpl("uniform", buffer);
		uniformUsageMap.set(buffer, usage);
	}
	return usage;
}
//#endregion
//#region src/data/isContiguous.ts
function isContiguous(schema) {
	return getLayoutInfo(schema, "isContiguous");
}
//#endregion
//#region src/data/getLongestContiguousPrefix.ts
function getLongestContiguousPrefix(schema) {
	return getLayoutInfo(schema, "longestContiguousPrefix");
}
//#endregion
//#region src/data/offsetUtils.ts
/**
* The absolute byte offset of the node, counted from the start of the root schema.
*/
var OFFSET_MARKER = Symbol("indirectOffset");
/**
* The number of contiguous data bytes starting at the node's offset.
* The run is not limited to the node itself: it continues into the data that follows,
* until the first padding byte or the end of the root schema.
* NaN means the run reaches a contiguous runtime-sized array, so its end is unknown.
*
* @remarks The parent computes this value as if the node had no padding inside.
* Non-contiguous nodes have to correct it (e.g. cap it at their own padding) before using it.
*/
var CONTIGUOUS_MARKER = Symbol("indirectContiguous");
function minContiguous(a, b) {
	return Number.isNaN(a) ? b : Math.min(a, b);
}
function isOffsetProxy(value) {
	return typeof value === "object" && value !== null && OFFSET_MARKER in value && CONTIGUOUS_MARKER in value;
}
function scalarNode(offset, contiguous) {
	return {
		[OFFSET_MARKER]: offset,
		[CONTIGUOUS_MARKER]: contiguous
	};
}
function getMarker(target, prop) {
	if (prop === OFFSET_MARKER) return target[OFFSET_MARKER];
	if (prop === CONTIGUOUS_MARKER) return target[CONTIGUOUS_MARKER];
}
function throwIfLoose(schema) {
	if (isUnstruct(schema) || isDisarray(schema)) throw new Error(`memoryLayoutOf: loose schemas are not supported (encountered '${schema.type}').`);
}
function makeProxy(schema, baseOffset, contiguous) {
	const unwrapped = undecorate(schema);
	throwIfLoose(unwrapped);
	if (isVec(unwrapped)) return makeVecProxy(unwrapped, scalarNode(baseOffset, contiguous));
	if (isMat(unwrapped)) return makeMatProxy(unwrapped, scalarNode(baseOffset, contiguous));
	if (isWgslStruct(unwrapped)) return makeStructProxy(unwrapped, scalarNode(baseOffset, contiguous));
	if (isWgslArray(unwrapped)) return makeArrayProxy(unwrapped, scalarNode(baseOffset, contiguous));
	return scalarNode(baseOffset, contiguous);
}
function createOffsetProxy(schema, baseOffset = 0) {
	return makeProxy(schema, baseOffset, sizeOf(undecorate(schema)));
}
var vecPropToIndex = {
	x: 0,
	y: 1,
	z: 2,
	w: 3,
	r: 0,
	g: 1,
	b: 2,
	a: 3,
	"0": 0,
	"1": 1,
	"2": 2,
	"3": 3
};
function makeVecProxy(vec, parent) {
	const baseOffset = parent[OFFSET_MARKER];
	const componentCount = vec.componentCount;
	const componentSize = sizeOf(vec.primitive);
	return new Proxy(parent, { get(t, prop) {
		const marker = getMarker(t, prop);
		if (marker !== void 0) return marker;
		if (typeof prop !== "string") return;
		const index = vecPropToIndex[prop] ?? -1;
		if (index < 0 || index >= componentCount) return;
		const byteOffset = index * componentSize;
		const contiguous = Math.max(0, t[CONTIGUOUS_MARKER] - byteOffset);
		return scalarNode(baseOffset + byteOffset, contiguous);
	} });
}
function makeMatProxy(mat, parent) {
	const [columnCount, columnSchema] = mat.type === "mat2x2f" ? [2, vec2f$1] : mat.type === "mat3x3f" ? [3, vec3f$1] : [4, vec4f$1];
	const elementSize = 4;
	const columnSize = columnCount * elementSize;
	const columnStride = columnCount === 2 ? 8 : 16;
	const hasPadding = columnCount === 3;
	const remainingFromParent = parent[CONTIGUOUS_MARKER];
	const ownProxy = !hasPadding ? parent : scalarNode(parent[OFFSET_MARKER], minContiguous(remainingFromParent, columnSize));
	const columns = new Proxy(ownProxy, { get(t, prop) {
		const marker = getMarker(t, prop);
		if (marker !== void 0) return marker;
		if (typeof prop !== "string") return;
		if (prop === "length") return columnCount;
		const idx = Number(prop);
		if (!Number.isInteger(idx) || idx < 0 || idx >= columnCount) return;
		const columnOffset = idx * columnStride;
		const contiguous = hasPadding ? columnSize : Math.max(0, remainingFromParent - columnOffset);
		return makeVecProxy(columnSchema, scalarNode(parent[OFFSET_MARKER] + columnOffset, contiguous));
	} });
	return new Proxy(ownProxy, { get(t, prop) {
		const marker = getMarker(t, prop);
		if (marker !== void 0) return marker;
		if (typeof prop !== "string") return;
		if (prop === "columns") return columns;
		const index = Number(prop);
		if (!Number.isInteger(index) || index < 0 || index * elementSize >= columnCount * columnStride) return;
		const byteOffset = elementSize * index;
		if (byteOffset % columnStride === columnSize) return;
		const remaining = Math.max(0, remainingFromParent - byteOffset);
		const localRemaining = Math.floor(byteOffset / columnStride) * columnStride + columnSize - byteOffset;
		return scalarNode(t[OFFSET_MARKER] + byteOffset, hasPadding ? localRemaining : remaining);
	} });
}
function makeArrayProxy(array, parent) {
	const elementType = array.elementType;
	const elementSize = sizeOf(elementType);
	const stride = roundUp(elementSize, alignmentOf(elementType));
	const hasPadding = stride > elementSize;
	const elementLCP = getLongestContiguousPrefix(elementType);
	const remainingFromParent = parent[CONTIGUOUS_MARKER];
	const ownProxy = isContiguous(array) ? parent : scalarNode(parent[OFFSET_MARKER], minContiguous(remainingFromParent, getLongestContiguousPrefix(array)));
	return new Proxy(ownProxy, { get(t, prop) {
		const marker = getMarker(t, prop);
		if (marker !== void 0) return marker;
		if (typeof prop !== "string") return;
		if (prop === "length") return array.elementCount;
		const index = Number(prop);
		if (!Number.isInteger(index) || index < 0 || index >= array.elementCount) return;
		const elementOffset = index * stride;
		const remaining = Math.max(0, remainingFromParent - elementOffset);
		let childContiguous;
		if (hasPadding) childContiguous = minContiguous(remaining, elementSize);
		else if (!isContiguous(elementType) && index < array.elementCount - 1) childContiguous = elementSize + elementLCP;
		else childContiguous = remaining;
		return makeProxy(elementType, t[OFFSET_MARKER] + elementOffset, childContiguous);
	} });
}
function makeStructProxy(struct, parent) {
	const offsets = offsetsForProps(struct);
	const propTypes = struct.propTypes;
	const props = Object.entries(propTypes);
	const structSize = sizeOf(struct);
	const remainingFromParent = parent[CONTIGUOUS_MARKER];
	const ownProxy = isContiguous(struct) ? parent : scalarNode(parent[OFFSET_MARKER], minContiguous(remainingFromParent, getLongestContiguousPrefix(struct)));
	const meta = /* @__PURE__ */ new Map();
	let nextPropLocalRemainingData = 0;
	let nextPropRunReachesEnd = false;
	for (let i = props.length - 1; i >= 0; i--) {
		const [name, type] = props[i];
		const info = offsets[name];
		const dataSize = sizeOf(undecorate(type));
		const noGapAfter = (info.padding ?? 0) === 0 && sizeOf(type) === dataSize;
		let dataAfter = 0;
		let runReachesEnd = false;
		if (noGapAfter) if (i === props.length - 1) runReachesEnd = true;
		else {
			const [, nextType] = props[i + 1];
			if (isContiguous(nextType)) {
				dataAfter = sizeOf(nextType) + nextPropLocalRemainingData;
				runReachesEnd = nextPropRunReachesEnd;
			} else dataAfter = getLongestContiguousPrefix(nextType);
		}
		meta.set(name, {
			offset: info.offset,
			localRemaining: dataSize + dataAfter,
			runReachesEnd
		});
		nextPropLocalRemainingData = dataAfter;
		nextPropRunReachesEnd = runReachesEnd;
	}
	return new Proxy(ownProxy, { get(t, prop) {
		const marker = getMarker(t, prop);
		if (marker !== void 0) return marker;
		if (typeof prop !== "string") return;
		const m = meta.get(prop);
		const propSchema = propTypes[prop];
		if (!m || !propSchema) return;
		const childContiguous = m.runReachesEnd ? m.localRemaining + Math.max(0, remainingFromParent - structSize) : m.localRemaining;
		return makeProxy(propSchema, t[OFFSET_MARKER] + m.offset, childContiguous);
	} });
}
/**
* A function that retrieves offset and information for a specific primitive within a data schema.
* Example usage:
* ```ts
* const Boid = d.struct({
*  position: d.vec3f,
*  velocity: d.vec3f,
* });
* const memLayout = d.memoryLayoutOf(Boid, (b) => b.velocity.y);
* console.log(memLayout.offset); // Byte offset of velocity.y within Boid (here 20 bytes)
* console.log(memLayout.contiguous); // Contiguous bytes available from that offset (here 8 bytes)
* ```
*
* @param schema - The data schema to analyze.
* @param accessor - Optional function that accesses a specific element within the schema. If omitted, uses the root offset (0).
* @returns An object containing the offset and contiguous byte information.
*/
function memoryLayoutOf(schema, accessor) {
	throwIfLoose(undecorate(schema));
	if (!accessor) return {
		offset: 0,
		contiguous: getLongestContiguousPrefix(schema)
	};
	const proxy = createOffsetProxy(schema);
	const result = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(accessor(proxy), "result");
	if (isOffsetProxy(result)) return {
		offset: result[OFFSET_MARKER],
		contiguous: result[CONTIGUOUS_MARKER]
	};
	throw new Error("memoryLayoutOf: accessor did not return a schema element. Make sure the accessor navigates to a field or element of the schema (e.g. `(s) => s.position.x`).");
}
//#endregion
//#region src/core/pipeline/webgpuLimitations.ts
/**
* Warns if layout exceeds supported buffer count limits.
*/
function warnIfOverflow(layouts, limits) {
	const entries = Object.values(layouts).flatMap((layout) => Object.values(layout.entries)).filter((entry) => entry !== null);
	const uniform = entries.filter((entry) => "uniform" in entry).length;
	const storage = entries.filter((entry) => "storage" in entry).length;
	if (uniform > limits.maxUniformBuffersPerShaderStage) logger.warn("webgpu-limits-exceeded", `Total number of uniform buffers (${uniform}) exceeds maxUniformBuffersPerShaderStage (${limits.maxUniformBuffersPerShaderStage}). Consider:
1. Grouping some of the uniforms into one using 'd.struct',
2. Increasing the limit when requesting a device or creating a root.`);
	if (storage > limits.maxStorageBuffersPerShaderStage) logger.warn("webgpu-limits-exceeded", `Total number of storage buffers (${storage}) exceeds maxStorageBuffersPerShaderStage (${limits.maxStorageBuffersPerShaderStage}).`);
}
function requiredAlignOf(schema) {
	if (isWgslStruct(schema) || isWgslArray(schema)) return roundUp(alignmentOf(schema), 16);
	return alignmentOf(schema);
}
/**
* See https://www.w3.org/TR/WGSL/#address-space-layout-constraints
*/
function warnIfNotUniformAligned(schema) {
	if (!logger.isEnabled("uniform-schema-misaligned")) return;
	checkUniformAlignment(schema);
}
function checkUniformAlignment(schema) {
	if (isWgslArray(schema)) {
		checkUniformAlignment(schema.elementType);
		const stride = roundUp(sizeOf(schema.elementType), alignmentOf(schema.elementType));
		if (stride % 16 !== 0) logger.warn("uniform-schema-misaligned", `\
Schema '${getName(schema.elementType) ?? "<unnamed>"}' is used in an array in a uniform buffer, and its stride (${stride}) is not a multiple of 16.
This is not portable (see https://www.w3.org/TR/WGSL/#address-space-layout-constraints), and will break on some devices.
To address this, put the element schema in a struct and wrap the prop in 'd.align(16, ...)', or use a different schema like 'vec4f'.`);
	}
	if (isWgslStruct(schema)) {
		Object.values(schema.propTypes).forEach(checkUniformAlignment);
		Object.entries(schema.propTypes).forEach(([key, value]) => {
			const offset = memoryLayoutOf(schema, (schema) => schema[key]).offset;
			const requiredAlignment = requiredAlignOf(value);
			if (offset % requiredAlignment) logger.warn("uniform-schema-misaligned", `\
Schema '${getName(schema) ?? "<unnamed>"}' is used in a uniform buffer, and its property '${key}' does not meet required alignment (offset is ${offset}, required alignment is ${requiredAlignment}).
This is not portable (see https://www.w3.org/TR/WGSL/#address-space-layout-constraints), and will break on some devices.
To address this, wrap the property '${key}' in 'd.align(${requiredAlignment}, ...)'.`);
		});
		const keys = Object.keys(schema.propTypes);
		for (let i = 0; i < keys.length - 1; i++) {
			const thisKey = keys[i];
			const nextKey = keys[i + 1];
			invariant(thisKey && nextKey);
			const thisValue = schema.propTypes[thisKey];
			invariant(thisValue);
			if (!isWgslStruct(thisValue)) continue;
			const minimumDifference = roundUp(sizeOf(thisValue), 16);
			const thisKeyOffset = memoryLayoutOf(schema, (schema) => schema[thisKey]).offset;
			const difference = memoryLayoutOf(schema, (schema) => schema[nextKey]).offset - thisKeyOffset;
			if (minimumDifference > difference) logger.warn("uniform-schema-misaligned", `\
Schema '${getName(schema) ?? "<unnamed>"}' is used in a uniform buffer, and the difference between memory offsets of '${thisKey}' and '${nextKey}' props (${difference}) is less than recommended (${minimumDifference}).
This is not portable (see https://www.w3.org/TR/WGSL/#address-space-layout-constraints), and will break on some devices.
To address this, wrap the '${thisKey}' prop in 'd.size(${minimumDifference}, ...)'.`);
		}
	}
}
//#endregion
//#region src/core/buffer/buffer.ts
var usageToUsageConstructor = {
	uniform,
	mutable,
	readonly
};
/**
* WebGPU requires buffer sizes, writes, copies and mappings
* to be multiples of 4 bytes. Schemas like `arrayOf(u16, 3)` can have a smaller logical
* size, so the underlying allocation gets padded up to the next multiple of 4.
*/
function physicalSizeOf(schema) {
	return roundUp(sizeOf(schema), 4);
}
function INTERNAL_createBuffer(group, typeSchema, initialOrBuffer) {
	if (!isWgslData(typeSchema)) return new TgpuBufferImpl(group, typeSchema, initialOrBuffer, ["storage", "uniform"]);
	return new TgpuBufferImpl(group, typeSchema, initialOrBuffer);
}
var TgpuBufferImpl = class {
	[$internal];
	[$soul];
	resourceType = "buffer";
	#ownBuffer;
	#destroyed = false;
	#internalBuffer;
	get #hostBuffer() {
		return this.#internalBuffer ??= new ArrayBuffer(physicalSizeOf(this.dataType));
	}
	#mappedRange;
	#initialCallback;
	#disallowedUsages;
	initial;
	usableAsUniform = false;
	usableAsStorage = false;
	usableAsVertex = false;
	usableAsIndex = false;
	usableAsIndirect = false;
	constructor(root, dataType, initialOrBuffer, disallowedUsages) {
		this[$soul] = {
			type: "buffer",
			device: root.device,
			dataType,
			flags: GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
			usages: [],
			raw: void 0,
			label: void 0
		};
		this.#disallowedUsages = disallowedUsages;
		if (isGPUBuffer(initialOrBuffer)) {
			this.#ownBuffer = false;
			this[$soul].raw = initialOrBuffer;
		} else {
			this.#ownBuffer = true;
			if (typeof initialOrBuffer === "function") this.#initialCallback = initialOrBuffer;
			else this.initial = initialOrBuffer;
		}
		this[$internal] = {
			root,
			materialize: () => {
				if (this.#destroyed) throw new Error("This buffer has been destroyed");
				const soul = this[$soul];
				if (!soul.raw) {
					const descriptor = {
						size: physicalSizeOf(soul.dataType),
						usage: soul.flags,
						mappedAtCreation: !!this.initial || !!this.#initialCallback,
						label: getName(this) ?? "<unnamed>"
					};
					soul.raw = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(soul.device.createBuffer(descriptor), "raw");
					root[$internal].instrumentation?.bufferMaterialized(this, descriptor);
					if (this.initial || this.#initialCallback) {
						if (this.#initialCallback) this.#initialCallback(this);
						else if (this.initial) writeToArrayBuffer(this.#getMappedRange(), this.dataType, this.initial);
						this.#unmapBuffer();
					}
				}
				return soul.raw;
			}
		};
	}
	get dataType() {
		return this[$soul].dataType;
	}
	get flags() {
		return this[$soul].flags;
	}
	set flags(value) {
		this[$soul].flags = value;
	}
	get buffer() {
		return this[$internal].materialize();
	}
	get destroyed() {
		return this.#destroyed;
	}
	get arrayBuffer() {
		if (this.buffer.mapState === "mapped") return this.#getMappedRange();
		return this.#hostBuffer;
	}
	#getMappedRange() {
		const raw = this[$soul].raw;
		if (!raw || raw.mapState !== "mapped") throw new Error("Buffer is not mapped.");
		this.#mappedRange ??= raw.getMappedRange();
		return this.#mappedRange;
	}
	#unmapBuffer() {
		const raw = this[$soul].raw;
		if (!raw || raw.mapState !== "mapped") return;
		this.#mappedRange = void 0;
		raw.unmap();
	}
	$name(label) {
		setName(this, label);
		const raw = this[$soul].raw;
		if (raw) raw.label = label;
		return this;
	}
	$usage(...usages) {
		for (const usage of usages) {
			if (this.#disallowedUsages?.includes(usage)) throw new Error(`Buffer of type ${this.dataType.type} cannot be used as ${usage}`);
			if (usage === "uniform") warnIfNotUniformAligned(this.dataType);
			this.flags |= usage === "uniform" ? GPUBufferUsage.UNIFORM : 0;
			this.flags |= usage === "storage" ? GPUBufferUsage.STORAGE : 0;
			this.flags |= usage === "vertex" ? GPUBufferUsage.VERTEX : 0;
			this.flags |= usage === "index" ? GPUBufferUsage.INDEX : 0;
			this.flags |= usage === "indirect" ? GPUBufferUsage.INDIRECT : 0;
			this.usableAsUniform = this.usableAsUniform || usage === "uniform";
			this.usableAsStorage = this.usableAsStorage || usage === "storage";
			this.usableAsVertex = this.usableAsVertex || usage === "vertex";
			this.usableAsIndex = this.usableAsIndex || usage === "index";
			this.usableAsIndirect = this.usableAsIndirect || usage === "indirect";
			if (!this[$soul].usages.includes(usage)) this[$soul].usages.push(usage);
		}
		return this;
	}
	$addFlags(flags) {
		if (!this.#ownBuffer) throw new Error("Cannot add flags to a buffer that is not managed by TypeGPU.");
		if (flags & GPUBufferUsage.MAP_READ) {
			this.flags = GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ;
			return this;
		}
		if (flags & GPUBufferUsage.MAP_WRITE) {
			this.flags = GPUBufferUsage.COPY_SRC | GPUBufferUsage.MAP_WRITE;
			return this;
		}
		this.flags |= flags;
		return this;
	}
	compileWriter() {
		getCompiledWriter(this.dataType);
	}
	write(data, options) {
		const gpuBuffer = this.buffer;
		if (gpuBuffer.mapState === "mapped") {
			const mapped = this.#getMappedRange();
			if (data instanceof ArrayBuffer && data === mapped) return;
			writeToArrayBuffer(mapped, this.dataType, data, options);
			return;
		}
		const { startOffset, endOffset } = calculateOffsets(options, this.dataType, data);
		const size = this.#alignedWriteSize(startOffset, endOffset);
		if (!(data instanceof ArrayBuffer && data === this.#hostBuffer)) writeToArrayBuffer(this.#hostBuffer, this.dataType, data, options);
		this[$soul].device.queue.writeBuffer(gpuBuffer, startOffset, this.#hostBuffer, startOffset, size);
		this[$internal].root[$internal].instrumentation?.bufferWritten(this, size);
	}
	/**
	* Returns the number of bytes to upload when writing to `[startOffset, endOffset)`.
	* Writes that reach the end of the schema also cover the trailing padding (see {@link physicalSizeOf}).
	* Other writes have to be 4-byte aligned already, since filling in the neighboring bytes
	* from the host could overwrite data that was changed on the GPU.
	*/
	#alignedWriteSize(startOffset, endOffset) {
		const size = (endOffset === sizeOf(this.dataType) ? physicalSizeOf(this.dataType) : endOffset) - startOffset;
		if (startOffset % 4 !== 0 || size % 4 !== 0) throw new Error(`Cannot write to bytes ${startOffset}-${endOffset} of buffer '${getName(this) ?? "<unnamed>"}'. WebGPU requires writes to start and end at a multiple of 4 bytes. Align the range to 4 bytes, write the whole buffer, or use 4-byte elements (e.g. d.u32 instead of d.u16).`);
		return size;
	}
	/** @deprecated Use {@link patch} instead. */
	writePartial(data) {
		this.patch(convertPartialToPatch(this.dataType, data));
	}
	patch(data) {
		const gpuBuffer = this.buffer;
		if (gpuBuffer.mapState === "mapped") patchArrayBuffer(this.#getMappedRange(), this.dataType, data);
		else {
			const instructions = getPatchInstructions(this.dataType, data, this.#hostBuffer, (start, end) => this.#alignedWriteSize(start, end));
			for (const { data, gpuOffset, uploadSize } of instructions) {
				if (uploadSize === data.byteLength) this[$soul].device.queue.writeBuffer(gpuBuffer, gpuOffset, data);
				else {
					const padded = new Uint8Array(uploadSize);
					padded.set(data);
					this[$soul].device.queue.writeBuffer(gpuBuffer, gpuOffset, padded);
				}
				this[$internal].root[$internal].instrumentation?.bufferWritten(this, uploadSize);
			}
		}
	}
	clear(encoder) {
		const gpuBuffer = this.buffer;
		if (encoder) {
			encoder[$internal].rawEncoder.clearBuffer(gpuBuffer);
			return;
		}
		if (gpuBuffer.mapState === "mapped") {
			new Uint8Array(this.#getMappedRange()).fill(0);
			return;
		}
		const rawEncoder = this[$soul].device.createCommandEncoder();
		rawEncoder.clearBuffer(gpuBuffer);
		this[$soul].device.queue.submit([rawEncoder.finish()]);
	}
	copyFrom(srcBuffer, encoder) {
		if (this.buffer.mapState === "mapped") throw new Error("Cannot copy to a mapped buffer.");
		const size = physicalSizeOf(this.dataType);
		if (encoder) {
			encoder[$internal].rawEncoder.copyBufferToBuffer(srcBuffer.buffer, 0, this.buffer, 0, size);
			return;
		}
		const rawEncoder = this[$soul].device.createCommandEncoder();
		rawEncoder.copyBufferToBuffer(srcBuffer.buffer, 0, this.buffer, 0, size);
		this[$soul].device.queue.submit([rawEncoder.finish()]);
	}
	async read() {
		const gpuBuffer = this.buffer;
		if (gpuBuffer.mapState === "mapped") return readFromArrayBuffer(this.#getMappedRange(), this.dataType);
		if (gpuBuffer.usage & GPUBufferUsage.MAP_READ) {
			await gpuBuffer.mapAsync(GPUMapMode.READ);
			const res = readFromArrayBuffer(this.#getMappedRange(), this.dataType);
			this.#unmapBuffer();
			return res;
		}
		const size = physicalSizeOf(this.dataType);
		const stagingBuffer = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(this[$soul].device.createBuffer({
			size,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
		}), "stagingBuffer");
		const commandEncoder = this[$soul].device.createCommandEncoder();
		commandEncoder.copyBufferToBuffer(gpuBuffer, 0, stagingBuffer, 0, size);
		this[$soul].device.queue.submit([commandEncoder.finish()]);
		await stagingBuffer.mapAsync(GPUMapMode.READ, 0, size);
		const res = readFromArrayBuffer(stagingBuffer.getMappedRange(), this.dataType);
		stagingBuffer.unmap();
		stagingBuffer.destroy();
		return res;
	}
	as(usage) {
		return usageToUsageConstructor[usage](this);
	}
	destroy() {
		if (this.#destroyed) return;
		this.#destroyed = true;
		this.#mappedRange = void 0;
		if (this.#ownBuffer) this[$soul].raw?.destroy();
		this[$internal].root[$internal].instrumentation?.resourceDestroyed(this);
	}
	toString() {
		return `buffer:${getName(this) ?? "<unnamed>"}`;
	}
};
//#endregion
//#region src/core/immediate/immediateVar.ts
function isImmediateVar(value) {
	return value?.resourceType === "immediate-var" && isMarkedInternal(value);
}
/**
* Validates that the given immediate variable can be used with the given root.
* @returns The size of the immediate data in bytes, to be passed as
* `immediateSize` to `device.createPipelineLayout`.
*/
function validateImmediateUsage(immediate, root) {
	if (!root.enabledWgslLanguageFeatures.has("immediate_address_space")) throw new Error(`Immediate variable '${getName(immediate) ?? "<unnamed>"}' cannot be used, because the 'immediate_address_space' WGSL language extension is not supported in this environment. Check support with root.enabledWgslLanguageFeatures and fall back to a uniform buffer (e.g. via tgpu.accessor) when unavailable.`);
	return sizeOf(immediate.dataType);
}
var defaultSnapshots = /* @__PURE__ */ new WeakMap();
function createImmediateSnapshot(immediate, value) {
	const bytes = new Uint8Array(sizeOf(immediate.dataType));
	writeToArrayBuffer(bytes.buffer, immediate.dataType, value);
	return bytes;
}
/** Captures pass overrides and tracks the last snapshot written to its encoder. */
var ImmediatePassState = class {
	#snapshots = /* @__PURE__ */ new Map();
	#lastWritten;
	set(immediate, value) {
		this.#snapshots.set(immediate, createImmediateSnapshot(immediate, value));
	}
	invalidate() {
		this.#lastWritten = void 0;
	}
	/** Pass overrides take precedence over pipeline values and the variable's default. */
	write(pass, immediate, pipelineSnapshots, deduplicate) {
		const snapshot = this.#snapshots.get(immediate) ?? pipelineSnapshots?.get(immediate) ?? defaultSnapshots.get(immediate);
		if (snapshot === void 0) throw new MissingImmediatesError(getName(immediate));
		if (deduplicate && this.#lastWritten === snapshot) return;
		pass.setImmediates(0, snapshot.buffer);
		this.#lastWritten = snapshot;
	}
};
(class TgpuImmediateVarImpl {
	[$soul];
	static {
		const prototype = TgpuImmediateVarImpl.prototype;
		prototype.resourceType = "immediate-var";
		makeDereferenceable(makeResolvable(prototype, {
			asString() {
				return `immediateVar:${getName(this) ?? "<unnamed>"}`;
			},
			resolve(ctx) {
				ctx.registerImmediate(this);
				const id = ctx.makeUniqueIdentifier(getName(this), "global");
				return ctx.gen.declareGlobalVar({
					scope: "immediate",
					id,
					dataType: this[$soul].dataType,
					init: void 0
				});
			}
		}), {
			codegenMode: { getBaseSnippet(trackingProxy) {
				return snip(trackingProxy, this[$soul].dataType, "immediate", false);
			} },
			normalMode: { get() {
				throw new IllegalVarAccessError(isInsideTgpuFn() ? `Cannot access immediate variable '${getName(this) ?? "<unnamed>"}'. TypeGPU functions that depend on GPU resources need to be part of a compute dispatch or draw call` : "Immediate variables are inaccessible during normal JS execution");
			} }
		});
	}
	constructor(dataType, defaultValue) {
		this[$soul] = {
			type: "immediate-var",
			dataType,
			defaultValue,
			label: void 0
		};
		if (defaultValue !== void 0) defaultSnapshots.set(this, createImmediateSnapshot(this, defaultValue));
	}
	get dataType() {
		return this[$soul].dataType;
	}
	get defaultValue() {
		return this[$soul].defaultValue;
	}
	$name(label) {
		setName(this, label);
		return this;
	}
});
//#endregion
//#region src/shared/generators.ts
/**
* Yields values in the sequence 0,1,2..∞ except for the ones in the `excluded` set.
*/
function* naturalsExcept(excluded) {
	let next = 0;
	while (true) {
		if (!excluded.has(next)) yield next;
		next++;
	}
}
//#endregion
//#region src/core/sampler/sampler.ts
function INTERNAL_createSampler(props, root) {
	return new TgpuFixedSamplerImpl(sampler(), props, root);
}
function INTERNAL_createComparisonSampler(props, root) {
	return new TgpuFixedSamplerImpl(comparisonSampler(), props, root);
}
function isSampler(resource) {
	const maybe = resource;
	return maybe?.resourceType === "sampler" && !!maybe[$internal];
}
function isComparisonSampler(resource) {
	const maybe = resource;
	return maybe?.resourceType === "sampler-comparison" && !!maybe[$internal];
}
var TgpuLaidOutSamplerImpl = class TgpuLaidOutSamplerImpl {
	[$internal] = { materialize: void 0 };
	resourceType;
	schema;
	#membership;
	static {
		makeDereferenceable(makeResolvable(TgpuLaidOutSamplerImpl.prototype, {
			asString() {
				return `${this.resourceType}:${getName(this) ?? "<unnamed>"}`;
			},
			resolve(ctx) {
				const id = ctx.makeUniqueIdentifier(getName(this), "global");
				const group = ctx.allocateLayoutEntry(this.#membership.layout);
				ctx.addDeclaration(`@group(${group}) @binding(${this.#membership.idx}) var ${id}: ${ctx.resolve(this.schema).value};`, id);
				return snip(id, this.schema, "handle");
			}
		}), {
			codegenMode: { getBaseSnippet(trackingProxy) {
				return snip(trackingProxy, this.schema, "handle", false);
			} },
			normalMode: { get() {
				throw new Error("Direct access to sampler values is possible only as part of a compute dispatch or draw call.");
			} }
		});
	}
	constructor(schema, membership) {
		this.schema = schema;
		this.#membership = membership;
		this.resourceType = schema.type === "sampler_comparison" ? "sampler-comparison" : "sampler";
		setName(this, membership.key);
	}
};
var TgpuFixedSamplerImpl = class TgpuFixedSamplerImpl {
	[$internal];
	[$soul];
	resourceType;
	schema;
	#filtering;
	static {
		makeDereferenceable(makeResolvable(TgpuFixedSamplerImpl.prototype, {
			asString() {
				return `${this.resourceType}:${getName(this) ?? "<unnamed>"}`;
			},
			resolve(ctx) {
				const id = ctx.makeUniqueIdentifier(getName(this), "global");
				const { group, binding } = ctx.allocateFixedEntry(this.schema.type === "sampler_comparison" ? { sampler: "comparison" } : { sampler: this.#filtering ? "filtering" : "non-filtering" }, this);
				ctx.addDeclaration(`@group(${group}) @binding(${binding}) var ${id}: ${ctx.resolve(this.schema).value};`, id);
				return snip(id, this.schema, "handle");
			}
		}), {
			codegenMode: { getBaseSnippet(trackingProxy) {
				return snip(trackingProxy, this.schema, "handle", false);
			} },
			normalMode: { get() {
				throw new Error("Direct access to sampler values is possible only as part of a compute dispatch or draw call.");
			} }
		});
	}
	constructor(schema, props, root) {
		this.schema = schema;
		this.resourceType = schema.type === "sampler_comparison" ? "sampler-comparison" : "sampler";
		this[$soul] = {
			type: this.resourceType,
			device: root.device,
			props,
			raw: void 0,
			label: void 0
		};
		this[$internal] = {
			root,
			materialize: () => {
				const soul = this[$soul];
				if (!soul.raw) soul.raw = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(soul.device.createSampler({
					...soul.props,
					label: getName(this) ?? "<unnamed>"
				}), "raw");
				return soul.raw;
			}
		};
		this.#filtering = props.minFilter === "linear" || props.magFilter === "linear" || props.mipmapFilter === "linear";
	}
	$name(label) {
		setName(this, label);
		return this;
	}
};
//#endregion
//#region src/core/texture/externalTexture.ts
var TgpuExternalTextureImpl = class {
	resourceType = "external-texture";
	[$internal] = true;
	schema;
	#membership;
	constructor(schema, membership) {
		this.schema = schema;
		this.#membership = membership;
		setName(this, membership.key);
	}
	[$resolve](ctx) {
		const id = ctx.makeUniqueIdentifier(getName(this), "global");
		const group = ctx.allocateLayoutEntry(this.#membership.layout);
		ctx.addDeclaration(`@group(${group}) @binding(${this.#membership.idx}) var ${id}: ${ctx.resolve(this.schema).value};`, id);
		return snip(id, textureExternal(), "handle");
	}
	get [$gpuValueOf]() {
		const schema = this.schema;
		return new Proxy({
			[$internal]: true,
			get [$ownSnippet]() {
				return snip(this, schema, "handle", false);
			},
			[$comptimeValueOf]: runtimeOnly,
			[$resolve]: (ctx) => ctx.resolve(this),
			toString: () => `textureExternal:${getName(this) ?? "<unnamed>"}.$`
		}, valueProxyHandler);
	}
	get $() {
		if (inCodegenMode()) return this[$gpuValueOf];
		throw new Error("Direct access to texture views values is possible only as part of a compute dispatch or draw call. Try .read() or .write() instead");
	}
	toString() {
		return `textureExternal:${getName(this) ?? "<unnamed>"}`;
	}
};
//#endregion
//#region src/core/texture/textureFormats.ts
var DEPTH_ASPECT_NON_COPYABLE = {
	channelType: f32,
	vectorType: vec4f$1,
	sampleTypes: ["depth", "unfilterable-float"],
	texelSize: "non-copyable"
};
var DEPTH_ASPECT_16 = {
	channelType: f32,
	vectorType: vec4f$1,
	sampleTypes: ["depth", "unfilterable-float"],
	texelSize: 2
};
var DEPTH_ASPECT_32 = {
	channelType: f32,
	vectorType: vec4f$1,
	sampleTypes: ["depth", "unfilterable-float"],
	texelSize: 4
};
var STENCIL_ASPECT = {
	channelType: u32,
	vectorType: vec4u$1,
	sampleTypes: ["uint"],
	texelSize: 1
};
var formatInfoCache = /* @__PURE__ */ new Map();
function getTextureFormatInfo(format) {
	let info = formatInfoCache.get(format);
	if (info === void 0) {
		info = createFormatInfo(format);
		formatInfoCache.set(format, info);
	}
	return info;
}
function createFormatInfo(format) {
	const channelType = parseChannelType(format);
	const depthAspect = getDepthAspect(format);
	const hasStencil = format.includes("stencil");
	return {
		channelType,
		vectorType: channelType === u32 ? vec4u$1 : channelType === i32 ? vec4i$1 : vec4f$1,
		texelSize: parseTexelSize(format),
		sampleTypes: parseSampleTypes(format),
		canRenderAttachment: canRenderAttachment(format),
		...depthAspect && { depthAspect },
		...hasStencil && { stencilAspect: STENCIL_ASPECT }
	};
}
function getDepthAspect(format) {
	if (format === "depth16unorm") return DEPTH_ASPECT_16;
	if (format === "depth32float" || format === "depth32float-stencil8") return DEPTH_ASPECT_32;
	if (format === "depth24plus" || format === "depth24plus-stencil8") return DEPTH_ASPECT_NON_COPYABLE;
}
function canRenderAttachment(format) {
	if (format.startsWith("bc") || format.startsWith("etc2") || format.startsWith("eac") || format.startsWith("astc")) return false;
	if (format === "rgb9e5ufloat") return false;
	return true;
}
function parseChannelType(format) {
	if (format === "stencil8") return u32;
	if (format.includes("uint")) return u32;
	if (format.includes("sint")) return i32;
	return f32;
}
function parseTexelSize(format) {
	const [, channels, bits] = format.match(/^(rgba|bgra|rg|r)(8|16|32)/) ?? [];
	if (channels && bits) return channels.length * Number(bits) / 8;
	if (format === "stencil8") return 1;
	if (format === "depth16unorm") return 2;
	if (format === "depth32float") return 4;
	if (format === "depth32float-stencil8") return 5;
	if (format === "depth24plus" || format === "depth24plus-stencil8") return "non-copyable";
	if (/^(bc[14]-|etc2-rgb8|eac-r11)/.test(format)) return 8;
	if (/^(bc|astc-|etc2-rgba|eac-rg)/.test(format)) return 16;
	return 4;
}
function parseSampleTypes(format) {
	if (format === "stencil8") return ["uint"];
	if (format.includes("uint")) return ["uint"];
	if (format.includes("sint")) return ["sint"];
	if (format.includes("depth")) return ["depth", "unfilterable-float"];
	if (/^(r|rg|rgba)16(u|s)norm$/.test(format)) return ["unfilterable-float"];
	return ["float", "unfilterable-float"];
}
var FLOAT32_FORMATS = new Set([
	"r32float",
	"rg32float",
	"rgba32float"
]);
function getEffectiveSampleTypes(device, format) {
	if (FLOAT32_FORMATS.has(format) && !device.features.has("float32-filterable")) return ["unfilterable-float"];
	return getTextureFormatInfo(format).sampleTypes;
}
//#endregion
//#region src/core/texture/textureWrite.ts
function origin3d([x = 0, y = 0, z = 0] = []) {
	return {
		x,
		y,
		z
	};
}
function mipLevelSize({ size, dimension }, mipLevel) {
	const scale = (value = 1) => Math.max(1, value >> mipLevel);
	return [
		scale(size[0]),
		scale(size[1]),
		dimension === "3d" ? scale(size[2]) : size[2] ?? 1
	];
}
/** The size of the written region: `size`, or the rest of the mip level past `origin` */
function writeRegionSize(texture, options) {
	const [mipWidth, mipHeight] = mipLevelSize(texture, options.mipLevel ?? 0);
	const [x = 0, y = 0] = options.origin ?? [];
	const [width = mipWidth - x, height = mipHeight - y] = options.size ?? [];
	return [width, height];
}
function imageSize(source) {
	const { videoWidth, videoHeight } = source;
	if (videoWidth && videoHeight) return [videoWidth, videoHeight];
	const { naturalWidth, naturalHeight } = source;
	if (naturalWidth && naturalHeight) return [naturalWidth, naturalHeight];
	const { codedWidth, codedHeight } = source;
	if (codedWidth && codedHeight) return [codedWidth, codedHeight];
	const { width, height } = source;
	if (width && height) return [width, height];
	throw new Error("Cannot determine dimensions of the provided image source.");
}
function sameSize(a, b) {
	return a[0] === b[0] && a[1] === b[1];
}
function resolveImageWrite(texture, source, options, layer = options.origin?.[2] ?? 0) {
	const [x = 0, y = 0] = options.origin ?? [];
	const [sourceX = 0, sourceY = 0] = options.sourceOrigin ?? [];
	const [imageWidth, imageHeight] = imageSize(source);
	const [sourceWidth = imageWidth - sourceX, sourceHeight = imageHeight - sourceY] = options.sourceSize ?? [];
	let sourceSize = [sourceWidth, sourceHeight];
	let size = writeRegionSize(texture, options);
	if (options.fit === "clip") sourceSize = size = [Math.min(sourceSize[0], size[0]), Math.min(sourceSize[1], size[1])];
	else if (options.fit !== "stretch" && !sameSize(sourceSize, size)) throw new Error(`Texture write source size ${sourceSize.join("x")} does not match target size ${size.join("x")}. Pass fit: 'stretch' to scale the source or fit: 'clip' to copy the overlapping region.`);
	return {
		source,
		sourceOrigin: {
			x: sourceX,
			y: sourceY
		},
		sourceSize,
		origin: {
			x,
			y,
			z: layer
		},
		size,
		mipLevel: options.mipLevel ?? 0,
		options
	};
}
//#endregion
//#region src/core/texture/textureUtils.ts
var FULLSCREEN_VERTEX_SHADER = `
struct VertexOutput {
  @builtin(position) pos: vec4f,
  @location(0) uv: vec2f,
}

@vertex
fn vs_main(@builtin(vertex_index) i: u32) -> VertexOutput {
  const pos = array(vec2f(-1, -1), vec2f(3, -1), vec2f(-1, 3));
  const uv = array(vec2f(0, 1), vec2f(2, 1), vec2f(0, -1));
  return VertexOutput(vec4f(pos[i], 0, 1), uv[i]);
}`;
var sampleFragmentShader = (channel) => `
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  return textureSample(src, samp, uv)${channel ? `.${channel.repeat(4)}` : ""};
}`;
var GATHER_FRAGMENT_SHADER = `
@group(0) @binding(0) var src: texture_2d<f32>;
@group(0) @binding(1) var samp: sampler;

@fragment
fn fs_main(@location(0) uv: vec2f) -> @location(0) vec4f {
  let r = textureGather(0, src, samp, uv);
  let g = textureGather(1, src, samp, uv);
  let b = textureGather(2, src, samp, uv);
  let a = textureGather(3, src, samp, uv);
  return vec4f(dot(r, vec4f(0.25)), dot(g, vec4f(0.25)), dot(b, vec4f(0.25)), dot(a, vec4f(0.25)));
}`;
var CHANNEL_WRITE_MASKS = {
	r: 1,
	g: 2,
	b: 4,
	a: 8
};
var deviceCaches = /* @__PURE__ */ new WeakMap();
function cached(device, key, create) {
	let cache = deviceCaches.get(device);
	if (!cache) {
		cache = /* @__PURE__ */ new Map();
		deviceCaches.set(device, cache);
	}
	if (!cache.has(key)) cache.set(key, create());
	return cache.get(key);
}
function clearTextureUtilsCache(device) {
	deviceCaches.delete(device);
}
function blit(device, encoder, { format, filterable, filter = "linear", channel }, source, attachment, viewport) {
	const sampleType = filterable ? "float" : "unfilterable-float";
	const bindGroupLayout = cached(device, `layout:${sampleType}`, () => device.createBindGroupLayout({ entries: [{
		binding: 0,
		visibility: GPUShaderStage.FRAGMENT,
		texture: { sampleType }
	}, {
		binding: 1,
		visibility: GPUShaderStage.FRAGMENT,
		sampler: { type: filterable ? "filtering" : "non-filtering" }
	}] }));
	const pipeline = cached(device, `pipeline:${format}:${sampleType}:${channel ? `${channel.from}${channel.to}` : ""}`, () => device.createRenderPipeline({
		layout: cached(device, `pipelineLayout:${sampleType}`, () => device.createPipelineLayout({ bindGroupLayouts: [bindGroupLayout] })),
		vertex: { module: cached(device, "vertex", () => device.createShaderModule({ code: FULLSCREEN_VERTEX_SHADER })) },
		fragment: {
			module: cached(device, `fragment:${sampleType}:${channel?.from ?? ""}`, () => device.createShaderModule({ code: filterable ? sampleFragmentShader(channel?.from) : GATHER_FRAGMENT_SHADER })),
			targets: [channel ? {
				format,
				writeMask: CHANNEL_WRITE_MASKS[channel.to]
			} : { format }]
		}
	}));
	const sampler = cached(device, `sampler:${filterable && filter}`, () => device.createSampler(filterable ? {
		magFilter: filter,
		minFilter: filter
	} : {}));
	const bindGroup = device.createBindGroup({
		layout: bindGroupLayout,
		entries: [{
			binding: 0,
			resource: source
		}, {
			binding: 1,
			resource: sampler
		}]
	});
	const pass = encoder.beginRenderPass({ colorAttachments: [attachment] });
	if (viewport) {
		pass.setViewport(...viewport, 0, 1);
		pass.setScissorRect(...viewport);
	}
	pass.setPipeline(pipeline);
	pass.setBindGroup(0, bindGroup);
	pass.draw(3);
	pass.end();
}
function layerView(texture, mipLevel, layer) {
	const is3d = texture.dimension === "3d";
	return texture.createView({
		dimension: is3d ? "3d" : "2d",
		baseMipLevel: mipLevel,
		mipLevelCount: 1,
		baseArrayLayer: is3d ? 0 : layer,
		arrayLayerCount: 1
	});
}
function layerAttachment(texture, mipLevel, layer, loadOp) {
	return {
		view: layerView(texture, mipLevel, layer),
		...texture.dimension === "3d" && { depthSlice: layer },
		loadOp,
		storeOp: "store"
	};
}
function generateTextureMipmaps(device, texture, baseMipLevel = 0, mipLevels) {
	if (texture.dimension !== "2d") throw new Error("Mipmap generation only supports 2D textures.");
	const { format } = texture;
	const sampleTypes = getEffectiveSampleTypes(device, format);
	const filterable = sampleTypes.includes("float");
	if (!filterable && !sampleTypes.includes("unfilterable-float")) throw new Error(`Cannot generate mipmaps for format '${format}': only float formats are supported.`);
	if (!getTextureFormatInfo(format).canRenderAttachment) throw new Error(`Cannot generate mipmaps for format '${format}': format does not support render attachments.`);
	const levels = mipLevels ?? texture.mipLevelCount - baseMipLevel;
	const encoder = device.createCommandEncoder();
	for (let layer = 0; layer < texture.depthOrArrayLayers; layer++) for (let mip = baseMipLevel; mip < baseMipLevel + levels - 1; mip++) blit(device, encoder, {
		format,
		filterable
	}, layerView(texture, mip, layer), layerAttachment(texture, mip + 1, layer, "clear"));
	device.queue.submit([encoder.finish()]);
}
function clearTextureWithColor(device, texture, color, mipLevels) {
	const encoder = device.createCommandEncoder();
	for (const mipLevel of mipLevels) {
		const layers = texture.dimension === "3d" ? Math.max(1, texture.depthOrArrayLayers >> mipLevel) : texture.depthOrArrayLayers;
		for (let layer = 0; layer < layers; layer++) encoder.beginRenderPass({ colorAttachments: [{
			...layerAttachment(texture, mipLevel, layer, "clear"),
			clearValue: [...color]
		}] }).end();
	}
	device.queue.submit([encoder.finish()]);
}
function copyImage(device, write, destination, size) {
	const { flipY = false, premultipliedAlpha = false, colorSpace = "srgb" } = write.options;
	device.queue.copyExternalImageToTexture({
		source: write.source,
		origin: write.sourceOrigin,
		flipY
	}, {
		...destination,
		premultipliedAlpha,
		colorSpace
	}, size);
}
function stageImage(device, write, format) {
	const texture = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(device.createTexture({
		size: write.sourceSize,
		format,
		usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
	}), "texture");
	copyImage(device, write, { texture }, write.sourceSize);
	return texture;
}
function stagingFormat(format) {
	if (format.endsWith("-srgb")) return format;
	return format.endsWith("8unorm") ? "rgba8unorm" : "rgba16float";
}
function writeImages(device, texture, writes) {
	const isCopy = (write) => !write.channel && sameSize(write.sourceSize, write.size);
	const bySource = /* @__PURE__ */ new Map();
	for (const write of writes) if (isCopy(write) && texture.dimension === "2d") copyImage(device, write, {
		texture,
		mipLevel: write.mipLevel,
		origin: write.origin
	}, write.size);
	else bySource.set(write.source, [...bySource.get(write.source) ?? [], write]);
	for (const group of bySource.values()) {
		const encoder = device.createCommandEncoder();
		let staged;
		for (const write of group) if (isCopy(write)) {
			staged ??= stageImage(device, write, texture.format);
			encoder.copyTextureToTexture({ texture: staged }, {
				texture,
				mipLevel: write.mipLevel,
				origin: write.origin
			}, [...write.size, 1]);
		} else {
			staged ??= stageImage(device, write, stagingFormat(texture.format));
			blit(device, encoder, {
				format: texture.format,
				filterable: true,
				filter: write.options.filter,
				channel: write.channel
			}, staged.createView(), layerAttachment(texture, write.mipLevel, write.origin.z, "load"), [
				write.origin.x,
				write.origin.y,
				...write.size
			]);
		}
		device.queue.submit([encoder.finish()]);
		staged?.destroy();
	}
}
//#endregion
//#region src/core/texture/texture.ts
function getDescriptorForProps(props) {
	return {
		dimension: props.dimension ?? "2d",
		sampleType: getTextureFormatInfo(props.format).channelType,
		multisampled: !((props.sampleCount ?? 1) === 1)
	};
}
function INTERNAL_createTexture(props, root, rawTexture) {
	return new TgpuTextureImpl(props, root, rawTexture);
}
function isTexture(value) {
	return value?.resourceType === "texture" && !!value[$internal];
}
function isTextureView(value) {
	return value?.resourceType === "texture-view" && !!value[$internal];
}
var TgpuTextureImpl = class {
	[$internal];
	[$soul];
	resourceType = "texture";
	usableAsSampled = false;
	usableAsStorage = false;
	usableAsRender = false;
	#formatInfo;
	#destroyed = false;
	#ownTexture;
	constructor(props, root, rawTexture) {
		this.#ownTexture = rawTexture === void 0;
		this[$soul] = {
			type: "texture",
			device: root.device,
			props,
			flags: GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC,
			flagsOverridden: false,
			usages: [],
			raw: rawTexture,
			label: void 0
		};
		this.#formatInfo = getTextureFormatInfo(props.format);
		this[$internal] = {
			root,
			materialize: () => {
				if (this.#destroyed) throw new Error("This texture has been destroyed");
				const soul = this[$soul];
				if (!soul.raw) {
					const props = soul.props;
					const descriptor = {
						label: getName(this) ?? "<unnamed>",
						format: props.format,
						size: props.size,
						usage: soul.flags,
						dimension: props.dimension ?? "2d",
						viewFormats: props.viewFormats ?? [],
						mipLevelCount: props.mipLevelCount ?? 1,
						sampleCount: props.sampleCount ?? 1
					};
					soul.raw = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(soul.device.createTexture(descriptor), "raw");
					root[$internal].instrumentation?.textureMaterialized(this, descriptor);
				}
				return soul.raw;
			}
		};
	}
	get props() {
		return this[$soul].props;
	}
	$name(label) {
		setName(this, label);
		return this;
	}
	$usage(...usages) {
		const soul = this[$soul];
		if (soul.flagsOverridden) throw new Error("Cannot call $usage() after $overrideFlags().");
		const hasStorage = usages.includes("storage");
		const hasSampled = usages.includes("sampled");
		const hasRender = usages.includes("render");
		const hasTransient = usages.includes("transient");
		const bindingFlags = (hasSampled ? GPUTextureUsage.TEXTURE_BINDING : 0) | (hasStorage ? GPUTextureUsage.STORAGE_BINDING : 0);
		const transientFlags = GPUTextureUsage.TRANSIENT_ATTACHMENT | GPUTextureUsage.RENDER_ATTACHMENT;
		const nextFlags = soul.flags | bindingFlags | (hasRender ? GPUTextureUsage.RENDER_ATTACHMENT : 0);
		const hasTransientUsage = hasTransient || !!(soul.flags & GPUTextureUsage.TRANSIENT_ATTACHMENT);
		const hasSampledOrStorageUsage = !!(nextFlags & (GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.STORAGE_BINDING));
		if (hasTransientUsage && hasSampledOrStorageUsage) throw new Error("Transient texture usage cannot be combined with 'sampled' or 'storage'.");
		soul.flags = hasTransient ? transientFlags : nextFlags;
		this.usableAsStorage ||= hasStorage;
		this.usableAsSampled ||= hasSampled;
		this.usableAsRender ||= hasRender || hasTransient;
		for (const usage of usages) if (!soul.usages.includes(usage)) soul.usages.push(usage);
		return this;
	}
	$overrideFlags(flags) {
		const soul = this[$soul];
		soul.flags = flags;
		soul.flagsOverridden = true;
		this.usableAsSampled = true;
		this.usableAsStorage = true;
		this.usableAsRender = true;
		return this;
	}
	createView(schema, viewDescriptor) {
		if (schema === "render") return new TgpuTextureRenderViewImpl(this, viewDescriptor);
		return new TgpuFixedTextureViewImpl(schema ?? textureDescriptorToSchema(getDescriptorForProps(this.props)), this, viewDescriptor);
	}
	#clearMipLevel(mip = 0) {
		const [width, height, depth] = mipLevelSize(this.props, mip);
		const texelSize = this.#formatInfo.texelSize;
		if (texelSize === "non-copyable") throw new Error(`Cannot clear texture with format '${this.props.format}': this format does not support copy operations.`);
		this[$soul].device.queue.writeTexture({
			texture: this[$internal].materialize(),
			mipLevel: mip
		}, new Uint8Array(width * height * depth * texelSize), {
			bytesPerRow: texelSize * width,
			rowsPerImage: height
		}, [
			width,
			height,
			depth
		]);
	}
	clear(colorOrMipLevel = "all", mipLevel = "all") {
		const mipLevels = (level) => level === "all" ? [...Array(this.props.mipLevelCount ?? 1).keys()] : [level];
		if (typeof colorOrMipLevel !== "object") {
			for (const mip of mipLevels(colorOrMipLevel)) this.#clearMipLevel(mip);
			return;
		}
		if (!this.usableAsRender) throw new Error("texture.clear(color) requires 'render' usage. Add it via the $usage('render') method.");
		clearTextureWithColor(this[$soul].device, this[$internal].materialize(), colorOrMipLevel, mipLevels(mipLevel));
	}
	generateMipmaps(baseMipLevel = 0, mipLevels) {
		if (!this.usableAsRender) throw new Error("generateMipmaps called without specifying 'render' usage. Add it via the $usage('render') method.");
		const actualMipLevels = mipLevels ?? (this.props.mipLevelCount ?? 1) - baseMipLevel;
		if (actualMipLevels <= 1) {
			logger.warn("suspicious", `generateMipmaps is a no-op: would generate ${actualMipLevels} mip levels (base: ${baseMipLevel}, total: ${this.props.mipLevelCount ?? 1})`);
			return;
		}
		if (baseMipLevel >= (this.props.mipLevelCount ?? 1)) throw new Error(`Base mip level ${baseMipLevel} is out of range. Texture has ${this.props.mipLevelCount ?? 1} mip levels.`);
		generateTextureMipmaps(this[$soul].device, this[$internal].materialize(), baseMipLevel, actualMipLevels);
	}
	write(source, options = {}) {
		if (source instanceof ArrayBuffer || ArrayBuffer.isView(source)) {
			this.#writeBufferData(source, typeof options === "number" ? { mipLevel: options } : options);
			return;
		}
		if (!this.usableAsRender) throw new Error("texture.write(...) with image sources requires 'render' usage. Add it via the $usage('render') method.");
		const imageOptions = options;
		const sources = Array.isArray(source) ? source : [source];
		const baseLayer = imageOptions.origin?.[2] ?? 0;
		const layerCount = mipLevelSize(this.props, imageOptions.mipLevel ?? 0)[2];
		if (baseLayer + sources.length > layerCount) logger.warn("suspicious", `Too many image sources provided. Texture has ${layerCount} layers, got ${sources.length} sources starting at layer ${baseLayer}. Extra sources will be ignored.`);
		writeImages(this[$soul].device, this[$internal].materialize(), sources.slice(0, layerCount - baseLayer).map((image, i) => resolveImageWrite(this.props, image, imageOptions, baseLayer + i)));
	}
	async writeAsync(source, options = {}) {
		const [resizeWidth, resizeHeight] = writeRegionSize(this.props, options);
		const bitmap = await createImageBitmap(source, options.fit === "stretch" ? {
			resizeWidth,
			resizeHeight,
			resizeQuality: options.filter === "nearest" ? "pixelated" : "high"
		} : void 0);
		try {
			this.write(bitmap, options);
		} finally {
			bitmap.close();
		}
	}
	#writeBufferData(source, options) {
		const texelSize = this.#formatInfo.texelSize;
		if (texelSize === "non-copyable") throw new Error(`Cannot write to texture with format '${this.props.format}': this format does not support copy operations.`);
		const mipLevel = options.mipLevel ?? 0;
		const [mipWidth, mipHeight, mipDepth] = mipLevelSize(this.props, mipLevel);
		const origin = origin3d(options.origin);
		const width = options.size?.[0] ?? mipWidth - origin.x;
		const height = options.size?.[1] ?? mipHeight - origin.y;
		const depth = options.size?.[2] ?? mipDepth - origin.z;
		const expectedSize = width * height * depth * texelSize;
		if (source.byteLength !== expectedSize) throw new Error(`Buffer size mismatch. Expected ${expectedSize} bytes for mip level ${mipLevel}, got ${source.byteLength} bytes.`);
		this[$soul].device.queue.writeTexture({
			texture: this[$internal].materialize(),
			mipLevel,
			origin
		}, source, {
			bytesPerRow: texelSize * width,
			rowsPerImage: height
		}, [
			width,
			height,
			depth
		]);
	}
	copyFrom(source, options) {
		if (source.props.format !== this.props.format) throw new Error(`Texture format mismatch. Source texture has format ${source.props.format}, target texture has format ${this.props.format}`);
		if (!options && (source.props.size[0] !== this.props.size[0] || (source.props.size[1] ?? 1) !== (this.props.size[1] ?? 1) || (source.props.size[2] ?? 1) !== (this.props.size[2] ?? 1))) throw new Error(`Texture size mismatch. Source texture has size ${source.props.size.join("x")}, target texture has size ${this.props.size.join("x")}. Pass copy options to copy a region.`);
		const sourceMipLevel = options?.sourceMipLevel ?? 0;
		const sourceOrigin = origin3d(options?.sourceOrigin);
		const [sourceWidth, sourceHeight, sourceDepth] = mipLevelSize(source.props, sourceMipLevel);
		const commandEncoder = this[$soul].device.createCommandEncoder();
		commandEncoder.copyTextureToTexture({
			texture: source[$internal].materialize(),
			mipLevel: sourceMipLevel,
			origin: sourceOrigin
		}, {
			texture: this[$internal].materialize(),
			mipLevel: options?.mipLevel ?? 0,
			origin: origin3d(options?.origin)
		}, [
			options?.size?.[0] ?? sourceWidth - sourceOrigin.x,
			options?.size?.[1] ?? sourceHeight - sourceOrigin.y,
			options?.size?.[2] ?? sourceDepth - sourceOrigin.z
		]);
		this[$soul].device.queue.submit([commandEncoder.finish()]);
	}
	toString() {
		return `${this.resourceType}:${getName(this) ?? "<unnamed>"}`;
	}
	get destroyed() {
		return this.#destroyed;
	}
	destroy() {
		if (this.#destroyed) return;
		this.#destroyed = true;
		if (this.#ownTexture) this[$soul].raw?.destroy();
		this[$internal].root[$internal].instrumentation?.resourceDestroyed(this);
	}
};
var TgpuFixedTextureViewImpl = class {
	[$internal];
	[$soul];
	resourceType = "texture-view";
	constructor(schema, baseTexture, descriptor) {
		this[$soul] = {
			type: "texture-view",
			texture: baseTexture,
			schema,
			descriptor,
			raw: void 0,
			label: void 0
		};
		this[$internal] = {
			unwrap: () => {
				const soul = this[$soul];
				if (!soul.raw) {
					const schema = soul.schema;
					const format = isWgslStorageTexture(schema) ? schema.format : soul.texture.props.format;
					soul.raw = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(soul.texture[$internal].materialize().createView({
						...soul.descriptor,
						label: getName(this) ?? "<unnamed>",
						format: soul.descriptor?.format ?? format,
						dimension: schema.dimension
					}), "raw");
				}
				return soul.raw;
			},
			format: descriptor?.format ?? (isWgslStorageTexture(schema) ? schema.format : baseTexture.props.format),
			aspect: descriptor?.aspect
		};
	}
	get schema() {
		return this[$soul].schema;
	}
	$name(label) {
		setName(this, label);
		if (this[$soul].raw) this[$soul].raw.label = label;
		return this;
	}
	get [$gpuValueOf]() {
		const schema = this.schema;
		return new Proxy({
			[$internal]: true,
			get [$ownSnippet]() {
				return snip(this, schema, "handle", false);
			},
			[$comptimeValueOf]: runtimeOnly,
			[$resolve]: (ctx) => ctx.resolve(this),
			toString: () => `${this.toString()}.$`
		}, valueProxyHandler);
	}
	get $() {
		if (inCodegenMode()) return this[$gpuValueOf];
		throw new Error("Direct access to texture view values is possible only as part of a compute dispatch or draw call. Try .read() or .write() instead");
	}
	get size() {
		return this[$soul].texture.props.size;
	}
	toString() {
		return `textureView:${getName(this) ?? "<unnamed>"}`;
	}
	[$resolve](ctx) {
		const id = ctx.makeUniqueIdentifier(getName(this), "global");
		const { group, binding } = ctx.allocateFixedEntry(isWgslStorageTexture(this.schema) ? { storageTexture: this.schema } : {
			texture: this.schema,
			sampleType: this[$soul].descriptor?.sampleType ?? this.schema.bindingSampleType[0]
		}, this);
		return ctx.gen.declareGlobalVar({
			group,
			binding,
			id,
			dataType: this.schema,
			scope: "handle",
			init: void 0
		});
	}
};
var TgpuLaidOutTextureViewImpl = class {
	[$internal] = { unwrap: void 0 };
	resourceType = "texture-view";
	#membership;
	schema;
	constructor(schema, membership) {
		this.schema = schema;
		this.#membership = membership;
		setName(this, membership.key);
	}
	toString() {
		return `textureView:${getName(this) ?? "<unnamed>"}`;
	}
	[$resolve](ctx) {
		const id = ctx.makeUniqueIdentifier(getName(this), "global");
		const group = ctx.allocateLayoutEntry(this.#membership.layout);
		ctx.addDeclaration(`@group(${group}) @binding(${this.#membership.idx}) var ${id}: ${ctx.resolve(this.schema).value};`, id);
		return snip(id, this.schema, "handle");
	}
	get [$gpuValueOf]() {
		const schema = this.schema;
		return new Proxy({
			[$internal]: true,
			get [$ownSnippet]() {
				return snip(this, schema, "handle", false);
			},
			[$comptimeValueOf]: runtimeOnly,
			[$resolve]: (ctx) => ctx.resolve(this),
			toString: () => `${this.toString()}.$`
		}, valueProxyHandler);
	}
	get $() {
		if (inCodegenMode()) return this[$gpuValueOf];
		throw new Error(`Accessed view '${getName(this) ?? "<unnamed>"}' outside of codegen mode. Direct access to texture views values is possible only as part of a compute dispatch or draw call. Try .read() or .write() instead`);
	}
	$name(label) {
		setName(this, label);
		return this;
	}
};
var TgpuTextureRenderViewImpl = class {
	[$internal];
	[$soul];
	resourceType = "texture-view";
	constructor(baseTexture, descriptor = {}) {
		this[$soul] = {
			type: "texture-view",
			texture: baseTexture,
			schema: "render",
			descriptor,
			raw: void 0,
			label: void 0
		};
		this[$internal] = {
			unwrap: () => {
				const soul = this[$soul];
				if (!soul.raw) soul.raw = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(soul.texture[$internal].materialize().createView({
					label: getName(this) ?? "<unnamed>",
					...soul.descriptor
				}), "raw");
				return soul.raw;
			},
			format: descriptor.format ?? baseTexture.props.format,
			aspect: descriptor.aspect
		};
	}
	get descriptor() {
		return this[$soul].descriptor ?? {};
	}
};
//#endregion
//#region src/core/texture/usageExtension.ts
function isUsableAsSampled(value) {
	return !!value?.usableAsSampled;
}
/**
* @category Errors
*/
var NotSampledError = class NotSampledError extends Error {
	constructor(value) {
		super(`Resource '${getName(value) ?? "<unnamed>"}' cannot be bound as 'sampled'. Use .$usage('sampled') to allow it.`);
		Object.setPrototypeOf(this, NotSampledError.prototype);
	}
};
//#endregion
//#region src/core/buffer/laidOutBuffer.ts
/**
* A class representing a buffer accessed via a BindGroupLayout.
* Compared to a regular buffer, it's missing read/write methods,
* but it holds a membership.
*/
var TgpuLaidOutBufferImpl = class TgpuLaidOutBufferImpl {
	[$internal];
	usage;
	dataType;
	#membership;
	static {
		TgpuLaidOutBufferImpl.prototype.resourceType = "laid-out-buffer";
		makeDereferenceable(makeResolvable(TgpuLaidOutBufferImpl.prototype, {
			asString() {
				return `${this.usage}:${getName(this) ?? "<unnamed>"}`;
			},
			resolve(ctx) {
				const id = ctx.makeUniqueIdentifier(getName(this), "global");
				const group = ctx.allocateLayoutEntry(this.#membership.layout);
				return ctx.gen.declareGlobalVar({
					group,
					binding: this.#membership.idx,
					scope: this.usage,
					id,
					dataType: this.dataType,
					init: void 0
				});
			}
		}), {
			codegenMode: { getBaseSnippet(trackingProxy) {
				return snip(trackingProxy, this.dataType, this.usage, false);
			} },
			normalMode: { get() {
				throw new Error("Direct access to buffer values is possible only as part of a compute dispatch or draw call. Try .read() or .write() instead");
			} }
		});
	}
	constructor(usage, dataType, membership) {
		this[$internal] = { dataType };
		this.usage = usage;
		this.dataType = dataType;
		this.#membership = membership;
		setName(this, membership.key);
	}
};
//#endregion
//#region src/tgpuBindGroupLayout.ts
function bindGroupLayout(entries) {
	return new TgpuBindGroupLayoutImpl({ ...entries });
}
function isBindGroupLayout(value) {
	return !!value && value.resourceType === "bind-group-layout";
}
function isBindGroup(value) {
	return !!value && value.resourceType === "bind-group";
}
/**
* @category Errors
*/
var MissingBindingError = class MissingBindingError extends Error {
	constructor(groupLabel, key) {
		super(`Bind group '${groupLabel ?? "<unnamed>"}' is missing a required binding '${key}'`);
		Object.setPrototypeOf(this, MissingBindingError.prototype);
	}
};
var DEFAULT_MUTABLE_VISIBILITY = ["compute", "fragment"];
var DEFAULT_READONLY_VISIBILITY = [
	"compute",
	"vertex",
	"fragment"
];
var TgpuBindGroupLayoutImpl = class {
	[$internal];
	[$soul];
	resourceType = "bind-group-layout";
	$ = {};
	entries;
	get [$gpuValueOf]() {
		return this.$;
	}
	constructor(entries) {
		this.entries = entries;
		this[$internal] = [];
		const normalizedEntries = {};
		this[$soul] = {
			type: "bind-group-layout",
			entries: normalizedEntries,
			index: void 0,
			label: void 0
		};
		let idx = 0;
		for (const [key, entry] of Object.entries(entries)) {
			if (entry === null) {
				normalizedEntries[key] = null;
				idx++;
				continue;
			}
			const membership = {
				layout: this,
				key,
				idx
			};
			let item = void 0;
			normalizedEntries[key] = entry;
			if ("uniform" in entry) item = new TgpuLaidOutBufferImpl("uniform", entry.uniform, membership);
			if ("storage" in entry) {
				const dataType = "type" in entry.storage ? entry.storage : entry.storage(0);
				item = new TgpuLaidOutBufferImpl(entry.access ?? "readonly", dataType, membership);
				normalizedEntries[key] = {
					...entry,
					storage: dataType
				};
			}
			if ("texture" in entry) item = new TgpuLaidOutTextureViewImpl(entry.texture, membership);
			if ("storageTexture" in entry) item = new TgpuLaidOutTextureViewImpl(entry.storageTexture, membership);
			if ("externalTexture" in entry) item = new TgpuExternalTextureImpl(entry.externalTexture, membership);
			if ("sampler" in entry) item = new TgpuLaidOutSamplerImpl(entry.sampler === "comparison" ? comparisonSampler() : sampler(), membership);
			invariant(item !== void 0, "Internal error, expected item to be defined");
			Object.defineProperty(this.$, key, { get: () => {
				return item.$;
			} });
			this[$internal].push(item);
			idx++;
		}
	}
	toString() {
		return `bindGroupLayout:${getName(this) ?? "<unnamed>"}`;
	}
	get index() {
		return this[$soul].index;
	}
	$name(label) {
		setName(this, label);
		return this;
	}
	$idx(index) {
		this[$soul].index = index;
		return this;
	}
	unwrap(unwrapper) {
		return unwrapper.device.createBindGroupLayout({
			label: getName(this) ?? "<unnamed>",
			entries: Object.values(this.entries).map((entry, idx) => {
				if (entry === null) return null;
				let visibility = entry.visibility;
				const binding = {
					binding: idx,
					visibility: 0
				};
				if ("uniform" in entry) {
					visibility = visibility ?? DEFAULT_READONLY_VISIBILITY;
					binding.buffer = { type: "uniform" };
				} else if ("storage" in entry) {
					visibility = visibility ?? (entry.access === "mutable" ? DEFAULT_MUTABLE_VISIBILITY : DEFAULT_READONLY_VISIBILITY);
					binding.buffer = { type: entry.access === "mutable" ? "storage" : "read-only-storage" };
				} else if ("sampler" in entry) {
					visibility = visibility ?? DEFAULT_READONLY_VISIBILITY;
					binding.sampler = { type: entry.sampler };
				} else if ("texture" in entry) {
					visibility = visibility ?? DEFAULT_READONLY_VISIBILITY;
					const { multisampled, dimension, bindingSampleType } = entry.texture;
					binding.texture = {
						sampleType: entry.sampleType ?? bindingSampleType[0],
						viewDimension: dimension,
						multisampled
					};
				} else if ("storageTexture" in entry) {
					visibility = visibility ?? DEFAULT_MUTABLE_VISIBILITY;
					const { dimension, access, format } = entry.storageTexture;
					binding.storageTexture = {
						access,
						format,
						viewDimension: dimension
					};
				} else if ("externalTexture" in entry) {
					visibility = visibility ?? DEFAULT_READONLY_VISIBILITY;
					binding.externalTexture = {};
				}
				if (visibility?.includes("compute")) binding.visibility |= GPUShaderStage.COMPUTE;
				if (visibility?.includes("vertex")) binding.visibility |= GPUShaderStage.VERTEX;
				if (visibility?.includes("fragment")) binding.visibility |= GPUShaderStage.FRAGMENT;
				return binding;
			}).filter((v) => v !== null)
		});
	}
};
var TgpuBindGroupImpl = class {
	[$internal];
	[$soul];
	resourceType = "bind-group";
	#entries;
	constructor(root, layout, entries, raw) {
		this.#entries = entries;
		this[$soul] = {
			type: "bind-group",
			device: root?.device,
			layout,
			raw,
			label: void 0
		};
		this[$internal] = { materialize: () => {
			const soul = this[$soul];
			if (!soul.raw) {
				invariant(root, "Cannot unwrap a bind group created outside of a root.");
				soul.raw = root.unwrap(this);
			}
			return soul.raw;
		} };
		if (!raw) {
			for (const key of Object.keys(layout.entries)) if (layout.entries[key] !== null && !(key in entries)) throw new MissingBindingError(getName(layout), key);
		}
	}
	get layout() {
		return this[$soul].layout;
	}
	get entries() {
		return this.#entries;
	}
	unwrap(unwrapper) {
		const raw = this[$soul].raw;
		if (raw) return raw;
		return unwrapper.device.createBindGroup({
			label: getName(this.layout) ?? "<unnamed>",
			layout: unwrapper.unwrap(this.layout),
			entries: Object.entries(this.layout.entries).map(([key, entry], idx) => {
				if (entry === null) return null;
				const value = this.entries[key];
				if (value === void 0) throw new Error(`'${key}' is a resource required to populate bind group layout '${getName(this.layout) ?? "<unnamed>"}'.`);
				if ("uniform" in entry) {
					let resource;
					if (isBuffer(value)) {
						if (!isUsableAsUniform(value)) throw new NotUniformError(value);
						resource = { buffer: unwrapper.unwrap(value) };
					} else if (isUniformBinding(value)) resource = { buffer: unwrapper.unwrap(value) };
					else resource = { buffer: value };
					return {
						binding: idx,
						resource
					};
				}
				if ("storage" in entry) {
					let resource;
					if (isBuffer(value)) {
						if (!isUsableAsStorage(value)) throw new NotStorageError(value);
						resource = { buffer: unwrapper.unwrap(value) };
					} else if (isMutableBinding(value) || isReadonlyBinding(value)) {
						invariant(entry.access === "mutable" === (value.resourceType === "mutable"), "Invalid buffer access mode.");
						resource = { buffer: unwrapper.unwrap(value) };
					} else resource = { buffer: value };
					return {
						binding: idx,
						resource
					};
				}
				if ("texture" in entry) {
					let resource;
					if (isTexture(value)) {
						if (!isUsableAsSampled(value)) throw new NotSampledError(value);
						resource = unwrapper.unwrap(value.createView(entry.texture));
					} else if (isTextureView(value)) resource = unwrapper.unwrap(value);
					else resource = value;
					return {
						binding: idx,
						resource
					};
				}
				if ("storageTexture" in entry) {
					let resource;
					if (isTexture(value)) {
						if (!isUsableAsStorage(value)) throw new NotStorageError(value);
						resource = unwrapper.unwrap(value.createView(entry.storageTexture));
					} else if (isTextureView(value)) resource = unwrapper.unwrap(value);
					else resource = value;
					return {
						binding: idx,
						resource
					};
				}
				if ("sampler" in entry) {
					if (isComparisonSampler(value) || isSampler(value)) return {
						binding: idx,
						resource: unwrapper.unwrap(value)
					};
					return {
						binding: idx,
						resource: value
					};
				}
				if ("externalTexture" in entry) return {
					binding: idx,
					resource: value
				};
				throw new Error(`Malformed bind group entry: ${safeStringify(value)}`);
			}).filter((v) => v !== null)
		});
	}
};
//#endregion
//#region src/core/slot/slot.ts
function slot(defaultValue) {
	return new TgpuSlotImpl(defaultValue);
}
var TgpuSlotImpl = class {
	[$internal] = true;
	[$soul];
	resourceType = "slot";
	constructor(defaultValue = void 0) {
		this[$soul] = {
			type: "slot",
			defaultValue,
			label: void 0
		};
	}
	get defaultValue() {
		return this[$soul].defaultValue;
	}
	$name(label) {
		setName(this, label);
		return this;
	}
	areEqual(a, b) {
		return Object.is(a, b);
	}
	toString() {
		return `slot:${getName(this) ?? "<unnamed>"}`;
	}
	get [$gpuValueOf]() {
		const ctx = getResolutionCtx();
		if (!ctx) throw new Error(`Cannot access tgpu.slot's value outside of resolution.`);
		return getGpuValueRecursively(ctx.unwrap(this));
	}
	get $() {
		return this[$gpuValueOf];
	}
};
//#endregion
//#region src/core/slot/internalSlots.ts
var shaderStageSlot = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(slot(null), "shaderStageSlot");
//#endregion
//#region src/data/atomic.ts
/**
* Marks a concrete integer scalar type schema (u32 or i32) as a WGSL atomic.
*
* @example
* const atomicU32 = d.atomic(d.u32);
* const atomicI32 = d.atomic(d.i32);
*
* @param data Underlying type schema.
*/
function atomic(data) {
	return new AtomicImpl(data);
}
var AtomicImpl = class {
	[$internal] = {};
	type = "atomic";
	inner;
	constructor(inner) {
		this.inner = inner;
	}
};
//#endregion
//#region src/core/variable/tgpuVariable.ts
/**
* Defines a variable scoped to each entry function (private).
*
* @param dataType The schema of the held data's type
* @param initialValue If not provided, the variable will be initialized to the dataType's "zero-value".
*/
function privateVar(dataType, initialValue) {
	return new TgpuVarImpl("private", dataType, initialValue);
}
var TgpuVarImpl = class TgpuVarImpl {
	[$soul];
	static {
		const prototype = TgpuVarImpl.prototype;
		prototype.resourceType = "var";
		prototype[$internal] = {};
		makeDereferenceable(makeResolvable(prototype, {
			asString() {
				return `var:${getName(this) ?? "<unnamed>"}`;
			},
			resolve(ctx) {
				const id = ctx.makeUniqueIdentifier(getName(this), "global");
				const init = this[$soul].initialValue ? snip(this[$soul].initialValue, this[$soul].dataType, "constant") : void 0;
				return ctx.gen.declareGlobalVar({
					scope: this[$soul].scope,
					id,
					dataType: this[$soul].dataType,
					init
				});
			}
		}), {
			codegenMode: { getBaseSnippet(trackingProxy) {
				return snip(trackingProxy, this[$soul].dataType, this[$soul].scope, false);
			} },
			simulateMode: {
				get(state) {
					if (!state.vars[this[$soul].scope].has(this)) state.vars[this[$soul].scope].set(this, this[$soul].initialValue);
					return state.vars[this[$soul].scope].get(this);
				},
				set(state, value) {
					state.vars[this[$soul].scope].set(this, value);
				}
			},
			normalMode: {
				get() {
					throw new IllegalVarAccessError(isInsideTgpuFn() ? `Cannot access variable '${getName(this) ?? "<unnamed>"}'. TypeGPU functions that depends on GPU resources need to be part of a compute dispatch, draw call or simulation` : "TypeGPU variables are inaccessible during normal JS execution. If you wanted to simulate GPU behavior, try `tgpu.simulate()`");
				},
				set(_value) {
					throw new IllegalVarAccessError(isInsideTgpuFn() ? `Cannot access variable ${getName(this) ?? "<unnamed>"}. TypeGPU functions that depends on GPU resources need to be part of a compute dispatch, draw call or simulation` : "TypeGPU variables are inaccessible during normal JS execution. If you wanted to simulate GPU behavior, try `tgpu.simulate()`");
				}
			}
		});
	}
	constructor(scope, dataType, initialValue) {
		this[$soul] = {
			type: "var",
			scope,
			dataType,
			initialValue,
			label: void 0
		};
	}
	$name(label) {
		setName(this, label);
		return this;
	}
};
//#endregion
//#region src/tgsl/consoleLog/serializers.ts
var dataBlockIndex = privateVar(u32, 0).$name("dataBlockIndex");
var dataByteIndex = privateVar(u32, 0).$name("dataByteIndex");
var dataBufferSlot = slot().$name("dataBuffer");
var nextByteIndex = fn([], u32)`() {
  let i = dataByteIndex;
  dataByteIndex = dataByteIndex + 1u;
  return i;
}`.$uses({ dataByteIndex }).$name("nextByteIndex");
var nextU32 = "dataBuffer[dataBlockIndex].serializedData[nextByteIndex()]";
var serializerMap = {
	f32: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([f32])`(n) {
  ${nextU32} = bitcast<u32>(n);
}`, "f32"),
	f16: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([f16])`(n) {
  ${nextU32} = pack2x16float(vec2f(f32(n), 0.0));
}`, "f16"),
	i32: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([i32])`(n) {
  ${nextU32} = bitcast<u32>(n);
}`, "i32"),
	u32: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([u32])`(n) {
  ${nextU32} = n;
}`, "u32"),
	bool: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([bool])`(b) {
  ${nextU32} = u32(b);
}`, "bool"),
	vec2f: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([vec2f$1])`(v) {
  ${nextU32} = bitcast<u32>(v.x);
  ${nextU32} = bitcast<u32>(v.y);
}`, "vec2f"),
	vec3f: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([vec3f$1])`(v) {
  ${nextU32} = bitcast<u32>(v.x);
  ${nextU32} = bitcast<u32>(v.y);
  ${nextU32} = bitcast<u32>(v.z);
}`, "vec3f"),
	vec4f: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([vec4f$1])`(v) {
  ${nextU32} = bitcast<u32>(v.x);
  ${nextU32} = bitcast<u32>(v.y);
  ${nextU32} = bitcast<u32>(v.z);
  ${nextU32} = bitcast<u32>(v.w);
}`, "vec4f"),
	vec2h: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([vec2h$1])`(v) {
  ${nextU32} = pack2x16float(vec2f(f32(v.x), f32(v.y)));
}`, "vec2h"),
	vec3h: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([vec3h$1])`(v) {
  ${nextU32} = pack2x16float(vec2f(f32(v.x), f32(v.y)));
  ${nextU32} = pack2x16float(vec2f(f32(v.z), 0.0));
}`, "vec3h"),
	vec4h: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([vec4h$1])`(v) {
  ${nextU32} = pack2x16float(vec2f(f32(v.x), f32(v.y)));
  ${nextU32} = pack2x16float(vec2f(f32(v.z), f32(v.w)));
}`, "vec4h"),
	vec2i: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([vec2i$1])`(v) {
  ${nextU32} = bitcast<u32>(v.x);
  ${nextU32} = bitcast<u32>(v.y);
}`, "vec2i"),
	vec3i: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([vec3i$1])`(v) {
  ${nextU32} = bitcast<u32>(v.x);
  ${nextU32} = bitcast<u32>(v.y);
  ${nextU32} = bitcast<u32>(v.z);
}`, "vec3i"),
	vec4i: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([vec4i$1])`(v) {
  ${nextU32} = bitcast<u32>(v.x);
  ${nextU32} = bitcast<u32>(v.y);
  ${nextU32} = bitcast<u32>(v.z);
  ${nextU32} = bitcast<u32>(v.w);
}`, "vec4i"),
	vec2u: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([vec2u$1])`(v) {
  ${nextU32} = v.x;
  ${nextU32} = v.y;
}`, "vec2u"),
	vec3u: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([vec3u$1])`(v) {
  ${nextU32} = v.x;
  ${nextU32} = v.y;
  ${nextU32} = v.z;
}`, "vec3u"),
	vec4u: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([vec4u$1])`(v) {
  ${nextU32} = v.x;
  ${nextU32} = v.y;
  ${nextU32} = v.z;
  ${nextU32} = v.w;
}`, "vec4u"),
	"vec2<bool>": fn([vec2b$1])`(v) {
  ${nextU32} = u32(v.x);
  ${nextU32} = u32(v.y);
}`,
	"vec3<bool>": fn([vec3b$1])`(v) {
  ${nextU32} = u32(v.x);
  ${nextU32} = u32(v.y);
  ${nextU32} = u32(v.z);
}`,
	"vec4<bool>": fn([vec4b$1])`(v) {
  ${nextU32} = u32(v.x);
  ${nextU32} = u32(v.y);
  ${nextU32} = u32(v.z);
  ${nextU32} = u32(v.w);
}`,
	mat2x2f: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([mat2x2f$1])`(m) {
  ${nextU32} = bitcast<u32>(m[0][0]);
  ${nextU32} = bitcast<u32>(m[0][1]);
  ${nextU32} = bitcast<u32>(m[1][0]);
  ${nextU32} = bitcast<u32>(m[1][1]);
}`, "mat2x2f"),
	mat3x3f: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([mat3x3f$1])`(m) {
  ${nextU32} = bitcast<u32>(m[0][0]);
  ${nextU32} = bitcast<u32>(m[0][1]);
  ${nextU32} = bitcast<u32>(m[0][2]);
  ${nextU32} = 0u;
  ${nextU32} = bitcast<u32>(m[1][0]);
  ${nextU32} = bitcast<u32>(m[1][1]);
  ${nextU32} = bitcast<u32>(m[1][2]);
  ${nextU32} = 0u;
  ${nextU32} = bitcast<u32>(m[2][0]);
  ${nextU32} = bitcast<u32>(m[2][1]);
  ${nextU32} = bitcast<u32>(m[2][2]);
  ${nextU32} = 0u;
}`, "mat3x3f"),
	mat4x4f: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn([mat4x4f$1])`(m) {
  ${nextU32} = bitcast<u32>(m[0][0]);
  ${nextU32} = bitcast<u32>(m[0][1]);
  ${nextU32} = bitcast<u32>(m[0][2]);
  ${nextU32} = bitcast<u32>(m[0][3]);
  ${nextU32} = bitcast<u32>(m[1][0]);
  ${nextU32} = bitcast<u32>(m[1][1]);
  ${nextU32} = bitcast<u32>(m[1][2]);
  ${nextU32} = bitcast<u32>(m[1][3]);
  ${nextU32} = bitcast<u32>(m[2][0]);
  ${nextU32} = bitcast<u32>(m[2][1]);
  ${nextU32} = bitcast<u32>(m[2][2]);
  ${nextU32} = bitcast<u32>(m[2][3]);
  ${nextU32} = bitcast<u32>(m[3][0]);
  ${nextU32} = bitcast<u32>(m[3][1]);
  ${nextU32} = bitcast<u32>(m[3][2]);
  ${nextU32} = bitcast<u32>(m[3][3]);
}`, "mat4x4f")
};
for (const [name, serializer] of Object.entries(serializerMap)) serializer.$name(`serialize${name[0].toLocaleUpperCase()}${name.slice(1)}`).$uses({
	dataBlockIndex,
	nextByteIndex,
	dataBuffer: dataBufferSlot
});
function generateHeader(argTypes) {
	return `(${argTypes.map((_, i) => `_arg_${i}`).join(", ")})`;
}
/**
* Returns a serializer TGPU function for a given WGSL data type.
* If the data type is a base type, one of the preexisting functions (with the `dataBufferSlot` filled) is returned.
* Otherwise, a new function is generated.
*
* @param dataType - The WGSL data type descriptor to return a serializer for
* @param dataBuffer - A buffer to store serialized log call data (a necessary external for the returned function)
*/
function getSerializer(dataType, dataBuffer) {
	const maybeSerializer = serializerMap[dataType.type];
	if (maybeSerializer) return maybeSerializer.with(dataBufferSlot, dataBuffer);
	if (isWgslStruct(dataType)) {
		const props = Object.keys(dataType.propTypes);
		const propsSerializer = createCompoundSerializer(Object.values(dataType.propTypes), dataBuffer);
		return fn([dataType])`(arg) {\n  propsSerializer(${props.map((prop) => `arg.${prop}`).join(", ")});\n}`.$uses({ propsSerializer }).$name(`${getName(dataType) ?? "struct"}Serializer`);
	}
	if (isWgslArray(dataType)) {
		const elementType = dataType.elementType;
		const length = dataType.elementCount;
		const elementSerializer = getSerializer(elementType, dataBuffer);
		return fn([dataType])`(arg) {\n${Array.from({ length }, (_, i) => `  elementSerializer(arg[${i}]);`).join("\n")}\n}`.$uses({ elementSerializer }).$name("arraySerializer");
	}
	throw new Error(`Cannot serialize data of type ${dataType.type}`);
}
/**
* Creates a compound serializer TGPU function that serializes multiple arguments of different types to the data buffer.
*
* @param dataTypes - Array of WGSL data types that define the types of arguments to be serialized
* @param dataBuffer - A buffer to store serialized log call data (a necessary external for the returned function)
*/
function createCompoundSerializer(dataTypes, dataBuffer) {
	const usedSerializers = {};
	return (/* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fn(dataTypes), "shell"))`${generateHeader(dataTypes)} {\n${dataTypes.map((arg, i) => {
		usedSerializers[`serializer${i}`] = getSerializer(arg, dataBuffer);
		return `  serializer${i}(_arg_${i});`;
	}).join("\n")}\n}`.$uses(usedSerializers).$name("compoundSerializer");
}
/**
* Creates a TGPU function that serializes data to the log buffer.
*
* @param id - Identifier for this logging function instance
* @param dataTypes - Array of WGSL data types that will be logged by this function
* @param dataBuffer - Mutable buffer array to store serialized log call data
* @param indexBuffer - Atomic counter buffer to track the next available log data slot
* @param logOptions - Configuration options
*/
function createLoggingFunction(id, dataTypes, dataBuffer, indexBuffer, logOptions) {
	const serializedSize = dataTypes.map(sizeOf).reduce((a, b) => a + b, 0);
	if (serializedSize > logOptions.logSizeLimit) throw new Error(`Logged data needs to fit in ${logOptions.logSizeLimit} bytes (one of the logs requires ${serializedSize} bytes). Consider increasing the limit by passing appropriate options to tgpu.init().`);
	const compoundSerializer = createCompoundSerializer(dataTypes, dataBuffer).$name(`log${id}serializer`);
	const header = generateHeader(dataTypes);
	return fn(dataTypes)`${header} {
  dataBlockIndex = atomicAdd(&indexBuffer, 1);
  if (dataBlockIndex >= ${logOptions.logCountLimit}) {
    return;
  }
  dataBuffer[dataBlockIndex].id = ${id};
  dataByteIndex = 0;

  compoundSerializer${header};
}`.$uses({
		indexBuffer,
		dataBuffer,
		dataBlockIndex,
		dataByteIndex,
		compoundSerializer
	}).$name(`log${id}`);
}
//#endregion
//#region src/tgsl/consoleLog/logGenerator.ts
var defaultOptions = {
	logCountLimit: 64,
	logSizeLimit: 252,
	messagePrefix: " GPU "
};
var fallbackSnippet = snip("/* console.log() */", Void, "runtime");
var LogGeneratorNullImpl = class {
	get logResources() {}
	generateLog() {
		logger.warn("fallback", "'console.log' is only supported when resolving pipelines.");
		return fallbackSnippet;
	}
};
var LogGeneratorImpl = class {
	#options;
	#logIdToMeta;
	#firstUnusedId = 1;
	#indexBuffer;
	#dataBuffer;
	constructor(root) {
		this.#options = {
			...defaultOptions,
			...root[$internal].logOptions
		};
		this.#logIdToMeta = /* @__PURE__ */ new Map();
		const SerializedLogData = (/* @__PURE__ */ struct({
			id: u32,
			serializedData: arrayOf(u32, Math.ceil(this.#options.logSizeLimit / 4))
		})).$name("SerializedLogData");
		this.#dataBuffer = root.createMutable(arrayOf(SerializedLogData, this.#options.logCountLimit)).$name("dataBuffer");
		this.#indexBuffer = root.createMutable(atomic(u32)).$name("indexBuffer");
	}
	/**
	* Generates all necessary resources for serializing arguments for logging purposes.
	*
	* @param ctx Resolution context.
	* @param args Argument snippets. Snippets of UnknownType will be treated as string literals.
	* @returns A snippet containing the call to the logging function.
	*/
	generateLog(ctx, op, args) {
		if (shaderStageSlot.$ === "vertex") {
			logger.warn("suspicious", `'console' operations are not supported in vertex shaders.`);
			return fallbackSnippet;
		}
		const id = this.#firstUnusedId++;
		const concreteArgsWithStrings = args.map((arg) => {
			if (arg.dataType === UnknownData) return arg;
			const converted = convertToCommonType(ctx, [arg], [unptr(arg.dataType)])?.[0];
			invariant(converted, `Internal error. Expected type ${arg.dataType} to be convertible to ${unptr(arg.dataType)}`);
			return converted;
		}).map(concretizeSnippet);
		const concreteArgs = concreteArgsWithStrings.filter((arg) => arg.dataType !== UnknownData);
		const logFn = createLoggingFunction(id, concreteArgs.map((e) => e.dataType), this.#dataBuffer, this.#indexBuffer, this.#options);
		const functionSnippet = snip(stitch`${ctx.resolve(logFn).value}(${concreteArgs})`, Void, "runtime");
		this.#logIdToMeta.set(id, {
			op,
			argTypes: concreteArgsWithStrings.map((e) => e?.dataType === UnknownData ? e?.value : e?.dataType)
		});
		return functionSnippet;
	}
	get logResources() {
		return this.#firstUnusedId === 1 ? void 0 : {
			dataBuffer: this.#dataBuffer,
			indexBuffer: this.#indexBuffer,
			options: this.#options,
			logIdToMeta: this.#logIdToMeta
		};
	}
};
//#endregion
//#region src/core/function/shelllessImpl.ts
function isShelllessImpl(value) {
	return value?.resourceType === "shellless-impl";
}
function createShelllessImpl(argTypes, implementation) {
	const core = createFnCore(implementation, "normal");
	return {
		[$internal]: true,
		[$getNameForward]: core,
		resourceType: "shellless-impl",
		argTypes,
		[$resolve](ctx) {
			return core.resolve(ctx, argTypes, void 0);
		},
		toString() {
			return `fn*:${getName(core) ?? "<unnamed>"}(${argTypes.map((t) => t.toString()).join(", ")})`;
		}
	};
}
//#endregion
//#region src/minify.ts
/**
* We don't separate every WGSL token, for example `main()` already has no spaces, no need to further split it.
*/
var splitRegex = new RegExp(`[${[...blankSpaces].join("")}]+`, "ug");
/**
* Regex for detecting boundary characters that indicate whitespace may be needed between tokens.
* @example
* "let", "variable" // "t" and "v" both match, a space is needed
* "return" "a" // "n" and "a" both match, a space is needed
* "return" "(a+b)" // "n" matches and "(" does not, no space is needed
*/
var separatorNeededRegex = /[.\p{XID_Continue}]/u;
/**
* This function accepts a code string, and returns equivalent code
* with comments and unnecessary whitespace removed.
*/
function minify(code) {
	const tokens = stripWGSLComments(code).split(splitRegex).filter((token) => token !== "");
	let result = "";
	for (let i = 0; i < tokens.length; i++) {
		const current = tokens[i];
		const next = tokens[i + 1];
		invariant(current);
		result += current;
		if (isSpaceRequired(current, next)) result += " ";
	}
	return result;
}
function isSpaceRequired(current, next) {
	if (next === void 0) return false;
	const currentLast = current.at(-1);
	const nextFirst = next.at(0);
	invariant(currentLast?.length === 1 && nextFirst?.length === 1, `Expected tokens during minification to not be empty.`);
	if (separatorNeededRegex.test(currentLast) && separatorNeededRegex.test(nextFirst)) return true;
	if ([
		"//",
		"/*",
		"*/"
	].includes(`${currentLast}${nextFirst}`)) return true;
	return false;
}
function stripWGSLComments(code) {
	let result = "";
	let copiedUpTo = 0;
	let offset = 0;
	while (offset < code.length) {
		if (code.startsWith("//", offset)) {
			result += `${code.slice(copiedUpTo, offset)} `;
			offset += 2;
			while (offset < code.length && !lineBreaks.has(code.charAt(offset))) offset += 1;
			copiedUpTo = offset;
			continue;
		}
		if (code.startsWith("/*", offset)) {
			result += `${code.slice(copiedUpTo, offset)} `;
			let depth = 1;
			offset += 2;
			while (offset < code.length && depth > 0) if (code.startsWith("/*", offset)) {
				depth += 1;
				offset += 2;
			} else if (code.startsWith("*/", offset)) {
				depth -= 1;
				offset += 2;
			} else offset += 1;
			if (depth > 0) throw new SyntaxError(`Block comment opening without corresponding closing found during minification.`);
			copiedUpTo = offset;
			continue;
		}
		if (code.startsWith("*/", offset)) throw new SyntaxError(`Block comment closing without corresponding opening found during minification.`);
		offset += 1;
	}
	return result + code.slice(copiedUpTo);
}
//#endregion
//#region src/resolutionCtx.ts
/**
* Inserted into bind group entry definitions that belong
* to the automatically generated catch-all bind group.
*
* A non-occupied group index can only be determined after
* every resource has been resolved, so this acts as a placeholder
* to be replaced with an actual numeric index at the very end
* of the resolution process.
*/
var CATCHALL_BIND_GROUP_IDX_MARKER = "#CATCHALL#";
var ItemStateStackImpl = class {
	_stack = [];
	_itemDepth = 0;
	get itemDepth() {
		return this._itemDepth;
	}
	get topItem() {
		const state = this._stack[this._stack.length - 1];
		if (!state || state.type !== "item") throw new Error("Internal error, expected item layer to be on top.");
		return state;
	}
	get topFunctionScope() {
		return this._stack.findLast((e) => e.type === "functionScope");
	}
	get topBlockScope() {
		return this._stack.findLast((e) => e.type === "blockScope");
	}
	get blockDepth() {
		let depth = 0;
		for (let i = this._stack.length - 1; i >= 0; --i) {
			const layer = this._stack[i];
			if (layer?.type === "functionScope") break;
			if (layer?.type === "blockScope") depth++;
		}
		return depth;
	}
	pushItem() {
		this._itemDepth++;
		this._stack.push({
			type: "item",
			usedSlots: /* @__PURE__ */ new Set()
		});
	}
	pushSlotBindings(pairs) {
		this._stack.push({
			type: "slotBinding",
			bindingMap: new WeakMap(pairs)
		});
	}
	pushFunctionScope(functionType, argAccess, returnType, externalMap) {
		const scope = {
			type: "functionScope",
			functionType,
			argAccess,
			returnType,
			externalMap,
			reportedReturnTypes: /* @__PURE__ */ new Set(),
			placeholderForVariable: /* @__PURE__ */ new Map(),
			modifiedVariables: /* @__PURE__ */ new Set()
		};
		this._stack.push(scope);
		return scope;
	}
	pushBlockScope() {
		this._stack.push({
			type: "blockScope",
			takenLocalIdentifiers: /* @__PURE__ */ new Set(),
			declarations: /* @__PURE__ */ new Map(),
			externals: /* @__PURE__ */ new Map()
		});
	}
	pop(type) {
		const layer = this._stack[this._stack.length - 1];
		if (!layer || type && layer.type !== type) throw new Error(`Internal error, expected a ${type} layer to be on top.`);
		const poppedValue = this._stack.pop();
		if (type === "item") this._itemDepth--;
		return poppedValue;
	}
	readSlot(slot) {
		for (let i = this._stack.length - 1; i >= 0; --i) {
			const layer = this._stack[i];
			if (layer?.type === "item") layer.usedSlots.add(slot);
			else if (layer?.type === "slotBinding") {
				const boundValue = layer.bindingMap.get(slot);
				if (boundValue !== void 0) return boundValue;
			} else if (layer?.type === "functionScope" || layer?.type === "blockScope") {} else throw new Error("Unknown layer type.");
		}
		return slot.defaultValue;
	}
	getSnippetById(id) {
		for (let i = this._stack.length - 1; i >= 0; --i) {
			const layer = this._stack[i];
			if (layer?.type === "functionScope") {
				const access = layer.argAccess[id];
				if (access) return access();
				if (Object.hasOwn(layer.externalMap, id)) {
					const external = layer.externalMap[id];
					if (isNamable(external) && getName(external) === void 0) setName(external, id.replaceAll(".", "_"));
					return coerceToSnippet(external);
				}
				return;
			}
			if (layer?.type === "blockScope") {
				const snippet = layer.declarations.get(id) ?? layer.externals.get(id);
				if (snippet !== void 0) return snippet;
			}
		}
	}
	/**
	* Returns whether the given identifier is taken in any block scope up to the nearest function scope.
	*/
	isIdentifierTakenLocally(id) {
		for (let i = this._stack.length - 1; i >= 0; --i) {
			const layer = this._stack[i];
			if (layer?.type === "functionScope") return false;
			if (layer?.type === "blockScope") {
				if (layer.takenLocalIdentifiers.has(id)) return true;
			}
		}
		return false;
	}
	/**
	* Returns whether the given identifier is taken in any block scope on the stack.
	*
	* This is useful when resolving a global identifier for the first time within a nested function.
	*/
	isIdentifierTakenInCallStack(id) {
		for (let i = this._stack.length - 1; i >= 0; --i) {
			const layer = this._stack[i];
			if (layer?.type === "blockScope") {
				if (layer.takenLocalIdentifiers.has(id)) return true;
			}
		}
		return false;
	}
	defineBlockVariable(id, snippet) {
		if (snippet.dataType === UnknownData) throw Error(`Tried to define variable '${id}' of unknown type`);
		for (let i = this._stack.length - 1; i >= 0; --i) {
			const layer = this._stack[i];
			if (layer?.type === "blockScope") {
				layer.declarations.set(id, snippet);
				return;
			}
		}
		throw new Error("No block scope found to define a variable in.");
	}
	setBlockExternals(externals) {
		for (let i = this._stack.length - 1; i >= 0; --i) {
			const layer = this._stack[i];
			if (layer?.type === "blockScope") {
				Object.entries(externals).forEach(([id, snippet]) => {
					layer.externals.set(id, snippet);
				});
				return;
			}
		}
		throw new Error("No block scope found to set externals in.");
	}
	clearBlockExternals() {
		for (let i = this._stack.length - 1; i >= 0; --i) {
			const layer = this._stack[i];
			if (layer?.type === "blockScope") {
				layer.externals.clear();
				return;
			}
		}
		throw new Error("No block scope found to clear externals in.");
	}
};
var INDENT = [
	"",
	"  ",
	"    ",
	"      ",
	"        ",
	"          ",
	"            ",
	"              ",
	"                "
];
var N = INDENT.length - 1;
var IndentController = class {
	identLevel = 0;
	get pre() {
		return INDENT[this.identLevel] ?? INDENT[N].repeat(this.identLevel / N) + INDENT[this.identLevel % N];
	}
	indent() {
		const str = this.pre;
		this.identLevel++;
		return str;
	}
	dedent() {
		this.identLevel--;
		return this.pre;
	}
	withResetLevel(callback) {
		const savedLevel = this.identLevel;
		this.identLevel = 0;
		try {
			return callback();
		} finally {
			this.identLevel = savedLevel;
		}
	}
};
function createArgument(name, type, origin = "argument") {
	let used = false;
	return {
		name,
		access: () => {
			used = true;
			return snip(name, type, origin, false);
		},
		decoratedType: type,
		get used() {
			return used;
		}
	};
}
function createArgumentPropAccess(argAccess, prop) {
	return () => {
		const argSnippet = argAccess();
		if (!argSnippet) return;
		return accessProp(argSnippet, prop);
	};
}
var ResolutionCtxImpl = class {
	#namespaceInternal;
	_indentController = new IndentController();
	_itemStateStack = new ItemStateStackImpl();
	#modeStack = [];
	_declarations = [];
	_varyingLocations;
	/**
	* Holds a set of base (slot-less) functions that have started their resolution process.
	* Used for recursion detection check - a function is recursive if:
	* - it was passed to ctx.resolve while already present in this set,
	* - it never finished resolution (<=> it does not appear in `memoizedResolves`).
	* The set is NOT cleared after the resolution finishes.
	*/
	#startedFunctionResolves = /* @__PURE__ */ new WeakSet();
	#logGenerator;
	gen;
	get varyingLocations() {
		return this._varyingLocations;
	}
	[$internal] = { itemStateStack: this._itemStateStack };
	/**
	* A map from registered bind group layouts to random strings put in
	* place of their group index. The whole tree has to be traversed to
	* collect every use of a typed bind group layout, since they can be
	* explicitly imposed group indices, and they cannot collide.
	*/
	bindGroupLayoutsToPlaceholderMap = /* @__PURE__ */ new Map();
	_nextFreeLayoutPlaceholderIdx = 0;
	fixedBindings = [];
	enableExtensions;
	expectedType;
	#usedImmediate;
	/**
	* A counter used to generate unique identifiers for globally-scoped definitions in the 'random' strategy.
	*/
	#lastUniqueId = 0;
	constructor(opts) {
		this.enableExtensions = opts.enableExtensions;
		this.#logGenerator = opts.root ? new LogGeneratorImpl(opts.root) : new LogGeneratorNullImpl();
		this.#namespaceInternal = opts.namespace[$internal];
		this.gen = opts.shaderGenerator ?? new WgslGenerator();
		this.gen.initGenerator(this);
	}
	registerImmediate(immediate) {
		if (this.#usedImmediate !== void 0 && this.#usedImmediate !== immediate) throw new Error(`Cannot use both immediate variables '${getName(this.#usedImmediate) ?? "<unnamed>"}' and '${getName(immediate) ?? "<unnamed>"}' in a single shader. At most one immediate variable is allowed per resolution.`);
		this.#usedImmediate = immediate;
	}
	get usedImmediate() {
		return this.#usedImmediate;
	}
	isIdentifierBanned(name) {
		return bannedTokens.has(name);
	}
	isIdentifierTaken(name, scope) {
		return this.#namespaceInternal.takenGlobalIdentifiers.has(name) || (scope === "block" ? this._itemStateStack.isIdentifierTakenLocally(name) : this._itemStateStack.isIdentifierTakenInCallStack(name));
	}
	makeUniqueIdentifier(primer = "item", scope) {
		if (scope === "block" && (/* @__PURE__ */ validateIdentifier(primer)).success && !this.isIdentifierTaken(primer, scope)) {
			this.reserveIdentifier(primer, "block");
			return primer;
		}
		const base = /* @__PURE__ */ sanitizePrimer(primer);
		let index = 0;
		const random = this.#namespaceInternal.strategy === "random";
		let name = random ? `${base}_${this.#lastUniqueId++}` : base;
		while (this.isIdentifierTaken(name, scope)) name = random ? `${base}_${this.#lastUniqueId++}` : `${base}_${++index}`;
		this.reserveIdentifier(name, scope);
		return name;
	}
	reserveIdentifier(name, scope) {
		if (scope === "block") {
			const blockScope = this._itemStateStack.topBlockScope;
			if (blockScope) {
				blockScope.takenLocalIdentifiers.add(name);
				return;
			}
		}
		this.#namespaceInternal.takenGlobalIdentifiers.add(name);
	}
	get pre() {
		return this._indentController.pre;
	}
	get topFunctionScope() {
		return this._itemStateStack.topFunctionScope;
	}
	get topFunctionReturnType() {
		const scope = this._itemStateStack.topFunctionScope;
		invariant(scope, "Internal error, expected function scope to be present.");
		return scope.returnType;
	}
	get shelllessRepo() {
		return this.#namespaceInternal.shelllessRepo;
	}
	get blockDepth() {
		return this._itemStateStack.blockDepth;
	}
	indent() {
		return this._indentController.indent();
	}
	dedent() {
		return this._indentController.dedent();
	}
	getDedented(code) {
		return code.replaceAll(`\n${INDENT[1]}`, "\n").replaceAll(new RegExp(`^${INDENT[1]}`, "g"), "");
	}
	withResetIndentLevel(callback) {
		return this._indentController.withResetLevel(callback);
	}
	getById(id) {
		const item = this._itemStateStack.getSnippetById(id);
		if (item === void 0) return null;
		return item;
	}
	defineVariable(id, snippet) {
		this._itemStateStack.defineBlockVariable(id, snippet);
	}
	reportReturnType(dataType) {
		const scope = this._itemStateStack.topFunctionScope;
		invariant(scope, "Internal error, expected function scope to be present.");
		scope.reportedReturnTypes.add(dataType);
	}
	pushBlockScope() {
		this._itemStateStack.pushBlockScope();
	}
	popBlockScope() {
		this._itemStateStack.pop("blockScope");
	}
	setBlockExternals(externals) {
		this._itemStateStack.setBlockExternals(externals);
	}
	clearBlockExternals() {
		this._itemStateStack.clearBlockExternals();
	}
	generateLog(op, args) {
		return this.#logGenerator.generateLog(this, op, args);
	}
	get logResources() {
		return this.#logGenerator.logResources;
	}
	resolveFunction(options) {
		try {
			const scope = this._itemStateStack.pushFunctionScope(options.functionType, {}, options.returnType, options.externalMap);
			this._itemStateStack.pushBlockScope();
			const args = [];
			if (options.entryInput) {
				const { dataSchema, positionalArgs } = options.entryInput;
				const firstParam = options.params[0];
				const structArg = dataSchema ? createArgument(this.makeUniqueIdentifier("_arg_0", "block"), dataSchema) : void 0;
				if (structArg) args.push(structArg);
				if (firstParam?.type === FuncParameterType.destructuredObject) for (const { name, alias } of firstParam.props) {
					const argInfo = positionalArgs.find((a) => a.schemaKey === name);
					if (argInfo) {
						const arg = createArgument(this.makeUniqueIdentifier(alias, "block"), argInfo.type);
						args.push(arg);
						scope.argAccess[alias] = arg.access;
					} else if (structArg) scope.argAccess[alias] = createArgumentPropAccess(structArg.access, name);
				}
				else if (firstParam?.type === FuncParameterType.identifier) {
					const proxyEntries = [];
					for (const a of positionalArgs) {
						const arg = createArgument(this.makeUniqueIdentifier(a.schemaKey, "block"), a.type);
						args.push(arg);
						proxyEntries.push({
							schemaKey: a.schemaKey,
							arg: arg.access
						});
					}
					const router = new EntryInputRouter(structArg?.access, proxyEntries);
					scope.argAccess[firstParam.name] = () => snip("N/A", router, "argument");
				} else for (const a of positionalArgs) {
					const argName = this.makeUniqueIdentifier(`_arg_${a.schemaKey}`, "block");
					const arg = createArgument(argName, a.type);
					args.push(arg);
					scope.argAccess[argName] = arg.access;
				}
			} else for (const [i, argType] of options.argTypes.entries()) {
				const astParam = options.params[i];
				const origin = isPtr(argType) ? argType.addressSpace === "storage" ? argType.access === "read" ? "readonly" : "mutable" : argType.addressSpace : "argument";
				switch (astParam?.type) {
					case FuncParameterType.identifier: {
						const arg = createArgument(this.makeUniqueIdentifier(astParam.name, "block"), argType, origin);
						args.push(arg);
						scope.argAccess[astParam.name] = arg.access;
						break;
					}
					case FuncParameterType.destructuredObject: {
						const objArg = createArgument(this.makeUniqueIdentifier(`_arg_${i}`, "block"), argType, origin);
						args.push(objArg);
						for (const { name, alias } of astParam.props) scope.argAccess[alias] = createArgumentPropAccess(objArg.access, name);
						break;
					}
					case void 0: if (!(argType instanceof AutoStruct)) args.push({
						name: this.makeUniqueIdentifier(`_arg_${i}`, "block"),
						access: () => {
							throw new Error(`Unreachable: Accessing an argument that wasn't named in the function signature`);
						},
						decoratedType: argType,
						used: false
					});
				}
			}
			let returnType;
			const code = this.gen.functionDefinition({
				functionType: options.functionType,
				name: options.name,
				workgroupSize: options.workgroupSize,
				args,
				body: options.body,
				determineReturnType: () => {
					if (returnType) return returnType;
					returnType = options.returnType;
					if (returnType instanceof AutoStruct) if (isWgslStruct(scope.reportedReturnTypes.values().next().value)) returnType = returnType.completeStruct;
					else returnType = void 0;
					if (!returnType) {
						const returnTypes = [...scope.reportedReturnTypes];
						if (returnTypes.length === 0) returnType = Void;
						else {
							const conversion = getBestConversion(returnTypes);
							if (conversion && !conversion.hasImplicitConversions) returnType = conversion.targetType;
						}
						if (!returnType) throw new Error(`Expected function to have a single return type, got [${returnTypes.join(", ")}]. Cast explicitly to the desired type.`);
						returnType = concretize(returnType);
						if (options.functionType === "vertex" || options.functionType === "fragment") returnType = createIoSchema(returnType);
					}
					return returnType;
				}
			});
			if (!returnType) throw new Error(`Failed to determine return type`);
			return {
				code,
				returnType
			};
		} finally {
			this._itemStateStack.pop("blockScope");
			this._itemStateStack.pop("functionScope");
		}
	}
	addDeclaration(declaration, name) {
		this._declarations.push({
			name,
			code: declaration
		});
	}
	get declarations() {
		return this._declarations;
	}
	allocateLayoutEntry(layout) {
		const memoMap = this.bindGroupLayoutsToPlaceholderMap;
		let placeholderKey = memoMap.get(layout);
		if (!placeholderKey) {
			placeholderKey = `#BIND_GROUP_LAYOUT_${this._nextFreeLayoutPlaceholderIdx++}#`;
			memoMap.set(layout, placeholderKey);
		}
		return placeholderKey;
	}
	allocateFixedEntry(layoutEntry, resource) {
		const binding = this.fixedBindings.length;
		this.fixedBindings.push({
			layoutEntry,
			resource
		});
		return {
			group: CATCHALL_BIND_GROUP_IDX_MARKER,
			binding
		};
	}
	readSlot(slot) {
		const value = this._itemStateStack.readSlot(slot);
		if (value === void 0) throw new MissingSlotValueError(slot);
		return value;
	}
	withSlots(pairs, callback) {
		if (pairs.length === 0) return callback();
		this._itemStateStack.pushSlotBindings(pairs);
		try {
			return callback();
		} finally {
			this._itemStateStack.pop("slotBinding");
		}
	}
	withVaryingLocations(locations, callback) {
		this._varyingLocations = locations;
		try {
			return callback();
		} finally {
			this._varyingLocations = void 0;
		}
	}
	withRenamed(item, name, callback) {
		if (!name) return callback();
		const oldName = getName(item);
		try {
			setName(item, name);
			return callback();
		} finally {
			if (oldName) setName(item, oldName);
		}
	}
	unwrap(eventual) {
		if (isProviding(eventual)) return this.withRenamed(eventual[$providing].inner, getName(eventual), () => this.withSlots(eventual[$providing].pairs, () => this.unwrap(eventual[$providing].inner)));
		let maybeEventual = eventual;
		while (true) if (isSlot(maybeEventual)) maybeEventual = this.readSlot(maybeEventual);
		else if (isLazy(maybeEventual)) maybeEventual = this._getOrCompute(maybeEventual);
		else break;
		return maybeEventual;
	}
	_getOrCompute(lazy) {
		const instances = this.#namespaceInternal.memoizedLazy.get(lazy) ?? [];
		this._itemStateStack.pushItem();
		try {
			for (const instance of instances) if ([...instance.slotToValueMap.entries()].every(([slot, expectedValue]) => slot.areEqual(this._itemStateStack.readSlot(slot), expectedValue))) return instance.result;
			this.pushMode(new NormalState());
			let result;
			try {
				result = lazy[$internal].compute();
			} finally {
				this.popMode("normal");
			}
			const slotToValueMap = /* @__PURE__ */ new Map();
			for (const usedSlot of this._itemStateStack.topItem.usedSlots) slotToValueMap.set(usedSlot, this._itemStateStack.readSlot(usedSlot));
			instances.push({
				slotToValueMap,
				result
			});
			this.#namespaceInternal.memoizedLazy.set(lazy, instances);
			return result;
		} catch (err) {
			if (err instanceof ResolutionError) throw err.appendToTrace(lazy);
			throw new ResolutionError(err, [lazy]);
		} finally {
			this._itemStateStack.pop("item");
		}
	}
	/**
	* @param item The item whose resolution should be either retrieved from the cache (if there is a cache hit), or resolved.
	*/
	_getOrInstantiate(item) {
		const instances = this.#namespaceInternal.memoizedResolves.get(item) ?? [];
		this._itemStateStack.pushItem();
		try {
			for (const instance of instances) if ([...instance.slotToValueMap.entries()].every(([slot, expectedValue]) => slot.areEqual(this._itemStateStack.readSlot(slot), expectedValue))) return instance.result;
			let result;
			if (isData(item)) result = snip(this.gen.emitTypeAnnotation(item), Void, "runtime");
			else if (isLazy(item) || isSlot(item)) result = this.resolve(this.unwrap(item));
			else if (isSelfResolvable(item)) result = item[$resolve](this);
			else if (hasTinyestMetadata(item)) {
				const shellless = this.#namespaceInternal.shelllessRepo.get(item, void 0);
				if (!shellless) throw new Error(`Couldn't resolve ${item.name}. Make sure it's a function that accepts no arguments, or call it from another TypeGPU function.`);
				return this.withResetIndentLevel(() => this.resolve(shellless));
			} else throw new TypeError(`Unresolvable internal value: ${safeStringify(item)}`);
			const slotToValueMap = /* @__PURE__ */ new Map();
			for (const usedSlot of this._itemStateStack.topItem.usedSlots) slotToValueMap.set(usedSlot, this._itemStateStack.readSlot(usedSlot));
			instances.push({
				slotToValueMap,
				result
			});
			this.#namespaceInternal.memoizedResolves.set(item, instances);
			return result;
		} catch (err) {
			if (err instanceof ResolutionError) throw err.appendToTrace(item);
			throw new ResolutionError(err, [item]);
		} finally {
			this._itemStateStack.pop("item");
		}
	}
	resolve(item, schema) {
		if (typeof item === "string") {
			if (!schema || schema === UnknownData) throw new Error(`Strings cannot be injected into WGSL directly (tried to inject '${item}'). Look for TypeGPU APIs that cover your use-case, or resort to using tgpu['~unstable'].rawCodeSnippet for raw code injection.`);
			return snip(item, schema, "runtime");
		}
		if ((isTgpuFn(item) || isShelllessImpl(item)) && !isProviding(item)) {
			if (this.#startedFunctionResolves.has(item) && !this.#namespaceInternal.memoizedResolves.has(item)) throw new Error(`Recursive function ${item} detected. Recursion is not allowed on the GPU.`);
			this.#startedFunctionResolves.add(item);
		}
		if (isProviding(item)) return this.withRenamed(item[$providing].inner, getName(item), () => this.withSlots(item[$providing].pairs, () => this.resolve(item[$providing].inner, schema)));
		if (isMarkedInternal(item) || hasTinyestMetadata(item)) {
			if (this._itemStateStack.itemDepth === 0) try {
				this.pushMode(new CodegenState());
				const result = provideCtx(this, () => this._getOrInstantiate(item));
				return snip(`${this._declarations.map((decl) => decl.code).join("\n\n")}${result.value}`, Void, "runtime");
			} finally {
				this.popMode("codegen");
			}
			return this._getOrInstantiate(item);
		}
		if (typeof item === "number") {
			const realSchema = schema ?? numericLiteralToSnippet(item).dataType;
			invariant(realSchema !== UnknownData, "Schema has to be known for resolving numbers");
			return this.gen.numericLiteral(item, realSchema);
		}
		if (typeof item === "boolean") return snip(item ? "true" : "false", bool, "constant", false);
		if (schema && isWgslArray(schema)) {
			if (!Array.isArray(item)) throw new WgslTypeError(`Cannot coerce ${item} into value of type '${schema}'`);
			if (schema.elementCount !== item.length) throw new WgslTypeError(`Cannot create value of type '${schema}' from an array of length: ${item.length}`);
			return this.gen.typeInstantiation(schema, item.map((element) => snip(element, schema.elementType, "runtime")));
		}
		if (schema && isWgslStruct(schema)) return this.gen.typeInstantiation(schema, Object.entries(schema.propTypes).map(([key, propType]) => snip(item[key], propType, "runtime")));
		if (item === null) throw new WgslTypeError(`'null' is not resolvable. 'null' is only allowed in comptime checks.`);
		throw new WgslTypeError(`Value ${safeStringify(item)} is not resolvable${schema && schema !== UnknownData ? ` to type ${safeStringify(schema)}` : ""}`);
	}
	resolveSnippet(snippet) {
		return withValue(this.resolve(snippet.value, snippet.dataType).value, snippet);
	}
	pushMode(mode) {
		this.#modeStack.push(mode);
	}
	popMode(expected) {
		const mode = this.#modeStack.pop();
		if (expected !== void 0) invariant(mode?.type === expected, "Unexpected mode");
	}
	get mode() {
		return this.#modeStack[this.#modeStack.length - 1] ?? topLevelState;
	}
};
function resolve(item, options) {
	const ctx = new ResolutionCtxImpl(options);
	let code = (options.config ? ctx.withSlots(options.config(new ConfigurableImpl([])).bindings, () => ctx.resolve(item)) : ctx.resolve(item)).value;
	const memoMap = ctx.bindGroupLayoutsToPlaceholderMap;
	const usedBindGroupLayouts = [];
	const automaticIds = naturalsExcept(new Set([...memoMap.keys()].map((layout) => layout.index).filter((v) => v !== void 0)));
	const layoutEntries = ctx.fixedBindings.map((binding, idx) => [String(idx), binding.layoutEntry]);
	const bindingReplacements = [];
	const createCatchallGroup = () => {
		const catchallIdx = automaticIds.next().value;
		const catchallLayout = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(bindGroupLayout(Object.fromEntries(layoutEntries)), "catchallLayout");
		usedBindGroupLayouts[catchallIdx] = catchallLayout;
		code = code.replaceAll(CATCHALL_BIND_GROUP_IDX_MARKER, String(catchallIdx));
		bindingReplacements.push([CATCHALL_BIND_GROUP_IDX_MARKER, String(catchallIdx)]);
		return [catchallIdx, new TgpuBindGroupImpl(options.root, catchallLayout, Object.fromEntries(ctx.fixedBindings.map((binding, idx) => [String(idx), binding.resource])))];
	};
	const catchall = layoutEntries.length > 0 ? createCatchallGroup() : void 0;
	for (const [layout, placeholder] of memoMap.entries()) {
		const idx = layout.index ?? automaticIds.next().value;
		usedBindGroupLayouts[idx] = layout;
		code = code.replaceAll(placeholder, String(idx));
		bindingReplacements.push([placeholder, String(idx)]);
	}
	if (options.enableExtensions && options.enableExtensions.length > 0) code = `${options.enableExtensions.map((ext) => `enable ${ext};`).join("\n")}\n\n${code}`;
	let declarations = ctx.declarations.map(({ name, code: declarationCode }) => ({
		name,
		code: bindingReplacements.reduce((acc, [placeholder, idx]) => acc.replaceAll(placeholder, idx), declarationCode)
	}));
	if (options.minify) {
		code = minify(code);
		declarations = declarations.map((entry) => ({
			...entry,
			code: minify(entry.code)
		}));
	}
	return {
		code,
		declarations,
		usedBindGroupLayouts,
		catchall,
		logResources: ctx.logResources,
		usedImmediate: ctx.usedImmediate
	};
}
//#endregion
//#region src/core/pipeline/pipelineUtils.ts
function collectBindGroupPairs(layouts, catchall, map) {
	return layouts.flatMap((layout, idx) => {
		const resource = catchall && idx === catchall[0] ? catchall[1] : map?.get(layout);
		return resource ? [[layout, resource]] : [];
	});
}
function collectVertexBufferPairs(layouts, map) {
	return layouts.flatMap((layout) => {
		const resource = map?.get(layout);
		return resource ? [[layout, resource]] : [];
	});
}
var IndirectOperationToRequiredData = {
	dispatchWorkgroupsIndirect: "3 x u32",
	drawIndirect: "4 x u32",
	drawIndexedIndirect: "3 x u32, i32, u32"
};
function validateIndirectBufferSize(bufferSize, offset, requiredBytes, operation) {
	if (offset + requiredBytes > bufferSize) throw new Error(`Buffer too small for ${operation}. Required: ${requiredBytes} bytes at offset ${offset}, but buffer is only ${bufferSize} bytes.`);
	if (offset % 4 !== 0) throw new Error(`Indirect buffer offset must be a multiple of 4. Got: ${offset}`);
}
function resolveIndirectOffset(indirectBuffer, start, requiredSize, operation) {
	if (isGPUBuffer(indirectBuffer)) {
		const offset = typeof start === "number" ? start : start?.offset ?? 0;
		validateIndirectBufferSize(indirectBuffer.size, offset, requiredSize, operation);
		return offset;
	}
	const { offset, contiguous } = start ? typeof start === "number" ? {
		offset: start,
		contiguous: requiredSize
	} : start : memoryLayoutOf(indirectBuffer.dataType);
	validateIndirectBufferSize(sizeOf(indirectBuffer.dataType), offset, requiredSize, operation);
	if (contiguous < requiredSize) logger.warn("suspicious", `${operation}: Starting at offset ${offset}, only ${contiguous} contiguous bytes are available before padding. '${operation}' requires ${requiredSize} bytes (${IndirectOperationToRequiredData[operation]}). Reading across padding may result in undefined behavior.`);
	return offset;
}
//#endregion
//#region src/std/bitcast.ts
var buffer = /* @__PURE__ */ new ArrayBuffer(16);
var bufViews = {
	f32: new Float32Array(buffer),
	u32: new Uint32Array(buffer),
	i32: new Int32Array(buffer),
	u16: new Uint16Array(buffer)
};
function writeToBuffer(item, target) {
	if (typeof item === "number") target[0] = item;
	else for (let i = 0; i < item.length; i++) target[i] = item[i];
}
function writeFloat16ToBuffer(item, target) {
	if (typeof item === "number") target[0] = toHalfBits(item);
	else for (let i = 0; i < item.length; i++) target[i] = toHalfBits(item[i]);
}
function readFromBuffer(buf, schema) {
	const length = "componentCount" in schema ? schema.componentCount : 1;
	const items = [];
	for (let i = 0; i < length; i++) items.push(buf[i]);
	return schema(...items);
}
function readFloat16FromBuffer(buf, schema) {
	const length = "componentCount" in schema ? schema.componentCount : 1;
	const items = [];
	for (let i = 0; i < length; i++) items.push(fromHalfBits(buf[i]));
	return schema(...items);
}
var getCpuBitcast = (inType, outType) => {
	const writeToPrimitive = "primitive" in inType ? inType.primitive : inType;
	const readFromPrimitive = "primitive" in outType ? outType.primitive : outType;
	return (value) => {
		if (writeToPrimitive.type === "f16") writeFloat16ToBuffer(value, bufViews["u16"]);
		else writeToBuffer(value, bufViews[writeToPrimitive.type]);
		if (readFromPrimitive.type === "f16") return readFloat16FromBuffer(bufViews["u16"], outType);
		return readFromBuffer(bufViews[readFromPrimitive.type], outType);
	};
};
function bitcastFor(inType, outType) {
	return /* @__PURE__ */ dualImpl({
		name: "bitcast",
		normalImpl: getCpuBitcast(inType, outType),
		codegenImpl: (ctx, [n]) => ctx.gen.emitCall("bitcast", [coerceToSnippet(outType)], [n]),
		signature: (arg) => {
			const uarg = unifyStrict([arg], [inType]);
			if (!uarg) throw new SignatureNotSupportedError([arg], [inType]);
			return {
				argTypes: uarg,
				returnType: outType
			};
		},
		sideEffects: false
	});
}
var casts = {
	f16: { f16: bitcastFor(f16, f16) },
	f32: {
		f32: bitcastFor(f32, f32),
		i32: bitcastFor(f32, i32),
		u32: bitcastFor(f32, u32),
		vec2h: bitcastFor(f32, vec2h$1)
	},
	i32: {
		f32: bitcastFor(i32, f32),
		i32: bitcastFor(i32, i32),
		u32: bitcastFor(i32, u32),
		vec2h: bitcastFor(i32, vec2h$1)
	},
	u32: {
		f32: bitcastFor(u32, f32),
		i32: bitcastFor(u32, i32),
		u32: bitcastFor(u32, u32),
		vec2h: bitcastFor(u32, vec2h$1)
	},
	vec2h: {
		f32: bitcastFor(vec2h$1, f32),
		i32: bitcastFor(vec2h$1, i32),
		u32: bitcastFor(vec2h$1, u32),
		vec2h: bitcastFor(vec2h$1, vec2h$1)
	},
	vec3h: { vec3h: bitcastFor(vec3h$1, vec3h$1) },
	vec2f: {
		vec2f: bitcastFor(vec2f$1, vec2f$1),
		vec2i: bitcastFor(vec2f$1, vec2i$1),
		vec2u: bitcastFor(vec2f$1, vec2u$1),
		vec4h: bitcastFor(vec2f$1, vec4h$1)
	},
	vec2i: {
		vec2f: bitcastFor(vec2i$1, vec2f$1),
		vec2i: bitcastFor(vec2i$1, vec2i$1),
		vec2u: bitcastFor(vec2i$1, vec2u$1),
		vec4h: bitcastFor(vec2i$1, vec4h$1)
	},
	vec2u: {
		vec2f: bitcastFor(vec2u$1, vec2f$1),
		vec2i: bitcastFor(vec2u$1, vec2i$1),
		vec2u: bitcastFor(vec2u$1, vec2u$1),
		vec4h: bitcastFor(vec2u$1, vec4h$1)
	},
	vec4h: {
		vec2f: bitcastFor(vec4h$1, vec2f$1),
		vec2i: bitcastFor(vec4h$1, vec2i$1),
		vec2u: bitcastFor(vec4h$1, vec2u$1),
		vec4h: bitcastFor(vec4h$1, vec4h$1)
	},
	vec3f: {
		vec3f: bitcastFor(vec3f$1, vec3f$1),
		vec3i: bitcastFor(vec3f$1, vec3i$1),
		vec3u: bitcastFor(vec3f$1, vec3u$1)
	},
	vec3i: {
		vec3f: bitcastFor(vec3i$1, vec3f$1),
		vec3i: bitcastFor(vec3i$1, vec3i$1),
		vec3u: bitcastFor(vec3i$1, vec3u$1)
	},
	vec3u: {
		vec3f: bitcastFor(vec3u$1, vec3f$1),
		vec3i: bitcastFor(vec3u$1, vec3i$1),
		vec3u: bitcastFor(vec3u$1, vec3u$1)
	},
	vec4f: {
		vec4f: bitcastFor(vec4f$1, vec4f$1),
		vec4i: bitcastFor(vec4f$1, vec4i$1),
		vec4u: bitcastFor(vec4f$1, vec4u$1)
	},
	vec4i: {
		vec4f: bitcastFor(vec4i$1, vec4f$1),
		vec4i: bitcastFor(vec4i$1, vec4i$1),
		vec4u: bitcastFor(vec4i$1, vec4u$1)
	},
	vec4u: {
		vec4f: bitcastFor(vec4u$1, vec4f$1),
		vec4i: bitcastFor(vec4u$1, vec4i$1),
		vec4u: bitcastFor(vec4u$1, vec4u$1)
	}
};
function getBitcast(from, to) {
	if ("type" in from && from.type in casts) {
		const intermediate = casts[from.type];
		if ("type" in to && to.type in intermediate) return intermediate[to.type];
	}
	throw new Error(`Incorrect bitcast from ${getName(from)} to ${getName(to)}.`);
}
var bitcast = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(comptime(getBitcast), "bitcast");
//#endregion
//#region src/std/packing.ts
var littleEndian = { endianness: "little" };
var packedBuffer = /* @__PURE__ */ new ArrayBuffer(4);
var packedWriter = new BufferWriter(packedBuffer, littleEndian);
var packedReader = new BufferReader(packedBuffer, littleEndian);
function readPacked(value) {
	packedWriter.seekTo(0);
	packedWriter.writeUint32(value);
	packedReader.seekTo(0);
	return packedReader;
}
/**
* @privateRemarks
* https://gpuweb.github.io/gpuweb/wgsl/#unpack2x16float-builtin
*/
var unpack2x16float = /* @__PURE__ */ dualImpl({
	name: "unpack2x16float",
	normalImpl: (e) => {
		const reader = readPacked(e);
		return vec2f$1(readFloat16(reader), readFloat16(reader));
	},
	signature: {
		argTypes: [u32],
		returnType: vec2f$1
	},
	codegenImpl: (_ctx, [e]) => stitch`unpack2x16float(${e})`,
	sideEffects: false
});
//#endregion
//#region src/tgsl/consoleLog/deserializers.ts
var toF = (n) => bitcast(u32, f32)(n ?? 0);
var toI = (n) => bitcast(u32, i32)(n ?? 0);
var unpack = (n) => unpack2x16float(n ?? 0);
var deserializerMap = {
	f32: (d) => toF(d[0]),
	f16: (d) => unpack(d[0]).x,
	i32: (d) => toI(d[0]),
	u32: (d) => d[0] ?? 0,
	bool: (d) => !!d[0],
	vec2f: (d) => vec2f$1(toF(d[0]), toF(d[1])),
	vec3f: (d) => vec3f$1(toF(d[0]), toF(d[1]), toF(d[2])),
	vec4f: (d) => vec4f$1(toF(d[0]), toF(d[1]), toF(d[2]), toF(d[3])),
	vec2h(d) {
		const xyVec = unpack(d[0]);
		return vec2h$1(xyVec.x, xyVec.y);
	},
	vec3h(d) {
		const xyVec = unpack(d[0]);
		const zVec = unpack(d[1]);
		return vec3h$1(xyVec.x, xyVec.y, zVec.x);
	},
	vec4h(d) {
		const xyVec = unpack(d[0]);
		const zwVec = unpack(d[1]);
		return vec4h$1(xyVec.x, xyVec.y, zwVec.x, zwVec.y);
	},
	vec2i: (d) => vec2i$1(toI(d[0]), toI(d[1])),
	vec3i: (d) => vec3i$1(toI(d[0]), toI(d[1]), toI(d[2])),
	vec4i: (d) => vec4i$1(toI(d[0]), toI(d[1]), toI(d[2]), toI(d[3])),
	vec2u: (d) => vec2u$1(d[0] ?? 0, d[1] ?? 0),
	vec3u: (d) => vec3u$1(d[0] ?? 0, d[1] ?? 0, d[2] ?? 0),
	vec4u: (d) => vec4u$1(d[0] ?? 0, d[1] ?? 0, d[2] ?? 0, d[3] ?? 0),
	"vec2<bool>": (d) => vec2b$1(!!d[0], !!d[1]),
	"vec3<bool>": (d) => vec3b$1(!!d[0], !!d[1], !!d[2]),
	"vec4<bool>": (d) => vec4b$1(!!d[0], !!d[1], !!d[2], !!d[3]),
	mat2x2f: (d) => mat2x2f$1(toF(d[0]), toF(d[1]), toF(d[2]), toF(d[3])),
	mat3x3f: (d) => mat3x3f$1(toF(d[0]), toF(d[1]), toF(d[2]), toF(d[4]), toF(d[5]), toF(d[6]), toF(d[8]), toF(d[9]), toF(d[10])),
	mat4x4f: (d) => mat4x4f$1(toF(d[0]), toF(d[1]), toF(d[2]), toF(d[3]), toF(d[4]), toF(d[5]), toF(d[6]), toF(d[7]), toF(d[8]), toF(d[9]), toF(d[10]), toF(d[11]), toF(d[12]), toF(d[13]), toF(d[14]), toF(d[15]))
};
/**
* Deserializes binary data from a Uint32Array into a JavaScript value based on the provided WGSL data type.
*
* @param data - The binary data as a Uint32Array to be deserialized
* @param dataType - The WGSL data type specification that determines how to interpret the binary data
*/
function deserialize(data, dataType) {
	const maybeDeserializer = deserializerMap[dataType.type];
	if (maybeDeserializer) return maybeDeserializer(data);
	if (isWgslStruct(dataType)) {
		const props = Object.keys(dataType.propTypes);
		const decodedProps = deserializeCompound(data, Object.values(dataType.propTypes));
		return Object.fromEntries(props.map((key, index) => [key, decodedProps[index]]));
	}
	if (isWgslArray(dataType)) {
		const elementType = dataType.elementType;
		const length = dataType.elementCount;
		return deserializeCompound(data, Array.from({ length }, () => elementType));
	}
	throw new Error(`Cannot deserialize data of type ${dataType.type}`);
}
/**
* Deserializes a list of elements from a Uint32Array buffer using provided type information.
* If there is a string value among the type information, it is returned as is.
*
* @param data - The Uint32Array buffer containing the serialized data
* @param dataTypes - The WGSL data type specification that determines how to interpret the binary data, or string literals
*/
function deserializeCompound(data, dataTypes) {
	let index = 0;
	return dataTypes.map((info) => {
		if (!isWgslData(info)) return info;
		const size = Math.ceil(sizeOf(info) / 4);
		const value = deserialize(data.subarray(index, index + size), info);
		index += size;
		return value;
	});
}
function deserializeAndStringify(serializedData, argTypes) {
	return deserializeCompound(serializedData, argTypes).map(niceStringify);
}
/**
* Reads and deserializes log data from GPU buffers, logging results to the console.
*
* @remarks
* - Log entries with IDs equal to 0 are filtered out.
* - Console messages are prepended with options.messagePrefix styled with purple background and white text.
* - A warning is displayed if the log count exceeds the limit passed in options.
* - After processing, the index buffer and the data buffer are cleared.
*/
function logDataFromGPU(resources) {
	const { indexBuffer, dataBuffer, logIdToMeta, options } = resources;
	dataBuffer.read().then((data) => {
		data.filter((e) => e.id).forEach(({ id, serializedData }) => {
			const { argTypes, op } = logIdToMeta.get(id);
			const results = deserializeAndStringify(new Uint32Array(serializedData), argTypes);
			if (results.length === 0) results.push("");
			op.bind(console)(`%c${options.messagePrefix}%c ${results[0]}`, "background: #936ff5; color: white;", "color: inherit; background: none", ...results.slice(1));
		});
	});
	indexBuffer.read().then((totalCalls) => {
		if (totalCalls > options.logCountLimit) logger.warn("log-limit-exceeded", `Log count limit per dispatch (${options.logCountLimit}) exceeded by ${totalCalls - options.logCountLimit} calls. Consider increasing the limit by passing appropriate options to tgpu.init().`);
	});
	dataBuffer.buffer.clear();
	indexBuffer.buffer.clear();
}
//#endregion
//#region src/core/querySet/querySet.ts
function INTERNAL_createQuerySet(group, type, count, rawQuerySet) {
	return new TgpuQuerySetImpl(group, type, count, rawQuerySet);
}
function isQuerySet(value) {
	const maybe = value;
	return maybe?.resourceType === "query-set" && !!maybe[$internal];
}
var TgpuQuerySetImpl = class {
	resourceType = "query-set";
	#ownQuerySet;
	#destroyed = false;
	#available = true;
	#readBuffer = void 0;
	#resolveBuffer = void 0;
	[$soul];
	[$internal];
	constructor(root, type, count, rawQuerySet) {
		this.#ownQuerySet = !rawQuerySet;
		this[$soul] = {
			type: "query-set",
			device: root.device,
			queryType: type,
			count,
			raw: rawQuerySet,
			label: void 0
		};
		const self = this;
		this[$internal] = {
			get readBuffer() {
				if (!self.#readBuffer) self.#readBuffer = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(self[$soul].device.createBuffer({
					size: self.count * BigUint64Array.BYTES_PER_ELEMENT,
					usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
				}), "readBuffer");
				return self.#readBuffer;
			},
			get resolveBuffer() {
				if (!self.#resolveBuffer) self.#resolveBuffer = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(self[$soul].device.createBuffer({
					size: self.count * BigUint64Array.BYTES_PER_ELEMENT,
					usage: GPUBufferUsage.QUERY_RESOLVE | GPUBufferUsage.COPY_SRC
				}), "resolveBuffer");
				return self.#resolveBuffer;
			},
			materialize: () => {
				if (this.#destroyed) throw new Error("This QuerySet has been destroyed.");
				const soul = this[$soul];
				if (!soul.raw) soul.raw = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(soul.device.createQuerySet({
					type: soul.queryType,
					count: soul.count
				}), "raw");
				return soul.raw;
			}
		};
	}
	get type() {
		return this[$soul].queryType;
	}
	get count() {
		return this[$soul].count;
	}
	get querySet() {
		return this[$internal].materialize();
	}
	get destroyed() {
		return this.#destroyed;
	}
	get available() {
		return this.#available;
	}
	$name(label) {
		setName(this, label);
		const raw = this[$soul].raw;
		if (raw) raw.label = label;
		return this;
	}
	resolve() {
		if (this.#destroyed) throw new Error("This QuerySet has been destroyed.");
		if (!this.#available) throw new Error("This QuerySet is busy resolving or reading.");
		const commandEncoder = this[$soul].device.createCommandEncoder();
		commandEncoder.resolveQuerySet(this.querySet, 0, this.count, this[$internal].resolveBuffer, 0);
		this[$soul].device.queue.submit([commandEncoder.finish()]);
	}
	async read() {
		if (!this.#resolveBuffer) throw new Error("QuerySet must be resolved before reading.");
		this.#available = false;
		try {
			const commandEncoder = this[$soul].device.createCommandEncoder();
			commandEncoder.copyBufferToBuffer(this[$internal].resolveBuffer, 0, this[$internal].readBuffer, 0, this.count * BigUint64Array.BYTES_PER_ELEMENT);
			this[$soul].device.queue.submit([commandEncoder.finish()]);
			const readBuffer = this[$internal].readBuffer;
			await readBuffer.mapAsync(GPUMapMode.READ);
			const data = new BigUint64Array(readBuffer.getMappedRange().slice());
			readBuffer.unmap();
			return Array.from(data);
		} finally {
			this.#available = true;
		}
	}
	destroy() {
		if (this.#destroyed) return;
		this.#destroyed = true;
		if (this[$soul].raw && this.#ownQuerySet) this[$soul].raw.destroy();
		this.#readBuffer?.destroy();
		this.#resolveBuffer?.destroy();
		this.#readBuffer = this.#resolveBuffer = void 0;
	}
};
//#endregion
//#region src/core/pipeline/timeable.ts
function createWithPerformanceCallback(currentPriors, callback, querySet) {
	if (!currentPriors.timestampWrites) return {
		...currentPriors,
		performanceCallback: callback,
		timestampWrites: {
			querySet,
			beginningOfPassWriteIndex: 0,
			endOfPassWriteIndex: 1
		}
	};
	return {
		...currentPriors,
		performanceCallback: callback
	};
}
function createWithTimestampWrites(currentPriors, options, root) {
	if (!root.enabledFeatures.has("timestamp-query")) throw new Error("Timestamp writes require the \"timestamp-query\" feature to be enabled on GPU device.");
	const timestampWrites = { querySet: options.querySet };
	if (options.beginningOfPassWriteIndex !== void 0) timestampWrites.beginningOfPassWriteIndex = options.beginningOfPassWriteIndex;
	if (options.endOfPassWriteIndex !== void 0) timestampWrites.endOfPassWriteIndex = options.endOfPassWriteIndex;
	return {
		...currentPriors,
		timestampWrites
	};
}
var pendingTimestampReads = /* @__PURE__ */ new WeakMap();
async function readTimestamps(querySet, registrations) {
	if (!querySet.available) return;
	let result;
	try {
		result = await querySet.read();
	} catch {
		return;
	}
	for (const { priors, callback } of registrations) {
		const start = result[priors.timestampWrites?.beginningOfPassWriteIndex ?? 0];
		const end = result[priors.timestampWrites?.endOfPassWriteIndex ?? 1];
		if (start === void 0 || end === void 0) throw new Error("QuerySet did not return valid timestamps.");
		try {
			await callback(start, end);
		} catch (err) {
			console.error("An error was thrown from a performance callback (withPerformanceCallback). Errors thrown here cannot be caught by the caller, so handle them within the callback itself.", err);
		}
	}
}
/** Returns false when the encoder is one we cannot defer work to, meaning the callback never fires */
function queueTimestampResolve(encoder, priors) {
	const querySet = priors.timestampWrites?.querySet;
	const callback = priors.performanceCallback;
	if (!querySet) throw new Error("Cannot dispatch workgroups with performance callback without a query set.");
	if (!isQuerySet(querySet)) throw new Error("Performance callback with raw GPUQuerySet is not supported. Use TgpuQuerySet instead.");
	const internals = encoder[$internal];
	if (internals.adopted) return false;
	const { root } = internals;
	internals.beforeFinish.set(querySet, (rawEncoder) => {
		rawEncoder.resolveQuerySet(root.unwrap(querySet), 0, querySet.count, querySet[$internal].resolveBuffer, 0);
	});
	let byQuerySet = pendingTimestampReads.get(encoder);
	if (!byQuerySet) {
		byQuerySet = /* @__PURE__ */ new Map();
		pendingTimestampReads.set(encoder, byQuerySet);
	}
	let registrations = byQuerySet.get(querySet);
	if (!registrations) {
		const regs = [];
		registrations = regs;
		byQuerySet.set(querySet, regs);
		internals.afterSubmit.set(querySet, () => {
			byQuerySet.delete(querySet);
			readTimestamps(querySet, regs);
		});
	}
	if (registrations.some((reg) => reg.priors === priors)) logger.warnOnce("suspicious", querySet, "repeated-timed-execution", "Repeated executions of a timed pipeline within one command encoder write to the same query set indices, so the performance callback reports only the last execution.");
	else registrations.push({
		priors,
		callback
	});
	return true;
}
//#endregion
//#region src/core/pipeline/drawState.ts
var RenderDrawState = class {
	bindGroups = /* @__PURE__ */ new Map();
	vertexBuffers = /* @__PURE__ */ new Map();
	immediates = new ImmediatePassState();
	currentPipeline;
	indexBuffer;
	stencilReference;
	/** What the raw pass holds, starting at the WebGPU default; survives executeBundles */
	appliedStencilReference = 0;
	version = 0;
	/** Raw access via `root.unwrap(pass)` can mutate state invisibly, disabling deduplication */
	rawAccessed = false;
};
var ComputeDrawState = class {
	bindGroups = /* @__PURE__ */ new Map();
	immediates = new ImmediatePassState();
	currentPipeline;
	version = 0;
	rawAccessed = false;
};
function recordBindGroup(state, first, bindGroup) {
	if (isBindGroup(first)) state.bindGroups.set(first.layout, first);
	else state.bindGroups.set(first, bindGroup);
	state.version++;
}
/** Makes the pipeline current; its held state is resolved at draw time, below what the pass holds */
function selectPipeline(state, pipeline) {
	if (state.currentPipeline !== pipeline) {
		state.currentPipeline = pipeline;
		state.version++;
	}
}
function applyIndexBuffer(encoder, root, entry) {
	const { buffer, indexFormat, offsetBytes, sizeBytes } = entry;
	if (isBuffer(buffer)) encoder.setIndexBuffer(root.unwrap(buffer), indexFormat, offsetBytes, sizeBytes);
	else encoder.setIndexBuffer(buffer, indexFormat, offsetBytes, sizeBytes);
}
function applyBindGroups(encoder, root, usedBindGroupLayouts, catchall, resolveBindGroup) {
	const missingBindGroups = new Set(usedBindGroupLayouts);
	usedBindGroupLayouts.forEach((layout, idx) => {
		if (catchall && idx === catchall[0]) {
			encoder.setBindGroup(idx, root.unwrap(catchall[1]));
			missingBindGroups.delete(layout);
		} else {
			const bindGroup = resolveBindGroup(layout);
			if (bindGroup !== void 0) {
				missingBindGroups.delete(layout);
				if (isBindGroup(bindGroup)) encoder.setBindGroup(idx, root.unwrap(bindGroup));
				else encoder.setBindGroup(idx, bindGroup);
			}
		}
	});
	if (missingBindGroups.size > 0) throw new MissingBindGroupsError(missingBindGroups);
}
function applyVertexBuffers(encoder, root, usedVertexLayouts, resolveVertexBuffer) {
	const missingVertexLayouts = /* @__PURE__ */ new Set();
	usedVertexLayouts.forEach((vertexLayout, idx) => {
		const entry = resolveVertexBuffer(vertexLayout);
		if (!entry || !entry.buffer) missingVertexLayouts.add(vertexLayout);
		else if (isBuffer(entry.buffer)) encoder.setVertexBuffer(idx, root.unwrap(entry.buffer), entry.offset, entry.size);
		else encoder.setVertexBuffer(idx, entry.buffer, entry.offset, entry.size);
	});
	if (missingVertexLayouts.size > 0) throw new MissingVertexBuffersError(missingVertexLayouts);
}
function applyRenderPipelineState(encoder, root, pipeline, passState) {
	const { core, priors } = pipeline[$internal];
	const memo = core.unwrap();
	encoder.setPipeline(memo.pipeline);
	applyBindGroups(encoder, root, memo.usedBindGroupLayouts, memo.catchall, (layout) => passState.bindGroups.get(layout) ?? priors.bindGroupLayoutMap?.get(layout));
	applyVertexBuffers(encoder, root, memo.usedVertexLayouts, (vertexLayout) => {
		const passEntry = passState.vertexBuffers.get(vertexLayout);
		if (passEntry !== void 0) return passEntry;
		const buffer = priors.vertexLayoutMap?.get(vertexLayout);
		return buffer !== void 0 ? { buffer } : void 0;
	});
	const indexBuffer = passState.indexBuffer ?? priors.indexBuffer;
	if (indexBuffer !== void 0) applyIndexBuffer(encoder, root, indexBuffer);
	if (typeof encoder.setStencilReference === "function") {
		const stencilReference = passState.stencilReference ?? priors.stencilReference ?? 0;
		if (passState.rawAccessed || stencilReference !== passState.appliedStencilReference) {
			encoder.setStencilReference(stencilReference);
			passState.appliedStencilReference = stencilReference;
		}
	}
}
function applyComputePipelineState(encoder, root, pipeline, passState) {
	const { core, priors } = pipeline[$internal];
	const memo = core.unwrap();
	encoder.setPipeline(memo.pipeline);
	applyBindGroups(encoder, root, memo.usedBindGroupLayouts, memo.catchall, (layout) => passState.bindGroups.get(layout) ?? priors.bindGroupLayoutMap?.get(layout));
}
function requireIndexBuffer(indexBuffer) {
	if (!indexBuffer) throw new Error("No index buffer is set. Call pipeline.withIndexBuffer or pass.setIndexBuffer before drawing indexed geometry.");
}
function warnAboutUnreachableSubmission(core, what) {
	logger.warnOnce("suspicious", core, what, `${what} is ignored when recording into a raw GPUCommandEncoder, since there is no submission to report after. Use root['~unstable'].createCommandEncoder() instead.`);
}
/** Returns false when there is no encoder to defer the read to, meaning the output is lost */
function queueLogDrain(encoder, logResources) {
	if (!encoder || encoder[$internal].adopted) return false;
	encoder[$internal].afterSubmit.set(logResources, () => logDataFromGPU(logResources));
	return true;
}
function finalizeOwnEncoder(encoder, core, logResources, priors) {
	if (logResources && !queueLogDrain(encoder, logResources)) warnAboutUnreachableSubmission(core, "Shader console.log output");
	if (priors.performanceCallback && !queueTimestampResolve(encoder, priors)) warnAboutUnreachableSubmission(core, "The performance callback");
	if (priors.encoder === void 0) encoder.submit();
}
var PassKindWording = {
	render: {
		into: "drawing into a render pass",
		intoRaw: "drawing into a raw render pass",
		begin: "beginRenderPass"
	},
	compute: {
		into: "dispatching into a compute pass",
		intoRaw: "dispatching into a raw compute pass",
		begin: "beginComputePass"
	}
};
function reportIgnoredPriors(core, owner, hasTimestampWrites, logResources, passKind, hasAttachments = false) {
	const wording = PassKindWording[passKind];
	if (hasAttachments) logger.warnOnce("suspicious", core, "attachments", `Pipeline-level attachments are ignored when ${wording.into}. Pass \`colorAttachments\` and \`depthStencilAttachment\` to encoder.${wording.begin} instead.`);
	if (hasTimestampWrites) logger.warnOnce("suspicious", core, "timestampWrites", `Pipeline-level timestamp writes are ignored when ${wording.into}. Pass \`timestampWrites\` to encoder.${wording.begin} instead.`);
	if (logResources && !queueLogDrain(owner, logResources)) logger.warnOnce("suspicious", core, "logs", `Shader console.log output is ignored when ${wording.intoRaw} encoder, since there is no submission to read it back after.`);
}
function emitRenderDraw(root, passInternals, pipeline, usesIndexBuffer, emit, ownsPass = false) {
	const { state, rawPass } = passInternals;
	const { core, priors } = pipeline[$internal];
	selectPipeline(state, pipeline);
	if (usesIndexBuffer) requireIndexBuffer(state.indexBuffer ?? priors.indexBuffer);
	const memo = core.unwrap();
	if (!ownsPass) reportIgnoredPriors(core, passInternals.owner, !!priors.timestampWrites, memo.logResources, "render", !!priors.colorAttachment || !!priors.depthStencilAttachment);
	if (state.rawAccessed || passInternals.appliedVersion !== state.version) {
		applyRenderPipelineState(rawPass, root, pipeline, state);
		passInternals.appliedVersion = state.version;
	}
	if (memo.usedImmediate !== void 0) state.immediates.write(rawPass, memo.usedImmediate, priors.immediatesMap, !state.rawAccessed);
	emit(rawPass);
	passInternals.instrumentation?.drew(core);
}
function emitComputeDispatch(root, passInternals, pipeline, emit, ownsPass = false) {
	const { state, rawPass } = passInternals;
	const { core, priors } = pipeline[$internal];
	selectPipeline(state, pipeline);
	const memo = core.unwrap();
	if (!ownsPass) reportIgnoredPriors(core, passInternals.owner, !!priors.timestampWrites, memo.logResources, "compute");
	if (state.rawAccessed || passInternals.appliedVersion !== state.version) {
		applyComputePipelineState(rawPass, root, pipeline, state);
		passInternals.appliedVersion = state.version;
	}
	if (memo.usedImmediate !== void 0) state.immediates.write(rawPass, memo.usedImmediate, priors.immediatesMap, !state.rawAccessed);
	emit(rawPass);
	passInternals.instrumentation?.dispatched(core);
}
//#endregion
//#region src/memo.ts
/**
* Caches results of the function passed in as
* the argument to the constructor.
*
* If the key can be garbage collected, it will be.
*/
var WeakMemo = class {
	#map = /* @__PURE__ */ new WeakMap();
	#make;
	#onMade;
	/** @param onMade Called once per new entry, after it is stored (so it may safely re-enter `getOrMake`). */
	constructor(make, onMade) {
		this.#make = make;
		this.#onMade = onMade;
	}
	getOrMake(key, ...args) {
		if (this.#map.has(key)) return this.#map.get(key);
		const value = this.#make(key, ...args);
		this.#map.set(key, value);
		this.#onMade?.(key, value);
		return value;
	}
};
//#endregion
//#region src/core/pipeline/typeGuards.ts
function isTgpuCommandEncoder(value) {
	const maybe = value;
	return maybe?.resourceType === "command-encoder" && isMarkedInternal(maybe);
}
function isTgpuRenderCommands(value) {
	const maybe = value;
	return (maybe?.resourceType === "render-pass" || maybe?.resourceType === "render-bundle-encoder") && isMarkedInternal(maybe);
}
function isTgpuComputePass(value) {
	const maybe = value;
	return maybe?.resourceType === "compute-pass" && isMarkedInternal(maybe);
}
function isGPUCanvasContext(value) {
	return typeof value?.getCurrentTexture === "function";
}
function isGPUCommandEncoder(value) {
	const maybe = value;
	return !isMarkedInternal(maybe) && typeof maybe?.beginRenderPass === "function" && typeof maybe?.beginComputePass === "function";
}
function isGPUComputePassEncoder(value) {
	const maybe = value;
	return !isMarkedInternal(maybe) && typeof maybe?.dispatchWorkgroups === "function" && maybe?.beginRenderPass === void 0;
}
function isGPURenderPassEncoder(value) {
	const maybe = value;
	return !isMarkedInternal(maybe) && typeof maybe?.executeBundles === "function" && typeof maybe?.draw === "function";
}
function isGPURenderBundleEncoder(value) {
	const maybe = value;
	return !isMarkedInternal(maybe) && typeof maybe?.draw === "function" && typeof maybe?.finish === "function" && maybe?.executeBundles === void 0 && maybe?.beginRenderPass === void 0 && maybe?.dispatchWorkgroups === void 0;
}
//#endregion
//#region src/core/commandEncoder/attachments.ts
var defaultAttachmentViews = new WeakMemo((texture) => texture.createView());
function unwrapAttachmentView(root, view) {
	if (isTexture(view)) return defaultAttachmentViews.getOrMake(root.unwrap(view));
	if (isTextureView(view)) return root.unwrap(view);
	if (isGPUCanvasContext(view)) return defaultAttachmentViews.getOrMake(view.getCurrentTexture());
	return view;
}
function unwrapTimestampWrites(root, timestampWrites) {
	const { querySet, beginningOfPassWriteIndex, endOfPassWriteIndex } = timestampWrites;
	const result = { querySet: isQuerySet(querySet) ? root.unwrap(querySet) : querySet };
	if (beginningOfPassWriteIndex !== void 0) result.beginningOfPassWriteIndex = beginningOfPassWriteIndex;
	if (endOfPassWriteIndex !== void 0) result.endOfPassWriteIndex = endOfPassWriteIndex;
	return result;
}
//#endregion
//#region src/core/commandEncoder/computePass.ts
function INTERNAL_beginComputePass(encoder, descriptor) {
	const { rawEncoder, root } = encoder[$internal];
	const rawDescriptor = {};
	if (descriptor?.label !== void 0) rawDescriptor.label = descriptor.label;
	if (descriptor?.timestampWrites !== void 0) rawDescriptor.timestampWrites = unwrapTimestampWrites(root, descriptor.timestampWrites);
	return new TgpuComputePassImpl(root, rawEncoder.beginComputePass(rawDescriptor), encoder);
}
function INTERNAL_adoptComputePass(root, rawPass) {
	const adopted = new TgpuComputePassImpl(root, rawPass, void 0);
	adopted[$internal].state.rawAccessed = true;
	return adopted;
}
var TgpuComputePassImpl = class {
	[$internal];
	resourceType = "compute-pass";
	#root;
	constructor(root, rawPass, owner) {
		this.#root = root;
		this[$internal] = {
			rawPass,
			state: new ComputeDrawState(),
			owner,
			appliedVersion: void 0,
			instrumentation: root[$internal].instrumentation
		};
	}
	#emit(emit) {
		const internals = this[$internal];
		const pipeline = internals.state.currentPipeline;
		if (!pipeline) throw new Error("Cannot dispatch without a call to pass.setPipeline");
		emitComputeDispatch(this.#root, internals, pipeline, emit);
	}
	setPipeline(pipeline) {
		selectPipeline(this[$internal].state, pipeline);
	}
	setBindGroup(first, bindGroup) {
		recordBindGroup(this[$internal].state, first, bindGroup);
	}
	setImmediates(immediate, value) {
		this[$internal].state.immediates.set(immediate, value);
	}
	dispatchWorkgroups(x, y, z) {
		this.#emit((rawPass) => rawPass.dispatchWorkgroups(x, y, z));
	}
	dispatchWorkgroupsIndirect(indirectBuffer, start) {
		const rawBuffer = isGPUBuffer(indirectBuffer) ? indirectBuffer : indirectBuffer.buffer;
		const offset = resolveIndirectOffset(indirectBuffer, start, 12, "dispatchWorkgroupsIndirect");
		this.#emit((rawPass) => rawPass.dispatchWorkgroupsIndirect(rawBuffer, offset));
	}
	end() {
		this[$internal].rawPass.end();
	}
};
//#endregion
//#region src/core/commandEncoder/renderPass.ts
function attachmentAspects(view) {
	let format;
	let aspect = "all";
	if (isTexture(view)) format = view.props.format;
	else if (isTextureView(view)) {
		format = view[$internal].format;
		aspect = view[$internal].aspect ?? "all";
	}
	if (format === void 0) return;
	return {
		hasDepth: format.includes("depth") && aspect !== "stencil-only",
		hasStencil: format.includes("stencil") && aspect !== "depth-only"
	};
}
function withDepthStencilDefaults(attachment, view) {
	const rawAttachment = {
		...attachment,
		view
	};
	const aspects = attachmentAspects(attachment.view);
	if (aspects === void 0) {
		if (attachment.depthLoadOp !== void 0 || attachment.depthStoreOp !== void 0 || attachment.stencilLoadOp !== void 0 || attachment.stencilStoreOp !== void 0) return rawAttachment;
	}
	const { hasDepth, hasStencil } = aspects ?? {
		hasDepth: true,
		hasStencil: false
	};
	if (hasDepth && !attachment.depthReadOnly) {
		rawAttachment.depthLoadOp ??= "clear";
		rawAttachment.depthStoreOp ??= "store";
		rawAttachment.depthClearValue ??= 1;
	}
	if (hasStencil && !attachment.stencilReadOnly) {
		rawAttachment.stencilLoadOp ??= "clear";
		rawAttachment.stencilStoreOp ??= "store";
	}
	return rawAttachment;
}
function INTERNAL_beginRenderPass(encoder, descriptor) {
	const { rawEncoder, root } = encoder[$internal];
	const rawDescriptor = { colorAttachments: (descriptor.colorAttachments === void 0 ? [] : Array.isArray(descriptor.colorAttachments) ? descriptor.colorAttachments : [descriptor.colorAttachments]).map((attachment) => {
		if (attachment === null) return null;
		const rawAttachment = {
			...attachment,
			loadOp: attachment.loadOp ?? "clear",
			storeOp: attachment.storeOp ?? "store",
			view: unwrapAttachmentView(root, attachment.view)
		};
		if (attachment.resolveTarget !== void 0) rawAttachment.resolveTarget = unwrapAttachmentView(root, attachment.resolveTarget);
		return rawAttachment;
	}) };
	if (descriptor.label !== void 0) rawDescriptor.label = descriptor.label;
	if (descriptor.depthStencilAttachment !== void 0) rawDescriptor.depthStencilAttachment = withDepthStencilDefaults(descriptor.depthStencilAttachment, unwrapAttachmentView(root, descriptor.depthStencilAttachment.view));
	if (descriptor.occlusionQuerySet !== void 0) rawDescriptor.occlusionQuerySet = isQuerySet(descriptor.occlusionQuerySet) ? root.unwrap(descriptor.occlusionQuerySet) : descriptor.occlusionQuerySet;
	if (descriptor.timestampWrites !== void 0) rawDescriptor.timestampWrites = unwrapTimestampWrites(root, descriptor.timestampWrites);
	if (descriptor.maxDrawCount !== void 0) rawDescriptor.maxDrawCount = descriptor.maxDrawCount;
	return new TgpuRenderPassImpl(root, rawEncoder.beginRenderPass(rawDescriptor), encoder);
}
function INTERNAL_createRenderBundleEncoder(root, descriptor) {
	return new TgpuRenderBundleEncoderImpl(root, root.device.createRenderBundleEncoder(descriptor), void 0);
}
function INTERNAL_adoptRenderCommands(root, rawPass) {
	const adopted = typeof rawPass.executeBundles === "function" ? new TgpuRenderPassImpl(root, rawPass, void 0) : new TgpuRenderCommandsImpl(root, rawPass, void 0);
	adopted[$internal].state.rawAccessed = true;
	return adopted;
}
var TgpuRenderCommandsImpl = class {
	[$internal];
	resourceType = "render-bundle-encoder";
	#root;
	constructor(root, rawPass, owner) {
		this.#root = root;
		this[$internal] = {
			rawPass,
			state: new RenderDrawState(),
			owner,
			appliedVersion: void 0,
			instrumentation: root[$internal].instrumentation
		};
	}
	#emit(usesIndexBuffer, emit) {
		const internals = this[$internal];
		const pipeline = internals.state.currentPipeline;
		if (!pipeline) throw new Error("Cannot draw without a call to pass.setPipeline");
		emitRenderDraw(this.#root, internals, pipeline, usesIndexBuffer, emit);
	}
	setPipeline(pipeline) {
		selectPipeline(this[$internal].state, pipeline);
	}
	setBindGroup(first, bindGroup) {
		recordBindGroup(this[$internal].state, first, bindGroup);
	}
	setVertexBuffer(vertexLayout, buffer, offset, size) {
		const { state } = this[$internal];
		state.vertexBuffers.set(vertexLayout, {
			buffer,
			offset,
			size
		});
		state.version++;
	}
	setIndexBuffer(buffer, indexFormat, offset, size) {
		const { state } = this[$internal];
		state.indexBuffer = {
			buffer,
			indexFormat,
			offsetBytes: offset,
			sizeBytes: size
		};
		state.version++;
	}
	setImmediates(immediate, value) {
		this[$internal].state.immediates.set(immediate, value);
	}
	draw(vertexCount, instanceCount, firstVertex, firstInstance) {
		this.#emit(false, (rawPass) => rawPass.draw(vertexCount, instanceCount, firstVertex, firstInstance));
	}
	drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance) {
		this.#emit(true, (rawPass) => rawPass.drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance));
	}
	drawIndirect(indirectBuffer, indirectOffset) {
		const rawBuffer = isGPUBuffer(indirectBuffer) ? indirectBuffer : indirectBuffer.buffer;
		const offset = resolveIndirectOffset(indirectBuffer, indirectOffset, 16, "drawIndirect");
		this.#emit(false, (rawPass) => rawPass.drawIndirect(rawBuffer, offset));
	}
	drawIndexedIndirect(indirectBuffer, indirectOffset) {
		const rawBuffer = isGPUBuffer(indirectBuffer) ? indirectBuffer : indirectBuffer.buffer;
		const offset = resolveIndirectOffset(indirectBuffer, indirectOffset, 20, "drawIndexedIndirect");
		this.#emit(true, (rawPass) => rawPass.drawIndexedIndirect(rawBuffer, offset));
	}
};
var TgpuRenderBundleEncoderImpl = class extends TgpuRenderCommandsImpl {
	resourceType = "render-bundle-encoder";
	finish(descriptor) {
		return this[$internal].rawPass.finish(descriptor);
	}
};
var TgpuRenderPassImpl = class extends TgpuRenderCommandsImpl {
	resourceType = "render-pass";
	setViewport(x, y, width, height, minDepth, maxDepth) {
		this[$internal].rawPass.setViewport(x, y, width, height, minDepth, maxDepth);
	}
	setScissorRect(x, y, width, height) {
		this[$internal].rawPass.setScissorRect(x, y, width, height);
	}
	setBlendConstant(color) {
		this[$internal].rawPass.setBlendConstant(color);
	}
	setStencilReference(reference) {
		const { state } = this[$internal];
		state.stencilReference = reference;
		state.version++;
	}
	beginOcclusionQuery(queryIndex) {
		this[$internal].rawPass.beginOcclusionQuery(queryIndex);
	}
	endOcclusionQuery() {
		this[$internal].rawPass.endOcclusionQuery();
	}
	executeBundles(bundles) {
		const internals = this[$internal];
		internals.rawPass.executeBundles(bundles);
		internals.appliedVersion = void 0;
		internals.state.immediates.invalidate();
	}
	end() {
		this[$internal].rawPass.end();
	}
};
//#endregion
//#region src/core/commandEncoder/commandEncoder.ts
function INTERNAL_createCommandEncoder(root, descriptor) {
	return new TgpuCommandEncoderImpl(root, root.device.createCommandEncoder(descriptor), false);
}
function INTERNAL_adoptCommandEncoder(root, rawEncoder) {
	return new TgpuCommandEncoderImpl(root, rawEncoder, true);
}
var TgpuCommandEncoderImpl = class {
	[$internal];
	resourceType = "command-encoder";
	constructor(root, rawEncoder, adopted) {
		this[$internal] = {
			rawEncoder,
			root,
			adopted,
			beforeFinish: /* @__PURE__ */ new Map(),
			afterSubmit: /* @__PURE__ */ new Map()
		};
	}
	beginRenderPass(descriptor) {
		return INTERNAL_beginRenderPass(this, descriptor);
	}
	beginComputePass(descriptor) {
		return INTERNAL_beginComputePass(this, descriptor);
	}
	#recordPendingCommands() {
		const { rawEncoder, beforeFinish } = this[$internal];
		for (const record of beforeFinish.values()) record(rawEncoder);
		beforeFinish.clear();
	}
	submit() {
		const { rawEncoder, root, afterSubmit } = this[$internal];
		this.#recordPendingCommands();
		root.device.queue.submit([rawEncoder.finish()]);
		root[$internal].instrumentation?.submitted();
		for (const hook of afterSubmit.values()) hook();
		afterSubmit.clear();
	}
	finish(descriptor) {
		const { rawEncoder, root, afterSubmit } = this[$internal];
		this.#recordPendingCommands();
		if (afterSubmit.size > 0) logger.warnOnce("suspicious", root, "finishWithPendingWork", "Shader console.log output and performance callbacks do not fire for command buffers produced by encoder.finish(). Use encoder.submit() instead.");
		return rawEncoder.finish(descriptor);
	}
};
//#endregion
//#region src/wgslExtensions.ts
var wgslEnableExtensions = [
	"f16",
	"clip_distances",
	"dual_source_blending",
	"subgroups",
	"primitive_index"
];
var wgslEnableExtensionToFeatureName = {
	f16: "shader-f16",
	clip_distances: "clip-distances",
	dual_source_blending: "dual-source-blending",
	subgroups: "subgroups",
	primitive_index: "primitive-index"
};
//#endregion
//#region src/tgsl/shellless.ts
function shallowEqualSchemas(a, b) {
	if (a.type !== b.type) return false;
	if (isPtr(a) && isPtr(b)) return a.access === b.access && a.addressSpace === b.addressSpace && a.implicit === b.implicit && shallowEqualSchemas(a.inner, b.inner);
	if (isWgslArray(a) && isWgslArray(b)) return a.elementCount === b.elementCount && shallowEqualSchemas(a.elementType, b.elementType);
	if (isWgslStruct(a) && isWgslStruct(b)) return a === b;
	return true;
}
var ShelllessRepository = class {
	cache = /* @__PURE__ */ new Map();
	get(fn, argSnippets) {
		const meta = getFunctionMetadata(fn);
		if (!meta) return;
		if (!argSnippets && meta.ast.params.length > 0) throw new Error(`Cannot resolve '${getName(fn)}' directly, because it expects arguments. Either call it from another function, or wrap it in a shell`);
		const argTypes = (argSnippets ?? []).map((s, index) => {
			if (s.dataType === UnknownData) {
				const snippetStr = stringifySnippet(s);
				const valueStr = String(s.value);
				const description = snippetStr === valueStr ? `'${snippetStr}'` : `'${snippetStr}' (${valueStr})`;
				throw new Error(`Passed illegal value ${description} as the #${index} argument to ${getName(fn) ?? "<unnamed>"}(...)\nShellless functions can only accept arguments representing WGSL resources: constructible WGSL types, d.refs, samplers or texture views.\nRemember, that arguments such as samplers, texture views, accessors, slots etc. should be dereferenced via '.$' first.`);
			}
			let type = concretize(s.dataType);
			if (isPtr(type) && type.implicit) type = type.inner;
			return type;
		});
		let cache = this.cache.get(fn);
		if (cache) {
			const variant = cache.find((v) => v.argTypes.length === argTypes.length && v.argTypes.every((t, i) => shallowEqualSchemas(t, argTypes[i])));
			if (variant) return variant;
		} else {
			cache = [];
			this.cache.set(fn, cache);
		}
		const shellless = createShelllessImpl(argTypes, fn);
		cache.push(shellless);
		return shellless;
	}
};
//#endregion
//#region src/core/resolve/namespace.ts
var NamespaceImpl = class {
	[$internal];
	constructor(strategy) {
		this[$internal] = {
			strategy,
			takenGlobalIdentifiers: new Set([
				...bannedTokens,
				...builtins,
				...templateEnumerants
			]),
			shelllessRepo: new ShelllessRepository(),
			memoizedResolves: /* @__PURE__ */ new WeakMap(),
			memoizedLazy: /* @__PURE__ */ new WeakMap()
		};
	}
};
function namespace(options) {
	const { names = "strict" } = options ?? {};
	return new NamespaceImpl(names);
}
//#endregion
//#region src/core/pipeline/priors.ts
var TRANSFERABLE_PRIORS = new Set([
	"bindGroupLayoutMap",
	"immediatesMap",
	"vertexLayoutMap",
	"indexBuffer",
	"stencilReference",
	"timestampWrites",
	"performanceCallback"
]);
function nonTransferablePriorsOf(priors) {
	return Object.keys(priors).filter((key) => !TRANSFERABLE_PRIORS.has(key) && priors[key] !== void 0);
}
//#endregion
//#region src/core/pipeline/performanceTracker.ts
var PerformanceTrackerImpl = class {
	#resolveMeasure;
	#wgslSize;
	measureResolve(callback) {
		const resolveStart = performance.mark("typegpu:resolution:start");
		const result = callback();
		this.#resolveMeasure = performance.measure("typegpu:resolution", { start: resolveStart.name });
		this.#wgslSize = result.code.length;
		return result;
	}
	measureCompile(device) {
		(async () => {
			const start = performance.mark("typegpu:compile-start");
			await device.queue.onSubmittedWorkDone();
			const compileMeasure = performance.measure("typegpu:compiled", { start: start.name });
			PERF?.record("resolution", {
				resolveDuration: this.#resolveMeasure?.duration,
				compileDuration: compileMeasure.duration,
				wgslSize: this.#wgslSize
			});
		})();
	}
};
var NullPerformanceTracker = class {
	measureResolve(callback) {
		return callback();
	}
	measureCompile() {}
};
//#endregion
//#region src/core/pipeline/computePipeline.ts
function INTERNAL_createComputePipeline(root, slotBindings, descriptor) {
	return new TgpuComputePipelineImpl(new ComputePipelineCore(root, slotBindings, descriptor), {});
}
var TgpuComputePipelineImpl = class TgpuComputePipelineImpl {
	[$internal];
	[$soul];
	resourceType = "compute-pipeline";
	[$getNameForward];
	constructor(core, priors) {
		this[$soul] = {
			type: "compute-pipeline",
			device: core.root.device,
			raw: void 0,
			label: void 0
		};
		this[$internal] = {
			core,
			priors,
			root: core.root,
			materialize: () => {
				const soul = this[$soul];
				if (!soul.raw) {
					const memo = core.unwrap();
					soul.raw = memo.pipeline;
					soul.usedBindGroupLayouts = memo.usedBindGroupLayouts;
					soul.bindGroups = collectBindGroupPairs(memo.usedBindGroupLayouts, memo.catchall, priors.bindGroupLayoutMap);
					soul.usedImmediate = memo.usedImmediate;
					soul.immediates = [...priors.immediatesMap ?? []];
					soul.timestampWrites = priors.timestampWrites;
					soul.performanceCallback = priors.performanceCallback;
					soul.nonTransferablePriors = nonTransferablePriorsOf(priors);
				}
				return soul.raw;
			}
		};
		this[$getNameForward] = core;
	}
	[$resolve](ctx) {
		return ctx.resolve(this[$internal].core);
	}
	toString() {
		return `computePipeline:${getName(this) ?? "<unnamed>"}`;
	}
	#withPriors(patch) {
		const { core, priors } = this[$internal];
		return new TgpuComputePipelineImpl(core, {
			...priors,
			...patch
		});
	}
	with(first, resource) {
		const internals = this[$internal];
		if (isTgpuComputePass(first)) return this.#withPriors({
			pass: first,
			encoder: void 0
		});
		if (isTgpuCommandEncoder(first)) return this.#withPriors({
			pass: void 0,
			encoder: first
		});
		if (isGPUComputePassEncoder(first)) return this.#withPriors({
			pass: INTERNAL_adoptComputePass(internals.root, first),
			encoder: void 0
		});
		if (isGPUCommandEncoder(first)) return this.#withPriors({
			pass: void 0,
			encoder: INTERNAL_adoptCommandEncoder(internals.root, first)
		});
		if (isImmediateVar(first)) return this.#withPriors({ immediatesMap: new Map(internals.priors.immediatesMap).set(first, createImmediateSnapshot(first, resource)) });
		if (isBindGroup(first) || isBindGroupLayout(first)) {
			const [layout, group] = isBindGroup(first) ? [first.layout, first] : [first, resource];
			return this.#withPriors({ bindGroupLayoutMap: new Map([...internals.priors.bindGroupLayoutMap ?? [], [layout, group]]) });
		}
		throw new Error("Unsupported value passed into .with()");
	}
	pipe(transform) {
		return transform(this);
	}
	withPerformanceCallback(callback) {
		const internals = this[$internal];
		if (internals.priors.timestampWrites) return this.#withPriors({ performanceCallback: callback });
		const querySet = internals.core.performanceCallbackQuerySet;
		if (!querySet) {
			logger.warn("webgpu-feature-missing", "Performance callback cannot be used because the timestamp-query feature is not enabled on the root.");
			return this;
		}
		return this.#withPriors(createWithPerformanceCallback(internals.priors, callback, querySet));
	}
	withTimestampWrites(options) {
		const internals = this[$internal];
		return this.#withPriors(createWithTimestampWrites(internals.priors, options, internals.root));
	}
	dispatchWorkgroups(x, y, z) {
		this.#execute((pass) => pass.dispatchWorkgroups(x, y, z));
	}
	dispatchWorkgroupsIndirect(indirectBuffer, start) {
		const rawBuffer = isGPUBuffer(indirectBuffer) ? indirectBuffer : indirectBuffer.buffer;
		const offset = resolveIndirectOffset(indirectBuffer, start, 12, "dispatchWorkgroupsIndirect");
		this.#execute((pass) => pass.dispatchWorkgroupsIndirect(rawBuffer, offset));
	}
	initAsync() {
		return this[$internal].core.initAsync();
	}
	initSync() {
		this[$internal].core.initSync();
	}
	#execute(dispatch) {
		const { core, priors, root } = this[$internal];
		if (priors.pass) {
			emitComputeDispatch(root, priors.pass[$internal], this, dispatch);
			return;
		}
		const encoder = priors.encoder ?? INTERNAL_createCommandEncoder(root);
		const pass = encoder.beginComputePass({
			label: getName(core) ?? "<unnamed>",
			timestampWrites: priors.timestampWrites
		});
		emitComputeDispatch(root, pass[$internal], this, dispatch, true);
		pass.end();
		finalizeOwnEncoder(encoder, core, core.unwrap().logResources, priors);
	}
	$name(label) {
		setName(this, label);
		return this;
	}
};
var ComputePipelineCore = class ComputePipelineCore {
	[$internal] = true;
	root;
	#performanceTracker;
	#initAsyncPromise;
	#memo;
	#slotBindings;
	#descriptor;
	#performanceCallbackQuerySet;
	constructor(root, slotBindings, descriptor) {
		this.root = root;
		this.#slotBindings = slotBindings;
		this.#descriptor = descriptor;
		this.#performanceTracker = PERF?.enabled ? new PerformanceTrackerImpl() : new NullPerformanceTracker();
	}
	static precompiled(root, memo) {
		const core = new ComputePipelineCore(root, [], void 0);
		core.#memo = memo;
		return core;
	}
	[$resolve](ctx) {
		const descriptor = this.#descriptor;
		if (!descriptor) return snip("", Void, "runtime");
		return ctx.withSlots(this.#slotBindings, () => {
			ctx.resolve(descriptor.compute);
			return snip("", Void, "runtime");
		});
	}
	toString() {
		return "computePipelineCore";
	}
	get performanceCallbackQuerySet() {
		if (!this.root.enabledFeatures.has("timestamp-query")) return;
		return this.#performanceCallbackQuerySet ??= /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(this.root.createQuerySet("timestamp", 2), "performanceCallbackQuerySet");
	}
	/**
	* @privateRemarks
	* This function cannot be a regular async function
	* because when called multiple times before the promise finishes,
	* we want it to return the same promise each time.
	*/
	initAsync() {
		if (this.#memo !== void 0) return Promise.resolve();
		if (this.#initAsyncPromise === void 0) {
			const device = this.root.device;
			const instrumentation = this.root[$internal].instrumentation;
			const { resolutionResult, module, immediateSize, resolveMs } = this.#resolveObserved(instrumentation, "initAsync");
			const { usedBindGroupLayouts, catchall, logResources, usedImmediate } = resolutionResult;
			const createStart = instrumentation?.now() ?? 0;
			this.#initAsyncPromise = device.createComputePipelineAsync({
				label: getName(this) ?? "<unnamed>",
				layout: device.createPipelineLayout({
					label: `${getName(this) ?? "<unnamed>"} - Pipeline Layout`,
					bindGroupLayouts: usedBindGroupLayouts.map((l) => this.root.unwrap(l)),
					immediateSize
				}),
				compute: { module }
			}).then((pipeline) => {
				this.#memo = {
					pipeline,
					usedBindGroupLayouts,
					catchall,
					logResources,
					usedImmediate
				};
				instrumentation?.pipelineCreated(this, {
					pipeline: "compute",
					trigger: "initAsync",
					resolveMs,
					createMs: instrumentation.now() - createStart,
					wgsl: resolutionResult.code,
					layouts: usedBindGroupLayouts,
					module
				});
				this.#performanceTracker.measureCompile(device);
			}, (error) => {
				instrumentation?.pipelineCreationFailed(this, {
					pipeline: "compute",
					trigger: "initAsync",
					resolveMs,
					createMs: instrumentation.now() - createStart,
					wgsl: resolutionResult.code,
					layouts: usedBindGroupLayouts,
					module
				}, error);
				throw error;
			}).finally(() => {
				this.#initAsyncPromise = void 0;
			});
		}
		return this.#initAsyncPromise;
	}
	initSync(trigger = "initSync") {
		if (this.#memo !== void 0) return;
		if (this.#initAsyncPromise !== void 0) throw new Error("'pipeline.initAsync()' was called and is not yet resolved.");
		const device = this.root.device;
		const instrumentation = this.root[$internal].instrumentation;
		const { resolutionResult, module, immediateSize, resolveMs } = this.#resolveObserved(instrumentation, trigger);
		const { usedBindGroupLayouts, catchall, logResources, usedImmediate } = resolutionResult;
		const createStart = instrumentation?.now() ?? 0;
		this.#memo = {
			pipeline: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(device.createComputePipeline({
				label: getName(this) ?? "<unnamed>",
				layout: device.createPipelineLayout({
					label: `${getName(this) ?? "<unnamed>"} - Pipeline Layout`,
					bindGroupLayouts: usedBindGroupLayouts.map((l) => this.root.unwrap(l)),
					immediateSize
				}),
				compute: { module }
			}), "pipeline"),
			usedBindGroupLayouts,
			catchall,
			logResources,
			usedImmediate
		};
		instrumentation?.pipelineCreated(this, {
			pipeline: "compute",
			trigger,
			resolveMs,
			createMs: instrumentation.now() - createStart,
			wgsl: resolutionResult.code,
			layouts: usedBindGroupLayouts,
			module
		});
		this.#performanceTracker.measureCompile(device);
	}
	unwrap() {
		if (this.#memo === void 0) this.initSync("lazy");
		return this.#memo;
	}
	/** Reports a failure of WGSL generation (the most common developer error) before it propagates unchanged. */
	#resolveObserved(instrumentation, trigger) {
		try {
			return this.resolveAndCreateShaderModule();
		} catch (error) {
			instrumentation?.pipelineResolutionFailed(this, "compute", trigger, error);
			throw error;
		}
	}
	resolveAndCreateShaderModule() {
		const device = this.root.device;
		const enableExtensions = wgslEnableExtensions.filter((extension) => this.root.enabledFeatures.has(wgslEnableExtensionToFeatureName[extension]));
		const instrumentation = this.root[$internal].instrumentation;
		const resolveStart = instrumentation?.now() ?? 0;
		const ns = namespace({ names: this.root.nameRegistrySetting });
		const resolutionResult = this.#performanceTracker.measureResolve(() => resolve(this, {
			namespace: ns,
			minify: this.root.minify,
			enableExtensions,
			shaderGenerator: this.root.shaderGeneratorClass ? new this.root.shaderGeneratorClass() : void 0,
			root: this.root
		}));
		const resolveMs = instrumentation ? instrumentation.now() - resolveStart : 0;
		const { code, usedBindGroupLayouts, catchall, usedImmediate } = resolutionResult;
		if (catchall !== void 0) usedBindGroupLayouts[catchall[0]]?.$name(`${getName(this) ?? "<unnamed>"} - Automatic Bind Group & Layout`);
		warnIfOverflow(usedBindGroupLayouts, device.limits);
		const immediateSize = usedImmediate ? validateImmediateUsage(usedImmediate, this.root) : 0;
		return {
			resolutionResult,
			module: device.createShaderModule({
				label: `${getName(this) ?? "<unnamed>"} - Shader`,
				code
			}),
			immediateSize,
			resolveMs
		};
	}
};
//#endregion
//#region src/builtin.ts
function defineBuiltin(dataType, value) {
	return attribute(dataType, {
		[$internal]: true,
		type: "@builtin",
		params: [value]
	});
}
var builtin = {
	vertexIndex: defineBuiltin(u32, "vertex_index"),
	instanceIndex: defineBuiltin(u32, "instance_index"),
	clipDistances: defineBuiltin(arrayOf(u32, 8), "clip_distances"),
	position: defineBuiltin(vec4f$1, "position"),
	frontFacing: defineBuiltin(bool, "front_facing"),
	fragDepth: defineBuiltin(f32, "frag_depth"),
	primitiveIndex: defineBuiltin(u32, "primitive_index"),
	sampleIndex: defineBuiltin(u32, "sample_index"),
	sampleMask: defineBuiltin(u32, "sample_mask"),
	localInvocationId: defineBuiltin(vec3u$1, "local_invocation_id"),
	localInvocationIndex: defineBuiltin(u32, "local_invocation_index"),
	globalInvocationId: defineBuiltin(vec3u$1, "global_invocation_id"),
	globalInvocationIndex: defineBuiltin(u32, "global_invocation_index"),
	workgroupId: defineBuiltin(vec3u$1, "workgroup_id"),
	workgroupIndex: defineBuiltin(u32, "workgroup_index"),
	numWorkgroups: defineBuiltin(vec3u$1, "num_workgroups"),
	subgroupInvocationId: defineBuiltin(u32, "subgroup_invocation_id"),
	subgroupSize: defineBuiltin(u32, "subgroup_size"),
	subgroupId: defineBuiltin(u32, "subgroup_id"),
	numSubgroups: defineBuiltin(u32, "num_subgroups")
};
//#endregion
//#region src/core/function/autoIO.ts
var builtinVertexIn = {
	$vertexIndex: builtin.vertexIndex,
	$instanceIndex: builtin.instanceIndex
};
var builtinVertexOut = {
	$clipDistances: builtin.clipDistances,
	$position: builtin.position
};
var builtinFragmentIn = {
	$position: builtin.position,
	$frontFacing: builtin.frontFacing,
	$primitiveIndex: builtin.primitiveIndex,
	$sampleIndex: builtin.sampleIndex,
	$sampleMask: builtin.sampleMask,
	$subgroupInvocationId: builtin.subgroupInvocationId,
	$subgroupSize: builtin.subgroupSize
};
var builtinFragmentOut = {
	$fragDepth: builtin.fragDepth,
	$sampleMask: builtin.sampleMask
};
/**
* Only used internally. Meant to be recreated on every resolution.
*/
var AutoFragmentFn = class {
	#core;
	autoIn;
	autoOut;
	constructor(impl, varyings, locations) {
		if (!getName(impl)) setName(impl, "fragmentFn");
		this.#core = createFnCore(impl, "fragment");
		this.autoIn = new AutoStruct({
			...builtinFragmentIn,
			...varyings
		}, void 0, locations, true);
		setName(this.autoIn, "FragmentIn");
		this.autoOut = new AutoStruct(builtinFragmentOut, vec4f$1);
		setName(this.autoOut, "FragmentOut");
	}
	toString() {
		return "autoFragmentFn";
	}
	[$resolve](ctx) {
		return ctx.withSlots([[shaderStageSlot, "fragment"]], () => this.#core.resolve(ctx, [this.autoIn], this.autoOut));
	}
};
AutoFragmentFn.prototype[$internal] = true;
AutoFragmentFn.prototype.resourceType = "auto-fragment-fn";
/**
* Only used internally. Meant to be recreated on every resolution.
*/
var AutoVertexFn = class {
	#core;
	autoIn;
	autoOut;
	constructor(impl, attribs, locations) {
		if (!getName(impl)) setName(impl, "vertexFn");
		this.#core = createFnCore(impl, "vertex");
		this.autoIn = new AutoStruct({
			...builtinVertexIn,
			...attribs
		}, void 0);
		setName(this.autoIn, "VertexIn");
		this.autoOut = new AutoStruct(builtinVertexOut, void 0, locations, true);
		setName(this.autoOut, "VertexOut");
	}
	toString() {
		return "autoVertexFn";
	}
	[$resolve](ctx) {
		return ctx.withSlots([[shaderStageSlot, "vertex"]], () => this.#core.resolve(ctx, [this.autoIn], this.autoOut));
	}
};
AutoVertexFn.prototype[$internal] = true;
AutoVertexFn.prototype.resourceType = "auto-vertex-fn";
//#endregion
//#region src/core/vertexLayout/vertexLayout.ts
function isVertexLayout(value) {
	return value?.resourceType === "vertex-layout";
}
//#endregion
//#region src/core/pipeline/connectAttachmentToShader.ts
function isColorAttachment(value) {
	return !!value?.view;
}
function connectAttachmentToShader(connectedTargets, attachment) {
	if (!connectedTargets) return [];
	return connectedTargets.map((target) => {
		if (!target) return null;
		if (target.key === void 0) {
			if (!isColorAttachment(attachment)) throw new Error("Expected a single color attachment, not a record.");
			return attachment;
		}
		const matching = attachment[target.key];
		if (!matching) throw new Error(`A color attachment by the name of '${target.key}' was not provided to the shader.`);
		return matching;
	});
}
//#endregion
//#region src/core/pipeline/connectTargetsToShader.ts
function connectTargetsToShader(fragmentOut, targets) {
	if (isVoid(fragmentOut) || isBuiltin(fragmentOut)) return [];
	const result = [];
	function putInResult(index, key, target) {
		while (index > result.length) result.push(null);
		result[index] = {
			key,
			target
		};
	}
	if (isWgslStruct(fragmentOut)) {
		const varyings = Object.entries(fragmentOut.propTypes).filter(([, value]) => !isBuiltin(value));
		for (const [key, outputValue] of varyings) {
			const matchingTarget = targets?.[key];
			const location = getCustomLocation(outputValue);
			invariant(location !== void 0, `'withLocations' failed or was not called.`);
			putInResult(location, key, {
				...matchingTarget,
				format: matchingTarget?.format ?? navigator.gpu.getPreferredCanvasFormat()
			});
		}
	} else {
		const singleTarget = targets;
		putInResult(getCustomLocation(fragmentOut) ?? 0, void 0, {
			...singleTarget,
			format: singleTarget?.format ?? navigator.gpu.getPreferredCanvasFormat()
		});
	}
	return result;
}
//#endregion
//#region src/core/pipeline/renderPipeline.ts
function INTERNAL_createRenderPipeline(options) {
	return new TgpuRenderPipelineImpl(new RenderPipelineCore(options), {});
}
var TgpuRenderPipelineImpl = class TgpuRenderPipelineImpl {
	[$internal];
	[$soul];
	resourceType = "render-pipeline";
	[$getNameForward];
	constructor(core, priors) {
		this[$soul] = {
			type: "render-pipeline",
			device: core.options.root.device,
			raw: void 0,
			label: void 0
		};
		this[$internal] = {
			core,
			priors,
			root: core.options.root,
			materialize: () => {
				const soul = this[$soul];
				if (!soul.raw) {
					const memo = core.unwrap();
					soul.raw = memo.pipeline;
					soul.usedBindGroupLayouts = memo.usedBindGroupLayouts;
					soul.usedVertexLayouts = memo.usedVertexLayouts;
					soul.connectedTargets = memo.connectedTargets;
					soul.bindGroups = collectBindGroupPairs(memo.usedBindGroupLayouts, memo.catchall, priors.bindGroupLayoutMap);
					soul.usedImmediate = memo.usedImmediate;
					soul.immediates = [...priors.immediatesMap ?? []];
					soul.vertexBuffers = collectVertexBufferPairs(memo.usedVertexLayouts, priors.vertexLayoutMap);
					soul.indexBuffer = priors.indexBuffer;
					soul.stencilReference = priors.stencilReference;
					soul.timestampWrites = priors.timestampWrites;
					soul.performanceCallback = priors.performanceCallback;
					soul.nonTransferablePriors = nonTransferablePriorsOf(priors);
				}
				return soul.raw;
			}
		};
		this[$getNameForward] = core;
	}
	[$resolve](ctx) {
		return ctx.resolve(this[$internal].core);
	}
	toString() {
		return `renderPipeline:${getName(this) ?? "<unnamed>"}`;
	}
	$name(label) {
		setName(this, label);
		return this;
	}
	#withPriors(patch) {
		const { core, priors } = this[$internal];
		return new TgpuRenderPipelineImpl(core, {
			...priors,
			...patch
		});
	}
	with(first, resource) {
		const internals = this[$internal];
		if (isTgpuRenderCommands(first)) return this.#withPriors({
			pass: first,
			encoder: void 0
		});
		if (isTgpuCommandEncoder(first)) return this.#withPriors({
			pass: void 0,
			encoder: first
		});
		if (isGPURenderPassEncoder(first) || isGPURenderBundleEncoder(first)) return this.#withPriors({
			pass: INTERNAL_adoptRenderCommands(internals.root, first),
			encoder: void 0
		});
		if (isGPUCommandEncoder(first)) return this.#withPriors({
			pass: void 0,
			encoder: INTERNAL_adoptCommandEncoder(internals.root, first)
		});
		if (isBindGroup(first) || isBindGroupLayout(first)) {
			const [layout, group] = isBindGroup(first) ? [first.layout, first] : [first, resource];
			return this.#withPriors({ bindGroupLayoutMap: new Map([...internals.priors.bindGroupLayoutMap ?? [], [layout, group]]) });
		}
		if (isVertexLayout(first)) return this.#withPriors({ vertexLayoutMap: new Map([...internals.priors.vertexLayoutMap ?? [], [first, resource]]) });
		if (isImmediateVar(first)) return this.#withPriors({ immediatesMap: new Map(internals.priors.immediatesMap).set(first, createImmediateSnapshot(first, resource)) });
		throw new Error("Unsupported value passed into .with()");
	}
	pipe(transform) {
		return transform(this);
	}
	withPerformanceCallback(callback) {
		const internals = this[$internal];
		if (internals.priors.timestampWrites) return this.#withPriors({ performanceCallback: callback });
		const querySet = internals.core.performanceCallbackQuerySet;
		if (!querySet) {
			logger.warn("webgpu-feature-missing", "Performance callback cannot be used because the timestamp-query feature is not enabled on the root.");
			return this;
		}
		return this.#withPriors(createWithPerformanceCallback(internals.priors, callback, querySet));
	}
	withTimestampWrites(options) {
		const internals = this[$internal];
		return this.#withPriors(createWithTimestampWrites(internals.priors, options, internals.root));
	}
	withColorAttachment(attachment) {
		return this.#withPriors({ colorAttachment: attachment });
	}
	withDepthStencilAttachment(attachment) {
		return this.#withPriors({ depthStencilAttachment: attachment });
	}
	withStencilReference(reference) {
		return this.#withPriors({ stencilReference: reference });
	}
	withIndexBuffer(buffer, indexFormatOrOffset, offsetBytesOrSizeElements, sizeBytesOrUndefined) {
		if (isGPUBuffer(buffer)) {
			if (typeof indexFormatOrOffset !== "string") throw new Error("If a GPUBuffer is passed, indexFormat must be provided.");
			return this.#withPriors({ indexBuffer: {
				buffer,
				indexFormat: indexFormatOrOffset,
				offsetBytes: offsetBytesOrSizeElements,
				sizeBytes: sizeBytesOrUndefined
			} });
		}
		const dataTypeToIndexFormat = {
			u32: "uint32",
			u16: "uint16"
		};
		const elementType = buffer.dataType.elementType;
		return this.#withPriors({ indexBuffer: {
			buffer,
			indexFormat: dataTypeToIndexFormat[elementType.type],
			offsetBytes: indexFormatOrOffset !== void 0 ? indexFormatOrOffset * sizeOf(elementType) : void 0,
			sizeBytes: offsetBytesOrSizeElements !== void 0 ? offsetBytesOrSizeElements * sizeOf(elementType) : void 0
		} });
	}
	initAsync() {
		return this[$internal].core.initAsync();
	}
	initSync() {
		this[$internal].core.initSync();
	}
	get hasIndexBuffer() {
		return this[$internal].priors.indexBuffer !== void 0;
	}
	#ownPassDescriptor() {
		const { core, priors } = this[$internal];
		const { connectedTargets } = core.unwrap();
		return {
			label: getName(core) ?? "<unnamed>",
			colorAttachments: connectAttachmentToShader(connectedTargets, priors.colorAttachment ?? {}),
			depthStencilAttachment: priors.depthStencilAttachment,
			timestampWrites: priors.timestampWrites
		};
	}
	#execute(usesIndexBuffer, emit) {
		const { core, priors, root } = this[$internal];
		if (priors.pass) {
			emitRenderDraw(root, priors.pass[$internal], this, usesIndexBuffer, emit);
			return;
		}
		if (usesIndexBuffer) requireIndexBuffer(priors.indexBuffer);
		const encoder = priors.encoder ?? INTERNAL_createCommandEncoder(root);
		const pass = encoder.beginRenderPass(this.#ownPassDescriptor());
		emitRenderDraw(root, pass[$internal], this, usesIndexBuffer, emit, true);
		pass.end();
		finalizeOwnEncoder(encoder, core, core.unwrap().logResources, priors);
	}
	draw(vertexCount, instanceCount, firstVertex, firstInstance) {
		this.#execute(false, (rawPass) => rawPass.draw(vertexCount, instanceCount, firstVertex, firstInstance));
	}
	drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance) {
		this.#execute(true, (rawPass) => rawPass.drawIndexed(indexCount, instanceCount, firstIndex, baseVertex, firstInstance));
	}
	drawIndirect(indirectBuffer, indirectOffset) {
		const rawBuffer = isGPUBuffer(indirectBuffer) ? indirectBuffer : indirectBuffer.buffer;
		const offset = resolveIndirectOffset(indirectBuffer, indirectOffset, 16, "drawIndirect");
		this.#execute(false, (rawPass) => rawPass.drawIndirect(rawBuffer, offset));
	}
	drawIndexedIndirect(indirectBuffer, indirectOffset) {
		const rawBuffer = isGPUBuffer(indirectBuffer) ? indirectBuffer : indirectBuffer.buffer;
		const offset = resolveIndirectOffset(indirectBuffer, indirectOffset, 20, "drawIndexedIndirect");
		this.#execute(true, (rawPass) => rawPass.drawIndexedIndirect(rawBuffer, offset));
	}
};
var RenderPipelineCore = class RenderPipelineCore {
	[$internal] = true;
	options;
	#performanceTracker;
	#initAsyncPromise;
	#memo;
	#latestAutoVertexIn;
	#latestAutoFragmentOut;
	#performanceCallbackQuerySet;
	constructor(options) {
		this.options = options;
		this.#performanceTracker = PERF?.enabled ? new PerformanceTrackerImpl() : new NullPerformanceTracker();
	}
	static precompiled(root, memo) {
		const core = new RenderPipelineCore({
			root,
			slotBindings: [],
			descriptor: void 0
		});
		core.#memo = memo;
		return core;
	}
	[$resolve](ctx) {
		const { slotBindings } = this.options;
		const { vertex, fragment, attribs = {} } = this.options.descriptor ?? {};
		if (!vertex) return snip("", Void, "runtime");
		this.#latestAutoVertexIn = void 0;
		this.#latestAutoFragmentOut = void 0;
		const locations = matchUpVaryingLocations(vertex?.shell?.out, fragment?.shell?.in, getName(vertex) ?? "<unnamed>", getName(fragment) ?? "<unnamed>");
		return ctx.withVaryingLocations(locations, () => ctx.withSlots(slotBindings, () => {
			let vertexOut;
			if (typeof vertex === "function") {
				const autoFn = new AutoVertexFn(vertex, Object.fromEntries(Object.entries(attribs).map(([key, value]) => [key, formatToWGSLType[value.format]])), locations);
				ctx.resolve(autoFn);
				this.#latestAutoVertexIn = autoFn.autoIn.completeStruct.propTypes;
				vertexOut = autoFn.autoOut.completeStruct;
			} else vertexOut = ctx.resolve(vertex).dataType;
			if (fragment) if (typeof fragment === "function") {
				const varyings = Object.fromEntries(Object.entries(vertexOut.propTypes).filter(([, dataType]) => !isBuiltin(dataType)));
				this.#latestAutoFragmentOut = ctx.resolve(new AutoFragmentFn(fragment, varyings, locations)).dataType;
			} else ctx.resolve(fragment);
			return snip("", Void, "runtime");
		}));
	}
	toString() {
		return "renderPipelineCore";
	}
	get performanceCallbackQuerySet() {
		if (!this.options.root.enabledFeatures.has("timestamp-query")) return;
		return this.#performanceCallbackQuerySet ??= /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(this.options.root.createQuerySet("timestamp", 2), "performanceCallbackQuerySet");
	}
	initAsync() {
		if (this.#memo !== void 0) return Promise.resolve();
		if (this.#initAsyncPromise === void 0) {
			const device = this.options.root.device;
			const instrumentation = this.options.root[$internal].instrumentation;
			const { resolutionResult, descriptor, connectedTargets, connectedAttribs, module, resolveMs } = this.#resolveObserved(instrumentation, "initAsync");
			const { usedBindGroupLayouts, catchall, logResources } = resolutionResult;
			const createStart = instrumentation?.now() ?? 0;
			this.#initAsyncPromise = device.createRenderPipelineAsync(descriptor).then((pipeline) => {
				this.#memo = {
					pipeline,
					usedBindGroupLayouts,
					catchall,
					logResources,
					usedVertexLayouts: connectedAttribs.usedVertexLayouts,
					connectedTargets,
					usedImmediate: resolutionResult.usedImmediate
				};
				instrumentation?.pipelineCreated(this, {
					pipeline: "render",
					trigger: "initAsync",
					resolveMs,
					createMs: instrumentation.now() - createStart,
					wgsl: resolutionResult.code,
					layouts: usedBindGroupLayouts,
					module
				});
				this.#performanceTracker.measureCompile(device);
			}, (error) => {
				instrumentation?.pipelineCreationFailed(this, {
					pipeline: "render",
					trigger: "initAsync",
					resolveMs,
					createMs: instrumentation.now() - createStart,
					wgsl: resolutionResult.code,
					layouts: usedBindGroupLayouts,
					module
				}, error);
				throw error;
			}).finally(() => {
				this.#initAsyncPromise = void 0;
			});
		}
		return this.#initAsyncPromise;
	}
	initSync(trigger = "initSync") {
		if (this.#memo !== void 0) return;
		if (this.#initAsyncPromise !== void 0) throw new Error("'pipeline.initAsync()' was called and is not yet resolved.");
		const device = this.options.root.device;
		const instrumentation = this.options.root[$internal].instrumentation;
		const { resolutionResult, descriptor, connectedTargets, connectedAttribs, module, resolveMs } = this.#resolveObserved(instrumentation, trigger);
		const { usedBindGroupLayouts, catchall, logResources } = resolutionResult;
		const createStart = instrumentation?.now() ?? 0;
		this.#memo = {
			pipeline: /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(device.createRenderPipeline(descriptor), "pipeline"),
			usedBindGroupLayouts,
			catchall,
			logResources,
			usedVertexLayouts: connectedAttribs.usedVertexLayouts,
			connectedTargets,
			usedImmediate: resolutionResult.usedImmediate
		};
		instrumentation?.pipelineCreated(this, {
			pipeline: "render",
			trigger,
			resolveMs,
			createMs: instrumentation.now() - createStart,
			wgsl: resolutionResult.code,
			layouts: usedBindGroupLayouts,
			module
		});
		this.#performanceTracker.measureCompile(device);
	}
	unwrap() {
		if (this.#memo === void 0) this.initSync("lazy");
		return this.#memo;
	}
	/** Reports a failure of WGSL generation (the most common developer error) before it propagates unchanged. */
	#resolveObserved(instrumentation, trigger) {
		try {
			return this.resolveAndCreateShaderModule();
		} catch (error) {
			instrumentation?.pipelineResolutionFailed(this, "render", trigger, error);
			throw error;
		}
	}
	resolveAndCreateShaderModule() {
		const { root, descriptor: tgpuDescriptor } = this.options;
		if (!tgpuDescriptor) throw new Error("Precompiled pipelines are never resolved again.");
		const device = root.device;
		const enableExtensions = wgslEnableExtensions.filter((extension) => root.enabledFeatures.has(wgslEnableExtensionToFeatureName[extension]));
		const instrumentation = root[$internal].instrumentation;
		const resolveStart = instrumentation?.now() ?? 0;
		const ns = namespace({ names: root.nameRegistrySetting });
		const resolutionResult = this.#performanceTracker.measureResolve(() => resolve(this, {
			namespace: ns,
			minify: root.minify,
			enableExtensions,
			shaderGenerator: root.shaderGeneratorClass ? new root.shaderGeneratorClass() : void 0,
			root
		}));
		const resolveMs = instrumentation ? instrumentation.now() - resolveStart : 0;
		const { code, usedBindGroupLayouts, catchall, usedImmediate } = resolutionResult;
		if (catchall !== void 0) usedBindGroupLayouts[catchall[0]]?.$name(`${getName(this) ?? "<unnamed>"} - Automatic Bind Group & Layout`);
		warnIfOverflow(usedBindGroupLayouts, device.limits);
		const immediateSize = usedImmediate ? validateImmediateUsage(usedImmediate, root) : 0;
		const module = device.createShaderModule({
			label: `${getName(this) ?? "<unnamed>"} - Shader`,
			code
		});
		const { vertex, fragment, attribs = {}, targets } = tgpuDescriptor;
		const connectedAttribs = connectAttributesToShader(vertex?.shell?.in ?? this.#latestAutoVertexIn ?? {}, attribs);
		const fragmentOut = fragment?.shell?.returnType ?? this.#latestAutoFragmentOut;
		const connectedTargets = fragmentOut ? connectTargetsToShader(fragmentOut, targets) : [];
		const descriptor = {
			layout: device.createPipelineLayout({
				label: `${getName(this) ?? "<unnamed>"} - Pipeline Layout`,
				bindGroupLayouts: usedBindGroupLayouts.map((l) => root.unwrap(l)),
				immediateSize
			}),
			vertex: {
				module,
				buffers: connectedAttribs.bufferDefinitions
			}
		};
		const label = getName(this);
		if (label !== void 0) descriptor.label = label;
		if (tgpuDescriptor.fragment) descriptor.fragment = {
			module,
			targets: connectedTargets.map((target) => target ? target.target : null)
		};
		if (tgpuDescriptor.primitive) if (isWgslData(tgpuDescriptor.primitive.stripIndexFormat)) descriptor.primitive = {
			...tgpuDescriptor.primitive,
			stripIndexFormat: {
				u32: "uint32",
				u16: "uint16"
			}[tgpuDescriptor.primitive.stripIndexFormat.type]
		};
		else descriptor.primitive = tgpuDescriptor.primitive;
		if (tgpuDescriptor.depthStencil) descriptor.depthStencil = tgpuDescriptor.depthStencil;
		if (tgpuDescriptor.multisample) descriptor.multisample = tgpuDescriptor.multisample;
		return {
			resolutionResult,
			descriptor,
			connectedTargets,
			connectedAttribs,
			module,
			resolveMs
		};
	}
};
/**
* Throws, when vertexOut and fragmentIn don't match in terms of custom locations.
*
* @privateRemarks
* Note that vertexOut is undefined in shellless functions.
*/
function matchUpVaryingLocations(vertexOut = {}, fragmentIn = {}, vertexFnName, fragmentFnName) {
	const locations = {};
	const usedLocations = /* @__PURE__ */ new Set();
	function saveLocation(key, location) {
		locations[key] = location;
		usedLocations.add(location);
	}
	for (const [key, value] of Object.entries(vertexOut)) {
		const customLocation = getCustomLocation(value);
		if (customLocation !== void 0) saveLocation(key, customLocation);
	}
	for (const [key, value] of Object.entries(fragmentIn)) {
		const customLocation = getCustomLocation(value);
		if (customLocation === void 0) continue;
		if (locations[key] === void 0) saveLocation(key, customLocation);
		else if (locations[key] !== customLocation) throw new Error(`Mismatched location between vertexFn (${vertexFnName}) output (${locations[key]}) and fragmentFn (${fragmentFnName}) input (${customLocation}) for the key "${key}".`);
	}
	let nextLocation = 0;
	for (const [key, value] of [...Object.entries(vertexOut), ...Object.entries(fragmentIn)]) {
		if (isBuiltin(value) || locations[key] !== void 0) continue;
		while (usedLocations.has(nextLocation)) nextLocation++;
		saveLocation(key, nextLocation);
	}
	return locations;
}
//#endregion
//#region src/core/function/tgpuComputeFn.ts
/**
* Creates a shell of a typed entry function for the compute shader stage. Any function
* that implements this shell can perform general-purpose computation.
*
* @param options.in
*   Record with builtins used by the compute shader.
* @param options.workgroupSize
*   Size of blocks that the thread grid will be divided into (up to 3 dimensions).
*/
function computeFn(options) {
	const shell = {
		argTypes: Object.values(options.in ?? {}),
		returnType: Void,
		workgroupSize: options.workgroupSize,
		entryPoint: "compute"
	};
	const entryInput = separateBuiltins(options.in ?? {});
	const call = (arg, ...values) => createComputeFn(shell, options.workgroupSize, stripTemplate(arg, ...values), entryInput);
	return Object.assign(call, shell);
}
function createComputeFn(shell, workgroupSize, implementation, entryInput) {
	const core = createFnCore(implementation, "compute", workgroupSize);
	return {
		shell,
		$uses(newExternals) {
			core.setExternals("userProvided", newExternals);
			return this;
		},
		[$internal]: true,
		[$getNameForward]: core,
		$name(newLabel) {
			setName(this, newLabel);
			return this;
		},
		[$resolve](ctx) {
			return ctx.withSlots([[shaderStageSlot, "compute"]], () => core.resolve(ctx, [], shell.returnType, entryInput));
		},
		toString() {
			return `computeFn:${getName(core) ?? "<unnamed>"}`;
		}
	};
}
//#endregion
//#region src/core/root/init.ts
/**
* Changes the given array to a vec of 3 numbers, filling missing values with 1.
*/
function toVec3(arr) {
	if (arr.includes(0)) throw new Error("Size and workgroupSize cannot contain zeroes.");
	return vec3u$1(arr[0] ?? 1, arr[1] ?? 1, arr[2] ?? 1);
}
var workgroupSizeConfigs = [
	vec3u$1(1, 1, 1),
	vec3u$1(256, 1, 1),
	vec3u$1(16, 16, 1),
	vec3u$1(8, 8, 4)
];
var TgpuGuardedComputePipelineImpl = class TgpuGuardedComputePipelineImpl {
	resourceType = "guarded-compute-pipeline";
	[$soul];
	#root;
	#lastSize;
	constructor(root, pipeline, sizeUniform, workgroupSize) {
		this.#root = root;
		this.#lastSize = vec3u$1();
		this[$soul] = {
			type: "guarded-compute-pipeline",
			device: root.device,
			pipeline,
			sizeUniform,
			workgroupSize,
			label: void 0
		};
	}
	with(bindGroup) {
		if (!isBindGroup(bindGroup)) throw new Error("Guarded pipelines only accept bind groups in .with(). To record into passes or encoders, use a regular compute pipeline.");
		return new TgpuGuardedComputePipelineImpl(this.#root, this[$soul].pipeline.with(bindGroup), this[$soul].sizeUniform, this[$soul].workgroupSize);
	}
	withPerformanceCallback(callback) {
		return new TgpuGuardedComputePipelineImpl(this.#root, this[$soul].pipeline.withPerformanceCallback(callback), this[$soul].sizeUniform, this[$soul].workgroupSize);
	}
	withTimestampWrites(options) {
		return new TgpuGuardedComputePipelineImpl(this.#root, this[$soul].pipeline.withTimestampWrites(options), this[$soul].sizeUniform, this[$soul].workgroupSize);
	}
	dispatchThreads(...threads) {
		const sanitizedSize = toVec3(threads);
		const workgroupCount = ceil(vec3f$1(sanitizedSize).div(vec3f$1(this[$soul].workgroupSize)));
		if (!allEq(sanitizedSize, this.#lastSize)) {
			this.#lastSize = sanitizedSize;
			this[$soul].sizeUniform.write(sanitizedSize);
		}
		this[$soul].pipeline.dispatchWorkgroups(workgroupCount.x, workgroupCount.y, workgroupCount.z);
	}
	initAsync() {
		return this[$soul].pipeline.initAsync();
	}
	initSync() {
		this[$soul].pipeline.initSync();
	}
	get pipeline() {
		return this[$soul].pipeline;
	}
	get sizeUniform() {
		return this[$soul].sizeUniform;
	}
	[$internal] = true;
	get [$getNameForward]() {
		return this[$soul].pipeline;
	}
	$name(label) {
		setName(this, label);
		return this;
	}
};
var WithBindingImpl = class WithBindingImpl {
	#getRoot;
	#slotBindings;
	constructor(getRoot, slotBindings) {
		this.#getRoot = getRoot;
		this.#slotBindings = slotBindings;
	}
	with(slot, value) {
		return new WithBindingImpl(this.#getRoot, [...this.#slotBindings, [isAccessor(slot) || isMutableAccessor(slot) ? slot.slot : slot, value]]);
	}
	createComputePipeline(descriptor) {
		return INTERNAL_createComputePipeline(this.#getRoot(), this.#slotBindings, descriptor);
	}
	createRenderPipeline(descriptor) {
		return INTERNAL_createRenderPipeline({
			root: this.#getRoot(),
			slotBindings: this.#slotBindings,
			descriptor
		});
	}
	createGuardedComputePipeline(callback) {
		const root = this.#getRoot();
		if (callback.length >= 4) throw new Error("Guarded compute callback only supports up to three dimensions.");
		const workgroupSize = workgroupSizeConfigs[callback.length];
		const wrappedCallback = fn([
			u32,
			u32,
			u32
		])(callback);
		if (getName(wrappedCallback) === void 0) wrappedCallback.$name("wrappedCallback");
		const sizeUniform = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(root.createUniform(vec3u$1), "sizeUniform");
		const mainCompute = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(computeFn({
			workgroupSize,
			in: { id: builtin.globalInvocationId }
		})`{
  if (any(in.id >= sizeUniform)) {
    return;
  }
  wrappedCallback(in.id.x, in.id.y, in.id.z);
}`.$uses({
			sizeUniform,
			wrappedCallback
		}), "mainCompute");
		return new TgpuGuardedComputePipelineImpl(root, this.createComputePipeline({ compute: mainCompute }), sizeUniform, workgroupSize);
	}
	pipe(transform) {
		const newCfg = transform(new ConfigurableImpl([]));
		return new WithBindingImpl(this.#getRoot, [...this.#slotBindings, ...newCfg.bindings]);
	}
};
/**
* Holds all data that is necessary to facilitate CPU and GPU communication.
* Programs that share a root can interact via GPU buffers.
*/
var TgpuRootImpl = class extends WithBindingImpl {
	"~unstable";
	resourceType = "root";
	[$soul];
	device;
	nameRegistrySetting;
	shaderGeneratorClass;
	#unwrappedBindGroupLayouts = new WeakMemo((key) => key.unwrap(this));
	#unwrappedBindGroups = new WeakMemo((key) => key.unwrap(this), (key, raw) => this[$internal].instrumentation?.bindGroupCreated(key, key[$soul].raw === raw ? "adopted" : "created"));
	#ownDevice;
	[$internal];
	#instrumentation;
	constructor(device, nameRegistrySetting, minify, ownDevice, logOptions, shaderGeneratorClass, instrumentation) {
		super(() => this, []);
		this.device = device;
		this.nameRegistrySetting = nameRegistrySetting;
		this.#ownDevice = ownDevice;
		this.shaderGeneratorClass = shaderGeneratorClass;
		this["~unstable"] = this;
		this[$soul] = {
			type: "root",
			device,
			nameRegistrySetting,
			logOptions,
			minify,
			nonTransferablePriors: shaderGeneratorClass ? ["shaderGeneratorClass"] : void 0,
			label: void 0
		};
		const internals = {
			logOptions,
			instrumentation: void 0
		};
		this[$internal] = internals;
		if (instrumentation) {
			if (typeof instrumentation.attach !== "function") throw new Error("unstable_instrumentation expects the value of `createInstrumentation()` from 'typegpu/unstable-instrumentation'.");
			this.#instrumentation = instrumentation.attach(device, internals);
		}
	}
	get instrumentation() {
		return this.#instrumentation?.api;
	}
	configureContext(options) {
		const context = options.canvas.getContext("webgpu");
		if (!context) throw new Error("Unable to initialize 'webgpu' context on the provided canvas.");
		context.configure({
			...options,
			device: this.device,
			format: options.format ?? navigator.gpu.getPreferredCanvasFormat()
		});
		return context;
	}
	get enabledFeatures() {
		return new Set(this.device.features);
	}
	get minify() {
		return this[$soul].minify;
	}
	get enabledWgslLanguageFeatures() {
		return navigator.gpu?.wgslLanguageFeatures ?? /* @__PURE__ */ new Set();
	}
	createBuffer(typeSchema, initialOrBuffer) {
		return INTERNAL_createBuffer(this, typeSchema, initialOrBuffer);
	}
	createUniform(typeSchema, initialOrBuffer) {
		return new TgpuBufferBindingImpl("uniform", INTERNAL_createBuffer(this, typeSchema, initialOrBuffer).$usage("uniform"));
	}
	createMutable(typeSchema, initialOrBuffer) {
		return new TgpuBufferBindingImpl("mutable", INTERNAL_createBuffer(this, typeSchema, initialOrBuffer).$usage("storage"));
	}
	createReadonly(typeSchema, initialOrBuffer) {
		return new TgpuBufferBindingImpl("readonly", INTERNAL_createBuffer(this, typeSchema, initialOrBuffer).$usage("storage"));
	}
	createQuerySet(type, count, rawQuerySet) {
		return INTERNAL_createQuerySet(this, type, count, rawQuerySet);
	}
	createBindGroup(layout, entries) {
		return new TgpuBindGroupImpl(this, layout, entries);
	}
	destroy() {
		this.#instrumentation?.rootDestroyed(this.#ownDevice);
		clearTextureUtilsCache(this.device);
		if (this.#ownDevice) this.device.destroy();
	}
	createTexture(props) {
		return INTERNAL_createTexture(props, this);
	}
	createSampler(props) {
		return INTERNAL_createSampler(props, this);
	}
	createComparisonSampler(props) {
		return INTERNAL_createComparisonSampler(props, this);
	}
	unwrap(resource) {
		if (isTgpuCommandEncoder(resource)) return resource[$internal].rawEncoder;
		if (isTgpuRenderCommands(resource) || isTgpuComputePass(resource)) {
			resource[$internal].state.rawAccessed = true;
			return resource[$internal].rawPass;
		}
		if (isBindGroupLayout(resource)) return this.#unwrappedBindGroupLayouts.getOrMake(resource);
		if (isBindGroup(resource)) return this.#unwrappedBindGroups.getOrMake(resource);
		if (isBufferBinding(resource)) return resource.buffer.buffer;
		if (isTextureView(resource)) {
			if (!resource[$internal].unwrap) throw new Error("Cannot unwrap laid-out texture view as it has no underlying resource.");
			return resource[$internal].unwrap();
		}
		if (isVertexLayout(resource)) return resource.vertexLayout;
		const internals = resource[$internal];
		if (internals?.materialize) return internals.materialize();
		if (isSampler(resource) || isComparisonSampler(resource)) throw new Error("Cannot unwrap laid-out sampler.");
		throw new Error(`Unknown resource type: ${safeStringify(resource)}`);
	}
	createCommandEncoder(descriptor) {
		return INTERNAL_createCommandEncoder(this, descriptor);
	}
	createRenderBundleEncoder(descriptor) {
		return INTERNAL_createRenderBundleEncoder(this, descriptor);
	}
};
/**
* Requests a new GPU device and creates a root around it.
* If a specific device should be used instead, use @see initFromDevice.
*
* @example
* When given no options, the function will ask the browser for a suitable GPU device.
* ```ts
* const root = await tgpu.init();
* ```
*
* @example
* If there are specific options that should be used when requesting a device, you can pass those in.
* ```ts
* const adapterOptions: GPURequestAdapterOptions = ...;
* const deviceDescriptor: GPUDeviceDescriptor = ...;
* const root = await tgpu.init({ adapter: adapterOptions, device: deviceDescriptor });
* ```
*/
async function init(options) {
	const { adapter: adapterOpt, device: deviceOpt, unstable_names: names = "strict", unstable_minify: minify = false, unstable_logOptions: logOptions, unstable_shaderGeneratorClass: shaderGeneratorClass, unstable_instrumentation: instrumentation } = options ?? {};
	const { optionalFeatures, ...deviceDescriptor } = deviceOpt ?? {};
	if (!navigator.gpu) throw new Error("WebGPU is not supported by this browser.");
	const adapter = await navigator.gpu.requestAdapter(adapterOpt);
	if (!adapter) throw new Error("Could not find a compatible GPU");
	const availableFeatures = [];
	for (const feature of deviceDescriptor.requiredFeatures ?? []) {
		if (!adapter.features.has(feature)) throw new Error(`Requested feature "${feature}" is not supported by the adapter.`);
		availableFeatures.push(feature);
	}
	for (const feature of optionalFeatures ?? []) if (adapter.features.has(feature)) availableFeatures.push(feature);
	else logger.warn("webgpu-feature-missing", `Optional feature "${feature}" is not supported by the adapter.`);
	return new TgpuRootImpl(await adapter.requestDevice({
		...deviceDescriptor,
		requiredFeatures: availableFeatures
	}), names, minify, true, logOptions ?? {}, shaderGeneratorClass, instrumentation);
}
/**
* Creates a root from the given device, instead of requesting it like @see init.
*
* @example
* ```ts
* const device: GPUDevice = ...;
* const root = tgpu.initFromDevice({ device });
* ```
*/
function initFromDevice(options) {
	const { device, unstable_names: names = "strict", unstable_minify: minify = false, unstable_logOptions: logOptions, unstable_shaderGeneratorClass: shaderGeneratorClass, unstable_instrumentation: instrumentation } = options ?? {};
	return new TgpuRootImpl(device, names, minify, false, logOptions ?? {}, shaderGeneratorClass, instrumentation);
}
//#endregion
//#region src/data/assignInfixOperators.ts
var infixOperatorsAssigned = false;
function assignInfixOperators() {
	if (infixOperatorsAssigned) return;
	infixOperatorsAssigned = true;
	assignInfixOperator(VecBase, "add", Operator.plus);
	assignInfixOperator(MatBase, "add", Operator.plus);
	assignInfixOperator(VecBase, "sub", Operator.minus);
	assignInfixOperator(MatBase, "sub", Operator.minus);
	assignInfixOperator(VecBase, "mul", Operator.star);
	assignInfixOperator(MatBase, "mul", Operator.star);
	assignInfixOperator(VecBase, "div", Operator.slash);
	assignInfixOperator(VecBase, "mod", Operator.percent);
	assignInfixOperator(VecBase, "bitShiftLeft", Symbol());
	assignInfixOperator(VecBase, "bitShiftRight", Symbol());
}
assignInfixOperators();
assignInfixOperators();
assignInfixOperators();
assignInfixOperators();
assignInfixOperators();
assignInfixOperators();
assignInfixOperators();
assignInfixOperators();
assignInfixOperators();
assignInfixOperators();
assignInfixOperators();
var vec4f = (assignInfixOperators(), vec4f$1);
assignInfixOperators();
assignInfixOperators();
assignInfixOperators();
assignInfixOperators();
assignInfixOperators();
assignInfixOperators();
//#endregion
//#region src/core/function/tgpuFragmentFn.ts
/**
* Creates a shell of a typed entry function for the fragment shader stage. Any function
* that implements this shell can run for each fragment (pixel), allowing the inner code
* to process information received from the vertex shader stage and builtins to determine
* the final color of the pixel (many pixels in case of multiple targets).
*
* @param options.in
*  Values computed in the vertex stage and builtins to be made available to functions that implement this shell.
* @param options.out
*  A `vec4f`, signaling this function outputs a color for one target, or a record containing colors for multiple targets.
*/
function fragmentFn(options) {
	const shell = {
		in: options.in,
		out: options.out,
		returnType: createIoSchema(options.out),
		entryPoint: "fragment"
	};
	const call = (arg, ...values) => createFragmentFn(shell, stripTemplate(arg, ...values));
	return Object.assign(call, shell);
}
function createFragmentFn(shell, implementation) {
	const core = createFnCore(implementation, "fragment");
	const outputType = shell.returnType;
	if (typeof implementation === "string") addReturnTypeToExternals(implementation, outputType, core);
	return {
		shell,
		outputType,
		$uses(newExternals) {
			core.setExternals("userProvided", newExternals);
			return this;
		},
		[$internal]: true,
		[$getNameForward]: core,
		$name(newLabel) {
			setName(this, newLabel);
			if (isNamable(outputType)) outputType.$name(`${newLabel}_Output`);
			return this;
		},
		[$resolve](ctx) {
			assertIntegerVaryingsInterpolated(shell.in, `fragmentFn (${getName(this) ?? "<unnamed>"}) input`);
			const entryInput = separateBuiltins(shell.in ?? {}, ctx.varyingLocations ?? {});
			if (entryInput.dataSchema && isNamable(entryInput.dataSchema)) entryInput.dataSchema.$name(`${getName(this) ?? ""}_Input`);
			if (typeof implementation === "string") core.setExternals("out", { Out: outputType });
			return ctx.withSlots([[shaderStageSlot, "fragment"]], () => core.resolve(ctx, [], shell.returnType, entryInput));
		},
		toString() {
			return `fragmentFn:${getName(core) ?? "<unnamed>"}`;
		}
	};
}
//#endregion
//#region src/core/function/tgpuVertexFn.ts
/**
* Creates a shell of a typed entry function for the vertex shader stage. Any function
* that implements this shell can run for each vertex, allowing the inner code to process
* attributes and determine the final position of the vertex.
*
* @param options.in
*   Vertex attributes and builtins to be made available to functions that implement this shell.
* @param options.out
*   A record containing the final position of the vertex, and any information
*   passed onto the fragment shader stage.
*/
function vertexFn(options) {
	if (Object.keys(options.out).length === 0) throw new Error(`A vertexFn output cannot be empty since it must include the 'position' builtin.`);
	const shell = {
		in: options.in,
		out: options.out,
		argTypes: options.in && Object.keys(options.in).length !== 0 ? [createIoSchema(options.in)] : [],
		entryPoint: "vertex"
	};
	const call = (arg, ...values) => createVertexFn(shell, stripTemplate(arg, ...values));
	return Object.assign(call, shell);
}
function createVertexFn(shell, implementation) {
	const core = createFnCore(implementation, "vertex");
	const entryInput = separateAllAsPositional(shell.in ?? {});
	return {
		shell,
		$uses(newExternals) {
			core.setExternals("userProvided", newExternals);
			return this;
		},
		[$internal]: true,
		[$getNameForward]: core,
		$name(newLabel) {
			setName(this, newLabel);
			return this;
		},
		[$resolve](ctx) {
			assertIntegerVaryingsInterpolated(shell.out, `vertexFn (${getName(this) ?? "<unnamed>"}) output`);
			const outputWithLocation = createIoSchema(shell.out, ctx.varyingLocations).$name(`${getName(this) ?? ""}_Output`);
			if (typeof implementation === "string") core.setExternals("out", { Out: outputWithLocation });
			return ctx.withSlots([[shaderStageSlot, "vertex"]], () => core.resolve(ctx, [], outputWithLocation, entryInput));
		},
		toString() {
			return `vertexFn:${getName(core) ?? "<unnamed>"}`;
		}
	};
}
//#endregion
//#region tests/instrumentation/examples/compute-scale.ts
var layout$2 = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(bindGroupLayout({
	data: {
		storage: arrayOf(f32, 8),
		access: "mutable"
	},
	factor: { uniform: f32 }
}), "layout");
var scale$2 = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(computeFn({
	workgroupSize: [8],
	in: { gid: builtin.globalInvocationId }
})(/* @__PURE__ */ (($) => (globalThis.__TYPEGPU_META__ ??= /* @__PURE__ */ new WeakMap()).set($.f = (({ gid }) => {
	"use gpu";
	layout$2.$.data[gid.x] = __tsover_mul(layout$2.$.data[gid.x], layout$2.$.factor);
}), {
	v: 2,
	name: void 0,
	ast: {
		"params": [{
			"type": "d",
			"props": [{
				"name": "gid",
				"alias": "gid"
			}]
		}],
		"body": [0, [[
			2,
			[
				8,
				[
					7,
					[
						7,
						"layout",
						"$"
					],
					"data"
				],
				[
					7,
					"gid",
					"x"
				]
			],
			"=",
			[
				1,
				[
					8,
					[
						7,
						[
							7,
							"layout",
							"$"
						],
						"data"
					],
					[
						7,
						"gid",
						"x"
					]
				],
				"*",
				[
					7,
					[
						7,
						"layout",
						"$"
					],
					"factor"
				]
			]
		]]]
	},
	externals: { "layout": () => layout$2 }
}) && $.f)({})), "scale");
/**
* An ordinary TypeGPU program. It does not know about instrumentation: whoever runs it
* (real-gpu/run.mjs --example) creates the root with instrumentation switched on.
*/
async function scenario(root) {
	const data = root.createBuffer(arrayOf(f32, 8), [
		1,
		2,
		3,
		4,
		5,
		6,
		7,
		8
	]).$usage("storage").$name("data");
	const factor = root.createBuffer(f32).$usage("uniform").$name("factor");
	const bindGroup = root.createBindGroup(layout$2, {
		data,
		factor
	});
	const pipeline = root.createComputePipeline({ compute: scale$2 }).$name("scale");
	factor.write(3);
	pipeline.with(bindGroup).dispatchWorkgroups(1);
	console.log(`result after x3: ${JSON.stringify(await data.read())}`);
	factor.write(10);
	pipeline.with(bindGroup).dispatchWorkgroups(1);
	console.log(`result after x10: ${JSON.stringify(await data.read())}`);
	data.destroy();
}
//#endregion
//#region tests/instrumentation/consumers/textReport.ts
var name = (label, id) => `${label ?? "<unnamed>"}#${id}`;
function formatEvent(e) {
	const head = `[${String(e.seq).padStart(3, "0")}]`;
	switch (e.type) {
		case "resource-materialized": return `${head} ${e.resource} ${name(e.label, e.id)} materialized` + (e.resource === "buffer" ? ` (${e.sizeBytes} B)` : ` (${e.format} ${e.size.join("x")})`);
		case "resource-destroyed": return `${head} ${e.resource} ${name(e.label, e.id)} destroyed`;
		case "bind-group-created": {
			const entries = e.entries.map((x) => `${x.name}=${x.resourceId === null ? "?" : `#${x.resourceId}`}`).join(", ");
			return `${head} bind group #${e.id} of layout ${e.label ?? "<unnamed>"}#${e.layoutId} (${e.origin}) { ${entries} }`;
		}
		case "pipeline-created": return `${head} ${e.pipeline} pipeline ${name(e.label, e.id)} ${e.trigger === "initAsync" ? "compiled" : "created"} [${e.trigger}] resolve ${e.resolveMs.toFixed(2)} ms (CPU), create ${e.createMs.toFixed(2)} ms (CPU), ${e.wgslLength} chars of WGSL`;
		case "pipeline-creation-failed": return `${head} ${e.pipeline} pipeline ${name(e.label, e.id)} creation FAILED [${e.trigger}, ${e.phase}] ${e.errorType}: ${failureText(e.phase, e.message)}` + (e.wgslLength > 0 ? ` (${e.wgslLength} chars of WGSL)` : "");
		case "shader-diagnostics": return e.messages.length === 0 ? `${head} pipeline #${e.pipelineId} shader: no compiler messages` : `${head} pipeline #${e.pipelineId} shader: ` + e.messages.map((m) => `${m.type} at WGSL ${m.lineNum}:${m.linePos}: ${m.message}`).join("; ");
		case "device-error": return `${head} DEVICE ERROR ${e.errorType}: ${e.message.split("\n")[0]}`;
		case "device-lost": return `${head} DEVICE LOST (${e.reason}): ${e.message}`;
		case "root-destroyed": return `${head} root destroyed (own device: ${e.ownDevice}), still alive: ${e.liveBuffers} buffers, ${e.liveTextures} textures`;
	}
}
/**
* A resolution error lists the failing tree one level per line, and the cause is on the last line, so all lines
* matter; an async creation error is a browser message whose first line is its summary.
*/
function failureText(phase, message) {
	const lines = message.split("\n").filter((line) => line.trim() !== "");
	const text = phase === "resolve" ? lines.map((l) => l.replace(/^- /, "")).join(" > ") : lines[0] ?? "";
	return text.length > 300 ? `${text.slice(0, 297)}...` : text;
}
/** Names that occur on at least this many live objects are called out: they are what a leak or per-frame creation looks like. */
var REPEATED_NAME_THRESHOLD = 3;
function repeatedNames(items) {
	const counts = /* @__PURE__ */ new Map();
	for (const { label } of items) if (label !== null) counts.set(label, (counts.get(label) ?? 0) + 1);
	return [...counts].filter(([, n]) => n >= REPEATED_NAME_THRESHOLD);
}
function formatSnapshot(s) {
	const lines = [`${s.resources.length} live resources, ${s.pipelines.length} pipelines, ${s.bindGroups.length} bind groups`];
	for (const r of s.resources) lines.push(`  ${r.resource} ${name(r.label, r.id)}` + (r.writes === null ? "" : `: ${r.writes} writes, ${r.bytesWritten} B written`));
	for (const p of s.pipelines) lines.push(`  ${p.pipeline} pipeline ${name(p.label, p.id)}: ${p.dispatches} dispatches, ${p.draws} draws`);
	for (const [label, n] of repeatedNames(s.pipelines)) lines.push(`  note: ${n} live pipelines are named '${label}': created repeatedly (each creation costs CPU)?`);
	for (const [label, n] of repeatedNames(s.resources)) lines.push(`  note: ${n} live resources are named '${label}': created repeatedly and never destroyed?`);
	if (s.retainedFailures.length > 0) lines.push(`  ${s.retainedFailures.length} retained failure(s), most recent: ${s.retainedFailures.at(-1)?.type}`);
	lines.push(`  submits via TypeGPU encoders: ${s.counters.submits}`);
	lines.push(`  not available: ${s.unavailable.join(", ")}`);
	return lines;
}
//#endregion
//#region tests/instrumentation/consumers/consoleReporter.ts
function attachConsoleReporter(source, options = {}) {
	const { log = (line) => console.log(line), prefix = "", replayHistory = true } = options;
	const print = (line) => log(`${prefix}${line}`);
	if (replayHistory) for (const event of source.history()) print(formatEvent(event));
	return {
		printSnapshot() {
			for (const line of formatSnapshot(source.getSnapshot())) print(line);
		},
		dispose: source.subscribe((event) => print(formatEvent(event)))
	};
}
//#endregion
//#region tests/instrumentation/consumers/jsonlExport.ts
var JSONL_FORMAT = "typegpu-instrumentation-jsonl";
function createJsonlExport(source) {
	const lines = [JSON.stringify({
		record: "header",
		format: JSONL_FORMAT,
		version: 1,
		eventSchema: 2
	})];
	let lastSeq = 0;
	const addEvent = (event) => {
		lastSeq = event.seq;
		lines.push(JSON.stringify({
			record: "event",
			event
		}));
	};
	for (const event of source.history()) addEvent(event);
	return {
		addSnapshot() {
			lines.push(JSON.stringify({
				record: "snapshot",
				afterSeq: lastSeq,
				snapshot: source.getSnapshot()
			}));
		},
		lines: () => [...lines],
		toString: () => `${lines.join("\n")}\n`,
		dispose: source.subscribe(addEvent)
	};
}
//#endregion
//#region tests/instrumentation/consumers/requireInstrumentation.ts
/**
* Returns the root's instrumentation, or explains why there is none. A TypeGPU build without the hook patch
* accepts `unstable_instrumentation` and silently ignores it; asking for the data then must not look like
* "nothing happened".
*/
function requireInstrumentation(root) {
	const instrumentation = root["~unstable"].instrumentation;
	if (instrumentation === void 0) throw new Error("root['~unstable'].instrumentation is undefined. Either the root was created without `unstable_instrumentation`, or this TypeGPU build has no instrumentation hooks (the patch in patches/ is not applied; run scripts/setup.sh).");
	return instrumentation;
}
//#endregion
//#region tests/instrumentation/real-gpu-page/provenance.ts
var forceFallback = typeof location !== "undefined" && new URLSearchParams(location.search).has("forceFallback");
var fallbackNeeded = false;
if (forceFallback && typeof navigator !== "undefined" && navigator.gpu) {
	const gpu = navigator.gpu;
	const original = gpu.requestAdapter.bind(gpu);
	gpu.requestAdapter = async (options) => {
		const adapter = await original(options);
		if (adapter) return adapter;
		fallbackNeeded = true;
		return original({
			...options,
			forceFallbackAdapter: true
		});
	};
}
/** What the page can tell about the adapter it got. The driver cross-checks it against the browser's GPU process. */
async function provenance() {
	const gpu = navigator.gpu;
	if (!gpu) return {
		pageClassification: "unavailable",
		reason: "navigator.gpu is undefined"
	};
	const adapter = await gpu.requestAdapter();
	if (!adapter) return {
		pageClassification: "unavailable",
		reason: "requestAdapter() returned null"
	};
	const info = adapter.info;
	const isFallbackAdapter = info.isFallbackAdapter ?? adapter.isFallbackAdapter;
	const identity = `${info.vendor} ${info.architecture} ${info.device} ${info.description}`;
	return {
		pageClassification: (isFallbackAdapter ?? false) || /swiftshader|llvmpipe|lavapipe|software|warp|mesa/i.test(identity) ? "software" : typeof isFallbackAdapter === "boolean" ? "non-fallback" : "fallback-status-unreported",
		userAgent: navigator.userAgent,
		adapterRequest: forceFallback ? fallbackNeeded ? "forceFallbackAdapter (default request returned null)" : "default (forceFallback shim active, not needed)" : "default",
		vendor: info.vendor,
		architecture: info.architecture,
		device: info.device,
		description: info.description,
		isFallbackAdapter: isFallbackAdapter ?? null,
		features: [...adapter.features].toSorted()
	};
}
//#endregion
//#region tests/instrumentation/real-gpu-page/example.ts
/**
* Runs a user scenario (`export default async (root) => …`) on a real device with instrumentation on,
* prints the events through the console reporter and returns the JSONL lines for the driver to write.
* Registered as `window.runExample` by main.ts; used by `real-gpu/run.mjs --example`.
*/
var REPORT_PREFIX = "[typegpu-instrumentation] ";
var sleep$2 = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
async function runExample() {
	const prov = await provenance();
	if (prov.pageClassification === "unavailable") return {
		provenance: prov,
		jsonl: [],
		error: null
	};
	const root = await init({ unstable_instrumentation: createInstrumentation({ historySize: 512 }) });
	const instrumentation = requireInstrumentation(root);
	const reporter = attachConsoleReporter(instrumentation, { log: (line) => console.log(`${REPORT_PREFIX}${line}`) });
	const exported = createJsonlExport(instrumentation);
	let error = null;
	try {
		await scenario(root);
		await root.device.queue.onSubmittedWorkDone();
		await sleep$2(150);
	} catch (caught) {
		error = `${caught.name}: ${caught.message}`;
	}
	reporter.printSnapshot();
	exported.addSnapshot();
	root.destroy();
	for (let i = 0; i < 40 && !instrumentation.history().some((e) => e.type === "device-lost"); i++) await sleep$2(50);
	reporter.dispose();
	exported.dispose();
	return {
		provenance: prov,
		jsonl: exported.lines(),
		error
	};
}
/**
* Control run: the same scenario on a plain TypeGPU root, no instrumentation option, no reporter. It shows what the
* developer sees without the layer: what the scenario itself reports, plus (through the driver's CDP console
* capture, `browserConsole` in the output) what the browser prints.
*/
async function runExampleControl() {
	const prov = await provenance();
	if (prov.pageClassification === "unavailable") return {
		provenance: prov,
		report: [],
		error: null
	};
	const root = await init();
	const report = [];
	const originalLog = console.log;
	console.log = (...parts) => {
		report.push(`[scenario] ${parts.map(String).join(" ")}`);
		originalLog(...parts);
	};
	let error = null;
	try {
		await scenario(root);
		await root.device.queue.onSubmittedWorkDone();
		await sleep$2(150);
	} catch (caught) {
		error = `${caught.name}: ${caught.message}`;
	} finally {
		console.log = originalLog;
	}
	report.push(`[control] instrumentation option: not passed; scenario threw: ${error ?? "nothing"}`);
	root.destroy();
	await sleep$2(100);
	return {
		provenance: prov,
		report,
		error
	};
}
//#endregion
//#region tests/instrumentation/real-gpu-page/viability.ts
/**
* Viability gate: representative workloads on a real device, each with the events it MUST produce
* (derived from reading the hook sites, written down before looking at the output), checked against
* three independent views of the same stream: the live subscription, the console reporter's lines and
* the JSONL export. Generic invariants (ordering, duplicates, referential integrity, counters) run on
* every scenario.
*
* A scenario only appears here if it can actually be triggered and observed on this device.
*/
async function sleep$1(ms) {
	const end = performance.now() + ms;
	const channel = new MessageChannel();
	while (performance.now() < end) await new Promise((resolve) => {
		channel.port1.onmessage = () => resolve();
		channel.port2.postMessage(null);
	});
	channel.port1.close();
}
var ofType$1 = (events, type) => events.filter((e) => e.type === type);
var types = (events) => events.map((e) => e.type);
var same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
var findings = [];
var evidence = {};
var skipped = [];
/** Objects a scenario wants to stay alive until the checks have run. */
var retained = [];
var current = "";
var check = (name, pass, detail) => findings.push({
	scenario: current,
	check: name,
	pass,
	detail
});
var layout$1 = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(bindGroupLayout({
	data: {
		storage: arrayOf(f32, 8),
		access: "mutable"
	},
	factor: { uniform: f32 }
}), "layout");
var scale$1 = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(computeFn({
	workgroupSize: [8],
	in: { gid: builtin.globalInvocationId }
})(/* @__PURE__ */ (($) => (globalThis.__TYPEGPU_META__ ??= /* @__PURE__ */ new WeakMap()).set($.f = (({ gid }) => {
	"use gpu";
	layout$1.$.data[gid.x] = __tsover_mul(layout$1.$.data[gid.x], layout$1.$.factor);
}), {
	v: 2,
	name: void 0,
	ast: {
		"params": [{
			"type": "d",
			"props": [{
				"name": "gid",
				"alias": "gid"
			}]
		}],
		"body": [0, [[
			2,
			[
				8,
				[
					7,
					[
						7,
						"layout",
						"$"
					],
					"data"
				],
				[
					7,
					"gid",
					"x"
				]
			],
			"=",
			[
				1,
				[
					8,
					[
						7,
						[
							7,
							"layout",
							"$"
						],
						"data"
					],
					[
						7,
						"gid",
						"x"
					]
				],
				"*",
				[
					7,
					[
						7,
						"layout",
						"$"
					],
					"factor"
				]
			]
		]]]
	},
	externals: { "layout": () => layout$1 }
}) && $.f)({})), "scale");
var noop = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(computeFn({ workgroupSize: [1] })`{}`, "noop");
var vertexFull = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(vertexFn({
	in: { idx: builtin.vertexIndex },
	out: { pos: builtin.position }
})(/* @__PURE__ */ (($) => (globalThis.__TYPEGPU_META__ ??= /* @__PURE__ */ new WeakMap()).set($.f = (({ idx }) => {
	"use gpu";
	return { pos: vec4f(__tsover_sub(__tsover_mul(f32(idx & 1), 4), 1), __tsover_sub(__tsover_mul(f32(idx >> 1), 4), 1), 0, 1) };
}), {
	v: 2,
	name: void 0,
	ast: {
		"params": [{
			"type": "d",
			"props": [{
				"name": "idx",
				"alias": "idx"
			}]
		}],
		"body": [0, [
			[
				13,
				"x",
				[
					1,
					[
						1,
						[
							6,
							"d.f32",
							[[
								1,
								"idx",
								"&",
								[5, "1"]
							]]
						],
						"*",
						[5, "4"]
					],
					"-",
					[5, "1"]
				]
			],
			[
				13,
				"y",
				[
					1,
					[
						1,
						[
							6,
							"d.f32",
							[[
								1,
								"idx",
								">>",
								[5, "1"]
							]]
						],
						"*",
						[5, "4"]
					],
					"-",
					[5, "1"]
				]
			],
			[10, [104, { "pos": [
				6,
				"d.vec4f",
				[
					"x",
					"y",
					[5, "0"],
					[5, "1"]
				]
			] }]]
		]]
	},
	externals: {
		"d.f32": () => f32,
		"d.vec4f": () => vec4f
	}
}) && $.f)({})), "vertexFull");
var fragmentRed = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fragmentFn({ out: vec4f })(/* @__PURE__ */ (($) => (globalThis.__TYPEGPU_META__ ??= /* @__PURE__ */ new WeakMap()).set($.f = (() => {
	"use gpu";
	return vec4f(1, 0, 0, 1);
}), {
	v: 2,
	name: void 0,
	ast: {
		"params": [],
		"body": [0, [[10, [
			6,
			"d.vec4f",
			[
				[5, "1"],
				[5, "0"],
				[5, "0"],
				[5, "1"]
			]
		]]]]
	},
	externals: { "d.vec4f": () => vec4f }
}) && $.f)({})), "fragmentRed");
var brokenCompute = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(computeFn({ workgroupSize: [1] })`{ let x = definitelyUndeclared(1.0); }`, "brokenCompute");
var brokenFragment = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fragmentFn({ out: vec4f })`{ return definitelyUndeclared; }`, "brokenFragment");
async function execute(body, historySize = 1024) {
	const root = await init({ unstable_instrumentation: createInstrumentation({ historySize }) });
	const inst = root["~unstable"].instrumentation;
	if (!inst) throw new Error("instrumentation missing");
	const events = [];
	inst.subscribe((e) => events.push(e));
	const consoleLines = [];
	const reporter = attachConsoleReporter(inst, { log: (line) => consoleLines.push(line) });
	const exported = createJsonlExport(inst);
	const kept = [];
	const notes = {};
	await body({
		root,
		inst,
		keep: (...o) => kept.push(...o),
		note: (k, v) => notes[k] = v
	});
	await root.device.queue.onSubmittedWorkDone();
	await sleep$1(200);
	const snapshot = inst.getSnapshot();
	exported.addSnapshot();
	kept.length;
	root.destroy();
	for (let i = 0; i < 40 && !events.some((e) => e.type === "device-lost"); i++) await sleep$1(50);
	reporter.dispose();
	exported.dispose();
	evidence[current] = {
		consoleLines: consoleLines.slice(0, 80),
		jsonl: exported.lines().slice(0, 80),
		snapshot,
		notes,
		eventCount: events.length
	};
	return {
		events,
		consoleLines,
		jsonl: exported.lines(),
		snapshot,
		inst,
		notes
	};
}
/** Invariants that must hold for any scenario. */
function invariants(run) {
	const { events } = run;
	check("seq is contiguous from 1", events.every((e, i) => e.seq === i + 1));
	check("t never decreases", events.every((e, i) => i === 0 || e.t >= events[i - 1].t));
	const materialized = ofType$1(events, "resource-materialized");
	check("no resource materialized twice", !(materialized.length !== new Set(materialized.map((m) => m.id)).size));
	const destroyed = ofType$1(events, "resource-destroyed");
	check("no resource destroyed twice", destroyed.length === new Set(destroyed.map((x) => x.id)).size);
	check("every destroy follows a materialize of the same resource, type and label", destroyed.every((x) => {
		const m = materialized.find((y) => y.id === x.id);
		return m !== void 0 && m.resource === x.resource && m.label === x.label && m.seq < x.seq;
	}));
	const compiled = ofType$1(events, "pipeline-created");
	const failed = ofType$1(events, "pipeline-creation-failed");
	const pipelineIds = [...compiled.map((c) => c.id), ...failed.map((f) => f.id)];
	check("no pipeline reported twice", pipelineIds.length === new Set(pipelineIds).size, pipelineIds);
	check("pipeline WGSL is non-empty and has a stage entry point", [...compiled, ...failed].every((p) => /@(compute|vertex|fragment)/.test(p.wgsl ?? "")));
	const groups = ofType$1(events, "bind-group-created");
	check("bind group entries refer to resources materialized EARLIER (or are explicitly unknown)", groups.every((g) => g.entries.every((e) => e.resourceId === null || materialized.some((m) => m.id === e.resourceId && m.seq < g.seq))));
	const layoutIds = new Set(compiled.flatMap((c) => c.layoutIds));
	check("a bind group used by a compiled pipeline shares its layout id", groups.every((g) => layoutIds.size === 0 || layoutIds.has(g.layoutId)), {
		groups: groups.map((g) => g.layoutId),
		pipelines: [...layoutIds]
	});
	check("shader-diagnostics refer to an earlier compiled/failed pipeline", ofType$1(events, "shader-diagnostics").every((x) => [...compiled, ...failed].some((p) => p.id === x.pipelineId && p.seq < x.seq)));
	const records = run.jsonl.map((l) => JSON.parse(l));
	check("JSONL starts with the header", records[0]?.record === "header");
	check("JSONL events are exactly the emitted events", same(records.filter((r) => r.record === "event").map((r) => r.event), events));
	check("JSONL has one snapshot record", records.filter((r) => r.record === "snapshot").length === 1);
	const lineSeqs = run.consoleLines.map((l) => /^\[(\d+)\] /.exec(l)?.[1]).filter((s) => s !== void 0).map(Number);
	check("console reporter printed exactly one line per event, in order", same(lineSeqs, events.map((e) => e.seq)), {
		lines: lineSeqs.length,
		events: events.length
	});
}
function expectTypes(run, expected) {
	check("exact event sequence", same(types(run.events), expected), {
		expected,
		actual: types(run.events)
	});
}
async function resources() {
	current = "resources";
	const run = await execute(async ({ root, note }) => {
		const buf = root.createBuffer(arrayOf(u32, 4)).$usage("storage").$name("buf");
		buf.write([
			1,
			2,
			3,
			4
		]);
		const tex = root.createTexture({
			size: [8, 8],
			format: "rgba8unorm"
		}).$usage("sampled", "render").$name("tex");
		root.unwrap(tex);
		const keep = root.createBuffer(f32).$usage("uniform").$name("keep");
		root.unwrap(keep);
		retained.push(keep);
		buf.destroy();
		buf.destroy();
		tex.destroy();
		let threw = false;
		try {
			buf.write([
				9,
				9,
				9,
				9
			]);
		} catch {
			threw = true;
		}
		note("writeAfterDestroyThrew", threw);
	});
	invariants(run);
	expectTypes(run, [
		"resource-materialized",
		"resource-materialized",
		"resource-materialized",
		"resource-destroyed",
		"resource-destroyed",
		"root-destroyed",
		"device-lost"
	]);
	const [m0, m1, m2] = ofType$1(run.events, "resource-materialized");
	check("buffer payload: label, size, usage flags", m0?.resource === "buffer" && m0.label === "buf" && m0.sizeBytes === 16 && m0.usage === (GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC), m0);
	check("texture payload: label, format, size, mips, samples, dimension, usage flags", m1?.resource === "texture" && m1.label === "tex" && m1.format === "rgba8unorm" && same(m1.size, [8, 8]) && m1.mipLevelCount === 1 && m1.sampleCount === 1 && m1.dimension === "2d" && m1.usage === (GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC), m1);
	const destroyed = ofType$1(run.events, "resource-destroyed");
	check("destroy events name the right resources, once each", destroyed[0]?.id === m0?.id && destroyed[1]?.id === m1?.id, destroyed);
	const gone = ofType$1(run.events, "root-destroyed")[0];
	check("root-destroyed lists exactly the survivor", gone?.liveBuffers === 1 && gone.liveTextures === 0 && gone.ownDevice, gone);
	check("snapshot before teardown lists only the survivor", run.snapshot.resources.length === 1 && run.snapshot.resources[0]?.id === m2?.id, run.snapshot.resources);
	check("writing to a destroyed buffer throws and emits nothing", run.notes.writeAfterDestroyThrew === true);
}
async function computeBindGroups() {
	current = "compute-bindgroups";
	const ids = {};
	const run = await execute(async ({ root, keep, note }) => {
		const data1 = root.createBuffer(arrayOf(f32, 8), [
			1,
			2,
			3,
			4,
			5,
			6,
			7,
			8
		]).$usage("storage").$name("data1");
		const data2 = root.createBuffer(arrayOf(f32, 8), [
			1,
			2,
			3,
			4,
			5,
			6,
			7,
			8
		]).$usage("storage").$name("data2");
		const factor = root.createBuffer(f32, 2).$usage("uniform").$name("factor");
		const bg1 = root.createBindGroup(layout$1, {
			data: data1,
			factor
		});
		const bg2 = root.createBindGroup(layout$1, {
			data: data2,
			factor
		});
		const pipeline = root.createComputePipeline({ compute: scale$1 }).$name("scale");
		keep(data1, data2, factor, bg1, bg2, pipeline);
		for (let i = 0; i < 3; i++) pipeline.with(bg1).dispatchWorkgroups(1);
		for (let i = 0; i < 2; i++) pipeline.with(bg2).dispatchWorkgroups(1);
		note("data1", await data1.read());
		note("data2", await data2.read());
		ids.done = true;
	});
	invariants(run);
	expectTypes(run, [
		"pipeline-created",
		"resource-materialized",
		"resource-materialized",
		"bind-group-created",
		"resource-materialized",
		"bind-group-created",
		"shader-diagnostics",
		"root-destroyed",
		"device-lost"
	]);
	check("the GPU really ran every dispatch (x2 three times / twice)", same(run.notes.data1, [
		8,
		16,
		24,
		32,
		40,
		48,
		56,
		64
	]) && same(run.notes.data2, [
		4,
		8,
		12,
		16,
		20,
		24,
		28,
		32
	]), {
		data1: run.notes.data1,
		data2: run.notes.data2
	});
	const [compiled] = ofType$1(run.events, "pipeline-created");
	check("one lazy compile for five dispatches over two handles", ofType$1(run.events, "pipeline-created").length === 1 && compiled?.trigger === "lazy" && compiled.label === "scale", compiled && {
		...compiled,
		wgsl: void 0
	});
	const mats = ofType$1(run.events, "resource-materialized");
	const [g1, g2] = ofType$1(run.events, "bind-group-created");
	check("bind group 1 maps data->data1 and factor->factor", same(g1?.entries, [{
		name: "data",
		kind: "buffer",
		resourceId: mats[0]?.id
	}, {
		name: "factor",
		kind: "buffer",
		resourceId: mats[1]?.id
	}]), g1?.entries);
	check("bind group 2 maps data->data2 and the SAME factor id", same(g2?.entries, [{
		name: "data",
		kind: "buffer",
		resourceId: mats[2]?.id
	}, {
		name: "factor",
		kind: "buffer",
		resourceId: mats[1]?.id
	}]), g2?.entries);
	check("both groups share one layout id, equal to the pipeline layout", g1?.layoutId === g2?.layoutId && same(compiled?.layoutIds, [g1?.layoutId]));
	const p = run.snapshot.pipelines[0];
	check("counters: 5 dispatches, 5 submits (read() submits are not counted by design)", run.snapshot.pipelines.length === 1 && p?.dispatches === 5 && p.draws === 0 && run.snapshot.counters.submits === 5, {
		pipeline: p && {
			...p,
			wgsl: void 0
		},
		counters: run.snapshot.counters
	});
	check("snapshot: 3 buffers, 2 bind groups", run.snapshot.resources.length === 3 && run.snapshot.bindGroups.length === 2);
}
async function render() {
	current = "render";
	const run = await execute(async ({ root, keep, note }) => {
		const target = root.createTexture({
			size: [8, 8],
			format: "rgba8unorm"
		}).$usage("render").$name("target");
		const pipeline = root.createRenderPipeline({
			vertex: vertexFull,
			fragment: fragmentRed,
			targets: { format: "rgba8unorm" }
		}).$name("triangle");
		keep(target, pipeline);
		const a = pipeline.withColorAttachment({
			view: target,
			loadOp: "clear",
			storeOp: "store"
		});
		const b = pipeline.withColorAttachment({
			view: target,
			loadOp: "load",
			storeOp: "store"
		});
		a.draw(3);
		a.draw(3);
		b.draw(3);
		const device = root.device;
		const readback = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(device.createBuffer({
			size: 256 * 8,
			usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ
		}), "readback");
		const encoder = device.createCommandEncoder();
		encoder.copyTextureToBuffer({ texture: root.unwrap(target) }, {
			buffer: readback,
			bytesPerRow: 256
		}, [
			8,
			8,
			1
		]);
		device.queue.submit([encoder.finish()]);
		await readback.mapAsync(GPUMapMode.READ);
		note("pixel", [...new Uint8Array(readback.getMappedRange(0, 4))]);
		readback.destroy();
	});
	invariants(run);
	expectTypes(run, [
		"pipeline-created",
		"resource-materialized",
		"shader-diagnostics",
		"root-destroyed",
		"device-lost"
	]);
	check("the draw produced red pixels", same(run.notes.pixel, [
		255,
		0,
		0,
		255
	]), run.notes.pixel);
	const compiled = ofType$1(run.events, "pipeline-created")[0];
	check("render pipeline compiled once, lazily, with vertex and fragment stages", compiled?.pipeline === "render" && compiled.trigger === "lazy" && /@vertex/.test(compiled.wgsl ?? "") && /@fragment/.test(compiled.wgsl ?? ""));
	const p = run.snapshot.pipelines[0];
	check("counters: 3 draws over two handles, 3 submits", p?.draws === 3 && p.dispatches === 0 && run.snapshot.counters.submits === 3, {
		draws: p?.draws,
		submits: run.snapshot.counters.submits
	});
}
async function explicitInit() {
	current = "explicit-init";
	const run = await execute(async ({ root, keep }) => {
		const compute = root.createComputePipeline({ compute: noop }).$name("explicitSync");
		compute.initSync();
		const target = root.createTexture({
			size: [4, 4],
			format: "rgba8unorm"
		}).$usage("render").$name("t");
		const renderPipeline = root.createRenderPipeline({
			vertex: vertexFull,
			fragment: fragmentRed,
			targets: { format: "rgba8unorm" }
		}).$name("explicitAsync");
		await renderPipeline.initAsync();
		keep(compute, renderPipeline, target);
		compute.dispatchWorkgroups(1);
		renderPipeline.withColorAttachment({
			view: target,
			loadOp: "clear",
			storeOp: "store"
		}).draw(3);
	});
	invariants(run);
	const compiled = ofType$1(run.events, "pipeline-created");
	check("exactly two compiles, with the explicit triggers, in call order", same(compiled.map((c) => c.trigger), ["initSync", "initAsync"]) && compiled[0]?.pipeline === "compute" && compiled[1]?.pipeline === "render", compiled.map((c) => [c.pipeline, c.trigger]));
	check("dispatch/draw after explicit init did not compile again", compiled.length === 2);
	check("counters: 1 dispatch, 1 draw", run.snapshot.pipelines.length === 2 && run.snapshot.pipelines.map((p) => p.dispatches + p.draws).every((n) => n === 1));
	check("every compile got its diagnostics", ofType$1(run.events, "shader-diagnostics").length === 2);
}
async function syncFailures() {
	current = "sync-failures";
	const run = await execute(async ({ root, keep }) => {
		const c = root.createComputePipeline({ compute: brokenCompute }).$name("brokenCompute");
		c.initSync();
		await root.device.queue.onSubmittedWorkDone();
		await sleep$1(100);
		const r = root.createRenderPipeline({
			vertex: vertexFull,
			fragment: brokenFragment,
			targets: { format: "rgba8unorm" }
		}).$name("brokenRender");
		r.initSync();
		keep(c, r);
	});
	invariants(run);
	const compiled = ofType$1(run.events, "pipeline-created");
	const diags = ofType$1(run.events, "shader-diagnostics");
	const errors = ofType$1(run.events, "device-error");
	check("both invalid pipelines are reported as compiled (by design: sync creation cannot know) ...", compiled.length === 2 && compiled.every((c) => c.trigger === "initSync"));
	check("... and each has a compiler ERROR pointing at the offending generated line", compiled.every((c) => {
		return diags.find((x) => x.pipelineId === c.id)?.messages.some((m) => m.type === "error" && ((c.wgsl ?? "").split("\n")[m.lineNum - 1] ?? "").includes("definitelyUndeclared")) === true;
	}), diags.map((x) => x.messages));
	check("no pipeline-creation-failed on the sync path", ofType$1(run.events, "pipeline-creation-failed").length === 0);
	run.notes.deviceErrorNamesIdentifier = errors.some((e) => e.message.includes("definitelyUndeclared"));
	run.notes.deviceErrorCount = errors.length;
	check("snapshot still lists both pipelines (they are \"live\" objects, whatever their validity)", run.snapshot.pipelines.length === 2);
}
async function asyncFailures() {
	current = "async-failures";
	const run = await execute(async ({ root, note }) => {
		const rejections = [];
		try {
			await root.createComputePipeline({ compute: brokenCompute }).$name("asyncCompute").initAsync();
		} catch (e) {
			rejections.push(e.constructor.name);
		}
		try {
			await root.createRenderPipeline({
				vertex: vertexFull,
				fragment: brokenFragment,
				targets: { format: "rgba8unorm" }
			}).$name("asyncRender").initAsync();
		} catch (e) {
			rejections.push(e.constructor.name);
		}
		note("rejections", rejections);
	});
	invariants(run);
	check("both creations rejected with GPUPipelineError", same(run.notes.rejections, ["GPUPipelineError", "GPUPipelineError"]), run.notes.rejections);
	const failed = ofType$1(run.events, "pipeline-creation-failed");
	check("one pipeline-creation-failed per failure, compute then render", failed.length === 2 && same(failed.map((f) => f.pipeline), ["compute", "render"]) && failed.every((f) => f.trigger === "initAsync" && f.errorType === "GPUPipelineError"), failed.map((f) => ({
		...f,
		wgsl: void 0
	})));
	check("no pipeline-created event for a failed async creation", ofType$1(run.events, "pipeline-created").length === 0);
	const diags = ofType$1(run.events, "shader-diagnostics");
	check("each failure has compiler diagnostics with an error at the bad line", failed.every((f) => diags.some((x) => x.pipelineId === f.id && x.messages.some((m) => m.type === "error" && ((f.wgsl ?? "").split("\n")[m.lineNum - 1] ?? "").includes("definitelyUndeclared")))));
	check("failed pipelines are not listed as live", run.snapshot.pipelines.length === 0);
	check("device errors were also reported", ofType$1(run.events, "device-error").length >= 1);
}
async function lifecycle() {
	current = "lifecycle";
	const ITER = 2e3;
	const HISTORY = 64;
	let a = 0;
	let b = 0;
	let c = 0;
	const run = await execute(async ({ root, inst, note }) => {
		inst.subscribe(() => a++);
		const offB = inst.subscribe(() => {
			b++;
			if (b === 100) offB();
		});
		inst.subscribe(() => {
			c++;
			throw new Error("consumer bug");
		});
		for (let i = 0; i < ITER; i++) {
			const buf = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(root.createBuffer(f32).$usage("uniform"), "buf");
			root.unwrap(buf);
			buf.destroy();
		}
		note("afterLoop", {
			history: inst.history().length,
			snapshot: inst.getSnapshot().counters
		});
		const seqBeforeDisable = inst.history().at(-1)?.seq;
		inst.disable();
		const aBefore = a;
		const historyBefore = inst.history();
		for (let i = 0; i < 100; i++) {
			const buf = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(root.createBuffer(f32).$usage("uniform"), "buf");
			root.unwrap(buf);
			buf.destroy();
		}
		note("disabled", {
			listenerCalls: a - aBefore,
			historyUnchanged: same(inst.history(), historyBefore),
			enabled: inst.enabled,
			snapshotEnabled: inst.getSnapshot().enabled
		});
		inst.enable();
		const resumed = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(root.createBuffer(f32).$usage("uniform"), "resumed");
		root.unwrap(resumed);
		note("resume", {
			firstSeqAfterEnable: inst.history().at(-1)?.seq,
			seqBeforeDisable
		});
		const pipeline = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(root.createComputePipeline({ compute: noop }), "pipeline");
		const aBeforeCompile = a;
		pipeline.initSync();
		inst.dispose();
		await root.device.queue.onSubmittedWorkDone();
		await sleep$1(200);
		const buf = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(root.createBuffer(f32).$usage("uniform"), "buf");
		root.unwrap(buf);
		buf.destroy();
		note("disposed", {
			listenerCallsAfterDispose: a - aBeforeCompile,
			enabled: inst.enabled
		});
	}, HISTORY);
	const after = run.notes.afterLoop;
	check(`history stays at the bound (${HISTORY}) under ${ITER * 2} events`, after.history === HISTORY, after);
	check("droppedEvents accounts for every evicted event", after.snapshot.droppedEvents === ITER * 2 - HISTORY, after.snapshot);
	check("subscriber A received every event", a >= ITER * 2, a);
	check("subscriber B stopped receiving after unsubscribing (exactly 100)", b === 100, b);
	check("throwing subscriber C did not disturb A and every throw was counted", c >= ITER * 2 && after.snapshot.listenerErrors === ITER * 2, {
		c,
		listenerErrors: after.snapshot.listenerErrors
	});
	const dis = run.notes.disabled;
	check("disabled: no listener calls, history untouched, enabled=false", dis.listenerCalls === 0 && dis.historyUnchanged && !dis.enabled && !dis.snapshotEnabled, dis);
	const resume = run.notes.resume;
	check("enable() resumes with the next sequence number (nothing recorded while disabled)", resume.firstSeqAfterEnable === resume.seqBeforeDisable + 1, resume);
	const disposed = run.notes.disposed;
	check("after dispose(): the in-flight diagnostics and later resource activity produce no events", disposed.listenerCallsAfterDispose === 1 && !disposed.enabled, disposed);
	check("JSONL parity holds even while history is bounded (every event exported)", run.jsonl.filter((l) => l.startsWith("{\"record\":\"event\"")).length === run.events.length);
}
/**
* Hot-reload shape: many roots on one long-lived device, dropped without destroy(). The device keeps the
* instrumentation alive through its event listener, so each abandoned root can leave a hub (with its event
* history, including WGSL strings) behind.
*/
async function abandonedRoots() {
	current = "abandoned-roots";
	const collectGarbage = globalThis.gc;
	if (collectGarbage === void 0) {
		skipped.push("abandoned-roots: gc() is not exposed (Chrome is started with --js-flags=--expose-gc)");
		return;
	}
	const device = await (await navigator.gpu.requestAdapter()).requestDevice();
	const hubs = [];
	const roots = [];
	const spawn = () => {
		for (let i = 0; i < 30; i++) {
			const root = initFromDevice({
				device,
				unstable_instrumentation: createInstrumentation()
			});
			const inst = root["~unstable"].instrumentation;
			hubs.push(new WeakRef(inst));
			roots.push(new WeakRef(root));
			root.createComputePipeline({ compute: noop }).initSync();
		}
	};
	spawn();
	for (let i = 0; i < 30; i++) {
		await sleep$1(20);
		collectGarbage();
	}
	const aliveRoots = roots.filter((r) => r.deref() !== void 0).length;
	const aliveHubs = hubs.filter((h) => h.deref() !== void 0).length;
	evidence[current] = {
		roots: roots.length,
		aliveRoots,
		aliveHubs
	};
	check("abandoned roots are garbage-collected", aliveRoots === 0, { aliveRoots });
	check("abandoned instrumentation (hubs with their history) is garbage-collected too", aliveHubs === 0, {
		created: hubs.length,
		aliveHubs
	});
	device.destroy();
}
async function neverOptedIn() {
	current = "never-opted-in";
	const root = await init();
	const buf = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(root.createBuffer(arrayOf(f32, 8), [
		1,
		2,
		3,
		4,
		5,
		6,
		7,
		8
	]).$usage("storage"), "buf");
	const factor = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(root.createBuffer(f32, 2).$usage("uniform"), "factor");
	const bg = root.createBindGroup(layout$1, {
		data: buf,
		factor
	});
	(/* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(root.createComputePipeline({ compute: scale$1 }), "pipeline")).with(bg).dispatchWorkgroups(1);
	const result = await buf.read();
	check("without the option there is no instrumentation object at all", root["~unstable"].instrumentation === void 0);
	check("the workload still produces correct results", same(result, [
		2,
		4,
		6,
		8,
		10,
		12,
		14,
		16
	]), result);
	root.destroy();
}
async function runViability() {
	const prov = await provenance();
	if (prov.pageClassification === "unavailable") return {
		provenance: prov,
		ok: false,
		report: ["WebGPU unavailable"],
		scenarios: []
	};
	const scenarios = [];
	const all = [
		["resources", resources],
		["compute-bindgroups", computeBindGroups],
		["render", render],
		["explicit-init", explicitInit],
		["sync-failures", syncFailures],
		["async-failures", asyncFailures],
		["lifecycle", lifecycle],
		["abandoned-roots", abandonedRoots],
		["never-opted-in", neverOptedIn]
	];
	for (const [name, fn] of all) try {
		await fn();
		scenarios.push({ name });
	} catch (error) {
		current = name;
		check("scenario ran to completion", false, String(error));
		scenarios.push({
			name,
			error: String(error)
		});
	}
	const report = [];
	for (const [name] of all) {
		const mine = findings.filter((f) => f.scenario === name);
		report.push(`\n== ${name}: ${mine.filter((f) => f.pass).length}/${mine.length} checks`);
		for (const f of mine) {
			report.push(`${f.pass ? "PASS" : "FAIL"}  ${f.check}`);
			if (!f.pass) report.push(`        detail: ${JSON.stringify(f.detail)?.slice(0, 600)}`);
		}
	}
	retained.length = 0;
	for (const note of skipped) report.push(`\nSKIPPED  ${note}`);
	return {
		provenance: prov,
		ok: findings.every((f) => f.pass),
		report,
		skipped,
		findings,
		scenarios,
		evidence
	};
}
//#endregion
//#region tests/instrumentation/real-gpu-page/main.ts
/**
* Real-device validation scenario. Runs in a browser page against `navigator.gpu`.
* It is driven by real-gpu/run.mjs, which also collects the browser's own console output.
*
* Two kinds of results:
*  - `checks`: assertions that must hold for the run to count as validated.
*  - `observations`: facts about the real implementation that the design only assumed (reported, not asserted).
*/
var sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
var phase = (name) => console.info(`[phase] ${name}`);
function collect(inst) {
	const events = [];
	inst.subscribe((e) => events.push(e));
	return events;
}
var ofType = (events, type) => events.filter((e) => e.type === type);
var layout = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(bindGroupLayout({
	data: {
		storage: arrayOf(f32, 8),
		access: "mutable"
	},
	factor: { uniform: f32 }
}), "layout");
var scale = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(computeFn({
	workgroupSize: [8],
	in: { gid: builtin.globalInvocationId }
})(/* @__PURE__ */ (($) => (globalThis.__TYPEGPU_META__ ??= /* @__PURE__ */ new WeakMap()).set($.f = (({ gid }) => {
	"use gpu";
	layout.$.data[gid.x] = __tsover_mul(layout.$.data[gid.x], layout.$.factor);
}), {
	v: 2,
	name: void 0,
	ast: {
		"params": [{
			"type": "d",
			"props": [{
				"name": "gid",
				"alias": "gid"
			}]
		}],
		"body": [0, [[
			2,
			[
				8,
				[
					7,
					[
						7,
						"layout",
						"$"
					],
					"data"
				],
				[
					7,
					"gid",
					"x"
				]
			],
			"=",
			[
				1,
				[
					8,
					[
						7,
						[
							7,
							"layout",
							"$"
						],
						"data"
					],
					[
						7,
						"gid",
						"x"
					]
				],
				"*",
				[
					7,
					[
						7,
						"layout",
						"$"
					],
					"factor"
				]
			]
		]]]
	},
	externals: { "layout": () => layout }
}) && $.f)({})), "scale");
var vertexMain = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(vertexFn({
	in: { idx: builtin.vertexIndex },
	out: { pos: builtin.position }
})(/* @__PURE__ */ (($) => (globalThis.__TYPEGPU_META__ ??= /* @__PURE__ */ new WeakMap()).set($.f = (({ idx }) => {
	"use gpu";
	return { pos: vec4f(__tsover_sub(f32(idx), 1), __tsover_sub(__tsover_mul(f32(__tsover_mod(idx, 2)), 2), 1), 0, 1) };
}), {
	v: 2,
	name: void 0,
	ast: {
		"params": [{
			"type": "d",
			"props": [{
				"name": "idx",
				"alias": "idx"
			}]
		}],
		"body": [0, [[10, [104, { "pos": [
			6,
			"d.vec4f",
			[
				[
					1,
					[
						6,
						"d.f32",
						["idx"]
					],
					"-",
					[5, "1"]
				],
				[
					1,
					[
						1,
						[
							6,
							"d.f32",
							[[
								1,
								"idx",
								"%",
								[5, "2"]
							]]
						],
						"*",
						[5, "2"]
					],
					"-",
					[5, "1"]
				],
				[5, "0"],
				[5, "1"]
			]
		] }]]]]
	},
	externals: {
		"d.vec4f": () => vec4f,
		"d.f32": () => f32
	}
}) && $.f)({})), "vertexMain");
var fragmentMain = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(fragmentFn({ out: vec4f })(/* @__PURE__ */ (($) => (globalThis.__TYPEGPU_META__ ??= /* @__PURE__ */ new WeakMap()).set($.f = (() => {
	"use gpu";
	return vec4f(1, 0, 0, 1);
}), {
	v: 2,
	name: void 0,
	ast: {
		"params": [],
		"body": [0, [[10, [
			6,
			"d.vec4f",
			[
				[5, "1"],
				[5, "0"],
				[5, "0"],
				[5, "1"]
			]
		]]]]
	},
	externals: { "d.vec4f": () => vec4f }
}) && $.f)({})), "fragmentMain");
var broken = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(computeFn({ workgroupSize: [1] })`{ let x = definitelyUndeclared(1.0); }`, "broken");
async function runRealDeviceScenario() {
	const keepAlive = [];
	const checks = [];
	const observations = [];
	const check = (id, description, pass, detail) => checks.push({
		id,
		description,
		pass,
		detail
	});
	const observe = (id, value) => observations.push({
		id,
		value
	});
	const prov = await provenance();
	if (prov.pageClassification === "unavailable") return {
		provenance: prov,
		checks,
		observations,
		events: [],
		snapshot: null
	};
	const root = await init({ unstable_instrumentation: createInstrumentation({ historySize: 64 }) });
	const inst = root["~unstable"].instrumentation;
	check("init", "instrumentation is present and enabled after tgpu.init", inst?.enabled === true);
	if (!inst) return {
		provenance: prov,
		checks,
		observations,
		events: [],
		snapshot: null
	};
	const events = collect(inst);
	const lostByBrowser = root.device.lost.then((info) => ({
		reason: info.reason,
		message: info.message
	}));
	phase("compute");
	const data = root.createBuffer(arrayOf(f32, 8), [
		1,
		2,
		3,
		4,
		5,
		6,
		7,
		8
	]).$usage("storage").$name("data");
	const factor = root.createBuffer(f32, 3).$usage("uniform").$name("factor");
	const bindGroup = root.createBindGroup(layout, {
		data,
		factor
	});
	const pipeline = root.createComputePipeline({ compute: scale }).$name("scalePipeline");
	keepAlive.push(data, factor, bindGroup, pipeline);
	pipeline.with(bindGroup).dispatchWorkgroups(1);
	const result = await data.read();
	await root.device.queue.onSubmittedWorkDone();
	await sleep(50);
	check("compute-result", "the GPU actually ran the shader (readback equals input * 3)", result.every((v, i) => v === (i + 1) * 3), result);
	const compiled = ofType(events, "pipeline-created");
	check("pipeline-event", "exactly one pipeline-created event, lazy, with generated WGSL", compiled.length === 1 && compiled[0]?.trigger === "lazy" && /fn scale/.test(compiled[0]?.wgsl ?? ""), compiled.map((c) => ({
		trigger: c.trigger,
		label: c.label,
		wgslLength: c.wgslLength
	})));
	const diagnostics = ofType(events, "shader-diagnostics");
	check("diagnostics-valid", "getCompilationInfo reported for the valid shader with no errors", diagnostics.length === 1 && diagnostics[0]?.messages.every((m) => m.type !== "error") === true, diagnostics.map((x) => x.messages));
	const materialized = ofType(events, "resource-materialized");
	check("resources", "both buffers materialized with their sizes, before the bind group", materialized.length === 2 && materialized.find((m) => m.label === "data" && m.resource === "buffer" && m.sizeBytes === 32) !== void 0 && events.findIndex((e) => e.type === "bind-group-created") > Math.max(...materialized.map((m) => events.indexOf(m))), materialized.map((m) => ({
		label: m.label,
		...m.resource === "buffer" ? { size: m.sizeBytes } : {}
	})));
	const group = ofType(events, "bind-group-created")[0];
	check("bind-group", "bind group entries resolve to the tracked buffers", group !== void 0 && group.entries.length === 2 && group.entries.every((e) => e.resourceId !== null), group?.entries);
	const snap1 = inst.getSnapshot();
	check("counters", "one dispatch and at least one submit counted", snap1.pipelines[0]?.dispatches === 1 && snap1.counters.submits >= 1, {
		pipelines: snap1.pipelines.map((p) => ({
			label: p.label,
			dispatches: p.dispatches
		})),
		submits: snap1.counters.submits
	});
	factor.write(4);
	const factorInfo = inst.getSnapshot().resources.find((r) => r.label === "factor");
	check("buffer-writes", "a TypeGPU write is counted per buffer with its byte size", factorInfo?.writes === 1 && factorInfo.bytesWritten === 4, factorInfo);
	observe("compute.cpuMs", compiled.map((c) => ({
		resolveMs: c.resolveMs,
		createMs: c.createMs,
		note: "CPU times, not GPU"
	})));
	phase("render");
	const target = root.createTexture({
		size: [16, 16],
		format: "rgba8unorm"
	}).$usage("render").$name("target");
	const render = root.createRenderPipeline({
		vertex: vertexMain,
		fragment: fragmentMain,
		targets: { format: "rgba8unorm" }
	}).$name("trianglePipeline");
	keepAlive.push(target, render);
	render.withColorAttachment({
		view: target,
		loadOp: "clear",
		storeOp: "store"
	}).draw(3);
	await root.device.queue.onSubmittedWorkDone();
	await sleep(50);
	const snap2 = inst.getSnapshot();
	check("render", "render pipeline compiled lazily and one draw counted, no device error so far", snap2.pipelines.some((p) => p.pipeline === "render" && p.draws === 1) && ofType(events, "device-error").length === 0, snap2.pipelines.map((p) => ({
		kind: p.pipeline,
		label: p.label,
		draws: p.draws
	})));
	phase("broken-shader-sync");
	const before = events.length;
	root.createComputePipeline({ compute: broken }).$name("brokenSync").initSync();
	await root.device.queue.onSubmittedWorkDone();
	await sleep(300);
	const after = events.slice(before);
	const brokenDiag = ofType(after, "shader-diagnostics").find((x) => x.messages.some((m) => m.type === "error"));
	const brokenCompiled = ofType(after, "pipeline-created")[0];
	check("diagnostics-error", "the compiler error is reported with a line number that points at the offending line of the generated WGSL", brokenDiag !== void 0 && brokenDiag.messages.some((m) => m.type === "error" && ((brokenCompiled?.wgsl ?? "").split("\n")[m.lineNum - 1] ?? "").includes("definitelyUndeclared")), {
		messages: brokenDiag?.messages,
		wgsl: brokenCompiled?.wgsl
	});
	const errors = ofType(after, "device-error");
	check("device-error", "the invalid pipeline surfaced as an uncaptured device error", errors.length > 0, errors.map((e) => ({
		errorType: e.errorType,
		message: e.message
	})));
	observe("error.messageMentionsTypeGPULabel", errors.some((e) => /brokenSync|computeFn|Shader/.test(e.message)));
	phase("broken-shader-async");
	let asyncRejection = null;
	const beforeAsync = events.length;
	try {
		await root.createComputePipeline({ compute: broken }).$name("brokenAsync").initAsync();
	} catch (error) {
		asyncRejection = `${error.constructor.name}: ${error.message}`;
	}
	await sleep(300);
	const afterAsync = events.slice(beforeAsync);
	observe("async.pipelineCreation", {
		rejected: asyncRejection !== null,
		rejection: asyncRejection,
		pipelineCompiledEvents: ofType(afterAsync, "pipeline-created").length,
		shaderDiagnosticsWithErrors: ofType(afterAsync, "shader-diagnostics").filter((x) => x.messages.length > 0).length,
		deviceErrors: ofType(afterAsync, "device-error").length
	});
	const failedEvent = ofType(afterAsync, "pipeline-creation-failed")[0];
	const failedDiagnostics = ofType(afterAsync, "shader-diagnostics").find((x) => failedEvent !== void 0 && x.pipelineId === failedEvent.id);
	check("async-failure-event", "an invalid pipeline created with initAsync reports pipeline-creation-failed with its WGSL, and the compiler error follows", failedEvent?.errorType === "GPUPipelineError" && (failedEvent.wgsl ?? "").includes("definitelyUndeclared") && failedDiagnostics?.messages.some((m) => m.type === "error") === true, {
		failed: failedEvent && {
			...failedEvent,
			wgsl: void 0
		},
		diagnostics: failedDiagnostics?.messages
	});
	observe("async.rejectionNamesFirstIdenticalModule", asyncRejection?.includes("brokenSync") ?? null);
	data.destroy();
	phase("teardown");
	const destroyedEvents = ofType(events, "resource-destroyed").length;
	root.destroy();
	const lost = await Promise.race([lostByBrowser, sleep(3e3).then(() => null)]);
	await sleep(50);
	const rootDestroyed = ofType(events, "root-destroyed")[0];
	const lostEvent = ofType(events, "device-lost")[0];
	check("resource-destroyed", "destroying a buffer produced a resource-destroyed event", destroyedEvents === 1);
	check("root-destroyed", "root-destroyed reports the resources that were still alive (factor buffer + target texture)", rootDestroyed?.liveBuffers === 1 && rootDestroyed.liveTextures === 1 && rootDestroyed.ownDevice, rootDestroyed);
	check("device-lost-owned", "destroying the owned device produced a device-lost event with reason \"destroyed\"", lost?.reason === "destroyed" && lostEvent?.reason === "destroyed", {
		browser: lost,
		event: lostEvent
	});
	check("seq", "event sequence numbers are contiguous and history is bounded", events.every((e, i) => e.seq === i + 1) && inst.history().length <= 64, {
		events: events.length,
		history: inst.history().length
	});
	const newDevice = async () => (await navigator.gpu.requestAdapter()).requestDevice();
	const makeError = (device) => device.createTexture({
		label: "bogus-texture",
		size: [0, 0],
		format: "rgba8unorm",
		usage: GPUTextureUsage.TEXTURE_BINDING
	});
	const deviceX = await newDevice();
	const instX = initFromDevice({
		device: deviceX,
		unstable_instrumentation: createInstrumentation()
	})["~unstable"].instrumentation;
	const eventsX = collect(instX);
	phase("error-with-listener");
	makeError(deviceX);
	await deviceX.queue.onSubmittedWorkDone();
	await sleep(300);
	instX.dispose();
	phase("error-without-listener");
	makeError(deviceX);
	await deviceX.queue.onSubmittedWorkDone();
	await sleep(300);
	phase("listener-experiment-done");
	const withListener = ofType(eventsX, "device-error");
	check("raw-error-event", "a raw validation error was delivered as a device-error event exactly once (and not after dispose)", withListener.length === 1 && withListener[0]?.errorType === "GPUValidationError", withListener.map((e) => ({
		errorType: e.errorType,
		message: e.message
	})));
	observe("error.rawMessageMentionsLabel", withListener[0]?.message.includes("bogus-texture") ?? null);
	deviceX.destroy();
	const deviceY = await newDevice();
	const rootY = initFromDevice({
		device: deviceY,
		unstable_instrumentation: createInstrumentation()
	});
	const instY = rootY["~unstable"].instrumentation;
	const eventsY = collect(instY);
	rootY.unwrap(rootY.createBuffer(f32).$usage("uniform").$name("leftover"));
	phase("device-destroy-borrowed");
	deviceY.destroy();
	await sleep(300);
	const lostY = ofType(eventsY, "device-lost")[0];
	check("device-lost-borrowed", "destroying a borrowed device directly produced a device-lost event; the hub stayed attached", lostY?.reason === "destroyed" && instY.enabled, lostY);
	rootY.destroy();
	const rootYDestroyed = ofType(eventsY, "root-destroyed")[0];
	check("leak-after-loss", "root.destroy() on a borrowed root reports the buffer TypeGPU never destroyed", rootYDestroyed?.liveBuffers === 1 && !rootYDestroyed.ownDevice, rootYDestroyed);
	const collectGarbage = globalThis.gc;
	if (collectGarbage === void 0) observe("gc.real", "skipped: gc() is not exposed (Chrome needs --js-flags=--expose-gc)");
	else {
		const deviceZ = await newDevice();
		const make = () => {
			const rootZ = initFromDevice({
				device: deviceZ,
				unstable_instrumentation: createInstrumentation()
			});
			const buffer = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(rootZ.createBuffer(f32).$usage("uniform"), "buffer");
			rootZ.unwrap(buffer);
			const pipelineZ = /* @__PURE__ */ (globalThis.__TYPEGPU_AUTONAME__ ?? ((a) => a))(rootZ.createComputePipeline({ compute: scale }), "pipelineZ");
			pipelineZ.initSync();
			return {
				instZ: rootZ["~unstable"].instrumentation,
				refs: {
					root: new WeakRef(rootZ),
					buffer: new WeakRef(buffer),
					pipeline: new WeakRef(pipelineZ)
				}
			};
		};
		const { instZ, refs } = make();
		const liveBefore = instZ.getSnapshot();
		let collected = false;
		for (let i = 0; i < 50 && !collected; i++) {
			await sleep(20);
			collectGarbage();
			collected = Object.values(refs).every((r) => r.deref() === void 0);
		}
		for (let i = 0; i < 50 && instZ.getSnapshot().counters.collectedWithoutDestroy < 1; i++) {
			await sleep(20);
			collectGarbage();
		}
		const liveAfter = instZ.getSnapshot();
		check("gc-real-device", "with a live real device, the root, buffer and pipeline are garbage-collected and the registry forgets them", liveBefore.resources.length === 1 && collected && liveAfter.resources.length === 0 && liveAfter.pipelines.length === 0 && liveAfter.counters.collectedWithoutDestroy === 1, {
			collected,
			before: {
				resources: liveBefore.resources.length,
				pipelines: liveBefore.pipelines.length
			},
			after: {
				resources: liveAfter.resources.length,
				pipelines: liveAfter.pipelines.length,
				collectedWithoutDestroy: liveAfter.counters.collectedWithoutDestroy
			}
		});
		deviceZ.destroy();
	}
	const deltas = /* @__PURE__ */ new Set();
	for (let last = performance.now(), i = 0; i < 5e6 && deltas.size < 5; i++) {
		const now = performance.now();
		if (now !== last) {
			deltas.add(now - last);
			last = now;
		}
	}
	observe("performance.now.smallestStepMs", Math.min(...deltas));
	return {
		provenance: prov,
		checks,
		observations,
		events: events.slice(0, 80),
		snapshot: snap2,
		keptAlive: keepAlive.length
	};
}
window.runRealDeviceScenario = runRealDeviceScenario;
window.runExample = runExample;
window.runExampleControl = runExampleControl;
window.runViability = runViability;
//#endregion
