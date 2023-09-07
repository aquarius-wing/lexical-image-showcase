<template></template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue';
import { mergeRegister } from '@lexical/utils';
import { $isAtNodeEnd } from '@lexical/selection'
import type { ElementNode, GridSelection, LexicalEditor, LexicalNode, NodeSelection, RangeSelection } from 'lexical';
import {
  $getNearestNodeFromDOMNode,
  $getNodeByKey,
  $getRoot,
  $getSelection, $isElementNode,
  $isNodeSelection, $isParagraphNode,
  $isRangeSelection,
  CLICK_COMMAND,
  COMMAND_PRIORITY_LOW,
  KEY_ARROW_DOWN_COMMAND,
  KEY_ARROW_LEFT_COMMAND,
  KEY_ARROW_RIGHT_COMMAND,
  KEY_ARROW_UP_COMMAND,
  KEY_BACKSPACE_COMMAND,
  KEY_DELETE_COMMAND,
  SELECTION_CHANGE_COMMAND,
} from 'lexical';
import { useEditor } from 'lexical-vue';
import type { ImageNode } from './image-node';
import { $isImageNode } from './image-node';
import useLexicalNodeSelection from './useLexicalNodeSelection';
type ArrowStatus = 'no' | 'pending' | 'already'
type DirectionRD = 'ArrowDown' | 'ArrowRight'
type DirectionLU = 'ArrowUp' | 'ArrowLeft'
const editor: LexicalEditor = useEditor()
const selection = ref<RangeSelection | NodeSelection | GridSelection | null>(null)
const selectedNodeSelection = ref(false)
const isArrowSelectImage = ref<ArrowStatus>('no')
const [isSelected, setSelected, clearSelected] = useLexicalNodeSelection(editor, '0');

const isImageOrChild = (node: LexicalNode) => {
  return $isImageNode(node) ? node : $isParagraphNode(node) ? node?.getFirstChild() : null
}

const $isHasImagePrevious = (elementNode: LexicalNode, selection: RangeSelection | NodeSelection | GridSelection, eventCode: string) => {
  const preNode = elementNode && elementNode.getPreviousSibling()
  if ((eventCode === 'ArrowLeft') && $isRangeSelection(selection) && (selection.anchor.offset !== 0 || !($isImageNode(preNode) || (preNode?.getFirstChild() && $isImageNode(preNode?.getFirstChild()))))) {
    return true
  } else if ((eventCode === 'ArrowUp') && $isRangeSelection(selection) && (!($isImageNode(preNode) || (preNode?.getFirstChild() && $isImageNode(preNode?.getFirstChild()))))) {
    return true
  }
  return false
}

const $isHasImageNext = (elementNode: LexicalNode, selection: RangeSelection | NodeSelection | GridSelection, eventCode: string) => {
  if ((eventCode === 'ArrowRight') && $isRangeSelection(selection) && !$isAtNodeEnd(selection?.anchor)) {
    return true
  }
  const nextNode = elementNode && elementNode.getNextSibling()
  if ((eventCode === 'ArrowDown') && $isRangeSelection(selection) && (!($isImageNode(nextNode) || (nextNode?.getFirstChild() && $isImageNode(nextNode?.getFirstChild()))))) {
    return true
  }
  return false
}

