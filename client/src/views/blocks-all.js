import layout from './layout'
import { blks } from './blocks'

const isTouch = process.browser && ('ontouchstart' in window)

const homeLayout = (body, { t, activeTab, ...S }) => layout(
  body
, { t, isTouch, activeTab, ...S })

export const recentBlocks = ({ t, blocks, ...S }) => homeLayout(
    blks(blocks, false, { t, ...S })
  , { ...S, t, activeTab: 'recentBlocks' })
