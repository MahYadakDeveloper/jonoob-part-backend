# نمونه ساختار لایه‌ی Realtime (ws) در مونولیت ماژولار

سند شامل ساختار مسیرها، نمونه کد، و نکات مهم برای پیاده‌سازی WebSocket در پروژه‌ی مونوریپو با NestJS.

> **توجه:** کدها نمونه‌ی آموزشی برای نشان دادن مرزها هستند، نه کد آماده‌ی production. نام دقیق APIهای Nest و کتابخانه‌ها را با نسخه‌ی نصب‌شده‌ی خودتان چک کنید.

---

## ۱. جریان‌های اصلی

سه جریان جدا وجود دارد و هر کدام مالک مشخص دارد:

| جریان | مثال | مالک اصلی |
|---|---|---|
| اتصال | کلاینت وصل می‌شود و هویتش مشخص می‌شود | `platform/realtime` |
| فرمان ورودی | پیک وضعیت محموله را عوض می‌کند | `ws/` ماژول مالک فرمان |
| اعلان خروجی | «سفارش تغییر کرد» به کلاینت می‌رسد | نگاشت: ماژول مالک رویداد، تحویل: `platform/realtime` |

---

## ۲. ساختار مسیرها

```
contracts/
  realtime/
    envelope.ts                     ← ساختار مشترک همه‌ی پیام‌ها
    order.ts                        ← topic و پیام‌های order
    delivery.ts                     ← فرمان‌های delivery

shared/
  realtime/
    ports.ts                        ← قراردادهای انتزاعی (ناشر، policy، handler)

domains/
  order/
    api/                            ← use caseهای عمومی
    impl/
    http/
    ws/
      order.subscription-policy.ts  ← مجوز اشتراک به topicهای order
      order.invalidation-mapper.ts  ← نگاشت رویداد داخلی به hint عمومی
      index.ts
  delivery/
    api/
    impl/
    http/
    ws/
      update-shipment-status.handler.ts   ← فرمان ورودی از پیک
      index.ts

platform/
  realtime/
    src/
      gateway/realtime.gateway.ts         ← سرور سوکت و چرخه‌ی اتصال
      connection/identity-resolver.ts     ← ساخت هویت اتصال از handshake
      registry/subscription-registry.ts   ← کدام اتصال در کدام topic است
      registry/policy-registry.ts         ← ثبت policyها
      registry/command-registry.ts        ← ثبت handlerها
      transport/redis-publisher.ts        ← ناشر (پیاده‌ی port)
      transport/redis-subscriber.ts       ← دریافت پیام در هر instance
      index.ts

apps/
  ws-api/
    src/
      main.ts
      ws-api.module.ts                    ← composition root
      realtime-bootstrap.ts               ← ثبت policy و handlerهای ماژول‌ها
  worker/
    src/
      outbox-realtime.consumer.ts         ← outbox ← نگاشت ← ناشر
```

---

## ۳. قواعد وابستگی

```
apps ──▶ platform ──▶ domains ──▶ shared
                         │            ▲
                         └──▶ contracts ◀── platform
```

| پوشه | مجاز به import |
|---|---|
| `domains/*/ws` | `api` همان ماژول، `shared`، `contracts` |
| `domains/*/ws` | **ممنوع:** `impl`، `platform`، `apps`، ماژول دیگر (مگر `api` آن) |
| `platform/realtime` | `shared`، `contracts` |
| `apps/*` | همه (فقط اینجا اتصال انجام می‌شود) |

نکته: ماژول‌های دامنه **هرگز `platform` را import نمی‌کنند**. هر چیزی که از بیرون لازم دارند (مثل ناشر پیام) از port در `shared` می‌آید و `apps` پیاده‌سازی را تزریق می‌کند.

---

## ۴. قراردادهای انتزاعی (`shared/realtime/ports.ts`)

