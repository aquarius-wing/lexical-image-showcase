import type { Ref } from 'vue';
import { onMounted, onUnmounted, ref } from 'vue';
import type { LexicalEditor, LexicalNode } from '@meogic/lexical'
import { $createNodeSelection, $getNodeByKey, $getSelection, $isNodeSelection, $setSelection } from '@meogic/lexical';
import { mergeRegister } from '@meogic/lexical-utils';

function isNodeSelected(editor: LexicalEditor, key: string) {
  return editor.getEditorState().read(() => {
    const node = $getNodeByKey(key);
    if (node === null) {
      return false;
    }
    return node.isSelected()
  });
}

export default function useLexicalNodeSelection(editor: LexicalEditor, key?: string):
  [Ref<boolean>, (selected: boolean, arrowNode: LexicalNode) => void, (key?: string) => void]
{
  const isSelected = ref(false);
  const updateSelected = () => {
    isSelected.value = isNodeSelected(editor, key);
  };
  let unregister: () => void

  onMounted(() => {
    unregister = mergeRegister(editor.registerUpdateListener(updateSelected))
  });
  onUnmounted(() => {
    unregister()
  });

  const setSelected = function (selected: boolean, arrowNode: LexicalNode) {
    editor.update(() => {
      let selection = arrowNode || $getSelection();
      if (!$isNodeSelection(selection)) {
        selection = $createNodeSelection();
        $setSelection(selection);
      }
      key = arrowNode ? arrowNode.__key : key
      if (selected) {
        selection.add(key);
      } else {
        selection.delete(key);
      }
      if (arrowNode) {
        isSelected.value = true
      } else {
        isSelected.value = isNodeSelected(editor, key);
      }
    });
  };

  const clearSelected = function (key?: string) {
    editor.update(() => {
      const selection = $getSelection();
      if ($isNodeSelection(selection)) {
        key && selection.add(key);
        // console.log('clear ', selection)
        selection.clear();
      }
      isSelected.value = false;
    });
  };

  return [isSelected, setSelected, clearSelected];
}
