import type { Page } from '@cms/contracts'

export default defineEventHandler(() => {
  const page: Page = {
    id: 'home',
    slug: '/',
    blocks: [
      {
        id: '1',
        type: 'Hero',
        props: {
          title: 'Hola desde contratos'
        }
      },
      {
        id: '2',
        type: 'TextBlock',
        props: {
          text: 'Esto viene del contrato'
        }
      }
    ]
  }

  return page
})