```ts
export interface ConnectionIdentity {
  connectionId: string;
  userId: string;
  roles: string[];
  memberId?: string;
}

export interface RealtimeMessage {
  id: string;
  type: string;      // مثلاً 'invalidate'
  topic: string;     // مثلاً 'order:123'
  version: number;
  sentAt: string;
}

/** ناشر پیام؛ پیاده‌سازی در platform/realtime */
export interface RealtimePublisher {
  publish(message: RealtimeMessage): Promise<void>;
}

/** هر ماژول برای topicهای خودش یک policy ثبت می‌کند */
export interface SubscriptionPolicy {
  /** پیشوند topic، مثلاً 'order' برای 'order:123' */
  readonly topicPrefix: string;
  canSubscribe(identity: ConnectionIdentity, topicKey: string): Promise<boolean>;
}

/** هر ماژول برای فرمان‌های ورودی خودش handler ثبت می‌کند */
export interface CommandHandler<TPayload = unknown> {
  /** مثلاً 'delivery.shipment.update-status' */
  readonly command: string;
  /** اعتبارسنجی ورودی؛ در صورت نامعتبر بودن خطا پرتاب می‌کند */
  parse(input: unknown): TPayload;
  handle(identity: ConnectionIdentity, payload: TPayload): Promise<void>;
}

export const REALTIME_PUBLISHER = Symbol('REALTIME_PUBLISHER');
```

**نکات:**
- این فایل فقط نوع و قرارداد دارد، بدون هیچ import از `platform` یا دامنه‌ها.
- policy و handler هر دو به `ConnectionIdentity` نیاز دارند ولی چیزی از سوکت نمی‌دانند؛ به همین دلیل ماژول‌ها بدون وابستگی به transport تست‌پذیرند.

---

## ۵. قرارداد پیام (`contracts/realtime`)

```ts
// contracts/realtime/envelope.ts
import { z } from 'zod';

export const envelopeSchema = z.object({
  id: z.string(),
  type: z.string(),
  topic: z.string(),
  version: z.number().int().nonnegative(),
  sentAt: z.string().datetime(),
});

export type Envelope = z.infer<typeof envelopeSchema>;
```

```ts
// contracts/realtime/order.ts
import { z } from 'zod';
import { envelopeSchema } from './envelope';

export const ORDER_TOPIC_PREFIX = 'order';
export const orderTopic = (orderId: string) => `${ORDER_TOPIC_PREFIX}:${orderId}`;

export const orderInvalidateSchema = envelopeSchema.extend({
  type: z.literal('invalidate'),
});
```

```ts
// contracts/realtime/delivery.ts
import { z } from 'zod';

export const UPDATE_SHIPMENT_STATUS = 'delivery.shipment.update-status';

export const updateShipmentStatusSchema = z.object({
  shipmentId: z.string(),
  status: z.enum(['picked_up', 'in_transit', 'delivered', 'failed']),
});

export type UpdateShipmentStatusPayload = z.infer<typeof updateShipmentStatusSchema>;
```

**نکات:**
- پیام فقط **hint** است؛ داده‌ی کامل سفارش در آن نیست. کلاینت داده را با GET معمولی می‌گیرد.
- `version` مبنای نادیده‌گرفتن پیام‌های تکراری و خارج از ترتیب در کلاینت است.
- تغییر قرارداد فقط **افزایشی** (فیلد اختیاری جدید) باشد.

---

## ۶. ماژول order: policy و نگاشت

### مجوز اشتراک

```ts
// domains/order/ws/order.subscription-policy.ts
import { Inject, Injectable } from '@nestjs/common';
import type { ConnectionIdentity, SubscriptionPolicy } from '@proj/shared-realtime';
import { ORDER_TOPIC_PREFIX } from '@proj/contracts/realtime/order';
import { ORDER_API, type OrderApi } from '../api';

@Injectable()
export class OrderSubscriptionPolicy implements SubscriptionPolicy {
  readonly topicPrefix = ORDER_TOPIC_PREFIX;

  constructor(@Inject(ORDER_API) private readonly orders: OrderApi) {}

  async canSubscribe(identity: ConnectionIdentity, orderId: string): Promise<boolean> {
    if (identity.roles.includes('staff')) return true;

    // order مالک قانون «چه کسی سفارش چه کسی را می‌بیند» است
    const owner = await this.orders.getOwner(orderId);
    return owner !== null && owner.memberId === identity.memberId;
  }
}
```

