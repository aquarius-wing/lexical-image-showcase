<script lang="ts" setup>
import { defineProps, onMounted, onUnmounted, ref } from 'vue';
import type { LexicalNode } from 'lexical';
import {
  $createNodeSelection,
  $getNearestNodeFromDOMNode, $getNodeByKey,
  $setSelection,
} from 'lexical';
import { useEditor } from 'lexical-vue';
import { $isImageNode } from './image-node';

const props = defineProps<{
  nodeKey: string
  imageRef: HTMLElement
  maxWidth?: number
  width: 'inherit' | number
  height: 'inherit' | number
  setShowCaption: (show: boolean) => void
  showCaption: boolean
  isResizeSmallOrNot: 0 | 1 | -1
  className: string | null
  captionsEnabled: boolean
}>()

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

const Direction = {
  east: 1 << 0,
  north: 1 << 3,
  south: 1 << 1,
  west: 1 << 2,
};
const controlWrapperRef = ref<HTMLDivElement>(null);
const userSelect = ref({
  priority: '',
  value: 'default',
});
const editor = useEditor()
const positioningRef = ref<{
  currentHeight: 'inherit' | number
  currentWidth: 'inherit' | number
  direction: number
  isResizing: boolean
  ratio: number
  startHeight: number
  startWidth: number
  startX: number
  startY: number
}>({
  currentHeight: 0,
  currentWidth: 0,
  direction: 0,
  isResizing: false,
  ratio: 0,
  startHeight: 0,
  startWidth: 0,
  startX: 0,
  startY: 0,
});
const editorRootElement = editor.getRootElement();
// Find max width, accounting for editor padding.
// const maxHeightContainer = ref(editorRootElement.getBoundingClientRect().height)
let maxWidthContainer = editorRootElement !== null
  ? editorRootElement.getBoundingClientRect().width
  : 100;

const maxHeightContainer
  = editorRootElement !== null
    ? editorRootElement.getBoundingClientRect().height
    : 100;
const minWidth = 100;
const minHeight = 100;

const setStartCursor = (direction: number) => {
  const ew = direction === Direction.east || direction === Direction.west;
  const ns = direction === Direction.north || direction === Direction.south;
  const nwse
    = (direction & Direction.north && direction & Direction.west)
    || (direction & Direction.south && direction & Direction.east);

  const cursorDir = ew ? 'ew' : ns ? 'ns' : nwse ? 'nwse' : 'nesw';

  if (editorRootElement !== null) {
    editorRootElement.style.setProperty(
      'cursor',
      `${cursorDir}-resize`,
      'important',
    );
  }
};
const setEndCursor = () => {
  if (editorRootElement !== null) {
    editorRootElement.style.setProperty('cursor', 'default');
  }
};
const handlePointerDown = (
  event: PointerEvent,
  direction: number,
) => {
  if (!editor.isEditable()) {
    return;
  }
  let image_node: LexicalNode = null
  editor.update(() => {
    const node = $getNearestNodeFromDOMNode(event.target as Node)
    const selection = $createNodeSelection();
    image_node = $getNodeByKey(props.nodeKey);
    $setSelection(selection);
    const key = node.__key
    selection.add(key);
  })

  const image = props.imageRef;

  const controlWrapper = controlWrapperRef.value;

  if (image !== null && controlWrapper !== null) {
    const { width, height } = image.getBoundingClientRect();
    const positioning = positioningRef.value;
    positioning.startWidth = width;
    positioning.startHeight = height;
    positioning.ratio = width / height;
    // positioning.currentWidth = width;
    // positioning.currentHeight = height;
    positioning.startX = event.clientX;
    positioning.startY = event.clientY;
    positioning.isResizing = true;
    positioning.direction = direction;
    setStartCursor(direction);

    controlWrapper.classList.add('image-control-wrapper-resizing');

    document.addEventListener('mousemove', handlePointerMove);
    document.addEventListener('mouseup', handlePointerUp);
  }
};
const handlePointerMove = (event: MouseEvent) => {
  const image = props.imageRef;
  const positioning = positioningRef.value;
  const isHorizontal
    = positioning.direction & (Direction.east | Direction.west);
  const isVertical
    = positioning.direction & (Direction.south | Direction.north);

  if (image !== null && positioning.isResizing) {
    // Corner cursor
    // if (isHorizontal && isVertical) {
    let diff = Math.floor((positioning.startX - event.clientX) * 2);
    diff = positioning.direction & Direction.east ? -diff : diff;
    if (maxWidthContainer === 0) {
      maxWidthContainer = editor.getRootElement().getBoundingClientRect().width
    }
    const width = Math.max(
      positioning.startWidth + diff,
      minWidth,

    );

    const height = width / positioning.ratio;
    const widthCent = width / editor.getRootElement().getBoundingClientRect().width * 100
    // console.log(width,editor.getRootElement().getBoundingClientRect().width)
    // console.log('百分比', widthCent)
    // console.log('height',height)
    editor.update(() => {
      const image_node = $getNodeByKey(props.nodeKey);
      $isImageNode(image_node) && widthCent > 0 && (widthCent < 100 || widthCent === 100) && image_node.setWidthAndHeight(widthCent, 'inherit')
    })
    positioning.currentHeight = height;
    positioning.currentWidth = widthCent > 0 && (widthCent < 100 || widthCent === 100) && width / editor.getRootElement().getBoundingClientRect().width * 100;
    // }
  }
};
const handlePointerUp = (event: MouseEvent) => {
  const image = props.imageRef;
  const positioning = positioningRef.value;
  const controlWrapper = controlWrapperRef.value;
  if (image !== null && controlWrapper !== null && positioning.isResizing) {
    positioning.startWidth = 0;
    positioning.startHeight = 0;
    positioning.ratio = 0;
    positioning.startX = 0;
    positioning.startY = 0;
    positioning.isResizing = false;

    // positioning.currentWidth = 0;
    // positioning.currentHeight = 0;

    positioningRef.value.isResizing = false;
    // positioningRef.value.currentWidth = 0;
    // positioningRef.value.currentHeight = 0;

    controlWrapper.classList.remove('image-control-wrapper-resizing');
    setEndCursor();

    document.removeEventListener('pointermove', handlePointerMove);
    document.removeEventListener('pointerup', handlePointerUp);
  }
};

