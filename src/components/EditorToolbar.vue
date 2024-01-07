<script setup lang="ts">
import { ref, reactive, h, nextTick } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'
import {
  TextBold16Regular as BoldIcon
  , TextStrikethrough16Regular as StrikethroughIcon
  , TextItalic16Regular as ItalicIcon
  , TextUnderline16Regular as UnderlineIcon
  , Link16Regular as LinkIcon
  , TextColor16Regular as ColorIcon
  , TextEffects24Filled as TextColorIcon
  , TextT20Filled as TextIcon
  , TextHeader120Filled as H1Icon
  , TextHeader220Filled as H2Icon
  , TextHeader320Filled as H3Icon
  , TextAlignLeft20Filled as AlignLeftIcon
  , TextAlignCenter20Filled as AlignCenterIcon
  , TextAlignRight20Filled as AlignRightIcon

} from '@vicons/fluent'
import { AditorDocState, AditorDocView } from '@lib/aditor'

const size = ref(0)
const titleList = [
  { key: '正文', title: '正文', icon: TextIcon, selectedIcon: h(TextIcon, { color: 'var(--el-color-primary)' }) }
  , { key: '一级', title: '一级标题', icon: H1Icon, selectedIcon: h(H1Icon, { color: 'var(--el-color-primary)' }) }
  , { key: '二级', title: '二级标题', icon: H2Icon, selectedIcon: h(H2Icon, { color: 'var(--el-color-primary)' }) }
  , { key: '三级', title: '三级标题', icon: H3Icon, selectedIcon: h(H3Icon, { color: 'var(--el-color-primary)' }) }
]

const alignmentList = [
  { key: '左对齐', title: '左对齐', icon: AlignLeftIcon, selectedIcon: h(AlignLeftIcon, { color: 'var(--el-color-primary)' }) }
  , { key: '居中对齐', title: '居中对齐', icon: AlignCenterIcon, selectedIcon: h(AlignCenterIcon, { color: 'var(--el-color-primary)' }) }
  , { key: '右对齐', title: '右对齐', icon: AlignRightIcon, selectedIcon: h(AlignRightIcon, { color: 'var(--el-color-primary)' }) }
]

// eight colors
const TEXT_COLOR = {
  '黑色': 'rgb(0, 0, 0)'
  , '灰色': 'rgb(100, 106, 115)'
  , '红色': 'rgb(216, 57, 49)'
  , '橙色': 'rgb(222, 120, 2)'
  , '黄色': 'rgb(220, 155, 4)'
  , '绿色': 'rgb(46, 161, 33)'
  , '蓝色': 'rgb(36, 91, 219)'
  , '紫色': 'rgb(100, 37, 208)'
}
type TEXT_COLOR_KEY = keyof typeof TEXT_COLOR
// sixteen background colors
const BACKGROUND_COLOR = {
  '透明': 'rgba(0, 0, 0, 0)'
  , '浅灰色': 'rgb(242, 243, 245)'
  , '浅红色': 'rgb(251, 191, 188)'
  , '浅橙色': 'rgba(254, 212, 164, 0.8)'
  , '浅黄色': 'rgba(255, 246, 122, 0.8)'
  , '浅绿色': 'rgba(183, 237, 177, 0.8)'
  , '浅蓝色': 'rgba(186, 206, 253, 0.7)'
  , '浅紫色': 'rgba(205, 178, 250, 0.7)'
  , '中灰色': 'rgba(222, 224, 227, 0.8)'
  , '灰色': 'rgb(187, 191, 196)'
  , '红色': 'rgb(247, 105, 100)'
  , '橙色': 'rgb(255, 165, 61)'
  , '黄色': 'rgb(255, 233, 40)'
  , '绿色': 'rgb(98, 210, 86)'
  , '蓝色': 'rgba(78, 131, 253, 0.55)'
  , '紫色': 'rgba(147, 90, 246, 0.55)'
}

// get BACKGROUND_COLOR all key and use for type annotation
type BACKGROUND_COLOR_KEY = keyof typeof BACKGROUND_COLOR
type ToolBarAttrs = {
  title: string
  alignment: string
  fontWeight: boolean
  strikethrough: boolean
  italic: boolean
  underline: boolean
  link: boolean
  textColor: TEXT_COLOR_KEY
  backgroundColor: BACKGROUND_COLOR_KEY
}