### نگاشت رویداد داخلی به پیام عمومی

```ts
// domains/order/ws/order.invalidation-mapper.ts
import { randomUUID } from 'node:crypto';
import type { RealtimeMessage } from '@proj/shared-realtime';
import { orderTopic } from '@proj/contracts/realtime/order';

/** رویداد داخلی دامنه؛ به کلاینت نشت نمی‌کند */
export interface OrderChangedInternalEvent {
  orderId: string;
  version: number;
  occurredAt: Date;
}

export function mapOrderChanged(event: OrderChangedInternalEvent): RealtimeMessage {
  return {
    id: randomUUID(),
    type: 'invalidate',
    topic: orderTopic(event.orderId),
    version: event.version,
    sentAt: new Date().toISOString(),
  };
}
```

```ts
// domains/order/ws/index.ts
export { OrderSubscriptionPolicy } from './order.subscription-policy';
export { mapOrderChanged, type OrderChangedInternalEvent } from './order.invalidation-mapper';
```

**نکات:**
- policy داخل ماژول است چون فقط order می‌داند مالک سفارش کیست. platform این قانون را نمی‌داند.
- نگاشت کنار مالک رویداد است؛ تغییر رویداد داخلی فقط همین فایل را تحت تأثیر قرار می‌دهد، نه قرارداد کلاینت‌ها.
- policy فقط به `OrderApi` وابسته است، نه `impl`.

---

## ۷. ماژول delivery: handler فرمان

```ts
// domains/delivery/ws/update-shipment-status.handler.ts
import { Inject, Injectable } from '@nestjs/common';
import type { CommandHandler, ConnectionIdentity } from '@proj/shared-realtime';
import {
  UPDATE_SHIPMENT_STATUS,
  updateShipmentStatusSchema,
  type UpdateShipmentStatusPayload,
} from '@proj/contracts/realtime/delivery';
import { DELIVERY_API, type DeliveryApi } from '../api';

@Injectable()
export class UpdateShipmentStatusHandler
  implements CommandHandler<UpdateShipmentStatusPayload>
{
  readonly command = UPDATE_SHIPMENT_STATUS;

  constructor(@Inject(DELIVERY_API) private readonly delivery: DeliveryApi) {}

  parse(input: unknown): UpdateShipmentStatusPayload {
    return updateShipmentStatusSchema.parse(input);
  }

  async handle(identity: ConnectionIdentity, payload: UpdateShipmentStatusPayload) {
    // مجوز و قوانین انتقال وضعیت داخل DeliveryApi بررسی می‌شود
    await this.delivery.updateShipmentStatus({
      shipmentId: payload.shipmentId,
      status: payload.status,
      actorUserId: identity.userId,
    });
  }
}
```

```ts
// domains/delivery/ws/index.ts
export { UpdateShipmentStatusHandler } from './update-shipment-status.handler';
```

**نکات:**
- handler یک **پوسته‌ی نازک** است: اعتبارسنجی، صدا زدن use case، تمام.
- بررسی مجوز و قوانین کسب‌وکار در `api`/`impl` است؛ اگر همان use case از HTTP هم صدا زده شود، همان قواعد اعمال می‌شود و تکرار نمی‌شود.
- هویت را همیشه از `ConnectionIdentity` بگیرید، نه از payload؛ کلاینت نباید بتواند هویت خودش را اعلام کند.

---

## ۸. زیرساخت: `platform/realtime`

### رجیستری اشتراک