onMounted(() => {
  window.addEventListener('mouseover', (event: MouseEvent) => {
    editor.update(() => {
      const node = $getNearestNodeFromDOMNode(event.target as Node)
      if ($isImageNode(node) && node === $getNodeByKey(props.nodeKey) && node.__width === 'inherit') {
        let naturalWidth
        if (event && event.target && event.target.naturalWidth) {
          naturalWidth = event.target.naturalWidth
        } else if (event.target.firstElementChild && event.target.firstElementChild.naturalWidth) {
          naturalWidth = event.target.firstElementChild.naturalWidth
        }

        if (naturalWidth && (naturalWidth < editor.getRootElement().getBoundingClientRect().width)) {
          const firstWidthPercent = naturalWidth && (naturalWidth / editor.getRootElement().getBoundingClientRect().width * 100)
          node.setWidthAndHeight(firstWidthPercent, 'inherit')
        } else if (naturalWidth && (naturalWidth > editor.getRootElement().getBoundingClientRect().width)) {
          node.setWidthAndHeight(100, 'inherit')
        }
      }
    })
  })
})
onUnmounted(() => {
  positioningRef.value.isResizing = false
})
</script>

<template>
  <div
    ref="controlWrapperRef" class="resizer-control-tail"
    :class="{ 'image-outline': props.className }"
    :style="{
      width: `${positioningRef.isResizing ? positioningRef.currentWidth : props.width}%`,
    }"
  >
    <!--    <div -->
    <!--      class="image-resizer image-resizer-n" -->
    <!--      @mousedown="(event) => { -->
    <!--        handlePointerDown(event, Direction.north); -->
    <!--      }" -->
    <!--    /> -->

    <div
      class="image-resizer image-resizer-ne"
      @mousedown="(event) => {
        handlePointerDown(event, Direction.north | Direction.east);
      }"
    />
    <div
      class="right-bar"
    >
      <div
        class="image-resizer image-resizer-e"
        @mousedown="(event) => {
          handlePointerDown(event, Direction.east);
        }"
      />
    </div>

    <div
      class="image-resizer image-resizer-se"
      @mousedown="(event) => {
        handlePointerDown(event, Direction.south | Direction.east);
      }"
    />
    <!--    <div -->
    <!--      class="image-resizer image-resizer-s" -->
    <!--      @mousedown="(event) => { -->
    <!--        handlePointerDown(event, Direction.south); -->
    <!--      }" -->
    <!--    /> -->
    <div
      class="image-resizer image-resizer-sw"
      @mousedown="(event) => {
        handlePointerDown(event, Direction.south | Direction.west);
      }"
    />
    <div
      class="left-bar"
    >
      <div
        class="image-resizer image-resizer-w"
        @mousedown="(event) => {
          handlePointerDown(event, Direction.west);
        }"
      />
    </div>
    <div
      class="image-resizer image-resizer-nw"
      @mousedown="(event) => {
        handlePointerDown(event, Direction.north | Direction.west);
      }"
    />
  </div>
</template>

