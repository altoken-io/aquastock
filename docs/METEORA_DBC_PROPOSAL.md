# Propuesta: track "Best Use of Meteora DBC" (Solana Hackathon)

**Estado: propuesta para validar en equipo — nada de esto está implementado todavía.**
Este documento resume el análisis de encaje y la mecánica propuesta para competir por el bounty de Meteora ($5,000) dentro del hackathon de tokenized stocks en Solana, sin arriesgar la submission principal de AquaStock.

## 0. Contexto y deadline

- Submissions cierran **viernes 18 sept, 4:00pm ET**. Quedan ~4 días desde que se escribió este documento (14 sept).
- Estado actual del repo: **0% on-chain**. No hay programa Anchor, no hay wallet-adapter conectado, no hay Solana Pay. Todo el flujo de inversión (`Project → Position → Milestone → Impact`) corre sobre un dataset demo estático y Postgres/Prisma — ver `docs/ARCHITECTURE.md` y `docs/ROADMAP.md`.
- El panel admin (`/dashboard`, `/dashboard/milestones`) sí está construido y funcional (auth real vía Better Auth), aunque su acción "Mark verified" está deshabilitada porque no existe programa on-chain que respalde la verificación.

## 1. Qué pide el hackathon

**Capa general (obligatoria):** elegir un "wedge" sobre tokenized stocks — Trading, Investing, Credit/Yield, Infrastructure, o Consumer. AquaStock encaja hoy en **Infrastructure** (infraestructura de inversión, no solo price feeds) y tangencialmente en **Investing** (co-inversión estructurada gobierno + comunidad). Esta sigue siendo la submission principal y no depende de Meteora.

**Track Meteora DBC ($5,000, patrocinado):** no es "usa Solana", es específicamente usar la **Dynamic Bonding Curve** de Meteora — un primitivo de *lanzamiento de tokens* (curva configurable, fee schedule, quote token, umbral de graduación, migración a Meteora DAMM v2) — aplicado a acciones tokenizadas. El brief pide explícitamente:
- Mecánicas de lanzamiento ajustadas a activos equity-like (price discovery para pares poco líquidos / recién tokenizados).
- Configuraciones novedosas de curva o fees.
- Reglas de graduación creativas.
- Tooling para que issuers configuren y monitoreen pools DBC.

**Criterios de juicio:** originalidad de la configuración/caso de uso de DBC, solidez técnica, y vida después del hackathon. Cita textual: **"Working code on mainnet beats slides."**

Recursos oficiales:
- Guía de desarrollo DBC: https://docs.meteora.ag/developer-guides/dbc
- MCP server de docs de Meteora (para Claude/Cursor): https://docs.meteora.ag/mcp
- SDK TypeScript: https://github.com/MeteoraAg/dynamic-bonding-curve-sdk

## 2. Diagnóstico de encaje

**A favor:**
- La tesis del producto ("una posición gubernamental visible de-riskea el capital privado que sigue") es una historia real de *price discovery para un activo nuevo y poco líquido* — justo el ejemplo que da el brief de DBC. No es un ángulo forzado.
- El panel admin ya construido es, en forma, la "tooling que ayuda a issuers a configurar y monitorear pools DBC" que pide el brief — se reconvierte, no se construye desde cero.
- DBC es un primitivo ya deployado y auditado en mainnet: se configura y se llama vía SDK, no se escribe un programa nuevo. Para 4 días, es más rápido que terminar el programa Anchor propio que seguía pendiente del Día 2 del roadmap original.

**En contra / riesgo real:**
- Hoy una `Position` es una fila de base de datos, no un token. Convertirla en "compra sobre una bonding curve" es un cambio de modelo de producto, no un ajuste de UI.
- `apps/dapp/PRODUCT.md` tiene como anti-reference explícito: *"No token-price charts, no DeFi-protocol staking/yield framing."* Meter una bonding curve con precio de mercado choca con ese posicionamiento si se aplica directo al producto principal — ver decisión en la sección 3.
- Con cero integración on-chain previa, meter DBC + wallet-connect + cambio de modelo en el flujo principal en 4 días es el camino de mayor riesgo de terminar sin nada funcionando para ninguna de las dos pistas.

## 3. Decisión del equipo (validar aquí)

1. **Alcance:** DBC se construye como **capa opcional y aislada**, no como pivot del producto. La submission principal (Infrastructure/Investing, modelo actual) sigue su curso sin depender de esto. El track DBC es un demo aditivo — un solo proyecto, un solo pool — desacoplado de `packages/db-prisma` y del flujo de "fund this position" actual para no arriesgar lo que ya funciona.
2. **Alcance de marca:** el equipo confirma que el caso de uso puede salir del agua específicamente y generalizarse a "activos de infraestructura tokenizables" en general para esta pista — el agua queda como el ejemplo concreto, no como límite duro (esto ya está alineado con el principio 5 de `docs/ABOUT.md`: "Generalizable").

