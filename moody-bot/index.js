require("dotenv").config({ path: require("path").join(__dirname, ".env") });

const stickerConfig = require("./utils/config.json");
stickerConfig.removeBG = process.env.REMOVEBG_API_KEY || "";

const _0x2d8e0a = _0x2fc9;
function _0x2fc9(_0x595134, _0x49f3e1) {
  const _0x15243c = _0x1524();
  return (
    (_0x2fc9 = function (_0x2fc901, _0xb71d02) {
      _0x2fc901 = _0x2fc901 - 0x140;
      let _0x394da8 = _0x15243c[_0x2fc901];
      return _0x394da8;
    }),
    _0x2fc9(_0x595134, _0x49f3e1)
  );
}
(function (_0x3dd6a2, _0x583a11) {
  const _0x16b52b = _0x2fc9,
    _0x4c98a0 = _0x3dd6a2();
  while (!![]) {
    try {
      const _0x50a1d3 =
        parseInt(_0x16b52b(0x1b3)) / 0x1 +
        -parseInt(_0x16b52b(0x197)) / 0x2 +
        (-parseInt(_0x16b52b(0x1bd)) / 0x3) *
          (parseInt(_0x16b52b(0x211)) / 0x4) +
        (-parseInt(_0x16b52b(0x185)) / 0x5) *
          (parseInt(_0x16b52b(0x1ad)) / 0x6) +
        (-parseInt(_0x16b52b(0x1b2)) / 0x7) *
          (-parseInt(_0x16b52b(0x1fe)) / 0x8) +
        -parseInt(_0x16b52b(0x153)) / 0x9 +
        (parseInt(_0x16b52b(0x1ae)) / 0xa) * (parseInt(_0x16b52b(0x20b)) / 0xb);
      if (_0x50a1d3 === _0x583a11) break;
      else _0x4c98a0["push"](_0x4c98a0["shift"]());
    } catch (_0x32a321) {
      _0x4c98a0["push"](_0x4c98a0["shift"]());
    }
  }
})(_0x1524, 0x769d5),
  process["on"](_0x2d8e0a(0x155), console["error"]);
const {
    default: makeWASocket,
    DisconnectReason,
    Browsers,
    isJidGroup,
    jidNormalizedUser,
    fetchLatestBaileysVersion,
    getContentType,
    delay,
    isJidStatusBroadcast,
    useMultiFileAuthState,
    makeCacheableSignalKeyStore,
    jidDecode,
    WAMessageStubType,
  } = require("@whiskeysockets/baileys"),
  qrcode = require("qrcode-terminal"),
  moment = require(_0x2d8e0a(0x203)),
  _ = require(_0x2d8e0a(0x1e2)),
  pino = require(_0x2d8e0a(0x18d)),
  NodeCache = require("node-cache"),
  gradient = require(_0x2d8e0a(0x182));