```ts
// platform/realtime/src/registry/subscription-registry.ts
import { Injectable } from '@nestjs/common';

@Injectable()
export class SubscriptionRegistry {
  private readonly topicToConnections = new Map<string, Set<string>>();
  private readonly connectionToTopics = new Map<string, Set<string>>();

  subscribe(connectionId: string, topic: string) {
    this.get(this.topicToConnections, topic).add(connectionId);
    this.get(this.connectionToTopics, connectionId).add(topic);
  }

  /** هنگام قطع اتصال همه‌ی اشتراک‌ها پاک شود تا نشت حافظه نداشته باشیم */
  removeConnection(connectionId: string) {
    for (const topic of this.connectionToTopics.get(connectionId) ?? []) {
      const set = this.topicToConnections.get(topic);
      set?.delete(connectionId);
      if (set?.size === 0) this.topicToConnections.delete(topic);
    }
    this.connectionToTopics.delete(connectionId);
  }

  connectionsOf(topic: string): ReadonlySet<string> {
    return this.topicToConnections.get(topic) ?? new Set();
  }

  private get<K>(map: Map<K, Set<string>>, key: K) {
    let set = map.get(key);
    if (!set) map.set(key, (set = new Set()));
    return set;
  }
}
```

### رجیستری policy و handler

```ts
// platform/realtime/src/registry/policy-registry.ts
import { Injectable } from '@nestjs/common';
import type { SubscriptionPolicy } from '@proj/shared-realtime';

@Injectable()
export class PolicyRegistry {
  private readonly byPrefix = new Map<string, SubscriptionPolicy>();

  register(policy: SubscriptionPolicy) {
    if (this.byPrefix.has(policy.topicPrefix)) {
      throw new Error(`policy already registered: ${policy.topicPrefix}`);
    }
    this.byPrefix.set(policy.topicPrefix, policy);
  }

  find(prefix: string) {
    return this.byPrefix.get(prefix);
  }
}
```

```ts
// platform/realtime/src/registry/command-registry.ts
import { Injectable } from '@nestjs/common';
import type { CommandHandler } from '@proj/shared-realtime';

@Injectable()
export class CommandRegistry {
  private readonly byCommand = new Map<string, CommandHandler>();

  register(handler: CommandHandler) {
    if (this.byCommand.has(handler.command)) {
      throw new Error(`handler already registered: ${handler.command}`);
    }
    this.byCommand.set(handler.command, handler);
  }

  find(command: string) {
    return this.byCommand.get(command);
  }
}
```

### gateway

```ts
// platform/realtime/src/gateway/realtime.gateway.ts
import { randomUUID } from 'node:crypto';
import type { IncomingMessage } from 'node:http';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
} from '@nestjs/websockets';
import type WebSocket from 'ws';
import type { ConnectionIdentity } from '@proj/shared-realtime';
import { IdentityResolver } from '../connection/identity-resolver';
import { SubscriptionRegistry } from '../registry/subscription-registry';
import { PolicyRegistry } from '../registry/policy-registry';
import { CommandRegistry } from '../registry/command-registry';

interface Connection {
  socket: WebSocket;
  identity: ConnectionIdentity;
}

@WebSocketGateway({ path: '/realtime', maxPayload: 16 * 1024 })
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly connections = new Map<string, Connection>();
  private readonly ids = new WeakMap<WebSocket, string>();

  constructor(
    private readonly identities: IdentityResolver,
    private readonly subscriptions: SubscriptionRegistry,
    private readonly policies: PolicyRegistry,
    private readonly commands: CommandRegistry,
  ) {}

  async handleConnection(socket: WebSocket, request: IncomingMessage) {
    const identity = await this.identities.resolve(request, randomUUID());
    if (!identity) return socket.close(4401, 'unauthorized');

    this.connections.set(identity.connectionId, { socket, identity });
    this.ids.set(socket, identity.connectionId);

    socket.on('message', (raw) => void this.onMessage(identity, socket, raw.toString()));
  }

  handleDisconnect(socket: WebSocket) {
    const id = this.ids.get(socket);
    if (!id) return;
    this.connections.delete(id);
    this.subscriptions.removeConnection(id);
  }

  /** تحویل پیام به اتصال‌های محلی این instance */
  deliver(topic: string, payload: string) {
    for (const id of this.subscriptions.connectionsOf(topic)) {
      const conn = this.connections.get(id);
      if (conn && conn.socket.readyState === conn.socket.OPEN) {
        conn.socket.send(payload);
      }
    }
  }

  private async onMessage(identity: ConnectionIdentity, socket: WebSocket, raw: string) {
    let msg: { kind: string; ref?: string; topic?: string; command?: string; payload?: unknown };
    try {
      msg = JSON.parse(raw);
    } catch {
      return this.reply(socket, undefined, 'error', 'invalid_json');
    }

    try {
      if (msg.kind === 'subscribe' && msg.topic) {
        const [prefix, key] = msg.topic.split(':');
        const policy = this.policies.find(prefix);
        if (!policy || !key || !(await policy.canSubscribe(identity, key))) {
          return this.reply(socket, msg.ref, 'error', 'forbidden');
        }
        this.subscriptions.subscribe(identity.connectionId, msg.topic);
        return this.reply(socket, msg.ref, 'ack');
      }

      if (msg.kind === 'command' && msg.command) {
        const handler = this.commands.find(msg.command);
        if (!handler) return this.reply(socket, msg.ref, 'error', 'unknown_command');
        await handler.handle(identity, handler.parse(msg.payload));
        return this.reply(socket, msg.ref, 'ack');
      }

      return this.reply(socket, msg.ref, 'error', 'unknown_kind');
    } catch {
      // جزئیات خطای داخلی به کلاینت نشت نکند
      return this.reply(socket, msg.ref, 'error', 'failed');
    }
  }

  private reply(socket: WebSocket, ref: string | undefined, kind: 'ack' | 'error', code?: string) {
    socket.send(JSON.stringify({ kind, ref, code }));
  }
}
```

