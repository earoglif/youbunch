import { PAGE_BRIDGE_EVENTS } from "../shared/page-bridge/events";
import { logger } from "../shared/logger";

const INSTALL_FLAG = "__YouBunchPageBridgeInstalled__";
const EVENT_USER_INFO = PAGE_BRIDGE_EVENTS.userInfo;
const EVENT_REQUEST_USER_INFO = PAGE_BRIDGE_EVENTS.requestUserInfo;
const EVENT_SUBSCRIPTION_SUBSCRIBE = PAGE_BRIDGE_EVENTS.subscriptionSubscribe;
const EVENT_SUBSCRIPTION_UNSUBSCRIBE = PAGE_BRIDGE_EVENTS.subscriptionUnsubscribe;

const SUBSCRIBE_URL_MARKER = "/youtubei/v1/subscription/subscribe";
const UNSUBSCRIBE_URL_MARKER = "/youtubei/v1/subscription/unsubscribe";
const DEBUG_PREFIX = "[YouBunch/page-script]";
const CHANNEL_IDS_ARRAY_REGEX = /"channelIds"\s*:\s*\[(.*?)\]/s;
const CHANNEL_ID_IN_ARRAY_REGEX = /"(UC[a-zA-Z0-9_-]{20,})"/g;
const SINGLE_CHANNEL_ID_REGEX = /"channelId"\s*:\s*"(UC[a-zA-Z0-9_-]{20,})"/;
type SubscribeRequestInput = Parameters<typeof fetch>[0];
type SubscribeRequestInit = Parameters<typeof fetch>[1];
type XhrWithSubscribeUrl = XMLHttpRequest & {
  __YouBunchSubscribeUrl?: string;
  __YouBunchSubscriptionEventName?: string;
  __YouBunchSubscriptionChannelIds?: string[];
};

function getYtData() {
  const ytcfg = (window as Window & { ytcfg?: { data_?: Record<string, unknown> } }).ytcfg;
  if (typeof ytcfg !== "object" || ytcfg === null) return {};

  const data = ytcfg.data_;
  return typeof data === "object" && data !== null ? data : {};
}

function emitUserInfo() {
  const data = getYtData();
  const dataSyncId = data.DATASYNC_ID;
  const delegatedSessionId = data.DELEGATED_SESSION_ID;
  const userId =
    (typeof dataSyncId === "string" && dataSyncId.length > 0 && dataSyncId) ||
    (typeof delegatedSessionId === "string" && delegatedSessionId.length > 0 && delegatedSessionId) ||
    null;

  window.dispatchEvent(new CustomEvent(EVENT_USER_INFO, { detail: { userId } }));
}

function uniqueStringArray(items: unknown): string[] {
  if (!Array.isArray(items)) return [];
  const normalized: string[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (typeof item !== "string") continue;
    const value = item.trim();
    if (!value || seen.has(value)) continue;
    seen.add(value);
    normalized.push(value);
  }
  
  return normalized;
}