const toolBarAttrs: ToolBarAttrs = reactive({
  title: '正文',
  alignment: '左对齐',
  fontWeight: true,
  strikethrough: true,
  italic: true,
  underline: true,
  link: true,
  textColor: '蓝色',
  backgroundColor: '浅红色'
})

const style = reactive({
  visibility: 'hidden',
  zIndex: 100,
  position: 'absolute',
  top: '10px',
  left: '10px',
})

enum DisplayStateEnum {
  show = 'show',
  onShow = 'onShow',
  hide = 'hide',
  onHide = 'onHide'
}

const displayState = ref(DisplayStateEnum.hide)

const toolBarRef = ref()

// move toolBarRef to specified element 
const _moveToolbarToElement = (el: Element) => {
  const originNode = toolBarRef.value.$el
  originNode.parentNode?.removeChild(originNode)
  el.appendChild(originNode)
}

const _setPosition = (top:number, left:number)=>{
  style.top = `${top}px`
  style.left = `${left}px`
}

/**
 * Get cursor rect and offset inside the last node
 * @param element The selected Node
 * @param text the text before cursor on the selected Node
 * @param cursorX event.clientX(usually mouse event)
 * @returns {rect:DOMRect|null, offsetX:number} rect is the last line rect, offsetX is the offset of the last line text(usually used to calculate the cursor position)
 */
const _getCursorRectOffset = (element: Node, text: string, cursorX: number = 0): { rect: DOMRect | null, offsetX: number } => {
  // create tmp span element
  const tempSpan = document.createElement('span');
  const style = window.getComputedStyle(element as HTMLElement);
  tempSpan.style.fontSize = style.fontSize;
  tempSpan.style.letterSpacing = style.letterSpacing;
  tempSpan.style.whiteSpace = style.whiteSpace;
  tempSpan.style.position = 'absolute';
  tempSpan.style.visibility = 'hidden';
  document.body.appendChild(tempSpan);

  tempSpan.textContent = text
  let tempSpanWidth = 0
  for (let rect of (tempSpan as Element)?.getClientRects()) {
    tempSpanWidth += rect.width
  }
  let tempSpanWidthLeft = tempSpanWidth

  let targetWidth = 0
  let lastRect: DOMRect | null = null

  for (let rect of (element as Element)?.getClientRects()) {
    targetWidth += rect.width
    if (Math.round(targetWidth) >= Math.round(tempSpanWidth)) {
      const islineStart = Math.abs(rect.left - cursorX) < Math.abs(rect.right - cursorX) ? true : false
      tempSpanWidthLeft = rect.width - (targetWidth - tempSpanWidth)
      lastRect = rect
      // Todo: it seems that the last line is not calculated correctly if rect is null(probably will not happen)
      if (Math.round(targetWidth) == Math.round(tempSpanWidth) && islineStart) {
        continue
      } else {
        break
      }
    }
  }

  return { rect: lastRect, offsetX: tempSpanWidthLeft }
}

/**
 * Get selection position
 * this function is used to get the position of the selection end node
 * the end node must be a text node, otherwise it will return null
 * @param e 
 * @param targetElement 
 * @returns {top:number, left:number} | null
 */