**نکات:**
- gateway هیچ دانشی از order یا delivery ندارد؛ فقط به `prefix` و `command` نگاه می‌کند.
- `ref` شناسه‌ی همبستگی است تا کلاینت پاسخ را به درخواست خودش وصل کند.
- `maxPayload` اندازه‌ی پیام ورودی را محدود می‌کند.
- در نمونه، بررسی heartbeat، محدودیت نرخ و فشار برگشتی (backpressure) برای کوتاه ماندن حذف شده؛ در پیاده‌سازی واقعی لازم‌اند.
- خطاها کدهای کوتاه و ثابت برمی‌گردانند، نه پیام استثنا.

### ناشر و دریافت‌کننده‌ی بین‌پروسه‌ای

```ts
// platform/realtime/src/transport/redis-publisher.ts
import { Inject, Injectable } from '@nestjs/common';
import type Redis from 'ioredis';
import type { RealtimeMessage, RealtimePublisher } from '@proj/shared-realtime';

export const REALTIME_CHANNEL = 'realtime:out';
export const REDIS_PUB = Symbol('REDIS_PUB');

@Injectable()
export class RedisRealtimePublisher implements RealtimePublisher {
  constructor(@Inject(REDIS_PUB) private readonly redis: Redis) {}

  async publish(message: RealtimeMessage) {
    await this.redis.publish(REALTIME_CHANNEL, JSON.stringify(message));
  }
}
```

```ts
// platform/realtime/src/transport/redis-subscriber.ts
import { Inject, Injectable, OnModuleInit } from '@nestjs/common';
import type Redis from 'ioredis';
import { RealtimeGateway } from '../gateway/realtime.gateway';
import { REALTIME_CHANNEL } from './redis-publisher';

export const REDIS_SUB = Symbol('REDIS_SUB');

/** فقط در پروسه‌ی ws-api فعال می‌شود */
@Injectable()
export class RedisRealtimeSubscriber implements OnModuleInit {
  constructor(
    @Inject(REDIS_SUB) private readonly redis: Redis,
    private readonly gateway: RealtimeGateway,
  ) {}

  async onModuleInit() {
    await this.redis.subscribe(REALTIME_CHANNEL);
    this.redis.on('message', (_channel, raw) => {
      const { topic } = JSON.parse(raw) as { topic: string };
      this.gateway.deliver(topic, raw);
    });
  }
}
```

**نکات:**
- اتصال‌ها در پروسه‌ی `ws-api` هستند؛ **worker نمی‌تواند مستقیم روی سوکت بنویسد**. به همین دلیل کانال بین‌پروسه‌ای لازم است.
- هر instance از `ws-api` مشترک کانال است و فقط به اتصال‌های محلی خودش تحویل می‌دهد؛ مقیاس افقی هم از همین راه حل می‌شود.
- Redis pub/sub پیام را ذخیره نمی‌کند (fire-and-forget). این برای hint قابل قبول است، چون لایه‌ی HTTP cache و changes feed جبران‌کننده‌اند. اگر تحویل مطمئن‌تر لازم شد، به Streams یا broker بروید.

