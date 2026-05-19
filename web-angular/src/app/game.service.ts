import { Injectable, signal } from '@angular/core';
import { Client, Room } from 'colyseus.js';
import { PairingView, PlayerView, StateView } from './models';
import { dlog } from './dlog'; // TEMPORAL: logs de depuración

/**
 * GameService — dueño de la conexión con el game server (Colyseus) y del
 * estado del juego. Es el equivalente del React Context de la versión web/.
 *
 * `providedIn: 'root'`  =>  una única instancia para toda la app. Cualquier
 * componente la obtiene con `inject(GameService)` y comparte el mismo estado.
 */
@Injectable({ providedIn: 'root' })
export class GameService {
  /** Cliente y sala de Colyseus. Privados: nadie los toca desde afuera. */
  private client?: Client;
  private room?: Room;

  /*
   * Estado expuesto como SIGNALS.
   *
   * Patrón usado acá: por cada dato hay un signal privado `_x` que solo el
   * servicio escribe (`_x.set(...)`), y un signal público `x` de SOLO
   * LECTURA (`asReadonly()`) que los componentes consumen. Así la UI nunca
   * puede mutar el estado por error: la única fuente de verdad es el server.
   */
  private readonly _estado = signal<StateView | null>(null);
  private readonly _miId = signal<string | null>(null);
  private readonly _conectado = signal(false);
  private readonly _cargando = signal(false);
  private readonly _error = signal<string | null>(null);

  /** Estado de la partida (null = todavía no estoy en una sala). */
  readonly estado = this._estado.asReadonly();
  /** Mi sessionId dentro de la sala. */
  readonly miId = this._miId.asReadonly();
  /** ¿Hay conexión viva con la sala? */
  readonly conectado = this._conectado.asReadonly();
  /** ¿Hay una operación de conexión en curso? */
  readonly cargando = this._cargando.asReadonly();
  /** Último mensaje de error para mostrar (o null). */
  readonly error = this._error.asReadonly();
  /** URL del game server, para diagnóstico en pantalla. */
  readonly servidorUrl = this.endpointPorDefecto();

  constructor() {
    dlog('service', 'GameService creado');
    // Al arrancar la app, intentar reconectar a una sala previa (si la hay).
    this.intentarReconexion();
  }

  /* ============================================================
     Endpoint del servidor
     ============================================================ */

  /**
   * Deriva la URL del game server del host desde el que se abrió la web.
   * Así funciona igual en `localhost` o entrando por la IP de la red.
   */
  private endpointPorDefecto(): string {
    const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${proto}//${window.location.hostname}:2567`;
  }

  private getClient(): Client {
    if (!this.client) this.client = new Client(this.servidorUrl);
    return this.client;
  }

  /* ============================================================
     Conexión a la sala
     ============================================================ */

  /** Crea una sala nueva y entra como anfitrión. */
  async crearSala(nickname: string, avatar: string): Promise<void> {
    dlog('crearSala', { nickname, avatar });
    this._error.set(null);
    this._cargando.set(true);
    try {
      const room = await this.getClient().create('game', {
        code: this.genCode(),
        nickname,
        avatar,
        playerToken: this.getPlayerToken(),
      });
      this.attach(room);
    } catch {
      dlog('crearSala', 'ERROR: no se pudo conectar');
      this._error.set(
        `No se pudo conectar al servidor (${this.servidorUrl}). ` +
          `¿Está corriendo y accesible?`,
      );
    } finally {
      this._cargando.set(false);
    }
  }

  /** Se une a una sala existente por su código. */
  async unirseSala(code: string, nickname: string, avatar: string): Promise<void> {
    dlog('unirseSala', { code, nickname, avatar });
    this._error.set(null);
    this._cargando.set(true);
    const limpio = code.trim().toUpperCase();
    try {
      const room = await this.getClient().join('game', {
        code: limpio,
        nickname,
        avatar,
        playerToken: this.getPlayerToken(),
      });
      this.attach(room);
    } catch {
      dlog('unirseSala', `ERROR: no se pudo unir a «${limpio}»`);
      this._error.set(
        `No se pudo unir a «${limpio}». Revisá el código y que el ` +
          `servidor (${this.servidorUrl}) esté accesible.`,
      );
    } finally {
      this._cargando.set(false);
    }
  }

  /** Reconexión automática tras recargar la página. */
  private async intentarReconexion(): Promise<void> {
    const raw = localStorage.getItem('traicion.session');
    if (!raw) {
      dlog('reconexion', 'sin sesión previa');
      return;
    }
    try {
      const { reconnectionToken } = JSON.parse(raw);
      if (!reconnectionToken) return;
      dlog('reconexion', 'intentando reconectar…', { reconnectionToken });
      this._cargando.set(true);
      const room = await this.getClient().reconnect(reconnectionToken);
      this.attach(room);
    } catch {
      dlog('reconexion', 'ERROR: la sesión previa ya no es válida');
      localStorage.removeItem('traicion.session');
    } finally {
      this._cargando.set(false);
    }
  }