<style scoped lang="scss">
.resizer-control-tail{
  --color-document-image-resizer-bg: #565656;
  --color-document-image-resizer-hover-bg: #1A7EF8;
  --color-document-image-resizer-content-bg: #FFFFFF;
  //width: 100%;
  height: 100%;
  position: absolute;
  z-index: 9;
  &:hover{
    .image-resizer-e::before{
        content: '';
        display: block;
        position: relative;
        top: calc(50% - 5.5px);
        left: 17px;
        width: 1px;
        height: 14.39px;
        background: var(--color-document-image-resizer-bg);
        border-radius: 2px;
      }
    .image-resizer-w::before{
      content: '';
      display: block;
      position: relative;
      top: calc(50% - 5.5px);
      left: 8px;
      width: 1px;
      height: 14.39px;
      background: var(--color-document-image-resizer-bg);
      border-radius: 2px;
    }
    .left-bar{
      width: 2px;
      left: -2px;
      background: #E6E6E6;
      border-radius: 2px;
      height: 100%;
      position: absolute;
      &:hover{
        background: var(--color-document-image-resizer-hover-bg);
        &:before{
          background: var(--color-document-image-resizer-hover-bg);
        }
        &:after{
          background: var(--color-document-image-resizer-content-bg);
        }
        .image-resizer-w::before{
          background: var(--color-document-image-resizer-content-bg);
        }
      }
      &:before{
        content: '';
        display: block;
        width: 8px;
        height: 47px;
        background: var(--color-document-image-resizer-content-bg);
        position: absolute;
        bottom: calc(50% - 23.5px);
        left:-3px;
        border-radius: 8px;
      }
      &:after{
        content: '';
        display: block;
        position: absolute;
        bottom: calc(50% - 8.95px);
        left:-1px;
        width: 1px;
        height: 14.39px;
        background: var(--color-document-image-resizer-bg);
        border-radius: 2px;
      }
    }
    .right-bar{
      width: 2px;
      background: #E6E6E6;
      border-radius: 2px;
      height: 100%;
      right: -2px;
      position: absolute;
      &:hover{
        background: var(--color-document-image-resizer-hover-bg);
        &:before{
          background: var(--color-document-image-resizer-hover-bg);
        }
        &:after{
          background: var(--color-document-image-resizer-content-bg);
        }
        .image-resizer-e::before{
          background: var(--color-document-image-resizer-content-bg);
        }
      }
      &:before{
        content: '';
        display: block;
        width: 8px;
        height: 47px;
        background: var(--color-document-image-resizer-content-bg);
        position: absolute;
        bottom: calc(50% - 23.5px);
        left:-3px;
        border-radius: 8px;
      }
      &:after{
        content: '';
        display: block;
        position: absolute;
        bottom: calc(50% - 8.95px);
        left:-1px;
        width: 1px;
        height: 14.39px;
        background: var(--color-document-image-resizer-bg);
        border-radius: 2px;
      }
    }

  }
}
.resizer-control-tail.image-outline{
  .left-bar,.right-bar{
      background: var(--color-document-image-resizer-hover-bg);
      &:before{
        background: var(--color-document-image-resizer-hover-bg);
      }
      &:after{
        background: var(--color-document-image-resizer-content-bg);
      }
      .image-resizer-w::before{
        background: var(--color-document-image-resizer-content-bg);
      }
    .image-resizer-e::before{
        background: var(--color-document-image-resizer-content-bg);
      }
  }
}
.editor-image .image-resizer {
  display: block;
  width: 20px;
  height: 20px;
  position: absolute;
  z-index: 999;
  /*background-color: rgb(60, 132, 244);*/
  /*border: 1px solid var(--color-document-image-resizer-content-bg;*/
  /*visibility: hidden;*/
}

.editor-image .image-resizer.image-resizer-n {
  top: -6px;
  left: 48%;
  cursor: n-resize;
}

.editor-image .image-resizer.image-resizer-ne {
  top: -6px;
  right: -6px;
  cursor: nesw-resize;
}

.editor-image .image-resizer.image-resizer-e {
  bottom: calc(50% - 23.5px);
  right: -3px;
  cursor: ew-resize;
  //width: 2px;
  //background: #E6E6E6;
  //border-radius: 2px;
  height: 47px;
  //&::before{
  //  content: '';
  //  display: block;
  //  position: relative;
  //  top: calc(48% );
  //  left: 17px;
  //  width: 1px;
  //  height: 14.39px;
  //  background: var(--color-document-image-resizer-bg);
  //  border-radius: 2px;
  //}
}

.editor-image .image-resizer.image-resizer-se {
  bottom: -2px;
  right: -6px;
  cursor: nwse-resize;
}

.editor-image .image-resizer.image-resizer-s {
  bottom: -2px;
  left: 48%;
  cursor: s-resize;
}

.editor-image .image-resizer.image-resizer-sw {
  bottom: -2px;
  left: -6px;
  cursor: nesw-resize;
}

.editor-image .image-resizer.image-resizer-w {
  height: 47px;
  bottom: calc(50% - 23.5px);
  left: -6px;
  cursor: ew-resize;
}

.editor-image .image-resizer.image-resizer-nw {
  top: -6px;
  left: -6px;
  cursor: nwse-resize;
}
</style>
