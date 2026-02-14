import { readFile } from "fs/promises";
import { resolve, join } from "path";
import { saveSite } from "./saveSite";

export async function readSite(siteId: string, slug: string) {
  if (!siteId) throw new Error("siteId requerido");
  if (!slug) throw new Error("slug requerido");

  const baseDir = resolve(`./runtime_storage/${siteId}`);
  const jsonPath = join(baseDir, "data/pages", `${slug}.json`);

  try {
    const file = await readFile(jsonPath, "utf-8");

    return {
      ok: true,
      data: JSON.parse(file),
      created: false,
    };
  } catch (error: any) {
    if (error.code === "ENOENT") {
      // 🔥 Crear página base automáticamente
      const defaultPage = {
        id: crypto.randomUUID(),
        slug,
        blocks: [],
      };

      await saveSite(siteId, slug, defaultPage, "", `${slug}.css`);

      return {
        ok: true,
        data: defaultPage,
        created: true,
      };
    }

    throw error;
  }
}