---

## ۹. composition root

### ws-api

```ts
// apps/ws-api/src/realtime-bootstrap.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { CommandRegistry, PolicyRegistry } from '@proj/platform-realtime';
import { OrderSubscriptionPolicy } from '@proj/order/ws';
import { UpdateShipmentStatusHandler } from '@proj/delivery/ws';

/** تنها جایی که ماژول‌ها به زیرساخت realtime وصل می‌شوند */
@Injectable()
export class RealtimeBootstrap implements OnModuleInit {
  constructor(
    private readonly policies: PolicyRegistry,
    private readonly commands: CommandRegistry,
    private readonly orderPolicy: OrderSubscriptionPolicy,
    private readonly updateStatus: UpdateShipmentStatusHandler,
  ) {}

  onModuleInit() {
    this.policies.register(this.orderPolicy);
    this.commands.register(this.updateStatus);
  }
}
```

```ts
// apps/ws-api/src/ws-api.module.ts
import { Module } from '@nestjs/common';
import { RealtimeModule } from '@proj/platform-realtime';
import { OrderModule } from '@proj/order';
import { DeliveryModule } from '@proj/delivery';
import { OrderSubscriptionPolicy } from '@proj/order/ws';
import { UpdateShipmentStatusHandler } from '@proj/delivery/ws';
import { RealtimeBootstrap } from './realtime-bootstrap';

@Module({
  imports: [RealtimeModule, OrderModule, DeliveryModule],
  providers: [OrderSubscriptionPolicy, UpdateShipmentStatusHandler, RealtimeBootstrap],
})
export class WsApiModule {}
```

### worker

```ts
// apps/worker/src/outbox-realtime.consumer.ts
import { Inject, Injectable } from '@nestjs/common';
import { REALTIME_PUBLISHER, type RealtimePublisher } from '@proj/shared-realtime';
import { mapOrderChanged, type OrderChangedInternalEvent } from '@proj/order/ws';

@Injectable()
export class OutboxRealtimeConsumer {
  constructor(
    @Inject(REALTIME_PUBLISHER) private readonly publisher: RealtimePublisher,
  ) {}

  /** برای هر رویداد outbox از نوع order.changed صدا زده می‌شود */
  async onOrderChanged(event: OrderChangedInternalEvent) {
    await this.publisher.publish(mapOrderChanged(event));
  }
}
```

**نکات:**
- در `ws-api` پیاده‌ی `REALTIME_PUBLISHER` لازم نیست؛ فقط worker ناشر را به `RedisRealtimePublisher` متصل می‌کند.
- ثبت policy و handler در `RealtimeBootstrap` است، نه در خود ماژول‌ها؛ بنابراین ماژول‌ها هیچ‌وقت به `platform` وابسته نمی‌شوند.
- ثبت تکراری (دو policy برای یک prefix) در زمان راه‌اندازی خطا می‌دهد، نه در زمان اجرا.

---

## ۱۰. دو جریان کامل

### فرمان: پیک وضعیت محموله را عوض می‌کند

1. اتصال پیک هنگام handshake توسط `IdentityResolver` احراز هویت شده است.
2. پیام `command` با نام `delivery.shipment.update-status` می‌رسد.
3. gateway handler ثبت‌شده را پیدا می‌کند و `parse` ورودی را اعتبارسنجی می‌کند.
4. `UpdateShipmentStatusHandler` در `delivery/ws` متد `DeliveryApi.updateShipmentStatus` را صدا می‌زند.
5. مجوز و قوانین انتقال وضعیت در `delivery` بررسی می‌شود.
6. `ack` با همان `ref` برمی‌گردد.

### اعلان: وضعیت سفارش تغییر می‌کند

