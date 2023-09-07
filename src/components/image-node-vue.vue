<script lang="ts" setup>
import { useEditor } from '@meogic/lexical-vue';
import type {
  GridSelection,
  LexicalEditor,
  NodeSelection,
  RangeSelection,
} from '@meogic/lexical';
import { mergeRegister } from '@meogic/lexical-utils';
import {
  $getNodeByKey,
  $getSelection,
  $isNodeSelection,
} from '@meogic/lexical';
import { defineProps, onMounted, onUnmounted, ref, watch } from 'vue'
import LazyImage from './lazy-image.vue'
import ImageResizer from './image-resizer.vue'
import useLexicalNodeSelection from "./useLexicalNodeSelection";

const props = defineProps<{
  src: string
  altText: string
  width: number
  height: number
  maxWidth: number
  nodeKey: string
  showCaption: boolean
  caption: string
  captionsEnabled: boolean
  resizable: boolean
}>()
const editor: LexicalEditor = useEditor()
const imageRef = ref<null | Element>(null);
const isResizeSmallOrNot = ref<0 | 1 | -1>(0)
const imageBound = ref<{
  width: number | 'inherit'
  height: number | 'inherit'
}>({
  width: props.width,
  height: props.height,
})
const selection = ref<RangeSelection | NodeSelection | GridSelection | null>(null)
const selectedNodeSelection = ref(false)
const [isSelected, setSelected, clearSelected] = useLexicalNodeSelection(editor, '0');

// 处理当删除某种图片后，会出现isSelect为false的情况，会导致样式错位，这里需要用到setSelected去设置为true
watch(() => selectedNodeSelection.value, () => {
  editor.getEditorState().read(() => {
    if ($isNodeSelection(selection.value) && !isSelected.value) {
      setSelected(true, selection.value.getNodes() && selection.value.getNodes()[0])
    }
  })
})

const resizeImage = () => {
  if (editor.getRootElement().getBoundingClientRect().width) {
    if ((editor.getRootElement().getBoundingClientRect().width - 20) < props.width) {
      editor.update(() => {
        const node = $getNodeByKey(props.nodeKey);
        const radio = (editor.getRootElement().getBoundingClientRect().width - 20) / props.width
        node.setWidthAndHeight(editor.getRootElement().getBoundingClientRect().width - 20, props.height * radio);
        imageBound.value.width = editor.getRootElement().getBoundingClientRect().width - 20
      })
    }
  }
}
let unregister: () => void
onMounted(() => {
  unregister = mergeRegister(
    editor.registerUpdateListener(({ editorState }) => {
      selection.value = editorState.read(() => $getSelection())
      selectedNodeSelection.value = $isNodeSelection(selection.value) && selection.value._nodes.has(props.nodeKey);
    }),
  )
})
onUnmounted(() => {
  selectedNodeSelection.value = false
  unregister()
})
</script>

<template>
  <div draggable="false" class="flex image-node-selected justify-center">
    <LazyImage
      ref="imageRef"
      :src="props.src"
      :alt-text="props.altText"
      :class-name="isSelected && selectedNodeSelection && 'image-outline'"
      :width="props.width"
      :height="props.height"
      :max-width="props.maxWidth"
      :node-key="props.nodeKey"
    />

    <ImageResizer
      :width="props.width"
      :height="props.height"
      :node-key="props.nodeKey"
      :class-name="isSelected && selectedNodeSelection && 'image-outline'"
      :image-ref="imageRef && imageRef.$refs.imageRef"
      :max-width="props.maxWidth"
      :is-resize-small-or-not="isResizeSmallOrNot"
    />
  </div>
</template>

<style scoped lang="scss">
.image-node-selected{
  position: relative;
}
</style>