**Pendiente de confirmar por el equipo antes de tocar código:**
- ¿Quién de los 5 (según `docs/ROADMAP.md`) toma el spike de DBC sin bloquear el trabajo de wallet-connect/Solana Pay del plan original?
- ¿Confirmar con organizadores si esta submission (bounty DBC) puede ser el mismo proyecto que la submission principal o necesita entrega separada? — no está especificado en el brief pegado, no asumir.

## 4. Mecánica DBC propuesta (de aquí sale la originalidad)

El ángulo que es genuinamente nuevo para DBC — no un memecoin con otro nombre — es usar la curva para encarnar la tesis del producto como **mecánica de mercado**, no solo como texto en pantalla:

| Parámetro | Propuesta | Por qué |
|---|---|---|
| **Quote token** | USDC, no SOL | Activo equity-like pensado para inversores institucionales/gobierno; el "monto recaudado" no debe fluctuar con el precio de SOL. |
| **Forma de curva** | Larga y gradual, no la curva empinada típica de memecoin | Apropiada para price discovery de un activo nuevo y poco líquido — el caso exacto que pide el brief. Reduce dinámica pump/dump sobre un activo que representa infraestructura real. |
| **Compra-ancla** | La wallet pública (gobierno) ejecuta la primera compra sobre la curva al momento del lanzamiento del pool | Transacción real y verificable en Explorer — el "piso" de precio inicial. Es la prueba on-chain de la tesis del producto (`docs/ABOUT.md`: "on-chain evidence over claims"), no una etiqueta de UI. |
| **Fee schedule** | Fees más altos al inicio, que decaen conforme crece la porción comprada por la wallet pública | Encarna "a más compromiso gubernamental confirmado, menos fricción para el capital privado que sigue". Los fees iniciales pueden financiar, por ejemplo, un fondo de verificación de milestones. |
| **Regla de graduación** | Graduar a DAMM v2 cuando un milestone se marca verificado, no solo por umbral de monto recaudado | Es el "creative graduation rule" que pide el brief. Reutiliza directamente `/dashboard/milestones`, que ya existe (hoy con "Mark verified" deshabilitado). |
| **Tooling / vida después del hackathon** | El panel admin reconvertido en consola de configuración/monitoreo de pools DBC para issuers reales (gobiernos, ONGs, emisores de activos) | Responde directo al criterio "tooling that helps issuers configure and monitor DBC pools" y a "life after hackathon". |

**Nota técnica:** antes de fijar nombres exactos de parámetros del SDK (`@meteora-ag/dynamic-bonding-curve-sdk`), verificar contra el MCP de docs de Meteora en vez de asumir de memoria — los campos de curva/fee evolucionan entre versiones.

## 5. Plan de 4 días (capa aislada, no bloquea el plan principal)

1. **Hoy/mañana:** spike técnico aislado — script o página standalone que llame al SDK contra **devnet**, cree un config key con la curva/fee/quote-token propuestos, y ejecute la compra-ancla.
2. **Día 3:** si el spike de devnet funciona, replicar en **mainnet** con montos triviales (el brief valora mainnet sobre slides); conectar la verificación de milestone —aunque sea un botón manual del admin, no automatizado end-to-end— como disparador documentado de la graduación.
3. **Día 4:** vista mínima en el dashboard mostrando estado del pool (precio, progreso de curva, umbral de graduación). Freeze, grabar demo separado del pitch principal, escribir narrativa del track DBC como entrega independiente.

## 6. Qué NO hacer

- No migrar el modelo `Position` completo a tokens DBC en 4 días — máximo riesgo de quedarse sin nada funcionando en ninguna de las dos pistas.
- No prometer verificación de milestones on-chain totalmente automatizada disparando la graduación — un trigger manual bien explicado ("esto es lo que dispara la migración a DAMM v2 en producción") es honesto y suficiente. Inventar automatización rompe el principio de "no false certainty" que el equipo ya se impuso en `docs/ABOUT.md`.
- No reescribir el posicionamiento de marca del producto principal — el anti-reference "no token-price charts / no DeFi framing" se mantiene en el producto core; el demo DBC vive aparte con su propia narrativa ("infraestructura tokenizable"), no como el nuevo look del dashboard admin completo.

## 7. Próximo paso

Una vez el equipo valide esta propuesta (secciones 3 y 4 especialmente), el siguiente paso técnico es conectar el MCP de docs de Meteora y construir el spike aislado de devnet descrito en la sección 5.