let package = require(_0x2d8e0a(0x16f));
let reconnectTimer = null;
let reconnectAttempts = 0;
const decryptionFailures = new Map();
const DECRYPTION_FAILURE_WINDOW_MS = 60000;
const DECRYPTION_FAILURE_THRESHOLD = 3;
const groupMetadataCache = new Map();
const groupMetadataRequests = new Map();
const GROUP_METADATA_CACHE_TTL_MS = 60000;
const config = require(_0x2d8e0a(0x1c4)),
  msgRetryCounterMap = {},
  store = {
    contacts: {},
    chats: [],
    messages: {},
    fetchGroupMetadata: async (jid, socket) => socket.groupMetadata(jid),
  },
  { color, bgColor, msgs, pluginLoader, Scandir } = require("./utils"),
  { Serialize } = require(_0x2d8e0a(0x1dd)),
  { statistics, groupManage, Users } = require(_0x2d8e0a(0x1b4)),
  start = async () => {
    const _0x39621e = _0x2d8e0a;
    let _0x1bd200 = pluginLoader("../handlers/commands"),
      _0x2c0471 = pluginLoader(_0x39621e(0x15e));
    const _0xa84895 = Object["assign"](_0x1bd200, _0x2c0471),
      { version: _0x141cb5, isLatest: _0x2e50e2 } =
        await fetchLatestBaileysVersion();
    console["log"](
      color(_0x39621e(0x17e), _0x39621e(0x1a5)),
      _0x39621e(0x184),
      color("" + package["version"], _0x39621e(0x144)),
    ),
      console[_0x39621e(0x1d0)](
        color(_0x39621e(0x17e), _0x39621e(0x1a5)),
        _0x39621e(0x1d4),
        color(_0x141cb5["join"]("."), _0x39621e(0x15c)),
        _0x39621e(0x180),
        color("" + _0x2e50e2, "#f5af19"),
      ),
      console["log"](
        color(_0x39621e(0x17e), _0x39621e(0x1a5)),
        _0x39621e(0x154) +
          color(Object["keys"](_0xa84895)[_0x39621e(0x1f5)], _0x39621e(0x15c)) +
          _0x39621e(0x183) +
          color(Scandir(_0x39621e(0x20a))[_0x39621e(0x1f5)], "#f5af19"),
      ),
      console[_0x39621e(0x1d0)](
        color(_0x39621e(0x17e), _0x39621e(0x1a5)),
        _0x39621e(0x1d9) +
          color(
            Object[_0x39621e(0x195)](store[_0x39621e(0x212)])[_0x39621e(0x1f5)],
            _0x39621e(0x144),
          ) +
          _0x39621e(0x1fc) +
          (color(store[_0x39621e(0x19f)][_0x39621e(0x1f5)], _0x39621e(0x144)) +
            "\x20chats,\x20") +
          (color(
            Object["keys"](store[_0x39621e(0x193)])[_0x39621e(0x1f5)],
            _0x39621e(0x144),
          ) +
            _0x39621e(0x1e6)) +
          (color(
            (Date["now"]() - Date[_0x39621e(0x1b9)]()) / 0x3e8,
            "#38ef7d",
          ) +
            "s"),
      );
    const { state: _0x19e606, saveCreds: _0x5546f6 } =
        await useMultiFileAuthState(config[_0x39621e(0x173)]),
      _0x50cc0b = makeWASocket({
        version: _0x141cb5,
        printQRInTerminal: !![],
        logger: pino({ level: _0x39621e(0x1a0) }),
        msgRetryCounterMap: msgRetryCounterMap,
        auth: {
          creds: _0x19e606[_0x39621e(0x210)],
          keys: makeCacheableSignalKeyStore(
            _0x19e606[_0x39621e(0x195)],
            pino({ level: "fatal" })[_0x39621e(0x14d)]({
              level: _0x39621e(0x199),
            }),
          ),
        },
        cachedGroupMetadata: (jid) => getCachedGroupMetadata(_0x50cc0b, jid),
        browser: Browsers[_0x39621e(0x187)]("Firefox"),
        mediaCache: new NodeCache({
          stdTTL: 0x3c * 0x5,
          useClones: ![],
          deleteOnExpire: !![],
        }),
        linkPreviewImageThumbnailWidth: 0x190,
        generateHighQualityLinkPreview: !![],
        defaultQueryTimeoutMs: undefined,
        qrTimeout: 0x3e8 * 0x3c,
        userDevicesCache: new NodeCache({ stdTTL: 0x0, checkperiod: 0x0 }),
        waWebSocketUrl: _0x39621e(0x151),
      });
    (global[_0x39621e(0x1b1)] = _0x50cc0b),
      _0x50cc0b["ev"]["on"]("connection.update", async (_0x183d4c) => {
        const _0x5b7a5f = _0x39621e;
        _0x183d4c["qr"] &&
          (console[_0x5b7a5f(0x1d0)](_0x5b7a5f(0x14e)),
          qrcode[_0x5b7a5f(0x16d)](_0x183d4c["qr"], { small: !![] }));
        const { connection, lastDisconnect } = _0x183d4c;
        if (connection === "open") {
          if (reconnectTimer) clearTimeout(reconnectTimer);
          reconnectTimer = null;
          reconnectAttempts = 0;
          console.log("[CONNECTION] Bot conectado exitosamente.");
        } else if (connection === "close") {
          const statusCode = lastDisconnect?.error?.output?.statusCode;
          const errorMessage = lastDisconnect?.error?.message || "Sin detalle";
          console.warn(
            `[CONNECTION] Cerrada. Código: ${statusCode ?? "desconocido"}, Mensaje: ${errorMessage}`,
          );

          if (
            statusCode === DisconnectReason.badSession ||
            statusCode === DisconnectReason.loggedOut
          ) {
            console.error(
              `[SESSION] La sesión no es válida o fue cerrada. Se requiere vincular de nuevo; revisa "${config.SESSION_NAME}".`,
            );
            process.exit(1);
            return;
          }

          if (statusCode === DisconnectReason.connectionReplaced) {
            console.error(
              "[CONNECTION] Otra sesión reemplazó esta conexión. No se reintentará.",
            );
            process.exit(1);
            return;
          }

          scheduleReconnect();
        }
      }),
      _0x50cc0b["ev"]["on"]("group-participants.update", ({ id }) => {
        groupMetadataCache.delete(id);
      }),
      _0x50cc0b["ev"]["on"]("groups.update", (updates) => {
        for (const { id } of updates) {
          if (id) groupMetadataCache.delete(id);
        }
      }),
      _0x50cc0b["ev"]["on"](_0x39621e(0x142), _0x5546f6),
      _0x50cc0b["ev"]["on"](_0x39621e(0x1f3), async (_0x2ab072) => {
        const _0x50ab7d = _0x39621e;
        try {
          if (!_0x2ab072[_0x50ab7d(0x193)]) return;
          for (const _0x1e1ded of _0x2ab072[_0x50ab7d(0x193)]) {
            if (_0x1e1ded.key?.fromMe) continue;

            const remoteJid = _0x1e1ded.key?.remoteJid;
            const isDirectMessage =
              remoteJid &&
              !isJidGroup(remoteJid) &&
              !isJidStatusBroadcast(remoteJid) &&
              !_0x1e1ded.key?.fromMe;
            const isCiphertext =
              _0x1e1ded.messageStubType === WAMessageStubType.CIPHERTEXT;
            const decryptionError =
              _0x1e1ded.messageStubParameters?.[0] || "";

            if (isDirectMessage && isCiphertext) {
              if (
                /bad mac|no session|invalid pre.?key|invalid session/i.test(
                  decryptionError,
                )
              ) {
                trackDecryptionFailure(
                  _0x50cc0b,
                  remoteJid,
                  _0x1e1ded.key.id,
                  decryptionError,
                );
              }
            } else if (isDirectMessage && _0x1e1ded.message) {
              clearDecryptionFailures(remoteJid);
            }

            (_0x1e1ded[_0x50ab7d(0x198)] ===
              WAMessageStubType[_0x50ab7d(0x204)] ||
              _0x1e1ded[_0x50ab7d(0x198)] ===
                WAMessageStubType[_0x50ab7d(0x1ab)]) &&
              _0x50cc0b["ev"][_0x50ab7d(0x208)](_0x50ab7d(0x1c7), _0x1e1ded);
            _0x1e1ded[_0x50ab7d(0x17c)][_0x50ab7d(0x201)]
              ? statistics(_0x50ab7d(0x168))
              : statistics("msgRecv");
            config[_0x50ab7d(0x167)] &&
              (await _0x50cc0b[_0x50ab7d(0x160)]([
                _0x1e1ded[_0x50ab7d(0x17c)],
              ]));
            if (
              _0x1e1ded[_0x50ab7d(0x17c)] &&
              isJidStatusBroadcast(
                _0x1e1ded[_0x50ab7d(0x17c)][_0x50ab7d(0x18f)],
              )
            )
              return;
            const _0x4edd85 = _0x1e1ded["key"]["remoteJid"];
            let _0x43334c = (_0x50cc0b[_0x50ab7d(0x140)] = getContentType(
              _0x1e1ded[_0x50ab7d(0x176)],
            ));
            if (!_0x1e1ded[_0x50ab7d(0x176)] || !_0x43334c) continue;
            if (!Serialize(_0x50cc0b, _0x1e1ded)) continue;
            let _0x225559 = (_0x50cc0b[_0x50ab7d(0x206)] =
              _0x1e1ded["messageTimestamp"]);
            const _0x4dd336 = (
              _0x43334c === "conversation"
                ? _0x1e1ded[_0x50ab7d(0x176)][_0x50ab7d(0x1f1)]
                : _0x43334c == _0x50ab7d(0x1ba)
                  ? _0x1e1ded[_0x50ab7d(0x176)][_0x50ab7d(0x1ba)][
                      _0x50ab7d(0x18a)
                    ]
                  : _0x43334c == _0x50ab7d(0x1d8)
                    ? _0x1e1ded["message"][_0x50ab7d(0x1d8)][_0x50ab7d(0x18a)]
                    : _0x43334c == _0x50ab7d(0x1fd)
                      ? _0x1e1ded[_0x50ab7d(0x176)][_0x50ab7d(0x1fd)][
                          _0x50ab7d(0x1ce)
                        ]
                      : _0x43334c == _0x50ab7d(0x18c)
                        ? _0x1e1ded[_0x50ab7d(0x176)][_0x50ab7d(0x18c)][
                            "selectedButtonId"
                          ]
                        : _0x43334c == _0x50ab7d(0x143)
                          ? _0x1e1ded[_0x50ab7d(0x176)]["listResponseMessage"][
                              _0x50ab7d(0x1a6)
                            ][_0x50ab7d(0x1bb)]
                          : _0x43334c == _0x50ab7d(0x161)
                            ? _0x1e1ded["message"][_0x50ab7d(0x161)][
                                _0x50ab7d(0x149)
                              ]
                            : _0x43334c === "messageContextInfo"
                              ? _0x1e1ded[_0x50ab7d(0x176)][_0x50ab7d(0x143)][
                                  _0x50ab7d(0x1a6)
                                ][_0x50ab7d(0x1bb)] ||
                                _0x1e1ded[_0x50ab7d(0x176)][_0x50ab7d(0x18c)][
                                  _0x50ab7d(0x159)
                                ] ||
                                _0x1e1ded[_0x50ab7d(0x1ce)]
                              : _0x43334c == "stickerMessage"
                                ? _0x1e1ded[_0x50ab7d(0x176)][_0x50ab7d(0x1c8)][
                                    "fileSha256"
                                  ]["toString"](_0x50ab7d(0x141))
                                : _0x43334c == _0x50ab7d(0x174)
                                  ? _0x1e1ded["message"][_0x50ab7d(0x174)][
                                      _0x50ab7d(0x18a)
                                    ]
                                  : _0x43334c == "interactiveResponseMessage"
                                    ? JSON[_0x50ab7d(0x147)](
                                        _0x1e1ded["message"][
                                          "interactiveResponseMessage"
                                        ][_0x50ab7d(0x194)][_0x50ab7d(0x14b)],
                                      )["id"]
                                    : "") || "";
            if (_0x43334c === "protocolMessage") continue;
            let _0x4266a7 = isJidGroup(_0x1e1ded[_0x50ab7d(0x1c5)]),
              _0x3a5c5c = _0x1e1ded[_0x50ab7d(0x157)];
            const _0x5a79f2 = [
              _0x3a5c5c,
              _0x1e1ded.senderPn,
              _0x1e1ded.participantPn,
              _0x1e1ded.key?.senderPn,
              _0x1e1ded.key?.participantPn,
              _0x1e1ded.key?.participant,
              _0x1e1ded.key?.participantAlt,
              _0x1e1ded.key?.remoteJidAlt,
            ].filter(Boolean);
            const _0x4bc1f9 = _0x5a79f2.find((jid) =>
              String(jid).endsWith("@lid"),
            );
            if (
              _0x4bc1f9 &&
              _0x50cc0b.signalRepository?.lidMapping?.getPNForLID
            ) {
              try {
                const _0x10ac67 =
                  await _0x50cc0b.signalRepository.lidMapping.getPNForLID(
                    _0x4bc1f9,
                  );
                if (_0x10ac67) _0x5a79f2.push(_0x10ac67);
              } catch (_0x1d0d0f) {
                console.warn(
                  "[OWNER CHECK] No se pudo resolver el LID del remitente:",
                  _0x1d0d0f.message,
                );
              }
            }
            const _0x253dc8 = _0x5a79f2
              .map(jidNormalizedUser)
              .some((jid) =>
                config.owner.map(jidNormalizedUser).includes(jid),
              );
            let _0x36f3a8 = (_0x50cc0b[_0x50ab7d(0x188)] =
              _0x1e1ded[_0x50ab7d(0x179)]);
            const _0x59df3f = jidNormalizedUser(
              _0x50cc0b[_0x50ab7d(0x1d2)]["id"],
            );
            let _0x52f4ea = _0x4266a7
                ? await getCachedGroupMetadata(
                    _0x50cc0b,
                    _0x1e1ded[_0x50ab7d(0x1c5)],
                  )
                : {},
              _0x29b715 = _0x4266a7 ? _0x52f4ea[_0x50ab7d(0x1c6)] : [],
              _0x530e2b = _0x29b715.filter(
                (_0xed633) =>
                  _0xed633["admin"] ||
                  _0xed633["isAdmin"] ||
                  _0xed633["isSuperAdmin"],
              ),
              _0x34af76 = [
                _0x50cc0b["user"]?.["id"],
                _0x50cc0b["user"]?.["lid"],
                _0x50cc0b["user"]?.["jid"],
                _0x50cc0b["authState"]?.["creds"]?.["me"]?.["id"],
                _0x50cc0b["authState"]?.["creds"]?.["me"]?.["lid"],
                _0x50cc0b["authState"]?.["creds"]?.["me"]?.["jid"],
              ]
                .filter(Boolean)
                .map(jidNormalizedUser),
              _0x2af1af =
                _0x253dc8 ||
                _0x530e2b.some((_0x2d5d64) =>
                  [_0x2d5d64["id"], _0x2d5d64["jid"], _0x2d5d64["lid"]]
                    .filter(Boolean)
                    .some((_0x1d8b4c) =>
                      _0x34af76.includes(jidNormalizedUser(_0x1d8b4c)),
                    ),
                ),
              _0x2f939a = _0x530e2b.some((_0x2d5d64) =>
                [_0x2d5d64["id"], _0x2d5d64["jid"], _0x2d5d64["lid"]]
                  .filter(Boolean)
                  .some(
                    (_0x1d8b4c) =>
                      jidNormalizedUser(_0x1d8b4c) ===
                      jidNormalizedUser(_0x3a5c5c),
                  ),
              ),
              _0x255dff = _0x4266a7 ? _0x52f4ea[_0x50ab7d(0x16c)] : "",
              _0x49dbbf = _0x4266a7
                ? groupManage[_0x50ab7d(0x1e9)](_0x1e1ded["chat"]) == undefined
                  ? groupManage[_0x50ab7d(0x1f8)](
                      _0x1e1ded[_0x50ab7d(0x1c5)],
                      _0x255dff,
                    )
                  : groupManage[_0x50ab7d(0x1e9)](_0x1e1ded["chat"])
                : {};
            const _0x2b1ea1 = /^[-~\/.#‘*—]/["test"](_0x4dd336)
                ? _0x4dd336[_0x50ab7d(0x1ee)](/^[-~\/.#‘*—]/)
                : "-",
              _0x1d8414 = _0x4dd336["substring"](
                _0x4dd336[_0x50ab7d(0x1fa)]("\x20") + 0x1,
              ),
              _0xe297c0 = _0x4dd336[_0x50ab7d(0x15d)]()
                [_0x50ab7d(0x1a2)](/ +/)
                [_0x50ab7d(0x1df)](0x1),
              _0x5a791c = [],
              _0x15ceec = (_0x50cc0b[_0x50ab7d(0x1f0)] =
                _0x4dd336[_0x50ab7d(0x172)](_0x2b1ea1)),
              _0x575dc2 = (_0x50cc0b[_0x50ab7d(0x191)] = _0x15ceec
                ? _0x4dd336[_0x50ab7d(0x1df)](0x1)
                    [_0x50ab7d(0x15d)]()
                    [_0x50ab7d(0x1a2)](/ +/)
                    [_0x50ab7d(0x20f)]()
                    [_0x50ab7d(0x148)]()
                : null);
            let _0x4ab098 =
              _0xe297c0[_0x50ab7d(0x1f5)] !== 0x0 ? _0xe297c0[0x0] : "";
            for (let _0x355586 of _0xe297c0) {
              if (_0x355586[_0x50ab7d(0x172)]("--"))
                _0x5a791c[_0x50ab7d(0x1f6)](
                  _0x355586[_0x50ab7d(0x1df)](0x2)[_0x50ab7d(0x148)](),
                );
            }
            const _0x14e709 = (_0x4df097) => {
              const _0x2ba824 = _0x50ab7d;
              !_0x4266a7 &&
                console[_0x2ba824(0x1d0)](
                  bgColor(
                    color(_0x2ba824(0x1ec), _0x2ba824(0x189)),
                    _0x2ba824(0x15c),
                  ),
                  color(
                    moment(_0x225559 * 0x3e8)[_0x2ba824(0x1da)](
                      _0x2ba824(0x1dc),
                    ),
                    _0x2ba824(0x177),
                  ),
                  gradient[_0x2ba824(0x171)]("[" + _0x4df097 + "]"),
                  bgColor(color(_0x43334c, _0x2ba824(0x189)), _0x2ba824(0x1a5)),
                  _0x2ba824(0x1af),
                  gradient["cristal"](_0x36f3a8),
                ),
                _0x4266a7 &&
                  console[_0x2ba824(0x1d0)](
                    bgColor(
                      color(_0x2ba824(0x1ec), _0x2ba824(0x189)),
                      _0x2ba824(0x15c),
                    ),
                    color(
                      moment(_0x225559 * 0x3e8)[_0x2ba824(0x1da)](
                        _0x2ba824(0x1dc),
                      ),
                      _0x2ba824(0x177),
                    ),
                    gradient[_0x2ba824(0x171)]("[" + _0x4df097 + "]"),
                    bgColor(
                      color(_0x43334c, _0x2ba824(0x189)),
                      _0x2ba824(0x1a5),
                    ),
                    _0x2ba824(0x1af),
                    gradient[_0x2ba824(0x213)](_0x36f3a8),
                    "in",
                    gradient[_0x2ba824(0x1c0)](_0x255dff),
                  );
            };
            let _0x420a6f = bgColor(
              color(_0x43334c, _0x50ab7d(0x189)),
              _0x50ab7d(0x20c),
            );
            !_0x15ceec &&
              !_0x4266a7 &&
              console[_0x50ab7d(0x1d0)](
                "[MSG]",
                color(
                  moment(_0x225559 * 0x3e8)[_0x50ab7d(0x1da)](_0x50ab7d(0x1dc)),
                  _0x50ab7d(0x177),
                ),
                msgs(_0x1e1ded[_0x50ab7d(0x1ce)]),
                _0x50ab7d(0x14f) + _0x420a6f + _0x50ab7d(0x20d),
                color(_0x36f3a8, _0x50ab7d(0x15c)),
              );
            !_0x15ceec &&
              _0x4266a7 &&
              console[_0x50ab7d(0x1d0)](
                _0x50ab7d(0x17d),
                color(
                  moment(_0x225559 * 0x3e8)[_0x50ab7d(0x1da)](
                    "DD/MM/YY\x20HH:mm:ss",
                  ),
                  _0x50ab7d(0x177),
                ),
                msgs(_0x1e1ded[_0x50ab7d(0x1ce)]),
                _0x50ab7d(0x14f) + _0x420a6f + _0x50ab7d(0x20d),
                color(_0x36f3a8, _0x50ab7d(0x15c)),
                "in",
                gradient[_0x50ab7d(0x1ca)](_0x255dff),
              );
            _0x15ceec &&
              !_0x4266a7 &&
              console[_0x50ab7d(0x1d0)](
                color(_0x50ab7d(0x1c9)),
                color(
                  moment(_0x225559 * 0x3e8)["format"](_0x50ab7d(0x1dc)),
                  _0x50ab7d(0x177),
                ),
                color(_0x575dc2 + "\x20[" + _0xe297c0[_0x50ab7d(0x1f5)] + "]"),
                color("" + msgs(_0x4dd336), "cyan"),
                _0x50ab7d(0x1af),
                gradient["teen"](_0x36f3a8, "magenta"),
              );
            _0x15ceec &&
              _0x4266a7 &&
              console[_0x50ab7d(0x1d0)](
                color(_0x50ab7d(0x1c9)),
                color(
                  moment(_0x225559 * 0x3e8)[_0x50ab7d(0x1da)](_0x50ab7d(0x1dc)),
                  _0x50ab7d(0x177),
                ),
                color(_0x575dc2 + "\x20[" + _0xe297c0[_0x50ab7d(0x1f5)] + "]"),
                color("" + msgs(_0x4dd336), "cyan"),
                "~>\x20from",
                gradient[_0x50ab7d(0x1cb)](_0x36f3a8),
                "in",
                gradient[_0x50ab7d(0x1c0)](_0x255dff),
              );
            _0x4266a7 &&
              groupManage[_0x50ab7d(0x1f8)](
                _0x1e1ded[_0x50ab7d(0x1c5)],
                _0x255dff,
              );
            if (_0x15ceec && _0x4266a7) {
              const _0x3ef4af = _0x36f3a8 || _0x50ab7d(0x1e4);
              Users[_0x50ab7d(0x1f8)](
                _0x1e1ded[_0x50ab7d(0x157)],
                _0x3ef4af,
                null,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                ![],
                ![],
                ![],
                ![],
                null,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                0x0,
                null,
              )
                ["then"](() => {
                  const _0x3808c9 = _0x50ab7d;
                  Users[_0x3808c9(0x1e9)](_0x1e1ded[_0x3808c9(0x157)])
                    ["then"](async (_0xd1a13f) => {
                      const _0xeb7cf9 = _0x3808c9;
                      _0xd1a13f &&
                        _0xd1a13f[_0xeb7cf9(0x20e)] !== _0x3ef4af &&
                        Users[_0xeb7cf9(0x16a)](_0x1e1ded[_0xeb7cf9(0x157)], {
                          name: _0x3ef4af,
                        })[_0xeb7cf9(0x1e7)]((_0x417ab0) =>
                          console["log"](
                            new Error(_0x417ab0)[_0xeb7cf9(0x176)],
                          ),
                        );
                    })
                    [_0x3808c9(0x1e7)]((_0x393453) => {
                      const _0x5a9017 = _0x3808c9;
                      console[_0x5a9017(0x17a)](
                        "Error\x20al\x20obtener\x20el\x20usuario:",
                        new Error(_0x393453)[_0x5a9017(0x176)],
                      );
                    });
                })
                ["catch"]((_0x2bc3b7) => {
                  const _0x5d64b0 = _0x50ab7d;
                  console[_0x5d64b0(0x17a)](
                    _0x5d64b0(0x1de),
                    new Error(_0x2bc3b7)["message"],
                  );
                });
            }
            _0x15ceec &&
              config["composing"] &&
              (await _0x50cc0b[_0x50ab7d(0x1b8)](_0x4edd85),
              await _0x50cc0b[_0x50ab7d(0x1ef)](_0x50ab7d(0x1cd), _0x4edd85));
            if (
              _0x15ceec &&
              !_0x253dc8 &&
              config[_0x50ab7d(0x1be)] &&
              !["menu", "help"].includes(_0x575dc2)
            )
              return;
            if (_0x4dd336[_0x50ab7d(0x172)]("%")) {
              if (!_0x253dc8) return;
              try {
                let _0x3438c8 = await eval(_0x4dd336[_0x50ab7d(0x1df)](0x2));
                if (typeof _0x3438c8 !== "string")
                  _0x3438c8 = require(_0x50ab7d(0x162))[_0x50ab7d(0x19e)](
                    _0x3438c8,
                  );
                await _0x1e1ded["reply"](_0x3438c8[_0x50ab7d(0x1e8)]());
              } catch (_0x3fbfba) {
                await _0x1e1ded[_0x50ab7d(0x1b6)](String(_0x3fbfba));
              }
            }
            for (let _0x231dcc in _0xa84895) {
              let _0x2885f9 = _0xa84895[_0x231dcc];
              if (
                _0x2885f9["cmd"] &&
                _0x2885f9[_0x50ab7d(0x191)][_0x50ab7d(0x1d7)](_0x575dc2) &&
                !_0x1e1ded[_0x50ab7d(0x1e3)]
              ) {
                let _0x16f6a6 =
                  _0x2885f9[_0x50ab7d(0x191)] instanceof Array
                    ? _0x2885f9[_0x50ab7d(0x191)][_0x50ab7d(0x1d7)](_0x575dc2)
                    : _0x2885f9["cmd"] instanceof String
                      ? _0x2885f9[_0x50ab7d(0x191)] == _0x575dc2
                      : ![];
                if (!_0x16f6a6) continue;
                if (
                  typeof _0x2885f9[_0x50ab7d(0x1b5)] != _0x50ab7d(0x1ac) &&
                  _0x2885f9[_0x50ab7d(0x1b5)] &&
                  !_0x2af1af &&
                  _0x4266a7
                ) {
                  _0x1e1ded[_0x50ab7d(0x1b6)](config["MSG"][_0x50ab7d(0x192)]);
                  continue;
                } else {
                  if (
                    typeof _0x2885f9[_0x50ab7d(0x1e0)] != _0x50ab7d(0x1ac) &&
                    _0x2885f9[_0x50ab7d(0x1e0)] &&
                    !_0x2f939a &&
                    _0x4266a7
                  ) {
                    _0x1e1ded[_0x50ab7d(0x1b6)](
                      config[_0x50ab7d(0x209)][_0x50ab7d(0x1aa)],
                    );
                    continue;
                  } else {
                    if (
                      typeof _0x2885f9[_0x50ab7d(0x19d)] != _0x50ab7d(0x1ac) &&
                      _0x2885f9["group"] &&
                      !_0x4266a7
                    ) {
                      _0x1e1ded[_0x50ab7d(0x1b6)](
                        config[_0x50ab7d(0x209)][_0x50ab7d(0x207)],
                      );
                      continue;
                    } else {
                      if (
                        typeof _0x2885f9[_0x50ab7d(0x169)] !=
                          _0x50ab7d(0x1ac) &&
                        _0x2885f9["owner"] &&
                        !_0x253dc8
                      ) {
                        _0x1e1ded[_0x50ab7d(0x1b6)](
                          config[_0x50ab7d(0x209)]["owner"],
                        );
                        continue;
                      } else {
                        if (
                          typeof _0x2885f9["groupMuteAllowed"] ==
                            _0x50ab7d(0x1ac) &&
                          _0x4266a7 &&
                          _0x49dbbf[_0x50ab7d(0x1f4)]
                        ) {
                          _0x1e1ded["reply"](_0x50ab7d(0x15b));
                          continue;
                        }
                      }
                    }
                  }
                }
                await _0x2885f9[_0x50ab7d(0x178)](_0x1e1ded, _0x50cc0b, {
                  body: _0x4dd336,
                  prefix: _0x2b1ea1,
                  args: _0xe297c0,
                  arg: _0x1d8414,
                  cmd: _0x575dc2,
                  url: _0x4ab098,
                  flags: _0x5a791c,
                  msg: _0x2ab072,
                  plugins: _0xa84895,
                }),
                  statistics(_0x50ab7d(0x191));
                break;
              } else {
                if (
                  _0x2885f9[_0x50ab7d(0x18b)] instanceof RegExp &&
                  _0x2885f9[_0x50ab7d(0x18b)]["test"](_0x4dd336) &&
                  !_0x1e1ded[_0x50ab7d(0x1e3)]
                ) {
                  if (
                    typeof _0x2885f9[_0x50ab7d(0x186)] == _0x50ab7d(0x1ac) &&
                    _0x4266a7 &&
                    _0x49dbbf[_0x50ab7d(0x1f4)]
                  ) {
                    _0x1e1ded[_0x50ab7d(0x1b6)](
                      "*🚩\x20El\x20bot\x20esta\x20Muteado\x20/\x20Deshabilitado\x20en\x20este\x20grupo.*",
                    );
                    continue;
                  } else
                    _0x14e709(
                      _0x4dd336[_0x50ab7d(0x1ee)](_0x2885f9["regex"])[0x0],
                    ),
                      await _0x2885f9["exec"](_0x1e1ded, _0x50cc0b, {
                        body: _0x4dd336,
                        logEvent: _0x14e709,
                        prefix: _0x2b1ea1,
                        args: _0xe297c0,
                        cmd: _0x575dc2,
                        url: _0x4ab098,
                      }),
                      statistics(_0x50ab7d(0x196));
                } else {
                  if (
                    _0x2885f9[_0x50ab7d(0x172)] &&
                    _0x4dd336[_0x50ab7d(0x172)](_0x2885f9["startsWith"]) &&
                    !_0x1e1ded[_0x50ab7d(0x1e3)]
                  ) {
                    if (
                      typeof _0x2885f9[_0x50ab7d(0x169)] != _0x50ab7d(0x1ac) &&
                      _0x2885f9["owner"] &&
                      !_0x253dc8
                    )
                      return;
                    if (
                      typeof _0x2885f9[_0x50ab7d(0x1b5)] != _0x50ab7d(0x1ac) &&
                      _0x2885f9["admin"] &&
                      !_0x2af1af
                    )
                      return;
                    if (
                      typeof _0x2885f9[_0x50ab7d(0x1e0)] != _0x50ab7d(0x1ac) &&
                      _0x2885f9[_0x50ab7d(0x1e0)] &&
                      !_0x2f939a
                    )
                      return;
                    if (
                      typeof _0x2885f9["group"] != "undefined" &&
                      _0x2885f9[_0x50ab7d(0x19d)] &&
                      !_0x4266a7
                    )
                      return;
                    if (
                      typeof _0x2885f9["groupMuteAllowed"] ==
                        _0x50ab7d(0x1ac) &&
                      _0x4266a7 &&
                      _0x49dbbf[_0x50ab7d(0x1f4)]
                    )
                      return;
                    await _0x2885f9[_0x50ab7d(0x178)](_0x1e1ded, _0x50cc0b, {
                      body: _0x4dd336,
                      prefix: _0x2b1ea1,
                      args: _0xe297c0,
                      arg: _0x1d8414,
                      cmd: _0x575dc2,
                      url: _0x4ab098,
                      flags: _0x5a791c,
                      msg: _0x2ab072,
                      plugins: _0xa84895,
                    }),
                      statistics("cmd");
                  } else {
                    if (_0x2885f9[_0x50ab7d(0x170)] && _0x4266a7) {
                      if (
                        typeof _0x2885f9[_0x50ab7d(0x169)] !=
                          _0x50ab7d(0x1ac) &&
                        _0x2885f9[_0x50ab7d(0x169)] &&
                        !_0x253dc8
                      )
                        return _0x1e1ded["reply"](
                          config[_0x50ab7d(0x209)][_0x50ab7d(0x169)],
                        );
                      if (
                        typeof _0x2885f9["admin"] != _0x50ab7d(0x1ac) &&
                        _0x2885f9[_0x50ab7d(0x1b5)] &&
                        _0x4266a7 &&
                        !_0x2af1af
                      )
                        return _0x1e1ded[_0x50ab7d(0x1b6)](
                          config[_0x50ab7d(0x209)][_0x50ab7d(0x192)],
                        );
                      if (
                        typeof _0x2885f9[_0x50ab7d(0x1e0)] !=
                          _0x50ab7d(0x1ac) &&
                        _0x2885f9["botAdmin"] &&
                        _0x49dbbf[_0x50ab7d(0x1bf)] &&
                        _0x4266a7 &&
                        !_0x2f939a
                      )
                        return _0x1e1ded["reply"](
                          config[_0x50ab7d(0x209)][_0x50ab7d(0x1aa)],
                        );
                      if (
                        typeof _0x2885f9[_0x50ab7d(0x19d)] !=
                          _0x50ab7d(0x1ac) &&
                        _0x2885f9["group"] &&
                        !_0x4266a7
                      )
                        return _0x1e1ded[_0x50ab7d(0x1b6)](
                          config[_0x50ab7d(0x209)][_0x50ab7d(0x207)],
                        );
                      if (
                        typeof _0x2885f9[_0x50ab7d(0x186)] == "undefined" &&
                        _0x4266a7 &&
                        _0x49dbbf[_0x50ab7d(0x1f4)]
                      )
                        return;
                      await _0x2885f9[_0x50ab7d(0x178)](_0x1e1ded, _0x50cc0b, {
                        body: _0x4dd336,
                        prefix: _0x2b1ea1,
                        args: _0xe297c0,
                        arg: _0x1d8414,
                        cmd: _0x575dc2,
                        url: _0x4ab098,
                        flags: _0x5a791c,
                        msg: _0x2ab072,
                        plugins: _0xa84895,
                        formattedTitle: _0x255dff,
                      });
                    }
                  }
                }
              }
            }
          }
        } catch (_0xc214f9) {
          const _0x5badac = String(_0xc214f9?.message || _0xc214f9);
          if (_0x5badac.includes("Bad MAC")) {
            console.warn("[SESSION] Se ignoró un mensaje con Bad MAC.");
          } else {
            console[_0x50ab7d(0x1d0)](
              color(_0x50ab7d(0x175), _0x50ab7d(0x1a9)),
              color(moment()["format"]("DD/MM/YY\x20HH:mm:ss"), _0x50ab7d(0x177)),
              _0xc214f9,
            );
          }
        }
      }),
      _0x50cc0b["ws"]["on"](_0x39621e(0x150), async (_0x4921dd) => {
        const _0x392b38 = _0x39621e;
        if (_0x4921dd[_0x392b38(0x166)][0x0][_0x392b38(0x145)] == "offer") {
          const _0x1a309e =
              _0x4921dd["content"][0x0]["attrs"][_0x392b38(0x17b)],
            {
              version: _0x2ccd6f,
              platform: _0x1b7dd1,
              notify: _0x45b14a,
              t: _0x42e973,
            } = _0x4921dd["attrs"],
            _0x4dcf6a =
              _0x392b38(0x16b) +
              (_0x45b14a || "usuario\x20del\x20bot") +
              _0x392b38(0x1e1) +
              moment["tz"]("America/Lima")[_0x392b38(0x1da)](_0x392b38(0x17f)) +
              _0x392b38(0x1d1);
          await delay(0xbb8);
          for (
            let _0x240e49 = 0x0;
            _0x240e49 < config["owner"][_0x392b38(0x1f5)];
            _0x240e49++
          ) {
            await _0x50cc0b[_0x392b38(0x1cc)](
              _0x1a309e,
              config[_0x392b38(0x169)][_0x240e49][_0x392b38(0x1a2)](
                S_WHATSAPP_NET,
              )[0x0],
              "" +
                (config[_0x392b38(0x169)][_0x392b38(0x1f5)] < 0x1
                  ? "Owner"
                  : "Owner\x20" + (_0x240e49 + 0x1)),
            );
          }
          await delay(0x1b58),
            await _0x50cc0b["sendMessage"](_0x1a309e, { text: _0x4dcf6a })[
              _0x392b38(0x16e)
            ](async () => {
              const _0x1aa4b2 = _0x392b38;
              await _0x50cc0b["updateBlockStatus"](_0x1a309e, _0x1aa4b2(0x158));
            });
        }
      }),
      _0x50cc0b["ev"]["on"](_0x39621e(0x1c7), async (_0x3a1e18) => {
        const _0x41ac73 = _0x39621e;
        try {
          const _0x43f5a9 = await groupManage[_0x41ac73(0x1e9)](
              _0x3a1e18[_0x41ac73(0x17c)][_0x41ac73(0x18f)],
            ),
            _0x58214c = await _0x50cc0b["groupMetadata"](
              _0x3a1e18[_0x41ac73(0x17c)]["remoteJid"],
            ),
            _0xf79d8b = await _0x50cc0b[_0x41ac73(0x1ed)](
              _0x3a1e18[_0x41ac73(0x17c)]["remoteJid"],
              "image",
            )[_0x41ac73(0x1e7)](() => _0x41ac73(0x15f));
          if (_0x3a1e18[_0x41ac73(0x198)] == 0x1d && _0x43f5a9["raid"]) {
            let _0x13f2e7 =
              _0x41ac73(0x200) +
              _0x3a1e18[_0x41ac73(0x1a1)][0x0]["split"]("@")[0x0] +
              _0x41ac73(0x18e) +
              _0x3a1e18[_0x41ac73(0x17c)][_0x41ac73(0x163)][_0x41ac73(0x1a2)](
                "@",
              )[0x0] +
              _0x41ac73(0x152) +
              (_0x58214c[_0x41ac73(0x16c)] || "") +
              "\x0a\x0a*Powered\x20By\x20ムーディー・ボット*";
            _0x50cc0b[_0x41ac73(0x15a)](
              _0x3a1e18[_0x41ac73(0x17c)]["remoteJid"],
              {
                image: { url: _0xf79d8b },
                caption: _0x13f2e7,
                mentions: [
                  _0x3a1e18[_0x41ac73(0x17c)][_0x41ac73(0x163)],
                  _0x3a1e18["messageStubParameters"][0x0],
                ],
              },
            );
          } else {
            if (
              _0x3a1e18["messageStubType"] == 0x1e &&
              _0x43f5a9[_0x41ac73(0x1d5)]
            ) {
              let _0x4c1efe =
                _0x41ac73(0x1ff) +
                _0x3a1e18[_0x41ac73(0x1a1)][0x0][_0x41ac73(0x1a2)]("@")[0x0] +
                "\x0a\x20\x20*◦\x20\x20De\x20:*\x20@" +
                _0x3a1e18["key"][_0x41ac73(0x163)][_0x41ac73(0x1a2)]("@")[0x0] +
                _0x41ac73(0x152) +
                (_0x58214c["subject"] || "") +
                _0x41ac73(0x146);
              _0x50cc0b["sendMessage"](
                _0x3a1e18[_0x41ac73(0x17c)]["remoteJid"],
                {
                  image: { url: _0xf79d8b },
                  caption: _0x4c1efe,
                  mentions: [
                    _0x3a1e18[_0x41ac73(0x17c)][_0x41ac73(0x163)],
                    _0x3a1e18[_0x41ac73(0x1a1)][0x0],
                  ],
                },
              );
            }
          }
        } catch (_0x2861d9) {
          console[_0x41ac73(0x1d0)](new Error(_0x2861d9)["message"]);
        }
      }),
      _0x50cc0b["ev"]["on"](
        _0x39621e(0x1a8),
        async ({
          id: _0x246cd2,
          participants: _0x305ff3,
          action: _0x273477,
        }) => {
          const _0x5635ec = _0x39621e;
          try {
            const _0x25d2fa = await groupManage[_0x5635ec(0x1e9)](_0x246cd2),
              _0x3bcd0d = await _0x50cc0b[_0x5635ec(0x1e5)](_0x246cd2);
            if (_0x305ff3[0x0] == _0x50cc0b[_0x5635ec(0x1d2)]["id"]) return;
            const _0x55c87b = await _0x50cc0b[_0x5635ec(0x1ed)](
              _0x305ff3[0x0],
              _0x5635ec(0x156),
            )[_0x5635ec(0x1e7)](
              (_0xc3e07a) =>
                "https://telegra.ph/file/288dfd6336e8854cf144b.jpg",
            );
            let _0x5bdad7 = _0x25d2fa["welcome_text"]
                [
                  _0x5635ec(0x1d6)
                ](_0x5635ec(0x19c), "@" + jidDecode(_0x305ff3[0x0])[_0x5635ec(0x1d2)])
                [
                  _0x5635ec(0x1d6)
                ](_0x5635ec(0x1f2), _0x3bcd0d[_0x5635ec(0x16c)]),
              _0x3d6510 = _0x25d2fa[_0x5635ec(0x1cf)]
                [
                  _0x5635ec(0x1d6)
                ](_0x5635ec(0x19c), "@" + jidDecode(_0x305ff3[0x0])[_0x5635ec(0x1d2)])
                [_0x5635ec(0x1d6)]("{title}", _0x3bcd0d[_0x5635ec(0x16c)]);
            if (_0x273477 == _0x5635ec(0x1f8) && _0x25d2fa[_0x5635ec(0x1a3)])
              _0x5bdad7[_0x5635ec(0x1d7)](_0x5635ec(0x1b7))
                ? _0x50cc0b[_0x5635ec(0x15a)](_0x246cd2, {
                    image: { url: _0x55c87b },
                    caption: _0x5bdad7[_0x5635ec(0x1d6)]("{foto}", ""),
                    mentions: [_0x305ff3[0x0]],
                  })
                : _0x50cc0b[_0x5635ec(0x15a)](_0x246cd2, {
                    text: _0x5bdad7["replace"](_0x5635ec(0x1b7), ""),
                    mentions: [_0x305ff3[0x0]],
                  });
            else
              _0x273477 == _0x5635ec(0x19b) &&
                _0x25d2fa["leave_status"] &&
                (_0x3d6510["includes"](_0x5635ec(0x1b7))
                  ? _0x50cc0b["sendMessage"](_0x246cd2, {
                      image: { url: _0x55c87b },
                      caption: _0x3d6510[_0x5635ec(0x1d6)](
                        _0x5635ec(0x1b7),
                        "",
                      ),
                      mentions: [_0x305ff3[0x0]],
                    })
                  : _0x50cc0b[_0x5635ec(0x15a)](_0x246cd2, {
                      text: _0x3d6510["replace"](_0x5635ec(0x1b7), ""),
                      mentions: [_0x305ff3[0x0]],
                    }));
          } catch (_0x23c977) {
            console[_0x5635ec(0x1d0)](_0x23c977);
          }
        },
      );
    const _0x2487ee = (_0x5e1349) => {
      const _0x763912 = _0x39621e;
      if (!_0x5e1349) return _0x5e1349;
      if (/:\d+@/gi["test"](_0x5e1349)) {
        const _0x583f5d = jidDecode(_0x5e1349) || {};
        return _0x583f5d[_0x763912(0x1d2)] && _0x583f5d[_0x763912(0x14c)]
          ? _0x583f5d[_0x763912(0x1d2)] + "@" + _0x583f5d[_0x763912(0x14c)]
          : _0x5e1349;
      }
      return _0x5e1349;
    };
    _0x50cc0b["ev"]["on"]("contacts.update", async (_0x5eb04b) => {
      const _0x4065fb = _0x39621e;
      try {
        for (const _0x5e03c0 of _0x5eb04b) {
          const _0x42e13f = _0x2487ee(_0x5e03c0["id"]);
          Users["all"]()["length"] > 0x1 &&
            Users[_0x4065fb(0x1e9)](_0x42e13f) &&
            Users[_0x4065fb(0x16a)](_0x42e13f, { name: _0x5e03c0["notify"] });
        }
      } catch (_0x552c08) {
        console[_0x4065fb(0x1d0)](new Error(_0x552c08)[_0x4065fb(0x176)]);
      }
    });
  };
function clearDecryptionFailures(jid) {
  const failure = decryptionFailures.get(jid);
  if (!failure) return;
  clearTimeout(failure.timer);
  decryptionFailures.delete(jid);
}

function getCachedGroupMetadata(sock, jid) {
  const cached = groupMetadataCache.get(jid);
  if (cached && cached.expiresAt > Date.now()) {
    return Promise.resolve(cached.metadata);
  }

  const pendingRequest = groupMetadataRequests.get(jid);
  if (pendingRequest) return pendingRequest;

  const request = sock
    .groupMetadata(jid)
    .then((metadata) => {
      groupMetadataCache.set(jid, {
        metadata,
        expiresAt: Date.now() + GROUP_METADATA_CACHE_TTL_MS,
      });

      for (const [cachedJid, entry] of groupMetadataCache) {
        if (entry.expiresAt <= Date.now()) groupMetadataCache.delete(cachedJid);
      }
      while (groupMetadataCache.size > 500) {
        groupMetadataCache.delete(groupMetadataCache.keys().next().value);
      }

      return metadata;
    })
    .finally(() => {
      if (groupMetadataRequests.get(jid) === request) {
        groupMetadataRequests.delete(jid);
      }
    });

  groupMetadataRequests.set(jid, request);
  return request;
}

function trackDecryptionFailure(sock, jid, messageId, errorMessage) {
  if (!messageId) return;
  let failure = decryptionFailures.get(jid);
  if (!failure) {
    failure = {
      count: 0,
      messageIds: new Set(),
      deleting: false,
      timer: setTimeout(
        () => decryptionFailures.delete(jid),
        DECRYPTION_FAILURE_WINDOW_MS,
      ),
    };
    failure.timer.unref?.();
    decryptionFailures.set(jid, failure);
  }

  if (failure.deleting || failure.messageIds.has(messageId)) return;
  failure.messageIds.add(messageId);
  failure.count += 1;
  console.warn(
    `[SESSION] Fallo de descifrado ${failure.count}/${DECRYPTION_FAILURE_THRESHOLD} para ${jid}: ${errorMessage}`,
  );

  if (failure.count < DECRYPTION_FAILURE_THRESHOLD) return;
  failure.deleting = true;
  clearTimeout(failure.timer);

  sock.signalRepository
    .deleteSession([jid])
    .then(() => {
      console.warn(
        `[SESSION] Sesión Signal de ${jid} eliminada tras ${DECRYPTION_FAILURE_THRESHOLD} fallos distintos; Baileys podrá recrearla.`,
      );
      if (decryptionFailures.get(jid) === failure) {
        decryptionFailures.delete(jid);
      }
    })
    .catch((error) => {
      console.error(
        `[SESSION] No se pudo eliminar la sesión Signal de ${jid}:`,
        error,
      );
      if (decryptionFailures.get(jid) === failure) {
        decryptionFailures.delete(jid);
      }
    });
}

function scheduleReconnect(error) {
  if (error) console.error("[CONNECTION] No se pudo iniciar el socket:", error);
  if (reconnectTimer) return;

  const delayMs = Math.min(5000 * 2 ** reconnectAttempts, 60000);
  reconnectAttempts += 1;
  console.log(
    `[CONNECTION] Reintentando en ${Math.round(delayMs / 1000)} segundos (intento ${reconnectAttempts}).`,
  );

  reconnectTimer = setTimeout(() => {
    reconnectTimer = null;
    start().catch(scheduleReconnect);
  }, delayMs);
}

start().catch(scheduleReconnect);
function _0x1524() {
  const _0x160eab = [
    "MSG",
    "./handlers",
    "22BCnlXh",
    "#FAFFD1",
    "\x20from",
    "name",
    "shift",
    "creds",
    "2713324nvqcGt",
    "contacts",
    "cristal",
    "msgType",
    "base64",
    "creds.update",
    "listResponseMessage",
    "#009FF0",
    "tag",
    "\x0a\x0aPowered\x20By\x20ムーディー・ボット",
    "parse",
    "toLowerCase",
    "selectedId",
    "connecting",
    "paramsJson",
    "server",
    "child",
    "Scan\x20the\x20QR\x20code\x20to\x20login",
    "~>\x20",
    "CB:call",
    "wss://web.whatsapp.com/ws/chat?ED=CAIICA",
    "\x0a\x20\x20*◦\x20Grupo\x20:*\x20",
    "7802568uKqSkk",
    "Loaded\x20Plugins\x20",
    "uncaughtException",
    "image",
    "sender",
    "block",
    "selectedButtonId",
    "sendMessage",
    "*🚩\x20El\x20bot\x20esta\x20Muteado\x20/\x20Deshabilitado\x20en\x20este\x20grupo.*",
    "#38ef7d",
    "trim",
    "../handlers/events",
    "https://telegra.ph/file/288dfd6336e8854cf144b.jpg",
    "readMessages",
    "templateButtonReplyMessage",
    "util",
    "participant",
    "Connection\x20timedOut,\x20reconnecting...",
    "#f12711",
    "content",
    "autoRead",
    "msgSent",
    "owner",
    "update",
    "Vaya\x20_",
    "subject",
    "generate",
    "then",
    "./package.json",
    "groupEvent",
    "summer",
    "startsWith",
    "SESSION_NAME",
    "documentMessage",
    "[ERROR]",
    "message",
    "#A1FFCE",
    "exec",
    "pushName",
    "error",
    "call-creator",
    "key",
    "[MSG]",
    "[SYS]",
    "LLL",
    "Is\x20Latest\x20:",
    "exit",
    "gradient-string",
    "\x20of\x20",
    "Package\x20Version",
    "3391110ttOeLq",
    "groupMuteAllowed",
    "macOS",
    "pushname",
    "black",
    "caption",
    "regex",
    "buttonsResponseMessage",
    "pino",
    "\x0a\x20\x20◦\x20\x20*De\x20:*\x20@",
    "remoteJid",
    "Connection\x20closed,\x20reconnecting....",
    "cmd",
    "notGroupAdmin",
    "messages",
    "nativeFlowResponseMessage",
    "keys",
    "autodownload",
    "238140IiXbVs",
    "messageStubType",
    "fatal",
    "Bad\x20session\x20file,\x20delete\x20",
    "remove",
    "@user",
    "group",
    "inspect",
    "chats",
    "silent",
    "messageStubParameters",
    "split",
    "welcome_status",
    "map",
    "cyan",
    "singleSelectReply",
    "\x20and\x20run\x20again",
    "group-participants.update",
    "red",
    "botNotAdmin",
    "GROUP_PARTICIPANT_PROMOTE",
    "undefined",
    "6xwPVmB",
    "7779890nJxSTn",
    "~>\x20from",
    "\x20and\x20Scan\x20Again.",
    "client",
    "35uoZZez",
    "577392irrIZJ",
    "./db",
    "admin",
    "reply",
    "{foto}",
    "presenceSubscribe",
    "now",
    "imageMessage",
    "selectedRowId",
    "\x20is\x20now\x20Connected...",
    "3pDRxfD",
    "onlyowner",
    "antilink",
    "fruit",
    "Device\x20Logged\x20Out,\x20Please\x20Delete\x20",
    "#009FFF",
    "output",
    "./utils/config.json",
    "chat",
    "participants",
    "delirius-message.participants",
    "stickerMessage",
    "[CMD]",
    "morning",
    "teen",
    "sendContact",
    "composing",
    "text",
    "leave_text",
    "log",
    "*\x20,\x20por\x20lo\x20que\x20sera\x20bloqueado\x20automáticamente.\x0a🚩\x20Por\x20favor,\x20chatee\x20con\x20el\x20propietario\x20del\x20bot\x20para\x20desbloquearlo.",
    "user",
    "connectionLost",
    "WA\x20Version",
    "raid",
    "replace",
    "includes",
    "videoMessage",
    "Client\x20loaded\x20with\x20",
    "format",
    "Restart\x20required,\x20restarting...",
    "DD/MM/YY\x20HH:mm:ss",
    "./utils/simple",
    "Error\x20al\x20agregar\x20usuario:",
    "slice",
    "botAdmin",
    "_\x20,\x20haz\x20llamado\x20al\x20bot\x20*",
    "lodash",
    "isBot",
    "dls",
    "groupMetadata",
    "\x20messages\x20in\x20",
    "catch",
    "toString",
    "get",
    "statusCode",
    "loggedOut",
    "[EXEC]",
    "profilePictureUrl",
    "match",
    "sendPresenceUpdate",
    "isCmd",
    "conversation",
    "{title}",
    "messages.upsert",
    "mute",
    "length",
    "push",
    "filter",
    "add",
    "./node_modules/@hapi/boom",
    "indexOf",
    "\x20is\x20Authenticating...",
    "\x20contacts,\x20",
    "extendedTextMessage",
    "1112080QlIITv",
    "*🍟\x20Recientemente\x20se\x20ha\x20degradado\x20un\x20administrador\x20a\x20miembro*.\x0a\x0a\x20\x20*◦\x20Usuario\x20:*\x20@",
    "*🧃\x20Recientemente\x20se\x20ha\x20promovido\x20un\x20miembro\x20a\x20administrador*.\x0a\x0a\x20\x20*◦\x20Usuario\x20:*\x20@",
    "fromMe",
    "timedOut",
    "moment-timezone",
    "GROUP_PARTICIPANT_DEMOTE",
    "close",
    "timestamp",
    "groupMsg",
    "emit",
  ];
  _0x1524 = function () {
    return _0x160eab;
  };
  return _0x1524();
}
