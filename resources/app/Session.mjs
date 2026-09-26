const developerToolsServers = new Set(['hhs1', 'hhs2', 'd63']);
const fixedRemoteOrigins = [
  'http://images.habbo.com',
  'https://images.habbo.com',
  'http://habbo-stories-content.s3.amazonaws.com',
  'https://habbo-stories-content.s3.amazonaws.com',
  'http://habbo-stories-content-dev.s3.amazonaws.com',
  'https://habbo-stories-content-dev.s3.amazonaws.com',
  'http://habbo-stories-content-staging.s3.amazonaws.com',
  'https://habbo-stories-content-staging.s3.amazonaws.com',
  'https://i.ibb.co',
  'https://i.imgur.com',
];
const executableRemoteResourceTypes = new Set(['script', 'subFrame', 'object']);

export function createNativeRemoteOrigins(websiteUrl, websocketUrl) {
  return new Set([
    new URL(websiteUrl).origin,
    new URL(websocketUrl).origin,
    ...fixedRemoteOrigins,
  ]);
}

export function isAllowedNativeRemoteRequest(requestUrl, resourceType, remoteOrigins) {
  try {
    const url = new URL(requestUrl);
    if (url.hostname === 'localhost' || url.hostname === '127.0.0.1') return true;
    return remoteOrigins.has(url.origin) && !url.username && !url.password
      && !executableRemoteResourceTypes.has(resourceType);
  } catch {
    return false;
  }
}

export function canUseDeveloperTools(server) {
  return true;
}

export function isDeveloperToolsShortcut(input, platform) {
  if (input.type !== 'keyDown') return false;
  if (input.key === 'F12') return true;
  if (input.key.toLowerCase() !== 'i') return false;
  return platform === 'darwin'
    ? Boolean(input.meta && input.alt)
    : Boolean(input.control && input.shift);
}

export function parseNativeSession(argv, hotels) {
  const keys = new Map([
    ['-server', 'server'], ['-ticket', 'ticket'],
    ['-ws', 'websocketUrl'], ['-websocket', 'websocketUrl'],
    ['-website', 'websiteUrl'],
  ]);
  const session = {};
  for (let i = 0; i < argv.length; i++) {
    const key = keys.get(argv[i]);
    if (!key) continue;
    if (key in session) throw new Error(`Duplicate native session argument ${key}.`);
    session[key] = argv[++i];
  }
  const customWs = session.websocketUrl;
  const customWebsite = session.websiteUrl;
  const hotel = hotels[session.server];
  if (!hotel) throw new Error('Unsupported native client hotel.');
  Object.assign(session, hotel);
  if (customWs) session.websocketUrl = customWs;
  if (customWebsite) session.websiteUrl = customWebsite;

  if (!/^(hh[a-z0-9]{2,16}|d63|dev|duke|local)$/i.test(session.server ?? '') ||
      typeof session.ticket !== 'string' || !session.ticket || session.ticket.length > 8192) {
    throw new Error('Open this client through the Habbo launcher.');
  }
  for (const [key, allowedProtocols] of [['websiteUrl', ['http:', 'https:']], ['websocketUrl', ['ws:', 'wss:']]]) {
    const url = new URL(session[key]);
    if (!allowedProtocols.includes(url.protocol) || url.username || url.password || url.search || url.hash) {
      throw new Error(`Invalid native session ${key}.`);
    }
    session[key] = key === 'websiteUrl' ? url.origin : url.href;
  }
  return session;
}
