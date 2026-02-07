export const SpacingStylesSchema = {
  padding: {
    type: 'object',
    label: 'Padding',
    fields: {
      top: {
        type: 'number',
        label: 'Top',
        default: 0,
      },
      right: {
        type: 'number',
        label: 'Right',
        default: 0,
      },
      bottom: {
        type: 'number',
        label: 'Bottom',
        default: 0,
      },
      left: {
        type: 'number',
        label: 'Left',
        default: 0,
      },
    },
  },

  margin: {
    type: 'object',
    label: 'Margin',
    fields: {
      top: {
        type: 'number',
        label: 'Top',
        default: 0,
      },
      right: {
        type: 'number',
        label: 'Right',
        default: 0,
      },
      bottom: {
        type: 'number',
        label: 'Bottom',
        default: 0,
      },
      left: {
        type: 'number',
        label: 'Left',
        default: 0,
      },
    },
  },
}