1. `order/impl` تغییر را ثبت می‌کند و رویداد را **در همان تراکنش** در outbox می‌نویسد.
2. worker رویداد را برمی‌دارد و `mapOrderChanged` آن را به hint عمومی نگاشت می‌کند.
3. `RedisRealtimePublisher` پیام را روی کانال بین‌پروسه‌ای می‌گذارد.
4. هر instance از `ws-api` پیام را می‌گیرد و به اتصال‌های محلی مشترک در `order:<id>` می‌رساند (اشتراک آن‌ها قبلاً با `OrderSubscriptionPolicy` تأیید شده بود).
5. کلاینت نسخه را با cache مقایسه می‌کند و در صورت لزوم GET می‌زند.

---

## ۱۱. نکات مهم و خطاهای رایج

**معماری**
- `ws` را فقط برای ماژول‌هایی بسازید که **واقعاً** realtime دارند.
- `ws/` فقط به `api` همان ماژول وابسته باشد، نه `impl`.
- نگاشت رویداد داخلی به پیام عمومی را نادیده نگیرید؛ بدون آن، refactor داخلی قرارداد کلاینت را می‌شکند.
- قراردادها در `contracts` باشند، نه داخل ماژول‌ها.

**امنیت**
- احراز هویت **هنگام handshake** انجام شود، نه بعد از پذیرش پیام‌ها.
- مجوز را **هم هنگام اشتراک و هم هنگام فرمان** بررسی کنید؛ اتصال معتبر به معنی دسترسی به همه‌چیز نیست.
- هویت فرمان را از اتصال بگیرید، نه از payload.
- پیام hint حاوی داده‌ی خصوصی (قیمت اختصاصی، اطلاعات مشتری) نباشد.
- محدودیت اندازه‌ی پیام، نرخ ارسال، و تعداد اشتراک هر اتصال را اعمال کنید.

**پایداری**
- هنگام قطع اتصال، اشتراک‌ها را حتماً پاک کنید (نشت حافظه).
- heartbeat برای تشخیص اتصال‌های مرده لازم است.
- کلاینت باید با backoff دوباره وصل شود و پس از اتصال دوباره **اشتراک‌ها را از نو بفرستد** و داده‌ی از دست‌رفته را با changes feed جبران کند.
- ارسال به اتصال کند را کنترل کنید (backpressure)، وگرنه حافظه‌ی سرور پر می‌شود.
- تغییرات انبوه را با یک پیام ابطال کلی اعلام کنید، نه هزاران پیام تکی.

**آزمون**
- policy و handler را بدون سوکت تست کنید (چون فقط به port و api وابسته‌اند).
- نگاشت‌ها توابع خالص‌اند و ساده‌ترین بخش برای تست‌اند.
- gateway را با تست یکپارچه‌ی سبک (دو کلاینت، یک سرور) بسنجید.

**اعمال خودکار مرزها**
- قاعده‌ی lint یا dependency-cruiser: `domains/*/ws` فقط به `api` خودش، `shared` و `contracts` دسترسی داشته باشد؛ `platform` به `impl` دسترسی نداشته باشد.

---

## ۱۲. چک‌لیست

- [ ] قراردادهای انتزاعی (ناشر، policy، handler) در `shared`
- [ ] envelope و schema پیام‌ها در `contracts`
- [ ] هر ماژول realtime‌دار یک پوشه‌ی `ws` دارد و فقط به `api` خودش وابسته است
- [ ] policy اشتراک و handler فرمان در ماژول مالک
- [ ] نگاشت رویداد داخلی به پیام عمومی در ماژول مالک رویداد
- [ ] gateway و رجیستری‌ها بدون دانش کسب‌وکار در `platform/realtime`
- [ ] ارتباط worker و ws-api از طریق کانال بین‌پروسه‌ای
- [ ] ثبت policy و handlerها فقط در `apps/ws-api`
- [ ] احراز هویت در handshake و بررسی مجوز در اشتراک و فرمان
- [ ] heartbeat، محدودیت نرخ و اندازه، backpressure
- [ ] تست‌های policy، handler و نگاشت بدون سوکت
- [ ] قاعده‌ی lint برای اعمال مرزها