const _getSelectionPosition = (e: MouseEvent, targetElement: HTMLElement):{top:number, left:number}|null => {

  // get endElement parent offset
  const _getClientOffset = (element: HTMLElement) => {
    let top = 0, left = 0;
    while (element) {
      top += element.offsetTop || 0;
      left += element.offsetLeft || 0;
      element = element.offsetParent as HTMLElement;
    }
    return { top: top, left: left };
  }

  // get current selection end node
  const selection = window.getSelection()
  const range = selection?.getRangeAt(0)
  const anchorNode = selection?.anchorNode
  const anchorOffset = selection?.anchorOffset
  const startNode = range?.startContainer
  const startOffset = range?.startOffset
  const endNode = range?.endContainer
  const endOffset = range?.endOffset

  // // get line height of endElement
  // const clientX = e.clientX
  // const clientY = e.clientY
  // // get button self height and width
  // const buttonHeight = toolBarRef.value.$el.clientHeight
  const buttonWidth = toolBarRef.value.$el.clientWidth

  let isFrontToBack = false
  // By comparing anchorNode,startNode and endNode, determine whether the user is from front to back or from back to front
  if (anchorNode == null || startNode == null || endNode == null || anchorOffset == null || startOffset == null || endOffset == null) {
    console.warn("Can't get one of 'anchorNode, startNode, endNode, anchorOffset, startOffset'")
    return null
  }

  if (endNode === startNode) {
    isFrontToBack = anchorOffset <= startOffset
  } else {
    isFrontToBack = anchorNode?.compareDocumentPosition(endNode as Node) === Node.DOCUMENT_POSITION_FOLLOWING
  }

  let reversedNode: Node | null = isFrontToBack ? endNode : startNode
  let reversedOffset: number | null = isFrontToBack ? endOffset : startOffset

  if (reversedNode === null) {
    console.warn("Can't get reversedNode, not move toolBar")
    return null
  }

  if (reversedNode.nodeType !== Node.TEXT_NODE) {
    console.warn("reversedNode is not text node, not move toolBar")
    return null
  }

  reversedNode = reversedNode.parentElement
  if (reversedNode === null) {
    console.warn("Can't get reversedNode, not move toolBar")
    return null
  }

  const reversedRect = (reversedNode as HTMLElement).getBoundingClientRect()
  if (reversedRect === null) {
    console.warn("Can't get reversedRect, not move toolBar")
    return null
  }

  const text = (reversedNode as HTMLElement).innerText.substring(0, reversedOffset)
  // get cursor line number
  const { rect: lastRect, offsetX } = _getCursorRectOffset(reversedNode as HTMLElement, text, e.clientX)
  const parentNodeOffset = _getClientOffset(targetElement)


  if (lastRect === null) {
    console.warn("Can't get lastRect, not move toolBar")
    return null
  }

  const reversedNodeOffset = _getClientOffset(reversedNode as HTMLElement)
  const offsetY = lastRect.top - reversedRect.top

  const toobalTop = reversedNodeOffset.top + offsetY - parentNodeOffset.top
  const toobalLeft = lastRect.left - parentNodeOffset.left + offsetX - buttonWidth / 2

  return {top:toobalTop, left: toobalLeft}
}

let moveTimeout:number|undefined = undefined

const init = (e: Event, __: AditorDocState, view: AditorDocView) => {
  const _showToolBar = () => {
    if (window.getSelection()?.anchorNode === window.getSelection()?.focusNode && window.getSelection()?.anchorOffset === window.getSelection()?.focusOffset) {
        return
    }

    if (displayState.value === DisplayStateEnum.hide) {
      // get the current aditorDoc's root element
      const container = document.getElementById(view.vNode.key as string)?.parentElement
      const selPos = _getSelectionPosition(e as MouseEvent, container as HTMLElement)
      if (selPos) {
        _setPosition(selPos.top, selPos.left)
      }
      _moveToolbarToElement(container as Element)
      toolBarRef.value.$el.click()
    }else{
      setTimeout(()=>_showToolBar(), 50)
    }
  }
  
  clearTimeout(moveTimeout)
  moveTimeout = setTimeout(() => {
    _showToolBar()
  }, 50)
  
}

const onHide = () => {
  _moveToolbarToElement(document.body)
  _setPosition(-10000, -10000)
  displayState.value = DisplayStateEnum.onHide
}

defineExpose({
  init: init
})

</script>