// 处理上下键和左右键，在遇到不同LexicalNode时，选择聚焦到image还是聚焦到其他node
const handleImageKeyArrow = (event: KeyboardEvent, directionRD: DirectionRD, directionLU: DirectionLU) => {
  // 是否合适
  const nodeToFocusState: { nodeToFocus: ElementNode | ImageNode | undefined; isEnd: boolean } = editor.getEditorState().read(() => {
    const selection = $getSelection()
    if (!selection) {
      return
    }
    let anchorKey: string | undefined
    let isEnd: boolean
    if ($isRangeSelection(selection)) {
      anchorKey = selection.anchor.key
    }
    if ($isNodeSelection(selection) && selection.getNodes().length === 1) {
      anchorKey = selection.getNodes()[0].getKey()
    }

    if (!anchorKey) {
      return
    }

    const anchorNode = $getNodeByKey(anchorKey)
    const elementNode = anchorNode?.getTopLevelElement()

    // 上面没有图片
    if ($isHasImagePrevious(elementNode, selection, event.code)) {
      return
    }
    // 下面没有图片
    if ($isHasImageNext(elementNode, selection, event.code)) {
      return
    }

    // 最后一个节点是否为图片
    if (event.code === directionRD && elementNode === $getRoot().getLastChild() && ($isImageNode(elementNode) || $isImageNode(anchorNode))) {
      return
    }
    // 第一个节点是否为图片
    if (event.code === directionLU && elementNode === $getRoot().getFirstChild() && ($isImageNode(elementNode) || $isImageNode(anchorNode))) {
      return
    }

    // 1.获取当前elementNode，根据key code判断是获取其下一节点还是上一节点
    let nodeToFocus
    // 2.根据key code，判断当前node是否符合图片节点
    if (event.code === directionRD && isImageOrChild(elementNode)) {
      // 2.1 若当前node是否为图片，若是，则取消key的默认事件
      if ($isParagraphNode(elementNode) && $isImageNode(elementNode?.getFirstChild())) {
        event.preventDefault()
      }
      // 2.2 此key code为下或者右，因此获取其下一节点
      const nextNode = elementNode.getNextSibling()
      // 2.3 若下一节点符合图片节点条件，则直接选中
      if (nextNode && $isImageNode(nextNode)) {
        nodeToFocus = nextNode
      }
      // 2.4 若下一节点的firstChild符合图片节点条件，则直接选中
      else if (nextNode && nextNode?.getFirstChild() && $isImageNode(nextNode?.getFirstChild())) {
        nodeToFocus = nextNode?.getFirstChild()
      }
      // 2.5 若NextSibling不符合图片节点条件，则默认选择下一节点
      else if ($isParagraphNode(elementNode) && $isImageNode(elementNode?.getFirstChild())) {
        editor.update(() => {
          elementNode.selectNext()
        })
      }
    }
    // 3.若不符合图片节点，则默认往下，当遇到下一节点为图片节点，则选中
    else if (event.code === directionRD && elementNode?.getNextSibling()) {
      nodeToFocus = isImageOrChild(elementNode?.getNextSibling())
    }
    // 4.LU(往上和往左)与上面说的RD(往右和往下)同理，只是elementNode.getPreviousSibling()替换elementNode.getNextSibling()
    else if (event.code === directionLU && isImageOrChild(elementNode)) {
      const preNode = elementNode.getPreviousSibling()
      if ($isParagraphNode(elementNode) && $isImageNode(elementNode?.getFirstChild())) {
        event.preventDefault()
      }

      if (preNode && preNode?.getFirstChild() && $isImageNode(preNode?.getFirstChild())) {
        // 找到了图片节点就聚焦图片
        nodeToFocus = preNode?.getFirstChild()
      } else {
        // 没有找到就聚焦上一个块
        nodeToFocus = preNode
      }
    }
    else if (event.code === directionLU && elementNode?.getPreviousSibling()) {
      nodeToFocus = isImageOrChild(elementNode?.getPreviousSibling())
    }
    // 5.判断是否为elementNode
    if (nodeToFocus && $isElementNode(nodeToFocus)) {
      isEnd = true
    }
    return {
      nodeToFocus,
      isEnd,
    }
  })
  if (!(nodeToFocusState && nodeToFocusState.nodeToFocus)) {
    return
  }
  editor.update(() => {
    if (nodeToFocusState.isEnd) {
      nodeToFocusState.nodeToFocus.selectEnd()
    }
    // 6. 聚焦图片，新增蓝框
    if ($isImageNode(nodeToFocusState.nodeToFocus)) {
      setSelected(true, nodeToFocusState.nodeToFocus)
      isArrowSelectImage.value = 'pending'
    }
  })
}

// 上下聚焦图片
const onKeyArrowUD = (payload: KeyboardEvent) => {
  handleImageKeyArrow(payload, 'ArrowDown', 'ArrowUp')
  return false
}

// 左右聚焦图片
const onKeyArrowLR = (payload: KeyboardEvent) => {
  handleImageKeyArrow(payload, 'ArrowRight', 'ArrowLeft')
  return false
}

