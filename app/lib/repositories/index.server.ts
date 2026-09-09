/**
 * Repository selection - the single place that decides WHICH implementation the
 * app runs against. Loaders and actions import from here; components never do.
 *
 * The `.server.ts` suffix keeps this module (and therefore every fixture it
 * pulls in) out of the client bundle. When a database arrives, the swap is the
 * import line below and nothing else: see `./README.md`.
 */

import { createMockBaselineRepository } from "../mock/baseline";
import { type BaselineRepository } from "./types";

export const baselineRepository: BaselineRepository =
  createMockBaselineRepository();