<template>
  <el-popover 
    popper-style="padding:8px;" 
    trigger="click" 
    placement="top" 
    width="445"
    @before-enter="displayState = DisplayStateEnum.onShow" 
    @after-enter="displayState = DisplayStateEnum.show"
    @before-leave="()=>onHide()" 
    @after-leave="displayState = DisplayStateEnum.hide"
    :hide-after="0"
    >
    <el-space :size="size">
      <el-dropdown>
        <el-button text>
          <el-icon>
            <TextIcon v-if="toolBarAttrs.title === '正文'"></TextIcon>
            <H1Icon v-else-if="toolBarAttrs.title === '一级'"></H1Icon>
            <H2Icon v-else-if="toolBarAttrs.title === '二级'"></H2Icon>
            <H3Icon v-else-if="toolBarAttrs.title === '三级'"></H3Icon>
          </el-icon>
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <template v-for="(item, _) in titleList" :key="item.key">
              <el-dropdown-item v-if="toolBarAttrs.title !== item.key" :icon="item.icon">{{ item.title
              }}</el-dropdown-item>
              <el-dropdown-item v-else :icon="item.selectedIcon"><span style="color:var(--el-color-primary)">{{ item.title
              }}</span></el-dropdown-item>
            </template>
          </el-dropdown-menu>
        </template>
      </el-dropdown>

      <el-divider direction="vertical" />

      <el-dropdown>
        <el-button text>
          <el-icon>
            <AlignLeftIcon v-if="toolBarAttrs.alignment === '左对齐'"></AlignLeftIcon>
            <AlignCenterIcon v-else-if="toolBarAttrs.alignment === '居中对齐'"></AlignCenterIcon>
            <AlignRightIcon v-else-if="toolBarAttrs.alignment === '右对齐'"></AlignRightIcon>
          </el-icon>
          <el-icon class="el-icon--right"><arrow-down /></el-icon>
        </el-button>
        <template #dropdown>
          <template v-for="(item, _) in alignmentList" :key="item.key">
            <el-dropdown-item v-if="toolBarAttrs.alignment !== item.key" :icon="item.icon">{{ item.title
            }}</el-dropdown-item>
            <el-dropdown-item v-else :icon="item.selectedIcon"><span style="color:var(--el-color-primary)">{{ item.title
            }}</span></el-dropdown-item>
          </template>
        </template>
      </el-dropdown>

      <el-divider direction="vertical" />

      <!-- fontWeight -->
      <el-button text :class="toolBarAttrs.fontWeight ? 'tool-bar-item-selected' : ''">
        <el-icon :color="toolBarAttrs.fontWeight ? 'var(--el-color-primary)' : ''">
          <BoldIcon />
        </el-icon>
      </el-button>

      <!-- strikethrough -->
      <el-button text :class="toolBarAttrs.strikethrough ? 'tool-bar-item-selected' : ''">
        <el-icon :color="toolBarAttrs.strikethrough ? 'var(--el-color-primary)' : ''">
          <StrikethroughIcon />
        </el-icon>
      </el-button>

      <!-- italic -->
      <el-button text :class="toolBarAttrs.italic ? 'tool-bar-item-selected' : ''">
        <el-icon :color="toolBarAttrs.italic ? 'var(--el-color-primary)' : ''">
          <ItalicIcon />
        </el-icon>
      </el-button>

      <!-- underline -->
      <el-button text :class="toolBarAttrs.underline ? 'tool-bar-item-selected' : ''">
        <el-icon :color="toolBarAttrs.underline ? 'var(--el-color-primary)' : ''">
          <UnderlineIcon />
        </el-icon>
      </el-button>

      <!-- link -->
      <el-button text :class="toolBarAttrs.link ? 'tool-bar-item-selected' : ''">
        <el-icon :color="toolBarAttrs.link ? 'var(--el-color-primary)' : ''">
          <LinkIcon />
        </el-icon>
      </el-button>

      <el-popover :width="330" trigger="hover">
        <template #reference>
          <el-button text :style="{ backgroundColor: BACKGROUND_COLOR[toolBarAttrs.backgroundColor] }">
            <el-icon :color="TEXT_COLOR[toolBarAttrs.textColor]">
              <ColorIcon />
            </el-icon>
          </el-button>
        </template>
        <el-space direction="vertical" alignment="left">
          <div>字体颜色</div>
          <div>
            <el-row :gutter="0" style="width:300px;">
              <el-col v-for="(color, key) in TEXT_COLOR" :key="key" :span="3">
                <el-button size="small" :class="key === toolBarAttrs.textColor ? 'color-sel' : ''">
                  <el-icon :size="10" :color="color">
                    <TextColorIcon />
                  </el-icon>
                </el-button>
              </el-col>
            </el-row>
          </div>
          <div>背景颜色</div>
          <div>
            <el-row :gutter="0" style="width:300px;">
              <el-col v-for="(color, key) in BACKGROUND_COLOR" :key="key" :span="3" style="padding-bottom: 3px;">
                <el-button size="small" :style="{ backgroundColor: color }"
                  :class="key === toolBarAttrs.backgroundColor ? 'bg-color-sel' : ''">
                  <el-icon :size="8">
                  </el-icon>
                </el-button>
              </el-col>
            </el-row>
          </div>
        </el-space>
      </el-popover>
    </el-space>
    <template #reference>
      <el-button ref="toolBarRef" :style="style" class="tool-bar-button">Hi</el-button>
    </template>
  </el-popover>
</template>


<style scoped>
.color-sel {
  border-width: 2px;
  border-color: var(--el-color-primary);
}

.bg-color-sel {
  border-width: 2px;
  border-color: var(--el-color-primary);
}

.tool-bar-item-selected {
  background-color: var(--el-color-primary-light-9) !important;
}

.tool-bar-item-selected:hover {
  background-color: var(--el-color-primary-light-8) !important;
}


.tool-bar-button {
  transition: top 0s ease-in-out, left 0s ease-in-out;
}
</style>