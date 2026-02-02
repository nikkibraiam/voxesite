import type { Page } from "@cms/contracts";

export default defineEventHandler((): Page => {
  return {
    id: "1",
    slug: "home",
    blocks: [
      {
        id: "1",
        type: "Hero",
        props: {
          title: "Hola mundo",
          subtitle: "Sitio generado estáticamente",
        },
      },
      {
        id: "2",
        type: "TextBlock",
        props: {
          text: "Esto viene de un JSON publicado",
        },
      },
    ],
  };
});