function maybeJsonParse(value: unknown): unknown {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

function parseChannelIdsFromRawText(raw: unknown): string[] {
  if (typeof raw !== "string" || raw.length === 0) return [];

  const parsed = maybeJsonParse(raw);
  if (parsed && typeof parsed === "object") {
    const parsedRecord = parsed as Record<string, unknown>;
    const direct = uniqueStringArray(parsedRecord.channelIds ?? parsedRecord.channelIdsList);
    if (direct.length > 0) return direct;
  }

  const arrayMatch = raw.match(CHANNEL_IDS_ARRAY_REGEX);
  if (arrayMatch) {
    const ids: string[] = [];
    let match: RegExpExecArray | null;
    CHANNEL_ID_IN_ARRAY_REGEX.lastIndex = 0;
    while ((match = CHANNEL_ID_IN_ARRAY_REGEX.exec(arrayMatch[1])) !== null) {
      ids.push(match[1]);
    }
    const normalized = uniqueStringArray(ids);
    if (normalized.length > 0) return normalized;
  }

  const singleMatch = raw.match(SINGLE_CHANNEL_ID_REGEX);
  if (singleMatch) return [singleMatch[1]];

  return [];
}

function parseSubscribeBody(body: unknown): string[] {
  if (!body) return [];

  if (typeof body === "string") {
    const fromRaw = parseChannelIdsFromRawText(body);
    if (fromRaw.length > 0) return fromRaw;

    const params = new URLSearchParams(body);
    const ids = params.getAll("channelIds");
    if (ids.length > 0) return uniqueStringArray(ids);

    const c = params.get("channelId");
    if (c) return uniqueStringArray([c]);

    const data = params.get("data");
    if (data) {
      const fromData = parseChannelIdsFromRawText(data);
      if (fromData.length > 0) return fromData;
    }
    return [];
  }

  if (body instanceof URLSearchParams) {
    const ids = body.getAll("channelIds");
    if (ids.length > 0) return uniqueStringArray(ids);

    const c = body.get("channelId");
    if (c) return uniqueStringArray([c]);

    const data = body.get("data");
    if (data) {
      const fromData = parseChannelIdsFromRawText(data);
      if (fromData.length > 0) return fromData;
    }
    return [];
  }

  if (typeof FormData !== "undefined" && body instanceof FormData) {
    const ids = body.getAll("channelIds").filter((value) => typeof value === "string");
    if (ids.length > 0) return uniqueStringArray(ids);

    const c = body.get("channelId");
    if (typeof c === "string" && c) return uniqueStringArray([c]);

    const data = body.get("data");
    if (typeof data === "string") {
      const fromData = parseChannelIdsFromRawText(data);
      if (fromData.length > 0) return fromData;
    }
    return [];
  }

  if (typeof Blob !== "undefined" && body instanceof Blob) {
    return [];
  }

  if (typeof ArrayBuffer !== "undefined" && body instanceof ArrayBuffer) {
    try {
      return parseChannelIdsFromRawText(new TextDecoder().decode(new Uint8Array(body)));
    } catch {
      return [];
    }
  }

  if (typeof ArrayBuffer !== "undefined" && ArrayBuffer.isView(body)) {
    try {
      return parseChannelIdsFromRawText(new TextDecoder().decode(body));
    } catch {
      return [];
    }
  }

  if (typeof body === "object") {
    const bodyRecord = body as Record<string, unknown>;
    const direct = uniqueStringArray(bodyRecord.channelIds ?? bodyRecord.channelIdsList);
    if (direct.length > 0) return direct;
    try {
      return parseChannelIdsFromRawText(JSON.stringify(body));
    } catch {
      return [];
    }
  }

  return [];
}

async function decompressBuffer(buffer: ArrayBuffer, format: "gzip" | "deflate"): Promise<string | null> {
  if (typeof DecompressionStream === "undefined") return null;
  try {
    const stream = new Blob([buffer]).stream().pipeThrough(new DecompressionStream(format));
    return await new Response(stream).text();
  } catch (error) {
    logger.debug(`${DEBUG_PREFIX} ${format} decompression failed`, { error });
    return null;
  }
}

async function readRequestBodyText(request: Request): Promise<string> {
  try {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength === 0) {
      logger.debug(`${DEBUG_PREFIX} request body is empty`);
      return "";
    }

    const bytes = new Uint8Array(buffer);
    const isGzip = bytes.length >= 2 && bytes[0] === 0x1f && bytes[1] === 0x8b;
    if (isGzip) {
      const decompressed = await decompressBuffer(buffer, "gzip");
      if (decompressed !== null) {
        logger.debug(`${DEBUG_PREFIX} request body decompressed`, {
          encoding: "gzip",
          byteLength: buffer.byteLength,
          textLength: decompressed.length,
          preview: decompressed.slice(0, 256),
        });
        return decompressed;
      }
    }

    const text = new TextDecoder("utf-8").decode(buffer);
    logger.debug(`${DEBUG_PREFIX} request body read`, {
      byteLength: buffer.byteLength,
      textLength: text.length,
      preview: text.slice(0, 256),
    });
    return text;
  } catch (error) {
    logger.debug(`${DEBUG_PREFIX} request body read failed`, { error });
    return "";
  }
}