  /**
   * Conecta los callbacks de la sala a los signals. Acá está el puente
   * clave: cuando el servidor cambia el estado, `onStateChange` toma un
   * snapshot y lo guarda en el signal `_estado`. Como cambió el signal,
   * Angular vuelve a pintar solo las pantallas que lo leen.
   */
  private attach(room: Room): void {
    dlog('attach', 'sala conectada', { sessionId: room.sessionId });
    this.room = room;
    this._miId.set(room.sessionId);
    this._conectado.set(true);
    this._error.set(null);
    this._estado.set(this.snapshot(room));

    room.onStateChange(() => {
      const snap = this.snapshot(room);
      dlog('onStateChange', {
        status: snap.status,
        phase: snap.phase,
        jugadores: snap.players.length,
        hostId: snap.hostId,
      });
      this._estado.set(snap);
    });
    room.onError((code, message) => {
      dlog('onError', { code, message });
      this._error.set(message || 'Error de conexión.');
    });
    room.onLeave((code) => {
      dlog('onLeave', { code });
      this._conectado.set(false);
      // code 4000 = el anfitrión me expulsó (ver GameRoom: c.leave(4000)).
      // Limpiamos el estado para volver a la pantalla de Ingreso con aviso.
      if (code === 4000) {
        this._estado.set(null);
        this._miId.set(null);
        this._error.set('El anfitrión te expulsó de la sala.');
        try {
          localStorage.removeItem('traicion.session');
        } catch {
          /* ignore */
        }
      }
    });

    // Guardar el token de reconexión para sobrevivir a un reload.
    try {
      localStorage.setItem(
        'traicion.session',
        JSON.stringify({ reconnectionToken: room.reconnectionToken }),
      );
    } catch {
      /* localStorage no disponible: seguimos sin reconexión */
    }
  }

  /* ============================================================
     Acciones — el componente las llama, el servicio manda el mensaje
     ============================================================ */

  /* --- lobby --- */
  ficharEntrada(valor: boolean): void {
    dlog('enviar', 'ready', valor);
    this.room?.send('ready', valor);
  }
  agregarBots(n: number): void {
    dlog('enviar', 'dev:addBots', n);
    this.room?.send('dev:addBots', n);
  }
  limpiarBots(): void {
    dlog('enviar', 'dev:clearBots');
    this.room?.send('dev:clearBots');
  }
  expulsar(id: string): void {
    dlog('enviar', 'kick', id);
    this.room?.send('kick', id);
  }

  /* --- partida --- */
  empezarPartida(): void {
    dlog('enviar', 'startGame');
    this.room?.send('startGame');
  }
  confirmar(): void {
    dlog('enviar', 'ack');
    this.room?.send('ack');
  }
  decidir(valor: 'verde' | 'rojo'): void {
    dlog('enviar', 'decidir', valor);
    this.room?.send('decidir', valor);
  }
  /** Voto de un minijuego de votación (El Recorte): manda el id del votado. */
  votar(idVotado: string): void {
    dlog('enviar', 'decidir(voto)', idVotado);
    this.room?.send('decidir', idVotado);
  }

  /** Sale de la sala y limpia todo el estado local. */
  salir(): void {
    dlog('salir', 'saliendo de la sala');
    this.room?.leave(true);
    this.room = undefined;
    this._estado.set(null);
    this._conectado.set(false);
    this._miId.set(null);
    try {
      localStorage.removeItem('traicion.session');
    } catch {
      /* ignore */
    }
  }

  /* ============================================================
     Helpers
     ============================================================ */

  /** Identidad persistente del jugador (para reconectar como el mismo). */
  private getPlayerToken(): string {
    let t = localStorage.getItem('traicion.token');
    if (!t) {
      t = crypto.randomUUID();
      localStorage.setItem('traicion.token', t);
    }
    return t;
  }

  /** Código de sala legible: 5 letras mayúsculas. */
  private genCode(): string {
    const letras = 'ABCDEFGHJKLMNPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 5; i++) {
      code += letras[Math.floor(Math.random() * letras.length)];
    }
    return code;
  }

  /**
   * Convierte el estado Schema de Colyseus en una StateView plana.
   * Es defensivo: el primer render puede ocurrir antes de que el estado
   * termine de sincronizarse, así que cada campo tiene un valor por defecto.
   */
  private snapshot(room: Room): StateView {
    const s = room.state as unknown as
      | {
          code?: string;
          status?: string;
          hostId?: string;
          phase?: string;
          challengeId?: string;
          tanda?: number;
          tandasTotal?: number;
          ronda?: number;
          rondasTotal?: number;
          rondaTipo?: string;
          players?: { forEach: (cb: (p: PlayerView) => void) => void };
          pairings?: { forEach: (cb: (p: PairingView) => void) => void };
        }
      | undefined;

    const players: PlayerView[] = [];
    if (s?.players && typeof s.players.forEach === 'function') {
      s.players.forEach((p) =>
        players.push({
          id: p.id,
          nickname: p.nickname,
          avatar: p.avatar,
          ready: p.ready,
          isBot: p.isBot,
          connected: p.connected,
          influence: p.influence ?? 0,
          decision: p.decision ?? '',
          acted: p.acted ?? false,
          lastDelta: p.lastDelta ?? 0,
        }),
      );
    }

    const pairings: PairingView[] = [];
    if (s?.pairings && typeof s.pairings.forEach === 'function') {
      s.pairings.forEach((pr) => pairings.push({ aId: pr.aId, bId: pr.bId }));
    }

    return {
      code: s?.code ?? '',
      status: s?.status ?? 'lobby',
      hostId: s?.hostId ?? '',
      phase: s?.phase ?? 'lobby',
      challengeId: s?.challengeId ?? '',
      tanda: s?.tanda ?? 0,
      tandasTotal: s?.tandasTotal ?? 0,
      ronda: s?.ronda ?? 0,
      rondasTotal: s?.rondasTotal ?? 0,
      rondaTipo: s?.rondaTipo ?? '',
      players,
      pairings,
    };
  }
}