const onDelete = (payload: KeyboardEvent) => {
  // 处理当选中图片时，处理remove图片的操作
  if ($isNodeSelection($getSelection())) {
    const event: KeyboardEvent = payload;
    const selection = $getSelection()
    if (!selection) {
      return
    }
    event.preventDefault();

    let anchorKey: string | undefined
    if ($isRangeSelection(selection)) {
      anchorKey = selection.anchor.key
    }
    if ($isNodeSelection(selection) && selection.getNodes().length === 1) {
      anchorKey = selection.getNodes()[0].getKey()
    }

    if (!anchorKey) {
      return
    }
    const node = $getNodeByKey(anchorKey)
    const elementNode = node?.getTopLevelElement()
    // 若为图片节点
    if ($isImageNode(node)) {
      const nextNode = node?.getTopLevelElement() && node?.getTopLevelElement()?.getNextSibling()
      node.remove();
      setSelected(false, node);

      // remove节点后，处理聚焦情况，判断下个节点是否为图片，选择聚焦图片还是select elementNode
      if (nextNode && nextNode.getFirstChild() && $isImageNode(nextNode.getFirstChild())) {
        editor.update(() => {
          setSelected(true, nextNode.getFirstChild())
        })
      } else if (nextNode && nextNode.getFirstChild() && $isParagraphNode(nextNode.getFirstChild())) {
        editor.update(() => {
          nextNode.select()
        })
      } else if ($isElementNode(nextNode)) {
        editor.update(() => {
          nextNode.select()
        })
      } else if ($isElementNode(elementNode)) {
        editor.update(() => {
          elementNode.select()
        })
      }
      return;
    }
  }
  const selection = $getSelection()
  if (!$isRangeSelection(selection) || !selection.anchor)
    return;

  // 按下Delete(fn+backspace)时，下面有图片则选中
  if (payload.code === 'Delete') {
    const anchorKey = selection.anchor?.key
    const node = $getNodeByKey(anchorKey)
    const nextNode = $isParagraphNode(node) ? node.getNextSibling() : node.getTopLevelElement()?.getNextSibling()
    if (nextNode?.getFirstChild() && $isImageNode(nextNode?.getFirstChild())) {
      setSelected(true, nextNode?.getFirstChild())
      payload.preventDefault();
      return true;
      // const nextTwoNode = nextNode.getNextSibling()
      // if (nextTwoNode?.getFirstChild() && $isImageNode(nextTwoNode?.getFirstChild())) {
      //   const p = $createMParagraphNode()
      //   nextNode.insertAfter(nextTwoNode)
      //   nextNode.insertAfter(p)
      //   node.getTopLevelElement().remove()
      //   editor.update(() => {
      //     p.append(node)
      //     nextNode.remove()
      //     p.select()
      //   })
      // } else {
      //   nextNode.remove()
      // }
    }
  }
  // const anchorKey = selection.anchor?.key
  // const node = $getNodeByKey(anchorKey)
  // 按下Backspace时，且offset为0时，处理多个图片在一起时，只删除一个图片
  // if (payload.code === 'Backspace' && selection.anchor.offset === 0 && selection.focus.offset === 0) {
  // const anchorKey = selection.anchor?.key
  // const node = $getNodeByKey(anchorKey)

  // const preNode = $isParagraphNode(node) ? node.getPreviousSibling() : node.getTopLevelElement()?.getPreviousSibling()
  // 判断上个节点和上上节点是否为图片，若都是图片，则满足多图片的条件，下面处理只删除一个图片
  // if (preNode?.getFirstChild() && $isImageNode(preNode?.getFirstChild())) {
  // if ((node.getTextContentSize() === 0 && !$isMListItemNode(node)) || ($isMListItemNode(node) && $isMListNode(node.getTopLevelElement()))) {
  // if (node.getTopLevelElement().getTextContentSize() === 0) {
  //   const elementNode = node.getTopLevelElement()
  //   elementNode.remove()
  // }
  //
  // setSelected(true, preNode?.getFirstChild())
  // payload.preventDefault();
  //
  // const preTwoNode = preNode.getPreviousSibling()
  // if (preTwoNode?.getFirstChild() && $isImageNode(preTwoNode?.getFirstChild())) {
  //   const preThreeNode = preTwoNode.getPreviousSibling()
  //   if (preThreeNode) {
  //     const p = $createMParagraphNode()
  //     preThreeNode.insertAfter(p)
  //     preThreeNode.insertAfter(preTwoNode)
  //     node.getTopLevelElement().remove()
  //     editor.update(() => {
  //       p.append(node)
  //       preNode.remove()
  //       p.select(0, 0)
  //     })
  //   } else {
  //     preNode.remove()
  //   }
  // } else {
  //   preNode.remove()
  // }
  // }
  // }

  return false;
}

let unregister: () => void
onMounted(() => {
  unregister = mergeRegister(
    // editor.registerUpdateListener(({ editorState }) => {
    //   selection.value = editorState.read(() => $getSelection())
    // }),
    editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_, activeEditor) => {
        // 如果选中的是图片，则不focus
        if ($isRangeSelection(activeEditor?._editorState?._selection)) {
          if (isArrowSelectImage.value === 'pending') {
            isArrowSelectImage.value = 'already'
          } else if (isArrowSelectImage.value === 'already') {
            editor.focus()
            isArrowSelectImage.value = 'no'
          }
        }

        return false;
      },
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand<MouseEvent>(
      CLICK_COMMAND,
      (payload) => {
        const event = payload;
        if (!$getNearestNodeFromDOMNode(event.target as Node)) {
          return;
        }
        const node = $getNearestNodeFromDOMNode(event.target as Node)
        if ($isImageNode(node)) {
          const nodeUrl = node.__src;
          // const imageUrl = imageRef.value.$refs.imageRef?.getAttribute('src')

          if (nodeUrl) {
            if (event.shiftKey) {
              setSelected(!isSelected.value)
            } else {
              setSelected(true, node)
            }
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_DELETE_COMMAND,
      onDelete,
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_BACKSPACE_COMMAND,
      onDelete,
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_ARROW_DOWN_COMMAND,
      onKeyArrowUD,
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_ARROW_UP_COMMAND,
      onKeyArrowUD,
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_ARROW_LEFT_COMMAND,
      onKeyArrowLR,
      COMMAND_PRIORITY_LOW,
    ),
    editor.registerCommand(
      KEY_ARROW_RIGHT_COMMAND,
      onKeyArrowLR,
      COMMAND_PRIORITY_LOW,
    ),
  )
})

onUnmounted(() => {
  selectedNodeSelection.value = false
  unregister()
})
</script>

<style scoped>

</style>