async function readStreamText(stream: ReadableStream<Uint8Array>): Promise<string> {
  try {
    const text = await new Response(stream).text();
    logger.debug(`${DEBUG_PREFIX} stream body read`, {
      textLength: text.length,
      preview: text.slice(0, 256),
    });
    return text;
  } catch (error) {
    logger.debug(`${DEBUG_PREFIX} stream body read failed`, { error });
    return "";
  }
}

async function parseSubscribeBodyFromRequest(
  clonedRequest: Request | null,
  init?: SubscribeRequestInit
): Promise<string[]> {
  const directBody = init && init.body !== undefined ? init.body : undefined;
  const fromDirectBody = parseSubscribeBody(directBody);
  if (fromDirectBody.length > 0) return fromDirectBody;

  if (typeof Blob !== "undefined" && directBody instanceof Blob) {
    try {
      const text = await directBody.text();
      const fromBlob = parseChannelIdsFromRawText(text);
      if (fromBlob.length > 0) return fromBlob;
    } catch (error) {
      logger.debug(`${DEBUG_PREFIX} init.body Blob.text() failed`, { error });
    }
  }

  if (typeof ReadableStream !== "undefined" && directBody instanceof ReadableStream) {
    const text = await readStreamText(directBody);
    if (text.length > 0) {
      const fromStream = parseChannelIdsFromRawText(text);
      if (fromStream.length > 0) return fromStream;
    }
  }

  if (clonedRequest) {
    const text = await readRequestBodyText(clonedRequest);
    if (text.length > 0) {
      const fromText = parseChannelIdsFromRawText(text);
      if (fromText.length > 0) return fromText;
    }
  }

  return [];
}

function emitSubscriptionEvent(eventName: string, channelIds: string[]): void {
  const normalizedChannelIds = Array.isArray(channelIds) ? channelIds : [];
  logger.debug(`${DEBUG_PREFIX} emit subscription event`, { eventName, channelIds: normalizedChannelIds });
  window.dispatchEvent(
    new CustomEvent(eventName, { detail: { channelIds: normalizedChannelIds } })
  );
}

/**
 * Install subscribe request bridge 
*/
function installSubscribeRequestBridge() {
  logger.debug(`${DEBUG_PREFIX} install subscribe bridge`);
  const originalFetch = window.fetch;

  if (typeof originalFetch === "function") {
    window.fetch = function patchedFetch(
      this: WindowOrWorkerGlobalScope,
      input: SubscribeRequestInput,
      init?: SubscribeRequestInit
    ) {
      let eventName: string | null = null;
      let channelIdsPromise: Promise<string[]> | null = null;

      try {
        const url =
          typeof input === "string"
            ? input
            : input && typeof input === "object" && "url" in input
              ? input.url
              : "";
        if (typeof url === "string" && (url.includes(SUBSCRIBE_URL_MARKER) || url.includes(UNSUBSCRIBE_URL_MARKER))) {
          eventName = url.includes(UNSUBSCRIBE_URL_MARKER)
            ? EVENT_SUBSCRIPTION_UNSUBSCRIBE
            : EVENT_SUBSCRIPTION_SUBSCRIBE;

          let clonedRequest: Request | null = null;
          if (typeof Request !== "undefined" && input instanceof Request) {
            try {
              clonedRequest = input.clone();
            } catch (error) {
              logger.debug(`${DEBUG_PREFIX} request.clone() failed`, { error });
            }
          }

          channelIdsPromise = parseSubscribeBodyFromRequest(clonedRequest, init);

          logger.debug(`${DEBUG_PREFIX} fetch subscription match`, {
            url,
            eventName,
            hasClonedRequest: clonedRequest !== null,
            inputType: input instanceof Request ? "Request" : typeof input,
            initBodyType: init && init.body !== undefined ? typeof init.body : "undefined",
          });

          if (eventName === EVENT_SUBSCRIPTION_SUBSCRIBE) {
            void channelIdsPromise.then((channelIds) => {
              logger.debug(`${DEBUG_PREFIX} fetch parsed channelIds`, { channelIds });
              emitSubscriptionEvent(eventName ?? EVENT_SUBSCRIPTION_SUBSCRIBE, channelIds);
            });
          }
        }
      } catch (error) {
        logger.debug(`${DEBUG_PREFIX} patchedFetch error`, { error });
      }

      const responsePromise = originalFetch.call(this, input, init);

      if (eventName === EVENT_SUBSCRIPTION_UNSUBSCRIBE && channelIdsPromise) {
        void responsePromise
          .then((response) => {
            if (!response.ok) {
              logger.debug(`${DEBUG_PREFIX} fetch unsubscribe failed`, { status: response.status });
              return;
            }
            void channelIdsPromise?.then((channelIds) => {
              logger.debug(`${DEBUG_PREFIX} fetch parsed channelIds`, { channelIds });
              emitSubscriptionEvent(EVENT_SUBSCRIPTION_UNSUBSCRIBE, channelIds);
            });
          })
          .catch((error) => {
            logger.debug(`${DEBUG_PREFIX} fetch unsubscribe request failed`, { error });
          });
      }

      return responsePromise;
    };
  }

  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;

  XMLHttpRequest.prototype.open = function patchedOpen(
    this: XMLHttpRequest,
    method: string,
    url: string | URL,
    async?: boolean,
    username?: string | null,
    password?: string | null
  ) {
    const xhr = this as XhrWithSubscribeUrl;
    try {
      xhr.__YouBunchSubscribeUrl = typeof url === "string" ? url : "";
      xhr.__YouBunchSubscriptionEventName = undefined;
      xhr.__YouBunchSubscriptionChannelIds = undefined;
      if (
        typeof xhr.__YouBunchSubscribeUrl === "string" &&
        (xhr.__YouBunchSubscribeUrl.includes(SUBSCRIBE_URL_MARKER) ||
          xhr.__YouBunchSubscribeUrl.includes(UNSUBSCRIBE_URL_MARKER))
      ) {
        logger.debug(`${DEBUG_PREFIX} xhr subscription open`, { method, url: xhr.__YouBunchSubscribeUrl });
      }
    } catch {}

    if (typeof async === "boolean" || username !== undefined || password !== undefined) {
      return originalOpen.call(this, method, url, async ?? true, username, password);
    }

    return originalOpen.call(this, method, url, true);
  };

  XMLHttpRequest.prototype.send = function patchedSend(
    this: XMLHttpRequest,
    ...args: Parameters<XMLHttpRequest["send"]>
  ) {
    const [body] = args;
    const xhr = this as XhrWithSubscribeUrl;
    try {
      const url = xhr.__YouBunchSubscribeUrl || "";
      if (typeof url === "string" && (url.includes(SUBSCRIBE_URL_MARKER) || url.includes(UNSUBSCRIBE_URL_MARKER))) {
        const eventName = url.includes(UNSUBSCRIBE_URL_MARKER)
          ? EVENT_SUBSCRIPTION_UNSUBSCRIBE
          : EVENT_SUBSCRIPTION_SUBSCRIBE;
        const channelIds = parseSubscribeBody(body);
        logger.debug(`${DEBUG_PREFIX} xhr parsed channelIds`, { channelIds, bodyType: typeof body });

        if (eventName === EVENT_SUBSCRIPTION_UNSUBSCRIBE) {
          xhr.__YouBunchSubscriptionEventName = eventName;
          xhr.__YouBunchSubscriptionChannelIds = channelIds;
          xhr.addEventListener(
            "loadend",
            () => {
              if (xhr.status < 200 || xhr.status >= 300) {
                logger.debug(`${DEBUG_PREFIX} xhr unsubscribe failed`, { status: xhr.status });
                return;
              }
              emitSubscriptionEvent(EVENT_SUBSCRIPTION_UNSUBSCRIBE, xhr.__YouBunchSubscriptionChannelIds ?? []);
            },
            { once: true }
          );
        } else {
          emitSubscriptionEvent(eventName, channelIds);
        }
      }
    } catch {}
    return originalSend.apply(this, args);
  };
}

function init() {
  const scopedWindow = window as unknown as Record<string, unknown>;
  if (scopedWindow[INSTALL_FLAG]) return;
  scopedWindow[INSTALL_FLAG] = true;
  logger.debug(`${DEBUG_PREFIX} init`);

  window.addEventListener(EVENT_REQUEST_USER_INFO, () => {
    emitUserInfo();
  });

  emitUserInfo();
  installSubscribeRequestBridge();
}

init();
